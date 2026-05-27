import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VideoView, useVideoPlayer } from "expo-video";
import { Volume2, VolumeX, Play } from "lucide-react-native";
import api from "../api";
import { theme } from "../theme";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../I18nContext";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const REEL_H = SCREEN_H - 120;

// Reels-style vertical feed of listings with REAL video playback (expo-video).
// Each reel auto-plays when visible, pauses when scrolled away.
export default function ReelsScreen() {
    const nav = useNavigation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                // STRICT country isolation: only show stories/videos posted in the
                // currently-selected country. AsyncStorage is the source of truth
                // (matches CountryContext key).
                const cc = (await AsyncStorage.getItem("hp_country").catch(() => null)) || "";
                const baseParams = { limit: 50, sort: "newest" };
                if (cc) baseParams.country_code = cc;
                // Prefer real stories (subcategory=story).
                let storyItems = [];
                try {
                    const { data } = await api.get("/listings", { params: { ...baseParams, subcategory: "story" } });
                    storyItems = (data.items || []).filter((i) => (i.videos?.length || 0) > 0);
                } catch (_) {}
                let withVideos = [];
                try {
                    const { data } = await api.get("/listings", { params: baseParams });
                    withVideos = (data.items || []).filter((i) => (i.videos?.length || 0) > 0 && (i.subcategory !== "story"));
                } catch (_) {}
                let imageOnly = [];
                try {
                    const { data } = await api.get("/listings", { params: { ...baseParams, limit: 20 } });
                    imageOnly = (data.items || []).filter((i) => (i.videos?.length || 0) === 0 && (i.images?.length || 0) >= 1);
                } catch (_) {}
                const seen = new Set();
                const merged = [];
                for (const arr of [storyItems, withVideos, imageOnly]) {
                    for (const it of arr) {
                        if (!seen.has(it.id)) { seen.add(it.id); merged.push(it); }
                    }
                }
                setItems(merged);
            } catch (_) {}
            setLoading(false);
        })();
    }, []);

    const onViewable = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    }, []);

    const viewConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
    }

    if (items.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyText}>{t("لا توجد قصص بعد")}</Text>
                <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.postCta} testID="reels-empty-post-btn">
                    <Text style={styles.postCtaText}>{t("انشر أول ستوري")}</Text>
                </TouchableOpacity>
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
                snapToInterval={REEL_H}
                decelerationRate="fast"
                onViewableItemsChanged={onViewable}
                viewabilityConfig={viewConfig}
                getItemLayout={(_, index) => ({ length: REEL_H, offset: REEL_H * index, index })}
                renderItem={({ item, index }) => (
                    <ReelItem
                        item={item}
                        active={index === activeIndex}
                        muted={muted}
                        onToggleMute={() => setMuted((m) => !m)}
                        onOpen={() => nav.navigate("ListingDetail", { id: item.id })}
                    />
                )}
            />
        </SafeAreaView>
    );
}

function ReelItem({ item, active, muted, onToggleMute, onOpen }) {
    const videoUrl = item.videos?.[0];
    const player = useVideoPlayer(videoUrl || null, (p) => {
        if (!p) return;
        p.loop = true;
        p.muted = true;
    });

    useEffect(() => {
        if (!player || !videoUrl) return;
        try { player.muted = muted; } catch (_) {}
        if (active) {
            try { player.play(); } catch (_) {}
        } else {
            try { player.pause(); } catch (_) {}
        }
    }, [active, muted, player, videoUrl]);

    return (
        <TouchableOpacity activeOpacity={0.95} onPress={onOpen} style={styles.reel} testID={`reel-${item.id}`}>
            {videoUrl ? (
                <VideoView
                    player={player}
                    style={styles.media}
                    contentFit="cover"
                    nativeControls={false}
                    allowsFullscreen={false}
                    allowsPictureInPicture={false}
                />
            ) : item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.media} resizeMode="cover" />
            ) : (
                <View style={[styles.media, { backgroundColor: "#111" }]} />
            )}

            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.topBar}>
                    <Text style={styles.brandText}>الحراج <Text style={styles.brandAccent}>{t("بلس")}</Text></Text>
                    {videoUrl && (
                        <TouchableOpacity onPress={onToggleMute} hitSlop={12} style={styles.muteBtn} testID={`reel-mute-${item.id}`}>
                            {muted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
                        </TouchableOpacity>
                    )}
                </View>

                {videoUrl && !active && (
                    <View style={styles.playOverlay} pointerEvents="none">
                        <Play size={48} color="#fff" fill="#fff" />
                    </View>
                )}

                <View style={styles.bottomBar}>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    {item.price ? (
                        <Text style={styles.price}>{Number(item.price).toLocaleString()} <Text style={styles.currency}>{item.currency || t("ر.س")}</Text></Text>
                    ) : null}
                    {item.city ? <Text style={styles.meta}>📍 {item.city}</Text> : null}
                    <TouchableOpacity style={styles.cta} onPress={onOpen} testID={`reel-open-${item.id}`}>
                        <Text style={styles.ctaText}>{t("عرض الإعلان")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000", gap: 14 },
    emptyIcon: { fontSize: 56 },
    emptyText: { color: "#fff", fontSize: 14 },
    postCta: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
    postCtaText: { color: "#fff", fontWeight: "900", fontSize: 13 },

    reel: { width: SCREEN_W, height: REEL_H, backgroundColor: "#000", position: "relative" },
    media: { width: "100%", height: "100%" },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between", padding: 16 },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    brandText: { color: "#fff", fontWeight: "900", fontSize: 20, textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 6 },
    brandAccent: { color: theme.colors.primary },
    muteBtn: { width: 36, height: 36, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },

    playOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },

    bottomBar: { gap: 8 },
    title: { color: "#fff", fontWeight: "900", fontSize: 18, textAlign: "right", textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 8 },
    price: { color: theme.colors.primary, fontWeight: "900", fontSize: 22, textAlign: "right", textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 6 },
    currency: { fontSize: 14 },
    meta: { color: "rgba(255,255,255,0.85)", fontSize: 12, textAlign: "right" },
    cta: { backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 999, alignItems: "center", marginTop: 8 },
    ctaText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
