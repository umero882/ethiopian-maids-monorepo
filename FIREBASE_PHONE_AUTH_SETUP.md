# Firebase Phone Authentication - Complete Setup Guide

This guide covers the complete setup for Firebase Phone Authentication across Web, Android, and iOS platforms.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Firebase Console Configuration](#1-firebase-console-configuration)
3. [Web Setup](#2-web-setup)
4. [Android Setup](#3-android-setup)
5. [iOS Setup](#4-ios-setup)
6. [Testing with Test Phone Numbers](#5-testing-with-test-phone-numbers)
7. [EAS Build Configuration](#6-eas-build-configuration)
8. [Troubleshooting](#7-troubleshooting)

---

## Quick Start

Run the setup helper script to check your configuration:

```bash
cd apps/mobile
node scripts/setup-firebase-phone-auth.js
```

---

## 1. Firebase Console Configuration

### Step 1: Enable Phone Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ethiopian-maids**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone** and toggle to enable
5. Click **Save**

### Step 2: Set SMS Region Policy (Recommended)

To prevent abuse and control costs:

1. Go to **Authentication** → **Settings** → **SMS region policy**
2. Select **Allow only selected regions**
3. Add the regions where your users are located:
   - 🇦🇪 UAE (+971)
   - 🇸🇦 Saudi Arabia (+966)
   - 🇪🇹 Ethiopia (+251)
   - 🇰🇼 Kuwait (+965)
   - 🇶🇦 Qatar (+974)
   - 🇧🇭 Bahrain (+973)
   - 🇴🇲 Oman (+968)

---

## 2. Web Setup

The web implementation uses Firebase JS SDK with reCAPTCHA verification.

### Files Implemented

| File | Purpose |
|------|---------|
| `apps/web/src/lib/firebaseClient.js` | Firebase client with phone auth functions |
| `apps/web/src/hooks/useFirebasePhoneAuth.js` | React hook for phone verification |
| `apps/web/src/pages/Register.jsx` | Registration page with phone verification |

### How It Works

```javascript
// 1. Initialize invisible reCAPTCHA
const recaptchaVerifier = new RecaptchaVerifier(auth, 'button-id', {
  size: 'invisible'
});

// 2. Send verification code
const confirmationResult = await signInWithPhoneNumber(auth, '+971501234567', recaptchaVerifier);

// 3. Verify the code
await confirmationResult.confirm('123456');
```

### Web Domain Configuration

For production, add your domain to Firebase Console:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain (e.g., `ethiopianmaids.com`)

> **Note**: `localhost` works automatically for development.

---

## 3. Android Setup

### Prerequisites

The mobile app uses `expo-firebase-recaptcha` for phone authentication. This package is already installed in the project:

```bash
# Already in package.json - no action needed
"expo-firebase-recaptcha": "^2.3.1"
```

### Step 0: Create Mobile Environment File

1. Copy the example environment file:
   ```bash
   cd apps/mobile
   cp .env.example .env
   ```

2. Fill in your Firebase credentials from Firebase Console → Project Settings:
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ethiopian-maids.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=ethiopian-maids
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ethiopian-maids.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=227663902586
   EXPO_PUBLIC_FIREBASE_APP_ID=1:227663902586:android:...
   ```

### Step 1: Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Project Settings**
2. Under "Your apps", select **Android** (or add Android app if not present)
3. Ensure the package name is: `com.ethiopianmaids.app`
4. Download `google-services.json`
5. Place it in `apps/mobile/google-services.json`

### Step 2: Generate SHA-256 Fingerprint

Firebase Phone Auth requires SHA-256 fingerprint registration.

#### Option A: Debug Keystore (Local Development)

**Windows:**
```cmd
keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android
```

**Mac/Linux:**
```bash
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android
```

#### Option B: Using Setup Script

```bash
cd apps/mobile
node scripts/setup-firebase-phone-auth.js android-sha
```

#### Option C: EAS Build Credentials

For production builds with EAS:

```bash
eas credentials --platform android
```

This shows the SHA-256 fingerprint for your EAS-managed keystore.

#### Option D: Using Gradle (If you have Android Studio)

```bash
cd android
./gradlew signingReport
```

### Step 3: Add SHA-256 to Firebase Console

1. Go to **Firebase Console** → **Project Settings**
2. Select your **Android app**
3. Scroll to "SHA certificate fingerprints"
4. Click **Add fingerprint**
5. Paste the SHA-256 fingerprint (e.g., `05:A2:2C:35:EE:F2:51:...`)

> **Important**: Add fingerprints for BOTH debug and release keystores if different.

### Step 4: Verify Configuration

```bash
cd apps/mobile
node scripts/setup-firebase-phone-auth.js check-config
```

---

## 4. iOS Setup

### Step 1: Download GoogleService-Info.plist

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Project Settings**
2. Under "Your apps", select **iOS** (or add iOS app)
3. Ensure the Bundle ID is: `com.ethiopianmaids.app`
4. Download `GoogleService-Info.plist`
5. Place it in `apps/mobile/GoogleService-Info.plist`

### Step 2: Configure APNs (Required for Phone Auth)

Firebase uses silent push notifications for phone authentication on iOS.

#### 2a. Create APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
3. Click **+** to create a new key
4. Enter a name (e.g., "Ethiopian Maids APNs Key")
5. Check **Apple Push Notifications service (APNs)**
6. Click **Continue** → **Register**
7. **Download** the `.p8` file (you can only download once!)
8. Note the **Key ID** (shown on the page)

#### 2b. Upload APNs Key to Firebase

1. Go to **Firebase Console** → **Project Settings** → **Cloud Messaging**
2. Under "Apple app configuration", find your iOS app
3. Click **Upload** for "APNs Authentication Key"
4. Select the `.p8` file you downloaded
5. Enter the **Key ID**
6. Enter your **Team ID** (found in Apple Developer Portal → Membership)

### Step 3: Configure URL Scheme for reCAPTCHA Fallback

1. Open `apps/mobile/GoogleService-Info.plist`
2. Find the value for `REVERSED_CLIENT_ID` (e.g., `com.googleusercontent.apps.227663902586-xxxxx`)
3. Update `apps/mobile/app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["com.googleusercontent.apps.227663902586-xxxxx"]
          }
        ]
      }
    }
  }
}
```

### Step 4: Verify app.json Configuration

The app.json should include:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.ethiopianmaids.app",
      "googleServicesFile": "./GoogleService-Info.plist",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification", "fetch"],
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR-CLIENT-ID"]
          }
        ]
      },
      "entitlements": {
        "aps-environment": "development"
      }
    }
  }
}
```

---

## 5. Testing with Test Phone Numbers

Firebase allows you to configure test phone numbers that work without sending actual SMS.

### Configure Test Numbers

1. Go to **Firebase Console** → **Authentication** → **Sign-in method**
2. Scroll to **Phone numbers for testing**
3. Click **Add phone number**
4. Add test numbers:

| Phone Number | Verification Code | Use Case |
|--------------|-------------------|----------|
| +1 650-555-1234 | 123456 | US Testing |
| +971 50-555-1234 | 654321 | UAE Testing |
| +251 91-555-1234 | 111222 | Ethiopia Testing |

> **Note**: Use 555-prefixed numbers to avoid conflicts with real numbers.

### Development Mode Flag

For web development, you can disable app verification:

```javascript
// ONLY for development - NEVER in production!
if (import.meta.env.DEV) {
  auth.settings.appVerificationDisabledForTesting = true;
}
```

---

## 6. EAS Build Configuration

### Create eas.json

Ensure `apps/mobile/eas.json` exists:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands

```bash
# Login to EAS
eas login

# Configure project (first time)
eas build:configure

# Development build (both platforms)
eas build --profile development --platform all

# Android only
eas build --profile development --platform android

# iOS only
eas build --profile development --platform ios

# View credentials
eas credentials --platform android
eas credentials --platform ios
```

### Get SHA Fingerprint from EAS

After running `eas credentials --platform android`, you'll see:

```
Keystore
  Key Alias:     [keyAlias]
  Type:          RSA 2048
  MD5:           XX:XX:XX:...
  SHA1:          XX:XX:XX:...
  SHA256:        XX:XX:XX:...  <-- Add this to Firebase Console
```

---

## 7. Troubleshooting

### Common Errors

#### "auth/invalid-app-credential"

**Cause**: SHA fingerprint not registered or APNs not configured

**Solutions**:
- Android: Add SHA-256 fingerprint to Firebase Console
- iOS: Configure APNs authentication key

#### "auth/missing-client-identifier"

**Cause**: reCAPTCHA verification failed or app not configured

**Solutions**:
- Ensure google-services.json is present (Android)
- Ensure GoogleService-Info.plist is present (iOS)
- Add URL scheme for REVERSED_CLIENT_ID (iOS)

#### "auth/captcha-check-failed"

**Cause**: reCAPTCHA domain not authorized

**Solutions**:
- Add domain to Firebase Console → Authentication → Settings → Authorized domains

#### "auth/too-many-requests"

**Cause**: Rate limiting triggered

**Solutions**:
- Wait and try again
- Use test phone numbers for development

#### "auth/invalid-phone-number"

**Cause**: Phone number not in E.164 format

**Solutions**:
- Ensure format is `+[country code][number]` (e.g., `+971501234567`)

#### SMS Not Received

**Possible causes**:
1. Phone number blocked by carrier
2. SMS region policy blocking the country
3. Test phone number (won't receive real SMS)
4. APNs not configured (iOS)

### Debug Logging

**Web (Browser Console):**
```javascript
localStorage.setItem('firebase:debug:*', 'true');
```

**React Native:**
Check the Metro bundler console for `[Firebase]` prefixed logs.

### Verification Checklist

Run the setup script to verify:

```bash
cd apps/mobile
node scripts/setup-firebase-phone-auth.js check-config
```

Manual checklist:

- [ ] Phone provider enabled in Firebase Console
- [ ] SMS region policy allows target countries
- [ ] Test phone numbers configured (development)
- [ ] `google-services.json` in `apps/mobile/` (Android)
- [ ] SHA-256 fingerprint added to Firebase (Android)
- [ ] `GoogleService-Info.plist` in `apps/mobile/` (iOS)
- [ ] APNs authentication key uploaded to Firebase (iOS)
- [ ] URL scheme configured in app.json (iOS)
- [ ] Domain authorized in Firebase (Web)

---

## Mobile Implementation Details

### expo-firebase-recaptcha Integration

The mobile app uses `expo-firebase-recaptcha` for phone authentication on native platforms (Android/iOS). This provides a WebView-based reCAPTCHA verification that works with Expo managed workflow.

#### How It Works

1. **FirebaseRecaptchaVerifierModal**: A modal that presents the reCAPTCHA challenge when needed
2. **Invisible verification**: Attempts invisible verification first, only shows challenge if needed
3. **FirebaseRecaptchaBanner**: Shows Google's reCAPTCHA branding as required

#### Implementation Files

| File | Purpose |
|------|---------|
| `apps/mobile/hooks/usePhoneAuth.ts` | Hook that handles verification with verifier support |
| `apps/mobile/app/onboarding/phone-verify.tsx` | Screen with reCAPTCHA modal integration |

#### Usage Example

```typescript
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

// In component:
const recaptchaVerifier = useRef(null);

// In JSX:
<FirebaseRecaptchaVerifierModal
  ref={recaptchaVerifier}
  firebaseConfig={firebaseConfig}
  attemptInvisibleVerification={true}
/>

// When sending code:
const result = await sendVerificationCode(phone, recaptchaVerifier.current);
```

---

## Files Reference

| Platform | File | Purpose |
|----------|------|---------|
| Web | `apps/web/src/lib/firebaseClient.js` | Firebase client with phone auth |
| Web | `apps/web/src/hooks/useFirebasePhoneAuth.js` | Phone auth React hook |
| Web | `apps/web/src/pages/Register.jsx` | Registration with phone verification |
| Mobile | `apps/mobile/utils/firebaseConfig.ts` | Firebase config with phone auth |
| Mobile | `apps/mobile/hooks/usePhoneAuth.ts` | Phone auth hook for mobile |
| Mobile | `apps/mobile/app/onboarding/phone-verify.tsx` | Phone verification screen with reCAPTCHA |
| Mobile | `apps/mobile/app/auth/register.tsx` | Mobile registration screen |
| Mobile | `apps/mobile/google-services.json` | Android Firebase config |
| Mobile | `apps/mobile/GoogleService-Info.plist` | iOS Firebase config |
| Mobile | `apps/mobile/app.json` | Expo configuration |
| Mobile | `apps/mobile/scripts/setup-firebase-phone-auth.js` | Setup helper script |

---

## Security Best Practices

1. **Never** disable app verification in production
2. Use strong, random verification codes for test numbers
3. Implement rate limiting on your backend
4. Monitor for abuse in Firebase Console → Authentication → Usage
5. Set SMS region policy to only allow necessary countries
6. Phone auth alone is less secure - combine with email/password when possible
7. Rotate test phone numbers periodically

---

**Last Updated**: December 2025
