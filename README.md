# GhostScript
This is the home of the GhostScript language!

# IMPORTANT
For those with existing GS installs, PLEASE remove "C:\\Program Files\\GhostScript".\
GS installs will be moving to "C:\\GhostScript"!

# About
GhostScript is a free, open-source programming language designed to simplify your scripting experience and handle the hard parts for you.\
Ghost offers an expansive preprocessor system to deal with dependencies before the script is executed.\
Ghost also includes the Autodebugger API, Context Awareness API and Ghost Assistant API.\
The Autodebugger API is AI-powered to analyze your script to solve errors and include documentation.\
The Context Awareness API tries to figure out "what you meant".\
The Ghost Assistant API is able to help you with development within Ghost - be it learning, scripting or anything else you might need.

# Why GhostScript
GhostScript is built to make programming easier, not stricter. If you want something added at the core level, *you can add it*.\
Where other languages punish mistakes or limit creativity, Ghost gives you total control.\
Use the same name for a variable, function and method? Fine. Add spaces or symbols for readability? Go ahead. Want to ***create your own operator?*** Please do.\
Ghost is alive and evolving - its creator, [@BeanTheAlien](https://github.com/BeanTheAlien), keeps pushing updates that expand what a scripting language can do.\
Got a project? Try GhostScript and see how much simpler coding can feel.

# Version 0.0.7

# Downloads
## Stable
ghostscript@v0.0.7 - [download](https://github.com/BeanTheAlien/GhostScript/releases/tag/v0.0.7)\
ghostscript@v0.0.6 - [download](https://github.com/BeanTheAlien/GhostScript/releases/tag/v0.0.6)

<!--## Unstable-->
<!--ghostscript - <a href="" download>download</a>-->

# Install
```
npm install @beanthealien/ghostscript
```
<!--
Install by download:
1. Go to the downloads section.
2. Download the version you want. (suggested stable@recent)
3. Run `ghostscript-wizard.exe`
4. Optionally add modules you want preinstalled on your system (this helps with performance with high-dependency/long scripts!)
5. Complete the installation
-->

# Usage
## Running A Script
**VS Code**\
Navigate to your script.\
Click `Run > Run and Debug` (select GhostScript as your running option if prompted).\
**GhostScript IDE**\
Navigate to your script.\
Click `Run` or the green arrow.
## Making A Hello World
*For a full guide to development with GhostScript, see **[Ghost For Dummies](https://docs.google.com/document/d/1yntdIvCY6ATQ7Lp2TrRnakA3mU7svRQF1-CldOq83hc/edit?usp=drivesdk)***\
Start by making a new file with the `.gst` file extension.\
Open the file in your favorite editor.\
Start by writing this line into the script:\
`import ghost;`\
This will import the GhostScript standard library into the script's modules.\
Next, we will decide if we want to use an entry function (main) or not.\
This line is important to printing "Hello, World!", regardless of using an entry function or not:\
`console.writeline("Hello, World!");`\
This calls the `console` object (the terminal output window) and uses its method `writeline`.\
The `writeline` method writes a string to the console, ending with a newline.\
If you run your script, you should see "Hello, World!" in the output.\
With an entry function, we use the `function` declaration with the name `main`.\
The syntax for declaring our entry function is:\
`function main()`\
But, we aren't done yet.\
We need to add curly braces to define the scope of the entry function.
```
function main() {

}
```
In order to get our function to do anything, we need to write content inside the curly braces.\
Put the console writeline as shown earlier inside:
```
function main() {
    console.writeline("Hello, World!");
}
```
Try running your script - you should see "Hello, World!".

# Documentation
<a href="https://docs.google.com/document/d/1v5lAGBtDkGrv2eEFVrlzB9dqm6KoyQWsBLZ5BTpgsb0/edit?usp=sharing">GhostScript docs</a>

# Command Prompt Commands
*The following all work when using commands: ghostscript, ghost, gst, gs.*\
`init` - Creates a new GhostScript project at the current directory.\
`install` - Installs a GhostScript module onto your system.\
`run` - Executes a GhostScript file.\
`snapshot` - Creates a new text file with the contents of the file path provided with the filename and ISO string as the name.\
`upd` - Updates the GhostScript package.\
`version` - Prints out the version of the installed GhostScript package.

# Changelog
## 0.0.3
- Added new `upd` command. (runs `npm update ghostscript`)
- Major change to stdlib, you can find the full Ghost module at https://github.com/BeanTheAlien/BeanTheAlien.github.io/tree/main/ghost/modules/ghost
## 0.0.4
- Updated the stdlib to fix an error where it referenced undeclared types.
- Updated src/main to fix a lot of errors.
## 0.0.5
- Updated src/main to add method support and fixed errors.
- Updated src/main to work on the parser to support funcs. Started working on method support.
## 0.0.6
- Got src/main finally working. Supports very primitive scripts.
## 0.0.7
- Added variable support (define with `var`).
- Fixed an error in the stdlib that would cause undefined to not print.
- Fixed an error in the stdlib that would cause null and undefined to not be different values.

# Roadmap
~~- More comprehensive lexer/compiler. (v0.0.6)~~
