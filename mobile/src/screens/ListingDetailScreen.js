import { useEffect, useState, useRef } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, FlatList, Dimensions, Modal } from "react-native";
import api from "../api";
import { theme } from "../theme";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";
import ListingCard from "../components/ListingCard";

export default function ListingDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const { user } = useAuth();
    const { t } = useI18n();
    const [listing, setListing] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [badge, setBadge] = useState(null);
    const [activeImg, setActiveImg] = useState(0);
    const [zoomImg, setZoomImg] = useState(null);
    const carouselRef = useRef(null);
    const SCREEN_W = Dimensions.get("window").width;

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
                Alert.alert(t("خطأ"), t("تعذر تحميل الإعلان"));
                navigation.goBack();
            }
        })();
    }, [id]);

    if (!listing) return <View style={styles.center}><Text>{t("جاري التحميل...")}</Text></View>;

    const isOwner = user && user.id === listing.user_id;

    const call = () => listing.seller?.phone_full && Linking.openURL(`tel:${listing.seller.phone_full}`);
    const wa = () => listing.seller?.phone_full && Linking.openURL(`https://wa.me/${listing.seller.phone_full.replace("+", "")}?text=${encodeURIComponent(`${t("مرحباً بخصوص:")} ${listing.title}`)}`);

    const shareAd = async () => {
        try {
            const url = `https://alhraj.online/listing/${listing.slug || listing.id}`;
            await Share.share({ title: listing.title, message: `${listing.title}\n${url}`, url });
        } catch (_) {}
    };

    const submitReport = async (reason) => {
        try {
            await api.post("/reports", { target_type: "listing", target_id: id, reason });
            Alert.alert("✅", t("تم استلام بلاغك"));
        } catch (_) {
            Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ"));
        }
    };

    const republish = async () => {
        try {
            const { data } = await api.post(`/listings/${id}/republish`);
            Alert.alert(t("تم"), data.message || t("تم التجديد"));
        } catch (e) {
            Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التجديد"));
        }
    };
    const markSold = () => {
        Alert.alert(t("تأكيد"), t("هل تم بيع المنتج؟"), [
            { text: t("إلغاء"), style: "cancel" },
            {
                text: t("نعم، تم البيع"), onPress: async () => {
                    try {
                        await api.post(`/listings/${id}/mark-sold`);
                        Alert.alert("✅", t("شكراً لك! نتمنى لك بيعاً موفقاً دائماً"));
                        navigation.goBack();
                    } catch (e) { Alert.alert(t("خطأ"), t("تعذر التحديث")); }
                }
            },
        ]);
    };

    return (
        <ScrollView style={styles.wrap}>
            <View style={styles.imageWrap}>
                {listing.images?.length ? (
                    <FlatList
                        ref={carouselRef}
                        data={listing.images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, i) => `img-${i}`}
                        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
                        onMomentumScrollEnd={(e) => {
                            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                            setActiveImg(idx);
                        }}
                        renderItem={({ item }) => (
                            <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomImg(item)}>
                                <Image source={{ uri: item }} style={[styles.mainImage, { width: SCREEN_W }]} resizeMode="cover" />
                            </TouchableOpacity>
                        )}
                        testID="mobile-image-carousel"
                    />
                ) : (
                    <View style={[styles.mainImage, styles.ph]}><Text style={styles.phText}>{t("لا توجد صور")}</Text></View>
                )}
                {listing.images?.length > 1 && (
                    <View style={styles.dotsRow} pointerEvents="none">
                        {listing.images.map((_, i) => (
                            <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
                        ))}
                    </View>
                )}
            </View>

            {listing.images?.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs} contentContainerStyle={{ paddingHorizontal: 10 }}>
                    {listing.images.map((img, i) => (
                        <TouchableOpacity key={i} onPress={() => { setActiveImg(i); carouselRef.current?.scrollToIndex?.({ index: i, animated: true }); }} style={[styles.thumb, activeImg === i && styles.thumbActive]}>
                            <Image source={{ uri: img }} style={styles.thumbImg} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {isOwner && (
                <View style={styles.ownerBar}>
                    <TouchableOpacity onPress={() => navigation.navigate("Post", { editId: id })} style={[styles.smallBtn, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.smallBtnText}>{t("تعديل")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={republish} style={[styles.smallBtn, { backgroundColor: theme.colors.success }]}>
                        <Text style={styles.smallBtnText}>{t("تجديد")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={markSold} style={[styles.smallBtn, { backgroundColor: theme.colors.accent }]}>
                        <Text style={[styles.smallBtnText, { color: theme.colors.secondary }]}>{t("تم البيع")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        Alert.alert(t("تأكيد الحذف"), t("هل تريد حذف هذا الإعلان نهائياً؟"), [
                            { text: t("إلغاء"), style: "cancel" },
                            { text: t("حذف"), style: "destructive", onPress: async () => {
                                try { await api.delete(`/listings/${id}`); Alert.alert(t("تم الحذف")); navigation.goBack(); }
                                catch (e) { Alert.alert(t("خطأ"), t("تعذر الحذف")); }
                            }},
                        ]);
                    }} style={[styles.smallBtn, { backgroundColor: theme.colors.danger }]}>
                        <Text style={styles.smallBtnText}>{t("حذف")}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.body}>
                <Text style={styles.title}>{listing.title}</Text>
                <View style={styles.priceRow}>
                    {listing.price ? (
                        <Text style={styles.price}>{Number(listing.price).toLocaleString()} <Text style={styles.currency}>{listing.currency}</Text></Text>
                    ) : (
                        <Text style={styles.priceMuted}>{t("على السوم")}</Text>
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

                <Text style={styles.sectionTitle}>{t("الوصف")}</Text>
                <Text style={styles.desc}>{listing.description}</Text>

                <Text style={styles.sectionTitle}>{t("معلومات البائع")}</Text>
                <TouchableOpacity
                    onPress={() => listing.seller?.id && navigation.navigate("SellerProfile", { sellerId: listing.seller.id })}
                    style={styles.sellerCard}
                    testID="mobile-seller-card"
                >
                    <View style={styles.avatar}><Text style={styles.avatarText}>{listing.seller?.name?.[0] || "U"}</Text></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sellerName}>{listing.seller?.name}</Text>
                        <Text style={styles.sellerCity}>{listing.city}</Text>
                    </View>
                    <Text style={{ color: theme.colors.primary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>

                {listing.show_phone !== false && listing.seller?.phone_full && !listing.is_demo && (
                    <View style={{ marginTop: 12 }}>
                        <TouchableOpacity onPress={call} style={[styles.cta, { backgroundColor: theme.colors.success }]} testID="mobile-call-btn">
                            <Text style={styles.ctaText}>{t("📞 اتصال مباشر")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={wa} style={[styles.cta, { backgroundColor: "#25D366" }]} testID="mobile-wa-btn">
                            <Text style={styles.ctaText}>{t("💬 واتساب")}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {listing.is_demo && (
                    <View style={styles.demoBadge}>
                        <Text style={styles.demoBadgeText}>{listing.demo_label || t("إعلان تجريبي")}</Text>
                    </View>
                )}

                <TouchableOpacity onPress={shareAd} style={styles.shareBtn} testID="mobile-share-btn">
                    <Text style={styles.shareIcon}>↗</Text>
                    <Text style={styles.shareText}>{t("مشاركة الإعلان")}</Text>
                </TouchableOpacity>

                {!isOwner && user && listing.price && (
                    <TouchableOpacity
                        onPress={() => {
                            Alert.prompt
                                ? Alert.prompt(t("تنبيه سعر"), t("نبّهني عند انخفاض السعر إلى:"), async (val) => {
                                    const target = parseFloat(val);
                                    if (!target || target <= 0) return;
                                    try {
                                        await api.post(`/price-alerts/${id}`, { target_price: target });
                                        Alert.alert("✅", t("تم تفعيل التنبيه"));
                                    } catch (_) { Alert.alert(t("خطأ"), t("تعذر التفعيل")); }
                                }, "plain-text", String(Math.round((listing.price || 0) * 0.9)))
                                : Alert.alert(t("تنبيه سعر"), t("متاح على iOS فقط حالياً"));
                        }}
                        style={styles.priceAlertBtn}
                        testID="mobile-price-alert"
                    >
                        <Text style={styles.priceAlertText}>🔔 {t("نبّهني عند انخفاض السعر")}</Text>
                    </TouchableOpacity>
                )}

                {!isOwner && !listing.is_demo && user && (
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(t("الإبلاغ عن الإعلان"), t("اختر سبب الإبلاغ"), [
                                { text: t("احتيال"), onPress: () => submitReport("fraud") },
                                { text: t("محتوى غير لائق"), onPress: () => submitReport("inappropriate") },
                                { text: t("مكرر"), onPress: () => submitReport("duplicate") },
                                { text: t("إلغاء"), style: "cancel" },
                            ]);
                        }}
                        style={styles.reportBtn}
                        testID="mobile-report-btn"
                    >
                        <Text style={styles.reportText}>⚠️ {t("الإبلاغ")}</Text>
                    </TouchableOpacity>
                )}

                {similar.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>{t("أحدث الإعلانات")}</Text>
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

            <Modal visible={!!zoomImg} transparent animationType="fade" onRequestClose={() => setZoomImg(null)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setZoomImg(null)} style={styles.zoomBg}>
                    {zoomImg && <Image source={{ uri: zoomImg }} style={styles.zoomImg} resizeMode="contain" />}
                    <TouchableOpacity onPress={() => setZoomImg(null)} style={styles.zoomClose}>
                        <Text style={styles.zoomCloseText}>×</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    imageWrap: { aspectRatio: 16 / 10, backgroundColor: theme.colors.surfaceElevated, position: "relative" },
    mainImage: { width: "100%", height: "100%" },
    ph: { justifyContent: "center", alignItems: "center" }, phText: { color: theme.colors.textMuted },
    dotsRow: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
    dotActive: { backgroundColor: "#fff", width: 18 },
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
    shareBtn: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border },
    shareIcon: { fontSize: 16, color: theme.colors.primary, fontWeight: "900" },
    shareText: { color: theme.colors.text, fontWeight: "800", fontSize: 14 },
    reportBtn: { marginTop: 8, padding: 10, borderRadius: theme.radius.md, borderWidth: 1, borderColor: "#fca5a5", alignItems: "center", backgroundColor: "#fee2e2" },
    reportText: { color: "#b91c1c", fontWeight: "800", fontSize: 13 },
    priceAlertBtn: { marginTop: 8, padding: 12, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.primary, alignItems: "center", backgroundColor: "rgba(79,182,230,0.1)" },
    priceAlertText: { color: theme.colors.primary, fontWeight: "800", fontSize: 13 },
    zoomBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
    zoomImg: { width: "100%", height: "80%" },
    zoomClose: { position: "absolute", top: 44, right: 18, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
    zoomCloseText: { color: "#fff", fontSize: 24, fontWeight: "900", lineHeight: 28 },
    demoBadge: { marginTop: 12, padding: 10, borderRadius: theme.radius.md, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#F59E0B", alignItems: "center" },
    demoBadgeText: { color: "#92400E", fontWeight: "900", fontSize: 13 },
});
