import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../I18nContext";

// Mobile web export is a development-preview target; the production website
// owns browser calling separately. Keep this fallback free of embedded browser
// and native modules so the mobile application has a single native call path.
export default function NativeVoiceCallWeb({ visible, name, onClose }) {
  const { t } = useI18n();
  return <Modal visible={visible} animationType="slide" onRequestClose={() => onClose?.({ signalAlreadySent: false })}>
    <View style={styles.page}>
      <Text style={styles.title}>{name || "Haraj Plus"}</Text>
      <Text style={styles.text}>{t("المكالمات الصوتية متاحة في تطبيق الجوال الأصلي.")}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onClose?.({ signalAlreadySent: false })} accessibilityRole="button">
        <Text style={styles.buttonText}>{t("إغلاق")}</Text>
      </TouchableOpacity>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#07152F" },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", textAlign: "center" },
  text: { color: "#C9D7E8", marginTop: 12, textAlign: "center" },
  button: { marginTop: 28, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: "#EB4B51" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
});
