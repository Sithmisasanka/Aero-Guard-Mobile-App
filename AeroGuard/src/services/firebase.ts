// Firebase initialization (read config from environment)
// Put the variables into a .env file (see .env.example) and restart Expo.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage, { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
const extra = (Constants.expoConfig as Record<string, any>)?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: extra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  databaseURL: extra.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? '',
  projectId: extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: extra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: extra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: extra.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: extra.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? undefined,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('[firebase] Missing EXPO_PUBLIC_FIREBASE_* env vars — Firebase will not initialize until configured.');
  console.warn('Current config:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING'
  });
}

let firebaseApp: any = null;
let auth: any = null;
let firestoreInstance: any = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  console.log('Initializing Firebase with project:', firebaseConfig.projectId);
  
  if (!getApps().length) {
    console.log('Creating new Firebase app...');
    firebaseApp = initializeApp(firebaseConfig);
    
    // Initialize Auth with persistence
    try {
      // For React Native, initialize auth with AsyncStorage persistence
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        console.log('Initializing Auth for React Native with AsyncStorage persistence...');
        auth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
        console.log('Firebase Auth initialized with AsyncStorage persistence');
      } else {
        // Web environment
        console.log('Initializing Auth for Web...');
        auth = getAuth(firebaseApp);
      }
      console.log('Firebase Auth initialized successfully');
    } catch (error: any) {
      // If auth is already initialized or setup fails, get basic auth
      if (error.code === 'auth/already-initialized') {
        console.log('Firebase Auth already initialized, getting existing instance');
        auth = getAuth(firebaseApp);
      } else {
        console.warn('Failed to initialize Firebase Auth with persistence, falling back to basic auth:', error);
        console.log('Initializing basic Auth...');
        auth = getAuth(firebaseApp); // Fallback to basic auth
      }
    }
  } else {
    console.log('Using existing Firebase app...');
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
  }
} else {
  console.error('Firebase configuration incomplete. Cannot initialize.');
}

// Analytics: initialize only if supported (web)
let analytics: any = null;
(async () => {
  try {
    if (firebaseApp && typeof window !== 'undefined' && (await analyticsSupported())) {
      analytics = getAnalytics(firebaseApp);
    }
  } catch (e) {
    // ignore - analytics optional
  }
})();

export const db: any = firebaseApp ? getFirestore(firebaseApp) : null;
export { auth };
export default firebaseApp;

// Try to initialize Firestore with React Native-friendly settings if possible
if (firebaseApp) {
  try {
    console.log('Initializing Firestore with experimentalForceLongPolling to avoid WebChannel transport errors on RN');
    firestoreInstance = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    } as any);
    console.log('Firestore initialized with experimentalForceLongPolling');
  } catch (e) {
    console.warn('initializeFirestore failed, falling back to getFirestore():', (e as any)?.message || e);
    try {
      firestoreInstance = getFirestore(firebaseApp);
    } catch (err) {
      console.error('Failed to get Firestore instance:', err);
      firestoreInstance = null;
    }
  }
} else {
  firestoreInstance = null;
}

// Export the instance we actually initialized
export const firestore = firestoreInstance;
function getReactNativePersistence(AsyncStorage: AsyncStorageStatic): import("@firebase/auth").Persistence | import("@firebase/auth").Persistence[] | undefined {
  throw new Error('Function not implemented.');
}

