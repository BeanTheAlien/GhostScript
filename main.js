var grammar = {};

var ghostMemory = { "variables": {}, "functions": {}, "methods": {}, "properties": {}, "types": {}, "classes": {} };
var ghostVariables = {};
var ghostFunctions = {};
var ghostMethods = {};
var ghostProperties = {};
var ghostTypes = {};
var ghostClasses = {};
var ghostErrors = {};
var ghostConsole = document.createElement("div");

function preprocess(script) {}
function compile(script) {}