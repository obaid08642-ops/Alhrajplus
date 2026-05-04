import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import api from "../api";
import { theme } from "../theme";
import ListingCard from "../components/ListingCard";

export function FavoritesScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { api.get("/favorites").then(({ data }) => setItems(data)).finally(() => setLoading(false)); }, []);
    return (
        <SafeAreaView style={styles.wrap}>
            <Text style={styles.title}>المفضلة</Text>
            <FlatList data={items} numColumns={2} keyExtractor={(x) => x.id} renderItem={({ item }) => <ListingCard listing={item} />}
                contentContainerStyle={{ padding: 8 }}
                ListEmptyComponent={!loading && <View style={styles.empty}><Text style={styles.emptyText}>لا توجد إعلانات في المفضلة</Text></View>} />
        </SafeAreaView>
    );
}

export function MyListingsScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = () => { setLoading(true); api.get("/listings/me/mine").then(({ data }) => setItems(data)).finally(() => setLoading(false)); };
    useEffect(() => { load(); }, []);
    return (
        <SafeAreaView style={styles.wrap}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>إعلاناتي</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Post")} style={styles.addBtn}>
                    <Text style={styles.addText}>+ إضافة</Text>
                </TouchableOpacity>
            </View>
            <FlatList data={items} numColumns={2} keyExtractor={(x) => x.id} renderItem={({ item }) => <ListingCard listing={item} />}
                contentContainerStyle={{ padding: 8 }}
                ListEmptyComponent={!loading && <View style={styles.empty}><Text style={styles.emptyText}>لا توجد إعلانات بعد</Text></View>} />
        </SafeAreaView>
    );
}

export function DealsScreen() {
    const [items, setItems] = useState([]);
    useEffect(() => { api.get("/deals/today", { params: { limit: 30 } }).then(({ data }) => setItems(data)); }, []);
    return (
        <SafeAreaView style={styles.wrap}>
            <View style={styles.hero}>
                <Text style={styles.heroIcon}>🔥</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>صفقات اليوم الذهبية</Text>
                    <Text style={styles.heroSub}>أفضل الأسعار تحت متوسط السوق</Text>
                </View>
            </View>
            <FlatList data={items} numColumns={2} keyExtractor={(x) => x.id} renderItem={({ item }) => (
                <View style={{ flex: 1, padding: 4 }}>
                    <ListingCard listing={item} />
                    <View style={styles.dealBadge}>
                        <Text style={styles.dealBadgeText}>-{item.discount_pct}%</Text>
                    </View>
                </View>
            )}
                contentContainerStyle={{ padding: 4 }}
                ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>لا توجد صفقات بارزة الآن</Text></View>} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    title: { fontSize: 20, fontWeight: "900", color: theme.colors.text, padding: 16, textAlign: "right" },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
    addBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.full },
    addText: { color: theme.colors.primaryFg, fontWeight: "800", fontSize: 12 },
    empty: { padding: 40, alignItems: "center" },
    emptyText: { color: theme.colors.textMuted },
    hero: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "rgba(16,185,129,0.1)", borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    heroIcon: { fontSize: 38 },
    heroTitle: { fontSize: 18, fontWeight: "900", color: theme.colors.text, textAlign: "right" },
    heroSub: { fontSize: 11, color: theme.colors.textMuted, textAlign: "right" },
    dealBadge: { position: "absolute", top: 12, start: 12, backgroundColor: "#DC2626", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    dealBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
});
