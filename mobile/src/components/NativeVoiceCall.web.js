import VoiceCallWebView from "./VoiceCallWebView";

// The Phase 5 proof targets real iOS/Android builds. The web export retains the
// existing browser call implementation so Metro never loads native WebRTC code
// into a web bundle.
export default function NativeVoiceCallWeb({ signalingEvents = [], ...props }) {
  const signalingEvent = [...signalingEvents].reverse().find(event => event?.type === "call_offer") || null;
  return <VoiceCallWebView {...props} signalingEvent={signalingEvent} />;
}
