const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toLatinDigits(value) {
  return String(value ?? "").replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = EASTERN_ARABIC_DIGITS.indexOf(digit);
    if (arabicIndex >= 0) return String(arabicIndex);
    return String(PERSIAN_DIGITS.indexOf(digit));
  });
}

function patchLocaleMethod(prototype, method) {
  const original = prototype?.[method];
  if (typeof original !== "function" || original.__hpLatinDigitsPatched) return;
  const wrapped = function patchedLocaleMethod(...args) {
    return toLatinDigits(original.apply(this, args));
  };
  Object.defineProperty(wrapped, "__hpLatinDigitsPatched", { value: true });
  try {
    Object.defineProperty(prototype, method, { configurable: true, writable: true, value: wrapped });
  } catch (_) {}
}

/** Installs before the navigation tree mounts and covers legacy formatters too. */
export function installLatinDigitsPolicy() {
  if (globalThis.__hpLatinDigitsPolicyInstalled) return;
  globalThis.__hpLatinDigitsPolicyInstalled = true;
  patchLocaleMethod(Number.prototype, "toLocaleString");
  patchLocaleMethod(Date.prototype, "toLocaleString");
  patchLocaleMethod(Date.prototype, "toLocaleDateString");
  patchLocaleMethod(Date.prototype, "toLocaleTimeString");
}
