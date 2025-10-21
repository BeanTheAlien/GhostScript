const fs = require("fs");
const path = require("path");
const https = require("https");

var runtime = {
    modules: {},
    scope: {}
};

async function main() {
    const file = "../test";
    const json = fs.readFileSync("grammar.json", "utf8");
    const grammar = JSON.parse(json);
    const script = fs.readFileSync(`${file}.gst`, "utf8");
    const tokens = await lexer(grammar, script);
    await compile(tokens);
}
main();

async function lexer(grammar, script) {
    const tokens = [];
    let index = 0;
    while (script.length > 0) {
        let matched = false;
        for (const { name, regex } of grammar) {
            const r = new RegExp("^" + regex);
            const m = script.match(r);
            if (m) {
                tokens.push({ name, match: m });
                script = script.slice(m[0].length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            console.error("Unrecognized token near:", script.slice(0, 30));
            break;
        }
    }
    return tokens;
}

async function compile(tokens) {
    for(let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const { name, match } = token;
        console.log(token);
        if(name == "import") {
            const lib = await getModule(match[1], match[1]);
            runtime.modules[match[1]] = lib;
        }
    }
}

async function getRemoteModule(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data));
        }).on("error", reject);
    });
}

async function getModule(name, subname) {
    const url = `https://beanthealien.github.io/ghost/modules/${name}/${subname}.js`;
    const js = await getRemoteModule(url);
    const mod = {};
    const exports = {};
    const module = { exports };

    try {
        const wrapped = new Function("module", "exports", jsCode);
        wrapped(module, exports);
    } catch (err) {
        console.error(`Failed to execute module ${name}:`, err);
        return null;
    }

    const flat = {};
    const m = module.exports;
    flatten(m.vars);
    flatten(m.funcs);
    flatten(m.methods);
    flatten(m.classes);
    flatten(m.types);
    flatten(m.props);
    flatten(m.mods);
    flatten(m.errors);
    flatten(m.events);
    flatten(m.operators);

    return {
        meta: m.ghostmodule,
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
