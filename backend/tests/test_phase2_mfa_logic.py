import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import _mfa_decrypt, _mfa_encrypt, _totp_code, _totp_secret, _verify_totp, create_refresh_token


def test_totp_secret_encrypts_at_rest_and_round_trips():
    secret = _totp_secret()
    encrypted = _mfa_encrypt(secret)
    assert encrypted != secret
    assert _mfa_decrypt(encrypted) == secret


def test_totp_accepts_current_counter_and_rejects_wrong_code(monkeypatch):
    secret = "JBSWY3DPEHPK3PXP"
    monkeypatch.setattr("server.time.time", lambda: 1_700_000_000)
    code = _totp_code(secret, int(1_700_000_000 // 30))
    assert _verify_totp(secret, code)
    assert not _verify_totp(secret, "000000")


def test_session_refresh_has_jti_and_legacy_refresh_stays_string():
    session_token, jti = create_refresh_token("user-1", "session-1")
    assert isinstance(session_token, str) and len(jti) > 10
    assert isinstance(create_refresh_token("user-1"), str)
