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
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Set, Optional

from fastapi import WebSocket

logger = logging.getLogger("haraj_plus.ws")


class ChatHub:
    """Local socket registry with optional Redis Pub/Sub fan-out.

    Redis is required for horizontally scaled production. Without it, the
    local registry remains a development/single-worker fallback.
    """
    def __init__(self) -> None:
        self._conns: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
        self._redis_url = os.environ.get("REDIS_URL", "").strip()
        self._redis = None
        self._pubsub = None
        self._subscriber_task: Optional[asyncio.Task] = None
        self._instance_id = uuid.uuid4().hex
        self._channel = "hp:v1:chat:events"

    async def _ensure_redis(self) -> None:
        if not self._redis_url or self._redis is not None:
            return
        try:
            import redis.asyncio as redis_async
            self._redis = redis_async.Redis.from_url(self._redis_url, decode_responses=True, socket_connect_timeout=1.0, socket_timeout=1.0)
            await self._redis.ping()
            self._pubsub = self._redis.pubsub(ignore_subscribe_messages=True)
            await self._pubsub.subscribe(self._channel)
            self._subscriber_task = asyncio.create_task(self._consume_redis())
            logger.info("[ws] Redis Pub/Sub connected for cross-instance chat")
        except Exception as exc:
            logger.warning("[ws] Redis Pub/Sub unavailable; using local sockets: %s", exc)
            try:
                if self._redis is not None:
                    await self._redis.aclose()
            except Exception:
                pass
            self._redis = None
            self._pubsub = None

    async def _consume_redis(self) -> None:
        try:
            async for message in self._pubsub.listen():
                if not message or message.get("type") != "message":
                    continue
                try:
                    envelope = json.loads(message.get("data") or "{}")
                    if envelope.get("origin") == self._instance_id:
                        continue
                    target = envelope.get("target_user_id")
                    payload = envelope.get("payload") or {}
                    if target == "*":
                        await self._broadcast_local(payload, exclude_user=envelope.get("exclude_user_id"))
                    elif target:
                        await self._send_local(target, payload)
                except Exception:
                    logger.debug("[ws] ignored malformed Redis event", exc_info=True)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.warning("[ws] Redis subscriber stopped: %s", exc)

    async def _publish(self, target_user_id: str, payload: dict, exclude_user_id: Optional[str] = None) -> None:
        if self._redis is None:
            return
        envelope = {"origin": self._instance_id, "target_user_id": target_user_id, "exclude_user_id": exclude_user_id, "payload": payload}
        try:
            await self._redis.publish(self._channel, json.dumps(envelope, ensure_ascii=False, default=str))
        except Exception:
            logger.debug("[ws] Redis publish failed; local delivery remains active", exc_info=True)

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await self._ensure_redis()
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

    async def _send_local(self, user_id: str, payload: dict) -> int:
        conns = list(self._conns.get(user_id, ()))
        if not conns:
            return 0
        text = json.dumps(payload, ensure_ascii=False, default=str)
        delivered = 0
        stale = []
        for ws in conns:
            try:
                await ws.send_text(text)
                delivered += 1
            except Exception:
                stale.append(ws)
        if stale:
            async with self._lock:
                current = self._conns.get(user_id, set())
                for ws in stale:
                    current.discard(ws)
                if not current:
                    self._conns.pop(user_id, None)
        return delivered

    async def send_to_user(self, user_id: str, payload: dict) -> int:
        await self._ensure_redis()
        delivered = await self._send_local(user_id, payload)
        await self._publish(user_id, payload)
        return delivered

    async def _broadcast_local(self, payload: dict, exclude_user: Optional[str] = None) -> None:
        peers = [uid for uid in self._conns.keys() if uid != exclude_user]
        for peer in peers:
            await self._send_local(peer, payload)

    async def _broadcast_presence(self, user_id: str, online: bool, last_seen: Optional[str] = None) -> None:
        """Notify users who recently chatted with this user about presence change.
        Lightweight — only fans out to users in active connections (no DB lookup).
        """
        payload = {"type": "presence", "user_id": user_id, "online": online}
        if last_seen:
            payload["last_seen"] = last_seen
        await self._broadcast_local(payload, exclude_user=user_id)
        await self._publish("*", payload, exclude_user_id=user_id)


hub = ChatHub()
