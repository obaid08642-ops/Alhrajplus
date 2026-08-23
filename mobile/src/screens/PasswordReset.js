import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import api, { formatApiError } from "../api";
import { theme, shadow } from "../theme";
import { useI18n } from "../I18nContext";
export function ForgotPasswordScreen({
  navigation
}) {
  const { t } = useI18n();
  
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const {
        data
      } = await api.post("/auth/forgot-password", {
        email
      });
      setDone(true);
      // When email service isn't configured, backend returns dev_reset_link
      if (data?.dev_reset_link) {
        Alert.alert(t("رمز التحقق"), data.dev_reset_link);
      }
    } catch (e) {
      setErr(formatApiError(e) || t("حدث خطأ. حاول مرة أخرى."));
    } finally {
      setBusy(false);
    }
  };
  return <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
                <Text style={styles.title}>{t("نسيت كلمة المرور؟")}</Text>
                {err ? <Text style={styles.err}>{err}</Text> : null}
                {done ? <>
                        <Text style={styles.success}>{t("تحقق من بريدك الإلكتروني للرابط")}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")} style={styles.btn}>
                            <Text style={styles.btnText}>{t("إعادة تعيين كلمة المرور")}</Text>
                        </TouchableOpacity>
                    </> : <>
                        <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} testID="mobile-forgot-email" />
                        <TouchableOpacity onPress={submit} disabled={busy || !email} style={[styles.btn, (busy || !email) && styles.btnDisabled]} testID="mobile-forgot-submit">
                            <Text style={styles.btnText}>{busy ? "..." : t("إرسال رابط الاستعادة")}</Text>
                        </TouchableOpacity>
                    </>}
                <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{
        marginTop: 12,
        alignItems: "center"
      }}>
                    <Text style={{
          color: theme.colors.primary,
          fontWeight: "700"
        }}>{t("تسجيل الدخول")}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>;
}
export function ResetPasswordScreen({
  navigation
}) {
  const { t } = useI18n();
  
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: pw
      });
      Alert.alert("تم تغيير كلمة المرور بنجاح");
      navigation.navigate("Login");
    } catch (e) {
      setErr(formatApiError(e) || t("حدث خطأ. حاول مرة أخرى."));
    } finally {
      setBusy(false);
    }
  };
  return <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
                <Text style={styles.title}>{t("إعادة تعيين كلمة المرور")}</Text>
                {err ? <Text style={styles.err}>{err}</Text> : null}
                <TextInput placeholder={t("رمز التحقق")} placeholderTextColor={theme.colors.textMuted} value={token} onChangeText={setToken} autoCapitalize="none" style={styles.input} testID="mobile-reset-token" />
                <TextInput placeholder={t("كلمة المرور الجديدة")} placeholderTextColor={theme.colors.textMuted} value={pw} onChangeText={setPw} secureTextEntry style={styles.input} testID="mobile-reset-password" />
                <TouchableOpacity onPress={submit} disabled={busy || !token || pw.length < 8} style={[styles.btn, (busy || !token || pw.length < 8) && styles.btnDisabled]} testID="mobile-reset-submit">
                    <Text style={styles.btnText}>{busy ? "..." : t("حفظ")}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>;
}
const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: theme.colors.bg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadow.soft
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    color: theme.colors.text,
    marginBottom: 16
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: "right"
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: 6
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnText: {
    color: theme.colors.primaryFg,
    fontWeight: "900",
    fontSize: 15
  },
  err: {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    padding: 10,
    borderRadius: theme.radius.md,
    marginBottom: 10,
    textAlign: "right"
  },
  success: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: 10,
    borderRadius: theme.radius.md,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "700"
  }
});