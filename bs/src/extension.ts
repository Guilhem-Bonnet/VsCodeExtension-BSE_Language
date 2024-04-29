import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "bse" is now active!');
    let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === 'bse') {
            checkLibraries(document);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'bse') {
            checkLibraries(document);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        checkLibraries(event.document);
        
    }));

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => {
        diagnosticCollection.delete(doc.uri);
    }));

    // Enregistrement du HoverProvider
    const hoverProvider = vscode.languages.registerHoverProvider('bse', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);
            if (word === "function") {
                return new vscode.Hover("Définit une fonction en BSE.");
            }
            return new vscode.Hover("Description non disponible.");
        }
    });
    context.subscriptions.push(hoverProvider);
}

async function checkLibraries(document: vscode.TextDocument): Promise<void> {
    if (document.languageId !== 'bse') {
        return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const lines = document.getText().split(/\r?\n/);

    for (const [i, line] of lines.entries()) {
        if (line.match(/^\s*(Uses|uses)\s+/)) {
            const libraryName = line.split(' ')[1];
            if (libraryName) {
                // Construction du chemin relatif à l'emplacement du document actuel
                const libraryPath = path.join(path.dirname(document.uri.fsPath), '../libs', `${libraryName}.bs`);

                try {
                    await fs.access(libraryPath);
                } catch {
                    // Si le fichier n'existe pas, fs.access lancera une exception que nous attrapons ici
                    const range = new vscode.Range(i, 0, i, line.length);
                    const diagnostic = new vscode.Diagnostic(range, "Library file not found", vscode.DiagnosticSeverity.Error);
                    diagnostics.push(diagnostic);
                }
            }
        }
    }

    let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');
    diagnosticCollection.set(document.uri, diagnostics);
}

export function deactivate() {
    console.log('Your extension "bse" has been deactivated');
}
