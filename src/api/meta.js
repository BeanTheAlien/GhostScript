"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meta = meta;
const defs_js_1 = require("../defs.js");
function meta(path) {
    const m = { cv: "", gsv: "" };
    const out = defs_js_1.io.readuntil(path, (l) => l.startsWith("//"));
    const regex = (key) => new RegExp(`\\/\\/ ${key}=`);
    const val = (str) => (str && str.split("=")[1]) ?? "";
    m.cv = val(out.find((v) => regex("cv").test(v)));
    m.gsv = val(out.find((v) => regex("gsv").test(v)));
    return m;
}
