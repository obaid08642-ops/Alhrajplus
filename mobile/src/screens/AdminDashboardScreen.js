import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { Shield, Users, FileText, Flag, MessageCircle, Eye, MousePointerClick, RefreshCw } from "lucide-react-native";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";
import api from "../api";
import { colors, shadow } from "../theme";

const EMPTY = { users: 0, listings: 0, active_listings: 0, pending_moderation: 0, open_reports: 0, messages_24h: 0, total_views: 0, total_clicks: 0 };

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const [stats, setStats] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (user?.role !== "admin") {
      setLoading(false);
      setError(t("لا تملك صلاحية لوحة الإدارة"));
      return;
    }
    setError("");
    try {
      const { data } = await api.get("/admin/stats");
      setStats({ ...EMPTY, ...(data || {}) });
    } catch (e) {
      setError(e.response?.data?.detail || t("تعذر تحميل لوحة الإدارة"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, t]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={[styles.center, { backgroundColor: palette.bg }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.muted}>{t("جاري تحميل لوحة الإدارة...")}</Text></View>;
  if (error) return <View style={[styles.center, { backgroundColor: palette.bg }]}><Shield size={42} color={colors.danger || "#DC2626"} /><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load} style={styles.retry}><RefreshCw size={16} color="#fff" /><Text style={styles.retryText}>{t("إعادة المحاولة")}</Text></TouchableOpacity></View>;

  const rows = [
    { key: "users", label: t("المستخدمون"), value: stats.users, Icon: Users, color: "#2563EB", bg: "#DBEAFE" },
    { key: "listings", label: t("الإعلانات"), value: stats.listings, Icon: FileText, color: "#0EA5E9", bg: "#E0F2FE" },
    { key: "active", label: t("إعلانات نشطة"), value: stats.active_listings, Icon: Shield, color: "#059669", bg: "#D1FAE5" },
    { key: "pending", label: t("بانتظار المراجعة"), value: stats.pending_moderation, Icon: Flag, color: "#D97706", bg: "#FEF3C7" },
    { key: "reports", label: t("بلاغات مفتوحة"), value: stats.open_reports, Icon: Flag, color: "#DC2626", bg: "#FEE2E2" },
    { key: "messages", label: t("رسائل آخر 24 ساعة"), value: stats.messages_24h, Icon: MessageCircle, color: "#7C3AED", bg: "#EDE9FE" },
    { key: "views", label: t("إجمالي المشاهدات"), value: stats.total_views, Icon: Eye, color: "#0891B2", bg: "#CFFAFE" },
    { key: "clicks", label: t("إجمالي النقرات"), value: stats.total_clicks, Icon: MousePointerClick, color: "#BE185D", bg: "#FCE7F3" },
  ];

  return <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
    <View style={[styles.hero, shadow.card]}><Shield size={26} color="#fff" /><View style={{ flex: 1 }}><Text style={styles.heroTitle}>{t("لوحة الإدارة")}</Text><Text style={styles.heroSub}>{t("ملخص تشغيلي مباشر من بيانات المنصة")}</Text></View><TouchableOpacity onPress={load} style={styles.heroRefresh}><RefreshCw size={16} color="#fff" /></TouchableOpacity></View>
    <View style={styles.grid}>{rows.map(({ key, label, value, Icon, color, bg }) => <View key={key} style={[styles.card, shadow.card]} testID={`admin-stat-${key}`}><View style={[styles.icon, { backgroundColor: bg }]}><Icon size={18} color={color} /></View><Text style={styles.value}>{Number(value || 0).toLocaleString()}</Text><Text style={styles.label}>{label}</Text></View>)}</View>
    <View style={styles.note}><Shield size={16} color={colors.primary} /><Text style={styles.noteText}>{t("هذه الشاشة متاحة لحسابات الأدمن فقط. تبقى صلاحية Backend هي الحماية الفعلية لكل بيانات وأوامر الإدارة.")}</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }, content: { padding: 14, paddingBottom: 48 }, muted: { color: colors.textMuted, fontSize: 13 }, error: { color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "center" }, retry: { flexDirection: "row", gap: 7, alignItems: "center", backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }, retryText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.primary, borderRadius: 22, padding: 18, marginBottom: 14 }, heroTitle: { color: "#fff", fontSize: 19, fontWeight: "900" }, heroSub: { color: "rgba(255,255,255,0.88)", fontSize: 11, marginTop: 2 }, heroRefresh: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, card: { width: "48.5%", backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 13 }, icon: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 9 }, value: { color: colors.text, fontSize: 22, fontWeight: "900" }, label: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 14 }, noteText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 17 },
});
