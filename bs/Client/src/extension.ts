import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let clients = new Map<string, LanguageClient>();
let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');

// Tri des dossiers de l'espace de travail pour identifier le plus externe
let _sortedWorkspaceFolders: string[] | undefined;
function sortedWorkspaceFolders(): string[] {
    if (_sortedWorkspaceFolders === void 0) {
        _sortedWorkspaceFolders = vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders.map(folder => {
                let result = folder.uri.toString();
                if (result.charAt(result.length - 1) !== '/') {
                    result += '/';
                }
                return result;
            }).sort((a, b) => a.length - b.length)
            : [];
    }
    return _sortedWorkspaceFolders;
}

// Réinitialisation des dossiers triés lors du changement de workspace
vscode.workspace.onDidChangeWorkspaceFolders(() => _sortedWorkspaceFolders = undefined);

// Trouve le dossier le plus externe contenant le fichier
function getOuterMostWorkspaceFolder(folder: vscode.WorkspaceFolder): vscode.WorkspaceFolder {
    const sorted = sortedWorkspaceFolders();
    for (const element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== '/') {
            uri += '/';
        }
        if (uri.startsWith(element)) {
            return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(element))!;
        }
    }
    return folder;
}

// Activation de l'extension
export function activate(context: vscode.ExtensionContext) {
    console.log('Activating BSE extension...');

    // Chemin du serveur LSP
    const serverModule = context.asAbsolutePath(
        path.join('..', '..', 'Server', 'out', 'server.js')
    );

    // Options de lancement du serveur
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.stdio },
        debug: { module: serverModule, transport: TransportKind.stdio }
    };

    // Gestion des documents ouverts
    vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'bse') {
            startClientForDocument(document, context);
            checkLibraries(document);
        }
    });

    vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'bse') {
            checkLibraries(event.document);
        }
    });

    vscode.workspace.onDidCloseTextDocument(doc => {
        diagnosticCollection.delete(doc.uri);
    });

    // HoverProvider pour le langage BSE
    const hoverProvider = vscode.languages.registerHoverProvider('bse', {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);
            const hoverDefinitions: { [key: string]: string } = {
                'function': 'Définit une fonction en BSE.',
                'var': 'Déclare une variable.',
                'if': 'Condition en BSE.',
                'loop': 'Boucle en BSE.'
            };
            const description = hoverDefinitions[word] || 'Description non disponible.';
            return new vscode.Hover(description);
        }
    });
    context.subscriptions.push(hoverProvider);

    // Exécution du script pour les fonctions
    addFunctionNames(context);

    console.log('BSE extension activated.');
}

// Démarre un client LSP pour un document BSE
function startClientForDocument(document: vscode.TextDocument, context: vscode.ExtensionContext) {
    let folder = vscode.workspace.getWorkspaceFolder(document.uri);

    if (!folder) {
        folder = getOuterMostWorkspaceFolder(vscode.workspace.workspaceFolders![0]);
    }

    if (!clients.has(folder.uri.toString())) {
        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: 'bse', pattern: `${folder.uri.fsPath}/**/*` }],
            diagnosticCollectionName: 'bseErrors',
            workspaceFolder: folder
        };

        const serverModule = context.asAbsolutePath(
            path.join('..', '..', 'Server', 'out', 'server.js')
        );

        const client = new LanguageClient(
            'bseLanguageServer',
            'BSE Language Server',
            {
                run: { module: serverModule, transport: TransportKind.stdio },
                debug: { module: serverModule, transport: TransportKind.stdio }
            },
            clientOptions
        );
        client.start();
        clients.set(folder.uri.toString(), client);
    }
}


// Vérification des bibliothèques `uses` en BSE
async function checkLibraries(document: vscode.TextDocument): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = document.getText().split(/\r?\n/);

    for (const [i, line] of lines.entries()) {
        if (!line.match(/^\s*(Uses|uses)\s+/)) continue;

        const libraryNames = line.replace(/\/\/.*$/, '').replace(/uses/gi, '').trim().split(',');
        if (libraryNames.length == 0) {
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(i, 0, i, line.length),
                'Invalid uses statement',
                vscode.DiagnosticSeverity.Error
            ));
        } else {
            for (let library of libraryNames) {
                library = library.trim();
                const pathsToCheck = [
                    '../../Custom/',
                    '../../Custom/Libs',
                    '../../Std/',
                    '../../Std/Libs'
                ];
                let found = false;
                for (const basePath of pathsToCheck) {
                    if (await checkIfFileExists(path.join(path.dirname(document.uri.fsPath), basePath, `${library}.bs`))) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(i, 0, i, line.length),
                        `Couldn't find ${library}.bs`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }
    }
    diagnosticCollection.set(document.uri, diagnostics);
}

// Vérification d'existence de fichier
async function checkIfFileExists(fileName: string): Promise<boolean> {
    try {
        await fs.access(fileName);
        return true;
    } catch {
        return false;
    }
}

// Exécute un script pour modifier les noms de fonction
async function addFunctionNames(context: vscode.ExtensionContext) {
    const scriptPath = path.join(context.extensionPath, 'scripts', 'replaceFunctionNames.js');
    if (await checkIfFileExists(scriptPath)) {
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
    }
}

export function deactivate() {
    for (const client of clients.values()) {
        client.stop();
    }
    console.log('BSE extension deactivated.');
}
