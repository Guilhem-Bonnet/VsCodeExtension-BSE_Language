import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "bse" is now active!');
    let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'bse') {
            updateDiagnostics(event.document, diagnosticCollection);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
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

function parseErrorsFromLine(line: string, lineNumber: number): vscode.Diagnostic[] {
    let diagnostics: vscode.Diagnostic[] = [];
    const regex = /syntax error at position (\d+)/; // Exemple d'expression régulière
    const match = regex.exec(line);
    if (match) {
        const position = parseInt(match[1]);
        const range = new vscode.Range(lineNumber, position, lineNumber, position + 1);
        const diagnostic = new vscode.Diagnostic(range, "Syntax error detected", vscode.DiagnosticSeverity.Error);
        diagnostics.push(diagnostic);
    }
    return diagnostics;
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    const diagnostics: vscode.Diagnostic[] = [];

    const text = document.getText();
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
        if (line.includes('error')) {
            const index = line.indexOf('error');
            const range = new vscode.Range(i, index, i, index + 'error'.length);
            const diagnostic = new vscode.Diagnostic(range, "Error detected here", vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic);
        }
    });

    collection.set(document.uri, diagnostics);
}

export function deactivate() {
    console.log('Your extension "bse" has been deactivated');
}
