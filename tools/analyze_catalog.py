import ast
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
seed = (root / "backend/seed_data.py").read_text()
tree = ast.parse(seed)
constants = {}
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        try:
            constants[node.targets[0].id] = ast.literal_eval(node.value)
        except (ValueError, TypeError):
            pass
categories = None
for node in tree.body:
    if isinstance(node, ast.Assign):
        names = [t.id for t in node.targets if isinstance(t, ast.Name)]
        if "CATEGORIES" in names:
            value = node.value
            # Replace simple Name references with their literal values.
            class Resolver(ast.NodeTransformer):
                def visit_Name(self, n):
                    return ast.copy_location(ast.parse(repr(constants[n.id]), mode="eval").body, n) if n.id in constants else n
            value = Resolver().visit(value)
            categories = ast.literal_eval(value)
            break
if not categories:
    raise SystemExit("CATEGORIES not found")

web = (root / "frontend/src/pages/HomePage.js").read_text()
icon_names = set(re.findall(r"from ['\"]lucide-react['\"]", web))
# lucide-react is imported as *Icons in HomePage; resolve names from installed package exports.
lucide_index = root / "frontend/node_modules/lucide-react/dist/cjs/lucide-react.js"
exports = set()
if lucide_index.exists():
    exports = set(re.findall(r"exports\.([A-Za-z0-9_]+)\s*=", lucide_index.read_text(errors="ignore")))

rows = []
for c in categories:
    subs = c.get("subcategories", [])
    icon = c.get("icon", "")
    rows.append({
        "key": c.get("key"),
        "name_ar": c.get("name_ar"),
        "name_en": c.get("name_en"),
        "icon": icon,
        "icon_resolves": (not exports or icon in exports),
        "subcategories": len(subs),
        "fields": len(c.get("fields", [])),
        "select_fields": sum(1 for f in c.get("fields", []) if f.get("type") == "select"),
        "text_fields": sum(1 for f in c.get("fields", []) if f.get("type") in {"text", "url"}),
    })
print(json.dumps({
    "category_count": len(categories),
    "subcategory_count": sum(r["subcategories"] for r in rows),
    "field_count": sum(r["fields"] for r in rows),
    "select_field_count": sum(r["select_fields"] for r in rows),
    "text_or_url_field_count": sum(r["text_fields"] for r in rows),
    "icons_unresolved": [r["icon"] for r in rows if not r["icon_resolves"]],
    "rows": rows,
}, ensure_ascii=False, indent=2))
