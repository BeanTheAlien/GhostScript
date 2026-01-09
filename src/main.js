const fs = require("fs");
const path = require("path");
const https = require("https");
const cp = require("child_process");
const util = require("util");
const math = require("mathjs");
const execAsync = util.promisify(cp.exec);
// const ContextAwarenessAPI = require("../api/ContextAwareness/contextawareness.js");
// const AutoDebuggerAPI = require("../api/AutoDebugger/autodebugger.js");
// const ContextAwareness = new ContextAwarenessAPI.ContextAwarenessAPI();
// const AutoDebugger = new AutoDebuggerAPI.AutoDebuggerAPI();

class HTTPError extends Error {
    constructor(response, url) {
        const message = `HTTP error: ${response.status} (${response.statusText}) (url: ${url})`;
        super(message);
        this.name = "HTTPError";
    }
}
class ErrRoot extends Error {
    constructor(msg, name, token) {
        // - for col - 1
        // ^ for len val
        // - for len str ln - col
        super(`${msg} (ln ${token.ln}, col ${token.col}`); //todo: pass tokens
        this.name = name;
    }
}
class UnexpectedTokenError extends ErrRoot { constructor(token) { super(`Unexpected token '${token.val}' with id '${token.id}'.`, "UnexpectedTokenError", token); } }
class UnexpectedTerminationError extends ErrRoot { constructor(type, token) { super(`Unexpected termination of ${type}.`, "UnexpectedTerminationError", token); } }
class UnterminatedStatementError extends ErrRoot { constructor(type, char, token) { super(`Unterminated ${type} statement. (missing '${char}').`, "UnterminatedStatementError", token); } }
class gsSyntaxError extends ErrRoot { constructor(char, type, token) { super(`Expected ${char} for ${type}.`, "SyntaxError", token); } }
class gsTypeError extends ErrRoot { constructor(received, expected, type, token) { super(`Expected '${expected}' for ${type}, got '${received}'.`, "TypeError", token); }  }
class DuplicateKeyError extends ErrRoot { constructor(k, token) { super(`Received duplicate key '${k}'.`, "DuplicateKeyError", token); } }

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
var config = {};

if(fs.existsSync("C:\\GhostScript")) {
    config = JSON.parse(fs.readFileSync("C:\\GhostScript\\config.json"));
}

class Runtime {
    constructor() {
        this.modules = {};
        this.scope = {};
    }
    has(k) {
        return Object.hasOwn(this.scope, k);
    }
    get(k) {
        return this.scope[k];
    }
    set(k, v) {
        this.scope[k] = v;
    }
    rm(k) {
        delete this.scope[k];
    }
}
class Log {
    constructor() {
        this.log = [];
    }
    write(msg) {
        const date = new Date();
        this.log.push(`${msg} (${date.toISOString()})`);
    }
    make(t, n, v, s) {
        this.write(`Created ${t} ${n} with value ${v} in scope ${s}.`);
    }
    MkVar(n, v, s) {
        this.make("variable", n, v, s);
    }
    MkFn(n, v, s) {
        this.make("function", n, v, s);
    }
    MkMth(n, v, s) {
        this.make("method", n, v, s);
    }
    asgn(t, n, v) {
        this.write(`Assigned ${t} ${n} to ${v}.`);
    }
    AsgnVar(n, v) {
        this.asgn("variable", n, v);
    }
    AsgnProp(n, v) {
        this.asgn("property", n, v);
    }
    CallFn(n, a) {
        this.write(`Called function ${n} with arguments ${a}.`);
    }
    CallMth(n, a, t) {
        this.write(`Called method ${n} with arguments ${a} on target ${t}.`);
    }
    gets(t, n) {
        this.write(`Got ${t} ${n}.`);
    }
    GetVar(n) {
        this.gets("variable", n);
    }
    GetFn(n) {
        this.gets("function", n);
    }
    GetMth(n) {
        this.gets("method", n);
    }
    GetProp(n) {
        this.gets("property", n);
    }
}
class Scope {
    constructor(cont) {
        this.cont = cont;
    }
    has(k) {
        return Object.hasOwn(this.cont, k);
    }
    get(k) {
        return this.cont[k];
    }
    set(k, v) {
        this.cont[k] = v;
    }
    rm(k) {
        delete this.cont[k];
    }
}

var runtime = new Runtime();
runtime.set("true", true);
runtime.set("false", false);
runtime.set("null", null);
runtime.set("undefined", undefined);
var moduleDev = null;
const raw = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/main/ghost";
const log = new Log();
const oprList = ["==", "!=", ">=", "<=", "&&", "||", "=>", "<", ">"];

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
    let ln = 1;
    let col = 0;
    const tk = (id, val, ln, col) => tokens.push({ id, val, ln, col });
    while(i < script.length) {
        let char = script[i];
        // skip whitespace
        if(char == "\n") {
            i++;
            ln++;
            col = 0;
            continue;
        }
        if(/\s/.test(char)) {
            i++;
            col++;
            continue;
        }
        // line comments
        if(char == "/" && script[i + 1] == "/") {
            while(i < script.length && script[i] != "\n") {
                i++;
                col++;
            }
            i++;
            ln++;
            col = 0;
            continue;
        }
        // block comments
        if(char == "/" && script[i + 1] == "*") {
            i += 2;
            col += 2;
            while(i < script.length && !(script[i] == "*" && script[i+1] == "/")) {
                if(script[i] == "\n") {
                    ln++;
                    col = 0;
                } else col++;
                i++;
            }
            i += 2;
            col += 2;
            continue;
        }

        // numbers
        if(/\d/.test(char)) {
            const startLn = ln;
            const startCol = col;
            let val = "";
            while(i < script.length && /\d|\./.test(script[i])) {
                val += script[i];
                col++;
                i++;
            }
            tk("num", val, startLn, startCol);
            continue;
        }
        if(char == "-" && (!tokens[i-1] || ["opr", "lparen"].includes(tokens[i-1].id))) {
            const startLn = ln;
            const startCol = col;
            let val = "-";
            i++;
            while(i < script.length && /\d|\./.test(script[i])) {
                val += script[i];
                col++;
                i++;
            }
            tk("num", val, startLn, startCol);
            continue;
        }

        // identifiers or keywords
        if(/[a-zA-Z_]/.test(char)) {
            let val = "";
            const startLn = ln;
            const startCol = col;
            while(i < script.length && /[a-zA-Z0-9_]/.test(script[i])) {
                val += script[i];
                col++;
                i++;
            }
            const keywords = [
                "var", "import", "if", "else", "while", "return", "class",
                "function", "method", "prop", "target", "builder", "this",
                "new"
            ];
            const mods = [
                "desire", "const", "dedicated", "public", "private", "protected"
            ];
            const type = keywords.includes(val) ? "keyword" : mods.includes(val) ? "mod" : "id";
            tk(type, val, startLn, startCol);
            continue;
        }

        // strings
        if(char == "\"" || char == "'") {
            const quote = char;
            let val = "";
            const startLn = ln;
            const startCol = col;
            i++;
            col++;
            while(i < script.length && script[i] != quote) {
                if(script[i] == "\n") {
                    ln++;
                    col = 0;
                } else {
                    col++;
                }
                val += script[i];
                i++;
            }
            i++; // skip closing quote
            col++;
            tk("string", val, startLn, startCol);
            continue;
        }

        // two-char operators
        const twoChar = script.slice(i, i + 2);
        if(["==", "!=", ">=", "<=", "&&", "||", "=>"].includes(twoChar)) {
            const startLn = ln;
            const startCol = col;
            col += 2;
            i += 2;
            tk("opr", twoChar, startLn, startCol)
            continue;
        }

        // single-char operators
        if("+-*/%<>".includes(char)) {
            const startLn = ln;
            const startCol = col;
            col++;
            i++;
            tk("opr", char, startLn, startCol);
            continue;
        }
        if(char == "=") {
            const startLn = ln;
            const startCol = col;
            i++;
            col++;
            tk("eqls", char, startLn, startCol);
            continue;
        }
        if(char == ",") {
            const startLn = ln;
            const startCol = col;
            i++;
            col++;
            tk("comma", char, startLn, startCol);
            continue;
        }
        if(char == ".") {
            const startLn = ln;
            const startCol = col;
            i++;
            col++;
            tk("dot", char, startLn, startCol);
            continue;
        }
        if(char == ";") {
            const startLn = ln;
            const startCol = col;
            i++;
            col++;
            tk("semi", char, startLn, startCol);
            continue;
        }
        if(char == ":") {
            const startLn = ln;
            const startCol = col;
            i++;
            col++;
            tk("colon", char, startLn, startCol);
            continue;
        }

        if(char == "(" || char == ")") {
            const startLn = ln;
            const startCol = col;
            const type = char == "(" ? "lparen" : "rparen";
            i++;
            col++;
            tk(type, char, startLn, startCol);
            continue;
        }

        if(char == "[" || char == "]") {
            const startLn = ln;
            const startCol = col;
            const type = char == "[" ? "lbracket" : "rbracket";
            i++;
            col++;
            tk(type, char, startLn, startCol);
            continue;
        }

        if(char == "{" || char == "}") {
            const startLn = ln;
            const startCol = col;
            const type = char == "{" ? "lbrace" : "rbrace";
            i++;
            col++;
            tk(type, char, startLn, startCol);
            continue;
        }
        if(char == "!") {
            const startLn = ln;
            const startCol = col;
            i++;
            col++;
            tk("not", char, startLn, startCol);
            continue;
        }

        // if we reach here, it's unknown
        const startLn = ln;
        const startCol = col;
        i++;
        col++;
        tk("unknown", char, startLn, startCol);
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
            if(runtime.has(k)) {
                console.warn(`Skipping import of '${k}' from ${m.meta.name}: name conflict in global scope`);
                continue;
            }
            runtime.set(k, v);
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
            if(!imp.module.length) throw new UnexpectedTerminationError("import", tk);
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
    let depth = 0;
    // skip opening brace
    i++;
    while(i < tokens.length) {
        const tk = tokens[i];
        if(tk.id == "lbrace") depth++;
        if(tk.id == "rbrace") depth--;
        if(depth == 0) break;
        body.push(tk);
        i++;
    }
    i++;
    // Handle unterminated block statements
    if(depth > 0) throw new UnterminatedStatementError("block", "}", tokens[i - 1]);
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
        if(tokens[i].id != "lparen") throw new gsSyntaxError("left paren", "conditional header", tokens[i]);
        // move inside
        i++;
        if(tokens[i].id == "rparen") throw new UnexpectedTerminationError("conditional header", tokens[i]);
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
        if(depth > 0) throw new UnterminatedStatementError("conditional statement", ")", tokens[i - 1]);
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
    // for loop
    if(header == "for") {
        i++;
        const loop = [];
        let depth = 0;
        while(i < tokens.length) {
            const tk = tokens[i];
            if(tk.id == "lparen") depth++;
            if(tk.id == "rparen") depth--;
            if(depth == 0) break;
            loop.push(tk);
            i++;
        }
        if(depth > 0) throw new UnterminatedStatementError("block", "}", tokens[i - 1]);
        const chunks = [];
        let curArg = [];
        let j = 0;
        while(j < loop.length) {
            const tk = loop[j];
            if(tk.id == "semi") {
                if(curArg.length) chunks.push(curArg);
                curArg = [];
            } else {
                curArg.push(tk);
            }
            j++;
        }
        if(curArg.length) chunks.push(curArg);
        if(!chunks.length) throw new UnexpectedTerminationError(tokens[i]);
        if(chunks.length == 1) {
            // just an expression
            const expr = parseExpr(chunks, 0);
            if(typeof expr.node.val != "number") throw new gsTypeError(typeof expr.node.val, "number", chunks[0]);
            return { node: { type: "ForLoopMini", val: expr.node }, next: i+1 };
        }
        if(chunks.length == 3) {
            // a full for loop
            const parsed = chunks.map((_, i) => parseExpr(chunks, i));
            return { node: { type: "ForLoopFull", val: parsed }, next: i+1 };
        }
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
// function isProp(tokens, i) {
//     // if at n tokens in, we see a lparen, then its a method
//     // use a counter to make it non-greedy
//     // if dot is hit, continue consuming (ie, array.length)
//     // once no more dots are found, thats the full prop ref
//     let c = 1;
//     while(i < tokens.length) {
//         if(c == 0) {
//             if(tokens[i+1] && tokens[i+1].id == "lparen") return false;
//         }
//         if(tokens[i].id == "dot") {
//             c++;
//             i++;
//             continue;
//         }
//         i++;
//         c--;
//     }
//     return true;
// }
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
function parseObject(tokens, i) {
    let obj = {};
    // skip opening brace
    i++;
    if(tokens[i] && tokens[i].id == "rbrace") {
        return { obj, next: i + 1 };
    }
    let depth = 1;
    while(i < tokens.length) {
        if(tokens[i].id == "lbrace") depth++;
        if(tokens[i].id == "rbrace") depth--;
        if(depth <= 0) break;
        if(tokens[i].id == "comma") {
            i++;
            continue;
        }
        const key = tokens[i].val;
        if(Object.hasOwn(obj, key)) throw new DuplicateKeyError(key, tokens[i]);
        if(tokens[i+1] && tokens[i+1].id == "colon") {
            i += 2;
            const val = parseExpr(tokens, i);
            obj[key] = val.node;
            i = val.next;
        } else if(runtime.has(key)) {
            obj[key] = runtime.get(key);
            i++;
        } else throw new UnexpectedTokenError("object entry", key);
    }
    if(depth > 0) throw new UnterminatedStatementError("object", "}", tokens[i-1]);
    return { obj, next: i + 1 };
}
function parseEquation(tokens, i) {
    const eq = [];
    let depth = 1;
    while(i < tokens.length && depth > 0) {
        const tk = tokens[i];
        if(["num", "id", "opr", "lparen", "rparen"].includes(tk.id)) {
            if(tk.val == "(") depth++;
            if(tk.val == ")") depth--;
            if(depth == 0) break;
            eq.push(tk.val);
            i++;
        } else break;
    }
    return { eq, next: i };
}
function parseMath(tokens, i) {
    let n = 0;
    // if the first value isnt a number, then its not an equation
    if(tokens[i].id != "num" && (tokens[i].id == "id" && !runtime.has(tokens[i].val))) throw new Error(`Non-equation found. (got '${tokens[i].id}')`);
    const eq = [];
    // find all the tokens that make up the equation
    while(i < tokens.length) {
        const tk = tokens[i];
        if(["num", "id", "opr", "lparen", "rparen"].includes(tk.id)) {
            eq.push(tk);
        } else throw new UnexpectedTokenError(tk);
    }
    let j = 0;
    while(j < eq.length) {
        const lhs = eq[j];
        if(eq[j+1]) {
            if(eq[j+1].id != "opr") throw new gsSyntaxError("operator", "math", eq[j+1]);
            const opr = eq[j+1];
            if(eq[j+2]) {
                if(eq[j+2].id == "opr") throw new gsSyntaxError("generic", "math", eq[j+2]);
                const rhs = eq[j+2];
                if(opr.val == "+") n += lhs + rhs;
            } else throw new UnexpectedTerminationError("math", opr);
        } else throw new UnexpectedTerminationError("math", lhs);
        j += 3;
    }
    while(i < tokens.length) {
        let lhs = tokens[i];
        // if there is an operator after lhs, continue solving
        // else, if there is a token, throw error (there needs to be an operator to work with)
        // else we break early (it is solved)
        if(tokens[i+1] && (tokens[i+1].id == "opr")) {
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
        if(tk.id == "comma") {
            i++;
            continue;
        }
        if(tk.id == "rbracket") return { poses, next: i + 1 };
        const expr = parseExpr(tokens, i);
        if(expr.node.type != "Literal" || typeof expr.node.val != "number") throw new gsTypeError(expr.node.type, "Literal", "array index", tokens[i]);
        poses.push(expr.node.val);
        i = expr.next;
    }
    throw new UnterminatedStatementError("array index", "]", tokens[i-1]);
}
function parsePropGet(tokens, i) {
    let props = [];
    i += 2;
    while(i < tokens.length) {
        const tk = tokens[i];
        if(tk.id == "comma") {
            i++;
            continue;
        }
        if(tk.id == "rbracket") return { props, next: i + 1 };
        const expr = parseExpr(tokens, i);
        props.push(expr.node.val);
        i = expr.next;
    }
    throw new UnterminatedStatementError("property get", "]", tokens[i-1]);
}
function parseCond(tokens, i) {
    const cond = [];
    // terminate early (resolveCond will handle)
    if(!tokens[i]) return { cond, next: i };
    let depth = 0;
    while(i < tokens.length) {
        const tk = tokens[i];
        // greedily find all supported types for a conditional
        // then return once they are all found with the next position
        if(["string", "num", "id", "opr", "lparen", "rparen"].includes(tk.id)) {
            if(tk.val == "(") depth++;
            if(tk.val == ")") depth--;
            if(depth < 0) break;
            cond.push(tk);
            i++;
        } else break;
    }
    return { cond, next: i };
}
function parseParamList(tokens, i) {
    const list = [];
    let curArg = [];
    while(i < tokens.length) {
        if(tokens[i].id == "rparen") break;
        // proccess params
        if(tokens[i].id == "comma") {
            list.push(curArg);
            curArg = [];
            i++;
            continue;
        }
        curArg.push(tokens[i]);
        i++;
    }
    if(curArg.length) list.push(curArg);
    const parsedList = [];
    let j = 0;
    while(j < list.length) {
        parsedList.push(parseParam(list[j]));
    }
    return { list: parsedList, next: i };
}
function findEndBracket(tokens, i) {
    while(i < tokens.length) {
        if(tokens[i].id == "rbracket") return i+1;
        i++;
    }
    throw new UnterminatedStatementError("array", "]", tokens[i]);
}
function parseClass(tokens, i) {
    let body = [];
    let depth = 1;
    // skip opening brace
    i++;
    while(i < tokens.length) {
        const tk = tokens[i];
        if(tk.id == "lbrace") depth++;
        if(tk.id == "rbrace") depth--;
        if(depth == 0) break;
        body.push(tk);
        i++;
    }
    i++;
    // Handle unterminated block statements
    if(depth > 0) throw new UnterminatedStatementError("block", "}", tokens[i - 1]);
    const meta = {};
    let j = 0;
    while(j < body.length) {
        const tk = body[j];
        console.log(tk);
        if(tk.id == "keyword" && tk.val == "builder") {
            const builder = [];
            j++;
            console.log(body[j]);
            const list = parseParamList(body, j);
            builder.push(list.list);
            j = list.next;
            console.log(list);
            const block = parseBlock(body, j);
            meta.builder = block.node.val;
            j = block.next;
            continue;
        }
        if(tk.id == "id" && tokens[j+1] && tokens[j+1].id == "lparen") {
            const func = [];
            j++;
            const list = parseParamList(tokens, j);
            func.push(list.list);
            j = list.next;
            const block = parseBlock(body, j);
            meta[tk.val] = block.node.val;
            j = block.next;
            continue;
        }
        if(tk.id == "keyword" && tk.val == "this") {
            if(tokens[j+1]) {
                j++;
                if(tokens[j] && tokens[j].id == "dot") j++;
                if(tokens[j] && tokens[j].id == "id") {
                    const id = tokens[j].val;
                    if(tokens[j+1] && tokens[j+1].id == "eqls") {
                        j += 2;
                        const val = parseExpr(tokens, j);
                        meta.fields[id] = val.node;
                        j = val.next;
                    }
                } else throw new UnexpectedTokenError(tokens[j]);
            } else throw new UnexpectedTerminationError("this", tk);
        }
        j++;
    }
    if(!meta.builder) meta.builder = [];
    return { meta, next: i };
}
function genInstance(meta, args) {
    const obj = {};
    for(const [k, v] of Object.entries(meta)) {
        if(k == "builder") continue;
        obj[k] = v;
    }
    const execBuilder = () => {
        let i = 0;
        const tokens = meta.builder;
        while(i < tokens.length) {
            const tk = tokens[i];
            if(tk.val == "this") {
                i++;
                if(tokens[i] && (tokens[i].id == "Dot" || tokens[i].id == "Identifier")) {
                    if(tokens[i].id == "Dot") {
                        i++;
                    }
                    const id = tokens[i].val;
                    i += 2;
                    const val = parseExpr(tokens, i);
                    obj[id] = val.node.val;
                    i = val.next;
                }
            }
        }
    }
}
function getLine(tokens, ln) {
    return tokens.filter(tk => tk.ln == ln).map(tk => tk.val).join("");
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
        const type = header.type == "function" ? "FunctionDeclaration" : "MethodDeclaration";
        return { node: { type, val: [header, funcBody] }, next: funcBody.next + 1 };
    }
    if(token.id == "keyword" && (token.val == "if" || token.val == "while")) {
        const condHeader = parseBlockHeader(tokens, i);
        const header = condHeader.node.val[0];
        const condBody = parseBlock(tokens, condHeader.next);
        return { node: { type: "ConditionalHeader", val: [header, condHeader.node.val[1], condBody] }, next: condBody.next + 1 };
    }
    // if(token.id == "keyword" && token.val == "class") {
    //     const classHeader = parseBlockHeader(tokens, i);
    //     const header = classHeader.node.val[0];
    //     const body = parseClass(tokens, classHeader.next);
    //     console.log(body);
    //     return { node: { type: "ClassDeclaration", val: [header, body] }, next: body.next + 1 };
    // }
    if(token.id == "id" && tokens[i+1] && tokens[i+1].id == "lbracket") {
        const propSet = parsePropGet(tokens, i);
        if(tokens[propSet.next] && tokens[propSet.next].id == "eqls") {
            if(!tokens[propSet.next+1]) throw new UnexpectedTerminationError("property set", tokens[propSet.next]);
            // treat it as a property set
            if(!propSet.props.length) throw new UnexpectedTerminationError("property set", tokens[propSet.next-1]);
            if(propSet.props.length > 1) {
                // then it must be assigning to an array, else throw error
                if(tokens[propSet.next+1].id != "lbracket") throw new gsSyntaxError("array", "multi-property set", tokens[propSet.next+1]);
                const arr = parseArr(tokens, propSet.next+1);
                return { node: { type: "PropSet", val: [token, propSet.props, arr.node] }, next: arr.next }
            }
            const expr = parseExpr(tokens, propSet.next+1);
            return { node: { type: "PropSet", val: [token, propSet.props, expr.node] }, next: expr.next };
        }
        if(runtime.has(token.val) && Array.isArray(runtime.get(token.val))) {
            const access = parseArrAccess(tokens, i);
            return { node: { type: "ArrayAccess", val: [token.val, access.poses] }, next: access.next };
        } else if(runtime.has(token.val)) {
            // treat it as a property get
            const propGet = parsePropGet(tokens, i);
            return { node: { type: "PropGet", val: [token, propGet.props] }, next: propGet.next };
        }
    }
    //console.log(tokens)
    if(token.id == "id" && tokens[i+1] && tokens[i+1].id == "opr" && tokens[i+2] && ((tokens[i+2].id == "opr" && tokens[i+1].val == tokens[i+2].val) || tokens[i+2].id == "eqls") && (!tokens[i+3] || tokens[i+3].id == "num" || tokens[i+3].id == "id")) {
        let quan = 1;
        // supports <id><opr><opr|eqls><num|id>
        // where <num|id> => <num>
        if(tokens[i+3]) quan = tokens[i+3].id == "num" ? Number(tokens[i+3].val) : typeof runtime.get(tokens[i+3].val) == "number" ? Number(runtime.get(tokens[i+3].val)) : 1;
        // double opr, like ++, --
        return { node: { type: "IdentifierOperation", val: [token.val, tokens[i+1].val, quan] }, next: i+(tokens[i+3] ? 3 : 2) };
    }
    if((token.id == "id" || token.id == "string" || token.id == "num") && tokens[i+1] && (tokens[i+1].id == "opr" && !oprList.includes(tokens[i+1].val))) {
        const m = parseEquation(tokens, i);
        return { node: { type: "Literal", val: math.evaluate(m.eq.join(""), { ...runtime.scope }) }, next: m.next };
    }
    // to resolve operator support extension, check if the following value is an opr
    // supporting multiple possible lhs types
    // returns a literal boolean value
    if((token.id == "id" || token.id == "string" || token.id == "num") && tokens[i+1] && (tokens[i+1].id == "opr" && oprList.includes(tokens[i+1].val))) {
        const expr = parseCond(tokens, i);
        const res = resolveCond(expr.cond);
        return { node: { type: "Literal", val: res }, next: expr.next };
    }
    if(token.id == "lbrace") {
        const obj = parseObject(tokens, i);
        const object = obj.obj;
        return { node: { type: "Literal", val: object }, next: obj.next };
    }
    // if(token.id == "keyword" && token.val == "new") {
    //     if(tokens[i+1] && tokens[i+1].id == "id") {
    //         i++;
    //         if(runtime.has(tokens[i])) {
    //             const args = parseArguments(tokens, i+1);
    //             return { node: { type: "InstanceCreation", val: [tokens[i].val, args.args] }, next: args.next };
    //         }
    //     }
    // }
    if(token.id == "id") return { node: { type: "Identifier", val: token.val }, next: i + 1 };
    if(token.id == "string") return { node: { type: "Literal", val: token.val }, next: i + 1 };
    if(token.id == "num") return { node: { type: "Literal", val: Number(token.val) }, next: i + 1 };
    if(token.id == "opr") return { node: { type: "Operand", val: token.val }, next: i + 1 };
    if(token.id == "lbracket") {
        const arr = parseArr(tokens, i);
        return { node: arr.node, next: arr.next };
    }
    // if(token.id == "lbrace") {
    //     const block = parseBlock(tokens, i);
    //     return { node: block.node, next: block.next };
    // }
    if(token.id == "not") return { node: { type: "Not", val: token.val }, next: i + 1 };
    if(token.id == "semi") return { node: { type: "Literal", val: token.val }, next: i + 1 };
    if(token.id == "keyword" && token.val == "target") return { node: { type: "Identifier", val: token.val  }, next: i + 1 };
    if(token.id == "dot") return { node: { type: "Dot", val: token.val }, next: i + 1 };
    throw new UnexpectedTokenError(token);
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
            if(runtime.has(node.val)) return runtime.scope[node.val];
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
                        if(runtime.has(f.gsArgName)) ents[f.gsArgName] = runtime.scope[f.gsArgName];
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
                        if(runtime.has(f.gsArgName)) ents[f.gsArgName] = runtime.get(f.gsArgName);
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
            if(!runtime.has(arr)) throw new Error("Cannot index undefined.");
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
                    if((Object.hasOwn(config, "infinite_buffering") ? config.infinite_buffering : false) == false && n > 1000000) {
                        console.log(`While loop max iterations reached. (condition: '${JSON.stringify(headerCond)}')`);
                        break;
                    }
                    exec();
                    n++;
                }
            }
            break;
        
        case "PropGet":
            const [token, props] = node.val;
            const vals = [];
            const ref = runtime.get(token.val);
            for(let i = 0; i < props.length; i++) vals.push(ref[props[i]]);
            return vals;
        case "ClassDeclaration": {
            const [header, body] = node.val;
            runtime.set(header, body);
            break;
        }
        case "PropSet": {
            const [asgn, props, val] = node.val;
            const ent = runtime.get(asgn.val);
            console.log(props);
            console.log(val);
            console.log(ent);
            for(let i = 0; i < props.length; i++) ent[i] = props[i];
            runtime.set(asgn.val, ent);
            break;
        }
        case "IdentifierOperation": {
            const [id, opr, quan] = node.val;
            let v = runtime.get(id);
            // console.log(id);
            // console.log(opr);
            // console.log(quan);
            if(opr == "+") v += quan;
            if(opr == "-") v -= quan;
            if(opr == "*") v *= quan;
            if(opr == "/") v /= quan;
            if(opr == "%") v %= quan;
            if(opr == "^") v = Math.pow(v, quan);
            runtime.set(id, v);
            break;
        }
        // case "InstanceCreation":
        //     const [cl, args] = node.val;
        //     return new interp({ type: "CallExpression", val: runtime.get(cl).meta.builder(args) });
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
async function processImport(js) {
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
        return await processImport(js);
    }
    // check for a local file
    if(isLocal(url)) {
        const js = getLocal(url);
        return await processImport(js);
    }
    // run a system search to locate the file
    const { stdout, stderr } = await execAsync(`where /R C:\\ ${url}`);
    if(stderr.length) throw new Error(stderr);
    else if(stdout.length) {
        const js = fs.readFileSync(stdout, "utf8");
        return await processImport(js);
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
    if(runtime.has(name) && runtime.get(name) instanceof moduleDev.GSMethod) {
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
            return runtime.has(ent.val) && runtime.scope[ent.val] != undefined;
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
                return !runtime.has(ent.val) || runtime.scope[ent.val] == undefined;
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
