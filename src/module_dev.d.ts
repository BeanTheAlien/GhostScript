type Attach = GSType | GSType[];
interface GSVarData {
    gsVarMods: GSModifier[];
    gsVarType: GSType;
    gsVarDesire: boolean;
    gsVarName: string;
    gsVarVal: any;
}
interface GSFuncData {
    gsFuncDesire: boolean;
    gsFuncType: GSType;
    gsFuncName: string;
    gsFuncArgs: GSArg[];
    gsFuncBody: Function;
}
interface GSMethodData {
    gsMethodDesire: boolean;
    gsMethodType: GSType;
    gsMethodName: string;
    gsMethodAttach: Attach;
    gsMethodArgs: GSArg[];
    gsMethodBody: Function;
}
interface GSClassData {
    gsClassType: string;
    gsClassName: string;
    gsClassBuilder: Function;
}
interface GSPropData {
    gsPropDesire: boolean;
    gsPropAttach: Attach;
    gsPropName: string;
    gsPropGet: Function;
    gsPropSet: Function;
}
interface GSTypeData {
    gsTypeName: string;
    gsTypeTest: <T>(v: T) => boolean;
}
interface GSModifierData {
    gsModifierAttach: Attach;
    gsModifierName: string;
    gsModifierGet: Function;
    gsModifierSet: Function;
}
interface GSOperatorData {
    gsOperatorName: string;
    gsOperatorExec: Function;
}

declare class GSVar implements GSVarData {
    gsVarMods: GSModifier[];
    gsVarType: GSType;
    gsVarDesire: boolean;
    gsVarName: string;
    gsVarVal: any;
}
declare class GSFunc implements GSFuncData {
    gsFuncDesire: boolean;
    gsFuncType: GSType;
    gsFuncName: string;
    gsFuncArgs: GSArg[];
    gsFuncBody: Function;
}
declare class GSMethod implements GSMethodData {
    gsMethodDesire: boolean;
    gsMethodType: GSType;
    gsMethodName: string;
    gsMethodAttach: Attach;
    gsMethodArgs: GSArg[];
    gsMethodBody: Function;
}
declare class GSClass implements GSClassData {
    gsClassType: string;
    gsClassName: string;
    gsClassBuilder: Function;
}
declare abstract class GSType implements GSTypeData {
    gsTypeName: string;
    abstract gsTypeTest: <T>(v: T) => boolean;
}
declare class GSModifier implements GSModifierData {
    gsModifierAttach: Attach;
    gsModifierName: string;
    gsModifierGet: Function;
    gsModifierSet: Function;
}
declare class GSOperator implements GSOperatorData {}
/**
 * Used for creating operators.
 * @class
 */
class GSOperator {
    /**
     * The constructor for GhostScript operators.
     * @param {{ gsOperatorName: string, gsOperatorExpression: string[], gsOperatorExec: function, gsOperatorType: GSType, gsOperatorDesire: boolean }} s - The operator settings.
     */
    constructor(s) {
        this.gsOperatorName = s.gsOperatorName;
        this.gsOperatorExpression = s.gsOperatorExpression;
        this.gsOperatorExec = s.gsOperatorExec;
        this.gsOperatorType = s.gsOperatorType;
        this.gsOperatorDesire = s.gsOperatorDesire;
    }
}
/**
 * Used for creating directives.
 * @class
 */
class GSDirective {
    /**
     * The constructor for GhostScript directives.
     * @param {{ gsDirectiveName: string, gsDirectiveExec: function }} s - The directive settings.
     */
    constructor(s) {
        this.gsDirectiveName = s.gsDirectiveName;
        this.gsDirectiveExec = s.gsDirectiveExec;
    }
}
/**
 * Used for creating arguments.
 * @class
 */
class GSArg {
    /**
     * The constructor for GhostScript arguments.
     * @param {{ gsArgName: string, gsArgVal: Object, gsArgDesire: boolean, gsArgType: GSType }} s - The argument settings.
     */
    constructor(s) {
        this.gsArgName = s.gsArgName;
        this.gsArgVal = s.gsArgVal;
        this.gsArgDesire  = s.gsArgDesire;
        this.gsArgType = s.gsArgType;
    }
}
/**
 * Used for creating managers.
 * @class
 */
class GSManager {
    /**
     * The constructor for GhostScript managers.
     * @param {{ gsManagerName: string, gsManagerVals: Object }} s - The manager settings.
     */
    constructor(s) {
        this.gsManagerName = s.gsManagerName;
        this.gsManagerVals = s.gsManagerVals;
    }
    /**
     * Gets an entry.
     * @param {string} name - The entry name.
     * @returns {Object|undefined} The entry value.
     */
    get(name) {
        return this.gsManagerVals[name];
    }
    /**
     * Sets an entry.
     * @param {string} name - The entry name.
     * @param {Object} val - The entry value.
     */
    set(name, val) {
        this.gsManagerVals[name] = val;
    }
    /**
     * Deletes an entry.
     * @param {string} name - The entry name.
     */
    del(name) {
        delete this.gsManagerVals[name];
    }
}

module.exports = {
    GSVar, GSFunc, GSMethod, GSClass,
    GSType, GSProp, GSModifier, GSErr,
    GSEvent, GSGroup, GSOperator,
    GSDirective, GSArg, GSManager
};