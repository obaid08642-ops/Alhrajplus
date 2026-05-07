"""Iter-15 backend tests: Trip.com iframe ads in home_middle and listing_bottom placements."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://platform-inspect.preview.emergentagent.com").rstrip("/")


def _get_ads(placement):
    r = requests.get(f"{BASE_URL}/api/ads", params={"placement": placement}, timeout=15)
    assert r.status_code == 200, f"GET /api/ads?placement={placement} -> {r.status_code}"
    return r.json()


def test_home_middle_has_trip_iframe_ad():
    ads = _get_ads("home_middle")
    assert isinstance(ads, list) and len(ads) > 0, "no ads in home_middle"
    trip = [a for a in ads if (a.get("iframe_url") or "").lower().find("trip.com") >= 0]
    assert trip, f"no trip.com iframe ad found in home_middle. Got: {ads}"
    a = trip[0]
    assert a.get("ad_type") == "iframe"
    assert a.get("iframe_width") == 300
    assert a.get("iframe_height") == 250


def test_listing_bottom_has_trip_iframe_ad():
    ads = _get_ads("listing_bottom")
    assert isinstance(ads, list) and len(ads) > 0, "no ads in listing_bottom"
    trip = [a for a in ads if (a.get("iframe_url") or "").lower().find("trip.com") >= 0]
    assert trip, f"no trip.com iframe ad found in listing_bottom. Got: {ads}"
    a = trip[0]
    assert a.get("ad_type") == "iframe"
    assert "trip.com" in a.get("iframe_url", "").lower()


def test_listing_top_endpoint_returns_list():
    # New placement used by ListingDetail above seller info
    r = requests.get(f"{BASE_URL}/api/ads", params={"placement": "listing_top"}, timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
