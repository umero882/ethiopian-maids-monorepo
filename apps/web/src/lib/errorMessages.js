/**
 * Centralized Error Messages & User-Friendly Error Mapping
 *
 * This module provides:
 * 1. Error codes for debugging/logging
 * 2. User-friendly messages (never expose technical details)
 * 3. Actionable recovery suggestions
 * 4. Severity levels for proper handling
 *
 * Industry Standard: Follows OWASP guidelines to never expose
 * internal system details to end users.
 */

// Error Severity Levels
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// Error Categories
export const ErrorCategory = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  PERMISSION: 'permission',
  PAYMENT: 'payment',
  UNKNOWN: 'unknown',
};

/**
 * Error Code Registry
 * Format: [CATEGORY]_[SPECIFIC_ERROR]
 * These codes can be logged for debugging without exposing to users
 */
export const ErrorCodes = {
  // Network Errors (1xxx)
  NETWORK_OFFLINE: 'NET_1001',
  NETWORK_TIMEOUT: 'NET_1002',
  NETWORK_SERVER_UNREACHABLE: 'NET_1003',
  NETWORK_CORS: 'NET_1004',
  NETWORK_CONFIG_MISSING: 'NET_1005',
  NETWORK_SSL: 'NET_1006',
  NETWORK_DNS: 'NET_1007',

  // Authentication Errors (2xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_2001',
  AUTH_SESSION_EXPIRED: 'AUTH_2002',
  AUTH_ACCOUNT_DISABLED: 'AUTH_2003',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_2004',
  AUTH_TOO_MANY_ATTEMPTS: 'AUTH_2005',
  AUTH_WEAK_PASSWORD: 'AUTH_2006',
  AUTH_EMAIL_IN_USE: 'AUTH_2007',
  AUTH_USER_NOT_FOUND: 'AUTH_2008',
  AUTH_POPUP_BLOCKED: 'AUTH_2009',
  AUTH_POPUP_CLOSED: 'AUTH_2010',

  // Server Errors (3xxx)
  SERVER_INTERNAL: 'SRV_3001',
  SERVER_MAINTENANCE: 'SRV_3002',
  SERVER_OVERLOADED: 'SRV_3003',
  SERVER_GRAPHQL: 'SRV_3004',
  SERVER_DATABASE: 'SRV_3005',

  // Validation Errors (4xxx)
  VALIDATION_REQUIRED_FIELD: 'VAL_4001',
  VALIDATION_INVALID_FORMAT: 'VAL_4002',
  VALIDATION_FILE_TOO_LARGE: 'VAL_4003',
  VALIDATION_INVALID_FILE_TYPE: 'VAL_4004',

  // Permission Errors (5xxx)
  PERMISSION_DENIED: 'PERM_5001',
  PERMISSION_SUBSCRIPTION_REQUIRED: 'PERM_5002',
  PERMISSION_ROLE_REQUIRED: 'PERM_5003',

  // Payment Errors (6xxx)
  PAYMENT_FAILED: 'PAY_6001',
  PAYMENT_DECLINED: 'PAY_6002',
  PAYMENT_EXPIRED_CARD: 'PAY_6003',
  PAYMENT_INSUFFICIENT_FUNDS: 'PAY_6004',

  // Unknown/Generic (9xxx)
  UNKNOWN: 'UNK_9001',
};

/**
 * User-Friendly Error Messages
 * Maps error codes to human-readable messages with recovery actions
 */
export const UserFriendlyErrors = {
  // Network Errors
  [ErrorCodes.NETWORK_OFFLINE]: {
    title: 'No Internet Connection',
    message: 'Please check your internet connection and try again.',
    suggestions: [
      'Check your WiFi or mobile data is turned on',
      'Try moving to an area with better signal',
      'Restart your router or modem',
    ],
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    recoverable: true,
  },

  [ErrorCodes.NETWORK_TIMEOUT]: {
    title: 'Connection Timed Out',
    message: 'The server is taking too long to respond. Please try again.',
    suggestions: [
      'Wait a moment and retry',
      'Check if your connection is stable',
      'Try again during off-peak hours',
    ],
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.NETWORK,
    recoverable: true,
  },

  [ErrorCodes.NETWORK_SERVER_UNREACHABLE]: {
    title: 'Service Temporarily Unavailable',
    message: 'We\'re having trouble connecting to our servers. This is usually temporary.',
    suggestions: [
      'Wait a few moments and try again',
      'Check if you\'re using a VPN or firewall',
      'Try a different network connection',
    ],
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    recoverable: true,
  },

  [ErrorCodes.NETWORK_CONFIG_MISSING]: {
    title: 'Service Configuration Issue',
    message: 'We\'re experiencing a temporary service issue. Our team has been notified.',
    suggestions: [
      'Please try again in a few minutes',
      'Clear your browser cache and reload',
      'Contact support if the issue persists',
    ],
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.SERVER,
    recoverable: true,
    // Note: This maps technical "Hasura config missing" to user-friendly message
  },

  [ErrorCodes.NETWORK_CORS]: {
    title: 'Connection Blocked',
    message: 'Your browser is having trouble connecting. Please try refreshing the page.',
    suggestions: [
      'Refresh the page',
      'Clear browser cache and cookies',
      'Try using a different browser',
    ],
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    recoverable: true,
  },

  // Authentication Errors
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: {
    title: 'Sign In Failed',
    message: 'The email or password you entered doesn\'t match our records.',
    suggestions: [
      'Double-check your email address',
      'Make sure Caps Lock is off',
      'Reset your password if you\'ve forgotten it',
    ],
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.AUTH,
    recoverable: true,
    action: { label: 'Reset Password', path: '/forgot-password' },
  },

  [ErrorCodes.AUTH_SESSION_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has ended for security reasons. Please sign in again.',
    suggestions: [
      'Sign in again to continue',
    ],
    severity: ErrorSeverity.INFO,
    category: ErrorCategory.AUTH,
    recoverable: true,
    action: { label: 'Sign In', path: '/login' },
  },

  [ErrorCodes.AUTH_ACCOUNT_DISABLED]: {
    title: 'Account Suspended',
    message: 'Your account has been temporarily suspended. Please contact support for assistance.',
    suggestions: [
      'Contact our support team',
      'Check your email for any notices',
    ],
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.AUTH,
    recoverable: false,
    action: { label: 'Contact Support', path: '/support' },
  },

  [ErrorCodes.AUTH_EMAIL_NOT_VERIFIED]: {
    title: 'Email Not Verified',
    message: 'Please verify your email address to continue.',
    suggestions: [
      'Check your inbox for a verification email',
      'Check your spam/junk folder',
      'Request a new verification email',
    ],
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.AUTH,
    recoverable: true,
    action: { label: 'Resend Email', action: 'resend_verification' },
  },

  [ErrorCodes.AUTH_TOO_MANY_ATTEMPTS]: {
    title: 'Too Many Attempts',
    message: 'For your security, we\'ve temporarily limited sign-in attempts. Please try again later.',
    suggestions: [
      'Wait 15-30 minutes before trying again',
      'Reset your password if needed',
    ],
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.AUTH,
    recoverable: true,
  },

  [ErrorCodes.AUTH_USER_NOT_FOUND]: {
    title: 'Account Not Found',
    message: 'We couldn\'t find an account with that email address.',
    suggestions: [
      'Check if you typed your email correctly',
      'Try signing up for a new account',
    ],
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.AUTH,
    recoverable: true,
    action: { label: 'Create Account', path: '/register' },
  },

  [ErrorCodes.AUTH_POPUP_BLOCKED]: {
    title: 'Popup Blocked',
    message: 'Please allow popups to sign in with Google or social providers.',
    suggestions: [
      'Click the popup blocker icon in your address bar',
      'Allow popups for this site',
      'Try using email/password sign-in instead',
    ],
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.AUTH,
    recoverable: true,
  },

  // Server Errors
  [ErrorCodes.SERVER_INTERNAL]: {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected issue. Our team has been notified.',
    suggestions: [
      'Try again in a few moments',
      'Refresh the page',
      'Contact support if the problem continues',
    ],
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.SERVER,
    recoverable: true,
  },

  [ErrorCodes.SERVER_MAINTENANCE]: {
    title: 'Scheduled Maintenance',
    message: 'We\'re currently performing maintenance to improve our services. Please check back soon.',
    suggestions: [
      'We\'ll be back shortly',
      'Follow our status page for updates',
    ],
    severity: ErrorSeverity.INFO,
    category: ErrorCategory.SERVER,
    recoverable: true,
  },

  // Permission Errors
  [ErrorCodes.PERMISSION_DENIED]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    suggestions: [
      'Make sure you\'re signed in to the correct account',
      'Contact your administrator for access',
    ],
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.PERMISSION,
    recoverable: false,
  },

  // Payment Errors
  [ErrorCodes.PAYMENT_FAILED]: {
    title: 'Payment Unsuccessful',
    message: 'We couldn\'t process your payment. Please try again.',
    suggestions: [
      'Verify your card details',
      'Check if your card has sufficient funds',
      'Try a different payment method',
    ],
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.PAYMENT,
    recoverable: true,
  },

  // Unknown Error (Fallback)
  [ErrorCodes.UNKNOWN]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    suggestions: [
      'Refresh the page and try again',
      'Clear your browser cache',
      'Contact support if the issue persists',
    ],
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.UNKNOWN,
    recoverable: true,
  },
};

/**
 * Pattern matching for technical errors to error codes
 * Order matters - more specific patterns should come first
 */
const errorPatterns = [
  // Network patterns
  { pattern: /hasura.*config.*missing/i, code: ErrorCodes.NETWORK_CONFIG_MISSING },
  { pattern: /environment.*variable/i, code: ErrorCodes.NETWORK_CONFIG_MISSING },
  { pattern: /VITE_.*missing/i, code: ErrorCodes.NETWORK_CONFIG_MISSING },
  { pattern: /configuration.*missing/i, code: ErrorCodes.NETWORK_CONFIG_MISSING },
  { pattern: /offline|no.*internet/i, code: ErrorCodes.NETWORK_OFFLINE },
  { pattern: /timeout|timed.*out|aborted/i, code: ErrorCodes.NETWORK_TIMEOUT },
  { pattern: /failed.*to.*fetch|network.*request.*failed/i, code: ErrorCodes.NETWORK_SERVER_UNREACHABLE },
  { pattern: /cors|cross.*origin/i, code: ErrorCodes.NETWORK_CORS },
  { pattern: /ssl|certificate|https/i, code: ErrorCodes.NETWORK_SSL },
  { pattern: /dns|resolve|hostname/i, code: ErrorCodes.NETWORK_DNS },

  // Auth patterns
  { pattern: /invalid.*credentials|wrong.*password|incorrect.*password/i, code: ErrorCodes.AUTH_INVALID_CREDENTIALS },
  { pattern: /auth\/invalid-credential/i, code: ErrorCodes.AUTH_INVALID_CREDENTIALS },
  { pattern: /auth\/wrong-password/i, code: ErrorCodes.AUTH_INVALID_CREDENTIALS },
  { pattern: /session.*expired|token.*expired/i, code: ErrorCodes.AUTH_SESSION_EXPIRED },
  { pattern: /account.*disabled|user.*disabled/i, code: ErrorCodes.AUTH_ACCOUNT_DISABLED },
  { pattern: /auth\/user-disabled/i, code: ErrorCodes.AUTH_ACCOUNT_DISABLED },
  { pattern: /email.*not.*verified|verify.*email/i, code: ErrorCodes.AUTH_EMAIL_NOT_VERIFIED },
  { pattern: /too.*many.*requests|too.*many.*attempts|rate.*limit/i, code: ErrorCodes.AUTH_TOO_MANY_ATTEMPTS },
  { pattern: /auth\/too-many-requests/i, code: ErrorCodes.AUTH_TOO_MANY_ATTEMPTS },
  { pattern: /user.*not.*found/i, code: ErrorCodes.AUTH_USER_NOT_FOUND },
  { pattern: /auth\/user-not-found/i, code: ErrorCodes.AUTH_USER_NOT_FOUND },
  { pattern: /popup.*blocked/i, code: ErrorCodes.AUTH_POPUP_BLOCKED },
  { pattern: /popup.*closed/i, code: ErrorCodes.AUTH_POPUP_CLOSED },

  // Server patterns
  { pattern: /internal.*server.*error|500/i, code: ErrorCodes.SERVER_INTERNAL },
  { pattern: /maintenance|503|service.*unavailable/i, code: ErrorCodes.SERVER_MAINTENANCE },
  { pattern: /graphql.*error/i, code: ErrorCodes.SERVER_GRAPHQL },
  { pattern: /database.*error|db.*error/i, code: ErrorCodes.SERVER_DATABASE },

  // Permission patterns
  { pattern: /permission.*denied|unauthorized|403/i, code: ErrorCodes.PERMISSION_DENIED },
  { pattern: /subscription.*required/i, code: ErrorCodes.PERMISSION_SUBSCRIPTION_REQUIRED },

  // Payment patterns
  { pattern: /payment.*failed|payment.*error/i, code: ErrorCodes.PAYMENT_FAILED },
  { pattern: /card.*declined/i, code: ErrorCodes.PAYMENT_DECLINED },
  { pattern: /card.*expired/i, code: ErrorCodes.PAYMENT_EXPIRED_CARD },
  { pattern: /insufficient.*funds/i, code: ErrorCodes.PAYMENT_INSUFFICIENT_FUNDS },
];

/**
 * Maps a technical error to an error code
 * @param {Error|string} error - The error object or message
 * @returns {string} - The error code
 */
export function getErrorCode(error) {
  const errorMessage = error?.message || String(error);

  for (const { pattern, code } of errorPatterns) {
    if (pattern.test(errorMessage)) {
      return code;
    }
  }

  return ErrorCodes.UNKNOWN;
}

/**
 * Gets user-friendly error details from a technical error
 * @param {Error|string} error - The error object or message
 * @returns {Object} - User-friendly error details
 */
export function getUserFriendlyError(error) {
  const code = getErrorCode(error);
  const friendlyError = UserFriendlyErrors[code] || UserFriendlyErrors[ErrorCodes.UNKNOWN];

  return {
    ...friendlyError,
    code,
    originalError: error?.message || String(error), // For logging only, never show to user
  };
}

/**
 * Formats an error for display in UI
 * @param {Error|string} error - The error object or message
 * @returns {Object} - Formatted error for UI display
 */
export function formatErrorForDisplay(error) {
  const { title, message, suggestions, severity, action, recoverable } = getUserFriendlyError(error);

  return {
    title,
    message,
    suggestions,
    severity,
    action,
    recoverable,
  };
}

/**
 * Checks if the error is related to network/connectivity
 * @param {Error|string} error - The error object or message
 * @returns {boolean}
 */
export function isNetworkError(error) {
  const { category } = getUserFriendlyError(error);
  return category === ErrorCategory.NETWORK;
}

/**
 * Checks if the error is related to authentication
 * @param {Error|string} error - The error object or message
 * @returns {boolean}
 */
export function isAuthError(error) {
  const { category } = getUserFriendlyError(error);
  return category === ErrorCategory.AUTH;
}

/**
 * Gets a simple one-liner error message
 * @param {Error|string} error - The error object or message
 * @returns {string}
 */
export function getSimpleErrorMessage(error) {
  const { message } = getUserFriendlyError(error);
  return message;
}

export default {
  ErrorCodes,
  ErrorSeverity,
  ErrorCategory,
  UserFriendlyErrors,
  getErrorCode,
  getUserFriendlyError,
  formatErrorForDisplay,
  isNetworkError,
  isAuthError,
  getSimpleErrorMessage,
};
