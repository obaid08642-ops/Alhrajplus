import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, Image, TouchableOpacity, SafeAreaView } from "react-native";
import api from "../api";
import { theme } from "../theme";
import { useNavigation } from "@react-navigation/native";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// Reels-style vertical feed of listings with video or first image
export default function ReelsScreen() {
    const nav = useNavigation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/listings", { params: { limit: 30, sort: "newest" } });
                // Prefer listings with videos or multiple images
                const feed = (data.items || []).filter((i) => (i.videos?.length || 0) > 0 || (i.images?.length || 0) > 0);
                setItems(feed);
            } catch (_) {}
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return <View style={styles.center}><Text style={{ color: "#fff" }}>جاري التحميل...</Text></View>;
    }

    if (items.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyText}>لا توجد قصص بعد</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.wrap}>
            <FlatList
                data={items}
                keyExtractor={(x) => x.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={SCREEN_H - 120}
                decelerationRate="fast"
                renderItem={({ item }) => (
                    <View style={styles.reel}>
                        {item.images?.[0] && (
                            <Image source={{ uri: item.images[0] }} style={styles.reelImage} resizeMode="cover" />
                        )}
                        <View style={styles.overlay}>
                            <View style={styles.topBar}>
                                <Text style={styles.brandText}>الحراج <Text style={styles.brandAccent}>بلس</Text></Text>
                            </View>
                            <View style={styles.bottomBar}>
                                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                                {item.price && (
                                    <Text style={styles.price}>{Number(item.price).toLocaleString()} <Text style={styles.currency}>{item.currency || "ر.س"}</Text></Text>
                                )}
                                <Text style={styles.meta}>📍 {item.city}</Text>
                                <TouchableOpacity
                                    style={styles.cta}
                                    onPress={() => nav.navigate("ListingDetail", { id: item.id })}
                                    testID={`reel-open-${item.id}`}
                                >
                                    <Text style={styles.ctaText}>عرض الإعلان</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
    emptyIcon: { fontSize: 48, marginBottom: 8 },
    emptyText: { color: "#fff", fontSize: 14 },
    reel: { width: SCREEN_W, height: SCREEN_H - 120, backgroundColor: "#000", position: "relative" },
    reelImage: { width: "100%", height: "100%" },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between", padding: 16 },
    topBar: { flexDirection: "row", alignItems: "center" },
    brandText: { color: "#fff", fontWeight: "900", fontSize: 20, textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 6 },
    brandAccent: { color: theme.colors.primary },
    bottomBar: { gap: 8 },
    title: { color: "#fff", fontWeight: "900", fontSize: 18, textAlign: "right", textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 8 },
    price: { color: theme.colors.primary, fontWeight: "900", fontSize: 22, textAlign: "right", textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 6 },
    currency: { fontSize: 14 },
    meta: { color: "rgba(255,255,255,0.8)", fontSize: 12, textAlign: "right" },
    cta: { backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: theme.radius.full, alignItems: "center", marginTop: 8 },
    ctaText: { color: theme.colors.primaryFg, fontWeight: "900", fontSize: 14 },
});
