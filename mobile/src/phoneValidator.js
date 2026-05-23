// Lightweight per-country phone validation for the mobile app.
// Pure regex — no external deps, no PII sent over the network.
// Returns { ok: boolean, normalized?: string, error?: string }.

const RULES = {
    // Saudi Arabia: 9 digits starting with 5 (mobile) OR full 0XXXXXXXXX
    SA: { len: [9, 10], re: /^(0?5\d{8})$/, label: "+966 5XXXXXXXX" },
    // UAE: 9 digits starting with 5 (mobile)
    AE: { len: [9, 10], re: /^(0?5\d{8})$/, label: "+971 5XXXXXXXX" },
    // Egypt: 10 digits starting with 10/11/12/15
    EG: { len: [10, 11], re: /^(0?1[0125]\d{8})$/, label: "+20 1XXXXXXXXX" },
    // Kuwait: 8 digits starting with 5/6/9
    KW: { len: [8], re: /^[569]\d{7}$/, label: "+965 XXXXXXXX" },
    // Qatar: 8 digits starting with 3/5/6/7
    QA: { len: [8], re: /^[3567]\d{7}$/, label: "+974 XXXXXXXX" },
    // Bahrain: 8 digits starting with 3/6
    BH: { len: [8], re: /^[36]\d{7}$/, label: "+973 XXXXXXXX" },
    // Oman: 8 digits starting with 7/9
    OM: { len: [8], re: /^[79]\d{7}$/, label: "+968 XXXXXXXX" },
};

export function validatePhone(rawPhone, countryCode = "SA") {
    const digits = String(rawPhone || "").replace(/\D/g, "");
    if (!digits) return { ok: false, error: "أدخل رقم الجوال" };
    const rule = RULES[countryCode];
    if (!rule) {
        // Fallback: 6-15 digits per ITU E.164 baseline.
        if (digits.length < 6 || digits.length > 15) {
            return { ok: false, error: "رقم غير صحيح" };
        }
        return { ok: true, normalized: digits };
    }
    if (!rule.len.includes(digits.length)) {
        return { ok: false, error: `رقم غير صحيح — مثال: ${rule.label}` };
    }
    if (!rule.re.test(digits)) {
        return { ok: false, error: `رقم غير صحيح — مثال: ${rule.label}` };
    }
    // Strip leading 0 to produce a clean national subscriber number.
    return { ok: true, normalized: digits.replace(/^0/, "") };
}

export function phoneExampleFor(countryCode = "SA") {
    return RULES[countryCode]?.label || "";
}
