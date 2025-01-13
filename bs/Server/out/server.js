"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            definitionProvider: true
        }
    };
});
// Gestion des modifications de contenu
documents.onDidChangeContent(change => {
    const text = change.document.getText();
    const diagnostics = [];
    if (text.includes("(") && !text.includes(")")) {
        diagnostics.push({
            severity: 1,
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: text.length }
            },
            message: "Parenthèse non fermée.",
            source: 'bse'
        });
    }
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});
// Go to Definition (Ctrl + Clic)
connection.onDefinition((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc)
        return null;
    const text = doc.getText();
    const match = text.match(/function\s+(\w+)/);
    if (match) {
        const start = text.indexOf(match[1]);
        return {
            uri: params.textDocument.uri,
            range: {
                start: { line: 0, character: start },
                end: { line: 0, character: start + match[1].length }
            }
        };
    }
    return null;
});
documents.listen(connection);
connection.listen();
