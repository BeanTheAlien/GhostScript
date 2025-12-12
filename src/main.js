const fs = require("fs");
const path = require("path");
const https = require("https");
const cp = require("child_process");
const util = require("util");
const execAsync = util.promisify(cp.exec);
const ContextAwarenessAPI = require("../api/ContextAwareness/contextawareness.js");
const AutoDebuggerAPI = require("../api/AutoDebugger/autodebugger.js");
const ContextAwareness = new ContextAwarenessAPI.ContextAwarenessAPI();
const AutoDebugger = new AutoDebuggerAPI.AutoDebuggerAPI();

class HTTPError extends Error {
    constructor(response, url) {
        const message = `HTTP error: ${response.status} (${response.statusText}) (url: ${url})`;
        super(message);
        this.name = "HTTPError";
    }
}

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
const beta = hasFlag("beta");

// class Runtime {
//     constructor() {
//         this.modules = {};
//         this.scope = {};
//     }
//     has(k) {
//         return Object.hasOwn(this.scope, k);
//     }
// }

var runtime = {
    modules: {},
    scope: {
        "true": true,
        "false": false,
        "null": null,
        "undefined": undefined
    }
};
var moduleDev = null;
const raw = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/main/ghost";

async function main() {
    //const json = fs.readFileSync("grammar.json", "utf8");
    //const grammar = JSON.parse(json);
    const script = fs.readFileSync(`${file}.gst`, "utf8");
    //const tokens = await lexer(grammar, script);
    //await compile(tokens);
    const tokens = tokenize(script);
    ContextAwareness.feed(tokens);
    AutoDebugger.feed(tokens);
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
        // line comments
        if(char == "/" && script[i + 1] == "/") {
            while(script[i] != "\n") i++;
            continue;
        }
        // block comments
        if(char == "/" && script[i + 1] == "*") {
            i += 2;
            while(script[i] != "*") i++;
            i += 2;
            continue;
        }

        // numbers
        if(/\-?\d/.test(char)) {
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
            const keywords = [
                "var", "import", "if", "else", "while", "return", "class",
                "function", "method", "prop", "target"
            ];
            const mods = [
                "desire", "const", "dedicated"
            ];
            const type = keywords.includes(val) ? "keyword" : mods.includes(val) ? "mod" : "id";
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
        if(char == ";") {
            tokens.push({ id: "semi", val: char });
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
        if(char == "!") {
            tokens.push({ id: "not", val: char });
            i++;
            continue;
        }

        // if we reach here, it's unknown
        tokens.push({ id: "unknown", val: char });
        i++;
    }
    return tokens;
}
function inject(m) {
    // always keep module object available
    runtime.modules[m.meta.name] = m;
    // if reqroot is false, inject exported names into runtime.scope
    if(m.meta && m.meta.reqroot == false) {
        for(const [k, v] of Object.entries(m.exports)) {
            // avoid clobbering existing names unless you want to
            if(runtime.scope[k]) {
                console.warn(`Skipping import of '${k}' from ${m.meta.name}: name conflict in global scope`);
                continue;
            }
            runtime.scope[k] = v;
        }
    } else {
        // else expose under default root name
        const rootName = m.meta.defroot;
        runtime.scope[rootName] = m.exports;
    }
}
async function parser(tokens) {
    let i = 0;
    while(i < tokens.length) {
        const tk = tokens[i];
        if(tk.id == "keyword" && tk.val == "import") {
            const imp = parseImport(tokens, i);
            if(!imp.module.length) throw new Error("Unexpected termination of import.");
            // const modName = tokens[i+1].val;
            const lib = await getModule(...imp.module);
            const impName = imp.module.join(".");
            // if(!lib) {
            //     console.error(`Could not load module '${impName}'`);
            //     break;
            // }
            if(lib != 0) inject(lib);
            // i += 2;
            i = imp.next;
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
        if(tk.id == "lbrace") {
            // go into another block statement
            depth++;
            if(depth > 1) body.push(tk);
        } else if(tk.id == "rbrace") {
            // move up a level
            depth--;
            if(depth > 1) body.push(tk);
            else break;
        } else {
            body.push(tk);
        }
        i++;
    }
    // Handle unterminated block statements
    if(depth > 0) throw new Error("Unterminated block statement. (expected '}')");
    let parsedBody = [];
    let j = 0;
    while(j < body.length) {
        const parsed = parseExpr(body, j);
        parsedBody.push(parsed.node);
        j = parsed.next;
    }
    return { node: { type: "BlockStatement", val: parsedBody }, next: i };
}
function parseBlockHeader(tokens, i) {
    // modifiers for the header (desire, type, usw)
    const headerMods = parseMods(tokens, i);
    i = headerMods.next;
    const mods = headerMods.mods;
    // header (if, function, usw)
    const header = tokens[i].val;
    // block declarations
    if(["function", "method", "prop", "class"].includes(header)) {
        // get header name
        i++;
        const headerName = tokens[i].val;
        // if its a function or method, parse params
        const headerParams = [];
        if(header == "function" || header == "method") {
            // skip lparen
            i += 2;
            let curArg = [];
            while(i < tokens.length && tokens[i].id != "rparen") {
                // proccess params
                if(tokens[i].id == "comma") {
                    headerParams.push(curArg);
                    curArg = [];
                    i++;
                    continue;
                }
                curArg.push(tokens[i]);
                i++;
            }
            if(curArg.length) headerParams.push(curArg);
        }
        return { node: { type: "BlockDeclaration", val: { type: header, mods, name: headerName, params: headerParams } }, next: i + 1 };
    }
    // conditional headers
    if(["if", "while"].includes(header)) {
        // move to opening paren
        i++;
        if(tokens[i].id != "lparen") throw new Error("Expected left paren for conditional header.");
        // move inside
        i++;
        if(tokens[i].id == "rparen") throw new Error("Unexpected termination of conditional header.");
        let cond = [];
        let depth = 1;
        while(i < tokens.length && depth > 0) {
            const tk = tokens[i];
            if(tk.id == "lparen") {
                // go into another conditional statement
                depth++;
                if(depth > 1) cond.push(tk);
            } else if(tk.id == "rparen") {
                // move up a level
                depth--;
                if(depth > 1) cond.push(tk);
                else break;
            } else {
                cond.push(tk);
            }
            i++;
        }
        if(depth > 0) throw new Error("Unterminated conditional statement. (expected ')')");
        // since the conditional is not parsed, parse it
        let parsedCond = [];
        let j = 0;
        while(j < cond.length) {
            const parsed = parseExpr(cond, j);
            parsedCond.push(parsed.node);
            j = parsed.next;
        }
        return { node: { type: "ConditionalHeader", val: [header, parsedCond] }, next: i + 1 };
    }
    throw new Error(`Unknown block header '${header}'.`);
}
function parseParam(param) {
    let i = 0;
    const parsed = { dedicated: null, const: null, desire: null, type: null, name: null, val: null };
    // mods will come first
    const modsParsed = parseMods(param, i);
    const mods = modsParsed.mods;
    i = modsParsed.next;
    parsed["mods"] = mods;
    // GhostScript uses strict modifier positioning for params
    // dedicated, const, desire, type
    if(mods.length) {
        let j = 0;
        parsed["dedicated"] = mods[j] && mods[j] == "dedicated";
        if(parsed["dedicated"]) j++;
        parsed["const"] = mods[j] && mods[j] == "const";
        if(parsed["const"]) j++;
        parsed["desire"] = mods[j] && mods[j] == "desire";
        if(parsed["desire"]) j++;
        parsed["type"] = mods[j] && runtime.scope[mods[j]] instanceof moduleDev.GSType ? runtime.scope[mods[j]] : runtime.scope.entity;
    } else {
        parsed["dedicated"] = false;
        parsed["const"] = false;
        parsed["desire"] = false;
        parsed["type"] = runtime.scope.entity;
    }
    // name will come after mods
    const name = param[i].val;
    i++;
    parsed["name"] = name;
    // possible eqls val
    parsed["val"] = undefined;
    if(param[i] && param[i].id == "eqls") {
        if(param[i+1]) {
            const val = param[i+1].val;
            parsed["val"] = val;
        } else {
            throw new Error(`Unexpected termination of parameter. (got: '${param}')`);
        }
    }
    return { ...parsed };
}
function parseMods(tokens, i) {
    let mods = [];
    while(i < tokens.length && (tokens[i].id == "mod" || runtime.scope[tokens[i].val] instanceof moduleDev.GSType)) {
        mods.push(tokens[i].val);
        i++;
    }
    return { mods, next: i };
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
        // else, if there is a token, throw error (there needs to be an operator to work with)
        // else we break early (it is solved)
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
        else {
            if(tokens[i+1]) throw new Error(`Cannot resolve non-operator. (got: '${tokens[i+1].val})`);
            else break;
        }
        i++;
    }
    return { n, next: i + 1 };
}
function parseArrAccess(tokens, i) {
    let poses = [];
    // skip opening lbracket
    i += 2;
    while(i < tokens.length) {
        const tk = tokens[i];
        if(tk && tk.id == "num") poses.push(tk.val);
        if(tk && tk.id == "rbracket") return { poses, next: i + 1 };
        i++;
    }
    throw new Error("Unterminated array index. Expected ']'.");
}
function parseCond(tokens, i) {
    // skip over inital opr
    i++;
    // terminate early (resolveCond will handle)
    if(!tokens[i]) return i;
    while(i < tokens.length) {
        // greedily find all supported types for a conditional
        // then return once they are all found with the next position
        if(["string", "num", "id", "opr"].includes(tokens[i].id)) i++;
        else return i;
    }
    return i;
}
function parsePrim(tokens, i) {
    const token = tokens[i];
    if(token.id == "id" && tokens[i+1] && tokens[i+1].id == "eqls") {
        const name = token.val;
        const expr = parseExpr(tokens, i+2);
        return { node: { type: "Assignment", val: [name, expr.node] }, next: expr.next };
    }
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
    if(token.id == "keyword" && (token.val == "function" || token.val == "method")) {
        const funcHeader = parseBlockHeader(tokens, i);
        const header = funcHeader.node.val;
        const funcBody = parseBlock(tokens, funcHeader.next);
        const type = header == "function" ? "FunctionDeclaration" : "MethodDeclaration";
        return { node: { type, val: [header, funcBody] }, next: funcBody.next + 1 };
    }
    if(token.id == "keyword" && (token.val == "if" || token.val == "while")) {
        const condHeader = parseBlockHeader(tokens, i);
        const header = condHeader.node.val[0];
        const condBody = parseBlock(tokens, condHeader.next);
        return { node: { type: "ConditionalHeader", val: [header, condHeader.node.val[1], condBody] }, next: condBody.next + 1 };
    }
    if(token.id == "id" && tokens[i+1] && tokens[i+1].id == "lbracket") {
        const access = parseArrAccess(tokens, i);
        return { node: { type: "ArrayAccess", val: [token.val, access.poses] }, next: access.next };
    }
    // to resolve operator support extension, check if the following value is an opr
    // supporting multiple possible lhs types
    // returns a literal boolean value
    if((token.id == "id" || token.id == "string" || token.id == "num") && tokens[i+1] && tokens[i+1].id == "opr") {
        const expr = parseCond(tokens, i);
        const res = resolveCond(tokens.slice(i, expr + 1));
        return { node: { type: "Literal", val: res }, next: expr + 1 };
    }
    if(token.id == "id") return { node: { type: "Identifier", val: token.val }, next: i + 1 };
    if(token.id == "string") return { node: { type: "Literal", val: token.val }, next: i + 1 };
    if(token.id == "num") return { node: { type: "Literal", val: Number(token.val) }, next: i + 1 };
    if(token.id == "opr") return { node: { type: "Operand", val: token.val }, next: i + 1 };
    if(token.id == "lbracket") {
        const arr = parseArr(tokens, i);
        return { node: arr.node, next: arr.next };
    }
    if(token.id == "lbrace") {
        const block = parseBlock(tokens, i);
        return { node: block.node, next: block.next };
    }
    if(token.id == "not") return { node: { type: "Not", val: token.val }, next: i + 1 };
    if(token.id == "semi") return { node: { type: "Literal", val: token.val }, next: i + 1 };
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
    // skip import statement
    i++;
    // use a counter to make it non-greedy
    // if dot is hit, continue consuming (ie, ghost.ghost)
    // once no more dots are found, thats the full module
    let c = 1;
    while(i < tokens.length && c > 0 && (tokens[i].id == "id" || tokens[i].id == "dot")) {
        const tk = tokens[i];
        if(tk.id == "dot") {
            c++;
            i++;
            continue;
        }
        module.push(tk.val);
        i++;
        c--;
    }
    return { module, next: i };
}
function interp(node) {
    // safety: print debugging for malformed nodes
    if(!node || typeof node != "object") {
        console.error("interp got a non-node:", node);
        throw new Error("interp received invalid AST node");
    }
    
    switch(node.type) {
        case "Literal":
            return node.val;

        case "Identifier":
            // return actual runtime binding if present
            if(Object.hasOwn(runtime.scope, node.val)) return runtime.scope[node.val];
            // if it doesnt exist, return `undefined`
            return undefined;

        case "MemberExpression": {
            // Evaluate left side (the object)
            const obj = interp(node.object);
            // property node is usually { type: 'Identifier', val: 'propName' }
            const propName = (node.prop && (node.prop.val || node.prop.name)) || (node.property && (node.property.val || node.property.name));
            if(obj == null) {
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
                throw new Error(`Method '${methodName}' not found on target.`);
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
        
        case "FunctionDeclaration": {
            const { type, mods, name, params } = node.val[0];
            const bodyNode = node.val[1];
            const body = bodyNode.node.val;
            //gsFuncDesire: boolean, gsFuncType: GSType, gsFuncName: string, gsFuncArgs: GSArg[], gsFuncBody: function
            //gsArgName: string, gsArgVal: Object, gsArgDesire: boolean, gsArgType: GSType
            const ents = {};
            const gsf = new moduleDev.GSFunc({
                gsFuncDesire: mods.includes("desire"),
                gsFuncType: runtime.scope.entity,
                gsFuncName: name,
                gsFuncArgs: params.map(p => {
                    const parsed = parseParam(p);
                    const arg = new moduleDev.GSArg({
                        gsArgName: parsed.name,
                        gsArgVal: parsed.val,
                        gsArgDesire: parsed.desire,
                        gsArgType: parsed.type
                    });
                    return arg;
                }),
                gsFuncBody: (...args) => {
                    const formal = [...gsf.gsFuncArgs];
                    formal.forEach((arg, i) => {
                        const val = args[i] !== undefined ? args[i] : arg.gsArgVal;
                        arg.gsArgVal = val;
                    });
                    formal.forEach(f => {
                        if(Object.hasOwn(runtime.scope, f.gsArgName)) ents[f.gsArgName] = runtime.scope[f.gsArgName];
                        runtime.scope[f.gsArgName] = f.gsArgVal;
                    });
                    body.forEach(n => interp(n));
                    formal.forEach(f => {
                        if(Object.hasOwn(ents, f.gsArgName)) runtime.scope[f.gsArgName] = ents[f.gsArgName];
                        else delete runtime.scope[f.gsArgName];
                    });
                }
            });
            runtime.scope[name] = gsf;
            break;
        }
        case "MethodDeclaration": {
            const { type, mods, name, params } = node.val[0];
            const bodyNode = node.val[1];
            const body = bodyNode.node.val;
            //gsMethodDesire: boolean, gsMethodType: GSType, gsMethodName: string, gsMethodAttach: GSType|GSType[], gsMethodArgs: GSArg[], gsMethodBody: function
            //gsArgName: string, gsArgVal: Object, gsArgDesire: boolean, gsArgType: GSType
            const ents = {};
            const gsm = new moduleDev.GSMethod({
                gsMethodDesire: mods.includes("desire"),
                gsMethodType: runtime.scope.entity,
                gsMethodName: name,
                gsMethodAttach: runtime.scope.entity,
                gsMethodArgs: params.map(p => {
                    const parsed = parseParam(p);
                    const arg = new moduleDev.GSArg({
                        gsArgName: parsed.name,
                        gsArgVal: parsed.val,
                        gsArgDesire: parsed.desire,
                        gsArgType: parsed.type
                    });
                    return arg;
                }),
                gsMethodBody: (target, ...args) => {
                    const formal = [...gsm.gsMethodArgs];
                    formal.forEach((arg, i) => {
                        const val = args[i] !== undefined ? args[i] : arg.gsArgVal;
                        arg.gsArgVal = val;
                    });
                    runtime.scope["target"] = target;
                    formal.forEach(f => {
                        if(Object.hasOwn(runtime.scope, f.gsArgName)) ents[f.gsArgName] = runtime.scope[f.gsArgName];
                        runtime.scope[f.gsArgName] = f.gsArgVal;
                    });
                    body.forEach(n => interp(n));
                    formal.forEach(f => {
                        if(Object.hasOwn(ents, f.gsArgName)) runtime.scope[f.gsArgName] = ents[f.gsArgName];
                        else delete runtime.scope[f.gsArgName];
                    });
                    delete runtime.scope["target"];
                }
            });
            runtime.scope[name] = gsm;
            break;
        }
        case "PropDeclaration": {
            const { name, getProp, setProp, mods } = node.val;
            // gsPropDesire: boolean, gsPropAttach: GSType|GSType[], gsPropName: string, gsPropGet: function, gsPropSet: function
            //gsFuncDesire: boolean, gsFuncType: GSType, gsFuncName: string, gsFuncArgs: GSArg[], gsFuncBody: function
            const gsp = new moduleDev.GSProp({
                gsPropName: name,
                gsPropDesire: mods.desire,
                gsPropAttach: mods.attach,
                gsPropGet: new GSFunc({
                    gsPropDesire: false, gsFuncType: runtime.scope.entity,
                    gsFuncName: "PROPERTY-GET", gsFuncArgs: [],
                    gsFuncBody: getProp
                }),
                gsPropSet: new GSFunc({
                    gsPropDesire: false, gsFuncType: runtime.scope.entity,
                    gsFuncName: "PROPERTY-SET", gsFuncArgs: [
                        new GSArg({
                            gsArgName: "value",
                            gsArgval: undefined,
                            gsArgDesire: false,
                            gsArgType: runtime.scope.entity
                        })
                    ],
                    gsFuncBody: setProp
                })
            });
        }
        
        case "ArrayAccess":
            const [arr, poses] = node.val;
            let els = [];
            if(!Object.hasOwn(runtime.scope, arr)) throw new Error("Cannot index undefined.");
            const entry = runtime.scope[arr];
            if(!Array.isArray(entry) && typeof entry != "string") {
                console.warn(`Warning: attempting to index non-array '${arr}'. (content: ${JSON.stringify(entry)})`);
                const string = JSON.stringify(entry);
                for(let i = 0; i < poses.length; i++) els.push(string.at(poses[i]));
            } else for(let i = 0; i < poses.length; i++) els.push(entry.at(poses[i]));
            return els;
        
        case "ConditionalHeader":
            const [header, headerCond, condBody] = node.val;
            // simple runner, goes through the body and evaluates it
            const exec = () => condBody.node.val.forEach(v => interp(v));
            // check header type to determine what to do
            if(header == "if") {
                // resolve conditional
                if(resolveCond(headerCond)) exec();
                return;
            }
            if(header == "while") {
                // to prevent infinite loops, use a loop tracker
                // where `n` is the number of times its looped
                // to allow infinite loops, toggle infinite buffering
                // in config.json (see https://github.com/BeanTheAlien/GhostScript/wiki/infinite_buffering)
                let n = 0;
                while(resolveCond(headerCond)) {
                    // if it exceeds 1M, its considered an infinite loop and it should break
                    if(n > 1000000) {
                        console.log(`While loop max iterations reached. (condition: '${JSON.stringify(headerCond)}')`);
                        break;
                    }
                    exec();
                    n++;
                }
            }
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
        const realURL = `${raw}/${url}`;
        const res = await fetch(realURL);
        if(!res.ok) throw new HTTPError(res, realURL);
        const text = await res.text();
        return text;
    } catch(e) {
        console.error(e);
    }
}
async function fetchjson(url) {
    try {
        const realURL = `${raw}/modules/${url}/index.json`;
        const res = await fetch(realURL);
        if(!res.ok) throw new HTTPError(res, realURL);
        const json = await res.json();
        return json;
    } catch(e) {
        console.error(e);
    }
}
async function fetchModuleDev() {
    const js = await fetchRaw("dev/module_dev.js");
    const module = { exports: {} };
    const wrapped = new Function("module", "exports", js);
    wrapped(module, module.exports);
    moduleDev = module.exports;
}
async function hasRemote(url) {
    try {
        const res = await fetch(`${raw}/${url}`);
        return res.ok;
    } catch(e) {
        console.error(e);
    }
}
async function hasJSON(url) {
    return await hasRemote(`modules/${url}/index.json`);
}
async function hasFile(url) {
    return await hasRemote(`modules/${url}.js`);
}
function isLocal(dir) {
    return fs.existsSync(path.join(__dirname, dir));
}
function getLocal(dir) {
    return fs.readFileSync(path.join(__dirname, dir), "utf8");
}
// async function getFile(root, name) {
//     try {
//         const res = await fetch(raw(`modules/${root}/${name}.js`));
//         if(!res.ok) throw new Error(`HTTP error: ${res.status}`);
//         const data = res.text();
//         return data;
//     } catch(e) {
//         console.error(e);
//     }
// }
async function resolveDeps(file) {
    if(file.meta && file.meta.deps) {
        if(Array.isArray(file.meta.deps)) {
            for(const d of file.meta.deps) {
                // resolves file vs directory
                // possible to depend on an entire directory
                const dep = await getModule(raw, d.endsWith(".js") ? d.slice(0, -3) : d);
                inject(dep);
            }
        } else throw new Error(`Invalid type received for dependencys array. (expected: 'array', got: '${typeof file.meta.deps}')`);
    }
}
async function getModule(...parts) {
    if(!moduleDev) await fetchModuleDev();
    const url = parts.join("/");
    // check if the URL has a index.json file
    if(await hasJSON(url)) {
        // recurse through all the files
        const index = await fetchjson(url);
        for(const f of index.files) {
            // retrieve the file (removes '.js' ending)
            const file = await getModule(url, f.slice(0, -3));
            inject(file);
            await resolveDeps(file);
        }
        return 0;
    }
    // check if the file is a single JS file
    if(await hasFile(url)) {
        // get the file and its content
        const js = await fetchRaw(`modules/${url}.js`);
        const module = { exports: {} };
        const wrapped = new Function("require", "module", "exports", "runtime", "module_dev", js);
        wrapped(require, module, module.exports, runtime, moduleDev);

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

        const meta = m.ghostmodule || {
            name: parts.join("."),
            defroot: parts.join("."),
            reqroot: true
        };
        await resolveDeps({ meta });

        return {
            meta,
            exports: flat
        };
    }
    // check for a local file
    if(isLocal(url)) {
        const js = getLocal(url);
        const module = { exports: {} };
        const wrapped = new Function("require", "module", "exports", "runtime", "module_dev", js);
        wrapped(require, module, module.exports, runtime, moduleDev);
        const m = module.exports || {};
        const flat = {};
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
        for(const [k, v] of Object.entries(m)) {
            if(k == "ghostmodule") continue;
            if(!(k in flat)) flat[k] = v;
        }
        const meta = m.ghostmodule || {
            name: parts.join("."),
            defroot: parts.join("."),
            reqroot: true
        };
        await resolveDeps({ meta });

        return {
            meta,
            exports: flat
        };
    }
    // run a system search to locate the file
    const { stdout, stderr } = await execAsync(`where /R C:\\ ${url}`);
    if(stderr.length) console.error(stderr);
    else {
        const js = fs.readFileSync(stdouut, "utf8");
        const module = { exports: {} };
        const wrapped = new Function("require", "module", "exports", "runtime", "module_dev", js);
        wrapped(require, module, module.exports, runtime, moduleDev);
        const m = module.exports || {};
        const flat = {};
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
        for(const [k, v] of Object.entries(m)) {
            if(k == "ghostmodule") continue;
            if(!(k in flat)) flat[k] = v;
        }
        const meta = m.ghostmodule || {
            name: parts.join("."),
            defroot: parts.join("."),
            reqroot: true
        };
        await resolveDeps({ meta });

        return {
            meta,
            exports: flat
        };
    }

    throw new Error(`Could not find module '${url}'.`);
}

async function loadRemoteModule(segments, logicalPath, visited) {
    const remoteBase = `${baseURL()}/${segments.join("/")}`;

    if (visited.has(remoteBase)) {
        return { meta: {}, exports: {} };
    }
    visited.add(remoteBase);

    // 1. Directory with index.json
    if (await remoteExists(remoteBase + "/index.json")) {
        const index = await fetchJSON(remoteBase + "/index.json");

        let combined = {
            meta: { name: logicalPath, defroot: logicalPath, reqroot: true },
            exports: {}
        };

        for (const file of index.files) {
            const childSegments = [...segments, file];
            const childLogical = `${logicalPath}/${file}`;

            const child = await loadRemoteModule(childSegments, childLogical, visited);
            Object.assign(combined.exports, child.exports);
        }

        return combined;
    }

    // 2. Single JS file
    if (await remoteExists(remoteBase + ".js")) {
        const js = await fetchText(remoteBase + ".js");
        const moduleObj = { exports: {} };

        const wrapped = new Function("require", "module", "exports", "runtime", "module_dev", js);

        wrapped(require, moduleObj, moduleObj.exports, runtime, moduleDev);

        return finalizeRemote(logicalPath, moduleObj);
    }

    throw new Error(`Cannot find remote module '${logicalPath}'`);
}

async function remoteExists(url) {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
}

async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.text();
}

function finalizeRemote(name, moduleObj) {
    const flat = {};

    const arrays = [
        moduleObj.exports.vars,
        moduleObj.exports.funcs,
        moduleObj.exports.methods,
        moduleObj.exports.classes,
        moduleObj.exports.types,
        moduleObj.exports.props,
        moduleObj.exports.mods,
        moduleObj.exports.errors,
        moduleObj.exports.events,
        moduleObj.exports.operators,
        moduleObj.exports.directives
    ];

    for (const arr of arrays) {
        if (!Array.isArray(arr)) continue;

        for (const item of arr) {
            const n =
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

            if (n) flat[n] = item;
        }
    }

    for (const [k, v] of Object.entries(moduleObj.exports)) {
        if (k !== "ghostmodule" && !(k in flat)) {
            flat[k] = v;
        }
    }

    const meta = moduleObj.exports.ghostmodule || {
        name,
        defroot: name,
        reqroot: true
    };

    return { meta, exports: flat };
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
    // resolve if it is in the public scope
    if(Object.hasOwn(runtime.scope, name) && runtime.scope[name] instanceof moduleDev.GSMethod) {
        const m = runtime.scope[name];
        if(Array.isArray(m.gsMethodAttach)) {
            if(m.gsMethodAttach.some(t => typeCheck(t, targetType))) return m;
        } else if(typeCheck(m.gsMethodAttach, targetType)) return m;
    }

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

function resolveCond(cond) {
    if(cond[0].type == "Operand") throw new Error(`Unexpected operator in conditional. (got '${cond[0].val}')`);
    const proccess = () => {
        if(cond[2]) {
            const [lhs,, rhs] = cond;
            if(lhs.type == "Identifier") {
                if(rhs.type == "Identifier") {
                    return { lhs: runtime.scope[lhs.val], rhs: runtime.scope[rhs.val] };
                } else {
                    return { lhs: runtime.scope[lhs.val], rhs: rhs.val };
                }
            } else {
                if(rhs.type == "Identifier") {
                    return { lhs: lhs.val, rhs: runtime.scope[rhs.val] };
                } else {
                    return { lhs: lhs.val, rhs: rhs.val };
                }
            }
        } else {
            throw new Error(`Cannot compare to none. (condition: ${cond})`);
        }
    }
    if(cond.length == 1) {
        const ent = cond[0];
        if(ent.type == "Identifier") {
            return Object.hasOwn(runtime.scope, ent.val) && runtime.scope[ent.val] != undefined;
        } else {
            return ent.val != undefined;
        }
    }
    // has a logical operator
    const hasLog = cond.some(c => c.type == "Operand" && (c.val == "||" || c.val == "&&"));
    // identifiy chunks (split by logical operators)
    if(hasLog) {
        const chunks = [];
        let cur = [];
        for(let i = 0; i < cond.length; i++) {
            const x = cond[i];
            if(x.type == "Operand" && (x.val == "||" || x.val == "&&")) {
                chunks.push(cur);
                chunks.push(x.val);
                cur = [];
            } else {
                cur.push(x);
            }
        }
        if(cur.length > 0) chunks.push(cur);
        if(!Array.isArray(chunks[0])) throw new Error(`Unexpected logical operator. (condition: ${cond})`);
        if(!Array.isArray(chunks[chunks.length - 1])) throw new Error(`Unfinished conditional. (condition: ${cond})`);
        const resolveLogical = () => {
            let acc = resolveCond(chunks[0]);
            for(let i = 1; i < chunks.length; i += 2) {
                const op = chunks[i];
                const rhs = resolveCond(chunks[i + 1]);
                if(op == "&&") acc = acc && rhs;
                else acc = acc || rhs;
            }
            return acc;
        }
        return resolveLogical();
    }
    if(cond[0].type == "Not") {
        if(cond[1]) {
            const ent = cond[1];
            if(ent.type == "Identifier") {
                return !Object.hasOwn(runtime.scope, ent.val) || runtime.scope[ent.val] == undefined;
            } else {
                return ent.val == undefined;
            }
        } else {
            throw new Error("Expected statement after not operator.");
        }
    }
    const opr = cond[1].val;
    const { lhs, rhs } = proccess();
    if(opr == "==") return lhs == rhs;
    if(opr == "!=") return lhs != rhs;
    if(opr == "<") return lhs < rhs;
    if(opr == ">") return lhs > rhs;
    if(opr == "<=") return lhs <= rhs;
    if(opr == ">=") return lhs >= rhs;
}

// function preprocess(tokens) {
//     // this should handle: variables, functions, methods, properties, types, classes, imports
//     let i = 0;
//     while(i < tokens.length) {}
// }

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
