import { GSModuleMeta } from "../../main-beta";
import { GSArg, GSType, GSFunc, GSMethod, GSVar, GSMod } from "../../module_dev";
import { gsAny } from "./types";

interface Internal {
    convertToString: (value: any) => string;
    convertUnsafeArrayToString: (value: any[]) => string;
    createModuleDeclaration: (name: string, desc: string, ver: string, author: string, root: string, reqroot: boolean, defroot: string, deps?: string | string[]) => GSModuleMeta;
    convertToArray: (value: any) => any[];
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
interface AttachFactoryOpts {
    atc?: GSType;
}
interface MthFactoryOpts extends FuncFactoryOpts, AttachFactoryOpts {}
interface VarFactoryOpts extends TypedFactoryOpts {
    mod?: GSMod | GSMod[];
    val?: any;
}
//gsModAttach, gsModName, gsModGet, gsModSet
interface ModFactoryOpts extends FactoryOpts, AttachFactoryOpts {
    get?: Function;
    set?: Function;
}
interface Factory {
    createFunc: (opts: FuncFactoryOpts) => GSFunc;
    createMthd: (opts: MthFactoryOpts) => GSMethod;
    createVar: (opts: VarFactoryOpts) => GSVar;
    createMod: (opts: ModFactoryOpts) => GSMod;
    __cleanOpts: (opts: FactoryOpts) => FactoryOpts;
    __cleanTypedOpts: (opts: TypedFactoryOpts) => CleanTypedFactoryOpts;
    __cleanFuncOpts: (opts: FuncFactoryOpts) => CleanFuncFactoryOpts;
    __cleanMthOpts: (opts: MthFactoryOpts) => CleanMthFactoryOpts;
    __cleanVarOpts: (opts: VarFactoryOpts) => CleanVarFactoryOpts;
    __cleanAtcOpts: (opts: AttachFactoryOpts) => CleanAttachFactoryOpts;
    __cleanModOpts: (opts: ModFactoryOpts) => CleanModFactoryOpts;
}
type CleanTypedFactoryOpts = Required<TypedFactoryOpts>;
type CleanFuncFactoryOpts = Required<FuncFactoryOpts>;
type CleanVarFactoryOpts = Required<VarFactoryOpts>;
type CleanAttachFactoryOpts = Required<AttachFactoryOpts>;
type CleanMthFactoryOpts = Required<MthFactoryOpts>;
type CleanModFactoryOpts = Required<ModFactoryOpts>;
const internal: Internal = {
    convertToString: (v) => v === null ? "null" : v === undefined ? "undefined" : typeof v == "string" ? v : JSON.stringify(v),
    convertUnsafeArrayToString: (v) => v.map(internal.convertToString).join(""),
    createModuleDeclaration: (name, desc, ver, author, root, reqroot, defroot, deps) => {
        return { name, desc, version: ver, author, root, reqroot, defroot, deps };
    },
    convertToArray: (v) => Array.isArray(v) ? v : (v != undefined ? [v] : []),
    factory: {
        __cleanOpts: (opts) => {
            return { name: opts.name };
        },
        __cleanTypedOpts: (opts) => {
            return { ...internal.factory.__cleanOpts(opts), type: opts.type ?? gsAny, des: opts.des ?? false };
        },
        __cleanAtcOpts: (opts) => {
            return { atc: opts.atc ?? gsAny };
        },
        __cleanFuncOpts: (opts) => {
            return { arg: internal.convertToArray(opts.arg), body: opts.body, ...internal.factory.__cleanTypedOpts(opts) };
        },
        __cleanMthOpts: (opts) => {
            return { ...internal.factory.__cleanAtcOpts(opts), ...internal.factory.__cleanFuncOpts(opts) };
        },
        __cleanVarOpts: (opts) => {
            return { mod: internal.convertToArray(opts.mod), val: opts.val, ...internal.factory.__cleanTypedOpts(opts) };
        },
        __cleanModOpts: (opts) => {
            return { ...internal.factory.__cleanAtcOpts(opts), ...internal.factory.__cleanOpts(opts), get: () => {}, set: () => {} };
        },
        createFunc: (opts) => {
            const o = internal.factory.__cleanFuncOpts(opts);
            return new GSFunc({
                gsFuncName: o.name,
                gsFuncArgs: o.arg as GSArg[],
                gsFuncType: o.type,
                gsFuncDesire: o.des,
                gsFuncBody: o.body
            });
        },
        createMthd: (opts) => {
            const o = internal.factory.__cleanMthOpts(opts);
            return new GSMethod({
                gsMethodName: o.name,
                gsMethodArgs: o.arg as GSArg[],
                gsMethodType: o.type,
                gsMethodDesire: o.des,
                gsMethodAttach: o.atc,
                gsMethodBody: o.body
            });
        },
        createVar: (opts) => {
            const o = internal.factory.__cleanVarOpts(opts);
            return new GSVar({
                gsVarDesire: o.des,
                gsVarMods: o.mod,
                gsVarName: o.name,
                gsVarType: o.type,
                gsVarVal: o.val
            });
        },
        createMod: (opts) => {
            const o = internal.factory.__cleanModOpts(opts);
            return new GSMod({
                gsModAttach: o.atc,
                gsModGet: o.get,
                gsModName: o.name,
                gsModSet: o.set
            });
        }
    }
};
export { internal };