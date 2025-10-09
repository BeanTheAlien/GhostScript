const fs = require("fs/promises");
async function main() {
    const json = await fs.readFile("grammar.json", "utf8");
    const ghostGrammar = JSON.parse(json);
    console.log(ghostGrammar);
}
main();

var ghostMemory = { "variables": {}, "functions": {}, "methods": {}, "properties": {}, "types": {}, "classes": {} };
var ghostVariables = {};
var ghostFunctions = {};
var ghostMethods = {};
var ghostProperties = {};
var ghostTypes = {}; // basic: "name": "something", "gstname": "something", "test": () => { return ... }
var ghostClasses = {};
var ghostErrors = {};
// var ghostConsole = document.createElement("div");

function preprocess(script) {}
function compile(script) {}
