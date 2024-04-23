"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
function activate(context) {
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
exports.activate = activate;
function parseErrorsFromLine(line, lineNumber) {
    let diagnostics = [];
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
function updateDiagnostics(document, collection) {
    const diagnostics = [];
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
function deactivate() {
    console.log('Your extension "bse" has been deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map