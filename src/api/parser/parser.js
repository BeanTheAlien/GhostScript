"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parser = parser;
const errors_js_1 = require("../errors.js");
async function parser(tks) {
    let i = 0;
    while (i < tks.length) { }
}
function parsePrim(tks, i) {
    const tk = tks[i];
    throw new errors_js_1.UnexpectedTokenError(tk);
}
function parseExpr(tks, i) {
    let { node, next } = parsePrim(tks, i);
    while (tks[next] && (tks[next].id == "dot" || tks[next].id == "lparen")) {
        const tk = tks[next];
        if (tk.id == "dot") {
            const prop = tks[next + 1];
            node = {
                type: "MemberExpression",
                val: { obj: node, prop: prop.val }
            };
            next += 2;
        }
        else if (tk.id == "lparen") {
            const args = parseArgs(tks, next + 1);
            node = {
                type: "CallExpression",
                val: { callee: node, args: args }
            };
            next = args.next;
        }
    }
    return { node, next };
}
function parseArgs(tks, i) {
    const args = [];
    while (i < tks.length && tks[i].id != "rparen") {
        const expr = parseExpr(tks, i);
        args.push(expr.node);
        i = expr.next;
        if (tks[i]?.id == "comma")
            i++;
    }
    if (tks[i]?.id != "rparen")
        throw new Error();
    return { args, next: i + 1 };
}
