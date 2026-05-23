import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TextInput, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from "react-native";
import api from "../api";
import { theme } from "../theme";
import ListingCard from "../components/ListingCard";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const { t, lang } = useI18n();
    const [categories, setCategories] = useState([]);
    const [listings, setListings] = useState([]);
    const [trending, setTrending] = useState([]);
    const [q, setQ] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const [cats, lists, tr] = await Promise.all([
                api.get("/meta/categories", { params: { lang } }),
                api.get("/listings", { params: { country_code: user?.country_code, limit: 30 } }),
                api.get("/listings/trending", { params: { country_code: user?.country_code, limit: 10 } }).catch(() => ({ data: { items: [] } })),
            ]);
            setCategories(cats.data);
            setListings(lists.data.items || []);
            setTrending(tr.data?.items || []);
        } catch (_) {} finally {
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
                data={listings}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ListingCard listing={item} />}
                ListHeaderComponent={
                    trending.length > 0 ? (
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
                    ) : null
                }
                contentContainerStyle={{ padding: 8, paddingBottom: 80 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.skeletonWrap}>
                            {[...Array(6)].map((_, i) => (
                                <View key={i} style={styles.skeletonCard} />
                            ))}
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
    skeletonCard: { width: "48%", aspectRatio: 0.75, margin: "1%", borderRadius: 12, backgroundColor: theme.colors.surfaceElevated, opacity: 0.5 },
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
