const base = require("./app.json");

module.exports = ({ config }) => ({
  ...base.expo,
  ...config,
  extra: {
    ...(base.expo.extra || {}),
    ...(config?.extra || {}),
    backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || base.expo.extra.backendUrl,
    appStoreUrl: process.env.EXPO_PUBLIC_APPSTORE_URL || "",
    playStoreUrl: process.env.EXPO_PUBLIC_PLAYSTORE_URL || "",
    appGalleryUrl: process.env.EXPO_PUBLIC_APPGALLERY_URL || "",
  },
});

// Required build-time variables:
// EXPO_PUBLIC_BACKEND_URL
// EXPO_PUBLIC_APPSTORE_URL
// EXPO_PUBLIC_PLAYSTORE_URL
// EXPO_PUBLIC_APPGALLERY_URL

// The store URLs intentionally default to empty: the UI remains usable and
// displays a disabled CTA until the real published-store links are supplied.
