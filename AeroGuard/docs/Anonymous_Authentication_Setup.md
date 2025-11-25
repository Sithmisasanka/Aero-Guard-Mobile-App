# Anonymous Authentication Setup Guide

This guide will help you enable anonymous authentication in your Firebase project for the AeroGuard Mobile app.

## Overview

Anonymous authentication allows users to use your app without providing credentials while still maintaining user-specific security rules. This is perfect for:

- **Quick app trials** - Users can immediately start using the app
- **Gradual onboarding** - Users can explore features before committing to sign up
- **Privacy-focused users** - Users who prefer not to share personal information
- **Offline-first experiences** - Users can use the app and later link to permanent accounts

## Firebase Console Setup

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **aero-guard-mobile-c2d56**
3. Click on **Authentication** in the left sidebar

### Step 2: Enable Anonymous Authentication

1. Click on the **Sign-in method** tab
2. Scroll down to find **Anonymous** in the list of sign-in providers
3. Click on **Anonymous** to open the configuration
4. Toggle the **Enable** switch to turn it on
5. Click **Save**

### Step 3: Verify Configuration

After enabling anonymous authentication, you should see:
- ✅ Anonymous provider status: **Enabled**
- The anonymous option will appear in your sign-in methods list

## Security Considerations

### Firebase Security Rules

With anonymous authentication enabled, consider updating your Firestore security rules:

```javascript
// Example Firestore rules for anonymous users
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users (including anonymous) to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all authenticated users to read public AQI data
    match /aqi_data/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Restrict sensitive operations to non-anonymous users
    match /admin/{document} {
      allow read, write: if request.auth != null && !request.auth.token.firebase.sign_in_provider == "anonymous";
    }
  }
}
```

### User Data Migration

Anonymous users can later be converted to permanent accounts:

```typescript
// Example: Convert anonymous user to permanent account
import { linkWithCredential, EmailAuthProvider } from 'firebase/auth';

async function linkAnonymousUserToEmail(email: string, password: string) {
  const user = auth.currentUser;
  if (user && user.isAnonymous) {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
    // User is now permanent and retains all their data
  }
}
```

## App Implementation Status

### ✅ Code Implementation Complete

The anonymous authentication is already implemented in your app:

**Auth Service** (`src/services/authService.ts`):
- `signInAnonymouslyWithFirebase()` function added
- Creates guest user profiles with random guest numbers
- Proper error handling for Firebase configurations

**Login Screen** (`src/screens/Auth/LoginScreen.tsx`):
- "Continue as Guest" button added
- Professional UI with person icon
- Error handling for user-friendly messages

### 🎨 User Experience

**Guest User Features**:
- **Random Guest Names**: "Guest User 123", "Guest User 456", etc.
- **Full App Access**: Can use all AQI monitoring features
- **Local Data Storage**: Data is saved to their anonymous account
- **Easy Upgrade**: Can later link to permanent account

**Button Design**:
- **Color**: Gray (#6B7280) to indicate guest/temporary status
- **Icon**: Person outline icon for clear visual indicator
- **Text**: "Continue as Guest" - clear and non-intimidating

## Testing Anonymous Authentication

### Development Testing

1. **Start Expo Server**: `npx expo start`
2. **Open App**: Use QR code or simulator
3. **Test Guest Login**: Tap "Continue as Guest"
4. **Verify Functionality**: Check if user can access main app features

### Production Testing Checklist

- [ ] Anonymous authentication enabled in Firebase Console
- [ ] Guest user can sign in successfully
- [ ] Guest user data is properly saved
- [ ] Security rules allow appropriate access for anonymous users
- [ ] Guest users can view AQI data
- [ ] Guest users cannot access admin features
- [ ] App handles network errors gracefully

## Troubleshooting

### Common Issues

**Error: "Anonymous authentication is not enabled"**
- **Solution**: Enable anonymous authentication in Firebase Console (Step 2 above)

**Error: "Operation not allowed"**
- **Cause**: Firebase project doesn't have anonymous auth enabled
- **Solution**: Follow the Firebase Console setup steps

**Guest users can't save data**
- **Cause**: Firestore security rules may be too restrictive
- **Solution**: Update rules to allow authenticated users (including anonymous)

### Debug Information

The app includes comprehensive logging for anonymous authentication:

```
Console Output Examples:
✅ "signInAnonymouslyWithFirebase called"
✅ "Anonymous sign in successful: [user-id]"
✅ "Saving anonymous user profile..."
✅ "Anonymous user profile saved and set as current"

❌ "signInAnonymouslyWithFirebase error: [error details]"
```

## Security Best Practices

1. **Limit Anonymous User Permissions**: Don't give anonymous users access to sensitive features
2. **Encourage Account Linking**: Provide easy ways for guests to create permanent accounts
3. **Data Cleanup**: Consider implementing periodic cleanup of unused anonymous accounts
4. **Rate Limiting**: Implement rate limiting for anonymous users to prevent abuse
5. **Monitor Usage**: Track anonymous user patterns for insights

## Next Steps

After enabling anonymous authentication:

1. **Test the Implementation**: Verify guest login works
2. **Update Security Rules**: Implement appropriate Firestore rules
3. **Monitor Usage**: Check Firebase Analytics for anonymous user behavior
4. **Plan User Journey**: Design flows to convert anonymous users to permanent accounts

## Implementation Files Modified

- ✅ `src/services/authService.ts` - Anonymous sign-in function
- ✅ `src/screens/Auth/LoginScreen.tsx` - Guest login button
- ✅ `src/services/userService.ts` - Handles anonymous user profiles
- ✅ App configuration ready for anonymous users

Your anonymous authentication is code-complete and ready to use once enabled in Firebase Console!
