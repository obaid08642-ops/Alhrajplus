#!/usr/bin/env python3
"""Fail only on newly-added Arabic UI literals that bypass i18n helpers.

Legacy content is intentionally not reclassified by this guard.  It inspects
added lines in a Git range, so teams can reduce the existing inventory
incrementally without allowing new untranslated UI copy.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

ARABIC = re.compile(r"[\u0600-\u06ff]")
TRANSLATED = re.compile(r"\b(?:t|tr)\s*\(")
ALLOW = re.compile(r"i18n-(?:data|allow)")


def added_source_lines(base: str) -> list[tuple[str, int, str]]:
    # `git diff BASE` includes the current worktree, making the rule useful
    # before committing as well as in CI where BASE is the merge baseline.
    root = subprocess.run(["git", "rev-parse", "--show-toplevel"], check=True, text=True, capture_output=True).stdout.strip()
    cmd = ["git", "diff", "--unified=0", base, "--", "frontend/src", "mobile/src"]
    result = subprocess.run(cmd, cwd=root, check=True, text=True, capture_output=True)
    current_file = ""
    current_line = 0
    found: list[tuple[str, int, str]] = []
    for raw in result.stdout.splitlines():
        if raw.startswith("+++ b/"):
            current_file = raw[6:]
            continue
        if raw.startswith("@@"):
            match = re.search(r"\+(\d+)(?:,\d+)?", raw)
            current_line = int(match.group(1)) if match else 0
            continue
        if raw.startswith("+") and not raw.startswith("+++"):
            line = raw[1:]
            dictionary_file = current_file.endswith("I18nContext.js") or current_file.endswith("auto_translations.json")
            if ARABIC.search(line) and not dictionary_file and not TRANSLATED.search(line) and not ALLOW.search(line):
                found.append((current_file, current_line, line.strip()))
            current_line += 1
        elif raw and not raw.startswith("-"):
            current_line += 1
    return found


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=os.environ.get("I18N_GUARD_BASE", "HEAD"), help="Git revision used as the approved baseline")
    args = parser.parse_args()
    violations = added_source_lines(args.base)
    if not violations:
        print("i18n guard passed: no new untranslated Arabic UI literals.")
        return 0
    print("i18n guard failed. Wrap visible copy in t()/tr(), or add an explicit i18n-data allow comment:")
    for path, line, text in violations:
        print(f"{path}:{line}: {text}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
