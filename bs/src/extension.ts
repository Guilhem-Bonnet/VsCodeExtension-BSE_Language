//https://code.visualstudio.com/api/references/vscode-api
import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from 'vscode';
import { SyntaxValidator } from './syntaxValidator';

export function activate(context: vscode.ExtensionContext) {
    console.log('Encore un jour à se lever, en même temps que le soleil. La face encore un peu poquée, mon quatre heures de sommeil yeah!');
    addFunctionNamesToSyntaxFile(context);
    let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document) => { 
        diagnosticCollection.delete(document.uri);
        let validator = new SyntaxValidator(document);
        await validator.checkSyntax();
        diagnosticCollection.set(document.uri, validator.diagnostics);
    }));

    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(async (document) => { 
        diagnosticCollection.delete(document.uri);
        let validator = new SyntaxValidator(document);
        await validator.checkSyntax();
        diagnosticCollection.set(document.uri, validator.diagnostics);
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

//Rajoute les noms de fonctions (propriétaires à Belair) dans le syntax highlight. C'est pour que les noms de fonctions soient dans un fichier différent
async function addFunctionNamesToSyntaxFile(context: vscode.ExtensionContext) {
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

