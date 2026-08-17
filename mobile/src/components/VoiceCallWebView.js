import { useEffect, useRef, useState } from "react";
import { Modal, View, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { WebView } from "react-native-webview";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "../api";
import { X } from "lucide-react-native";

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
  useEffect(() => { if (visible) getToken().then(setToken); else setReady(false); }, [visible]);
  useEffect(() => {
    if (visible && ready && token) {
      ref.current?.postMessage(JSON.stringify({ type: "voice-config", token, backend: BACKEND_URL }));
    }
  }, [visible, ready, token]);
  useEffect(() => {
    if (visible && ready && signalingEvent) {
      ref.current?.postMessage(JSON.stringify({ type: "voice-event", event: signalingEvent }));
    }
  }, [visible, ready, signalingEvent]);
  const url = `https://www.alhraj.online/voice-call.html?role=${encodeURIComponent(role)}&to=${encodeURIComponent(to || "")}&convo=${encodeURIComponent(convoId || "")}&callId=${encodeURIComponent(callId || `call_${Date.now()}`)}&name=${encodeURIComponent(name || "Haraj Plus")}`;
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: "#0f1a35" }}>
      <WebView ref={ref} originWhitelist={["*"]} source={{ uri: url }} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} onLoadEnd={() => setReady(true)} onMessage={event => { try { const msg = JSON.parse(event.nativeEvent.data); if (msg.type === "hangup" || msg.type === "error") onClose?.(); } catch (_) {} }} style={{ flex: 1, backgroundColor: "#0f1a35" }} />
      <TouchableOpacity onPress={onClose} style={{ position: "absolute", top: 48, right: 18, width: 42, height: 42, borderRadius: 22, backgroundColor: "rgba(0,0,0,.65)", alignItems: "center", justifyContent: "center" }}><X size={20} color="#fff" /></TouchableOpacity>
      {!ready && <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="#4fb6e6" /><Text style={{ color: "#fff", marginTop: 12 }}>جاري تجهيز المكالمة</Text></View>}
    </View>
  </Modal>;
}
