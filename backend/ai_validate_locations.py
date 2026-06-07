"""ai_validate_locations.py — AI-assisted hierarchy verification for the
Geonames-backed `locations` collection.

For each governorate, gather:
  • its adm2 cities (id, name, lat, lng, population)
  • its adm3 districts/neighborhoods currently assigned to those cities or
    directly to the governorate.
Send the snapshot to Gemini Flash with a strict JSON-only prompt asking the
model to flag any district that is mapped under the wrong city according to
real-world Egyptian administrative knowledge — and to suggest the correct
parent. We apply the suggestions back to the records BEFORE inserting.

Designed as an OPTIONAL final pass after `link_parents()`. If the LLM is
unreachable (no `EMERGENT_LLM_KEY`, network error, quota), we silently
skip — the haversine output is still production-quality.
"""
import asyncio
import json
import os
import re
from typing import Dict, List, Optional


async def ai_validate_egypt(records: List[Dict], max_gov: Optional[int] = None) -> Dict[str, int]:
    """Mutate `records` in place: re-parent any adm3 row that the LLM
    identifies as belonging to a different adm2 city in the same governorate.

    Returns a stats dict: `{'governorates_audited', 'moves_applied', 'skipped'}`."""
    api_key = os.environ.get("EMERGENT_LLM_KEY", "").strip()
    if not api_key:
        print("[ai-validate] EMERGENT_LLM_KEY not set — skipping AI pass")
        return {"governorates_audited": 0, "moves_applied": 0, "skipped": len(records)}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except ImportError:
        print("[ai-validate] emergentintegrations not installed — skipping")
        return {"governorates_audited": 0, "moves_applied": 0, "skipped": len(records)}

    # Index for quick id → record updates.
    by_id = {r["_id"]: r for r in records}

    # Group adm2 cities + adm3 districts by governorate.
    govs: Dict[int, Dict] = {}  # gov_id → {name, cities: [...], districts: [...]}
    for r in records:
        if r.get("country") != "EG":
            continue
        if r["level"] == "adm1":
            govs.setdefault(r["_id"], {"name": r["names"]["ar"], "cities": [], "districts": []})
    for r in records:
        if r.get("country") != "EG":
            continue
        if r["level"] == "adm2":
            # adm2's parent is the governorate.
            gid = r.get("parent_id")
            if gid in govs:
                govs[gid]["cities"].append(r)
        elif r["level"] == "adm3":
            # Find the gov it sits under (climb via parent chain — adm3 parent is adm2 or adm1).
            parent_id = r.get("parent_id")
            p = by_id.get(parent_id)
            if p and p["level"] == "adm1":
                gid = p["_id"]
            elif p and p["level"] == "adm2":
                gid = p.get("parent_id")
            else:
                continue
            if gid in govs:
                govs[gid]["districts"].append(r)

    moves = 0
    audited = 0
    gov_ids = list(govs.keys())
    if max_gov:
        gov_ids = gov_ids[:max_gov]

    for gid in gov_ids:
        g = govs[gid]
        if not g["cities"] or not g["districts"]:
            continue
        if len(g["districts"]) < 2:
            continue  # nothing meaningful to verify
        # Build compact JSON payload (keep tokens low).
        cities_lite = [
            {"id": c["_id"], "name": c["names"]["en"], "ar": c["names"]["ar"], "pop": c["population"]}
            for c in sorted(g["cities"], key=lambda x: -x["population"])[:25]
        ]
        districts_lite = [
            {"id": d["_id"], "name": d["names"]["en"], "ar": d["names"]["ar"], "current_parent": d.get("parent_id")}
            for d in g["districts"][:60]
        ]
        prompt = (
            f"You are an expert on Egyptian administrative geography.\n"
            f"GOVERNORATE: {g['name']} (id={gid}).\n\n"
            f"CITIES under this governorate (each has `id`):\n{json.dumps(cities_lite, ensure_ascii=False)}\n\n"
            f"DISTRICTS / NEIGHBOURHOODS currently mapped under this governorate or its cities:\n"
            f"{json.dumps(districts_lite, ensure_ascii=False)}\n\n"
            f"For each district, decide which CITY id it ACTUALLY belongs to "
            f"based on real Egyptian geography. If a district is correctly "
            f"parented already (current_parent matches the right city id) — DO NOT include it.\n\n"
            f"Output STRICT JSON only (no markdown), shape:\n"
            f'{{"moves": [{{"district_id": <int>, "new_parent_id": <int>}}, ...]}}\n'
            f"Only include moves you are HIGHLY confident about. Up to 30 moves max."
        )

        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"loc-validate-{gid}",
                system_message="You output only valid JSON. No explanations.",
            ).with_model("gemini", "gemini-2.5-flash")
            # send_message (non-streaming) is appropriate here — one-shot batch.
            resp_text = await chat.send_message(UserMessage(text=prompt))
            if not isinstance(resp_text, str):
                resp_text = str(resp_text)
            # Strip ```json fences if any.
            cleaned = re.sub(r"^```(?:json)?|```$", "", resp_text.strip(), flags=re.MULTILINE).strip()
            parsed = json.loads(cleaned)
            audited += 1
            for m in parsed.get("moves", [])[:30]:
                did, npid = int(m["district_id"]), int(m["new_parent_id"])
                if did in by_id and npid in by_id:
                    new_parent = by_id[npid]
                    # Only accept if new_parent is an adm2 in the SAME governorate.
                    if new_parent["level"] == "adm2" and new_parent.get("parent_id") == gid:
                        if by_id[did].get("parent_id") != npid:
                            by_id[did]["parent_id"] = npid
                            moves += 1
            print(f"[ai-validate] gov={g['name'][:25]:30} cities={len(cities_lite):3} districts={len(districts_lite):3} → moves={len(parsed.get('moves', []))}")
        except Exception as e:
            print(f"[ai-validate] gov={g['name'][:25]:30} → SKIP ({type(e).__name__}: {str(e)[:60]})")

    return {"governorates_audited": audited, "moves_applied": moves, "skipped": len(records) - moves}


# ---------------------------------------------------------------------------
# CLI entry: usable as `python ai_validate_locations.py EG /app/data/EG.txt`.
# ---------------------------------------------------------------------------
async def _main():
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    from motor.motor_asyncio import AsyncIOMotorClient
    from locations import parse_geonames_file, link_parents

    if len(__import__("sys").argv) < 3:
        print("usage: python ai_validate_locations.py EG /path/to/EG.txt")
        return
    cc = __import__("sys").argv[1].upper()
    path = __import__("sys").argv[2]
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()
    records = parse_geonames_file(raw, cc)
    link_parents(records)
    print(f"[ai-validate] starting AI pass on {len(records)} {cc} records…")
    stats = await ai_validate_egypt(records)
    print(f"[ai-validate] DONE → {stats}")
    # Wipe + insert.
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "test_database")]
    await db.locations.delete_many({"country": cc})
    await db.locations.insert_many(records, ordered=False)
    print(f"[ai-validate] inserted {len(records)} into MongoDB")
    client.close()


if __name__ == "__main__":
    asyncio.run(_main())
