import asyncio

import pytest
from fastapi import HTTPException

import server


USER_EG = {"id": "u-eg", "role": "user", "country_code": "EG"}


def _run(coro):
    return asyncio.run(coro)


def test_active_country_guard_uses_account_country_and_rejects_override():
    assert server._require_active_country(USER_EG) == "EG"
    assert server._require_active_country(USER_EG, "EG") == "EG"
    with pytest.raises(HTTPException) as cross_country:
        server._require_active_country(USER_EG, "SA", action="المزايدة")
    assert cross_country.value.status_code == 409
    with pytest.raises(HTTPException) as unsupported:
        server._require_active_country(USER_EG, "UA")
    assert unsupported.value.status_code == 422


def test_favorite_action_rejects_cross_country_before_database_access(monkeypatch):
    class FailDb:
        def __getattr__(self, name):
            raise AssertionError(f"database should not be accessed: {name}")

    monkeypatch.setattr(server, "db", FailDb())
    with pytest.raises(HTTPException) as error:
        _run(server.toggle_favorite("sa-listing", "SA", USER_EG))
    assert error.value.status_code == 409


def test_price_alert_rejects_cross_country_before_database_access(monkeypatch):
    class FailDb:
        def __getattr__(self, name):
            raise AssertionError(f"database should not be accessed: {name}")

    monkeypatch.setattr(server, "db", FailDb())
    with pytest.raises(HTTPException) as error:
        _run(server.create_price_alert("sa-listing", {"target_price": 100}, "SA", USER_EG))
    assert error.value.status_code == 409


def test_bid_rejects_cross_country_before_database_access(monkeypatch):
    class FailDb:
        def __getattr__(self, name):
            raise AssertionError(f"database should not be accessed: {name}")

    monkeypatch.setattr(server, "db", FailDb())
    with pytest.raises(HTTPException) as error:
        _run(server.place_bid("sa-auction", server.BidIn(amount=100), "SA", USER_EG))
    assert error.value.status_code == 409
