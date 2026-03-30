"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
const defs_js_1 = require("./defs.js");
const api_bundle_js_1 = require("./api-bundle.js");
const execAsync = defs_js_1.util.promisify(defs_js_1.cp.exec);
const [, , ...args] = process.argv;
function flagFmt(flag) {
    return `--${flag}`;
}
function hasFlag(flag) {
    return args.includes(flagFmt(flag));
}
function getFlag(flag) {
    return args[args.indexOf(flagFmt(flag))];
}
const file = hasFlag("test") ? "../test" : getFlag("file");
const verbose = hasFlag("verbose");
const debug = hasFlag("debug");
const safe = hasFlag("safe");
const beta = hasFlag("beta");
const config = api_bundle_js_1.Config.load();
class Runtime {
    modules;
    scope;
    constructor() {
        this.modules = {};
        this.scope = {};
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
    has(k) {
        return Object.hasOwn(this.scope, k);
    }
}
exports.runtime = new Runtime();
exports.runtime.set("true", true);
exports.runtime.set("false", false);
exports.runtime.set("null", null);
exports.runtime.set("undefined", undefined);
var moduleDev = null;
const rawLink = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/main/ghost";
async function main() {
    const gst = `${file}.gst`;
    const gse = `${file}.gse`;
    if (!defs_js_1.io.exists(gst))
        throw new api_bundle_js_1.Errors.NoFileExistsError(file);
    let script = defs_js_1.io.readUTF(gst);
    let mode = 0;
    if (defs_js_1.io.exists(gse)) {
        if (defs_js_1.io.stat(gst).mtime <= defs_js_1.io.stat(gse).mtime) {
            script = defs_js_1.io.readUTF(gse);
            mode = 1;
        }
    }
    const tokens = await api_bundle_js_1.Tokenizer.tokenize(script);
    await api_bundle_js_1.Parser.parser(tokens);
}
main();
