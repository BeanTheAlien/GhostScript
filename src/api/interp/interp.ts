import { runtime } from "../../main-beta.js";
import { GSArg, GSFunc, GSMethod } from "../../module_dev.js";
import { findFunction, findMethod, runFunc, runMethod } from "../lookup/lookup.js";
import { type Node, type Parsed, type ParsedMemberExpr, type ParsedCallExpr, parseParam, NodeMap } from "../parser/parser.js";
import { TokenList } from "../tokenizer/tokenizer.js";

//<T extends keyof NodeMap>(node: NodeMap[T]["node"])
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
    const __declarationParseParams = (params: TokenList[]) => params.map((p) => {
        const parsed = parseParam(p);
        return new GSArg({ gsArgName: parsed.name, gsArgVal: parsed.val, gsArgDesire: parsed.desire, gsArgType: parsed.type });
    });
    if(t == "FuncDec" || t == "MethodDec") {
        const { mods, name, params } = node.val[0];
        const bodyNode = node.val[1];
        const body = bodyNode.node.val;
        const ents: { [x: string]: any } = {};
        const __args = __declarationParseParams(params);
        const d = mods.includes("desire");
        const e = runtime.scope.entity;
        const __resolveFormalArgs = (args: any[], formal: GSArg[]) => {
            formal.forEach((arg, i) => {
                const v = args[i] !== undefined ? args[i] : arg.gsArgVal;
                arg.gsArgVal = v;
            });
        }
        const __setFormalArgs = (formal: GSArg[]) => {
            formal.forEach(f => {
                if(runtime.has(f.gsArgName)) ents[f.gsArgName] = runtime.scope[f.gsArgName];
                runtime.scope[f.gsArgName] = f.gsArgVal;
            });
        }
        const __runBody = (nodes: Node[]) => nodes.forEach(n => interp(n));
        const __postExecRemoveFormal = (formal: GSArg[]) => {
            formal.forEach(f => {
                if(Object.hasOwn(ents, f.gsArgName)) runtime.scope[f.gsArgName] = ents[f.gsArgName];
                else delete runtime.scope[f.gsArgName];
            });
        }
        const __runThroughExec = (formal: GSArg[], body: Node[]) => {
            __setFormalArgs(formal);
            __runBody(body);
            __postExecRemoveFormal(formal);
        }
        if(t == "FuncDec") {
            const gsf = new GSFunc({
                gsFuncDesire: d,
                gsFuncType: e,
                gsFuncName: name,
                gsFuncArgs: __args,
                gsFuncBody: (...args: any[]) => {
                    const formal = [...gsf.gsFuncArgs];
                    __resolveFormalArgs(args, formal);
                    __runThroughExec(formal, body);
                }
            });
            runtime.scope[name] = gsf;
        } else {
            const gsm = new GSMethod({
                gsMethodDesire: d,
                gsMethodType: e,
                gsMethodName: name,
                gsMethodAttach: e,
                gsMethodArgs: __args,
                gsMethodBody: (target: any, ...args: any[]) => {
                    const formal = [...gsm.gsMethodArgs];
                    __resolveFormalArgs(args, formal);
                    runtime.scope["target"] = target;
                    __runThroughExec(formal, body);
                    delete runtime.scope["target"];
                }
            });
            runtime.scope[name] = gsm;
        }
        return;
    }
}

export { interp };