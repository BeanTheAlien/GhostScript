class AutoDebuggerAPI {
    constructor() {
        this.tokens = null;
        this.runtime = null;
    }
    feed(tokens, runtime) {
        this.tokens = tokens;
        this.runtime = runtime;
    }
    resolveNotFound(input) {
        // test casing mismatch
        const keys = Object.keys(this.runtime.scope);
        const lower = input.toLowerCase();
        if(keys.map(k => k.toLowerCase()).includes(lower)) return keys.find(k => k.toLowerCase() == lower);
    }
}

module.exports = { AutoDebuggerAPI };