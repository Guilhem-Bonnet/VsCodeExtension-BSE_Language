import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "bse" is now active!');
    let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'bs') {
            updateDiagnostics(event.document, diagnosticCollection);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        diagnosticCollection.delete(doc.uri);
    }));
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    const diagnostics: vscode.Diagnostic[] = [];

    const text = document.getText();
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
        // Simplified error checking logic:
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
