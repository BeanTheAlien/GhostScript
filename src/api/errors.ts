import type { Token } from "./tokenizer/tokenizer.js";

class ErrRoot extends Error { constructor(name: string, msg: string) { super(msg); this.name = name; } }
class HTTPError extends ErrRoot { constructor(res: Response, url: string) { super("HTTPError", `HTTP Error: ${res.status} (${res.statusText}) (url: ${url})`); } }
class NoFileError extends ErrRoot { constructor() { super("NoFileError", "Cannot execute without 'file' parameter."); } }
class GSErr extends ErrRoot { constructor(name: string, msg: string, tk: Token) { super(name, `${msg} (ln ${tk.ln}, col ${tk.col})`); } }
class UnexpectedTokenError extends GSErr { constructor(tk: Token) { super("UnexpectedTokenError", `Unexpected token with id '${tk.id}'.`, tk); } }
class NoFileExistsError extends ErrRoot { constructor(n: string) { super("NoFileExistsError", `No file exists with name '${n}'.`); } }

export { HTTPError, NoFileError, UnexpectedTokenError, NoFileExistsError };