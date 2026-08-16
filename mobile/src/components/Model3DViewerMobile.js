import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

export default function Model3DViewerMobile({ url, onClose }) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  if (!url) return null;
  const safeUrl = String(url).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><script type="module" src="https://unpkg.com/@google/model-viewer@4.3.1/dist/model-viewer.min.js"></script><style>html,body{margin:0;height:100%;background:#111827;overflow:hidden}model-viewer{width:100%;height:100%;--poster-color:#111827}</style></head><body><model-viewer src="${safeUrl}" camera-controls auto-rotate shadow-intensity="1" exposure="1" interaction-prompt="none" ar ar-modes="webxr scene-viewer quick-look"></model-viewer></body></html>`;
  return <View style={s.root}><WebView originWhitelist={["*"]} source={{ html }} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback startInLoadingState style={s.webview} /><TouchableOpacity onPress={onClose} style={s.close}><X size={20} color="#fff" /></TouchableOpacity><View style={s.hint}><Text style={s.hintText}>{t("اسحب للتدوير واضغط للتكبير")}</Text></View></View>;
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: "#111827" }, webview: { flex: 1, backgroundColor: "#111827" }, close: { position: "absolute", top: 48, right: 18, width: 42, height: 42, borderRadius: 22, backgroundColor: "rgba(0,0,0,.65)", alignItems: "center", justifyContent: "center" }, hint: { position: "absolute", bottom: 30, alignSelf: "center", backgroundColor: "rgba(0,0,0,.65)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }, hintText: { color: "#fff", fontSize: 12, fontWeight: "800" } });
