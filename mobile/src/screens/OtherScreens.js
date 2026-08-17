import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Flame, Plane, Bell, Trash2 } from "lucide-react-native";
import api from "../api";
import { theme } from "../theme";
import { useCountry } from "../CountryContext";
import { useThemeMode } from "../ThemeContext";
import ListingCard from "../components/ListingCard";
import { useI18n } from "../I18nContext";

// FlatList perf defaults reused across screens — defined ONCE so we don't
// re-allocate inline objects on every render.
const FLAT_PERF = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  removeClippedSubviews: true
};
const keyExtractor = x => String(x?.id || x?._tempKey || Math.random());
function LoadingBlock() {
  return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
}
function EmptyBlock({
  text
}) {
  return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>;
}

// ---------- FAVORITES ----------
export function FavoritesScreen() {
  const {
    t
  } = useI18n();
  const { palette } = useThemeMode();
  const {
    dataVersion
  } = useCountry();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const {
        data
      } = await api.get("/favorites");
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load, dataVersion]);
  const onRefresh = () => {
    setRefreshing(true);
    load(false);
  };
  const renderItem = useCallback(({
    item
  }) => <ListingCard listing={item} />, []);
  return <SafeAreaView style={[styles.wrap, { backgroundColor: palette.bg }]}>
            <Text style={[styles.title, { color: palette.text }]}>{t("المفضلة")}</Text>
            {loading ? <LoadingBlock /> : <FlatList data={items} numColumns={2} keyExtractor={keyExtractor} renderItem={renderItem} contentContainerStyle={{
      padding: 8,
      paddingBottom: 130
    }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<EmptyBlock text={t("لا توجد إعلانات في المفضلة")} />} {...FLAT_PERF} />}
        </SafeAreaView>;
}

// ---------- WATCHLIST ----------
export function WatchlistScreen() {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const { dataVersion } = useCountry();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState("");
  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try { const { data } = await api.get("/watches"); setItems(Array.isArray(data) ? data : data?.items || []); }
    catch (_) { setItems([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load, dataVersion]);
  const remove = async (listingId) => {
    setBusy(listingId);
    try { await api.delete(`/watches/${listingId}`); setItems(rows => rows.filter(row => (row.listing_id || row.listing?.id) !== listingId)); }
    finally { setBusy(""); }
  };
  return <SafeAreaView style={[styles.wrap, { backgroundColor: palette.bg }]}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingTop: 8 }}><Bell size={21} color={theme.colors.primary} /><Text style={[styles.title, { color: palette.text, paddingHorizontal: 0 }]}>{t("قائمة المتابعة")}</Text></View>
    {loading ? <LoadingBlock /> : <FlatList data={items} numColumns={2} keyExtractor={keyExtractor} renderItem={({ item }) => { const listing = item.listing || item; const id = item.listing_id || listing?.id; return <View style={{ flex: 1, margin: 4 }}><ListingCard listing={listing} /><TouchableOpacity testID={`watch-remove-${id}`} disabled={busy === id} onPress={() => remove(id)} style={{ marginTop: 4, padding: 8, borderRadius: 9, backgroundColor: "#FEF2F2", flexDirection: "row", justifyContent: "center", gap: 5, alignItems: "center" }}><Trash2 size={14} color="#DC2626" /><Text style={{ color: "#B91C1C", fontWeight: "800", fontSize: 11 }}>{t("إلغاء المتابعة")}</Text></TouchableOpacity></View>; }} contentContainerStyle={{ padding: 8, paddingBottom: 130 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} />} ListEmptyComponent={<EmptyBlock text={t("لا توجد إعلانات في قائمة المتابعة")} />} {...FLAT_PERF} />}
  </SafeAreaView>;
}

// ---------- MY LISTINGS ----------
export function MyListingsScreen({
  navigation
}) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const {
        data
      } = await api.get("/listings/me/mine");
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const onRefresh = () => {
    setRefreshing(true);
    load(false);
  };
  const toggleBoost = useCallback(async item => {
    try {
      if (item.is_boosted) await api.delete(`/listings/${item.id}/boost`);else await api.post(`/listings/${item.id}/boost`);
      load(false);
    } catch (_) {}
  }, [load]);
  const renderItem = useCallback(({
    item
  }) => <View style={{
    flex: 1,
    padding: 4
  }}>
            <ListingCard listing={item} />
            <TouchableOpacity onPress={() => toggleBoost(item)} style={[styles.boostBtn, item.is_boosted && styles.boostBtnActive]} testID={`boost-${item.id}`}>
                {item.is_boosted ? <Star size={12} color="#fff" fill="#fff" /> : <Rocket size={12} color={theme.colors.primary} />}
                <Text style={[styles.boostText, item.is_boosted && {
        color: "#fff"
      }]}>
                    {item.is_boosted ? t("مُروَّج") : t("رَوِّج")}
                </Text>
            </TouchableOpacity>
        </View>, [toggleBoost]);
  return <SafeAreaView style={[styles.wrap, { backgroundColor: palette.bg }]}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: palette.text }]}>{t("إعلاناتي")}</Text>
                <TouchableOpacity onPress={() => navigation?.navigate?.("Post")} style={styles.addBtn} testID="mylistings-add-btn">
                    <Text style={styles.addText}>{t("+ إضافة")}</Text>
                </TouchableOpacity>
            </View>
            {loading ? <LoadingBlock /> : <FlatList data={items} numColumns={2} keyExtractor={keyExtractor} renderItem={renderItem} contentContainerStyle={{
      padding: 8,
      paddingBottom: 130
    }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<EmptyBlock text={t("لا توجد إعلانات بعد")} />} {...FLAT_PERF} />}
        </SafeAreaView>;
}

// ---------- DEALS ----------
export function DealsScreen() {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  
  const {
    dataVersion
  } = useCountry();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get("/deals/today", {
      params: {
        limit: 30
      }
    }).then(({
      data
    }) => {
      if (alive) setItems(Array.isArray(data) ? data : data?.items || []);
    }).catch(() => {
      if (alive) setItems([]);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [dataVersion]);
  const renderItem = useCallback(({
    item
  }) => <View style={{
    flex: 1,
    padding: 4
  }}>
            <ListingCard listing={item} />
            {item.discount_pct != null && <View style={styles.dealBadge}>
                    <Text style={styles.dealBadgeText}>-{item.discount_pct}%</Text>
                </View>}
        </View>, []);
  return <SafeAreaView style={[styles.wrap, { backgroundColor: palette.bg }]}>
            <View style={styles.hero}>
                <Flame size={32} color="#EF4444" />
                <View style={{
        flex: 1
      }}>
                    <Text style={[styles.heroTitle, { color: palette.text }]}>{t("صفقات اليوم الذهبية")}</Text>
                    <Text style={styles.heroSub}>{t("أفضل الأسعار تحت متوسط السوق")}</Text>
                </View>
            </View>
            {loading ? <LoadingBlock /> : <FlatList data={items} numColumns={2} keyExtractor={keyExtractor} renderItem={renderItem} contentContainerStyle={{
      padding: 4,
      paddingBottom: 130
    }} ListEmptyComponent={<EmptyBlock text={t("لا توجد صفقات بارزة الآن")} />} {...FLAT_PERF} />}
        </SafeAreaView>;
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    padding: 16,
    textAlign: "right"
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full
  },
  addText: {
    color: theme.colors.primaryFg,
    fontWeight: "800",
    fontSize: 12
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  empty: {
    padding: 40,
    alignItems: "center"
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  heroIcon: {
    fontSize: 38
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "right"
  },
  heroSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: "right"
  },
  dealBadge: {
    position: "absolute",
    top: 12,
    start: 12,
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  dealBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900"
  },
  boostBtn: {
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(137,207,240,0.1)"
  },
  boostBtnActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B"
  },
  boostText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 11
  }
});