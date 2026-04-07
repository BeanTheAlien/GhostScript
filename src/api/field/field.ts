import { Constructor, AbstractConstructor } from "../../gs-types";
import { runtime } from "../../main-beta";
import { GSType } from "../../module_dev";
import { Complex } from "../complex/complex";
import { UnterminatedError } from "../errors";
import { Next } from "../parser/parser";
import { TokenList } from "../tokenizer/tokenizer";

type ValTest = (val: any) => boolean;
const Inst = <T>(v: any, ctor: Constructor<T> | AbstractConstructor<T>) => v instanceof ctor || runtime.get(v) instanceof ctor;
class Field<T> {
    test: ValTest;
    min: number;
    max: number;
    def: T | null;
    constructor(test: ValTest, min: number, max: number, def: T | null) {
        this.test = test;
        this.min = min;
        this.max = max;
        this.def = def;
    }
}
class TypeField extends Field<GSType> {
    constructor() {
        super((v) => Inst(v, GSType), 1, Infinity, null);
    }
}
class ComplexField extends Field<Complex> {
    constructor() {
        super((v) => Inst(v, Complex), 1, 1, null);
    }
}
type RetrievedField = { out: TokenList } & Next;
function getField(tks: TokenList, i: number): RetrievedField {
    // since we assume i points to the '<'
    // increment i by one to skip it
    i++;
    const out = [];
    // since we assume there is a field
    // continue searching until we hit a '>'
    while(i < tks.length) {
        const tk = tks[i];
        if(tk.id == "opr" && tk.val == ">") return { out, next: i+1 };
        out.push(tk);
        i++;
    }
    // otherwise, the field does not exist (hit end of file)
    throw new UnterminatedError(tks[i], ">");
}

export type { Field, ComplexField, TypeField, getField };