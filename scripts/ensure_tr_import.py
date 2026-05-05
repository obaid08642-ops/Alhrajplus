#!/usr/bin/env python3
"""Idempotent: ensures `tr` is imported from @/contexts/I18nContext in every JS file that calls tr(...)."""
import os, re

SRC_DIR = "/app/frontend/src"
EXCLUDE = {"I18nContext.js", "auto_translations.json"}

CALLS_TR = re.compile(r"\btr\s*\(")
IMPORT_RE = re.compile(r"""import\s*\{([^}]*)\}\s*from\s*["']@/contexts/I18nContext["']\s*;?""")


def fix(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    if not CALLS_TR.search(content):
        return False
    m = IMPORT_RE.search(content)
    if m:
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        if "tr" in names:
            return False
        names.append("tr")
        new_imp = "import { " + ", ".join(names) + ' } from "@/contexts/I18nContext";'
        new = content[:m.start()] + new_imp + content[m.end():]
    else:
        # Insert after first `import` block
        lines = content.split("\n")
        last = -1
        for i, ln in enumerate(lines):
            if ln.strip().startswith("import "):
                last = i
        if last >= 0:
            lines.insert(last + 1, 'import { tr } from "@/contexts/I18nContext";')
        else:
            lines.insert(0, 'import { tr } from "@/contexts/I18nContext";')
        new = "\n".join(lines)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)
    return True


def main():
    n = 0
    for root, _, files in os.walk(SRC_DIR):
        for fn in files:
            if not (fn.endswith(".js") or fn.endswith(".jsx")):
                continue
            if fn in EXCLUDE:
                continue
            path = os.path.join(root, fn)
            try:
                if fix(path):
                    n += 1
                    print(f"  added tr import: {os.path.relpath(path, SRC_DIR)}")
            except Exception as e:
                print(f"  ERROR {path}: {e}")
    print(f"Total: {n}")


if __name__ == "__main__":
    main()
