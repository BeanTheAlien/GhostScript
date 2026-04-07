import { UnterminatedError } from "../errors";
import { Next } from "../parser/parser";
import { TokenList } from "../tokenizer/tokenizer";

type Field<T> = {
    accept: T
};
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

export type { Field };