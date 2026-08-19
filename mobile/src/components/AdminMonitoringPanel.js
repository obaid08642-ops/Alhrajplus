import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle, CheckCircle2, Database, Globe2, ListChecks, Mail, RefreshCw, ServerCog, ShieldAlert } from "lucide-react-native";
import api from "../api";
import { useI18n } from "../I18nContext";
import { colors, shadow } from "../theme";

const EMPTY = { latest: null, history: [], metrics: {}, email_alerts_configured: false };
const STATUS = {
  healthy: { color: "#059669", bg: "#D1FAE5", label: "سليم", Icon: CheckCircle2 },
  degraded: { color: "#D97706", bg: "#FEF3C7", label: "بحاجة إلى متابعة", Icon: AlertTriangle },
  down: { color: "#DC2626", bg: "#FEE2E2", label: "عطل", Icon: ShieldAlert },
  pending: { color: "#64748B", bg: "#E2E8F0", label: "بانتظار الفحص", Icon: ServerCog },
};
const CHECK_LABELS = {
  mongo: "MongoDB", redis: "Redis", api_health: "API", robots: "robots.txt", sitemap: "sitemap.xml", listing_schema: "Schema الإعلان",
};

function latinNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatWhen(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short", calendar: "gregory", numberingSystem: "latn" }).format(date);
}

function StatusPill({ status }) {
  const { t } = useI18n();
  const current = STATUS[status] || STATUS.pending;
  const Icon = current.Icon;
  return <View style={[styles.pill, { backgroundColor: current.bg }]}><Icon size={13} color={current.color} /><Text style={[styles.pillText, { color: current.color }]}>{t(current.label)}</Text></View>;
}

export default function AdminMonitoringPanel() {
  const { t } = useI18n();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    setError("");
    try {
      const { data: next } = await api.get("/admin/monitoring");
      setData({ ...EMPTY, ...(next || {}) });
    } catch (err) {
      setError(err?.response?.data?.detail || t("تعذر تحميل حالة المراقبة"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), 60000);
    return () => clearInterval(interval);
  }, [load]);

  const runNow = useCallback(() => {
    Alert.alert(t("تشغيل فحص المراقبة"), t("سيجري فحص API والفهرسة وSchema دون تعديل الإعلانات أو إرسال تنبيه بريد يدوي."), [
      { text: t("إلغاء"), style: "cancel" },
      { text: t("فحص الآن"), onPress: async () => {
        setRunning(true);
        setError("");
        try {
          const { data: result } = await api.post("/admin/monitoring/run");
          setData(previous => ({ ...previous, latest: result, history: [result, ...(previous.history || [])].slice(0, 30) }));
          await load({ silent: true });
        } catch (err) {
          setError(err?.response?.data?.detail || t("تعذر تنفيذ الفحص"));
        } finally {
          setRunning(false);
        }
      } },
    ]);
  }, [load, t]);

  const latest = data.latest;
  const latestStatus = latest?.status || "pending";
  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{t("جاري تحميل مراقبة المنصة...")}</Text></View>;

  return <View style={styles.root} testID="admin-monitoring-panel">
    <View style={[styles.header, shadow.card]}>
      <View style={styles.headerIcon}><ServerCog size={21} color="#FFFFFF" /></View>
      <View style={styles.headerCopy}><Text style={styles.title}>{t("مراقبة المنصة والفهرسة")}</Text><Text style={styles.subtitle}>{t("API وMongo وRedis وrobots وsitemap وSchema الإعلان")}</Text></View>
      <StatusPill status={latestStatus} />
    </View>

    <View style={styles.actionRow}>
      <TouchableOpacity onPress={() => load()} style={styles.secondaryButton} disabled={refreshing || running} accessibilityRole="button" accessibilityLabel={t("تحديث حالة المراقبة")}><RefreshCw size={16} color={colors.primary} /><Text style={styles.secondaryText}>{refreshing ? t("جاري التحديث...") : t("تحديث")}</Text></TouchableOpacity>
      <TouchableOpacity onPress={runNow} style={styles.primaryButton} disabled={running} accessibilityRole="button" testID="admin-monitoring-run"><ListChecks size={16} color="#FFFFFF" /><Text style={styles.primaryText}>{running ? t("جاري الفحص...") : t("فحص الآن")}</Text></TouchableOpacity>
    </View>

    <View style={styles.metricsGrid}>
      <Metric label={t("فحوص فاشلة")} value={latest?.failed_count} color="#DC2626" />
      <Metric label={t("تحذيرات")} value={latest?.warning_count} color="#D97706" />
      <Metric label={t("P95 API (ms)")} value={data.metrics?.latency_ms?.p95} color="#2563EB" />
      <Metric label={t("أخطاء API")} value={data.metrics?.errors_total} color="#7C3AED" />
    </View>

    <View style={styles.metaRow}><Globe2 size={15} color={colors.textMuted} /><Text style={styles.metaText}>{t("آخر فحص:")} {formatWhen(latest?.checked_at, t("لم يُنفذ فحص بعد"))}</Text></View>
    <View style={styles.metaRow}><Mail size={15} color={colors.textMuted} /><Text style={styles.metaText}>{data.email_alerts_configured ? t("تنبيه البريد مفعّل") : t("تنبيه البريد يحتاج إعداد Resend والبريد الإداري")}</Text></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}

    <Text style={styles.sectionTitle}>{t("فحوص الحالة")}</Text>
    <View style={styles.checks}>{(latest?.checks || []).map(check => <CheckCard key={check.name} check={check} t={t} />)}{!latest?.checks?.length ? <Text style={styles.empty}>{t("لا توجد نتيجة فحص بعد")}</Text> : null}</View>

    <Text style={styles.sectionTitle}>{t("آخر حالات المراقبة")}</Text>
    <View style={[styles.history, shadow.card]}>{(data.history || []).slice(0, 10).map(row => <View key={row.id || row.checked_at} style={styles.historyRow}><Text style={styles.historyWhen}>{formatWhen(row.checked_at, "—")}</Text><StatusPill status={row.status} /><Text style={styles.historyCounts}>{latinNumber(row.failed_count)} / {latinNumber(row.warning_count)}</Text></View>)}{!data.history?.length ? <Text style={styles.empty}>{t("لا توجد نتائج بعد")}</Text> : null}</View>
  </View>;
}

function Metric({ label, value, color }) {
  return <View style={[styles.metric, shadow.card]}><Text style={[styles.metricValue, { color }]}>{latinNumber(value)}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function CheckCard({ check, t }) {
  const state = !check.ok ? STATUS.down : check.warning ? STATUS.degraded : STATUS.healthy;
  const Icon = check.name === "mongo" || check.name === "redis" ? Database : check.name === "api_health" ? ServerCog : Globe2;
  const response = [check.status_code || "—", check.latency_ms == null ? null : `${latinNumber(check.latency_ms)} ms`].filter(Boolean).join(" · ");
  return <View style={[styles.check, { borderColor: state.color + "55", backgroundColor: state.bg + "66" }]}><View style={styles.checkTop}><View style={[styles.checkIcon, { backgroundColor: state.color + "20" }]}><Icon size={16} color={state.color} /></View><View style={styles.checkCopy}><Text style={styles.checkName}>{t(CHECK_LABELS[check.name] || check.name)}</Text><Text style={styles.checkDetail}>{check.detail || "—"}</Text></View><Text style={styles.checkResponse}>{response}</Text></View></View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 16 }, loading: { alignItems: "center", padding: 24, gap: 10 }, muted: { color: colors.textMuted, fontSize: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, padding: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, headerIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1 }, title: { color: colors.text, fontSize: 15, fontWeight: "900", textAlign: "right" }, subtitle: { color: colors.textMuted, fontSize: 10, marginTop: 2, textAlign: "right" },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }, pillText: { fontSize: 10, fontWeight: "800" }, actionRow: { flexDirection: "row", gap: 8, marginTop: 10 }, primaryButton: { flex: 1, minHeight: 42, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: colors.primary, borderRadius: 12 }, primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 }, secondaryButton: { flex: 1, minHeight: 42, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, secondaryText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }, metric: { width: "48.8%", borderRadius: 14, padding: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, metricValue: { fontSize: 18, fontWeight: "900" }, metricLabel: { marginTop: 2, color: colors.textMuted, fontSize: 10 }, metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }, metaText: { flex: 1, color: colors.textMuted, fontSize: 10, textAlign: "right" }, error: { color: "#B91C1C", backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10, marginTop: 10, fontSize: 11, textAlign: "right" },
  sectionTitle: { marginTop: 16, marginBottom: 8, color: colors.text, fontSize: 14, fontWeight: "900", textAlign: "right" }, checks: { gap: 8 }, check: { borderWidth: 1, borderRadius: 14, padding: 10 }, checkTop: { flexDirection: "row", alignItems: "center", gap: 8 }, checkIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" }, checkCopy: { flex: 1 }, checkName: { color: colors.text, fontSize: 12, fontWeight: "800", textAlign: "right" }, checkDetail: { color: colors.textMuted, fontSize: 10, marginTop: 2, textAlign: "right" }, checkResponse: { color: colors.textMuted, fontSize: 10, fontVariant: ["tabular-nums"] },
  history: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 11 }, historyRow: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border }, historyWhen: { flex: 1, color: colors.textMuted, fontSize: 10, fontVariant: ["tabular-nums"] }, historyCounts: { color: colors.textMuted, fontSize: 10, fontVariant: ["tabular-nums"] }, empty: { color: colors.textMuted, textAlign: "center", fontSize: 11, padding: 16 },
});
