"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exists = exists;
exports.read = read;
exports.write = write;
exports.readJSON = readJSON;
exports.readUTF = readUTF;
exports.rm = rm;
exports.mk = mk;
exports.readdir = readdir;
exports.cpdir = cpdir;
exports.cp = cp;
const defs_js_1 = require("./src/defs.js");
function exists(path) {
    return defs_js_1.fs.existsSync(path);
}
function read(path, enc) {
    return defs_js_1.fs.readFileSync(path, enc);
}
function write(path, cont) {
    defs_js_1.fs.writeFileSync(path, cont);
}
function readJSON(path) {
    return JSON.parse(readUTF(path));
}
function readUTF(path) {
    return read(path, "utf8");
}
function rm(path) {
    defs_js_1.fs.rmSync(path, { recursive: true, force: true });
}
function mk(path) {
    defs_js_1.fs.mkdirSync(path);
}
function readdir(path) {
    return defs_js_1.fs.readdirSync(path, { withFileTypes: true, recursive: true });
}
function cpdir(src, dest) {
    defs_js_1.fs.cpSync(src, dest);
}
function cp(src, dest) {
    defs_js_1.fs.copyFileSync(src, dest);
}
