"""Phase 9 — SEO/AEO/GEO/ASO cross-channel parity contracts."""

from pathlib import Path

import server


ROOT = Path(__file__).resolve().parents[2]


def test_discovery_preview_is_unpersisted_and_fact_bound():
    preview = server.ListingDiscoveryPreviewIn(
        title="سيارة مستعملة نظيفة",
        description="سيارة بحالة جيدة مع صيانة دورية وفحص حديث.",
        category="cars",
        city="الرياض",
        price=25000,
        images=["https://example.test/car.jpg"],
        custom_fields={"make": "Toyota", "model": "Camry", "year": "2020"},
    )
    profile = server._listing_discovery_profile({**preview.model_dump(), "status": "active", "moderation": "approved"})
    assert profile["quality_score"] == 100
    assert "Toyota" in profile["keywords"]
    assert all(item["label"] != "keyword_stuffing" for item in profile["facts"])


def test_android_association_requires_real_release_fingerprint(monkeypatch):
    monkeypatch.delenv("ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS", raising=False)
    assert server._android_asset_links() == []
    fingerprint = ":".join(["AB"] * 32)
    monkeypatch.setenv("ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS", fingerprint)
    statements = server._android_asset_links()
    assert statements[0]["target"]["package_name"] == "com.harajplus.app"
    assert statements[0]["target"]["sha256_cert_fingerprints"] == [fingerprint]


def test_ios_association_requires_real_team_scoped_app_id(monkeypatch):
    monkeypatch.delenv("IOS_UNIVERSAL_LINK_APP_IDS", raising=False)
    assert server._apple_app_site_association() == {}
    monkeypatch.setenv("IOS_UNIVERSAL_LINK_APP_IDS", "ABCDE12345.com.harajplus.app")
    document = server._apple_app_site_association()
    detail = document["applinks"]["details"][0]
    assert detail["appIDs"] == ["ABCDE12345.com.harajplus.app"]
    assert {item["/"] for item in detail["components"]} >= {"/listing/*", "/seller/*", "/category/*"}


def test_mobile_deep_link_and_discovery_surfaces_match_listing_urls():
    app = (ROOT / "mobile" / "App.js").read_text(encoding="utf-8")
    post = (ROOT / "mobile" / "src" / "screens" / "PostScreen.js").read_text(encoding="utf-8")
    config = (ROOT / "mobile" / "app.json").read_text(encoding="utf-8")
    for token in ('"https://alhraj.online"', '"https://www.alhraj.online"', 'ListingDetail: "listing/:id"', 'category: "app_deep_link"', 'trackEvent("screen_view"'):
        assert token in app
    for token in ('api.post("/listings/discovery-preview"', 'post-discovery-preview', 'post-discovery-readiness', 'لا يضمن ترتيبًا أو فهرسة'):
        assert token in post
    for token in ('"applinks:alhraj.online"', '"applinks:www.alhraj.online"', '"autoVerify": true'):
        assert token in config


def test_web_and_hosting_publish_honest_seo_and_association_contracts():
    seo = (ROOT / "frontend" / "src" / "components" / "SEO.js").read_text(encoding="utf-8")
    firebase = (ROOT / "firebase.json").read_text(encoding="utf-8")
    vercel = (ROOT / "vercel.json").read_text(encoding="utf-8")
    metadata = (ROOT / "mobile" / "store-metadata.json").read_text(encoding="utf-8")
    assert 'toLocaleString("en-US")' in seo
    assert '"@type": "BreadcrumbList"' in seo
    assert 'JSON.stringify([schema, breadcrumbSchema])' in seo
    for host in (firebase, vercel):
        assert "/.well-known/assetlinks.json" in host
        assert "/.well-known/apple-app-site-association" in host
    for language in ('"ar"', '"en"', '"ur"', '"hi"', '"bn"', '"fr"'):
        assert language in metadata
