import { GSArg, GSType } from "../../module_dev";

interface ComplexField {
    type: GSType;
}
interface ComplexCollectionField extends ComplexField {
    min: number;
    max: number;
    fixed: boolean;
}
interface ComplexArrayField extends ComplexCollectionField {
    fill: any;
}
interface ComplexObjectField extends ComplexCollectionField {
    key: GSType;
    val: GSType;
}
interface ComplexExecutableField extends ComplexField {
    ret: GSType;
    desire: boolean;
    args: GSArg[];
    overloads: boolean;
}
interface ComplexFuncField extends ComplexExecutableField {
    argpersist: boolean;
}
interface ComplexMethodField extends ComplexExecutableField {
    attach: GSType | GSType[];
}
type ComplexFieldMap<T extends ComplexField> = { [x: string]: T };
class Complex<T extends ComplexField = ComplexField> {
    fields: ComplexFieldMap<T>;
    constructor(fields: ComplexFieldMap<T>) {
        this.fields = fields;
    }
}
class ComplexArray extends Complex<ComplexArrayField> {}
class ComplexObject extends Complex<ComplexObjectField> {}
class ComplexFunc extends Complex<ComplexFuncField> {}
class ComplexMethod extends Complex<ComplexMethodField> {}

export { Complex, ComplexArray, ComplexObject, ComplexFunc, ComplexMethod };