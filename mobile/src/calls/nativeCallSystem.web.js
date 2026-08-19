// Browser builds keep their existing call surface. Native CallKit/ConnectionService
// APIs are intentionally unavailable on the web target.
export async function ensureNativeCallSystem() { return false; }
export function subscribeNativeCallEvents() { return () => {}; }
export async function showIncomingNativeCall() { return false; }
export async function showOutgoingNativeCall() { return false; }
export function markNativeCallConnected() {}
export function endNativeCall() {}
export function setNativeCallMuted() {}
export function setNativeCallSpeaker() {}
