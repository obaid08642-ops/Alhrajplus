import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { ShieldCheck, Smartphone, ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";
import { colors } from "../theme";
import api from "../api";

export default function PhoneVerificationScreen() {
  const { user, refresh } = useAuth();
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const nav = useNavigation();
  const [phone, setPhone] = useState(user?.phone || "");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState(user?.phone_verified ? "verified" : "entry");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last4, setLast4] = useState("");
  const verified = Boolean(user?.phone_verified);
  const heading = useMemo(() => verified ? t("رقم الهاتف موثّق") : t("توثيق رقم الهاتف"), [verified, t]);

  const start = async () => {
    const normalized = phone.replace(/[^\d+]/g, "");
    if (normalized.replace(/\D/g, "").length < 6) {
      setError(t("أدخل رقم هاتف صالحًا"));
      return;
    }
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/auth/phone-verification/start", { phone: normalized, country_code: user?.country_code });
      setLast4(data?.phone_last4 || "");
      setStage("confirm");
    } catch (e) {
      setError(e?.response?.data?.detail || t("تعذر إرسال رمز التحقق"));
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!/^\d{4,10}$/.test(code.trim())) {
      setError(t("أدخل رمز التحقق الصحيح"));
      return;
    }
    setBusy(true); setError("");
    try {
      await api.post("/auth/phone-verification/confirm", { phone, code: code.trim(), country_code: user?.country_code });
      await refresh?.();
      setStage("verified");
      Alert.alert(t("تم التحقق"), t("أصبح رقم حسابك صالحًا للاستخدام في الإعلانات"));
    } catch (e) {
      setError(e?.response?.data?.detail || t("تعذر تأكيد رمز التحقق"));
    } finally { setBusy(false); }
  };

  return <ScrollView contentContainerStyle={[s.wrap, { backgroundColor: palette.bg }]} keyboardShouldPersistTaps="handled">
    <View style={[s.icon, { backgroundColor: `${colors.primary}18` }]}><ShieldCheck size={31} color={colors.primary} /></View>
    <Text style={[s.title, { color: palette.text }]}>{heading}</Text>
    <Text style={[s.subtitle, { color: palette.textMuted }]}>{t("لن يظهر رقم الحساب في الإعلانات إلا بعد تأكيده برسالة SMS.")}</Text>
    {stage === "verified" ? <View style={[s.success, { backgroundColor: "#DCFCE7" }]}><ShieldCheck size={20} color="#15803D" /><View style={{ flex: 1 }}><Text style={s.successTitle}>{t("تم توثيق الهاتف")}</Text><Text style={s.successSub}>{user?.phone_full || user?.phone}</Text></View></View> : <>
      <Text style={[s.label, { color: palette.text }]}>{t("رقم الهاتف")}</Text>
      <View style={[s.inputWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}><Smartphone size={19} color={colors.primary} /><TextInput testID="phone-verification-phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t("أدخل رقمك بدون مسافات")} placeholderTextColor={palette.textMuted} style={[s.input, { color: palette.text }]} textAlign="left" editable={!busy && stage !== "confirm"} /></View>
      {stage === "confirm" && <><Text style={[s.label, { color: palette.text }]}>{t("رمز التحقق")}{last4 ? ` ••••${last4}` : ""}</Text><TextInput testID="phone-verification-code" value={code} onChangeText={value => setCode(value.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={10} placeholder="123456" placeholderTextColor={palette.textMuted} style={[s.codeInput, { backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }]} textAlign="center" /></>}
      {!!error && <Text testID="phone-verification-error" style={s.error}>{error}</Text>}
      <TouchableOpacity testID="phone-verification-submit" onPress={stage === "confirm" ? confirm : start} disabled={busy} style={[s.submit, { backgroundColor: colors.primary }, busy && { opacity: .6 }]}>{busy ? <ActivityIndicator color="#fff" /> : <><Text style={s.submitText}>{stage === "confirm" ? t("تأكيد الرمز") : t("إرسال رمز التحقق")}</Text><ArrowLeft size={18} color="#fff" /></>}</TouchableOpacity>
      {stage === "confirm" && <TouchableOpacity onPress={() => { setStage("entry"); setCode(""); setError(""); }} style={s.link}><Text style={{ color: colors.primary, fontWeight: "800" }}>{t("تغيير الرقم")}</Text></TouchableOpacity>}
    </>}
    <Text style={[s.note, { color: palette.textMuted }]}>{t("إذا ظهرت رسالة أن خدمة الرسائل غير مهيأة، يلزم مسؤول المنصة إضافة إعدادات مزود SMS؛ لا يتم اعتبار الرقم موثقًا بدون تأكيد فعلي.")}</Text>
  </ScrollView>;
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 22, paddingTop: 42 }, icon: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }, title: { fontSize: 23, fontWeight: "900", textAlign: "center" }, subtitle: { fontSize: 13, lineHeight: 21, textAlign: "center", marginTop: 9, marginBottom: 26 }, label: { fontSize: 14, fontWeight: "800", textAlign: "right", marginBottom: 8 }, inputWrap: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, alignItems: "center", flexDirection: "row", marginBottom: 17 }, input: { flex: 1, height: 50, fontSize: 16, marginLeft: 10 }, codeInput: { borderWidth: 1, borderRadius: 15, height: 56, fontSize: 22, fontWeight: "900", letterSpacing: 7, marginBottom: 16 }, submit: { minHeight: 52, borderRadius: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 4 }, submitText: { color: "#fff", fontWeight: "900", fontSize: 15 }, error: { color: "#DC2626", fontSize: 13, textAlign: "right", marginBottom: 12 }, link: { alignSelf: "center", padding: 14 }, note: { fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 20 }, success: { borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", gap: 11 }, successTitle: { color: "#166534", fontSize: 14, fontWeight: "900" }, successSub: { color: "#15803D", fontSize: 12, marginTop: 3 },
});
