"""
Iteration 17 — SEO infrastructure tests
Tests:
  - GET /api/sitemap.xml — XML, urlset namespaces, static pages, listing entries with image:image
  - GET /api/robots.txt — text/plain, AI agent allowlist, Sitemap reference
  - GET /api/seo/listing/{id} — full HTML with title/desc/keywords/OG/Twitter/JSON-LD Product
  - GET /api/seo/listing/{nonexistent} — 404
  - Regression: /api/listings, /api/auth/me, /api/ads, /api/listings/{id}/similar, /api/admin/seo
"""
import os
import re
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://platform-inspect.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def sample_listing_id(session):
    r = session.get(f"{BASE_URL}/api/listings?limit=5", timeout=15)
    assert r.status_code == 200
    items = r.json()
    if isinstance(items, dict):
        items = items.get("items") or items.get("listings") or []
    if not items:
        pytest.skip("No listings available for SEO test")
    return items[0]["id"]


# ---- Sitemap ----
class TestSitemap:
    def test_sitemap_content_type_and_xml(self, session):
        r = session.get(f"{BASE_URL}/api/sitemap.xml", timeout=20)
        assert r.status_code == 200, r.text[:400]
        ct = r.headers.get("content-type", "")
        assert "xml" in ct.lower(), f"Unexpected content-type: {ct}"
        body = r.text
        assert body.startswith("<?xml"), "Missing XML declaration"
        assert "<urlset" in body and "</urlset>" in body
        assert 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' in body
        assert 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' in body

    def test_sitemap_static_pages(self, session):
        r = session.get(f"{BASE_URL}/api/sitemap.xml", timeout=20)
        body = r.text
        # All key static pages must appear
        for path in ["/auctions", "/deals", "/flights", "/reels", "/about", "/terms"]:
            assert path in body, f"Sitemap missing static page {path}"
        # Home (/loc> ending right after site root)
        assert re.search(r"<loc>https?://[^<]+</loc>", body), "No <loc> entries"
        # changefreq + priority present
        assert "<changefreq>" in body
        assert "<priority>" in body

    def test_sitemap_listing_entries(self, session, sample_listing_id):
        r = session.get(f"{BASE_URL}/api/sitemap.xml", timeout=20)
        body = r.text
        assert f"/listing/{sample_listing_id}" in body, "Sample listing not in sitemap"
        # at least one image:image entry expected (some listings have images)
        # not every listing has images so just verify schema is parseable when present
        if "<image:image>" in body:
            assert "<image:loc>" in body and "</image:image>" in body


# ---- Robots ----
class TestRobots:
    def test_robots_content_type_and_rules(self, session):
        r = session.get(f"{BASE_URL}/api/robots.txt", timeout=15)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "text/plain" in ct.lower(), f"Unexpected content-type: {ct}"
        body = r.text
        assert "User-agent: *" in body
        assert "Disallow: /admin" in body
        assert "Disallow: /api/" in body

    def test_robots_ai_bots_allowed(self, session):
        body = session.get(f"{BASE_URL}/api/robots.txt", timeout=15).text
        for bot in ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "anthropic-ai"]:
            assert bot in body, f"AI bot rule missing: {bot}"

    def test_robots_sitemap_reference(self, session):
        body = session.get(f"{BASE_URL}/api/robots.txt", timeout=15).text
        assert re.search(r"Sitemap:\s*https?://\S+/sitemap\.xml", body), "Sitemap reference missing"


# ---- SEO listing HTML ----
class TestSeoListing:
    def test_seo_listing_html_structure(self, session, sample_listing_id):
        r = session.get(f"{BASE_URL}/api/seo/listing/{sample_listing_id}", timeout=20)
        assert r.status_code == 200, r.text[:400]
        ct = r.headers.get("content-type", "")
        assert "text/html" in ct.lower()
        html = r.text
        assert "<title>" in html and "الحراج بلس" in html
        assert 'name="description"' in html
        assert 'name="keywords"' in html
        # OG
        assert 'property="og:type" content="product"' in html
        assert 'property="og:image"' in html
        assert 'property="og:url"' in html
        # Twitter
        assert 'name="twitter:card"' in html
        # JSON-LD Product
        m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
        assert m, "No JSON-LD script found"
        data = json.loads(m.group(1))
        assert data.get("@type") == "Product"
        assert "name" in data and data["name"]
        assert "offers" in data
        offers = data["offers"]
        assert offers.get("@type") == "Offer"
        assert "priceCurrency" in offers
        assert "seller" in offers
        assert "areaServed" in offers

    def test_seo_listing_404_for_unknown(self, session):
        r = session.get(f"{BASE_URL}/api/seo/listing/this-id-does-not-exist-zzz", timeout=15)
        assert r.status_code == 404
        assert "not found" in r.text.lower() or "Listing not found" in r.text


# ---- Regression ----
class TestRegression:
    def test_listings_endpoint(self, session):
        r = session.get(f"{BASE_URL}/api/listings?limit=5", timeout=15)
        assert r.status_code == 200

    def test_auth_me(self, session, admin_token):
        r = session.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("email") == ADMIN_EMAIL

    def test_ads(self, session):
        r = session.get(f"{BASE_URL}/api/ads?placement=home_top", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_similar(self, session, sample_listing_id):
        r = session.get(f"{BASE_URL}/api/listings/{sample_listing_id}/similar", timeout=15)
        assert r.status_code == 200

    def test_admin_seo(self, session, admin_token):
        r = session.get(f"{BASE_URL}/api/admin/seo", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200
