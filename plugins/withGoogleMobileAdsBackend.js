const { withGradleProperties } = require('expo/config-plugins');

/**
 * Works around a react-native-google-mobile-ads 17.2 Android build failure in Expo projects:
 * "Cannot get property 'googleMobileAdsJson' on extra properties extension". Its app-json.gradle
 * only defines that property when app.json has a root-level "react-native-google-mobile-ads" key
 * (Expo apps configure it through the plugin instead, and the fallback branch sets a misspelled
 * `googleAdsJson`). Pinning the backend property, to the library's own default, skips the lookup.
 * Remove once the library guards that read.
 */
module.exports = function withGoogleMobileAdsBackend(config) {
  return withGradleProperties(config, (c) => {
    c.modResults = c.modResults.filter((p) => !(p.type === 'property' && p.key === 'RNGMA_ANDROID_BACKEND'));
    c.modResults.push({ type: 'property', key: 'RNGMA_ANDROID_BACKEND', value: 'classic' });
    return c;
  });
};
