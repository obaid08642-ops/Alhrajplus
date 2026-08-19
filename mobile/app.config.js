const base = require("./app.json");

function mergePlugins(...groups) {
  const unique = new Map();
  for (const plugin of groups.flat()) {
    if (!plugin) continue;
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    if (typeof name === "string") unique.set(name, plugin);
  }
  return [...unique.values()];
}

module.exports = ({ config }) => ({
  ...base.expo,
  ...config,
  // react-native-webrtc brings native iOS/Android code and therefore requires
  // a development or production build rather than Expo Go. Keep the plugin in
  // the effective dynamic config, not only app.json, so prebuild sees it.
  plugins: mergePlugins(
    base.expo.plugins || [],
    config?.plugins || [],
    [["@config-plugins/react-native-webrtc", {
      microphonePermission: "يستخدم التطبيق الميكروفون لإجراء المكالمات الصوتية والرسائل الصوتية"
    }]]
  ),
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
//
// The store URLs intentionally default to empty: the UI remains usable and
// displays a disabled CTA until the real published-store links are supplied.
