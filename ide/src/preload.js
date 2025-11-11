// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

contextBridge.exposeInMainWorld("ide", {
    getDirname: () => __dirname,
    fsWrite: (path, data) => fs.writeFileSync(path, data),
    fsRead: (path) => fs.readFileSync(path, "utf8"),
    fsMkDir: (path) => fs.mkdirSync(path),
    pathJoin: (...paths) => path.join(...paths),
    chooseDir: () => ipcRenderer.invoke("choose-dir"),
    fsExists: (path) => fs.existsSync(path)
});