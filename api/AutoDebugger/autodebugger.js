const huggingface = require("@huggingface/transformers");
const pipe = await huggingface.pipeline("text-generation", "Qwen/Qwen2.5-Coder-7B-Instruct", {
    dtype: "q4"
});
// role, content
// role: system | user
const initMessage = ``;
const messages = [
    { role: "system", content: "Hello, Qwen! Your goal is to find errors and provide solutions within the user's script.\nIt is important for me to recognize that this is a new programming language that has strange syntax - so you won't get everything right.\nThat's ok, just try your best with the provided materials!\nI will note that, if you can, try and suggest changes that are within the realm of the user's ability.\nIn the next message, I will provide the tokens, raw script and documentation. You should utilize these to guide your decision.\nOf course, I still care about you. Please do not hesitate to voice your emotions/opinions/etc, I appreciate feedback and am willing to help where I can." }
];

const out = await pipe(messages, { max_new_tokens: 128 });
console.log(out[0].generated_text.at(-1).content);

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