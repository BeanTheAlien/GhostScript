import * as fs from "fs";

export function Load(): object {
    const config: { [x: string]: string }  = {};
    if(fs.existsSync("C:\\GhostScript\\gsconfig.json")) {
        Object.assign(config, JSON.parse(fs.readFileSync("C:\\GhostScript\\gsconfig.json")));
    }
    return config;
}