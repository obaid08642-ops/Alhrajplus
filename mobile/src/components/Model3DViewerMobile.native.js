import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from "react-native-filament";
import { RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react-native";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

function isGlb(url) {
  return /\.glb(?:[?#]|$)/i.test(String(url || ""));
}

function NativeModelScene({ url, rotation, cameraDistance }) {
  return <FilamentView style={styles.viewer}>
    <DefaultLight intensity={100000} />
    <Model source={{ uri: url }} castShadow receiveShadow transformToUnitCube rotate={[0, rotation, 0]} />
    <Camera cameraPosition={[0, 0.15, cameraDistance]} cameraTarget={[0, 0, 0]} near={0.05} far={1000} />
  </FilamentView>;
}

export default function Model3DViewerMobile({ url, onClose }) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const [rotation, setRotation] = useState(0);
  const [cameraDistance, setCameraDistance] = useState(4);
  if (!url) return null;

  const supported = isGlb(url);
  return <View style={[styles.root, { backgroundColor: palette?.bg || "#111827" }]}>
    {supported ? <FilamentScene fallback={<View style={styles.center}><ActivityIndicator size="large" color="#FFFFFF" /></View>}><NativeModelScene url={url} rotation={rotation} cameraDistance={cameraDistance} /></FilamentScene> : <View style={styles.center}><Text style={styles.unsupportedTitle}>{t("صيغة نموذج ثلاثي الأبعاد غير مدعومة")}</Text><Text style={styles.unsupportedText}>{t("العارض الأصلي يدعم ملفات GLB فقط. أعد رفع النموذج بصيغة GLB.")}</Text></View>}
    {supported && <View style={styles.controls}>
      <TouchableOpacity onPress={() => setRotation(value => value - Math.PI / 8)} style={styles.control} accessibilityRole="button" accessibilityLabel={t("تدوير النموذج لليسار")}><RotateCcw size={18} color="#FFFFFF" /></TouchableOpacity>
      <TouchableOpacity onPress={() => setRotation(value => value + Math.PI / 8)} style={styles.control} accessibilityRole="button" accessibilityLabel={t("تدوير النموذج لليمين")}><RotateCw size={18} color="#FFFFFF" /></TouchableOpacity>
      <TouchableOpacity onPress={() => setCameraDistance(value => Math.max(1.5, value - 0.5))} style={styles.control} accessibilityRole="button" accessibilityLabel={t("تكبير النموذج")}><ZoomIn size={18} color="#FFFFFF" /></TouchableOpacity>
      <TouchableOpacity onPress={() => setCameraDistance(value => Math.min(10, value + 0.5))} style={styles.control} accessibilityRole="button" accessibilityLabel={t("تصغير النموذج")}><ZoomOut size={18} color="#FFFFFF" /></TouchableOpacity>
    </View>}
    <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel={t("إغلاق")}> <X size={20} color="#FFFFFF" /> </TouchableOpacity>
    <View style={styles.hint}><Text style={styles.hintText}>{supported ? t("استخدم أزرار التدوير والتكبير للتحكم بالنموذج") : t("استخدم ملف GLB للعرض الأصلي")}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, viewer: { flex: 1, backgroundColor: "#111827" }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#111827" }, controls: { position: "absolute", bottom: 78, alignSelf: "center", flexDirection: "row", gap: 10 }, control: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,.70)", alignItems: "center", justifyContent: "center" }, unsupportedTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", textAlign: "center" }, unsupportedText: { color: "#CBD5E1", marginTop: 10, textAlign: "center", lineHeight: 20 }, close: { position: "absolute", top: 48, right: 18, width: 42, height: 42, borderRadius: 22, backgroundColor: "rgba(0,0,0,.65)", alignItems: "center", justifyContent: "center" }, hint: { position: "absolute", bottom: 30, alignSelf: "center", backgroundColor: "rgba(0,0,0,.65)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }, hintText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", textAlign: "center" },
});
