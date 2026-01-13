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
        return `function ${gsFuncName}(${this.argMap(gsFuncArgs)}): ${this.retType(gsFuncDesire, gsFuncType)}`;
    }
    /**
     * Converts a GhostScript method to a string header.
     * @param {GSMethod} gsMethod - A GhostScript method.
     * @returns {string} The string version of the header.
     */
    mthHeader(gsMethod) {
        const { gsMethodDesire, gsMethodType, gsMethodAttach, gsMethodName, gsMethodArgs } = gsMethod;
        return `method<${gsMethodAttach ?? "entity"}> ${gsMethodName}(${this.argMap(gsMethodArgs)}): ${this.retType(gsMethodDesire, gsMethodType)}`;
    }
    /**
     * Converts a GhostScript argument to a string argument.
     * @param {GSArg} gsArg - A GhostScript argument.
     * @returns {string} The string version of the argument.
     */
    argStr(gsArg) {
        const { gsArgDesire, gsArgType, gsArgName, gsArgVal } = gsArg;
        return `${gsArgName}: ${gsArgDesire ? "desire " : ""}${gsArgType ?? "void"}${gsArgVal ? " = " + gsArgVal : ""}`;
    }
    retType(desire, type) {
        return `${desire ? "desire " : ""}${type ?? "void"}`;
    }
    argMap(args) {
        return args.map(a => this.argStr(a)).join(", ");
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