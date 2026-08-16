/**
 * Search + Category browsing + Notifications + Static pages — bundle of
 * lightweight screens to bring the mobile app to feature parity with the web.
 */
import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
import api from "../api";
import { theme, shadow } from "../theme";
import { useI18n } from "../I18nContext";
import { useAuth } from "../AuthContext";
import { useCountry } from "../CountryContext";
import { useThemeMode } from "../ThemeContext";
import ListingCard from "../components/ListingCard";
import { SkeletonListingGrid, SkeletonCategoryGrid } from "../components/Skeleton";
import { MessageCircle, Bell, FileText, Megaphone, Sparkles, Settings, Globe, Flag, Search, Users, Moon, Sun, Trash2, FolderOpen, User } from "lucide-react-native";

// FlatList perf defaults — defined once at module scope.
const FLAT_PERF = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  removeClippedSubviews: true
};

// ---------- CATEGORIES SCREEN ----------
export function CategoriesScreen({
  navigation
}) {
  const { t, lang } = useI18n();
  
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get("/meta/categories", {
      params: {
        lang
      }
    }).then(({
      data
    }) => {
      if (alive) setCats(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (alive) setCats([]);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [lang]);
  if (loading) return <SkeletonCategoryGrid count={10} />;
  if (!cats.length) return <View style={s.center}><Text style={s.muted}>{t("لا توجد تصنيفات")}</Text></View>;
  const renderCat = useCallback(({
    item
  }) => <TouchableOpacity onPress={() => navigation?.navigate?.("CategoryListings", {
    categoryKey: item.key,
    name: item.name || item.name_ar
  })} style={s.catCard} testID={`mobile-cat-${item.key}`}>
            <Text style={s.catName}>{item.name || item.name_ar}</Text>
            {item.subcategories?.length > 0 && <Text style={s.catSubs}>{item.subcategories.length} {t("تصنيف فرعي")}</Text>}
        </TouchableOpacity>, [navigation, t]);
  return <FlatList data={cats} keyExtractor={c => String(c.key)} numColumns={2} contentContainerStyle={{
    padding: 10
  }} renderItem={renderCat} {...FLAT_PERF} />;
}
export function CategoryListingsScreen({
  route,
  navigation
}) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const {
    categoryKey,
    name
  } = route?.params || {};
  
  const {
    dataVersion
  } = useCountry();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!categoryKey) {
      setItems([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    api.get("/listings", {
      params: {
        category: categoryKey,
        limit: 30
      }
    }).then(({
      data
    }) => {
      if (alive) setItems(data?.items || []);
    }).catch(() => {
      if (alive) setItems([]);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [categoryKey, dataVersion]);
  const renderListing = useCallback(({
    item
  }) => <View style={{
    flex: 1,
    padding: 4
  }}>
            <ListingCard listing={item} onPress={() => navigation?.navigate?.("ListingDetail", {
      id: item.id
    })} />
        </View>, [navigation]);
  return <View style={[s.wrap, { backgroundColor: palette.bg }]}>
            <Text style={s.pageTitle}>{name || t("التصنيف")}</Text>
            {loading ? <View style={s.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View> : <FlatList data={items} keyExtractor={item => String(item?.id)} numColumns={2} contentContainerStyle={{
      padding: 8,
      paddingBottom: 130
    }} renderItem={renderListing} ListEmptyComponent={<View style={{
      padding: 40,
      alignItems: "center"
    }}><Text style={s.muted}>{t("لا توجد إعلانات في هذا التصنيف")}</Text></View>} {...FLAT_PERF} />}
        </View>;
}

// ---------- NOTIFICATIONS SCREEN ----------
export function NotificationsScreen({
  navigation
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { palette } = useThemeMode();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get("/notifications").then(({
      data
    }) => setItems(data?.items || data || [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, [user]);
  const open = async n => {
    try {
      await api.post(`/notifications/${n.id}/read`);
    } catch (_) {}
    // Owner mandate: tapping a notification MUST navigate to the relevant
    // screen (chat thread / listing / etc.). Previous logic only checked
    // a few specific `type` values and silently failed for everything
    // else. New logic prioritises the explicit `url` field (same one the
    // push payload uses) and falls back to type/reference_id heuristics.
    const d = n.data || {};
    const url = n.url || d.url || "";
    // 1) Use the push-payload `url` field if backend included it.
    if (url) {
      try {
        let m = url.match(/^\/listing\/([^/?#]+)/);
        if (m) { navigation.navigate("ListingDetail", { id: m[1] }); return; }
        m = url.match(/^\/seller\/([^/?#]+)/);
        if (m) { navigation.navigate("SellerProfile", { sellerId: m[1] }); return; }
        m = url.match(/^\/chat(?:\?to=([^&]+))?/);
        if (m) { navigation.navigate("Chat", m[1] ? { to: m[1] } : {}); return; }
        m = url.match(/^\/c\/([^/?#]+)/);
        if (m) { navigation.navigate("Search", { category: decodeURIComponent(m[1]) }); return; }
        if (url.startsWith("/post")) { navigation.navigate("Post"); return; }
        m = url.match(/^\/search(?:\?q=([^&]+))?/);
        if (m) { navigation.navigate("Search", m[1] ? { q: decodeURIComponent(m[1]) } : {}); return; }
      } catch (_) {}
    }
    // 2) Type-based fallback (legacy notifications without `url`).
    const type = n.type || "";
    if (type === "new_message" || type === "message" || type === "chat") {
      const to = d.sender_id || d.from || n.reference_id;
      if (to) { navigation.navigate("Chat", { to }); return; }
    }
    if (type.startsWith("listing") || type === "price_drop") {
      const id = d.listing_id || n.reference_id;
      if (id) { navigation.navigate("ListingDetail", { id }); return; }
    }
    if (type === "auction" || type.startsWith("auction") || type === "bid_outbid") {
      const id = d.listing_id || n.reference_id;
      if (id) { navigation.navigate("ListingDetail", { id }); return; }
      navigation.navigate("Auctions");
      return;
    }
    // 3) Last-resort fallback — if a reference_id looks like a listing UUID,
    // open that.
    if (n.reference_id) {
      navigation.navigate("ListingDetail", { id: n.reference_id });
    }
  };
  // Visual icon + tint per notification type — clean baby-blue family.
  const iconFor = type => {
    switch (type) {
      case "message":
      case "chat": return { Icon: MessageCircle, tint: theme.colors.primary };
      case "price_alert": return { Icon: Bell, tint: "#F59E0B" };
      case "listing": return { Icon: FileText, tint: theme.colors.success };
      case "promo":
      case "broadcast": return { Icon: Megaphone, tint: theme.colors.accent };
      default: return { Icon: Sparkles, tint: theme.colors.primary };
    }
  };
  if (!user) return <View style={s.center}><Text style={s.muted}>{t("يجب تسجيل الدخول أولاً")}</Text></View>;
  if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;
  return <View style={{ flex: 1, backgroundColor: palette.bg }}>
            <Text style={s.pageTitle}>{t("الإشعارات")}</Text>
            <FlatList
              data={items}
              keyExtractor={n => n.id || String(Math.random())}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 130 }}
              renderItem={({ item }) => {
                const { Icon, tint } = iconFor(item.type);
                return <TouchableOpacity onPress={() => open(item)} style={[s.notifCard, !item.read && s.notifCardUnread]} testID={`notif-${item.id}`}>
                  <View style={[s.notifIconWrap, { backgroundColor: `${tint}22` }]}>
                    <Icon size={21} color={tint} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.notifTitle} numberOfLines={1}>{item.title}</Text>
                    {item.body ? <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text> : null}
                    {item.created_at ? <Text style={s.notifTime}>{new Date(item.created_at).toLocaleDateString("ar")}</Text> : null}
                  </View>
                  {!item.read && <View style={s.notifDot} />}
                </TouchableOpacity>;
              }}
              ListEmptyComponent={<View style={{ padding: 60, alignItems: "center" }}>
                <Text style={{ fontSize: 48 }}>🔔</Text>
                <Text style={[s.muted, { marginTop: 12 }]}>{t("لا توجد إشعارات")}</Text>
              </View>} />
        </View>;
}

// ---------- SETTINGS + STATIC PAGES ----------
export function SettingsScreen({
  navigation
}) {
  const { t, lang, setLang, supported } = useI18n();
  const { current: country, countries, setCountry } = useCountry();
  const { palette, isDark, themeMode, toggle: toggleDark, setThemeMode } = useThemeMode();
  const [langOpen, setLangOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const LANG_LABELS = {
    ar: "العربية 🇸🇦",
    en: "English 🇬🇧",
    hi: "हिन्दी 🇮🇳",
    ur: "اردو 🇵🇰",
    bn: "বাংলা 🇧🇩",
    fr: "Français 🇫🇷"
  };
  return <ScrollView style={[s.wrap, { backgroundColor: palette.bg }]}>
            <Text style={s.pageTitle}>{t("الإعدادات")}</Text>
            <View style={s.menu}>
                <TouchableOpacity style={s.menuItem} onPress={toggleDark} testID="settings-dark-toggle">
                    {isDark ? <Moon size={17} color={theme.colors.primary} /> : <Sun size={17} color={theme.colors.primary} />}<Text style={s.menuLabel}>{t("الوضع الداكن")}: {isDark ? t("مفعل") : t("معطل")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.menuItem, themeMode === "system" && s.menuItemActive]} onPress={() => setThemeMode("system")} testID="settings-system-theme">
                    <Settings size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{t("تلقائي حسب إعدادات الجهاز")}{themeMode === "system" ? ` — ${t("مفعل")}` : ""}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => setLangOpen(true)} testID="mobile-lang-switcher">
                    <Globe size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{t("اللغة")}: {LANG_LABELS[lang]}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => setCountryOpen(true)} testID="mobile-country-switcher-settings">
                    <Flag size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{t("الدولة")}: {country?.flag || ""} {country?.name_ar || country?.name || t("غير محددة")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("SavedSearches")}>
                    <Search size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{t("الأبحاث المحفوظة")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Following")}>
                    <Users size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{t("متابعاتي")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("NotifSettings")}>
                    <Bell size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{t("إعدادات الإشعارات")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Notifications")}>
                    <Text style={s.menuLabel}>{t("الإشعارات")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
        key: "terms"
      })}>
                    <Text style={s.menuLabel}>{t("الشروط والأحكام")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
        key: "privacy"
      })}>
                    <Text style={s.menuLabel}>{t("سياسة الخصوصية")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
        key: "about"
      })}>
                    <Text style={s.menuLabel}>{t("عن التطبيق")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
        key: "contact"
      })}>
                    <Text style={s.menuLabel}>{t("تواصل معنا")}</Text>
                </TouchableOpacity>
            </View>
            {/* Language picker modal */}
            <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setLangOpen(false)} style={s.modalBg}>
                    <View style={s.sheet}>
                        <Text style={s.sheetTitle}>{t("اختر اللغة")}</Text>
                        {supported.map((code) => (
                            <TouchableOpacity key={code} style={[s.sheetRow, code === lang && s.sheetRowActive]} onPress={() => { setLang(code); setLangOpen(false); }} testID={`lang-opt-${code}`}>
                                <Text style={[s.sheetRowText, code === lang && { color: theme.colors.primary, fontWeight: "900" }]}>{LANG_LABELS[code]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
            {/* Country picker modal */}
            <Modal visible={countryOpen} transparent animationType="fade" onRequestClose={() => setCountryOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setCountryOpen(false)} style={s.modalBg}>
                    <View style={s.sheet}>
                        <Text style={s.sheetTitle}>{t("اختر الدولة")}</Text>
                        <ScrollView style={{ maxHeight: 360 }}>
                            {(countries || []).map((c) => (
                                <TouchableOpacity key={c.code} style={[s.sheetRow, c.code === country?.code && s.sheetRowActive]} onPress={async () => { await setCountry(c.code); setCountryOpen(false); }} testID={`country-opt-${c.code}`}>
                                    <Text style={[s.sheetRowText, c.code === country?.code && { color: theme.colors.primary, fontWeight: "900" }]}>{c.flag} {c.name_ar || c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScrollView>;
}

// Local fallback used only when the network call fails — keeps UX intact offline.
// Stored as plain keys; translated inside the component to avoid evaluating `t`
// at module-load time (which would throw before any screen mounts).
const STATIC_FALLBACK_KEYS = {
  terms: {
    title: "الشروط والأحكام",
    body: "باستخدامك تطبيق الحراج بلس فإنك توافق على شروط الاستخدام."
  },
  privacy: {
    title: "سياسة الخصوصية",
    body: "نلتزم بحماية بياناتك ولا نشاركها مع أطراف ثالثة."
  },
  about: {
    title: "عن التطبيق",
    body: "الحراج بلس — منصة بيع وشراء عربية مدعومة بالذكاء الاصطناعي."
  },
  contact: {
    title: "تواصل معنا",
    body: "📧 support@alhraj.online\n📧 contact@alhraj.online"
  }
};
export function StaticPageScreen({
  route
}) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  
  const slug = route.params?.key || route.params?.slug || "about";
  const STATIC_FALLBACK = Object.fromEntries(Object.entries(STATIC_FALLBACK_KEYS).map(([k, v]) => [k, {
    title: t(v.title),
    body: v.body.startsWith("📧") ? v.body : t(v.body)
  }]));
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    api.get(`/static-pages/${slug}`).then(({
      data
    }) => {
      if (mounted) setPage({
        title: data.title,
        body: data.body
      });
    }).catch(() => {
      if (mounted) setPage(STATIC_FALLBACK[slug] || STATIC_FALLBACK.about);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [slug]);
  if (loading) return <View style={{
    flex: 1,
    justifyContent: "center"
  }}><ActivityIndicator color={theme.colors.primary} /></View>;
  return <ScrollView style={[s.wrap, { backgroundColor: palette.bg }]} contentContainerStyle={{
    padding: 18
  }}>
            <Text style={s.pageTitle} testID="static-page-title">{page?.title}</Text>
            <Text style={s.staticBody} testID="static-page-body">{page?.body}</Text>
        </ScrollView>;
}
const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.40)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#89CFF0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "right",
    marginBottom: 12
  },
  sheetRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 2
  },
  sheetRowActive: {
    backgroundColor: "rgba(137,207,240,0.12)"
  },
  sheetRowText: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: "right",
    fontWeight: "700"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  muted: {
    color: theme.colors.textMuted,
    textAlign: "center",
    padding: 20
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    padding: 16,
    textAlign: "right"
  },
  catCard: {
    flex: 1,
    margin: 6,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center"
  },
  catName: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center"
  },
  catSubs: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4
  },
  notifItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  notifUnread: {
    backgroundColor: theme.colors.surfaceElevated
  },
  // New card-based notification design — soft shadow + 20 radius + icon avatar.
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: 20,
    marginBottom: 10,
    ...shadow.card
  },
  notifCardUnread: {
    backgroundColor: "#FFFFFF",
    shadowOpacity: 0.10
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center"
  },
  notifEmoji: {
    fontSize: 20
  },
  notifTitle: {
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "right",
    fontSize: 14
  },
  notifBody: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
    lineHeight: 17
  },
  notifTime: {
    color: theme.colors.textSubtle,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 4
  },
  notifDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.accent
  },
  menu: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden"
  },
  menuItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  menuItemActive: {
    backgroundColor: `${theme.colors.primary}14`
  },
  menuLabel: {
    color: theme.colors.text,
    fontWeight: "700",
    textAlign: "right"
  },
  staticBody: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right"
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  switchLabel: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "right"
  }
});

// ---------- SAVED SEARCHES + FOLLOWING ----------
export function SavedSearchesScreen({
  navigation
}) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    api.get("/search/saved").then(({
      data
    }) => setItems(data || [])).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const del = async id => {
    try {
      await api.delete(`/search/saved/${id}`);
      load();
    } catch (_) {}
  };
  if (loading) return <View style={{
    flex: 1,
    justifyContent: "center"
  }}><ActivityIndicator color={theme.colors.primary} /></View>;
  return <View style={{
    flex: 1,
    backgroundColor: palette.bg
  }}>
            <Text style={{
      padding: 16,
      fontSize: 18,
      fontWeight: "900",
      color: palette.text,
      textAlign: "right"
    }}>{t("الأبحاث المحفوظة")}</Text>
            <FlatList data={items} keyExtractor={it => it.id} renderItem={({
      item
    }) => <View style={s.menuItem}>
                        <TouchableOpacity onPress={() => navigation.navigate("Search", {
        q: item.q
      })} style={{
        flex: 1
      }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Search size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{item.q}</Text></View>
                            {item.category ? <Text style={{
          color: theme.colors.textMuted,
          fontSize: 11,
          textAlign: "right"
        }}>{item.category}</Text> : null}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => del(item.id)} testID={`saved-del-${item.id}`}>
                            <Trash2 size={18} color={theme.colors.danger} style={{ margin: 6 }} />
                        </TouchableOpacity>
                    </View>} ListEmptyComponent={<View style={{
      padding: 40,
      alignItems: "center"
    }}><Text style={{
        color: theme.colors.textMuted
      }}>{t("لا توجد أبحاث محفوظة")}</Text></View>} />
        </View>;
}
export function FollowingScreen({
  navigation
}) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  
  const [data, setData] = useState({
    categories: [],
    sellers: []
  });
  const [sellerMap, setSellerMap] = useState({}); // id -> { name, avatar }
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/following").then(async ({
      data
    }) => {
      const d = data || {
        categories: [],
        sellers: []
      };
      setData(d);
      // Fetch seller details in parallel so we can show real names.
      const ids = (d.sellers || []).map(x => x.seller_id).filter(Boolean);
      if (ids.length) {
        const results = await Promise.all(ids.map(id => api.get(`/sellers/${id}`).then(r => [id, r.data]).catch(() => [id, null])));
        const map = {};
        for (const [id, info] of results) {
          if (info) map[id] = {
            name: info.name || info.username || id,
            avatar: info.avatar
          };
        }
        setSellerMap(map);
      }
    }).finally(() => setLoading(false));
  }, []);
  if (loading) return <View style={{
    flex: 1,
    justifyContent: "center"
  }}><ActivityIndicator color={theme.colors.primary} /></View>;
  return <ScrollView style={{
    flex: 1,
    backgroundColor: palette.bg
  }}>
            <Text style={{
      padding: 16,
      fontSize: 18,
      fontWeight: "900",
      color: palette.text,
      textAlign: "right"
    }}>{t("متابعاتي")}</Text>
            <Text style={{
      paddingHorizontal: 16,
      fontSize: 13,
      fontWeight: "800",
      color: theme.colors.textMuted,
      textAlign: "right"
    }}>{t("التصنيفات")}</Text>
            {data.categories.length === 0 ? <Text style={{
      padding: 16,
      color: theme.colors.textMuted,
      textAlign: "right"
    }}>{t("لا يوجد")}</Text> : data.categories.map(c => <View key={c.category} style={s.menuItem}>
                        <TouchableOpacity onPress={() => navigation.navigate("CategoryListings", {
        categoryKey: c.category,
        name: c.category
      })} style={{
        flex: 1
      }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><FolderOpen size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{c.category}</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={async () => {
        await api.delete(`/follow/category/${c.category}`);
        setData(d => ({
          ...d,
          categories: d.categories.filter(x => x.category !== c.category)
        }));
      }}>
                            <Trash2 size={18} color={theme.colors.danger} style={{ margin: 6 }} />
                        </TouchableOpacity>
                    </View>)}
            <Text style={{
      paddingHorizontal: 16,
      paddingTop: 12,
      fontSize: 13,
      fontWeight: "800",
      color: theme.colors.textMuted,
      textAlign: "right"
    }}>{t("البائعون")}</Text>
            {data.sellers.length === 0 ? <Text style={{
      padding: 16,
      color: theme.colors.textMuted,
      textAlign: "right"
    }}>{t("لا يوجد")}</Text> : data.sellers.map(s2 => {
      const info = sellerMap[s2.seller_id];
      const displayName = info?.name || t("بائع");
      return <TouchableOpacity key={s2.seller_id} style={s.menuItem} onPress={() => navigation.navigate("SellerProfile", {
        sellerId: s2.seller_id
      })} testID={`following-seller-${s2.seller_id}`}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><User size={17} color={theme.colors.primary} /><Text style={s.menuLabel}>{displayName}</Text></View>
                        </TouchableOpacity>;
    })}
        </ScrollView>;
}

// ---------- NOTIFICATION SETTINGS ----------
import { Switch } from "react-native";
export function NotifSettingsScreen() {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  
  const [prefs, setPrefs] = useState({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    api.get("/users/me/notifications/settings").then(({
      data
    }) => {
      setPrefs(data);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);
  const toggle = async k => {
    const next = !prefs[k];
    setPrefs({
      ...prefs,
      [k]: next
    });
    try {
      await api.put("/users/me/notifications/settings", {
        [k]: next
      });
    } catch (_) {}
  };
  const ROWS = [["price_alerts", "🔔 " + t("تنبيهات الأسعار")], ["category_alerts", "📂 " + t("تنبيهات التصنيفات")], ["messages", "💬 " + t("رسائل المحادثة")], ["listing_status", "📝 " + t("حالة الإعلانات")], ["watchlist", "👁️ " + t("قائمة المتابعة")], ["broadcasts", "📢 " + t("الإعلانات العامة")]];
  if (!loaded) return <View style={{
    flex: 1,
    justifyContent: "center"
  }}><ActivityIndicator color={theme.colors.primary} /></View>;
  return <ScrollView style={{
    flex: 1,
    backgroundColor: palette.bg
  }}>
            <Text style={{
      padding: 16,
      fontSize: 18,
      fontWeight: "900",
      color: palette.text,
      textAlign: "right"
    }}>{t("إعدادات الإشعارات")}</Text>
            <View style={{
      marginHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden"
    }}>
                {ROWS.map(([k, label]) => <View key={k} style={s.switchRow}>
                        <Switch value={!!prefs[k]} onValueChange={() => toggle(k)} testID={`notif-toggle-${k}`} />
                        <Text style={s.switchLabel}>{label}</Text>
                    </View>)}
            </View>
        </ScrollView>;
}