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
const proj = mk("div", { innerHTML: null });
var projData = {};
const projAppend = (f, c) => {
  if(projData[f]) return;
  if(!proj.length) proj.innerHTML = f;
  else proj.innerHTML = f;
  projData[f] = c;
}
add(proj);
function genFile() {
  try {
    // const handle = await window.showSaveFilePicker({
    //   excludeAcceptAllOption: true,
    //   types: [{
    //     accept: {
    //       "ghostscript/text": [".gst"]
    //     }
    //   }]
    // });
    // const stream = await handle.createWritable();
    // await stream.write("");
    // await stream.close();
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
    const cont = fsRead(file);
    projAppend(file, cont);
  } catch(e) {
    coneole.error(`An error occured: ${e}`);
  }
}
on(fOpenFile, "click", openFile);
async function openFolder() {
  try {
    const folder = await chooseDir();
    const cont = fsReadDir(folder);
    projAppend(folder, cont);
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fOpenFolder, "click", openFolder);
async function openProj() {
  try {
    const folder = await chooseDir();
    if(!fsExists(pathJoin(folder, "README.md"))) throw new Error(`Invalid project path '${folder}'. (missing 'README.md')`);
    proj.innerHTML = fsReadDir(folder);
    projData = folder;
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}

console.log(
  '👋 This message is being logged by "renderer.js", included via Vite',
);
