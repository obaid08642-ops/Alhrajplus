import { Plane, MapPin, Calendar, Users, Search, ExternalLink, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { tr } from "@/contexts/I18nContext";

// Comprehensive global airport database (IATA + Arabic names)
const AIRPORTS = [
    // GCC
    { code: "RUH", ar: "الرياض", en: "Riyadh", country: "السعودية" },
    { code: "JED", ar: "جدة", en: "Jeddah", country: "السعودية" },
    { code: "DMM", ar: "الدمام", en: "Dammam", country: "السعودية" },
    { code: "MED", ar: "المدينة المنورة", en: "Madinah", country: "السعودية" },
    { code: "AHB", ar: "أبها", en: "Abha", country: "السعودية" },
    { code: "TIF", ar: "الطائف", en: "Taif", country: "السعودية" },
    { code: "TUU", ar: "تبوك", en: "Tabuk", country: "السعودية" },
    { code: "GIZ", ar: "جازان", en: "Gizan", country: "السعودية" },
    { code: "HOF", ar: "الأحساء", en: "Al Ahsa", country: "السعودية" },
    { code: "DXB", ar: "دبي الدولي", en: "Dubai", country: "الإمارات" },
    { code: "AUH", ar: "أبوظبي", en: "Abu Dhabi", country: "الإمارات" },
    { code: "SHJ", ar: "الشارقة", en: "Sharjah", country: "الإمارات" },
    { code: "DWC", ar: "آل مكتوم", en: "Dubai DWC", country: "الإمارات" },
    { code: "RKT", ar: "رأس الخيمة", en: "Ras Al Khaimah", country: "الإمارات" },
    { code: "DOH", ar: "الدوحة", en: "Doha", country: "قطر" },
    { code: "KWI", ar: "الكويت", en: "Kuwait", country: "الكويت" },
    { code: "BAH", ar: "البحرين", en: "Bahrain", country: "البحرين" },
    { code: "MCT", ar: "مسقط", en: "Muscat", country: "عُمان" },
    { code: "SLL", ar: "صلالة", en: "Salalah", country: "عُمان" },
    // Levant + Egypt + Iraq + Yemen
    { code: "CAI", ar: "القاهرة", en: "Cairo", country: "مصر" },
    { code: "HRG", ar: "الغردقة", en: "Hurghada", country: "مصر" },
    { code: "SSH", ar: "شرم الشيخ", en: "Sharm El Sheikh", country: "مصر" },
    { code: "AMM", ar: "عمّان", en: "Amman", country: "الأردن" },
    { code: "BEY", ar: "بيروت", en: "Beirut", country: "لبنان" },
    { code: "DAM", ar: "دمشق", en: "Damascus", country: "سوريا" },
    { code: "BGW", ar: "بغداد", en: "Baghdad", country: "العراق" },
    { code: "EBL", ar: "أربيل", en: "Erbil", country: "العراق" },
    { code: "BSR", ar: "البصرة", en: "Basra", country: "العراق" },
    { code: "SAH", ar: "صنعاء", en: "Sanaa", country: "اليمن" },
    { code: "ADE", ar: "عدن", en: "Aden", country: "اليمن" },
    // Türkiye + Iran
    { code: "IST", ar: "إسطنبول", en: "Istanbul", country: "تركيا" },
    { code: "SAW", ar: "إسطنبول صبيحة", en: "Istanbul Sabiha", country: "تركيا" },
    { code: "ESB", ar: "أنقرة", en: "Ankara", country: "تركيا" },
    { code: "AYT", ar: "أنطاليا", en: "Antalya", country: "تركيا" },
    { code: "IZM", ar: "إزمير", en: "Izmir", country: "تركيا" },
    { code: "IKA", ar: "طهران", en: "Tehran", country: "إيران" },
    { code: "MHD", ar: "مشهد", en: "Mashhad", country: "إيران" },
    // North Africa
    { code: "CMN", ar: "الدار البيضاء", en: "Casablanca", country: "المغرب" },
    { code: "RAK", ar: "مراكش", en: "Marrakesh", country: "المغرب" },
    { code: "ALG", ar: "الجزائر", en: "Algiers", country: "الجزائر" },
    { code: "TUN", ar: "تونس", en: "Tunis", country: "تونس" },
    { code: "TIP", ar: "طرابلس", en: "Tripoli", country: "ليبيا" },
    { code: "KRT", ar: "الخرطوم", en: "Khartoum", country: "السودان" },
    // Europe
    { code: "LHR", ar: "لندن هيثرو", en: "London Heathrow", country: "بريطانيا" },
    { code: "LGW", ar: "لندن جاتويك", en: "London Gatwick", country: "بريطانيا" },
    { code: "MAN", ar: "مانشستر", en: "Manchester", country: "بريطانيا" },
    { code: "CDG", ar: "باريس", en: "Paris CDG", country: "فرنسا" },
    { code: "ORY", ar: "باريس أورلي", en: "Paris Orly", country: "فرنسا" },
    { code: "FRA", ar: "فرانكفورت", en: "Frankfurt", country: "ألمانيا" },
    { code: "MUC", ar: "ميونخ", en: "Munich", country: "ألمانيا" },
    { code: "BER", ar: "برلين", en: "Berlin", country: "ألمانيا" },
    { code: "AMS", ar: "أمستردام", en: "Amsterdam", country: "هولندا" },
    { code: "BRU", ar: "بروكسل", en: "Brussels", country: "بلجيكا" },
    { code: "MAD", ar: "مدريد", en: "Madrid", country: "إسبانيا" },
    { code: "BCN", ar: "برشلونة", en: "Barcelona", country: "إسبانيا" },
    { code: "FCO", ar: "روما", en: "Rome", country: "إيطاليا" },
    { code: "MXP", ar: "ميلانو", en: "Milan", country: "إيطاليا" },
    { code: "VIE", ar: "فيينا", en: "Vienna", country: "النمسا" },
    { code: "ZRH", ar: "زيورخ", en: "Zurich", country: "سويسرا" },
    { code: "GVA", ar: "جنيف", en: "Geneva", country: "سويسرا" },
    { code: "ATH", ar: "أثينا", en: "Athens", country: "اليونان" },
    { code: "WAW", ar: "وارسو", en: "Warsaw", country: "بولندا" },
    { code: "SVO", ar: "موسكو", en: "Moscow", country: "روسيا" },
    // Asia
    { code: "KUL", ar: "كوالالمبور", en: "Kuala Lumpur", country: "ماليزيا" },
    { code: "SIN", ar: "سنغافورة", en: "Singapore", country: "سنغافورة" },
    { code: "BKK", ar: "بانكوك", en: "Bangkok", country: "تايلاند" },
    { code: "DPS", ar: "بالي", en: "Bali", country: "إندونيسيا" },
    { code: "CGK", ar: "جاكرتا", en: "Jakarta", country: "إندونيسيا" },
    { code: "MNL", ar: "مانيلا", en: "Manila", country: "الفلبين" },
    { code: "HND", ar: "طوكيو هانيدا", en: "Tokyo Haneda", country: "اليابان" },
    { code: "NRT", ar: "طوكيو ناريتا", en: "Tokyo Narita", country: "اليابان" },
    { code: "ICN", ar: "سيول", en: "Seoul", country: "كوريا" },
    { code: "PEK", ar: "بكين", en: "Beijing", country: "الصين" },
    { code: "PVG", ar: "شنغهاي", en: "Shanghai", country: "الصين" },
    { code: "HKG", ar: "هونغ كونغ", en: "Hong Kong", country: "هونغ كونغ" },
    { code: "BOM", ar: "مومباي", en: "Mumbai", country: "الهند" },
    { code: "DEL", ar: "دلهي", en: "Delhi", country: "الهند" },
    { code: "BLR", ar: "بنغالور", en: "Bangalore", country: "الهند" },
    { code: "MAA", ar: "تشيناي", en: "Chennai", country: "الهند" },
    { code: "KHI", ar: "كراتشي", en: "Karachi", country: "باكستان" },
    { code: "ISB", ar: "إسلام آباد", en: "Islamabad", country: "باكستان" },
    { code: "LHE", ar: "لاهور", en: "Lahore", country: "باكستان" },
    { code: "DAC", ar: "دكا", en: "Dhaka", country: "بنغلاديش" },
    { code: "CMB", ar: "كولومبو", en: "Colombo", country: "سريلانكا" },
    { code: "MLE", ar: "ماليه", en: "Maldives", country: "المالديف" },
    // Africa
    { code: "ADD", ar: "أديس أبابا", en: "Addis Ababa", country: "إثيوبيا" },
    { code: "NBO", ar: "نيروبي", en: "Nairobi", country: "كينيا" },
    { code: "JNB", ar: "جوهانسبرغ", en: "Johannesburg", country: "جنوب أفريقيا" },
    { code: "CPT", ar: "كيب تاون", en: "Cape Town", country: "جنوب أفريقيا" },
    { code: "LOS", ar: "لاغوس", en: "Lagos", country: "نيجيريا" },
    // Americas
    { code: "JFK", ar: "نيويورك JFK", en: "New York JFK", country: "أمريكا" },
    { code: "LAX", ar: "لوس أنجلوس", en: "Los Angeles", country: "أمريكا" },
    { code: "ORD", ar: "شيكاغو", en: "Chicago", country: "أمريكا" },
    { code: "MIA", ar: "ميامي", en: "Miami", country: "أمريكا" },
    { code: "IAD", ar: "واشنطن", en: "Washington DC", country: "أمريكا" },
    { code: "YYZ", ar: "تورنتو", en: "Toronto", country: "كندا" },
    { code: "YUL", ar: "مونتريال", en: "Montreal", country: "كندا" },
    { code: "GRU", ar: "ساو باولو", en: "Sao Paulo", country: "البرازيل" },
    // Oceania
    { code: "SYD", ar: "سيدني", en: "Sydney", country: "أستراليا" },
    { code: "MEL", ar: "ملبورن", en: "Melbourne", country: "أستراليا" },
];

function AirportPicker({ label, value, onChange, testid }) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const selected = AIRPORTS.find((a) => a.code === value);
    const filtered = useMemo(() => {
        if (!q) return AIRPORTS;
        const Q = q.trim().toLowerCase();
        return AIRPORTS.filter((a) =>
            a.code.toLowerCase().includes(Q) ||
            a.ar.includes(q) ||
            a.en.toLowerCase().includes(Q) ||
            a.country.includes(q)
        ).slice(0, 50);
    }, [q]);

    return (
        <div className="relative">
            <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {label}</label>
            <button
                type="button"
                data-testid={testid}
                onClick={() => setOpen((o) => !o)}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body text-start flex items-center justify-between gap-2"
            >
                <span className="truncate">{selected ? `${selected.ar} (${selected.code})` : "اختر المطار"}</span>
                <span className="text-[var(--text-muted)] text-xs">{selected?.country}</span>
            </button>
            {open && (
                <div className="absolute z-30 mt-1 w-full bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-[var(--border)] flex items-center gap-2">
                        <Search className="w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={tr("ابحث عن مدينة أو مطار أو رمز IATA...")}
                            className="flex-1 bg-transparent outline-none text-sm font-arabic-body text-[var(--text)]"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[var(--text-muted)] font-arabic-body">{tr("لم نجد نتائج. جرّب رمز IATA (مثل: RUH, DXB)")}</div>
                        ) : filtered.map((a) => (
                            <button
                                key={a.code}
                                type="button"
                                data-testid={`airport-opt-${a.code}`}
                                onClick={() => { onChange(a.code); setOpen(false); setQ(""); }}
                                className={`w-full text-start px-3 py-2 hover:bg-[var(--surface-elevated)] flex items-center justify-between gap-2 ${a.code === value ? "bg-[var(--primary)]/10" : ""}`}
                            >
                                <div className="min-w-0">
                                    <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{a.ar} <span className="text-[var(--text-muted)] text-xs">({a.code})</span></div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-arabic-body truncate">{a.en} • {a.country}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FlightsPage() {
    const [from, setFrom] = useState("RUH");
    const [to, setTo] = useState("DXB");
    const [date, setDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [pax, setPax] = useState(1);
    const [tripType, setTripType] = useState("oneway");

    const buildLinks = () => {
        const yymmdd = (d) => d.replace(/-/g, "").slice(2);
        const dDay = date ? yymmdd(date) : "";
        const rDay = returnDate ? yymmdd(returnDate) : "";
        // YYYY-MM-DD format for Wego/Kayak
        return {
            skyscanner: `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${dDay}${tripType === "round" && rDay ? `/${rDay}` : ""}/?adults=${pax}&currency=SAR&utm_source=harajplus`,
            wego: `https://www.wego.com/flights/searches/${from}-${to}${tripType === "round" && returnDate ? `-${returnDate}` : ""}-${date}/economy/${pax}adults`,
            kayak: `https://www.kayak.com/flights/${from}-${to}/${date}${tripType === "round" && returnDate ? `/${returnDate}` : ""}/${pax}adults?currency=SAR`,
            googleFlights: `https://www.google.com/travel/flights?q=Flights%20to%20${to}%20from%20${from}%20on%20${date}${tripType === "round" && returnDate ? `%20returning%20${returnDate}` : ""}`,
        };
    };

    const search = (provider) => {
        if (!from || !to || !date) { alert(tr("الرجاء اختيار المطار والتاريخ")); return; }
        if (from === to) { alert(tr("لا يمكن أن يكون مطار المغادرة والوصول متشابهين")); return; }
        const links = buildLinks();
        window.open(links[provider], "_blank");
    };

    const PROVIDERS = [
        { key: "trip", name: "Trip.com", color: "from-[#287DFA] to-[#0F58D6]", icon: "🌐" },
        { key: "skyscanner", name: "Skyscanner", color: "from-sky-500 to-sky-700", icon: "✈️" },
        { key: "wego", name: "Wego", color: "from-emerald-500 to-emerald-700", icon: "🌍" },
        { key: "kayak", name: "Kayak", color: "from-orange-500 to-orange-700", icon: "🛫" },
        { key: "googleFlights", name: "Google Flights", color: "from-blue-500 to-blue-700", icon: "🔍" },
    ];

    // Trip.com affiliate link (replace from your dashboard if needed)
    const TRIP_AFFILIATE = "https://www.trip.com/t/AYKu00NZbU2";
    const TRIP_SEARCHBOX_URL = "https://www.trip.com/partners/ad/S16696136?Allianceid=8199633&SID=309959147&trip_sub1=alhraj";

    const buildLinksWithTrip = () => {
        const base = buildLinks();
        // Build trip.com deep link with our affiliate (fallback to standard search)
        const tripDeep = `https://www.trip.com/flights/showfarefirst?dcity=${from}&acity=${to}&ddate=${date || ""}${tripType === "round" && returnDate ? `&rdate=${returnDate}` : ""}&triptype=${tripType === "round" ? "rt" : "ow"}&class=y&quantity=${pax}&Allianceid=8199633&SID=309959147&trip_sub1=alhraj`;
        return { ...base, trip: tripDeep };
    };
    const searchTrip = (provider) => {
        if (provider === "trip") {
            // If user provided dates, deep-link; else open generic affiliate
            if (from && to && date) {
                window.open(buildLinksWithTrip().trip, "_blank");
            } else {
                window.open(TRIP_AFFILIATE, "_blank");
            }
            return;
        }
        search(provider);
    };

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="bg-gradient-to-br from-[var(--primary)]/15 via-[var(--secondary)]/5 to-[var(--accent)]/10 rounded-3xl p-5 sm:p-8 border border-[var(--primary)]/30 mb-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-72 h-72 bg-[var(--primary)]/15 rounded-full blur-3xl"></div>
                <div className="relative flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-lg">
                        <Plane className="w-6 h-6 text-[var(--primary-fg)]" />
                    </div>
                    <div>
                        <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)]">{tr("احجز رحلتك")}</h1>
                        <p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("قارن أسعار 4 محركات بحث عالمية في ضغطة واحدة")}</p>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] space-y-4">
                <div className="flex gap-2">
                    <button data-testid="trip-oneway" onClick={() => setTripType("oneway")} className={`flex-1 py-2.5 rounded-full text-sm font-arabic font-bold ${tripType === "oneway" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("ذهاب فقط")}</button>
                    <button data-testid="trip-round" onClick={() => setTripType("round")} className={`flex-1 py-2.5 rounded-full text-sm font-arabic font-bold ${tripType === "round" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("ذهاب وعودة")}</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AirportPicker label={tr("من")} value={from} onChange={setFrom} testid="flight-from" />
                    <AirportPicker label={tr("إلى")} value={to} onChange={setTo} testid="flight-to" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{tr(" تاريخ الذهاب")}</label>
                        <input data-testid="flight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                    </div>
                    {tripType === "round" ? (
                        <div>
                            <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{tr(" تاريخ العودة")}</label>
                            <input data-testid="flight-return" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={date || new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" />{tr(" المسافرون")}</label>
                            <input data-testid="flight-pax" type="number" min={1} max={9} value={pax} onChange={(e) => setPax(parseInt(e.target.value) || 1)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                        </div>
                    )}
                </div>
                {tripType === "round" && (
                    <div>
                        <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" />{tr(" عدد المسافرين")}</label>
                        <input data-testid="flight-pax" type="number" min={1} max={9} value={pax} onChange={(e) => setPax(parseInt(e.target.value) || 1)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                    </div>
                )}

                <div className="border-t border-[var(--border)] pt-4">
                    <p className="text-xs font-arabic font-bold text-[var(--text)] mb-2 flex items-center gap-1.5"><Globe className="w-4 h-4 text-[var(--primary)]" />{tr(" ابحث في:")}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {PROVIDERS.map((p) => (
                            <button
                                key={p.key}
                                data-testid={`flight-search-${p.key}`}
                                onClick={() => searchTrip(p.key)}
                                className={`bg-gradient-to-r ${p.color} text-white py-3 rounded-xl font-arabic font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow ${p.key === "trip" ? "col-span-2 ring-2 ring-[#287DFA]/40" : ""}`}
                            >
                                <span>{p.icon}</span> {p.name}
                                {p.key === "trip" && <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">⭐ موصى به</span>}
                                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Trip.com Embedded SearchBox (interactive form within iframe) */}
                <div className="border-t border-[var(--border)] pt-4">
                    <p className="text-xs font-arabic font-bold text-[var(--text)] mb-2 flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-[#287DFA]" /> {tr("صندوق بحث Trip.com المباشر")}
                    </p>
                    <div className="flex justify-center bg-gradient-to-br from-[#287DFA]/5 to-[#0F58D6]/10 rounded-2xl p-3 overflow-hidden">
                        <iframe
                            data-testid="trip-searchbox-iframe"
                            title="Trip.com Search"
                            src={TRIP_SEARCHBOX_URL}
                            width="320"
                            height="480"
                            scrolling="no"
                            frameBorder="0"
                            id="S16696136"
                            style={{ border: "none", maxWidth: "100%" }}
                        />
                    </div>
                </div>

                <p className="text-[10px] text-[var(--text-muted)] font-arabic-body text-center pt-2 border-t border-[var(--border)]">
                    🤝 الحراج بلس وسيط فقط • النتائج والأسعار من المحركات أعلاه مباشرة • أكثر من 1,200 شركة طيران
                </p>
            </div>
        </div>
    );
}
