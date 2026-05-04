import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useAuth } from "../AuthContext";
import { theme } from "../theme";
import { formatApiError } from "../api";
import { signInWithGoogleEmergent } from "../googleAuth";

function GoogleBtn({ onSuccess }) {
    const [busy, setBusy] = useState(false);
    const run = async () => {
        setBusy(true);
        try {
            const user = await signInWithGoogleEmergent();
            onSuccess?.(user);
        } catch (e) {
            Alert.alert("خطأ", e.message || "فشل تسجيل الدخول بـ Google");
        } finally { setBusy(false); }
    };
    return (
        <TouchableOpacity onPress={run} disabled={busy} style={[styles.googleBtn, busy && styles.btnDisabled]} testID="mobile-google-btn">
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>{busy ? "..." : "متابعة بحساب Google"}</Text>
        </TouchableOpacity>
    );
}

export function LoginScreen({ navigation }) {
    const { login, refresh } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async () => {
        setErr(""); setBusy(true);
        try {
            await login(email, password);
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || "فشل تسجيل الدخول");
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

                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>أو</Text><View style={styles.line} /></View>
                    <GoogleBtn onSuccess={() => refresh()} />

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
                    <GoogleBtn onSuccess={() => refresh()} />

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
});
