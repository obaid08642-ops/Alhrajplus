import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from "react-native";
import { useAuth } from "../AuthContext";
import { theme } from "../theme";

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <SafeAreaView style={styles.wrap}>
                <View style={styles.guestBox}>
                    <Text style={styles.guestTitle}>لم تسجل دخولك بعد</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Auth")} style={styles.btn}>
                        <Text style={styles.btnText}>تسجيل الدخول</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const doLogout = () => {
        Alert.alert("تأكيد", "هل تريد تسجيل الخروج؟", [
            { text: "إلغاء", style: "cancel" },
            { text: "نعم", onPress: logout },
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
                        <Text style={styles.refLabel}>كود الإحالة الخاص بك</Text>
                        <Text style={styles.refCode}>{user.referral_code}</Text>
                    </View>
                )}
            </View>

            <View style={styles.menu}>
                <MenuItem label="إعلاناتي" onPress={() => navigation.navigate("MyListings")} />
                <MenuItem label="المفضلة" onPress={() => navigation.navigate("Favorites")} />
                <MenuItem label="المحادثات" onPress={() => navigation.navigate("Chat")} />
                <MenuItem label="الإعدادات" onPress={() => {}} />
                {user.role === "admin" && (
                    <MenuItem label="⚙️ لوحة الإدارة" onPress={() => {}} accent />
                )}
                <MenuItem label="تسجيل الخروج" onPress={doLogout} danger />
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
