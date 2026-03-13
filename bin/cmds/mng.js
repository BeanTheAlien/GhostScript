const fs = require("fs");
const path = require("path");
const root = "C:\\GhostScript\\";
const config = "gsconfig.json";

function mng(args) {
    const act = args[0];
    if(!act) throw new Error("Did not provide action! Please provide an action! (use 'help' for action list)");
    const re = fs.existsSync(root);
    if(act == "help") {
        console.log("=== GhostScript Manager Actions ===");
        console.log("help - Prints this help menu.");
        console.log("config - Creates a gsconfig.json at C:\\GhostScript\\.");
        console.log("rm - Removes GhostScript and all associated files from your system.");
        console.log("gsdir - Creates C:\\GhostScript\\.");
        console.log("pull - Pulls down the newest version of GhostScript.");
        return;
    }
    if(act == "config") {
        if(!re) {
            fs.mkdirSync(root);
        }
        const c = path.join(root, config);
        if(fs.existsSync(c)) {
            return console.log("A config already exists here. Please remove it before continuing.");
        }
        fs.copyFileSync(config, c);
        return;
    }
    if(act == "gsdir") {
        if(!fs.mkdirSync(root)) {
            fs.mkdirSync(root);
        }
        return;
    }
    if(act == "rm") {
        if(!re) {
            throw new Error("Root directory does not exist.");
        }
        fs.rmSync(root, { recursive: true, force: true });
        return;
    }
    if(act == "pull") {
        if(!re) {
            throw new Error("Root directory does not exist.");
        }
        fs.writeFileSync(path.join(root, "src/main-beta.ts"), fs.readFileSync("src/main-beta.ts", "utf8"));
        return;
    }
}

module.exports = { default: mng };