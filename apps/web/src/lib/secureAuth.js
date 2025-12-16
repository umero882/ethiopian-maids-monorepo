/**
 * Secure Authentication System
 * Implements secure authentication with rate limiting, session management, and brute force protection
 *
 * UPDATED: Now uses Firebase Auth instead of Supabase Auth
 */

import { auth, FIREBASE_TOKEN_KEY, clearStoredToken } from './firebaseClient';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { validateField } from './inputValidation';
import { clearCSRFToken } from './csrfProtection';

// =============================================
// RATE LIMITING & BRUTE FORCE PROTECTION
// =============================================

const RATE_LIMIT_STORAGE_KEY = 'auth_rate_limit';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Get rate limiting data for an identifier (email/IP)
 * @param {string} identifier - Email or IP address
 * @returns {Object} Rate limiting data
 */
function getRateLimitData(identifier) {
  const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  const data = stored ? JSON.parse(stored) : {};
  return data[identifier] || { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
}

/**
 * Update rate limiting data
 * @param {string} identifier - Email or IP address
 * @param {Object} data - Rate limiting data
 */
function setRateLimitData(identifier, data) {
  const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  const allData = stored ? JSON.parse(stored) : {};
  allData[identifier] = data;
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(allData));
}

/**
 * Check if identifier is rate limited
 * @param {string} identifier - Email or IP address
 * @returns {Object} Rate limit status
 */
export function checkRateLimit(identifier) {
  const data = getRateLimitData(identifier);
  const now = Date.now();

  // Check if currently locked out
  if (data.lockedUntil > now) {
    const remainingTime = Math.ceil((data.lockedUntil - now) / 1000 / 60);
    return {
      isLimited: true,
      reason: 'locked_out',
      remainingTime,
      message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
    };
  }

  // Reset attempts if window has passed
  if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
    data.attempts = 0;
  }

  // Check if too many attempts in current window
  if (data.attempts >= MAX_LOGIN_ATTEMPTS) {
    data.lockedUntil = now + LOCKOUT_DURATION;
    setRateLimitData(identifier, data);
    return {
      isLimited: true,
      reason: 'too_many_attempts',
      remainingTime: Math.ceil(LOCKOUT_DURATION / 1000 / 60),
      message: `Too many failed attempts. Account locked for ${Math.ceil(LOCKOUT_DURATION / 1000 / 60)} minutes.`,
    };
  }

  return { isLimited: false };
}

/**
 * Record a failed login attempt
 * @param {string} identifier - Email or IP address
 */
export function recordFailedAttempt(identifier) {
  const data = getRateLimitData(identifier);
  data.attempts += 1;
  data.lastAttempt = Date.now();
  setRateLimitData(identifier, data);
}

/**
 * Clear rate limiting data on successful login
 * @param {string} identifier - Email or IP address
 */
export function clearRateLimit(identifier) {
  const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  if (stored) {
    const allData = JSON.parse(stored);
    delete allData[identifier];
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(allData));
  }
}

// =============================================
// SECURE SESSION MANAGEMENT
// =============================================

const SESSION_STORAGE_KEY = 'secure_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours of inactivity

/**
 * Create a secure session
 * @param {Object} user - User data
 * @param {Object} tokenData - Firebase token data
 * @returns {Object} Secure session
 */
function createSecureSession(user, tokenData) {
  const now = Date.now();
  return {
    user,
    access_token: tokenData.access_token,
    expires_at: tokenData.expires_at || (now + 3600 * 1000), // Default 1 hour
    createdAt: now,
    lastActivity: now,
    expiresAt: now + SESSION_TIMEOUT,
    csrfToken: crypto.getRandomValues(new Uint8Array(32)).join(''),
  };
}

/**
 * Store session securely with enhanced protection
 * @param {Object} session - Session to store
 */
function storeSession(session) {
  try {
    // Add security metadata
    const secureSession = {
      ...session,
      fingerprint: generateBrowserFingerprint(),
      origin: window.location.origin,
      userAgent: navigator.userAgent.substring(0, 100),
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(secureSession));
  } catch (error) {
    console.error('Failed to store session:', error);
    throw new Error('Session storage failed');
  }
}

/**
 * Generate a basic browser fingerprint for session validation
 * @returns {string} Browser fingerprint
 */
function generateBrowserFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);

  return btoa(
    JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvas.toDataURL().substring(0, 50),
    })
  );
}

/**
 * Get current session with enhanced security validation
 * @returns {Object|null} Current session or null
 */
export function getCurrentSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);
    const now = Date.now();

    // Check if session has expired
    if (now > session.expiresAt) {
      console.warn('Session expired');
      clearSession();
      return null;
    }

    // Check if session has been inactive too long
    if (now - session.lastActivity > ACTIVITY_TIMEOUT) {
      console.warn('Session inactive timeout');
      clearSession();
      return null;
    }

    // Validate session integrity (basic fingerprint check)
    if (session.fingerprint && session.fingerprint !== generateBrowserFingerprint()) {
      console.warn('Session fingerprint mismatch - possible session hijacking attempt');
      clearSession();
      return null;
    }

    // Validate origin
    if (session.origin && session.origin !== window.location.origin) {
      console.warn('Session origin mismatch');
      clearSession();
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    storeSession(session);

    return session;
  } catch (error) {
    console.error('Error validating session:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear current session
 */
export function clearSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  clearStoredToken();
  clearCSRFToken();
}

// =============================================
// FIREBASE ERROR CODE MAPPING
// =============================================

/**
 * Map Firebase error codes to user-friendly messages
 * @param {Error} error - Firebase error
 * @returns {string} User-friendly error message
 */
function mapFirebaseError(error) {
  const errorMap = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Invalid password',
    'auth/invalid-email': 'Invalid email format',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled',
    'auth/operation-not-allowed': 'This operation is not allowed',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-login-credentials': 'Invalid email or password',
  };

  return errorMap[error.code] || error.message || 'An authentication error occurred';
}

// =============================================
// SECURE AUTHENTICATION FUNCTIONS (FIREBASE)
// =============================================

/**
 * Secure login function using Firebase Auth
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Login result
 */
export async function secureLogin(credentials) {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Check your configuration.');
  }

  try {
    // Validate input
    const emailValidation = validateField('email', credentials.email, 'email');
    if (!emailValidation.isValid) {
      throw new Error('Invalid email format');
    }

    const sanitizedEmail = emailValidation.sanitizedValue;

    // Check rate limiting
    const rateLimit = checkRateLimit(sanitizedEmail);
    if (rateLimit.isLimited) {
      throw new Error(rateLimit.message);
    }

    // Attempt login with Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      sanitizedEmail,
      credentials.password
    );

    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
      recordFailedAttempt(sanitizedEmail);
      throw new Error('Login failed - no user data returned');
    }

    // Clear rate limiting on successful login
    clearRateLimit(sanitizedEmail);

    // Get Firebase ID token for Hasura
    const idToken = await firebaseUser.getIdToken();

    // Store token in localStorage for Apollo client
    localStorage.setItem(FIREBASE_TOKEN_KEY, idToken);

    // Create user object compatible with existing code
    const user = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      email_confirmed_at: firebaseUser.emailVerified ? new Date().toISOString() : null,
      user_metadata: {
        name: firebaseUser.displayName || '',
        user_type: firebaseUser.customClaims?.user_type || null,
      },
    };

    // Create secure session
    const secureSession = createSecureSession(user, {
      access_token: idToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // Firebase tokens expire in 1 hour
    });
    storeSession(secureSession);

    return {
      success: true,
      user,
      session: secureSession,
    };
  } catch (error) {
    console.error('Secure login failed:', error.message);

    // Record failed attempt for Firebase errors that indicate wrong credentials
    if (error.code?.startsWith('auth/')) {
      const emailValidation = validateField('email', credentials.email, 'email');
      if (emailValidation.isValid) {
        recordFailedAttempt(emailValidation.sanitizedValue);
      }
    }

    throw new Error(mapFirebaseError(error));
  }
}

/**
 * Secure logout function using Firebase Auth
 * @returns {Promise<void>}
 */
export async function secureLogout() {
  try {
    const session = getCurrentSession();

    // Sign out from Firebase
    if (auth) {
      await signOut(auth);
    }

    // Clear local session and token
    clearSession();

    // Log security event
    if (session) {
      console.debug('Secure logout successful:', {
        userId: session.user?.id,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Secure logout error:', error);
    // Always clear session even if Firebase logout fails
    clearSession();
  }
}

/**
 * Secure registration function using Firebase Auth
 * @param {Object} credentials - Registration credentials
 * @returns {Promise<Object>} Registration result
 */
export async function secureRegister(credentials) {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Check your configuration.');
  }

  try {
    // Validate all inputs
    const emailValidation = validateField('email', credentials.email, 'email');
    const passwordValidation = validateField(
      'password',
      credentials.password,
      'password'
    );
    const nameValidation = validateField('name', credentials.name, 'name');

    const errors = [];
    if (!emailValidation.isValid) errors.push(...emailValidation.errors);
    if (!passwordValidation.isValid) errors.push(...passwordValidation.errors);
    if (!nameValidation.isValid) errors.push(...nameValidation.errors);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(emailValidation.sanitizedValue);
    if (rateLimit.isLimited) {
      throw new Error(rateLimit.message);
    }

    // Create user with Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailValidation.sanitizedValue,
      credentials.password
    );

    const firebaseUser = userCredential.user;

    // Update display name
    await updateProfile(firebaseUser, {
      displayName: nameValidation.sanitizedValue,
    });

    // Send email verification
    await sendEmailVerification(firebaseUser, {
      url: `${window.location.origin}/verify-email`,
    });

    // Get ID token
    const idToken = await firebaseUser.getIdToken();

    // Store token in localStorage for Apollo client
    localStorage.setItem(FIREBASE_TOKEN_KEY, idToken);

    // Create user object compatible with existing code
    // Note: user_metadata is stored in the profile (Hasura), not Firebase
    const user = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      email_confirmed_at: null, // Not verified yet
      user_metadata: {
        name: credentials.name,
        user_type: credentials.userType,
        phone: credentials.phone,
        country: credentials.country,
      },
    };

    console.debug('Secure registration successful:', {
      userId: firebaseUser.uid,
      email: emailValidation.sanitizedValue,
      needsVerification: !firebaseUser.emailVerified,
    });

    return {
      success: true,
      user,
      session: firebaseUser.emailVerified ? { access_token: idToken } : null,
      needsVerification: !firebaseUser.emailVerified,
    };
  } catch (error) {
    console.error('Secure registration failed:', error.message);

    // Record failed attempt for rate limiting
    const emailValidation = validateField('email', credentials.email, 'email');
    if (emailValidation.isValid) {
      recordFailedAttempt(emailValidation.sanitizedValue);
    }

    throw new Error(mapFirebaseError(error));
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Whether user is authenticated
 */
export function isAuthenticated() {
  const session = getCurrentSession();
  return session !== null;
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  const session = getCurrentSession();
  return session?.user || null;
}
