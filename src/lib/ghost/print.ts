import { GSArg, GSFunc } from "../../module_dev";
import { internal } from "./internal";
import { gsAny, gsEntity, gsString, gsVoid } from "./types";
import * as readline from "readline";
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const __msgArg = new GSArg({
    gsArgDesire: false,
    gsArgName: "message",
    gsArgType: gsAny,
    gsArgVal: ""
});
const __printingFuncFactory = (name: string, body: Function) => new GSFunc({
    gsFuncDesire: false,
    gsFuncType: gsVoid,
    gsFuncName: name,
    gsFuncArgs: [__msgArg],
    gsFuncBody: body
});
const print = __printingFuncFactory("print", (...msg: any[]) => process.stdout.write(internal.convertUnsafeArrayToString(msg)));
const println = __printingFuncFactory("println", (...msg: any[]) => console.log(internal.convertUnsafeArrayToString(msg)));
const prompt = new GSFunc({
    gsFuncDesire: false,
    gsFuncType: gsString,
    gsFuncName: "prompt",
    gsFuncArgs: [new GSArg({
        gsArgDesire: false,
        gsArgName: "question",
        gsArgType: gsAny,
        gsArgVal: ""
    })],
    gsFuncBody: async (q: any) => {
        return await new Promise(r => rl.question(q, r));
    }
});
export { print, println, prompt };