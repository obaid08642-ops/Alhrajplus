import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from "react-native";
import { useAuth } from "../AuthContext";
import { theme } from "../theme";
import { useI18n } from "../I18nContext";

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { lang, setLang, t } = useI18n();

    if (!user) {
        return (
            <SafeAreaView style={styles.wrap}>
                <View style={styles.guestBox}>
                    <Text style={styles.guestTitle}>{t("لم تسجل دخولك بعد")}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Auth")} style={styles.btn}>
                        <Text style={styles.btnText}>{t("تسجيل الدخول")}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const doLogout = () => {
        Alert.alert(t("تأكيد"), t("هل تريد تسجيل الخروج؟"), [
            { text: t("إلغاء"), style: "cancel" },
            { text: t("نعم"), onPress: logout },
        ]);
    };

    return (
        <SafeAreaView style={styles.wrap}>
            <View style={styles.header}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{user.name?.[0] || "U"}</Text></View>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
                {user.referral_code && (
                    <View style={styles.refBox}>
                        <Text style={styles.refLabel}>{t("كود الإحالة الخاص بك")}</Text>
                        <Text style={styles.refCode}>{user.referral_code}</Text>
                    </View>
                )}
            </View>

            <View style={styles.menu}>
                <MenuItem label={t("إعلاناتي")} onPress={() => navigation.navigate("MyListings")} />
                <MenuItem label={t("المفضلة")} onPress={() => navigation.navigate("Favorites")} />
                <MenuItem label={t("المحادثات")} onPress={() => navigation.navigate("Chat")} />
                <MenuItem label={t("الإشعارات")} onPress={() => navigation.navigate("Notifications")} />
                <MenuItem label={t("بحث")} onPress={() => navigation.navigate("Search")} />
                <MenuItem label={t("التصنيفات")} onPress={() => navigation.navigate("Categories")} />
                <MenuItem label={t("الإعدادات")} onPress={() => navigation.navigate("Settings")} />
                {user.role === "admin" && (
                    <MenuItem label={t("⚙️ لوحة الإدارة")} onPress={() => {}} accent />
                )}
                <MenuItem label={t("تسجيل الخروج")} onPress={doLogout} danger />
            </View>
        </SafeAreaView>
    );
}

function MenuItem({ label, onPress, danger, accent }) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.menuItem}>
            <Text style={[styles.menuLabel, danger && { color: theme.colors.danger }, accent && { color: theme.colors.accent, fontWeight: "900" }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    guestBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    guestTitle: { fontSize: 16, color: theme.colors.text, marginBottom: 16 },
    header: { padding: 24, alignItems: "center", backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    avatarText: { color: theme.colors.primaryFg, fontSize: 28, fontWeight: "900" },
    name: { fontSize: 18, fontWeight: "900", color: theme.colors.text, marginTop: 10 },
    email: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    refBox: { marginTop: 14, backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radius.lg, padding: 12, alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, minWidth: 200 },
    refLabel: { fontSize: 11, color: theme.colors.textMuted },
    refCode: { fontSize: 18, fontWeight: "900", color: theme.colors.primary, letterSpacing: 2, marginTop: 4 },
    menu: { marginTop: 12, backgroundColor: theme.colors.surface },
    menuItem: { paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    menuLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.text, textAlign: "right" },
    btn: { backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: theme.radius.full },
    btnText: { color: theme.colors.primaryFg, fontWeight: "900" },
});
