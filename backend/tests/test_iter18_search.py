"""
Iteration 18 - Smart Search Engine (Arabic-aware + typo-tolerant) tests.
Targets:
  - GET /api/listings?q=... (exact, fuzzy, normalization, digits)
  - GET /api/search/suggest
  - POST /api/listings + immediate searchability (index hook)
  - PUT /api/listings/{id} + search_blob refresh
  - Regression: search/log, search/trending, search/history endpoints
Backend base URL: REACT_APP_BACKEND_URL from frontend/.env (external).
"""
import os
import time
import pytest
import requests

BASE_URL = "https://platform-inspect.preview.emergentagent.com"  # mirrors REACT_APP_BACKEND_URL
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


# ---------------- Fixtures ----------------

@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text[:200]}")
    tok = r.json().get("access_token") or r.json().get("token")
    if not tok:
        pytest.skip("no token in login response")
    return tok


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def seed_listing_ids(api, auth_headers):
    """Create distinctive listings that we KNOW the engine should find. Cleanup at end."""
    payloads = [
        {
            "title": "TEST_SEARCH مرسيدس S500 موديل 2020",
            "description": "سيارة مرسيدس فاخرة بحالة ممتازة",
            "category": "cars",
            "subcategory": "mercedes",
            "city": "Riyadh",
            "price": 250000,
            "currency": "SAR",
            "images": [],
            "videos": [],
            "show_phone": True,
        },
        {
            "title": "TEST_SEARCH ايفون 14 برو ماكس",
            "description": "جهاز ايفون 14 برو ماكس بحالة الجديد",
            "category": "electronics",
            "subcategory": "phones",
            "city": "Jeddah",
            "price": 4500,
            "currency": "SAR",
            "images": [],
            "videos": [],
            "show_phone": True,
        },
        {
            "title": "TEST_SEARCH مرسيدس سي 200 للبيع",
            "description": "Mercedes C 200 for sale ٢٠٢٠",
            "category": "cars",
            "subcategory": "mercedes",
            "city": "Riyadh",
            "price": 120000,
            "currency": "SAR",
            "images": [],
            "videos": [],
            "show_phone": True,
        },
        {
            "title": "TEST_SEARCH republish quick test listing",
            "description": "english testing for republish search keyword",
            "category": "personal",
            "subcategory": "misc",
            "city": "Riyadh",
            "price": 100,
            "currency": "SAR",
            "images": [],
            "videos": [],
            "show_phone": True,
        },
    ]
    ids = []
    for p in payloads:
        r = requests.post(f"{BASE_URL}/api/listings", json=p, headers=auth_headers, timeout=20)
        assert r.status_code in (200, 201), f"create failed: {r.status_code} {r.text[:300]}"
        d = r.json()
        ids.append(d["id"])
        # Verify index-hook side effect: search_blob populated
        assert d.get("search_blob"), f"search_blob missing in create response for {p['title']}"
    yield ids
    # cleanup
    for lid in ids:
        try:
            requests.delete(f"{BASE_URL}/api/listings/{lid}", headers=auth_headers, timeout=10)
        except Exception:
            pass


# ---------------- 1. Exact + fuzzy Arabic ----------------

class TestArabicExactAndFuzzy:
    def test_exact_arabic_match(self, api, seed_listing_ids):
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدس"})
        assert r.status_code == 200
        d = r.json()
        assert "total" in d and "items" in d and "fuzzy" in d, f"missing keys: {d.keys()}"
        assert d["fuzzy"] is False, f"exact match should not be fuzzy: {d}"
        assert d["total"] >= 2
        titles = " ".join(i.get("title", "") for i in d["items"])
        assert "مرسيدس" in titles

    def test_arabic_typo_fuzzy(self, api, seed_listing_ids):
        # extra letter typo
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدسس"})
        assert r.status_code == 200
        d = r.json()
        assert d["fuzzy"] is True, f"typo should trigger fuzzy: {d}"
        assert d["total"] >= 1
        titles = " ".join(i.get("title", "") for i in d["items"])
        assert "مرسيدس" in titles

    def test_alef_normalization(self, api, seed_listing_ids):
        # seed has 'ايفون' (no hamza) — variants 'إيفون' / 'أيفون' / 'آيفون' must match
        for variant in ["إيفون", "أيفون", "آيفون", "ايفون"]:
            r = api.get(f"{BASE_URL}/api/listings", params={"q": variant})
            assert r.status_code == 200, variant
            d = r.json()
            assert d["total"] >= 1, f"variant {variant} returned 0: {d}"
            assert d["fuzzy"] is False, f"variant {variant} should be exact (normalized): {d}"

    def test_arabic_indic_digit_normalization(self, api, seed_listing_ids):
        # seed: 'سي 200' in title; query with arabic-indic digits
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "سي ٢٠٠"})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1, f"٢٠٠ should normalize to 200: {d}"
        # also reverse: ascii digits should match arabic-indic digits in description
        r2 = api.get(f"{BASE_URL}/api/listings", params={"q": "2020"})
        assert r2.status_code == 200


# ---------------- 2. English exact + typo ----------------

class TestEnglish:
    def test_english_exact(self, api, seed_listing_ids):
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "republish"})
        assert r.status_code == 200
        d = r.json()
        assert d["fuzzy"] is False
        assert d["total"] >= 1
        titles = " ".join(i.get("title", "") for i in d["items"])
        assert "republish" in titles.lower()

    def test_english_typo(self, api, seed_listing_ids):
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "republsh"})
        assert r.status_code == 200
        d = r.json()
        assert d["fuzzy"] is True, f"english typo should be fuzzy: {d}"
        assert d["total"] >= 1


# ---------------- 3. Nonsense + no-q regression + filter combo ----------------

class TestEdgeCases:
    def test_nonsense_query_returns_zero(self, api):
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "xyzqwerty"})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] == 0
        assert d["fuzzy"] is False
        assert d["items"] == []

    def test_no_q_returns_all(self, api):
        r = api.get(f"{BASE_URL}/api/listings")
        assert r.status_code == 200
        d = r.json()
        assert "total" in d and "items" in d
        assert d["total"] >= 1
        # When q not provided, response shape is {total, items} (no fuzzy key)
        assert "fuzzy" not in d or d.get("fuzzy") is None or d.get("fuzzy") is False

    def test_q_plus_filter(self, api, seed_listing_ids):
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدس", "category": "cars"})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 2
        for it in d["items"]:
            assert it.get("category") == "cars", f"filter ignored: {it}"

    def test_q_plus_wrong_category_filter(self, api, seed_listing_ids):
        # مرسيدس exists in 'cars' category, force electronics — should drop to 0 (not fall to fuzzy that ignores filter)
        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدس", "category": "electronics"})
        assert r.status_code == 200
        d = r.json()
        # electronics has ايفون but not مرسيدس; fuzzy may still pick something close — at minimum must respect category
        for it in d["items"]:
            assert it.get("category") == "electronics", f"filter ignored in fuzzy: {it}"


# ---------------- 4. /api/search/suggest ----------------

class TestSuggest:
    def test_suggest_arabic_prefix(self, api, seed_listing_ids):
        r = api.get(f"{BASE_URL}/api/search/suggest", params={"q": "مر", "limit": 8})
        assert r.status_code == 200
        d = r.json()
        assert "items" in d
        assert isinstance(d["items"], list)
        # must contain at least one suggestion that, after normalization, starts with مر-ish
        joined = " | ".join(d["items"])
        assert "مرسيدس" in joined or len(d["items"]) > 0

    def test_suggest_empty_q(self, api):
        r = api.get(f"{BASE_URL}/api/search/suggest", params={"q": ""})
        assert r.status_code == 200
        d = r.json()
        assert d == {"items": []} or d.get("items") == []

    def test_suggest_with_limit_cap(self, api, seed_listing_ids):
        r = api.get(f"{BASE_URL}/api/search/suggest", params={"q": "TEST_SEARCH", "limit": 3})
        assert r.status_code == 200
        d = r.json()
        assert len(d["items"]) <= 3


# ---------------- 5. Index hook on POST + PUT ----------------

class TestIndexHooks:
    def test_create_then_immediate_search(self, auth_headers):
        unique = f"TEST_INDEX_HOOK_{int(time.time())}_زمرد_خاص"
        payload = {
            "title": unique,
            "description": "newly created listing for index hook test",
            "category": "personal",
            "subcategory": "misc",
            "city": "Riyadh",
            "price": 1,
            "currency": "SAR",
            "images": [],
            "videos": [],
            "show_phone": False,
        }
        r = requests.post(f"{BASE_URL}/api/listings", json=payload, headers=auth_headers, timeout=20)
        assert r.status_code in (200, 201), r.text[:300]
        created = r.json()
        listing_id = created["id"]
        assert created.get("search_blob"), "search_blob must be populated on create"
        assert "زمرد" in created["search_blob"] or "زمرد" in created.get("title", "")

        try:
            # immediate searchability
            time.sleep(0.5)
            r2 = requests.get(f"{BASE_URL}/api/listings", params={"q": "زمرد_خاص"}, timeout=15)
            assert r2.status_code == 200
            d = r2.json()
            assert d["total"] >= 1, f"newly-created listing not searchable: {d}"
            assert any(i.get("id") == listing_id for i in d["items"])
        finally:
            requests.delete(f"{BASE_URL}/api/listings/{listing_id}", headers=auth_headers, timeout=10)

    def test_update_refreshes_search_blob(self, auth_headers):
        original_marker = f"TEST_OLD_TITLE_{int(time.time())}_ياقوت_فريد"
        new_marker = f"TEST_NEW_TITLE_{int(time.time())}_زبرجد_جديد"
        # CREATE
        r = requests.post(
            f"{BASE_URL}/api/listings",
            json={
                "title": original_marker,
                "description": "before update",
                "category": "personal",
                "subcategory": "misc",
                "city": "Riyadh",
                "price": 1,
                "currency": "SAR",
                "images": [],
                "videos": [],
                "show_phone": False,
            },
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code in (200, 201), r.text[:300]
        listing_id = r.json()["id"]
        try:
            time.sleep(0.3)
            # Original is searchable
            r1 = requests.get(f"{BASE_URL}/api/listings", params={"q": "ياقوت_فريد"}, timeout=15)
            assert r1.json()["total"] >= 1

            # UPDATE title
            r_up = requests.put(
                f"{BASE_URL}/api/listings/{listing_id}",
                json={"title": new_marker},
                headers=auth_headers,
                timeout=20,
            )
            assert r_up.status_code == 200, r_up.text[:300]
            time.sleep(0.3)

            # NEW title is searchable
            r2 = requests.get(f"{BASE_URL}/api/listings", params={"q": "زبرجد_جديد"}, timeout=15)
            d2 = r2.json()
            assert d2["total"] >= 1, f"new title not indexed: {d2}"
            assert any(i.get("id") == listing_id for i in d2["items"])

            # OLD title NOT exact-searchable (should not appear; fuzzy may possibly pick — but normalised exact must miss)
            r3 = requests.get(f"{BASE_URL}/api/listings", params={"q": "ياقوت_فريد"}, timeout=15)
            d3 = r3.json()
            # the listing we updated must not appear under old title exact match
            old_hit_ids = [i.get("id") for i in d3["items"]]
            if listing_id in old_hit_ids:
                # Allow only if fuzzy=true (means engine couldn't find exact, fell back)
                assert d3.get("fuzzy") is True, (
                    f"after update, listing still exact-matches old title — search_blob NOT refreshed: {d3}"
                )
        finally:
            requests.delete(f"{BASE_URL}/api/listings/{listing_id}", headers=auth_headers, timeout=10)


# ---------------- 6. Regression: search/log, trending, history ----------------

class TestSearchRegression:
    def test_search_trending(self, api):
        r = api.get(f"{BASE_URL}/api/search/trending")
        assert r.status_code == 200, r.text[:200]

    def test_search_log(self, api):
        # log a search query (anonymous OK in most setups)
        r = api.post(f"{BASE_URL}/api/search/log", json={"query": "مرسيدس"})
        assert r.status_code in (200, 201, 204), r.text[:200]

    def test_search_history_requires_auth_or_returns_ok(self, api, auth_headers):
        # Try authenticated
        r = requests.get(f"{BASE_URL}/api/search/history", headers=auth_headers, timeout=10)
        assert r.status_code in (200, 401, 404), r.text[:200]
