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
exports.SyntaxValidator = void 0;
const path = __importStar(require("path"));
const fs_1 = require("fs");
const vscode_1 = require("vscode");
class SyntaxValidator {
    constructor(document) {
        this.diagnostics = [];
        this.functionDeclarations = {};
        this.lineBreakPattern = /\r?\n/;
        this.singleLineCommentPattern = /\/\/.*(\r?\n|$)/g;
        this.multiLineCommentPattern = /\/\*[\s\S]*?\*\//g;
        this.functionCallPattern = /(?<!\bfunction\s+)\b[\w:]+\s*\(.*\)/gi;
        this.functionDeclarationPattern = /\bfunction\s+[\w:]+\s*\([\w\s,]*\)/i;
        this.importPattern = /^\s*(uses|Uses)\s+/i;
        //needs work 
        this.variableAssignmentPattern = /\w+\s*:=\s*.+/;
        this.wrongVarAssignmentPattern = /\w+\s*=\s*.+/; //will pickup if (contract.id = 4) then
        this.document = document;
        // Split the path into components
        const segments = this.document.uri.fsPath.split(path.sep);
        // Find the index of the 'BASScripts' folder
        const bassScriptsIndex = segments.indexOf('BASScripts');
        // If 'BASScripts' is found, return the path up to and including 'BASScripts'
        if (bassScriptsIndex == -1)
            throw new Error('BASScripts not found');
        this.basScriptsPath = path.join(...segments.slice(0, bassScriptsIndex + 1));
        console.log(this.basScriptsPath);
        this.diagnostics = [];
        this.functionDeclarations = {};
    }
    checkSyntax() {
        return __awaiter(this, void 0, void 0, function* () {
            //Add Belair functions (and some keywords) to the available functions
            let functionsPath = path.join(__dirname, '..', 'syntaxes', 'functions.json');
            let functions = JSON.parse(yield fs_1.promises.readFile(functionsPath, 'utf-8')).functions;
            Object.entries(functions).forEach(([functionName, nOfParams]) => {
                this.functionDeclarations[functionName.toLowerCase()] = new functionDeclaration('Belair', nOfParams);
            });
            let content = this.document.getText();
            let code = content;
            code = this.replaceStringContent(code); //on remplace le contenu des strings pour pas qu'il y ait des conflits avec la validation
            code = this.replaceSinglelineCommentContent(code); //on supprime les commentaires inline pcq'il sont INUTILES
            code = this.replaceMultilineCommentContent(code); //on remplace le contenu des commentaires multilignes pour pas qu'il y ait des conflits avec la validation
            const lines = code.split(this.lineBreakPattern);
            console.log(lines);
            //Check des imports
            for (const [i, line] of lines.entries()) {
                if (line.match(this.importPattern))
                    yield this.checkLibraries(line, i);
            }
            //Check des déclarations de fonctions du fichier en cours
            this.getFunctionNames('current', code);
            console.log(this.functionDeclarations);
            //Check du fichier en cours
            for (const [i, line] of lines.entries()) {
                //TODO checks for local myVar := 3 (I always forget we can't do this shit)
                //TODO checks for "=" and ":=" pwease
                //TODO checks for "then" after if condition (I always forget it)
                //TODO implement checks for variable declarations (with dictionary), don't forget labels (and gotos) as they're technically not functions
                // if(line.match(this.functionDeclarationPattern))
                // {
                //     isInFunction = true;
                //     continue;
                // }
                if (line.match(this.functionCallPattern))
                    this.checkFunctionCalls(line, i);
            }
        });
    }
    checkLibraries(line, lineNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log(line); //ex : uses MyLib, My2ndLib
            const libraryNames = line.replace(/uses/gi, '').trim().split(',');
            if (libraryNames.length == 0) {
                this.diagnostics.push(new vscode_1.Diagnostic(new vscode_1.Range(lineNumber, 0, lineNumber, line.length), "Invalid uses statement", vscode_1.DiagnosticSeverity.Error));
                return;
            }
            for (let library of libraryNames) {
                library = library.trim();
                let libraryContent = null;
                // Construction du chemin relatif à l'emplacement du document actuel
                libraryContent = yield this.getLibraryContent(library);
                if (libraryContent == null) {
                    let indexOfLibrary = line.indexOf(library);
                    this.diagnostics.push(new vscode_1.Diagnostic(new vscode_1.Range(lineNumber, indexOfLibrary, lineNumber, indexOfLibrary + library.length - 1), `Couldn't find library : ${library}`, vscode_1.DiagnosticSeverity.Error));
                    return;
                }
                libraryContent = this.replaceStringContent(libraryContent);
                libraryContent = this.replaceSinglelineCommentContent(libraryContent);
                libraryContent = this.replaceMultilineCommentContent(libraryContent);
                this.getFunctionNames(library, libraryContent);
            }
        });
    }
    //PURE GPT
    findFunctionNamesInCode(line) {
        const functionRegex = /(?<!\bfunction\s+)\b[\w:]+\s*\(/g; // Match function names followed by opening parentheses
        let functionNames = [];
        let match;
        // Search for all function calls in the line of code
        while ((match = functionRegex.exec(line)) !== null) {
            let fullMatch = match[0];
            let functionName = fullMatch.split('(')[0].trim(); // Extract function name before '('
            functionNames.push(functionName);
            // Now look for the content inside parentheses (handle nested calls)
            let paramsStart = match.index + fullMatch.length;
            let paramsContent = this.getParamsContent(line, paramsStart);
            if (paramsContent) {
                // Recursively search for functions within parameters
                let nestedCalls = this.findFunctionNamesInCode(paramsContent);
                functionNames.push(...nestedCalls);
            }
        }
        return functionNames;
    }
    // PURE GPT Helper function to extract the content within parentheses (handles nested parentheses)
    getParamsContent(line, startIdx) {
        let depth = 0;
        let paramsContent = '';
        for (let i = startIdx; i < line.length; i++) {
            const char = line[i];
            if (char === '(') {
                depth++;
            }
            else if (char === ')') {
                depth--;
                if (depth === 0) {
                    return paramsContent.trim(); // Return content up to the first closing parenthesis
                }
            }
            if (depth > 0) {
                paramsContent += char; // Accumulate content inside parentheses
            }
        }
        return null; // Return null if no closing parenthesis was found
    }
    checkFunctionCalls(line, lineNumber) {
        let functionNames = [...new Set(this.findFunctionNamesInCode(line))]; // [...newSet()], c'est pour enlever les doublons
        for (let i in functionNames) {
            let functionName = functionNames[i];
            if (!this.functionDeclarations[functionName.toLowerCase()]) {
                let indexOf = line.indexOf(functionName);
                this.diagnostics.push(new vscode_1.Diagnostic(new vscode_1.Range(lineNumber, indexOf, lineNumber, indexOf + functionName.length), `Function not found : ${functionName}`, vscode_1.DiagnosticSeverity.Error));
            }
        }
    }
    getLibraryContent(library) {
        return __awaiter(this, void 0, void 0, function* () {
            const possiblePaths = [
                path.join(this.basScriptsPath, 'Custom/', `${library}.bs`),
                path.join(this.basScriptsPath, 'Custom/Libs', `${library}.bs`),
                path.join(this.basScriptsPath, 'Std', `${library}.bs`),
                path.join(this.basScriptsPath, 'Std/Libs', `${library}.bs`)
            ];
            for (const libraryPath of possiblePaths) {
                const content = yield this.getFileContent(libraryPath);
                if (content !== null) {
                    return content; // Return early as soon as we find the content
                }
            }
            return null;
        });
    }
    getFunctionNames(source, code) {
        let lines = code.split(/\r?\n/);
        for (let [i, line] of lines.entries()) {
            if (line.match(this.functionDeclarationPattern)) {
                //console.log("##" + line); //ex : ## function myLittleFunction(param1, param2)
                let openParenthesis = line.indexOf('(');
                let closeParenthesis = line.indexOf(')');
                let functionName = line.substring(0, openParenthesis).replace(/\bfunction\b/i, '').trim();
                let paramsString = line.substring(openParenthesis + 1, closeParenthesis);
                if (this.functionDeclarations[functionName.toLowerCase()]) {
                    console.log('Dupe found! => ', line);
                    this.diagnostics.push(new vscode_1.Diagnostic(new vscode_1.Range(0, 0, 0, 0), `Duplicate function found : ${functionName}`, vscode_1.DiagnosticSeverity.Error));
                    continue;
                }
                this.functionDeclarations[functionName.toLowerCase()] = new functionDeclaration(source, (paramsString ? paramsString.split(',').length : 0));
            }
        }
    }
    getFileContent(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if file exists
                let exists = yield this.checkIfFileExists(fileName);
                if (!exists) {
                    return null;
                }
                // Read and return the file content if it exists
                let content = yield fs_1.promises.readFile(fileName, 'utf8');
                return content;
            }
            catch (error) {
                console.error(`Error reading the file ${fileName}:`, error);
                return null;
            }
        });
    }
    checkIfFileExists(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.promises.access(fileName);
                //console.log('found ' + fileName);
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    replaceSinglelineCommentContent(input) {
        return input.replace(this.singleLineCommentPattern, (match, newline) => {
            return newline; // Replace the entire comment with just the line break
        });
    }
    replaceMultilineCommentContent(input) {
        // Regular expression for matching multi-line comments (/* ... */)
        return input.replace(this.multiLineCommentPattern, (match) => {
            let content = match.slice(2, -2); // Remove the surrounding /* and */
            let lines = content.split('\n'); // Split the content by line breaks
            let replacedLines = lines.map(line => '_'.repeat(line.length)); // Replace each line with underscores
            return '/*' + replacedLines.join('\n') + '*/'; // Rebuild the comment with underscores and /* */
        });
    }
    replaceStringContent(input) {
        // Regular expression for matching strings (both single-line and multi-line)
        return input.replace(/"(.*?)"/g, (match) => {
            let content = match.slice(1, -1); // Remove the surrounding quotes
            let lines = content.split(this.lineBreakPattern); // Split the content by line breaks
            let replacedLines = lines.map(line => '_'.repeat(line.length)); // Replace each line with underscores
            return '"' + replacedLines.join('\n') + '"'; // Rebuild the string with underscores and quotes
        });
    }
}
exports.SyntaxValidator = SyntaxValidator;
class functionDeclaration {
    constructor(source, numberOfParams) {
        this.source = source;
        this.numberOfParams = numberOfParams || -1;
    }
}
