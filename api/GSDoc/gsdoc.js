class GSDoc {
    constructor() {
        this.runtime = null;
    }
    feed(runtime) {
        this.runtime = runtime;
    }
    /**
     * Converts a GhostScript function to a string header.
     * @param {GSFunc} gsFunc - A GhostScript function.
     * @returns {string} The string version of the header.
     */
    fnHeader(gsFunc) {
        const { gsFuncDesire, gsFuncType, gsFuncName, gsFuncArgs } = gsFunc;
        return `${gsFuncName}(${gsFuncArgs.map(a => a).join(", ")}): ${gsFuncDesire ? "desire " : ""}${gsFuncType ?? "void"}`;
    }
    argStr(gsArg) {
        const { gsArgDesire, gsArgType, gsArgName, gsArgVal } = gsArg;
    }
    gen(string) {
        const split = string.split("\n").filter(l => l.startsWith("#"));
        const out = [];
        for(let l of split) {
            // remove hash
            l = l.slice(1);
            console.log(l);
            // get chunks
            const [id, ...args] = l.split(" ");
            switch(id) {
                case "arg", "prop": {
                    const [type, name, desc = ""] = args;
                    out.push(`${this.#typeDesire(type)} ${this.#defVal(name)}${this.#descText(desc)}`);
                    break;
                }
            }
        }
        return out;
    }
    #typeDesire(str) {
        return str.startsWith("d") ? "desire " + str.slice(1) : str;
    }
    #defVal(str) {
        const split = str.split("=");
        return split.length == 2 ? split[0] + " = " + split[1] : str;
    }
    #descText(str) {
        return str.length ? " - " + str : "";
    }
}

const test = new GSDoc();
console.log(test.gen(`test string
#arg int hello
#arg float hello=42.0
#arg string foo="bar" foobar
#arg dint foo=21`));