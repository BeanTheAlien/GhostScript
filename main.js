var grammar = [
    { "name": "variable", "regex": "(?:var|let|const)(\\w)(=(.*))?(;)?", "exec": (match) => { ghostVariables[match[2]] = { "name": match[2], "type": match[1], "value": match[3] ?? null }; } } // might have to repl regex with each specific type
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
