import { Platform } from "react-native";
import RNCallKeep, { AudioSessionCategoryOption, AudioSessionMode, CONSTANTS } from "react-native-callkeep";

const subscribers = new Set();
const knownCalls = new Map();
let initialized = false;
let initializing = null;
let listenersAttached = false;

function callKeepOptions(labels = {}) {
  return {
  ios: {
    appName: labels.appName || "Haraj Plus",
    supportsVideo: false,
    maximumCallGroups: "1",
    maximumCallsPerCallGroup: "1",
    includesCallsInRecents: true,
    audioSession: {
      categoryOptions: AudioSessionCategoryOption.allowBluetooth | AudioSessionCategoryOption.allowBluetoothA2DP | AudioSessionCategoryOption.defaultToSpeaker,
      mode: AudioSessionMode.voiceChat,
    },
  },
  android: {
    alertTitle: labels.alertTitle || "Call account permission",
    alertDescription: labels.alertDescription || "Haraj Plus needs permission to show and manage voice calls.",
    cancelButton: labels.cancelButton || "Cancel",
    okButton: labels.okButton || "Continue",
    additionalPermissions: [],
    foregroundService: {
      channelId: "harajplus_calls",
      channelName: labels.channelName || "Voice calls",
      notificationTitle: labels.notificationTitle || "A Haraj Plus voice call is active",
    },
  },
  };
}

function emit(event) {
  for (const callback of subscribers) {
    try { callback(event); } catch (_) {}
  }
}

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  RNCallKeep.addEventListener("answerCall", ({ callUUID }) => emit({ type: "answer", callId: callUUID, call: knownCalls.get(callUUID) }));
  RNCallKeep.addEventListener("endCall", ({ callUUID }) => emit({ type: "end", callId: callUUID, call: knownCalls.get(callUUID) }));
  RNCallKeep.addEventListener("didPerformSetMutedCallAction", ({ callUUID, muted }) => emit({ type: "mute", callId: callUUID, muted, call: knownCalls.get(callUUID) }));
  RNCallKeep.addEventListener("didResetProvider", () => {
    for (const [callId, call] of knownCalls.entries()) emit({ type: "reset", callId, call });
    knownCalls.clear();
  });
}

export async function ensureNativeCallSystem(labels = {}) {
  if (initialized) return true;
  if (!initializing) {
    initializing = RNCallKeep.setup(callKeepOptions(labels))
      .then(() => {
        initialized = true;
        attachListeners();
        if (Platform.OS === "android") RNCallKeep.setAvailable(true);
        return true;
      })
      .catch(() => false)
      .finally(() => { initializing = null; });
  }
  return initializing;
}

export function subscribeNativeCallEvents(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export async function showIncomingNativeCall({ callId, callerName, handle = "Haraj Plus", payload = {}, labels = {} }) {
  if (!callId || !(await ensureNativeCallSystem(labels))) return false;
  knownCalls.set(callId, { direction: "incoming", callerName, handle, payload });
  try {
    RNCallKeep.displayIncomingCall(callId, handle, callerName || "Haraj Plus", "generic", false, { payload });
    return true;
  } catch (_) {
    knownCalls.delete(callId);
    return false;
  }
}

export async function showOutgoingNativeCall({ callId, calleeName, handle = "Haraj Plus", labels = {} }) {
  if (!callId || !(await ensureNativeCallSystem(labels))) return false;
  knownCalls.set(callId, { direction: "outgoing", callerName: calleeName, handle });
  try {
    RNCallKeep.startCall(callId, handle, calleeName || handle, "generic", false);
    if (Platform.OS === "ios") RNCallKeep.reportConnectingOutgoingCallWithUUID(callId);
    return true;
  } catch (_) {
    knownCalls.delete(callId);
    return false;
  }
}

export function markNativeCallConnected(callId) {
  if (!callId) return;
  try {
    if (Platform.OS === "android") RNCallKeep.setCurrentCallActive(callId);
    else RNCallKeep.reportConnectedOutgoingCallWithUUID(callId);
  } catch (_) {}
}

export function endNativeCall(callId, reason = "remote") {
  if (!callId) return;
  try {
    if (reason === "local") RNCallKeep.endCall(callId);
    else RNCallKeep.reportEndCallWithUUID(callId, reason === "failed" ? CONSTANTS.END_CALL_REASONS.FAILED : CONSTANTS.END_CALL_REASONS.REMOTE_ENDED);
  } catch (_) {}
  knownCalls.delete(callId);
}

export function setNativeCallMuted(callId, muted) {
  if (!callId || Platform.OS !== "ios") return;
  try { RNCallKeep.setMutedCall(callId, muted); } catch (_) {}
}

export function setNativeCallSpeaker(callId, speakerEnabled) {
  if (!callId) return;
  // CallKeep maps this to the platform route on Android and iOS when the
  // native integration exposes it; expo-audio applies the same route request
  // from the call screen as a compatible fallback.
  try { RNCallKeep.toggleAudioRouteSpeaker(callId, speakerEnabled); } catch (_) {}
}
