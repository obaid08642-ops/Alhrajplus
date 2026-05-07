"""
Iter-16 backend tests:
1. Trip.com banner ads = ad_type='image' with image_url containing customer-assets.emergentagent.com
2. PUT /api/auth/me phone validation per country (admin SA → prefix 5, length 9)
3. POST /api/admin/digest/test (admin auth) returns sent boolean
4. POST /api/cron/daily-digest with bad secret → 403
5. CORS: OPTIONS request from origin alhraj.online should be allowed
6. GET /api/listings/{id}/similar — text-similarity ordering (token overlap)
"""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ============================================================
# 1. Trip.com banner ads → ad_type='image'
# ============================================================
class TestTripAds:
    @pytest.mark.parametrize("placement", ["home_middle", "listing_top", "listing_bottom"])
    def test_trip_ad_image_for_placement(self, placement):
        r = requests.get(f"{BASE_URL}/api/ads", params={"placement": placement})
        assert r.status_code == 200, r.text
        ads = r.json()
        assert isinstance(ads, list)
        assert len(ads) >= 1, f"No ad returned for placement={placement}"
        # Find a Trip.com ad
        trip_ads = [a for a in ads if "trip.com" in (a.get("link_url") or "").lower()]
        assert trip_ads, f"No Trip.com ad for {placement}. Ads: {ads}"
        ad = trip_ads[0]
        assert ad.get("ad_type") == "image", f"{placement} ad_type should be 'image' got {ad.get('ad_type')}"
        img = (ad.get("image_url") or "")
        assert "customer-assets.emergentagent.com" in img, f"{placement} image_url should contain emergent assets, got {img}"
        # AdSlot.js only renders iframe when ad_type=='iframe', so leftover iframe_url field is harmless


# ============================================================
# 2. PUT /api/auth/me phone validation
# ============================================================
class TestPhoneEditor:
    def test_update_phone_valid_sa(self, admin_session):
        # Admin country_code = SA → prefix '5', length 9
        r = admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "512345678"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("phone") == "512345678"
        assert data.get("phone_full") == "+966512345678", f"phone_full={data.get('phone_full')}"

    def test_update_phone_invalid_too_short(self, admin_session):
        r = admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "99"})
        assert r.status_code == 400, f"expected 400 got {r.status_code} {r.text}"
        body = r.json()
        detail = body.get("detail") or body.get("message") or ""
        assert "غير صحيح" in detail or "Invalid" in detail or "phone" in detail.lower()

    def test_update_phone_invalid_prefix(self, admin_session):
        # prefix '9' is wrong for SA (must start with 5)
        r = admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "912345678"})
        assert r.status_code == 400, r.text

    def test_restore_admin_phone(self, admin_session):
        # restore default to not break other tests
        admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "500000000"})


# ============================================================
# 3. Admin digest test
# ============================================================
class TestDigest:
    def test_admin_digest_test_endpoint(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/admin/digest/test")
        # may return sent=True or sent=False (RESEND_API_KEY not configured) — both OK as long as 200
        assert r.status_code == 200, r.text
        data = r.json()
        assert "sent" in data
        assert isinstance(data["sent"], bool)

    def test_admin_digest_test_unauthenticated(self):
        r = requests.post(f"{BASE_URL}/api/admin/digest/test")
        assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"


# ============================================================
# 4. Cron daily-digest secret protection
# ============================================================
class TestCronDigest:
    def test_cron_invalid_secret(self):
        r = requests.post(f"{BASE_URL}/api/cron/daily-digest", headers={"X-Cron-Secret": "invalid"})
        assert r.status_code == 403, f"expected 403 got {r.status_code} {r.text}"

    def test_cron_no_header(self):
        r = requests.post(f"{BASE_URL}/api/cron/daily-digest")
        assert r.status_code == 403


# ============================================================
# 5. CORS — alhraj.online origin must be allowed
# ============================================================
class TestCORS:
    def test_options_alhraj_origin(self):
        r = requests.options(
            f"{BASE_URL}/api/auth/me",
            headers={
                "Origin": "https://alhraj.online",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert r.status_code in (200, 204), f"OPTIONS status={r.status_code}"
        allow_origin = r.headers.get("access-control-allow-origin", "")
        assert allow_origin in ("https://alhraj.online", "*"), f"CORS origin: {allow_origin}"

    def test_options_www_alhraj_origin(self):
        r = requests.options(
            f"{BASE_URL}/api/auth/me",
            headers={
                "Origin": "https://www.alhraj.online",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert r.status_code in (200, 204)
        allow_origin = r.headers.get("access-control-allow-origin", "")
        assert allow_origin in ("https://www.alhraj.online", "*"), f"CORS origin: {allow_origin}"


# ============================================================
# 6. Similar listings algorithm — text similarity
# ============================================================
class TestSimilarListings:
    @pytest.fixture(scope="class")
    def seeded_listings(self, admin_session):
        """Create 4 listings: exact, partial, category-only, unrelated."""
        ids = []
        listings_to_create = [
            {"title": "TEST_iPhone 15 Pro Max 256GB Titanium", "category": "electronics", "subcategory": "phones",
             "price": 4500, "currency": "SAR", "city": "الرياض", "country_code": "SA",
             "description": "iPhone 15 Pro Max excellent condition"},
            {"title": "TEST_iPhone 15 Pro Max New Sealed", "category": "electronics", "subcategory": "phones",
             "price": 4800, "currency": "SAR", "city": "الرياض", "country_code": "SA",
             "description": "iPhone Pro Max"},  # exact phrase match
            {"title": "TEST_iPhone 15 Pro 128GB", "category": "electronics", "subcategory": "phones",
             "price": 3500, "currency": "SAR", "city": "جدة", "country_code": "SA",
             "description": "iPhone Pro"},  # partial overlap
            {"title": "TEST_Samsung Galaxy S24", "category": "electronics", "subcategory": "phones",
             "price": 3000, "currency": "SAR", "city": "الرياض", "country_code": "SA",
             "description": "Samsung phone"},  # category-only match
        ]
        for body in listings_to_create:
            r = admin_session.post(f"{BASE_URL}/api/listings", json=body)
            assert r.status_code in (200, 201), r.text
            data = r.json()
            ids.append(data.get("id"))
        # Approve listings so status='active'
        for lid in ids:
            admin_session.post(f"{BASE_URL}/api/admin/listings/{lid}/approve")
        yield ids
        # cleanup
        for lid in ids:
            try:
                admin_session.delete(f"{BASE_URL}/api/listings/{lid}")
            except Exception:
                pass

    def test_similar_ranks_text_match_above_category(self, admin_session, seeded_listings):
        base_id = seeded_listings[0]  # iPhone 15 Pro Max 256GB Titanium
        r = requests.get(f"{BASE_URL}/api/listings/{base_id}/similar", params={"limit": 8})
        assert r.status_code == 200, r.text
        results = r.json()
        assert isinstance(results, list)
        # Filter to TEST_ ones for deterministic check
        test_results = [x for x in results if (x.get("title") or "").startswith("TEST_")]
        assert len(test_results) >= 2, f"Expected at least 2 TEST_ results, got {len(test_results)}: titles={[x.get('title') for x in test_results]}"
        # First should be one of the iPhone Pro Max ones, NOT Samsung
        first_title = test_results[0].get("title", "")
        assert "iPhone" in first_title, f"first result should be iPhone match, got: {first_title}"
        # Find Samsung (category-only) — should be ranked LAST among TEST_
        samsung_idx = next((i for i, x in enumerate(test_results) if "Samsung" in x.get("title", "")), -1)
        iphone_indices = [i for i, x in enumerate(test_results) if "iPhone" in x.get("title", "")]
        if samsung_idx >= 0 and iphone_indices:
            assert samsung_idx > max(iphone_indices), \
                f"Samsung (category-only) should rank LAST after iPhones. Order: {[x.get('title') for x in test_results]}"
