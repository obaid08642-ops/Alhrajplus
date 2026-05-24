// FlightsScreen — mirrors web /app/frontend/src/pages/FlightsPage.js
import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, Linking, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Plane, MapPin, Calendar, Users, Search, ExternalLink, Globe, X } from "lucide-react-native";
import { colors, radius, shadow } from "../theme";

// Top 60 airports — Arabic + IATA codes
const AIRPORTS = [
    { code: "RUH", ar: "الرياض", country: "السعودية" }, { code: "JED", ar: "جدة", country: "السعودية" },
    { code: "DMM", ar: "الدمام", country: "السعودية" }, { code: "MED", ar: "المدينة", country: "السعودية" },
    { code: "AHB", ar: "أبها", country: "السعودية" }, { code: "TIF", ar: "الطائف", country: "السعودية" },
    { code: "TUU", ar: "تبوك", country: "السعودية" }, { code: "GIZ", ar: "جازان", country: "السعودية" },
    { code: "DXB", ar: "دبي", country: "الإمارات" }, { code: "AUH", ar: "أبوظبي", country: "الإمارات" },
    { code: "SHJ", ar: "الشارقة", country: "الإمارات" }, { code: "RKT", ar: "رأس الخيمة", country: "الإمارات" },
    { code: "DOH", ar: "الدوحة", country: "قطر" }, { code: "KWI", ar: "الكويت", country: "الكويت" },
    { code: "BAH", ar: "البحرين", country: "البحرين" }, { code: "MCT", ar: "مسقط", country: "عُمان" },
    { code: "SLL", ar: "صلالة", country: "عُمان" },
    { code: "CAI", ar: "القاهرة", country: "مصر" }, { code: "HRG", ar: "الغردقة", country: "مصر" },
    { code: "SSH", ar: "شرم الشيخ", country: "مصر" },
    { code: "AMM", ar: "عمّان", country: "الأردن" }, { code: "BEY", ar: "بيروت", country: "لبنان" },
    { code: "BGW", ar: "بغداد", country: "العراق" }, { code: "EBL", ar: "أربيل", country: "العراق" },
    { code: "BSR", ar: "البصرة", country: "العراق" }, { code: "SAH", ar: "صنعاء", country: "اليمن" },
    { code: "IST", ar: "إسطنبول", country: "تركيا" }, { code: "SAW", ar: "إسطنبول صبيحة", country: "تركيا" },
    { code: "AYT", ar: "أنطاليا", country: "تركيا" }, { code: "ESB", ar: "أنقرة", country: "تركيا" },
    { code: "IKA", ar: "طهران", country: "إيران" },
    { code: "CMN", ar: "الدار البيضاء", country: "المغرب" }, { code: "RAK", ar: "مراكش", country: "المغرب" },
    { code: "TUN", ar: "تونس", country: "تونس" }, { code: "ALG", ar: "الجزائر", country: "الجزائر" },
    { code: "KRT", ar: "الخرطوم", country: "السودان" },
    { code: "LHR", ar: "لندن", country: "بريطانيا" }, { code: "CDG", ar: "باريس", country: "فرنسا" },
    { code: "FRA", ar: "فرانكفورت", country: "ألمانيا" }, { code: "MUC", ar: "ميونخ", country: "ألمانيا" },
    { code: "AMS", ar: "أمستردام", country: "هولندا" }, { code: "MAD", ar: "مدريد", country: "إسبانيا" },
    { code: "FCO", ar: "روما", country: "إيطاليا" }, { code: "ATH", ar: "أثينا", country: "اليونان" },
    { code: "SVO", ar: "موسكو", country: "روسيا" },
    { code: "KUL", ar: "كوالالمبور", country: "ماليزيا" }, { code: "SIN", ar: "سنغافورة", country: "سنغافورة" },
    { code: "BKK", ar: "بانكوك", country: "تايلاند" }, { code: "DPS", ar: "بالي", country: "إندونيسيا" },
    { code: "MNL", ar: "مانيلا", country: "الفلبين" }, { code: "HND", ar: "طوكيو", country: "اليابان" },
    { code: "BOM", ar: "مومباي", country: "الهند" }, { code: "DEL", ar: "دلهي", country: "الهند" },
    { code: "KHI", ar: "كراتشي", country: "باكستان" }, { code: "ISB", ar: "إسلام آباد", country: "باكستان" },
    { code: "LHE", ar: "لاهور", country: "باكستان" }, { code: "DAC", ar: "دكا", country: "بنغلاديش" },
    { code: "JFK", ar: "نيويورك", country: "أمريكا" }, { code: "LAX", ar: "لوس أنجلوس", country: "أمريكا" },
    { code: "YYZ", ar: "تورنتو", country: "كندا" }, { code: "SYD", ar: "سيدني", country: "أستراليا" },
];

const PROVIDERS = [
    { key: "trip", name: "Trip.com", icon: "🌐", bg: ["#287DFA", "#0F58D6"], full: true },
    { key: "skyscanner", name: "Skyscanner", icon: "✈️", bg: ["#0EA5E9", "#0369A1"] },
    { key: "wego", name: "Wego", icon: "🌍", bg: ["#10B981", "#047857"] },
    { key: "kayak", name: "Kayak", icon: "🛫", bg: ["#F97316", "#C2410C"] },
    { key: "googleFlights", name: "Google Flights", icon: "🔍", bg: ["#3B82F6", "#1D4ED8"] },
];

function fmtYYMMDD(d) { return d ? d.replace(/-/g, "").slice(2) : ""; }

function AirportPickerModal({ visible, onClose, onPick, current }) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        if (!q) return AIRPORTS;
        const Q = q.toLowerCase().trim();
        return AIRPORTS.filter((a) => a.code.toLowerCase().includes(Q) || a.ar.includes(q) || a.country.includes(q));
    }, [q]);
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={pStyles.bg}>
                <View style={pStyles.sheet}>
                    <View style={pStyles.head}>
                        <Search size={16} color={colors.textMuted} />
                        <TextInput value={q} onChangeText={setQ} placeholder="ابحث عن مدينة أو رمز (مثل RUH, DXB)" placeholderTextColor={colors.textMuted} style={pStyles.input} autoFocus />
                        <TouchableOpacity onPress={onClose} style={pStyles.closeBtn}><X size={16} color={colors.textMuted} /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={filtered}
                        keyExtractor={(a) => a.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => { onPick(item.code); onClose(); setQ(""); }} style={[pStyles.row, item.code === current && pStyles.rowActive]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={pStyles.rowAr}>{item.ar} <Text style={pStyles.rowCode}>({item.code})</Text></Text>
                                    <Text style={pStyles.rowCountry}>{item.country}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
}

const pStyles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: "75%" },
    head: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderBottomWidth: 1, borderColor: colors.border },
    input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 8 },
    closeBtn: { width: 30, height: 30, borderRadius: 999, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
    row: { padding: 12, borderBottomWidth: 1, borderColor: colors.border, flexDirection: "row" },
    rowActive: { backgroundColor: "rgba(79,182,230,0.10)" },
    rowAr: { fontSize: 14, fontWeight: "800", color: colors.text },
    rowCode: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
    rowCountry: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
});

export default function FlightsScreen() {
    const [from, setFrom] = useState("RUH");
    const [to, setTo] = useState("DXB");
    const [date, setDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [pax, setPax] = useState(1);
    const [tripType, setTripType] = useState("oneway");
    const [pickerFor, setPickerFor] = useState(null);
    const [showDate, setShowDate] = useState(null); // 'go' | 'back'

    const fromAirport = AIRPORTS.find((a) => a.code === from);
    const toAirport = AIRPORTS.find((a) => a.code === to);

    const search = (provider) => {
        if (!from || !to || !date) { Alert.alert("تنبيه", "الرجاء اختيار المطار والتاريخ"); return; }
        if (from === to) { Alert.alert("تنبيه", "لا يمكن أن يكون المغادرة والوصول متشابهين"); return; }
        const dDay = fmtYYMMDD(date);
        const rDay = fmtYYMMDD(returnDate);
        let url = "";
        if (provider === "skyscanner") url = `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${dDay}${tripType === "round" && rDay ? `/${rDay}` : ""}/?adults=${pax}&currency=SAR&utm_source=harajplus`;
        else if (provider === "wego") url = `https://www.wego.com/flights/searches/${from}-${to}${tripType === "round" && returnDate ? `-${returnDate}` : ""}-${date}/economy/${pax}adults`;
        else if (provider === "kayak") url = `https://www.kayak.com/flights/${from}-${to}/${date}${tripType === "round" && returnDate ? `/${returnDate}` : ""}/${pax}adults?currency=SAR`;
        else if (provider === "googleFlights") url = `https://www.google.com/travel/flights?q=Flights%20to%20${to}%20from%20${from}%20on%20${date}${tripType === "round" && returnDate ? `%20returning%20${returnDate}` : ""}`;
        else if (provider === "trip") url = `https://www.trip.com/flights/showfarefirst?dcity=${from}&acity=${to}&ddate=${date}${tripType === "round" && returnDate ? `&rdate=${returnDate}` : ""}&triptype=${tripType === "round" ? "rt" : "ow"}&class=y&quantity=${pax}&Allianceid=8199633&SID=309959147&trip_sub1=alhraj`;
        Linking.openURL(url).catch(() => {});
    };

    const onDateChange = (event, selected) => {
        const which = showDate;
        setShowDate(null);
        if (event.type === "dismissed" || !selected) return;
        const iso = selected.toISOString().slice(0, 10);
        if (which === "go") setDate(iso);
        else if (which === "back") setReturnDate(iso);
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 12, paddingBottom: 130 }}>
            {/* Hero */}
            <View style={[styles.hero, shadow.card]}>
                <LinearGradient colors={["rgba(79,182,230,0.18)", "rgba(15,26,53,0.05)"]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.heroRow}>
                    <View style={styles.heroIconBox}><Plane size={22} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>احجز رحلتك</Text>
                        <Text style={styles.heroSub}>قارن أسعار 5 محركات بحث في ضغطة واحدة</Text>
                    </View>
                </View>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
                {/* Trip type */}
                <View style={styles.tripTypeRow}>
                    <TouchableOpacity onPress={() => setTripType("oneway")} style={[styles.tripBtn, tripType === "oneway" && styles.tripBtnActive]}>
                        <Text style={[styles.tripText, tripType === "oneway" && styles.tripTextActive]}>ذهاب فقط</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTripType("round")} style={[styles.tripBtn, tripType === "round" && styles.tripBtnActive]}>
                        <Text style={[styles.tripText, tripType === "round" && styles.tripTextActive]}>ذهاب وعودة</Text>
                    </TouchableOpacity>
                </View>

                {/* From/To */}
                <View style={{ gap: 10 }}>
                    <View>
                        <View style={styles.fieldLabel}><MapPin size={11} color={colors.text} /><Text style={styles.fieldLabelText}>من</Text></View>
                        <TouchableOpacity onPress={() => setPickerFor("from")} style={styles.fieldBtn}>
                            <Text style={styles.fieldValue}>{fromAirport?.ar} ({from})</Text>
                            <Text style={styles.fieldHint}>{fromAirport?.country}</Text>
                        </TouchableOpacity>
                    </View>
                    <View>
                        <View style={styles.fieldLabel}><MapPin size={11} color={colors.text} /><Text style={styles.fieldLabelText}>إلى</Text></View>
                        <TouchableOpacity onPress={() => setPickerFor("to")} style={styles.fieldBtn}>
                            <Text style={styles.fieldValue}>{toAirport?.ar} ({to})</Text>
                            <Text style={styles.fieldHint}>{toAirport?.country}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dates + Pax */}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.fieldLabel}><Calendar size={11} color={colors.text} /><Text style={styles.fieldLabelText}>تاريخ الذهاب</Text></View>
                        <TouchableOpacity onPress={() => setShowDate("go")} style={styles.fieldBtn}>
                            <Text style={styles.fieldValue}>{date || "اختر تاريخ"}</Text>
                        </TouchableOpacity>
                    </View>
                    {tripType === "round" ? (
                        <View style={{ flex: 1 }}>
                            <View style={styles.fieldLabel}><Calendar size={11} color={colors.text} /><Text style={styles.fieldLabelText}>تاريخ العودة</Text></View>
                            <TouchableOpacity onPress={() => setShowDate("back")} style={styles.fieldBtn}>
                                <Text style={styles.fieldValue}>{returnDate || "اختر تاريخ"}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <View style={styles.fieldLabel}><Users size={11} color={colors.text} /><Text style={styles.fieldLabelText}>المسافرون</Text></View>
                            <View style={styles.paxRow}>
                                <TouchableOpacity onPress={() => setPax((p) => Math.max(1, p - 1))} style={styles.paxBtn}><Text style={styles.paxBtnText}>−</Text></TouchableOpacity>
                                <Text style={styles.paxValue}>{pax}</Text>
                                <TouchableOpacity onPress={() => setPax((p) => Math.min(9, p + 1))} style={styles.paxBtn}><Text style={styles.paxBtnText}>+</Text></TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
                {tripType === "round" && (
                    <View style={{ marginTop: 10 }}>
                        <View style={styles.fieldLabel}><Users size={11} color={colors.text} /><Text style={styles.fieldLabelText}>عدد المسافرين</Text></View>
                        <View style={styles.paxRow}>
                            <TouchableOpacity onPress={() => setPax((p) => Math.max(1, p - 1))} style={styles.paxBtn}><Text style={styles.paxBtnText}>−</Text></TouchableOpacity>
                            <Text style={styles.paxValue}>{pax}</Text>
                            <TouchableOpacity onPress={() => setPax((p) => Math.min(9, p + 1))} style={styles.paxBtn}><Text style={styles.paxBtnText}>+</Text></TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Providers */}
                <View style={styles.providersHead}>
                    <Globe size={14} color={colors.primary} />
                    <Text style={styles.providersTitle}>ابحث في:</Text>
                </View>
                <View style={styles.providersGrid}>
                    {PROVIDERS.map((p) => (
                        <TouchableOpacity key={p.key} onPress={() => search(p.key)} style={[styles.providerBtn, p.full && { width: "100%" }]} activeOpacity={0.9}>
                            <LinearGradient colors={p.bg} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                            <Text style={styles.providerIcon}>{p.icon}</Text>
                            <Text style={styles.providerName}>{p.name}</Text>
                            {p.full && <View style={styles.recommend}><Text style={styles.recommendText}>⭐ موصى به</Text></View>}
                            <ExternalLink size={13} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.disclaimer}>🤝 الحراج بلس وسيط فقط • النتائج من المحركات أعلاه</Text>
            </View>

            <AirportPickerModal visible={pickerFor !== null} current={pickerFor === "from" ? from : to} onPick={(c) => { if (pickerFor === "from") setFrom(c); else setTo(c); }} onClose={() => setPickerFor(null)} />
            {showDate && (
                <DateTimePicker
                    value={showDate === "go" ? (date ? new Date(date) : new Date()) : (returnDate ? new Date(returnDate) : (date ? new Date(date) : new Date()))}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={showDate === "back" && date ? new Date(date) : new Date()}
                    onChange={onDateChange}
                />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    hero: { borderRadius: 24, borderWidth: 1, borderColor: "rgba(79,182,230,0.3)", overflow: "hidden", padding: 16, marginBottom: 12 },
    heroRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    heroIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    heroTitle: { fontSize: 19, fontWeight: "900", color: colors.text },
    heroSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    formCard: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 14 },
    tripTypeRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
    tripBtn: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 999, paddingVertical: 10, alignItems: "center" },
    tripBtnActive: { backgroundColor: colors.primary },
    tripText: { fontSize: 12, fontWeight: "800", color: colors.text },
    tripTextActive: { color: "#fff" },
    fieldLabel: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 5 },
    fieldLabelText: { fontSize: 11, fontWeight: "800", color: colors.text },
    fieldBtn: { backgroundColor: colors.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    fieldValue: { fontSize: 13, fontWeight: "700", color: colors.text },
    fieldHint: { fontSize: 10, color: colors.textMuted },
    paxRow: { backgroundColor: colors.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    paxBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
    paxBtnText: { fontSize: 18, fontWeight: "900", color: colors.primary },
    paxValue: { fontSize: 16, fontWeight: "900", color: colors.text },
    providersHead: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16, marginBottom: 8, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border },
    providersTitle: { fontSize: 12, fontWeight: "800", color: colors.text },
    providersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    providerBtn: { width: "48%", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden", position: "relative" },
    providerIcon: { fontSize: 16 },
    providerName: { color: "#fff", fontWeight: "800", fontSize: 12 },
    recommend: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
    recommendText: { color: "#fff", fontSize: 9, fontWeight: "700" },
    disclaimer: { fontSize: 10, color: colors.textMuted, textAlign: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border },
});
