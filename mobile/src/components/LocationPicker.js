// LocationPicker — cascading dropdown that walks the user from country
// → governorate → city → district using the Geonames-backed
// `/api/locations/children` endpoint. Re-renders automatically when the
// app language changes (via useI18n key on labels).
//
// Props:
//   value:    { country, adm1, adm2, adm3, city }  ← selected IDs
//   onChange: (next) => void   (next contains the same shape with names)
//   country:  optional default ISO2 (e.g. "EG"). If absent, falls back to
//             the device-detected country.
//
// Visual: stacked rows with a label + a tappable chip that opens a Modal
// listing children of the previously-selected node.
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { ChevronDown, X, Search as SearchIcon, MapPin } from "lucide-react-native";
import api from "../api";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";

// Egypt has 4 levels (adm1=governorate, adm2=city/markaz, adm3=district,
// city=village/locality). Gulf has 3 (adm2=city, city=district).
const LEVELS_BY_COUNTRY = {
  EG: ["adm1", "adm2", "adm3", "city"],
  default: ["adm2", "city"],
};

function levelsFor(country) {
  return LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.default;
}

function labelFor(t, country, level) {
  // Owner-mandated labels in Arabic; translator handles other langs.
  if (country === "EG") {
    if (level === "adm1") return t("المحافظة");
    if (level === "adm2") return t("المدينة / المركز");
    if (level === "adm3") return t("الحي / القسم");
    if (level === "city") return t("القرية / المنطقة");
  }
  if (level === "adm1") return t("المنطقة");
  if (level === "adm2") return t("المدينة");
  if (level === "city") return t("الحي");
  return t("الموقع");
}

export default function LocationPicker({ country = "EG", value, onChange }) {
  const { t, lang } = useI18n();
  const { palette } = useThemeMode();
  const [supportedCountries, setSupportedCountries] = useState(null);
  const [bootError, setBootError] = useState("");

  // Auto-fallback: ask the backend which countries have imported data.
  // If the user's selected country is not yet seeded, silently switch to EG
  // so the dropdown is never empty.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line no-console
    console.info("[LocationPicker] booting — fetching /locations/countries from", api.defaults.baseURL);
    api.get("/locations/countries")
      .then(r => {
        const codes = (r.data || []).map(x => x.code);
        // eslint-disable-next-line no-console
        console.info("[LocationPicker] supported countries:", codes);
        if (!cancelled) setSupportedCountries(codes);
      })
      .catch(e => {
        const detail = `${e?.response?.status || ""} ${e?.message || ""}`.trim();
        // eslint-disable-next-line no-console
        console.error("[LocationPicker] /countries FAILED:", detail, "BASE=", api.defaults.baseURL);
        if (!cancelled) { setSupportedCountries([]); setBootError(detail || "network"); }
      });
    return () => { cancelled = true; };
  }, []);

  // While only Egypt is imported, hard-default to EG so the picker always
  // shows the 4-level Egyptian hierarchy even before /countries resolves.
  const effectiveCountry = useMemo(() => {
    if (!supportedCountries || supportedCountries.length === 0) return "EG";
    if (supportedCountries.includes(country)) return country;
    return supportedCountries.includes("EG") ? "EG" : supportedCountries[0];
  }, [country, supportedCountries]);
  const showFallbackNotice = effectiveCountry !== country && supportedCountries && supportedCountries.length > 0;

  const levels = levelsFor(effectiveCountry);
  const [openLevel, setOpenLevel] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [fetchError, setFetchError] = useState("");

  // Fetch children for the current open level. Parent = selection at previous level.
  useEffect(() => {
    if (!openLevel) return;
    const idx = levels.indexOf(openLevel);
    const parent = idx > 0 ? value?.[levels[idx - 1]] : null;
    setLoading(true);
    setOptions([]);
    setQuery("");
    setFetchError("");
    const params = { lang, level: openLevel, country: effectiveCountry, limit: 800 };
    if (parent?.id) params.parent_id = parent.id;
    // eslint-disable-next-line no-console
    console.info("[LocationPicker] GET /locations/children", params);
    api.get("/locations/children", { params })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        // eslint-disable-next-line no-console
        console.info(`[LocationPicker] ✓ ${openLevel} → ${data.length} records`);
        setOptions(data);
      })
      .catch(e => {
        const detail = `${e?.response?.status || ""} ${e?.message || ""}`.trim();
        // eslint-disable-next-line no-console
        console.error("[LocationPicker] FAIL", detail);
        setOptions([]);
        setFetchError(detail || "network error");
      })
      .finally(() => setLoading(false));
  }, [openLevel, value, lang, effectiveCountry]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => (o.name || "").toLowerCase().includes(q));
  }, [query, options]);

  const handlePick = (lvl, item) => {
    // Build the next selection — keep parents, clear all DESCENDANT levels.
    const next = { ...value };
    next[lvl] = item;
    const i = levels.indexOf(lvl);
    for (let j = i + 1; j < levels.length; j++) delete next[levels[j]];
    onChange?.(next);
    setOpenLevel(null);
  };

  const styles = makeStyles(palette);
  return (
    <View>
      {bootError ? (
        <View style={{ marginBottom: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fca5a5" }}>
          <Text style={{ fontSize: 11, color: "#991b1b", textAlign: "right" }}>
            ⚠️ {t("لا يمكن الاتصال بخدمة المواقع")}: {bootError}
          </Text>
          <Text style={{ fontSize: 10, color: "#7f1d1d", textAlign: "right", marginTop: 2 }} numberOfLines={1}>
            {api.defaults.baseURL}
          </Text>
        </View>
      ) : null}
      {showFallbackNotice ? (
        <View style={{ marginBottom: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: palette.surfaceCard, borderWidth: 1, borderColor: palette.border }}>
          <Text style={{ fontSize: 11, color: palette.textMuted, textAlign: "right" }}>
            {t("بيانات الموقع متاحة حالياً لـ")} <Text style={{ fontWeight: "900", color: palette.text }}>{effectiveCountry}</Text> {t("فقط — استخدامه مؤقتاً.")}
          </Text>
        </View>
      ) : null}
      {levels.map((lvl, i) => {
        const prevSelected = i === 0 || value?.[levels[i - 1]];
        const sel = value?.[lvl];
        return (
          <View key={lvl} style={styles.row}>
            <Text style={styles.label}>{labelFor(t, effectiveCountry, lvl)}</Text>
            <TouchableOpacity
              onPress={() => prevSelected && setOpenLevel(lvl)}
              disabled={!prevSelected}
              style={[styles.chip, !prevSelected && styles.chipDisabled]}
              testID={`location-picker-${lvl}`}
            >
              <MapPin size={14} color={palette.primary} />
              <Text style={[styles.chipText, !sel && { color: palette.textSubtle }]} numberOfLines={1}>
                {sel?.name || t("اختر")}
              </Text>
              <ChevronDown size={16} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}

      <Modal visible={!!openLevel} animationType="slide" transparent onRequestClose={() => setOpenLevel(null)}>
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{labelFor(t, effectiveCountry, openLevel || "city")}</Text>
              <TouchableOpacity onPress={() => setOpenLevel(null)} testID="location-picker-close">
                <X size={22} color={palette.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.search}>
              <SearchIcon size={16} color={palette.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("ابحث...")}
                placeholderTextColor={palette.textSubtle}
                style={styles.searchInput}
                testID="location-picker-search"
              />
            </View>
            {loading ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handlePick(openLevel, item)}
                    style={styles.option}
                    testID={`location-opt-${item.id}`}
                  >
                    <Text style={styles.optionText}>{item.name}</Text>
                    {item.population > 1000 && <Text style={styles.optionMeta}>{item.population.toLocaleString()}</Text>}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  fetchError ? (
                    <View style={{ padding: 16 }}>
                      <Text style={{ fontSize: 12, color: "#dc2626", textAlign: "center" }}>
                        ⚠️ {t("خطأ في الاتصال")}: {fetchError}
                      </Text>
                    </View>
                  ) : <Text style={styles.empty}>{t("لا توجد نتائج")}</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (palette) => StyleSheet.create({
  row: { marginBottom: 10 },
  label: { fontSize: 12, color: palette.textMuted, marginBottom: 4, textAlign: "right" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: palette.surfaceCard, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: palette.border,
  },
  chipDisabled: { opacity: 0.45 },
  chipText: { flex: 1, fontSize: 14, color: palette.text, textAlign: "right" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    height: "78%", backgroundColor: palette.bg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16,
  },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: "900", color: palette.text },
  search: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: palette.surfaceCard, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
    borderWidth: 1, borderColor: palette.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: palette.text, paddingVertical: 0, textAlign: "right" },
  option: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border,
  },
  optionText: { fontSize: 15, color: palette.text, flex: 1, textAlign: "right" },
  optionMeta: { fontSize: 11, color: palette.textMuted, marginLeft: 8 },
  empty: { textAlign: "center", color: palette.textMuted, paddingTop: 32 },
});
