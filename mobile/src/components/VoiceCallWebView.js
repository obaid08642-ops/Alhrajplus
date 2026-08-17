import { useEffect, useRef, useState } from "react";
import { Modal, View, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { WebView } from "react-native-webview";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { BACKEND_URL } from "../api";
import { X } from "lucide-react-native";
import { setAudioModeAsync } from "expo-audio";

async function getToken() {
  try {
    if (SecureStore.isAvailableAsync && await SecureStore.isAvailableAsync()) {
      const value = await SecureStore.getItemAsync("hp_access_token");
      if (value) return value;
    }
  } catch (_) {}
  return AsyncStorage.getItem("hp_access_token");
}

export default function VoiceCallWebView({ visible, role = "caller", to, convoId, callId, name, signalingEvent, onClose }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [iceServers, setIceServers] = useState([{ urls: "stun:stun.l.google.com:19302" }]);
  const [relayConfigured, setRelayConfigured] = useState(null);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  useEffect(() => {
    if (!visible) { setReady(false); return; }
    setSpeakerEnabled(true);
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, shouldRouteThroughEarpiece: false }).catch(() => {});
    getToken().then(setToken);
    api.get("/voice/ice-servers").then(({ data }) => {
      if (Array.isArray(data?.ice_servers) && data.ice_servers.length) setIceServers(data.ice_servers);
      setRelayConfigured(data?.relay_configured === true);
    }).catch(() => setRelayConfigured(false));
  }, [visible]);
  useEffect(() => {
    if (visible && ready && token) {
      ref.current?.postMessage(JSON.stringify({ type: "voice-config", token, backend: BACKEND_URL, iceServers }));
    }
  }, [visible, ready, token, iceServers]);
  useEffect(() => {
    if (visible && ready && signalingEvent) {
      ref.current?.postMessage(JSON.stringify({ type: "voice-event", event: signalingEvent }));
    }
  }, [visible, ready, signalingEvent]);
  const closeCall = () => {
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false }).catch(() => {});
    onClose?.();
  };
  // Versioned query is intentional: Vercel can retain a prior public HTML
  // response at the bare path while the mobile WebView needs the matching call protocol.
  const url = `https://www.alhraj.online/voice-call.html?v=phase6_call_ui_2&role=${encodeURIComponent(role)}&to=${encodeURIComponent(to || "")}&convo=${encodeURIComponent(convoId || "")}&callId=${encodeURIComponent(callId || `call_${Date.now()}`)}&name=${encodeURIComponent(name || "Haraj Plus")}`;
  return <Modal visible={visible} animationType="slide" onRequestClose={closeCall}>
    <View style={{ flex: 1, backgroundColor: "#0f1a35" }}>
      <WebView ref={ref} originWhitelist={["*"]} source={{ uri: url }} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} mediaCapturePermissionGrantType="grantIfSameHostElsePrompt" onLoadEnd={() => setReady(true)} onMessage={event => { try { const msg = JSON.parse(event.nativeEvent.data); if (msg.type === "speaker") { const enabled = msg.value !== false; setSpeakerEnabled(enabled); setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, shouldRouteThroughEarpiece: !enabled }).catch(() => {}); } if (msg.type === "hangup") closeCall(); } catch (_) {} }} style={{ flex: 1, backgroundColor: "#0f1a35" }} />
      <TouchableOpacity onPress={closeCall} style={{ position: "absolute", top: 48, right: 18, width: 42, height: 42, borderRadius: 22, backgroundColor: "rgba(0,0,0,.65)", alignItems: "center", justifyContent: "center" }} accessibilityLabel={speakerEnabled ? "إغلاق المكالمة عبر مكبر الصوت" : "إغلاق المكالمة عبر سماعة الأذن"}><X size={20} color="#fff" /></TouchableOpacity>
      {!ready && <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="#4fb6e6" /><Text style={{ color: "#fff", marginTop: 12 }}>جاري تجهيز المكالمة</Text></View>}
    </View>
  </Modal>;
}
