import asyncio
import json

from chat_hub import ChatHub


class FakeWebSocket:
    def __init__(self, fail=False):
        self.fail = fail
        self.messages = []

    async def send_text(self, text):
        if self.fail:
            raise RuntimeError("socket closed")
        self.messages.append(json.loads(text))


def test_chat_hub_local_delivery_without_redis(monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)
    hub = ChatHub()
    ws = FakeWebSocket()
    async def run():
        await hub.connect("u1", ws)
        return await hub.send_to_user("u1", {"type": "message", "data": {"id": "m1"}})
    delivered = asyncio.run(run())
    assert delivered == 1
    assert ws.messages[-1]["data"]["id"] == "m1"
    assert hub.is_online("u1") is True


def test_chat_hub_removes_failed_socket(monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)
    hub = ChatHub()
    ws = FakeWebSocket(fail=True)
    async def run():
        await hub.connect("u2", ws)
        return await hub.send_to_user("u2", {"type": "ping"})
    delivered = asyncio.run(run())
    assert delivered == 0
    assert hub.is_online("u2") is False
