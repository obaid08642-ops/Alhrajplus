import hashlib
import json
from pathlib import Path

import server
from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[2]


def test_public_agent_discovery_documents_are_well_formed_and_read_only(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://alhraj.online")

    catalog = server._api_catalog_document()
    assert list(catalog) == ["linkset"]
    entry = catalog["linkset"][0]
    assert entry["anchor"].endswith("/.well-known/api-catalog")
    assert entry["service-desc"][0]["href"].endswith("/.well-known/public-openapi.json")
    public_openapi = server._public_openapi_document()
    assert set(public_openapi["paths"]) == {"/health", "/listings", "/listings/{listing_id}", "/meta/categories", "/meta/countries"}
    assert all("chat" not in path and "wallet" not in path and "admin" not in path for path in public_openapi["paths"])
    assert entry["service-doc"][0]["href"].endswith("/docs/api")
    assert all("/chat" not in item["href"] and "/wallet" not in item["href"] for item in entry["item"])

    ard = server._ard_manifest()
    assert ard["specVersion"] == "0.1"
    assert len(ard["entries"]) == 3
    assert all(entry["id"].startswith("urn:air:alhraj.online:") for entry in ard["entries"])

    server_card = server._mcp_server_card()
    assert server_card["transport"]["url"] == "https://alhraj.online/api/mcp"
    assert "read-only" in server_card["description"].lower()

    oauth = server._oauth_discovery_metadata()
    assert oauth["grant_types_supported"] == []
    assert oauth["agent_auth"]["registration_status"] == "not_available"
    resource = server._oauth_protected_resource_metadata()
    assert resource["authorization_servers"] == []
    assert resource["scopes_supported"] == []


def test_agent_discovery_http_endpoints_return_machine_readable_contracts():
    client = TestClient(server.app)

    catalog = client.get("/.well-known/api-catalog")
    assert catalog.status_code == 200
    assert catalog.headers["content-type"].startswith("application/linkset+json")
    assert catalog.headers["access-control-allow-origin"] == "*"
    assert "linkset" in catalog.json()

    for path in ("/.well-known/public-openapi.json", "/.well-known/ai-catalog.json", "/.well-known/mcp/server-card.json", "/.well-known/agent-skills/index.json", "/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("application/json")
        assert isinstance(response.json(), dict)

    skill = client.get("/.well-known/agent-skills/public-listing-search/SKILL.md")
    assert skill.status_code == 200
    assert skill.headers["content-type"].startswith("text/markdown")
    assert skill.text.startswith("---")

    home_markdown = client.get("/agent/home.md")
    assert home_markdown.status_code == 200
    assert home_markdown.headers["content-type"].startswith("text/markdown")
    assert home_markdown.headers["vary"] == "Accept"
    assert int(home_markdown.headers["x-markdown-tokens"]) > 10

    listed_tools = client.post("/api/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}})
    assert listed_tools.status_code == 200
    assert {tool["name"] for tool in listed_tools.json()["result"]["tools"]} == {"search_public_listings", "get_public_listing"}


def test_agent_markdown_renderer_excludes_nonpublic_fields(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://alhraj.online")
    listing = {
        "id": "public_123", "slug": "public-listing", "title": "سيارة عامة", "description": "وصف معلن", "price": 25000,
        "currency": "SAR", "city": "Riyadh", "category": "cars", "condition": "used", "password_hash": "never-render",
        "seller_phone": "never-render", "internal_notes": "never-render",
    }
    rendered = server._listing_agent_markdown(listing)
    assert rendered.startswith("---")
    assert "سيارة عامة" in rendered
    assert "never-render" not in rendered
    assert "https://alhraj.online/listing/public-listing" in rendered


def test_agent_skill_digest_matches_published_markdown():
    index = server._agent_skill_index()
    skill = index["skills"][0]
    expected = "sha256:" + hashlib.sha256(server._agent_skill_public_listing_search().encode("utf-8")).hexdigest()
    assert skill["digest"] == expected
    assert skill["type"] == "skill-md"
    assert "private" in server._agent_skill_public_listing_search().lower()


def test_agent_headers_and_robots_preserve_public_only_policy(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://alhraj.online")
    headers = server._agent_public_headers(markdown=True, vary="User-Agent")
    assert 'rel="api-catalog"' in headers["Link"]
    assert headers["Content-Signal"] == "ai-train=no, search=yes, ai-input=yes"
    assert headers["Vary"] == "User-Agent, Accept"

    source = (ROOT / "backend" / "server.py").read_text(encoding="utf-8")
    assert "Content-Signal: ai-train=no, search=yes, ai-input=yes" in source
    for path in ("/chat", "/profile", "/wallet", "/admin"):
        assert f"Disallow: {path}" in source


def test_web_and_deployment_register_only_safe_agent_entrypoints():
    vercel = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    rewrite_sources = {item["source"] for item in vercel["rewrites"]}
    assert "/.well-known/api-catalog" in rewrite_sources
    assert "/.well-known/public-openapi.json" in rewrite_sources
    assert "/.well-known/mcp/:path*" in rewrite_sources
    assert "/auth.md" in rewrite_sources
    assert "/docs/api" in rewrite_sources
    home_markdown_rewrite = next(item for item in vercel["rewrites"] if item["source"] == "/" and item.get("has"))
    assert home_markdown_rewrite["destination"].endswith("/agent/home.md")

    webmcp = (ROOT / "frontend" / "src" / "lib" / "webMcp.js").read_text(encoding="utf-8")
    app = (ROOT / "frontend" / "src" / "App.js").read_text(encoding="utf-8")
    assert "navigator?.modelContext" in webmcp
    assert "search_public_listings" in webmcp
    assert "get_public_listing" in webmcp
    for forbidden in ("send_message", "promote", "wallet", "bid", "payment"):
        assert f'name: "{forbidden}"' not in webmcp
    assert "<PublicWebMcpBridge />" in app
