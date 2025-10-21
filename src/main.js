const fs = require("fs");
const path = require("path");

var runtime = {};

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

async function getModule(name, subname) {
    const url = `https://beanthealien.github.io/ghost/modules/${name}/${subname}.js`;
    const mod = require(url);
    const flat = {};
    function flatten(arr, k) {
        if(!Array.isArray(arr)) return;
        for(const m of arr) {
            const nk =
                m.gsVarName ||
                m.gsFuncName ||
                m.gsMethodName ||
                m.gsClassName ||
                m.gsTypeName ||
                m.gsPropName ||
                m.gsModifierName ||
                m.gsOperatorName ||
                m.gsErrorName ||
                m.gsEventName;
            if(nk) flat[nk] = m;
        }
    }
    flatten(mod.vars, "vars");
    flatten(mod.funcs, "funcs");
    flatten(mod.methods, "methods");
    flatten(mod.classes, "classes");
    flatten(mod.types, "types");
    flatten(mod.props, "props");
    flatten(mod.mods, "mods");
    flatten(mod.errors, "errors");
    flatten(mod.events, "events");
    flatten(mod.operators, "operators");
    return {
        meta: mod.ghostmodule,
        exports: flat
    };
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
