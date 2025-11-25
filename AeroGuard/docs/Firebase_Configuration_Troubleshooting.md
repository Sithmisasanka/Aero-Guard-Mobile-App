# Firebase Configuration and Troubleshooting Guide

This guide addresses common Firebase issues and provides solutions for the AeroGuard Mobile app.

## Current Issues Identified

From the app logs, we've identified several issues that need to be addressed:

### 1. ❌ Firebase Auth Persistence Warning
```
@firebase/auth: Auth (12.2.0): 
You are initializing Firebase Auth for React Native without providing
AsyncStorage. Auth state will default to memory persistence and will not
persist between sessions.
```

**Status**: ✅ **FIXED** - Updated Firebase initialization to properly handle React Native persistence.

### 2. ❌ Firestore Connection Errors
```
@firebase/firestore: Firestore (12.2.0): WebChannelConnection RPC 'Write' stream transport errored.
```

**Status**: 🔧 **NEEDS FIREBASE CONSOLE CONFIGURATION** - Requires enabling services and security rules.

### 3. ❌ Anonymous Authentication Not Enabled
```
Anonymous sign in successful: [user-id]
Saving anonymous user profile...
[Firestore errors follow]
```

**Status**: 🔧 **NEEDS FIREBASE CONSOLE SETUP** - Anonymous auth works but Firestore writes fail.

## Firebase Console Configuration Steps

### Step 1: Enable Anonymous Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **aero-guard-mobile-c2d56**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Anonymous** in the provider list
5. Click **Anonymous** and toggle **Enable**
6. Click **Save**

### Step 2: Configure Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. If not created, click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (e.g., us-central1)
5. Click **Done**

### Step 3: Update Firestore Security Rules

Replace the default rules with these user-friendly rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users (including anonymous) to manage their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read public AQI data
    match /aqi_data/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to read/write their own app settings
    match /user_settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read access for general app data (like city lists, etc.)
    match /public_data/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 4: Enable Required Firebase Services

Ensure these services are enabled in your Firebase project:

1. **Authentication**: ✅ Already configured
2. **Firestore Database**: 🔧 Enable and configure rules
3. **Analytics** (optional): Can be enabled for usage insights

## Code Improvements Made

### ✅ Firebase Auth Persistence Fixed

**File**: `src/services/firebase.ts`

**Changes**:
- Added proper AsyncStorage import
- Updated auth initialization for React Native
- Added platform detection for proper auth setup
- Improved error handling and fallbacks

### ✅ Firestore Error Handling Enhanced

**File**: `src/services/userService.ts`

**Changes**:
- Prioritize local storage over Firestore (immediate response)
- Make Firestore operations non-blocking
- Add comprehensive error logging
- Graceful degradation when Firestore is unavailable

### ✅ Anonymous Authentication Implementation

**Files**: 
- `src/services/authService.ts` - Anonymous sign-in function
- `src/screens/Auth/LoginScreen.tsx` - Guest login UI

**Features**:
- Creates random guest user names
- Full app functionality for anonymous users
- Proper error handling and user feedback

## Testing Your Fixes

### 1. Restart Expo Server

```bash
# Stop current server (Ctrl+C)
# Restart with clean cache
npx expo start --clear
```

### 2. Test Authentication Flow

1. **Anonymous Sign-In**: Tap "Continue as Guest"
   - Should work without errors after Firebase Console setup
   - User should see "Guest User XXX" in profile

2. **Email Sign-In**: Use existing credentials
   - Should persist between app restarts (after auth fix)
   - Should save user data locally and sync to Firestore

3. **Network Resilience**: Test with poor/no connection
   - App should work offline with local storage
   - Should sync to Firestore when connection improves

### 3. Monitor Console Logs

**Good Logs (Expected after fixes)**:
```
✅ "Initializing Auth for React Native with AsyncStorage..."
✅ "Firebase Auth initialized with automatic React Native persistence"
✅ "Anonymous sign in successful: [user-id]"
✅ "User saved to Firestore successfully"
```

**Logs Indicating Issues**:
```
❌ "WebChannelConnection RPC transport errored" - Firestore rules/connection issue
❌ "Anonymous authentication is not enabled" - Firebase Console setup needed
❌ "Auth state will default to memory persistence" - AsyncStorage issue
```

## Firestore Connection Troubleshooting

### Common Causes of Firestore Errors

1. **Security Rules Too Restrictive**
   - Solution: Update rules to allow authenticated users

2. **Anonymous Auth Not Enabled**
   - Solution: Enable in Firebase Console → Authentication

3. **Firestore Database Not Created**
   - Solution: Create database in Firebase Console

4. **Network Connectivity Issues**
   - Solution: App now handles this gracefully with local storage

### Debugging Firestore Issues

1. **Check Firebase Console Logs**:
   - Go to Firebase Console → Project Overview → Usage
   - Look for authentication and database usage

2. **Test Rules in Firebase Console**:
   - Go to Firestore → Rules → Simulator
   - Test read/write operations with authenticated user

3. **Monitor Network Tab**:
   - Use browser dev tools to see Firestore API calls
   - Look for 403 Forbidden (rules issue) or 401 Unauthorized

## Security Considerations

### Anonymous User Limitations

- Anonymous users can access the app but should have limited permissions
- Data is tied to the anonymous UID and will be lost if user signs out
- Consider prompting anonymous users to create permanent accounts

### Data Migration

Users can convert from anonymous to permanent accounts:

```typescript
// Example: Link anonymous account to email
import { linkWithCredential, EmailAuthProvider } from 'firebase/auth';

async function upgradeAnonymousAccount(email: string, password: string) {
  const user = auth.currentUser;
  if (user?.isAnonymous) {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
    // User keeps all their data but now has permanent account
  }
}
```

## Next Steps

### 1. Complete Firebase Console Setup
- [ ] Enable Anonymous Authentication
- [ ] Create Firestore Database
- [ ] Update Security Rules
- [ ] Test anonymous sign-in

### 2. Test All Authentication Methods
- [ ] Anonymous/Guest login
- [ ] Email/Password login
- [ ] Apple Sign-In (when configured)
- [ ] Google OAuth (when configured)

### 3. Monitor and Optimize
- [ ] Check Firebase Usage metrics
- [ ] Monitor authentication success rates
- [ ] Optimize Firestore read/write patterns
- [ ] Consider implementing offline persistence

## Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firestore Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Firebase Auth Anonymous**: https://firebase.google.com/docs/auth/web/anonymous-auth
- **React Native Firebase**: https://rnfirebase.io/ (alternative SDK if needed)

Your app now has robust error handling and should work smoothly once the Firebase Console configuration is complete!
