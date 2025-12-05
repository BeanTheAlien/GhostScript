class AutoDebuggerAPI {
    constructor() {
        this.tokens = null;
    }
    feed(tokens) {
        this.tokens = tokens;
    }
    resolveNotFound(input) {}
}

module.exports = { default: AutoDebuggerAPI };