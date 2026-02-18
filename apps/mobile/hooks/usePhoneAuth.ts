/**
 * usePhoneAuth Hook for Mobile
 *
 * Provides Firebase Phone Authentication functionality for Expo/React Native.
 *
 * Important Notes:
 * - On native (Android/iOS), uses expo-firebase-recaptcha for WebView-based verification
 * - On web, uses invisible reCAPTCHA
 * - In development, test phone numbers can bypass verification
 * - See FIREBASE_PHONE_AUTH_SETUP.md for complete setup
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  auth,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from '../utils/firebaseConfig';
import type {
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth';

// Phone verification states
export type PhoneVerificationState =
  | 'idle'
  | 'sending'
  | 'code_sent'
  | 'verifying'
  | 'verified'
  | 'error';

interface UsePhoneAuthOptions {
  onVerificationComplete?: (phoneNumber: string) => void;
  onError?: (error: string) => void;
}

// Return type for sendVerificationCode - matches what phone-verify.tsx expects
interface SendVerificationResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

// Options for sendVerificationCode
interface SendCodeOptions {
  phone: string;
  verifier?: ApplicationVerifier;  // For native platforms using expo-firebase-recaptcha
}

// Return type for verifyCode
interface VerifyCodeResult {
  success: boolean;
  error?: string;
}

interface UsePhoneAuthReturn {
  // State
  state: PhoneVerificationState;
  isIdle: boolean;
  isSending: boolean;
  isCodeSent: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  hasError: boolean;
  error: string | null;
  phoneNumber: string;
  isLoading: boolean; // Alias for isSending or isVerifying

  // Actions
  sendVerificationCode: (phone: string, verifier?: ApplicationVerifier) => Promise<SendVerificationResult>;
  verifyCode: (verificationId: string | null, code: string) => Promise<VerifyCodeResult>;
  resendCode: (verifier?: ApplicationVerifier) => Promise<SendVerificationResult>;
  reset: () => void;

  // For native platforms - store verifier reference
  setRecaptchaVerifier: (verifier: ApplicationVerifier | null) => void;
}

export function usePhoneAuth(options: UsePhoneAuthOptions = {}): UsePhoneAuthReturn {
  const { onVerificationComplete, onError } = options;

  const [state, setState] = useState<PhoneVerificationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Store confirmation result for web platform
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  // Store verifier for native platforms (from expo-firebase-recaptcha)
  const nativeVerifierRef = useRef<ApplicationVerifier | null>(null);

  // Enable development mode for testing (disables app verification)
  // This allows testing without configuring SHA-256 fingerprints
  useEffect(() => {
    if (__DEV__ && Platform.OS === 'web') {
      console.log('[PhoneAuth] Enabling development mode (app verification disabled)');
      // @ts-ignore - Firebase auth settings
      auth.settings = auth.settings || {};
      // @ts-ignore - Firebase auth settings
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  // Setup invisible reCAPTCHA for web platform
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Create a container for reCAPTCHA (must be visible for it to work)
      // Position it off-screen instead of using display:none
      const container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
      recaptchaContainerRef.current = container;

      console.log('[PhoneAuth] reCAPTCHA container created');

      return () => {
        // Cleanup reCAPTCHA on unmount
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };
    }
  }, []);

  /**
   * Initialize or get reCAPTCHA verifier for web
   */
  const getRecaptchaVerifier = useCallback(async (): Promise<ApplicationVerifier | undefined> => {
    if (Platform.OS !== 'web') {
      console.log('[PhoneAuth] Not on web platform, skipping reCAPTCHA');
      return undefined;
    }

    try {
      console.log('[PhoneAuth] Creating reCAPTCHA verifier...');

      // Clear existing verifier
      if (recaptchaVerifierRef.current) {
        try {
          console.log('[PhoneAuth] Clearing existing verifier');
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.log('[PhoneAuth] Clear verifier error (ignored):', e);
        }
        recaptchaVerifierRef.current = null;
      }

      // Ensure container exists
      if (!document.getElementById('recaptcha-container')) {
        console.log('[PhoneAuth] Creating container as it was missing');
        const container = document.createElement('div');
        container.id = 'recaptcha-container';
        container.style.position = 'fixed';
        container.style.bottom = '0';
        container.style.right = '0';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
      }

      // Create new invisible reCAPTCHA verifier
      console.log('[PhoneAuth] Instantiating RecaptchaVerifier...');
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('[PhoneAuth] reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('[PhoneAuth] reCAPTCHA expired');
            setError('reCAPTCHA expired. Please try again.');
          },
        }
      );

      // Render the verifier (required for invisible reCAPTCHA)
      console.log('[PhoneAuth] Rendering reCAPTCHA...');
      await recaptchaVerifierRef.current.render();
      console.log('[PhoneAuth] reCAPTCHA rendered successfully');

      return recaptchaVerifierRef.current;
    } catch (e: any) {
      console.error('[PhoneAuth] Failed to create reCAPTCHA verifier:', e);
      console.error('[PhoneAuth] Error details:', e.code, e.message);
      return undefined;
    }
  }, []);

  /**
   * Validate E.164 format
   */
  const isValidE164 = useCallback((phone: string): boolean => {
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }, []);

  /**
   * Set the reCAPTCHA verifier for native platforms
   * Call this with the verifier from FirebaseRecaptchaVerifierModal
   */
  const setRecaptchaVerifier = useCallback((verifier: ApplicationVerifier | null) => {
    nativeVerifierRef.current = verifier;
    console.log('[PhoneAuth] Native verifier set:', verifier ? 'yes' : 'no');
  }, []);

  /**
   * Send verification code
   * @param phone - Phone number in E.164 format (e.g., +251912345678)
   * @param verifier - Optional ApplicationVerifier for native platforms (from expo-firebase-recaptcha)
   */
  const sendVerificationCode = useCallback(
    async (phone: string, verifier?: ApplicationVerifier): Promise<SendVerificationResult> => {
      if (!phone) {
        const errorMsg = 'Phone number is required';
        setError(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Validate E.164 format
      if (!isValidE164(phone)) {
        const errorMsg = 'Invalid phone number format. Please include country code.';
        setError(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      setState('sending');
      setError(null);
      setPhoneNumber(phone);

      try {
        console.log('[PhoneAuth] Sending verification code to:', phone);
        console.log('[PhoneAuth] Platform:', Platform.OS);

        let appVerifier: ApplicationVerifier | undefined;

        if (Platform.OS === 'web') {
          // Web platform: Use RecaptchaVerifier (invisible reCAPTCHA)
          console.log('[PhoneAuth] Getting reCAPTCHA verifier for web...');
          appVerifier = await getRecaptchaVerifier();

          if (!appVerifier) {
            throw new Error('Failed to initialize reCAPTCHA verifier');
          }
        } else {
          // Native platform (iOS/Android): Use provided verifier or stored native verifier
          // This should be from expo-firebase-recaptcha's FirebaseRecaptchaVerifierModal
          appVerifier = verifier || nativeVerifierRef.current || undefined;

          if (!appVerifier) {
            console.log('[PhoneAuth] No verifier provided for native platform');
            const errorMsg = 'Please complete the security verification first.';
            setError(errorMsg);
            setState('error');
            onError?.(errorMsg);
            return { success: false, error: errorMsg };
          }

          console.log('[PhoneAuth] Using provided verifier for native platform');
        }

        console.log('[PhoneAuth] Calling signInWithPhoneNumber...');
        const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);

        console.log('[PhoneAuth] signInWithPhoneNumber returned confirmation');
        confirmationResultRef.current = confirmation;

        const verificationId = `verification-${Date.now()}`;
        console.log('[PhoneAuth] Verification code sent successfully');
        setState('code_sent');

        return { success: true, verificationId };
      } catch (err: any) {
        console.error('[PhoneAuth] Failed to send verification code:', err);

        let errorMsg = 'Failed to send verification code';

        if (err.code === 'auth/invalid-phone-number') {
          errorMsg = 'Invalid phone number. Please check and try again.';
        } else if (err.code === 'auth/too-many-requests') {
          errorMsg = 'Too many attempts. Please try again later.';
        } else if (err.code === 'auth/quota-exceeded') {
          errorMsg = 'SMS quota exceeded. Please try again later.';
        } else if (err.code === 'auth/captcha-check-failed') {
          errorMsg = 'Security check failed. Please try again.';
        } else if (err.code === 'auth/missing-client-identifier') {
          errorMsg = 'App configuration error. Please contact support.';
        } else if (err.code === 'auth/invalid-app-credential') {
          errorMsg = 'App verification failed. Please try again.';
        } else if (err.code === 'auth/argument-error') {
          errorMsg = 'Verification setup failed. Please try again.';
        } else if (err.message) {
          errorMsg = err.message;
        }

        setState('error');
        setError(errorMsg);
        onError?.(errorMsg);

        return { success: false, error: errorMsg };
      }
    },
    [isValidE164, getRecaptchaVerifier, onError]
  );

  /**
   * Verify the OTP code
   * @param verificationId - Verification ID from sendVerificationCode (not used for web, kept for API compatibility)
   * @param code - 6-digit verification code
   */
  const verifyCode = useCallback(
    async (verificationId: string | null, code: string): Promise<VerifyCodeResult> => {
      if (!code || code.length !== 6) {
        const errorMsg = 'Please enter a valid 6-digit code';
        setError(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!confirmationResultRef.current) {
        const errorMsg = 'No verification in progress. Please request a new code.';
        setError(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      setState('verifying');
      setError(null);

      try {
        console.log('[PhoneAuth] Verifying code...');

        await confirmationResultRef.current.confirm(code);

        console.log('[PhoneAuth] Phone verification successful');
        setState('verified');
        confirmationResultRef.current = null;
        onVerificationComplete?.(phoneNumber);

        return { success: true };
      } catch (err: any) {
        console.error('[PhoneAuth] Verification failed:', err);

        let errorMsg = 'Verification failed';

        if (err.code === 'auth/invalid-verification-code') {
          errorMsg = 'Invalid code. Please check and try again.';
        } else if (err.code === 'auth/code-expired') {
          errorMsg = 'Code has expired. Please request a new one.';
        } else if (err.message) {
          errorMsg = err.message;
        }

        setState('error');
        setError(errorMsg);
        onError?.(errorMsg);

        return { success: false, error: errorMsg };
      }
    },
    [phoneNumber, onVerificationComplete, onError]
  );

  /**
   * Resend verification code
   * @param verifier - Optional ApplicationVerifier for native platforms
   */
  const resendCode = useCallback(async (verifier?: ApplicationVerifier): Promise<SendVerificationResult> => {
    if (!phoneNumber) {
      const errorMsg = 'No phone number set';
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Clear existing confirmation
    confirmationResultRef.current = null;

    return sendVerificationCode(phoneNumber, verifier);
  }, [phoneNumber, sendVerificationCode, onError]);

  /**
   * Reset verification state
   */
  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setPhoneNumber('');
    confirmationResultRef.current = null;
  }, []);

  const isLoading = state === 'sending' || state === 'verifying';

  return {
    // State
    state,
    isIdle: state === 'idle',
    isSending: state === 'sending',
    isCodeSent: state === 'code_sent',
    isVerifying: state === 'verifying',
    isVerified: state === 'verified',
    hasError: state === 'error',
    error,
    phoneNumber,
    isLoading,

    // Actions
    sendVerificationCode,
    verifyCode,
    resendCode,
    reset,
    setRecaptchaVerifier,
  };
}

export default usePhoneAuth;
