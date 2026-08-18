import asyncio

import pytest
from fastapi import HTTPException

import server


def _run(coro):
    return asyncio.run(coro)


def test_admin_mfa_policy_is_role_scoped(monkeypatch):
    monkeypatch.setattr(server, "ADMIN_MFA_REQUIRED", True)
    assert server._admin_mfa_required_for({"role": "admin"}) is True
    assert server._admin_mfa_required_for({"role": "user"}) is False


def test_admin_without_enrolled_or_verified_mfa_is_rejected(monkeypatch):
    monkeypatch.setattr(server, "ADMIN_MFA_REQUIRED", True)
    with pytest.raises(HTTPException) as error:
        _run(server.require_admin({"role": "admin", "mfa_enabled": False, "mfa_session_verified": False}))
    assert error.value.status_code == 403
    assert "MFA" in str(error.value.detail)


def test_admin_with_enrolled_and_verified_mfa_is_allowed(monkeypatch):
    monkeypatch.setattr(server, "ADMIN_MFA_REQUIRED", True)
    user = {"role": "admin", "mfa_enabled": True, "mfa_session_verified": True}
    assert _run(server.require_admin(user)) is user


def test_non_admin_is_rejected_even_if_mfa_is_verified(monkeypatch):
    monkeypatch.setattr(server, "ADMIN_MFA_REQUIRED", True)
    with pytest.raises(HTTPException) as error:
        _run(server.require_admin({"role": "user", "mfa_enabled": True, "mfa_session_verified": True}))
    assert error.value.status_code == 403
