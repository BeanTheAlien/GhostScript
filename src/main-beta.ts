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

class ErrRoot extends Error {
    constructor(name: string, msg: string) {
        super(msg);
        this.name = name;
    }
}
class HTTPError extends ErrRoot { constructor(res: Response, url: string) { super("HTTPError", `HTTP Error: ${res.status} (${res.statusText}) (url: ${url})`); } }
class NoFileError extends ErrRoot { constructor() { super("NoFileError", "Cannot execute without 'file' parameter."); } }

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
}
main();

type Token = { id: string, val: string, ln: number, col: number };
type TokenList = Token[];
async function tokenize(script: string): Promise<TokenList> {
    const tokens: TokenList = [];
    let i = 0;
    let ln = 1;
    let col = 0;
    const tk = (id: string, val: string, ln: number, col: number) => tokens.push({ id, val, ln, col });
    while(i < script.length) {
        let char = script[i];
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
        if(char == "/" && script[i+1] == "/") {
            while(i < script.length && script[i] != "\n") {
                i++;
            }
            i++;
            ln++;
            col = 0;
            continue;
        }
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
    }
    return tokens;
}