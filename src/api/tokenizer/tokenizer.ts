type TokenID = "num" | "keyword" | "mod" | "id" | "string" | "opr" | "eqls" | "comma" | "dot" | "semi" | "colon" | "lparen" | "rparen" | "lbracket" | "rbracket" | "lbrace" | "rbrace" | "not" | "unknown";
type Token = { id: TokenID, val: string, ln: number, col: number };
type TokenList = Token[];

async function tokenize(script: string): Promise<TokenList> {
    const tokens: TokenList = [];
    let i = 0;
    let ln = 1;
    let col = 0;
    const tk = (id: TokenID, val: string, ln: number, col: number) => tokens.push({ id, val, ln, col });
    while(i < script.length) {
        let char = script[i];
        // skip whitespace
        if(char == "\n") {
            i++;
            ln++;
            col = 0;
            continue;
        }
        if(/\s/.test(char)) {
            i++;
            col++;
            continue;
        }
        // line comments
        if(char == "/" && script[i+1] == "/") {
            while(i < script.length && script[i] != "\n") {
                i++;
            }
            i++;
            ln++;
            col = 0;
            continue;
        }
        // block comments
        if(char == "/" && script[i+1] == "*") {
            i += 2;
            col += 2;
            while(i < script.length && !(script[i] == "*" && script[i+1] == "/")) {
                if(script[i] == "\n") {
                    ln++;
                    col = 0;
                } else col++;
                i++;
            }
            i += 2;
            col += 2;
            continue;
        }
        // numbers
        if(/\d/.test(char)) {
            const sl = ln;
            const sc = col;
            let v = "";
            while(i < script.length && /\d|\./.test(script[i])) {
                v += script[i];
                col++;
                i++;
            }
            tk("num", v, sl, sc);
            continue;
        }
        if(char == "-" && (!tokens[i-1] || ["opr", "lparen"].includes(tokens[i-1].id))) {
            const sl = ln;
            const sc = col;
            let v = "-";
            i++;
            while(i < script.length && /\d|\./.test(script[i])) {
                v += script[i];
                col++;
                i++;
            }
            tk("num", v, sl, sc);
            continue;
        }
        // identifiers or keywords
        if(/[a-zA-Z_]/.test(char)) {
            let v = "";
            const sl = ln;
            const sc = col;
            while(i < script.length && /[a-zA-Z0-9_]/.test(script[i])) {
                v += script[i];
                col++;
                ln++;
            }
            const keywords = [
                "var", "import", "if", "else", "while", "return", "class",
                "function", "method", "prop", "target", "builder", "this",
                "new"
            ];
            const mods = [
                "desire", "const", "dedicated", "public", "private", "protected"
            ];
            const type = keywords.includes(v) ? "keyword" : mods.includes(v) ? "mod" : "id";
            tk(type, v, sl, sc);
            continue;
        }
        // strings
        if(char == "\"" || char == "'") {
            const q = char;
            let v = "";
            const sl = ln;
            const sc = col;
            i++;
            col++;
            while(i < script.length && script[i] != q) {
                if(script[i] == "\n") {
                    ln++;
                    col = 0;
                } else {
                    col++;
                }
                v += script[i];
                i++;
            }
            // skip closing
            i++;
            col++;
            tk("string", v, sl, sc);
            continue;
        }
        // two-char operators
        const twoChar = script.slice(i, i + 2);
        if(["==", "!=", ">=", "<=", "&&", "||", "=>"].includes(twoChar)) {
            const sl = ln;
            const sc = col;
            col += 2;
            i += 2;
            tk("opr", twoChar, sl, sc);
            continue;
        }
        // single-char operators
        if("+-*/%<>".includes(char)) {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("opr", char, sl, sc);
            continue;
        }
        if(char == "=") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("eqls", char, sl, sc);
            continue;
        }
        if(char == ",") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("comma", char, sl, sc);
            continue;
        }
        if(char == ".") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("dot", char, sl, sc);
            continue;
        }
        if(char == ";") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("semi", char, sl, sc);
            continue;
        }
        if(char == ":") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("colon", char, sl, sc);
            continue;
        }
        if(char == "(" || char == ")") {
            const sl = ln;
            const sc = col;
            const t = char == "(" ? "lparen" : "rparen";
            i++;
            col++;
            tk(t, char, sl, sc);
            continue;
        }
        if(char == "[" || char == "]") {
            const sl = ln;
            const sc = col;
            const t = char == "[" ? "lbracket" : "rbracket";
            i++;
            col++;
            tk(t, char, sl, sc);
        }
        if(char == "{" || char == "}") {
            const sl = ln;
            const sc = col;
            const t = char == "{" ? "lbrace" : "rbrace";
            i++;
            col++;
            tk(t, char, sl, sc);
        }
        if(char == "!") {
            const sl = ln;
            const sc = col;
            i++;
            col++;
            tk("not", char, sl, sc);
            continue;
        }
        const sl = ln;
        const sc = col;
        i++;
        col++;
        tk("unknown", char, sl, sc);
    }
    return tokens;
}

export { tokenize };
export type { Token, TokenID, TokenList };