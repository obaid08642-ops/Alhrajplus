/**
 * Search + Category browsing + Notifications + Static pages — bundle of
 * lightweight screens to bring the mobile app to feature parity with the web.
 */
import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import api from "../api";
import { theme } from "../theme";
import { useI18n } from "../I18nContext";
import { useAuth } from "../AuthContext";
import ListingCard from "../components/ListingCard";

// ---------- SEARCH SCREEN ----------
export function SearchScreen({ navigation }) {
    const { t, lang } = useI18n();
    const [q, setQ] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!q || q.length < 2) { setSuggestions([]); return; }
        const id = setTimeout(async () => {
            try {
                const { data } = await api.get("/search/suggest", { params: { q, limit: 8 } });
                setSuggestions(data?.items || data || []);
            } catch (_) { setSuggestions([]); }
        }, 250);
        return () => clearTimeout(id);
    }, [q]);

    const runSearch = async (term) => {
        const query = term ?? q;
        if (!query) return;
        setLoading(true);
        setSuggestions([]);
        try {
            const { data } = await api.get("/listings", { params: { q: query, limit: 30 } });
            setResults(data?.items || []);
            try { await api.post("/search/log", { query }); } catch (_) {}
        } catch (_) { setResults([]); }
        finally { setLoading(false); }
    };

    return (
        <View style={s.wrap}>
            <View style={s.searchRow}>
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    onSubmitEditing={() => runSearch()}
                    placeholder={t("ابحث عن إعلان...")}
                    placeholderTextColor={theme.colors.textMuted}
                    style={s.input}
                    testID="mobile-search-input"
                    autoFocus
                />
                <TouchableOpacity onPress={() => runSearch()} style={s.searchBtn}>
                    <Text style={s.searchBtnText}>🔍</Text>
                </TouchableOpacity>
            </View>
            {suggestions.length > 0 && (
                <View style={s.suggestionBox}>
                    {suggestions.map((sug, i) => {
                        const text = typeof sug === "string" ? sug : (sug.text || sug.query || "");
                        return (
                            <TouchableOpacity key={i} onPress={() => { setQ(text); runSearch(text); }} style={s.suggestionItem}>
                                <Text style={s.suggestionText}>{text}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
            {loading ? (
                <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={{ padding: 8 }}
                    renderItem={({ item }) => (
                        <View style={{ flex: 1, padding: 4 }}>
                            <ListingCard listing={item} onPress={() => navigation.navigate("ListingDetail", { id: item.id })} />
                        </View>
                    )}
                    ListEmptyComponent={!loading && q ? <Text style={s.muted}>{t("لا توجد نتائج")}</Text> : null}
                />
            )}
        </View>
    );
}

// ---------- CATEGORIES SCREEN ----------
export function CategoriesScreen({ navigation }) {
    const { t, lang } = useI18n();
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/meta/categories", { params: { lang } })
            .then(({ data }) => setCats(data))
            .catch(() => setCats([]))
            .finally(() => setLoading(false));
    }, [lang]);

    if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;

    return (
        <FlatList
            data={cats}
            keyExtractor={(c) => c.key}
            numColumns={2}
            contentContainerStyle={{ padding: 10 }}
            renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("CategoryListings", { categoryKey: item.key, name: item.name || item.name_ar })}
                    style={s.catCard}
                    testID={`mobile-cat-${item.key}`}
                >
                    <Text style={s.catName}>{item.name || item.name_ar}</Text>
                    {item.subcategories?.length > 0 && (
                        <Text style={s.catSubs}>{item.subcategories.length} {t("تصنيف فرعي")}</Text>
                    )}
                </TouchableOpacity>
            )}
        />
    );
}

export function CategoryListingsScreen({ route, navigation }) {
    const { categoryKey, name } = route.params || {};
    const { t } = useI18n();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categoryKey) { setLoading(false); return; }
        api.get("/listings", { params: { category: categoryKey, limit: 30 } })
            .then(({ data }) => setItems(data?.items || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [categoryKey]);

    return (
        <View style={s.wrap}>
            <Text style={s.pageTitle}>{name}</Text>
            {loading ? (
                <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={{ padding: 8 }}
                    renderItem={({ item }) => (
                        <View style={{ flex: 1, padding: 4 }}>
                            <ListingCard listing={item} onPress={() => navigation.navigate("ListingDetail", { id: item.id })} />
                        </View>
                    )}
                    ListEmptyComponent={<Text style={s.muted}>{t("لا توجد بيانات")}</Text>}
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

const STATIC_CONTENT = {
    terms: {
        title_ar: "الشروط والأحكام",
        title_en: "Terms & Conditions",
        body_ar: "باستخدامك تطبيق الحراج بلس فإنك توافق على شروط الاستخدام. الحراج بلس وسيط بين البائع والمشتري. جميع المعاملات تتم بمسؤولية الطرفين.",
        body_en: "By using Haraj Plus you agree to our terms. Haraj Plus is a marketplace platform; all transactions are the responsibility of the parties involved.",
    },
    privacy: {
        title_ar: "سياسة الخصوصية",
        title_en: "Privacy Policy",
        body_ar: "نلتزم بحماية بياناتك. لا نشارك معلوماتك مع أطراف ثالثة دون موافقتك. نستخدم بياناتك فقط لتشغيل التطبيق وتحسين تجربتك.",
        body_en: "We are committed to protecting your data. We never share your information with third parties without consent. Data is used only to operate and improve the app.",
    },
    about: {
        title_ar: "عن التطبيق",
        title_en: "About",
        body_ar: "الحراج بلس — منصة بيع وشراء عربية حديثة لدول الخليج ومصر، مدعومة بالذكاء الاصطناعي.",
        body_en: "Haraj Plus — modern Arabic marketplace for the Gulf and Egypt, powered by AI.",
    },
    contact: {
        title_ar: "تواصل معنا",
        title_en: "Contact Us",
        body_ar: "للتواصل والدعم:\n📧 support@alhraj.online\n📧 contact@alhraj.online",
        body_en: "Get in touch:\n📧 support@alhraj.online\n📧 contact@alhraj.online",
    },
};

export function StaticPageScreen({ route }) {
    const { lang } = useI18n();
    const key = route.params?.key || "about";
    const c = STATIC_CONTENT[key] || STATIC_CONTENT.about;
    return (
        <ScrollView style={s.wrap} contentContainerStyle={{ padding: 18 }}>
            <Text style={s.pageTitle}>{lang === "en" ? c.title_en : c.title_ar}</Text>
            <Text style={s.staticBody}>{lang === "en" ? c.body_en : c.body_ar}</Text>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    muted: { color: theme.colors.textMuted, textAlign: "center", padding: 20 },
    pageTitle: { fontSize: 20, fontWeight: "900", color: theme.colors.text, padding: 16, textAlign: "right" },
    searchRow: { flexDirection: "row", padding: 10, gap: 8, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    input: { flex: 1, backgroundColor: theme.colors.surfaceElevated, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: theme.colors.text, textAlign: "right", borderWidth: 1, borderColor: theme.colors.border },
    searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    searchBtnText: { fontSize: 18 },
    suggestionBox: { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    suggestionItem: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    suggestionText: { color: theme.colors.text, textAlign: "right" },
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
    const [loading, setLoading] = useState(true);
    useEffect(() => { api.get("/following").then(({ data }) => setData(data || { categories: [], sellers: [] })).finally(() => setLoading(false)); }, []);
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
                : data.sellers.map((s2) => (
                    <TouchableOpacity key={s2.seller_id} style={s.menuItem} onPress={() => navigation.navigate("SellerProfile", { sellerId: s2.seller_id })}>
                        <Text style={s.menuLabel}>👤 {s2.seller_id}</Text>
                    </TouchableOpacity>
                ))}
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
