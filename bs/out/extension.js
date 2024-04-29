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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
function activate(context) {
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
exports.activate = activate;
function checkLibraries(document) {
    return __awaiter(this, void 0, void 0, function* () {
        if (document.languageId !== 'bse') {
            return;
        }
        const diagnostics = [];
        const lines = document.getText().split(/\r?\n/);
        for (const [i, line] of lines.entries()) {
            if (line.match(/^\s*(Uses|uses)\s+/)) {
                const libraryName = line.split(' ')[1];
                if (libraryName) {
                    // Construction du chemin relatif à l'emplacement du document actuel
                    const libraryPath = path.join(path.dirname(document.uri.fsPath), '../libs', `${libraryName}.bs`);
                    try {
                        yield fs_1.promises.access(libraryPath);
                    }
                    catch (_a) {
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
    });
}
function deactivate() {
    console.log('Your extension "bse" has been deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map