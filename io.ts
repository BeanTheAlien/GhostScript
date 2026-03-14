import { fs } from "./src/defs.js";

function exists(path: fs.PathLike): boolean {
    return fs.existsSync(path);
}
function read(path: fs.PathLike, enc: BufferEncoding): string {
    return fs.readFileSync(path, enc);
}
function write(path: fs.PathLike, cont: string) {
    fs.writeFileSync(path, cont);
}
function readJSON(path: fs.PathLike): object {
    return JSON.parse(readUTF(path));
}
function readUTF(path: fs.PathLike): string {
    return read(path, "utf8");
}
function rm(path: fs.PathLike) {
    fs.rmSync(path, { recursive: true, force: true });
}

export { exists, read, write, readJSON, readUTF, rm };