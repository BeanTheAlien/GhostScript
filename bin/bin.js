#!/usr/bin/env node
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
    console.log(`Unknown command: ${cmd}`);
}