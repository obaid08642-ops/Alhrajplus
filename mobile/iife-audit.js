#!/usr/bin/env node
// Detect:
//  1) Hook calls inside IIFE at module top level
//  2) Hook calls inside default exported expression that runs at import
//  3) `t(` inside default exported expression / object literal at module top
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

const issues = [];
for (const file of walk(ROOT)) {
    const code = fs.readFileSync(file, "utf8");
    let ast;
    try { ast = parser.parse(code, { sourceType: "module", plugins: ["jsx","classProperties","optionalChaining","nullishCoalescingOperator","objectRestSpread"] }); }
    catch { continue; }

    traverse(ast, {
        CallExpression(p) {
            const c = p.node.callee;
            const name = c.type === "Identifier" ? c.name : null;
            if (!name) return;
            const isHook = /^use[A-Z]/.test(name);
            const isT = name === "t";
            if (!isHook && !isT) return;

            // Walk up: find IIFE (function called immediately), or arrow assigned to const at top level
            let cur = p.parentPath;
            let inIIFE = false;
            let inTopLevelExpr = false;
            while (cur) {
                if (cur.isFunction()) {
                    // Check if this function is being immediately invoked
                    const parent = cur.parentPath;
                    if (parent && parent.isCallExpression() && parent.node.callee === cur.node) {
                        // The function is the callee of an outer call → IIFE
                        // Check if THAT IIFE is at module top
                        let pp = parent.parentPath;
                        while (pp) {
                            if (pp.isProgram() || pp.isExpressionStatement() && pp.parentPath?.isProgram()) {
                                inIIFE = true; break;
                            }
                            if (pp.isFunction()) break;
                            pp = pp.parentPath;
                        }
                    }
                    break;
                }
                cur = cur.parentPath;
            }
            if (inIIFE) {
                issues.push(`${file.replace(ROOT+"/","")}:${p.node.loc.start.line}  ${name}() inside IIFE at module top — runs on import`);
            }
        }
    });
}
if (issues.length === 0) console.log("✅ No IIFE-level hook/t() calls.");
else { issues.forEach(i => console.log(i)); console.log(`Total: ${issues.length}`); }
