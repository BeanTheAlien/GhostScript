var grammar = [
    { "name": "variable", "regex": "(?:var|let|const)(\\w)(=(.*))?(;)?", "exec": (match) => {
        const type = match[1];
        const name = match[2];
        const value = match[3] ?? null;
        ghostVariables[name] = { "name": name, "type": type, "value": value };
    } } // might have to repl regex with each specific type
];

var ghostMemory = { "variables": {}, "functions": {}, "methods": {}, "properties": {}, "types": {}, "classes": {} };
var ghostVariables = {};
var ghostFunctions = {};
var ghostMethods = {};
var ghostProperties = {};
var ghostTypes = {}; // basic: "name": "something", "gstname": "something", "test": () => { return ... }
var ghostClasses = {};
var ghostErrors = {};
var ghostConsole = document.createElement("div");

function preprocess(script) {}
function compile(script) {}
