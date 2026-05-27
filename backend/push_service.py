"""
Unified Push Notifications module.

Supports two delivery channels:
  * Expo  — mobile (iOS/Android) via Expo Push Service.
  * Web   — desktop/mobile browsers via VAPID Web Push (RFC 8030).

The send_push_to_users() helper fans out to both based on the tokens stored
for each user, so callers never need to think about which channel a user has.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import base64
from typing import Iterable, Optional

import httpx
from pywebpush import webpush, WebPushException

logger = logging.getLogger("haraj_plus.push")

EXPO_API = "https://exp.host/--/api/v2/push/send"
EXPO_ACCESS_TOKEN = os.environ.get("EXPO_ACCESS_TOKEN", "").strip()
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "").strip()
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "").replace("\\n", "\n").strip()
VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@alhrajplus.com").strip()


# ---------- Expo ----------
async def _send_expo(tokens: list[str], title: str, body: str, data: dict, image: Optional[str] = None) -> int:
    if not tokens:
        return 0
    # Expo accepts up to 100 messages per request.
    sent = 0
    chunks = [tokens[i : i + 100] for i in range(0, len(tokens), 100)]
    # Build headers — include Authorization with EXPO_ACCESS_TOKEN when set
    # (required for enhanced security project tokens; ignored on public projects).
    expo_headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if EXPO_ACCESS_TOKEN:
        expo_headers["Authorization"] = f"Bearer {EXPO_ACCESS_TOKEN}"
    for chunk in chunks:
        def _msg(t):
            m = {
                "to": t,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data,
                "priority": "high",
                "channelId": "default",
            }
            if image:
                # iOS rich notifications (mutable-content + attachment) + Android big-picture.
                m["richContent"] = {"image": image}
                m["mutableContent"] = True
            return m
        messages = [_msg(t) for t in chunk]
        try:
            async with httpx.AsyncClient(timeout=15.0) as cx:
                await cx.post(EXPO_API, json=messages, headers=expo_headers)
            sent += len(chunk)
        except Exception as e:
            logger.warning(f"[push.expo] {e}")
    return sent


# ---------- Web Push (VAPID) ----------
def _send_web_sync(subscription: dict, payload: dict) -> bool:
    """Synchronous webpush call — runs in a worker thread."""
    if not (VAPID_PRIVATE_KEY and VAPID_CLAIM_EMAIL):
        return False
    try:
        webpush(
            subscription_info=subscription,
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIM_EMAIL},
            ttl=86400,
        )
        return True
    except WebPushException as e:
        # 410 / 404 → subscription expired; caller should remove from DB
        sc = getattr(e.response, "status_code", None)
        if sc in (404, 410):
            raise _WebPushGone() from e
        logger.warning(f"[push.web] {e}")
        return False
    except Exception as e:
        logger.warning(f"[push.web] {e}")
        return False


class _WebPushGone(Exception):
    pass


async def _send_web(subscriptions: list[dict], payload: dict, on_gone=None) -> int:
    sent = 0
    for sub in subscriptions:
        if not sub or "endpoint" not in sub:
            continue
        try:
            ok = await asyncio.to_thread(_send_web_sync, sub, payload)
            if ok:
                sent += 1
        except _WebPushGone:
            if on_gone:
                try:
                    await on_gone(sub.get("endpoint"))
                except Exception:
                    pass
    return sent


# ---------- Unified ----------
async def send_push_to_users(
    db,
    user_ids: Iterable[str],
    *,
    title: str,
    body: str,
    url: str = "",
    data: Optional[dict] = None,
    pref_key: Optional[str] = None,
    image: Optional[str] = None,
) -> dict:
    """Fan out push to every Expo + Web token registered for the given users.

    `pref_key`: if set, users whose `notification_prefs.<pref_key>` is `False`
    will be skipped. Defaults: all prefs True.
    `url`: deep-link target. Web service-worker uses it on notification click;
    mobile clients should read it from `data.url`.
    `image`: optional HTTPS image URL — Expo supports it via `richContent.image`,
    web push relays it through `data.image` so the SW can render it.
    """
    uids = [u for u in {*user_ids} if u]
    if not uids:
        return {"expo": 0, "web": 0}

    if pref_key:
        # Filter out users who opted out
        opted_out = await db.users.find(
            {"id": {"$in": uids}, f"notification_prefs.{pref_key}": False},
            {"_id": 0, "id": 1},
        ).to_list(length=len(uids))
        if opted_out:
            blocked = {u["id"] for u in opted_out}
            uids = [u for u in uids if u not in blocked]
    if not uids:
        return {"expo": 0, "web": 0}

    payload_data = {**(data or {}), "url": url, "title": title, "body": body}
    if image:
        payload_data["image"] = image

    docs = await db.push_tokens.find(
        {"user_id": {"$in": uids}},
        {"_id": 0, "expo_token": 1, "web_subscription": 1, "kind": 1},
    ).to_list(length=10000)

    expo_tokens = [d["expo_token"] for d in docs if d.get("kind") == "expo" and d.get("expo_token")]
    web_subs = [d["web_subscription"] for d in docs if d.get("kind") == "web" and d.get("web_subscription")]

    async def _on_gone(endpoint: str):
        await db.push_tokens.delete_one({"kind": "web", "web_subscription.endpoint": endpoint})

    expo_sent, web_sent = await asyncio.gather(
        _send_expo(expo_tokens, title, body, payload_data, image=image),
        _send_web(web_subs, {"title": title, "body": body, "url": url, "image": image, "data": payload_data}, _on_gone),
    )
    return {"expo": expo_sent, "web": web_sent}


def generate_vapid_keys() -> dict:
    """One-off helper — run via `python -c 'from push_service import *; print(generate_vapid_keys())'`
    to get a fresh VAPID keypair for env configuration.
    """
    from py_vapid import Vapid01
    v = Vapid01()
    v.generate_keys()
    priv_pem = v.private_pem().decode()
    # Public key URL-safe base64 (used by the browser PushManager.subscribe)
    raw_pub = v.public_key.public_bytes(
        encoding=__import__("cryptography.hazmat.primitives.serialization", fromlist=["Encoding"]).Encoding.X962,
        format=__import__("cryptography.hazmat.primitives.serialization", fromlist=["PublicFormat"]).PublicFormat.UncompressedPoint,
    )
    pub_b64 = base64.urlsafe_b64encode(raw_pub).rstrip(b"=").decode()
    return {"public": pub_b64, "private_pem": priv_pem}
