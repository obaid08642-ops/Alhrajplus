"""
Lightweight Elasticsearch-like search for listings, on top of MongoDB.

Why not real Elasticsearch?
- Requires a separate cluster (RAM + cost) and sync pipeline.
- For < ~500K active listings the approach below feels identical to ES users:
  fast prefix/keyword matching + Arabic normalization + typo tolerance via RapidFuzz.

Public API:
- normalize_arabic(text) -> str
- build_search_blob(listing_doc) -> str   (call on insert/update; stored as `search_blob`)
- search_listings(db, q, base_filter, sort, limit, skip) -> (items, total, fuzzy_used)
- suggest(db, q, country_code, limit) -> List[str]
"""
from __future__ import annotations
import re
from typing import Optional, List, Tuple
from rapidfuzz import process as _rf_process, fuzz as _rf_fuzz


# ---------- Arabic normalization ----------

_TASHKEEL_RE = re.compile(r"[\u064B-\u0652\u0670\u0640]")  # diacritics + tatweel
_NON_WORD_RE = re.compile(r"[^\w\u0600-\u06FF]+", re.UNICODE)
# Arabic-Indic & Persian digits → ASCII
_DIGIT_MAP = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")
# Letter normalization
_LETTER_MAP = str.maketrans({
    "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
    "ى": "ي", "ئ": "ي",
    "ؤ": "و",
    "ة": "ه",
    "ﻻ": "لا", "ﻷ": "لا", "ﻹ": "لا", "ﻵ": "لا",
})


def normalize_arabic(text: Optional[str]) -> str:
    """Lowercase + strip tashkeel + unify alef/ya/ta-marboutah variants + Arabic→ASCII digits."""
    if not text:
        return ""
    s = str(text)
    s = _TASHKEEL_RE.sub("", s)
    s = s.translate(_DIGIT_MAP)
    s = s.translate(_LETTER_MAP)
    s = s.lower().strip()
    # collapse whitespace
    s = re.sub(r"\s+", " ", s)
    return s


def tokenize(text: str) -> List[str]:
    if not text:
        return []
    return [t for t in _NON_WORD_RE.split(normalize_arabic(text)) if len(t) >= 2]


# ---------- Listing → searchable blob ----------

def build_search_blob(listing: dict) -> str:
    """Concatenate searchable fields after normalization. Store on the listing as `search_blob`."""
    fields = [
        listing.get("title", ""),
        listing.get("description", ""),
        listing.get("category", ""),
        listing.get("subcategory", ""),
        listing.get("city", ""),
        listing.get("district", ""),
    ]
    cf = listing.get("custom_fields") or {}
    if isinstance(cf, dict):
        fields.extend(str(v) for v in cf.values() if v is not None)
    return normalize_arabic(" ".join(str(f) for f in fields if f))


# ---------- Mongo-side fast search ----------

def _regex_for_token(tok: str) -> dict:
    # Word-boundary-ish: match anywhere but escape regex chars
    return {"search_blob": {"$regex": re.escape(tok), "$options": "i"}}


async def _exact_search(db, base_filter: dict, tokens: List[str], sort, skip: int, limit: int):
    if not tokens:
        return [], 0
    query = {**base_filter, "$and": [_regex_for_token(t) for t in tokens]}
    total = await db.listings.count_documents(query)
    items = await db.listings.find(query, {"_id": 0}).sort(sort).skip(skip).limit(limit).to_list(length=limit)
    return items, total


async def _fuzzy_fallback(
    db,
    base_filter: dict,
    q_norm: str,
    sort,
    limit: int,
    candidate_pool: int = 4000,
    min_score: int = 75,
):
    """RapidFuzz over recent listings — kicks in only when exact/regex search returns nothing."""
    cursor = db.listings.find(base_filter, {"_id": 0}).sort(sort).limit(candidate_pool)
    candidates = await cursor.to_list(length=candidate_pool)
    if not candidates:
        return [], 0
    # For each candidate, find the best matching word/phrase against the query.
    # Short queries (e.g., "نوفه" with one letter typo) need per-word scoring,
    # not whole-document scoring (which dilutes the score).
    q_tokens = [t for t in q_norm.split() if t]
    scored = []
    for c in candidates:
        title_n = normalize_arabic(c.get("title", ""))
        blob = c.get("search_blob") or normalize_arabic(
            f"{title_n} {c.get('category','')} {c.get('city','')}"
        )
        # Score 1: WRatio on title (rewards full-string similarity)
        s_title = _rf_fuzz.WRatio(q_norm, title_n) if title_n else 0
        # Score 2: best partial_ratio of any query token vs any blob word (rewards 1-letter typos)
        words = [w for w in blob.split() if len(w) >= 2]
        s_word = 0
        if words and q_tokens:
            for qt in q_tokens:
                best = max((_rf_fuzz.partial_ratio(qt, w) for w in words), default=0)
                if best > s_word:
                    s_word = best
        score = max(s_title, s_word)
        if score >= min_score:
            scored.append((score, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    items = [c for _, c in scored[:limit]]
    return items, len(items)


async def search_listings(
    db,
    q: str,
    base_filter: dict,
    sort,
    limit: int = 30,
    skip: int = 0,
) -> Tuple[list, int, bool]:
    """
    Returns: (items, total, fuzzy_used)
    - Tries exact/normalized regex first (fast, uses index).
    - Falls back to RapidFuzz if zero results (typo tolerance).
    """
    q_norm = normalize_arabic(q)
    tokens = [t for t in q_norm.split() if len(t) >= 2]
    items, total = await _exact_search(db, base_filter, tokens, sort, skip, limit)
    if items:
        return items, total, False
    # Single-token: maybe partial prefix is enough — expand with looser regex
    if len(tokens) == 1:
        loose = {**base_filter, "search_blob": {"$regex": re.escape(tokens[0]), "$options": "i"}}
        total2 = await db.listings.count_documents(loose)
        if total2:
            items2 = await db.listings.find(loose, {"_id": 0}).sort(sort).skip(skip).limit(limit).to_list(length=limit)
            return items2, total2, False
    # Fuzzy fallback for typos
    fuzzy_items, fuzzy_total = await _fuzzy_fallback(db, base_filter, q_norm, sort, limit)
    return fuzzy_items, fuzzy_total, bool(fuzzy_items)


# ---------- Autocomplete ----------

async def suggest(db, q: str, country_code: Optional[str], limit: int = 8) -> List[str]:
    q_norm = normalize_arabic(q)
    if len(q_norm) < 1:
        return []
    base = {"status": "active"}
    if country_code:
        base["country_code"] = country_code
    base["search_blob"] = {"$regex": re.escape(q_norm), "$options": "i"}
    cursor = db.listings.find(base, {"_id": 0, "title": 1}).sort([("created_at", -1)]).limit(limit * 4)
    seen = set()
    out: List[str] = []
    async for doc in cursor:
        t = (doc.get("title") or "").strip()
        key = normalize_arabic(t)
        if not t or key in seen:
            continue
        seen.add(key)
        out.append(t)
        if len(out) >= limit:
            break
    return out
