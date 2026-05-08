import { GSModuleMeta } from "../../main-beta";

interface Internal {
    convertToString: (value: any) => string;
    convertUnsafeArrayToString: (value: any[]) => string;
    createModuleDeclaration: (name: string, desc: string, ver: string, author: string, root: string, reqroot: boolean, defroot: string, deps?: string | string[]) => GSModuleMeta;
    factory: Factory;
}
interface Factory {}
const internal: Internal = {
    convertToString: (v) => v === null ? "null" : v === undefined ? "undefined" : typeof v == "string" ? v : JSON.stringify(v),
    convertUnsafeArrayToString: (v) => v.map(internal.convertToString).join(""),
    createModuleDeclaration: (name, desc, ver, author, root, reqroot, defroot, deps) => {
        return { name, desc, version: ver, author, root, reqroot, defroot, deps };
    },
    factory: {}
};
export { internal };