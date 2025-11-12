/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./index.css";

const dirname = window.ide.getDirname();
const fsWrite = window.ide.fsWrite;
const fsRead = window.ide.fsRead;
const fsMkDir = window.ide.fsMkDir;
const pathJoin = window.ide.pathJoin;
const chooseDir = window.ide.chooseDir;
const fsExists = window.ide.fsExists;
const chooseFile = window.ide.chooseFile;
const fsReadDir = window.ide.fsReadDir;
const pathBasename = window.ide.pathBasename;
const cpExec = window.ide.cpExec;

console.log("Checking for GhostScript installation...");
const isInstalled = fsExists("C:\\Program Files\\GhostScript");

const mk = (tag, opts = {}) => Object.assign(document.createElement(tag), opts);
const add = (c, p = document.body) => p.appendChild(c);
const rem = (c, p = document.body) => p.removeChild(c);
const el = (id) => document.getElementById(id);
const on = (el, ev, ex) => el.addEventListener(ev, ex);
const off = (el, ev, ex) => el.removeEventListener(ev, ex);
add(mk("h1", { innerText: "GhostScript IDE" }));
const ul = mk("ul");
const nbl = (text, to) => `<li><a href="${to}">${text}</a></li>`;
const nbd = (outer, text) => `<li class="dropdown"><a class="dropbtn" href="javascript:void(0)">${outer}</a><div class="dropdown-content">${text}</div></li>`;
const file = nbd("File", `<a id="new_file">New File</a><a id="new_folder">New Folder</a><a id="new_proj">New Project</a><a id="open_file">Open File</a><a id="open_folder">Open Folder</a><a id="open_proj">Open Project</a><a id="save">Save</a><a id="save_as">Save As</a>`);
const edit = nbd("Edit", ``);
const view = nbd("View", ``);
const run = nbd("Run", `<a id="run_dbg">Run Debugging</a><a id="run_nm">Run</a><a id="run_safe">Run (Safe)</a>`);
const debug = nbd("Debug", `<a id="debug">Debug</a><a id="find_errs">Find Errors</a><a id="fix">Fix</a>`);
const terminal = nbd("Terminal", ``);
const help = nbd("Help", ``);
const community = nbd("Community", ``);
const github = nbl("GitHub", "https://github.com/BeanTheAlien/GhostScript");
ul.innerHTML = [file, edit, view, run, terminal, help, community, github].join("");
add(ul);
const [fNewFile, fNewFolder, fNewProj, fOpenFile, fOpenFolder, fOpenProj, fSave, fSaveAs] = ["new_file", "new_folder", "new_proj", "open_file", "open_folder", "open_proj", "save", "save_as"].map(id => el(id));
const [rRunDebug, rRunNormal, rRunSafe] = ["run_dbg", "run_nm", "run_safe"].map(id => el(id));
const [dDebug, dFindErrs, dFix] = ["debug", "find_errs", "fix"].map(id => el(id));
var curFile = null;
const sidebar = mk("div", { id: "sidebar" });
sidebar.style.width = "250px";
sidebar.style.background = "#1e1e1e";
sidebar.style.color = "#ccc";
sidebar.style.overflowY = "auto";
add(sidebar);
const editorTabs = mk("div", { id: "tabs" });
const editorPane = mk("div", { id: "editor" });
add(editorTabs);
add(editorPane);
const editorArea = mk("textarea");
const status = mk("div");
add(status);
const popupCSS = { position: fixed, left: "95vw", top: "90vh" };
if(!isInstalled) {
  const gsNotInstalled = mk("div", { style: popupCSS, innerHTML: `GhostScript not found on your system.<br><button id="install_btn">Install</button><button id="config_path_btn">Configure Path</button>` });
  add(gsNotInstalled);
  on(el("install_btn"), "click", () => cpExec("cd ../.. && cd wizard && node wizard.js"));
}

function genFile() {
  try {
    const modal = mk("dialog", { innerHTML: `Enter the name for your file:<br><input type="text" id="fname" placeholder="Enter file name..."><button id="fin_btn">Finish</button><button id="cnl_btn">Cancel</button>` });
    add(modal);
    modal.showModal();
    const finish = el("fin_btn");
    const cancel = el("cnl_btn");
    const defOper = () => {
      modal.innerHTML = "";
      modal.close();
      rem(modal);
    }
    on(finish, "click", () => {
      const val = el("fname").value;
      const fpath = pathJoin(dirname, `${val}.gst`);
      console.log(`Writing '${fpath}'...`);
      fsWrite(fpath, "");
      console.log(`Wrote '${fpath}' successfully.`);
      defOper();
    });
    on(cancel, "click", defOper);
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fNewFile, "click", genFile);
async function genFolder() {
  try {
    let name = "";
    const modal = mk("dialog", { innerHTML: `Enter the name for your folder:<br><input type="text" id="fname" placeholder="Enter folder name...">Choose a directory for your project:<br><button id="c_dir">Choose...</button><p id="dir_out">No directory selected.</p><button id="fin_btn">Finish</button><button id="cnl_btn">Cancel</button>` });
    add(modal);
    modal.showModal();
    const finish = el("fin_btn");
    const cancel = el("cnl_btn");
    const defOper = () => {
      modal.innerHTML = "";
      modal.close();
      rem(modal);
    }
    on(finish, "click", () => {
      const val = el("fname").value;
      const folder = pathJoin(name, val);
      console.log(`Creating '${folder}'...`);
      fsMkDir(folder);
      console.log(`Created '${folder}' successfully.`);
      defOper();
    });
    on(cancel, "click", defOper);
    on(el("c_dir"), "click", async () => {
      const handle = await chooseDir();
      name = handle;
      el("dir_out").textContent = name;
    })
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fNewFolder, "click", genFolder);
function genProj() {
  try {
    const modal = mk("dialog");
    const pg = (content) => `<div>${content}</div><button id="next_btn">Next</button>`;
    const nextPg = (toPg) => {
      modal.innerHTML = toPg;
      return el("next_btn");
    }
    add(modal);
    modal.showModal();
    let next = nextPg(pg(`<h1>GhostScript Project Wizard</h1><br><p>Setting up a new GhostScript project.</p><p>This wizard will guide you through the creation process.</p>`));
    on(next, "click", () => {
      next = nextPg(pg(`<h1>Step 1</h1><br><p>Please enter a name for your project:</p><input type="text" id="pname" placeholder="Really Cool Name">`));
      on(next, "click", () => {
        const projName = el("pname").value;
        let dir = null;
        next = nextPg(pg(`<h1>Step 2</h1><br><p>Please choose a directory for your project:</p><button id="c_dir">Choose...</button><p id="dir_out">No directory selected.</p>`));
        on(el("c_dir"), "click", async () => {
          const handle = await chooseDir();
          dir = handle;
          el("dir_out").textContent = dir;
        });
        on(next, "click", () => {
          next = nextPg(pg(`<h1>Finalize</h1><br><p>Project name: ${projName}</p><p>Project directory: ${dir}</p>`));
          on(next, "click", () => {
            next = nextPg(pg(`<p>Please wait...</p>`));
            try {
              if(!fsExists(dir)) {
                console.log(`Making '${dir}'...`);
                fsMkDir(dir);
                console.log(`Made '${dir}' successfully.`);
              }
              console.log(`Writing '${dir}/${projName}'...`);
              fsWrite(pathJoin(dir, `${projName}.gst`), "");
              console.log(`Wrote '${dir}/${projName}' successfully.`);
              console.log(`Writing '${dir}/README.md'...`);
              fsWrite(pathJoin(dir, "README.md"), `# ${projName}`);
              console.log(`Wrote '${dir}/README.md' successfully.`);
              console.log(`Writing '${dir}/project.json'...`);
              fsWrite(pathJoin(dir, "project.json"), JSON.stringify({
                "name": projName,
                "author": "johndoe",
                "version": "1.0.0",
                "modules": {},
                "bin": {
                  "names": [projName],
                  "dir": "./bin"
                }
              }, null, 4)); 
              console.log(`Wrote ${dir}/project.json successfully.`);
              console.log(`Making '${dir}/bin'...`);
              fsMkDir(pathJoin(dir, "bin"));
              console.log(`Made '${dir}/bin' successfully.`);
              console.log(`Writing '${dir}/bin/bin.js'...`);
              fsWrite(pathJoin(dir, "bin", "bin.js"), `#!/usr/bin/env node
              const fs = require("fs");
              const path = require("path");
              
              const [,, cmd, ...args] = process.argv;
              const commandsDir = path.join(__dirname, "cmds");
              
              const commands = Object.fromEntries(
                  fs.readdirSync(commandsDir)
                      .map(file => [file.replace(".js", ""), () => require(path.join(commandsDir, file))])
              );
              
              if(commands[cmd]) {
                  const module = commands[cmd]();
                  module.default(args);
              } else {
                  console.log(\`Unknown command: \${cmd}\`);
              }`);
              console.log(`Wrote '${dir}/bin/bin.js' successfully.`);
              console.log(`Making '${dir}/bin/cmds'...`);
              fsMkDir(pathJoin(dir, "bin", "cmds"));
              console.log(`Made '${dir}/bin/cmds' successfully.`);
              next = nextPg(pg(`<h1>Success!</h1><br><p>Project created!</p>`));
              next.textContent = "Close";
              on(next, "click", () => {
                modal.close();
                rem(modal);
              });
            } catch(e) {
              next = nextPg(pg(`<h1>Fail</h1><p>An error occured during initialzation.</p><p>${e}</p>`));
              next.textContent = "Close";
              on(next, "click", () => {
                modal.close();
                rem(modal);
              });
            }
          });
        });
      });
    });
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fNewProj, "click", genProj);
async function openFile() {
  try {
    const file = await chooseFile();
    if(!file) return;
    const cont = fsRead(file);
    projAppend(file, cont);
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fOpenFile, "click", openFile);
async function openFolder() {
  try {
    const folder = await chooseDir();
    if(!folder) return;
    const files = fsReadDir(folder);
    sidebar.innerHTML = ""; // clear old
    const ul = mk("ul");
    files.forEach(f => {
      const li = mk("li", { innerText: f });
      li.onclick = () => openFileView(pathJoin(folder, f));
      add(li, ul);
      add(mk("br"), ul);
    });
    add(ul, sidebar);
  } catch(e) {
    console.error(`An error occurred: ${e}`);
  }
}
on(fOpenFolder, "click", openFolder);
async function openProj() {
  try {
    const folder = await chooseDir();
    if(!fsExists(pathJoin(folder, "project.json"))) throw new Error(`Invalid project path '${folder}'. (missing 'project.json')`);
    const files = fsReadDir(folder);
    sidebar.innerHTML = ""; // clear old
    const ul = mk("ul");
    files.forEach(f => {
      const li = mk("li", { innerText: f });
      li.onclick = () => openFileView(pathJoin(folder, f));
      add(li, ul);
    });
    add(ul, sidebar);
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fOpenProj, "click", openProj);
function save() {
  try {
    const cont = fsRead(curFile);
    fsWrite(curFile, cont);
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fSave, "click", save);
async function saveAs() {
  try {
    const file = await chooseFile();
    const cont = fsRead(curFile);
    fsWrite(file, cont);
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fSaveAs, "click", saveAs);
function openFileView(filePath) {
  const content = fsRead(filePath);
  curFile = filePath;

  if(!Array.from(editorTabs.children).some(c => c.innerText == pathBasename(filePath))) {
    const tab = mk("button", { innerText: pathBasename(filePath) });
    on(tab, "click", () => showEditor(filePath));
    add(tab, editorTabs);
  }

  editorArea.value = content;
  editorArea.style.width = "100%";
  editorArea.style.height = "calc(100vh - 40px)";
  editorArea.dataset.path = filePath;

  if(!editorPane.contains(editorArea)) add(editorArea, editorPane);
}
function showEditor(filePath) {
  const content = fsRead(filePath);
  editorArea.value = content;
}

console.log(
  '👋 This message is being logged by "renderer.js", included via Vite',
);
