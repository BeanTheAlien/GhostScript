# GhostScript
This is the home of the GhostScript language!

# IMPORTANT
Note that GhostScript **is not development ready**.\
If you want to use GS in a development environment, please come back when v1.0.0 is released.\
I apologize for the inconvenience.

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

# Version 0.1.0

# Downloads
## Stable
ghostscript@v0.1.0 - [download](https://github.com/BeanTheAlien/GhostScript/releases/tag/v0.1.0)\
ghostscript@v0.0.10 - [download](https://github.com/BeanTheAlien/GhostScript/releases/tag/v0.0.10)\
ghostscript@v0.0.9 - [download](https://github.com/BeanTheAlien/GhostScript/releases/tag/v0.0.9)\
ghostscript@v0.0.8 - [download](https://github.com/BeanTheAlien/GhostScript/releases/tag/v0.0.8)\
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
`version` - Prints out the version of the installed GhostScript package.\
`wiz` - Runs the install wizard.\
`rebuild` - Removes all GhostScript files and re-installs.

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
## 0.0.8
- Fixed the remote loader. Started implementing better import logic.
- Added in ide path. Work in progress IDE.
- Added more commands. (wiz, rebuild)
## 0.0.9
- Added array support.
- Updated block parsing. Supports primitive parsing using '{' and '}'. (22/11/2025)
- Began adding function support. (29/11/2025)
- Continued development to add function support. (30/11/2025)
- Added function support. (30/11/2025)
- MAJOR: updated variable logic to properly print `undefined`, should a variable not exist, instead of printing the name. (01/12/2025)
- Implemented array access. You can retrieve multiple elements by seperating indexes to be retrieved by a comma. (02/12/2025)
- Major updates to fix array indexing. (02/12/2025)
## 0.0.10
- This new version of GS includes support for basic functions, array indexing and variable setting! (02/12/2025)
- If statements now work with comparison (with '=='). (03/12/2025)
- Extender operator support and updated some structural things. (03/12/2025)
- More if statement support. Supports validity check and not valid checks. (03/12/2025)
- Fixed an error that caused \<id\>, !\<id\> to not work. (04/12/2025)
- Added `true`, `false`, `null`, `undefined` as variables. (04/12/2025)
- Started implementing a better import system. (04/12/2025)
- Implemented logical operator handling. (04/12/2025)
- Implemented better import system. (04/12/2025)
- MAJOR: overhaul to better import system, fixed errors with better import system. (06/12/205)
- The params update is here! You can... delcare params! Also, funcs now respect the global scope. (07/12/2025)
- Decreased infinite loop detection count to 1M. (07/12/2025)
- Started implementing method support. (07/12/2025)
- Added `target` to keywords. (08/12/2025)
- Added parseCond to hopefully resolve conditional parsing outside of conditional headers. (10/12/2025)
- Made import non-greedy. (10/12/205)
- Added @huggingface/transforms to start implementing Auto Debugger API. (11/12/2025)
- Updated number matching to allow for a negative to proceed it. (12/12/2025)
- Updated array access to use `Array.prototype.at` to support negative indexing of arrays. (12/12/2025)
- Updated import system to check for a local file. To ensure local file import, use a string as the name of the import. (12/12/2025)
- The Auto Debugger API will be be paused until further notice. I apologize greatly and I hope to implement a solution as soon as possible. (14/12/2025)
- Fixed an error that caused `target` to be unexpected. (14/12/2025)
- Fixed an error that caused module failure to not be reachable. (14/12/2025)
- Fixed an error that caused everything to be evaluated as a method declaration. (14/12/205)
- Implemented ln/col, target error to be fixed. (15/12/2025)
- Target changed to return identifier, temporary fix to solve invalid context issue. ([#9](https://github.com/BeanTheAlien/GhostScript/issues/9)) (15/12/2025)
- Added config reading. Updated `infinite_buffering` breaking in infinite loops accordingly. (15/12/2025)
- Fixed an assignment to constant error. (15/12/2025)
- Removed negative check in parsing for error fixing. (16/12/2025)
- HOTFIX: the negative numbers hotfix should (hopefully) fix [#10](https://github.com/BeanTheAlien/GhostScript/issues/10). This fix needs to be tested. (16/12/2025)
- Started implementing object support. (16/12/2025)
- Added math support ([#11](https://github.com/BeanTheAlien/GhostScript/issues/11)). (16/12/2025)
- Fixed issue [#6](https://github.com/BeanTheAlien/GhostScript/issues/6). (16/12/2025)
- Fixed issue [#10](https://github.com/BeanTheAlien/GhostScript/issues/10). (16/12/2025)
## 0.1.0
- The summary of v0.0.10 bring us to the first minor release of GhostScript! (16/12/2025)
- Further implemented object support. Should an object key be a identifier and it does not have a comma to seperate it from the next entry, it will automatically capture that identifier and continue. (17/12/2025)
- Various enhancements to array access, added support for property GET via brackets. (17/12/2025)
- Started adding class support. (untested) (17/12/2025)
- Removed cache, because it was broken. (19/12/2025)
- Worked on class support. (24/12/2025)
- Removed class parsing for a future update. (05/01/2025)
- Worked on property set. (06/01/2025)
- Started adding for loop, started adding double-opr assignment. (06/01/2025)
- Continued development on double-opr support. (06/01/2025)
- Continued development on double-opr support. (07/01/2025)
- More parsing on for loops. (07/01/2025)
- Continued development on double-opr support. (08/01/2025)
- Worked on property SET bracket parsing fixes. (09/01/2025)
- Worked on property SET bracket parsing fixes. (09/01/2025)
- Fixed an oversight in property SET bracket. (09/01/2025)
- Fixed issues [#15](https://github.com/BeanTheAlien/GhostScript/issues/15) and [#16](https://github.com/BeanTheAlien/GhostScript/issues/16).

# Roadmap
- Further variable support.
- Cached imports.

# Complete
~~- More comprehensive lexer/compiler.~~ (v0.0.6)\
~~- Block statement parsing.~~ (v0.0.9)\
~~- Better import logic.~~ (v0.0.10)\
~~- Fix to not print the name of a variable if it was not defined.~~ (v0.0.9)\
~~- Logical operator support.~~ (v0.0.10)
