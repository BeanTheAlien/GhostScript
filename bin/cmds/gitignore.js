const fs = require("fs");

function gitignore() {
    const cont = `# GhostScript gitignore
# Module Cache
gscache/
# Installed Modules
gsmodules/
# GhostScript Executable Files (.gse)
*.gse
# GhostScript Error Logs
errlog-[0-9]*.md
# GhostScript Visualizer Cache
gsviscache/`;
    if(!fs.existsSync(".gitignore")) {
        fs.writeFileSync(".gitignore", cont);
    } else {
        fs.appendFileSync(".gitignore", cont);
    }
}

module.exports = { default: gitignore };