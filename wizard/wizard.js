const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const grnsqr = "🟩";
const empty = "⬛";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function progress(label, steps = 20, delay = 100) {
    process.stdout.write(`${label}\n[${empty.repeat(steps)}]`);
    for (let i = 1; i <= steps; i++) {
        await sleep(delay);
        process.stdout.cursorTo(i, 1);
        process.stdout.write(grnsqr);
    }
    process.stdout.write("\n\n");
}

async function WritePATH() {
    // await progress("Creating PATH backup file...");
    console.log("Creating PATH backup file...");
    cp.exec("echo %PATH% > path_backup.txt");

    // await progress("Writing to PATH...");
    console.log("Writing to PATH...");
    cp.exec(`setx PATH "%PATH%;C:\\Program Files\\GhostScript"`);
    cp.exec(`setx PATHEXE "%PATHEXE;.gst"`);
    cp.exec(`assoc .gst=ghostscript`);
    cp.exec(`ftype ghostscript="C:\\Program Files\\GhostScript\\GhostScript.exe" "%1"`);
    cp.exec(`reg add "HKEY_CLASSES_ROOT\\ghostscript" /ve /d "GhostScript" /f`);

    await writeFiles();
}

async function writeFiles() {
    const gsPF = "C:\\Program Files\\GhostScript";
    // await progress("Checking for existing installation...");

    if(fs.existsSync(gsPF)) {
        console.log("Removing existing installation...");
        fs.rmSync(gsPF, { recursive: true });
    }

    // await progress("Creating installation directory...");
    console.log("Creating installation directory...");
    fs.mkdirSync(gsPF, { recursive: true });

    // await progress("Copying files...", 25, 60);
    console.log("Generating files...");
    const base = path.join(__dirname, "..");
    const dirs = fs.readdirSync(base, { recursive: true, withFileTypes: true });
    for(const dirent of dirs) {
        if(dirent.isFile()) {
            const src = path.join(base, dirent.name);
            const dest = path.join(gsPF, dirent.name);
            console.log(`Generating '${dirent.name}'...`);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
    }

    // await progress("Finalizing installation...", 15, 80);
    console.log("Finalizing...");
    console.log("\nGhostScript installation complete!");
    console.log("You can now run .gst files directly.");
}

WritePATH();