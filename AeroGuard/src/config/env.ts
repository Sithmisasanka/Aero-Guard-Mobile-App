// Centralized access to environment variables
// Expo SDK 54+: EXPO_PUBLIC_* variables are embedded at build time and
// available via process.env in the app runtime.

type Env = {
  EXPO_PUBLIC_APP_ENV: string | undefined;
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string | undefined;
  EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY: string | undefined;
  EXPO_PUBLIC_GEMINI_API_KEY: string | undefined;
  EXPO_PUBLIC_IQAIR_API_KEY: string | undefined;
  EXPO_PUBLIC_AQICN_API_TOKEN: string | undefined;
  EXPO_PUBLIC_DEFAULT_CITY: string | undefined;
  EXPO_PUBLIC_DEFAULT_COUNTRY: string | undefined;
  EXPO_PUBLIC_DEFAULT_LAT: string | undefined;
  EXPO_PUBLIC_DEFAULT_LNG: string | undefined;
  EXPO_PUBLIC_ENABLE_LOGGING: string | undefined;
  EXPO_PUBLIC_USE_MOCK_DATA: string | undefined;
  EXPO_PUBLIC_AQI_POLL_INTERVAL: string | undefined;
  EXPO_PUBLIC_AQI_MIN_FETCH_INTERVAL: string | undefined;
  EXPO_PUBLIC_MAP_PROVIDER: string | undefined;
  EXPO_PUBLIC_MAP_STYLE: string | undefined;
  EXPO_PUBLIC_FIREBASE_API_KEY: string | undefined;
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string | undefined;
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: string | undefined;
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: string | undefined;
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string | undefined;
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string | undefined;
  EXPO_PUBLIC_FIREBASE_APP_ID: string | undefined;
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string | undefined;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string | undefined;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: string | undefined;
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: string | undefined;
};

const env = (process.env as unknown) as Env;

export const AppEnv = {
  appEnv: env.EXPO_PUBLIC_APP_ENV ?? 'development',
  mapsKey: env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  airQualityKey: env.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY ?? '',
  geminiKey: env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
  iqairKey: env.EXPO_PUBLIC_IQAIR_API_KEY ?? '',
  aqicnToken: env.EXPO_PUBLIC_AQICN_API_TOKEN ?? '',
  defaults: {
    city: env.EXPO_PUBLIC_DEFAULT_CITY ?? 'Colombo',
    country: env.EXPO_PUBLIC_DEFAULT_COUNTRY ?? 'Sri Lanka',
    lat: parseFloat(env.EXPO_PUBLIC_DEFAULT_LAT ?? '6.9271'),
    lng: parseFloat(env.EXPO_PUBLIC_DEFAULT_LNG ?? '79.8612'),
  },
  flags: {
    logging: env.EXPO_PUBLIC_ENABLE_LOGGING === 'true',
    mockData: env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',
    mapProvider: env.EXPO_PUBLIC_MAP_PROVIDER ?? 'google',
    mapStyle: env.EXPO_PUBLIC_MAP_STYLE ?? 'standard',
  },
  intervals: {
    aqiPoll: parseInt(env.EXPO_PUBLIC_AQI_POLL_INTERVAL ?? '300000', 10),
    aqiMinFetch: parseInt(env.EXPO_PUBLIC_AQI_MIN_FETCH_INTERVAL ?? '60000', 10),
  },
  firebase: {
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    databaseURL: env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? '',
    projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
    measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
  },
  googleOAuth: {
    webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    androidClientId: env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  },
} as const;

// Minimal runtime assertion for production-critical keys when not using mock data
export function assertRequiredEnvForProduction() {
  const missing: string[] = [];
  if (!AppEnv.mapsKey) missing.push('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  if (!AppEnv.aqicnToken && !AppEnv.airQualityKey && !AppEnv.iqairKey) {
    missing.push('One of: EXPO_PUBLIC_AQICN_API_TOKEN | EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY | EXPO_PUBLIC_IQAIR_API_KEY');
  }
  if (missing.length) {
    console.warn('[Config] Missing env variables:', missing.join(', '));
  }
}
