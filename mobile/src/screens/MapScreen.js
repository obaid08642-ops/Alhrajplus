import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import api from "../api";
import { theme } from "../theme";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../I18nContext";

// Hologram-pin Leaflet map rendered inside a WebView. Works in Expo Go.
export default function MapScreen() {
  const {
    t
  } = useI18n();
  const nav = useNavigation();
  const [items, setItems] = useState([]);
  const [myPos, setMyPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  useEffect(() => {
    (async () => {
      try {
        const {
          data
        } = await api.get("/listings/map/nearby", {
          params: {
            limit: 200
          }
        });
        setItems(data || []);
      } catch (_) {}
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
      setLoading(false);
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
            </View>
            <WebView ref={ref} originWhitelist={["*"]} source={{
      html
    }} onMessage={onMessage} style={{
      flex: 1
    }} javaScriptEnabled domStorageEnabled setSupportMultipleWindows={false} />
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
    currency: i.currency || "ر.س"
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
  .hp { position: relative; width: 78px; height: 78px; animation: fl 3s ease-in-out infinite; }
  .chip {
    position: absolute; left: 50%; top: 0; transform: translateX(-50%);
    background: linear-gradient(180deg, rgba(79,182,230,.95), rgba(20,33,71,.95));
    color: #fff; border: 1.5px solid rgba(137,207,240,.85);
    border-radius: 999px; padding: 5px 11px 4px; min-width: 42px; text-align: center;
    box-shadow: 0 6px 20px rgba(20,33,71,.45), 0 0 18px rgba(137,207,240,.55);
  }
  .price { font-weight: 900; font-size: 11px; }
  .curr { font-size: 8px; opacity: .9; margin-top: 1px; }
  .stem {
    position: absolute; left: 50%; top: 28px; width: 2px; height: 24px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, rgba(137,207,240,.9), rgba(137,207,240,0));
  }
  .base {
    position: absolute; left: 50%; bottom: 6px; width: 22px; height: 6px;
    border-radius: 50%; transform: translateX(-50%);
    background: radial-gradient(ellipse at center, rgba(137,207,240,.65), rgba(137,207,240,0));
  }
  .me {
    width: 28px; height: 28px; background: #4FB6E6; border: 3px solid #fff;
    border-radius: 50%; box-shadow: 0 0 0 8px rgba(79,182,230,.25);
  }
  @keyframes fl { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${center.lat}, ${center.lng}], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map);
  var markers = ${JSON.stringify(markers)};
  markers.forEach(function(m) {
    var icon = L.divIcon({
      className: 'hp-wrap',
      iconSize: [78, 78], iconAnchor: [39, 70], popupAnchor: [0, -64],
      html: '<div class="hp"><div class="chip"><div class="price">' + (m.price || '★') + '</div><div class="curr">' + (m.price ? m.currency : '•') + '</div></div><div class="stem"></div><div class="base"></div></div>'
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
  }
});