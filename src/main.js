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
    const lines = script.split(/\r?\n/);
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        let matched = false;
        for (const rule of grammar) {
            const regex = new RegExp(rule.regex);
            const m = line.match(regex);
            if (m) {
                tokens.push({ name: rule.name, match: m });
                matched = true;
                break;
            }
        }
        if (!matched) console.error("Unrecognized line:", line);
    }
    return tokens;
}
async function tokenize(script) {
    let tokens = [];
    let i = 0;
    while(i < script.length) {
        const char = script[i];
        if(/\s/.test(char)) {
            i++;
            continue;
        }
        if(/\d/.test(char)) {
            let val = "";
            while(/\d/.test(char) && i < script.length) {
                val += char;
                char = script[++i];
            }
            tokens.push({ id: "number", val: char });
            continue;
        }
        if (['+', '-', '*', '/', '(', ')'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      current++;
      continue;
    }
    }
}

async function compile(tokens) {
    for(const { name, match } of tokens) {
        switch(name) {
            case "import":
                const lib = await getModule(match[1], match[1]);
                runtime.modules[match[1]] = lib;
                break;
            case "func_exec":
                const funcName = match[1];
                const args = parseArgs(match[2]);
                const func = findFunction(funcName);
                if(func) runFunc(func, ...args);
                break;
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
    const url = `https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/refs/heads/main/ghost/modules/${name}/${subname}.js`;
    const js = await getRemoteModule(url);
    const mod = {};
    const exports = {};
    const module = { exports };

    try {
        const wrapped = new Function("module", "exports", js);
        wrapped(module, exports);
    } catch (err) {
        console.error(`Failed to execute module ${name}:`, err);
        return null;
    }
    function flatten(arr) {
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

function runFunc(func, ...args) {
    const { gsFuncDesire, gsFuncType, gsFuncName, gsFuncArgs, gsFuncBody } = func;
    for(let i = 0; i < gsFuncArgs.length; i++) {
        const fArg = gsFuncArgs[i];
        const { gsArgName, gsArgVal, gsArgDesire, gsArgType } = fArg;
        const arg = args[i];
        if(arg) {
            if(gsArgType) {
                if(!typeCheck(gsArgType, arg)) {
                    if(gsArgDesire) {
                        // need type.parseTo
                    } else throw new Error(`Cannot match type '${typeof arg}' to '${gsArgType}'`);
                }
            }
        } else if(gsArgVal) args[i] = gsArgVal;
    }
    const res = gsFuncBody(...args);
    if(res) {
        if(gsFuncType) {
            if(!typeCheck(gsFuncType, res)) {
                if(gsFuncDesire) {
                    // need parse again
                } else throw new Error(`Cannot match type '${typeof res}' to '${gsFuncType}'`);
            }
        }
    }
    return res;
}
function typeCheck(type, val) {
    return type.gsTypeCheck(val);
}
function runOper(oper, lhs, rhs) {
    return oper.gsOperatorExec(lhs, rhs);
}

function parseArgs(argString) {
    if(!argString.trim()) return [];
    return argString.split(",").map(a => eval(a.trim()));
}

function findFunction(name) {
    for(const modName in runtime.modules) {
        const mod = runtime.modules[modName];
        if(!mod.meta.reqroot && mod.exports[name]) {
            return mod.exports[name];
        }
    }
    return null;
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
