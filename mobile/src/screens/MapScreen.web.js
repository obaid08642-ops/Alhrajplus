import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Search as SearchIcon } from "lucide-react-native";
import api from "../api";
import { theme } from "../theme";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../I18nContext";
import StandaloneFloatingTabBar from "../components/StandaloneFloatingTabBar";

// The consumer web experience owns its map implementation. This export target
// remains a simple, accessible list without embedding a browser inside Mobile.
export default function MapScreenWeb() {
  const { t } = useI18n();
  const nav = useNavigation();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/listings/map/nearby", { params: { limit: 100 } });
        setItems(Array.isArray(data) ? data : []);
      } catch (_) { setItems([]); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const visible = items.filter(item => !query.trim() || String(item.title || "").toLowerCase().includes(query.trim().toLowerCase()));
  return <SafeAreaView style={styles.wrap}>
    <View style={styles.header}>
      <Text style={styles.title}>{t("خريطة الإعلانات")}</Text>
      <View style={styles.searchRow}><SearchIcon size={16} color={theme.colors.primary} /><TextInput value={query} onChangeText={setQuery} placeholder={t("ابحث في الخريطة...")} placeholderTextColor="#94A3B8" style={styles.searchInput} /></View>
    </View>
    {loading ? <ActivityIndicator color={theme.colors.primary} style={styles.loading} /> : <View style={styles.list}>{visible.map(item => <TouchableOpacity key={item.id} style={styles.item} onPress={() => nav.navigate("ListingDetail", { id: item.id })}><Text style={styles.itemTitle}>{item.title || t("إعلان")}</Text><Text style={styles.itemMeta}>{item.city || t("موقع الإعلان")}</Text></TouchableOpacity>)}</View>}
    <StandaloneFloatingTabBar />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg }, header: { padding: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, title: { fontSize: 16, fontWeight: "900", color: theme.colors.text, textAlign: "right" }, searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F5F9", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 }, searchInput: { flex: 1, fontSize: 13, color: theme.colors.text, textAlign: "right", paddingVertical: 0 }, loading: { marginTop: 36 }, list: { padding: 12, gap: 8 }, item: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 14, padding: 12 }, itemTitle: { color: theme.colors.text, textAlign: "right", fontWeight: "800" }, itemMeta: { marginTop: 4, color: theme.colors.textMuted, textAlign: "right", fontSize: 12 },
});
