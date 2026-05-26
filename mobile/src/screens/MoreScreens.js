/**
 * Search + Category browsing + Notifications + Static pages — bundle of
 * lightweight screens to bring the mobile app to feature parity with the web.
 */
import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import api from "../api";
import { theme } from "../theme";
import { useI18n } from "../I18nContext";
import { useAuth } from "../AuthContext";
import { useCountry } from "../CountryContext";
import ListingCard from "../components/ListingCard";

// FlatList perf defaults — defined once at module scope.
const FLAT_PERF = { initialNumToRender: 8, maxToRenderPerBatch: 8, windowSize: 7, removeClippedSubviews: true };

// ---------- CATEGORIES SCREEN ----------
export function CategoriesScreen({ navigation }) {
    const { t, lang } = useI18n();
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        api.get("/meta/categories", { params: { lang } })
            .then(({ data }) => { if (alive) setCats(Array.isArray(data) ? data : []); })
            .catch(() => { if (alive) setCats([]); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [lang]);

    if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
    if (!cats.length) return <View style={s.center}><Text style={s.muted}>{t("لا توجد تصنيفات")}</Text></View>;

    const renderCat = useCallback(({ item }) => (
        <TouchableOpacity
            onPress={() => navigation?.navigate?.("CategoryListings", { categoryKey: item.key, name: item.name || item.name_ar })}
            style={s.catCard}
            testID={`mobile-cat-${item.key}`}
        >
            <Text style={s.catName}>{item.name || item.name_ar}</Text>
            {item.subcategories?.length > 0 && (
                <Text style={s.catSubs}>{item.subcategories.length} {t("تصنيف فرعي")}</Text>
            )}
        </TouchableOpacity>
    ), [navigation, t]);

    return (
        <FlatList
            data={cats}
            keyExtractor={(c) => String(c.key)}
            numColumns={2}
            contentContainerStyle={{ padding: 10 }}
            renderItem={renderCat}
            {...FLAT_PERF}
        />
    );
}

export function CategoryListingsScreen({ route, navigation }) {
    const { categoryKey, name } = route?.params || {};
    const { t } = useI18n();
    const { dataVersion } = useCountry();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categoryKey) { setItems([]); setLoading(false); return; }
        let alive = true;
        setLoading(true);
        api.get("/listings", { params: { category: categoryKey, limit: 30 } })
            .then(({ data }) => { if (alive) setItems(data?.items || []); })
            .catch(() => { if (alive) setItems([]); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [categoryKey, dataVersion]);

    const renderListing = useCallback(({ item }) => (
        <View style={{ flex: 1, padding: 4 }}>
            <ListingCard listing={item} onPress={() => navigation?.navigate?.("ListingDetail", { id: item.id })} />
        </View>
    ), [navigation]);

    return (
        <View style={s.wrap}>
            <Text style={s.pageTitle}>{name || t("التصنيف")}</Text>
            {loading ? (
                <View style={s.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => String(item?.id)}
                    numColumns={2}
                    contentContainerStyle={{ padding: 8, paddingBottom: 130 }}
                    renderItem={renderListing}
                    ListEmptyComponent={<View style={{ padding: 40, alignItems: "center" }}><Text style={s.muted}>{t("لا توجد إعلانات في هذا التصنيف")}</Text></View>}
                    {...FLAT_PERF}
                />
            )}
        </View>
    );
}

// ---------- NOTIFICATIONS SCREEN ----------
export function NotificationsScreen({ navigation }) {
    const { t } = useI18n();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        api.get("/notifications")
            .then(({ data }) => setItems(data?.items || data || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [user]);

    const open = async (n) => {
        try { await api.post(`/notifications/${n.id}/read`); } catch (_) {}
        if (n.reference_id) {
            if (n.type === "message" || n.type === "chat") navigation.navigate("Chat", { to: n.reference_id });
            else navigation.navigate("ListingDetail", { id: n.reference_id });
        }
    };

    if (!user) return <View style={s.center}><Text style={s.muted}>{t("يجب تسجيل الدخول أولاً")}</Text></View>;
    if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;

    return (
        <FlatList
            data={items}
            keyExtractor={(n) => n.id || String(Math.random())}
            renderItem={({ item }) => (
                <TouchableOpacity onPress={() => open(item)} style={[s.notifItem, !item.read && s.notifUnread]}>
                    <Text style={s.notifTitle}>{item.title}</Text>
                    {item.body ? <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text> : null}
                </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.muted}>{t("لا توجد إشعارات")}</Text>}
        />
    );
}

// ---------- SETTINGS + STATIC PAGES ----------
export function SettingsScreen({ navigation }) {
    const { t, lang, setLang, supported } = useI18n();
    const LANG_LABELS = { ar: "العربية 🇸🇦", en: "English 🇬🇧", hi: "हिन्दी 🇮🇳", ur: "اردو 🇵🇰", bn: "বাংলা 🇧🇩", fr: "Français 🇫🇷" };
    const nextLang = () => {
        const i = supported.indexOf(lang);
        return supported[(i + 1) % supported.length];
    };
    return (
        <ScrollView style={s.wrap}>
            <Text style={s.pageTitle}>{t("الإعدادات")}</Text>
            <View style={s.menu}>
                <TouchableOpacity style={s.menuItem} onPress={() => setLang(nextLang())} testID="mobile-lang-switcher">
                    <Text style={s.menuLabel}>{t("اللغة")}: {LANG_LABELS[lang]}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("SavedSearches")}>
                    <Text style={s.menuLabel}>🔍 {t("الأبحاث المحفوظة")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Following")}>
                    <Text style={s.menuLabel}>👥 {t("متابعاتي")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("NotifSettings")}>
                    <Text style={s.menuLabel}>🔔 {t("إعدادات الإشعارات")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Notifications")}>
                    <Text style={s.menuLabel}>{t("الإشعارات")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", { key: "terms" })}>
                    <Text style={s.menuLabel}>{t("الشروط والأحكام")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", { key: "privacy" })}>
                    <Text style={s.menuLabel}>{t("سياسة الخصوصية")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", { key: "about" })}>
                    <Text style={s.menuLabel}>{t("عن التطبيق")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", { key: "contact" })}>
                    <Text style={s.menuLabel}>{t("تواصل معنا")}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

// Local fallback used only when the network call fails — keeps UX intact offline.
const STATIC_FALLBACK = {
    terms: { title: "الشروط والأحكام", body: "باستخدامك تطبيق الحراج بلس فإنك توافق على شروط الاستخدام." },
    privacy: { title: "سياسة الخصوصية", body: "نلتزم بحماية بياناتك ولا نشاركها مع أطراف ثالثة." },
    about: { title: "عن التطبيق", body: "الحراج بلس — منصة بيع وشراء عربية مدعومة بالذكاء الاصطناعي." },
    contact: { title: "تواصل معنا", body: "📧 support@alhraj.online\n📧 contact@alhraj.online" },
};

export function StaticPageScreen({ route }) {
    const slug = route.params?.key || route.params?.slug || "about";
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        api.get(`/static-pages/${slug}`)
            .then(({ data }) => { if (mounted) setPage({ title: data.title, body: data.body }); })
            .catch(() => { if (mounted) setPage(STATIC_FALLBACK[slug] || STATIC_FALLBACK.about); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [slug]);

    if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;
    return (
        <ScrollView style={s.wrap} contentContainerStyle={{ padding: 18 }}>
            <Text style={s.pageTitle} testID="static-page-title">{page?.title}</Text>
            <Text style={s.staticBody} testID="static-page-body">{page?.body}</Text>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    muted: { color: theme.colors.textMuted, textAlign: "center", padding: 20 },
    pageTitle: { fontSize: 20, fontWeight: "900", color: theme.colors.text, padding: 16, textAlign: "right" },
    catCard: { flex: 1, margin: 6, padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
    catName: { fontSize: 15, fontWeight: "800", color: theme.colors.text, textAlign: "center" },
    catSubs: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4 },
    notifItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
    notifUnread: { backgroundColor: theme.colors.surfaceElevated },
    notifTitle: { fontWeight: "800", color: theme.colors.text, textAlign: "right" },
    notifBody: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3, textAlign: "right" },
    menu: { marginHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: "hidden" },
    menuItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    menuLabel: { color: theme.colors.text, fontWeight: "700", textAlign: "right" },
    staticBody: { color: theme.colors.text, fontSize: 14, lineHeight: 22, textAlign: "right" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    switchLabel: { color: theme.colors.text, fontWeight: "700", fontSize: 14, textAlign: "right" },
});


// ---------- SAVED SEARCHES + FOLLOWING ----------
export function SavedSearchesScreen({ navigation }) {
    const { t } = useI18n();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = () => { setLoading(true); api.get("/search/saved").then(({ data }) => setItems(data || [])).finally(() => setLoading(false)); };
    useEffect(() => { load(); }, []);
    const del = async (id) => { try { await api.delete(`/search/saved/${id}`); load(); } catch (_) {} };
    if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <Text style={{ padding: 16, fontSize: 18, fontWeight: "900", color: theme.colors.text, textAlign: "right" }}>{t("الأبحاث المحفوظة")}</Text>
            <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                    <View style={s.menuItem}>
                        <TouchableOpacity onPress={() => navigation.navigate("Search", { q: item.q })} style={{ flex: 1 }}>
                            <Text style={s.menuLabel}>🔍 {item.q}</Text>
                            {item.category ? <Text style={{ color: theme.colors.textMuted, fontSize: 11, textAlign: "right" }}>{item.category}</Text> : null}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => del(item.id)} testID={`saved-del-${item.id}`}>
                            <Text style={{ color: theme.colors.danger, padding: 6 }}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<View style={{ padding: 40, alignItems: "center" }}><Text style={{ color: theme.colors.textMuted }}>{t("لا توجد أبحاث محفوظة")}</Text></View>}
            />
        </View>
    );
}

export function FollowingScreen({ navigation }) {
    const { t } = useI18n();
    const [data, setData] = useState({ categories: [], sellers: [] });
    const [sellerMap, setSellerMap] = useState({}); // id -> { name, avatar }
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get("/following")
            .then(async ({ data }) => {
                const d = data || { categories: [], sellers: [] };
                setData(d);
                // Fetch seller details in parallel so we can show real names.
                const ids = (d.sellers || []).map((x) => x.seller_id).filter(Boolean);
                if (ids.length) {
                    const results = await Promise.all(
                        ids.map((id) => api.get(`/sellers/${id}`).then((r) => [id, r.data]).catch(() => [id, null])),
                    );
                    const map = {};
                    for (const [id, info] of results) {
                        if (info) map[id] = { name: info.name || info.username || id, avatar: info.avatar };
                    }
                    setSellerMap(map);
                }
            })
            .finally(() => setLoading(false));
    }, []);
    if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;
    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <Text style={{ padding: 16, fontSize: 18, fontWeight: "900", color: theme.colors.text, textAlign: "right" }}>{t("متابعاتي")}</Text>
            <Text style={{ paddingHorizontal: 16, fontSize: 13, fontWeight: "800", color: theme.colors.textMuted, textAlign: "right" }}>{t("التصنيفات")}</Text>
            {data.categories.length === 0
                ? <Text style={{ padding: 16, color: theme.colors.textMuted, textAlign: "right" }}>{t("لا يوجد")}</Text>
                : data.categories.map((c) => (
                    <View key={c.category} style={s.menuItem}>
                        <TouchableOpacity onPress={() => navigation.navigate("CategoryListings", { categoryKey: c.category, name: c.category })} style={{ flex: 1 }}>
                            <Text style={s.menuLabel}>📂 {c.category}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={async () => { await api.delete(`/follow/category/${c.category}`); setData((d) => ({ ...d, categories: d.categories.filter((x) => x.category !== c.category) })); }}>
                            <Text style={{ color: theme.colors.danger, padding: 6 }}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            <Text style={{ paddingHorizontal: 16, paddingTop: 12, fontSize: 13, fontWeight: "800", color: theme.colors.textMuted, textAlign: "right" }}>{t("البائعون")}</Text>
            {data.sellers.length === 0
                ? <Text style={{ padding: 16, color: theme.colors.textMuted, textAlign: "right" }}>{t("لا يوجد")}</Text>
                : data.sellers.map((s2) => {
                    const info = sellerMap[s2.seller_id];
                    const displayName = info?.name || t("بائع");
                    return (
                        <TouchableOpacity key={s2.seller_id} style={s.menuItem} onPress={() => navigation.navigate("SellerProfile", { sellerId: s2.seller_id })} testID={`following-seller-${s2.seller_id}`}>
                            <Text style={s.menuLabel}>👤 {displayName}</Text>
                        </TouchableOpacity>
                    );
                })}
        </ScrollView>
    );
}


// ---------- NOTIFICATION SETTINGS ----------
import { Switch } from "react-native";
export function NotifSettingsScreen() {
    const { t } = useI18n();
    const [prefs, setPrefs] = useState({});
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        api.get("/users/me/notifications/settings").then(({ data }) => { setPrefs(data); setLoaded(true); }).catch(() => setLoaded(true));
    }, []);
    const toggle = async (k) => {
        const next = !prefs[k];
        setPrefs({ ...prefs, [k]: next });
        try { await api.put("/users/me/notifications/settings", { [k]: next }); } catch (_) {}
    };
    const ROWS = [
        ["price_alerts", "🔔 " + t("تنبيهات الأسعار")],
        ["category_alerts", "📂 " + t("تنبيهات التصنيفات")],
        ["messages", "💬 " + t("رسائل المحادثة")],
        ["listing_status", "📝 " + t("حالة الإعلانات")],
        ["watchlist", "👁️ " + t("قائمة المتابعة")],
        ["broadcasts", "📢 " + t("الإعلانات العامة")],
    ];
    if (!loaded) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;
    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <Text style={{ padding: 16, fontSize: 18, fontWeight: "900", color: theme.colors.text, textAlign: "right" }}>{t("إعدادات الإشعارات")}</Text>
            <View style={{ marginHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: "hidden" }}>
                {ROWS.map(([k, label]) => (
                    <View key={k} style={s.switchRow}>
                        <Switch value={!!prefs[k]} onValueChange={() => toggle(k)} testID={`notif-toggle-${k}`} />
                        <Text style={s.switchLabel}>{label}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
