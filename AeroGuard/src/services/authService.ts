import firebaseApp, { auth as firebaseAuth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged as fbOnAuthStateChanged, signOut as fbSignOut, updateProfile, signInWithCredential, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import * as userService from './userService';
import * as Google from 'expo-auth-session/providers/google';
import { OAuthProvider } from 'firebase/auth';
import { Platform } from 'react-native';

// Use the properly initialized auth from firebase.ts
const auth = firebaseAuth;

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  console.log('signUpWithEmail called with:', { email, displayName, passwordLength: password?.length });
  
  if (!auth) {
    console.error('Auth not initialized');
    throw new Error('Authentication service not initialized. Please check Firebase configuration.');
  }
  
  try {
    console.log('Creating user with Firebase...');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created successfully:', cred.user.uid);
    
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
        console.log('Display name updated');
      } catch (e) {
        console.warn('Failed to update display name:', e);
        // non-fatal
      }
    }
    
    // create profile in Firestore/local store
    const user = {
      id: cred.user.uid,
      name: displayName || cred.user.displayName || email.split('@')[0],
      email: cred.user.email || email,
      createdAt: Date.now(),
    } as any;
    
    console.log('Saving user profile...');
    await userService.saveUser(user);
    console.log('User profile saved successfully');
    
    return cred.user;
  } catch (error: any) {
    console.error('signUpWithEmail error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  console.log('signInWithEmail called with:', { email, passwordLength: password?.length });
  
  if (!auth) {
    console.error('Auth not initialized');
    throw new Error('Authentication service not initialized. Please check Firebase configuration.');
  }
  
  try {
    console.log('Signing in with Firebase...');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', cred.user.uid);
    
    // ensure profile exists in users collection/local
    const uid = cred.user.uid;
    console.log('Getting user profile...');
    const existing = await userService.getUserById(uid);
    
    if (!existing) {
      console.log('User profile not found, creating...');
      const user = { id: uid, name: cred.user.displayName || email.split('@')[0], email: cred.user.email || email, createdAt: Date.now() } as any;
      await userService.saveUser(user);
    }
    
    // set current user
    const profile = await userService.getUserById(uid);
    if (profile) {
      console.log('Setting current user:', profile.name);
      await userService.setCurrentUserAndNotify(profile as any);
    }
    
    return cred.user;
  } catch (error: any) {
    console.error('signInWithEmail error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
}

export async function signOut() {
  console.log('authService.signOut: Starting logout process...');
  
  try {
    // First clear local user data
    console.log('authService.signOut: Clearing local user data...');
    await userService.setCurrentUserAndNotify(null);
    
    // Then sign out from Firebase if available
    if (auth) {
      console.log('authService.signOut: Signing out from Firebase...');
      await fbSignOut(auth);
      console.log('authService.signOut: Firebase signOut completed');
    } else {
      console.log('authService.signOut: No Firebase auth instance, skipping Firebase signOut');
    }
    
    console.log('authService.signOut: Logout completed successfully');
  } catch (e) {
    console.error('authService.signOut: Error during logout:', e);
    // Ensure user is cleared even if Firebase signOut fails
    await userService.setCurrentUserAndNotify(null);
    throw e;
  }
}

export function onAuthStateChanged(cb: (user: any) => void) {
  if (!auth) {
    console.log('onAuthStateChanged: No auth instance available');
    return () => {};
  }
  
  console.log('onAuthStateChanged: Setting up Firebase auth state listener');
  return fbOnAuthStateChanged(auth, (user) => {
    console.log('onAuthStateChanged: Firebase auth state changed:', user ? user.uid : 'null');
    cb(user);
  });
}

export function getAuthCurrentUser() {
  if (!auth) return null;
  return auth.currentUser;
}

export async function signInWithFirebaseCredential(credential: any) {
  if (!auth) throw new Error('Auth not initialized');
  const result = await signInWithCredential(auth, credential);
  const uid = result.user.uid;
  const existing = await userService.getUserById(uid);
  if (!existing) {
    const user = { id: uid, name: result.user.displayName || uid, email: result.user.email || '', createdAt: Date.now() } as any;
    await userService.saveUser(user);
    await userService.setCurrentUserAndNotify(user as any);
    return result.user;
  }
  await userService.setCurrentUserAndNotify(existing as any);
  return result.user;
}

// Google OAuth Configuration
const getGoogleClientId = () => {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  } else if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  }
  // Web fallback - use the web client ID for Firebase
  return '490118119734-49hd2iocd4lq3ouebif3cr2pb5miar3d.apps.googleusercontent.com';
};

export async function signInWithGoogle() {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      throw new Error('Google OAuth client ID not configured for this platform');
    }

    // Use makeRedirectUri to create a proper redirect URI
    const redirectUri = 'aeroguard://auth';

    // Create auth request configuration
    const config = {
      clientId: clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: redirectUri,
      responseType: 'code',
      extraParams: {},
      additionalParameters: {},
    };

    // For now, throw an error indicating Google OAuth needs to be implemented in the component
    throw new Error('Google OAuth must be initiated from a React component using useAuthRequest hook');
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Apple sign-in removed

export async function signInAnonymouslyWithFirebase() {
  console.log('signInAnonymouslyWithFirebase called');
  
  if (!auth) {
    console.error('Auth not initialized');
    throw new Error('Authentication service not initialized. Please check Firebase configuration.');
  }
  
  try {
    console.log('Signing in anonymously with Firebase...');
    const result = await signInAnonymously(auth);
    console.log('Anonymous sign in successful:', result.user.uid);
    
    // Create a user profile for the anonymous user
    const uid = result.user.uid;
    const timestamp = Date.now();
    const guestNumber = Math.floor(Math.random() * 1000);
    
    const user = {
      id: uid,
      name: `Guest User ${guestNumber}`,
      email: '', // Anonymous users don't have email
      createdAt: timestamp,
      isAnonymous: true,
    } as any;
    
    console.log('Saving anonymous user profile...');
    await userService.saveUser(user);
    
    // Set as current user
    await userService.setCurrentUserAndNotify(user as any);
    console.log('Anonymous user profile saved and set as current');
    
    return result.user;
  } catch (error: any) {
    console.error('signInAnonymouslyWithFirebase error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific anonymous sign-in errors
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Anonymous authentication is not enabled. Please enable it in the Firebase Console.');
    }
    
    throw error;
  }
}
