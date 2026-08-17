# Free TURN options research

## Metered Open Relay
Source: https://www.metered.ca/tools/openrelay/

The official page states Open Relay provides both STUN and TURN, supports ports 80 and 443, TCP and UDP, TLS, and 20 GB of free TURN usage each month. It requires a free account and credentials. This is a third-party managed TURN service; Render remains the signaling/API host.

## Cloudflare Realtime TURN
Source: https://developers.cloudflare.com/realtime/turn/

Cloudflare documents a managed TURN service separate from SFU. It is free of charge when used together with Cloudflare Realtime SFU; otherwise TURN egress is billed at $0.05 per GB. It provides TURN over UDP/TCP/TLS with alternate ports. This does not satisfy a strict no-external-provider requirement unless the SFU path and applicable free terms are accepted.

## Recommendation

For a strictly free first deployment, keep Render signaling plus direct WebRTC STUN and optionally add Open Relay credentials as a guarded fallback with a monthly data cap. This improves restrictive-network connectivity without requiring a VPS. It is not mathematically free/unlimited: the free quota is limited and credentials must be protected by the backend. If no external TURN is allowed, Render-only STUN remains the only option and cannot guarantee every NAT/firewall.
