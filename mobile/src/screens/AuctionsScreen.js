// AuctionsScreen — mirrors web /app/frontend/src/pages/AuctionsPage.js
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Modal, TextInput, FlatList, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Gavel, Clock, TrendingUp, Users, X, Sparkles } from "lucide-react-native";
import api from "../api";
import { useAuth } from "../AuthContext";
import { colors, radius, shadow } from "../theme";

export default function AuctionsScreen() {
    const nav = useNavigation();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [active, setActive] = useState(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get("/auctions/active", { params: { limit: 30 } });
            setItems(data || []);
        } catch (_) {}
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: 12, paddingBottom: 130 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        >
            {/* Hero */}
            <View style={[styles.hero, shadow.card]}>
                <LinearGradient colors={["rgba(255,209,102,0.18)", "rgba(79,182,230,0.10)", "rgba(15,26,53,0.05)"]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.heroRow}>
                    <View style={styles.heroIconBox}><Gavel size={26} color={colors.secondary} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>المزادات الحية</Text>
                        <Text style={styles.heroSub}>سيارات نادرة • عقارات مميزة • مقتنيات تراثية</Text>
                    </View>
                </View>
                <View style={styles.chipsRow}>
                    <View style={styles.chip}><Sparkles size={11} color={colors.accent} /><Text style={styles.chipText}>مزايدة فورية</Text></View>
                    <View style={styles.chip}><Users size={11} color={colors.primary} /><Text style={styles.chipText}>من جميع الدول</Text></View>
                </View>
            </View>

            {/* Header */}
            <View style={styles.listHead}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TrendingUp size={14} color={colors.primary} />
                    <Text style={styles.listTitle}>المزادات النشطة <Text style={styles.muted}>({items.length})</Text></Text>
                </View>
                <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.createBtn}>
                    <Text style={styles.createBtnText}>+ أنشئ مزاد</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Gavel size={40} color={colors.textMuted} />
                    <Text style={styles.emptyText}>لا توجد مزادات نشطة الآن</Text>
                </View>
            ) : (
                items.map((l) => <AuctionCard key={l.id} listing={l} onBid={() => setActive(l)} />)
            )}

            {active && <BidModal user={user} listing={active} onClose={() => setActive(null)} onPlaced={() => { setActive(null); load(); }} />}
        </ScrollView>
    );
}

function AuctionCard({ listing, onBid }) {
    const nav = useNavigation();
    const top = listing.top_bid;
    const currentPrice = top?.amount || listing.price || 0;
    return (
        <View style={[styles.card, shadow.card]}>
            <TouchableOpacity onPress={() => nav.navigate("ListingDetail", { id: listing.id })} activeOpacity={0.9}>
                <View style={styles.cardImgBox}>
                    {listing.images?.[0] ? <Image source={{ uri: listing.images[0] }} style={{ width: "100%", height: "100%" }} /> : <View style={{ flex: 1, backgroundColor: colors.surfaceElevated }} />}
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>مباشر</Text>
                    </View>
                    <View style={styles.bidsBadge}>
                        <Clock size={10} color="#fff" />
                        <Text style={styles.bidsText}>{listing.bid_count} مزايدة</Text>
                    </View>
                </View>
            </TouchableOpacity>
            <View style={{ padding: 12 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{listing.title}</Text>
                <Text style={styles.cardCity} numberOfLines={1}>{listing.city}</Text>
                <View style={styles.cardFoot}>
                    <View>
                        <Text style={styles.cardLabel}>{top ? "أعلى مزايدة" : "السعر الابتدائي"}</Text>
                        <Text style={styles.cardPrice}>{Number(currentPrice).toLocaleString()} <Text style={styles.cardCurrency}>{listing.currency || "ر.س"}</Text></Text>
                    </View>
                    <TouchableOpacity onPress={onBid} style={styles.bidBtn}>
                        <Gavel size={13} color="#fff" />
                        <Text style={styles.bidBtnText}>زايد الآن</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function BidModal({ user, listing, onClose, onPlaced }) {
    const nav = useNavigation();
    const [bids, setBids] = useState([]);
    const [amount, setAmount] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.get(`/auctions/${listing.id}/bids`).then(({ data }) => setBids(data || []));
    }, [listing.id]);

    const top = bids[0];
    const minRequired = (top?.amount || listing.price || 0) + 1;

    const submit = async () => {
        if (!user) { onClose(); nav.navigate("Login"); return; }
        setBusy(true);
        try {
            await api.post(`/auctions/${listing.id}/bid`, { amount: parseFloat(amount) });
            onPlaced();
        } catch (e) {
            Alert.alert("تنبيه", e.response?.data?.detail || "تعذر إيداع المزايدة");
        } finally { setBusy(false); }
    };

    return (
        <Modal animationType="slide" transparent visible onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBg}>
                <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View style={styles.modalHead}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                            <Gavel size={18} color={colors.primary} />
                            <Text style={styles.modalTitle} numberOfLines={1}>المزايدة على {listing.title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={16} color={colors.textMuted} /></TouchableOpacity>
                    </View>
                    <View style={{ padding: 14, gap: 12 }}>
                        <View style={styles.topBidBox}>
                            <View>
                                <Text style={styles.cardLabel}>{top ? "أعلى مزايدة" : "السعر الابتدائي"}</Text>
                                <Text style={styles.modalPrice}>{Number(top?.amount || listing.price || 0).toLocaleString()} <Text style={styles.cardCurrency}>{listing.currency || "ر.س"}</Text></Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.cardLabel}>عدد المزايدات</Text>
                                <Text style={styles.modalBidsCount}>{bids.length}</Text>
                            </View>
                        </View>
                        <Text style={styles.label}>مبلغ المزايدة <Text style={styles.muted}>(الحد الأدنى: {minRequired.toLocaleString()})</Text></Text>
                        <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={String(minRequired)} placeholderTextColor={colors.textMuted} style={styles.bidInput} />
                        <TouchableOpacity onPress={submit} disabled={busy || !amount} style={[styles.submitBtn, (busy || !amount) && { opacity: 0.5 }]}>
                            {busy ? <ActivityIndicator color="#fff" /> : <><Gavel size={14} color="#fff" /><Text style={styles.submitBtnText}>أكد المزايدة</Text></>}
                        </TouchableOpacity>
                        {bids.length > 0 && (
                            <View style={{ marginTop: 6 }}>
                                <Text style={styles.label}>تاريخ المزايدات</Text>
                                <FlatList
                                    data={bids}
                                    keyExtractor={(b) => b.id}
                                    style={{ maxHeight: 180, marginTop: 6 }}
                                    renderItem={({ item, index }) => (
                                        <View style={[styles.bidRow, index === 0 && styles.bidRowTop]}>
                                            <Text style={styles.bidName}>{item.bidder_name} {item.verified && "✓"} {index === 0 && <Text style={{ color: colors.primary }}>(الأعلى)</Text>}</Text>
                                            <Text style={styles.bidAmount}>{Number(item.amount).toLocaleString()}</Text>
                                        </View>
                                    )}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    hero: { borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,209,102,0.4)", overflow: "hidden", padding: 16, marginBottom: 14 },
    heroRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    heroIconBox: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
    heroTitle: { fontSize: 20, fontWeight: "900", color: colors.text },
    heroSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    chipsRow: { flexDirection: "row", gap: 6, marginTop: 12, flexWrap: "wrap" },
    chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
    chipText: { fontSize: 10, fontWeight: "800", color: colors.text },
    listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    listTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
    muted: { color: colors.textMuted, fontWeight: "500", fontSize: 11 },
    createBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
    createBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
    empty: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 30, alignItems: "center", gap: 10 },
    emptyText: { color: colors.textMuted, fontSize: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 12 },
    cardImgBox: { aspectRatio: 5 / 3, backgroundColor: colors.surfaceElevated, position: "relative" },
    liveBadge: { position: "absolute", top: 8, start: 8, backgroundColor: "#EF4444", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 },
    liveDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: "#fff" },
    liveText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    bidsBadge: { position: "absolute", top: 8, end: 8, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 },
    bidsText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    cardTitle: { fontSize: 13.5, fontWeight: "800", color: colors.text },
    cardCity: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    cardFoot: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border },
    cardLabel: { fontSize: 9, color: colors.textMuted },
    cardPrice: { fontSize: 18, fontWeight: "900", color: colors.accent },
    cardCurrency: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
    bidBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 },
    bidBtnText: { color: "#fff", fontWeight: "800", fontSize: 11 },
    modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "85%" },
    modalHead: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: colors.border, gap: 8 },
    modalTitle: { fontSize: 14, fontWeight: "900", color: colors.text },
    closeBtn: { width: 30, height: 30, borderRadius: 999, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
    topBidBox: { backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    modalPrice: { fontSize: 24, fontWeight: "900", color: colors.accent, marginTop: 2 },
    modalBidsCount: { fontSize: 20, fontWeight: "900", color: colors.text },
    label: { fontSize: 11, fontWeight: "800", color: colors.text },
    bidInput: { backgroundColor: colors.surfaceElevated, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: "800", color: colors.text, borderWidth: 1, borderColor: colors.border },
    submitBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
    submitBtnText: { color: "#fff", fontSize: 13, fontWeight: "900" },
    bidRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, marginBottom: 4, borderRadius: 10, backgroundColor: colors.surfaceElevated },
    bidRowTop: { backgroundColor: "rgba(79,182,230,0.10)", borderWidth: 1, borderColor: "rgba(79,182,230,0.3)" },
    bidName: { fontSize: 11.5, color: colors.text },
    bidAmount: { fontSize: 13, fontWeight: "800", color: colors.text },
});
