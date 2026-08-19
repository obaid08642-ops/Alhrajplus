const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Keeps Arabic UI copy while guaranteeing that rendered numeric glyphs remain
 * Latin 0-9. This is presentation-only: numeric values and locale-specific
 * punctuation stay unchanged.
 */
export function toLatinDigits(value) {
  return String(value ?? "").replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = EASTERN_ARABIC_DIGITS.indexOf(digit);
    if (arabicIndex >= 0) return String(arabicIndex);
    return String(PERSIAN_DIGITS.indexOf(digit));
  });
}

function deviceLocale() {
  try {
    return Intl?.DateTimeFormat?.().resolvedOptions?.().locale || undefined;
  } catch (_) {
    return undefined;
  }
}

function patchNumberLocaleMethod(prototype, method) {
  const original = prototype?.[method];
  if (typeof original !== "function" || original.__hpLatinDigitsPatched) return;
  const wrapped = function patchedNumberLocaleMethod(...args) {
    return toLatinDigits(original.apply(this, args));
  };
  Object.defineProperty(wrapped, "__hpLatinDigitsPatched", { value: true });
  try {
    Object.defineProperty(prototype, method, { configurable: true, writable: true, value: wrapped });
  } catch (_) {
    // A locked runtime simply retains its native formatting; explicit helpers
    // can still use toLatinDigits at individual call sites.
  }
}

function patchGregorianDateLocaleMethod(prototype, method) {
  const original = prototype?.[method];
  if (typeof original !== "function" || original.__hpGregorianDatePatched) return;
  const wrapped = function patchedGregorianDateLocaleMethod(_locales, options) {
    // Keep the device's ordering and punctuation, but always use Gregorian dates
    // and Latin digits. This avoids Hijri output even on an Arabic device whose
    // system calendar is set to Islamic.
    const safeOptions = options && typeof options === "object" ? options : {};
    const formatted = original.call(this, deviceLocale(), {
      ...safeOptions,
      calendar: "gregory",
      numberingSystem: "latn",
    });
    return toLatinDigits(formatted);
  };
  Object.defineProperty(wrapped, "__hpGregorianDatePatched", { value: true });
  try {
    Object.defineProperty(prototype, method, { configurable: true, writable: true, value: wrapped });
  } catch (_) {
    // A locked runtime simply retains its native formatting.
  }
}

/** Installs once before the app renders, covering all existing locale callers. */
export function installLatinDigitsPolicy() {
  if (globalThis.__hpLatinDigitsPolicyInstalled) return;
  globalThis.__hpLatinDigitsPolicyInstalled = true;
  patchNumberLocaleMethod(Number.prototype, "toLocaleString");
  patchGregorianDateLocaleMethod(Date.prototype, "toLocaleString");
  patchGregorianDateLocaleMethod(Date.prototype, "toLocaleDateString");
  patchGregorianDateLocaleMethod(Date.prototype, "toLocaleTimeString");
}
