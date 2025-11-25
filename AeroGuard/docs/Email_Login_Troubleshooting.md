# 🔧 Email Login Troubleshooting Guide

## 🎯 **Most Common Issues & Solutions**

### **Issue #1: Email/Password Provider Not Enabled in Firebase Console**
**Symptoms**: 
- Login fails with "operation-not-allowed" error
- Signup doesn't work
- No specific error message

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `aero-guard-mobile-c2d56`
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Email/Password** provider
5. Click on it and **Enable** the toggle
6. Click **Save**

### **Issue #2: Weak Password Error**
**Symptoms**: 
- Error: "weak-password"
- Password rejected

**Solution**:
- Use passwords with **6+ characters**
- Try: `123456`, `password123`, `mypassword`

### **Issue #3: Firebase Configuration Issues**
**Symptoms**:
- "Auth not initialized" error
- Network request failed
- Invalid configuration

**Check**:
- Firebase environment variables are correct
- Internet connection is working
- Firebase project exists

### **Issue #4: Email Format Issues**
**Symptoms**:
- "invalid-email" error
- Email validation fails

**Solution**:
- Use valid email format: `test@example.com`
- No spaces or special characters
- Include @ and domain

## 🧪 **Test Email Login Step-by-Step**

### **Method 1: Create New Account**
1. Open the app (web version recommended for debugging)
2. Tap **"Create New Profile"**
3. Fill form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `123456`
4. Tap **"Create"**
5. Check for success or error message

### **Method 2: Login with Existing Account**
1. Open the app
2. Fill login form:
   - Email: `test@example.com`
   - Password: `123456`
3. Tap **"Sign in with Email"**
4. Check for success or error message

## 🔍 **Debug Email Login Issues**

### **Web Browser Debugging**:
1. Open web version at `http://localhost:8081`
2. Open browser Developer Tools (F12)
3. Go to **Console** tab
4. Try email login/signup
5. Look for error messages in console

### **Common Error Messages**:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `operation-not-allowed` | Email/Password not enabled | Enable in Firebase Console |
| `weak-password` | Password too short | Use 6+ characters |
| `email-already-in-use` | Account exists | Try login instead of signup |
| `user-not-found` | Account doesn't exist | Try signup instead of login |
| `wrong-password` | Incorrect password | Check password spelling |
| `invalid-email` | Bad email format | Use valid email format |
| `network-request-failed` | No internet | Check connection |
| `auth/user-disabled` | Account disabled | Contact support |

## 🔧 **Quick Fixes**

### **Fix #1: Enable Email/Password in Firebase**
**MOST IMPORTANT**: This is the #1 cause of email login failures.

```
1. Firebase Console → Authentication → Sign-in method
2. Click "Email/Password" 
3. Enable the first toggle
4. Save changes
```

### **Fix #2: Test with Strong Password**
**Use these test credentials**:
- Email: `admin@test.com`
- Password: `password123`
- Name: `Admin User`

### **Fix #3: Clear App Data**
If login is stuck:
1. Settings → Clear All Data
2. Restart app
3. Try signup with new account

### **Fix #4: Check Network**
- Ensure internet connection
- Try different network
- Check Firebase service status

## 📱 **Current App Status**

### **Firebase Configuration**: ✅
- Project: `aero-guard-mobile-c2d56`
- API Key: `AIzaSyAAENRkzsr-i-x8SmK2yZ_JJkUMIXWvUTw`
- Auth Domain: `aero-guard-mobile-c2d56.firebaseapp.com`

### **Authentication Service**: ✅
- Email/Password functions implemented
- Error handling in place
- User profile creation working

### **UI Components**: ✅
- Login screen with email/password fields
- Signup screen with form validation
- Error messages display to user

## 🎯 **Next Steps**

1. **Primary Action**: Enable Email/Password in Firebase Console
2. **Test**: Try signup with `test@example.com` / `password123`
3. **Debug**: Check browser console for specific errors
4. **Verify**: Confirm authentication works in web version first

## 🆘 **If Still Not Working**

**Please provide**:
1. Specific error message you see
2. Whether you're using signup or login
3. What email/password you're trying
4. Browser console errors (if using web)

**Most likely cause**: Email/Password provider not enabled in Firebase Console.
**Quick test**: Try the web version first for better error messages.

---

**🚀 Enable Email/Password in Firebase Console and try again!**
