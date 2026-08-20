from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB_CALL = ROOT / "frontend" / "src" / "components" / "VoiceCallModal.js"
MOBILE_CALL = ROOT / "mobile" / "src" / "components" / "NativeVoiceCall.native.js"
MOBILE_CHAT = ROOT / "mobile" / "src" / "screens" / "ChatScreen.js"


def test_web_call_screen_has_functional_premium_controls():
    source = WEB_CALL.read_text(encoding="utf-8")
    assert "const toggleMute" in source
    assert "streamRef.current?.getAudioTracks" in source
    assert "const acceptIncoming" in source
    assert "const rejectIncoming" in source
    assert "setMinimized(true)" in source
    assert 'label={tr("المحادثة")}' in source
    assert 'label={tr("إنهاء")}' in source
    assert 'tr("مكالمة صوتية آمنة")' in source


def test_mobile_call_screen_defers_media_until_the_user_accepts():
    source = MOBILE_CALL.read_text(encoding="utf-8")
    assert "incomingAccepted = false" in source
    assert 'const isIncomingPending = role === "receiver" && !incomingAccepted' in source
    assert "isIncomingPending || startedCallIdRef.current === callId" in source
    assert "onAcceptIncoming" in source
    assert "onRejectIncoming" in source
    assert "setNativeCallMuted(callId, nextMuted)" in source
    assert "setNativeCallSpeaker(callId, next)" in source


def test_mobile_chat_routes_incoming_screen_actions_to_real_signaling():
    source = MOBILE_CHAT.read_text(encoding="utf-8")
    assert "const [incomingCallAccepted, setIncomingCallAccepted]" in source
    assert "incomingAccepted={incomingCallAccepted}" in source
    assert "onAcceptIncoming={() =>" in source
    assert 'wsSend({ type: "call_reject"' in source
    assert "setVoiceCallVisible(true)" in source
    assert "const shouldRing = !!incomingCall?.call_id && !incomingCallAccepted" in source
