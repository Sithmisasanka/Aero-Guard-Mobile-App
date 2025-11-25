# Google OAuth 2.0 Setup for AeroGuard Mobile App

## Current Issue
You're seeing "Access blocked: authorization_error" because Google OAuth requires proper client configuration for mobile apps.

## Required Google Cloud Console Configuration

### 1. Create Proper OAuth 2.0 Client IDs

You need **3 different** OAuth client IDs in your Google Cloud Console:

#### A. Web Client (for Firebase Auth)
- **Application Type**: Web application
- **Name**: AeroGuard Web Client
- **Authorized JavaScript origins**: 
  - `https://aero-guard-mobile-c2d56.firebaseapp.com`
  - `https://aero-guard-mobile-c2d56.web.app`
- **Authorized redirect URIs**:
  - `https://aero-guard-mobile-c2d56.firebaseapp.com/__/auth/handler`

#### B. iOS Client (for mobile app)
- **Application Type**: iOS
- **Name**: AeroGuard iOS Client
- **Bundle ID**: `com.aeroguard.mobile` (from your app.json)

#### C. Android Client (for mobile app)
- **Application Type**: Android
- **Name**: AeroGuard Android Client
- **Package name**: `com.aeroguard.mobile`
- **SHA-1 certificate fingerprint**: [Get from Expo/development]

### 2. Firebase Console Configuration

In your Firebase Console (Authentication > Sign-in method > Google):
- **Web SDK configuration**: Use the **Web Client ID** (not iOS/Android)
- **Web client ID**: `490118119734-49hd2iocd4lq3ouebif3cr2pb5miar3d.apps.googleusercontent.com`
- **Web client secret**: [Your web client secret]

### 3. Environment Variables Update

Update your `.env` file with the **iOS client ID**:

```env
# For expo-auth-session (mobile OAuth)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here.apps.googleusercontent.com

# Existing Firebase config stays the same
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBzrOw9TGMOTjF9QVhDNLXa4qCGZRiBXr4
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=aeroguard-31a3c.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://aeroguard-31a3c-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=aeroguard-31a3c
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=aeroguard-31a3c.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=490118119734
EXPO_PUBLIC_FIREBASE_APP_ID=1:490118119734:web:9e21b9d9e8066e8acdda4f
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-RJGJH3LVGB
```

## Step-by-Step Fix Instructions

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `aero-guard-mobile-c2d56`
3. Navigate to **APIs & Services** > **Credentials**

### Step 2: Create iOS OAuth Client
1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Choose **iOS** as application type
3. Name: `AeroGuard iOS Client`
4. Bundle ID: `com.aeroguard.mobile`
5. Click **Create**
6. **Copy the Client ID** - you'll need this

### Step 3: Create Android OAuth Client
1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Choose **Android** as application type
3. Name: `AeroGuard Android Client`
4. Package name: `com.aeroguard.mobile`
5. For SHA-1 fingerprint, run: `expo credentials:manager`
6. Click **Create**
7. **Copy the Client ID**

### Step 4: Update Your Code
The iOS client ID should be used in your `authService.ts` for `expo-auth-session`.

### Step 5: Test OAuth Compliance
After creating all client IDs:
1. Restart Expo dev server
2. Test Google sign-in on both iOS and Android
3. OAuth should work without "Access blocked" errors

## Important Notes

- **Web Client ID**: Used by Firebase Auth SDK
- **iOS/Android Client IDs**: Used by expo-auth-session for native OAuth
- Each platform needs its own properly configured client ID
- Bundle IDs must match exactly between Google Console and app.json

## Troubleshooting

If you still see "Access blocked":
1. Verify all 3 client IDs are created
2. Check bundle ID matches exactly
3. Ensure Firebase Console uses Web Client ID
4. Clear browser cache and restart Expo
5. Check Google Cloud Console project permissions

## Testing Checklist

- [ ] Web OAuth client created with correct origins/redirects
- [ ] iOS OAuth client created with correct bundle ID
- [ ] Android OAuth client created with package name + SHA-1
- [ ] Firebase Console configured with Web client ID
- [ ] Environment variables updated with iOS/Android client IDs
- [ ] App restarted and tested on both platforms
