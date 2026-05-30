#!/usr/bin/env node
// Find references to `t` that are NOT preceded by a `useI18n()` destructure 
// or function parameter destructure within the same function scope.
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
    if (!code.includes(" t(")) continue;
    let ast;
    try { ast = parser.parse(code, { sourceType: "module", plugins: ["jsx","classProperties","optionalChaining","nullishCoalescingOperator","objectRestSpread","asyncGenerators"] }); }
    catch { continue; }

    traverse(ast, {
        CallExpression(p) {
            const c = p.node.callee;
            if (c.type !== "Identifier" || c.name !== "t") return;
            // Walk up: ensure `t` is bound somewhere in scope.
            // Babel's scope tracks bindings.
            const binding = p.scope.getBinding("t");
            if (!binding) {
                issues.push({
                    file: file.replace(ROOT+"/",""),
                    line: p.node.loc.start.line,
                    msg: `t(...) called but 't' is NOT bound in scope`
                });
            }
        }
    });
}
if (issues.length === 0) console.log("✅ All t() calls have 't' bound in scope.");
else { issues.forEach(i => console.log(`${i.file}:${i.line}  ${i.msg}`)); console.log(`\nTotal: ${issues.length}`); }
