type MbArr<T> = T | T[];
type Attach = MbArr<GSType>;
type Mods = MbArr<GSMod>;
interface GSCore {}
interface GSVarData extends GSCore {
    gsVarMods: Mods;
    gsVarType: GSType;
    gsVarDesire: boolean;
    gsVarName: string;
    gsVarVal: any;
}
interface GSFuncData extends GSCore {
    gsFuncDesire: boolean;
    gsFuncType: GSType;
    gsFuncName: string;
    gsFuncArgs: GSArg[];
    gsFuncBody: Function;
}
interface GSMethodData extends GSCore {
    gsMethodDesire: boolean;
    gsMethodType: GSType;
    gsMethodName: string;
    gsMethodAttach: Attach;
    gsMethodArgs: GSArg[];
    gsMethodBody: Function;
}
interface GSClassData extends GSCore {
    gsClassType: string;
    gsClassName: string;
    gsClassBuilder: Function;
}
interface GSPropData extends GSCore {
    gsPropDesire: boolean;
    gsPropAttach: Attach;
    gsPropName: string;
    gsPropGet: Function;
    gsPropSet: Function;
}
interface GSTypeData extends GSCore {
    gsTypeName: string;
    gsTypeTest: <T>(v: T) => boolean;
}
interface GSModData extends GSCore {
    gsModAttach: Attach;
    gsModName: string;
    gsModGet: Function;
    gsModSet: Function;
}
interface GSOprData extends GSCore {
    gsOprName: string;
    gsOprExec: Function;
}
interface GSDirectiveData extends GSCore {
    gsDirectiveName: string;
    gsDirectiveExec: Function;
}
interface GSPropData extends GSCore {
    gsPropName: string;
    gsPropGet: Function;
    gsPropSet: Function;
}
interface GSArgData extends GSCore {
    gsArgName: string;
    gsArgVal: any;
    gsArgDesire: boolean;
    gsArgType: GSType;
}

declare class GSVar implements GSVarData {
    gsVarMods: GSMod[];
    gsVarType: GSType;
    gsVarDesire: boolean;
    gsVarName: string;
    gsVarVal: any;
}
declare class GSFunc implements GSFuncData {
    gsFuncDesire: boolean;
    gsFuncType: GSType;
    gsFuncName: string;
    gsFuncArgs: GSArg[];
    gsFuncBody: Function;
}
declare class GSMethod implements GSMethodData {
    gsMethodDesire: boolean;
    gsMethodType: GSType;
    gsMethodName: string;
    gsMethodAttach: Attach;
    gsMethodArgs: GSArg[];
    gsMethodBody: Function;
}
declare class GSClass implements GSClassData {
    gsClassType: string;
    gsClassName: string;
    gsClassBuilder: Function;
}
declare abstract class GSType implements GSTypeData {
    gsTypeName: string;
    abstract gsTypeTest: <T>(v: T) => boolean;
}
declare class GSMod implements GSModData {
    gsModAttach: Attach;
    gsModName: string;
    gsModGet: Function;
    gsModSet: Function;
}
declare class GSOpr implements GSOprData {
    gsOprName: string;
    gsOprExec: Function;
}
declare class GSDirective implements GSDirectiveData {
    gsDirectiveName: string;
    gsDirectiveExec: Function;
}
declare class GSArg implements GSArgData {
    gsArgName: string;
    gsArgVal: any;
    gsArgDesire: boolean;
    gsArgType: GSType;
}
declare class GSProp implements GSPropData {
    gsPropDesire: boolean;
    gsPropAttach: Attach;
    gsPropName: string;
    gsPropGet: Function;
    gsPropSet: Function;
}

type Dev = {
    "GSVar": GSVar,
    "GSFunc": GSFunc,
    "GSMethod": GSMethod,
    "GSClass": GSClass,
    "GSType": GSType,
    "GSProp": GSProp,
    "GSMod": GSMod,
    "GSOpr": GSOpr,
    "GSDirective": GSDirective,
    "GSArg": GSArg
};

export {
    GSVar, GSFunc, GSMethod, GSClass,
    GSType, GSProp, GSMod, GSOpr,
    GSDirective, GSArg
};
export type { GSCore, Dev };