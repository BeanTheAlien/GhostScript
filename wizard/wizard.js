const fs = require("fs");
const readline = require("readline");
const path = require("path");
const cp = require("child_process");

function WritePATH() {
    console.log("Creating PATH backup file...");
    cp.exec("echo %PATH% > path_backup.txt", (error, stdout, stderr) => {
        if(error) throw error;
        if(stderr.length) throw new Error(stderr);
        console.log(stdout);
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
        if(stderr.length) throw new Error(stderr);
        console.log(stdout);
    });
    clear();
}

function clear() {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
}

//cls