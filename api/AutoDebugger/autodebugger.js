class AutoDebuggerAPI {
    constructor() {
        this.tokens = null;
        this.runtime = null;
    }
    feed(tokens, runtime) {
        this.tokens = tokens;
        this.runtime = runtime;
    }
    resolveNotFound(input) {}
}

module.exports = { AutoDebuggerAPI };