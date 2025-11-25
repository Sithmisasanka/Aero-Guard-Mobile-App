# Security Notice for AeroGuard Repository

## Important: This Repository Contains Sensitive Information

**BEFORE making this repository public, you MUST:**

### 1. Revoke and Regenerate ALL Exposed API Keys

The following API keys were previously committed and MUST be regenerated:

#### Google Cloud Platform
- **Google Maps API Key**: `AIzaSyAUz6S3KSOax4Ino2S8JR77WNIl1Kl93bA`
- **Google Air Quality API Key**: `AIzaSyAAENRkzsr-i-x8SmK2yZ_JJkUMIXWvUTw`
- **Google Gemini AI Key**: `AIzaSyCow07zm-vdpzGVs8ElZC3sQRgHmMxxypw`

**Action Required:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Delete these compromised keys
3. Generate new API keys with proper restrictions
4. Add new keys to your local `.env` file (NOT committed to git)

#### IQAir API
- **IQAir API Key**: `2d90bff0-4c1d-4305-8779-675441e82a06`

**Action Required:**
1. Go to [IQAir Dashboard](https://www.iqair.com/dashboard/api)
2. Revoke this key
3. Generate a new API key
4. Add to your local `.env` file

#### AQICN API
- **AQICN Token**: `a59162154e37af63665c11e653f44cfa88310046`

**Action Required:**
1. Go to [AQICN Data Platform](https://aqicn.org/data-platform/token/)
2. Revoke this token
3. Generate a new token
4. Add to your local `.env` file

#### Firebase Configuration
All Firebase configuration details were exposed, including:
- Project ID: `aero-guard-mobile-c2d56`
- App ID: `1:490118119734:web:ef0939aab28a719060b397`
- Messaging Sender ID: `490118119734`
- Web Client ID: `490118119734-49hd2iocd4lq3ouebif3cr2pb5miar3d.apps.googleusercontent.com`

**Action Required:**
1. Review [Firebase Security Rules](https://console.firebase.google.com/project/aero-guard-mobile-c2d56/firestore/rules)
2. Ensure all database and storage rules are properly restricted
3. Consider rotating OAuth client secrets if applicable
4. Enable Firebase App Check for additional security

#### Android Keystore Credentials
- **Store Password**: `vinuth1234`
- **Key Password**: `vinuth1234`
- **Key Alias**: `aeroguard`
- **Keystore Path**: `/Users/aseshnemal/Desktop/app/AeroGuardMobile/AeroGuard/android/upload-keystore.jks`

**Action Required:**
1. Generate a new upload keystore with strong passwords
2. Update Play Console with new certificate fingerprint (if using app signing by Google Play)
3. Keep keystore and passwords in a secure password manager
4. NEVER commit the actual `gradle.properties` file

### 2. Clean Git History

Even though we've removed the keys from current files, they still exist in git history.

**Option A: Use BFG Repo-Cleaner (Recommended)**
```bash
# Install BFG
brew install bfg  # macOS

# Clone a fresh copy
git clone --mirror https://github.com/AseshNemal/AeroGuardMobile.git

# Remove sensitive data
bfg --replace-text sensitive.txt AeroGuardMobile.git

# Clean up
cd AeroGuardMobile.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (DANGER: rewrites history)
git push --force
```

**Option B: Start Fresh (Safest)**
1. Create a new empty repository
2. Copy only the cleaned files (current state)
3. Make initial commit with clean history
4. Push to new repository

### 3. Set Up Proper Secrets Management

**Local Development:**
```bash
# Create your local .env file (gitignored)
cp .env.example .env

# Add your NEW API keys to .env
nano .env
```

**CI/CD & Production:**
- Use GitHub Secrets for Actions
- Use EAS Secrets for Expo builds:
  ```bash
  eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "your-new-key"
  ```

### 4. Verify Security Before Going Public

**Run this checklist:**
```bash
# Check for any remaining secrets
git grep -i "AIzaSy" || echo "✓ No Google API keys found"
git grep -i "password" AeroGuard/android/ || echo "✓ No passwords found"
git grep -i "api.*key.*=" --include="*.json" --include="*.js" || echo "✓ No hardcoded keys"

# Verify gitignore is working
git check-ignore .env && echo "✓ .env is ignored"
git check-ignore AeroGuard/android/gradle.properties && echo "✓ gradle.properties is ignored"
git check-ignore AeroGuard/android/upload-keystore.jks && echo "✓ keystore is ignored"
```

### 5. Files That Should NEVER Be Committed
- `.env` (actual environment variables)
- `android/gradle.properties` (contains keystore passwords)
- `android/upload-keystore.jks` (signing key)
- `android/app/google-services.json` (if it contains private info)
- `ios/GoogleService-Info.plist`
- Any `*.p12`, `*.p8`, `*.mobileprovision` files

### 6. Safe to Keep Public
✅ `.env.example` (template with no real keys)
✅ `gradle.properties.example` (template)
✅ `app.json` (now cleaned)
✅ `app.config.js` (now reads from env vars)
✅ Source code
✅ Documentation

## After Completing All Steps

Only then is it safe to:
```bash
git add .
git commit -m "security: Remove all exposed API keys and secrets"
git push origin main
```

And make the repository public via GitHub settings.

---

**⚠️ IMPORTANT**: Once API keys are committed to a public repository, assume they are compromised forever. Rotation is MANDATORY, not optional.
