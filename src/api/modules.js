"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const main_beta_js_1 = require("../main-beta.js");
const io = __importStar(require("../../io.js"));
const defs_js_1 = require("../defs.js");
const execAsync = defs_js_1.util.promisify(defs_js_1.cp.exec);
var dev = null;
const root = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/ghost";
class HTTPError extends Error {
    constructor(res, url) {
        super(`Failed to fetch, code ${res.status}. (url: ${url})`);
        this.name = "HTTPError";
    }
}
class FetchHandler {
    constructor() { }
    fmt(url) {
        return `${root}/${url}`;
    }
    req(url) {
        return fetch(this.fmt(url));
    }
    /**
     * Handles the possibility of a not OK response.
     * @param res The `Response` object.
     * @param url The URL that was fetched.
     * @throws {HTTPError} If the response was not OK.
     */
    err(res, url) {
        if (!res.ok)
            throw new HTTPError(res, url);
    }
    async res(url) {
        const res = await this.req(url);
        this.err(res, this.fmt(url));
        return res;
    }
    async out(res, out) {
        if (out == "text") {
            return await res.text();
        }
        else if (out == "json") {
            return await res.json();
        }
        return await res.text();
    }
    async handle(url, out) {
        return await this.out(await this.res(url), out);
    }
    async raw(url) {
        return await this.handle(url, "text");
    }
    async json(url) {
        return await this.handle(url, "json");
    }
    module(url) {
        return this.fmt(`modules/${url}`);
    }
    async hasRemote(url) {
        return (await this.req(url)).ok;
    }
    async hasJSON(url) {
        return await this.hasRemote(`${this.module(url)}/index.json`);
    }
    async hasFile(url) {
        return await this.hasRemote(`${this.module(url)}.js`);
    }
}
async function fetchModuleDev() {
    dev = await ft.raw("dev/module_dev.js");
}
const ft = new FetchHandler();
async function getModule(...parts) {
    if (!dev)
        await fetchModuleDev();
    const url = parts.join("/");
    // check if the URL has a index.json file
    if (await ft.hasJSON(url)) {
        // recurse through all the files
        const index = (await ft.json(url));
        for (const f of index.files) {
            // retrieve the file (removes '.js' ending)
            const file = (await getModule(url, f.slice(0, -3)));
            inject(file);
            await resolveDeps(file);
        }
        return 0;
    }
    // check if the file is a single JS file
    if (await ft.hasFile(url)) {
        // get the file and its content
        const js = await ft.raw(`modules/${url}.js`);
        return await processImport(js, parts);
    }
    // check for a local file
    if (io.exists(url)) {
        const js = io.readUTF(url);
        return await processImport(js, parts);
    }
    // run a system search to locate the file
    const { stdout, stderr } = await execAsync(`where /R C:\\ ${url}`);
    if (stderr.length)
        throw new Error(stderr);
    else if (stdout.length) {
        const js = io.readUTF(stdout);
        return await processImport(js, parts);
    }
    throw new Error(`Could not find module '${url}'.`);
}
function inject(m) {
    // always keep module object available
    main_beta_js_1.runtime.modules[m.meta.name] = m;
    // if reqroot is false, inject exported names into runtime.scope
    if (m.meta && m.meta.reqroot == false) {
        for (const [k, v] of Object.entries(m.exports)) {
            // avoid clobbering existing names unless you want to
            if (main_beta_js_1.runtime.has(k)) {
                console.warn(`Skipping import of '${k}' from ${m.meta.name}: name conflict in global scope`);
                continue;
            }
            main_beta_js_1.runtime.set(k, v);
        }
    }
    else {
        // else expose under default root name
        const rootName = m.meta.defroot;
        main_beta_js_1.runtime.scope[rootName] = m.exports;
    }
}
async function resolveDeps(file) {
    if (file.meta && file.meta.deps) {
        if (Array.isArray(file.meta.deps)) {
            for (const d of file.meta.deps) {
                const dep = (await getModule(root, d.endsWith(".js") ? d.slice(0, -3) : d));
                inject(dep);
            }
        }
    }
}
async function processImport(js, parts) {
    const module = { exports: {} };
    const wrap = new Function("require", "module", "exports", "runtime", "module_dev", js);
    wrap(require, module, module.exports, main_beta_js_1.runtime, dev);
    const m = module.exports || {};
    // Build "flat" exports object that runtime expects.
    // Support two cases:
    //  1) module exported structured arrays: { funcs: [...], methods: [...], ... }
    //  2) module already flattened: { wait: GSFunc, print: GSFunc, ghostmodule: {...} }
    const flat = {};
    // Helper to get the real name
    function getRealName(item) {
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
    function flattenArr(arr) {
        if (!Array.isArray(arr))
            return;
        for (const item of arr) {
            const nk = getRealName(item);
            if (nk)
                flat[nk] = item;
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
    for (const [k, v] of Object.entries(m)) {
        if (k == "ghostmodule")
            continue;
        // avoid overwriting array-derived entries, keep whichever exists
        if (!(k in flat))
            flat[getRealName(v)] = v;
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
