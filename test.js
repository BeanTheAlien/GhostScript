const { GSFunc } = module_dev;
const { entity, string, int, float, number, bool, array, func, gsVoid } = runtime.scope;

const ghostmodule = {
    name: "EpicFile",
    desc: "epic",
    version: "0.0.0",
    author: "beanthealien",
    root: "test.js",
    reqroot: false,
    defroot: "epic"
};

const epicFunc = new GSFunc({
    gsFuncDesire: false,
    gsFuncName: "epicfunc",
    gsFuncArgs: [],
    gsFuncType: gsVoid,
    gsFuncBody: () => { console.log("hello world"); }
});

module.exports = { ghostmodule, epicFunc };