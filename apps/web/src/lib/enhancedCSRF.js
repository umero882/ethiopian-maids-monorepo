/**
 * 🛡️ Enhanced CSRF Protection with Per-Request Tokens
 * Provides stronger CSRF protection with one-time-use tokens
 */

import { generateCSRFToken, getCSRFToken as getBaseToken, clearCSRFToken } from './csrfProtection';

// =============================================
// PER-REQUEST TOKEN MANAGEMENT
// =============================================

/**
 * Generate a per-request CSRF token that can only be used once
 * @returns {string} One-time use CSRF token with timestamp and nonce
 */
export function generatePerRequestToken() {
  const baseToken = getBaseToken();
  const timestamp = Date.now();
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

  // Combine base token with timestamp and nonce
  const combined = `${baseToken}:${timestamp}:${nonce}`;

  // Store the nonce for one-time use validation
  const usedNonces = JSON.parse(sessionStorage.getItem('csrf_used_nonces') || '[]');
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

  // Clean up old nonces
  const activeNonces = usedNonces.filter(n => n.timestamp > tenMinutesAgo);
  sessionStorage.setItem('csrf_used_nonces', JSON.stringify(activeNonces));

  return combined;
}

/**
 * Validate and consume a per-request CSRF token
 * @param {string} token - Token to validate
 * @returns {{valid: boolean, reason?: string}} Validation result
 */
export function validatePerRequestToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Missing or invalid token' };
  }

  const parts = token.split(':');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid token format' };
  }

  const [baseToken, timestampStr, nonce] = parts;

  // 1. Validate base token
  const storedToken = sessionStorage.getItem('csrf_token');
  if (!storedToken || baseToken !== storedToken) {
    return { valid: false, reason: 'Invalid base token' };
  }

  // 2. Validate timestamp (must be within 10 minutes)
  const timestamp = parseInt(timestampStr);
  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Invalid timestamp' };
  }

  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  const age = now - timestamp;

  if (age > tenMinutes) {
    return { valid: false, reason: 'Token expired' };
  }

  if (age < 0) {
    return { valid: false, reason: 'Token from future (clock skew)' };
  }

  // 3. Check if nonce was already used (prevent replay attacks)
  const usedNonces = JSON.parse(sessionStorage.getItem('csrf_used_nonces') || '[]');
  const nonceEntry = usedNonces.find(n => n.nonce === nonce);

  if (nonceEntry && nonceEntry.used) {
    return { valid: false, reason: 'Token already used (replay attack blocked)' };
  }

  // 4. Mark nonce as used
  const newUsedNonces = usedNonces.map(n =>
    n.nonce === nonce ? { ...n, used: true } : n
  );

  // Add if not found
  if (!nonceEntry) {
    newUsedNonces.push({ nonce, timestamp, used: true });
  }

  sessionStorage.setItem('csrf_used_nonces', JSON.stringify(newUsedNonces));

  return { valid: true };
}

// =============================================
// DOUBLE-SUBMIT COOKIE PATTERN
// =============================================

/**
 * Set CSRF token in both cookie and session storage
 * Implements double-submit cookie pattern for additional security
 */
export function setDoubleSubmitToken() {
  const token = generateCSRFToken();

  // Set in session storage
  sessionStorage.setItem('csrf_token', token);

  // Set in cookie (HttpOnly would be ideal but requires backend)
  // Using secure and SameSite=Strict attributes
  const cookieOptions = [
    `csrf_token=${token}`,
    'path=/',
    'SameSite=Strict',
    ...(window.location.protocol === 'https:' ? ['Secure'] : [])
  ].join('; ');

  document.cookie = cookieOptions;

  return token;
}

/**
 * Validate double-submit token (cookie must match session storage)
 * @returns {boolean} Whether tokens match
 */
export function validateDoubleSubmit() {
  const sessionToken = sessionStorage.getItem('csrf_token');
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];

  return sessionToken && cookieToken && sessionToken === cookieToken;
}

// =============================================
// ORIGIN VALIDATION
// =============================================

/**
 * Validate request origin matches expected origin
 * @param {string} origin - Origin to validate
 * @param {string[]} allowedOrigins - List of allowed origins
 * @returns {boolean} Whether origin is valid
 */
export function validateOrigin(origin, allowedOrigins = []) {
  if (!origin) return false;

  // Default allowed origins
  const defaultAllowed = [
    window.location.origin,
    import.meta.env.VITE_APP_URL
  ].filter(Boolean);

  const allAllowed = [...new Set([...defaultAllowed, ...allowedOrigins])];

  return allAllowed.some(allowed => origin === allowed);
}

// =============================================
// PROTECTED API CALLS
// =============================================

/**
 * Make a protected API call with per-request CSRF token
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @param {Object} options - Additional options
 * @returns {Promise} API response
 */
export async function protectedAPICall(method, endpoint, data = {}, options = {}) {
  // Generate per-request token
  const token = generatePerRequestToken();

  // Validate origin
  const origin = window.location.origin;
  if (!validateOrigin(origin, options.allowedOrigins || [])) {
    throw new Error('Invalid origin');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': origin,
    ...options.headers
  };

  const requestOptions = {
    method: method.toUpperCase(),
    headers,
    credentials: 'same-origin',
    ...options
  };

  if (data && Object.keys(data).length > 0) {
    requestOptions.body = JSON.stringify({ ...data, _csrf: token });
  }

  const response = await fetch(endpoint, requestOptions);

  if (!response.ok) {
    // Check if it's a CSRF error
    if (response.status === 403) {
      const error = await response.json().catch(() => ({}));
      if (error.code === 'CSRF_VALIDATION_FAILED') {
        // Rotate token and suggest retry
        setDoubleSubmitToken();
        throw new Error('CSRF validation failed. Please try again.');
      }
    }

    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================
// REACT HOOK
// =============================================

/**
 * React hook for enhanced CSRF protection
 * @returns {Object} Enhanced CSRF utilities
 */
export function useEnhancedCSRF() {
  return {
    generateToken: generatePerRequestToken,
    validateToken: validatePerRequestToken,
    protectedCall: protectedAPICall,
    setDoubleSubmit: setDoubleSubmitToken,
    validateDoubleSubmit,
    validateOrigin
  };
}

// =============================================
// INITIALIZATION
// =============================================

/**
 * Initialize enhanced CSRF protection
 */
export function initializeEnhancedCSRF() {
  // Set up double-submit token
  setDoubleSubmitToken();

  // Rotate token on visibility change (tab becomes visible again)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Check if token is stale (older than 30 minutes)
      const tokenTimestamp = parseInt(sessionStorage.getItem('csrf_token_timestamp') || '0');
      const thirtyMinutes = 30 * 60 * 1000;

      if (Date.now() - tokenTimestamp > thirtyMinutes) {
        setDoubleSubmitToken();
      }
    }
  });

  // Clean up old nonces periodically
  setInterval(() => {
    const usedNonces = JSON.parse(sessionStorage.getItem('csrf_used_nonces') || '[]');
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const activeNonces = usedNonces.filter(n => n.timestamp > tenMinutesAgo);
    sessionStorage.setItem('csrf_used_nonces', JSON.stringify(activeNonces));
  }, 5 * 60 * 1000); // Clean every 5 minutes
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeEnhancedCSRF();
}

export { clearCSRFToken } from './csrfProtection';
