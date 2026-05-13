/**
 * Phone helpers — production-grade normalizer that handles every edge case:
 * - User typed "0510510455" with country "SA" → "+966510510455"
 * - User typed "+966 0510510455" → "+966510510455" (strip 0 after country code)
 * - User typed "+9660510510455" → "+966510510455"
 * - User typed "00966510510455" (international prefix) → "+966510510455"
 * - User typed "966510510455" (no plus) → "+966510510455"
 * - User typed "+966+966510510455" (double country code) → "+966510510455"
 * - Arabic-Indic digits "٠٥١٠٥١٠٤٥٥" → ascii first, then normalized
 * - Egypt: "01006979399" + country "EG" (+20) → "+201006979399"
 * - UAE: "0501234567" + country "AE" (+971) → "+971501234567"
 */

// Known dial codes for the markets we support — used to detect duplicates
// and to choose the right country code when only the local number was provided.
const COUNTRY_DIAL = {
    SA: "966",  // Saudi Arabia
    AE: "971",  // UAE
    KW: "965",  // Kuwait
    QA: "974",  // Qatar
    BH: "973",  // Bahrain
    OM: "968",  // Oman
    EG: "20",   // Egypt
    JO: "962",  // Jordan
    IQ: "964",  // Iraq
    YE: "967",  // Yemen
    SY: "963",  // Syria
    LB: "961",  // Lebanon
    MA: "212",  // Morocco
    DZ: "213",  // Algeria
    TN: "216",  // Tunisia
    LY: "218",  // Libya
    SD: "249",  // Sudan
    PS: "970",  // Palestine
    US: "1",
    GB: "44",
    TR: "90",
    IN: "91",
    PK: "92",
};

const DIAL_CODES = Object.values(COUNTRY_DIAL)
    .sort((a, b) => b.length - a.length);  // longest first (greedy match)

// Convert Arabic-Indic / Persian digits to ASCII
const ARABIC_DIGIT_MAP = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

function digitsOnly(input) {
    let s = String(input || "");
    let out = "";
    for (const ch of s) {
        if (ch in ARABIC_DIGIT_MAP) out += ARABIC_DIGIT_MAP[ch];
        else if (ch >= "0" && ch <= "9") out += ch;
    }
    return out;
}

/**
 * Returns a normalized phone like "+966510510455" or "" if it can't be normalized.
 *
 * @param {string} raw   The phone number, in any messy format.
 * @param {string} [countryCode]  ISO-2 country code (SA/EG/...) of the user — used
 *                                only when the raw number has no detectable dial code.
 */
export function normalizePhone(raw, countryCode = "") {
    if (!raw) return "";
    let digits = digitsOnly(raw);
    if (!digits) return "";

    // Step 1: strip international "00" prefix
    while (digits.startsWith("00")) digits = digits.slice(2);

    // Step 2: strip ALL duplicate dial codes at the start (e.g. "966966...")
    let changed = true;
    while (changed) {
        changed = false;
        for (const dc of DIAL_CODES) {
            // If the number starts with the SAME dial code TWICE, drop one
            if (digits.startsWith(dc + dc)) {
                digits = digits.slice(dc.length);
                changed = true;
                break;
            }
        }
    }

    // Step 3: detect whether digits ALREADY start with a known dial code.
    let detectedDial = "";
    let local = digits;
    for (const dc of DIAL_CODES) {
        if (digits.startsWith(dc)) {
            // Heuristic: rest must be 6-12 digits (real phone numbers)
            const rest = digits.slice(dc.length);
            if (rest.length >= 6 && rest.length <= 12) {
                detectedDial = dc;
                local = rest;
                break;
            }
        }
    }

    // Step 4: if no dial code detected, fall back to the user's country code
    if (!detectedDial && countryCode) {
        const dc = COUNTRY_DIAL[String(countryCode).toUpperCase()];
        if (dc) {
            detectedDial = dc;
            // user typed local-only (with or without leading 0) — keep as is
        }
    }

    // Step 5: strip leading 0 from the local portion (trunk prefix, not part of E.164)
    while (local.startsWith("0")) local = local.slice(1);

    if (!detectedDial || !local) return "";
    return "+" + detectedDial + local;
}

/** wa.me link expects digits only, no + */
export function whatsappLink(rawPhone, message = "", countryCode = "") {
    const norm = normalizePhone(rawPhone, countryCode);
    if (!norm) return "";
    const digits = norm.replace(/^\+/, "");
    const m = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${digits}${m}`;
}

/** tel: link expects E.164 with + */
export function telLink(rawPhone, countryCode = "") {
    const norm = normalizePhone(rawPhone, countryCode);
    return norm ? `tel:${norm}` : "";
}

export { COUNTRY_DIAL };
