/**
 * useBiometrics Hook
 *
 * Hook for managing biometric authentication (Face ID, Touch ID, Fingerprint).
 * Handles hardware availability, enrollment, and authentication.
 * Stores credentials securely for biometric-based login.
 */

import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Storage keys
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';

// Types
export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  isEnabled: boolean;
  biometricType: BiometricType;
  supportedTypes: BiometricType[];
}

export interface UseBiometricsReturn {
  state: BiometricState;
  loading: boolean;
  error: string | null;
  authenticate: (reason?: string) => Promise<boolean>;
  enableBiometrics: (email: string) => Promise<boolean>;
  disableBiometrics: () => Promise<boolean>;
  checkBiometricsForLogin: () => Promise<string | null>;
  getBiometricTypeLabel: () => string;
  getBiometricIcon: () => string;
}

/**
 * Convert LocalAuthentication types to our BiometricType
 */
function mapAuthenticationType(type: LocalAuthentication.AuthenticationType): BiometricType {
  switch (type) {
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return 'fingerprint';
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return 'facial';
    case LocalAuthentication.AuthenticationType.IRIS:
      return 'iris';
    default:
      return 'none';
  }
}

/**
 * Hook for biometric authentication
 */
export function useBiometrics(): UseBiometricsReturn {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isEnrolled: false,
    isEnabled: false,
    biometricType: 'none',
    supportedTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check biometric hardware and enrollment status
   */
  const checkBiometricStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if hardware is available
      const compatible = await LocalAuthentication.hasHardwareAsync();

      // Check if biometrics are enrolled (user has set up Face ID/Touch ID)
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      // Get supported authentication types
      const supportedTypesRaw = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const supportedTypes = supportedTypesRaw.map(mapAuthenticationType);

      // Determine primary biometric type
      let primaryType: BiometricType = 'none';
      if (supportedTypes.includes('facial')) {
        primaryType = 'facial';
      } else if (supportedTypes.includes('fingerprint')) {
        primaryType = 'fingerprint';
      } else if (supportedTypes.includes('iris')) {
        primaryType = 'iris';
      }

      // Check if user has enabled biometrics in our app
      const enabledStr = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      const isEnabled = enabledStr === 'true';

      setState({
        isAvailable: compatible,
        isEnrolled: enrolled,
        isEnabled: isEnabled && enrolled, // Only enabled if also enrolled
        biometricType: primaryType,
        supportedTypes,
      });

      console.log('[Biometrics] Status:', {
        compatible,
        enrolled,
        isEnabled,
        primaryType,
        supportedTypes,
      });
    } catch (err) {
      console.error('[Biometrics] Error checking status:', err);
      setError('Failed to check biometric availability');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Authenticate user with biometrics
   */
  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    try {
      if (!state.isAvailable || !state.isEnrolled) {
        setError('Biometrics not available');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow PIN/password as fallback
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        console.log('[Biometrics] Authentication successful');
        return true;
      } else {
        console.log('[Biometrics] Authentication failed:', result.error);
        if (result.error === 'user_cancel') {
          setError('Authentication cancelled');
        } else if (result.error === 'lockout') {
          setError('Too many attempts. Please try again later.');
        } else {
          setError('Authentication failed');
        }
        return false;
      }
    } catch (err) {
      console.error('[Biometrics] Authentication error:', err);
      setError('Authentication error');
      return false;
    }
  }, [state.isAvailable, state.isEnrolled]);

  /**
   * Enable biometrics for the user - stores credentials securely
   */
  const enableBiometrics = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      if (!state.isAvailable) {
        setError('Biometrics not available on this device');
        return false;
      }

      if (!state.isEnrolled) {
        setError('Please set up Face ID/Touch ID in your device settings first');
        return false;
      }

      // Authenticate first to confirm identity
      const authenticated = await authenticate('Confirm your identity to enable biometric sign-in');
      if (!authenticated) {
        return false;
      }

      // Store the credentials securely
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

      setState(prev => ({ ...prev, isEnabled: true }));
      console.log('[Biometrics] Enabled for:', email);
      return true;
    } catch (err) {
      console.error('[Biometrics] Error enabling:', err);
      setError('Failed to enable biometrics');
      return false;
    }
  }, [state.isAvailable, state.isEnrolled, authenticate]);

  /**
   * Disable biometrics
   */
  const disableBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');

      setState(prev => ({ ...prev, isEnabled: false }));
      console.log('[Biometrics] Disabled');
      return true;
    } catch (err) {
      console.error('[Biometrics] Error disabling:', err);
      setError('Failed to disable biometrics');
      return false;
    }
  }, []);

  /**
   * Check if biometrics should be used for login
   * Returns the stored credentials if successful, null otherwise
   */
  const checkBiometricsForLogin = useCallback(async (): Promise<{ email: string; password: string } | null> => {
    try {
      // Check if biometrics are enabled
      const enabledStr = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      if (enabledStr !== 'true') {
        return null;
      }

      // Check if we have stored credentials
      const storedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const storedPassword = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
      if (!storedEmail || !storedPassword) {
        return null;
      }

      // Authenticate with biometrics
      const authenticated = await authenticate('Sign in with biometrics');
      if (authenticated) {
        return { email: storedEmail, password: storedPassword };
      }

      return null;
    } catch (err) {
      console.error('[Biometrics] Error checking for login:', err);
      return null;
    }
  }, [authenticate]);

  /**
   * Get stored email (for display purposes, without requiring biometric auth)
   */
  const getStoredEmail = useCallback(async (): Promise<string | null> => {
    try {
      const enabledStr = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      if (enabledStr !== 'true') {
        return null;
      }
      return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    } catch {
      return null;
    }
  }, []);

  /**
   * Get human-readable label for the biometric type
   */
  const getBiometricTypeLabel = useCallback((): string => {
    switch (state.biometricType) {
      case 'facial':
        return 'Face ID';
      case 'fingerprint':
        return 'Touch ID';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometrics';
    }
  }, [state.biometricType]);

  /**
   * Get icon name for the biometric type (Ionicons)
   */
  const getBiometricIcon = useCallback((): string => {
    switch (state.biometricType) {
      case 'facial':
        return 'scan-outline';
      case 'fingerprint':
        return 'finger-print-outline';
      case 'iris':
        return 'eye-outline';
      default:
        return 'lock-closed-outline';
    }
  }, [state.biometricType]);

  // Check status on mount
  useEffect(() => {
    checkBiometricStatus();
  }, [checkBiometricStatus]);

  return {
    state,
    loading,
    error,
    authenticate,
    enableBiometrics,
    disableBiometrics,
    checkBiometricsForLogin,
    getStoredEmail,
    getBiometricTypeLabel,
    getBiometricIcon,
  };
}

/**
 * Standalone function to check if biometrics are available
 * Useful for quick checks without using the hook
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch {
    return false;
  }
}

/**
 * Standalone function to check if biometrics are enabled in the app
 */
export async function isBiometricsEnabled(): Promise<boolean> {
  try {
    const enabledStr = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabledStr === 'true';
  } catch {
    return false;
  }
}
