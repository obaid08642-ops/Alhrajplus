"""Pure tests for auction closing-field compatibility."""
from datetime import datetime, timezone, timedelta

from server import _auction_end_datetime


def test_auction_end_reads_current_field():
    value = _auction_end_datetime({"auction_end_at": "2030-01-01T12:00:00+00:00"})
    assert value == datetime(2030, 1, 1, 12, 0, tzinfo=timezone.utc)


def test_auction_end_reads_legacy_custom_field_and_normalizes_timezone():
    value = _auction_end_datetime({"custom_fields": {"end_time": "2030-01-01T12:00:00"}})
    assert value.tzinfo == timezone.utc
    assert value.hour == 12


def test_auction_end_returns_none_for_missing_or_invalid_value():
    assert _auction_end_datetime({}) is None
    assert _auction_end_datetime({"auction_meta": {"end_time": "not-a-date"}}) is None
