"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moduleDev = null;
const root = "https://raw.githubusercontent.com/BeanTheAlien/BeanTheAlien.github.io/ghost";
function fmtUrl(url) {
    return `${root}/${url}`;
}
async function fetchRaw(url) {
    const rurl = fmtUrl(url);
    const res = await fetch(rurl);
    if (!res.ok)
        throw new Error();
    return await res.text();
}
async function fetchJson(url) {
    const rurl = fmtUrl(`modules/${url}/index.json`);
    const res = await fetch(rurl);
    if (!res.ok)
        throw new Error();
    return await res.json();
}
async function fetchModuleDev() {
    const tx = await fetchRaw("dev/module_dev.js");
    moduleDev = tx;
}
async function hasRemote(url) {
    return (await fetch(fmtUrl(url))).ok;
}
async function hasJson(url) {
    return await hasRemote(`modules/${url}/index.json`);
}
async function hasFile(url) {
    return await hasRemote(`modules/${url}.js`);
}
async function getModule(...parts) {
    if (!moduleDev)
        await fetchModuleDev();
    const url = parts.join("/");
}
