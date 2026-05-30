#!/usr/bin/env node
// Comprehensive hook violation detector:
//  A) Hook called outside any component/custom-hook function
//  B) Hook called inside a non-component/non-hook function (e.g., handlers, helpers)
//  C) Hook called inside conditional/loop body
//  D) Hook called as argument of another hook (nested hook call)
//  E) Component invoked as plain function call (PascalCase()) — runs hooks without React tracking
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const ROOT = "/app/mobile/src";

function walk(d, o=[]) {
    for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        const s = fs.statSync(p);
        if (s.isDirectory()) walk(p, o);
        else if (p.endsWith(".js")) o.push(p);
    }
    return o;
}
function nameOfFn(p) {
    if (p.node.id?.name) return p.node.id.name;
    if (p.parentPath?.isVariableDeclarator?.() && p.parentPath.node.id.type === "Identifier")
        return p.parentPath.node.id.name;
    if (p.parentPath?.isAssignmentExpression?.() && p.parentPath.node.left.type === "Identifier")
        return p.parentPath.node.left.name;
    return null;
}
const issues = [];
for (const file of walk(ROOT)) {
    const code = fs.readFileSync(file, "utf8");
    let ast;
    try { ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] }); }
    catch { continue; }

    traverse(ast, {
        CallExpression(p) {
            const c = p.node.callee;
            if (c.type !== "Identifier") return;
            const cname = c.name;

            // (E) Component invoked as plain function call — PascalCase() not via JSX.
            // Heuristic: callee starts uppercase, NOT a known constructor (Date/Array/etc.)
            if (/^[A-Z]/.test(cname) && !/^[A-Z_]+$/.test(cname)) {
                const blacklist = new Set(["Date","Array","Object","String","Number","Boolean","Map","Set","Promise","Error","RegExp","Symbol","BigInt","Math","JSON","Buffer","Reflect","Proxy","WeakMap","WeakSet","TypeError","RangeError","SyntaxError","ReferenceError","EvalError","URIError","AggregateError","Animated","StyleSheet","FlatList","ScrollView","SectionList","View","Text","Image","Linking","Dimensions","Platform","I18nManager","Keyboard","Easing","Alert","PixelRatio","Vibration","AppState"]);
                if (!blacklist.has(cname)) {
                    // Could be `MyComponent()` — flag suspicious if file contains JSX <MyComponent
                    const callsHooksHeur = code.includes("function " + cname) || code.includes("const " + cname + " =");
                    if (callsHooksHeur) {
                        issues.push({ file: file.replace(ROOT+"/",""), line: p.node.loc.start.line, msg: `Possible component called as plain function: ${cname}()` });
                    }
                }
            }

            if (!/^use[A-Z]/.test(cname)) return;
            // Hook detected. Find the nearest enclosing Function.
            let cur = p.parentPath;
            let nestedInsideHookArg = null;
            let conditionalAncestor = null;
            while (cur) {
                if (cur.isCallExpression()) {
                    const pc = cur.node.callee;
                    if (pc.type === "Identifier" && /^use[A-Z]/.test(pc.name) && cur.node.callee !== c) {
                        nestedInsideHookArg = pc.name;
                    }
                }
                if (cur.isIfStatement() || cur.isConditionalExpression() || cur.isLogicalExpression() || cur.isForStatement() || cur.isWhileStatement() || cur.isForOfStatement() || cur.isForInStatement() || cur.isTryStatement() || cur.isSwitchStatement()) {
                    conditionalAncestor = cur.type;
                }
                if (cur.isFunction()) {
                    const fnName = nameOfFn(cur);
                    if (!fnName || !(/^use[A-Z]/.test(fnName) || /^[A-Z]/.test(fnName))) {
                        issues.push({ file: file.replace(ROOT+"/",""), line: p.node.loc.start.line, msg: `${cname}() inside non-component/non-hook function: ${fnName || "<anonymous>"}` });
                    } else if (conditionalAncestor) {
                        issues.push({ file: file.replace(ROOT+"/",""), line: p.node.loc.start.line, msg: `${cname}() inside conditional/loop (${conditionalAncestor}) inside ${fnName}` });
                    } else if (nestedInsideHookArg) {
                        issues.push({ file: file.replace(ROOT+"/",""), line: p.node.loc.start.line, msg: `${cname}() nested inside ${nestedInsideHookArg}() argument` });
                    }
                    return;
                }
                cur = cur.parentPath;
            }
            issues.push({ file: file.replace(ROOT+"/",""), line: p.node.loc.start.line, msg: `${cname}() at MODULE level (outside any function)` });
        }
    });
}
if (issues.length === 0) console.log("✅ No violations.");
else { issues.forEach(i => console.log(`${i.file}:${i.line}  ${i.msg}`)); console.log(`\nTotal: ${issues.length}`); }
