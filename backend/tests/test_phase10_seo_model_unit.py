import asyncio
import server


class FakeCursor:
    def __init__(self, value):
        self.value = value

    async def to_list(self, length=None):
        return self.value


class FakeListings:
    async def find_one(self, *args, **kwargs):
        return {
            "id": "listing-1",
            "slug": "safe-listing-1",
            "status": "active",
            "title": 'عنوان "><script>alert(1)</script>',
            "description": 'وصف & "اختبار"',
            "price": 100,
            "currency": "ر.س",
            "currency_code": "SAR",
            "category": "cars",
            "city": "الرياض",
            "images": ["https://cdn.example/image.jpg?a=1&b=2"],
            "seller": {"name": "بائع"},
        }


class FakeDB:
    listings = FakeListings()


def test_model_validation_accepts_glb_gltf_and_cloudinary_raw():
    server._validate_model_3d({"model_3d_url": "https://cdn.example/item.glb"})
    server._validate_model_3d({"model_3d_url": "https://res.cloudinary.com/x/raw/upload/v1/listings/item"})
    server._validate_model_3d({})


def test_model_validation_rejects_unknown_extension():
    try:
        server._validate_model_3d({"model_3d_url": "https://cdn.example/item.obj"})
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400
    else:
        raise AssertionError("unknown 3D extension was accepted")


def test_seo_html_escapes_attributes_and_uses_slug():
    previous = server.db
    server.db = FakeDB()
    try:
        from starlette.requests import Request
        request = Request({"type": "http", "method": "GET", "path": "/api/seo/listing/listing-1", "query_string": b"", "headers": []})
        response = asyncio.run(server.seo_listing_html("listing-1", request))
        body = response.body.decode("utf-8")
        assert 'canonical" href="https://alhraj.online/listing/safe-listing-1"' in body
        assert "<script>alert(1)</script>" not in body
        assert "&lt;script&gt;alert(1)&lt;/script&gt;" in body
        assert "https://cdn.example/image.jpg?a=1&amp;b=2" in body
    finally:
        server.db = previous


def test_listing_seo_schema_does_not_invent_price_or_brand():
    listing = {
        "id": "contact-price",
        "slug": "contact-price",
        "status": "active",
        "title": "إعلان بسعر عند التواصل",
        "description": "تفاصيل الإعلان الظاهرة للمستخدم",
        "category": "services",
        "city": "جدة",
        "images": [],
    }
    schema = server._listing_seo_schema(
        listing,
        "https://alhraj.online",
        "https://alhraj.online/listing/contact-price",
    )
    assert "offers" not in schema
    assert "brand" not in schema
    assert schema["url"] == "https://alhraj.online/listing/contact-price"


def test_primary_listing_page_serves_listing_document_to_search_bot():
    previous = server.db
    server.db = FakeDB()
    try:
        from starlette.requests import Request
        request = Request({
            "type": "http",
            "method": "GET",
            "path": "/listing/safe-listing-1",
            "query_string": b"",
            "headers": [(b"user-agent", b"OAI-SearchBot/1.0")],
        })
        response = asyncio.run(server.primary_listing_page("safe-listing-1", request))
        body = response.body.decode("utf-8")
        assert response.status_code == 200
        assert 'rel="canonical" href="https://alhraj.online/listing/safe-listing-1"' in body
        assert 'application/ld+json' in body
        assert '"price": 100.0' in body
        assert response.headers["vary"] == "User-Agent, Accept"
    finally:
        server.db = previous


def test_bot_matcher_covers_chatgpt_search_and_social_previews():
    assert server.BOT_UAS.search("OAI-SearchBot/1.0")
    assert server.BOT_UAS.search("facebookexternalhit/1.1")
    assert not server.BOT_UAS.search("Mozilla/5.0 (regular browser)")


def test_car_schema_uses_verified_custom_fields_and_correct_condition():
    listing = {
        "id": "car-1",
        "slug": "toyota-camry-2024",
        "status": "active",
        "title": "تويوتا كامري 2024",
        "description": "سيارة نظيفة بمواصفات معلنة",
        "price": 95000,
        "currency_code": "SAR",
        "category": "cars",
        "city": "الرياض",
        "seller": {"name": "معرض موثوق"},
        "custom_fields": {
            "make": "تويوتا",
            "model": "كامري",
            "year": 2024,
            "kilometers": 22000,
            "fuel_type": "بنزين",
            "condition": "جديد",
            "vin": "ABC123456789",
            "seller_type": "معرض",
        },
    }
    schema = server._listing_seo_schema(listing, "https://alhraj.online", "https://alhraj.online/listing/toyota-camry-2024")
    assert schema["@type"] == ["Product", "Car"]
    assert schema["brand"]["name"] == "تويوتا"
    assert schema["vehicleIdentificationNumber"] == "ABC123456789"
    values = {item["name"]: item["value"] for item in schema["additionalProperty"]}
    assert values["model"] == "كامري"
    assert values["kilometers"] == "22000"
    assert schema["offers"]["itemCondition"].endswith("NewCondition")
    assert schema["offers"]["seller"]["@type"] == "Organization"


def test_listing_indexability_matches_public_visibility_policy():
    base = {"id": "l1", "slug": "listing-1", "status": "active", "moderation": "approved", "title": "إعلان حقيقي"}
    assert server._listing_is_indexable(base)
    assert not server._listing_is_indexable({**base, "moderation": "pending"})
    assert not server._listing_is_indexable({**base, "status": "sold"})
    assert not server._listing_is_indexable({**base, "is_demo": True})
    assert not server._listing_is_indexable({**base, "title": "TEST_INDEX data"})
    assert server._listing_is_indexable({**base, "title": "Testament for sale"})


def test_discovery_refresh_uses_canonical_slug_and_deindexes_hidden_listing(monkeypatch):
    previous_cache = dict(server._SITEMAP_CACHE)
    submitted, updated, deleted = [], [], []
    monkeypatch.setattr(server, "_seo_submit_bg", lambda db, urls, host: submitted.extend(urls))
    monkeypatch.setattr(server, "_google_idx_updated", lambda url: updated.append(url))
    monkeypatch.setattr(server, "_google_idx_deleted", lambda url: deleted.append(url))
    try:
        visible = {"id": "l1", "slug": "visible-listing", "status": "active", "moderation": "approved", "title": "إعلان حقيقي"}
        server._SITEMAP_CACHE.update({"xml": "stale", "ts": 123.0})
        server._refresh_listing_discovery(visible)
        assert submitted == ["https://alhraj.online/listing/visible-listing"]
        assert updated == ["https://alhraj.online/listing/visible-listing"]
        assert server._SITEMAP_CACHE["xml"] is None
        server._refresh_listing_discovery({**visible, "status": "sold"}, removed=True)
        assert deleted == ["https://alhraj.online/listing/visible-listing"]
    finally:
        server._SITEMAP_CACHE.update(previous_cache)


def test_default_robots_allows_answer_engines_and_blocks_sensitive_routes():
    class Settings:
        async def find_one(self, *args, **kwargs):
            return None

    class RobotsDB:
        settings = Settings()

    previous = server.db
    server.db = RobotsDB()
    try:
        robots = asyncio.run(server._build_robots_txt())
        assert "User-agent: OAI-SearchBot\nAllow: /" in robots
        assert "User-agent: Claude-SearchBot\nAllow: /" in robots
        assert "User-agent: PerplexityBot\nAllow: /" in robots
        assert "Disallow: /admin" in robots
        assert "Disallow: /api/" in robots
    finally:
        server.db = previous


def test_localized_listing_html_uses_only_fresh_translation_and_language_canonical():
    listing = {
        "id": "l-en",
        "slug": "arabic-listing",
        "status": "active",
        "title": "إعلان عربي",
        "description": "وصف عربي صحيح",
        "price": 10,
        "currency": "ر.س",
        "currency_code": "SAR",
        "category": "electronics",
        "city": "الرياض",
        "images": [],
    }
    source_hash = server._listing_source_fingerprint(listing)
    listing["seo_localizations"] = {
        "en": {
            "title": "English listing",
            "description": "Accurate English description",
            "source_hash": source_hash,
        }
    }
    body = server._listing_seo_html(listing, language="en")
    assert '<html lang="en" dir="ltr">' in body
    assert 'canonical" href="https://alhraj.online/listing/arabic-listing?lang=en"' in body
    assert 'hreflang="en"' in body
    assert 'hreflang="ur"' not in body
    assert '"inLanguage": "en"' in body
    listing["title"] = "تغيير المصدر"
    assert server._listing_seo_localization(listing, "en") is None
    fallback = server._listing_seo_html(listing, language="en")
    assert '<html lang="ar" dir="rtl">' in fallback


def test_discovery_profile_uses_listing_facts_without_inventing_keywords():
    listing = {
        "title": "تويوتا كامري 2024 نظيفة",
        "description": "سيارة بحالة ممتازة في الرياض مع صور حقيقية وسعر واضح.",
        "category": "cars",
        "city": "الرياض",
        "price": 95000,
        "images": ["https://cdn.example/car.jpg"],
        "custom_fields": {"make": "تويوتا", "model": "كامري", "year": 2024},
    }
    profile = server._listing_discovery_profile(listing)
    assert profile["quality_score"] == 100
    assert {fact["label"] for fact in profile["facts"]} >= {"category", "city", "price", "make", "model", "year"}
    assert "تويوتا" in profile["keywords"]
    assert "الأفضل" not in profile["keywords"]
    assert profile["missing"] == []


def test_discovery_feed_is_read_only_and_strips_private_listing_data():
    class Cursor:
        def __init__(self, rows):
            self.rows = rows
        def sort(self, *args, **kwargs):
            return self
        def limit(self, *args, **kwargs):
            return self
        async def to_list(self, length=None):
            return self.rows

    class Listings:
        last_query = None
        def find(self, query, projection):
            self.last_query = query
            return Cursor([{
                "id": "feed-1", "slug": "public-listing", "title": "إعلان عام",
                "description": "تفاصيل عامة كافية", "price": 12, "currency": "ر.س",
                "currency_code": "SAR", "category": "cars", "city": "الرياض",
                "country_code": "SA", "images": [], "custom_fields": {"make": "تويوتا"},
                "created_at": "2026-08-18T00:00:00+00:00", "updated_at": "2026-08-18T00:00:00+00:00",
                "contact_phone": "+966500000000", "seller": {"name": "private"},
            }])

    class FeedDB:
        listings = Listings()

    previous = server.db
    server.db = FeedDB()
    try:
        response = asyncio.run(server.discovery_listings(country_code="SA", category="cars", city=None, q="تويوتا", lang="ar", limit=20, cursor=None))
        payload = __import__("json").loads(response.body)
        assert payload["read_only"] is True
        assert payload["items"][0]["url"] == "https://alhraj.online/listing/public-listing"
        assert payload["items"][0]["availability"] == "active"
        assert "contact_phone" not in payload["items"][0]
        assert "seller" not in payload["items"][0]
        assert response.headers["x-agent-read-only"] == "true"
        assert any(clause.get("country_code") == "SA" for clause in FeedDB.listings.last_query["$and"] if isinstance(clause, dict))
    finally:
        server.db = previous


def test_listing_html_emits_product_webpage_and_visible_breadcrumb_schema():
    listing = {
        "id": "schema-1",
        "slug": "schema-car",
        "status": "active",
        "title": "سيارة معلنة",
        "description": "وصف حقيقي ظاهر للمستخدم",
        "price": 50000,
        "currency_code": "SAR",
        "category": "cars",
        "city": "الرياض",
    }
    body = server._listing_seo_html(listing)
    assert '"@id": "https://alhraj.online/listing/schema-car#product"' in body
    assert '"mainEntityOfPage": {"@type": "WebPage", "@id": "https://alhraj.online/listing/schema-car"}' in body
    assert '"@type": "BreadcrumbList"' in body
    assert 'href="https://alhraj.online/category/cars"' in body
    assert '<nav aria-label="Breadcrumb">' in body


def test_platform_monitoring_checks_api_indexing_and_schema_without_external_network(monkeypatch):
    class Response:
        def __init__(self, url):
            self.status_code = 200
            if url.endswith("/robots.txt"):
                self.text = "User-agent: *\nSitemap: https://alhraj.online/sitemap.xml"
            elif url.endswith("/sitemap.xml"):
                self.text = "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>"
            elif "/listing/" in url:
                self.text = '<script type="application/ld+json">[{"@type":"BreadcrumbList"}]</script>'
            else:
                self.text = '{"status":"ok"}'

    class Client:
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            return False
        async def get(self, url, **kwargs):
            return Response(url)

    class Listings:
        async def find_one(self, *args, **kwargs):
            return {"id": "monitor-1", "slug": "monitor-sample"}

    class DB:
        listings = Listings()
        async def command(self, command):
            assert command == "ping"
            return {"ok": 1}

    previous = server.db
    server.db = DB()
    monkeypatch.setattr(server.httpx, "AsyncClient", lambda **kwargs: Client())
    monkeypatch.setattr(server, "_redis_status", lambda: "on")
    try:
        result = asyncio.run(server._run_platform_monitoring())
        assert result["status"] == "healthy"
        assert {check["name"] for check in result["checks"]} == {"mongo", "redis", "api_health", "robots", "sitemap", "listing_schema"}
        assert all(check["ok"] for check in result["checks"])
    finally:
        server.db = previous
