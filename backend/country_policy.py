"""Canonical marketplace country, location, and currency policy.

This module has no database dependency. It validates new user/listing mutations
against the same `seed_data.COUNTRIES` reference used by clients, while exposing
normalisation helpers that make legacy repair conservative and reversible.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional

from seed_data import COUNTRIES


@dataclass(frozen=True)
class CountryRules:
    code: str
    currency: str
    currency_code: str
    cities_by_name: dict[str, dict]


def _clean(value: object) -> str:
    return str(value or "").strip()


def _key(value: object) -> str:
    return _clean(value).casefold()


def supported_country_codes() -> set[str]:
    return {str(country.get("code") or "").upper() for country in COUNTRIES if country.get("code")}


def country_code_or_default(value: Optional[str], default: str = "SA") -> str:
    requested = _clean(value).upper()
    fallback = _clean(default).upper() or "SA"
    return requested if requested in supported_country_codes() else fallback


def country_rules(country_code: str) -> CountryRules:
    code = _clean(country_code).upper()
    country = next((item for item in COUNTRIES if str(item.get("code") or "").upper() == code), None)
    if not country:
        raise ValueError("unsupported_country")
    cities_by_name: dict[str, dict] = {}
    for city in country.get("cities") or []:
        for alias in (city.get("name_ar"), city.get("name_en")):
            if _key(alias):
                cities_by_name[_key(alias)] = city
    return CountryRules(
        code=code,
        currency=_clean(country.get("currency")),
        currency_code=_clean(country.get("currency_code")).upper(),
        cities_by_name=cities_by_name,
    )


def normalize_location(country_code: str, city: Optional[str], district: Optional[str]) -> tuple[str, str]:
    """Return canonical Arabic city/district for a supported country.

    A new listing may not carry a city from another country or an unrecognised
    free-text city. Blank district is allowed; a supplied district must belong
    to the chosen city. English city names are accepted and canonicalised to
    the catalogue's Arabic display name.
    """
    rules = country_rules(country_code)
    raw_city = _clean(city)
    if not raw_city:
        raise ValueError("city_required")
    city_doc = rules.cities_by_name.get(_key(raw_city))
    if not city_doc:
        raise ValueError("city_not_in_country")
    canonical_city = _clean(city_doc.get("name_ar")) or raw_city
    raw_district = _clean(district)
    if not raw_district:
        return canonical_city, ""
    districts = {_key(item): _clean(item) for item in city_doc.get("districts") or [] if _key(item)}
    canonical_district = districts.get(_key(raw_district))
    if not canonical_district:
        raise ValueError("district_not_in_city")
    return canonical_city, canonical_district


def normalize_currency(country_code: str, currency: Optional[str], currency_code: Optional[str] = None) -> tuple[str, str]:
    """Return the canonical currency symbol and ISO code for the country.

    Clients may submit either the display symbol or ISO code. Any known or
    unknown alternative is rejected rather than stored against the wrong market.
    """
    rules = country_rules(country_code)
    supplied = {_clean(value).upper() for value in (currency, currency_code) if _clean(value)}
    expected = {rules.currency.upper(), rules.currency_code}
    if supplied and not supplied.issubset(expected):
        raise ValueError("currency_not_in_country")
    return rules.currency, rules.currency_code


def city_country_codes(city: Optional[str]) -> set[str]:
    """Return every configured marketplace country containing a city alias."""
    needle = _key(city)
    if not needle:
        return set()
    matches: set[str] = set()
    for code in supported_country_codes():
        if needle in country_rules(code).cities_by_name:
            matches.add(code)
    return matches


def is_city_known_for_country(country_code: str, city: Optional[str]) -> bool:
    try:
        return bool(_key(city)) and _key(city) in country_rules(country_code).cities_by_name
    except ValueError:
        return False


def known_currency_values() -> set[str]:
    values: set[str] = set()
    for code in supported_country_codes():
        rules = country_rules(code)
        values.update({rules.currency.upper(), rules.currency_code})
    return values


def countries_for_city_aliases(cities: Iterable[str]) -> dict[str, set[str]]:
    """Small deterministic helper for integrity reports and pure tests."""
    return {_clean(city): city_country_codes(city) for city in cities if _clean(city)}
