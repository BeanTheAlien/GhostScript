import { GSMethod } from "../../module_dev";
import { gsString } from "./types";

const toUpper = new GSMethod({
    gsMethodAttach: gsString,
    gsMethodArgs: [],
    gsMethodBody: (tg: any) => tg.toUpperCase(),
    gsMethodDesire: false,
    gsMethodName: "toUpper",
    gsMethodType: gsString
});
const toLower = new GSMethod({
    gsMethodAttach: gsString,
    gsMethodArgs: [],
    gsMethodBody: (tg: any) => tg.toLowerCase(),
    gsMethodDesire: false,
    gsMethodName: "toLower",
    gsMethodType: gsString
});
const toTitle = new GSMethod({
    gsMethodAttach: gsString,
    gsMethodArgs: [],
    gsMethodBody: (tg: any) => tg.replace(/\w\S*/g, (text: any) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()),
    gsMethodDesire: false,
    gsMethodName: "toTitle",
    gsMethodType: gsString
});

export { toUpper, toLower, toTitle };