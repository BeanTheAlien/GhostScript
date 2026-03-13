const fs = require("fs");
const path = require("path");
const root = "C:\\GhostScript\\";

function mng(args) {
    const act = args[0];
    if(!act) throw new Error("Did not provide action! Please provide an action! (use 'help' for action list)");
    if(act == "help") {
        console.log("=== GhostScript Manager Actions ===");
        console.log("help - Prints this help menu.");
        console.log("config - Creates a gsconfig.json at C:\\GhostScript\\.");
        console.log("rm - Removes GhostScript and all associated files from your system.");
        console.log("gsdir - Creates C:\\GhostScript\\.");
        return;
    }
    if(act == "config") {
        if(!fs.existsSync(root)) {
            fs.mkdirSync(root);
        }
        const c = path.join(root, "gsconfig.json");
        if(fs.existsSync(c)) {
            return console.log("A config already exists here. Please remove it before continuing.");
        }
        fs.writeFileSync(c, "");
    }
}

module.exports = { default: mng };