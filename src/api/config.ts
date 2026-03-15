import * as io from "../../io.js";

export function load(): object {
    const config: { [x: string]: any }  = {};
    if(io.exists("C:\\GhostScript\\gsconfig.json")) {
        Object.assign(config, io.readJSON("C:\\GhostScript\\gsconfig.json"));
    }
    return config;
}