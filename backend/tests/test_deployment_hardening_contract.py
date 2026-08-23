from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_render_blueprint_requires_a_stable_mfa_encryption_secret():
    blueprint = (REPO_ROOT / "render.yaml").read_text(encoding="utf-8")
    assert "- key: MFA_ENCRYPTION_KEY" in blueprint
    assert "MFA_ENCRYPTION_KEY\n        sync: false" in blueprint
    assert "rotating it without migrating stored TOTP secrets" in blueprint


def test_docker_runtime_uses_virtualenv_and_non_root_user():
    dockerfile = (REPO_ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "VIRTUAL_ENV=/opt/venv" in dockerfile
    assert "python -m venv \"$VIRTUAL_ENV\"" in dockerfile
    assert "USER appuser" in dockerfile
    assert dockerfile.index("USER appuser") < dockerfile.index('CMD ["sh", "-c"')
