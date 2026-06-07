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
  const levels = levelsFor(country);
  const [openLevel, setOpenLevel] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // Fetch children for the current open level. Parent = selection at previous level.
  useEffect(() => {
    if (!openLevel) return;
    const idx = levels.indexOf(openLevel);
    const parent = idx > 0 ? value?.[levels[idx - 1]] : null;
    setLoading(true);
    setOptions([]);
    setQuery("");
    const params = { lang, level: openLevel, country, limit: 800 };
    if (parent?.id) params.parent_id = parent.id;
    api.get("/locations/children", { params })
      .then(r => setOptions(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [openLevel, value, lang, country]);

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
      {levels.map((lvl, i) => {
        const prevSelected = i === 0 || value?.[levels[i - 1]];
        const sel = value?.[lvl];
        return (
          <View key={lvl} style={styles.row}>
            <Text style={styles.label}>{labelFor(t, country, lvl)}</Text>
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
              <Text style={styles.sheetTitle}>{labelFor(t, country, openLevel || "city")}</Text>
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
                  <Text style={styles.empty}>{t("لا توجد نتائج")}</Text>
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
