/**
 * Firebase Client Configuration
 * Provides Firebase Auth and App instances for the application
 * Uses Hasura GraphQL for data operations.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { createLogger } from '@/utils/logger';

const log = createLogger('FirebaseClient');

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  const missingEnvVars = missingKeys.map(key => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
  log.error('Missing Firebase configuration:', missingEnvVars);
  // Don't throw - allow app to load with degraded functionality
  // throw new Error(`Missing Firebase configuration: ${missingEnvVars.join(', ')}`);
}

// Initialize Firebase (only once)
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    log.info('Firebase app initialized successfully');
  } catch (error) {
    log.error('Failed to initialize Firebase:', error);
  }
} else {
  app = getApps()[0];
  log.debug('Using existing Firebase app instance');
}

// Get Auth instance
const auth = app ? getAuth(app) : null;

// Set persistence to local storage (survives browser refresh)
if (auth) {
  setPersistence(auth, browserLocalPersistence)
    .then(() => log.debug('Firebase auth persistence set to localStorage'))
    .catch((error) => log.error('Failed to set Firebase auth persistence:', error));
}

// Connect to Firebase Auth emulator in development (if configured)
if (auth && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
  const emulatorPort = import.meta.env.VITE_FIREBASE_EMULATOR_PORT || '9099';
  connectAuthEmulator(auth, `http://${emulatorHost}:${emulatorPort}`, { disableWarnings: true });
  log.info(`Connected to Firebase Auth emulator at ${emulatorHost}:${emulatorPort}`);
}

// Token storage key for Apollo client
export const FIREBASE_TOKEN_KEY = 'firebase_auth_token';

/**
 * Get the current Firebase ID token
 * @returns {Promise<string|null>} The ID token or null
 */
export async function getIdToken() {
  if (!auth?.currentUser) {
    return null;
  }

  try {
    const token = await auth.currentUser.getIdToken();
    // Store in localStorage for Apollo client
    localStorage.setItem(FIREBASE_TOKEN_KEY, token);
    return token;
  } catch (error) {
    log.error('Failed to get Firebase ID token:', error);
    return null;
  }
}

/**
 * Force refresh the Firebase ID token
 * @returns {Promise<string|null>} The new ID token or null
 */
export async function refreshIdToken() {
  if (!auth?.currentUser) {
    return null;
  }

  try {
    const token = await auth.currentUser.getIdToken(true); // Force refresh
    localStorage.setItem(FIREBASE_TOKEN_KEY, token);
    log.debug('Firebase ID token refreshed');
    return token;
  } catch (error) {
    log.error('Failed to refresh Firebase ID token:', error);
    return null;
  }
}

/**
 * Clear the stored Firebase token
 */
export function clearStoredToken() {
  localStorage.removeItem(FIREBASE_TOKEN_KEY);
  log.debug('Firebase token cleared from storage');
}

/**
 * Get the stored Firebase token (synchronous, from localStorage)
 * @returns {string|null} The stored token or null
 */
export function getStoredToken() {
  return localStorage.getItem(FIREBASE_TOKEN_KEY);
}

// Get Storage instance
const storage = app ? getStorage(app) : null;

if (storage) {
  log.info('Firebase Storage initialized successfully');
} else {
  log.warn('Firebase Storage not available - file uploads will not work');
}

/**
 * Upload a file to Firebase Storage
 * @param {File|Blob} file - The file to upload
 * @param {string} path - The storage path (e.g., 'maid-profiles/{userId}/videos/cv.webm')
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<{url: string, path: string}>} The download URL and storage path
 */
export async function uploadFile(file, path, onProgress) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
        log.debug(`Upload progress: ${progress.toFixed(1)}%`);
      },
      (error) => {
        log.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          log.info(`File uploaded successfully: ${path}`);
          resolve({ url: downloadURL, path: path });
        } catch (error) {
          log.error('Failed to get download URL:', error);
          reject(error);
        }
      }
    );
  });
}

/**
 * Delete a file from Firebase Storage
 * @param {string} path - The storage path to delete
 */
export async function deleteFile(path) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    log.info(`File deleted: ${path}`);
  } catch (error) {
    // Ignore errors for files that don't exist
    if (error.code !== 'storage/object-not-found') {
      log.error('Delete failed:', error);
      throw error;
    }
  }
}

/**
 * Upload a video CV to Firebase Storage
 * @param {string} userId - The user's ID
 * @param {Blob|File} videoBlob - The video file
 * @param {function} onProgress - Optional progress callback
 * @returns {Promise<string>} The download URL
 */
export async function uploadVideoCV(userId, videoBlob, onProgress) {
  const extension = videoBlob.type?.includes('webm') ? 'webm' : 'mp4';
  const path = `maid-profiles/${userId}/video-cv/cv-${Date.now()}.${extension}`;
  const result = await uploadFile(videoBlob, path, onProgress);
  return result.url;
}

/**
 * Upload a document to Firebase Storage
 * @param {string} userId - The user's ID
 * @param {File} file - The document file
 * @param {string} documentType - The type of document
 * @param {function} onProgress - Optional progress callback
 * @returns {Promise<{url: string, path: string}>} The download URL and path
 */
export async function uploadDocument(userId, file, documentType, onProgress) {
  const extension = file.name?.split('.').pop() || 'pdf';
  const sanitizedName = file.name?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'document';
  const path = `maid-profiles/${userId}/documents/${documentType}/${Date.now()}-${sanitizedName}`;
  return await uploadFile(file, path, onProgress);
}

// Phone Authentication Utilities

/**
 * Initialize invisible reCAPTCHA verifier for phone authentication
 * @param {string} buttonId - The ID of the button element that triggers phone verification
 * @returns {RecaptchaVerifier} The reCAPTCHA verifier instance
 */
export function initRecaptchaVerifier(buttonId = 'phone-sign-in-button') {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  // Clear any existing recaptcha
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      log.warn('Failed to clear existing recaptcha:', e);
    }
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {
      log.debug('reCAPTCHA solved successfully');
    },
    'expired-callback': () => {
      log.warn('reCAPTCHA expired');
    }
  });

  return window.recaptchaVerifier;
}

/**
 * Send OTP to phone number for verification
 * @param {string} phoneNumber - Phone number in E.164 format (+1234567890)
 * @param {RecaptchaVerifier} recaptchaVerifier - The reCAPTCHA verifier instance
 * @returns {Promise<ConfirmationResult>} Confirmation result to verify OTP
 */
export async function sendPhoneOTP(phoneNumber, recaptchaVerifier) {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    throw new Error('Phone number must be in E.164 format (e.g., +12025551234)');
  }

  try {
    log.debug('Sending OTP to:', phoneNumber);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    log.info('OTP sent successfully');
    return confirmationResult;
  } catch (error) {
    log.error('Failed to send OTP:', error);

    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please use international format (e.g., +12025551234)');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please try again later.');
    }

    throw error;
  }
}

/**
 * Verify OTP code
 * @param {ConfirmationResult} confirmationResult - The confirmation result from sendPhoneOTP
 * @param {string} code - The 6-digit OTP code entered by user
 * @returns {Promise<UserCredential>} The user credential if verification succeeds
 */
export async function verifyPhoneOTP(confirmationResult, code) {
  if (!confirmationResult) {
    throw new Error('No confirmation result. Please request a new OTP.');
  }

  if (!code || code.length !== 6) {
    throw new Error('Please enter a valid 6-digit code');
  }

  try {
    log.debug('Verifying OTP code');
    const result = await confirmationResult.confirm(code);
    log.info('Phone verification successful');
    return result;
  } catch (error) {
    log.error('OTP verification failed:', error);

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    throw error;
  }
}

/**
 * Link phone number to existing user account
 * @param {string} verificationId - The verification ID from confirmation result
 * @param {string} code - The 6-digit OTP code
 * @returns {Promise<UserCredential>} The linked user credential
 */
export async function linkPhoneToAccount(verificationId, code) {
  if (!auth?.currentUser) {
    throw new Error('No user logged in');
  }

  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const result = await linkWithCredential(auth.currentUser, credential);
    log.info('Phone number linked to account successfully');
    return result;
  } catch (error) {
    log.error('Failed to link phone number:', error);

    if (error.code === 'auth/provider-already-linked') {
      throw new Error('A phone number is already linked to this account');
    } else if (error.code === 'auth/credential-already-in-use') {
      throw new Error('This phone number is already associated with another account');
    }

    throw error;
  }
}

/**
 * Clean up reCAPTCHA verifier
 */
export function cleanupRecaptcha() {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
      log.debug('reCAPTCHA cleaned up');
    } catch (e) {
      log.warn('Failed to cleanup recaptcha:', e);
    }
  }
}

export { app, auth, storage, RecaptchaVerifier, PhoneAuthProvider };
export default auth;
