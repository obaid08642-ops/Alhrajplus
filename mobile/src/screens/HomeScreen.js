// HomeScreen — full visual parity with web /app/frontend/src/pages/HomePage.js
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, StyleSheet, RefreshControl, ActivityIndicator, Dimensions, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LucideIcons from "lucide-react-native";
import { Plus, Sparkles, ChevronDown, Search as SearchIcon, Flame, Gavel, Film, Plane, MapPin, Bot, Globe, Moon, Sun, Camera } from "lucide-react-native";
import { Modal, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../api";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";
import { useCountry } from "../CountryContext";
import { useThemeMode } from "../ThemeContext";
import { colors, radius, shadow } from "../theme";
import ListingCard from "../components/ListingCard";
import NotificationBell from "../components/NotificationBell";
// NOTE: CountrySwitcher is intentionally NOT imported here — owner directive:
// the country selector lives exclusively inside the Settings screen.
import { SkeletonListingGrid } from "../components/Skeleton";
const {
  width: SCREEN_W
} = Dimensions.get("window");
const CARD_GAP = 10;
const CARD_W = (SCREEN_W - 16 * 2 - CARD_GAP) / 2;
export default function HomeScreen() {
  const { t, lang } = useI18n();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    user
  } = useAuth();
  const { isDark, palette } = useThemeMode();
  
  const {
    dataVersion
  } = useCountry();
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const inflightRef = useRef(false);
  const fetchAll = useCallback(async (reset = false) => {
    if (reset) {
      setRefreshing(true);
      setPage(1);
      setHasMore(true);
    } else setLoading(true);
    try {
      const [cats, lists] = await Promise.all([api.get("/meta/categories", {
        params: {
          lang
        }
      }), api.get("/listings", {
        params: {
          limit: 20,
          page: 1
        }
      })]);
      setCategories(cats.data || []);
      const items = lists.data.items || [];
      setListings(items);
      if (items.length < 20) setHasMore(false);
    } catch (_) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lang]);
  useEffect(() => {
    fetchAll();
  }, [fetchAll, dataVersion]);
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || inflightRef.current) return;
    inflightRef.current = true;
    setLoadingMore(true);
    try {
      const {
        data
      } = await api.get("/listings", {
        params: {
          limit: 20,
          page: page + 1
        }
      });
      const next = data?.items || [];
      setListings(prev => [...prev, ...next]);
      setPage(p => p + 1);
      if (next.length < 20) setHasMore(false);
    } catch (_) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      inflightRef.current = false;
    }
  }, [page, hasMore, loadingMore]);
  const renderItem = useCallback(({
    item
  }) => <View style={{
    width: CARD_W
  }}>
            <ListingCard listing={item} />
        </View>, []);
  const keyExtractor = useCallback(item => String(item?.id), []);
  const visibleCats = showAllCats ? categories : categories.slice(0, 8);
  const Header = useMemo(() => <View>
            <TopBar nav={nav} insets={insets} t={t} />
            <Hero nav={nav} />
            <QuickActions nav={nav} />
            <CategoriesStrip cats={visibleCats} nav={nav} lang={lang} expanded={showAllCats} onToggle={() => setShowAllCats(s => !s)} total={categories.length} />
            <View style={styles.sectionHead}>
                <View>
                    <Text style={styles.sectionTitle}>{t("قريب منك")}</Text>
                    <Text style={styles.sectionSub}>{t("إعلانات في مدينتك ومدن قريبة")}</Text>
                </View>
            </View>
        </View>, [nav, insets, visibleCats, categories.length, showAllCats, lang]);
  return <View style={{
    flex: 1,
    backgroundColor: palette.bg
  }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.bg} />
            <FlatList data={listings} keyExtractor={keyExtractor} numColumns={2} columnWrapperStyle={{
      gap: CARD_GAP,
      paddingHorizontal: 12,
      marginBottom: CARD_GAP
    }} contentContainerStyle={{
      paddingBottom: 130
    }} ListHeaderComponent={Header} renderItem={renderItem} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} removeClippedSubviews ListEmptyComponent={loading ? <SkeletonListingGrid count={8} /> : <View style={styles.empty}>
                        <Text style={styles.mutedCenter}>{t("لا توجد نتائج")}</Text>
                    </View>} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} />} onEndReached={loadMore} onEndReachedThreshold={0.6} ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{
      marginVertical: 16
    }} /> : !hasMore && listings.length > 0 ? <Text style={[styles.mutedCenter, {
      marginVertical: 16
    }]}>{t("وصلت لنهاية القائمة")}</Text> : null} showsVerticalScrollIndicator={false} />
            {!user && <CTASection nav={nav} />}
        </View>;
}

// ====================== TopBar ======================
function TopBar({
  nav,
  insets
}) {
  const {
    t,
    lang,
    setLang,
    supported
  } = useI18n();
  const { isDark, toggle: toggleDarkMode } = useThemeMode();
  const [langOpen, setLangOpen] = useState(false);
  const [imgSearchBusy, setImgSearchBusy] = useState(false);
  const toggleDark = async () => {
    await toggleDarkMode();
  };
  // Image-search: pick or capture an image → send base64 to /ai/image-search →
  // navigate to Search with the returned Arabic query. Mirrors web TopBar.
  const startImageSearch = useCallback(async () => {
    if (imgSearchBusy) return;
    try {
      Alert.alert(
        t("بحث بالصورة"),
        t("اختر مصدر الصورة"),
        [
          {
            text: t("الكاميرا"),
            onPress: async () => {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) { Alert.alert(t("تنبيه"), t("يلزم إذن الكاميرا")); return; }
              const res = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                base64: true,
              });
              await processImageSearch(res);
            },
          },
          {
            text: t("المعرض"),
            onPress: async () => {
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                base64: true,
              });
              await processImageSearch(res);
            },
          },
          { text: t("إلغاء"), style: "cancel" },
        ],
        { cancelable: true }
      );
    } catch (_) {}
    async function processImageSearch(res) {
      if (!res || res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const b64 = asset.base64;
      if (!b64) { Alert.alert(t("خطأ"), t("تعذر قراءة الصورة")); return; }
      setImgSearchBusy(true);
      try {
        const { data } = await api.post("/ai/image-search", { image_base64: b64 });
        const q = (data?.query || "").trim();
        if (!q) { Alert.alert(t("تنبيه"), t("لم نتمكن من فهم الصورة. حاول بصورة أوضح.")); return; }
        nav.navigate("Search", { q });
      } catch (e) {
        Alert.alert(t("خطأ"), t("خطأ في البحث بالصورة"));
      } finally {
        setImgSearchBusy(false);
      }
    }
  }, [imgSearchBusy, nav, t]);
  const LANG_LABELS = {
    ar: "العربية 🇸🇦", en: "English 🇬🇧", hi: "हिन्दी 🇮🇳",
    ur: "اردو 🇵🇰", bn: "বাংলা 🇧🇩", fr: "Français 🇫🇷"
  };
  return <View style={{ paddingTop: insets.top + 4 }}>
            <LinearGradient
                colors={isDark ? ["#0F1B3A", "#152244"] : [colors.primary, colors.primaryHover]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.brandRow}>
                <Text style={styles.brandTitle}>{t("الحراج بلس")}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {/* Dark mode toggle — switches the global ThemeContext live. */}
                    <TouchableOpacity onPress={toggleDark} style={styles.headerIconBtn} testID="home-dark-toggle" hitSlop={6}>
                        {isDark ? <Sun size={16} color="#fff" strokeWidth={2.4} /> : <Moon size={16} color="#fff" strokeWidth={2.4} />}
                    </TouchableOpacity>
                    {/* Language switcher pill */}
                    <TouchableOpacity onPress={() => setLangOpen(true)} style={styles.headerIconBtn} testID="home-lang-btn" hitSlop={6}>
                        <Globe size={16} color="#fff" strokeWidth={2.4} />
                    </TouchableOpacity>
                    <NotificationBell />
                </View>
            </View>
            <View style={styles.topBar}>
            <TouchableOpacity onPress={() => nav.navigate("Search")} style={styles.searchBox} testID="home-search-box">
                <SearchIcon size={16} color={colors.primaryHover} />
                <Text style={styles.searchPh} numberOfLines={1}>{t("ابحث... (AI)")}</Text>
                {/* Image search — parity with web /api/ai/image-search */}
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); startImageSearch(); }}
                  hitSlop={8}
                  disabled={imgSearchBusy}
                  testID="home-image-search-btn"
                  accessibilityLabel={t("بحث بالصورة")}
                  style={{ paddingHorizontal: 4 }}
                >
                  {imgSearchBusy
                    ? <ActivityIndicator size="small" color={colors.primaryHover} />
                    : <Camera size={16} color={colors.primaryHover} strokeWidth={2.4} />}
                </TouchableOpacity>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => nav.navigate("AIAssistant")} style={styles.aiPill} testID="home-ai-assistant">
                <Bot size={16} color={colors.primaryHover} strokeWidth={2.5} />
            </TouchableOpacity>
            </View>
            {/* Language modal */}
            <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setLangOpen(false)} style={styles.langSheetBg}>
                    <View style={styles.langSheet}>
                        <Text style={styles.langSheetTitle}>{t("اختر اللغة")}</Text>
                        {supported.map(code => (
                            <TouchableOpacity key={code} onPress={() => { setLang(code); setLangOpen(false); }} style={[styles.langRow, code === lang && styles.langRowActive]} testID={`home-lang-opt-${code}`}>
                                <Text style={[styles.langRowText, code === lang && { color: colors.primary, fontWeight: "900" }]}>{LANG_LABELS[code]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>;
}

// ====================== Hero ======================
function Hero({
  nav
}) {
  const { t } = useI18n();
  
  return <View style={{
    paddingHorizontal: 12,
    marginTop: 6
  }}>
            <View style={[styles.heroWrap, shadow.card]}>
                <LinearGradient colors={["#0F1A35", "#1A2952", "#0F1A35"]} start={{
        x: 1,
        y: 0
      }} end={{
        x: 0,
        y: 1
      }} style={StyleSheet.absoluteFillObject} />
                {/* glow blobs */}
                <View style={[styles.glowBlob, {
        top: -40,
        right: -40,
        backgroundColor: "rgba(137,207,240,0.25)"
      }]} />
                <View style={[styles.glowBlob, {
        bottom: -40,
        left: -40,
        backgroundColor: "rgba(255,209,102,0.12)"
      }]} />

                <View style={styles.heroInner}>
                    <View style={styles.aiBadge}>
                        <Sparkles size={11} color={colors.primary} />
                        <Text style={styles.aiBadgeText}>{t("مدعوم بالذكاء الاصطناعي")}</Text>
                    </View>
                    <Text style={styles.heroTitle}>
                        بيع، اشترِ، استأجر،{" "}
                        <Text style={{
            color: colors.primary
          }}>{t("وظّف")}</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>{t("أكبر سوق رقمي للخليج العربي — كل شيء في مكان واحد")}</Text>
                    <View style={{
          flexDirection: "row",
          gap: 8,
          marginTop: 14
        }}>
                        <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.heroPrimaryBtn}>
                            <Plus size={15} color="#fff" strokeWidth={3} />
                            <Text style={styles.heroPrimaryText}>{t("أنشر مجاناً")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => nav.navigate("Map")} style={styles.heroSecondaryBtn}>
                            <Text style={styles.heroSecondaryText}>{t("🗺️ خريطة قريبة")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>;
}

// ====================== Quick Actions ======================
function QuickActions({
  nav
}) {
  const { t } = useI18n();
  
  const items = [{
    to: "Deals",
    Icon: Flame,
    color: "#EF4444",
    label: t("صفقات"),
    bg: ["#D1FAE5", "#FEE2E2"]
  }, {
    to: "Auctions",
    Icon: Gavel,
    color: "#F59E0B",
    label: t("مزادات"),
    bg: ["#FEF3C7", "#FEF9C3"]
  }, {
    to: "ReelsTab",
    Icon: Film,
    color: "#EC4899",
    label: t("قصص"),
    bg: ["#FCE7F3", "#FDF2F8"]
  }, {
    to: "Flights",
    Icon: Plane,
    color: "#0EA5E9",
    label: t("طيران"),
    bg: ["#DBEAFE", "#F0F9FF"]
  }, {
    to: "Map",
    Icon: MapPin,
    color: "#10B981",
    label: t("خريطة"),
    bg: ["#D1FAE5", "#ECFDF5"]
  }];
  return <View style={styles.quickWrap}>
            {items.map(it => <TouchableOpacity key={it.label} onPress={() => nav.navigate(it.to)} style={styles.quickItem} activeOpacity={0.85} testID={`home-quick-${it.to}`}>
                    <LinearGradient colors={it.bg} style={StyleSheet.absoluteFillObject} start={{
        x: 0,
        y: 0
      }} end={{
        x: 1,
        y: 1
      }} />
                    <it.Icon size={22} color={it.color} strokeWidth={2.4} />
                    <Text style={styles.quickLabel}>{it.label}</Text>
                </TouchableOpacity>)}
        </View>;
}

// ====================== Categories Strip ======================
function CategoriesStrip({
  cats,
  nav,
  lang,
  expanded,
  onToggle,
  total
}) {
  const { t } = useI18n();
  
  return <View style={{
    paddingHorizontal: 12,
    marginTop: 16
  }}>
            <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{t("الأقسام")}</Text>
                {total > 8 && <TouchableOpacity onPress={onToggle} style={styles.toggleBtn}>
                        <Text style={styles.toggleText}>{expanded ? t("عرض أقل") : t("عرض الكل")}</Text>
                        <ChevronDown size={13} color={colors.primary} style={{
          transform: [{
            rotate: expanded ? "180deg" : "0deg"
          }]
        }} />
                    </TouchableOpacity>}
            </View>
            <View style={styles.catsGrid}>
                {cats.map(c => {
        const Icon = LucideIcons[c.icon] || LucideIcons.Shapes;
        const name = c.name || c.name_ar || c.name_en || c.key;
        return <TouchableOpacity key={c.key} onPress={() => nav.navigate("CategoryListings", {
          categoryKey: c.key,
          name
        })} style={styles.catItem} activeOpacity={0.85}>
                            <View style={styles.catIconWrap}>
                                <Icon size={22} color={colors.primary} strokeWidth={2.2} />
                            </View>
                            <Text style={styles.catName} numberOfLines={1}>{name}</Text>
                        </TouchableOpacity>;
      })}
            </View>
        </View>;
}

// ====================== CTA Section (for guests) ======================
function CTASection({
  nav
}) {
  const { t } = useI18n();
  
  return <View style={styles.ctaWrap}>
            <LinearGradient colors={["#0F1A35", "#1A2952"]} style={StyleSheet.absoluteFillObject} start={{
      x: 1,
      y: 0
    }} end={{
      x: 0,
      y: 1
    }} />
            <View style={{
      padding: 18
    }}>
                <Text style={styles.ctaTitle}>{t("انضم اليوم — مجاناً تماماً")}</Text>
                <Text style={styles.ctaSub}>{t("سجّل في دقيقة وابدأ البيع والشراء")}</Text>
                <TouchableOpacity onPress={() => nav.navigate("Login")} style={styles.ctaBtn}>
                    <Text style={styles.ctaBtnText}>{t("إنشاء حساب")}</Text>
                </TouchableOpacity>
            </View>
        </View>;
}

// ====================== Styles ======================
const styles = StyleSheet.create({
  // Brand row — "حراج بلس" centered top heading per design brief.
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)"
  },
  langSheetBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.40)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  langSheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#89CFF0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12
  },
  langSheetTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    marginBottom: 12
  },
  langRow: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 2
  },
  langRowActive: {
    backgroundColor: "rgba(137,207,240,0.12)"
  },
  langRowText: {
    fontSize: 15,
    color: colors.text,
    textAlign: "right",
    fontWeight: "700"
  },
  // TopBar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: "transparent"
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadow.card
  },
  searchPh: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12
  },
  aiPill: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    ...shadow.soft,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  // Hero
  heroWrap: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.secondary,
    position: "relative"
  },
  glowBlob: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
    opacity: 0.7
  },
  heroInner: {
    paddingHorizontal: 18,
    paddingVertical: 22,
    position: "relative"
  },
  aiBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(137,207,240,0.18)",
    borderColor: "rgba(137,207,240,0.4)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10
  },
  aiBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800"
  },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    marginBottom: 4
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11.5,
    lineHeight: 16
  },
  heroPrimaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  heroPrimaryText: {
    color: colors.accentFg,
    fontWeight: "900",
    fontSize: 12
  },
  heroSecondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  heroSecondaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12
  },
  // Quick actions
  quickWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 14
  },
  quickItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...shadow.card
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center"
  },
  // Section heads
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 18,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary
  },
  // Categories
  catsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  catItem: {
    width: (SCREEN_W - 24 - 8 * 3) / 4,
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    alignItems: "center",
    padding: 10,
    gap: 5,
    ...shadow.card
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(137,207,240,0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  catName: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center"
  },
  // Empty/loading
  empty: {
    padding: 32,
    marginHorizontal: 12,
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    ...shadow.card
  },
  mutedCenter: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center"
  },
  // CTA
  ctaWrap: {
    position: "absolute",
    bottom: 110,
    left: 12,
    right: 12,
    borderRadius: 22,
    overflow: "hidden"
  },
  ctaTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4
  },
  ctaSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginBottom: 10
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 8
  },
  ctaBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12
  }
});