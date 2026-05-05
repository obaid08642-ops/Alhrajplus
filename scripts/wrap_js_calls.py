#!/usr/bin/env python3
"""Wraps Arabic strings inside common JS function call arguments with tr().
Targets:
  - alert("...arab...")
  - confirm("...arab...")
  - prompt("...arab...", ...)
  - toast.success/error/info/warning/promise("...arab...", ...)
  - setMessage/setError/setSuccess/setMsg("...arab...")
"""
import os, re

SRC_DIR = "/app/frontend/src"
EXCLUDE = {"I18nContext.js", "auto_translations.json"}

AR_CLASS = r"\u0600-\u06FF\u0750-\u077F"
AR_RE = re.compile(f"[{AR_CLASS}]")

# Pattern: function call where first argument is a quoted Arabic string
# captures: prefix(   "arabic"  → wraps to  prefix(tr("arabic")
FUNCS = [
    "alert", "confirm", "prompt",
    "toast\\.success", "toast\\.error", "toast\\.info", "toast\\.warning", "toast\\.message", "toast\\.promise", "toast",
    "setMessage", "setError", "setSuccess", "setMsg", "setNotice",
]
FUNC_RE = re.compile(
    r"(\b(?:" + "|".join(FUNCS) + r")\s*\()\s*(['\"])([^'\"<>\n]*[" + AR_CLASS + r"][^'\"<>\n]*)\2",
    re.UNICODE,
)


def wrap_funcs(content):
    def repl(m):
        prefix, quote, val = m.group(1), m.group(2), m.group(3)
        if "${" in val or "`" in val:
            return m.group(0)
        # Don't double-wrap
        before = content[max(0, m.start()-3):m.start()]
        if "tr(" in before:
            return m.group(0)
        escaped = val.replace("\\", "\\\\").replace('"', '\\"')
        return f'{prefix}tr("{escaped}")'
    return FUNC_RE.sub(repl, content)


def main():
    n = 0
    for root, _, files in os.walk(SRC_DIR):
        for fn in files:
            if not (fn.endswith(".js") or fn.endswith(".jsx")):
                continue
            if fn in EXCLUDE:
                continue
            path = os.path.join(root, fn)
            with open(path, encoding="utf-8") as f:
                content = f.read()
            if not AR_RE.search(content):
                continue
            new = wrap_funcs(content)
            if new == content:
                continue
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
            n += 1
            print("  edited:", os.path.relpath(path, SRC_DIR))
    print(f"Total: {n}")


if __name__ == "__main__":
    main()
