"""Lightweight LLM shim with dual-mode support.

Why this exists
---------------
The `emergentintegrations` package lives on a private CloudFront index, which
makes production Docker builds fail when they only have access to public PyPI.

This shim transparently uses whichever backend is available:

* **Preview / dev pods** (where `emergentintegrations` is pre-installed):
  re-export its `LlmChat / UserMessage / ImageContent` directly. The Emergent
  LLM key (`sk-emergent-...`) continues to work as before.

* **Production / CI** (where the package is missing): fall back to the public
  `google-genai` SDK. In that case `EMERGENT_LLM_KEY` must point to a real
  Gemini API key from https://aistudio.google.com/ (free).

Public API mirrored
-------------------
    chat = LlmChat(api_key=..., session_id=..., system_message=...)
           .with_model("gemini", "gemini-2.5-flash")
    img  = ImageContent(image_base64="...")
    msg  = UserMessage(text="...", file_contents=[img])
    reply: str = await chat.send_message(msg)
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# Try the Emergent package first — keeps `sk-emergent-...` keys working
# whenever the package is available in the runtime.
_USING_EMERGENT = False
try:
    from emergentintegrations.llm.chat import (  # type: ignore
        LlmChat as _EmergentLlmChat,
        UserMessage as _EmergentUserMessage,
        ImageContent as _EmergentImageContent,
    )
    LlmChat = _EmergentLlmChat
    UserMessage = _EmergentUserMessage
    ImageContent = _EmergentImageContent
    _USING_EMERGENT = True
    logger.info("[llm_shim] Using emergentintegrations backend")
except Exception as _e:
    logger.info("[llm_shim] emergentintegrations unavailable (%s); using google-genai fallback", _e)

if not _USING_EMERGENT:
    # -------- google-genai fallback --------
    import asyncio
    import base64
    from typing import List, Optional

    from google import genai
    from google.genai import types as genai_types

    class ImageContent:  # type: ignore[no-redef]
        """Wraps a base64-encoded image so it can be passed to `send_message`."""

        def __init__(self, image_base64: str, mime_type: str = "image/jpeg"):
            if image_base64.startswith("data:"):
                try:
                    head, image_base64 = image_base64.split(",", 1)
                    if ";" in head:
                        mime_type = head.split(":", 1)[1].split(";", 1)[0] or mime_type
                except ValueError:
                    pass
            self.image_base64 = image_base64
            self.mime_type = mime_type

    class UserMessage:  # type: ignore[no-redef]
        """A single turn from the user. May include image attachments."""

        def __init__(self, text: str = "", file_contents: Optional[List[ImageContent]] = None):
            self.text = text or ""
            self.file_contents = file_contents or []

    class LlmChat:  # type: ignore[no-redef]
        """Drop-in replacement for the subset of `emergentintegrations.llm.chat.LlmChat`
        actually used in this codebase."""

        def __init__(self, api_key: str, session_id: str = "", system_message: str = ""):
            if not api_key:
                raise ValueError("LlmChat: api_key is required")
            if api_key.startswith("sk-emergent-"):
                # User is on production without emergentintegrations but with an
                # Emergent proxy key — clearly explain how to fix.
                raise RuntimeError(
                    "EMERGENT_LLM_KEY (sk-emergent-...) requires the emergentintegrations "
                    "package, which is unavailable in this environment. Either:\n"
                    "  1) Install emergentintegrations in your Docker image, OR\n"
                    "  2) Set GEMINI_API_KEY to a real key from https://aistudio.google.com/"
                )
            self.api_key = api_key
            self.session_id = session_id
            self.system_message = system_message or ""
            self._provider = "gemini"
            self._model_name = "gemini-2.5-flash"
            self._client: Optional[genai.Client] = None
            self._history: List[genai_types.Content] = []

        def with_model(self, provider: str, model: str) -> "LlmChat":
            if (provider or "").lower() not in ("gemini", "google"):
                logger.warning(
                    "LlmChat shim: provider %r unsupported in fallback mode; using gemini",
                    provider,
                )
            if model:
                self._model_name = model
            return self

        def _ensure_client(self) -> genai.Client:
            if self._client is None:
                self._client = genai.Client(api_key=self.api_key)
            return self._client

        def _build_parts(self, msg: UserMessage) -> List[genai_types.Part]:
            parts: List[genai_types.Part] = []
            if msg.text:
                parts.append(genai_types.Part.from_text(text=msg.text))
            for img in msg.file_contents or []:
                try:
                    data = base64.b64decode(img.image_base64)
                except Exception as e:
                    logger.warning("LlmChat shim: bad base64 image skipped: %s", e)
                    continue
                parts.append(
                    genai_types.Part.from_bytes(
                        data=data,
                        mime_type=img.mime_type or "image/jpeg",
                    )
                )
            return parts

        async def send_message(self, msg: UserMessage) -> str:
            client = self._ensure_client()
            user_parts = self._build_parts(msg)
            if not user_parts:
                return ""
            user_content = genai_types.Content(role="user", parts=user_parts)
            contents = list(self._history) + [user_content]
            config = genai_types.GenerateContentConfig(
                system_instruction=self.system_message or None,
            )

            def _do_call() -> str:
                resp = client.models.generate_content(
                    model=self._model_name,
                    contents=contents,
                    config=config,
                )
                if getattr(resp, "text", None):
                    return resp.text
                try:
                    cand = resp.candidates[0]
                    parts = cand.content.parts or []
                    return "".join((p.text or "") for p in parts if hasattr(p, "text"))
                except Exception:
                    return ""

            text = await asyncio.to_thread(_do_call)
            self._history.append(user_content)
            if text:
                self._history.append(
                    genai_types.Content(
                        role="model",
                        parts=[genai_types.Part.from_text(text=text)],
                    )
                )
            return text or ""
