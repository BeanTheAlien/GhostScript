import { cache } from "../api-bundle.js";
import { runtime } from "../main-beta.js";
import type * as main from "../main-beta.js";
import * as io from "../../io.js";
import { util, cp } from "../defs.js";
const execAsync = util.promisify(cp.exec);

var dev: any = null;
const root = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/ghost";
type PrmBool = Promise<boolean>;
type FetchOutput = "text" | "json";
interface FetchOutputTypeMap {
    text: string;
    json: object;
}

class HTTPError extends Error {
    constructor(res: Response, url: string) {
        super(`Failed to fetch, code ${res.status}. (url: ${url})`);
        this.name = "HTTPError";
    }
}
class FetchHandler {
    constructor() {}
    fmt(url: string): string {
        return `${root}/${url}`;
    }
    req(url: string): Promise<Response> {
        return fetch(this.fmt(url));
    }
    /**
     * Handles the possibility of a not OK response.
     * @param res The `Response` object.
     * @param url The URL that was fetched.
     * @throws {HTTPError} If the response was not OK.
     */
    err(res: Response, url: string) {
        if(!res.ok) throw new HTTPError(res, url);
    }
    async res(url: string): Promise<Response> {
        const res = await this.req(url);
        this.err(res, this.fmt(url));
        return res;
    }
    async out<K extends FetchOutput, T extends FetchOutputTypeMap[K]>(res: Response, out: K): Promise<T> {
        if(out == "text") {
            return await res.text() as T;
        } else if(out == "json") {
            return await res.json() as T;
        }
        return await res.text() as T;
    }
    async handle<K extends FetchOutput, T extends FetchOutputTypeMap[K]>(url: string, out: K): Promise<T> {
        return await this.out(await this.res(url), out);
    }
    async raw(url: string): Promise<string> {
        return await this.handle(url, "text");
    }
    async json(url: string): Promise<object> {
        return await this.handle(url, "json");
    }
    module(url: string): string {
        return this.fmt(`modules/${url}`);
    }
    async hasRemote(url: string): PrmBool {
        return (await this.req(url)).ok;
    }
    async hasJSON(url: string): PrmBool {
        return await this.hasRemote(`${this.module(url)}/index.json`);
    }
    async hasFile(url: string): PrmBool {
        return await this.hasRemote(`${this.module(url)}.js`);
    }
}
async function fetchModuleDev(): Promise<void> {
    dev = await ft.raw("dev/module_dev.js");
}
const ft = new FetchHandler();
async function getModule(...parts: string[]): Promise<main.GSModule | number> {
    if(!dev) await fetchModuleDev();
    const url = parts.join("/");
    // check if the URL has a index.json file
    if(await ft.hasJSON(url)) {
        // recurse through all the files
        const index = (await ft.json(url)) as { files: string[] };
        for(const f of index.files) {
            // retrieve the file (removes '.js' ending)
            const file = (await getModule(url, f.slice(0, -3))) as main.GSModule;
            inject(file);
            await resolveDeps(file);
        }
        return 0;
    }
    // check if the file is a single JS file
    if(await ft.hasFile(url)) {
        // get the file and its content
        const js = await ft.raw(`modules/${url}.js`);
        return await processImport(js, parts);
    }
    // check for a local file
    if(io.exists(url)) {
        const js = io.readUTF(url);
        return await processImport(js, parts);
    }
    // run a system search to locate the file
    const { stdout, stderr } = await execAsync(`where /R C:\\ ${url}`);
    if(stderr.length) throw new Error(stderr);
    else if(stdout.length) {
        const js = io.readUTF(stdout);
        return await processImport(js, parts);
    }

    throw new Error(`Could not find module '${url}'.`);
}
function inject(m: main.GSModule) {
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
async function resolveDeps(file: main.GSModule) {
    if(file.meta && file.meta.deps) {
        if(Array.isArray(file.meta.deps)) {
            for(const d of file.meta.deps) {
                const dep = (await getModule(root, d.endsWith(".js") ? d.slice(0, -3) : d)) as main.GSModule;
                inject(dep);
            }
        }
    }
}
async function processImport(js: string, parts: string[]) {
    const module: { exports: { [x: string]: any } } = { exports: {} };
    const wrap = new Function("require", "module", "exports", "runtime", "module_dev", js);
    wrap(require, module, module.exports, runtime, dev);
    const m = module.exports || {};
    // Build "flat" exports object that runtime expects.
    // Support two cases:
    //  1) module exported structured arrays: { funcs: [...], methods: [...], ... }
    //  2) module already flattened: { wait: GSFunc, print: GSFunc, ghostmodule: {...} }
    const flat: { [x: string]: any } = {};

    // Helper to get the real name
    function getRealName(item: { [x: string]: any }) {
        return item?.gsVarName ||
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
    }

    // Helper to flatten arrays of GS* objects into flat[name] = object
    function flattenArr(arr: main.GSObject[]) {
        if(!Array.isArray(arr)) return;
        for(const item of arr) {
            const nk = getRealName(item);
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
        if(!(k in flat)) flat[getRealName(v)] = v;
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