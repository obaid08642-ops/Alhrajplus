import { useCallback, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, Alert } from "react-native";
import { Tag, Check, X, RefreshCw, Clock } from "lucide-react-native";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import api from "../api";

export default function OffersScreen() {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [counter, setCounter] = useState(null);
  const [counterAmount, setCounterAmount] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { const { data } = await api.get("/offers/mine"); setOffers(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])); } catch (_) { setOffers([]); } finally { setLoading(false); }
  }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decide = async (offer, action, amount) => {
    setBusy(offer.id);
    try { await api.patch(`/listing-offers/${offer.id}`, { action, counter_amount: amount ? Number(amount) : undefined }); setCounter(null); setCounterAmount(""); await load(); }
    catch (e) { Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر تحديث العرض")); }
    finally { setBusy(""); }
  };
  const openCounter = (offer) => { setCounter(offer); setCounterAmount(String(offer.amount || "")); };

  if (!user) return <View style={[s.center, { backgroundColor: palette.bg }]}><Text style={{ color: palette.text }}>{t("سجل الدخول لإدارة عروضك")}</Text></View>;
  return <ScrollView style={[s.wrap, { backgroundColor: palette.bg }]} contentContainerStyle={s.content}>
    <Text style={[s.title, { color: palette.text }]}>{t("العروض والمفاوضات")}</Text>
    <Text style={[s.sub, { color: palette.textMuted }]}>{t("العروض الواردة والصادرة مع الصلاحية والعروض المضادة")}</Text>
    {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : offers.length === 0 ? <View style={s.empty}><Tag size={34} color={palette.textMuted} /><Text style={[s.emptyText, { color: palette.textMuted }]}>{t("لا توجد عروض بعد")}</Text></View> : offers.map((offer) => {
      const expired = ["accepted", "rejected", "expired"].includes(offer.status);
      return <View key={offer.id} style={[s.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate("ListingDetail", { id: offer.listing_id })} style={s.cardTop}>
          <View style={s.icon}><Tag size={18} color={colors.primary} /></View>
          <View style={{ flex: 1 }}><Text style={[s.listingTitle, { color: palette.text }]} numberOfLines={1}>{offer.listing?.title || t("إعلان غير متاح")}</Text><Text style={[s.meta, { color: palette.textMuted }]}>{offer.is_seller ? t("عرض وارد") : t("عرضي")} · {Number(offer.amount || 0).toLocaleString()} {offer.currency || ""}</Text></View>
          <View style={[s.badge, { backgroundColor: offer.status === "accepted" ? "#DCFCE7" : offer.status === "rejected" || offer.status === "expired" ? "#FEE2E2" : "#FEF3C7" }]}><Text style={s.badgeText}>{offer.status === "accepted" ? t("مقبول") : offer.status === "rejected" ? t("مرفوض") : offer.status === "expired" ? t("منتهي") : offer.status === "countered" ? t("عرض مضاد") : t("قيد المراجعة")}</Text></View>
        </TouchableOpacity>
        {offer.expires_at && !expired && <Text style={[s.expiry, { color: palette.textMuted }]}><Clock size={12} color="#D97706" /> {t("ينتهي")}: {new Date(offer.expires_at).toLocaleString()}</Text>}
        {offer.is_seller && offer.status === "pending" && !expired && <View style={s.actions}><TouchableOpacity onPress={() => decide(offer, "accept")} disabled={busy === offer.id} style={[s.action, { backgroundColor: "#059669" }]}><Check size={14} color="#fff" /><Text style={s.actionText}>{t("قبول")}</Text></TouchableOpacity><TouchableOpacity onPress={() => openCounter(offer)} disabled={busy === offer.id} style={[s.action, { backgroundColor: "#F59E0B" }]}><RefreshCw size={14} color="#fff" /><Text style={s.actionText}>{t("عرض مضاد")}</Text></TouchableOpacity><TouchableOpacity onPress={() => decide(offer, "reject")} disabled={busy === offer.id} style={[s.action, { backgroundColor: "#DC2626" }]}><X size={14} color="#fff" /><Text style={s.actionText}>{t("رفض")}</Text></TouchableOpacity></View>}
      </View>;
    })}
    <Modal visible={!!counter} transparent animationType="fade" onRequestClose={() => setCounter(null)}><View style={s.modalBg}><View style={[s.modal, { backgroundColor: palette.surface }]}><Text style={[s.modalTitle, { color: palette.text }]}>{t("العرض المضاد")}</Text><TextInput value={counterAmount} onChangeText={setCounterAmount} keyboardType="decimal-pad" placeholder={t("قيمة العرض")} placeholderTextColor={palette.textMuted} style={[s.input, { color: palette.text, borderColor: palette.border }]} /><View style={s.modalActions}><TouchableOpacity onPress={() => setCounter(null)} style={[s.modalBtn, { backgroundColor: palette.surfaceElevated }]}><Text style={{ color: palette.text, fontWeight: "800" }}>{t("إلغاء")}</Text></TouchableOpacity><TouchableOpacity onPress={() => counterAmount && decide(counter, "counter", counterAmount)} style={[s.modalBtn, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryFg, fontWeight: "800" }}>{t("إرسال")}</Text></TouchableOpacity></View></View></View></Modal>
  </ScrollView>;
}

const s = StyleSheet.create({ wrap: { flex: 1 }, content: { padding: 18, paddingBottom: 100 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, title: { fontSize: 24, fontWeight: "900", marginBottom: 5 }, sub: { fontSize: 13, marginBottom: 18 }, card: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 10 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 10 }, icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(59,130,246,.12)", alignItems: "center", justifyContent: "center" }, listingTitle: { fontSize: 14, fontWeight: "800" }, meta: { fontSize: 11, marginTop: 4 }, badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 }, badgeText: { fontSize: 10, fontWeight: "800", color: "#374151" }, expiry: { fontSize: 11, marginTop: 9, flexDirection: "row", alignItems: "center", gap: 4 }, actions: { flexDirection: "row", gap: 7, marginTop: 12 }, action: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4 }, actionText: { color: "#fff", fontSize: 11, fontWeight: "800" }, empty: { alignItems: "center", padding: 60, gap: 10 }, emptyText: { fontSize: 14 }, modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,.55)", alignItems: "center", justifyContent: "center", padding: 20 }, modal: { width: "100%", maxWidth: 420, borderRadius: 20, padding: 18 }, modalTitle: { fontSize: 18, fontWeight: "900", marginBottom: 12 }, input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 }, modalActions: { flexDirection: "row", gap: 8, marginTop: 14 }, modalBtn: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12 }
});
