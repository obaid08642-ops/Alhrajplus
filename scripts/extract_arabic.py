#!/usr/bin/env python3
"""
Extracts all hardcoded Arabic literal strings from JSX files in frontend/src.
Outputs unique strings to /app/scripts/arabic_strings.json
"""
import os, re, json, sys

SRC_DIR = "/app/frontend/src"
OUT = "/app/scripts/arabic_strings.json"

# Match Arabic chars (unicode block 0600-06FF + 0750-077F)
ARABIC_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")

# Patterns for strings to capture
# 1) JSX text nodes between tags: >TEXT<  (greedy across lines but stop at <)
JSX_TEXT_RE = re.compile(r">([^<>{}]*?[\u0600-\u06FF][^<>{}]*?)<", re.DOTALL)

# 2) Attribute values: ="...arabic..." or ='...arabic...'
ATTR_RE = re.compile(r"""=\s*["']([^"'<>]*[\u0600-\u06FF][^"'<>]*)["']""")

# 3) Template/string literals inside JS expressions:  "..arab.."  '..arab..'
JS_STR_RE = re.compile(r"""(?<![=>])(["'])([^"'<>\n]*[\u0600-\u06FF][^"'<>\n]*)\1""")

# 4) Object keys/values like name_ar: "..." - we skip these (they're data, not UI strings)

EXCLUDE_FILES = {"I18nContext.js"}

def extract_from_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    strings = set()

    # JSX text nodes
    for m in JSX_TEXT_RE.finditer(content):
        s = m.group(1).strip()
        if s and ARABIC_RE.search(s):
            strings.add(s)

    # attribute values
    for m in ATTR_RE.finditer(content):
        s = m.group(1).strip()
        if s and ARABIC_RE.search(s):
            strings.add(s)

    # JS string literals
    for m in JS_STR_RE.finditer(content):
        s = m.group(2).strip()
        if s and ARABIC_RE.search(s):
            strings.add(s)

    return strings


def main():
    all_strings = set()
    files_scanned = 0
    for root, _, files in os.walk(SRC_DIR):
        for fn in files:
            if not fn.endswith(".js") and not fn.endswith(".jsx"):
                continue
            if fn in EXCLUDE_FILES:
                continue
            path = os.path.join(root, fn)
            strs = extract_from_file(path)
            all_strings |= strs
            files_scanned += 1

    # Filter: drop pure-emoji-and-spaces or non-meaningful
    cleaned = []
    for s in all_strings:
        # require at least 1 arabic letter
        if ARABIC_RE.search(s):
            # collapse internal whitespace
            normalized = re.sub(r"\s+", " ", s).strip()
            cleaned.append(normalized)

    cleaned = sorted(set(cleaned), key=lambda x: (-len(x), x))

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    print(f"Files scanned: {files_scanned}")
    print(f"Unique Arabic strings: {len(cleaned)}")
    print(f"Saved to {OUT}")


if __name__ == "__main__":
    main()
