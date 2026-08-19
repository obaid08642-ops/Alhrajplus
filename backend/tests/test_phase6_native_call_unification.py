"""Phase 6 — Native call unification contract checks."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MOBILE = ROOT / "mobile"


def test_mobile_call_path_has_no_voice_webview_component_or_import():
    assert not (MOBILE / "src" / "components" / "VoiceCallWebView.js").exists()
    source_files = list((MOBILE / "src").rglob("*.js"))
    assert all("VoiceCallWebView" not in path.read_text(encoding="utf-8") for path in source_files)


def test_callkeep_and_crypto_are_configured_for_the_native_call_path():
    package = json.loads((MOBILE / "package.json").read_text(encoding="utf-8"))
    dependencies = package["dependencies"]
    assert dependencies["react-native-callkeep"] == "4.3.16"
    assert dependencies["@config-plugins/react-native-callkeep"] == "12.0.0"
    assert dependencies["expo-crypto"] == "~15.0.9"
    app_config = (MOBILE / "app.config.js").read_text(encoding="utf-8")
    assert "@config-plugins/react-native-callkeep" in app_config


def test_native_call_system_and_notification_recovery_preserve_authorized_signals():
    native_system = (MOBILE / "src" / "calls" / "nativeCallSystem.native.js").read_text(encoding="utf-8")
    for token in ("RNCallKeep.setup", "displayIncomingCall", "startCall", "setCurrentCallActive", "toggleAudioRouteSpeaker"):
        assert token in native_system

    chat = (MOBILE / "src" / "screens" / "ChatScreen.js").read_text(encoding="utf-8")
    for token in ("randomUUID()", "showIncomingNativeCall", "/voice/calls/${incomingCallId}/signals", "<NativeVoiceCall"):
        assert token in chat
    assert "VoiceCallWebView" not in chat

    notifications = (MOBILE / "src" / "notifications.js").read_text(encoding="utf-8")
    assert 'payload?.type === "incoming_call"' in notifications
    assert "call_id" in notifications

    backend = (ROOT / "backend" / "server.py").read_text(encoding="utf-8")
    assert '@api.get("/voice/calls/{call_id}/signals")' in backend
    assert '"pending_signals"' in backend
