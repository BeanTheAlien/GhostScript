import * as readline from "readline";
import { io } from  "../defs.js";

type Meta = {
    cv: string,
    gsv: string
};
function meta(path: string): Meta {
    const m: Meta = { cv: "", gsv: "" };
    let ln = 0;
    const rl = readline.createInterface({
        input: io.streamRead(path),
        crlfDelay: Infinity
    });
    return m;
}