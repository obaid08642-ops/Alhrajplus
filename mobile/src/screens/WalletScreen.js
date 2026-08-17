import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Wallet, TrendingUp, TrendingDown, Gift, Sparkles, Coins as CoinsIcon, ShieldCheck } from "lucide-react-native";
import { useAuth } from "../AuthContext";
import api from "../api";
import { colors, shadow } from "../theme";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

const emptyCash = { balance: 0, currency: "SAR", transactions: [] };
const emptyCoins = { balance: 0, ledger: [] };

export default function WalletScreen() {
  const { t, lang } = useI18n();
  const locale = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : lang === "tr" ? "tr-TR" : "en-US";
  const { user } = useAuth();
  const { palette } = useThemeMode();
  const nav = useNavigation();
  const [cash, setCash] = useState(emptyCash);
  const [coins, setCoins] = useState(emptyCoins);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [walletRes, coinsRes] = await Promise.all([
        api.get("/wallet/me").catch(() => ({ data: emptyCash })),
        api.get("/coins/me").catch(() => ({ data: emptyCoins })),
      ]);
      setCash({ ...emptyCash, ...(walletRes.data || {}), transactions: Array.isArray(walletRes.data?.transactions) ? walletRes.data.transactions : [] });
      setCoins({ ...emptyCoins, ...(coinsRes.data || {}), ledger: Array.isArray(coinsRes.data?.ledger) ? coinsRes.data.ledger : [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const hasWelcomeCoins = coins.ledger.some((tx) => tx.type === "welcome_bonus" || tx.idempotency_key === "welcome_coins_v1");
  const claimWelcomeCoins = async () => {
    setClaiming(true);
    try {
      const { data } = await api.post("/coins/claim-welcome-bonus");
      Alert.alert(t("تم"), `${t("تم استلام مكافأة الـCoins")} +${Number(data.amount || 0).toLocaleString(locale)} Coins`);
      setCoins((old) => ({ ...old, balance: data.balance }));
      load();
    } catch (e) {
      Alert.alert(t("تنبيه"), e.response?.data?.detail || t("تعذر استلام مكافأة الـCoins"));
    } finally {
      setClaiming(false);
    }
  };

  if (!user) {
    return <View style={[styles.centerWrap, { backgroundColor: palette.bg }]}>
      <Wallet size={48} color={colors.textMuted} />
      <Text style={styles.guestText}>{t("سجّل دخولك لعرض محفظتك")}</Text>
      <TouchableOpacity onPress={() => nav.navigate("Login")} style={styles.signInBtn}><Text style={styles.signInText}>{t("تسجيل الدخول")}</Text></TouchableOpacity>
    </View>;
  }

  return <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 12, paddingBottom: 130 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
    <View style={styles.balanceGrid}>
      <View style={[styles.heroWrap, shadow.card]} testID="cash-wallet-card">
        <LinearGradient colors={[colors.primary, "#2A8CBD", colors.accent]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.heroInner}>
          <View style={styles.heroRow}><Wallet size={18} color="#fff" /><Text style={styles.heroLabel}>{t("الرصيد النقدي")}</Text></View>
          <Text style={styles.heroBalance}>{Number(cash.balance || 0).toLocaleString(locale)}</Text>
          <Text style={styles.heroCurrency}>{cash.currency || "SAR"}</Text>
          <Text style={styles.cashNotice}>{t("شحن الرصيد النقدي غير متاح حالياً؛ لن يتم إنشاء أي رصيد أو دفعة تلقائياً.")}</Text>
        </View>
      </View>
      <View style={[styles.coinsCard, shadow.card]} testID="coins-wallet-card">
        <View style={styles.coinsRow}><CoinsIcon size={19} color="#B7791F" /><Text style={styles.coinsLabel}>{t("رصيد Coins")}</Text></View>
        <Text style={styles.coinsBalance}>{Number(coins.balance || 0).toLocaleString(locale)}</Text>
        <Text style={styles.coinsSub}>{t("Coins مكافآت افتراضية داخل المنصة وليست ريالاً سعودياً.")}</Text>
      </View>
    </View>

    {user.verified && !hasWelcomeCoins && <View style={styles.bonusCard} testID="welcome-coins-card">
      <View style={styles.bonusIcon}><Gift size={22} color={colors.accent} /></View>
      <View style={{ flex: 1 }}><Text style={styles.bonusTitle}>{t("مكافأة الترحيب بالـCoins")}</Text><Text style={styles.bonusSub}>{t("مكافأة افتراضية اختيارية بعد توثيق الحساب؛ لا تضيف أي رصيد نقدي.")}</Text></View>
      <TouchableOpacity onPress={claimWelcomeCoins} disabled={claiming} style={styles.bonusBtn}>{claiming ? <ActivityIndicator color={colors.secondary} size="small" /> : <Sparkles size={14} color={colors.secondary} />}<Text style={styles.bonusBtnText}>{t("استلم Coins")}</Text></TouchableOpacity>
    </View>}
    {!user.verified && <View style={styles.verifyCard}><ShieldCheck size={18} color={colors.primary} /><Text style={styles.verifyText}>{t("وثّق حسابك أولاً لإتاحة مكافأة الترحيب بالـCoins إن كانت مفعلة.")}</Text></View>}

    <View style={styles.quickRow}>
      <TouchableOpacity onPress={() => nav.navigate("MyListings")} style={[styles.quickCard, { flex: 1 }]}><Sparkles size={22} color={colors.primary} /><Text style={styles.quickTitle}>{t("عزّز إعلاناً")}</Text><Text style={styles.quickSub}>{t("يُخصم من رصيد Coins فقط")}</Text></TouchableOpacity>
      <View style={[styles.quickCard, { flex: 1, opacity: 0.7 }]} testID="cash-topup-unavailable"><Wallet size={22} color={colors.textMuted} /><Text style={styles.quickTitle}>{t("شحن الرصيد النقدي")}</Text><Text style={styles.quickSub}>{t("غير متاح حتى ربط بوابة دفع حقيقية")}</Text></View>
    </View>

    <LedgerSection title={t("سجل Coins")} rows={coins.ledger} loading={loading} locale={locale} />
    <LedgerSection title={t("سجل الرصيد النقدي")} rows={cash.transactions} loading={loading} locale={locale} cash />
  </ScrollView>;
}

function LedgerSection({ title, rows, loading, locale, cash = false }) {
  return <View style={[styles.txWrap, { marginTop: 14 }]}><View style={styles.txHead}><Text style={styles.txHeadText}>{title}</Text></View>{loading ? <ActivityIndicator color={colors.primary} style={{ padding: 24 }} /> : rows.length === 0 ? <Text style={styles.emptyText}>{cash ? "لا توجد عمليات نقدية بعد" : "لا توجد حركات Coins بعد"}</Text> : rows.map((tx, i) => <LedgerRow key={tx.id || i} tx={tx} locale={locale} cash={cash} last={i === rows.length - 1} />)}</View>;
}

function LedgerRow({ tx, locale, cash, last }) {
  const positive = Number(tx.amount || 0) > 0;
  return <View style={[styles.txRow, last && { borderBottomWidth: 0 }]} testID={`tx-${tx.id}`}><View style={[styles.txIcon, { backgroundColor: positive ? "#D1FAE5" : "#FEE2E2" }]}>{positive ? <TrendingUp size={16} color="#10B981" /> : <TrendingDown size={16} color="#EF4444" />}</View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.purpose || tx.type || "—"}</Text><Text style={styles.txDate}>{tx.created_at ? new Date(tx.created_at).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" }) : ""}</Text></View><Text style={[styles.txAmount, { color: positive ? "#10B981" : "#EF4444" }]}>{positive ? "+" : ""}{Number(tx.amount || 0).toLocaleString(locale)}{cash ? " SAR" : ""}</Text></View>;
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  guestText: { color: colors.textMuted, fontSize: 14 }, signInBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10 }, signInText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  balanceGrid: { gap: 12 }, heroWrap: { borderRadius: 28, overflow: "hidden" }, heroInner: { padding: 22 }, heroRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }, heroLabel: { color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: "700" }, heroBalance: { color: "#fff", fontSize: 42, fontWeight: "900", lineHeight: 50 }, heroCurrency: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }, cashNotice: { color: "rgba(255,255,255,0.88)", fontSize: 11, lineHeight: 17, marginTop: 12 },
  coinsCard: { backgroundColor: "#FFF8DD", borderWidth: 1, borderColor: "#F7D98A", borderRadius: 24, padding: 18 }, coinsRow: { flexDirection: "row", alignItems: "center", gap: 6 }, coinsLabel: { color: colors.text, fontSize: 13, fontWeight: "800" }, coinsBalance: { color: "#9A6A00", fontSize: 36, fontWeight: "900", marginTop: 6 }, coinsSub: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  bonusCard: { marginTop: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderStyle: "dashed", borderColor: colors.accent, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, bonusIcon: { width: 44, height: 44, borderRadius: 999, backgroundColor: "rgba(255,209,102,0.18)", alignItems: "center", justifyContent: "center" }, bonusTitle: { fontSize: 13, fontWeight: "800", color: colors.text }, bonusSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 }, bonusBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 }, bonusBtnText: { color: colors.secondary, fontWeight: "800", fontSize: 12 },
  verifyCard: { marginTop: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 13, flexDirection: "row", gap: 9, alignItems: "center" }, verifyText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 12 }, quickCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 }, quickTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginTop: 4 }, quickSub: { fontSize: 10, color: colors.textMuted },
  txWrap: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }, txHead: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }, txHeadText: { fontSize: 13, fontWeight: "800", color: colors.text }, emptyText: { padding: 24, textAlign: "center", color: colors.textMuted, fontSize: 12 }, txRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }, txIcon: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" }, txDesc: { fontSize: 13, fontWeight: "700", color: colors.text }, txDate: { fontSize: 10, color: colors.textMuted, marginTop: 1 }, txAmount: { fontSize: 15, fontWeight: "900" },
});
