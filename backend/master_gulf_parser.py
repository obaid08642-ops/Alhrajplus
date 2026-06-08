"""master_gulf_parser.py — parser for the hand-compiled
`gulf_master.txt` file (Saudi Arabia + 5 remaining GCC countries).

File structure:
  • Plain Arabic header lines (e.g. "المنطقة الوسطي :") between JSON blocks.
  • 5 standalone Saudi `{ "id":"SA-CENTRAL", "type":"Region", "cities":[...] }`
    dicts (one per region).
  • 3 follow-on `{ "cities_remaining": [...] }` blocks (Western/Eastern/Southern
    Part 2). These belong to the most-recent SA region.
  • One mega-dict `{ "id":"GCC-REMAINING-COUNTRIES", "countries":[...] }`
    that contains AE / KW / QA / BH / OM, each with `states_or_emirates: [...]`
    and (inside each emirate) `cities: [...]` — no districts.

Output schema (matches the `locations` collection used by `locations.py`):
  { "_id": int, "country": "SA"|"AE"|..., "level": "adm1"|"adm2"|"adm3",
    "parent_id": int|None, "name": str, "names": {ar,en,...},
    "lat": 0.0, "lng": 0.0, "population": 0,
    "admin1"/"admin2"/"admin3"/"admin4": str codes,
    "feature_class": "A", "feature_code": "ADM1"/"ADM2"/"ADM3",
    "source": "master" }

Level mapping:
  • SA: Region → adm1 ; City → adm2 ; District → adm3
  • AE/KW/QA/BH/OM: State/Emirate/Governorate/Municipality → adm1 ; City → adm2

Usage:
    from master_gulf_parser import parse_gulf_file
    records, stats = parse_gulf_file("/app/backend/data/gulf_master.txt")
"""
import ast
import hashlib
import re
from typing import Dict, List, Tuple

SUPPORTED_LANGS = ["ar", "en", "fr", "ur", "hi", "bn", "pa"]

# Countries we expect inside the GCC mega-dict.
_GCC_COUNTRIES = {"AE", "KW", "QA", "BH", "OM"}


def _id_for(string_id: str) -> int:
    """Stable 32-bit integer id derived from the human-readable string id."""
    h = hashlib.md5(string_id.encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def _names(name_ar: str, name_en: str) -> Dict[str, str]:
    en = (name_en or name_ar or "").strip()
    ar = (name_ar or en).strip()
    return {lang: (ar if lang == "ar" else en) for lang in SUPPORTED_LANGS}


def _strip_admin_prefix_ar(s: str) -> str:
    """Light Arabic clean-up: drop a leading 'حي ' duplicate, 'مدينة مدينة'
    duplicate, etc.  Keeps a single occurrence of the admin word."""
    if not s:
        return s
    s = s.strip()
    # Collapse "حي حي X" → "حي X" / "مدينة مدينة X" → "مدينة X" / "منطقة منطقة"
    s = re.sub(r"^(حي|مدينة|منطقة|محافظة|ولاية|بلدية|إمارة|مركز)\s+\1\s+", r"\1 ", s)
    return s


def _light_normalise(chunk: str) -> str:
    """Convert JS-style true/false/null to Python literals and strip
    trailing commas so ast.literal_eval can parse the chunk."""
    chunk = re.sub(r"\btrue\b", "True", chunk)
    chunk = re.sub(r"\bfalse\b", "False", chunk)
    chunk = re.sub(r"\bnull\b", "None", chunk)
    return chunk


def _extract_top_dicts(text: str) -> List[Dict]:
    """Walk the file with a brace matcher and parse every top-level
    `{...}` block we find (skipping anything outside braces — that's the
    Arabic section-header noise)."""
    out: List[Dict] = []
    n = len(text)
    i = 0
    while i < n:
        ch = text[i]
        if ch == "{":
            depth = 1
            j = i + 1
            in_str = False
            str_q = ""
            while j < n and depth > 0:
                c = text[j]
                if in_str:
                    if c == "\\":
                        j += 2
                        continue
                    if c == str_q:
                        in_str = False
                elif c in ('"', "'"):
                    in_str = True
                    str_q = c
                elif c == "{":
                    depth += 1
                elif c == "}":
                    depth -= 1
                j += 1
            if depth == 0:
                chunk = text[i:j]
                cleaned = _light_normalise(chunk)
                parsed = None
                for _ in range(2):
                    try:
                        d = ast.literal_eval(cleaned)
                        if isinstance(d, dict):
                            parsed = d
                        break
                    except Exception:
                        cleaned = re.sub(r",(\s*[}\]])", r"\1", cleaned)
                if parsed is not None:
                    out.append(parsed)
                i = j
            else:
                # Unbalanced — bail out of this attempt and advance.
                i += 1
        else:
            i += 1
    return out


# ============================================================
# Convert parsed nested dicts → flat list of `locations` rows.
# ============================================================
def _sa_records(regions: List[Dict]) -> List[Dict]:
    """Saudi Arabia: Region (adm1) → City (adm2) → District (adm3)."""
    rows: List[Dict] = []
    seen = set()

    def push(doc):
        if doc["_id"] in seen:
            return
        seen.add(doc["_id"])
        rows.append(doc)

    for reg in regions:
        reg_sid = reg.get("id") or reg.get("name_en") or reg.get("name_ar")
        if not reg_sid:
            continue
        reg_id = _id_for(f"sa-region:{reg_sid}")
        ar = _strip_admin_prefix_ar(reg.get("name_ar") or "")
        en = (reg.get("name_en") or "").strip()
        push({
            "_id": reg_id, "country": "SA", "level": "adm1", "parent_id": None,
            "name": en or ar, "names": _names(ar, en),
            "lat": 0.0, "lng": 0.0, "population": 0,
            "admin1": reg_sid, "admin2": "", "admin3": "", "admin4": "",
            "feature_class": "A", "feature_code": "ADM1", "source": "master",
        })
        for city in reg.get("cities", []) or []:
            city_sid = city.get("id") or f"{reg_sid}/{city.get('name_en') or city.get('name_ar')}"
            city_id = _id_for(f"sa-city:{city_sid}")
            c_ar = _strip_admin_prefix_ar(city.get("name_ar") or "")
            c_en = (city.get("name_en") or "").strip()
            push({
                "_id": city_id, "country": "SA", "level": "adm2", "parent_id": reg_id,
                "name": c_en or c_ar, "names": _names(c_ar, c_en),
                "lat": 0.0, "lng": 0.0, "population": 0,
                "admin1": reg_sid, "admin2": city_sid, "admin3": "", "admin4": "",
                "feature_class": "A", "feature_code": "ADM2", "source": "master",
            })
            for d in city.get("districts", []) or []:
                d_sid = d.get("id") or f"{city_sid}/{d.get('name_en') or d.get('name_ar')}"
                d_id = _id_for(f"sa-district:{d_sid}")
                d_ar = _strip_admin_prefix_ar(d.get("name_ar") or "")
                d_en = (d.get("name_en") or "").strip()
                push({
                    "_id": d_id, "country": "SA", "level": "adm3", "parent_id": city_id,
                    "name": d_en or d_ar, "names": _names(d_ar, d_en),
                    "lat": 0.0, "lng": 0.0, "population": 0,
                    "admin1": reg_sid, "admin2": city_sid, "admin3": d_sid, "admin4": "",
                    "feature_class": "A", "feature_code": "ADM3", "source": "master",
                })
    return rows


def _gcc_records(countries: List[Dict]) -> List[Dict]:
    """AE / KW / QA / BH / OM: State (adm1) → City (adm2). No districts."""
    rows: List[Dict] = []
    seen = set()

    def push(doc):
        if doc["_id"] in seen:
            return
        seen.add(doc["_id"])
        rows.append(doc)

    for c in countries:
        cc = (c.get("id") or "").upper()
        if cc not in _GCC_COUNTRIES:
            continue
        for st in c.get("states_or_emirates", []) or []:
            st_sid = st.get("id") or f"{cc}/{st.get('name_en') or st.get('name_ar')}"
            st_id = _id_for(f"gcc-state:{st_sid}")
            ar = _strip_admin_prefix_ar(st.get("name_ar") or "")
            en = (st.get("name_en") or "").strip()
            push({
                "_id": st_id, "country": cc, "level": "adm1", "parent_id": None,
                "name": en or ar, "names": _names(ar, en),
                "lat": 0.0, "lng": 0.0, "population": 0,
                "admin1": st_sid, "admin2": "", "admin3": "", "admin4": "",
                "feature_class": "A", "feature_code": "ADM1", "source": "master",
            })
            for city in st.get("cities", []) or []:
                city_sid = city.get("id") or f"{st_sid}/{city.get('name_en') or city.get('name_ar')}"
                city_id = _id_for(f"gcc-city:{city_sid}")
                c_ar = _strip_admin_prefix_ar(city.get("name_ar") or "")
                c_en = (city.get("name_en") or "").strip()
                push({
                    "_id": city_id, "country": cc, "level": "adm2", "parent_id": st_id,
                    "name": c_en or c_ar, "names": _names(c_ar, c_en),
                    "lat": 0.0, "lng": 0.0, "population": 0,
                    "admin1": st_sid, "admin2": city_sid, "admin3": "", "admin4": "",
                    "feature_class": "A", "feature_code": "ADM2", "source": "master",
                })
    return rows


def parse_gulf_file(path: str) -> Tuple[List[Dict], Dict[str, int]]:
    """Read the gulf_master file → flat list of `locations` rows + stats."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()

    dicts = _extract_top_dicts(raw)

    # ─── Pass A: assemble Saudi regions ───
    sa_regions: List[Dict] = []
    sa_regions_by_id: Dict[str, Dict] = {}
    current_region: Dict = None  # most recently seen SA region (for cities_remaining)

    # ─── Pass B: locate the GCC mega-dict ───
    gcc_countries: List[Dict] = []

    for d in dicts:
        # GCC mega-dict (carries `countries` array).
        if d.get("id") == "GCC-REMAINING-COUNTRIES" or isinstance(d.get("countries"), list):
            gcc_countries.extend(d.get("countries") or [])
            continue
        # Saudi region block.
        if d.get("type") == "Region" and isinstance(d.get("cities"), list):
            sid = d.get("id")
            if sid in sa_regions_by_id:
                # Same region encountered twice (defensive) — merge cities.
                sa_regions_by_id[sid].setdefault("cities", []).extend(d.get("cities") or [])
            else:
                sa_regions_by_id[sid] = d
                sa_regions.append(d)
            current_region = sa_regions_by_id[sid]
            continue
        # Saudi `cities_remaining` follow-on block → append to current_region.
        if isinstance(d.get("cities_remaining"), list) and current_region is not None:
            current_region.setdefault("cities", []).extend(d["cities_remaining"])
            continue

    sa_rows = _sa_records(sa_regions)
    gcc_rows = _gcc_records(gcc_countries)

    records = sa_rows + gcc_rows

    stats: Dict[str, int] = {"total": len(records)}
    for cc in ["SA", "AE", "KW", "QA", "BH", "OM"]:
        stats[f"{cc}_regions_emirates"] = sum(1 for r in records if r["country"] == cc and r["level"] == "adm1")
        stats[f"{cc}_cities"] = sum(1 for r in records if r["country"] == cc and r["level"] == "adm2")
        stats[f"{cc}_districts"] = sum(1 for r in records if r["country"] == cc and r["level"] == "adm3")
    return records, stats


if __name__ == "__main__":
    import sys
    import json
    path = sys.argv[1] if len(sys.argv) > 1 else "/app/backend/data/gulf_master.txt"
    records, stats = parse_gulf_file(path)
    print("Gulf parse stats:", json.dumps(stats, indent=2, ensure_ascii=False))
    # Show a couple of samples per country.
    for cc in ["SA", "AE", "KW", "QA", "BH", "OM"]:
        adm1 = [r for r in records if r["country"] == cc and r["level"] == "adm1"]
        print(f"\n— {cc}: {len(adm1)} adm1 (region/emirate/governorate)")
        for top in adm1[:3]:
            kids = [r for r in records if r["parent_id"] == top["_id"]]
            sample_kids = [k["names"]["ar"] for k in kids[:3]]
            print(f"   {top['names']['ar']:30} → {len(kids)} cities; sample: {sample_kids}")
            for k in kids[:1]:
                grand = [r for r in records if r["parent_id"] == k["_id"]]
                if grand:
                    print(f"       └─ {k['names']['ar']} → {len(grand)} districts; sample: {[g['names']['ar'] for g in grand[:3]]}")
