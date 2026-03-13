var moduleDev = null;
const root = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/ghost";

function fmtUrl(url: string): string {
    return `${root}/${url}`;
}
async function fetchRaw(url: string): Promise<string> {
    const rurl = fmtUrl(url);
    const res = await fetch(rurl);
    if(!res.ok) throw new Error();
    return await res.text();
}
async function fetchJson(url: string): Promise<object> {
    const rurl = fmtUrl(`modules/${url}/index.json`);
    const res = await fetch(rurl);
    if(!res.ok) throw new Error();
    return await res.json();
}
async function fetchModuleDev(): Promise<void> {
    const res = await fetchRaw("dev/module_dev.js");
    if(!res.ok) throw new Error();
    const tx = await res.text();
    moduleDev = tx;
}
async function hasRemote(url: string): boolean {
    return (await fetch(fmtUrl(url))).ok;
}
async function hasJson(url: string): boolean {
    return await hasRemote(`modules/${url}/index.json`);
}
async function hasFile(url: string): boolean {
    return await hasRemote(`modules/${url}.js`);
}
async function getModule(...parts: string[]) {
    if(!moduleDev) await fetchModuleDev();
    const url = parts.join("/");
}