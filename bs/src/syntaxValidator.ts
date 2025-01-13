import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from 'vscode';

export class SyntaxValidator {
    private document : TextDocument;
    public diagnostics: Diagnostic[] = [];
    private functionDeclarations: { [functionName: string] : functionDeclaration} = {};
    private basScriptsPath: string;
    
    private lineBreakPattern = /\r?\n/;
    private singleLineCommentPattern = /\/\/.*(\r?\n|$)/g;
    private multiLineCommentPattern = /\/\*[\s\S]*?\*\//g; 
    private functionCallPattern = /(?<!\bfunction\s+)\b[\w:]+\s*\(.*\)/gi;
    private functionDeclarationPattern = /\bfunction\s+[\w:]+\s*\([\w\s,]*\)/i;
    private importPattern = /^\s*(uses|Uses)\s+/i;

    //needs work 
    private variableAssignmentPattern = /\w+\s*:=\s*.+/;
    private wrongVarAssignmentPattern = /\w+\s*=\s*.+/; //will pickup if (contract.id = 4) then

    constructor(document: TextDocument) {
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


    public async checkSyntax(): Promise<void> {
        
        //Add Belair functions (and some keywords) to the available functions
        let functionsPath = path.join(__dirname, '..', 'syntaxes', 'functions.json');
        let functions: { [functionName: string] : number } = JSON.parse(await fs.readFile(functionsPath, 'utf-8')).functions;
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
                await this.checkLibraries(line, i);
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
    
        
    }
    
    private async checkLibraries(line: string, lineNumber: number): Promise<void> {
        //console.log(line); //ex : uses MyLib, My2ndLib
        const libraryNames = line.replace(/uses/gi, '').trim().split(',');
    
        if(libraryNames.length == 0) {
            this.diagnostics.push(new Diagnostic(new Range(lineNumber, 0, lineNumber, line.length), "Invalid uses statement", DiagnosticSeverity.Error));
            return;
        }
            
        for (let library of libraryNames) { 
            library = library.trim()
            let libraryContent = null;
            // Construction du chemin relatif à l'emplacement du document actuel
            libraryContent = await this.getLibraryContent(library)
            if(libraryContent == null) {
                let indexOfLibrary = line.indexOf(library);
                this.diagnostics.push(new Diagnostic(new Range(lineNumber, indexOfLibrary, lineNumber, indexOfLibrary + library.length - 1), `Couldn't find library : ${library}`, DiagnosticSeverity.Error));
                return;
            }
    
            libraryContent = this.replaceStringContent(libraryContent);
            libraryContent = this.replaceSinglelineCommentContent(libraryContent);
            libraryContent = this.replaceMultilineCommentContent(libraryContent)
            this.getFunctionNames(library, libraryContent);
        }    
    }
    
    //PURE GPT
    private findFunctionNamesInCode(line: string): string[] {
        const functionRegex = /(?<!\bfunction\s+)\b[\w:]+\s*\(/g;  // Match function names followed by opening parentheses
        let functionNames: string[] = [];
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
    private getParamsContent(line: string, startIdx: number): string | null { 
        let depth = 0;
        let paramsContent = '';
        
        for (let i = startIdx; i < line.length; i++) {
            const char = line[i];
            
            if (char === '(') {
                depth++;
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    return paramsContent.trim();  // Return content up to the first closing parenthesis
                }
            }
            
            if (depth > 0) {
                paramsContent += char;  // Accumulate content inside parentheses
            }
        }
    
        return null;  // Return null if no closing parenthesis was found
    }
    
    private checkFunctionCalls(line: string, lineNumber: number) : void {
        let functionNames = [...new Set(this.findFunctionNamesInCode(line))]; // [...newSet()], c'est pour enlever les doublons
        for (let i in functionNames) {
            let functionName = functionNames[i];
            if(!this.functionDeclarations[functionName.toLowerCase()]) {
                let indexOf = line.indexOf(functionName);
                this.diagnostics.push(new Diagnostic(new Range(lineNumber, indexOf, lineNumber, indexOf + functionName.length), `Function not found : ${functionName}`, DiagnosticSeverity.Error));
            }
        }
    
    }
    
    private async getLibraryContent(library: string): Promise<string | null> {
        const possiblePaths = [
            path.join(this.basScriptsPath, 'Custom/', `${library}.bs`),
            path.join(this.basScriptsPath, 'Custom/Libs', `${library}.bs`),
            path.join(this.basScriptsPath, 'Std', `${library}.bs`),
            path.join(this.basScriptsPath, 'Std/Libs', `${library}.bs`)
        ];
    
        for (const libraryPath of possiblePaths) {
            const content = await this.getFileContent(libraryPath);
            if (content !== null) {
                return content; // Return early as soon as we find the content
            }
        }
    
        return null;
    }
    
    private getFunctionNames(source: string, code: string) : void  {
        let lines = code.split(/\r?\n/);
        for (let [i, line] of lines.entries()) {

            if (line.match(this.functionDeclarationPattern)) 
            {
                //console.log("##" + line); //ex : ## function myLittleFunction(param1, param2)
                let openParenthesis = line.indexOf('(');
                let closeParenthesis = line.indexOf(')');
                let functionName = line.substring(0, openParenthesis).replace(/\bfunction\b/i, '').trim();
                let paramsString = line.substring(openParenthesis + 1, closeParenthesis);
    
                if (this.functionDeclarations[functionName.toLowerCase()]) {
                    console.log('Dupe found! => ', line);
                    this.diagnostics.push(new Diagnostic(new Range(0, 0, 0, 0), `Duplicate function found : ${functionName}`, DiagnosticSeverity.Error));
                    continue;
                }
    
                this.functionDeclarations[functionName.toLowerCase()] = new functionDeclaration(source, (paramsString ? paramsString.split(',').length : 0))
            }
        }
    }
    
    private async getFileContent(fileName: string): Promise<string | null> {
        try {
            // Check if file exists
            let exists = await this.checkIfFileExists(fileName);
            if (!exists) {
                return null;
            }
            
            // Read and return the file content if it exists
            let content = await fs.readFile(fileName, 'utf8');
            return content;
        } catch (error) {
            console.error(`Error reading the file ${fileName}:`, error);
            return null;
        }
    }
    
    private async checkIfFileExists(fileName: string) : Promise<boolean> {
        try {
            await fs.access(fileName);
            //console.log('found ' + fileName);
            return true;
        } catch {
            return false;
        }
    }

    private replaceSinglelineCommentContent(input: string): string {
        return input.replace(this.singleLineCommentPattern, (match, newline) => {
            return newline; // Replace the entire comment with just the line break
        });
    }

    private replaceMultilineCommentContent(input: string): string {
        // Regular expression for matching multi-line comments (/* ... */)
        return input.replace(this.multiLineCommentPattern, (match) => {
            let content = match.slice(2, -2); // Remove the surrounding /* and */
            let lines = content.split('\n'); // Split the content by line breaks
            let replacedLines = lines.map(line => '_'.repeat(line.length)); // Replace each line with underscores
            return '/*' + replacedLines.join('\n') + '*/'; // Rebuild the comment with underscores and /* */
        });
    }

    private replaceStringContent(input: string): string {
        // Regular expression for matching strings (both single-line and multi-line)
        return input.replace(/"(.*?)"/g, (match) => {
            let content = match.slice(1, -1); // Remove the surrounding quotes
            let lines = content.split(this.lineBreakPattern); // Split the content by line breaks
            let replacedLines = lines.map(line => '_'.repeat(line.length)); // Replace each line with underscores
            return '"' + replacedLines.join('\n') + '"'; // Rebuild the string with underscores and quotes
        });
    }
}

class functionDeclaration {
    numberOfParams: number;
    source: string;
    constructor(source: string, numberOfParams?: number) {
        this.source = source;
        this.numberOfParams = numberOfParams || -1;
    }
}