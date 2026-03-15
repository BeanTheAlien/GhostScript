import * as io from "../../io.js";
import { fs } from "../defs.js";

function fmt(module: string): string {
    return `gscache/${module}`;
}
function init() {
    if(!io.exists("gscache")) {
        io.mk("gscache");
    }
}
function cacheExists(module: string): boolean {
    return io.exists(fmt(module));
}
function read(module: string): fs.Dirent[] | undefined {
    if(cacheExists(module)) {
        return io.readdir(fmt(module));
    }
    return undefined;
}
function write(module: string, file: [string, string]) {
    const m = fmt(module);
    if(!cacheExists(m)) {
        io.mk(m);
    }
    io.write(file[0], file[1]);
}
function writes(module: string, files: [string, string][]) {
    for(const s of files) write(module, s);
}

export { init, read, write, writes };