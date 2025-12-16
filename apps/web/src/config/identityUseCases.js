/**
 * Identity Module - Dependency Injection Setup
 *
 * This file wires up all identity use-cases with their dependencies:
 * - Domain entities
 * - Application use-cases
 * - Infrastructure adapters (Firebase Auth + Hasura GraphQL + SendGrid)
 *
 * MIGRATED FROM SUPABASE TO FIREBASE/HASURA
 */

// Firebase Auth and Apollo Client imports
import { auth } from '@/lib/firebaseClient';
import { apolloClient } from '@ethio/api-client';

// Infrastructure adapters (Firebase/Hasura - NEW)
import {
  FirebaseAuthService,
  HasuraUserRepository,
  HasuraAuditLogger,
  HasuraPasswordResetRepository,
  SendGridEmailService,
} from '@ethio/infra-web-identity';

// Application use-cases
import {
  RegisterUser,
  SignIn,
  SignOut,
  GetUser,
  VerifyUserEmail,
  RequestPasswordReset,
  ResetPassword,
  UpdateUser,
} from '@ethio/app-identity';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Get environment variables (Vite uses import.meta.env, not process.env)
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@ethiopianmaids.com';
const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';

// Validate Firebase Auth is initialized
if (!auth) {
  console.error('❌ Firebase Auth is not initialized');
  console.error('Check your Firebase configuration in firebaseClient.js');
  throw new Error('Firebase Auth not initialized for Identity module');
}

// =============================================================================
// INITIALIZE INFRASTRUCTURE (Firebase + Hasura)
// =============================================================================

// Initialize repositories and services using Firebase Auth and Hasura GraphQL
const userRepository = new HasuraUserRepository(apolloClient);
const authService = new FirebaseAuthService(auth);
const auditLogger = new HasuraAuditLogger(apolloClient);
const passwordResetRepository = new HasuraPasswordResetRepository(apolloClient);

// Initialize email service
const emailService = new SendGridEmailService({
  apiKey: SENDGRID_API_KEY,
  fromEmail: SENDGRID_FROM_EMAIL,
  fromName: 'Ethiopian Maids',
  baseUrl: APP_BASE_URL,
});

// Simple event bus (can be replaced with a more sophisticated implementation)
const eventBus = {
  publish: (event) => {
    console.log(`[Event] ${event.type}`, event.payload);
    // In production, this could publish to a message queue, webhook, etc.
  },
};

// =============================================================================
// CREATE USE-CASES (Dependency Injection)
// =============================================================================

/**
 * User Registration
 * Command: { email, password, role, metadata }
 */
export const registerUser = new RegisterUser({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * User Sign-In
 * Command: { email, password, metadata }
 * Returns: { userId, token, refreshToken, expiresAt, user }
 */
export const signIn = new SignIn({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * User Sign-Out
 * Command: { userId, token, reason, metadata }
 */
export const signOut = new SignOut({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * Get User
 * Query: { userId }
 * Returns: User entity
 */
export const getUser = new GetUser({
  userRepository,
});

/**
 * Verify User Email
 * Command: { userId, token }
 */
export const verifyUserEmail = new VerifyUserEmail({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * Request Password Reset
 * Command: { email, metadata }
 * Returns: { success, message }
 *
 * Security: Always returns success message (email enumeration protection)
 */
export const requestPasswordReset = new RequestPasswordReset({
  userRepository,
  passwordResetRepository,
  emailService,
  auditLogger,
  eventBus,
});

/**
 * Reset Password
 * Command: { token, newPassword, metadata }
 * Returns: { success, message }
 *
 * Security: Revokes all user sessions after successful reset
 */
export const resetPassword = new ResetPassword({
  userRepository,
  passwordResetRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * Update User
 * Command: { userId, updates: { email?, phoneNumber? }, metadata }
 * Returns: Updated user entity
 *
 * Note: Email/phone changes reset verification flags
 */
export const updateUser = new UpdateUser({
  userRepository,
  auditLogger,
  eventBus,
});

// =============================================================================
// EXPORTS
// =============================================================================

// Export all use-cases
export default {
  registerUser,
  signIn,
  signOut,
  getUser,
  verifyUserEmail,
  requestPasswordReset,
  resetPassword,
  updateUser,
};

// Export infrastructure for advanced use cases
export {
  apolloClient,
  auth,
  userRepository,
  authService,
  auditLogger,
  passwordResetRepository,
  emailService,
  eventBus,
};

// =============================================================================
// STATUS CHECK
// =============================================================================

console.log('✅ Identity Module initialized (Firebase + Hasura)');
console.log('📦 Use-cases available:', Object.keys({
  registerUser,
  signIn,
  signOut,
  getUser,
  verifyUserEmail,
  requestPasswordReset,
  resetPassword,
  updateUser,
}).join(', '));

// Log configuration status (without revealing secrets)
console.log('🔧 Configuration:');
console.log('  - Firebase Auth:', auth ? 'initialized' : 'not initialized');
console.log('  - Hasura GraphQL: configured');
console.log('  - SendGrid configured:', !!SENDGRID_API_KEY);
console.log('  - From Email:', SENDGRID_FROM_EMAIL);
console.log('  - App Base URL:', APP_BASE_URL);
