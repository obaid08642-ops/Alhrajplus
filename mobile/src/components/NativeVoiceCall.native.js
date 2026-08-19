import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react-native";
import { mediaDevices, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from "react-native-webrtc";
import { setAudioModeAsync } from "expo-audio";
import api from "../api";
import { useI18n } from "../I18nContext";
import {
  endNativeCall,
  markNativeCallConnected,
  setNativeCallMuted,
  setNativeCallSpeaker,
  showOutgoingNativeCall,
} from "../calls/nativeCallSystem";

const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

function signalPayload(type, to, convoId, callId, data = {}) {
  return { type, to, convo_id: convoId, call_id: callId, data };
}

/**
 * Native WebRTC audio-call proof of concept.
 *
 * It deliberately reuses the established authenticated chat-signaling contract
 * (`call_invite`, SDP offer/answer, ICE and hangup). Media stays peer-to-peer
 * with TURN fallback; the FastAPI service never sees the audio stream.
 */
export default function NativeVoiceCall({
  visible,
  role = "caller",
  to,
  convoId,
  callId,
  name,
  signalingEvents = [],
  onSignal,
  onClose,
}) {
  const { t } = useI18n();
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const pendingIceRef = useRef([]);
  const startedCallIdRef = useRef(null);
  const endedRef = useRef(false);
  const processedSignalsRef = useRef(new Set());
  const [peerReady, setPeerReady] = useState(false);
  const [state, setState] = useState("idle");
  const [muted, setMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [relayConfigured, setRelayConfigured] = useState(null);
  const nativeCallLabels = useMemo(() => ({
    appName: "Haraj Plus",
    alertTitle: t("إذن حساب الاتصال"),
    alertDescription: t("يحتاج الحراج بلس إذنًا لإظهار وإدارة المكالمات الصوتية الواردة."),
    cancelButton: t("إلغاء"),
    okButton: t("متابعة"),
    channelName: t("المكالمات الصوتية"),
    notificationTitle: t("مكالمة صوتية جارية في الحراج بلس"),
  }), [t]);

  const emit = useCallback((type, data = {}) => {
    if (!to || !convoId || !callId) return;
    onSignal?.(signalPayload(type, to, convoId, callId, data));
  }, [callId, convoId, onSignal, to]);

  const stopMedia = useCallback(() => {
    try { streamRef.current?.getTracks?.().forEach(track => track.stop()); } catch (_) {}
    streamRef.current = null;
    try { peerRef.current?.close?.(); } catch (_) {}
    peerRef.current = null;
    pendingIceRef.current = [];
    setPeerReady(false);
  }, []);

  const resetAudioMode = useCallback(() => {
    setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      ...(Platform.OS === "android" ? { shouldRouteThroughEarpiece: false } : {}),
    }).catch(() => {});
  }, []);

  const closeLocal = useCallback((notify = true) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (notify) emit("call_hangup");
    endNativeCall(callId, notify ? "local" : "remote");
    stopMedia();
    resetAudioMode();
    setState("ended");
    onClose?.({ signalAlreadySent: notify });
  }, [callId, emit, onClose, resetAudioMode, stopMedia]);

  const flushPendingIce = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer?.remoteDescription) return;
    while (pendingIceRef.current.length) {
      const candidate = pendingIceRef.current.shift();
      try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
    }
  }, []);

  const acceptOffer = useCallback(async (offer) => {
    const peer = peerRef.current;
    if (!peer || !offer || role !== "receiver" || peer.remoteDescription) return;
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIce();
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      emit("call_answer", peer.localDescription);
      setState("connecting");
    } catch (_) {
      setState("failed");
    }
  }, [emit, flushPendingIce, role]);

  const consumeSignal = useCallback(async (event) => {
    if (!event || event.call_id !== callId) return false;
    const peer = peerRef.current;
    if (!peer) return false;
    if (event.type === "call_offer") {
      await acceptOffer(event.data);
      return true;
    }
    if (event.type === "call_answer" && role === "caller" && !peer.remoteDescription) {
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(event.data));
        await flushPendingIce();
        setState("connecting");
      } catch (_) { setState("failed"); }
      return true;
    }
    if (event.type === "call_ice" && event.data) {
      if (!peer.remoteDescription) pendingIceRef.current.push(event.data);
      else {
        try { await peer.addIceCandidate(new RTCIceCandidate(event.data)); } catch (_) {}
      }
      return true;
    }
    if (event.type === "call_reject") {
      closeLocal(false);
      return true;
    }
    if (event.type === "call_hangup") {
      closeLocal(false);
      return true;
    }
    // An invitation is a session announcement; the SDP offer follows on the
    // same authenticated channel and is handled by the next queued signal.
    return true;
  }, [acceptOffer, callId, closeLocal, flushPendingIce, role]);

  useEffect(() => {
    if (!visible || !peerReady) return undefined;
    let cancelled = false;
    (async () => {
      for (const event of signalingEvents) {
        if (cancelled || !event || event.call_id !== callId) continue;
        const key = event._nativeSignalId || `${event.type}:${event.call_id}:${JSON.stringify(event.data || {})}`;
        if (processedSignalsRef.current.has(key)) continue;
        const consumed = await consumeSignal(event);
        if (consumed) processedSignalsRef.current.add(key);
      }
    })();
    return () => { cancelled = true; };
  }, [callId, consumeSignal, peerReady, signalingEvents, visible]);

  useEffect(() => {
    if (!visible || !callId || startedCallIdRef.current === callId) return undefined;
    startedCallIdRef.current = callId;
    endedRef.current = false;
    setMuted(false);
    setSpeakerEnabled(true);
    setElapsedSeconds(0);
    setState("preparing");
    setPeerReady(false);
    processedSignalsRef.current = new Set();

    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/voice/ice-servers");
        const iceServers = Array.isArray(data?.ice_servers) && data.ice_servers.length
          ? data.ice_servers
          : DEFAULT_ICE_SERVERS;
        if (!active) return;
        setRelayConfigured(data?.relay_configured === true);
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          ...(Platform.OS === "android" ? { shouldRouteThroughEarpiece: false } : {}),
        });
        const peer = new RTCPeerConnection({ iceServers });
        peerRef.current = peer;
        setPeerReady(true);
        peer.onicecandidate = ({ candidate }) => {
          if (!candidate) return;
          emit("call_ice", typeof candidate.toJSON === "function" ? candidate.toJSON() : candidate);
        };
        peer.onconnectionstatechange = () => {
          if (!active || !peerRef.current || peerRef.current !== peer) return;
          if (peer.connectionState === "connected") {
            markNativeCallConnected(callId);
            setState("connected");
          }
          else if (peer.connectionState === "failed") setState("failed");
          else if (peer.connectionState === "disconnected") setState("reconnecting");
        };
        const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        if (role === "caller") {
          showOutgoingNativeCall({ callId, calleeName: name, handle: "Haraj Plus", labels: nativeCallLabels }).catch(() => {});
          emit("call_invite", { caller_name: name || "Haraj Plus" });
          const offer = await peer.createOffer({ offerToReceiveAudio: true });
          await peer.setLocalDescription(offer);
          emit("call_offer", peer.localDescription);
          setState("ringing");
        } else {
          setState("connecting");
        }
      } catch (_) {
        if (active) setState("failed");
      }
    })();

    return () => {
      active = false;
      if (!visible) {
        stopMedia();
        resetAudioMode();
      }
    };
  }, [callId, emit, name, nativeCallLabels, resetAudioMode, role, stopMedia, visible]);

  useEffect(() => {
    if (state !== "connected") return undefined;
    const timer = setInterval(() => setElapsedSeconds(seconds => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);

  const toggleMute = () => {
    const nextMuted = !muted;
    streamRef.current?.getAudioTracks?.().forEach(track => { track.enabled = !nextMuted; });
    setNativeCallMuted(callId, nextMuted);
    setMuted(nextMuted);
  };

  const toggleSpeaker = () => {
    if (Platform.OS !== "android") return;
    const next = !speakerEnabled;
    setSpeakerEnabled(next);
    setNativeCallSpeaker(callId, next);
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: !next,
    }).catch(() => {});
  };

  const status = {
    idle: t("جاري تجهيز المكالمة"),
    preparing: t("جاري تجهيز المكالمة"),
    ringing: t("جاري الاتصال"),
    connecting: t("جاري الاتصال"),
    reconnecting: t("جارٍ إعادة الاتصال"),
    connected: `${t("متصل")} · ${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`,
    failed: t("تعذر الاتصال"),
    ended: t("انتهت المكالمة"),
  }[state] || t("جاري تجهيز المكالمة");

  return <Modal visible={visible} animationType="slide" onRequestClose={() => closeLocal(true)} statusBarTranslucent>
    <View style={styles.page}>
      <View style={[styles.avatarHalo, state === "ringing" && styles.ringing]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(name || "?").trim().slice(0, 1).toUpperCase()}</Text></View>
      </View>
      <Text style={styles.name} numberOfLines={2}>{name || t("مكالمة صوتية")}</Text>
      <Text style={styles.status}>{status}</Text>
      <View style={styles.badge}><View style={styles.dot} /><Text style={styles.badgeText}>{relayConfigured ? t("اتصال محمي عبر TURN عند الحاجة") : t("اتصال مباشر عبر STUN")}</Text></View>
      {relayConfigured === false && <Text style={styles.warning}>{t("قد تمنع بعض الشبكات الاتصال المباشر. يلزم TURN لاتصال موثوق على جميع الشبكات.")}</Text>}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMute} style={[styles.control, muted && styles.controlActive]} accessibilityRole="button" accessibilityLabel={muted ? t("تشغيل الميكروفون") : t("كتم الميكروفون")}>
          {muted ? <MicOff size={24} color={muted ? "#07152F" : "#FFFFFF"} /> : <Mic size={24} color="#FFFFFF" />}
          <Text style={[styles.controlText, muted && styles.controlTextActive]}>{muted ? t("تشغيل") : t("كتم")}</Text>
        </TouchableOpacity>
        {Platform.OS === "android" && <TouchableOpacity onPress={toggleSpeaker} style={[styles.control, speakerEnabled && styles.controlActive]} accessibilityRole="button" accessibilityLabel={t("مكبر الصوت")}>
          <Volume2 size={24} color={speakerEnabled ? "#07152F" : "#FFFFFF"} />
          <Text style={[styles.controlText, speakerEnabled && styles.controlTextActive]}>{t("مكبر الصوت")}</Text>
        </TouchableOpacity>}
        <TouchableOpacity onPress={() => closeLocal(true)} style={[styles.control, styles.endControl]} accessibilityRole="button" accessibilityLabel={t("إنهاء المكالمة")}>
          <PhoneOff size={24} color="#FFFFFF" />
          <Text style={styles.controlText}>{t("إنهاء")}</Text>
        </TouchableOpacity>
      </View>
      {state === "preparing" && <ActivityIndicator color="#8BD9F4" style={styles.loader} />}
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, backgroundColor: "#07152F" },
  avatarHalo: { width: 150, height: 150, borderRadius: 75, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(79,182,230,0.12)", borderWidth: 18, borderColor: "rgba(79,182,230,0.08)", marginBottom: 28 },
  ringing: { transform: [{ scale: 1.04 }] },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", backgroundColor: "#287EA8" },
  avatarText: { color: "#FFFFFF", fontSize: 42, fontWeight: "800" },
  name: { color: "#F8FBFF", fontSize: 27, fontWeight: "800", textAlign: "center" },
  status: { color: "#C9D7E8", fontSize: 15, marginTop: 10 },
  badge: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 17, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.08)" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#84D9F6" },
  badgeText: { color: "#D6E6F4", fontSize: 12 },
  warning: { marginTop: 18, maxWidth: 330, color: "#FDE2A9", fontSize: 12, lineHeight: 19, textAlign: "center" },
  controls: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 17, marginTop: 58 },
  control: { width: 72, height: 72, borderRadius: 23, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.10)" },
  controlActive: { backgroundColor: "#8BD9F4" },
  endControl: { backgroundColor: "#EB4B51" },
  controlText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  controlTextActive: { color: "#07152F" },
  loader: { position: "absolute", bottom: 36 },
});
