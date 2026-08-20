"""Regression contracts for incident: chat, calls, and comment first-send reliability."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_websocket_uses_the_same_runtime_resolved_api_origin_as_http():
    source = read("frontend/src/lib/useChatSocket.js")

    assert 'import { API_BASE, tokenStore } from "@/lib/api";' in source
    assert "function websocketOriginFromApiBase()" in source
    assert "const absoluteApiBase = /^https?:\\/\\//i.test(API_BASE)" in source
    assert "${websocketOriginFromApiBase()}/api/ws/chat?token=" in source
    assert "process.env.REACT_APP_BACKEND_URL" not in source


def test_call_signals_survive_temporary_socket_disconnects_on_both_clients():
    for relative_path in ("frontend/src/lib/useChatSocket.js", "mobile/src/useChatSocket.js"):
        source = read(relative_path)
        for event_name in ("call_invite", "call_offer", "call_answer", "call_ice", "call_reject", "call_hangup"):
            assert f'"{event_name}"' in source
        assert "outboundQueue" in source
        assert "queuedEventKey" in source
        assert "slice(-128)" in source


def test_comment_retries_reuse_the_same_key_and_reconcile_a_completed_first_write():
    web = read("frontend/src/pages/ListingDetail.js")
    mobile = read("mobile/src/screens/ListingDetailScreen.js")

    for source in (web, mobile):
        assert "client_comment_id" in source
        assert "client_comment_id ===" in source
        assert "await api.get(`/listings/${" in source

    assert "const [commentClientId, setCommentClientId] = useState(\"\");" in mobile
    assert "const client_comment_id = commentClientId ||" in mobile
    assert "onPress={submitComment}" in mobile


def test_mobile_has_a_rest_history_fallback_when_realtime_is_reconnecting():
    source = read("mobile/src/screens/ChatScreen.js")

    assert "if (connected) return undefined;" in source
    assert "setInterval(loadHistory, 8000)" in source
    assert "return () => clearInterval(timer);" in source
