import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TextInput, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Image, Linking } from "react-native";
import api from "../api";
import { theme } from "../theme";
import ListingCard from "../components/ListingCard";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";

// Inline ad card — appears every 6 listings (parity with web HomePage).
function MobileAdCard({ ad }) {
    if (!ad) return null;
    const open = () => { if (ad.link_url) Linking.openURL(ad.link_url).catch(() => {}); };
    return (
        <TouchableOpacity onPress={open} activeOpacity={0.9} style={styles.adCard} testID={`home-ad-${ad.id}`}>
            {ad.image_url ? <Image source={{ uri: ad.image_url }} style={styles.adImage} /> : null}
            <View style={styles.adBadge}><Text style={styles.adBadgeText}>{"إعلان"}</Text></View>
            {ad.title ? <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text> : null}
        </TouchableOpacity>
    );
}

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const { t, lang } = useI18n();
    const [categories, setCategories] = useState([]);
    const [listings, setListings] = useState([]);
    const [trending, setTrending] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [recent, setRecent] = useState([]);
    const [ads, setAds] = useState([]);
    const [error, setError] = useState(false);
    const [q, setQ] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setError(false);
        try {
            const [cats, lists, tr, rec, rv, adsRes] = await Promise.all([
                api.get("/meta/categories", { params: { lang } }),
                api.get("/listings", { params: { country_code: user?.country_code, limit: 30 } }),
                api.get("/listings/trending", { params: { country_code: user?.country_code, limit: 10 } }).catch(() => ({ data: { items: [] } })),
                api.get("/listings/recommended", { params: { country_code: user?.country_code, limit: 10 } }).catch(() => ({ data: { items: [] } })),
                user ? api.get("/listings/recent", { params: { limit: 10 } }).catch(() => ({ data: { items: [] } })) : Promise.resolve({ data: { items: [] } }),
                api.get("/ads", { params: { placement: "home_middle" } }).catch(() => ({ data: [] })),
            ]);
            setCategories(cats.data);
            setListings(lists.data.items || []);
            setTrending(tr.data?.items || []);
            setRecommended(rec.data?.items || []);
            setRecent(rv.data?.items || []);
            setAds(Array.isArray(adsRes.data) ? adsRes.data : (adsRes.data?.items || []));
        } catch (_) {
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, [user, lang]);

    const onSearch = () => {
        if (q.trim()) navigation.navigate("Search", { q: q.trim() });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logo}>
                    <Text style={styles.logoMain}>الحراج</Text>
                    <Text style={styles.logoSub}>بلس</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("ProfileTab")} style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.[0] || "?"}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder={t("ابحث عن إعلان...")}
                    placeholderTextColor={theme.colors.textMuted}
                    onSubmitEditing={onSearch}
                    style={styles.searchInput}
                    testID="mobile-search-input"
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catStrip} contentContainerStyle={{ paddingHorizontal: 12 }}>
                {categories.slice(0, 12).map((c) => (
                    <TouchableOpacity
                        key={c.key}
                        onPress={() => navigation.navigate("CategoryListings", { key: c.key, name: c.name || c.name_ar || c.key })}
                        style={styles.catChip}
                    >
                        <Text style={styles.catText}>{c.name || c.name_ar || c.key}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={(() => {
                    // Inject an ad every 6 listings (parity with web HomePage).
                    if (!ads.length) return listings;
                    const out = [];
                    listings.forEach((it, idx) => {
                        out.push(it);
                        if ((idx + 1) % 6 === 0) {
                            const ad = ads[Math.floor(idx / 6) % ads.length];
                            if (ad) out.push({ __ad: true, ...ad });
                        }
                    });
                    return out;
                })()}
                numColumns={2}
                keyExtractor={(item, idx) => item.__ad ? `ad-${item.id}-${idx}` : item.id}
                renderItem={({ item }) => item.__ad ? <MobileAdCard ad={item} /> : <ListingCard listing={item} />}
                ListHeaderComponent={
                    <>
                        {recent.length > 0 && (
                            <View style={{ marginBottom: 8 }}>
                                <Text style={styles.sectionTitle}>🕒 {t("شُوهدت مؤخراً")}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
                                    {recent.map((it) => (
                                        <View key={it.id} style={{ width: 160, marginEnd: 8 }}>
                                            <ListingCard listing={it} />
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                        {trending.length > 0 && (
                            <View style={{ marginBottom: 8 }}>
                                <Text style={styles.sectionTitle}>🔥 {t("الأكثر مشاهدة")}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
                                    {trending.map((it) => (
                                        <View key={it.id} style={{ width: 160, marginEnd: 8 }}>
                                            <ListingCard listing={it} />
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                        {recommended.length > 0 && (
                            <View style={{ marginBottom: 8 }}>
                                <Text style={styles.sectionTitle}>✨ {t("مقترحات لك")}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
                                    {recommended.map((it) => (
                                        <View key={it.id} style={{ width: 160, marginEnd: 8 }}>
                                            <ListingCard listing={it} />
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </>
                }
                contentContainerStyle={{ padding: 8, paddingBottom: 80 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.skeletonWrap}>
                            {[...Array(6)].map((_, i) => (
                                <View key={i} style={styles.skeletonCard}>
                                    <View style={styles.skeletonShimmer} />
                                </View>
                            ))}
                        </View>
                    ) : error ? (
                        <View style={styles.errorWrap}>
                            <Text style={styles.errorIcon}>⚠️</Text>
                            <Text style={styles.errorText}>{t("تعذر تحميل البيانات")}</Text>
                            <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={styles.retryBtn} testID="mobile-retry-btn">
                                <Text style={styles.retryText}>{t("إعادة المحاولة")}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.empty}><Text style={styles.emptyText}>{t("لا توجد بيانات")}</Text></View>
                    )
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("Post")}
                testID="mobile-post-fab"
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    header: {
        paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    logo: { flexDirection: "row", alignItems: "baseline" },
    logoMain: { fontSize: 22, fontWeight: "900", color: theme.colors.secondary },
    logoSub: { fontSize: 14, fontWeight: "700", color: theme.colors.primary, marginStart: 4 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    avatarText: { color: theme.colors.primaryFg, fontWeight: "900" },
    searchBox: { padding: 12 },
    searchInput: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.full,
        paddingHorizontal: 18, paddingVertical: 12,
        borderWidth: 1, borderColor: theme.colors.border,
        textAlign: "right", color: theme.colors.text, fontSize: 14,
    },
    catStrip: { maxHeight: 60, marginBottom: 4 },
    catChip: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: theme.radius.full,
        borderWidth: 1, borderColor: theme.colors.border,
        marginHorizontal: 4,
    },
    catText: { fontSize: 12, fontWeight: "700", color: theme.colors.text },
    sectionTitle: { fontSize: 14, fontWeight: "900", color: theme.colors.text, paddingHorizontal: 8, paddingVertical: 6, textAlign: "right" },
    skeletonWrap: { flexDirection: "row", flexWrap: "wrap", padding: 4 },
    skeletonCard: { width: "48%", aspectRatio: 0.75, margin: "1%", borderRadius: 12, backgroundColor: theme.colors.surfaceElevated, opacity: 0.6, overflow: "hidden" },
    skeletonShimmer: { width: "60%", height: "100%", backgroundColor: theme.colors.surface, opacity: 0.4 },
    errorWrap: { padding: 32, alignItems: "center" },
    errorIcon: { fontSize: 36, marginBottom: 8 },
    errorText: { color: theme.colors.textMuted, marginBottom: 12, textAlign: "center" },
    retryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: theme.radius.full },
    retryText: { color: theme.colors.primaryFg, fontWeight: "900" },
    adCard: { width: "48%", aspectRatio: 0.85, margin: "1%", borderRadius: 12, overflow: "hidden", backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border, position: "relative" },
    adImage: { width: "100%", height: "100%" },
    adBadge: { position: "absolute", top: 6, end: 6, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    adBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
    adTitle: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 6, color: "#fff", backgroundColor: "rgba(0,0,0,0.45)", fontSize: 11, fontWeight: "800", textAlign: "right" },
    empty: { padding: 40, alignItems: "center" },
    emptyText: { color: theme.colors.textMuted },
    fab: {
        position: "absolute", bottom: 24, alignSelf: "center",
        backgroundColor: theme.colors.primary,
        width: 56, height: 56, borderRadius: 28,
        justifyContent: "center", alignItems: "center",
        shadowColor: "#000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
        elevation: 6,
    },
    fabText: { color: theme.colors.primaryFg, fontSize: 30, fontWeight: "900", lineHeight: 32 },
});
