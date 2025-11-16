const child_process = require("child_process");

function version(args) {
    child_process.exec(`npm list @beanthealien/ghostscript`, (err, stdout, stderr) => {
        if(err) return console.error(`exec error: ${err}`);
        if(stderr.length) console.error(stderr);
        else console.log(stdout);
    });
}

module.exports = { default: version };