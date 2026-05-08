import { GSModuleMeta } from "../../main-beta";
import { GSArg, GSType, GSFunc, GSMethod, GSVar, GSMod } from "../../module_dev";
import { gsAny } from "./types";

interface Internal {
    convertToString: (value: any) => string;
    convertUnsafeArrayToString: (value: any[]) => string;
    createModuleDeclaration: (name: string, desc: string, ver: string, author: string, root: string, reqroot: boolean, defroot: string, deps?: string | string[]) => GSModuleMeta;
    factory: Factory;
}
interface FactoryOpts {
    name: string;
}
interface TypedFactoryOpts extends FactoryOpts {
    type?: GSType;
    des?: boolean;
}
interface FuncFactoryOpts extends TypedFactoryOpts {
    arg?: GSArg | GSArg[];
    body: Function;
}
interface MthFactoryOpts extends FuncFactoryOpts {
    atc?: GSType;
}
interface VarFactoryOpts extends TypedFactoryOpts {
    mod?: GSMod | GSMod[];
    val?: any;
}
/**
 * gsVarMods: Mods;
     gsVarType: GSType;
     gsVarDesire: boolean;
     gsVarName: string;
     gsVarVal: any;
 */
interface Factory {
    createFunc: (opts: FuncFactoryOpts) => GSFunc;
    createMthd: (opts: MthFactoryOpts) => GSMethod;
    createVar: (opts: VarFactoryOpts) => GSVar;
    __cleanOpts: (opts: FuncFactoryOpts) => CleanFuncFactoryOpts;
}
interface CleanFuncFactoryOpts {
    name: string;
    arg: GSArg[];
    type: GSType;
    des: boolean;
    body: Function;
}
const internal: Internal = {
    convertToString: (v) => v === null ? "null" : v === undefined ? "undefined" : typeof v == "string" ? v : JSON.stringify(v),
    convertUnsafeArrayToString: (v) => v.map(internal.convertToString).join(""),
    createModuleDeclaration: (name, desc, ver, author, root, reqroot, defroot, deps) => {
        return { name, desc, version: ver, author, root, reqroot, defroot, deps };
    },
    factory: {
        __cleanOpts: (opts) => {
            return { name: opts.name, arg: Array.isArray(opts.arg) ? opts.arg : (opts.arg != undefined ? [opts.arg] : []), type: opts.type ?? gsAny, des: opts.des ?? false, body: opts.body };
        },
        createFunc: (opts) => {
            const o = internal.factory.__cleanOpts(opts);
            return new GSFunc({
                gsFuncName: o.name,
                gsFuncArgs: o.arg,
                gsFuncType: o.type,
                gsFuncDesire: o.des,
                gsFuncBody: o.body
            });
        },
        createMthd: (opts) => {
            const o = internal.factory.__cleanOpts(opts);
            return new GSMethod({
                gsMethodName: o.name,
                gsMethodArgs: o.arg,
                gsMethodType: o.type,
                gsMethodDesire: o.des,
                gsMethodAttach: opts.atc ?? gsAny,
                gsMethodBody: o.body
            });
        },
        createVar: (opts) => 0 as any
    }
};
export { internal };