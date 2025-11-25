// Dynamic Expo config to ensure native Google Maps API keys are injected
// and to keep the rest of your app.json config intact.
// This resolves cases where "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" remains a literal
// string in native files leading to blank maps.

// Load .env if present
require('dotenv/config');

/**
 * @param {{ config: import('@expo/config').ExpoConfig }} param0
 * @returns {import('@expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  const GOOGLE_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    config?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  const GEMINI_API_KEY =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    '';

  // If set, we'll rely on native icons (in android mipmap folders and iOS AppIcon set)
  // and avoid setting Expo's icon/adaptiveIcon to prevent overwriting.
  const USE_NATIVE_ICONS =
    process.env.EXPO_USE_NATIVE_ICONS === '1' || process.env.USE_NATIVE_ICONS === '1';

  return {
    // Start from the existing config (populated from app.json)
    ...config,

    extra: {
      ...(config.extra || {}),
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: GOOGLE_KEY,
      EXPO_PUBLIC_GEMINI_API_KEY: GEMINI_API_KEY,
      EXPO_USE_NATIVE_ICONS: USE_NATIVE_ICONS ? '1' : '0',
    },

    ios: {
      ...(config.ios || {}),
      // If not using native icons, set Expo icon path
      ...(USE_NATIVE_ICONS ? {} : { icon: './assets/icon.png' }),
      config: {
        ...((config.ios && config.ios.config) || {}),
        // Ensure the native AppDelegate gets the actual key
        googleMapsApiKey: GOOGLE_KEY,
      },
    },

    android: {
      ...(config.android || {}),
      // If not using native icons, set Expo icon/adaptiveIcon paths
      ...(USE_NATIVE_ICONS
        ? {}
        : {
            icon: './assets/icon.png',
            adaptiveIcon: {
              foregroundImage: './assets/adaptive-icon.png',
              backgroundColor: '#ffffff',
            },
          }),
      config: {
        ...((config.android && config.android.config) || {}),
        googleMaps: {
          apiKey: GOOGLE_KEY,
        },
      },
    },

    // Keep any existing plugins defined in app.json, but do not attempt to
    // add a react-native-maps config plugin here (react-native-maps does not
    // ship a config plugin named "react-native-maps"). The native keys above
    // are sufficient for prebuild/dev-client/EAS builds.
    plugins: [...(config.plugins || [])],
  };
};
