import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useAuth } from "../AuthContext";
import { theme } from "../theme";
import { formatApiError } from "../api";
import { signInWithGoogle, signInWithApple, signInWithX, signInWithSnapchat } from "../socialAuth";
import { isBiometricAvailable, isBiometricEnabled, enableBiometric, tryBiometricLogin } from "../biometric";

function SocialButtons({ onSuccess }) {
    const [busy, setBusy] = useState(null); // provider key or null
    const run = (provider, fn) => async () => {
        setBusy(provider);
        try {
            await fn();
            onSuccess?.();
        } catch (e) {
            if (!String(e?.message || "").includes("إلغاء")) {
                Alert.alert("خطأ", e.message || `فشل تسجيل الدخول بـ ${provider}`);
            }
        } finally { setBusy(null); }
    };
    return (
        <View style={{ gap: 8 }}>
            <TouchableOpacity onPress={run("google", signInWithGoogle)} disabled={!!busy} style={[styles.googleBtn, busy && styles.btnDisabled]} testID="mobile-google-btn">
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>{busy === "google" ? "..." : "متابعة بحساب Google"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={run("apple", signInWithApple)} disabled={!!busy} style={[styles.appleBtn, busy && styles.btnDisabled]} testID="mobile-apple-btn">
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleText}>{busy === "apple" ? "..." : "متابعة بحساب Apple"}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity onPress={run("x", signInWithX)} disabled={!!busy} style={[styles.xBtn, busy && styles.btnDisabled]} testID="mobile-x-btn">
                    <Text style={styles.xText}>{busy === "x" ? "..." : "X"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={run("snapchat", signInWithSnapchat)} disabled={!!busy} style={[styles.snapBtn, busy && styles.btnDisabled]} testID="mobile-snap-btn">
                    <Text style={styles.snapText}>{busy === "snapchat" ? "..." : "Snapchat"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export function LoginScreen({ navigation }) {
    const { login, refresh } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [bioAvailable, setBioAvailable] = useState(false);
    const [bioEnabled, setBioEnabled] = useState(false);
    const [bioLabel, setBioLabel] = useState("البصمة");
    const [askEnable, setAskEnable] = useState(false);

    useEffect(() => {
        (async () => {
            const info = await isBiometricAvailable();
            setBioAvailable(info.available);
            if (info.types) {
                // 1=Fingerprint, 2=Facial, 3=Iris
                if (info.types.includes(2)) setBioLabel("FaceID");
                else if (info.types.includes(1)) setBioLabel("بصمة الإصبع");
            }
            const enabled = await isBiometricEnabled();
            setBioEnabled(enabled);
            if (enabled && info.available) {
                // Auto-prompt on mount
                const creds = await tryBiometricLogin();
                if (creds?.email && creds?.password) {
                    setBusy(true);
                    try { await login(creds.email, creds.password); } catch (_) {} finally { setBusy(false); }
                }
            }
        })();
    }, []);

    const submit = async () => {
        setErr(""); setBusy(true);
        try {
            await login(email, password);
            // After successful password login, offer to enable biometric
            const enabled = await isBiometricEnabled();
            if (!enabled && bioAvailable) {
                setAskEnable(true);
            }
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || "فشل تسجيل الدخول");
        } finally { setBusy(false); }
    };

    const doEnableBio = async () => {
        const ok = await enableBiometric(email, password);
        if (ok) {
            setBioEnabled(true);
            Alert.alert("✅ تم", `تم تفعيل الدخول بـ${bioLabel}. استخدمه في المرة القادمة.`);
        }
        setAskEnable(false);
    };

    const doBiometricLogin = async () => {
        setBusy(true);
        try {
            const creds = await tryBiometricLogin();
            if (creds?.email && creds?.password) {
                await login(creds.email, creds.password);
            } else {
                setErr("فشل الدخول بالبصمة. استخدم كلمة المرور.");
            }
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || "فشل الدخول");
        } finally { setBusy(false); }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <View style={styles.logo}>
                        <Text style={styles.logoMain}>الحراج</Text>
                        <Text style={styles.logoSub}>بلس</Text>
                    </View>
                    <Text style={styles.title}>تسجيل الدخول</Text>

                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}

                    <TextInput
                        placeholder="البريد الإلكتروني"
                        placeholderTextColor={theme.colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                        testID="mobile-login-email"
                    />
                    <TextInput
                        placeholder="كلمة المرور"
                        placeholderTextColor={theme.colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={styles.input}
                        testID="mobile-login-password"
                    />

                    <TouchableOpacity onPress={submit} disabled={busy} style={[styles.btn, busy && styles.btnDisabled]} testID="mobile-login-submit">
                        <Text style={styles.btnText}>{busy ? "..." : "دخول"}</Text>
                    </TouchableOpacity>

                    {bioEnabled && bioAvailable && (
                        <TouchableOpacity onPress={doBiometricLogin} disabled={busy} style={[styles.bioBtn]} testID="mobile-biometric-btn">
                            <Text style={styles.bioIcon}>🔐</Text>
                            <Text style={styles.bioText}>الدخول بـ{bioLabel}</Text>
                        </TouchableOpacity>
                    )}

                    {askEnable && (
                        <View style={styles.enableBioBox}>
                            <Text style={styles.enableBioText}>تفعيل الدخول بـ{bioLabel} في المرات القادمة؟</Text>
                            <View style={styles.enableBioRow}>
                                <TouchableOpacity onPress={doEnableBio} style={styles.enableBioYes} testID="mobile-enable-bio-yes">
                                    <Text style={styles.enableBioYesText}>تفعيل</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setAskEnable(false)} style={styles.enableBioNo}>
                                    <Text style={styles.enableBioNoText}>ليس الآن</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>أو</Text><View style={styles.line} /></View>
                    <SocialButtons onSuccess={() => refresh()} />

                    <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
                        <Text style={styles.linkText}>ليس لديك حساب؟ <Text style={styles.linkStrong}>إنشاء حساب</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export function RegisterScreen({ navigation }) {
    const { register, refresh } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", country_code: "SA" });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async () => {
        setErr(""); setBusy(true);
        try {
            await register(form);
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || "فشل إنشاء الحساب");
        } finally { setBusy(false); }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <View style={styles.logo}>
                        <Text style={styles.logoMain}>الحراج</Text>
                        <Text style={styles.logoSub}>بلس</Text>
                    </View>
                    <Text style={styles.title}>إنشاء حساب جديد</Text>

                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}

                    <TextInput placeholder="الاسم" placeholderTextColor={theme.colors.textMuted} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} style={styles.input} />
                    <TextInput placeholder="البريد الإلكتروني" placeholderTextColor={theme.colors.textMuted} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
                    <TextInput placeholder="كلمة المرور (8+ أحرف)" placeholderTextColor={theme.colors.textMuted} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry style={styles.input} />
                    <TextInput placeholder="رقم الجوال (بدون رمز الدولة)" placeholderTextColor={theme.colors.textMuted} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v.replace(/\D/g, "") })} keyboardType="phone-pad" style={styles.input} />

                    <TouchableOpacity onPress={submit} disabled={busy} style={[styles.btn, busy && styles.btnDisabled]}>
                        <Text style={styles.btnText}>{busy ? "..." : "إنشاء حساب"}</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>أو</Text><View style={styles.line} /></View>
                    <SocialButtons onSuccess={() => refresh()} />

                    <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
                        <Text style={styles.linkText}>لديك حساب؟ <Text style={styles.linkStrong}>تسجيل الدخول</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 16 },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    logo: { flexDirection: "row", justifyContent: "center", alignItems: "baseline", marginBottom: 12 },
    logoMain: { fontSize: 30, fontWeight: "900", color: theme.colors.secondary },
    logoSub: { fontSize: 16, fontWeight: "700", color: theme.colors.primary, marginStart: 6 },
    title: { fontSize: 18, fontWeight: "800", textAlign: "center", color: theme.colors.text, marginBottom: 16 },
    errorBox: { backgroundColor: "#FEE2E2", padding: 10, borderRadius: theme.radius.md, marginBottom: 10 },
    errorText: { color: "#B91C1C", textAlign: "right", fontSize: 13 },
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
        textAlign: "right",
    },
    btn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.radius.md, alignItems: "center", marginTop: 6 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: theme.colors.primaryFg, fontWeight: "900", fontSize: 15 },
    bioBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: theme.colors.surfaceElevated, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 12, marginTop: 8 },
    bioIcon: { fontSize: 18 },
    bioText: { color: theme.colors.primary, fontWeight: "800", fontSize: 14 },
    enableBioBox: { backgroundColor: "#E8F2FA", borderRadius: theme.radius.md, padding: 12, marginTop: 10, borderWidth: 1, borderColor: theme.colors.primary + "40" },
    enableBioText: { color: theme.colors.text, fontSize: 13, textAlign: "center", marginBottom: 10, fontWeight: "700" },
    enableBioRow: { flexDirection: "row", gap: 8 },
    enableBioYes: { flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "center" },
    enableBioYesText: { color: theme.colors.primaryFg, fontWeight: "900", fontSize: 13 },
    enableBioNo: { flex: 1, backgroundColor: "transparent", paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "center", borderWidth: 1, borderColor: theme.colors.border },
    enableBioNoText: { color: theme.colors.textMuted, fontWeight: "700", fontSize: 13 },
    linkWrap: { marginTop: 14, alignItems: "center" },
    linkText: { color: theme.colors.textMuted, fontSize: 13 },
    linkStrong: { color: theme.colors.primary, fontWeight: "700" },
    divider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12 },
    line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    dividerText: { color: theme.colors.textMuted, fontSize: 11 },
    googleBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
        backgroundColor: "#fff",
        borderWidth: 1, borderColor: theme.colors.border,
        paddingVertical: 12, borderRadius: theme.radius.md,
    },
    googleIcon: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: "#4285F4", color: "#fff",
        textAlign: "center", lineHeight: 24,
        fontWeight: "900", fontSize: 14,
    },
    googleText: { color: "#222", fontWeight: "800", fontSize: 14 },
    appleBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        backgroundColor: "#000",
        paddingVertical: 12, borderRadius: theme.radius.md,
    },
    appleIcon: { color: "#fff", fontSize: 16 },
    appleText: { color: "#fff", fontWeight: "800", fontSize: 14 },
    xBtn: {
        flex: 1, backgroundColor: "#000",
        paddingVertical: 11, borderRadius: theme.radius.md, alignItems: "center",
    },
    xText: { color: "#fff", fontWeight: "900", fontSize: 14 },
    snapBtn: {
        flex: 1, backgroundColor: "#FFFC00",
        paddingVertical: 11, borderRadius: theme.radius.md, alignItems: "center",
    },
    snapText: { color: "#000", fontWeight: "900", fontSize: 14 },
});
