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
    const useTemplate = (await ask("Use template? (y/n): ")).trim().toLowerCase();
    const templateName = useTemplate == "y" ? await ask("Template name: ") : null;

    rl.close();

    const projectDir = path.join(process.cwd(), name);
    if(fs.existsSync(projectDir)) {
        console.error(`Error: Project "${name}" already exists here.`);
        return;
    }

    fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(path.join(projectDir, "ghost.json"), JSON.stringify({
        name,
        description,
        version: "0.0.1",
        main: "main.gst"
    }, null, 2));

    fs.writeFileSync(path.join(projectDir, "main.gst"), "// Welcome to GhostScript!\n");

    if(templateName) {
        const templateDir = path.join(__dirname, "../..", "templates", templateName);
        if(fs.existsSync(templateDir)) {
            fs.cpSync(templateDir, projectDir, { recursive: true });
            console.log(`Applied template "${templateName}"`);
        } else {
            console.warn(`Template "${templateName}" not found.`);
        }
    }

    fs.mkdirSync(path.join(projectDir, "/snapshots"));
    fs.mkdirSync(path.join(projectDir, "/modules"));

    console.log(`\nCreated GhostScript project in: ${projectDir}`);
}

module.exports = { default: init };