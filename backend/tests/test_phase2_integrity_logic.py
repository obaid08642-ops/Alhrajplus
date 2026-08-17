import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import _country_integrity_reference, _welcome_coins_amount


def test_country_integrity_reference_detects_cross_country_city():
    countries, city_to_countries, known_currencies = _country_integrity_reference()
    assert "SA" in countries and "EG" in countries
    assert city_to_countries["الإسكندرية".casefold()] == {"EG"}
    assert "SAR" in known_currencies
    assert "EGP" in known_currencies


def test_country_integrity_reference_exposes_expected_egypt_currency():
    countries, _, _ = _country_integrity_reference()
    assert countries["EG"]["currency"] == "ج.م"
    assert countries["EG"]["currency_code"] == "EGP"


def test_welcome_coins_amount_is_bounded_and_never_cash(monkeypatch):
    monkeypatch.setenv("WELCOME_COINS_BONUS", "25")
    assert _welcome_coins_amount() == 25
    monkeypatch.setenv("WELCOME_COINS_BONUS", "-99")
    assert _welcome_coins_amount() == 0
    monkeypatch.setenv("WELCOME_COINS_BONUS", "invalid")
    assert _welcome_coins_amount() == 10
    monkeypatch.delenv("WELCOME_COINS_BONUS", raising=False)
    assert _welcome_coins_amount() == 10
