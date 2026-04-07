import type { Token, TokenList } from "../tokenizer/tokenizer.js";
import { UnexpectedTokenError } from "../errors.js";
import { Modules } from "../../api-bundle.js";

type ParsedID = "MemberExpression" | "CallExpression" | "Literal";
type Node = { type: ParsedID, val: any };
type Next = { next: number };
type Parsed = { node: Node } & Next;
type ParsedList = Parsed[];
type PrmParsed = Promise<Parsed>;
type NodeList = Node[];

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
type ParsedArgs = { args: NodeList } & Next;
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
type ParsedCommaList = { list: NodeList } & Next;
function parseCommaList(tks: TokenList, i: number): ParsedCommaList {
    const list = [];
    let count = 1;
    while(i < tks.length && count > 0) {
        const expr = parseExpr(tks, i);
        list.push(expr.node);
        i = expr.next;
        if(tks[i]?.id == "comma") {
            count++;
        } else {
            count--;
        }
    }
    return { list, next: i };
}
async function parseImport(tks: TokenList, i: number) {
    const tk = tks[i];
    // test for string (file / url)
    if(tk.id == "string") {
        const v = tk.val;
        // test for URL (starts with HTTP)
        if(v.startsWith("http")) {
            // retrieve
            const res = await fetch(v);
            if(!res.ok) throw new Error();
            const data = await res.text();
            Modules.processImport(data, [v]);
        } else {
            const md = await Modules.getLocalModule(v, v.split("/"));
            Modules.inject(md);
        }
        return;
    }
    // retrieve chunks
    const chunks = [];
    while(i < tks.length && (tks[i].id == "id" || tks[i].id == "dot")) {
        // push all the chunks
        // resolves into a module name
        chunks.push(tks[i].val);
        i++;
    }
    const md = await Modules.getModule(...chunks);
    if(typeof md == "number") return;
    Modules.inject(md);
}

export { parser };
export type { Parsed, Next };