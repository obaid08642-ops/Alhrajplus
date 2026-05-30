// SearchScreen — advanced search with filters (category / city / price / condition / sort).
// Mirrors web /app/frontend/src/pages/SearchPage.js + filter bar from listings.
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, StatusBar, Dimensions, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X, ChevronLeft, SlidersHorizontal, Check, MapPin, Mic, Bookmark } from "lucide-react-native";
import { AudioModule, AudioRecorder, RecordingPresets } from "expo-audio";
import api from "../api";
import { useI18n } from "../I18nContext";
import { useCountry } from "../CountryContext";
import { colors, radius, shadow } from "../theme";
import ListingCard from "../components/ListingCard";
const {
  width: SCREEN_W
} = Dimensions.get("window");
const CARD_W = (SCREEN_W - 16 * 2 - 10) / 2;
const SORT_KEYS = [{
  key: "newest",
  labelKey: "الأحدث"
}, {
  key: "oldest",
  labelKey: "الأقدم"
}, {
  key: "price_asc",
  labelKey: "السعر: الأقل"
}, {
  key: "price_desc",
  labelKey: "السعر: الأعلى"
}, {
  key: "popular",
  labelKey: "الأكثر مشاهدة"
}];
export default function SearchScreen({
  navigation,
  route
}) {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  
  const SORT_OPTIONS = SORT_KEYS.map(o => ({
    key: o.key,
    label: t(o.labelKey)
  }));
  const {
    current: country,
    dataVersion
  } = useCountry();
  const initialQ = route.params?.q || "";
  const initialCat = route.params?.category || "";
  const [q, setQ] = useState(initialQ);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: initialCat,
    city: "",
    priceMin: "",
    priceMax: "",
    condition: "",
    // new | used | ""
    sort: "newest"
  });
  const debounceRef = useRef(null);
  const [voiceRec, setVoiceRec] = useState(null);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const toggleVoice = async () => {
    if (voiceRec) {
      // Stop + transcribe
      try {
        await voiceRec.stop();
        const uri = voiceRec.uri;
        setVoiceRec(null);
        if (!uri) return;
        setVoiceBusy(true);
        // Upload audio and send to /api/ai/transcribe
        const fd = new FormData();
        fd.append("audio", {
          uri,
          type: "audio/m4a",
          name: `search_${Date.now()}.m4a`
        });
        const {
          data
        } = await api.post("/ai/transcribe", fd, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        if (data?.text) {
          setQ(data.text);
          runSearch(data.text);
        }
      } catch (e) {
        setVoiceRec(null);
      } finally {
        setVoiceBusy(false);
      }
    } else {
      try {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) return;
        await AudioModule.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true
        });
        const rec = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
        await rec.prepareToRecordAsync();
        rec.record();
        setVoiceRec(rec);
      } catch (_) {}
    }
  };

  // Load categories once
  useEffect(() => {
    api.get("/meta/categories", {
      params: {
        lang
      }
    }).then(({
      data
    }) => setCategories(data || [])).catch(() => {});
  }, [lang]);

  // Suggestion fetching (debounced)
  useEffect(() => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const {
          data
        } = await api.get("/search/suggest", {
          params: {
            q,
            limit: 8
          }
        });
        setSuggestions(data?.items || data || []);
      } catch (_) {
        setSuggestions([]);
      }
    }, 220);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [q]);

  // Build params from current state
  const buildParams = useCallback(() => {
    const p = {
      limit: 30
    };
    if (q) p.q = q;
    if (filters.category) p.category = filters.category;
    if (filters.city) p.city = filters.city;
    if (filters.priceMin) p.min_price = filters.priceMin;
    if (filters.priceMax) p.max_price = filters.priceMax;
    if (filters.condition) p.condition = filters.condition;
    if (filters.sort && filters.sort !== "newest") p.sort = filters.sort;
    return p;
  }, [q, filters]);
  const runSearch = useCallback(async term => {
    const query = term ?? q;
    setLoading(true);
    setShowSugg(false);
    try {
      const p = buildParams();
      if (term !== undefined) p.q = term;
      const {
        data
      } = await api.get("/listings", {
        params: p
      });
      setResults(data?.items || []);
      if (query) {
        try {
          await api.post("/search/log", {
            query
          });
        } catch (_) {}
        // Also save a re-engageable search event (smart notifications).
        if ((query || "").trim().length >= 2) {
          api.post("/users/me/search-event", {
            query: (query || "").trim(),
            results_count: (data?.items || []).length
          }).catch(() => {});
        }
      }
    } catch (_) {
      setResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, buildParams]);

  // Initial search if we got a query/category param
  useEffect(() => {
    if (initialQ || initialCat) runSearch(initialQ); /* eslint-disable-next-line */
  }, []);

  // Re-run last search whenever the user switches country, so results never
  // leak across regions.
  useEffect(() => {
    if (q && dataVersion > 0) {
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // Re-search when filters change (skip query field updates — keypress is handled below)
  useEffect(() => {
    if (filters.category || filters.city || filters.priceMin || filters.priceMax || filters.condition || filters.sort !== "newest") {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.city, filters.priceMin, filters.priceMax, filters.condition, filters.sort]);
  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.category) n++;
    if (filters.city) n++;
    if (filters.priceMin || filters.priceMax) n++;
    if (filters.condition) n++;
    if (filters.sort !== "newest") n++;
    return n;
  }, [filters]);
  const clearFilters = () => setFilters({
    category: "",
    city: "",
    priceMin: "",
    priceMax: "",
    condition: "",
    sort: "newest"
  });
  const saveSearch = async () => {
    if (!q.trim()) {
      Alert.alert(t("تنبيه"), t("اكتب عبارة بحث أولاً"));
      return;
    }
    try {
      await api.post("/search/save", {
        q: q.trim(),
        category: filters.category || null,
        country_code: country?.code || null,
        min_price: filters.priceMin ? parseFloat(filters.priceMin) : null,
        max_price: filters.priceMax ? parseFloat(filters.priceMax) : null
      });
      Alert.alert("✅", t("تم حفظ البحث. سننبهك عند ظهور نتائج جديدة."));
    } catch (e) {
      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر الحفظ"));
    }
  };
  return <View style={{
    flex: 1,
    backgroundColor: colors.bg
  }}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
            {/* Search Header */}
            <View style={[s.header, {
      paddingTop: insets.top + 2
    }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.headBtn}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
                <View style={s.searchPill}>
                    <Search size={15} color={colors.textMuted} />
                    <TextInput value={q} onChangeText={v => {
          setQ(v);
          setShowSugg(true);
        }} onSubmitEditing={() => runSearch()} placeholder={t("ابحث عن أي شيء...")} placeholderTextColor={colors.textMuted} style={s.searchInput} autoFocus={!initialQ} returnKeyType="search" />
                    {q.length > 0 ? <TouchableOpacity onPress={() => {
          setQ("");
          setResults([]);
          setSuggestions([]);
        }} hitSlop={6}>
                            <X size={16} color={colors.textMuted} />
                        </TouchableOpacity> : <TouchableOpacity onPress={toggleVoice} hitSlop={6} disabled={voiceBusy}>
                            {voiceBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <Mic size={16} color={voiceRec ? "#EF4444" : colors.primary} />}
                        </TouchableOpacity>}
                </View>
                <TouchableOpacity onPress={() => setFiltersOpen(true)} style={[s.filterBtn, activeFiltersCount > 0 && s.filterBtnActive]}>
                    <SlidersHorizontal size={18} color={activeFiltersCount > 0 ? "#fff" : colors.text} />
                    {activeFiltersCount > 0 && <View style={s.filterBadge}><Text style={s.filterBadgeText}>{activeFiltersCount}</Text></View>}
                </TouchableOpacity>
            </View>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                    {filters.category && <Chip label={categories.find(c => c.key === filters.category)?.name || filters.category} onClose={() => setFilters({
        ...filters,
        category: ""
      })} />}
                    {filters.city && <Chip label={`📍 ${filters.city}`} onClose={() => setFilters({
        ...filters,
        city: ""
      })} />}
                    {(filters.priceMin || filters.priceMax) && <Chip label={`💰 ${filters.priceMin || "0"} - ${filters.priceMax || "∞"}`} onClose={() => setFilters({
        ...filters,
        priceMin: "",
        priceMax: ""
      })} />}
                    {filters.condition && <Chip label={filters.condition === "new" ? t("جديد") : t("مستعمل")} onClose={() => setFilters({
        ...filters,
        condition: ""
      })} />}
                    {filters.sort !== "newest" && <Chip label={SORT_OPTIONS.find(o => o.key === filters.sort)?.label} onClose={() => setFilters({
        ...filters,
        sort: "newest"
      })} />}
                    <TouchableOpacity onPress={clearFilters} style={s.clearAllBtn}><Text style={s.clearAllText}>{t("مسح الكل")}</Text></TouchableOpacity>
                </ScrollView>}

            {/* Suggestions */}
            {showSugg && suggestions.length > 0 && <View style={s.suggBox}>
                    {suggestions.map((sug, i) => {
        const text = typeof sug === "string" ? sug : sug.text || sug.query || "";
        return <TouchableOpacity key={i} onPress={() => {
          setQ(text);
          runSearch(text);
        }} style={s.suggRow}>
                                <Search size={13} color={colors.textMuted} />
                                <Text style={s.suggText}>{text}</Text>
                            </TouchableOpacity>;
      })}
                </View>}

            {/* Results */}
            {loading ? <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View> : results.length === 0 && q ? <View style={s.empty}>
                    <Search size={48} color={colors.textMuted} style={{
        opacity: 0.5
      }} />
                    <Text style={s.emptyTitle}>{t("لا توجد نتائج")}</Text>
                    <Text style={s.emptySub}>{t("جرّب كلمات أخرى أو غيّر الفلاتر")}</Text>
                </View> : <FlatList data={results} keyExtractor={it => it.id} numColumns={2} columnWrapperStyle={{
      gap: 10,
      paddingHorizontal: 12,
      marginBottom: 10
    }} contentContainerStyle={{
      paddingTop: 8,
      paddingBottom: 130
    }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
      setRefreshing(true);
      runSearch();
    }} tintColor={colors.primary} />} renderItem={({
      item
    }) => <View style={{
      width: CARD_W
    }}>
                            <ListingCard listing={item} />
                        </View>} ListHeaderComponent={results.length > 0 ? <View style={s.resultsHeader}>
                            <Text style={s.resultsCount}>{results.length} {t("نتيجة")}</Text>
                            <View style={{
        flexDirection: "row",
        gap: 6
      }}>
                                {activeFiltersCount > 0 && <TouchableOpacity onPress={clearFilters} style={s.headerActionBtn} testID="search-clear-filters">
                                        <X size={12} color={colors.text} />
                                        <Text style={s.headerActionText}>{t("مسح الفلاتر")}</Text>
                                    </TouchableOpacity>}
                                <TouchableOpacity onPress={saveSearch} style={[s.headerActionBtn, s.headerActionPrimary]} testID="search-save-btn">
                                    <Bookmark size={12} color="#fff" />
                                    <Text style={[s.headerActionText, {
            color: "#fff"
          }]}>{t("حفظ البحث")}</Text>
                                </TouchableOpacity>
                            </View>
                        </View> : null} />}

            {/* Filters Modal */}
            <FiltersModal visible={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} setFilters={setFilters} categories={categories} country={country} onApply={() => {
      setFiltersOpen(false);
      runSearch();
    }} onClear={clearFilters} />
        </View>;
}
function Chip({
  label,
  onClose
}) {
  return <View style={s.chip}>
            <Text style={s.chipText}>{label}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={6}><X size={12} color={colors.primary} /></TouchableOpacity>
        </View>;
}
function FiltersModal({
  visible,
  onClose,
  filters,
  setFilters,
  categories,
  country,
  onApply,
  onClear
}) {
  const { t } = useI18n();
  
  const [local, setLocal] = useState(filters);
  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);
  const apply = () => {
    setFilters(local);
    onApply();
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={s.modalBg}>
                <View style={s.modalSheet}>
                    <View style={s.modalHead}>
                        <Text style={s.modalTitle}>{t("الفلاتر")}</Text>
                        <TouchableOpacity onPress={onClose} style={s.modalCloseX}><X size={18} color={colors.text} /></TouchableOpacity>
                    </View>
                    <ScrollView style={{
          maxHeight: "75%"
        }} contentContainerStyle={{
          padding: 14
        }}>
                        {/* Sort */}
                        <Text style={s.sectionLabel}>{t("الترتيب")}</Text>
                        <View style={s.tagsRow}>
                            {SORT_OPTIONS.map(opt => <TouchableOpacity key={opt.key} onPress={() => setLocal({
              ...local,
              sort: opt.key
            })} style={[s.tag, local.sort === opt.key && s.tagActive]}>
                                    <Text style={[s.tagText, local.sort === opt.key && s.tagTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>)}
                        </View>

                        {/* Condition */}
                        <Text style={s.sectionLabel}>{t("الحالة")}</Text>
                        <View style={s.tagsRow}>
                            <TouchableOpacity onPress={() => setLocal({
              ...local,
              condition: local.condition === "new" ? "" : "new"
            })} style={[s.tag, local.condition === "new" && s.tagActive]}>
                                <Text style={[s.tagText, local.condition === "new" && s.tagTextActive]}>{t("جديد")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setLocal({
              ...local,
              condition: local.condition === "used" ? "" : "used"
            })} style={[s.tag, local.condition === "used" && s.tagActive]}>
                                <Text style={[s.tagText, local.condition === "used" && s.tagTextActive]}>{t("مستعمل")}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Price range */}
                        <Text style={s.sectionLabel}>{t("نطاق السعر")}</Text>
                        <View style={{
            flexDirection: "row",
            gap: 8
          }}>
                            <TextInput value={local.priceMin} onChangeText={v => setLocal({
              ...local,
              priceMin: v.replace(/[^0-9.]/g, "")
            })} placeholder={t("من")} placeholderTextColor={colors.textMuted} keyboardType="numeric" style={s.priceInput} />
                            <Text style={s.priceDash}>—</Text>
                            <TextInput value={local.priceMax} onChangeText={v => setLocal({
              ...local,
              priceMax: v.replace(/[^0-9.]/g, "")
            })} placeholder={t("إلى")} placeholderTextColor={colors.textMuted} keyboardType="numeric" style={s.priceInput} />
                        </View>

                        {/* City */}
                        <Text style={s.sectionLabel}>{t("المدينة")}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{
              flexDirection: "row",
              gap: 6,
              paddingVertical: 2
            }}>
                                {(country?.cities || []).slice(0, 20).map(c => <TouchableOpacity key={c.name_ar} onPress={() => setLocal({
                ...local,
                city: local.city === c.name_ar ? "" : c.name_ar
              })} style={[s.tag, local.city === c.name_ar && s.tagActive]}>
                                        <Text style={[s.tagText, local.city === c.name_ar && s.tagTextActive]}>{c.name_ar}</Text>
                                    </TouchableOpacity>)}
                            </View>
                        </ScrollView>

                        {/* Category */}
                        <Text style={s.sectionLabel}>{t("التصنيف")}</Text>
                        <View style={s.tagsRow}>
                            {categories.map(c => <TouchableOpacity key={c.key} onPress={() => setLocal({
              ...local,
              category: local.category === c.key ? "" : c.key
            })} style={[s.tag, local.category === c.key && s.tagActive]}>
                                    <Text style={[s.tagText, local.category === c.key && s.tagTextActive]}>{c.name || c.name_ar}</Text>
                                </TouchableOpacity>)}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={s.modalFoot}>
                        <TouchableOpacity onPress={() => {
            onClear();
            setLocal({
              category: "",
              city: "",
              priceMin: "",
              priceMax: "",
              condition: "",
              sort: "newest"
            });
          }} style={s.clearBtn}>
                            <Text style={s.clearText}>{t("مسح")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={apply} style={s.applyBtn}>
                            <Check size={16} color="#fff" />
                            <Text style={s.applyText}>{t("تطبيق")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>;
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 6,
    backgroundColor: colors.bg
  },
  headBtn: {
    padding: 4
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 2
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    end: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.secondary
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(137,207,240,0.12)",
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444"
  },
  suggBox: {
    marginHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 8
  },
  suggRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  suggText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600"
  },
  resultsCount: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  headerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  headerActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  headerActionText: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.text
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center"
  },
  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%"
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text
  },
  modalCloseX: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center"
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginTop: 14,
    marginBottom: 8
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  tag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border
  },
  tagActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text
  },
  tagTextActive: {
    color: "#fff"
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text
  },
  priceDash: {
    alignSelf: "center",
    color: colors.textMuted,
    fontSize: 16
  },
  modalFoot: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  clearBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center"
  },
  clearText: {
    color: colors.textMuted,
    fontWeight: "800",
    fontSize: 13
  },
  applyBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6
  },
  applyText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14
  }
});