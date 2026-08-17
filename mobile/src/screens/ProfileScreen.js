// ProfileScreen — rebuilt to match web ProfilePage visual polish.
// Shows: header card (avatar + name + verified + stats), quick actions grid, full menu list.
import { useEffect, useState, useCallback } from "react";
import { useI18n } from "../I18nContext";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, StatusBar, Alert, Share } from "react-native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Platform, Linking } from "react-native";
import { User, Heart, ListIcon, LogOut, Settings, Info, FileText, Mail, Shield, ChevronLeft, Wallet, Coins, Sparkles, Bell, Bookmark, Users as UsersIcon, Award, Copy, MapPin, Gavel, Plane, Flame, Tag, Download, Apple, Smartphone } from "lucide-react-native";
import { useAuth } from "../AuthContext";
import api from "../api";
import { useThemeMode } from "../ThemeContext";
import { colors, radius, shadow } from "../theme";
import CountrySwitcher from "../components/CountrySwitcher";
export default function ProfileScreen() {
  const { t } = useI18n();
  const { isDark, palette } = useThemeMode();
  
  const {
    user,
    logout,
    refresh: refreshUser
  } = useAuth();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [referral, setReferral] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [coins, setCoins] = useState(null);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const canAccessAdmin = user?.role === "admin";
  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [s, r, w, c] = await Promise.all([api.get("/auth/me/stats").catch(() => ({
        data: null
      })), api.get("/referral/me").catch(() => ({
        data: null
      })), api.get("/wallet/me").catch(() => ({
        data: null
      })), api.get("/coins/me").catch(() => ({
        data: null
      }))]);
      setStats(s.data);
      setReferral(r.data);
      setWalletBalance(w.data?.balance ?? null);
      setCoins(c.data);
    } catch (_) {}
  }, [user]);
  const onProfileFocus = useCallback(() => { load(); }, [load]);
  useFocusEffect(onProfileFocus);
  if (!user) {
    return <View style={{
      flex: 1,
      backgroundColor: palette.bg
    }}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.bg} />
                <View style={[s.guestWrap, {
        paddingTop: insets.top + 60
      }]}>
                    <View style={s.guestAvatar}>
                        <LinearGradient colors={[colors.primary, "#7CCAEC"]} style={StyleSheet.absoluteFillObject} />
                        <User size={36} color="#fff" />
                    </View>
                    <Text style={s.guestTitle}>{t("مرحباً بك في الحراج بلس")}</Text>
                    <Text style={s.guestSub}>{t("سجّل دخولك لإدارة إعلاناتك ومحفظتك")}</Text>
                    <View style={{
          flexDirection: "row",
          gap: 10,
          marginTop: 16
        }}>
                        <TouchableOpacity onPress={() => nav.navigate("Login")} style={s.guestPrimaryBtn}>
                            <Text style={s.guestPrimaryText}>{t("تسجيل الدخول")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => nav.navigate("Register")} style={s.guestSecondaryBtn}>
                            <Text style={s.guestSecondaryText}>{t("حساب جديد")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>;
  }
  const copyReferral = async () => {
    const code = referral?.code || "";
    const url = `https://alhraj.online/register?ref=${code}`;
    try {
      await Share.share({
        message: `كود الإحالة: ${code}\nانضم لي على الحراج بلس واحصل على مكافأة!\n${url}`
      });
    } catch (_) {}
  };
  const togglePhoneVisibility = async () => {
    if (!user) return;
    setPhoneBusy(true);
    try {
      const next = user.show_phone === false ? true : false;
      await api.put("/users/me", {
        show_phone: next
      });
      await refreshUser?.();
      Alert.alert("✅", next ? t("أصبح رقم جوالك مرئياً للمشترين") : t("تم إخفاء رقم جوالك"));
    } catch (e) {
      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
    } finally {
      setPhoneBusy(false);
    }
  };
  const onLogout = () => {
    Alert.alert(t("تأكيد"), t("هل تريد تسجيل الخروج؟"), [{
      text: t("إلغاء"),
      style: "cancel"
    }, {
      text: t("خروج"),
      style: "destructive",
      onPress: async () => {
        await logout();
        nav.navigate("HomeTab");
      }
    }]);
  };
  return <ScrollView style={{
    flex: 1,
    backgroundColor: palette.bg
  }} contentContainerStyle={{
    paddingBottom: 130
  }} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />

            {/* Hero / Profile header */}
            <View style={[s.heroWrap, {
      paddingTop: insets.top + 14
    }]}>
                <LinearGradient colors={[colors.secondary, "#1A2952", colors.secondary]} style={StyleSheet.absoluteFillObject} start={{
        x: 1,
        y: 0
      }} end={{
        x: 0,
        y: 1
      }} />
                <View style={[s.heroBlob, {
        top: -50,
        right: -50,
        backgroundColor: "rgba(137,207,240,0.25)"
      }]} />
                <View style={[s.heroBlob, {
        bottom: -50,
        left: -50,
        backgroundColor: "rgba(255,209,102,0.15)"
      }]} />

                <View style={s.heroInner}>
                    <View style={s.countrySwitcherWrap} testID="profile-country-switcher">
                        <CountrySwitcher tintLight />
                    </View>
                    <View style={s.avatarBox}>
                        {user.avatar ? <Image source={{
            uri: user.avatar
          }} style={s.avatarImg} /> : <LinearGradient colors={[colors.primary, "#7CCAEC"]} style={s.avatarImg}>
                                <Text style={s.avatarTxt}>{(user.name || "U").slice(0, 1).toUpperCase()}</Text>
                            </LinearGradient>}
                        {user.verified && <View style={s.verifiedBadge}><Award size={11} color="#fff" /></View>}
                    </View>
                    <Text style={s.heroName} numberOfLines={1}>{user.name || t("مستخدم")}</Text>
                    <Text style={s.heroEmail} numberOfLines={1}>{user.email}</Text>

                    {/* Stats */}
                    <View style={s.statsRow}>
                        <Stat label={t("إعلانات")} value={stats?.listings_count ?? "—"} />
                        <View style={s.statDivider} />
                        <Stat label={t("مفضلة")} value={stats?.favorites_count ?? "—"} />
                        <View style={s.statDivider} />
                        <Stat label={t("تقييم")} value={user.rating ? user.rating.toFixed(1) : "5.0"} />
                    </View>
                </View>
            </View>

            {/* Wallet quick balance */}
            <TouchableOpacity onPress={() => nav.navigate("Wallet")} style={[s.walletCard, shadow.card]}>
                <LinearGradient colors={[colors.primary, "#2A8CBD", colors.accent]} style={StyleSheet.absoluteFillObject} start={{
        x: 0,
        y: 0
      }} end={{
        x: 1,
        y: 0
      }} />
                <View style={s.walletIcon}><Wallet size={22} color="#fff" /></View>
                <View style={{
        flex: 1
      }}>
                    <Text style={s.walletLabel}>{t("رصيد محفظتي")}</Text>
                    <Text style={s.walletAmount}>{walletBalance !== null ? Number(walletBalance).toLocaleString() : "—"} <Text style={s.walletCurrency}>{t("ر.س")}</Text></Text>
                </View>
                <ChevronLeft size={20} color="#fff" />
            </TouchableOpacity>

            {coins && <TouchableOpacity onPress={() => nav.navigate("Wallet")} style={[s.coinsCard, shadow.card]} testID="profile-coins-card">
                    <View style={s.coinsIcon}><Coins size={22} color="#B7791F" /></View>
                    <View style={{ flex: 1 }}><Text style={s.coinsLabel}>{t("Coins")}</Text><Text style={s.coinsSub}>{t("تستخدم Coins لترويج إعلاناتك")}</Text></View>
                    <Text style={s.coinsAmount}>{Number(coins.balance || 0).toLocaleString()}</Text>
                </TouchableOpacity>}

            {/* Quick actions grid */}
            <View style={s.quickGrid}>
                <QuickTile icon={ListIcon} label={t("إعلاناتي")} tint="#3B82F6" tintBg="#DBEAFE" onPress={() => nav.navigate("MyListings")} />
                <QuickTile icon={Heart} label={t("المفضلة")} tint="#EF4444" tintBg="#FEE2E2" onPress={() => nav.navigate("Favorites")} />
                <QuickTile icon={Sparkles} label={t("المساعد")} tint={colors.primary} tintBg="rgba(137,207,240,0.18)" onPress={() => nav.navigate("AIAssistant")} />
                <QuickTile icon={Gavel} label={t("المزادات")} tint="#F59E0B" tintBg="#FEF3C7" onPress={() => nav.navigate("Auctions")} />
                <QuickTile icon={Tag} label={t("العروض")} tint="#0EA5E9" tintBg="#E0F2FE" onPress={() => nav.navigate("Offers")} />
                <QuickTile icon={Plane} label={t("الطيران")} tint="#0EA5E9" tintBg="#E0F2FE" onPress={() => nav.navigate("Flights")} />
                <QuickTile icon={Flame} label={t("الصفقات")} tint="#EF4444" tintBg="#FEE2E2" onPress={() => nav.navigate("Deals")} />
                <QuickTile icon={MapPin} label={t("الخريطة")} tint="#10B981" tintBg="#D1FAE5" onPress={() => nav.navigate("Map")} />
                <QuickTile icon={Bookmark} label={t("محفوظات")} tint="#8B5CF6" tintBg="#EDE9FE" onPress={() => nav.navigate("SavedSearches")} />
            </View>

            {/* Referral card */}
            {referral?.code && <View style={[s.refCard, shadow.card]}>
                    <View style={s.refIcon}><UsersIcon size={20} color={colors.accent} /></View>
                    <View style={{
        flex: 1
      }}>
                        <Text style={s.refTitle}>{t("برنامج الإحالة")}</Text>
                        <Text style={s.refSub}>{t("دعوة الأصدقاء = مكافآت لك")}</Text>
                        <View style={s.refCodeRow}>
                            <Text style={s.refCode}>{referral.code}</Text>
                            <Text style={s.refInvited}>{referral.invited_count || 0} مدعوين</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={copyReferral} style={s.refShareBtn} testID="profile-copy-referral">
                        <Copy size={14} color={colors.secondary} />
                        <Text style={s.refShareText}>{t("مشاركة")}</Text>
                    </TouchableOpacity>
                </View>}

            {/* Menu list */}
            <View style={[s.menuCard, shadow.card]}>
                <MenuRow icon={Bell} label={t("الإشعارات")} onPress={() => nav.navigate("Notifications")} />
                <MenuRow icon={Settings} label={t("الإعدادات")} onPress={() => nav.navigate("Settings")} />
                {canAccessAdmin && <MenuRow icon={Shield} label={t("لوحة الإدارة")} onPress={() => nav.navigate("AdminDashboard")} testID="menu-admin-dashboard" />}
                <MenuRow icon={UsersIcon} label={t("متابعاتي")} onPress={() => nav.navigate("Following")} />
                <MenuRow icon={Bell} label={t("قائمة المتابعة")} onPress={() => nav.navigate("Watchlist")} testID="profile-watchlist" />
                <MenuRow icon={Smartphone} label={user.phone_verified ? t("رقم الهاتف موثّق") : t("إضافة وتوثيق رقم الهاتف")} onPress={() => nav.navigate("PhoneVerification")} testID="profile-phone-verification" />
                <TouchableOpacity onPress={togglePhoneVisibility} activeOpacity={0.65} disabled={phoneBusy} style={[s.menuRow, s.menuRowBorder]} testID="profile-toggle-phone">
                    <MapPin size={18} color={colors.primary} />
                    <Text style={s.menuLabel}>
                        {user.show_phone === false ? t("إظهار رقم جوالي للمشترين") : t("إخفاء رقم جوالي عن المشترين")}
                    </Text>
                    {phoneBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <ChevronLeft size={14} color={colors.textMuted} />}
                </TouchableOpacity>
                <MenuRow icon={Info} label={t("عن التطبيق")} onPress={() => nav.navigate("StaticPage", {
        slug: "about"
      })} />
                <MenuRow icon={FileText} label={t("الشروط والأحكام")} onPress={() => nav.navigate("StaticPage", {
        slug: "terms"
      })} />
                <MenuRow icon={Shield} label={t("سياسة الخصوصية")} onPress={() => nav.navigate("StaticPage", {
        slug: "privacy"
      })} />
                <MenuRow icon={Mail} label={t("تواصل معنا")} onPress={() => nav.navigate("StaticPage", {
        slug: "contact"
      })} />
                <MenuRow icon={LogOut} label={t("تسجيل الخروج")} tint="#EF4444" onPress={onLogout} last />
            </View>

            {/* Download App card — mobile users see their store as primary, others secondary */}
            <DownloadAppCardMobile t={t} />

            <Text style={s.versionText} testID="profile-version">v{Constants.expoConfig?.version || Constants.manifest?.version || "1.0.0"}</Text>
        </ScrollView>;
}

function DownloadAppCardMobile({ t }) {
    const isIOS = Platform.OS === "ios";
    const isAndroid = Platform.OS === "android";
    // Store URLs are read from Expo extra config so we never hardcode them.
    const extra = Constants.expoConfig?.extra || {};
    const APPSTORE = extra.appStoreUrl || "";
    const PLAY = extra.playStoreUrl || "";
    const APPGALLERY = extra.appGalleryUrl || "";
    const open = (u) => { if (u) Linking.openURL(u).catch(() => {}); };

    const stores = [
        { key: "appstore", label: "App Store", sub: "iOS", url: APPSTORE, Icon: Apple, match: isIOS },
        { key: "playstore", label: "Google Play", sub: "Android", url: PLAY, Icon: Smartphone, match: isAndroid },
        { key: "appgallery", label: "AppGallery", sub: "Huawei", url: APPGALLERY, Icon: Download, match: false },
    ];
    const primary = stores.find(s => s.match && s.url);
    const others = primary ? stores.filter(s => s.key !== primary.key) : stores;

    return (
        <View style={s.dlCard} testID="profile-download-card">
            <View style={s.dlHeader}>
                <Download size={18} color={colors.primary} strokeWidth={2.4} />
                <Text style={s.dlTitle}>{t("حمّل التطبيق")}</Text>
            </View>
            <Text style={s.dlSub}>{t("تجربة أسرع، إشعارات فورية، ومميزات حصرية على الجوال.")}</Text>
            {primary && (
                <TouchableOpacity onPress={() => open(primary.url)} style={s.dlPrimary} activeOpacity={0.85} testID={`download-primary-${primary.key}`}>
                    <primary.Icon size={20} color="#fff" strokeWidth={2.4} />
                    <Text style={s.dlPrimaryText}>{`${t("نزّل من")} ${primary.label}`}</Text>
                </TouchableOpacity>
            )}
            <View style={s.dlOthersRow}>
                {others.map(st => (
                    <TouchableOpacity
                        key={st.key}
                        disabled={!st.url}
                        onPress={() => open(st.url)}
                        style={[s.dlOther, !st.url && s.dlOtherDisabled]}
                        testID={`download-store-${st.key}`}
                        activeOpacity={0.75}
                    >
                        <st.Icon size={18} color={st.url ? colors.text : colors.textMuted} />
                        <Text style={[s.dlOtherLabel, !st.url && { color: colors.textMuted }]}>{st.label}</Text>
                        <Text style={s.dlOtherSub}>{st.url ? st.sub : t("قريباً")}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}
function Stat({
  label,
  value
}) {
  return <View style={{
    flex: 1,
    alignItems: "center"
  }}>
            <Text style={s.statValue}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
        </View>;
}
function QuickTile({
  icon: Icon,
  label,
  tint,
  tintBg,
  onPress
}) {
  return <TouchableOpacity onPress={onPress} style={s.tileBtn} activeOpacity={0.85}>
            <View style={[s.tileIcon, {
      backgroundColor: tintBg
    }]}>
                <Icon size={20} color={tint} strokeWidth={2.2} />
            </View>
            <Text style={s.tileLabel}>{label}</Text>
        </TouchableOpacity>;
}
function MenuRow({
  icon: Icon,
  label,
  onPress,
  tint = colors.primary,
  last = false,
  testID
}) {
  return <TouchableOpacity onPress={onPress} activeOpacity={0.65} style={[s.menuRow, !last && s.menuRowBorder]} testID={testID}>
            <Icon size={18} color={tint} />
            <Text style={[s.menuLabel, tint === "#EF4444" && {
      color: "#EF4444"
    }]}>{label}</Text>
            <ChevronLeft size={14} color={colors.textMuted} />
        </TouchableOpacity>;
}
const s = StyleSheet.create({
  // Guest
  guestWrap: {
    alignItems: "center",
    paddingHorizontal: 24
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text
  },
  guestSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4
  },
  guestPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10
  },
  guestPrimaryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800"
  },
  guestSecondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  guestSecondaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  // Hero
  heroWrap: {
    paddingBottom: 24,
    overflow: "hidden",
    position: "relative"
  },
  heroBlob: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999
  },
  heroInner: {
    alignItems: "center",
    paddingHorizontal: 20
  },
  countrySwitcherWrap: {
    position: "absolute",
    top: 4,
    end: 16,
    zIndex: 5
  },
  avatarBox: {
    width: 88,
    height: 88,
    position: "relative"
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)"
  },
  avatarTxt: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900"
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    end: 0,
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.secondary
  },
  heroName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10
  },
  heroEmail: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11.5,
    marginTop: 2
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "stretch"
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900"
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  // Wallet card
  coinsCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#F6D365"
  },
  coinsIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  coinsLabel: { fontSize: 15, fontWeight: "900", color: "#7C4A03" },
  coinsSub: { fontSize: 11, color: "#9A6B24", marginTop: 2 },
  coinsAmount: { fontSize: 21, fontWeight: "900", color: "#B7791F" },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
    marginTop: -14,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    overflow: "hidden"
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  walletLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700"
  },
  walletAmount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2
  },
  walletCurrency: {
    fontSize: 11,
    fontWeight: "700"
  },
  // Quick grid
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    marginTop: 14,
    gap: 0
  },
  tileBtn: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 10,
    gap: 5
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text
  },
  // Referral
  refCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  refIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,209,102,0.18)",
    alignItems: "center",
    justifyContent: "center"
  },
  refTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text
  },
  refSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1
  },
  refCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6
  },
  refCode: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
    backgroundColor: "rgba(137,207,240,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  refInvited: {
    fontSize: 10,
    color: colors.textMuted
  },
  refShareBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  refShareText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.secondary
  },
  // Menu
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginHorizontal: 12,
    marginTop: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  menuLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.text
  },
  versionText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: 20
  },
  // Download App card
  dlCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    marginHorizontal: 12,
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(137,207,240,0.30)",
    ...shadow.card
  },
  dlHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6
  },
  dlTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.text
  },
  dlSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 17
  },
  dlPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#89CFF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  dlPrimaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14
  },
  dlOthersRow: {
    flexDirection: "row",
    gap: 8
  },
  dlOther: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  dlOtherDisabled: {
    opacity: 0.55
  },
  dlOtherLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text
  },
  dlOtherSub: {
    fontSize: 9.5,
    color: colors.textMuted
  }
});