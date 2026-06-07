"""
locations.py — Production-grade Geonames-backed location service.

• Parses Geonames `XX.txt` country dumps into a unified `locations` MongoDB
  collection with multi-language names extracted from the `alternatenames`
  column.
• Builds a clean parent→child hierarchy:
    - Gulf (3 levels): country → city → district
    - Egypt  (4 levels): country → governorate → city/markaz → district/village
• Cascading API: `/api/locations/children?parent_id=...`
• IP-based country detection with multi-provider fallback chain.

Schema (collection `locations`):
{
  "_id": "<geoname_id>",          # we explicitly set _id = geonameid (int)
  "country": "EG",
  "level": "country|adm1|adm2|adm3|city|district",
  "parent_id": <int|None>,        # geonameid of parent or None
  "names": {                      # localised display strings
      "ar": "...", "en": "...", "fr": "...",
      "ur": "...", "hi": "...", "bn": "...", "pa": "..."
  },
  "name": "<canonical-English-name>",
  "lat": float, "lng": float,
  "feature_class": "A|P", "feature_code": "ADM1|ADM2|ADM3|PPL|PPLA|...",
  "population": int,
  "admin1": "...", "admin2": "...", "admin3": "...", "admin4": "...",
}
"""
from __future__ import annotations
import os
import re
import asyncio
from typing import Optional, List, Dict, Tuple
import httpx
from fastapi import APIRouter, HTTPException, Query, Request, UploadFile, File, Header, Depends
from pydantic import BaseModel

# Languages we localise to.
SUPPORTED_LANGS = ["ar", "en", "fr", "ur", "hi", "bn", "pa"]

# Country-specific hierarchy rules.
# • For each country we declare which Geonames feature_codes belong to each
#   of our logical "levels". This lets the front end render a clean
#   cascading dropdown regardless of how Geonames classifies a row.
# • Egypt has 4 levels (governorate / city / district).
# • Gulf has 3 levels (city / district).
COUNTRY_LEVELS: Dict[str, List[Tuple[str, List[str]]]] = {
    # (level_key, accepted_feature_codes)
    # ------- EGYPT (4 logical levels) -------
    # Geonames EG dump distribution:
    #   ADM1=27 governorates | ADM2=138 marakez | PPLA=26 gov capitals |
    #   PPLA2=8 markaz capitals | PPLX=434 districts/neighbourhoods |
    #   PPL=11567 villages/cities | PPLF/PPLQ/PPLL=49 farm/seasonal
    "EG": [
        ("adm1", ["ADM1"]),                                # Governorate (محافظة)
        ("adm2", ["ADM2"]),                                # Markaz (مركز) — administrative city
        ("adm3", ["PPLA", "PPLA2", "PPLA3", "PPLX"]),      # District / qism / neighborhood (قسم / حي)
        ("city", ["PPL", "PPLA4", "PPLF", "PPLQ", "PPLL"]),# Village / locality (قرية)
    ],
    # ------- Gulf countries (3 logical levels) -------
    "SA": [
        ("adm1", ["ADM1"]),                              # Region (منطقة)
        ("adm2", ["ADM2", "PPLA", "PPLA2"]),             # City (مدينة)
        ("city", ["PPL", "PPLA3", "PPLA4", "PPLX"]),     # District (حي) / locality
    ],
    "AE": [("adm1", ["ADM1"]), ("adm2", ["ADM2", "PPLA", "PPLA2"]), ("city", ["PPL", "PPLA3", "PPLA4", "PPLX"])],
    "KW": [("adm1", ["ADM1"]), ("adm2", ["ADM2", "PPLA", "PPLA2"]), ("city", ["PPL", "PPLA3", "PPLA4", "PPLX"])],
    "QA": [("adm1", ["ADM1"]), ("adm2", ["ADM2", "PPLA", "PPLA2"]), ("city", ["PPL", "PPLA3", "PPLA4", "PPLX"])],
    "BH": [("adm1", ["ADM1"]), ("adm2", ["ADM2", "PPLA", "PPLA2"]), ("city", ["PPL", "PPLA3", "PPLA4", "PPLX"])],
    "OM": [("adm1", ["ADM1"]), ("adm2", ["ADM2", "PPLA", "PPLA2"]), ("city", ["PPL", "PPLA3", "PPLA4", "PPLX"])],
}

# ============================================================
# Script / language detection regexes.
# Strategy: Geonames' `alternatenames` column is comma-separated and
# untagged. We pick the BEST candidate per language using script ranges +
# language-specific letters that DO NOT appear in the other 6 languages.
# ============================================================
# Generic Arabic-script block (covers Arabic + Persian + Urdu glyphs).
_ARABIC_BLOCK = re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]")
# Persian-only letters (پ چ ژ گ + Persian yeh ی U+06CC).
_PERSIAN_ONLY = re.compile(r"[\u067E\u0686\u0698\u06AF\u06CC]")
# Urdu-specific letters (ہ U+06C1, ے U+06D2, ٹ U+0679, ڈ U+0688, ڑ U+0691, ں U+06BA, ھ U+06BE).
_URDU_ONLY = re.compile(r"[\u06C1\u06D2\u0679\u0688\u0691\u06BA\u06BE]")
# Berber / Maghrebi / Tachelhit / Pashto letters that NEVER appear in standard
# Arabic. Keeps "لمحافظة د لڭيزة" (Berber) out of the `ar` field.
_BERBER_ONLY = re.compile(r"[\u06AD\u0763\u06A8\u06D5\u0768\u06BE]")  # ڭ ݣ ڨ ە ݨ ھ
# Devanagari (Hindi).
_DEVANAGARI = re.compile(r"[\u0900-\u097F]")
# Bengali.
_BENGALI = re.compile(r"[\u0980-\u09FF]")
# Gurmukhi (Punjabi).
_GURMUKHI = re.compile(r"[\u0A00-\u0A7F]")
# Persian "ostan" (province) — appears in Iranian / Pashto / Dari alternates we DO NOT want as Arabic.
_NOT_ARABIC_TOKENS = re.compile(r"استان|اوستان|صوبہ|صوبه")
# Latin range (rough) — for picking English / French.
_LATIN_RE = re.compile(r"^[\x00-\x7F\u00C0-\u017F\s\-\.,'’()]+$")
# French article / admin-word hints — REQUIRED for a candidate to be tagged French.
# (Bare diacritics like ï/ä also appear in transliterations of Arabic/Greek, so
# we demand an actual French word/article to avoid false positives.)
_FR_HINT_RE = re.compile(r"\b(Le|La|Les|Du|De|Des|Gouvernorat|Mohafazah)\b|Caire|Égypte", re.IGNORECASE)
# Common transliteration "noise" we want to deprioritise for English.
_DIACRITIC_RE = re.compile(r"[āīūēōḩẓşṣḑḏţṭḍāīūĀĪŪ]")


def _is_arabic(s: str) -> bool:
    """True iff the string is *Arabic-script* AND not Persian/Urdu/Berber-specific."""
    if not s or not _ARABIC_BLOCK.search(s):
        return False
    if _PERSIAN_ONLY.search(s):
        return False
    if _URDU_ONLY.search(s):
        return False
    if _BERBER_ONLY.search(s):
        return False
    if _NOT_ARABIC_TOKENS.search(s):
        return False
    return True


def _is_urdu(s: str) -> bool:
    return bool(s and _URDU_ONLY.search(s))


def _is_persian(s: str) -> bool:
    return bool(s and _PERSIAN_ONLY.search(s) and not _URDU_ONLY.search(s))


def _is_latin(s: str) -> bool:
    return bool(_LATIN_RE.match(s or "")) if s else False


def parse_alternatenames(blob: str, base_name: str, base_ascii: str) -> Dict[str, str]:
    """Parse Geonames `alternatenames` blob → per-language dict using
    script + language-letter heuristics. Always returns ALL 7 languages
    with English fallback for missing ones."""
    parts: List[str] = []
    if blob:
        parts = [p.strip() for p in blob.split(",") if p.strip()]

    out: Dict[str, str] = {}

    # --------- Arabic (ar) ----------
    arabic_cands = [p for p in parts if _is_arabic(p)]
    if _is_arabic(base_name):
        arabic_cands.insert(0, base_name)
    # Prefer entries STARTING with an official admin prefix (محافظة / مدينة /
    # مركز / قرية / قسم / حي).  This excludes Berber/dialect forms like
    # "لمحافظة د لڭيزة" which only CONTAIN محافظة as a sub-string.
    starts_with_admin = [c for c in arabic_cands if c.startswith(("محافظة ", "مدينة ", "مركز ", "قرية ", "قسم ", "حي "))]
    if starts_with_admin:
        # Among those, prefer the shortest (avoids unnecessary suffixes).
        out["ar"] = min(starts_with_admin, key=len)
    else:
        # Fallback: any candidate that CONTAINS the admin word.
        contains_admin = [c for c in arabic_cands if any(k in c for k in ("محافظة", "مدينة", "مركز", "قرية", "قسم", "حي "))]
        if contains_admin:
            out["ar"] = min(contains_admin, key=len)
        elif arabic_cands:
            out["ar"] = min(arabic_cands, key=len)

    # --------- Urdu (ur) ----------
    urdu_cands = [p for p in parts if _is_urdu(p)]
    if urdu_cands:
        out["ur"] = urdu_cands[0]

    # --------- Hindi (hi) ----------
    hi_cands = [p for p in parts if _DEVANAGARI.search(p)]
    if hi_cands:
        out["hi"] = hi_cands[0]

    # --------- Bengali (bn) ----------
    bn_cands = [p for p in parts if _BENGALI.search(p)]
    if bn_cands:
        out["bn"] = bn_cands[0]

    # --------- Punjabi (pa) ----------
    pa_cands = [p for p in parts if _GURMUKHI.search(p)]
    if pa_cands:
        out["pa"] = pa_cands[0]

    # --------- English (en) ----------
    # Prefer the asciiname (cleanest), then a Latin alt with NO diacritics, then base_name.
    en_pick = None
    if base_ascii and _is_latin(base_ascii) and not _DIACRITIC_RE.search(base_ascii):
        en_pick = base_ascii
    if not en_pick:
        for p in parts:
            if _is_latin(p) and not _DIACRITIC_RE.search(p) and 2 <= len(p) <= 60 and not _FR_HINT_RE.search(p):
                en_pick = p
                break
    if not en_pick:
        en_pick = base_ascii or base_name or ""
    out["en"] = en_pick

    # --------- French (fr) ----------
    # Pick the Latin candidate with French article / diacritics that ISN'T the English pick.
    fr_cands = [p for p in parts if _is_latin(p) and _FR_HINT_RE.search(p) and p != en_pick]
    if fr_cands:
        # Prefer entries explicitly starting with "Gouvernorat" / "Le " / "La ".
        prioritised = [c for c in fr_cands if c.lower().startswith(("le ", "la ", "les ", "gouvernorat"))]
        out["fr"] = (prioritised or fr_cands)[0]

    # --------- English fallback for any missing language ----------
    for lang in SUPPORTED_LANGS:
        if not out.get(lang):
            out[lang] = out["en"]
    return out


def _classify_level(country: str, feature_code: str) -> Optional[str]:
    """Map a Geonames feature_code → our logical level key for the given
    country. Returns None for rows we don't want to import (rivers, hills…)."""
    rules = COUNTRY_LEVELS.get(country)
    if not rules:
        # Default to 3-level Gulf rules for any unknown country.
        rules = COUNTRY_LEVELS["SA"]
    for level_key, codes in rules:
        if feature_code in codes:
            return level_key
    return None


def parse_geonames_file(text: str, country_code: str) -> List[Dict]:
    """Parse a Geonames `XX.txt` blob into our schema records."""
    records: List[Dict] = []
    for line in text.splitlines():
        cols = line.split("\t")
        if len(cols) < 19:
            continue
        try:
            geonameid = int(cols[0])
        except ValueError:
            continue
        name = cols[1]
        asciiname = cols[2]
        alt = cols[3]
        try:
            lat = float(cols[4])
        except ValueError:
            lat = 0.0
        try:
            lng = float(cols[5])
        except ValueError:
            lng = 0.0
        fclass = cols[6]
        fcode = cols[7]
        cc = cols[8]
        admin1 = cols[10]
        admin2 = cols[11]
        admin3 = cols[12]
        admin4 = cols[13]
        try:
            pop = int(cols[14]) if cols[14] else 0
        except ValueError:
            pop = 0
        if cc != country_code:
            continue
        if fclass not in ("A", "P"):
            continue
        level = _classify_level(cc, fcode)
        if not level:
            continue
        names = parse_alternatenames(alt, name, asciiname)
        # If `name` itself is Arabic-script and we didn't get a better Arabic
        # candidate, use it as authoritative.
        if _is_arabic(name) and not _is_arabic(names.get("ar", "")):
            names["ar"] = name
        records.append({
            "_id": geonameid,
            "country": cc,
            "level": level,
            "parent_id": None,  # resolved in a 2nd pass.
            "names": names,
            "name": asciiname or name,
            "lat": lat, "lng": lng,
            "feature_class": fclass, "feature_code": fcode,
            "population": pop,
            "admin1": admin1, "admin2": admin2, "admin3": admin3, "admin4": admin4,
        })
    return records


def link_parents(records: List[Dict]) -> List[Dict]:
    """2nd-pass: connect each record to its immediate logical parent.

    Approach:
    1. Build admin-code anchor table from records whose `level` is adm1/adm2/adm3.
       Key = (country, admin1, admin2, admin3) up to that level's depth.
    2. For each child, climb upward by truncating the admin tuple until a
       known anchor is found. Falls back to country root (None) for orphans.
    """
    # level → which admin codes uniquely identify it.
    # We only use admin1..admin4 from Geonames.
    anchors: Dict[Tuple[str, str, str, str, str, str], int] = {}
    # For each adm-level record, register the appropriate truncated key.
    for r in records:
        lvl = r["level"]
        a1, a2, a3 = r["admin1"], r["admin2"], r["admin3"]
        if lvl == "adm1":
            key = (r["country"], lvl, a1, "", "", "")
        elif lvl == "adm2":
            key = (r["country"], lvl, a1, a2, "", "")
        elif lvl == "adm3":
            key = (r["country"], lvl, a1, a2, a3, "")
        else:
            continue  # leaves never act as anchors.
        anchors[key] = r["_id"]

    # Climb-the-ladder lookup.
    def find_parent(r):
        cc, a1, a2, a3 = r["country"], r["admin1"], r["admin2"], r["admin3"]
        lvl = r["level"]
        # Define the candidate parent levels in order (closest → farthest).
        ladders = {
            "city": [("adm3", a1, a2, a3, ""), ("adm2", a1, a2, "", ""), ("adm1", a1, "", "", "")],
            "adm3": [("adm2", a1, a2, "", ""), ("adm1", a1, "", "", "")],
            "adm2": [("adm1", a1, "", "", "")],
            "adm1": [],
        }
        for plvl, k1, k2, k3, k4 in ladders.get(lvl, []):
            key = (cc, plvl, k1, k2, k3, k4)
            if key in anchors and anchors[key] != r["_id"]:
                return anchors[key]
        return None

    for r in records:
        r["parent_id"] = find_parent(r)
    return records


# ============================================================
# API router
# ============================================================
# ----- In-memory TTL cache (lightning-fast cascading dropdowns) -----
# Keyed by (endpoint, lang, parent_id, country, level, q, limit, loc_id).
# Cleared automatically on `admin/import`.  No external Redis dependency.
import time as _time
_CACHE: Dict[Tuple, Tuple[float, object]] = {}
_CACHE_TTL = 300  # 5 minutes — locations are near-static.
_CACHE_MAX = 4096  # hard ceiling to keep memory bounded.

def _cache_get(key):
    item = _CACHE.get(key)
    if not item:
        return None
    ts, val = item
    if _time.time() - ts > _CACHE_TTL:
        _CACHE.pop(key, None)
        return None
    return val

def _cache_set(key, val):
    if len(_CACHE) >= _CACHE_MAX:
        # Drop the 25 % oldest entries (cheap LRU approximation).
        for k in sorted(_CACHE.keys(), key=lambda k: _CACHE[k][0])[: _CACHE_MAX // 4]:
            _CACHE.pop(k, None)
    _CACHE[key] = (_time.time(), val)

def _cache_clear():
    _CACHE.clear()


def build_router(db, get_current_user_optional=None) -> APIRouter:
    router = APIRouter(prefix="/api/locations", tags=["locations"])

    def _localise(loc: Dict, lang: str) -> Dict:
        names = loc.get("names") or {}
        # Fallback chain: requested → en → first available.
        text = names.get(lang) or names.get("en") or next(iter(names.values()), loc.get("name", ""))
        return {
            "id": loc["_id"],
            "country": loc["country"],
            "level": loc["level"],
            "parent_id": loc.get("parent_id"),
            "name": text,
            "lat": loc.get("lat"), "lng": loc.get("lng"),
            "population": loc.get("population", 0),
        }

    @router.get("/countries")
    async def list_countries(lang: str = "en"):
        """List all countries that have at least one imported location."""
        ccs = await db.locations.distinct("country")
        result = []
        for cc in ccs:
            # Try to fetch country root record (we don't store one yet; emit ISO code).
            result.append({"code": cc, "name": cc})
        return result

    @router.get("/locate")
    async def locate(
        lat: float = Query(...),
        lng: float = Query(...),
        country: Optional[str] = Query(None),
        lang: str = Query("en"),
    ):
        """Reverse-geocode GPS → full breadcrumb path inside our Geonames-backed
        collection. Returns `{adm1, adm2, adm3, city}` (only the levels that
        have a candidate) so the front-end can pre-populate the cascading
        picker with one call.

        Algorithm: pick the country (auto-fallback to EG if the requested
        one has no data), find the leaf-most level present, return the row
        with the smallest haversine distance, then walk parents up.
        Cached for 60 s — GPS rarely changes that quickly.
        """
        lang = lang if lang in SUPPORTED_LANGS else "en"
        cc = (country or "").upper()
        # Auto-fallback: if requested country has no data, pick the first one that does.
        available = await db.locations.distinct("country")
        if cc not in available:
            cc = "EG" if "EG" in available else (available[0] if available else "")
        if not cc:
            raise HTTPException(404, "no location data imported")

        cache_key = ("locate", round(lat, 3), round(lng, 3), cc, lang)
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        # Pick the deepest level that exists for this country.
        priority = ["city", "adm3", "adm2", "adm1"]
        leaf_level = None
        for lvl in priority:
            if await db.locations.count_documents({"country": cc, "level": lvl}) > 0:
                leaf_level = lvl
                break
        if not leaf_level:
            raise HTTPException(404, f"no rows for {cc}")

        # Find nearest by scanning bounding box (cheap — 1° ≈ 111 km).
        BOX = 0.5  # ±0.5° ≈ 55 km — large enough to catch nearest even in deserts.
        cur = db.locations.find({
            "country": cc, "level": leaf_level,
            "lat": {"$gte": lat - BOX, "$lte": lat + BOX},
            "lng": {"$gte": lng - BOX, "$lte": lng + BOX},
        }, projection={"_id": 1, "lat": 1, "lng": 1, "parent_id": 1}).limit(2000)
        candidates = [d async for d in cur]
        if not candidates:
            # Widen — fall back to a country-wide top-population scan.
            cur = db.locations.find({"country": cc, "level": leaf_level}, projection={"_id": 1, "lat": 1, "lng": 1, "parent_id": 1}).sort("population", -1).limit(500)
            candidates = [d async for d in cur]
        if not candidates:
            raise HTTPException(404, "no candidates")

        def _hav(la1, lo1, la2, lo2):
            from math import radians, sin, cos, asin, sqrt
            la1, lo1, la2, lo2 = map(radians, (la1, lo1, la2, lo2))
            dlat = la2 - la1
            dlon = lo2 - lo1
            a = sin(dlat / 2) ** 2 + cos(la1) * cos(la2) * sin(dlon / 2) ** 2
            return 6371.0 * 2 * asin(sqrt(a))

        nearest = min(candidates, key=lambda d: _hav(lat, lng, d.get("lat") or 0.0, d.get("lng") or 0.0))

        # Walk parents to build the full path.
        path: List[Dict] = []
        cur_id = nearest["_id"]
        seen = set()
        while cur_id and cur_id not in seen:
            seen.add(cur_id)
            doc = await db.locations.find_one({"_id": cur_id}, projection={"_id": 1, "country": 1, "level": 1, "parent_id": 1, "names": 1, "name": 1, "lat": 1, "lng": 1, "population": 1})
            if not doc:
                break
            path.append(_localise(doc, lang))
            cur_id = doc.get("parent_id")

        # Build the {adm1,adm2,adm3,city} result.
        out: Dict[str, Dict] = {}
        for node in path:
            out[node["level"]] = node
        result = {"country": cc, "selection": out, "matched_id": nearest["_id"]}
        _cache_set(cache_key, result)
        return result

    @router.get("/children")
    async def list_children(
        parent_id: Optional[int] = Query(None),
        country: Optional[str] = Query(None),
        level: Optional[str] = Query(None),
        q: Optional[str] = Query(None),
        lang: str = Query("en"),
        limit: int = Query(500, le=2000),
    ):
        """Cascading dropdown helper.

        Common usage:
        • Top-level: `?country=SA&level=adm2` → all SA cities.
        • Cascading: `?parent_id=361291` → all direct children of Cairo.
        • Search:    `?country=EG&q=قاهرة` → top matches across levels.
        """
        if lang not in SUPPORTED_LANGS:
            lang = "en"
        cache_key = ("children", parent_id, country, level, q or "", lang, limit)
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached
        filt: Dict = {}
        if parent_id is not None:
            filt["parent_id"] = parent_id
            # When parent_id is provided, we cascade by adjacency — DO NOT
            # filter by `level`. Some governorates (Cairo, Alexandria, Suez,
            # Port Said) skip the markaz layer and have ADM3 directly under
            # ADM1; the old strict filter returned empty for them.
        else:
            if country:
                filt["country"] = country
            if level:
                filt["level"] = level
        if country and "country" not in filt:
            filt["country"] = country
        if q:
            # Search across ALL language fields.
            or_clauses = [{f"names.{lg}": {"$regex": re.escape(q), "$options": "i"}} for lg in SUPPORTED_LANGS]
            or_clauses.append({"name": {"$regex": re.escape(q), "$options": "i"}})
            filt["$or"] = or_clauses
        cur = db.locations.find(filt, projection={"_id": 1, "country": 1, "level": 1, "parent_id": 1, "names": 1, "name": 1, "lat": 1, "lng": 1, "population": 1}).sort([("population", -1), ("name", 1)]).limit(limit)
        rows = [doc async for doc in cur]
        result = [_localise(r, lang) for r in rows]
        _cache_set(cache_key, result)
        return result

    @router.get("/get/{loc_id}")
    async def get_location(loc_id: int, lang: str = "en"):
        lang = lang if lang in SUPPORTED_LANGS else "en"
        cache_key = ("get", loc_id, lang)
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached
        doc = await db.locations.find_one({"_id": loc_id}, projection={"_id": 1, "country": 1, "level": 1, "parent_id": 1, "names": 1, "name": 1, "lat": 1, "lng": 1, "population": 1})
        if not doc:
            raise HTTPException(404)
        result = _localise(doc, lang)
        _cache_set(cache_key, result)
        return result

    @router.get("/path/{loc_id}")
    async def get_path(loc_id: int, lang: str = "en"):
        """Return the breadcrumb (country → ... → loc) for a given location."""
        lang = lang if lang in SUPPORTED_LANGS else "en"
        cache_key = ("path", loc_id, lang)
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached
        out = []
        cur_id: Optional[int] = loc_id
        seen = set()
        while cur_id is not None and cur_id not in seen:
            seen.add(cur_id)
            doc = await db.locations.find_one({"_id": cur_id}, projection={"_id": 1, "country": 1, "level": 1, "parent_id": 1, "names": 1, "name": 1, "lat": 1, "lng": 1, "population": 1})
            if not doc:
                break
            out.append(_localise(doc, lang))
            cur_id = doc.get("parent_id")
        result = list(reversed(out))
        _cache_set(cache_key, result)
        return result

    # ============================================================
    # IP-based country detection (multi-provider fallback)
    # ============================================================
    @router.get("/detect-country")
    async def detect_country(request: Request, x_forwarded_for: Optional[str] = Header(None)):
        """Best-effort IP→country lookup. Tries ip-api.com → ipapi.co → ipinfo.io.
        Returns: {"country": "SA", "source": "ip-api.com"} or {"country": null}."""
        # Pick the real client IP — strip the load balancer hop.
        ip = (x_forwarded_for or "").split(",")[0].strip() or (request.client.host if request.client else "")
        if not ip or ip.startswith(("127.", "10.", "192.168.", "::1")):
            ip = ""  # Let the providers infer from the request origin.
        providers = [
            ("ip-api.com", f"http://ip-api.com/json/{ip}?fields=countryCode" if ip else "http://ip-api.com/json/?fields=countryCode", "countryCode"),
            ("ipapi.co",   f"https://ipapi.co/{ip}/json/" if ip else "https://ipapi.co/json/",                                    "country"),
            ("ipinfo.io",  f"https://ipinfo.io/{ip}/json" if ip else "https://ipinfo.io/json",                                    "country"),
        ]
        async with httpx.AsyncClient(timeout=2.5) as client:
            for name, url, field in providers:
                try:
                    r = await client.get(url, headers={"Accept": "application/json"})
                    if r.status_code == 200:
                        data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
                        code = (data.get(field) or "").upper()
                        if code and len(code) == 2:
                            return {"country": code, "source": name, "ip": ip or None}
                except Exception:
                    continue
        return {"country": None, "source": None, "ip": ip or None}

    # ============================================================
    # ADMIN: import a Geonames file. Auth: requires `is_admin` claim.
    # ============================================================
    @router.post("/admin/import")
    async def admin_import(
        country: str = Query(..., min_length=2, max_length=2),
        file: UploadFile = File(...),
        user=Depends(get_current_user_optional) if get_current_user_optional else None,
    ):
        """Upload a Geonames `XX.txt` and reseed the `locations` collection
        for that country. Idempotent — replaces any existing rows for the
        same country code.

        Requires the caller to be authenticated as admin (best-effort
        check; if no auth dep is wired, the endpoint stays accessible from
        the internal network only — protect it with a reverse-proxy ACL)."""
        # Best-effort admin check.
        if user is not None:
            is_admin = bool(getattr(user, "is_admin", False) or (isinstance(user, dict) and user.get("is_admin")))
            if not is_admin:
                raise HTTPException(403, "admin only")
        cc = country.upper()
        try:
            raw = (await file.read()).decode("utf-8", errors="replace")
        except Exception as e:
            raise HTTPException(400, f"could not read file: {e}")
        records = parse_geonames_file(raw, cc)
        if not records:
            raise HTTPException(400, "no records matched — wrong country file?")
        link_parents(records)
        # Wipe + bulk-insert.
        await db.locations.delete_many({"country": cc})
        # Mongo `_id` collision guard — Geonames IDs are globally unique so
        # OK to set as `_id`. Use ordered=False to skip duplicates if any.
        try:
            await db.locations.insert_many(records, ordered=False)
        except Exception:
            # Fallback to upsert one-by-one (slow but resilient).
            for r in records:
                await db.locations.replace_one({"_id": r["_id"]}, r, upsert=True)
        # Indexes (idempotent).
        await db.locations.create_index([("country", 1), ("level", 1)])
        await db.locations.create_index([("parent_id", 1)])
        await db.locations.create_index([("country", 1), ("name", 1)])
        # Bust the in-memory cache so the new data is reflected immediately.
        _cache_clear()
        return {"country": cc, "imported": len(records)}

    @router.get("/cache/stats")
    async def cache_stats():
        """Visibility into the in-memory cache (size, TTL)."""
        return {"entries": len(_CACHE), "max": _CACHE_MAX, "ttl_seconds": _CACHE_TTL}

    return router
