import { Plane, MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// Cities supported (will expand)
const CITIES = ["RUH", "JED", "DXB", "AUH", "DOH", "KWI", "BAH", "MCT", "CAI", "IST", "LON", "PAR", "NYC"];
const CITY_NAMES = {
    RUH: "الرياض", JED: "جدة", DXB: "دبي", AUH: "أبوظبي", DOH: "الدوحة",
    KWI: "الكويت", BAH: "البحرين", MCT: "مسقط", CAI: "القاهرة", IST: "إسطنبول",
    LON: "لندن", PAR: "باريس", NYC: "نيويورك"
};

export default function FlightsPage() {
    const [from, setFrom] = useState("RUH");
    const [to, setTo] = useState("DXB");
    const [date, setDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [pax, setPax] = useState(1);
    const [tripType, setTripType] = useState("oneway");

    // Real implementation: redirect to Skyscanner Affiliate (free) with our params
    const search = () => {
        if (!from || !to || !date) { alert("الرجاء تعبئة المطار والتاريخ"); return; }
        const skyUrl = `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${date.replace(/-/g, "").slice(2)}${tripType === "round" && returnDate ? `/${returnDate.replace(/-/g, "").slice(2)}` : ""}/?adults=${pax}&currency=SAR&utm_source=harajplus`;
        window.open(skyUrl, "_blank");
    };

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="bg-gradient-to-br from-[var(--primary)]/15 via-[var(--secondary)]/5 to-[var(--accent)]/10 rounded-3xl p-5 sm:p-8 border border-[var(--primary)]/30 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-72 h-72 bg-[var(--primary)]/15 rounded-full blur-3xl"></div>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center shrink-0">
                            <Plane className="w-6 h-6 text-[var(--primary-fg)]" />
                        </div>
                        <div>
                            <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)]">احجز رحلتك</h1>
                            <p className="text-xs text-[var(--text-muted)] font-arabic-body">قارن أسعار آلاف شركات الطيران ووفّر حتى 60%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] space-y-4">
                <div className="flex gap-2">
                    <button data-testid="trip-oneway" onClick={() => setTripType("oneway")} className={`flex-1 py-2 rounded-full text-xs font-arabic font-bold ${tripType === "oneway" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>ذهاب فقط</button>
                    <button data-testid="trip-round" onClick={() => setTripType("round")} className={`flex-1 py-2 rounded-full text-xs font-arabic font-bold ${tripType === "round" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>ذهاب وعودة</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FlightSelect icon={MapPin} label="من" value={from} onChange={setFrom} testid="flight-from" />
                    <FlightSelect icon={MapPin} label="إلى" value={to} onChange={setTo} testid="flight-to" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> تاريخ الذهاب</label>
                        <input data-testid="flight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                    </div>
                    {tripType === "round" && (
                        <div>
                            <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5">تاريخ العودة</label>
                            <input data-testid="flight-return" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                        </div>
                    )}
                    <div className={tripType === "round" ? "col-span-2" : ""}>
                        <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> عدد المسافرين</label>
                        <input data-testid="flight-pax" type="number" min={1} max={9} value={pax} onChange={(e) => setPax(parseInt(e.target.value) || 1)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                    </div>
                </div>

                <button data-testid="flight-search-btn" onClick={search} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] py-3 rounded-xl font-arabic font-bold text-sm flex items-center justify-center gap-2">
                    <Plane className="w-4 h-4" /> ابحث عن أفضل الأسعار
                </button>

                <p className="text-[10px] text-[var(--text-muted)] font-arabic-body text-center">
                    🤝 شراكة معتمدة مع Skyscanner • لا نخزن بيانات الدفع • النتائج من أكثر من 1,200 شركة طيران
                </p>
            </div>
        </div>
    );
}

function FlightSelect({ icon: Icon, label, value, onChange, testid }) {
    return (
        <div>
            <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1.5 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</label>
            <select data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body">
                {CITIES.map((c) => <option key={c} value={c}>{CITY_NAMES[c]} ({c})</option>)}
            </select>
        </div>
    );
}
