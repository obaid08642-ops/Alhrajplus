const { withAndroidManifest } = require("@expo/config-plugins");

const CALLKEEP_SERVICE = "io.wazo.callkeep.VoiceConnectionService";
const REQUIRED_PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE_MICROPHONE",
  "android.permission.FOREGROUND_SERVICE_PHONE_CALL",
];

/**
 * The community CallKeep plugin registers the ConnectionService with its
 * upstream default label ("Wazo"). Replace it with the application's own
 * string resource and declare Android 14 foreground-service permissions.
 */
module.exports = function withCallKeepBranding(config) {
  return withAndroidManifest(config, manifestConfig => {
    const manifest = manifestConfig.modResults.manifest;
    const permissions = manifest["uses-permission"] || (manifest["uses-permission"] = []);
    for (const permission of REQUIRED_PERMISSIONS) {
      if (!permissions.some(item => item?.$?.["android:name"] === permission)) {
        permissions.push({ $: { "android:name": permission } });
      }
    }

    const application = manifest.application?.[0];
    const services = application?.service || [];
    const callKeepService = services.find(item => item?.$?.["android:name"] === CALLKEEP_SERVICE);
    if (callKeepService?.$) {
      callKeepService.$["android:label"] = "@string/app_name";
      callKeepService.$["android:foregroundServiceType"] = "phoneCall|microphone";
    }
    return manifestConfig;
  });
};
