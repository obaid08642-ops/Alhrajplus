# Phase 6 Render Redeploy Verification

Render now exposes both `GET /api/voice/calls` and `GET /api/voice/ice-servers` in its public OpenAPI document. This confirms that the Phase 6 Backend revision is deployed after the user's manual Render deployment.

The visible warning, "بعض الشبكات تحتاج TURN relay...", is not a server crash. The clients display it only when the authenticated ICE endpoint reports `relay_configured=false`, which means the environment has no valid TURN entries in `TURN_ICE_SERVERS_JSON`. STUN can discover public endpoints for direct peer-to-peer media but cannot reliably relay audio through restrictive NATs or firewalls.

No anonymous request can safely inspect TURN credentials, and none were exposed during this check.
