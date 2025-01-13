import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    TextDocumentSyncKind,
    InitializeResult,
    Diagnostic
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
console.log("BSE Language Server is running...");

// Le dossier de travail (workspace) du serveur
let workspaceFolder: string | null;

documents.onDidOpen((event) => {
    console.log(`[Server] Document opened: ${event.document.uri}`);
    connection.console.log(`[Server] Document opened: ${event.document.uri}`);
});
documents.listen(connection);

// Initialisation du serveur
connection.onInitialize((params: InitializeParams): InitializeResult => {
    workspaceFolder = params.rootUri || params.rootPath || null;
    console.log(`[Server] Initialized in workspace: ${workspaceFolder}`);
    connection.console.log(`[Server] Initialized in workspace: ${workspaceFolder}`);
    
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            definitionProvider: true,
            hoverProvider: true,
            completionProvider: {
                resolveProvider: true
            }
        }
    };
});

// Gestion des modifications de contenu
documents.onDidChangeContent(change => {
    const text = change.document.getText();
    const diagnostics: Diagnostic[] = [];

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
    if (!doc) return null;

    const text = doc.getText();
    const lines = text.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/function\s+(\w+)/);
        if (match) {
            return {
                uri: params.textDocument.uri,
                range: {
                    start: { line: i, character: lines[i].indexOf(match[1]) },
                    end: { line: i, character: lines[i].indexOf(match[1]) + match[1].length }
                }
            };
        }
    }
    return null;
});

try {
    connection.listen();
} catch (error) {
    console.error("Server crashed: ", error);
}
