import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Camera, GeoJSONSource, Layer, Map } from "@maplibre/maplibre-react-native";
import { Search as SearchIcon } from "lucide-react-native";
import * as Location from "expo-location";
import api from "../api";
import { theme } from "../theme";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../I18nContext";
import StandaloneFloatingTabBar from "../components/StandaloneFloatingTabBar";

const RIYADH = { lat: 24.7136, lng: 46.6753 };
const OSM_RASTER_STYLE = {
  version: 8,
  name: "Haraj Plus OSM",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function validCoordinate(item) {
  return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng));
}

export default function MapScreen() {
  const { t } = useI18n();
  const nav = useNavigation();
  const cameraRef = useRef(null);
  const [items, setItems] = useState([]);
  const [myPos, setMyPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const params = { limit: 200 };
        if (category) params.category = category;
        const { data } = await api.get("/listings/map/nearby", { params });
        setItems(Array.isArray(data) ? data : []);
        setErr(null);
      } catch (error) {
        setErr(error?.message || "load_failed");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [category]);

  useEffect(() => {
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) return;
        const position = await Location.getCurrentPositionAsync({});
        setMyPos({ lat: position.coords.latitude, lng: position.coords.longitude });
      } catch (_) {}
    })();
  }, []);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter(item => {
      if (!validCoordinate(item)) return false;
      return !normalizedQuery || String(item.title || "").toLowerCase().includes(normalizedQuery) || String(item.category || "").toLowerCase().includes(normalizedQuery);
    });
  }, [items, query]);

  const collection = useMemo(() => ({
    type: "FeatureCollection",
    features: visibleItems.map((item, index) => ({
      type: "Feature",
      id: item.id,
      properties: {
        id: item.id,
        matched: Boolean(query.trim()),
        featured: index % 3 === 1,
        title: item.title || "",
      },
      geometry: { type: "Point", coordinates: [Number(item.lng), Number(item.lat)] },
    })),
  }), [query, visibleItems]);

  const center = useMemo(() => myPos || (visibleItems[0] ? { lat: Number(visibleItems[0].lat), lng: Number(visibleItems[0].lng) } : RIYADH), [myPos, visibleItems]);
  useEffect(() => {
    cameraRef.current?.easeTo?.({ center: [center.lng, center.lat], zoom: 11, duration: 450, easing: "ease" });
  }, [center.lat, center.lng]);

  const openListing = useCallback(event => {
    const feature = event?.nativeEvent?.features?.[0];
    const id = feature?.properties?.id || feature?.id;
    if (id) nav.navigate("ListingDetail", { id: String(id) });
  }, [nav]);

  if (loading) {
    return <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{t("جاري تحميل الخريطة...")}</Text>
    </View>;
  }

  const chips = [["", t("الكل")], ["cars", t("سيارات")], ["realestate", t("عقارات")], ["phones", t("جوالات")], ["jobs", t("وظائف")], ["services", t("خدمات")]];
  return <SafeAreaView style={styles.wrap}>
    <View style={styles.header}>
      <Text style={styles.title}>{t("خريطة الإعلانات")}</Text>
      <Text style={styles.sub}>{visibleItems.length} {t("إعلان بالقرب منك")}</Text>
      <View style={styles.searchRow}>
        <SearchIcon size={16} color={theme.colors.primary} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t("ابحث في الخريطة...")} placeholderTextColor="#94A3B8" style={styles.searchInput} testID="map-search-input" returnKeyType="search" />
      </View>
      <View style={styles.chipsRow}>
        {chips.map(([value, label]) => <TouchableOpacity key={value || "all"} onPress={() => setCategory(value)} style={[styles.chip, category === value && styles.chipActive]} accessibilityRole="button"><Text style={[styles.chipText, category === value && styles.chipTextActive]}>{label}</Text></TouchableOpacity>)}
      </View>
    </View>
    <View style={styles.mapWrap}>
      <Map mapStyle={OSM_RASTER_STYLE} style={styles.map} logo={false} attribution={true} compass scaleBar androidView="texture" onDidFailLoadingMap={() => setErr("map_load_failed")}>
        <Camera ref={cameraRef} initialViewState={{ center: [center.lng, center.lat], zoom: 11 }} />
        <GeoJSONSource id="listings" data={collection} onPress={openListing} hitbox={{ top: 24, right: 24, bottom: 24, left: 24 }}>
          <Layer id="listing-glow" type="circle" paint={{ "circle-radius": ["case", ["get", "matched"], 25, 18], "circle-color": ["case", ["get", "matched"], "#B5E61D", "#4FB6E6"], "circle-opacity": 0.18, "circle-stroke-color": ["case", ["get", "matched"], "#B5E61D", "#4FB6E6"], "circle-stroke-width": 2 }} />
          <Layer id="listing-core" type="circle" paint={{ "circle-radius": ["case", ["get", "matched"], 10, 7], "circle-color": ["case", ["get", "matched"], "#B5E61D", ["case", ["get", "featured"], "#FF8C00", "#FFFFFF"]], "circle-stroke-color": "#FF8C00", "circle-stroke-width": 2 }} />
        </GeoJSONSource>
        {myPos && <GeoJSONSource id="my-location" data={{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [myPos.lng, myPos.lat] } }}><Layer id="my-location-ring" type="circle" paint={{ "circle-radius": 15, "circle-color": "#4FB6E6", "circle-opacity": 0.22 }} /><Layer id="my-location-core" type="circle" paint={{ "circle-radius": 7, "circle-color": "#4FB6E6", "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 3 }} /></GeoJSONSource>}
      </Map>
      {err && <View style={styles.error}><Text style={styles.errorText}>{t("تعذر تحديث الخريطة، حاول مرة أخرى.")}</Text></View>}
    </View>
    <StandaloneFloatingTabBar />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.bg },
  loadingText: { marginTop: 10, color: theme.colors.textMuted },
  header: { padding: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 16, fontWeight: "900", color: theme.colors.text, textAlign: "right" },
  sub: { fontSize: 11, color: theme.colors.textMuted, textAlign: "right", marginTop: 2 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F5F9", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  searchInput: { flex: 1, fontSize: 13, color: theme.colors.text, textAlign: "right", paddingVertical: 0 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, direction: "rtl" },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 10, color: theme.colors.textMuted, fontWeight: "700" },
  chipTextActive: { color: theme.colors.primaryFg },
  mapWrap: { flex: 1, overflow: "hidden" },
  map: { flex: 1 },
  error: { position: "absolute", top: 12, alignSelf: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: "rgba(127,29,29,0.92)" },
  errorText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
