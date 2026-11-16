const { withAndroidStyles } = require('expo/config-plugins');

/**
 * Google Play flags `android:statusBarColor` / `android:navigationBarColor` as deprecated
 * edge-to-edge parameters on Android 15+. The app is already edge-to-edge (system bars are
 * transparent), so these theme attributes are redundant. Strip them from every style.
 */
const DEPRECATED = new Set(['android:statusBarColor', 'android:navigationBarColor']);

module.exports = function withoutDeprecatedBarColors(config) {
  return withAndroidStyles(config, (c) => {
    for (const style of c.modResults.resources.style ?? []) {
      if (Array.isArray(style.item)) {
        style.item = style.item.filter((item) => !DEPRECATED.has(item.$?.name));
      }
    }
    return c;
  });
};
