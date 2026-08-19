import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { X } from "lucide-react-native";
import { useI18n } from "../I18nContext";

export default function Model3DViewerMobileWeb({ onClose }) {
  const { t } = useI18n();
  return <View style={styles.root}>
    <Text style={styles.title}>{t("نموذج ثلاثي الأبعاد")}</Text>
    <Text style={styles.text}>{t("عرض النموذج ثلاثي الأبعاد متاح في تطبيق الجوال الأصلي.")}</Text>
    <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel={t("إغلاق")}><X size={20} color="#FFFFFF" /></TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", padding: 28 },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  text: { color: "#CBD5E1", marginTop: 10, textAlign: "center" },
  close: { position: "absolute", top: 48, right: 18, width: 42, height: 42, borderRadius: 22, backgroundColor: "rgba(0,0,0,.65)", alignItems: "center", justifyContent: "center" },
});
