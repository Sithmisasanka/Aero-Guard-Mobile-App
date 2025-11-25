# Email/Password Signup Troubleshooting Guide

## Possible Issues and Solutions

### 1. **Firebase Authentication Not Enabled**
**Most Likely Issue**: Email/Password provider is not enabled in Firebase Console.

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `aero-guard-mobile-c2d56`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. **Enable** the first toggle (Email/Password)
6. Click **Save**

### 2. **Network/Connection Issues**
**Check**: Are you connected to the internet?

### 3. **Firebase Configuration Issues**
**Check**: Are the Firebase environment variables correct?

**Your current config**:
- Project ID: `aero-guard-mobile-c2d56`
- API Key: `AIzaSyAAENRkzsr-i-x8SmK2yZ_JJkUMIXWvUTw`

### 4. **Password Requirements**
Firebase requires passwords to be **at least 6 characters long**.

**Test with**:
- Email: `test@example.com`
- Password: `123456` (or longer)

## Quick Test Steps

1. **Start the app**: Use QR code or web version
2. **Navigate to Signup**: Tap "Create New Profile"
3. **Fill form**:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `123456`
4. **Tap Create**

## Expected Behavior
- If Firebase Auth is enabled: Account should be created successfully
- If disabled: You'll get an error like "operation-not-allowed"

## Debug Steps

### Step 1: Check Firebase Console
1. Go to Authentication → Sign-in method
2. Verify Email/Password is **Enabled**

### Step 2: Check Error Messages
1. Open web version of app for better error messages
2. Open browser developer tools → Console
3. Try signup and check console for errors

### Step 3: Test with Different Credentials
Try these test accounts:
- `user1@test.com` / `password123`
- `admin@demo.com` / `securepass`

## Common Error Messages

| Error | Solution |
|-------|----------|
| `operation-not-allowed` | Enable Email/Password in Firebase Console |
| `weak-password` | Use password with 6+ characters |
| `email-already-in-use` | Try different email or use login instead |
| `invalid-email` | Check email format |
| `network-request-failed` | Check internet connection |

## Next Steps
1. ✅ Enable Email/Password in Firebase Console
2. ✅ Test with strong password (6+ chars)
3. ✅ Check error messages in browser console
4. ✅ Restart Expo server after changes
