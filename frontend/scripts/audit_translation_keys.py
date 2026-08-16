import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "src"
auto = json.loads((root / "auto_translations.json").read_text(encoding="utf-8"))
context = (root / "contexts" / "I18nContext.js").read_text(encoding="utf-8")
keys = set(auto)
for block in re.findall(r"(?:ar|en):\s*\{(.*?)\n\s*\},", context, flags=re.S):
    keys.update(re.findall(r"(?:^|[,\n])\s*([A-Za-z_][A-Za-z0-9_]*)\s*:", block))
missing = {}
for path in list((root / "pages").rglob("*.js")) + list((root / "components").rglob("*.js")):
    text = path.read_text(encoding="utf-8", errors="ignore")
    for fn in ("tr", "t"):
        for value in re.findall(rf"\b{fn}\(\s*([\"'])(.*?)\1\s*\)", text):
            key = value[1].strip()
            if key and any("\u0600" <= ch <= "\u06ff" for ch in key) and key not in keys:
                missing.setdefault(key, set()).add(str(path.relative_to(root)))
for key in sorted(missing):
    print(f"{key}\t" + ",".join(sorted(missing[key])))
print(f"MISSING_COUNT={len(missing)}")
