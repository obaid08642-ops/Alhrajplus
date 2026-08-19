import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import CLIENT_CONTRACT_VERSION, _client_contract


def test_client_contract_declares_shared_context_and_defaults():
    contract = _client_contract()

    assert contract["version"] == CLIENT_CONTRACT_VERSION
    assert contract["defaults"] == {
        "language": "ar",
        "country_code": "SA",
        "calendar": "gregory",
        "numbering_system": "latn",
    }
    assert contract["request_context"]["country_query"] == "country_code"
    assert contract["request_context"]["language_header"] == "X-Haraj-Language"
    assert contract["request_context"]["client_header"] == "X-Haraj-Client"


def test_client_contract_keeps_only_supported_languages_and_safe_capabilities():
    contract = _client_contract()

    assert contract["supported_languages"] == ["ar", "en", "ur", "hi", "bn", "fr"]
    assert contract["capabilities"]["listing_detail"] == {
        "path": "/listings/{id}",
        "method": "GET",
        "query": ["lang"],
        "localized_fields": ["title", "description", "seo_available_languages"],
    }
    assert contract["capabilities"]["public_discovery"]["read_only"] is True
    assert contract["capabilities"]["admin_monitoring"]["admin_only"] is True
    assert "secret" not in str(contract).lower()


def test_client_contract_route_is_registered_on_api_router():
    import asyncio
    from server import app

    matching = [route for route in app.routes if getattr(route, "path", "") == "/api/meta/client-contract"]
    assert len(matching) == 1
    assert "GET" in matching[0].methods

    response = asyncio.run(matching[0].endpoint())
    assert response["version"] == CLIENT_CONTRACT_VERSION
    assert response["capabilities"]["public_discovery"]["method"] == "GET"


def test_client_contract_is_available_over_http_asgi():
    import asyncio
    import httpx
    from server import app

    async def request_contract():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get("/api/meta/client-contract")

    response = asyncio.run(request_contract())
    assert response.status_code == 200
    assert response.json()["version"] == CLIENT_CONTRACT_VERSION
    assert response.json()["defaults"]["calendar"] == "gregory"
