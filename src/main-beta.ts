import { fs, path, cp, util, io } from "./defs.js";
import * as mathjs from "mathjs";
import { Cache, Config, Modules, Tokenizer, Parser, Interp, Errors } from "./api-bundle.js";
const execAsync = util.promisify(cp.exec);

type ItemMap<K extends string | number | symbol, V> = { [x in K]: V };
type StringMap<V> = ItemMap<string, V>;
type GSObject = any;
type GSObjectMap = StringMap<GSObject>;
type GSModule = GSObjectMap;

export type { GSModule, GSObject };

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

const config: { [x: string]: any } = Config.load();

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
export const runtime = new Runtime();
runtime.set("true", true);
runtime.set("false", false);
runtime.set("null", null);
runtime.set("undefined", undefined);

var moduleDev = null;
const rawLink = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/main/ghost";

async function main(): Promise<void> {
    const gst = `${file}.gst`;
    const gse = `${file}.gse`;
    if(!io.exists(gst)) throw new Errors.NoFileExistsError(file);
    let script = io.readUTF(gst);
    let mode = 0;
    if(io.exists(gse)) {
        if(io.stat(gst).mtime <= io.stat(gse).mtime) {
            script = io.readUTF(gse);
            mode = 1;
        }
    }
    const tokens = await Tokenizer.tokenize(script);
    await Parser.parser(tokens);
}
main();