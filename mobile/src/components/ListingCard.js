// Reusable ListingCard for mobile — mirrors web /app/frontend/src/components/listings/ListingCard.js
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Heart, MapPin, BadgeCheck, Flame } from "lucide-react-native";
import { colors, radius, shadow } from "../theme";
import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";
export default function ListingCard({
  listing,
  wide = false
}) {
  const { t } = useI18n();
  
  const nav = useNavigation();
  const {
    user
  } = useAuth();
  const [fav, setFav] = useState(false);
  const isOwner = user && user.id === listing.user_id;
  const status = listing.status;
  const boosted = !!listing.is_boosted;
  useEffect(() => {
    let mounted = true;
    if (user && listing?.id) {
      api.get(`/favorites/${listing.id}/check`).then(({
        data
      }) => {
        if (mounted) setFav(!!data?.favorited);
      }).catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [user, listing?.id]);
  const toggleFav = async e => {
    e?.stopPropagation?.();
    if (!user) {
      nav.navigate("Login");
      return;
    }
    try {
      if (fav) {
        await api.delete(`/favorites/${listing.id}`);
        setFav(false);
      } else {
        await api.post(`/favorites/${listing.id}`);
        setFav(true);
      }
    } catch (_) {}
  };
  const price = listing.price ? Number(listing.price).toLocaleString() : null;
  const img = listing.images?.[0];
  if (wide) {
    return <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate("ListingDetail", {
      id: listing.id
    })} style={[styles.wide, shadow.card]}>
                <View style={styles.wideImgBox}>
                    {img ? <Image source={{
          uri: img
        }} style={styles.wideImg} /> : <View style={styles.imgPlaceholder} />}
                </View>
                <View style={styles.wideBody}>
                    <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
                    {listing.description ? <Text style={styles.desc} numberOfLines={2}>{listing.description}</Text> : null}
                    <View style={styles.wideFoot}>
                        {price ? <Text style={styles.price}>{price} <Text style={styles.currency}>{listing.currency || t("ر.س")}</Text></Text> : <Text style={styles.muted}>{t("على السوم")}</Text>}
                        <View style={styles.cityRow}>
                            <MapPin size={11} color={colors.textMuted} />
                            <Text style={styles.muted} numberOfLines={1}>{listing.city || ""}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>;
  }
  return <TouchableOpacity activeOpacity={0.85} onPress={() => nav.navigate("ListingDetail", {
    id: listing.id
  })} style={[styles.card, shadow.card]}>
            <View style={styles.imgBox}>
                {img ? <Image source={{
        uri: img
      }} style={styles.img} /> : <View style={styles.imgPlaceholder} />}
                <TouchableOpacity onPress={toggleFav} style={styles.favBtn} hitSlop={8} testID={`fav-btn-${listing.id}`}>
                    <Heart size={16} color={fav ? "#EF4444" : "#fff"} fill={fav ? "#EF4444" : "transparent"} strokeWidth={2.5} />
                </TouchableOpacity>
                {boosted && <View style={styles.boostBadge}>
                        <Flame size={10} color="#fff" />
                        <Text style={styles.boostText}>{t("مميز")}</Text>
                    </View>}
                {isOwner && status === "paused" && <View style={[styles.statusBadge, {
        backgroundColor: "#F59E0B"
      }]} testID={`badge-paused-${listing.id}`}>
                        <Text style={styles.statusText}>{t("⏸ موقوف")}</Text>
                    </View>}
                {status === "sold" && <View style={[styles.statusBadge, {
        backgroundColor: "#10B981"
      }]} testID={`badge-sold-${listing.id}`}>
                        <Text style={styles.statusText}>{t("✓ تم البيع")}</Text>
                    </View>}
            </View>
            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
                <View style={styles.footer}>
                    {price ? <Text style={styles.price}>{price} <Text style={styles.currency}>{listing.currency || t("ر.س")}</Text></Text> : <Text style={styles.muted}>{t("على السوم")}</Text>}
                </View>
                <View style={styles.cityRow}>
                    <MapPin size={10} color={colors.textMuted} />
                    <Text style={styles.muted} numberOfLines={1}>{listing.city || ""}</Text>
                    {listing.verified && <BadgeCheck size={12} color={colors.primary} style={{
          marginStart: 4
        }} />}
                </View>
            </View>
        </TouchableOpacity>;
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    overflow: "hidden",
    flex: 1,
    margin: 4,
    minWidth: 0,
    ...shadow.card
  },
  imgBox: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceElevated,
    position: "relative",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: "hidden"
  },
  img: {
    width: "100%",
    height: "100%"
  },
  imgPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceElevated
  },
  favBtn: {
    position: "absolute",
    top: 8,
    end: 8,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center"
  },
  boostBadge: {
    position: "absolute",
    top: 8,
    start: 8,
    backgroundColor: colors.accent,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  boostText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.secondary
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    end: 44,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff"
  },
  body: {
    padding: 10
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18
  },
  desc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2
  },
  footer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 2
  },
  price: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary
  },
  currency: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary
  },
  muted: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "500"
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4
  },
  wide: {
    flexDirection: "row",
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: 10,
    ...shadow.card
  },
  wideImgBox: {
    width: 120,
    height: 120,
    backgroundColor: colors.surfaceElevated
  },
  wideImg: {
    width: "100%",
    height: "100%"
  },
  wideBody: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between"
  },
  wideFoot: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 6
  }
});