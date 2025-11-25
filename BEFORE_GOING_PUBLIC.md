# 🔐 CRITICAL: Actions Required Before Making Repository Public

## ⚠️ EXPOSED SECRETS - IMMEDIATE ACTION REQUIRED

Your repository previously contained sensitive API keys and passwords in git history. **These MUST be rotated immediately** before making the repo public.

---

## 📋 Step-by-Step Action Plan

### Step 1: Rotate ALL Exposed API Keys (MANDATORY)

#### 1.1 Google Cloud Platform Keys
**Location**: [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)

**Exposed Keys**:
- Maps API: `AIzaSyAUz6S3KSOax4Ino2S8JR77WNIl1Kl93bA`
- Air Quality API: `AIzaSyAAENRkzsr-i-x8SmK2yZ_JJkUMIXWvUTw`  
- Gemini AI: `AIzaSyCow07zm-vdpzGVs8ElZC3sQRgHmMxxypw`

**Actions**:
1. Click on each key in the console
2. Click "DELETE" to revoke them
3. Click "CREATE CREDENTIALS" → "API Key"
4. Immediately click "RESTRICT KEY" and add:
   - **Application restrictions**: Android apps + iOS apps (add your bundle IDs)
   - **API restrictions**: Only enable the specific APIs needed
5. Save each new key to your local `.env` file

#### 1.2 IQAir API Key
**Location**: [IQAir Dashboard](https://www.iqair.com/dashboard/api)

**Exposed Key**: `2d90bff0-4c1d-4305-8779-675441e82a06`

**Actions**:
1. Log in to IQAir dashboard
2. Navigate to API Keys section
3. Revoke/Delete the exposed key
4. Generate a new API key
5. Add to your local `.env` file as `EXPO_PUBLIC_IQAIR_API_KEY`

#### 1.3 AQICN Token
**Location**: [AQICN Data Platform](https://aqicn.org/data-platform/token/)

**Exposed Token**: `a59162154e37af63665c11e653f44cfa88310046`

**Actions**:
1. Request token revocation (contact support if no self-service option)
2. Generate new token
3. Add to your local `.env` file as `EXPO_PUBLIC_AQICN_API_TOKEN`

#### 1.4 Android Keystore (CRITICAL for Play Store)
**Exposed Credentials**:
- Password: `vinuth1234`
- Alias: `aeroguard`

**Actions**:
1. **If using Play App Signing**: You're safe! Google manages the final signing key
   - Just generate a new upload keystore with a strong password
   - Update Play Console with new upload certificate
   
2. **If NOT using Play App Signing**: 
   - Your app signing key is compromised
   - You'll need to publish as a new app with a new package name
   - OR migrate to Play App Signing immediately

**Generate New Upload Keystore**:
```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard/android

# Generate new keystore with STRONG password
keytool -genkeypair -v -storetype PKCS12 \
  -keystore upload-keystore.jks \
  -alias aeroguard \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# When prompted, use a STRONG password (not vinuth1234!)
# Save password to a password manager
```

**Update gradle.properties**:
```bash
# Copy template
cp gradle.properties.example gradle.properties

# Edit with your new credentials
nano gradle.properties
```

Fill in:
```properties
MYAPP_UPLOAD_STORE_FILE=/Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard/android/upload-keystore.jks
MYAPP_UPLOAD_KEY_ALIAS=aeroguard
MYAPP_UPLOAD_STORE_PASSWORD=<your-new-strong-password>
MYAPP_UPLOAD_KEY_PASSWORD=<your-new-strong-password>
```

---

### Step 2: Set Up Local Environment

```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard

# Copy the environment template
cp .env.example .env

# Edit and add your NEW API keys
nano .env
```

Paste your **NEW** keys:
```env
EXPO_PUBLIC_IQAIR_API_KEY=<new-iqair-key>
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<new-google-maps-key>
EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY=<new-air-quality-key>
EXPO_PUBLIC_GEMINI_API_KEY=<new-gemini-key>
EXPO_PUBLIC_AQICN_API_TOKEN=<new-aqicn-token>

# Firebase config (same values, but now in .env instead of app.json)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAAENRkzsr-i-x8SmK2yZ_JJkUMIXWvUTw
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=aero-guard-mobile-c2d56.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://aero-guard-mobile-c2d56-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=aero-guard-mobile-c2d56
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=aero-guard-mobile-c2d56.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=490118119734
EXPO_PUBLIC_FIREBASE_APP_ID=1:490118119734:web:ef0939aab28a719060b397
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-D7G8ZEHPRR
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=490118119734-49hd2iocd4lq3ouebif3cr2pb5miar3d.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=NEED_TO_CREATE_IOS_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=NEED_TO_CREATE_ANDROID_CLIENT_ID.apps.googleusercontent.com

# App config
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_MAP_PROVIDER=google
EXPO_PUBLIC_ENABLE_AQICN_INSIGHTS=true
EXPO_USE_NATIVE_ICONS=1
```

---

### Step 3: Verify Security

Run these commands to ensure no secrets remain:

```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile

# Check for Google API keys
git grep -i "AIzaSy" || echo "✅ No Google API keys in repo"

# Check for passwords
git grep -i "vinuth1234" || echo "✅ No hardcoded passwords"

# Check app.json is clean
git grep -i "api.*key.*:" AeroGuard/app.json && echo "❌ KEYS STILL IN app.json!" || echo "✅ app.json is clean"

# Verify .gitignore is working
git check-ignore AeroGuard/.env && echo "✅ .env is ignored" || echo "❌ .env NOT ignored!"
git check-ignore AeroGuard/android/gradle.properties && echo "✅ gradle.properties ignored" || echo "❌ gradle.properties NOT ignored!"
```

---

### Step 4: Clean Git History (REQUIRED)

Even though we removed keys from current files, **they still exist in git history**. Anyone who clones your repo can access them.

**Option A: Use BFG Repo-Cleaner** (Recommended if you want to keep history)

```bash
# Install BFG
brew install bfg

# Create a backup
cd /Users/aseshnemal/Desktop/app
cp -r AeroGuardMobile AeroGuardMobile_backup

# Create a list of secrets to remove
cat > secrets.txt << 'EOF'
AIzaSyAUz6S3KSOax4Ino2S8JR77WNIl1Kl93bA
AIzaSyAAENRkzsr-i-x8SmK2yZ_JJkUMIXWvUTw
AIzaSyCow07zm-vdpzGVs8ElZC3sQRgHmMxxypw
2d90bff0-4c1d-4305-8779-675441e82a06
a59162154e37af63665c11e653f44cfa88310046
vinuth1234
490118119734-49hd2iocd4lq3ouebif3cr2pb5miar3d.apps.googleusercontent.com
EOF

# Clone as mirror
git clone --mirror https://github.com/AseshNemal/AeroGuardMobile.git AeroGuardMobile-mirror

# Clean secrets from history
cd AeroGuardMobile-mirror
bfg --replace-text ../secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# DANGER: Force push (rewrites public history)
# Only do this if you're SURE no one else has cloned your repo
git push --force

cd ..
rm -rf AeroGuardMobile-mirror secrets.txt
```

**Option B: Start Fresh** (Safest, but loses history)

```bash
# Create new empty repo on GitHub (e.g., AeroGuardMobile-clean)
# Then:

cd /Users/aseshnemal/Desktop/app
mkdir AeroGuardMobile-clean
cd AeroGuardMobile-clean

# Copy only current cleaned files
cp -r ../AeroGuardMobile/AeroGuard .
cp -r ../AeroGuardMobile/docs .
cp ../AeroGuardMobile/README.md .
cp ../AeroGuardMobile/.gitattributes .
cp ../AeroGuardMobile/SECURITY_CHECKLIST.md .

# Initialize new git
git init
git add .
git commit -m "Initial commit - AeroGuard v1.0.0"

# Push to new repo
git remote add origin https://github.com/AseshNemal/AeroGuardMobile-clean.git
git push -u origin main
```

---

### Step 5: Set Up EAS Secrets (for CI/CD)

```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard

# Install EAS CLI if needed
npm install -g eas-cli

# Login
eas login

# Add secrets for builds (use your NEW keys!)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "your-new-maps-key"
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value "your-new-gemini-key"
eas secret:create --scope project --name EXPO_PUBLIC_IQAIR_API_KEY --value "your-new-iqair-key"
eas secret:create --scope project --name EXPO_PUBLIC_AQICN_API_TOKEN --value "your-new-aqicn-token"
```

---

### Step 6: Push and Make Public

**Only after completing ALL steps above:**

```bash
cd /Users/aseshnemal/Desktop/app/AeroGuardMobile

# If you cleaned history with BFG, pull the changes
git pull origin main --rebase

# Verify one more time
git log --oneline | head -20  # Check recent commits
git grep -i "AIzaSy"  # Should find nothing

# If all clear, push
git push origin main

# Then go to GitHub:
# Settings → General → Danger Zone → Change visibility → Make public
```

---

## ✅ Final Checklist

Before making the repo public, confirm:

- [ ] All Google Cloud API keys have been **deleted and regenerated**
- [ ] IQAir API key has been **revoked and regenerated**
- [ ] AQICN token has been **revoked and regenerated**  
- [ ] New keystore generated with **strong password** (saved in password manager)
- [ ] Local `.env` file created with **NEW** keys
- [ ] `gradle.properties` created with **NEW** keystore credentials
- [ ] Git history cleaned (either BFG or fresh repo)
- [ ] `git grep -i "AIzaSy"` returns **no results**
- [ ] `.env` and `gradle.properties` are **git-ignored**
- [ ] EAS secrets configured for CI/CD builds
- [ ] Test build works with new keys: `npx expo start`
- [ ] Firebase Security Rules reviewed and tightened

---

## 🆘 Emergency Contacts

If keys were already exposed publicly:
- **Google Cloud**: [Report compromised API key](https://support.google.com/cloud/answer/6310037)
- **Firebase**: [Security incidents](https://firebase.google.com/support/privacy)
- **Play Store**: [Report security issue](https://support.google.com/googleplay/android-developer/answer/9844679)

---

## 📚 Reference Links

- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Git Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

**Last Updated**: November 1, 2025  
**Status**: ⚠️ **NOT SAFE TO MAKE PUBLIC YET** - Complete all steps above first!
