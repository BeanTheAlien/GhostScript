const cp = require("child_process");

function wiz() {
    cp.exec(`node wizard.js`, (err, stdout, stderr) => {
        if(err) throw err;
        if(stderr.length) console.log(stderr);
        else console.log(stdout);
    });
}

module.exports = { default: wiz };