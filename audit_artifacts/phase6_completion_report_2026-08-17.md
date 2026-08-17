# Phase 6 — Calls and Real-Time Connectivity Completion Report

**Date:** 2026-08-17
**Status before publication:** **PASS WITH BLOCKERS**

## Implemented call architecture

| Area | Implementation completed |
|---|---|
| WebRTC signaling boundary | All call WebSocket events (`invite`, `offer`, `answer`, `ICE`, `reject`, and `hangup`) are now authorized by the Backend against the persisted two-party conversation rather than a client-controlled ID string. |
| Access and market safety | The authorization path validates both participants, active country consistency, conversation country, banned accounts, and mutual block policy before forwarding any signaling payload. |
| Call-session state | `call_sessions` persists caller, callee, conversation, country, timestamps, invite expiry, and lifecycle status. Only the authenticated participant may fetch their own country-scoped history through `GET /api/voice/calls`. |
| Lifecycle | Introduced explicit `call_reject`, 45-second invitation expiry, missed-call conversion, offer/answer/connected state transitions, durable end state, and server-side signal payload size guard (64 KiB). |
| ICE / TURN | Authenticated `/api/voice/ice-servers` continues to supply STUN and optional `TURN_ICE_SERVERS_JSON` configuration only when the environment provides it. Clients accurately disclose STUN-only limits rather than claiming a relay. |
| Web | The Web call modal has an explicit reject action for incoming calls, recognizes remote rejection, and preserves existing microphone, mute, answer, hangup, ICE buffering, and peer-state behavior. Incoming-call notifications resolve to the exact conversation. |
| Mobile | The React Native chat now presents a native accept/reject alert for incoming calls before loading the WebView media session, emits `call_reject` on refusal, retains a stable outgoing call ID, and sends a clean hangup when the session closes. The push resolver recognizes the canonical `route` payload field. |
| Storage performance | Added unique `call_sessions.id` plus participant/country/history and status/expiry indexes. |

## Automated validation

| Command or check | Result |
|---|---|
| `python3 -m compileall -q backend` | **PASS** |
| `pytest -q backend/tests/test_phase5_communication_notifications.py backend/tests/test_phase6_call_signaling.py` | **PASS — 7 tests** |
| Phase 6 backend test coverage | **PASS** — persisted conversation/pair enforcement, invalid caller rejection, callee-only explicit reject, durable terminal state, and participant/country-scoped history. |
| `CI=true npm test -- --watchAll=false` | **PASS — 4 suites, 15 tests** |
| Web incoming-call resolver test | **PASS** — `incoming_call` routes to `/chat` with the exact peer and conversation ID. |
| `npm run build` | **PASS** — production Web bundle compiled. |
| `npx expo export --platform all` | **PASS** — Web, Android, and iOS bundles exported. |

## Known external blockers

| Requirement | Status | Reason |
|---|---|---|
| App-to-App and Web-to-App media call across independent networks | **BLOCKED** | Two authenticated physical devices and independent network paths are unavailable in this sandbox. |
| TURN relay verification | **BLOCKED** | No TURN provider or configured `TURN_ICE_SERVERS_JSON` was available to test. STUN-only cannot guarantee traversal of all NAT/firewall configurations. |
| Background/closed-app incoming-call behavior | **BLOCKED** | Native CallKit/Android ConnectionService plus platform call/VoIP push credentials and real-device lifecycle evidence are required. Standard notification routing to the conversation is implemented, but it is not equivalent to OS-level incoming-call support. |
| Microphone permission, speaker routing, ringtone, reconnect, and network-switch evidence | **BLOCKED** | These require physical iOS/Android and browser devices with actual microphone/media permissions. |

## Publication record

The commit SHA, branches, and read-only post-deployment API verification will be appended after the Phase 6 publication step.

## Final assessment

The Phase 6 code, authorization boundary, history, lifecycle semantics, Web/Mobile integration, and automated build/test gates are complete. The result is **PASS WITH BLOCKERS** because the plan explicitly forbids marking calls fully proven without physical-device and TURN evidence.
