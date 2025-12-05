class ContextAwarenessAPI {
    constructor() {
        this.tokens = null;
    }
    feed(tokens) {
        this.tokens = tokens;
    }
}

module.exports = { default: ContextAwarenessAPI };