const fs = require("fs");
const path = require("path");
const readline = require("readline");

async function init() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (q) => new Promise(res => rl.question(q, res));

    console.log("--- Creating New GhostScript Project ---");

    const name = await ask("Name: ");
    const description = await ask("Description: ");

    rl.close();

    // project folder
    const projectDir = path.join(process.cwd(), name);

    if(fs.existsSync(projectDir)) {
        console.error(`Error: Project "${name}" already exists here.`);
        return;
    }

    fs.mkdirSync(projectDir);

    // create base files
    fs.writeFileSync(path.join(projectDir, "ghost.json"), JSON.stringify({
        name,
        description,
        version: "0.0.1",
        main: "main.gst"
    }, null, 2));

    fs.writeFileSync(path.join(projectDir, "main.gst"), "// Welcome to GhostScript!\n");

    console.log(`\nCreated GhostScript project in: ${projectDir}`);
    console.log("Files:");
    console.log(` - ghost.json`);
    console.log(` - main.gst`);
}

module.exports = { default: init };