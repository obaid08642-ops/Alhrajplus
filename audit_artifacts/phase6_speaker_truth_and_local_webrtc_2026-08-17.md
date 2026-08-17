# Phase 6 — Speaker Control Truth Audit and Local WebRTC Check

## Findings

The prior Web speaker control was not valid in the sandbox browser: `HTMLMediaElement.setSinkId` and `navigator.mediaDevices.selectAudioOutput` were both unavailable, and no audio-output devices were exposed. The old control therefore could only change local interface state; it could not establish a speaker route. This was a real defect.

The control has been corrected rather than cosmetically retained. On Web, the output button is rendered only when `HTMLMediaElement.setSinkId` exists. When rendered, it invokes `setSinkId` and surfaces an error if the selected output route is rejected. On Mobile, Android alone receives the button and maps it to Expo Audio's native `shouldRouteThroughEarpiece` setting. iOS/WebView does not receive this control because this project has no native route-selection API for it.

## Local WebRTC check

Two independent `RTCPeerConnection` instances were created in Chromium, linked with locally exchanged ICE candidates, and connected through a data channel. The result was `datachannel-open`, with both connection states reported as `connected`. This confirms that the browser supports the WebRTC offer/answer and ICE connection lifecycle used by the call implementation.

## Visual verification

The first visual check exposed a CSS issue: the call page's flex control rule overrode the HTML `hidden` attribute, so the unsupported speaker button was still visible. A `.control[hidden]{display:none!important}` rule was added. The second visual check showed only the mute and end-call controls in the unsupported environment, as required.

## Remaining boundary

This proves neither physical speaker hardware routing nor bidirectional microphone audio between two independent user devices. Android routing is implemented through the documented installed Expo Audio option and must still be verified on an actual Android device. Reliable cross-network calls still require TURN whenever direct STUN traversal fails.

## Publication check

The capability-aware control fix was pushed to both `main` and `production-readiness-premium` at `b882f8f`. Vercel completed successfully. A public visual smoke check of the Mobile WebView's current versioned page (`v=phase6_call_ui_3`) showed only the mute and end-call controls in the unsupported Chromium environment; the speaker control did not render.
