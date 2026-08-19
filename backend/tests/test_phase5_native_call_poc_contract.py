"""Phase 5 — Native mobile-call proof-of-concept contract checks."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MOBILE = ROOT / "mobile"


def test_native_call_poc_has_compatible_expo_webrtc_dependencies():
    package = json.loads((MOBILE / "package.json").read_text(encoding="utf-8"))
    dependencies = package["dependencies"]
    assert dependencies["react-native-webrtc"] == "124.0.6"
    assert dependencies["@config-plugins/react-native-webrtc"] == "13.0.0"
    assert dependencies["expo-dev-client"] == "~6.0.21"


def test_native_call_poc_registers_the_webrtc_config_plugin_and_microphone_reason():
    app_config = (MOBILE / "app.config.js").read_text(encoding="utf-8")
    app_json = json.loads((MOBILE / "app.json").read_text(encoding="utf-8"))
    assert "@config-plugins/react-native-webrtc" in app_config
    assert "mergePlugins" in app_config
    microphone_reason = app_json["expo"]["ios"]["infoPlist"]["NSMicrophoneUsageDescription"]
    assert "المكالمات الصوتية" in microphone_reason
    assert "RECORD_AUDIO" in app_json["expo"]["android"]["permissions"]


def test_native_call_poc_uses_native_webrtc_and_all_signal_types_without_webview():
    source = (MOBILE / "src" / "components" / "NativeVoiceCall.native.js").read_text(encoding="utf-8")
    for token in ("RTCPeerConnection", "mediaDevices.getUserMedia", "call_invite", "call_offer", "call_answer", "call_ice", "call_hangup"):
        assert token in source
    assert "WebView" not in source
    assert "signalingEvents = []" in source
    assert "pendingIceRef" in source

    chat = (MOBILE / "src" / "screens" / "ChatScreen.js").read_text(encoding="utf-8")
    assert "EXPO_PUBLIC_NATIVE_CALL_POC" not in chat
    assert "<NativeVoiceCall" in chat
    assert "signalingEvents={nativeCallSignals}" in chat
    assert 'subscribe("call_ice"' in chat
    assert "VoiceCallWebView" not in chat
