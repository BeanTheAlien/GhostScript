const fs = require("fs");
const path = require("path");
const https = require("https");

const [,, ...args] = process.argv;
function hasFlag(flag) {
    return args.includes(`--${flag}`);
}
function getFlag(flag) {
    return args.indexOf(`--${flag}`);
}
function isIdx(idx) {
    return 0 <= idx && idx < args.length;
}
function getVal(idx) {
    return args[idx + 1];
}
if(!hasFlag("file") && !hasFlag("test")) throw new Error("Failed to execute. (missing parameter: 'file')");
const file = hasFlag("test") ? "../test" : getVal(getFlag("file"));
const verbose = hasFlag("verbose");
const debug = hasFlag("debug");
const safe = hasFlag("safe");

var runtime = {
    modules: {},
    scope: {}
};
var moduleDev = null;

async function main() {
    //const json = fs.readFileSync("grammar.json", "utf8");
    //const grammar = JSON.parse(json);
    const script = fs.readFileSync(`${file}.gst`, "utf8");
    //const tokens = await lexer(grammar, script);
    //await compile(tokens);
    const tokens = tokenize(script);
    await parser(tokens);
}
main();

async function lexer(grammar, script) {
    const tokens = [];
    const lines = script.split(/\r?\n/);
    for(let line of lines) {
        line = line.trim();
        if(!line) continue;
        let matched = false;
        for(const rule of grammar) {
            const regex = new RegExp(rule.regex);
            const m = line.match(regex);
            if(m) {
                tokens.push({ name: rule.name, match: m });
                matched = true;
                break;
            }
        }
        if(!matched) console.error("Unrecognized line:", line);
    }
    return tokens;
}
function tokenize(script) {
    const tokens = [];
    let i = 0;
    while(i < script.length) {
        let char = script[i];
        // skip whitespace
        if(/\s/.test(char)) {
            i++;
            continue;
        }
        if(char == "/" && script[i + 1] == "/") {
            while(script[i] != "\n") i++;
            continue;
        }

        // numbers
        if(/\d/.test(char)) {
            let val = "";
            while(/\d|\./.test(script[i])) {
                val += script[i++];
            }
            tokens.push({ id: "num", val });
            continue;
        }

        // identifiers or keywords
        if(/[a-zA-Z_]/.test(char)) {
            let val = "";
            while(/[a-zA-Z0-9_]/.test(script[i])) {
                val += script[i++];
            }
            const type = ["var", "import", "if", "else", "while", "return", "class", "function", "method", "prop"].includes(val)
                ? "keyword"
                : "id";
            tokens.push({ id: type, val });
            continue;
        }

        // strings
        if(char == "\"" || char == "'") {
            const quote = char;
            let val = "";
            i++;
            while(i < script.length && script[i] != quote) {
                if(script[i] == "\\") {
                    val += script[i++];
                    if(i < script.length) val += script[i];
                } else val += script[i];
                i++;
            }
            i++; // skip closing quote
            tokens.push({ id: "string", val });
            continue;
        }

        // two-char operators
        const twoChar = script.slice(i, i + 2);
        if(["==", "!=", ">=", "<=", "&&", "||", "=>"].includes(twoChar)) {
            tokens.push({ id: "opr", val: twoChar });
            i += 2;
            continue;
        }

        // single-char operators
        if("+-*/%<>".includes(char)) {
            tokens.push({ id: "opr", val: char });
            i++;
            continue;
        }
        if(char == "=") {
            tokens.push({ id: "eqls", val: char });
            i++;
            continue;
        }
        if(char == ",") {
            tokens.push({ id: "comma", val: char });
            i++;
            continue;
        }
        if(char == ".") {
            tokens.push({ id: "dot", val: char });
            i++;
            continue;
        }

        if(char == "(" || char == ")") {
            const type = char == "(" ? "lparen" : "rparen";
            tokens.push({ id: type, val: char });
            i++;
            continue;
        }

        if(char == "[" || char == "]") {
            const type = char == "[" ? "lbracket" : "rbracket";
            tokens.push({ id: type, val: char });
            i++;
            continue;
        }

        if(char == "{" || char == "}") {
            const type = char == "{" ? "lbrace" : "rbrace";
            tokens.push({ id: type, val: char });
            i++;
            continue;
        }

        // if we reach here, it's unknown
        tokens.push({ id: "unknown", val: char });
        i++;
    }
    return tokens;
}
async function parser(tokens) {
    let i = 0;
    while(i < tokens.length) {
        const tk = tokens[i];
        if(tk.id == "keyword" && tk.val == "import") {
            // const imp = parseImport(tokens, i);
            // if(!imp.module.length) throw new Error(`Unexpected end of import.`);
            // if(imp.module[0].id != "id") throw new Error(`Unexpected token '${imp.module[0].val}' (expected 'id').`);
            const modName = tokens[i+1].val;
            const lib = await getModule(modName, modName);
            if(!lib) {
                console.error(`Could not load module ${modName}`);
                break;
            }
            // always keep module object available
            runtime.modules[modName] = lib;
            // if reqroot is false, inject exported names into runtime.scope
            if(lib.meta && lib.meta.reqroot == false) {
                for(const [k, v] of Object.entries(lib.exports)) {
                    // avoid clobbering existing names unless you want to
                    if(runtime.scope[k]) {
                        console.warn(`Skipping import of '${k}' from ${modName}: name conflict in global scope`);
                        continue;
                    }
                    runtime.scope[k] = v;
                }
            } else {
                // else expose under default root name
                const rootName = lib.meta.defroot || modName;
                runtime.scope[rootName] = lib.exports;
            }
            // i = imp.next;
            i += 2;
            continue;
        }
        const expr = parseExpr(tokens, i);
        i = expr.next;
        interp(expr.node);
    }
}
function parseFunc(tokens, i) {
    i += 2;
    let args = [];
    let curArg = [];
    let depth = 1;
    while(i < tokens.length && depth > 0) {
        let tk = tokens[i];
        if(tk.id == "lparen") {
            depth++;
            curArg.push(tk);
        } else if(tk.id == "rparen") {
            depth--;
            if(depth > 0) curArg.push(tk);
        } else if(tk.val == "," && depth == 1) {
            args.push(curArg);
            curArg = [];
        } else {
            curArg.push(tk);
        }
        i++;
    }
    if(curArg.length) args.push(curArg);
    return { args, next: i };
}
function parseBlock(tokens, i) {
    let body = [];
    let depth = 1;
    // skip opening brace
    i++;
    while(i < tokens.length && depth > 0) {
        const tk = tokens[i];
        // go into another block statement
        if(tk.id == "lbrace") depth++;
        // move up a level
        else if(tk.id == "rbrace") depth--;
        body.push(tk);
        i++;
    }
    // Handle unterminated block statements
    if(depth > 0) throw new Error("Unterminated block statement. (expected '}')");
    // remove ending right brace
    body.splice(body.length - 1, 1);
    let parsedBody = [];
    let j = 0;
    while(j < body.length) {
        const parsed = parseExpr(body, j);
        parsedBody.push(parsed.node);
        j = parsed.next;
    }
    return { node: { type: "BlockStatement", val: parsedBody }, next: i };
}
function parseExpr(tokens, i) {
    let { node, next } = parsePrim(tokens, i);
    while(tokens[next] && (tokens[next].id == "dot" || tokens[next].id == "lparen")) {
        const tk = tokens[next];
        if(tk.id == "dot") {
            const prop = tokens[next + 1];
            node = {
                type: "MemberExpression",
                object: node,
                prop: { type: "Identifier", val: prop.val }
            };
            next += 2;
        } else if(tk.id == "lparen") {
            const args = parseArguments(tokens, next + 1);
            node = {
                type: "CallExpression",
                callee: node,
                args: args.args
            };
            next = args.next;
        }
    }
    return { node, next };
}
function parseArr(tokens, i) {
    let idx = i + 1;
    let els = [];
    if(tokens[idx] && tokens[idx].id == "rbracket") {
        return { node: { type: "ArrayExpression", val: els }, next: idx + 1 };
    }
    while(idx < tokens.length) {
        const expr = parsePrim(tokens, idx);
        els.push(expr.node);
        idx = expr.next;
        // if next token is comma, consume and continue
        if(tokens[idx] && tokens[idx].id == "comma") {
            idx++;
            // handle trailing comma before closing bracket gracefully
            if(tokens[idx] && tokens[idx].id == "rbracket") {
                return { node: { type: "ArrayExpression", val: els }, next: idx + 1 };
            }
            continue;
        }

        // if rbracket found, finish
        if(tokens[idx] && tokens[idx].id == "rbracket") {
            return { node: { type: "ArrayExpression", val: els }, next: idx + 1 };
        }

        // otherwise it's an error
        throw new Error("Expected ',' or ']' in array literal.");
    }
    throw new Error("Unterminated array literal (missing ']').");
}
function parseMath(tokens, i) {
    let n = 0;
    // if the first value isnt a number, then its not an equation
    if(tokens[i].id != "num") throw new Error(`Non-equation found. (got '${tokens[i].id}')`);
    while(i < tokens.length) {
        let lhs = tokens[i];
        // if there is an operator after lhs, continue solving
        // else we can break early (it is solved already)
        if(tokens[i+1] && tokens[i+1].id == "opr") {
            let opr = tokens[i+1];
            // assuming an operator is found, it requires rhs
            if(!tokens[i+2] || tokens[i+2].id != "num") throw new Error("Invalid right-hand side found.");
            let rhs = tokens[i+2];
            switch(opr.val) {
                case "+": n += lhs + rhs; break;
                case "-": n += lhs - rhs; break;
                case "*": n += lhs * rhs; break;
                case "/": n += lhs / rhs; break;
                case "%": n += lhs % rhs; break;
            }
        }
        else break;
        i++;
    }
    return { node: { type: "Literal", val: n }, next: i + 1 };
}
function parsePrim(tokens, i) {
    const token = tokens[i];
    if(token.id == "id") return { node: { type: "Identifier", val: token.val }, next: i + 1 };
    if(token.id == "string") return { node: { type: "Literal", val: token.val }, next: i + 1 };
    if(token.id == "num") return { node: { type: "Literal", val: Number(token.val) }, next: i + 1 };
    if(token.id == "lparen") {
        const expr = parseExpr(tokens, i + 1);
        if(tokens[expr.next].id != "rparen") throw new Error("Expected ')'.");
        return { node: expr.node, next: expr.next + 1 };
    }
    if(token.id == "keyword" && token.val == "var" && tokens[i+1] && tokens[i+1].id == "id") {
        const name = tokens[i+1].val;
        if(tokens[i+2] && tokens[i+2].id == "eqls") {
            //if(tokens[i+2].id != "eqls") throw new Error("Expected '='.");
            //if(!tokens[i+3]) throw new Error(`Missing assignment value of '${name}'.`);
            const expr = parseExpr(tokens, i + 3);
            return { node: { type: "Assignment", val: [name, expr.node] }, next: expr.next };
        }
        return { node: { type: "Declaration", val: name }, next: i + 2 };
    }
    if(token.id == "lbracket") {
        const arr = parseArr(tokens, i);
        return { node: arr.node, next: arr.next };
    }
    if(token.id == "lbrace") {
        const block = parseBlock(tokens, i);
        return { node: block.node, next: block.next };
    }
    throw new Error(`Unexpected token '${token.val}'. (token id: ${token.id})`);
}
function parseArguments(tokens, i) {
    const args = [];
    while(i < tokens.length && tokens[i].id != "rparen") {
        const expr = parseExpr(tokens, i);
        args.push(expr.node);
        i = expr.next;
        if(tokens[i]?.id == "comma") i++;
    }
    if(tokens[i]?.id != "rparen") throw new Error("Expected ')'.");
    return { args, next: i + 1 };
}
function parseImport(tokens, i) {
    const module = [];
    while(i < tokens.length && (tokens[i].id == "id" || tokens[i].id == "dot")) {
        const tk = tokens[i];
        if(tk.id == "dot") {
            i++;
            continue;
        }
        module.push(tk.value);
        i++;
    }
    return { module, next: i };
}
function interp(node) {
    // safety: print debugging for malformed nodes
    if(!node || typeof node != "object") {
        console.error("interp got a non-node:", node);
        throw new Error("interp received invalid AST node");
    }

    switch (node.type) {
        case "Literal":
            return node.val;

        case "Identifier":
            // return actual runtime binding if present, otherwise the name (so callers can decide)
            if(Object.hasOwn(runtime.scope, node.val)) return runtime.scope[node.val];
            return node.val;

        case "MemberExpression": {
            // Evaluate left side (the object)
            const obj = interp(node.object);
            // property node is usually { type: 'Identifier', val: 'propName' }
            const propName = (node.prop && (node.prop.val || node.prop.name)) || (node.property && (node.property.val || node.property.name));
            if (obj == null) {
                console.error("MemberExpression: target is null/undefined", node);
                throw new Error("Cannot access property of null/undefined");
            }
            // normal JS property access
            return obj[propName];
        }

        case "CallExpression": {
            // If callee is a MemberExpression, handle as method/JS-method
            if(node.callee.type == "MemberExpression") {
                // evaluate object (target) first
                const targetValue = interp(node.callee.object);
                // get property name
                const methodName = (node.callee.prop && node.callee.prop.val) || (node.callee.property && node.callee.property.val);
                const args = node.args.map(a => interp(a));

                // First try Ghost method (GSMethod lookup)
                const gsMethod = findMethod(targetValue, methodName);
                if(gsMethod) {
                    return runMethod(gsMethod, targetValue, ...args);
                }

                // Fallback: JS property on object, call it with correct this
                const maybeFn = targetValue && targetValue[methodName];
                if(typeof maybeFn == "function") {
                    return maybeFn.apply(targetValue, args);
                }

                console.error("CallExpression: method not found:", methodName, "on", targetValue, "node:", node);
                throw new Error(`Method '${methodName}' not found on target`);
            }

            // Otherwise callee is not a member expression (e.g. Identifier or nested CallExpression)
            // Evaluate callee to a value
            const calleeVal = interp(node.callee);
            const args = node.args.map(a => interp(a));

            // If calleeVal is a plain JS function, call it
            if(typeof calleeVal == "function") {
                return calleeVal(...args);
            }

            // If calleeVal looks like a GSFunc (has gsFuncBody), use runFunc
            if(calleeVal && calleeVal.gsFuncBody) {
                return runFunc(calleeVal, ...args);
            }

            // If callee is a name (string) try to resolve from runtime.scope or modules (defensive)
            if(typeof calleeVal == "string") {
                // try to find a GS function by that name
                const fn = findFunction(calleeVal);
                if(fn) return runFunc(fn, ...args);

                // try JS global in runtime.scope
                if(runtime.scope && runtime.scope[calleeVal] && typeof runtime.scope[calleeVal] == "function") {
                    return runtime.scope[calleeVal](...args);
                }
            }

            console.error("CallExpression: cannot call calleeVal:", calleeVal, "node:", node);
            throw new Error(`Cannot call '${String(calleeVal)}'`);
        }
        case "Declaration":
            runtime.scope[node.val] = undefined;
            break;
        case "Assignment":
            const nm = node.val[0];
            const vl = node.val[1];
            runtime.scope[nm] = interp(vl);
            break;
        
        case "ArrayExpression":
            return node.val.map(v => interp(v));
        
        case "BlockStatement":
            node.val.forEach(v => interp(v));
            break;

        default:
            console.error("interp: unknown node:", node);
            throw new Error(`Unknown node with type '${node.type}'.`);
    }
}

async function compile(tokens) {
    for (const { name, match } of tokens) {
        switch (name) {
            case "import": {
                const modName = match[1];
                const lib = await getModule(modName, modName);
                if (!lib) {
                    console.error(`Could not load module ${modName}`);
                    break;
                }

                // always keep module object available
                runtime.modules[modName] = lib;

                // if reqroot is false, inject exported names into runtime.scope
                if (lib.meta && lib.meta.reqroot === false) {
                    for (const [k, v] of Object.entries(lib.exports)) {
                        // avoid clobbering existing names unless you want to
                        if (runtime.scope[k]) {
                            console.warn(`Skipping import of '${k}' from ${modName}: name conflict in global scope`);
                            continue;
                        }
                        runtime.scope[k] = v;
                    }
                } else {
                    // else expose under default root name
                    const rootName = lib.meta.defroot || modName;
                    runtime.scope[rootName] = lib.exports;
                }
                break;
            }

            case "func_exec": {
                // match for function calls: optionally module.func(args) OR func(args)
                // match format produced by your regex should be [ full, funcName, argstring ] OR [ full, maybeModule, funcName, argstring ]
                // we'll accept both shapes:
                if (match.length == 4) {
                    // module.func(...)
                    const moduleName = match[1];
                    const funcName = match[2];
                    const args = parseArgs(match[3]);
                    const mod = runtime.modules[moduleName] || (runtime.scope[moduleName] && { exports: runtime.scope[moduleName] });
                    if (mod && mod.exports && mod.exports[funcName]) {
                        const fn = mod.exports[funcName];
                        runFunc(fn, ...args);
                    } else {
                        console.error(`Unknown method ${moduleName}.${funcName}`);
                    }
                } else {
                    // bare func(...)
                    const funcName = match[1];
                    const args = parseArgs(match[2]);
                    const func = findFunction(funcName);
                    if (func) runFunc(func, ...args);
                    else console.error(`Unknown function: ${funcName}`);
                }
                break;
            }

            case "method_exec": {
                const target = match[1];
                const methodName = match[2];
                const args = parseArgs(match[3]);
                const method = findMethod(target, methodName);
                if(method) runMethod(method, target, ...args);
                else console.error(`Unknown method: ${methodName} for target`, target);
                break;
            }

            case "var": {
                const varName = match[1];
                const value = eval(match[2]); // prototype only
                runtime.scope[varName] = value;
                break;
            }

            default:
                console.warn("Unhandled token:", name, match);
        }
    }
}

// async function getRemoteModule(url) {
//     return new Promise((resolve, reject) => {
//         https.get(url, (res) => {
//             let data = "";
//             res.on("data", chunk => data += chunk);
//             res.on("end", () => resolve(data));
//         }).on("error", reject);
//     });
// }
// function createRemoteRequire(baseURL) {
//   return async function(relPath) {
//     const resolvedURL = new URL(relPath, baseURL).href;
//     const code = await fetch(resolvedURL).then(r => r.text());
//     const module = { exports: {} };
//     const wrapped = new Function("module", "exports", "require", code);
//     await wrapped(module, module.exports, createRemoteRequire(resolvedURL));
//     return module.exports;
//   };
// }
async function fetchRaw(url) {
    try {
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.status);
        const text = await res.text();
        return text;
    } catch(e) {
        console.log(e);
    }
}
async function fetchModuleDev() {
    try {
        const res = await fetch(`https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/main/ghost/dev/module_dev.js`);
        if(!res.ok) throw new Error(res.status);
        const module = { exports: {} };
        const js = await res.text();
        const wrapped = new Function("module", "exports", js);
        wrapped(module, module.exports);
        moduleDev = module.exports;
    } catch(e) {
        console.log(e);
    }
}
async function getModule(name, subname) {
    if(!moduleDev) await fetchModuleDev();
    const url = `https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/main/ghost/modules/${name}/${subname}.js`;
    const js = await fetchRaw(url);
    const module = { exports: {} };
    const wrapped = new Function("require", "module", "exports", "module_dev", "runtime", js);
    wrapped(require, module, module.exports, moduleDev, runtime);
    // try {
    //     const wrapped = new Function("module", "exports", "require", js);
    //     wrapped(module, module.exports, require);
    // } catch (err) {
    //     console.error(`Failed to execute module ${name}:`, err);
    //     return null;
    // }
    const m = module.exports || {};

    // Build "flat" exports object that runtime expects.
    // Support two cases:
    //  1) module exported structured arrays: { funcs: [...], methods: [...], ... }
    //  2) module already flattened: { wait: GSFunc, print: GSFunc, ghostmodule: {...} }
    const flat = {};

    // Helper to flatten arrays of GS* objects into flat[name] = object
    function flattenArr(arr) {
        if(!Array.isArray(arr)) return;
        for(const item of arr) {
            const nk =
                item?.gsVarName ||
                item?.gsFuncName ||
                item?.gsMethodName ||
                item?.gsClassName ||
                item?.gsTypeName ||
                item?.gsPropName ||
                item?.gsModifierName ||
                item?.gsOperatorName ||
                item?.gsErrorName ||
                item?.gsEventName ||
                item?.gsDirectiveName;
            if(nk) flat[nk] = item;
        }
    }

    // case (1) — structured arrays
    flattenArr(m.vars);
    flattenArr(m.funcs);
    flattenArr(m.methods);
    flattenArr(m.classes);
    flattenArr(m.types);
    flattenArr(m.props);
    flattenArr(m.mods);
    flattenArr(m.errors);
    flattenArr(m.events);
    flattenArr(m.operators);
    flattenArr(m.directives);

    // case (2) — flattened object (take everything except ghostmodule)
    for(const [k, v] of Object.entries(m)) {
        if(k == "ghostmodule") continue;
        // avoid overwriting array-derived entries, keep whichever exists
        if(!(k in flat)) flat[k] = v;
    }

    // If the module didn't provide ghostmodule meta, create a default
    const meta = m.ghostmodule || {
        name,
        defroot: name,
        reqroot: true
    };

    return {
        meta,
        exports: flat
    };
}

function runFunc(func, ...args) {
    const { gsFuncDesire, gsFuncType, gsFuncName, gsFuncArgs, gsFuncBody } = func;
    if(gsFuncArgs) {
        for(let i = 0; i < gsFuncArgs.length; i++) {
            const fArg = gsFuncArgs[i];
            const { gsArgName, gsArgVal, gsArgDesire, gsArgType } = fArg;
            const arg = args[i];
            if(arg != undefined) {
                if(gsArgType) {
                    if(!typeCheck(gsArgType, arg)) {
                        if(gsArgDesire) {
                            // need type.parseTo
                        } else throw new Error(`Cannot match type '${typeof arg}' to '${gsArgType.gsTypeName}'`);
                    }
                }
            } else if(gsArgVal != undefined) args[i] = gsArgVal;
        }
    }
    const res = gsFuncBody(...args);
    if(res != undefined) {
        if(gsFuncType) {
            if(!typeCheck(gsFuncType, res)) {
                if(gsFuncDesire) {
                    // need parse again
                } else throw new Error(`Cannot match type '${typeof res}' to '${gsFuncType.gsTypeName}'`);
            }
        }
    }
    return res;
}
function runMethod(mthd, target, ...args) {
    const { gsMethodDesire, gsMethodType, gsMethodAttach, gsMethodName, gsMethodArgs, gsMethodBody } = mthd;
    if(Array.isArray(gsMethodAttach)) {
        if(!gsMethodAttach.some(a => typeCheck(a, target))) throw new Error(`Method '${gsMethodName}' cannot be called on target of type '${typeof target}'`);
    } else {
        if(!typeCheck(gsMethodAttach, target)) throw new Error(`Method '${gsMethodName}' cannot be called on target of type '${typeof target}'`);
    }
    if(gsMethodArgs) {
        for(let i = 0; i < gsMethodArgs.length; i++) {
            const mArg = gsMethodArgs[i];
            const { gsArgName, gsArgVal, gsArgDesire, gsArgType } = mArg;
            const arg = args[i];
            if(arg != undefined) {
                if(gsArgType) {
                    if(!typeCheck(gsArgType, arg)) {
                        if(gsArgDesire) {
                            // need type.parseTo
                        } else throw new Error(`Cannot match type '${typeof arg}' to '${gsArgType.gsTypeName}'`);
                    }
                }
            } else if(gsArgVal != undefined) args[i] = gsArgVal;
        }
    }
    const res = gsMethodBody(target, ...args);
    if(res != undefined) {
        if(gsMethodType) {
            if(!typeCheck(gsMethodType, res)) {
                if(gsMethodDesire) {
                    // need parse again
                } else throw new Error(`Cannot match type '${typeof res}' to '${gsMethodType.gsTypeName}'`);
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
    if(!argString || !argString.trim()) return [];
    const matches = argString.match(/("[^"]*"|'[^']*'|[^,]+)/g);
    return matches ? matches.map(a => eval(a.trim())) : [];
}

// --- findFunction now checks runtime.scope (globals injected by reqroot:false) first,
 // then modules for functions exported without reqroot. ---------------------
function findFunction(name) {
    // 1) direct global scope (injected by reqroot:false)
    if (runtime.scope && runtime.scope[name]) return runtime.scope[name];

    // 2) module exports for modules that didn't require root (or for namespaced modules if someone flattened them)
    for (const modName in runtime.modules) {
        const mod = runtime.modules[modName];
        if (!mod || !mod.exports) continue;
        // if module requested root, skip direct matching unless someone explicitly called without module prefix.
        if (!mod.meta || mod.meta.reqroot === false) {
            if (mod.exports[name]) return mod.exports[name];
        }
    }

    return null;
}

function findMethod(targetType, name) {
    for(const modName in runtime.modules) {
        const mod = runtime.modules[modName];
        if(!mod.meta.reqroot) {
            for(const key in mod.exports) {
                const m = mod.exports[key];
                if(m.gsMethodName == name) {
                    if(Array.isArray(m.gsMethodAttach)) {
                        if(m.gsMethodAttach.some(t => typeCheck(t, targetType))) return m;
                    } else if(typeCheck(m.gsMethodAttach, targetType)) return m;
                }
            }
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
// var ghostConsole = document.createElement("div");

// function preprocess(script) {}
// function compile(script) {}
