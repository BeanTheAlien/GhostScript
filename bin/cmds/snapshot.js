const fs = require("fs");
const path = require("path");

function snapshot(args) {
    const dir = path.join(__dirname, "../..", "snapshots");
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    const file = args[0];
    if(!file) return console.error("Cannot snapshot, missing file.");
    const date = new Date();
    const now = date.toISOString().replace(/:/g, "-").replace(/\./, "-").replace("T", "_").replace("Z", "");
    const content = fs.readFileSync(file, "utf8");
    fs.writeFileSync(path.join(dir, `snapshot-${args[1] ?? file}-${now}.txt`), content);
}

module.exports = { default: snapshot };
