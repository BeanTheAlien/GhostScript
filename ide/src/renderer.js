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

const mk = (tag, opts = {}) => Object.assign(document.createElement(tag), opts);
const add = (c, p = document.body) => p.appendChild(c);
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
const run = nbd("Run", ``);
const terminal = nbd("Terminal", ``);
const help = nbd("Help", ``);
const community = nbd("Community", ``);
const github = nbl("GitHub", "https://github.com/BeanTheAlien/GhostScript");
ul.innerHTML = [file, edit, view, run, terminal, help, community, github].join("");
add(ul);
const [fNewFile, fNewFolder, fNewProj, fOpenFile, fOpenFolder, fOpenProj, fSave, fSaveAs] = ["new_file", "new_folder", "new_proj", "open_file", "open_folder", "open_proj", "save", "save_as"].map(id => el(id));
async function genFile() {
  try {
    const handle = await window.showSaveFilePicker({
      excludeAcceptAllOption: true,
      types: [{
        accept: {
          "ghostscript/text": [".gst"]
        }
      }]
    });
    const stream = await handle.createWritable();
    await stream.write("");
    await stream.close();
  } catch(e) {
    console.error(`An error occured: ${e}`);
  }
}
on(fNewFile, "click", genFile);

console.log(
  '👋 This message is being logged by "renderer.js", included via Vite',
);
