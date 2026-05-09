import * as io from "../../io.js";
import { CompilationMode } from "./compile.js";

interface GSConfig {
    mode?: CompilationMode;
    def_modules?: string[];
    tools?: GSConfigTools;
    exec?: GSConfigExec;
}
interface GSConfigTools {
    autodebugger?: boolean;
    context_awarness?: boolean;
    ghost_assistant?: boolean;
}
interface GSConfigExec {
    latest?: boolean;
    verbose?: boolean;
    hard_const?: boolean;
}

export function load() {
    const config: GSConfig  = {};
    if(io.exists("C:\\GhostScript\\gsconfig.json")) {
        Object.assign(config, io.readJSON("C:\\GhostScript\\gsconfig.json"));
    }
    return config;
}