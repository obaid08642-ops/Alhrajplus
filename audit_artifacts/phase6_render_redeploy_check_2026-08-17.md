# Phase 6 Render Redeploy Verification

Render now exposes both `GET /api/voice/calls` and `GET /api/voice/ice-servers` in its public OpenAPI document. This confirms that the Phase 6 Backend revision is deployed after the user's manual Render deployment.

The visible warning, "بعض الشبكات تحتاج TURN relay...", is not a server crash. The clients display it only when the authenticated ICE endpoint reports `relay_configured=false`, which means the environment has no valid TURN entries in `TURN_ICE_SERVERS_JSON`. STUN can discover public endpoints for direct peer-to-peer media but cannot reliably relay audio through restrictive NATs or firewalls.

No anonymous request can safely inspect TURN credentials, and none were exposed during this check.

## User redeploy follow-up

After the user confirmed a new Render deployment, `GET /health` returned `{"status":"ok","service":"haraj-plus-backend"}`. Browser extraction of the public OpenAPI completed successfully and the deployed schema includes the voice-call and ICE routes.

The public bare call-page path can still resolve to the old CDN representation. The Mobile WebView does not use that bare route; it uses the versioned route introduced in commit `0d798f3`. A public visual check of that versioned URL confirmed the current full-screen RTL interface and all three controls: mute, speaker output, and end call.
