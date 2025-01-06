const fs = require('fs');
const path = require('path');

// Load the function names from the JSON file
const functionsPath = path.join(__dirname, '..', 'syntaxes', 'functions.json');
const functions = JSON.parse(fs.readFileSync(functionsPath, 'utf-8')).functions;

// Generate the regex pattern from the list of functions
const functionNames = Object.keys(functions).join('|')
const regexPattern = `\\b(${Object.keys(functions).join('|')})\\b`;

// Inject the generated regex into your syntax highlight JSON
const syntaxFilePath = path.join(__dirname, '..', 'syntaxes', 'BSE.tmLanguage.json');
const syntaxFile = JSON.parse(fs.readFileSync(syntaxFilePath, 'utf-8'));

// Find the appropriate location to insert the new function regex
syntaxFile.repository.functions.patterns[0].match = regexPattern;

// Save the updated syntax highlight file
fs.writeFileSync(syntaxFilePath, JSON.stringify(syntaxFile, null, 2));

console.log('Added function names to syntax file.');