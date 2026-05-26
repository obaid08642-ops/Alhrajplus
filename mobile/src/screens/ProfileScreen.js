// ProfileScreen — rebuilt to match web ProfilePage visual polish.
// Shows: header card (avatar + name + verified + stats), quick actions grid, full menu list.
import { useEffect, useState, useCallback } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
    ActivityIndicator, StatusBar, Alert, Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
    User, Heart, ListIcon, LogOut, Settings, Info, FileText, Mail,
    Shield, ChevronLeft, Wallet, Sparkles, Bell, Bookmark, Users as UsersIcon,
    Award, Copy, MapPin, Gavel, Plane, Flame,
} from "lucide-react-native";
import { useAuth } from "../AuthContext";
import api from "../api";
import { colors, radius, shadow } from "../theme";
import CountrySwitcher from "../components/CountrySwitcher";

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const nav = useNavigation();
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState(null);
    const [referral, setReferral] = useState(null);
    const [walletBalance, setWalletBalance] = useState(null);

    const load = useCallback(async () => {
        if (!user) return;
        try {
            const [s, r, w] = await Promise.all([
                api.get("/auth/me/stats").catch(() => ({ data: null })),
                api.get("/referral/me").catch(() => ({ data: null })),
                api.get("/wallet/me").catch(() => ({ data: null })),
            ]);
            setStats(s.data);
            setReferral(r.data);
            setWalletBalance(w.data?.balance ?? null);
        } catch (_) {}
    }, [user]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    if (!user) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
                <View style={[s.guestWrap, { paddingTop: insets.top + 60 }]}>
                    <View style={s.guestAvatar}>
                        <LinearGradient colors={[colors.primary, "#7CCAEC"]} style={StyleSheet.absoluteFillObject} />
                        <User size={36} color="#fff" />
                    </View>
                    <Text style={s.guestTitle}>مرحباً بك في الحراج بلس</Text>
                    <Text style={s.guestSub}>سجّل دخولك لإدارة إعلاناتك ومحفظتك</Text>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                        <TouchableOpacity onPress={() => nav.navigate("Login")} style={s.guestPrimaryBtn}>
                            <Text style={s.guestPrimaryText}>تسجيل الدخول</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => nav.navigate("Register")} style={s.guestSecondaryBtn}>
                            <Text style={s.guestSecondaryText}>حساب جديد</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    const copyReferral = async () => {
        const url = `https://alhraj.online/register?ref=${referral?.code || ""}`;
        try {
            await Share.share({ message: `انضم لي على الحراج بلس واحصل على مكافأة!\n${url}` });
        } catch (_) {}
    };

    const onLogout = () => {
        Alert.alert("تأكيد", "هل تريد تسجيل الخروج؟", [
            { text: "إلغاء", style: "cancel" },
            { text: "خروج", style: "destructive", onPress: async () => { await logout(); nav.navigate("HomeTab"); } },
        ]);
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />

            {/* Hero / Profile header */}
            <View style={[s.heroWrap, { paddingTop: insets.top + 14 }]}>
                <LinearGradient colors={[colors.secondary, "#1A2952", colors.secondary]} style={StyleSheet.absoluteFillObject} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} />
                <View style={[s.heroBlob, { top: -50, right: -50, backgroundColor: "rgba(79,182,230,0.25)" }]} />
                <View style={[s.heroBlob, { bottom: -50, left: -50, backgroundColor: "rgba(255,209,102,0.15)" }]} />

                <View style={s.heroInner}>
                    <View style={{ position: "absolute", top: 0, end: 14, zIndex: 5 }}>
                        <CountrySwitcher tintLight />
                    </View>
                    <View style={s.avatarBox}>
                        {user.avatar ? <Image source={{ uri: user.avatar }} style={s.avatarImg} /> : (
                            <LinearGradient colors={[colors.primary, "#7CCAEC"]} style={s.avatarImg}>
                                <Text style={s.avatarTxt}>{(user.name || "U").slice(0, 1).toUpperCase()}</Text>
                            </LinearGradient>
                        )}
                        {user.verified && (
                            <View style={s.verifiedBadge}><Award size={11} color="#fff" /></View>
                        )}
                    </View>
                    <Text style={s.heroName} numberOfLines={1}>{user.name || "مستخدم"}</Text>
                    <Text style={s.heroEmail} numberOfLines={1}>{user.email}</Text>

                    {/* Stats */}
                    <View style={s.statsRow}>
                        <Stat label="إعلانات" value={stats?.listings_count ?? "—"} />
                        <View style={s.statDivider} />
                        <Stat label="مفضلة" value={stats?.favorites_count ?? "—"} />
                        <View style={s.statDivider} />
                        <Stat label="تقييم" value={user.rating ? user.rating.toFixed(1) : "5.0"} />
                    </View>
                </View>
            </View>

            {/* Wallet quick balance */}
            <TouchableOpacity onPress={() => nav.navigate("Wallet")} style={[s.walletCard, shadow.card]}>
                <LinearGradient colors={[colors.primary, "#2A8CBD", colors.accent]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <View style={s.walletIcon}><Wallet size={22} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                    <Text style={s.walletLabel}>رصيد محفظتي</Text>
                    <Text style={s.walletAmount}>{walletBalance !== null ? Number(walletBalance).toLocaleString() : "—"} <Text style={s.walletCurrency}>ر.س</Text></Text>
                </View>
                <ChevronLeft size={20} color="#fff" />
            </TouchableOpacity>

            {/* Quick actions grid */}
            <View style={s.quickGrid}>
                <QuickTile icon={ListIcon} label="إعلاناتي" tint="#3B82F6" tintBg="#DBEAFE" onPress={() => nav.navigate("MyListings")} />
                <QuickTile icon={Heart} label="المفضلة" tint="#EF4444" tintBg="#FEE2E2" onPress={() => nav.navigate("Favorites")} />
                <QuickTile icon={Sparkles} label="المساعد" tint={colors.primary} tintBg="rgba(79,182,230,0.18)" onPress={() => nav.navigate("AIAssistant")} />
                <QuickTile icon={Gavel} label="المزادات" tint="#F59E0B" tintBg="#FEF3C7" onPress={() => nav.navigate("Auctions")} />
                <QuickTile icon={Plane} label="الطيران" tint="#0EA5E9" tintBg="#E0F2FE" onPress={() => nav.navigate("Flights")} />
                <QuickTile icon={Flame} label="الصفقات" tint="#EF4444" tintBg="#FEE2E2" onPress={() => nav.navigate("Deals")} />
                <QuickTile icon={MapPin} label="الخريطة" tint="#10B981" tintBg="#D1FAE5" onPress={() => nav.navigate("Map")} />
                <QuickTile icon={Bookmark} label="محفوظات" tint="#8B5CF6" tintBg="#EDE9FE" onPress={() => nav.navigate("SavedSearches")} />
            </View>

            {/* Referral card */}
            {referral?.code && (
                <View style={[s.refCard, shadow.card]}>
                    <View style={s.refIcon}><UsersIcon size={20} color={colors.accent} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.refTitle}>برنامج الإحالة</Text>
                        <Text style={s.refSub}>دعوة الأصدقاء = مكافآت لك</Text>
                        <View style={s.refCodeRow}>
                            <Text style={s.refCode}>{referral.code}</Text>
                            <Text style={s.refInvited}>{referral.invited_count || 0} مدعوين</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={copyReferral} style={s.refShareBtn}>
                        <Copy size={14} color={colors.secondary} />
                        <Text style={s.refShareText}>مشاركة</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Menu list */}
            <View style={[s.menuCard, shadow.card]}>
                <MenuRow icon={Bell} label="الإشعارات" onPress={() => nav.navigate("Notifications")} />
                <MenuRow icon={Settings} label="الإعدادات" onPress={() => nav.navigate("Settings")} />
                <MenuRow icon={UsersIcon} label="متابعاتي" onPress={() => nav.navigate("Following")} />
                <MenuRow icon={Info} label="عن التطبيق" onPress={() => nav.navigate("StaticPage", { slug: "about" })} />
                <MenuRow icon={FileText} label="الشروط والأحكام" onPress={() => nav.navigate("StaticPage", { slug: "terms" })} />
                <MenuRow icon={Shield} label="سياسة الخصوصية" onPress={() => nav.navigate("StaticPage", { slug: "privacy" })} />
                <MenuRow icon={Mail} label="تواصل معنا" onPress={() => nav.navigate("StaticPage", { slug: "contact" })} />
                <MenuRow icon={LogOut} label="تسجيل الخروج" tint="#EF4444" onPress={onLogout} last />
            </View>

            <Text style={s.versionText}>v1.0.0</Text>
        </ScrollView>
    );
}

function Stat({ label, value }) {
    return (
        <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.statValue}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
        </View>
    );
}

function QuickTile({ icon: Icon, label, tint, tintBg, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={s.tileBtn} activeOpacity={0.85}>
            <View style={[s.tileIcon, { backgroundColor: tintBg }]}>
                <Icon size={20} color={tint} strokeWidth={2.2} />
            </View>
            <Text style={s.tileLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

function MenuRow({ icon: Icon, label, onPress, last = false, tint = colors.primary }) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.65} style={[s.menuRow, !last && s.menuRowBorder]}>
            <Icon size={18} color={tint} />
            <Text style={[s.menuLabel, tint === "#EF4444" && { color: "#EF4444" }]}>{label}</Text>
            <ChevronLeft size={14} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    // Guest
    guestWrap: { alignItems: "center", paddingHorizontal: 24 },
    guestAvatar: { width: 80, height: 80, borderRadius: 999, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 14 },
    guestTitle: { fontSize: 18, fontWeight: "900", color: colors.text },
    guestSub: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 4 },
    guestPrimaryBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10 },
    guestPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
    guestSecondaryBtn: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
    guestSecondaryText: { color: colors.text, fontSize: 13, fontWeight: "800" },
    // Hero
    heroWrap: { paddingBottom: 24, overflow: "hidden", position: "relative" },
    heroBlob: { position: "absolute", width: 200, height: 200, borderRadius: 999 },
    heroInner: { alignItems: "center", paddingHorizontal: 20 },
    avatarBox: { width: 88, height: 88, position: "relative" },
    avatarImg: { width: 88, height: 88, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" },
    avatarTxt: { color: "#fff", fontSize: 38, fontWeight: "900" },
    verifiedBadge: { position: "absolute", bottom: 0, end: 0, width: 26, height: 26, borderRadius: 999, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.secondary },
    heroName: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 10 },
    heroEmail: { color: "rgba(255,255,255,0.7)", fontSize: 11.5, marginTop: 2 },
    statsRow: { flexDirection: "row", alignItems: "center", marginTop: 16, backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 20, alignSelf: "stretch" },
    statValue: { color: "#fff", fontSize: 16, fontWeight: "900" },
    statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 },
    statDivider: { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.2)" },
    // Wallet card
    walletCard: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 12, marginTop: -14, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 14, overflow: "hidden" },
    walletIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    walletLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" },
    walletAmount: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 2 },
    walletCurrency: { fontSize: 11, fontWeight: "700" },
    // Quick grid
    quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, marginTop: 14, gap: 0 },
    tileBtn: { width: "25%", alignItems: "center", paddingVertical: 10, gap: 5 },
    tileIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    tileLabel: { fontSize: 11, fontWeight: "800", color: colors.text },
    // Referral
    refCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 14, marginHorizontal: 12, marginTop: 14, borderWidth: 1, borderColor: colors.border },
    refIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,209,102,0.18)", alignItems: "center", justifyContent: "center" },
    refTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
    refSub: { fontSize: 10.5, color: colors.textMuted, marginTop: 1 },
    refCodeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    refCode: { fontSize: 12, fontWeight: "900", color: colors.primary, backgroundColor: "rgba(79,182,230,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    refInvited: { fontSize: 10, color: colors.textMuted },
    refShareBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 4 },
    refShareText: { fontSize: 11, fontWeight: "800", color: colors.secondary },
    // Menu
    menuCard: { backgroundColor: colors.surface, borderRadius: 18, marginHorizontal: 12, marginTop: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
    menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
    menuRowBorder: { borderBottomWidth: 1, borderColor: colors.border },
    menuLabel: { flex: 1, fontSize: 13.5, fontWeight: "700", color: colors.text },
    versionText: { textAlign: "center", color: colors.textMuted, fontSize: 10.5, marginTop: 20 },
});
