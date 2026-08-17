from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
source = "\n".join(p.read_text(errors="ignore") for p in (root / "mobile/src").rglob("*.js"))
used = set(re.findall(r"(?:navigate|push|replace)\(\s*[\"']([^\"']+)", source))
declared = set(re.findall(r"Screen\s+name\s*=\s*[{]?\s*[\"']([^\"']+)", source))
# Also capture object-style name declarations used by some navigators.
declared |= set(re.findall(r"name\s*[:=]\s*[\"']([^\"']+)", source))
ignore = {"Login", "Register", "HomeTab"}
missing = sorted(x for x in used - declared - ignore)
print(f"used={len(used)} declared_candidates={len(declared)} missing_candidates={len(missing)}")
for name in missing:
    print(name)
