//https://code.visualstudio.com/api/references/vscode-api
import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    console.log('Encore un jour à se lever, en même temps que le soleil. La face encore un peu poquée, mon quatre heures de sommeil yeah!');
    addFunctionNames(context);
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
    console.log('Checking Libs');
    if (document.languageId !== 'bse') {
        return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const lines = document.getText().split(/\r?\n/);
    for (const [i, line] of lines.entries()) {
        if (!line.match(/^\s*(Uses|uses)\s+/)) 
            continue;
            
        console.log('using found! => ' + line);
        //le .replace(/^\/\/.*/, ''), c'est pour enlever les commentaires
        const libraryNames = line.replace(/\/\/.*$/, '').replace(/uses/gi, '').trim().split(',');
        console.log(libraryNames);

        if(libraryNames.length == 0) {
            diagnostics.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, line.length), "Invalid uses statement", vscode.DiagnosticSeverity.Error));
            return;
        }
            
        for (let library of libraryNames) { 
            library = library.trim()
            // Construction du chemin relatif à l'emplacement du document actuel
            if(await checkIfFileExists(path.join(path.dirname(document.uri.fsPath), '../../Custom/', `${library}.bs`)))
                continue;
            if(await checkIfFileExists(path.join(path.dirname(document.uri.fsPath), '../../Custom/Libs', `${library}.bs`)))
                continue;
            if(await checkIfFileExists(path.join(path.dirname(document.uri.fsPath), '../../Std', `${library}.bs`)))
                continue;
            if(await checkIfFileExists(path.join(path.dirname(document.uri.fsPath), '../../Std/Libs', `${library}.bs`)))
                continue;

            diagnostics.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, line.length), `Couldn't find ${library}.bs`, vscode.DiagnosticSeverity.Error));
        }
        
    }

    let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');
    diagnosticCollection.set(document.uri, diagnostics);
}

async function checkIfFileExists(fileName: string) : Promise<boolean> {
    try {
        await fs.access(fileName);
        console.log('found ' + fileName);
        return true;
    } catch {
        return false;
    }
}

async function addFunctionNames(context: vscode.ExtensionContext) {
    const scriptPath = path.join(context.extensionPath, 'scripts', 'replaceFunctionNames.js');

    // Run the script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

export function deactivate() {
    console.log('Your extension "bse" has been deactivated');
}

