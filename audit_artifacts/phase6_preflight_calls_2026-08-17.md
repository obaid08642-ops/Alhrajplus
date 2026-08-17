# Phase 6 Preflight — Calls and Real-Time Connectivity

## Current architecture

| Layer | Current implementation | Assessment |
|---|---|---|
| Signaling | Authenticated WebSocket endpoint `/api/ws/chat` forwards `call_invite`, `call_offer`, `call_answer`, `call_ice`, and `call_hangup`. | Present, but it relies on a parsable conversation ID rather than a persisted conversation, participant, block, country, or call-session verification. |
| Media | Browser Web uses native `RTCPeerConnection`; Mobile loads the same WebRTC page inside a WebView. | Direct audio P2P is implemented. It is not evidence of connection across restrictive NATs. |
| ICE | `/voice/ice-servers` serves Google STUN and conditionally exposes TURN configuration from the server environment to authenticated callers. | STUN-only is correctly disclosed to the user as potentially insufficient; no TURN configuration can be assumed. |
| Web lifecycle | Outgoing/incoming modal, microphone, mute, answer, hangup, ICE buffering, and peer connection state are present. | Missing server-authoritative call state/history, explicit reject, invitation expiry, ringing lifecycle, and reconnection policy. |
| Mobile lifecycle | A WebView receives signaling/token/ICE and loads the shared voice page. | Incoming calls are opened from an event but the current flow automatically prepares/answers after the offer; it lacks an explicit native accept/reject gate and consistent close/hangup signaling. |
| Background/cold start | No native CallKit/ConnectionService, VoIP push, or verified background execution path was found. | Cannot be claimed as supported until physical-device evidence and platform infrastructure are provided. |

## Confirmed Phase 6 gaps to close in code

| ID | Gap | Required correction |
|---|---|---|
| CALL-01 | Signaling accepts a syntactically valid `convo_id` without verifying the stored conversation, participant pair, block relation, active account countries, or target account. | Make the Backend resolve and authorize each call event before forwarding it. |
| CALL-02 | There is no durable call-session record or call history. | Persist call state with caller/callee/conversation/country/timestamps and expose only each participant's own history. |
| CALL-03 | The protocol has no explicit reject or invitation expiry. | Add `call_reject`, expiry/missed transition, and clean hangup handling. |
| CALL-04 | Mobile receiver is not gated by a native accept/reject UI. | Require an explicit accept before sending the WebView its media/signaling configuration; send a server-authorized reject on refusal. |
| CALL-05 | Notification routing does not explicitly cover incoming-call events. | Route call notifications to the exact conversation and retain its identifier for cold-start navigation. |
| CALL-06 | STUN-only connectivity and physical-device background behavior cannot be demonstrated in this sandbox. | Keep this as a post-code validation blocker; do not claim TURN, cross-NAT, or background-call support without real-device evidence. |

## Explicit non-claims

Render is suitable for HTTPS/WebSocket signaling only. It does not itself become a TURN relay, and no free STUN server can guarantee media connectivity through all NAT/firewall combinations. This phase will retain these claims as blocked until a TURN configuration and two-device tests are supplied.
