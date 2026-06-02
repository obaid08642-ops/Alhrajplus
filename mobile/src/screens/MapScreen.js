import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { Search as SearchIcon } from "lucide-react-native";
import * as Location from "expo-location";
import api from "../api";
import { theme } from "../theme";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../I18nContext";
import StandaloneFloatingTabBar from "../components/StandaloneFloatingTabBar";

// Hologram-pin Leaflet map rendered inside a WebView. Works in Expo Go.
export default function MapScreen() {
  const {
    t
  } = useI18n();
  const nav = useNavigation();
  const [items, setItems] = useState([]);
  const [myPos, setMyPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  // Reload map listings whenever the query changes (debounced).
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const params = { limit: 200 };
        if (query.trim()) params.q = query.trim();
        const { data } = await api.get("/listings/map/nearby", { params });
        setItems(data || []);
        setLoading(false);
      } catch (_) { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const p = await Location.getCurrentPositionAsync({});
          setMyPos({
            lat: p.coords.latitude,
            lng: p.coords.longitude
          });
        }
      } catch (_) {}
    })();
  }, []);
  const html = buildHtml(items, myPos);
  const onMessage = e => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data?.type === "open" && data.id) {
        nav.navigate("ListingDetail", {
          id: data.id
        });
      }
    } catch (_) {}
  };
  if (loading) {
    return <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>{t("جاري تحميل الخريطة...")}</Text>
            </View>;
  }
  return <SafeAreaView style={styles.wrap}>
            <View style={styles.header}>
                <Text style={styles.title}>{t("🗺️ خريطة الإعلانات")}</Text>
                <Text style={styles.sub}>{items.length} {t("إعلان بالقرب منك")}</Text>
                <View style={styles.searchRow}>
                    <SearchIcon size={16} color={theme.colors.primary} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder={t("ابحث في الخريطة...")}
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                        testID="map-search-input"
                        returnKeyType="search"
                    />
                </View>
            </View>
            <WebView ref={ref} originWhitelist={["*"]} source={{
      html
    }} onMessage={onMessage} style={{
      flex: 1
    }} javaScriptEnabled domStorageEnabled setSupportMultipleWindows={false} />
            <StandaloneFloatingTabBar />
        </SafeAreaView>;
}
function buildHtml(items, myPos) {
  const center = myPos || (items[0] ? {
    lat: items[0].lat,
    lng: items[0].lng
  } : {
    lat: 24.7136,
    lng: 46.6753
  });
  const markers = items.filter(i => i.lat && i.lng).map(i => ({
    id: i.id,
    lat: i.lat,
    lng: i.lng,
    title: (i.title || "").replace(/"/g, "'"),
    price: i.price ? Number(i.price).toLocaleString() : "",
    currency: i.currency || "ر.س",
    category: i.category || "general"
  }));
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; font-family: -apple-system, Roboto, sans-serif; }
  .hp-wrap { background: transparent !important; border: none !important; }
  /* Concentric pulsing radar — owner-mandated map marker design.
     Three rings expand outward forever; central white disc holds the icon. */
  .ring-wrap { position: relative; width: 80px; height: 80px; }
  .ring {
    position: absolute; left: 50%; top: 50%;
    border-radius: 50%; border-style: solid; border-width: 2px;
    transform: translate(-50%, -50%);
    animation: pulse 2.6s ease-out infinite;
    opacity: 0.0;
  }
  .ring.r1 { width: 36px; height: 36px; animation-delay: 0s; }
  .ring.r2 { width: 56px; height: 56px; animation-delay: 0.5s; }
  .ring.r3 { width: 76px; height: 76px; animation-delay: 1.0s; }
  .core {
    position: absolute; left: 50%; top: 50%;
    width: 32px; height: 32px; border-radius: 50%;
    transform: translate(-50%, -50%);
    background: #FFFFFF;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(15,26,53,0.18);
  }
  /* Blue family (primary) */
  .blue .ring { border-color: rgba(137,207,240,0.85); }
  .blue .core { box-shadow: 0 4px 14px rgba(137,207,240,0.55); }
  /* Orange family (accent — for highlighted/featured items) */
  .orange .ring { border-color: rgba(255,140,0,0.80); }
  .orange .core { box-shadow: 0 4px 14px rgba(255,140,0,0.55); }
  .icon-svg { width: 18px; height: 18px; stroke: #FF8C00; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .blue .icon-svg { stroke: #FF8C00; }
  .orange .icon-svg { stroke: #FF8C00; }
  .me {
    width: 28px; height: 28px; background: #4FB6E6; border: 3px solid #fff;
    border-radius: 50%; box-shadow: 0 0 0 8px rgba(137,207,240,.25);
  }
  @keyframes pulse {
    0%   { opacity: 0.0; transform: translate(-50%, -50%) scale(0.55); }
    20%  { opacity: 0.55; }
    100% { opacity: 0.0; transform: translate(-50%, -50%) scale(1.0); }
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${center.lat}, ${center.lng}], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map);
  var markers = ${JSON.stringify(markers)};
  // Category → lucide-style SVG path. Outline + orange stroke (per spec).
  var CAT_SVG = {
    cars: '<polyline points="3 12 5 6 19 6 21 12 21 18 17 18 17 16 7 16 7 18 3 18 3 12"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/>',
    phones: '<rect x="6" y="3" width="12" height="18" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/>',
    realestate: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    jobs: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    services: '<path d="M14 7l3 3-9 9-3-3z"/><path d="M14 7l3-3 3 3-3 3z"/>',
    furniture: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 16h20v3H2z"/>',
    electronics: '<rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/>',
    livestock: '<circle cx="12" cy="12" r="9"/>',
    equipment: '<circle cx="8" cy="16" r="3"/><circle cx="17" cy="16" r="3"/><path d="M3 16h2l2-6h8l3 6"/>',
    auctions: '<path d="M12 2l5 5-7 7-5-5z"/><line x1="14" y1="14" x2="20" y2="20"/>',
    fashion: '<path d="M16 3l-4 3-4-3-5 4v4l3 1 1 9h10l1-9 3-1V7z"/>',
    food: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/>',
    toys: '<circle cx="12" cy="12" r="9"/>',
    books: '<path d="M4 4h6a2 2 0 0 1 2 2v14"/><path d="M20 4h-6a2 2 0 0 0-2 2v14"/>',
    general: '<circle cx="12" cy="10" r="3"/><path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>'
  };
  markers.forEach(function(m, idx) {
    var svg = CAT_SVG[m.category] || CAT_SVG.general;
    // Alternate every third listing to orange ring; rest stay blue (mirrors
    // the owner-supplied reference where some pings are highlighted).
    var family = (idx % 3 === 1) ? 'orange' : 'blue';
    var icon = L.divIcon({
      className: 'hp-wrap',
      iconSize: [80, 80], iconAnchor: [40, 40], popupAnchor: [0, -40],
      html:
        '<div class="ring-wrap ' + family + '">' +
          '<div class="ring r3"></div>' +
          '<div class="ring r2"></div>' +
          '<div class="ring r1"></div>' +
          '<div class="core">' +
            '<svg class="icon-svg" viewBox="0 0 24 24">' + svg + '</svg>' +
          '</div>' +
        '</div>'
    });
    var mk = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
    mk.on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open', id: m.id }));
    });
  });
  ${myPos ? `
  var meIcon = L.divIcon({ className: 'hp-wrap', iconSize: [28, 28], iconAnchor: [14, 14], html: '<div class="me"></div>' });
  L.marker([${myPos.lat}, ${myPos.lng}], { icon: meIcon }).addTo(map);
  ` : ""}
</script>
</body>
</html>`;
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.bg
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textMuted
  },
  header: {
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "right"
  },
  sub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: "right",
    marginTop: 2
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    textAlign: "right",
    paddingVertical: 0
  }
});
