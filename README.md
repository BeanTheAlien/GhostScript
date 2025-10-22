# GhostScript
This is the home of the GhostScript language!

# About
GhostScript is a free, open-source programming language designed to simplify your scripting experience and handle the hard parts for you.\
Ghost offers an expansive preproccessor system to deal with dependencies before the script is executed.\
Ghost also includes the Autodebugger API, Context Awareness API and Ghost Assistant API.\
The Autodebugger API is AI-powered to analyze your script to solve errors and include documentation.\
The Context Awareness API tries to figure out "what you meant".\
The Ghost Assistant API is able to help you with development within Ghost - be it learning, scripting or anything else you might need.

# Version 0.0.5

<!--# Downloads
## Stable-->
<!--ghostscript - <a href="" download>download</a>-->

<!--## Unstable-->
<!--ghostscript - <a href="" download>download</a>-->

<!--# Install-->
<!--Install with npm:
```
npm install ghostscript
```

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

# Changelog
## 0.0.3
- Added new `upd` command. (runs `npm update ghostscript`)
- Major change to stdlib, you can find the full Ghost module at https://github.com/BeanTheAlien/BeanTheAlien.github.io/tree/main/ghost/modules/ghost
## 0.0.4
- Updated the stdlib to fix an error where it referenced undeclared types.
- Updated src/main to fix a lot of errors.
## 0.0.5
- Updated src/main to add method support and fixed errors.

# Roadmap
- More comprehensive lexer/compiler. (v0.0.6)