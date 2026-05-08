import { GSMethod } from "../../module_dev";
import { internal } from "./internal";
import { gsAny, gsString } from "./types";

const castToString = new GSMethod({
    gsMethodArgs: [],
    gsMethodAttach: gsAny,
    gsMethodBody: (tg: any) => internal.convertToString(tg),
    gsMethodDesire: false,
    gsMethodName: "toString",
    gsMethodType: gsString
});