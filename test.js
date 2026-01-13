const { GSFunc } = module_dev;
const { entity, string, int, float, number, bool, array, func, gsVoid } = runtime.scope;

const epicFunc = new GSFunc({
    gsFuncDesire: false,
    gsFuncName: "epicfunc",
    gsFuncArgs: [],
    gsFuncType: gsVoid,
    gsFuncBody: () => { console.log("hello world"); }
});

module.exports = { epicFunc };