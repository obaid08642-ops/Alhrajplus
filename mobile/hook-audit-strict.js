#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const ROOT = "/app/mobile/src";

function walkDir(d, o = []) {
    for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        const s = fs.statSync(p);
        if (s.isDirectory()) walkDir(p, o);
        else if (p.endsWith(".js")) o.push(p);
    }
    return o;
}
function isHookName(name) { return /^use[A-Z]/.test(name); }
function getEnclosingComponentOrHook(p) {
    let cur = p.parentPath;
    while (cur) {
        if (cur.isFunction()) {
            let name = null;
            if (cur.node.id && cur.node.id.name) name = cur.node.id.name;
            else if (cur.parentPath && cur.parentPath.isVariableDeclarator() && cur.parentPath.node.id.type === "Identifier") name = cur.parentPath.node.id.name;
            if (name && (/^use[A-Z]/.test(name) || /^[A-Z]/.test(name))) return cur;
            return null;
        }
        cur = cur.parentPath;
    }
    return null;
}
const issues = [];
for (const file of walkDir(ROOT)) {
    const code = fs.readFileSync(file, "utf8");
    if (!/use[A-Z]/.test(code)) continue;
    let ast;
    try { ast = parser.parse(code, { sourceType: "module", plugins: ["jsx","classProperties","optionalChaining","nullishCoalescingOperator","objectRestSpread"] }); }
    catch (e) { continue; }
    traverse(ast, {
        CallExpression(p) {
            const c = p.node.callee;
            if (c.type !== "Identifier") return;
            if (!isHookName(c.name)) return;
            const owner = getEnclosingComponentOrHook(p);
            if (!owner) {
                issues.push(`${file.replace(ROOT+"/","")}:${p.node.loc.start.line}  ${c.name}()  »  outside component/custom-hook`);
                return;
            }
            // also detect hook inside callback expr passed as arg (sibling hook nesting)
            let parent = p.parentPath;
            while (parent && parent !== owner) {
                if (parent.isCallExpression() && parent !== p) {
                    const pc = parent.node.callee;
                    if (pc.type === "Identifier" && isHookName(pc.name)) {
                        issues.push(`${file.replace(ROOT+"/","")}:${p.node.loc.start.line}  ${c.name}()  »  nested inside ${pc.name}() argument`);
                        return;
                    }
                }
                parent = parent.parentPath;
            }
        }
    });
}
if (issues.length === 0) console.log("✅ Total hook violations: 0");
else { issues.forEach(i => console.log(i)); console.log(`\nTotal: ${issues.length}`); }
