const fs = require("fs");
const path = require("path");

function snapshot(args) {
    const dir = path.join(__dirname, "../..", "snapshots");
    const file = args[0];
    const date = new Date();
    const now = date.now();
    if(file) {
        const content = fs.readFile(file);
        fs.writeFile(path.join(dir, `SNAPSHOT_${file}_${now}`));
    }
}