"""Provider-agnostic AI orchestration for Alhrajplus.

The module deliberately keeps provider secrets server-side. It supports a
Gemini/LlmChat adapter and generic OpenAI-compatible chat endpoints configured
through environment variables. MongoDB is used only for usage/audit events;
provider configuration remains environment-controlled until the Admin UI is
connected to a secure configuration store.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

logger = logging.getLogger("haraj_plus.ai")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _bool(value: str, default: bool = True) -> bool:
    if value == "":
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


@dataclass(frozen=True)
class ProviderSpec:
    name: str
    kind: str
    model: str
    api_key: str
    base_url: str = ""
    enabled: bool = True
    weight: int = 1
    daily_limit: int = 0
    monthly_limit: int = 0
    rpm_limit: int = 0
    rpd_limit: int = 0
    tpm_limit: int = 0

    @property
    def configured(self) -> bool:
        return bool(self.api_key)


def load_provider_specs() -> list[ProviderSpec]:
    """Load ordered providers from AI_PROVIDER_ORDER and provider env vars.

    Example:
      AI_PROVIDER_ORDER=gemini,grok
      GEMINI_API_KEY=...
      GROK_API_KEY=...
      GROK_BASE_URL=https://api.x.ai/v1
      GROK_MODEL=grok-3-mini

    A missing key disables a provider instead of crashing the server.
    """
    order = [x.strip().lower() for x in os.getenv("AI_PROVIDER_ORDER", "gemini").split(",") if x.strip()]
    specs: list[ProviderSpec] = []
    for name in order:
        prefix = name.upper().replace("-", "_")
        kind = os.getenv(f"{prefix}_AI_KIND", "gemini" if name == "gemini" else "openai_compatible").strip().lower()
        key = os.getenv(f"{prefix}_API_KEY", "").strip()
        if name == "gemini" and not key:
            key = os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("EMERGENT_LLM_KEY", "").strip()
        model = os.getenv(f"{prefix}_MODEL", "gemini-2.5-flash" if name == "gemini" else "").strip()
        base = os.getenv(f"{prefix}_BASE_URL", "").strip().rstrip("/")
        enabled = _bool(os.getenv(f"{prefix}_ENABLED", "1"), True)
        try:
            weight = max(1, min(int(os.getenv(f"{prefix}_WEIGHT", "1")), 100))
        except ValueError:
            weight = 1
        try:
            daily = max(0, int(os.getenv(f"{prefix}_DAILY_LIMIT", "0")))
        except ValueError:
            daily = 0
        def _limit(suffix: str) -> int:
            try:
                return max(0, int(os.getenv(f"{prefix}_{suffix}", "0")))
            except ValueError:
                return 0
        specs.append(ProviderSpec(name, kind, model, key, base, enabled, weight, daily,
                                  _limit("MONTHLY_LIMIT"), _limit("RPM_LIMIT"),
                                  _limit("RPD_LIMIT"), _limit("TPM_LIMIT")))
    return specs


class AIOrchestrator:
    def __init__(self, db):
        self.db = db
        self._cursor = 0
        self._lock = asyncio.Lock()

    async def _admin_config(self) -> dict:
        try:
            return await self.db.ai_config.find_one({"id": "default"}, {"_id": 0}) or {}
        except Exception:
            return {}

    async def _ordered(self) -> list[ProviderSpec]:
        configured = load_provider_specs()
        override = await self._admin_config()
        provider_overrides = override.get("providers") or {}
        specs: list[ProviderSpec] = []
        for item in configured:
            patch = provider_overrides.get(item.name) or {}
            enabled = bool(patch.get("enabled", item.enabled))
            if not enabled or not item.configured:
                continue
            specs.append(ProviderSpec(
                name=item.name, kind=item.kind, model=item.model, api_key=item.api_key,
                base_url=item.base_url, enabled=True,
                weight=max(1, min(int(patch.get("weight", item.weight) or 1), 100)),
                daily_limit=max(0, int(patch.get("daily_limit", item.daily_limit) or 0)),
                monthly_limit=max(0, int(patch.get("monthly_limit", item.monthly_limit) or 0)),
                rpm_limit=max(0, int(patch.get("rpm_limit", item.rpm_limit) or 0)),
                rpd_limit=max(0, int(patch.get("rpd_limit", item.rpd_limit) or 0)),
                tpm_limit=max(0, int(patch.get("tpm_limit", item.tpm_limit) or 0)),
            ))
        order = [str(x).strip().lower() for x in (override.get("order") or []) if str(x).strip()]
        if order:
            rank = {name: idx for idx, name in enumerate(order)}
            specs.sort(key=lambda x: (rank.get(x.name, len(rank)), x.name))
        mode = str(override.get("mode") or "automatic").lower()
        primary = str(override.get("primary") or "").strip().lower()
        if mode == "manual" and primary in {x.name for x in specs}:
            specs.sort(key=lambda x: (0 if x.name == primary else 1, order.index(x.name) if x.name in order else 999, x.name))
        if not bool(override.get("rotation_enabled", True)) and specs:
            specs = specs[:1]
        if not specs:
            return []
        async with self._lock:
            start = self._cursor % len(specs)
            self._cursor = (self._cursor + 1) % len(specs)
        if str(override.get("mode") or "automatic").lower() == "priority" or not bool(override.get("rotation_enabled", True)):
            return specs
        return specs[start:] + specs[:start]

    async def _record(self, request_id: str, operation: str, provider: ProviderSpec,
                      *, status: str, started: float, prompt_tokens: int = 0,
                      completion_tokens: int = 0, error: str | None = None):
        duration_ms = int((time.monotonic() - started) * 1000)
        event = {
            "id": str(uuid.uuid4()), "request_id": request_id,
            "operation": operation, "provider": provider.name,
            "model": provider.model, "status": status,
            "prompt_tokens": int(prompt_tokens or 0),
            "completion_tokens": int(completion_tokens or 0),
            "total_tokens": int((prompt_tokens or 0) + (completion_tokens or 0)),
            "duration_ms": duration_ms, "error": (error or "")[:500] or None,
            "created_at": _now(),
            "error_type": (error or "").split(":", 1)[0][:80] or None,
        }
        try:
            await self.db.ai_usage_events.insert_one(event)
            await self.db.ai_provider_daily.update_one(
                {"provider": provider.name, "day": event["created_at"][:10]},
                {"$inc": {"requests": 1, "total_tokens": event["total_tokens"],
                          "prompt_tokens": event["prompt_tokens"], "completion_tokens": event["completion_tokens"],
                          "errors": 1 if status != "success" else 0},
                 "$set": {"last_status": status, "last_error": event["error"], "updated_at": event["created_at"]}},
                upsert=True,
            )
        except Exception as exc:
            logger.warning("AI usage logging failed: %s", exc)

    async def _gemini(self, provider: ProviderSpec, prompt: str, image_base64: str | None = None) -> tuple[str, int, int]:
        from llm_shim import LlmChat, UserMessage, ImageContent
        chat = LlmChat(api_key=provider.api_key, session_id=f"ai-{uuid.uuid4().hex[:12]}", system_message="You are a concise marketplace assistant.").with_model("gemini", provider.model)
        contents = []
        if image_base64:
            contents.append(ImageContent(image_base64=image_base64))
        reply = await chat.send_message(UserMessage(text=prompt, file_contents=contents))
        return (reply or "").strip(), 0, 0

    async def _openai_compatible(self, provider: ProviderSpec, prompt: str, image_base64: str | None = None) -> tuple[str, int, int]:
        if not provider.base_url or not provider.model:
            raise RuntimeError(f"provider {provider.name} requires BASE_URL and MODEL")
        content: Any = prompt
        if image_base64:
            if not image_base64.startswith("data:"):
                image_base64 = "data:image/jpeg;base64," + image_base64
            content = [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": image_base64}}]
        payload = {"model": provider.model, "messages": [{"role": "user", "content": content}], "temperature": 0.1}
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            response = await client.post(provider.base_url + "/chat/completions", headers={"Authorization": f"Bearer {provider.api_key}", "Content-Type": "application/json"}, json=payload)
            response.raise_for_status()
            data = response.json()
        choice = ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        usage = data.get("usage") or {}
        return str(choice).strip(), int(usage.get("prompt_tokens") or 0), int(usage.get("completion_tokens") or 0)

    async def text(self, operation: str, prompt: str, *, image_base64: str | None = None) -> dict[str, Any]:
        request_id = str(uuid.uuid4())
        attempts: list[dict[str, Any]] = []
        override = await self._admin_config()
        providers = await self._ordered()
        if not providers:
            raise RuntimeError("No configured AI provider")
        max_attempts = max(1, min(int(override.get("max_attempts", len(providers)) or len(providers)), len(providers)))
        fallback_enabled = bool(override.get("fallback_enabled", True))
        quota_threshold = max(0.0, min(float(override.get("quota_threshold_pct", 100) or 100), 100.0))
        for provider in providers[:max_attempts]:
            today = _now()[:10]
            usage = await self.db.ai_provider_daily.find_one({"provider": provider.name, "day": today}, {"_id": 0}) or {}
            limit = provider.daily_limit or provider.rpd_limit
            if limit and (float(usage.get("requests", 0)) / limit * 100) >= quota_threshold:
                await self._record(request_id, operation, provider, status="quota_skipped", started=time.monotonic(), error="quota_threshold")
                continue
            started = time.monotonic()
            try:
                if provider.kind == "gemini":
                    text, pt, ct = await self._gemini(provider, prompt, image_base64)
                else:
                    text, pt, ct = await self._openai_compatible(provider, prompt, image_base64)
                if not text:
                    raise RuntimeError("empty provider response")
                await self._record(request_id, operation, provider, status="success", started=started, prompt_tokens=pt, completion_tokens=ct)
                return {"request_id": request_id, "provider": provider.name, "model": provider.model, "text": text, "attempts": attempts + [{"provider": provider.name, "status": "success"}], "fallback": bool(attempts), "original_provider": attempts[0]["provider"] if attempts else provider.name}
            except Exception as exc:
                message = str(exc)
                attempts.append({"provider": provider.name, "status": "failed", "error": message[:300]})
                await self._record(request_id, operation, provider, status="failed", started=started, error=message)
                logger.warning("AI provider %s failed for %s: %s", provider.name, operation, message)
                if not fallback_enabled:
                    break
        raise RuntimeError(json.dumps({"request_id": request_id, "attempts": attempts}, ensure_ascii=False))

    async def status(self) -> list[dict[str, Any]]:
        specs = load_provider_specs()
        override = await self._admin_config()
        provider_overrides = override.get("providers") or {}
        today = _now()[:10]
        rows = []
        for p in specs:
            daily = await self.db.ai_provider_daily.find_one({"provider": p.name, "day": today}, {"_id": 0}) or {}
            patch = provider_overrides.get(p.name) or {}
            daily_limit = int(patch.get("daily_limit", p.daily_limit) or p.daily_limit)
            requests = int(daily.get("requests", 0) or 0)
            errors = int(daily.get("errors", 0) or 0)
            rows.append({"name": p.name, "kind": p.kind, "model": p.model, "enabled": bool(patch.get("enabled", p.enabled)),
                         "configured": p.configured, "weight": int(patch.get("weight", p.weight) or p.weight),
                         "daily_limit": daily_limit, "monthly_limit": int(patch.get("monthly_limit", p.monthly_limit) or p.monthly_limit),
                         "rpm_limit": int(patch.get("rpm_limit", p.rpm_limit) or p.rpm_limit), "rpd_limit": int(patch.get("rpd_limit", p.rpd_limit) or p.rpd_limit),
                         "tpm_limit": int(patch.get("tpm_limit", p.tpm_limit) or p.tpm_limit), "requests": requests,
                         "remaining_requests": max(0, daily_limit - requests) if daily_limit else None,
                         "total_tokens": daily.get("total_tokens", 0), "errors": errors,
                         "failure_rate": round(errors / requests, 4) if requests else 0.0,
                         "last_status": daily.get("last_status"), "last_error": daily.get("last_error"),
                         "health": "healthy" if daily.get("last_status") == "success" else ("degraded" if daily.get("last_status") else "unknown")})
        return rows
