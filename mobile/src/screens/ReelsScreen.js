import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator, Share, Alert, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VideoView, useVideoPlayer } from "expo-video";
import { Volume2, VolumeX, Play, Film, Heart, Share2, MapPin } from "lucide-react-native";
import api from "../api";
import { theme } from "../theme";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useI18n } from "../I18nContext";
import { useAuth } from "../AuthContext";
const {
  height: SCREEN_H,
  width: SCREEN_W
} = Dimensions.get("window");
// Full-screen reels — bottom nav is hidden while this screen is focused, so
// each reel takes the whole device height (TikTok / YT-Shorts behaviour).
const REEL_H = SCREEN_H;

// Reels-style vertical feed of listings with REAL video playback (expo-video).
// Each reel auto-plays when visible, pauses when scrolled away.
export default function ReelsScreen() {
  const {
    t
  } = useI18n();
  const nav = useNavigation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  // Hide the floating tab bar while reels are visible — restored on blur.
  // Targets the PARENT tab navigator (this screen is inside the bottom tabs).
  const _hideTabBarOnFocus = useCallback(() => {
    const parent = nav.getParent?.();
    parent?.setOptions?.({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions?.({ tabBarStyle: undefined });
    };
  }, [nav]);
  useFocusEffect(_hideTabBarOnFocus);
  useEffect(() => {
    (async () => {
      try {
        // STRICT country isolation: only show stories/videos posted in the
        // currently-selected country. AsyncStorage is the source of truth
        // (matches CountryContext key).
        const cc = (await AsyncStorage.getItem("hp_country").catch(() => null)) || "";
        const baseParams = {
          limit: 50,
          sort: "newest"
        };
        if (cc) baseParams.country_code = cc;
        // Prefer real stories (subcategory=story).
        let storyItems = [];
        try {
          const {
            data
          } = await api.get("/listings", {
            params: {
              ...baseParams,
              subcategory: "story"
            }
          });
          storyItems = (data.items || []).filter(i => (i.videos?.length || 0) > 0);
        } catch (_) {}
        let withVideos = [];
        try {
          const {
            data
          } = await api.get("/listings", {
            params: baseParams
          });
          withVideos = (data.items || []).filter(i => (i.videos?.length || 0) > 0 && i.subcategory !== "story");
        } catch (_) {}
        let imageOnly = [];
        try {
          const {
            data
          } = await api.get("/listings", {
            params: {
              ...baseParams,
              limit: 20
            }
          });
          imageOnly = (data.items || []).filter(i => (i.videos?.length || 0) === 0 && (i.images?.length || 0) >= 1);
        } catch (_) {}
        const seen = new Set();
        const merged = [];
        for (const arr of [storyItems, withVideos, imageOnly]) {
          for (const it of arr) {
            if (!seen.has(it.id)) {
              seen.add(it.id);
              merged.push(it);
            }
          }
        }
        setItems(merged);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);
  const onViewable = useCallback(({
    viewableItems
  }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);
  const viewConfig = useRef({
    itemVisiblePercentThreshold: 70
  }).current;
  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  }
  if (items.length === 0) {
    return <View style={styles.center}>
                <Film size={48} color="rgba(255,255,255,0.6)" />
                <Text style={styles.emptyText}>{t("لا توجد قصص بعد")}</Text>
                <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.postCta} testID="reels-empty-post-btn">
                    <Text style={styles.postCtaText}>{t("انشر أول ستوري")}</Text>
                </TouchableOpacity>
            </View>;
  }
  return <View style={styles.wrap}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <FlatList
              data={items}
              keyExtractor={x => x.id}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToInterval={REEL_H}
              snapToAlignment="start"
              decelerationRate="fast"
              disableIntervalMomentum
              bounces={false}
              onViewableItemsChanged={onViewable}
              viewabilityConfig={viewConfig}
              getItemLayout={(_, index) => ({
                length: REEL_H,
                offset: REEL_H * index,
                index
              })}
              renderItem={({
                item,
                index
              }) => <ReelItem item={item} active={index === activeIndex} muted={muted} onToggleMute={() => setMuted(m => !m)} onOpen={() => nav.navigate("ListingDetail", {
                id: item.id
              })} user={user} />}
            />
        </View>;
}
function ReelItem({
  item,
  active,
  muted,
  onToggleMute,
  onOpen,
  user
}) {
  const { t } = useI18n();
  const nav = useNavigation();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes || 0);
  const videoUrl = item.videos?.[0];
  const player = useVideoPlayer(videoUrl || null, p => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    if (!player || !videoUrl) return;
    try {
      player.muted = muted;
    } catch (_) {}
    if (active) {
      try {
        player.play();
      } catch (_) {}
    } else {
      try {
        player.pause();
      } catch (_) {}
    }
  }, [active, muted, player, videoUrl]);

  const onLike = async () => {
    if (!user) { nav.navigate("Login"); return; }
    const next = !liked;
    setLiked(next);
    setLikes(n => n + (next ? 1 : -1));
    try {
      if (next) await api.post(`/favorites/${item.id}`);
      else await api.delete(`/favorites/${item.id}`);
    } catch (_) {
      // Roll back on failure.
      setLiked(!next);
      setLikes(n => n - (next ? 1 : -1));
    }
  };
  const onShare = async () => {
    try {
      const url = `https://alhraj.online/listing/${item.id}`;
      await Share.share({ message: `${item.title}\n${url}`, url });
    } catch (_) {}
  };

  return <TouchableOpacity activeOpacity={0.95} onPress={onOpen} style={styles.reel} testID={`reel-${item.id}`}>
            {videoUrl ? <VideoView player={player} style={styles.media} contentFit="cover" nativeControls={false} allowsFullscreen={false} allowsPictureInPicture={false} /> : item.images?.[0] ? <Image source={{
      uri: item.images[0]
    }} style={styles.media} resizeMode="cover" /> : <View style={[styles.media, {
      backgroundColor: "#111"
    }]} />}

            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.topBar}>
                    <Text style={styles.brandText}>الحراج <Text style={styles.brandAccent}>{t("بلس")}</Text></Text>
                    {videoUrl && <TouchableOpacity onPress={onToggleMute} hitSlop={12} style={styles.muteBtn} testID={`reel-mute-${item.id}`}>
                            {muted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
                        </TouchableOpacity>}
                </View>

                {videoUrl && !active && <View style={styles.playOverlay} pointerEvents="none">
                        <Play size={48} color="#fff" fill="#fff" />
                    </View>}

                {/* Side action rail — like / share / price-tag / location (mirrors web). */}
                <View style={styles.sideRail} pointerEvents="box-none">
                    <TouchableOpacity onPress={onLike} style={styles.sideBtn} testID={`reel-like-${item.id}`}>
                        <Heart size={26} color={liked ? "#EF4444" : "#fff"} fill={liked ? "#EF4444" : "transparent"} strokeWidth={2.4} />
                        <Text style={styles.sideTxt}>{likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onShare} style={styles.sideBtn} testID={`reel-share-${item.id}`}>
                        <Share2 size={24} color="#fff" strokeWidth={2.4} />
                        <Text style={styles.sideTxt}>{t("شارك")}</Text>
                    </TouchableOpacity>
                    {item.price ? <View style={[styles.sideBtn, styles.pricePill]}>
                        <Text style={styles.priceChip}>{Number(item.price).toLocaleString()}</Text>
                        <Text style={styles.sideTxt}>{item.currency || t("ر.س")}</Text>
                    </View> : null}
                    {item.city ? <View style={styles.sideBtn}>
                        <MapPin size={22} color="#fff" strokeWidth={2.4} />
                        <Text style={styles.sideTxtSmall} numberOfLines={1}>{item.city}</Text>
                    </View> : null}
                </View>

                <View style={styles.bottomBar}>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    {item.price ? <Text style={styles.price}>{Number(item.price).toLocaleString()} <Text style={styles.currency}>{item.currency || t("ر.س")}</Text></Text> : null}
                    {item.city ? <Text style={styles.meta}>📍 {item.city}</Text> : null}
                    <TouchableOpacity style={styles.cta} onPress={onOpen} testID={`reel-open-${item.id}`}>
                        <Text style={styles.ctaText}>{t("عرض الإعلان")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>;
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#000"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    gap: 14
  },
  emptyIcon: {
    fontSize: 56
  },
  emptyText: {
    color: "#fff",
    fontSize: 14
  },
  postCta: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999
  },
  postCtaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13
  },
  reel: {
    width: SCREEN_W,
    height: REEL_H,
    backgroundColor: "#000",
    position: "relative"
  },
  media: {
    width: "100%",
    height: "100%"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 16
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brandText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 6
  },
  brandAccent: {
    color: theme.colors.primary
  },
  muteBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center"
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  bottomBar: {
    gap: 8,
    paddingBottom: 24
  },
  sideRail: {
    position: "absolute",
    right: 10,
    bottom: 180,
    alignItems: "center",
    gap: 18
  },
  sideBtn: {
    alignItems: "center",
    gap: 4
  },
  sideTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowRadius: 4
  },
  sideTxtSmall: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    maxWidth: 64,
    textAlign: "center"
  },
  pricePill: {
    backgroundColor: "rgba(31,123,191,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12
  },
  priceChip: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12
  },
  title: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    textAlign: "right",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowRadius: 8
  },
  price: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 22,
    textAlign: "right",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowRadius: 6
  },
  currency: {
    fontSize: 14
  },
  meta: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "right"
  },
  cta: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8
  },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14
  }
});
