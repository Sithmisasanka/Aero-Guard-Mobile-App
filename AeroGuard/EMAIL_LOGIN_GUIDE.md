# How to Login with Email/Password and Save User Data to Firebase

Your AeroGuard app already has a complete email/password authentication system that saves user data to Firebase! Here's how to use it:

## 🚀 Quick Start - How to Login

### 1. **Start the App**
Make sure your development server is running:
```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard
npx expo start
```

### 2. **Access Login Screen**
When you open the app, if no user is logged in, you'll automatically see the LoginScreen with:
- Email input field
- Password input field
- "Sign in with Email" button

### 3. **Login Process**
1. Enter your email address
2. Enter your password
3. Tap "Sign in with Email"
4. The app will authenticate you and save/sync user data to Firebase

## 📱 How the Email/Password Login Works

### **For New Users (Registration):**

1. **Create Account:** Tap "Create New Profile" on the login screen
2. **Fill Details:** Enter name, email, and password
3. **Firebase Auth:** Creates Firebase Authentication account
4. **Save Profile:** User profile is saved to both:
   - Firebase Firestore database
   - Local AsyncStorage (for offline access)

```typescript
// What happens when you sign up:
await authService.signUpWithEmail(email, password, name);
// This creates:
// 1. Firebase Auth user
// 2. User profile in Firestore
// 3. Local user profile for offline access
```

### **For Existing Users (Login):**

1. **Enter Credentials:** Email and password on login screen
2. **Firebase Auth:** Authenticates with Firebase
3. **Sync Profile:** Loads user profile from Firestore
4. **Set Current User:** Sets you as the active user

```typescript
// What happens when you sign in:
await authService.signInWithEmail(email, password);
// This does:
// 1. Authenticates with Firebase
// 2. Loads user profile from Firestore
// 3. Sets current user locally
// 4. Navigates to main app
```

## 🔧 User Data Structure

When you login, your user data is saved in this format:

```typescript
{
  id: "firebase_user_uid",           // Firebase UID
  name: "Your Name",                 // Display name
  email: "you@example.com",          // Email address
  createdAt: 1693824000000,          // Timestamp
}
```

This data is stored in:
- **Firebase Firestore:** `users/{userId}` collection
- **Local AsyncStorage:** For offline access and fast loading

## 🔄 Data Synchronization

The app uses a hybrid approach:

### **Local First:**
- Data is saved locally immediately for fast access
- App works offline with local data

### **Firebase Sync:**
- Data is synced to Firebase Firestore when online
- If Firebase fails, local storage is used as fallback
- On app restart, data is loaded from both sources

## 📋 Step-by-Step Usage Example

### **1. First Time User (Registration):**
```
1. Open app → Login screen appears
2. Tap "Create New Profile"
3. Enter:
   - Name: "John Doe"
   - Email: "john@example.com" 
   - Password: "securepassword123"
4. Tap "Sign Up"
5. Account created in Firebase + profile saved
6. Automatically logged in → Home screen shows
```

### **2. Returning User (Login):**
```
1. Open app → Login screen appears
2. Enter:
   - Email: "john@example.com"
   - Password: "securepassword123"
3. Tap "Sign in with Email"
4. Authentication verified with Firebase
5. Profile loaded → Home screen shows with your data
```

## 🛠️ Technical Implementation

The login system uses these components:

### **LoginScreen** (`/src/screens/Auth/LoginScreen.tsx`)
- Email/password input fields
- Login button that calls `authService.signInWithEmail()`
- Error handling and validation

### **SignupScreen** (`/src/screens/Auth/SignupScreen.tsx`)
- Registration form with name, email, password
- Calls `authService.signUpWithEmail()` to create account

### **AuthService** (`/src/services/authService.ts`)
- Handles Firebase Authentication
- Creates user profiles in Firestore
- Manages login/logout flow

### **UserService** (`/src/services/userService.ts`)
- Saves user data to Firebase Firestore
- Manages local AsyncStorage
- Handles data synchronization

### **AppNavigator** (`/src/components/AppNavigator.tsx`)
- Checks if user is logged in
- Shows login screen if not authenticated
- Shows main app if authenticated

## ⚡ Key Features

✅ **Firebase Authentication:** Secure email/password auth
✅ **Firestore Database:** User profiles saved to cloud
✅ **Offline Support:** Works without internet connection
✅ **Auto-sync:** Data syncs when online
✅ **Error Handling:** Graceful fallbacks if Firebase unavailable
✅ **Persistent Login:** Stays logged in between app sessions

## 🔧 Configuration Required

To use Firebase features, add these to your `.env` file:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Optional: For analytics
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Note:** If Firebase isn't configured, the app will still work with local storage only.

## 🎯 Summary

Your app already has everything you need for email/password login with Firebase! Just:

1. **Open the app** → Login screen appears
2. **For new users:** Tap "Create New Profile" and register
3. **For existing users:** Enter email/password and tap "Sign in with Email"
4. **User data automatically saves** to both Firebase and local storage

The system is production-ready with proper error handling, offline support, and data synchronization! 🚀
