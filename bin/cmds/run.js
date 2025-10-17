const child_process = require("child_process");

function run(args) {
    const fileName = args[0];
    if(!fileName) return console.error("File name required.");
    child_process.exec(`node ${fileName}`, (err, stdout, stderr) => {
        if(err) return console.error(`exec error: ${err}`);
        if(stderr.length) console.error(stderr);
        else console.log(stdout);
    });
}

module.exports = { default: run };