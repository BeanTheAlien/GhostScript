#!/usr/bin/env node

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'run':
    console.log("run");
    break;
  case 'install':
    console.log("install");
    break;
  default:
    console.log(`Unknown command: ${cmd}`);
    console.log('Available: run, install');
}