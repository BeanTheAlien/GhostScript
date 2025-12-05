class ContextAwarenessAPI {
    constructor() {
        this.tokens = null;
    }
    feed(tokens, runtime) {
        this.tokens = tokens;
        this.runtime = runtime;
    }
}

module.exports = { ContextAwarenessAPI };