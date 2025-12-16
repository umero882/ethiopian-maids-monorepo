/**
 * Firebase Configuration for Mobile App (Expo)
 *
 * Uses the Firebase JS SDK with custom persistence using expo-secure-store.
 * This is compatible with Expo managed workflow.
 *
 * Phone Authentication Notes:
 * - For phone auth in Expo, test phone numbers work in development
 * - For production, requires proper SHA-256 (Android) and APNs (iOS) configuration
 * - See FIREBASE_PHONE_AUTH_SETUP.md for complete setup instructions
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  ApplicationVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration - same project as web
// Note: storageBucket should be in format 'project-id.appspot.com' for older projects
// or 'project-id.firebasestorage.app' for newer projects
// Firebase configuration from environment variables
// NEVER hardcode API keys - use .env file with EXPO_PUBLIC_ prefix
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate required configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('[Firebase] Missing required environment variables. Please set EXPO_PUBLIC_FIREBASE_* in .env');
}

// Initialize Firebase (only once)
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] App initialized with project:', firebaseConfig.projectId);
  console.log('[Firebase] Storage bucket:', firebaseConfig.storageBucket);
  auth = getAuth(app);
  storage = getStorage(app);
  console.log('[Firebase] Auth and Storage initialized');
  console.log('[Firebase] Storage bucket URL:', `gs://${firebaseConfig.storageBucket}`);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  storage = getStorage(app);
  console.log('[Firebase] Using existing Firebase app instance');
}

// Store confirmation result for phone verification
let confirmationResult: ConfirmationResult | null = null;

/**
 * Send OTP to phone number
 * Note: In Expo managed workflow, this requires either:
 * 1. Test phone numbers configured in Firebase Console (development)
 * 2. Proper SHA-256 (Android) and APNs (iOS) configuration (production)
 *
 * @param phoneNumber - Phone number in E.164 format (e.g., +971501234567)
 * @param verifier - Optional custom application verifier
 */
export async function sendPhoneOTP(
  phoneNumber: string,
  verifier?: ApplicationVerifier
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!phoneNumber.startsWith('+')) {
      return { success: false, error: 'Phone number must be in E.164 format (e.g., +971501234567)' };
    }

    console.log('[Firebase] Sending OTP to:', phoneNumber);

    // For React Native without reCAPTCHA, we need test phone numbers
    // or proper native configuration
    confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      verifier as ApplicationVerifier
    );

    console.log('[Firebase] OTP sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase] Failed to send OTP:', error);

    // Provide user-friendly error messages
    let errorMessage = error.message || 'Failed to send verification code';

    if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Invalid phone number format. Please use international format.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.code === 'auth/missing-client-identifier') {
      errorMessage = 'Phone verification requires app configuration. Please use test phone numbers in development.';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Verify the OTP code
 * @param code - 6-digit verification code
 */
export async function verifyPhoneOTP(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'No verification in progress. Please request a new code.' };
    }

    if (!code || code.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit code' };
    }

    console.log('[Firebase] Verifying OTP code');
    await confirmationResult.confirm(code);

    console.log('[Firebase] Phone verification successful');
    confirmationResult = null; // Clear after successful verification
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase] OTP verification failed:', error);

    let errorMessage = error.message || 'Verification failed';

    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'Invalid verification code. Please try again.';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = 'Verification code has expired. Please request a new one.';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Reset phone verification state
 */
export function resetPhoneVerification(): void {
  confirmationResult = null;
}

/**
 * Check if there's an active phone verification in progress
 */
export function hasActiveVerification(): boolean {
  return confirmationResult !== null;
}

export {
  app,
  auth,
  storage,
  firebaseConfig,
  PhoneAuthProvider,
  signInWithPhoneNumber,
};
export type { ConfirmationResult };
export default auth;
