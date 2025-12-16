# Firebase Phone Authentication Setup Guide

This guide covers the complete setup for Firebase Phone Authentication across Web, Android, and iOS platforms.

---

## Table of Contents
1. [Firebase Console Configuration](#1-firebase-console-configuration)
2. [Web Setup](#2-web-setup)
3. [Android Setup (Expo)](#3-android-setup-expo)
4. [iOS Setup (Expo)](#4-ios-setup-expo)
5. [Testing with Fictional Phone Numbers](#5-testing-with-fictional-phone-numbers)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Firebase Console Configuration

### Step 1: Enable Phone Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ethiopian-maids**
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Phone** and enable it
5. Click **Save**

### Step 2: Configure Authorized Domains (Web)

1. In **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., `ethiopianmaids.com`)
3. For development, `localhost` is NOT allowed for phone auth
4. Use a custom domain or ngrok for local testing

### Step 3: Set SMS Region Policy (Optional)

To prevent abuse and control costs:

1. Go to **Authentication** > **Settings** > **SMS region policy**
2. Choose either:
   - **Allow all regions** (default)
   - **Allow only selected regions** (recommended for production)
3. Add regions where your users are located:
   - UAE (+971)
   - Saudi Arabia (+966)
   - Ethiopia (+251)
   - Kuwait (+965)
   - Qatar (+974)
   - Bahrain (+973)
   - Oman (+968)

---

## 2. Web Setup

The web implementation is already complete. Here's a summary:

### Files Modified

- `apps/web/src/lib/firebaseClient.js` - Added phone auth functions
- `apps/web/src/hooks/useFirebasePhoneAuth.js` - Phone auth hook
- `apps/web/src/pages/Register.jsx` - Updated registration flow

### How It Works

1. User enters phone number (e.g., `501234567`)
2. Country is selected (auto-adds dial code like `+971`)
3. Invisible reCAPTCHA verifies the request
4. Firebase sends SMS with 6-digit OTP
5. User enters code to verify

### Key Code

```javascript
// Initialize reCAPTCHA
const recaptchaVerifier = new RecaptchaVerifier(auth, 'phone-verify-button', {
  size: 'invisible'
});

// Send OTP
const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

// Verify OTP
await confirmationResult.confirm(code);
```

### Web-Specific Requirements

- **Domain must be authorized** in Firebase Console
- **reCAPTCHA** is automatically handled
- **HTTPS required** for production (except localhost)

---

## 3. Android Setup (Expo)

### Step 1: Add SHA-256 Fingerprint

1. Generate SHA-256 fingerprint:
   ```bash
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # Or for EAS Build
   eas credentials --platform android
   ```

2. Add to Firebase Console:
   - Go to **Project Settings** > **Your apps** > **Android app**
   - Click **Add fingerprint**
   - Paste SHA-256 certificate fingerprint

### Step 2: Download google-services.json

1. In Firebase Console, go to **Project Settings**
2. Select your Android app
3. Download `google-services.json`
4. Place it in `apps/mobile/google-services.json`

### Step 3: Update app.json (Already Done)

The `app.json` already has:
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.ethiopianmaids.app"
    }
  }
}
```

### Step 4: Install Required Packages

For Expo managed workflow with Firebase JS SDK:
```bash
cd apps/mobile
npx expo install firebase
```

The Firebase JS SDK (v11.9.0) is already installed and supports phone auth.

### Step 5: Android Phone Auth Implementation

Create or update `apps/mobile/src/lib/firebasePhoneAuth.js`:

```javascript
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

// For React Native/Expo, use invisible reCAPTCHA
export async function sendPhoneOTP(phoneNumber) {
  // Note: In React Native, reCAPTCHA works differently
  // You may need to use a WebView or custom solution
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber);
  return confirmationResult;
}

export async function verifyPhoneOTP(confirmationResult, code) {
  return await confirmationResult.confirm(code);
}
```

### Alternative: Use @react-native-firebase (Recommended for Native)

For better native performance, consider using `@react-native-firebase`:

```bash
# Requires Expo development build (not Expo Go)
npx expo install @react-native-firebase/app @react-native-firebase/auth
```

---

## 4. iOS Setup (Expo)

### Step 1: Enable Push Notifications

Push notifications are required for silent APNs verification:

1. Apple Developer Account required
2. In Xcode or via EAS:
   - Enable "Push Notifications" capability
   - Enable "Background Modes" > "Remote notifications"

The `app.json` already has:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

### Step 2: Configure APNs in Firebase

1. Generate APNs Authentication Key:
   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - Navigate to **Certificates, Identifiers & Profiles** > **Keys**
   - Create a new key with "Apple Push Notifications service (APNs)"
   - Download the `.p8` file

2. Upload to Firebase:
   - Go to **Project Settings** > **Cloud Messaging**
   - Under "Apple app configuration", upload APNs Authentication Key
   - Enter Key ID and Team ID

### Step 3: Download GoogleService-Info.plist

1. In Firebase Console, go to **Project Settings**
2. Select your iOS app (create one if needed with bundle ID: `com.ethiopianmaids.app`)
3. Download `GoogleService-Info.plist`
4. Place it in `apps/mobile/GoogleService-Info.plist`

### Step 4: Update app.json for iOS

Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.ethiopianmaids.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

### Step 5: URL Scheme for reCAPTCHA Fallback

Add your encoded app ID as a URL scheme:

1. Find your **REVERSED_CLIENT_ID** in `GoogleService-Info.plist`
2. Add to `app.json`:
   ```json
   {
     "expo": {
       "ios": {
         "infoPlist": {
           "CFBundleURLTypes": [
             {
               "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR-CLIENT-ID"]
             }
           ]
         }
       }
     }
   }
   ```

---

## 5. Testing with Fictional Phone Numbers

To avoid SMS costs and quotas during development:

### Configure Test Numbers

1. Go to Firebase Console > **Authentication** > **Sign-in method**
2. Scroll to **Phone numbers for testing**
3. Add test numbers (format: `+1 650-555-3434`):

   | Phone Number | Verification Code |
   |--------------|-------------------|
   | +1 650-555-1234 | 123456 |
   | +971 50-555-1234 | 654321 |
   | +251 91-555-1234 | 111222 |

### Disable App Verification (Development Only)

For web development:
```javascript
// ONLY for development/testing
if (import.meta.env.DEV) {
  auth.settings.appVerificationDisabledForTesting = true;
}
```

**WARNING**: Never disable verification in production!

---

## 6. Troubleshooting

### Common Errors

#### "auth/invalid-app-credential"
- **Cause**: SHA-256 fingerprint not registered or APNs not configured
- **Fix**: Add SHA-256 to Firebase Console (Android) or configure APNs (iOS)

#### "auth/captcha-check-failed"
- **Cause**: reCAPTCHA verification failed
- **Fix**: Ensure domain is authorized in Firebase Console

#### "auth/too-many-requests"
- **Cause**: Rate limiting triggered
- **Fix**: Wait and try again, or use test phone numbers

#### "auth/invalid-phone-number"
- **Cause**: Phone number not in E.164 format
- **Fix**: Ensure format is `+[country code][number]` (e.g., `+971501234567`)

#### "auth/quota-exceeded"
- **Cause**: SMS quota exceeded
- **Fix**: Upgrade Firebase plan or use test numbers

### Debug Logging

Enable Firebase debug logging:
```javascript
// In browser console
localStorage.setItem('firebase:debug:*', true);
```

### Testing Checklist

- [ ] Phone provider enabled in Firebase Console
- [ ] Domain authorized (web)
- [ ] SHA-256 fingerprint added (Android)
- [ ] APNs configured (iOS)
- [ ] google-services.json present (Android)
- [ ] GoogleService-Info.plist present (iOS)
- [ ] Test phone numbers configured
- [ ] SMS region policy allows target regions

---

## Security Best Practices

1. **Never** disable app verification in production
2. Use strong, random verification codes for test numbers
3. Implement rate limiting on your backend
4. Monitor for abuse in Firebase Console
5. Consider additional verification for high-risk actions
6. Phone auth alone is less secure - combine with email/password when possible

---

## Related Files

- `apps/web/src/lib/firebaseClient.js` - Web Firebase client with phone auth
- `apps/web/src/hooks/useFirebasePhoneAuth.js` - React hook for phone auth
- `apps/web/src/pages/Register.jsx` - Registration page with phone verification
- `apps/mobile/app.json` - Expo configuration
- `apps/mobile/google-services.json` - Android Firebase config
- `apps/mobile/GoogleService-Info.plist` - iOS Firebase config (to be added)

---

**Last Updated**: December 2025
