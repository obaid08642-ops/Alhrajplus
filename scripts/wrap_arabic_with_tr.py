#!/usr/bin/env python3
"""
Bulk-wraps hardcoded Arabic strings in frontend JSX files with tr().

NEW STRATEGY:
  - Import `tr` directly from `@/contexts/I18nContext` at module level.
  - This avoids needing useI18n() in every sub-component.
  - Wrap JSX text nodes and translatable attributes containing Arabic.

Run via:  python3 /app/scripts/wrap_arabic_with_tr.py
"""
import os, re

SRC_DIR = "/app/frontend/src"
EXCLUDE_FILES = {"I18nContext.js", "auto_translations.json"}
EXCLUDE_DIRS = {"components/ui"}

AR_CLASS = r"\u0600-\u06FF\u0750-\u077F"
AR_RE = re.compile(f"[{AR_CLASS}]")

TRANSLATABLE_ATTRS = {"placeholder", "title", "alt", "aria-label", "label"}


def ensure_tr_import(content):
    """Make sure `tr` is imported from @/contexts/I18nContext."""
    # Check if tr is already imported
    # Pattern A: import { tr } from '@/contexts/I18nContext'
    # Pattern B: import { useI18n, tr } from '@/contexts/I18nContext'
    # Pattern C: import { useI18n } from '@/contexts/I18nContext'  → add tr
    # Pattern D: no import at all                                   → add new import

    # Look for existing import line(s)
    pattern = re.compile(r"""import\s*\{([^}]*)\}\s*from\s*["']@/contexts/I18nContext["']\s*;?""")
    m = pattern.search(content)
    if m:
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        if "tr" in names:
            return content
        names.append("tr")
        new_import = "import { " + ", ".join(names) + ' } from "@/contexts/I18nContext";'
        return content[:m.start()] + new_import + content[m.end():]

    # No import — insert one after the last import statement at the top.
    # find last import line
    lines = content.split("\n")
    last_import_idx = -1
    for i, ln in enumerate(lines):
        if ln.strip().startswith("import "):
            last_import_idx = i
        elif last_import_idx >= 0 and ln.strip() == "":
            continue
        elif last_import_idx >= 0:
            break
    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, 'import { tr } from "@/contexts/I18nContext";')
    else:
        lines.insert(0, 'import { tr } from "@/contexts/I18nContext";')
    return "\n".join(lines)


def wrap_jsx_text_nodes(content):
    pattern = re.compile(
        r"(>)([^<>{}\n]*[" + AR_CLASS + r"][^<>{}\n]*)(<)",
        re.UNICODE,
    )

    def repl(m):
        text = m.group(2)
        if not text.strip():
            return m.group(0)
        if "${" in text or "`" in text:
            return m.group(0)
        escaped = text.replace("\\", "\\\\").replace('"', '\\"')
        return f'>{{tr("{escaped}")}}<'

    return pattern.sub(repl, content)


def wrap_jsx_attributes(content):
    attrs_alt = "|".join(re.escape(a) for a in TRANSLATABLE_ATTRS)
    pattern = re.compile(
        rf'(\b(?:{attrs_alt})\s*=\s*)"([^"<>\n]*[{AR_CLASS}][^"<>\n]*)"',
        re.UNICODE,
    )

    def repl(m):
        prefix, val = m.group(1), m.group(2)
        if "${" in val or "`" in val:
            return m.group(0)
        escaped = val.replace("\\", "\\\\").replace('"', '\\"')
        return f'{prefix}{{tr("{escaped}")}}'

    return pattern.sub(repl, content)


def process_file(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    if not AR_RE.search(content):
        return 0
    new_content = wrap_jsx_text_nodes(content)
    new_content = wrap_jsx_attributes(new_content)
    if new_content == content:
        return 0
    new_content = ensure_tr_import(new_content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    return 1


def main():
    changed, scanned = 0, 0
    for root, dirs, files in os.walk(SRC_DIR):
        rel = os.path.relpath(root, SRC_DIR)
        if any(rel.startswith(d) for d in EXCLUDE_DIRS):
            continue
        for fn in files:
            if not (fn.endswith(".js") or fn.endswith(".jsx")):
                continue
            if fn in EXCLUDE_FILES:
                continue
            path = os.path.join(root, fn)
            scanned += 1
            try:
                if process_file(path):
                    changed += 1
                    print(f"  edited: {os.path.relpath(path, SRC_DIR)}")
            except Exception as e:
                print(f"  ERROR in {path}: {e}")
    print(f"\nScanned {scanned} files, edited {changed}.")


if __name__ == "__main__":
    main()
