"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
}
