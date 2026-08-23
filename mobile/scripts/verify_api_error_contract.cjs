const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");

const apiPath = path.join(__dirname, "..", "src", "api.js");
const source = fs.readFileSync(apiPath, "utf8");
const transformed = transformSync(source, {
  filename: apiPath,
  presets: [require.resolve("babel-preset-expo")],
}).code;

const storage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
const secureStore = { isAvailableAsync: async () => false, getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} };
const axiosClient = {
  interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  get: async () => ({ data: {} }), post: async () => ({ data: {} }),
};
const axios = { create: () => axiosClient };

function mockedRequire(id) {
  if (id === "axios") return { __esModule: true, default: axios };
  if (id === "expo-constants") return { __esModule: true, default: {} };
  if (id === "@react-native-async-storage/async-storage") return { __esModule: true, default: storage };
  if (id === "expo-secure-store") return secureStore;
  if (id === "./I18nContext") return { tr: (key) => key };
  return require(id);
}

const moduleUnderTest = { exports: {} };
new Function("require", "module", "exports", transformed)(mockedRequire, moduleUnderTest, moduleUnderTest.exports);
const { getApiErrorContract, formatApiError } = moduleUnderTest.exports;

const payment = getApiErrorContract({ response: { status: 402, data: { offer: "must-not-be-displayed" }, headers: {} } });
assert.equal(payment.kind, "payment_required");
assert.equal(payment.paymentRequired, true);
assert.equal(payment.retryable, false);
assert.equal(formatApiError({ response: { status: 402, data: { offer: "must-not-be-displayed" }, headers: {} } }), "هذه العملية تتطلب تفويض دفع من الخدمة.");

const auth = getApiErrorContract({ response: { status: 401, data: {}, headers: { "www-authenticate": "Bearer realm=haraj" } } });
assert.equal(auth.kind, "authentication_required");
assert.equal(auth.requiresSignIn, true);

const throttled = getApiErrorContract({ response: { status: 429, data: {}, headers: { "retry-after": "30" } } });
assert.equal(throttled.kind, "rate_limited");
assert.equal(throttled.retryable, true);
assert.equal(throttled.retryAfterSeconds, 30);

const offline = getApiErrorContract(new Error("offline"));
assert.equal(offline.kind, "network_unavailable");
assert.equal(offline.retryable, true);

const i18nSource = fs.readFileSync(path.join(__dirname, "..", "src", "I18nContext.js"), "utf8");
[
  "هذه العملية تتطلب تفويض دفع من الخدمة.",
  "انتهت جلسة الدخول. سجل الدخول ثم أعد المحاولة.",
  "ليس لديك صلاحية لإتمام هذه العملية.",
  "تمت محاولات كثيرة. أعد المحاولة بعد قليل.",
  "الخدمة غير متاحة مؤقتًا. أعد المحاولة لاحقًا.",
  "تعذر الاتصال بالخدمة. تحقق من الإنترنت ثم أعد المحاولة.",
].forEach((key) => {
  assert.ok(i18nSource.includes(`\"${key}\"`), `missing shared translation key: ${key}`);
});
["en:", "ur:", "hi:", "bn:", "fr:"].forEach((language) => {
  assert.ok(i18nSource.includes(language), `missing supported language marker: ${language}`);
});

console.log("Mobile API error contract: all assertions passed.");
