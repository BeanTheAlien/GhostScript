import type { Token, TokenList } from "../tokenizer/tokenizer.js";
import { UnexpectedTerminationError, UnexpectedTokenError, UnterminatedStatementError } from "../errors.js";
import { Modules } from "../../api-bundle.js";
import { io, path } from "../../defs.js";
import { processImport, inject, getModule } from "../modules.js";
import { interp } from "../interp/interp.js";
import { GSMod, GSType } from "../../module_dev.js";
import { runtime } from "../../main-beta.js";

type ParsedID = "MemberExpr" | "CallExpr" | "Literal" | "Assignment" | "Dec" | "Id" | "ArrayExpr" | "BlockStm" | "FuncDec" | "MethodDec" | "PropDec" | "ArrayAcs" | "CondHeader" | "PropGet" | "PropSet" | "IdOpr";
type Node = { type: ParsedID, val: any };
type Next = { next: number };
type Parsed = { node: Node } & Next;
type ParsedList = Parsed[];
type PrmParsed = Promise<Parsed>;
type NodeList = Node[];
interface NodeMap {
    MemberExpr: ParsedMemberExpr;
    CallExpr: ParsedCallExpr;
    Literal: LiteralNode;
    Id: IdNode;
    Assignment: AssignmentNode;
    Dec: DecNode;
}
type AssignmentNode = MkNode<"Assignment", [string, (ParsedMemberExpr | ParsedCallExpr)["node"]]>;
type DecNode = MkNode<"Dec", string>;
export { Node, NodeMap };

async function preprocess(tks: TokenList) {
    let i = 0;
    while(i < tks.length) {
        const tk = tks[i];
        if(tk.id == "keyword" && tk.val == "import") {
            const imp = parseImport(tks, i);
            if(!imp.module.length) throw new UnexpectedTerminationError(tk, "import");
            if(imp.type == "file") {
                const f = imp.module[0];
                const fp = path.join(__dirname, f);
                const [fName, encoding = null] = fp.split("+");
                const fileCont = io.read(fName, "utf8");
                const re = () => {
                    if(encoding) {
                        const d = (e: BufferEncoding) => Buffer.from(fileCont, e).toString("utf8");
                        if(encoding == "utf8" || encoding == "utf-8") return fileCont;
                        if(encoding == "base64" || encoding == "b64") return d("base64");
                        if(encoding == "bin" || encoding == "binary") return fileCont.split(" ").map(s => parseInt(s, 2).toString()).join(" ");
                        if(encoding == "ascii") return d("ascii");
                        if(encoding == "hex") return d("hex");
                        if(encoding == "ucs" || encoding == "ucs2" || encoding == "ucs-2") return d("ucs2");
                        if(encoding == "utf16le" || encoding == "utf16" || encoding == "utf-16le" || encoding == "utf-16") return d("utf16le");
                        if(encoding == "lat" || encoding == "latin" || encoding == "lat1" || encoding == "latin1") return d("latin1");
                    }
                    return fileCont;
                }
                const js = re();
                const lib = await processImport(js, [f]);
                inject(lib);
            } else {
                const lib = await getModule(...imp.module);
                if(typeof lib != "number") inject(lib);
            }
            i = imp.next;
            continue;
        }
        if(tk.id == "keyword" && tk.val == "var" && tks[i+1]?.id == "id") {
            const n = tks[i+1].val;
            if(tks[i+2]?.id == "eqls") {
                const expr = parseExpr(tks, i+3);
                i = expr.next;
                interp({ type: "Assignment", val: [n, expr.node] });
                continue;
            }
            i += 2;
            interp({ type: "Dec", val: n });
            continue;
        }
        if(tk.id == "keyword" && (tk.val == "func" || tk.val == "method")) {}
    }
}
async function parser(tks: TokenList): Promise<void> {
    let i = 0;
    while(i < tks.length) {}
}
type MkNode<T extends ParsedID, V = any> = Node & { node: { type: T, val: V } } & Next;
type LiteralNode = MkNode<"Literal", string | number>;
type IdNode = MkNode<"Id", string>;
function parsePrim(tks: TokenList, i: number): Parsed {
    const tk = tks[i];
    if(tk.id == "id") return { node: { type: "Id", val: tk.val }, next: i+1 };
    if(tk.id == "string") return { node: { type: "Literal", val: tk.val }, next: i+1 };
    if(tk.id == "num") return { node: { type: "Literal", val: Number(tk.val) }, next: i+1 };
    throw new UnexpectedTokenError(tk);
}
type ParsedMemberExpr = { node: { type: ParsedID, val: { obj: Node, prop: string } } } & Next;
type ParsedCallExpr = { node: { type: ParsedID, val: { callee: Node, args: ParsedArgs } } } & Next;
function parseExpr(tks: TokenList, i: number): ParsedMemberExpr | ParsedCallExpr {
    let { node, next } = parsePrim(tks, i);
    while(tks[next] && (tks[next].id == "dot" || tks[next].id == "lparen")) {
        const tk = tks[next];
        if(tk.id == "dot") {
            const prop = tks[next+1];
            node = {
                type: "MemberExpr",
                val: { obj: node, prop: prop.val }
            };
            next += 2;
        } else if(tk.id == "lparen") {
            const args = parseArgs(tks, next+1);
            node = {
                type: "CallExpr",
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
type ImportType = "file" | "module" | "http";
type ParsedImport = { module: any[], type: ImportType } & Next;
function parseImport(tks: TokenList, i: number): ParsedImport {
    // skip import statement
    i++;
    const tk = tks[i];
    // test for string (file / url)
    if(tk.id == "string") {
        const v = tk.val;
        // test for URL (starts with HTTP)
        return { module: [v], next: i+1, type: v.startsWith("http") ? "http" : "file" };
        // if(v.startsWith("http")) {
        //     // // retrieve
        //     // const res = await fetch(v);
        //     // if(!res.ok) throw new Error();
        //     // const data = await res.text();
        //     // Modules.processImport(data, [v]);
        //     return { module: [tk.val], next: i+1, type: "http" };
        // } else {
        //     // const md = await Modules.getLocalModule(v, v.split("/"));
        //     // Modules.inject(md);
        //     return { module: [tk.val], next: i+1, type: "file" };
        // }
    }
    // retrieve chunks
    const module = [];
    let c = 1;
    while(i < tks.length && c > 0 && (tks[i].id == "id" || tks[i].id == "dot")) {
        const t = tks[i];
        if(tk.id == "dot") {
            c++;
            i++;
            continue;
        }
        // push all the chunks
        // resolves into a module name
        module.push(tk.val);
        i++;
        c--;
    }
    // const md = await Modules.getModule(...module);
    // if(typeof md == "number") return;
    // Modules.inject(md);
    return { module, next: i+1, type: "module" };
}
type ParsedParam = { mods: string[], dedicated: boolean, const: boolean, desire: boolean, type: GSType, name: string, val: any };
function parseParam(param: TokenList): ParsedParam {
    let i = 0;
    const parsed: ParsedParam = {
        mods: [],
        dedicated: false,
        const: false,
        desire: false,
        type: runtime.get("entity"),
        name: "",
        val: undefined
    };
    // mods will come first
    const modsParsed = parseMods(param, i);
    const mods = modsParsed.mods;
    i = modsParsed.next;
    parsed["mods"] = mods;
    // GhostScript uses strict modifier positioning for params
    // dedicated, const, desire, type
    if(mods.length) {
        let j = 0;
        parsed["dedicated"] = !!mods[j] && mods[j] == "dedicated";
        if(parsed["dedicated"]) j++;
        parsed["const"] = !!mods[j] && mods[j] == "const";
        if(parsed["const"]) j++;
        parsed["desire"] = !!mods[j] && mods[j] == "desire";
        if(parsed["desire"]) j++;
        parsed["type"] = mods[j] && runtime.scope[mods[j]] instanceof GSType ? runtime.scope[mods[j]] : runtime.scope.entity;
    } else {
        parsed["dedicated"] = false;
        parsed["const"] = false;
        parsed["desire"] = false;
        parsed["type"] = runtime.scope.entity;
    }
    // name will come after mods
    const name = param[i].val;
    i++;
    parsed["name"] = name;
    // possible eqls val
    parsed["val"] = undefined;
    if(param[i]?.id == "eqls") {
        if(param[i+1]) {
            const val = param[i+1].val;
            parsed["val"] = val;
        } else {
            throw new Error(`Unexpected termination of parameter. (got: '${param}')`);
        }
    }
    return { ...parsed };
}
function parseMods(tks: TokenList, i: number) {
    let mods = [];
    while(i < tks.length && (tks[i].id == "mod" || runtime.scope[tks[i].val] instanceof GSType)) {
        mods.push(tks[i].val);
        i++;
    }
    return { mods, next: i };
}
function retrieveBlock(tks: TokenList, i: number) {
    let body = [];
    let depth = 0;
    i++;
    while(i < tks.length) {
        const tk = tks[i];
        if(tk.id == "lbrace") depth++;
        if(tk.id == "rbrace") depth--;
        if(depth == 0) break;
        body.push(tk);
        i++;
    }
    u++;
    if(depth > 0) throw new UnterminatedStatementError(tks[i-1], "block", "}");
    return body;
}
type BlockStmNode = MkNode<"BlockStm", Node[]>;
function parseBlock(body: TokenList): BlockStmNode {
    let parsed: Node[] = [];
    let i = 0;
    while(i < body.length) {
        const p = parseExpr(body, i);
        parsed.push(p.node);
        i = p.next;
    }
    return { node: { type: "BlockStm", val: parsed }, next: i };
}
function parseBlockHeader(tks: TokenList, i: number) {
    const headerMods = parseMods(tks, i);
}

export { parser, parseParam };
export type { Parsed, Next, ParsedMemberExpr, ParsedCallExpr };