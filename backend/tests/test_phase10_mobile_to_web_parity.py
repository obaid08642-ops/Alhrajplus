"""Phase 10 — Mobile capabilities ported to Web parity contracts."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_web_search_includes_mobile_image_search_and_voice_recording_fallback():
    search = (ROOT / "frontend" / "src" / "pages" / "SearchAndMap.js").read_text(encoding="utf-8")

    for token in (
        'data-testid="image-search-btn-page"',
        'accept="image/*"',
        'api.post("/ai/image-search", { image_base64: imageBase64 })',
        'typeof MediaRecorder === "undefined"',
        "new MediaRecorder(stream)",
        'api.post("/ai/transcribe", form)',
        "window.SpeechRecognition || window.webkitSpeechRecognition",
    ):
        assert token in search


def test_web_pwa_is_installable_from_profile_and_registered_at_app_start():
    profile = (ROOT / "frontend" / "src" / "pages" / "ProfilePage.js").read_text(encoding="utf-8")
    entry = (ROOT / "frontend" / "src" / "index.js").read_text(encoding="utf-8")
    document = (ROOT / "frontend" / "public" / "index.html").read_text(encoding="utf-8")
    manifest = json.loads((ROOT / "frontend" / "public" / "manifest.webmanifest").read_text(encoding="utf-8"))

    assert "function PwaInstallButton()" in profile
    assert 'data-testid="pwa-install-button"' in profile
    assert "<PwaInstallButton />" in profile
    assert 'window.addEventListener("beforeinstallprompt"' in entry
    assert 'navigator.serviceWorker.register("/sw.js")' in entry
    assert 'rel="manifest" href="%PUBLIC_URL%/manifest.webmanifest"' in document
    assert manifest["start_url"] == "/"
    assert manifest["display"] == "standalone"
    assert {icon["sizes"] for icon in manifest["icons"]} >= {"192x192", "512x512"}
    assert (ROOT / "frontend" / "public" / "sw.js").is_file()
