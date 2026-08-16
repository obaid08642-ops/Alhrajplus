import json
import re
import time
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1] / "src"
AUTO_PATH = ROOT / "auto_translations.json"
CONTEXT_PATH = ROOT / "contexts" / "I18nContext.js"
PROGRESS_PATH = Path("/tmp/alhrajplus_translation_progress.json")

langs = ["en", "ur", "hi", "bn", "fr"]
auto = json.loads(AUTO_PATH.read_text(encoding="utf-8"))
context = CONTEXT_PATH.read_text(encoding="utf-8")
known = set(auto)
for block in re.findall(r"(?:ar|en):\s*\{(.*?)\n\s*\},", context, flags=re.S):
    known.update(re.findall(r"(?:^|[,\n])\s*([A-Za-z_][A-Za-z0-9_]*)\s*:", block))
missing = {}
for path in list((ROOT / "pages").rglob("*.js")) + list((ROOT / "components").rglob("*.js")):
    text = path.read_text(encoding="utf-8", errors="ignore")
    for fn in ("tr", "t"):
        for quote, value in re.findall(rf"\b{fn}\(\s*([\"'])(.*?)\1\s*\)", text):
            key = value.strip()
            if key and any("\u0600" <= ch <= "\u06ff" for ch in key) and key not in known:
                missing[key] = True

if PROGRESS_PATH.exists():
    progress = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
else:
    progress = {}
remaining = [key for key in sorted(missing) if key not in progress]
print(f"missing={len(missing)} remaining={len(remaining)}")

client = OpenAI()
schema = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "key": {"type": "string"},
                    "en": {"type": "string"},
                    "ur": {"type": "string"},
                    "hi": {"type": "string"},
                    "bn": {"type": "string"},
                    "fr": {"type": "string"},
                },
                "required": ["key", "en", "ur", "hi", "bn", "fr"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["items"],
    "additionalProperties": False,
}

for start in range(0, len(remaining), 35):
    batch = remaining[start:start + 35]
    prompt = (
        "Translate each Arabic UI string into concise, natural UI text in English, Urdu, Hindi, Bengali, and French. "
        "Preserve numbers, punctuation, placeholders, emojis, and line breaks. Do not translate keys; return exactly one item per input key. "
        "These are marketplace labels, buttons, statuses, validation messages, and admin labels.\n\n"
        + json.dumps(batch, ensure_ascii=False)
    )
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-5-mini",
                messages=[
                    {"role": "system", "content": "You are a professional product UI translator. Output JSON only."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_schema", "json_schema": {"name": "translations", "strict": True, "schema": schema}},
                max_completion_tokens=12000,
                extra_body={"reasoning": {"effort": "minimal"}},
            )
            payload = json.loads(response.choices[0].message.content)
            items = payload.get("items", [])
            returned = {item.get("key"): item for item in items if item.get("key") in batch}
            if set(returned) != set(batch):
                raise ValueError(f"batch mismatch expected={len(batch)} got={len(returned)}")
            for key, item in returned.items():
                progress[key] = {lang: str(item.get(lang, "")).strip() or key for lang in langs}
            PROGRESS_PATH.write_text(json.dumps(progress, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"translated {start + len(batch)}/{len(remaining)}")
            break
        except Exception as exc:
            print(f"batch {start} attempt {attempt + 1} failed: {exc}")
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

for key, translations in progress.items():
    auto[key] = translations
AUTO_PATH.write_text(json.dumps(auto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"saved={len(progress)}")
