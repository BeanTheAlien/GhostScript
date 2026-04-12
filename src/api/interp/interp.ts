import { runtime } from "../../main-beta.js";
import { findFunction, findMethod, runFunc, runMethod } from "../lookup/lookup.js";
import type { Node } from "../parser/parser.js";

function interp(node: Node): any {
    const t = node.type;
    if(t == "Literal") return node.val;
    if(t == "Id") {
        if(runtime.has(node.val)) return runtime.get(node.val);
        return undefined;
    }
    if(t == "MemberExpr") {
        // Evaluate left side (the object)
        const obj: any = interp(node.val.obj);
        // property node is usually { type: 'Id', val: 'propName' }
        const propName = node.val.prop;
        if(obj == null) {
            console.error("MemberExpression: target is null/undefined", node);
            throw new Error("Cannot access property of null/undefined");
        }
        // normal JS property access
        return obj[propName];
    }
    if(t == "CallExpr") {
        // If callee is a MemberExpression, handle as method/JS-method
        if(node.val.callee.type == "MemberExpression") {
            // evaluate object (target) first
            const targetValue: any = interp(node.val.callee.object);
            // get property name
            const methodName = node.val.callee.prop && node.val.callee.prop.val;
            const args = node.val.args.map(interp);

            // First try Ghost method (GSMethod lookup)
            const gsMethod = findMethod(targetValue, methodName);
            if(gsMethod) {
                return runMethod(gsMethod, targetValue, ...args);
            }

            // Fallback: JS property on object, call it with correct this
            const maybeFn = targetValue && targetValue[methodName];
            if(typeof maybeFn == "function") {
                return maybeFn.apply(targetValue, args);
            }

            console.error("CallExpression: method not found:", methodName, "on", targetValue, "node:", node);
            throw new Error(`Method '${methodName}' not found on target.`);
        }

        // Otherwise callee is not a member expression (e.g. Identifier or nested CallExpression)
        // Evaluate callee to a value
        const calleeVal: any = interp(node.val.callee);
        const args = node.val.args.map(interp);

        // If calleeVal is a plain JS function, call it
        if(typeof calleeVal == "function") {
            return calleeVal(...args);
        }

        // If calleeVal looks like a GSFunc (has gsFuncBody), use runFunc
        if(calleeVal && calleeVal.gsFuncBody) {
            return runFunc(calleeVal, ...args);
        }

        // If callee is a name (string) try to resolve from runtime.scope or modules (defensive)
        if(typeof calleeVal == "string") {
            // try to find a GS function by that name
            const fn = findFunction(calleeVal);
            if(fn) return runFunc(fn, ...args);

            // try JS global in runtime.scope
            if(runtime.scope && runtime.scope[calleeVal] && typeof runtime.scope[calleeVal] == "function") {
                return runtime.scope[calleeVal](...args);
            }
        }

        console.error("CallExpression: cannot call calleeVal:", calleeVal, "node:", node);
        throw new Error(`Cannot call '${String(calleeVal)}'`);
    }
    if(t == "Dec") runtime.set(node.val, undefined);
    if(t == "Assignment") {
        const nm = node.val[0];
        const vl = node.val[1];
        runtime.set(nm, interp(vl));
    }
    if(t == "ArrayExpr") return node.val.map(interp);
    if(t == "BlockStm") node.val.forEach(interp);
    if(t == "FuncDec") {
        const { mods, name, params } = node.val[0];
        const bodyNode = node.val[1];
        const body = bodyNode.node.val;
    }
}

export { interp };