import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from 'vscode';

export class SyntaxValidator {
    //variable de diagnostic
    private document : TextDocument;
    private basScriptsPath: string;
    public diagnostics: Diagnostic[] = [];

    //collections de déclarations
    private keywords: Set<string> = new Set<string>();
    private functionDeclarations: { [functionName: string] : functionDeclaration} = {};
    private variableDeclarations: Set<string> | null = null;
    private labelDeclarations: Set<string> = new Set<string>();
    
    //regex de déclarations
    private importPattern: RegExp = /^\s*(uses|Uses)\s+/i;
    private functionDeclarationPattern: RegExp = /\bfunction\s+[\w:]+\s*\([\w\s,]*\)/i;
    private variableDeclarationPattern: RegExp = /^\s*local\s+([a-zA-Z_][a-zA-Z0-9_]*(\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*\s*)*)\s*$/i;
    private labelDeclarationPattern: RegExp = /^\s*:([a-zA-Z_][a-zA-Z0-9_]*)/;

    //regex de code à remplacer
    private lineBreakPattern: RegExp = /\r?\n/;
    private singleLineCommentPattern: RegExp = /\/\/.*(\r?\n|$)/g;
    private multiLineCommentPattern: RegExp = /\/\*[\s\S]*?\*\//g; 
    private singleLineLINQPattern: RegExp = /\bfrom\b.*(\r?\n|$)/gi;
    private multiLineLINQPattern: RegExp = /from.*(?:\\\s*\r?\n.*)+[^\\\r\n]*\s*$/gi;
    // private multiLineLINQPattern: RegExp = /from.*(?:\\\s*\r?\n.*)+[^\\]*\s*$/gmi;
    // private multiLineLINQPattern: RegExp = /from.*(?:\\\s*\r?\n[^\r\n]+)*\\?\s*$/gmi;

    //regex d'un identifier (functions, variables, labels, keywords, etc) - mots contenant des lettres, underscores et deux-points (ne termine pas par un deux-point)
    private identifierPattern: RegExp = /(?:[a-zA-Z]+[\w:]*|[\w:]*[a-zA-Z][\w:]*)(?<!:)/g;

    //regex de keywords
    private localPattern: RegExp = /\blocal\b/i;
    private libraryPattern: RegExp = /\blibrary\b/i;
    private gotoPattern: RegExp = /\bgoto\b/i;

    //TODO FIX //i := 0 //Non instanciée, l'erreur est décalée
    //TODO GOTOs AND LABELS
    //TODO KEYWORDS VALIDATION //if-then //we could perhaps make scopes
    //TODO multiline LINQ support
    //TODO handle dupe variable declarations
    //TODO improve dupe function declarations checks
    //TODO improve function handling for surcharged libraries (ex: ContsLib)

    constructor(document: TextDocument) {
        console.clear();
        this.document = document;

        // Split the path into components
        const segments = this.document.uri.fsPath.split(path.sep);
        // Find the index of the 'BASScripts' folder
        const bassScriptsIndex = segments.indexOf('BASScripts');
        // If 'BASScripts' is found, return the path up to and including 'BASScripts'
        if (bassScriptsIndex == -1) 
            throw new Error('BASScripts not found');
        this.basScriptsPath = path.join(...segments.slice(0, bassScriptsIndex + 1));
        //console.log(this.basScriptsPath);

        this.diagnostics = [];
        this.functionDeclarations = {};
    }


    public async checkSyntax(): Promise<void> {
        
        //Add Belair functions to the available functions
        let functionsPath = path.join(__dirname, '..', 'syntaxes', 'functions.json');
        let functions: { [functionName: string] : number } = JSON.parse(await fs.readFile(functionsPath, 'utf-8')).functions;
        Object.entries(functions).forEach(([functionName, nOfParams]) => {
            this.functionDeclarations[this.normalizeIdentifier(functionName)] = new functionDeclaration('Belair', nOfParams);
        });

        //Add Belair keywords
        let keywordsPath = path.join(__dirname, '..', 'syntaxes', 'keywords.json');
        this.keywords = new Set<string>(JSON.parse(await fs.readFile(keywordsPath, 'utf-8')).keywords);

        let content = this.document.getText();
        let code = content;
        code = this.replaceStringContent(code); //on remplace le contenu des strings pour pas qu'il y ait des conflits avec la validation
        code = this.replaceSinglelineCommentContent(code); //on supprime les commentaires inline pcq'il sont INUTILES
        code = this.replaceMultilineCommentContent(code); //on remplace le contenu des commentaires multilignes pour pas qu'il y ait des conflits avec la validation
        //l'ordre des appels à une importance, il faut remplacer le LINQ APRÈS le reste et comment par le LINQ multiligne //what is this, some Fallout 4 mods load order?
        //code = this.replaceMultilineLINQContent(code); //I H8 THIS USELESS SH*T
        code = this.replaceSinglelineLINQContent(code); 

        const lines = code.split(this.lineBreakPattern);
        //console.log(lines);

        //Check des imports
        for (const [i, line] of lines.entries()) {
            if (line.match(this.importPattern)) 
                await this.checkLibraries(line, i);
        }
    
        //Check des déclarations de fonctions du fichier en cours
        this.getFunctionNames('current', code, true);
        //console.log(this.functionDeclarations);

        //Check du fichier en cours
        let isLibrary = code.trimStart().match(this.libraryPattern);
        if(!isLibrary) 
            this.variableDeclarations = new Set<string>(); //si c'est un script, on instancie le tableau tout de suite 

        for (const [i, line] of lines.entries()) {
            //TODO checks for "then" after if condition (I always forget it)
            if(line.match(this.functionDeclarationPattern))
            {
                this.variableDeclarations = new Set<string>(); //on rentre dans une nouvelle fonction donc on vide le tableau des variables
                let openParenthesis = line.indexOf('(');
                let closeParenthesis = line.indexOf(')');
                let paramsString = line.substring(openParenthesis + 1, closeParenthesis);
                paramsString.split(',').forEach(v => this.variableDeclarations?.add(this.normalizeIdentifier(v))) //on ajoute les paramètres de la fonction aux déclarations de variable
                continue;
            }

            if(isLibrary && !this.variableDeclarations) //l'array n'est pas instancié donc on n'est pas encore rentré dans une fonction //skip
                continue;

            if(line.match(this.localPattern)) //déclarations de variables
            {
                console.log('declaration => ' + line);
                if(!line.match(this.variableDeclarationPattern)) {
                    this.diagnostics.push(new Diagnostic(new Range(i, 0, i, line.length), `Invalid variable declaration`, DiagnosticSeverity.Error));
                    continue;
                }

                //déclaration correcte => on prend le nom de
                //TODO handle duplicate declarations
                //TODO throw error when var has the same name as a keyword
                line.replace(this.localPattern, '').split(',').forEach(v => {
                    let regexIndexOf = new RegExp(`(?:^|\\s|[^a-zA-Z:_])${v}(?=\\s|[^a-zA-Z:_]|$)`, 'i');
                    let index = line.search(regexIndexOf) + 1;
                    if(this.keywords.has(this.normalizeIdentifier(v))) {
                        this.diagnostics.push(new Diagnostic(new Range(i, index, i, index + v.length), `Illegal variable name (keyword)`, DiagnosticSeverity.Error));
                        return;
                    }

                    this.variableDeclarations?.add(this.normalizeIdentifier(v));
                });
                console.log(this.variableDeclarations);
                continue;
            }

            
            if (!line.includes(":=") && line.match(/^\s*[^=]+(\s*=\s*[^=]+)+\s*$/)) {
                // Ensure it's not a part of a comparison expression (like `if`, `for`, or function params)
                // Match cases where '=' is used for assignment and is not part of an expression (i.e., not '==' or part of SQL)
                if (line.includes("=") && !line.match(/\b(?:if|else|while|return)\b/)) {
                    // Ignore comparisons and control flow conditions (e.g., 'if', 'else', 'while')
                    this.diagnostics.push(new Diagnostic(new Range(i, 0, i, line.length), `Wrong assignation symbol used`, DiagnosticSeverity.Error));
                }
            }

            //on match tous les mots (contient lettres, underscore, deux-points)
            line.match(this.identifierPattern)?.forEach((match) => {
                let regexIndexOf = new RegExp(`(?:^|\\s|[^a-zA-Z:_])${match}(?=\\s|[^a-zA-Z:_]|$)`, 'i');
                let index = line.search(regexIndexOf) + 1;  // Find the first occurrence of the identifier as a whole word
                console.log('symbol found ', match, i, index);
                if(this.keywords.has(this.normalizeIdentifier(match))) {
                    console.log('keyword found ', match);
                    return; //keyword => pas de validation (yet, il faut checker pour les then manquants)
                }
                    

                let nextChar = line.slice(index + match.length).trim()[0] || null; //on peut espacer les parenthèse du nom de la fonction (un peu trop)
                if(nextChar == '(') 
                { //appel de fonction
                    
                    if(!this.functionDeclarations[this.normalizeIdentifier(match)]) {
                        this.diagnostics.push(new Diagnostic(new Range(i, index, i, index + match.length), `Unknown function : ${match}`, DiagnosticSeverity.Error));
                    }
                    console.log('function found ', match);
                    return;
                }

                
                let prevChar = line[index - 1] || null;
                if(prevChar == ".") {
                    console.log('property found ', match);
                    return; //propriété d'objet //aucun façon de savoir si existe //btw ... urgh nvm
                }
                     

                if(this.variableDeclarations?.has(this.normalizeIdentifier(match))) {
                    console.log('variable found ', match);
                    return; //appel de variable
                }

                //normalement, on mettrait une erreur ici.
                //mais Belair! et oui y'a une gimmick!
                //Si une fonction (de Belair seulement) prend 0 param, les paranthèses peuvent omises
                let functionInfos = this.functionDeclarations[this.normalizeIdentifier(match)];
                if(functionInfos && functionInfos.numberOfParams == 0) {
                    console.log('paramless found ', match)
                    return; //c'est good
                }

                //TODO gotos && labels
                if(match[0] == ':') { //could a label OR a SQLParam (not handled yet but in LINQ, so ignored)
                    if(this.labelDeclarations.has(this.normalizeIdentifier(match))) {
                        console.log('label found ', match);
                        return; //est un label (pour goto)
                    }

                    //est un param SQL dans le LINQ (je n'ai pas réussi à supprimer les LINQs multilignes yet)
                    return;
                }

                if(line.match(this.gotoPattern)) {
                    if(this.labelDeclarations.has(this.normalizeIdentifier(':'+ match))) {
                        console.log('anchor found ', match);
                        return;
                    }
                    this.diagnostics.push(new Diagnostic(new Range(i, index, i, index + match.length), `Unknown label : ${match}`, DiagnosticSeverity.Error));
                }


                this.diagnostics.push(new Diagnostic(new Range(i, index, i, index + match.length), `Unknown variable : ${match}`, DiagnosticSeverity.Error));
            });
        }
    
        
    }
    
    private getFunctionNames(source: string, code: string, checkForLabels: boolean = false) : void  {
        let lines = code.split(/\r?\n/);
        for (let [i, line] of lines.entries()) {

            if (line.match(this.functionDeclarationPattern)) 
            {
                //console.log("##" + line); //ex : ## function myLittleFunction(param1, param2)
                let openParenthesis = line.indexOf('(');
                let closeParenthesis = line.indexOf(')');
                let functionName = line.substring(0, openParenthesis).replace(/\bfunction\b/i, '').trim();
                let paramsString = line.substring(openParenthesis + 1, closeParenthesis);
    
                if (this.functionDeclarations[this.normalizeIdentifier(functionName)]) {
                    console.log('Dupe found! => ', line);
                    this.diagnostics.push(new Diagnostic(new Range(0, 0, 0, 0), `Duplicate function found : ${functionName}`, DiagnosticSeverity.Error));
                    continue;
                }
    
                this.functionDeclarations[this.normalizeIdentifier(functionName)] = new functionDeclaration(source, (paramsString ? paramsString.split(',').length : 0))
                continue;
            }

            if(!checkForLabels)
                continue;

            let match = line.match(this.labelDeclarationPattern);
            if(match) { 
                this.labelDeclarations.add(this.normalizeIdentifier(match[0]));
                console.log('label found ', match, i, this.labelDeclarations);
            }
        }
    }

    // #region Fonctions de gestions des libraires (imports)
    // Ces fonctions servent à trouver les librairies des imports, ouvrir les fichiers et
    // d'en extraire les noms de fonctions. 

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

    // #endregion


    // #region Fonctions de remplacement de code
    // Ces fonctions servent à remplacer/enlever le contenu de certains bouts du code qui peuvent
    // interférer avec la validation du code. Ex: Il ne faut pas mettre des erreurs pour le code commenté.
    // On remplace donc les commentaires et string. Je remplace aussi le LINQ pcq'il est trop chiant à gérer.

    private replaceSinglelineCommentContent(input: string): string {
        return input.replace(this.singleLineCommentPattern, (match, newline) => {
            return newline; // Replace the entire comment with just the line break
        });
    }

    private replaceSinglelineLINQContent(input: string): string { //srx le LINQ casse les couilles dans la validation donc OSEF
        return input.replace(this.singleLineLINQPattern, (match, newline) => {
            //console.log('linq found!: ', match);
            return "true" + newline; // Replace the LINQ with null + the line break //The null is to not fuck over the assignation validation
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

    //TODO Fix
    private replaceMultilineLINQContent(input: string): string {
        //LE REGEX MARCHE PAS DONC, J'AIMERAIS QUE VOUS SACHIEZ QUE SI VOUS UTILISEZ DU LINQ MULTILIGNE BEN I TRIED...
        //TEST AVEC CustomAprilRVEH.bs
        return input.replace(this.multiLineLINQPattern, (match) => {
            console.log('multiline linq found!', match);
            let lines = match.split('\n'); // Split the content by line breaks
            let replacedLines = lines.map(line => '_'.repeat(line.length)); // Replace each line with underscores
            return replacedLines.join('\n'); 
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

    // #endregion


    private normalizeIdentifier(identifier: string): string { 
        //on veut normaliser les noms de fonctions/variables puisque sur Belair, tout est case insensitive
        return identifier.trim().toLowerCase();
    }

    private getRangeForIdentifier()
}

class functionDeclaration {
    numberOfParams: number;
    source: string;
    constructor(source: string, numberOfParams: number) {
        this.source = source;
        this.numberOfParams = numberOfParams;
    }
}