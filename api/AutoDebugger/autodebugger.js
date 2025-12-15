const huggingface = require("@huggingface/transformers");
// role, content
// role: system | user

class AutoDebuggerAPI {
    constructor() {
        this.tokens = null;
        this.script = null;
        this.runtime = null;
        this.pipe = null;
    }
    async init() {
        this.pipe = await huggingface.pipeline("text-generation", "Qwen/Qwen2.5-Coder-1.5B-Instruct", { dtype: "fp32", device: "cpu" });
    }
    feed(tokens, script, runtime) {
        this.tokens = tokens;
        this.script = script;
        this.runtime = runtime;
        this.initMessage();
    }
    async initMessage() {
        console.log(this.pipe instanceof huggingface.TextGenerationPipeline);
        const m = [
            { role: "system", content: "Your goal is to find errors and provide solutions within the user's script.\nIf you can, try and suggest changes that are within the realm of the user's ability.\nThe next message will have the tokens, raw script and the runtime. You should utilize these to guide your decision." },
            { role: "system", content: `TOKENS:\n${this.tokens}\nSCRIPT:\n${this.script}\nRUNTIME:\n${JSON.stringify(this.runtime)}` }
        ];
        const o = await this.pipe(m, { max_new_tokens: 128 });
        console.log(o);
    }
    async resolve(message) {
        const m = [{ role: "user", content: message }];
        const o = await this.pipe(m);
        console.log(o);
        return o;
    }
    resolveNotFound(input) {
        // test casing mismatch
        const keys = Object.keys(this.runtime.scope);
        const lower = input.toLowerCase();
        if(keys.map(k => k.toLowerCase()).includes(lower)) return keys.find(k => k.toLowerCase() == lower);
    }
}

module.exports = { AutoDebuggerAPI };