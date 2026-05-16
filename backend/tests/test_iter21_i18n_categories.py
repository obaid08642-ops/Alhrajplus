"""
Iteration 21 — Tests for multilingual /api/meta/categories (?lang=) and /api/auth/providers.
Also regression checks for core endpoints.
"""
import os
import uuid
import time
import http.cookiejar as cookiejar
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASS = "Admin@HarajPlus2026"


def _bearer_session():
    s = requests.Session()
    # Disable cookie jar — backend supports both cookie + Bearer; we want Bearer-only
    s.cookies.set_policy(cookiejar.DefaultCookiePolicy(allowed_domains=[]))
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token():
    s = _bearer_session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok, f"missing token in {r.json()}"
    return tok


@pytest.fixture(scope="session")
def admin_client(admin_token):
    s = _bearer_session()
    s.headers.update({"Authorization": f"Bearer {admin_token}"})
    return s


# ===================== /api/meta/categories =====================
class TestMetaCategoriesI18n:
    def test_ar_default(self):
        r = requests.get(f"{API}/meta/categories", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        cars = next((c for c in data if c.get("key") == "cars"), None)
        assert cars, "cars category missing"
        # Arabic default — name should be Arabic, name_ar must always exist
        assert cars.get("name_ar") == "السيارات"
        assert cars.get("name") == "السيارات"

    def test_en_translation(self):
        r = requests.get(f"{API}/meta/categories", params={"lang": "en"}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        cars = next((c for c in data if c.get("key") == "cars"), None)
        assert cars, "cars missing"
        assert cars["name"] == "Cars", f"expected 'Cars' got {cars['name']}"
        # name_ar preserved
        assert cars.get("name_ar") == "السيارات"
        # subcategory check — find 'used'
        subs = cars.get("subcategories") or cars.get("subs") or []
        used = next((s for s in subs if s.get("key") == "cars_used"), None)
        assert used, f"used subcategory missing in {[s.get('key') for s in subs]}"
        assert used.get("name") == "Used Cars", f"got {used.get('name')}"
        # Find condition field
        fields = cars.get("fields", [])
        cond = next((f for f in fields if f.get("key") == "condition"), None)
        assert cond, f"condition field missing — fields={[f.get('key') for f in fields]}"
        # label translated
        assert cond.get("label") in ("Condition",), f"label={cond.get('label')}"
        # options translated
        opts = cond.get("options", [])
        # Expected subset
        for needed in ["New", "Excellent", "Very Good", "Good", "Needs Repair"]:
            assert needed in opts, f"expected option {needed!r} missing in {opts}"
        # options_ar preserved as canonical Arabic
        opts_ar = cond.get("options_ar", [])
        assert opts_ar, "options_ar missing"
        for needed_ar in ["جديد", "ممتاز", "جيد جداً", "جيد", "يحتاج صيانة"]:
            assert needed_ar in opts_ar, f"canonical Arabic option {needed_ar!r} missing in {opts_ar}"
        # Both arrays must have the same length and index alignment
        assert len(opts) == len(opts_ar), f"options/options_ar length mismatch {len(opts)} vs {len(opts_ar)}"

    @pytest.mark.parametrize("lang,expected_label,expected_first_opt", [
        ("ur", "حالت", "نیا"),
        ("hi", "स्थिति", "नया"),
        ("bn", "অবস্থা", "নতুন"),
        ("fr", "État", "Neuf"),
    ])
    def test_other_langs(self, lang, expected_label, expected_first_opt):
        r = requests.get(f"{API}/meta/categories", params={"lang": lang}, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        cars = next((c for c in data if c.get("key") == "cars"), None)
        assert cars, "cars missing"
        fields = cars.get("fields", [])
        cond = next((f for f in fields if f.get("key") == "condition"), None)
        assert cond, "condition field missing"
        assert cond.get("label") == expected_label, f"[{lang}] label expected {expected_label!r} got {cond.get('label')!r}"
        opts = cond.get("options", [])
        assert expected_first_opt in opts, f"[{lang}] expected option {expected_first_opt!r} missing in {opts}"
        # canonical Arabic preserved
        opts_ar = cond.get("options_ar", [])
        assert "جديد" in opts_ar and "ممتاز" in opts_ar, f"[{lang}] canonical AR missing: {opts_ar}"

    def test_invalid_lang_fallback_to_ar(self):
        r = requests.get(f"{API}/meta/categories", params={"lang": "xyz"}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        cars = next((c for c in data if c.get("key") == "cars"), None)
        assert cars["name"] == "السيارات", f"expected Arabic fallback, got {cars['name']}"


# ===================== /api/auth/providers =====================
class TestAuthProviders:
    def test_providers_shape(self):
        r = requests.get(f"{API}/auth/providers", timeout=10)
        assert r.status_code == 200
        data = r.json()
        for k in ("google", "apple", "x", "snapchat"):
            assert k in data, f"missing key {k} in {data}"
            assert isinstance(data[k], bool), f"{k} must be bool got {type(data[k])}"
        # Per current env: apple should be False
        assert data["apple"] is False, f"apple expected False got {data['apple']}"
        # Per memory/test_credentials.md, google/x/snapchat are configured
        assert data["google"] is True, f"google expected True got {data['google']} (env GOOGLE_CLIENT_ID missing?)"
        assert data["x"] is True, f"x expected True got {data['x']}"
        assert data["snapchat"] is True, f"snapchat expected True got {data['snapchat']}"


# ===================== POST /api/listings with canonical AR =====================
class TestListingCanonicalArabic:
    def test_post_listing_with_canonical_arabic_condition(self, admin_client):
        # Build a minimal cars listing using canonical Arabic option value
        payload = {
            "title": f"TEST_ListingI18n_{uuid.uuid4().hex[:6]}",
            "description": "Test listing for i18n canonical Arabic submission",
            "category": "cars",
            "subcategory": "cars_used",
            "country_code": "SA",
            "city": "Riyadh",
            "price": 50000,
            "currency": "SAR",
            "images": [],
            "custom_fields": {
                "condition": "ممتاز",  # canonical AR (frontend should always submit this)
                "transmission": "أوتوماتيك",
                "fuel": "بنزين",
            },
        }
        r = admin_client.post(f"{API}/listings", json=payload, timeout=20)
        # Accept 200/201 — different code paths
        assert r.status_code in (200, 201), f"create failed {r.status_code} {r.text[:400]}"
        body = r.json()
        listing_id = body.get("id") or body.get("_id") or (body.get("listing") or {}).get("id")
        assert listing_id, f"no id returned {body}"

        # Verify via GET
        g = requests.get(f"{API}/listings/{listing_id}", timeout=10)
        assert g.status_code == 200, g.text
        gb = g.json()
        cf = gb.get("custom_fields") or {}
        assert cf.get("condition") == "ممتاز", f"condition not persisted as canonical AR: {cf}"


# ===================== Regression =====================
class TestRegression:
    def test_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body.get("access_token") or body.get("token")

    def test_listings_get(self):
        r = requests.get(f"{API}/listings", timeout=10)
        assert r.status_code == 200
        data = r.json()
        # Either paged or list shape
        assert isinstance(data, (list, dict))
        if isinstance(data, dict):
            assert "items" in data

    def test_chat_conversations(self, admin_client):
        r = admin_client.get(f"{API}/chat/conversations", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_notifications(self, admin_client):
        r = admin_client.get(f"{API}/notifications", timeout=10)
        assert r.status_code == 200
        # could be list or dict — accept both
        b = r.json()
        assert isinstance(b, (list, dict))

    def test_vapid_public_key(self):
        r = requests.get(f"{API}/push/web/vapid-public-key", timeout=10)
        assert r.status_code == 200
        b = r.json()
        # accept snake_case or camelCase
        key = b.get("public_key") or b.get("publicKey")
        assert key, f"no key in {b}"
