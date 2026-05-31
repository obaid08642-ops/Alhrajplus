import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal } from "react-native";
import { ChevronLeft, Globe } from "lucide-react-native";
import { useAuth } from "../AuthContext";
import { theme, shadow } from "../theme";
import { formatApiError } from "../api";
import { signInWithGoogle, signInWithApple, signInWithX, signInWithSnapchat } from "../socialAuth";
import { isBiometricAvailable, isBiometricEnabled, enableBiometric, tryBiometricLogin } from "../biometric";
import { useI18n } from "../I18nContext";
import { validatePhone, phoneExampleFor } from "../phoneValidator";

// Helper: navigate to the main tabs in a way that clears the auth stack so
// the user cannot accidentally swipe back into the login screen post-login.
// Tries multiple navigation strategies for maximum reliability.
function goHome(navigation) {
  if (!navigation) return;
  // Strategy 1: popToTop — if Login was pushed on top of Main, pop back to it
  try {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.popToTop?.();
      return;
    }
  } catch (_) {}
  // Strategy 2: reset stack to a single Main route
  try {
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    return;
  } catch (_) {}
  // Strategy 3: plain navigate
  try { navigation.navigate("Main"); } catch (_) {}
}

// Top header for auth screens — RIGHT: back-to-home, LEFT: language picker pill.
function AuthHeader({ navigation }) {
  const { t, lang, setLang, supported } = useI18n();
  const [open, setOpen] = useState(false);
  const LANG_LABELS = {
    ar: "العربية 🇸🇦", en: "English 🇬🇧", hi: "हिन्दी 🇮🇳",
    ur: "اردو 🇵🇰", bn: "বাংলা 🇧🇩", fr: "Français 🇫🇷"
  };
  return (
    <View style={styles.authHeader} testID="auth-header">
      {/* RIGHT side (RTL: end) — back to Home */}
      <TouchableOpacity onPress={() => goHome(navigation)} style={styles.headerHomeBtn} testID="auth-header-home-btn" hitSlop={6}>
        <ChevronLeft size={18} color={theme.colors.primary} strokeWidth={2.6} />
        <Text style={styles.headerHomeText}>{t("الرئيسية")}</Text>
      </TouchableOpacity>
      {/* LEFT side — language pill */}
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.headerLangPill} testID="auth-header-lang-btn" hitSlop={6}>
        <Globe size={14} color={theme.colors.primaryDeep} strokeWidth={2.4} />
        <Text style={styles.headerLangText}>{LANG_LABELS[lang] || lang}</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={styles.langSheetBg}>
          <View style={styles.langSheet}>
            <Text style={styles.langSheetTitle}>{t("اختر اللغة")}</Text>
            {supported.map(code => (
              <TouchableOpacity key={code} onPress={() => { setLang(code); setOpen(false); }} style={[styles.langRow, code === lang && styles.langRowActive]} testID={`auth-lang-opt-${code}`}>
                <Text style={[styles.langRowText, code === lang && { color: theme.colors.primary, fontWeight: "900" }]}>{LANG_LABELS[code]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function SocialButtons({
  navigation,
  onSuccess
}) {
  const { t } = useI18n();
  
  const [busy, setBusy] = useState(null); // provider key or null
  const run = (provider, fn) => async () => {
    setBusy(provider);
    try {
      await fn();
      await onSuccess?.();
      goHome(navigation);
    } catch (e) {
      if (!String(e?.message || "").includes(t("إلغاء")) && !String(e?.message || "").toLowerCase().includes("cancel")) {
        Alert.alert(t("خطأ"), e.message || `${t("حدث خطأ. حاول مرة أخرى.")} (${provider})`);
      }
    } finally {
      setBusy(null);
    }
  };
  return <View style={{
    gap: 8
  }}>
            <TouchableOpacity onPress={run("google", signInWithGoogle)} disabled={!!busy} style={[styles.googleBtn, busy && styles.btnDisabled]} testID="mobile-google-btn">
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>{busy === "google" ? "..." : t("متابعة بحساب Google")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={run("apple", signInWithApple)} disabled={!!busy || Platform.OS === "android"} style={[styles.appleBtn, busy && styles.btnDisabled, Platform.OS === "android" && {
      display: "none"
    }]} testID="mobile-apple-btn">
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleText}>{busy === "apple" ? "..." : t("متابعة بحساب Apple")}</Text>
            </TouchableOpacity>
            <View style={{
      flexDirection: "row",
      gap: 8
    }}>
                <TouchableOpacity onPress={run("x", signInWithX)} disabled={!!busy} style={[styles.xBtn, busy && styles.btnDisabled]} testID="mobile-x-btn">
                    <Text style={styles.xText}>{busy === "x" ? "..." : "X"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={run("snapchat", signInWithSnapchat)} disabled={!!busy} style={[styles.snapBtn, busy && styles.btnDisabled]} testID="mobile-snap-btn">
                    <Text style={styles.snapText}>{busy === "snapchat" ? "..." : "Snapchat"}</Text>
                </TouchableOpacity>
            </View>
        </View>;
}
export function LoginScreen({
  navigation
}) {
  const { t } = useI18n();
  const {
    user,
    login,
    refresh
  } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLabel, setBioLabel] = useState(t("البصمة"));
  const [askEnable, setAskEnable] = useState(false);

  // If the user becomes truthy while we're sitting on the login screen
  // (e.g., social OAuth deep-link returns a token), navigate to Main
  // immediately so we never get stuck on this screen.
  useEffect(() => {
    if (user && user.id) goHome(navigation);
  }, [user, navigation]);
  useEffect(() => {
    (async () => {
      const info = await isBiometricAvailable();
      setBioAvailable(info.available);
      if (info.types) {
        // 1=Fingerprint, 2=Facial, 3=Iris
        if (info.types.includes(2)) setBioLabel("FaceID");else if (info.types.includes(1)) setBioLabel(t("بصمة الإصبع"));
      }
      const enabled = await isBiometricEnabled();
      setBioEnabled(enabled);
      if (enabled && info.available) {
        // Auto-prompt on mount
        const creds = await tryBiometricLogin();
        if (creds?.email && creds?.password) {
          setBusy(true);
          try {
            await login(creds.email, creds.password);
            goHome(navigation);
          } catch (_) {} finally {
            setBusy(false);
          }
        }
      }
    })();
  }, []);
  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      // CRITICAL: navigate to Main IMMEDIATELY after a successful login so
      // the user never gets stranded on this screen. The biometric enrollment
      // prompt (if available) is shown AFTER navigation via Alert.alert so
      // it never blocks the redirect.
      goHome(navigation);
      try {
        const enabled = await isBiometricEnabled();
        if (!enabled && bioAvailable) {
          Alert.alert(
            `${t("تفعيل الدخول بـ")}${bioLabel}`,
            t("في المرات القادمة؟"),
            [
              { text: t("ليس الآن"), style: "cancel" },
              { text: t("تفعيل"), onPress: async () => {
                const ok = await enableBiometric(email, password);
                if (ok) Alert.alert("✅", `${t("تفعيل الدخول بـ")}${bioLabel}.`);
              }}
            ]
          );
        }
      } catch (_) {}
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
    } finally {
      setBusy(false);
    }
  };
  const doEnableBio = async () => {
    const ok = await enableBiometric(email, password);
    if (ok) {
      setBioEnabled(true);
      Alert.alert("✅", `${t("تفعيل الدخول بـ")}${bioLabel}.`);
    }
    setAskEnable(false);
    goHome(navigation);
  };
  const doBiometricLogin = async () => {
    setBusy(true);
    try {
      const creds = await tryBiometricLogin();
      if (creds?.email && creds?.password) {
        await login(creds.email, creds.password);
        goHome(navigation);
      } else {
        setErr(t("حدث خطأ. حاول مرة أخرى."));
      }
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
    } finally {
      setBusy(false);
    }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <AuthHeader navigation={navigation} />
                <View style={styles.card}>
                    <View style={styles.logo}>
                        <Text style={styles.logoMain}>{t("الحراج")}</Text>
                        <Text style={styles.logoSub}>{t("بلس")}</Text>
                    </View>
                    <Text style={styles.title}>{t("تسجيل الدخول")}</Text>

                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}

                    <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} testID="mobile-login-email" />
                    <TextInput placeholder={t("كلمة المرور")} placeholderTextColor={theme.colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry style={styles.input} testID="mobile-login-password" />

                    <TouchableOpacity onPress={submit} disabled={busy} style={[styles.btn, busy && styles.btnDisabled]} testID="mobile-login-submit">
                        <Text style={styles.btnText}>{busy ? "..." : t("تسجيل الدخول")}</Text>
                    </TouchableOpacity>

                    {bioEnabled && bioAvailable && <TouchableOpacity onPress={doBiometricLogin} disabled={busy} style={[styles.bioBtn]} testID="mobile-biometric-btn">
                            <Text style={styles.bioIcon}>🔐</Text>
                            <Text style={styles.bioText}>{t("الدخول بـ")}{bioLabel}</Text>
                        </TouchableOpacity>}

                    {askEnable && <View style={styles.enableBioBox}>
                            <Text style={styles.enableBioText}>{t("تفعيل الدخول بـ")}{bioLabel}{t("في المرات القادمة؟")}</Text>
                            <View style={styles.enableBioRow}>
                                <TouchableOpacity onPress={doEnableBio} style={styles.enableBioYes} testID="mobile-enable-bio-yes">
                                    <Text style={styles.enableBioYesText}>{t("تفعيل")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setAskEnable(false); goHome(navigation); }} style={styles.enableBioNo}>
                                    <Text style={styles.enableBioNoText}>{t("ليس الآن")}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>}

                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>{t("أو")}</Text><View style={styles.line} /></View>
                    <SocialButtons navigation={navigation} onSuccess={() => refresh()} />

                    <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
                        <Text style={styles.linkText}>{t("ليس لديك حساب؟")} <Text style={styles.linkStrong}>{t("إنشاء حساب")}</Text></Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{
          marginTop: 6,
          alignItems: "center"
        }} testID="mobile-forgot-link">
                        <Text style={[styles.linkStrong, {
            fontSize: 12
          }]}>{t("نسيت كلمة المرور؟")}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>;
}
export function RegisterScreen({
  navigation
}) {
  const { t } = useI18n();
  const {
    user,
    register,
    refresh
  } = useAuth();
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    country_code: "SA"
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Mirror LoginScreen: if user becomes truthy (e.g., social auth), bail to home.
  useEffect(() => {
    if (user && user.id) goHome(navigation);
  }, [user, navigation]);
  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const v = validatePhone(form.phone, form.country_code);
      if (!v.ok) {
        setErr(v.error);
        setBusy(false);
        return;
      }
      await register({
        ...form,
        phone: v.normalized
      });
      goHome(navigation);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
    } finally {
      setBusy(false);
    }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <AuthHeader navigation={navigation} />
                <View style={styles.card}>
                    <View style={styles.logo}>
                        <Text style={styles.logoMain}>{t("الحراج")}</Text>
                        <Text style={styles.logoSub}>{t("بلس")}</Text>
                    </View>
                    <Text style={styles.title}>{t("إنشاء حساب")}</Text>

                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}

                    <TextInput placeholder={t("الاسم الكامل")} placeholderTextColor={theme.colors.textMuted} value={form.name} onChangeText={v => setForm({
          ...form,
          name: v
        })} style={styles.input} />
                    <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={form.email} onChangeText={v => setForm({
          ...form,
          email: v
        })} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
                    <TextInput placeholder={t("كلمة المرور")} placeholderTextColor={theme.colors.textMuted} value={form.password} onChangeText={v => setForm({
          ...form,
          password: v
        })} secureTextEntry style={styles.input} />
                    <TextInput placeholder={t("رقم الجوال") + ` (${phoneExampleFor(form.country_code)})`} placeholderTextColor={theme.colors.textMuted} value={form.phone} onChangeText={v => setForm({
          ...form,
          phone: v.replace(/\D/g, "")
        })} keyboardType="phone-pad" style={styles.input} testID="register-phone-input" />

                    <TouchableOpacity onPress={submit} disabled={busy} style={[styles.btn, busy && styles.btnDisabled]}>
                        <Text style={styles.btnText}>{busy ? "..." : t("إنشاء حساب")}</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>{t("أو")}</Text><View style={styles.line} /></View>
                    <SocialButtons navigation={navigation} onSuccess={() => refresh()} />

                    <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
                        <Text style={styles.linkText}>{t("لديك حساب بالفعل؟")} <Text style={styles.linkStrong}>{t("تسجيل الدخول")}</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16
  },
  // Auth header — RIGHT: back-to-home; LEFT: language pill.
  authHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 12
  },
  headerHomeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  headerHomeText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 14
  },
  headerLangPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#89CFF0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2
  },
  headerLangText: {
    color: theme.colors.primaryDeep,
    fontWeight: "800",
    fontSize: 12.5
  },
  langSheetBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.40)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  langSheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#89CFF0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12
  },
  langSheetTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 12
  },
  langRow: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 2
  },
  langRowActive: {
    backgroundColor: "rgba(137,207,240,0.12)"
  },
  langRowText: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: "right",
    fontWeight: "700"
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadow.soft
  },
  logo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    marginBottom: 12
  },
  logoMain: {
    fontSize: 30,
    fontWeight: "900",
    color: theme.colors.secondary
  },
  logoSub: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
    marginStart: 6
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    color: theme.colors.text,
    marginBottom: 16
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: theme.radius.md,
    marginBottom: 10
  },
  errorText: {
    color: "#B91C1C",
    textAlign: "right",
    fontSize: 13
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
  bioBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    marginTop: 8
  },
  bioIcon: {
    fontSize: 18
  },
  bioText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 14
  },
  enableBioBox: {
    backgroundColor: "#E8F2FA",
    borderRadius: theme.radius.md,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary + "40"
  },
  enableBioText: {
    color: theme.colors.text,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "700"
  },
  enableBioRow: {
    flexDirection: "row",
    gap: 8
  },
  enableBioYes: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: "center"
  },
  enableBioYesText: {
    color: theme.colors.primaryFg,
    fontWeight: "900",
    fontSize: 13
  },
  enableBioNo: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  enableBioNoText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    fontSize: 13
  },
  linkWrap: {
    marginTop: 14,
    alignItems: "center"
  },
  linkText: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  linkStrong: {
    color: theme.colors.primary,
    fontWeight: "700"
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 12
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 11
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: theme.radius.md
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "900",
    fontSize: 14
  },
  googleText: {
    color: "#222",
    fontWeight: "800",
    fontSize: 14
  },
  appleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: theme.radius.md
  },
  appleIcon: {
    color: "#fff",
    fontSize: 16
  },
  appleText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14
  },
  xBtn: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    alignItems: "center"
  },
  xText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14
  },
  snapBtn: {
    flex: 1,
    backgroundColor: "#FFFC00",
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    alignItems: "center"
  },
  snapText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 14
  }
});