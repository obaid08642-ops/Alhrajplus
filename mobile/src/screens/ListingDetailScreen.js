import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, FlatList, Dimensions, Modal, TextInput } from "react-native";
import { Phone, MessageCircle, Bell, BellOff, Share2, ChevronRight, Gavel, Heart, CheckCircle2, Eye, MapPin } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../api";
import { theme } from "../theme";
import { useAuth } from "../AuthContext";
import { useI18n } from "../I18nContext";
import { useThemeMode } from "../ThemeContext";
import ListingCard from "../components/ListingCard";
import Model3DViewerMobile from "../components/Model3DViewerMobile";
import { trackEvent } from "../analytics";
export default function ListingDetailScreen({
  route,
  navigation
}) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const {
    id
  } = route.params;
  const {
    user
  } = useAuth();
  const insets = useSafeAreaInsets();

  // Tell the parent tab navigator to hide the floating tab bar so it never
  // overlaps the sticky bottom CTA on this screen. Restored on blur.
  const _hideTabBarOnFocus = useCallback(() => {
    const parent = navigation.getParent?.();
    const grandparent = parent?.getParent?.();
    parent?.setOptions?.({ tabBarStyle: { display: "none" } });
    grandparent?.setOptions?.({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions?.({ tabBarStyle: undefined });
      grandparent?.setOptions?.({ tabBarStyle: undefined });
    };
  }, [navigation]);
  useFocusEffect(_hideTabBarOnFocus);

  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [badge, setBadge] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomImg, setZoomImg] = useState(null);
  const [show3D, setShow3D] = useState(false);
  const [following, setFollowing] = useState(false);
  const [watching, setWatching] = useState(false);
  const [priceAlertOpen, setPriceAlertOpen] = useState(false);
  const [priceAlertVal, setPriceAlertVal] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const carouselRef = useRef(null);
  const SCREEN_W = Dimensions.get("window").width;
  useEffect(() => {
    (async () => {
      try {
        const [l, s, b] = await Promise.all([api.get(`/listings/${id}`), api.get(`/listings/${id}/similar`), api.get(`/ai/price-badge/${id}`).catch(() => ({
          data: null
        }))]);
        setListing(l.data);
        trackEvent("listing_view", { listing_id: l.data.id, category: l.data.category, country_code: l.data.country_code });
        setSimilar(s.data);
        setBadge(b.data);
        setLikeCount(Number(l.data.like_count || 0));
        api.get(`/listings/${id}/comments`).then(({ data }) => setComments(data?.items || [])).catch(() => {});
        if (user) api.get(`/listings/${id}/like/check`).then(({ data }) => setLiked(!!data?.liked)).catch(() => {});
        // Fire-and-forget: log to "recently viewed" so /listings/recent works.
        api.post(`/listings/${id}/view`).catch(() => {});
      } catch {
        Alert.alert(t("خطأ"), t("تعذر تحميل الإعلان"));
        navigation.goBack();
      }
    })();
  }, [id]);

  // Load follow + watch status once we know who the seller is.
  useEffect(() => {
    if (!user || !listing?.seller?.id) return;
    const sellerId = listing.seller.id;
    api.get(`/sellers/${sellerId}/follow-status`).then(({
      data
    }) => setFollowing(!!data?.following)).catch(() => {});
    api.get("/watches").then(({
      data
    }) => {
      setWatching((data || []).some(w => w.listing_id === id));
    }).catch(() => {});
  }, [user, listing?.seller?.id, id]);
  if (!listing) return <View style={styles.center}><Text>{t("جاري التحميل...")}</Text></View>;
  const isOwner = user && user.id === listing.user_id;

  // Phase 2 safety: ensure phone_full is a dial-coded international number
  // even for legacy DB rows that still have e.g. "SA501234567" instead of
  // "+966501234567". This guarantees tel: + wa.me links never include "SA".
  const _DIAL = {
    SA: "+966", AE: "+971", KW: "+965", QA: "+974", BH: "+973", OM: "+968",
    EG: "+20", JO: "+962", LB: "+961", IQ: "+964", SY: "+963", YE: "+967",
    PS: "+970", MA: "+212", DZ: "+213", TN: "+216", LY: "+218", SD: "+249",
    TR: "+90", PK: "+92", IN: "+91", BD: "+880", ID: "+62", MY: "+60",
    US: "+1", GB: "+44", FR: "+33",
  };
  const _normalizedPhone = (() => {
    const raw = (listing.seller?.phone_full || "").trim();
    if (!raw) return "";
    if (raw.startsWith("+")) return raw;
    // Strip leading ISO code if present (e.g. "SA501234567" → "501234567")
    const m = raw.match(/^([A-Z]{2})(.+)$/);
    if (m && _DIAL[m[1]]) return `${_DIAL[m[1]]}${m[2].replace(/^0+/, "")}`;
    // Bare digits → assume seller's country.
    const cc = (listing.seller?.country_code || listing.country_code || "SA").toUpperCase();
    return `${_DIAL[cc] || "+966"}${raw.replace(/^0+/, "")}`;
  })();
  const call = () => _normalizedPhone && Linking.openURL(`tel:${_normalizedPhone}`);
  const wa = () => _normalizedPhone && Linking.openURL(`https://wa.me/${_normalizedPhone.replace("+", "")}?text=${encodeURIComponent(`${t("مرحباً بخصوص:")} ${listing.title}`)}`);
  const shareAd = async () => {
    try {
      const url = `https://alhraj.online/listing/${listing.slug || listing.id}`;
      await Share.share({
        title: listing.title,
        message: `${listing.title}\n${url}`,
        url
      });
    } catch (_) {}
  };
  const toggleLike = async () => {
    if (!user) { navigation.navigate("Login"); return; }
    const previous = liked;
    setLiked(!previous);
    setLikeCount(count => Math.max(0, count + (previous ? -1 : 1)));
    try {
      const { data } = await api.post(`/listings/${id}/like`);
      setLiked(!!data?.liked);
      setLikeCount(Number(data?.like_count || 0));
    } catch (_) {
      setLiked(previous);
      setLikeCount(count => Math.max(0, count + (previous ? 1 : -1)));
    }
  };
  const submitComment = async () => {
    if (!user) { navigation.navigate("Login"); return; }
    const text = commentText.trim();
    if (!text) return;
    setCommentBusy(true);
    try {
      const { data } = await api.post(`/listings/${id}/comments`, { text });
      setComments(items => [data, ...items]);
      setCommentText("");
    } catch (e) { Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر نشر التعليق")); }
    finally { setCommentBusy(false); }
  };
  const submitReport = async reason => {
    try {
      await api.post("/reports", {
        target_type: "listing",
        target_id: id,
        reason
      });
      Alert.alert("✅", t("تم استلام بلاغك"));
    } catch (_) {
      Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ"));
    }
  };
  const republish = async () => {
    try {
      const {
        data
      } = await api.post(`/listings/${id}/republish`);
      Alert.alert(t("تم"), data.message || t("تم التجديد"));
    } catch (e) {
      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التجديد"));
    }
  };
  const markSold = () => {
    Alert.alert(t("تأكيد"), t("هل تم بيع المنتج؟"), [{
      text: t("إلغاء"),
      style: "cancel"
    }, {
      text: t("نعم، تم البيع"),
      onPress: async () => {
        try {
          await api.post(`/listings/${id}/mark-sold`);
          Alert.alert("✅", t("شكراً لك! نتمنى لك بيعاً موفقاً دائماً"));
          navigation.goBack();
        } catch (e) {
          Alert.alert(t("خطأ"), t("تعذر التحديث"));
        }
      }
    }]);
  };
  const togglePauseResume = async () => {
    try {
      const url = listing.status === "paused" ? `/listings/${id}/resume` : `/listings/${id}/pause`;
      await api.post(url);
      setListing(l => ({
        ...l,
        status: l.status === "paused" ? "active" : "paused"
      }));
    } catch (e) {
      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
    }
  };
  const toggleFollowSeller = async () => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    const sellerId = listing?.seller?.id;
    if (!sellerId) return;
    try {
      const {
        data
      } = await api.post(`/sellers/${sellerId}/follow`);
      setFollowing(!!data?.following);
    } catch (e) {
      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
    }
  };
  const submitWatchPrice = async () => {
    const target = parseFloat(priceAlertVal);
    if (!target || target <= 0) {
      Alert.alert(t("خطأ"), t("أدخل سعراً صحيحاً"));
      return;
    }
    try {
      await api.post("/watches", {
        listing_id: id,
        target_price: target
      });
      setWatching(true);
      setPriceAlertOpen(false);
      setPriceAlertVal("");
      Alert.alert("✅", t("تم تفعيل التنبيه"));
    } catch (e) {
      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التفعيل"));
    }
  };
  const removeWatch = async () => {
    try {
      await api.delete(`/watches/${id}`);
      setWatching(false);
      Alert.alert("✅", t("تم إلغاء التنبيه"));
    } catch (_) {}
  };
  const openInMaps = () => {
    if (!listing.lat || !listing.lng) {
      Alert.alert(t("غير متاح"), t("لا توجد إحداثيات لهذا الإعلان"));
      return;
    }
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`);
  };
  const isAuction = listing && (listing.category === "auctions" || !!listing.auction_meta || !!listing.is_auction);
  return <View style={[styles.wrap, { backgroundColor: palette.bg }]}>
        {/* Floating back button — top-end (RTL: right). High-contrast pill so
            it works against any image background. */}
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Main")}
          style={[styles.backBtn, { top: insets.top + 10 }]}
          testID="listing-back-btn"
          hitSlop={8}
          activeOpacity={0.85}
        >
          <ChevronRight size={22} color="#fff" strokeWidth={2.6} />
        </TouchableOpacity>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: isAuction ? 120 : 90 }}>
            <View style={styles.imageWrap}>
                {listing.images?.length ? <FlatList ref={carouselRef} data={listing.images} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(_, i) => `img-${i}`} getItemLayout={(_, i) => ({
        length: SCREEN_W,
        offset: SCREEN_W * i,
        index: i
      })} onMomentumScrollEnd={e => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
        setActiveImg(idx);
      }} renderItem={({
        item
      }) => <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomImg(item)}>
                                <Image source={{
          uri: item
        }} style={[styles.mainImage, {
          width: SCREEN_W
        }]} resizeMode="cover" />
                            </TouchableOpacity>} testID="mobile-image-carousel" /> : <View style={[styles.mainImage, styles.ph]}><Text style={styles.phText}>{t("لا توجد صور")}</Text></View>}
                {listing.images?.length > 1 && <View style={styles.dotsRow} pointerEvents="none">
                        {listing.images.map((_, i) => <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />)}
                    </View>}
                {listing.custom_fields?.model_3d_url && <TouchableOpacity onPress={() => setShow3D(true)} style={[styles.model3dBtn, { top: 54, backgroundColor: "#7C3AED" }]} testID="mobile-open-3d-btn" activeOpacity={0.85}>
                        <Text style={styles.model3dText}>◇ 3D</Text>
                    </TouchableOpacity>}
            </View>

            {listing.images?.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs} contentContainerStyle={{
      paddingHorizontal: 10
    }}>
                    {listing.images.map((img, i) => <TouchableOpacity key={i} onPress={() => {
        setActiveImg(i);
        carouselRef.current?.scrollToIndex?.({
          index: i,
          animated: true
        });
      }} style={[styles.thumb, activeImg === i && styles.thumbActive]}>
                            <Image source={{
          uri: img
        }} style={styles.thumbImg} />
                        </TouchableOpacity>)}
                </ScrollView>}

            {isOwner && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ownerBar} testID="owner-bar">
                    <TouchableOpacity onPress={() => navigation.navigate("Post", {
        editId: id
      })} style={[styles.smallBtn, {
        backgroundColor: theme.colors.primary
      }]} testID="owner-edit-btn">
                        <Text style={styles.smallBtnText}>{t("تعديل")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={togglePauseResume} style={[styles.smallBtn, {
        backgroundColor: listing.status === "paused" ? "#10B981" : "#F59E0B"
      }]} testID="owner-pause-resume-btn">
                        <Text style={styles.smallBtnText}>{listing.status === "paused" ? t("استئناف") : t("إيقاف مؤقت")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={republish} style={[styles.smallBtn, {
        backgroundColor: theme.colors.success
      }]} testID="owner-republish-btn">
                        <Text style={styles.smallBtnText}>{t("تجديد")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={markSold} style={[styles.smallBtn, {
        backgroundColor: theme.colors.accent
      }]} testID="owner-sold-btn">
                        <Text style={[styles.smallBtnText, {
          color: theme.colors.secondary
        }]}>{t("تم البيع")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
        Alert.alert(t("تأكيد الحذف"), t("هل تريد حذف هذا الإعلان نهائياً؟"), [{
          text: t("إلغاء"),
          style: "cancel"
        }, {
          text: t("حذف"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/listings/${id}`);
              Alert.alert("تم الحذف");
              navigation.goBack();
            } catch (e) {
              Alert.alert(t("خطأ"), t("تعذر الحذف"));
            }
          }
        }]);
      }} style={[styles.smallBtn, {
        backgroundColor: theme.colors.danger
      }]} testID="owner-delete-btn">
                        <Text style={styles.smallBtnText}>{t("حذف")}</Text>
                    </TouchableOpacity>
                </ScrollView>}

            <View style={styles.body}>
                {listing.status === "paused" && <View style={styles.pausedBanner} testID="listing-paused-banner">
                        <Text style={styles.pausedBannerText}>{t("هذا الإعلان موقوف مؤقتاً")}</Text>
                    </View>}
                <Text style={styles.title}>{listing.title}</Text>
                <View style={styles.priceRow}>
                    {listing.price ? <Text style={styles.price}>{Number(listing.price).toLocaleString()} <Text style={styles.currency}>{listing.currency}</Text></Text> : <Text style={styles.priceMuted}>{t("على السوم")}</Text>}
                </View>
                <View style={styles.engagementRow}>
                    <TouchableOpacity onPress={toggleLike} style={[styles.engagementBtn, liked && styles.engagementBtnActive]} testID="mobile-like-btn">
                        <Heart size={17} color={liked ? "#E11D48" : theme.colors.textMuted} fill={liked ? "#E11D48" : "transparent"} />
                        <Text style={[styles.engagementText, liked && { color: "#E11D48" }]}>{likeCount}</Text>
                    </TouchableOpacity>
                    <View style={styles.engagementBtn}><Eye size={16} color={theme.colors.textMuted} /><Text style={styles.engagementText}>{Number(listing.views || 0)}</Text></View>
                    <View style={styles.engagementBtn}><MessageCircle size={16} color={theme.colors.textMuted} /><Text style={styles.engagementText}>{comments.length}</Text></View>
                </View>
                {badge?.badge && <View style={[styles.badge, {
        borderColor: theme.colors.primary
      }]}>
                        <Text style={styles.badgeIcon}>{badge.icon}</Text>
                        <View style={{
          flex: 1
        }}>
                            <Text style={styles.badgeLabel}>{badge.label}</Text>
                            <Text style={styles.badgeSub}>{badge.sub}</Text>
                        </View>
                    </View>}

                <Text style={styles.sectionTitle}>{t("الوصف")}</Text>
                <Text style={styles.desc}>{listing.description}</Text>

                <Text style={styles.sectionTitle}>{t("التعليقات")}</Text>
                {user ? <View style={styles.commentComposer}>
                    <TextInput value={commentText} onChangeText={setCommentText} maxLength={1000} placeholder={t("اكتب تعليقًا عامًا...")} placeholderTextColor={theme.colors.textMuted} style={styles.commentInput} multiline />
                    <TouchableOpacity onPress={submitComment} disabled={commentBusy || !commentText.trim()} style={[styles.commentSubmit, (commentBusy || !commentText.trim()) && { opacity: 0.5 }]} testID="mobile-comment-submit"><Text style={styles.commentSubmitText}>{commentBusy ? t("جارٍ النشر...") : t("نشر")}</Text></TouchableOpacity>
                </View> : <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.commentLogin}><Text style={styles.commentLoginText}>{t("سجل الدخول لكتابة تعليق")}</Text></TouchableOpacity>}
                {comments.length === 0 ? <Text style={styles.emptyComments}>{t("لا توجد تعليقات بعد")}</Text> : comments.map(comment => <View key={comment.id} style={styles.commentCard}><View style={styles.commentMeta}><Text style={styles.commentAuthor}>{comment.author?.name || t("مستخدم")}</Text>{comment.author?.verified && <CheckCircle2 size={13} color={theme.colors.primary} />}<Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</Text></View><Text style={styles.commentBody}>{comment.text}</Text></View>)}

                <Text style={styles.sectionTitle}>{t("معلومات البائع")}</Text>
                <TouchableOpacity onPress={() => listing.seller?.id && navigation.navigate("SellerProfile", {
        sellerId: listing.seller.id
      })} style={styles.sellerCard} testID="mobile-seller-card">
                    <View style={styles.avatar}><Text style={styles.avatarText}>{listing.seller?.name?.[0] || "U"}</Text></View>
                    <View style={{
          flex: 1
        }}>
                        <Text style={styles.sellerName}>{listing.seller?.name}</Text>
                        <Text style={styles.sellerCity}>{listing.city}</Text>
                    </View>
                    {!isOwner && listing.seller?.id && user && <TouchableOpacity onPress={toggleFollowSeller} style={[styles.followBtn, following && styles.followBtnActive]} testID="mobile-follow-seller-btn">
                            <Text style={[styles.followBtnText, following && {
            color: theme.colors.text
          }]}>
                                {following ? t("متابَع") : t("متابعة")}
                            </Text>
                        </TouchableOpacity>}
                    <Text style={{
          color: theme.colors.primary,
          fontSize: 18,
          marginStart: 4
        }}>›</Text>
                </TouchableOpacity>

                {/* Permanent, high-visibility "Contact Seller" CTA — owner mandate.
                    Always rendered (unless this is the user's own ad). Navigates
                    directly to the in-app chat with full seller + listing payload. */}
                {!isOwner && listing.seller?.id && <TouchableOpacity onPress={() => {
        if (!user) {
          navigation.navigate("Login");
          return;
        }
        trackEvent("chat_started", { listing_id: listing.id, category: listing.category, country_code: listing.country_code });
        navigation.navigate("Chat", {
          to: listing.seller.id,
          listing_id: listing.id,
          seller_id: listing.seller.id,
          seller_name: listing.seller.name,
          listing
        });
      }} style={styles.contactSellerBtn} testID="mobile-contact-seller-btn" activeOpacity={0.88}>
                    <MessageCircle size={18} color="#fff" strokeWidth={2.6} />
                    <Text style={styles.contactSellerText}>{t("تواصل مع البائع")}</Text>
                </TouchableOpacity>}

                {listing.show_phone !== false && listing.seller?.phone_full && <View style={{
        marginTop: 12
      }}>
                        <TouchableOpacity onPress={call} style={[styles.cta, {
          backgroundColor: theme.colors.success
        }]} testID="mobile-call-btn">
                            <Phone size={16} color="#fff" /><Text style={styles.ctaText}>{t("اتصال مباشر")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={wa} style={[styles.cta, {
          backgroundColor: "#25D366"
        }]} testID="mobile-wa-btn">
                            <MessageCircle size={16} color="#fff" /><Text style={styles.ctaText}>{t("واتساب")}</Text>
                        </TouchableOpacity>
                    </View>}

                <TouchableOpacity onPress={shareAd} style={styles.shareBtn} testID="mobile-share-btn">
                    <Share2 size={14} color={theme.colors.primary} />
                    <Text style={styles.shareText}>{t("مشاركة الإعلان")}</Text>
                </TouchableOpacity>

                {!isOwner && user && listing.price && <TouchableOpacity onPress={() => {
        if (watching) {
          removeWatch();
          return;
        }
        setPriceAlertVal(String(Math.round((listing.price || 0) * 0.9)));
        setPriceAlertOpen(true);
      }} style={[styles.priceAlertBtn, watching && styles.priceAlertBtnActive]} testID="mobile-price-alert">
                        {watching ? <BellOff size={14} color="#fff" /> : <Bell size={14} color={theme.colors.primary} />}
                        <Text style={[styles.priceAlertText, watching && {
          color: "#fff"
        }]}>
                            {watching ? t("إلغاء التنبيه") : t("نبّهني عند انخفاض السعر")}
                        </Text>
                    </TouchableOpacity>}

                {listing.lat && listing.lng && <TouchableOpacity onPress={openInMaps} style={styles.openMapsBtn} testID="mobile-open-in-maps">
                        <MapPin size={16} color={theme.colors.primary} /><Text style={styles.openMapsText}>{t("افتح في خرائط Google")}</Text>
                    </TouchableOpacity>}

                {!isOwner && user && <TouchableOpacity onPress={() => {
        Alert.alert(t("الإبلاغ عن الإعلان"), t("اختر سبب الإبلاغ"), [{
          text: t("احتيال"),
          onPress: () => submitReport("fraud")
        }, {
          text: t("محتوى غير لائق"),
          onPress: () => submitReport("inappropriate")
        }, {
          text: t("مكرر"),
          onPress: () => submitReport("duplicate")
        }, {
          text: t("إلغاء"),
          style: "cancel"
        }]);
      }} style={styles.reportBtn} testID="mobile-report-btn">
                        <Text style={styles.reportText}>⚠️ {t("الإبلاغ")}</Text>
                    </TouchableOpacity>}

                {similar.length > 0 && <>
                        <Text style={styles.sectionTitle}>{t("أحدث الإعلانات")}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {similar.slice(0, 8).map(s => <View key={s.id} style={{
            width: 160,
            marginEnd: 8
          }}>
                                    <ListingCard listing={s} />
                                </View>)}
                        </ScrollView>
                    </>}
            </View>

            <Modal visible={!!zoomImg} transparent animationType="fade" onRequestClose={() => setZoomImg(null)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setZoomImg(null)} style={styles.zoomBg}>
                    {zoomImg && <Image source={{
          uri: zoomImg
        }} style={styles.zoomImg} resizeMode="contain" />}
                    <TouchableOpacity onPress={() => setZoomImg(null)} style={styles.zoomClose}>
                        <Text style={styles.zoomCloseText}>×</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal visible={show3D} transparent animationType="slide" onRequestClose={() => setShow3D(false)}>
                <Model3DViewerMobile url={listing.custom_fields?.model_3d_url} onClose={() => setShow3D(false)} />
            </Modal>
        </ScrollView>

        {/* Sticky bottom CTA — replaces the floating tab bar on this screen.
            For auctions: a single primary "مزايدة" button.
            For regular listings: full-width "تواصل مع البائع" only for
            non-owners (owner-mode hides this since they have the owner bar). */}
        {!isOwner && (isAuction || listing.seller?.id) && (
          <View style={[styles.stickyCta, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
            {isAuction ? (
              <TouchableOpacity
                onPress={() => {
                  if (!user) { navigation.navigate("Login"); return; }
                  // Navigate to the Auctions screen which hosts the BidSheet
                  // modal — passing the listing so it auto-opens the sheet.
                  navigation.navigate("Auctions", { openBidFor: listing.id });
                }}
                style={styles.stickyBtnAuction}
                testID="listing-sticky-bid-btn"
                activeOpacity={0.88}
              >
                <Gavel size={20} color="#fff" strokeWidth={2.4} />
                <Text style={styles.stickyBtnText}>{t("مزايدة الآن")}</Text>
              </TouchableOpacity>
            ) : (
              listing.seller?.id && (
                <TouchableOpacity
                  onPress={() => {
                    if (!user) { navigation.navigate("Login"); return; }
                    navigation.navigate("Chat", {
                      to: listing.seller.id,
                      listing_id: listing.id,
                      seller_id: listing.seller.id,
                      seller_name: listing.seller.name,
                      listing,
                    });
                  }}
                  style={styles.stickyBtnContact}
                  testID="listing-sticky-contact-btn"
                  activeOpacity={0.88}
                >
                  <MessageCircle size={20} color="#fff" strokeWidth={2.4} />
                  <Text style={styles.stickyBtnText}>{t("تواصل مع البائع")}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>;
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  // Floating back button — high-contrast pill on top of the hero image.
  backBtn: {
    position: "absolute",
    insetInlineEnd: 12,
    zIndex: 60,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 8
  },
  // Sticky bottom CTA strip — covers the full width above the home indicator.
  stickyCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 14
  },
  stickyBtnAuction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.accent,
    paddingVertical: 15,
    borderRadius: 20,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6
  },
  stickyBtnContact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 20,
    shadowColor: "#89CFF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6
  },
  stickyBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  imageWrap: {
    aspectRatio: 16 / 10,
    backgroundColor: theme.colors.surfaceElevated,
    position: "relative"
  },
  mainImage: {
    width: "100%",
    height: "100%"
  },
  ph: {
    justifyContent: "center",
    alignItems: "center"
  },
  phText: {
    color: theme.colors.textMuted
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)"
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18
  },
  thumbs: {
    maxHeight: 80,
    marginTop: 8
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    marginHorizontal: 4
  },
  thumbActive: {
    borderColor: theme.colors.primary
  },
  thumbImg: {
    width: "100%",
    height: "100%"
  },
  ownerBar: {
    padding: 10,
    gap: 8
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full
  },
  smallBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12
  },
  body: {
    padding: 16
  },
  // Permanent "Contact Seller" CTA — primary blue, prominent, with soft shadow.
  contactSellerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 14,
    shadowColor: "#89CFF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6
  },
  contactSellerText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "right"
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 4
  },
  engagementBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  engagementBtnActive: { backgroundColor: "#FEE2E2" },
  engagementText: { color: theme.colors.textMuted, fontWeight: "800", fontSize: 12 },
  commentComposer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  commentInput: { flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surfaceElevated, color: theme.colors.text, textAlign: "right" },
  commentSubmit: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  commentSubmitText: { color: theme.colors.primaryFg, fontWeight: "900", fontSize: 12 },
  commentLogin: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 14, padding: 12, alignItems: "center", marginBottom: 12 },
  commentLoginText: { color: theme.colors.primary, fontWeight: "800", fontSize: 13 },
  emptyComments: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 14, textAlign: "right" },
  commentCard: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 14, padding: 12, marginBottom: 8 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 },
  commentAuthor: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
  commentDate: { color: theme.colors.textMuted, fontSize: 10, marginStart: "auto" },
  commentBody: { color: theme.colors.text, fontSize: 13, lineHeight: 20, textAlign: "right" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8
  },
  price: {
    fontSize: 26,
    fontWeight: "900",
    color: theme.colors.primary
  },
  currency: {
    fontSize: 14,
    color: theme.colors.textMuted
  },
  priceMuted: {
    fontSize: 16,
    color: theme.colors.textMuted
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: 10,
    backgroundColor: "rgba(137,207,240,0.1)"
  },
  badgeIcon: {
    fontSize: 24
  },
  badgeLabel: {
    fontWeight: "900",
    fontSize: 14,
    color: theme.colors.text,
    textAlign: "right"
  },
  badgeSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: "right"
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "right"
  },
  desc: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right"
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    color: theme.colors.primaryFg,
    fontWeight: "900",
    fontSize: 16
  },
  sellerName: {
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "right"
  },
  sellerCity: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: "right"
  },
  cta: {
    padding: 14,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8
  },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14
  },
  shareBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  shareIcon: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "900"
  },
  shareText: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 14
  },
  reportBtn: {
    marginTop: 8,
    padding: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "#fca5a5",
    alignItems: "center",
    backgroundColor: "#fee2e2"
  },
  reportText: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 13
  },
  priceAlertBtn: {
    marginTop: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(137,207,240,0.1)"
  },
  priceAlertText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 13
  },
  zoomBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center"
  },
  zoomImg: {
    width: "100%",
    height: "80%"
  },
  zoomClose: {
    position: "absolute",
    top: 44,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  zoomCloseText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28
  },
  model3dBtn: {
    position: "absolute",
    top: 54,
    right: 12,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 4
  },
  model3dText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12
  },
  pausedBanner: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
    padding: 10,
    borderRadius: theme.radius.md,
    marginBottom: 12,
    alignItems: "center"
  },
  pausedBannerText: {
    color: "#92400E",
    fontWeight: "900",
    fontSize: 13
  },
  followBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  followBtnActive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  followBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11
  },
  priceAlertBtnActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B"
  },
  openMapsBtn: {
    marginTop: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: "center",
    backgroundColor: theme.colors.surface
  },
  openMapsText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 13
  },
  priceModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  priceModalSheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18
  },
  priceModalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "right"
  },
  priceModalSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
    textAlign: "right"
  },
  priceModalInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12
  },
  priceModalInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    paddingVertical: 12
  },
  priceModalCurrency: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary
  },
  priceModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center"
  },
  priceModalBtnCancel: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  priceModalBtnOk: {
    backgroundColor: theme.colors.primary
  },
  priceModalBtnTextCancel: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 13
  },
  priceModalBtnTextOk: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13
  }
});