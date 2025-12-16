/**
 * usePhoneAuth Hook for Mobile
 *
 * Provides Firebase Phone Authentication functionality for Expo/React Native.
 *
 * Important Notes:
 * - In development, use test phone numbers configured in Firebase Console
 * - For production, requires SHA-256 (Android) and APNs (iOS) configuration
 * - See FIREBASE_PHONE_AUTH_SETUP.md for complete setup
 */

import { useState, useCallback } from 'react';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  resetPhoneVerification,
  hasActiveVerification,
} from '../utils/firebaseConfig';

// Phone verification states
export type PhoneVerificationState =
  | 'idle'
  | 'sending'
  | 'code_sent'
  | 'verifying'
  | 'verified'
  | 'error';

// Country dial codes
const COUNTRY_DIAL_CODES: Record<string, string> = {
  SA: '+966',
  AE: '+971',
  KW: '+965',
  QA: '+974',
  BH: '+973',
  OM: '+968',
  ET: '+251',
  LB: '+961',
  JO: '+962',
  US: '+1',
  GB: '+44',
  CA: '+1',
};

interface UsePhoneAuthOptions {
  onVerificationComplete?: (phoneNumber: string) => void;
  onError?: (error: string) => void;
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

  // Actions
  sendVerificationCode: (phone: string, countryCode?: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  resendCode: () => Promise<boolean>;
  reset: () => void;
  formatPhoneToE164: (phone: string, countryCode: string) => string;
}

export function usePhoneAuth(options: UsePhoneAuthOptions = {}): UsePhoneAuthReturn {
  const { onVerificationComplete, onError } = options;

  const [state, setState] = useState<PhoneVerificationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  /**
   * Format phone number to E.164 format
   */
  const formatPhoneToE164 = useCallback((phone: string, countryCode: string): string => {
    if (!phone) return '';

    let cleaned = phone.trim();

    // If already in E.164 format
    if (cleaned.startsWith('+') && cleaned.length > 10) {
      return cleaned;
    }

    // Remove non-digit characters except +
    cleaned = cleaned.replace(/[^\d+]/g, '');

    // If starts with +, return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Get dial code from country
    const dialCode = COUNTRY_DIAL_CODES[countryCode] || COUNTRY_DIAL_CODES['AE'];

    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    return `${dialCode}${cleaned}`;
  }, []);

  /**
   * Validate E.164 format
   */
  const isValidE164 = useCallback((phone: string): boolean => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }, []);

  /**
   * Send verification code
   */
  const sendVerificationCode = useCallback(
    async (phone: string, countryCode: string = 'AE'): Promise<boolean> => {
      if (!phone) {
        const errorMsg = 'Phone number is required';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }

      // Format to E.164
      const formattedPhone = formatPhoneToE164(phone, countryCode);

      if (!isValidE164(formattedPhone)) {
        const errorMsg = 'Invalid phone number format';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }

      setState('sending');
      setError(null);
      setPhoneNumber(formattedPhone);

      const result = await sendPhoneOTP(formattedPhone);

      if (result.success) {
        setState('code_sent');
        return true;
      } else {
        setState('error');
        setError(result.error || 'Failed to send code');
        onError?.(result.error || 'Failed to send code');
        return false;
      }
    },
    [formatPhoneToE164, isValidE164, onError]
  );

  /**
   * Verify the OTP code
   */
  const verifyCode = useCallback(
    async (code: string): Promise<boolean> => {
      if (!code || code.length !== 6) {
        const errorMsg = 'Please enter a valid 6-digit code';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }

      setState('verifying');
      setError(null);

      const result = await verifyPhoneOTP(code);

      if (result.success) {
        setState('verified');
        onVerificationComplete?.(phoneNumber);
        return true;
      } else {
        setState('error');
        setError(result.error || 'Verification failed');
        onError?.(result.error || 'Verification failed');
        return false;
      }
    },
    [phoneNumber, onVerificationComplete, onError]
  );

  /**
   * Resend verification code
   */
  const resendCode = useCallback(async (): Promise<boolean> => {
    if (!phoneNumber) {
      const errorMsg = 'No phone number set';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    resetPhoneVerification();
    return sendVerificationCode(phoneNumber);
  }, [phoneNumber, sendVerificationCode, onError]);

  /**
   * Reset verification state
   */
  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setPhoneNumber('');
    resetPhoneVerification();
  }, []);

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

    // Actions
    sendVerificationCode,
    verifyCode,
    resendCode,
    reset,
    formatPhoneToE164,
  };
}

export default usePhoneAuth;
