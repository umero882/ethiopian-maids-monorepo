/**
 * useFirebasePhoneAuth Hook
 * Provides Firebase Phone Authentication functionality for phone verification
 *
 * @module hooks/useFirebasePhoneAuth
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  auth,
  initRecaptchaVerifier,
  sendPhoneOTP,
  verifyPhoneOTP,
  cleanupRecaptcha,
} from '@/lib/firebaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('useFirebasePhoneAuth');

// Phone verification states
export const PHONE_VERIFICATION_STATES = {
  IDLE: 'idle',
  SENDING: 'sending',
  CODE_SENT: 'code_sent',
  VERIFYING: 'verifying',
  VERIFIED: 'verified',
  ERROR: 'error',
};

/**
 * Custom hook for Firebase Phone Authentication
 * @param {Object} options - Configuration options
 * @param {string} options.buttonId - ID of the button element for reCAPTCHA (default: 'phone-verify-button')
 * @param {function} options.onVerificationComplete - Callback when verification completes
 * @param {function} options.onError - Callback when an error occurs
 * @returns {Object} Phone auth state and methods
 */
export function useFirebasePhoneAuth(options = {}) {
  const {
    buttonId = 'phone-verify-button',
    onVerificationComplete,
    onError,
  } = options;

  const [state, setState] = useState(PHONE_VERIFICATION_STATES.IDLE);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const confirmationResultRef = useRef(null);
  const recaptchaInitialized = useRef(false);

  // Initialize reCAPTCHA on mount (with delay to ensure DOM is ready)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!recaptchaInitialized.current) {
          initRecaptchaVerifier(buttonId);
          recaptchaInitialized.current = true;
          log.debug('reCAPTCHA pre-initialized on mount');
        }
      } catch (err) {
        log.warn('reCAPTCHA pre-init failed (will retry on send):', err.message);
      }
    }, 1000); // Wait 1s for DOM to be fully ready

    return () => {
      clearTimeout(timer);
      cleanupRecaptcha();
      recaptchaInitialized.current = false;
    };
  }, [buttonId]);

  /**
   * Initialize reCAPTCHA verifier
   */
  const initializeRecaptcha = useCallback(() => {
    if (recaptchaInitialized.current && window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    try {
      // Clean up any stale verifier first
      cleanupRecaptcha();
      recaptchaInitialized.current = false;

      const verifier = initRecaptchaVerifier(buttonId);
      recaptchaInitialized.current = true;
      log.debug('reCAPTCHA initialized');
      return verifier;
    } catch (err) {
      log.error('Failed to initialize reCAPTCHA:', err);
      throw err;
    }
  }, [buttonId]);

  /**
   * Send verification code to phone number
   * @param {string} phone - Phone number in E.164 format
   * @returns {Promise<boolean>} Success status
   */
  const sendVerificationCode = useCallback(async (phone) => {
    if (!phone) {
      const err = new Error('Phone number is required');
      setError(err.message);
      onError?.(err);
      return false;
    }

    // Ensure phone number is in E.164 format
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      const err = new Error('Phone number must be in E.164 format (e.g., +971501234567)');
      setError(err.message);
      onError?.(err);
      return false;
    }

    setState(PHONE_VERIFICATION_STATES.SENDING);
    setError(null);
    setPhoneNumber(formattedPhone);

    try {
      const recaptchaVerifier = initializeRecaptcha();
      const confirmationResult = await sendPhoneOTP(formattedPhone, recaptchaVerifier);
      confirmationResultRef.current = confirmationResult;

      setState(PHONE_VERIFICATION_STATES.CODE_SENT);
      log.info('Verification code sent to:', formattedPhone);
      return true;
    } catch (err) {
      log.error('Failed to send verification code:', err);
      setState(PHONE_VERIFICATION_STATES.ERROR);
      setError(err.message);
      onError?.(err);

      // Reset reCAPTCHA on error
      cleanupRecaptcha();
      recaptchaInitialized.current = false;

      return false;
    }
  }, [initializeRecaptcha, onError]);

  /**
   * Verify the OTP code
   * @param {string} code - 6-digit verification code
   * @returns {Promise<boolean>} Success status
   */
  const verifyCode = useCallback(async (code) => {
    if (!code || code.length !== 6) {
      const err = new Error('Please enter a valid 6-digit code');
      setError(err.message);
      onError?.(err);
      return false;
    }

    if (!confirmationResultRef.current) {
      const err = new Error('No verification in progress. Please request a new code.');
      setError(err.message);
      onError?.(err);
      return false;
    }

    setState(PHONE_VERIFICATION_STATES.VERIFYING);
    setError(null);

    try {
      await verifyPhoneOTP(confirmationResultRef.current, code);

      setState(PHONE_VERIFICATION_STATES.VERIFIED);
      log.info('Phone number verified successfully');

      onVerificationComplete?.(phoneNumber);
      return true;
    } catch (err) {
      log.error('Verification failed:', err);
      setState(PHONE_VERIFICATION_STATES.ERROR);
      setError(err.message);
      onError?.(err);
      return false;
    }
  }, [phoneNumber, onVerificationComplete, onError]);

  /**
   * Resend verification code
   * @returns {Promise<boolean>} Success status
   */
  const resendCode = useCallback(async () => {
    if (!phoneNumber) {
      const err = new Error('No phone number set. Please start verification again.');
      setError(err.message);
      onError?.(err);
      return false;
    }

    // Reset reCAPTCHA before resending
    cleanupRecaptcha();
    recaptchaInitialized.current = false;

    return sendVerificationCode(phoneNumber);
  }, [phoneNumber, sendVerificationCode, onError]);

  /**
   * Reset the verification state
   */
  const reset = useCallback(() => {
    setState(PHONE_VERIFICATION_STATES.IDLE);
    setError(null);
    setPhoneNumber('');
    confirmationResultRef.current = null;
    cleanupRecaptcha();
    recaptchaInitialized.current = false;
    log.debug('Phone verification state reset');
  }, []);

  /**
   * Change phone number (resets verification)
   * @param {string} newPhone - New phone number
   */
  const changePhoneNumber = useCallback((newPhone) => {
    reset();
    setPhoneNumber(newPhone);
  }, [reset]);

  return {
    // State
    state,
    isIdle: state === PHONE_VERIFICATION_STATES.IDLE,
    isSending: state === PHONE_VERIFICATION_STATES.SENDING,
    isCodeSent: state === PHONE_VERIFICATION_STATES.CODE_SENT,
    isVerifying: state === PHONE_VERIFICATION_STATES.VERIFYING,
    isVerified: state === PHONE_VERIFICATION_STATES.VERIFIED,
    hasError: state === PHONE_VERIFICATION_STATES.ERROR,
    error,
    phoneNumber,

    // Actions
    sendVerificationCode,
    verifyCode,
    resendCode,
    reset,
    changePhoneNumber,
  };
}

export default useFirebasePhoneAuth;
