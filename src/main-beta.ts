import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
import * as util from "util";
import * as mathjs from "mathjs";
const execAsync = util.promisify(cp.exec);

type ItemMap<K extends string | number | symbol, V> = { [x in K]: V };
type StringMap<V> = ItemMap<string, V>;
type GSObject = any;
type GSObjectMap = StringMap<GSObject>;
type GSModule = GSObjectMap;

function Exists(path: fs.PathLike): boolean {
    return fs.existsSync(path);
}
function Read(path: fs.PathLike, enc: BufferEncoding): string {
    return fs.readFileSync(path, enc);
}
function Write(path: fs.PathLike, cont: string) {
    fs.writeFileSync(path, cont);
}
function ReadJSON(path: fs.PathLike): object {
    return JSON.parse(ReadUTF(path));
}
function ReadUTF(path: fs.PathLike): string {
    return Read(path, "utf8");
}

class ErrRoot extends Error { constructor(name: string, msg: string) { super(msg); this.name = name; } }
class HTTPError extends ErrRoot { constructor(res: Response, url: string) { super("HTTPError", `HTTP Error: ${res.status} (${res.statusText}) (url: ${url})`); } }
class NoFileError extends ErrRoot { constructor() { super("NoFileError", "Cannot execute without 'file' parameter."); } }
class GSErr extends ErrRoot { constructor(name: string, msg: string, tk: Token) { super(name, `${msg} (ln ${tk.ln}, col ${tk.col})`); } }
class UnexpectedTokenError extends GSErr { constructor(tk: Token) { super("UnexpectedTokenError", `Unexpected token with id '${tk.id}'.`, tk); } }

const [,, ...args] = process.argv;
function flagFmt(flag: string): string {
    return `--${flag}`;
}
function hasFlag(flag: string): boolean {
    return args.includes(flagFmt(flag));
}
function getFlag(flag: string): string {
    return args[args.indexOf(flagFmt(flag))];
}

const file = hasFlag("test") ? "../test" : getFlag("file");
const verbose = hasFlag("verbose");
const debug = hasFlag("debug");
const safe = hasFlag("safe");
const beta = hasFlag("beta");

const config: ItemMap<string, string> = {};
if(Exists("C:\\GhostScript")) {
    Object.assign(config, ReadJSON("C:\\GhostScript\\config.json"));
}

class Runtime {
    modules: StringMap<GSModule>;
    scope: StringMap<any>;
    constructor() {
        this.modules = {};
        this.scope = {};
    }
    get(k: string): any {
        return this.scope[k];
    }
    set(k: string, v: any) {
        this.scope[k] = v;
    }
    rm(k: string) {
        delete this.scope[k];
    }
    has(k: string): boolean {
        return Object.hasOwn(this.scope, k);
    }
}
const runtime = new Runtime();
runtime.set("true", true);
runtime.set("false", false);
runtime.set("null", null);
runtime.set("undefined", undefined);

var moduleDev = null;
const rawLink = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/main/ghost";

async function main(): Promise<void> {
    const script = ReadUTF(`${file}.gst`);
    const tokens = await tokenize(script);
    await parser(tokens);
}
main();

type TokenID = "num" | "keyword" | "mod" | "id" | "string" | "opr" | "eqls" | "comma" | "dot" | "semi" | "colon" | "lparen" | "rparen" | "lbracket" | "rbracket" | "lbrace" | "rbrace" | "not" | "unknown";
type Token = { id: TokenID, val: string, ln: number, col: number };
type TokenList = Token[];
type ParsedID = "MemberExpression" | "CallExpression" | "Literal";
type Node = { type: ParsedID, val: any };
type Parsed = { node: Node, next: number };
type ParsedList = Parsed[];
type PrmParsed = Promise<Parsed>;
async function tokenize(script: string): Promise<TokenList> {
    const tokens: TokenList = [];
    let i = 0;
    let ln = 1;
    let col = 0;
    const tk = (id: TokenID, val: string, ln: number, col: number) => tokens.push({ id, val, ln, col });
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
        if(char == "/" && script[i+1] == "/") {
            while(i < script.length && script[i] != "\n") {
                i++;
            }
            i++;
            ln++;
            col = 0;
            continue;
        }
        // block comments
        if(char == "/" && script[i+1] == "*") {
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
            const sl = ln;
            const sc = col;
            let v = "";
            while(i < script.length && /\d|\./.test(script[i])) {
                v += script[i];
                col++;
                i++;
            }
            tk("num", v, sl, sc);
            continue;
        }
        if(char == "-" && (!tokens[i-1] || ["opr", "lparen"].includes(tokens[i-1].id))) {
            const sl = ln;
            const sc = col;
            let v = "-";
            i++;
            while(i < script.length && /\d|\./.test(script[i])) {
                v += script[i];
                col++;
                i++;
            }
            tk("num", v, sl, sc);
            continue;
        }
        // identifiers or keywords
        if(/[a-zA-Z_]/.test(char)) {
            let v = "";
            const sl = ln;
            const sc = col;
            while(i < script.length && /[a-zA-Z0-9_]/.test(script[i])) {
                v += script[i];
                col++;
                ln++;
            }
            const keywords = [
                "var", "import", "if", "else", "while", "return", "class",
                "function", "method", "prop", "target", "builder", "this",
                "new"
            ];
            const mods = [
                "desire", "const", "dedicated", "public", "private", "protected"
            ];
            const type = keywords.includes(v) ? "keyword" : mods.includes(v) ? "mod" : "id";
            tk(type, v, sl, sc);
            continue;
        }
        // strings
        if(char == "\"" || char == "'") {
            const q = char;
            let v = "";
            const sl = ln;
            const sc = col;
            i++;
            col++;
            while(i < script.length && script[i] != q) {
                if(script[i] == "\n") {
                    ln++;
                    col = 0;
                } else {
                    col++;
                }
                v += script[i];
                i++;
            }
            // skip closing
            i++;
            col++;
            tk("string", v, sl, sc);
            continue;
        }
        // two-char operators
        const twoChar = script.slice(i, i + 2);
        if(["==", "!=", ">=", "<=", "&&", "||", "=>"].includes(twoChar)) {
            const sl = ln;
            const sc = col;
            col += 2;
            i += 2;
            tk("opr", twoChar, sl, sc);
            continue;
        }
        // single-char operators
        if("+-*/%<>".includes(char)) {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("opr", char, sl, sc);
            continue;
        }
        if(char == "=") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("eqls", char, sl, sc);
            continue;
        }
        if(char == ",") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("comma", char, sl, sc);
            continue;
        }
        if(char == ".") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("dot", char, sl, sc);
            continue;
        }
        if(char == ";") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("semi", char, sl, sc);
            continue;
        }
        if(char == ":") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("colon", char, sl, sc);
            continue;
        }
        if(char == "(" || char == ")") {
            const sl = ln;
            const sc = col;
            const t = char == "(" ? "lparen" : "rparen";
            i++;
            col++;
            tk(t, char, sl, sc);
            continue;
        }
        if(char == "[" || char == "]") {
            const sl = ln;
            const sc = col;
            const t = char == "[" ? "lbracket" : "rbracket";
            i++;
            col++;
            tk(t, char, sl, sc);
        }
        if(char == "{" || char == "}") {
            const sl = ln;
            const sc = col;
            const t = char == "{" ? "lbrace" : "rbrace";
            i++;
            col++;
            tk(t, char, sl, sc);
        }
        if(char == "!") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("not", char, sl, sc);
            continue;
        }
        const sl = ln;
        const sc = col;
        i++;
        col++;
        tk("unknown", char, sl, sc);
    }
    return tokens;
}
async function parser(tks: TokenList): Promise<void> {
    let i = 0;
    while(i < tks.length) {}
}
function parsePrim(tks: TokenList, i: number): Parsed {
    const tk = tks[i];
    throw new UnexpectedTokenError(tk);
}
function parseExpr(tks: TokenList, i: number): Parsed {
    let { node, next } = parsePrim(tks, i);
    while(tks[next] && (tks[next].id == "dot" || tks[next].id == "lparen")) {
        const tk = tks[next];
        if(tk.id == "dot") {
            const prop = tks[next+1];
            node = {
                type: "MemberExpression",
                val: { obj: node, prop: prop.val }
            };
            next += 2;
        } else if(tk.id == "lparen") {
            const args = parseArgs(tks, next+1);
            node = {
                type: "CallExpression",
                val: { callee: node, args: args }
            };
            next = args.next;
        }
    }
    return { node, next };
}
type ParsedArgs = { args: Node[], next: number };
function parseArgs(tks: TokenList, i: number): ParsedArgs {
    const args = [];
    while(i < tks.length && tks[i].id != "rparen") {
        const expr = parseExpr(tks, i);
        args.push(expr.node);
        i = expr.next;
        if(tks[i]?.id == "comma") i++;
    }
    if(tks[i]?.id != "rparen") throw new Error();
    return { args, next: i + 1 };
}
function interp(node: Parsed): any {}