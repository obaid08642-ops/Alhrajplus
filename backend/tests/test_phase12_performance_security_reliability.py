"""Phase 12 — performance, security, and reliability contracts."""

import asyncio
from pathlib import Path

from starlette.requests import Request
from starlette.responses import Response

import server


ROOT = Path(__file__).resolve().parents[2]


def test_backend_adds_api_safe_security_headers_without_overwriting_route_cache_policy():
    source = (ROOT / "backend" / "server.py").read_text(encoding="utf-8")

    for token in (
        "async def _baseline_security_headers",
        'response.headers.setdefault("X-Content-Type-Options", "nosniff")',
        'response.headers.setdefault("X-Frame-Options", "DENY")',
        'response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")',
        'response.headers.setdefault("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=()")',
        'response.headers.setdefault("X-Permitted-Cross-Domain-Policies", "none")',
        'response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")',
    ):
        assert token in source

    # The feed keeps its explicit CDN policy; security middleware must not replace it.
    assert '"Cache-Control": "public, s-maxage=120, stale-while-revalidate=300"' in source

    request = Request({"type": "http", "method": "GET", "scheme": "http", "path": "/api/health", "headers": [(b"x-forwarded-proto", b"https")]})

    async def next_handler(_request):
        return Response("ok", headers={"Cache-Control": "public, max-age=60"})

    response = asyncio.run(server._baseline_security_headers(request, next_handler))
    assert response.headers["cache-control"] == "public, max-age=60"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"


def test_public_discovery_indexes_match_country_status_and_boosted_sort():
    source = (ROOT / "backend" / "server.py").read_text(encoding="utf-8")

    for token in (
        'name="discover_country_status_boosted_created"',
        'name="discover_country_status_category_boosted_created"',
        'name="discover_country_status_city_boosted_created"',
        '[("country_code", 1), ("status", 1), ("is_boosted", -1), ("created_at", -1)]',
        '[("country_code", 1), ("status", 1), ("category", 1), ("is_boosted", -1), ("created_at", -1)]',
        '[("country_code", 1), ("status", 1), ("city", 1), ("is_boosted", -1), ("created_at", -1)]',
    ):
        assert token in source


def test_mobile_direct_dependency_remediations_are_pinned_in_manifest_and_lockfile():
    manifest = (ROOT / "mobile" / "package.json").read_text(encoding="utf-8")
    lockfile = (ROOT / "mobile" / "yarn.lock").read_text(encoding="utf-8")

    assert '"axios": "^1.18.0"' in manifest
    assert '"@babel/core": "^7.29.6"' in manifest
    assert "axios@^1.18.0:" in lockfile
    assert "version \"1.19.0\"" in lockfile
    assert '"@babel/core@^7.29.6":' in lockfile
