#!/usr/bin/env node
// Find module-level (top-of-file outside any function) hook calls
// AND module-level t(...) calls.
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
    try { ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] }); }
    catch (e) { issues.push({ file, line: 0, msg: "PARSE ERROR: " + e.message }); continue; }

    traverse(ast, {
        CallExpression(p) {
            const c = p.node.callee;
            const name = c.type === "Identifier" ? c.name : null;
            if (!name) return;
            const isHook = /^use[A-Z]/.test(name);
            const isT = name === "t";
            if (!isHook && !isT) return;
            // Check if inside any function
            let cur = p.parentPath;
            let inFunction = false;
            while (cur) {
                if (cur.isFunction()) { inFunction = true; break; }
                cur = cur.parentPath;
            }
            if (!inFunction) {
                issues.push({
                    file: file.replace(ROOT+"/", ""),
                    line: p.node.loc.start.line,
                    msg: `MODULE-LEVEL ${name}() call — runs at import time → crash`
                });
            }
        }
    });
}

if (issues.length === 0) console.log("✅ No module-level hook/t() calls found.");
else {
    issues.forEach(i => console.log(`${i.file}:${i.line}  ${i.msg}`));
    console.log(`\nTotal: ${issues.length}`);
}
