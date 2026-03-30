"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.stream = stream;
exports.streamRead = streamRead;
exports.streamWrite = streamWrite;
exports.readlns = readlns;
exports.readln = readln;
exports.readuntil = readuntil;
exports.stat = stat;
const defs_js_1 = require("./src/defs.js");
const readline = __importStar(require("readline"));
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
function stream(path, mode) {
    if (mode == "read") {
        return defs_js_1.fs.createReadStream(path);
    }
    else if (mode == "write") {
        return defs_js_1.fs.createWriteStream(path);
    }
    return undefined;
}
function streamRead(path) {
    return stream(path, "read");
}
function streamWrite(path) {
    return stream(path, "write");
}
function readInit(path) {
    return readline.createInterface({
        input: streamRead(path),
        crlfDelay: Infinity
    });
}
function readlns(path, count) {
    count = Math.floor(count);
    const out = [];
    let ln = 0;
    const rl = readInit(path);
    rl.on("line", (l) => {
        out.push(l);
        ln++;
        if (ln == count)
            rl.close();
    });
    return out;
}
function readln(path) {
    return readlns(path, 1);
}
function readuntil(path, cb) {
    const out = [];
    const rl = readInit(path);
    rl.on("line", (l) => {
        out.push(l);
        if (!cb(l)) {
            rl.close();
        }
    });
    return out;
}
function stat(path) {
    return defs_js_1.fs.statSync(path);
}
