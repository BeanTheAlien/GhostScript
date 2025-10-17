const cp = require("child_process");

function upd(args) {
    cp.exec(`npm update ghostscript`, (err, stdout, stderr) => {
        if(err) return console.error(`exec error: ${err}`);
        if(stderr.length) console.error(stderr);
        else console.log(stdout);
    });
}

module.exports = { default: upd };