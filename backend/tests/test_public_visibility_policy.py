"""Pure unit tests for public listing visibility policy.

These tests intentionally avoid MongoDB and external services so they can run in
CI before integration credentials are available.
"""
import re

from search_engine import public_listing_filter


def _clauses():
    return public_listing_filter()["$and"]


def test_public_policy_requires_active_status():
    assert {"status": "active"} in _clauses()


def test_public_policy_hides_demo_records():
    assert {"is_demo": {"$ne": True}} in _clauses()


def test_public_policy_hides_seeded_test_titles():
    title_clause = next(c["title"] for c in _clauses() if "title" in c)
    pattern = title_clause["$not"]["$regex"]
    assert re.search(pattern, "TEST mark sold no auth", re.I)
    assert re.search(pattern, "TEST_SEARCH car", re.I)
    assert not re.search(pattern, "Toyota Camry 2024", re.I)


def test_public_policy_preserves_extra_filters():
    query = public_listing_filter({"country_code": "SA"})
    assert {"country_code": "SA"} in query["$and"]
