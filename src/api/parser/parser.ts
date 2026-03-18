import type { Token, TokenList } from "../tokenizer/tokenizer.js";
import { UnexpectedTokenError } from "../errors.js";

type ParsedID = "MemberExpression" | "CallExpression" | "Literal";
type Node = { type: ParsedID, val: any };
type Parsed = { node: Node, next: number };
type ParsedList = Parsed[];
type PrmParsed = Promise<Parsed>;

async function parser(tks: TokenList): Promise<void> {
    let i = 0;
    while(i < tks.length) {}
}
function parsePrim(tks: TokenList, i: number): Parsed {
    const tk = tks[i];
    throw new UnexpectedTokenError(tk);
}
function parseExpr(tks: TokenList, i: number): Parsed {
    let { node, next } = parsePrim(tks, i);
    while(tks[next] && (tks[next].id == "dot" || tks[next].id == "lparen")) {
        const tk = tks[next];
        if(tk.id == "dot") {
            const prop = tks[next+1];
            node = {
                type: "MemberExpression",
                val: { obj: node, prop: prop.val }
            };
            next += 2;
        } else if(tk.id == "lparen") {
            const args = parseArgs(tks, next+1);
            node = {
                type: "CallExpression",
                val: { callee: node, args: args }
            };
            next = args.next;
        }
    }
    return { node, next };
}
type ParsedArgs = { args: Node[], next: number };
function parseArgs(tks: TokenList, i: number): ParsedArgs {
    const args = [];
    while(i < tks.length && tks[i].id != "rparen") {
        const expr = parseExpr(tks, i);
        args.push(expr.node);
        i = expr.next;
        if(tks[i]?.id == "comma") i++;
    }
    if(tks[i]?.id != "rparen") throw new Error();
    return { args, next: i + 1 };
}

export { parser };
export type { Parsed };