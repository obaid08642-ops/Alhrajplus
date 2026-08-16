/**
 * Public seller profile — info + rating + their listings.
 * Tapped from the seller card on any listing detail.
 */
import { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from "react-native";
import api from "../api";
import { theme } from "../theme";
import { useI18n } from "../I18nContext";
import { useAuth } from "../AuthContext";
import { useThemeMode } from "../ThemeContext";
import ListingCard from "../components/ListingCard";
export default function SellerProfileScreen({
  route,
  navigation
}) {
  const { t } = useI18n();
  const { palette } = useThemeMode();
  const {
    sellerId
  } = route.params || {};
  
  const {
    user
  } = useAuth();
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingTotal, setListingTotal] = useState(0);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  useEffect(() => {
    if (!sellerId) return;
    (async () => {
      try {
        const [sRes, lRes, rRes] = await Promise.all([api.get(`/sellers/${sellerId}`), api.get(`/sellers/${sellerId}/listings`, {
          params: {
            limit: 20
          }
        }), api.get(`/sellers/${sellerId}/ratings`, {
          params: {
            limit: 20
          }
        })]);
        setSeller(sRes.data);
        setListings(lRes.data?.items || []);
        setListingTotal(Number(lRes.data?.total || 0));
        setRatings(rRes.data || []);
        if (user) {
          try {
            const fs = await api.get(`/sellers/${sellerId}/follow-status`);
            setFollowing(!!fs.data?.following);
          } catch (_) {}
        }
      } catch (_) {} finally {
        setLoading(false);
      }
    })();
  }, [sellerId, user]);
  const toggleFollow = async () => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    try {
      const {
        data
      } = await api.post(`/sellers/${sellerId}/follow`);
      setFollowing(!!data?.following);
    } catch (_) {
      Alert.alert(t("خطأ"), t("حدث خطأ. حاول مرة أخرى."));
    }
  };
  const submitRating = async () => {
    try {
      await api.post(`/sellers/${sellerId}/ratings`, {
        stars,
        comment
      });
      Alert.alert("✅", t("شكراً لك!"));
      setShowRate(false);
      const r = await api.get(`/sellers/${sellerId}/ratings`, {
        params: {
          limit: 20
        }
      });
      setRatings(r.data || []);
      const latestSeller = await api.get(`/sellers/${sellerId}`);
      setSeller(latestSeller.data);
    } catch (e) {
      Alert.alert(t("خطأ"), e.response?.data?.detail || t("حدث خطأ. حاول مرة أخرى."));
    }
  };
  if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;
  if (!seller) return <View style={s.center}><Text style={{
      color: theme.colors.text
    }}>{t("لا توجد بيانات")}</Text></View>;
  return <ScrollView style={[s.wrap, { backgroundColor: palette.bg }]}>
            <View style={s.header}>
                <View style={s.avatar}><Text style={s.avatarText}>{seller.name?.[0] || "U"}</Text></View>
                <Text style={s.name}>{seller.name}{seller.verified ? " ✓" : ""}</Text>
                {seller.bio ? <Text style={s.bio}>{seller.bio}</Text> : null}
                <View style={s.stats}>
                    <View style={s.stat}><Text style={s.statNum}>{seller.rating_avg || "—"}</Text><Text style={s.statLbl}>⭐ {t("التقييم")}</Text></View>
                    <View style={s.stat}><Text style={s.statNum}>{seller.rating_count || 0}</Text><Text style={s.statLbl}>{t("تقييمات")}</Text></View>
                    <View style={s.stat}><Text style={s.statNum}>{seller.followers || 0}</Text><Text style={s.statLbl}>{t("متابعون")}</Text></View>
                    <View style={s.stat}><Text style={s.statNum}>{listingTotal || listings.length}</Text><Text style={s.statLbl}>{t("إعلانات")}</Text></View>
                </View>
                {user && user.id !== sellerId && <View style={s.actionRow}>
                        <TouchableOpacity onPress={toggleFollow} style={[s.actionBtn, following && s.actionBtnActive]} testID="mobile-follow-btn">
                            <Text style={[s.actionText, following && s.actionTextActive]}>{following ? t("متابَع") : t("متابعة")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowRate(true)} style={s.actionBtn} testID="mobile-rate-btn">
                            <Text style={s.actionText}>⭐ {t("تقييم")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate("Chat", {
          to: sellerId,
          seller_id: sellerId,
          seller_name: seller.name,
        })} style={[s.actionBtn, {
          backgroundColor: theme.colors.primary
        }]} testID="mobile-chat-seller-btn">
                            <Text style={[s.actionText, {
            color: theme.colors.primaryFg
          }]}>💬</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
          Alert.alert(t("خيارات"), "", [{
            text: t("الإبلاغ"),
            onPress: async () => {
              try {
                await api.post("/reports", {
                  target_type: "user",
                  target_id: sellerId,
                  reason: "inappropriate"
                });
                Alert.alert("✅", t("تم استلام بلاغك"));
              } catch (_) {}
            }
          }, {
            text: t("حظر"),
            style: "destructive",
            onPress: async () => {
              try {
                await api.post(`/blocks/${sellerId}`);
                Alert.alert("🚫", t("تم الحظر"));
              } catch (_) {}
            }
          }, {
            text: t("إلغاء"),
            style: "cancel"
          }]);
        }} style={s.actionBtn} testID="mobile-seller-more">
                            <Text style={s.actionText}>⋮</Text>
                        </TouchableOpacity>
                    </View>}
            </View>

            <Text style={s.sectionTitle}>{t("إعلانات البائع")}</Text>
            <FlatList data={listings} keyExtractor={item => item.id} numColumns={2} scrollEnabled={false} contentContainerStyle={{
      paddingHorizontal: 8
    }} renderItem={({
      item
    }) => <View style={{
      flex: 1,
      padding: 4
    }}>
                        <ListingCard listing={item} />
                    </View>} ListEmptyComponent={<Text style={s.muted}>{t("لا توجد بيانات")}</Text>} />

            <Text style={s.sectionTitle}>{t("التقييمات")}</Text>
            {ratings.length === 0 ? <Text style={s.muted}>{t("لا توجد تقييمات بعد")}</Text> : ratings.map(r => <View key={r.id} style={s.ratingItem}>
                        <Text style={s.ratingAuthor}>{r.author?.name}  {"⭐".repeat(r.stars)}</Text>
                        {r.comment ? <Text style={s.ratingComment}>{r.comment}</Text> : null}
                    </View>)}

            <Modal visible={showRate} transparent animationType="fade" onRequestClose={() => setShowRate(false)}>
                <View style={s.modalBg}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>{t("قيّم البائع")}</Text>
                        <View style={s.starsRow}>
                            {[1, 2, 3, 4, 5].map(n => <TouchableOpacity key={n} onPress={() => setStars(n)}>
                                    <Text style={[s.star, n <= stars && s.starActive]}>★</Text>
                                </TouchableOpacity>)}
                        </View>
                        <TextInput value={comment} onChangeText={setComment} placeholder={t("اكتب تعليقك (اختياري)")} placeholderTextColor={theme.colors.textMuted} multiline style={s.input} testID="mobile-rating-comment" />
                        <View style={{
            flexDirection: "row",
            gap: 8
          }}>
                            <TouchableOpacity onPress={() => setShowRate(false)} style={[s.modalBtn, {
              backgroundColor: theme.colors.surfaceElevated
            }]}>
                                <Text style={{
                color: theme.colors.text,
                fontWeight: "800"
              }}>{t("إلغاء")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitRating} style={[s.modalBtn, {
              backgroundColor: theme.colors.primary
            }]} testID="mobile-rating-submit">
                                <Text style={{
                color: theme.colors.primaryFg,
                fontWeight: "900"
              }}>{t("إرسال")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>;
}
const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  muted: {
    color: theme.colors.textMuted,
    textAlign: "center",
    padding: 16
  },
  header: {
    padding: 18,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8
  },
  avatarText: {
    color: theme.colors.primaryFg,
    fontSize: 32,
    fontWeight: "900"
  },
  name: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4
  },
  bio: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 12
  },
  stats: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16
  },
  stat: {
    alignItems: "center"
  },
  statNum: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  statLbl: {
    color: theme.colors.textMuted,
    fontSize: 11
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8
  },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated
  },
  actionBtnActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success
  },
  actionText: {
    color: theme.colors.text,
    fontWeight: "800"
  },
  actionTextActive: {
    color: "#fff"
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    margin: 12,
    marginTop: 18
  },
  ratingItem: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  ratingAuthor: {
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 4
  },
  ratingComment: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 14
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14
  },
  star: {
    fontSize: 36,
    color: theme.colors.textMuted
  },
  starActive: {
    color: "#fbbf24"
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    marginBottom: 14,
    minHeight: 60,
    color: theme.colors.text,
    textAlign: "right",
    textAlignVertical: "top"
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: theme.radius.md,
    alignItems: "center"
  }
});