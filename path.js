const cp = require("child_process");

/**
 * Writes to the user's path.
 * @param {string} root - The root directory.
 * @param {string} ext - The new file extension.
 * @param {string} assoc - The assocation of the extension.
 * @param {string} exe - The path to the execuatable.
 * @param {string} key - The key directory placed in the registry.
 * @param {string} name - The key's display name.
 */
export function create(root, ext, assoc, exe, key, name, withLogs = false) {
    const cb = (e, se) => {
        if(e) throw e;
        if(se.length) throw new Error(se);
    }
    // create backup
    if(withLogs) console.log("Writing PATH backup...");
    cp.exec("echo %PATH% > path_backup.txt", cb);
    // set in the path
    if(withLogs) console.log("Writing PATH...");
    cp.exec(`setx PATH "%PATH%;${root}"`, cb);
    cp.exec(`setx PATHEXE "%PATHEXE%;.${ext}"`, cb);
    cp.exec(`assoc .${ext}=${assoc}`, cb);
    cp.exec(`ftype ${key}="${exe}" "%1"`, cb);
    cp.exec(`reg add "HKEY_CLASSES_ROOT\\${key}" /ve /d "${name}" /f`, cb);
}