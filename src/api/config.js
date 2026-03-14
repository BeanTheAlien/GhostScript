"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Load = Load;
const defs_ts_1 = require("../defs.ts");
function Load() {
    const config = {};
    if (defs_ts_1.fs.existsSync("C:\\GhostScript\\gsconfig.json")) {
        Object.assign(config, JSON.parse(defs_ts_1.fs.readFileSync("C:\\GhostScript\\gsconfig.json", "utf8")));
    }
    return config;
}
