import server


def test_dedicated_mfa_key_reads_legacy_jwt_derived_ciphertext(monkeypatch):
    monkeypatch.setattr(server, "JWT_SECRET", "legacy-jwt-secret-for-mfa-migration")
    monkeypatch.setattr(server, "MFA_ENCRYPTION_KEY", "")
    legacy_ciphertext = server._mfa_encrypt("JBSWY3DPEHPK3PXP")

    monkeypatch.setattr(server, "MFA_ENCRYPTION_KEY", "dedicated-mfa-secret-for-production")
    secret, used_legacy_key = server._mfa_decrypt_with_legacy_fallback(legacy_ciphertext)

    assert secret == "JBSWY3DPEHPK3PXP"
    assert used_legacy_key is True

    migrated_ciphertext = server._mfa_encrypt(secret)
    migrated_secret, migrated_from_legacy = server._mfa_decrypt_with_legacy_fallback(migrated_ciphertext)
    assert migrated_secret == secret
    assert migrated_from_legacy is False
