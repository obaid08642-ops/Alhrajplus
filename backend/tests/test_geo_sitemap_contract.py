import asyncio
from pathlib import Path

import server


class Cursor:
    def __init__(self, rows):
        self.rows = rows
        self.offset = 0
        self.take = None

    def sort(self, *args, **kwargs):
        return self

    def skip(self, amount):
        self.offset = amount
        return self

    def limit(self, amount):
        self.take = amount
        return self

    async def to_list(self, length=None):
        take = self.take if self.take is not None else length
        return self.rows[self.offset : self.offset + take]


class Listings:
    def __init__(self, rows, count):
        self.rows = rows
        self.count = count

    async def count_documents(self, query):
        return self.count

    def find(self, query, projection):
        return Cursor(self.rows)

    async def distinct(self, field, query):
        assert field == "category"
        return ["cars"] if self.count else []


class DB:
    def __init__(self, rows, count):
        self.listings = Listings(rows, count)


def _listing(identifier="l1", slug="public-listing"):
    return {
        "id": identifier,
        "slug": slug,
        "status": "active",
        "moderation": "approved",
        "title": "إعلان عام حقيقي",
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-08-23T00:00:00+00:00",
        "images": [],
        "seo_localizations": {},
    }


def test_sitemap_index_paginates_all_public_listing_inventory():
    previous = server.db
    server.db = DB([_listing()], server._SITEMAP_LISTING_PAGE_SIZE + 1)
    try:
        xml = asyncio.run(server._build_sitemap_index_xml())
        assert "<sitemapindex" in xml
        assert "/sitemaps/static.xml" in xml
        assert "/sitemaps/listings/1.xml" in xml
        assert "/sitemaps/listings/2.xml" in xml
        assert "created_at" not in xml
    finally:
        server.db = previous


def test_listing_sitemap_uses_canonical_slug_and_does_not_filter_by_listing_age():
    previous = server.db
    server.db = DB([_listing()], 1)
    try:
        xml = asyncio.run(server._build_listing_sitemap_xml(1))
        assert "<urlset" in xml
        assert "https://www.alhraj.online/listing/public-listing" in xml
        assert "2026-08-23" in xml
    finally:
        server.db = previous


def test_static_sitemap_and_category_document_only_use_public_inventory():
    previous = server.db
    server.db = DB([_listing()], 1)
    try:
        sitemap = asyncio.run(server._build_static_sitemap_xml())
        html = server._category_seo_html({"key": "cars", "name_ar": "السيارات"}, 1, [_listing()])
        assert "https://www.alhraj.online/category/cars" in sitemap
        assert '"@type": "CollectionPage"' in html
        assert "https://www.alhraj.online/listing/public-listing" in html
        assert "عدد الإعلانات المتاحة حاليًا: 1" in html
    finally:
        server.db = previous


def test_vercel_proxies_sitemap_index_children_to_backend():
    config = (Path(__file__).resolve().parents[2] / "vercel.json").read_text(encoding="utf-8")
    assert '"source": "/sitemaps/:path*"' in config
    assert '"destination": "https://alhrajplus.onrender.com/sitemaps/:path*"' in config
    assert '"source": "/category/:path*"' in config


def test_listing_events_use_indexnow_and_not_google_indexing_api_for_marketplace_pages():
    source = (Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8")
    submitter = (Path(__file__).resolve().parents[1] / "seo_submitter.py").read_text(encoding="utf-8")
    assert "_google_idx_updated" not in source
    assert "_google_idx_deleted" not in source
    assert "submit_google" not in submitter
    assert "Indexing API is reserved" in submitter


def test_sitemap_and_robots_routes_support_crawler_head_requests():
    source = (Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8")
    assert '@app.api_route("/sitemap.xml", methods=["GET", "HEAD"]' in source
    assert '@app.api_route("/robots.txt", methods=["GET", "HEAD"]' in source
