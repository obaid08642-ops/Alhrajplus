import asyncio

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

import server


def test_wallet_operations_require_idempotency_keys():
    with pytest.raises(ValidationError):
        server.WalletSpendIn(amount=10, purpose="service")
    with pytest.raises(ValidationError):
        server.WalletTopupIn(amount=10)
    assert server.WalletSpendIn(amount=10, purpose="service", idempotency_key="wallet-spend-001").idempotency_key == "wallet-spend-001"
    assert server.WalletTopupIn(amount=10, idempotency_key="wallet-topup-001").idempotency_key == "wallet-topup-001"


def test_wallet_admin_adjustment_requires_admin_mfa_when_policy_is_enabled(monkeypatch):
    monkeypatch.setattr(server, "ADMIN_MFA_REQUIRED", True)
    with pytest.raises(HTTPException) as denied:
        asyncio.run(server.require_admin({"role": "admin", "mfa_enabled": False, "mfa_session_verified": False}))
    assert denied.value.status_code == 403


class _WalletTransactions:
    def __init__(self):
        self.rows = []

    async def find_one(self, query, *_args, **_kwargs):
        for row in self.rows:
            if all(row.get(key) == value for key, value in query.items()):
                return dict(row)
        return None

    async def insert_one(self, doc):
        self.rows.append(dict(doc))


class _WalletDb:
    def __init__(self):
        self.wallet_transactions = _WalletTransactions()


def test_wallet_log_returns_existing_transaction_for_same_user_key(monkeypatch):
    db = _WalletDb()
    monkeypatch.setattr(server, "db", db)
    first = asyncio.run(server._wallet_log("u1", "spend", -10, "service", idempotency_key="wallet-spend-001"))
    repeated = asyncio.run(server._wallet_log("u1", "spend", -10, "service", idempotency_key="wallet-spend-001"))
    assert first["id"] == repeated["id"]
    assert len(db.wallet_transactions.rows) == 1
