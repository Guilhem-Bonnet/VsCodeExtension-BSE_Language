import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const diagnostics = vscode.languages.createDiagnosticCollection('bs');

    vscode.workspace.onDidOpenTextDocument(handleDocumentOpen);
    vscode.workspace.onDidChangeTextDocument(handleDocumentChange);

    context.subscriptions.push(diagnostics);
}

function handleDocumentOpen(doc: vscode.TextDocument) {
    if (doc.uri.scheme === 'file' && doc.fileName.endsWith('.bs')) {
        updateDiagnostics(doc);
    }
}

function handleDocumentChange(changeEvent: vscode.TextDocumentChangeEvent) {
    let doc = changeEvent.document;
    if (doc.uri.scheme === 'file' && doc.fileName.endsWith('.bs')) {
        updateDiagnostics(doc);
    }
}

function updateDiagnostics(doc: vscode.TextDocument): void {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = doc.getText();

    // Détection des variables correctes
    const validVariableRegex = /\b[A-Za-z]+[A-Za-z0-9_]*\b\s*:=/g;
    let match;
    while ((match = validVariableRegex.exec(text)) !== null) {
        const startPos = doc.positionAt(match.index);
        const endPos = doc.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        diagnostics.push(new vscode.Diagnostic(range, 'Variable correcte', vscode.DiagnosticSeverity.Information));
    }

    // Détection des erreurs de syntaxe
    const errorVariableRegex = /\b[A-Za-z]+[A-Za-z0-9_]*\b\s*[:=]/g;
    while ((match = errorVariableRegex.exec(text)) !== null) {
        const startPos = doc.positionAt(match.index);
        const endPos = doc.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        diagnostics.push(new vscode.Diagnostic(range, 'Erreur de syntaxe', vscode.DiagnosticSeverity.Error));
    }

    // Mise à jour des diagnostics
    const diagnosticCollection = vscode.languages.createDiagnosticCollection();
    diagnosticCollection.set(doc.uri, diagnostics);
}


// This method is called when your extension is deactivated
export function deactivate() {}
