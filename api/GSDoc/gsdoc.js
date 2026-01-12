class GSDoc {
    constructor() {
        this.runtime = null;
    }
    feed(runtime) {
        this.runtime = runtime;
    }
    gen(string) {
        const split = string.split("\n").filter(l => !l.startsWith("#"));
        const out = [];
        for(let l of split) {
            // remove hash
            l = l.slice(1);
        }
    }
}