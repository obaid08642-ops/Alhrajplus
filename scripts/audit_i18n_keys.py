import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
web_auto = json.loads((root / "frontend/src/auto_translations.json").read_text())
mobile_i18n = (root / "mobile/src/I18nContext.js").read_text()
mobile_keys = set(re.findall(r'\"([^\"]+)\"\s*:', mobile_i18n))

results = []
for platform, base, patterns, known in [
    ("web", root / "frontend/src", [r'\btr\(\s*[\"\']([^\"\']+)', r'\bt\(\s*[\"\']([^\"\']+)'], set(web_auto)),
    ("mobile", root / "mobile/src", [r'\bt\(\s*[\"\']([^\"\']+)'], mobile_keys),
]:
    used = set()
    for path in base.rglob("*.js"):
        text = path.read_text(errors="ignore")
        for pattern in patterns:
            used.update(re.findall(pattern, text))
    arabic = sorted(x for x in used if re.search(r'[\u0600-\u06ff]', x))
    missing = [x for x in arabic if x not in known]
    results.append((platform, len(arabic), len(missing), missing[:80]))

for platform, total, missing_count, missing in results:
    print(f"{platform}: arabic_literals={total} missing_translation_entries={missing_count}")
    for item in missing:
        print(f"  - {item}")
