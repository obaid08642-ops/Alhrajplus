# TURN and Render findings

## Render WebSockets
Source: https://render.com/docs/websocket

Render documents that public internet traffic can reach a Render web service through inbound WebSocket connections. The public service is routed through the service's HTTP-facing port. This supports the Alhrajplus FastAPI signaling channel.

## WebRTC TURN
Source: https://webrtc.org/getting-started/turn-server

WebRTC's official guide states that a server is required for relaying traffic in many applications because direct peer connections are not always possible. TURN relays the media traffic and is configured in `RTCPeerConnection` through `iceServers` with a TURN URL, username, and credential. Options include self-hosted open-source coturn or cloud TURN services.

## Conclusion for Alhrajplus

Render can host the HTTP/WebSocket signaling service, but the current public Render Web Service is not a suitable single-service replacement for a dedicated TURN relay with the required UDP/TCP relay ports and bandwidth handling. A STUN-only design remains free and works when direct ICE succeeds, but cannot guarantee every restrictive NAT. Reliable universal calling needs a separately reachable TURN relay (self-hosted coturn on a VM/VPS or a cloud TURN provider), which may be free only within a limited quota or may incur usage charges.
