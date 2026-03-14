import * as io from "../../io.js";

export function Load(): object {
    const config: { [x: string]: string }  = {};
    if(io.exists("C:\\GhostScript\\gsconfig.json")) {
        Object.assign(config, io.readJSON("C:\\GhostScript\\gsconfig.json"));
    }
    return config;
}