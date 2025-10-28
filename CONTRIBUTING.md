# Uploading A Module
Navigate to [https://github.com/BeanTheAlien/BeanTheAlien.github.io/](https://github.com/BeanTheAlien/BeanTheAlien.github.io/).\
Check for an existing module of the same name. Modules are found at `ghost/modules`.\
If a module of the same name exists, then you either need to prefix it (I.E., @beanthealien/my-module), change the name or contact me.\
If there's no name issues - great!\
Create a fork of the repository.\
Add your new module as a folder if it contains multiple files or a single file if it is only one.\
If you have a folder, ensure you have a file named `index.json`.\
In `index.json`, ensure you have the field "files".\
In "files", set it equal to an array of strings, with each entry representing a file you want to include within the module.\
Also ensure you have a file of the same name as the module.\
Every file needs to include an export with the name `ghostmodule`.\
The syntax for the `ghostmodule` object is:
```
const ghostmodule = {
    name: "the name of my module file",
    desc: "description of my module file.",
    version: "major.minor.patch",
    author: "module file author",
    root: "root file",
    reqroot: true/false,
    defroot: "default root"
};
```
Note: `reqroot` defines whether it should require the module call or not.\
If the file is the one that shares the name of the module, that is the **root file**.\
When all these steps are completed, create a pull request with your module.\
Your module will be reviewed and either accepted or denied whenever I have time to review it.\
If your module is denied, please review comments on why it was denied.\
Note: Files should utilize the `GhostScript Module Development API`. Check the README for a link.
