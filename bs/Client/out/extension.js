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
//https://code.visualstudio.com/api/references/vscode-api
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    console.log('Starting server');
    const serverModule = context.asAbsolutePath(path.join('../../Server', 'out', 'erver.js') // Assure-toi que ce chemin est correct
    );
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.stdio }, // IPC utilisé ici
        debug: { module: serverModule, transport: node_1.TransportKind.stdio }
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'bse' }],
    };
    client = new node_1.LanguageClient('bseLanguageServer', 'BSE Language Server', serverOptions, clientOptions);
    client.start();
    console.log('Starting BSE extension');
    addFunctionNames(context);
    let diagnosticCollection = vscode.languages.createDiagnosticCollection('bseErrors');
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
//Rajoute les noms de fonctions (propriétaires à Belair) dans le syntax highlight. C'est pour que les noms de fonctions soient dans un fichier différent
function addFunctionNamesToSyntaxFile(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const scriptPath = path.join(context.extensionPath, 'scripts', 'replaceFunctionNames.js');
        // Run the script
        (0, child_process_1.exec)(`node ${scriptPath}`, (error, stdout, stderr) => {
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
    });
}
function deactivate() {
    console.log('Your extension "bse" has been deactivated');
}
exports.deactivate = deactivate;
