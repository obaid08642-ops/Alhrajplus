from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
files = list((root / "src").rglob("*.js"))
text = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in files) + "\n" + (root / "App.js").read_text(encoding="utf-8", errors="ignore")
registered = set(re.findall(r'<(?:Stack|Tab)\.Screen\s+name=["\']([^"\']+)', text))
used = set(re.findall(r'(?:navigate|replace|push|reset)\(\s*["\']([^"\']+)', text))
known = registered | {"Main", "Login", "Register"}
print("registered:", ", ".join(sorted(registered)))
print("used:", ", ".join(sorted(used)))
print("unregistered_navigation_targets:", ", ".join(sorted(used - known)))
print("registered_count:", len(registered))
print("used_count:", len(used))
