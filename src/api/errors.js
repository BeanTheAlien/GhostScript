"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoFileExistsError = exports.UnexpectedTokenError = exports.NoFileError = exports.HTTPError = void 0;
class ErrRoot extends Error {
    constructor(name, msg) { super(msg); this.name = name; }
}
class HTTPError extends ErrRoot {
    constructor(res, url) { super("HTTPError", `HTTP Error: ${res.status} (${res.statusText}) (url: ${url})`); }
}
exports.HTTPError = HTTPError;
class NoFileError extends ErrRoot {
    constructor() { super("NoFileError", "Cannot execute without 'file' parameter."); }
}
exports.NoFileError = NoFileError;
class GSErr extends ErrRoot {
    constructor(name, msg, tk) { super(name, `${msg} (ln ${tk.ln}, col ${tk.col})`); }
}
class UnexpectedTokenError extends GSErr {
    constructor(tk) { super("UnexpectedTokenError", `Unexpected token with id '${tk.id}'.`, tk); }
}
exports.UnexpectedTokenError = UnexpectedTokenError;
class NoFileExistsError extends ErrRoot {
    constructor(n) { super("NoFileExistsError", `No file exists with name '${n}'.`); }
}
exports.NoFileExistsError = NoFileExistsError;
