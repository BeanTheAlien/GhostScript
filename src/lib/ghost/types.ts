import { GSType } from "../../module_dev";

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