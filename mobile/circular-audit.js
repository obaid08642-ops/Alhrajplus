#!/usr/bin/env node
// Detect circular imports in /app/mobile/src
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
function resolveImport(from, spec) {
    if (!spec.startsWith(".")) return null;
    const base = path.dirname(from);
    let abs = path.resolve(base, spec);
    if (fs.existsSync(abs + ".js")) return abs + ".js";
    if (fs.existsSync(abs + "/index.js")) return abs + "/index.js";
    if (fs.existsSync(abs)) return abs;
    return null;
}
const graph = {};
for (const f of walk(ROOT)) {
    const code = fs.readFileSync(f, "utf8");
    let ast;
    try { ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] }); } catch { continue; }
    graph[f] = [];
    traverse(ast, {
        ImportDeclaration(p) {
            const r = resolveImport(f, p.node.source.value);
            if (r) graph[f].push(r);
        }
    });
}
function findCycles() {
    const cycles = [];
    const visited = new Set();
    const stack = [];
    function dfs(node) {
        const idx = stack.indexOf(node);
        if (idx !== -1) {
            cycles.push(stack.slice(idx).concat(node).map(p => p.replace(ROOT+"/","")));
            return;
        }
        if (visited.has(node)) return;
        visited.add(node);
        stack.push(node);
        for (const n of (graph[node] || [])) dfs(n);
        stack.pop();
    }
    for (const f of Object.keys(graph)) dfs(f);
    return cycles;
}
const cycles = findCycles();
if (cycles.length === 0) console.log("✅ No circular imports");
else { cycles.slice(0, 20).forEach(c => console.log("CYCLE: " + c.join(" → "))); console.log(`\nTotal cycles: ${cycles.length}`); }
