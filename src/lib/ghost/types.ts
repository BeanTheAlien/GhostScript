import { GSFunc, GSMethod, GSType, GSVar } from "../../module_dev";

const gsVoid = new GSType({
    gsTypeName: "void",
    gsTypeTest: (v) => v === null || v === undefined
});
const gsEntity = new GSType({
    gsTypeName: "entity",
    gsTypeTest: (v) => !gsVoid.gsTypeTest(v)
});
const gsNum = new GSType({
    gsTypeName: "num",
    gsTypeTest: (v) => typeof v == "number"
});
const gsInt = new GSType({
    gsTypeName: "int",
    gsTypeTest: (v) => gsNum.gsTypeTest(v) && Number.isInteger(v)
});
const gsFloat = new GSType({
    gsTypeName: "float",
    gsTypeTest: (v) => gsNum.gsTypeTest(v) && !Number.isInteger(v)
});
const gsString = new GSType({
    gsTypeName: "string",
    gsTypeTest: (v) => typeof v == "string"
});
const gsBool = new GSType({
    gsTypeName: "bool",
    gsTypeTest: (v) => typeof v == "boolean"
});
const gsArray = new GSType({
    gsTypeName: "array",
    gsTypeTest: (v) => Array.isArray(v)
});
const gsFunc = new GSType({
    gsTypeName: "func",
    gsTypeTest: (v) => typeof v == "function" || v instanceof GSFunc
});
const gsMethod = new GSType({
    gsTypeName: "method",
    gsTypeTest: (v) => typeof v == "function" || v instanceof GSMethod
});
const gsAny = new GSType({
    gsTypeName: "any",
    gsTypeTest: () => true
});
export { gsVoid, gsEntity, gsNum, gsInt, gsFloat, gsString, gsBool, gsArray, gsFunc, gsMethod, gsAny };