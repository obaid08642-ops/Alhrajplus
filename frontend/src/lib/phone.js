/**
 * Phone helpers — normalize seller phone numbers so tel:/wa.me links never get
 * mangled with duplicate country codes or stray characters.
 */

/** Returns the phone as plain digits with a single leading + (e.g. "+966501234567"). */
export function normalizePhone(raw) {
    if (!raw) return "";
    let s = String(raw).trim();
    // Strip whitespace, dashes, parens, dots
    s = s.replace(/[\s\-().]/g, "");
    // Remove ALL non-digit chars except a leading +
    const hasPlus = s.startsWith("+");
    s = s.replace(/[^\d]/g, "");
    if (!s) return "";
    // Drop leading zero(s) AFTER country code is normalized
    // If it starts with 00 → that's an international prefix, treat as +
    if (s.startsWith("00")) s = s.slice(2);
    // If single 0 leads, it's a local trunk prefix — drop it
    if (s.startsWith("0") && !hasPlus) s = s.slice(1);
    return "+" + s;
}

/** wa.me link expects digits only, no +. */
export function whatsappLink(rawPhone, message = "") {
    const norm = normalizePhone(rawPhone);
    if (!norm) return "";
    const digits = norm.replace(/^\+/, "");
    const m = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${digits}${m}`;
}

/** tel: link expects +countrycode + number. */
export function telLink(rawPhone) {
    const norm = normalizePhone(rawPhone);
    return norm ? `tel:${norm}` : "";
}
