// WalletScreen — mirrors web /app/frontend/src/pages/WalletPage.js
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Wallet, TrendingUp, TrendingDown, Gift, Sparkles } from "lucide-react-native";
import { useAuth } from "../AuthContext";
import { useCountry } from "../CountryContext";
import api from "../api";
import { colors, radius, shadow } from "../theme";

export default function WalletScreen() {
    const { user } = useAuth();
    const { current: country } = useCountry();
    const nav = useNavigation();
    const [data, setData] = useState({ balance: 0, currency: "SAR", transactions: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [claiming, setClaiming] = useState(false);

    const load = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        try {
            const { data: r } = await api.get("/wallet/me");
            setData(r);
        } catch (_) {}
        finally { setLoading(false); setRefreshing(false); }
    }, [user]);

    useEffect(() => { load(); }, [load]);

    const claimBonus = async () => {
        setClaiming(true);
        try {
            const { data: r } = await api.post("/wallet/claim-welcome-bonus");
            Alert.alert("تم!", `تم استلام مكافأتك ${r.amount} ر.س 🎉`);
            setData((d) => ({ ...d, balance: r.balance }));
            load();
        } catch (e) {
            const msg = e.response?.data?.detail || "تعذر استلام المكافأة";
            Alert.alert("تنبيه", typeof msg === "string" ? msg : "تعذر استلام المكافأة");
        } finally { setClaiming(false); }
    };

    if (!user) {
        return (
            <View style={styles.centerWrap}>
                <Wallet size={48} color={colors.textMuted} />
                <Text style={styles.guestText}>سجّل دخولك لعرض محفظتك</Text>
                <TouchableOpacity onPress={() => nav.navigate("Login")} style={styles.signInBtn}>
                    <Text style={styles.signInText}>تسجيل الدخول</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const hasBonus = (data.transactions || []).some((t) => t.type === "bonus");

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: 12, paddingBottom: 130 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        >
            {/* Balance Hero */}
            <View style={[styles.heroWrap, shadow.card]}>
                <LinearGradient colors={[colors.primary, "#2A8CBD", colors.accent]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={{ padding: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <Wallet size={18} color="#fff" />
                        <Text style={styles.heroLabel}>رصيد محفظتك</Text>
                    </View>
                    <Text style={styles.heroBalance}>{Number(data.balance || 0).toLocaleString()}</Text>
                    <Text style={styles.heroCurrency}>{data.currency || country?.currency_code || "SAR"}</Text>
                </View>
            </View>

            {/* Welcome bonus */}
            {!hasBonus && (
                <View style={styles.bonusCard}>
                    <View style={styles.bonusIcon}><Gift size={22} color={colors.accent} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bonusTitle}>مكافأة الانضمام</Text>
                        <Text style={styles.bonusSub}>احصل على 5 ر.س مجاناً لتجربة التعزيز</Text>
                    </View>
                    <TouchableOpacity onPress={claimBonus} disabled={claiming} style={styles.bonusBtn}>
                        {claiming ? <ActivityIndicator color={colors.secondary} size="small" /> : <Sparkles size={14} color={colors.secondary} />}
                        <Text style={styles.bonusBtnText}>استلم</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Quick actions */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity onPress={() => nav.navigate("MyListings")} style={[styles.quickCard, { flex: 1 }]}>
                    <Sparkles size={22} color={colors.primary} />
                    <Text style={styles.quickTitle}>عزّز إعلاناً</Text>
                    <Text style={styles.quickSub}>5 ر.س / أسبوع</Text>
                </TouchableOpacity>
                <View style={[styles.quickCard, { flex: 1, opacity: 0.55 }]}>
                    <Wallet size={22} color={colors.textMuted} />
                    <Text style={styles.quickTitle}>شحن المحفظة</Text>
                    <Text style={styles.quickSub}>قريباً</Text>
                </View>
            </View>

            {/* Transactions */}
            <View style={[styles.txWrap, { marginTop: 14 }]}>
                <View style={styles.txHead}><Text style={styles.txHeadText}>سجل العمليات</Text></View>
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ padding: 24 }} />
                ) : (data.transactions || []).length === 0 ? (
                    <Text style={styles.emptyText}>لا توجد عمليات بعد</Text>
                ) : (
                    data.transactions.map((tx, i) => {
                        const positive = (tx.amount || 0) > 0;
                        return (
                            <View key={tx.id || i} style={[styles.txRow, i === data.transactions.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={[styles.txIcon, { backgroundColor: positive ? "#D1FAE5" : "#FEE2E2" }]}>
                                    {positive ? <TrendingUp size={16} color="#10B981" /> : <TrendingDown size={16} color="#EF4444" />}
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleString("ar")}</Text>
                                </View>
                                <Text style={[styles.txAmount, { color: positive ? "#10B981" : "#EF4444" }]}>
                                    {positive ? "+" : ""}{Number(tx.amount).toLocaleString()}
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centerWrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
    guestText: { color: colors.textMuted, fontSize: 14 },
    signInBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10 },
    signInText: { color: "#fff", fontSize: 13, fontWeight: "800" },
    heroWrap: { borderRadius: 28, overflow: "hidden" },
    heroLabel: { color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: "700" },
    heroBalance: { color: "#fff", fontSize: 48, fontWeight: "900", lineHeight: 56 },
    heroCurrency: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
    bonusCard: {
        marginTop: 12, backgroundColor: colors.surface,
        borderRadius: 18, borderWidth: 2, borderStyle: "dashed", borderColor: colors.accent,
        padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
    },
    bonusIcon: { width: 44, height: 44, borderRadius: 999, backgroundColor: "rgba(255,209,102,0.18)", alignItems: "center", justifyContent: "center" },
    bonusTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
    bonusSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    bonusBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 },
    bonusBtnText: { color: colors.secondary, fontWeight: "800", fontSize: 12 },
    quickCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 },
    quickTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginTop: 4 },
    quickSub: { fontSize: 10, color: colors.textMuted },
    txWrap: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    txHead: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    txHeadText: { fontSize: 13, fontWeight: "800", color: colors.text },
    emptyText: { padding: 24, textAlign: "center", color: colors.textMuted, fontSize: 12 },
    txRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    txIcon: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },
    txDesc: { fontSize: 13, fontWeight: "700", color: colors.text },
    txDate: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
    txAmount: { fontSize: 15, fontWeight: "900" },
});
