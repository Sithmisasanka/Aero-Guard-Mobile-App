# Firebase Authentication Setup Guide

Since you've enabled Email/Password and Google authentication providers in Firebase Console, here's how to complete the setup:

## 🔥 Step 1: Get Firebase Configuration

### 1.1 Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your AeroGuard project
3. Click the gear icon ⚙️ (Project Settings)
4. Scroll down to "Your apps" section
5. Select your web app or click "Add app" if none exists

### 1.2 Copy Firebase Config
You'll see a config object like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef...",
  measurementId: "G-XXXXXXXXXX"
};
```

### 1.3 Update Your .env File
Replace the placeholder values in your `.env` file:

```bash
# Replace these with your actual Firebase values:
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 🚀 Step 2: Set Up Google OAuth (for Google Sign-In)

### 2.1 Enable Google Cloud APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (same as Firebase project)
3. Enable these APIs:
   - Google+ API
   - Google Identity Toolkit API

### 2.2 Create OAuth Client IDs
1. Go to **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS" > OAuth 2.0 Client IDs**
3. Create **4 different client IDs**:

#### Web Application:
- Application type: **Web application**
- Name: **AeroGuard Web**
- Authorized redirect URIs: `https://auth.expo.io/@your-username/aeroguard`

#### iOS Application:
- Application type: **iOS**
- Name: **AeroGuard iOS**
- Bundle ID: `com.aseshnemal.aeroguard` (from your app.json)

#### Android Application:
- Application type: **Android**
- Name: **AeroGuard Android**
- Package name: `com.aeroguard.mobile` (from your app.json)
- SHA-1 certificate fingerprint: (Get from Expo)

#### Expo Application:
- Application type: **Web application**
- Name: **AeroGuard Expo**
- Authorized redirect URIs: 
  - `https://auth.expo.io/@your-username/aeroguard`
  - `exp://localhost:8081`

### 2.3 Get SHA-1 Certificate (for Android)
Run this command to get your SHA-1:
```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard
npx expo credentials:manager -p android
```

### 2.4 Update .env with Google OAuth Client IDs
```bash
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
```

## 📱 Step 3: Test Authentication

### 3.1 Start Development Server
```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard
npx expo start
```

### 3.2 Test Email/Password Authentication
1. Open the app (web, iOS, or Android)
2. You'll see the login screen
3. Tap **"Create New Profile"**
4. Enter:
   - Name: Your name
   - Email: test@example.com
   - Password: test123456
5. Tap **"Sign Up"**
6. Check Firebase Console > Authentication > Users to see your user

### 3.3 Test Google Sign-In
1. On login screen, tap **"Sign in with Google"**
2. Complete Google OAuth flow
3. User should be created in Firebase Authentication

## 🔧 Step 4: Configure Firestore Database

### 4.1 Create Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location close to your users

### 4.2 Set Up Security Rules (Development)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all users to read public data (like AQI data)
    match /aqi_data/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## ✅ Step 5: Verification Checklist

After completing the setup, verify:

- [ ] Firebase config values added to `.env`
- [ ] Google OAuth client IDs added to `.env`
- [ ] Email/Password provider enabled in Firebase Console
- [ ] Google provider enabled in Firebase Console
- [ ] Firestore database created
- [ ] App starts without Firebase errors
- [ ] Can create account with email/password
- [ ] Can login with email/password
- [ ] Can sign in with Google (if OAuth configured)
- [ ] User data appears in Firebase Console > Authentication
- [ ] User profile saved in Firestore > users collection

## 🎯 Expected Behavior After Setup

### Login Screen Features:
1. **Email/Password Fields** - Working authentication
2. **"Sign in with Email" Button** - Creates Firebase Auth user + Firestore profile
3. **"Sign in with Google" Button** - Google OAuth flow + Firebase Auth
4. **"Create New Profile" Button** - Registration with Firebase

### Data Storage:
- **Firebase Authentication**: Manages user accounts and login sessions
- **Firestore Database**: Stores user profiles and app data
- **Local AsyncStorage**: Offline backup and fast access

### Error Handling:
- Shows meaningful error messages
- Falls back to local storage if Firebase unavailable
- Handles network connectivity issues gracefully

## 🚨 Troubleshooting

### Common Issues:

**"Auth not initialized"** - Check Firebase config in `.env`
**"Google Sign-in failed"** - Verify OAuth client IDs
**"Permission denied"** - Check Firestore security rules
**"Invalid API key"** - Verify Firebase API key is correct

### Debug Steps:
1. Check browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase project has billing enabled (for production)
4. Check Firebase Console logs for authentication events

Once you complete this setup, your app will have full Firebase Authentication with both email/password and Google sign-in working perfectly! 🚀
