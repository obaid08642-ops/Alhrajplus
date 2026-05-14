"""
WebSocket hub for real-time chat events.

Events (JSON, over a single per-user WS connection):
  Client → Server:
    {"type": "typing",   "to": "<user_id>", "is_typing": bool}
    {"type": "read",     "convo_id": "<id>"}
    {"type": "ping"}

  Server → Client:
    {"type": "message",   "data": {<full message doc>}}
    {"type": "typing",    "from": "<user_id>", "is_typing": bool}
    {"type": "presence",  "user_id": "<id>", "online": bool, "last_seen": "iso"}
    {"type": "delivered", "convo_id": "<id>", "by": "<user_id>"}
    {"type": "read",      "convo_id": "<id>", "by": "<user_id>"}
    {"type": "pong"}
"""
from __future__ import annotations
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Optional

from fastapi import WebSocket

logger = logging.getLogger("haraj_plus.ws")


class ChatHub:
    """In-memory connection registry. One worker = one hub.
    Render free tier runs a single worker so this works. For multi-worker
    you'd swap to Redis pub/sub — but that's overkill at current scale.
    """
    def __init__(self) -> None:
        self._conns: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        async with self._lock:
            self._conns.setdefault(user_id, set()).add(ws)
        await self._broadcast_presence(user_id, True)

    async def disconnect(self, user_id: str, ws: WebSocket, db) -> None:
        async with self._lock:
            conns = self._conns.get(user_id)
            if conns:
                conns.discard(ws)
                if not conns:
                    self._conns.pop(user_id, None)
        if not self.is_online(user_id):
            ts = datetime.now(timezone.utc).isoformat()
            try:
                await db.users.update_one({"id": user_id}, {"$set": {"last_seen": ts}})
            except Exception:
                pass
            await self._broadcast_presence(user_id, False, last_seen=ts)

    def is_online(self, user_id: str) -> bool:
        return bool(self._conns.get(user_id))

    async def send_to_user(self, user_id: str, payload: dict) -> int:
        conns = list(self._conns.get(user_id, ()))
        if not conns:
            return 0
        text = json.dumps(payload, ensure_ascii=False, default=str)
        delivered = 0
        for ws in conns:
            try:
                await ws.send_text(text)
                delivered += 1
            except Exception:
                # Connection dropped; cleanup will happen in receive loop
                pass
        return delivered

    async def _broadcast_presence(self, user_id: str, online: bool, last_seen: Optional[str] = None) -> None:
        """Notify users who recently chatted with this user about presence change.
        Lightweight — only fans out to users in active connections (no DB lookup).
        """
        payload = {"type": "presence", "user_id": user_id, "online": online}
        if last_seen:
            payload["last_seen"] = last_seen
        # Fire to every currently-connected peer except self. Acceptable at
        # current scale; revisit if active peers > 10K.
        peers = [uid for uid in self._conns.keys() if uid != user_id]
        for peer in peers:
            await self.send_to_user(peer, payload)


hub = ChatHub()
