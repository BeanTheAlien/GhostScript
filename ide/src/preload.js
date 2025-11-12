// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

contextBridge.exposeInMainWorld("ide", {
    getDirname: () => __dirname,
    fsWrite: (fpath, data) => fs.writeFileSync(fpath, data),
    fsRead: (fpath) => fs.readFileSync(fpath, "utf8"),
    fsMkDir: (dpath) => fs.mkdirSync(dpath),
    pathJoin: (...paths) => path.join(...paths),
    chooseDir: () => ipcRenderer.invoke("choose-dir"),
    fsExists: (dpath) => fs.existsSync(dpath),
    chooseFile: () => ipcRenderer.invoke("choose-file"),
    fsReadDir: (dpath, opts = {}) => fs.readdirSync(dpath, { recursive: true, ...opts }),
    pathBasename: (fpath) => path.basename(fpath),
    cpExec: (cmd) => cp.exec(cmd),
    fsJSONRead: (fpath) => JSON.parse(fs.readFileSync(fpath, "utf8")),
    fsJSONWrite: (fpath, data) => fs.writeFileSync(fpath, JSON.stringify(data, null, 4))
});