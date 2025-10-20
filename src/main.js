const fs = require("fs");
const path = require("path");

async function main() {
    const file = "test";
    const json = fs.readFileSync("grammar.json", "utf8");
    const grammar = JSON.parse(json);
    const script = fs.readFileSync(`${file}.gst`, "utf8");
    const tokens = await lexer(grammar, script);
    await compile(tokens);
}
main();

async function lexer(grammar, script) {
    let tokens = [];
    for(const entry of grammar) {
        const { name, regex } = entry;
        while(new RegExp(regex).test(script)) {
            tokens.push({ name, match: script.match(regex) });
            script = script.replace(regex, "");
        }
    }
    return tokens;
}

async function compile(tokens) {
    for(let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        console.log(token);
    }
}

// var ghostMemory = { "variables": {}, "functions": {}, "methods": {}, "properties": {}, "types": {}, "classes": {} };
// var ghostVariables = {};
// var ghostFunctions = {};
// var ghostMethods = {};
// var ghostProperties = {};
// var ghostTypes = {}; // basic: "name": "something", "gstname": "something", "test": () => { return ... }
// var ghostClasses = {};
// var ghostErrors = {};
// // var ghostConsole = document.createElement("div");

// function preprocess(script) {}
// function compile(script) {}
