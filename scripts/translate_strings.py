#!/usr/bin/env python3
"""
Translates extracted Arabic strings to en/ur/hi/bn/fr using Emergent LLM (Gemini).
Resumable: saves progress to JSON after each batch.
"""
import os, json, asyncio, sys, time
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY") or ""
INPUT = "/app/scripts/arabic_strings.json"
OUTPUT = "/app/frontend/src/auto_translations.json"
BATCH = 25  # strings per LLM call
LANGS = {"en": "English", "ur": "Urdu (اردو)", "hi": "Hindi", "bn": "Bengali", "fr": "French"}


def load_existing():
    if os.path.exists(OUTPUT):
        with open(OUTPUT, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save(data):
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


async def translate_batch_for_lang(strings, lang_code, lang_name):
    """Returns dict {arabic: translated} for the batch."""
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"i18n-{lang_code}-{int(time.time())}",
        system_message=(
            f"You are a professional UI/UX translator. Translate Arabic UI strings to {lang_name}. "
            "Keep emojis, numbers, brand names, and HTML/special markers EXACTLY as-is. "
            "Output ONLY a JSON object {arabic_string: translation}. No explanations."
        ),
    ).with_model("gemini", "gemini-2.5-flash")

    payload = json.dumps({s: "" for s in strings}, ensure_ascii=False)
    user_msg = UserMessage(text=(
        f"Translate ALL these Arabic strings (JSON keys) into {lang_name}. "
        f"Preserve emojis, brand 'Haraj Plus / الحراج بلس' literally if appropriate. "
        f"For {lang_name} use the natural script. Return JSON object with same keys but translated values.\n\n"
        + payload
    ))

    raw = await chat.send_message(user_msg)
    # Strip code fences if present
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        result = json.loads(raw)
    except Exception as e:
        # Try to fix
        print(f"   parse error in batch: {e}")
        print("   first 300 chars:", raw[:300])
        return {}
    return {k: v for k, v in result.items() if k in strings and isinstance(v, str)}


async def main():
    strings = json.load(open(INPUT, encoding="utf-8"))
    print(f"Loaded {len(strings)} unique Arabic strings.")

    data = load_existing()
    # data structure: {ar_string: {lang: translation}}

    for lang_code, lang_name in LANGS.items():
        # find strings that don't yet have this lang translation
        pending = [s for s in strings if data.get(s, {}).get(lang_code) is None]
        print(f"\n[{lang_code}] {len(pending)} strings pending out of {len(strings)}")
        if not pending:
            continue
        for i in range(0, len(pending), BATCH):
            batch = pending[i:i + BATCH]
            try:
                tr = await translate_batch_for_lang(batch, lang_code, lang_name)
            except Exception as e:
                print(f"   LLM error: {e}, retry once...")
                await asyncio.sleep(2)
                try:
                    tr = await translate_batch_for_lang(batch, lang_code, lang_name)
                except Exception as e2:
                    print(f"   second failure: {e2} -- skipping batch")
                    continue
            for k in batch:
                data.setdefault(k, {})
                if k in tr:
                    data[k][lang_code] = tr[k]
            save(data)
            print(f"   batch {i//BATCH+1}/{(len(pending)+BATCH-1)//BATCH} done ({len(tr)} translated)")

    print(f"\nSaved to {OUTPUT}")
    # Quick stats
    counts = {l: 0 for l in LANGS}
    for s in strings:
        for l in LANGS:
            if data.get(s, {}).get(l):
                counts[l] += 1
    print("Coverage:", counts, f"/ {len(strings)}")


if __name__ == "__main__":
    asyncio.run(main())
