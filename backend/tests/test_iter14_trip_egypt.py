"""Iteration 14 backend tests:
- Trip.com iframe ads (admin POST + public GET)
- Egypt country added with EG phone validation
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://platform-inspect.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASS = "Admin@HarajPlus2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Countries / Egypt ----------
class TestCountries:
    def test_meta_countries_includes_egypt(self):
        r = requests.get(f"{BASE_URL}/api/meta/countries", timeout=15)
        assert r.status_code == 200
        countries = r.json()
        assert isinstance(countries, list)
        codes = [c.get("code") for c in countries]
        assert "EG" in codes, f"Egypt not found. Codes: {codes}"
        assert len(countries) >= 7, f"Expected >=7 countries, got {len(countries)}"
        eg = next(c for c in countries if c["code"] == "EG")
        assert eg.get("name_ar") == "مصر"
        assert eg.get("phone_code") == "+20"
        assert eg.get("currency_code") == "EGP"
        cities = eg.get("cities", [])
        assert len(cities) == 23, f"Expected 23 cities, got {len(cities)}"
        # at least one city has districts
        assert any(c.get("districts") for c in cities), "No cities have districts"


# ---------- EG phone validation via /auth/register ----------
class TestEGRegistration:
    def _payload(self, phone, country="EG"):
        unique = uuid.uuid4().hex[:8]
        return {
            "name": f"TEST_eg_{unique}",
            "email": f"TEST_eg_{unique}@example.com",
            "password": "Test@1234",
            "phone": phone,
            "country_code": country,
        }

    def test_register_eg_valid_prefix_10(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("1012345678"), timeout=20)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_register_eg_valid_prefix_15(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("1512345678"), timeout=20)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_register_eg_invalid_prefix_99(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("9912345678"), timeout=20)
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        # Arabic error message
        body = r.text
        assert "رقم" in body or "غير صحيح" in body or "phone" in body.lower()

    def test_register_eg_invalid_length(self):
        # 9 digits w/ valid prefix (10) but length<10
        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("100000000"), timeout=20)
        assert r.status_code == 400


# ---------- Iframe Ads ----------
class TestIframeAds:
    created_ids = []

    def test_create_iframe_ad(self, admin_headers):
        payload = {
            "title": "TEST_TripBanner_iframe",
            "placement": "home_middle",
            "active": True,
            "ad_type": "iframe",
            "iframe_url": "https://www.trip.com/partners/ad/DB16696577?Allianceid=12345",
            "iframe_width": 300,
            "iframe_height": 250,
            "image_url": "",
            "link_url": "",
        }
        r = requests.post(f"{BASE_URL}/api/admin/ads", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"
        data = r.json()
        ad_id = data.get("id") or data.get("_id") or data.get("ad_id")
        assert ad_id, f"No id returned: {data}"
        TestIframeAds.created_ids.append(ad_id)
        # Validate echoed fields
        assert data.get("ad_type") == "iframe"
        assert "trip.com" in (data.get("iframe_url") or "")
        assert data.get("iframe_width") == 300
        assert data.get("iframe_height") == 250

    def test_get_public_ads_returns_iframe_ad(self, admin_headers):
        # Ensure at least one iframe ad exists
        if not TestIframeAds.created_ids:
            self.test_create_iframe_ad(admin_headers)
        time.sleep(0.5)
        r = requests.get(f"{BASE_URL}/api/ads", params={"placement": "home_middle"}, timeout=15)
        assert r.status_code == 200
        ads = r.json()
        assert isinstance(ads, list)
        iframe_ads = [a for a in ads if a.get("ad_type") == "iframe"]
        assert len(iframe_ads) >= 1, f"No iframe ads in list of {len(ads)}: types={[a.get('ad_type') for a in ads]}"
        a = iframe_ads[0]
        assert a.get("iframe_url"), "iframe_url missing"
        assert a.get("iframe_width") in (300, 320) or isinstance(a.get("iframe_width"), int)
        assert a.get("iframe_height") in (250, 480) or isinstance(a.get("iframe_height"), int)

    def test_create_image_ad_default_type(self, admin_headers):
        # Ensure backward-compat: omitting ad_type defaults to "image"
        payload = {
            "title": "TEST_ImageAd_default",
            "placement": "home_top",
            "active": True,
            "image_url": "https://example.com/banner.png",
            "link_url": "https://example.com",
        }
        r = requests.post(f"{BASE_URL}/api/admin/ads", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code in (200, 201), f"Got {r.status_code}: {r.text}"
        data = r.json()
        ad_id = data.get("id") or data.get("_id")
        assert ad_id
        TestIframeAds.created_ids.append(ad_id)
        assert data.get("ad_type", "image") == "image"

    def test_cleanup(self, admin_headers):
        for ad_id in TestIframeAds.created_ids:
            try:
                requests.delete(f"{BASE_URL}/api/admin/ads/{ad_id}", headers=admin_headers, timeout=10)
            except Exception:
                pass
