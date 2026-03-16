import { fs } from "./src/defs.js";
import * as readline from "readline";

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
function mk(path: fs.PathLike) {
    fs.mkdirSync(path);
}
function readdir(path: fs.PathLike): fs.Dirent[] {
    return fs.readdirSync(path, { withFileTypes: true, recursive: true })
}
function cpdir(src: string, dest: string) {
    fs.cpSync(src, dest);
}
function cp(src: fs.PathLike, dest: fs.PathLike) {
    fs.copyFileSync(src, dest);
}
interface StreamMap {
    read: fs.ReadStream;
    write: fs.WriteStream;
}
function stream<K extends keyof StreamMap, T extends StreamMap[K]>(path: fs.PathLike, mode: K): T | undefined {
    if(mode == "read") {
        return fs.createReadStream(path) as T;
    } else if(mode == "write") {
        return fs.createWriteStream(path) as T;
    }
    return undefined;
}
function streamRead(path: fs.PathLike): fs.ReadStream {
    return stream(path, "read") as fs.ReadStream;
}
function streamWrite(path: fs.PathLike): fs.WriteStream {
    return stream(path, "write") as fs.WriteStream;
}
function readlns(path: fs.PathLike, count: number): string[] {
    count = Math.floor(count);
    const out: string[] = [];
    let ln = 0;
    const rl = readline.createInterface({
        input: streamRead(path),
        crlfDelay: Infinity
    });
    rl.on("line", (l) => {
        out.push(l);
        ln++;
        if(ln == count) rl.close();
    });
    return out;
}
function readln(path: fs.PathLike): string[] {
    return readlns(path, 1);
}

export { exists, read, write, readJSON, readUTF, rm, mk, readdir, cpdir, cp, stream, streamRead, streamWrite, readlns, readln };