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
async function getModule(...parts: string[]) {
    if(!dev) await fetchModuleDev();
    const url = parts.join("/");
}