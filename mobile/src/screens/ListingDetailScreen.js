import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import api from "../api";
import { theme } from "../theme";
import { useAuth } from "../AuthContext";
import ListingCard from "../components/ListingCard";

export default function ListingDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [badge, setBadge] = useState(null);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const [l, s, b] = await Promise.all([
                    api.get(`/listings/${id}`),
                    api.get(`/listings/${id}/similar`),
                    api.get(`/ai/price-badge/${id}`).catch(() => ({ data: null })),
                ]);
                setListing(l.data);
                setSimilar(s.data);
                setBadge(b.data);
            } catch {
                Alert.alert("خطأ", "تعذر تحميل الإعلان");
                navigation.goBack();
            }
        })();
    }, [id]);

    if (!listing) return <View style={styles.center}><Text>جاري التحميل...</Text></View>;

    const isOwner = user && user.id === listing.user_id;

    const call = () => listing.seller?.phone_full && Linking.openURL(`tel:${listing.seller.phone_full}`);
    const wa = () => listing.seller?.phone_full && Linking.openURL(`https://wa.me/${listing.seller.phone_full.replace("+", "")}?text=${encodeURIComponent(`مرحباً بخصوص: ${listing.title}`)}`);

    const republish = async () => {
        try {
            const { data } = await api.post(`/listings/${id}/republish`);
            Alert.alert("تم", data.message || "تم التجديد");
        } catch (e) {
            Alert.alert("خطأ", e.response?.data?.detail || "تعذر التجديد");
        }
    };
    const markSold = () => {
        Alert.alert("تأكيد", "هل تم بيع المنتج؟", [
            { text: "إلغاء", style: "cancel" },
            {
                text: "نعم، تم البيع", onPress: async () => {
                    try {
                        await api.post(`/listings/${id}/mark-sold`);
                        Alert.alert("✅", "شكراً لك! نتمنى لك بيعاً موفقاً دائماً");
                        navigation.goBack();
                    } catch (e) { Alert.alert("خطأ", "تعذر التحديث"); }
                }
            },
        ]);
    };

    return (
        <ScrollView style={styles.wrap}>
            <View style={styles.imageWrap}>
                {listing.images?.[activeImg] ? (
                    <Image source={{ uri: listing.images[activeImg] }} style={styles.mainImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.mainImage, styles.ph]}><Text style={styles.phText}>لا توجد صور</Text></View>
                )}
            </View>

            {listing.images?.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs} contentContainerStyle={{ paddingHorizontal: 10 }}>
                    {listing.images.map((img, i) => (
                        <TouchableOpacity key={i} onPress={() => setActiveImg(i)} style={[styles.thumb, activeImg === i && styles.thumbActive]}>
                            <Image source={{ uri: img }} style={styles.thumbImg} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {isOwner && (
                <View style={styles.ownerBar}>
                    <TouchableOpacity onPress={republish} style={[styles.smallBtn, { backgroundColor: theme.colors.success }]}>
                        <Text style={styles.smallBtnText}>تجديد</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={markSold} style={[styles.smallBtn, { backgroundColor: theme.colors.accent }]}>
                        <Text style={[styles.smallBtnText, { color: theme.colors.secondary }]}>تم البيع</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.body}>
                <Text style={styles.title}>{listing.title}</Text>
                <View style={styles.priceRow}>
                    {listing.price ? (
                        <Text style={styles.price}>{Number(listing.price).toLocaleString()} <Text style={styles.currency}>{listing.currency}</Text></Text>
                    ) : (
                        <Text style={styles.priceMuted}>على السوم</Text>
                    )}
                </View>
                {badge?.badge && (
                    <View style={[styles.badge, { borderColor: theme.colors.primary }]}>
                        <Text style={styles.badgeIcon}>{badge.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.badgeLabel}>{badge.label}</Text>
                            <Text style={styles.badgeSub}>{badge.sub}</Text>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>الوصف</Text>
                <Text style={styles.desc}>{listing.description}</Text>

                <Text style={styles.sectionTitle}>معلومات البائع</Text>
                <View style={styles.sellerCard}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{listing.seller?.name?.[0] || "U"}</Text></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sellerName}>{listing.seller?.name}</Text>
                        <Text style={styles.sellerCity}>{listing.city}</Text>
                    </View>
                </View>

                {listing.show_phone !== false && listing.seller?.phone_full && (
                    <View style={{ marginTop: 12 }}>
                        <TouchableOpacity onPress={call} style={[styles.cta, { backgroundColor: theme.colors.success }]} testID="mobile-call-btn">
                            <Text style={styles.ctaText}>📞 اتصال مباشر</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={wa} style={[styles.cta, { backgroundColor: "#25D366" }]} testID="mobile-wa-btn">
                            <Text style={styles.ctaText}>💬 واتساب</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {similar.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>إعلانات مماثلة</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {similar.slice(0, 8).map((s) => (
                                <View key={s.id} style={{ width: 160, marginEnd: 8 }}>
                                    <ListingCard listing={s} />
                                </View>
                            ))}
                        </ScrollView>
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    imageWrap: { aspectRatio: 16 / 10, backgroundColor: theme.colors.surfaceElevated },
    mainImage: { width: "100%", height: "100%" },
    ph: { justifyContent: "center", alignItems: "center" }, phText: { color: theme.colors.textMuted },
    thumbs: { maxHeight: 80, marginTop: 8 },
    thumb: { width: 64, height: 64, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "transparent", marginHorizontal: 4 },
    thumbActive: { borderColor: theme.colors.primary },
    thumbImg: { width: "100%", height: "100%" },
    ownerBar: { flexDirection: "row", padding: 10, gap: 8 },
    smallBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.full },
    smallBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
    body: { padding: 16 },
    title: { fontSize: 20, fontWeight: "900", color: theme.colors.text, textAlign: "right" },
    priceRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
    price: { fontSize: 26, fontWeight: "900", color: theme.colors.primary },
    currency: { fontSize: 14, color: theme.colors.textMuted },
    priceMuted: { fontSize: 16, color: theme.colors.textMuted },
    badge: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: theme.radius.lg, borderWidth: 1, marginTop: 10, backgroundColor: "rgba(79,182,230,0.1)" },
    badgeIcon: { fontSize: 24 },
    badgeLabel: { fontWeight: "900", fontSize: 14, color: theme.colors.text, textAlign: "right" },
    badgeSub: { fontSize: 11, color: theme.colors.textMuted, textAlign: "right" },
    sectionTitle: { marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: "800", color: theme.colors.text, textAlign: "right" },
    desc: { color: theme.colors.text, fontSize: 14, lineHeight: 22, textAlign: "right" },
    sellerCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    avatarText: { color: theme.colors.primaryFg, fontWeight: "900", fontSize: 16 },
    sellerName: { fontWeight: "800", color: theme.colors.text, textAlign: "right" },
    sellerCity: { color: theme.colors.textMuted, fontSize: 12, textAlign: "right" },
    cta: { padding: 14, borderRadius: theme.radius.md, alignItems: "center", marginTop: 8 },
    ctaText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
