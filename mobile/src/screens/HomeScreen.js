// HomeScreen — full visual parity with web /app/frontend/src/pages/HomePage.js
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, StyleSheet, RefreshControl, ActivityIndicator, Dimensions, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LucideIcons from "lucide-react-native";
import { Plus, Sparkles, ChevronDown, Search as SearchIcon, Flame, Gavel, Film, Plane, MapPin } from "lucide-react-native";
import api from "../api";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";
import { useCountry } from "../CountryContext";
import { colors, radius, shadow } from "../theme";
import ListingCard from "../components/ListingCard";
import NotificationBell from "../components/NotificationBell";
import CountrySwitcher from "../components/CountrySwitcher";
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
    backgroundColor: colors.bg
  }}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
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
    t
  } = useI18n();
  return <View style={[styles.topBar, {
    paddingTop: insets.top + 6
  }]}>
            <TouchableOpacity onPress={() => nav.navigate("Search")} style={styles.searchBox} testID="home-search-box">
                <SearchIcon size={16} color={colors.textMuted} />
                <Text style={styles.searchPh} numberOfLines={1}>{t("ابحث... (AI)")}</Text>
            </TouchableOpacity>
            <CountrySwitcher />
            <NotificationBell />
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
  // TopBar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.bg
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchPh: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    padding: 10,
    gap: 5
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border
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