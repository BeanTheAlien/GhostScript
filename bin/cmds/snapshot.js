const fs = require("fs");
const path = require("path");

function snapshot(args) {
    const dir = path.join(__dirname, "../..", "snapshots");
    const file = args[0];
    if(!file) return console.error("Cannot snapshot, missing file.")
    const date = new Date();
    const now = date.now();
    const content = fs.readFileSync(file);
    fs.writeFile(path.join(dir, `snapshot-${file}-${now}`), content);
}

module.exports = { default: snapshot };
