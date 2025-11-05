const fs = require("fs");
const readline = require("readline");
const path = require("path");
const cp = require("child_process");
console.log("test");
clear();

function WritePATH() {
    console.log("Creating PATH backup file...");
    cp.exec("echo %PATH% > path_backup.txt", (error, stdout, stderr) => {
        if(error) throw error;
    });
    clear();
    console.log("Writing to PATH...");
    cp.exec(`setx PATH "%PATH%;C:\\Program Files\\GhostScript"
    setx PATHEXE "%PATHEXE;.gst"
    assoc .gst=ghostscript
    ftype ghostscript="C:\\Program Files\\GhostScript\\GhostScript.exe" "%1"
    reg add "HKEY_CLASSES_ROOT\\ghostscript" /ve /d "GhostScript" /f
    echo PATH updated!`, (err, stderr, stdout) => {
        if(err) throw err;
    });
    clear();
    writeFiles();
}
WritePATH();

function writeFiles() {
    const gsPF = "C:\\Program Files\\GhostScript";
    if(fs.existsSync(gsPF)) {
        console.log(`GhostScript already installed.`);
        console.log("Preparing uninstall...");
        fs.rmSync(gsPF, { recursive: true });
    }
    console.log("Creating install directory...");
    fs.mkdirSync(gsPF);
    console.log("Generating files...");
    fs.cpSync(path.join(__dirname, ".."), gsPF, { recursive: true });
    console.log("Finishing operation...");
    console.log("GhostScript installation complete.");
}

function clear() {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
}

//cls