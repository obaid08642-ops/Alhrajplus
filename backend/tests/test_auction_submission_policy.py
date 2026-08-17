from datetime import datetime, timedelta, timezone

import pytest

from server import _normalize_auction_submission


NOW = datetime(2026, 8, 17, 12, 0, tzinfo=timezone.utc)


def parse_end(value: str) -> datetime:
    return datetime.fromisoformat(value)


def test_missing_duration_defaults_to_seven_days():
    fields, end = _normalize_auction_submission({}, NOW)
    assert fields["auction_duration"] == "7 أيام"
    assert parse_end(end) == NOW + timedelta(days=7)
    assert fields["end_time"] == end


@pytest.mark.parametrize(("duration", "days"), [("3 أيام", 3), ("5 أيام", 5), ("7 أيام", 7), (7, 7)])
def test_supported_durations_are_normalized(duration, days):
    fields, end = _normalize_auction_submission({"auction_duration": duration}, NOW)
    assert parse_end(end) == NOW + timedelta(days=days)
    assert fields["end_time"] == end


def test_duration_over_one_week_is_rejected():
    with pytest.raises(Exception) as exc:
        _normalize_auction_submission({"auction_duration": "10 أيام"}, NOW)
    assert "7 أيام" in str(exc.value)


def test_manual_end_over_one_week_is_rejected():
    end = (NOW + timedelta(days=8)).isoformat()
    with pytest.raises(Exception) as exc:
        _normalize_auction_submission({"end_time": end}, NOW)
    assert "7 أيام" in str(exc.value)


def test_manual_end_is_normalized_to_utc():
    fields, end = _normalize_auction_submission({"end_time": "2026-08-20T15:30"}, NOW)
    assert end.endswith("+00:00")
    assert fields["end_time"] == end
    assert parse_end(end) == datetime(2026, 8, 20, 15, 30, tzinfo=timezone.utc)


def test_past_manual_end_is_rejected():
    with pytest.raises(Exception):
        _normalize_auction_submission({"end_time": "2026-08-16T15:30Z"}, NOW)
