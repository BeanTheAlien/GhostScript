const cp = require("child_process");
const path = require("path");
const fs = require("fs");

function rebuild(args) {
    cp.exec(`cd C:/ && dir "GhostScript" /s /b`, (err, stdout, stderr) => {
        if(err) throw err;
        if(stderr.length) console.log(stderr);
        const paths = stdout.split(/\r?\n/).filter(Boolean);
        let roots = [];
        paths.forEach(p => roots.push(path.dirname(p)));
        destroy(roots);
        cp.exec("cd wizard && gs wiz", (err, stdout, stderr) => {
            if(err) throw err;
            if(stderr.length) console.log(stderr);
            else {
                console.log(stdout);
                console.log("Rebuilt GhostScript installation.");
            }
        });
    });
}
function destroy(paths) {
    paths.forEach(p => {
        console.log(`Destroying directory '${p}'...`);
        fs.rmSync(p, { recursive: true, force: true });
    });
}

module.exports = { default: rebuild };