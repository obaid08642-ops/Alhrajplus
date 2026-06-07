"""master_egypt_parser.py — robust parser for the hand-compiled
`egypt_locations_master.json` file.

The file mixes:
  • valid JSON (top 11 governorates, wrapped in {"country": ..., "governorates": [...]})
  • raw Python `dict` literals (governorates 12..27) separated by Python
    scripts, comments, `print(...)` calls, `cities_count = …`, etc.

This module:
  1. Strips Python contamination line-by-line.
  2. Walks the cleaned text using brace-matching to extract every dict
     that has a "type": "Governorate" key.
  3. Parses each chunk with `ast.literal_eval` (handles both JSON and
     Python literals — single/double quotes both fine).
  4. Normalises the schema keys (`*_and_*` → `*_*`).
  5. Maps each governorate / city / district / village into our
     `locations` collection schema with integer `_id`s.

Usage:
    from master_egypt_parser import parse_master_file
    records = parse_master_file("/app/backend/data/egypt_master.json")
"""
import ast
import hashlib
import re
from typing import Dict, List, Optional, Tuple

SUPPORTED_LANGS = ["ar", "en", "fr", "ur", "hi", "bn", "pa"]

# Lines starting with these tokens are Python contamination → drop them.
_CONTAMINATION_RE = re.compile(
    r"^\s*(?:#|import\s|from\s+\w+\s+import|with\s+open|json\.|print\s*\(|[A-Za-z_][A-Za-z0-9_]*\s*=)"
)


def _strip_contamination(raw: str) -> str:
    """Remove Python scripts, comments, assignments — keep only data lines.

    Special-case: lines like `sohag = {` are VARIABLE ASSIGNMENTS that
    open a governorate dict — we must keep the trailing `{` (we just strip
    the `<var> =` prefix), otherwise the brace matcher will be unbalanced."""
    out = []
    for line in raw.splitlines():
        stripped = line.lstrip()
        # Variable assignment that OPENS a dict: keep the `{` part.
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\{.*)$", stripped)
        if m:
            indent_len = len(line) - len(stripped)
            out.append(" " * indent_len + m.group(2))
            continue
        if _CONTAMINATION_RE.match(line):
            continue
        out.append(line)
    return "\n".join(out)


def _id_for(string_id: str) -> int:
    """Stable 32-bit integer id derived from the human-readable string id.
    Same input → same _id forever (so re-seeds don't fragment indexes)."""
    h = hashlib.md5(string_id.encode("utf-8")).hexdigest()
    return int(h[:8], 16)  # 0 .. 2^32-1 (fits MongoDB int32)


def _extract_dicts(text: str) -> List[Dict]:
    """Walk the cleaned text with a brace-matcher; whenever we close a
    top-level `{...}` block that contains `"type"`/`'type'` followed by
    `Governorate`, hand it to `ast.literal_eval`."""
    out: List[Dict] = []
    n = len(text)
    i = 0
    while i < n:
        ch = text[i]
        if ch == "{":
            # find matching close brace
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
                # Identify a governorate-shaped dict heuristically. Accept ANY
                # top-level dict that contains a cities/centers array AND has a
                # name_ar field (covers all 4 schema variants seen in the
                # master file: top-11 wrapper, lowercase "type":"governorate",
                # Suez-style w/ "districts" key, and Red-Sea-style w/ a
                # nested "governorate": {...} object).
                has_cities = ("cities_centers" in chunk or "cities_and_centers" in chunk)
                has_name = '"name_ar"' in chunk or "'name_ar'" in chunk
                if has_cities and has_name:
                    cleaned = _light_normalise(chunk)
                    parsed = None
                    for attempt in range(2):
                        try:
                            d = ast.literal_eval(cleaned)
                            if isinstance(d, dict):
                                parsed = d
                            break
                        except Exception:
                            # 2nd attempt: strip trailing commas
                            cleaned = re.sub(r",(\s*[}\]])", r"\1", cleaned)
                    if parsed is not None:
                        # Filter: must look like a governorate (top-level
                        # `name_ar` OR a nested `governorate.name_ar`).
                        nm = parsed.get("name_ar")
                        if not nm:
                            inner = parsed.get("governorate")
                            nm = inner.get("name_ar") if isinstance(inner, dict) else None
                        # The dict must also expose a city/center array at top level.
                        if nm and (
                            isinstance(parsed.get("cities_centers"), list)
                            or isinstance(parsed.get("cities_and_centers"), list)
                        ):
                            out.append(parsed)
            i = j
        else:
            i += 1
    return out


def _light_normalise(chunk: str) -> str:
    """Tolerate JS-style booleans/null and stray trailing commas before parse."""
    chunk = re.sub(r"\btrue\b", "True", chunk)
    chunk = re.sub(r"\bfalse\b", "False", chunk)
    chunk = re.sub(r"\bnull\b", "None", chunk)
    return chunk


def _normalise_keys(gov: Dict) -> Dict:
    """In-place: rename *_and_* / short variants to canonical *_* keys at
    every nesting level. Also flatten any nested 'governorate' wrapper
    (used by the Red Sea block) into the parent dict."""
    rename = {
        "cities_and_centers": "cities_centers",
        "districts_and_sections": "districts_sections",
        "areas_and_villages": "areas_villages",
        # Short variants used in Suez/Matrouh/Sinai/Luxor/New-Valley.
        "districts": "districts_sections",
        "areas": "areas_villages",
    }

    # Flatten { "governorate": {name_ar, name_en, ...}, "cities_centers": [...] }
    # so the top dict has the names at root.
    inner = gov.get("governorate")
    if isinstance(inner, dict):
        for k in ("id", "name_ar", "name_en", "name", "capital_ar", "capital_en"):
            if k in inner and k not in gov:
                gov[k] = inner[k]

    def walk(node):
        if isinstance(node, dict):
            for old, new in rename.items():
                if old in node and new not in node:
                    node[new] = node[old]
                    del node[old]
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
    walk(gov)
    return gov


def _names(name_ar: str, name_en: str) -> Dict[str, str]:
    en = name_en or name_ar or ""
    ar = name_ar or en
    return {lang: (ar if lang == "ar" else en) for lang in SUPPORTED_LANGS}


def _to_records(governorates: List[Dict]) -> List[Dict]:
    """Convert the nested governorate tree into a FLAT list of
    `locations`-collection documents."""
    rows: List[Dict] = []
    seen_ids = set()

    def push(doc):
        if doc["_id"] in seen_ids:
            return  # de-dupe defensively
        seen_ids.add(doc["_id"])
        rows.append(doc)

    for gov in governorates:
        gov_sid = gov.get("id") or gov.get("name_en") or gov.get("name_ar")
        if not gov_sid:
            continue
        gov_id = _id_for(f"gov:{gov_sid}")
        # Avoid double "محافظة" prefix when the raw name already starts with it.
        raw_ar = (gov.get("name_ar") or "").strip()
        raw_en = (gov.get("name_en") or "").strip()
        ar_name = raw_ar if raw_ar.startswith("محافظة") else ("محافظة " + raw_ar)
        en_name = raw_en if (raw_en.lower().endswith("governorate") or not raw_en) else (raw_en + " Governorate")
        push({
            "_id": gov_id,
            "country": "EG",
            "level": "adm1",
            "parent_id": None,
            "name": raw_en or raw_ar,
            "names": _names(ar_name, en_name),
            "lat": 0.0,
            "lng": 0.0,
            "population": 0,
            "admin1": gov_sid,
            "admin2": "",
            "admin3": "",
            "admin4": "",
            "feature_class": "A",
            "feature_code": "ADM1",
            "source": "master",
        })
        for city in gov.get("cities_centers", []) or []:
            city_sid = city.get("id") or f"{gov_sid}/{city.get('name_en') or city.get('name_ar')}"
            city_id = _id_for(f"city:{city_sid}")
            push({
                "_id": city_id,
                "country": "EG",
                "level": "adm2",
                "parent_id": gov_id,
                "name": city.get("name_en") or city.get("name_ar"),
                "names": _names(city.get("name_ar", ""), city.get("name_en", "")),
                "lat": 0.0,
                "lng": 0.0,
                "population": 0,
                "admin1": gov_sid,
                "admin2": city_sid,
                "admin3": "",
                "admin4": "",
                "feature_class": "A",
                "feature_code": "ADM2",
                "source": "master",
            })
            for district in city.get("districts_sections", []) or []:
                d_sid = district.get("id") or f"{city_sid}/{district.get('name_en') or district.get('name_ar')}"
                d_id = _id_for(f"district:{d_sid}")
                push({
                    "_id": d_id,
                    "country": "EG",
                    "level": "adm3",
                    "parent_id": city_id,
                    "name": district.get("name_en") or district.get("name_ar"),
                    "names": _names(district.get("name_ar", ""), district.get("name_en", "")),
                    "lat": 0.0,
                    "lng": 0.0,
                    "population": 0,
                    "admin1": gov_sid,
                    "admin2": city_sid,
                    "admin3": d_sid,
                    "admin4": "",
                    "feature_class": "A",
                    "feature_code": "ADM3",
                    "source": "master",
                })
                for area in district.get("areas_villages", []) or []:
                    a_sid = area.get("id") or f"{d_sid}/{area.get('name_en') or area.get('name_ar')}"
                    a_id = _id_for(f"area:{a_sid}")
                    push({
                        "_id": a_id,
                        "country": "EG",
                        "level": "city",
                        "parent_id": d_id,
                        "name": area.get("name_en") or area.get("name_ar"),
                        "names": _names(area.get("name_ar", ""), area.get("name_en", "")),
                        "lat": 0.0,
                        "lng": 0.0,
                        "population": 0,
                        "admin1": gov_sid,
                        "admin2": city_sid,
                        "admin3": d_sid,
                        "admin4": a_sid,
                        "feature_class": "P",
                        "feature_code": "PPL",
                        "source": "master",
                    })
    return rows


def parse_master_file(path: str) -> Tuple[List[Dict], Dict[str, int]]:
    """Read, clean, parse, normalise, flatten → return (records, stats)."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()

    govs: List[Dict] = []

    # ─── Pass 1: parse the leading clean JSON wrapper (governorates 1..11) ───
    # Find where the wrapper's outermost `{...}` closes (respecting strings).
    depth = 0
    in_str = False
    str_q = ""
    wrapper_end = -1
    for idx, ch in enumerate(raw):
        if in_str:
            if ch == "\\":
                continue
            if ch == str_q:
                in_str = False
        elif ch in ('"', "'"):
            in_str = True
            str_q = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                wrapper_end = idx
                break
    if wrapper_end > 0:
        import json as _json
        try:
            wrap = _json.loads(raw[: wrapper_end + 1])
            if isinstance(wrap, dict) and isinstance(wrap.get("governorates"), list):
                govs.extend(wrap["governorates"])
        except Exception:
            pass

    # ─── Pass 2: clean Python contamination from the REST and brace-match ───
    rest = raw[wrapper_end + 1 :] if wrapper_end > 0 else raw
    cleaned = _strip_contamination(rest)
    extracted = _extract_dicts(cleaned)
    # Normalise EVERYTHING first so dedupe keys are reliable (Red-Sea-style
    # nested-`governorate` dicts have their name_en buried until normalised).
    govs = [_normalise_keys(g) for g in govs]
    extracted = [_normalise_keys(g) for g in extracted]

    def _canon(g):
        """Canonical Arabic name (strip "محافظة " prefix + whitespace)
        used to detect duplicates across the two halves of the file."""
        n = (g.get("name_ar") or "").strip()
        if n.startswith("محافظة"):
            n = n[len("محافظة"):].strip()
        return n

    by_name: Dict[str, Dict] = {}
    for g in govs + extracted:
        key = _canon(g)
        if not key:
            continue
        if key not in by_name:
            by_name[key] = g
        else:
            # Prefer the variant with more cities (richer data).
            old_cnt = len(by_name[key].get("cities_centers", []) or [])
            new_cnt = len(g.get("cities_centers", []) or [])
            if new_cnt > old_cnt:
                by_name[key] = g
    govs_final = list(by_name.values())
    records = _to_records(govs_final)

    stats = {
        "governorates": sum(1 for r in records if r["level"] == "adm1"),
        "cities": sum(1 for r in records if r["level"] == "adm2"),
        "districts": sum(1 for r in records if r["level"] == "adm3"),
        "villages": sum(1 for r in records if r["level"] == "city"),
        "total": len(records),
    }
    return records, stats


if __name__ == "__main__":
    import sys
    p = sys.argv[1] if len(sys.argv) > 1 else "/app/backend/data/egypt_master.json"
    records, stats = parse_master_file(p)
    print("Parsed master file stats:", stats)
    # show first 3 governorates with first city each
    gov_rows = [r for r in records if r["level"] == "adm1"][:5]
    for g in gov_rows:
        kids = [r for r in records if r["parent_id"] == g["_id"]][:3]
        print(f"  {g['names']['ar']:25} → {len(kids)} cities first sample: {[k['names']['ar'] for k in kids]}")
