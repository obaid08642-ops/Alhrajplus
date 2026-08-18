from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from ai_orchestrator import AIOrchestrator, ProviderSpec


class _Cursor:
    def __init__(self, rows):
        self.rows = rows

    async def to_list(self, length=None):
        return [dict(row) for row in self.rows[:length]]


class _Collection:
    def __init__(self, rows=None):
        self.rows = rows or []

    async def find_one(self, query, *_args, **_kwargs):
        for row in self.rows:
            if all(row.get(key) == value for key, value in query.items()):
                return dict(row)
        return None

    def find(self, query, *_args, **_kwargs):
        provider = query.get("provider")
        cutoff = (query.get("created_at") or {}).get("$gte", "")
        return _Cursor([row for row in self.rows if row.get("provider") == provider and row.get("created_at", "") >= cutoff])


class _Db:
    def __init__(self, daily=None, monthly=None, events=None):
        self.ai_provider_daily = _Collection(daily)
        self.ai_provider_monthly = _Collection(monthly)
        self.ai_usage_events = _Collection(events)


def _provider(**limits):
    return ProviderSpec(name="p1", kind="gemini", model="m", api_key="key", **limits)


def test_daily_and_monthly_limits_are_enforced_from_persistent_rollups():
    now = datetime.now(timezone.utc)
    daily = [{"provider": "p1", "day": now.date().isoformat(), "requests": 9}]
    monthly = [{"provider": "p1", "month": now.strftime("%Y-%m"), "requests": 4}]
    assert asyncio.run(AIOrchestrator(_Db(daily=daily))._quota_reason(_provider(daily_limit=10), 90)) == "daily_request_quota"
    assert asyncio.run(AIOrchestrator(_Db(monthly=monthly))._quota_reason(_provider(monthly_limit=4), 100)) == "monthly_request_quota"


def test_minute_request_and_token_limits_are_enforced_from_usage_events():
    stamp = datetime.now(timezone.utc).isoformat()
    events = [
        {"provider": "p1", "created_at": stamp, "total_tokens": 30},
        {"provider": "p1", "created_at": stamp, "total_tokens": 30},
    ]
    assert asyncio.run(AIOrchestrator(_Db(events=events))._quota_reason(_provider(rpm_limit=2), 100)) == "minute_request_quota"
    assert asyncio.run(AIOrchestrator(_Db(events=events))._quota_reason(_provider(tpm_limit=60), 100)) == "minute_token_quota"
