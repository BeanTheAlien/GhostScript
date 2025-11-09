const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const grnsqr = "🟩";
const empty = "⬛";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function progress(label, steps = 20, delay = 100) {
    process.stdout.write(`${label}\n[${empty.repeat(steps)}]`);
    for(let i = 1; i <= steps; i++) {
        await sleep(delay);
        process.stdout.cursorTo(i, 1);
        process.stdout.write(grnsqr);
    }
    process.stdout.write("\n\n");
}

function walkDir(dir, root = dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });

    for(const file of list) {
        const fullPath = path.join(dir, file.name);
        if(file.isDirectory()) {
            if(file.name == ".git" || file.name == "node_modules") continue;
            results = results.concat(walkDir(fullPath, root));
        } else {
            const relPath = path.relative(root, fullPath);
            results.push(relPath);
        }
    }
    return results;
}

async function writeFiles() {
    const gsPF = "C:\\Program Files\\GhostScript";

    if(fs.existsSync(gsPF)) {
        console.log("Removing existing installation...");
        fs.rmSync(gsPF, { recursive: true, force: true });
    }

    console.log("Creating installation directory...");
    fs.mkdirSync(gsPF, { recursive: true });

    console.log("Copying files...");
    const base = path.join(__dirname, "..");
    const files = walkDir(base);

    for (const rel of files) {
        const src = path.join(base, rel);
        const dest = path.join(gsPF, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log(`Generating '${rel}'...`);
    }

    console.log("Finalizing...");
    console.log("\nGhostScript installation complete!");
}

async function WritePATH() {
    console.log("Creating PATH backup file...");
    cp.exec("echo %PATH% > path_backup.txt");

    console.log("Writing to PATH...");
    cp.exec(`setx PATH "%PATH%;C:\\Program Files\\GhostScript"`);
    cp.exec(`setx PATHEXE "%PATHEXE;.gst"`);
    cp.exec(`assoc .gst=ghostscript`);
    cp.exec(`ftype ghostscript="C:\\Program Files\\GhostScript\\GhostScript.exe" "%1"`);
    cp.exec(`reg add "HKEY_CLASSES_ROOT\\ghostscript" /ve /d "GhostScript" /f`);

    await writeFiles();
}

WritePATH();