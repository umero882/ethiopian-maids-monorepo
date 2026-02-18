/**
 * Firebase Cloud Functions - Ethiopian Maids Platform (v1 API)
 *
 * This module exports all Cloud Functions for:
 * - Stripe payment processing
 * - Subscription management
 * - Credit system (idempotent operations)
 * - Webhook handling
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import handlers - Stripe
import { createCheckoutSession } from './stripe/createCheckoutSession';
import { createPortalSession } from './stripe/createPortalSession';
import { handleStripeWebhook } from './stripe/webhookHandler';
import { cancelSubscription } from './stripe/cancelSubscription';
import { handlePaymentSuccess } from './stripe/handlePaymentSuccess';

// Import handlers - Payments
import { ensurePaymentIdempotency } from './payments/ensureIdempotency';
import { purchaseCreditsIdempotent } from './payments/purchaseCredits';
import { chargeContactFeeIdempotent } from './payments/chargeContactFee';
import { incrementUsageStat } from './payments/incrementUsage';
import { updatePaymentStatus } from './payments/updatePaymentStatus';
import { completeCreditPurchaseCallable } from './payments/completeCreditPurchaseCallable';
import { createPaymentIntent } from './payments/createPaymentIntent';
import { cleanupExpiredIdempotencyCallable } from './payments/cleanupIdempotency';

// Import handlers - Hasura Claims (Auth)
import {
  onUserCreated,
  syncHasuraClaims,
  refreshHasuraClaims,
  adminSetUserRole,
  setUserType,
  getUserType,
} from './auth/hasuraClaims';

// =====================================================
// STRIPE FUNCTIONS
// =====================================================

export const stripeCreateCheckoutSession = functions.https.onCall(createCheckoutSession);
export const stripeCreatePortalSession = functions.https.onCall(createPortalSession);
export const stripeWebhook = functions.https.onRequest(handleStripeWebhook);
export const stripeCancelSubscription = functions.https.onCall(cancelSubscription);
export const stripeHandlePaymentSuccess = functions.https.onCall(handlePaymentSuccess);

// =====================================================
// PAYMENT/CREDIT FUNCTIONS
// =====================================================

export const paymentEnsureIdempotency = functions.https.onCall(ensurePaymentIdempotency);
export const paymentPurchaseCredits = functions.https.onCall(purchaseCreditsIdempotent);
export const paymentChargeContactFee = functions.https.onCall(chargeContactFeeIdempotent);
export const paymentIncrementUsage = functions.https.onCall(incrementUsageStat);
export const paymentUpdateStatus = functions.https.onCall(updatePaymentStatus);
export const paymentCompleteCreditPurchase = functions.https.onCall(completeCreditPurchaseCallable);
export const paymentCreatePaymentIntent = functions.https.onCall(createPaymentIntent);
export const paymentCleanupIdempotency = functions.https.onCall(cleanupExpiredIdempotencyCallable);

// =====================================================
// SCHEDULED FUNCTIONS
// =====================================================

export const scheduledCleanupIdempotency = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const { cleanupExpiredIdempotency } = await import('./payments/cleanupIdempotency');
    return cleanupExpiredIdempotency();
  });

export const scheduledCheckExpiringSubscriptions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    console.log('Checking for expiring subscriptions...');
    return null;
  });

// =====================================================
// HASURA CLAIMS / AUTH FUNCTIONS
// =====================================================

/**
 * Auth trigger: Automatically set Hasura claims when a new user is created
 * This ensures every user has the required claims for Hasura GraphQL authorization
 */
export const authOnUserCreated = functions.auth.user().onCreate(onUserCreated);

/**
 * Callable: Sync Hasura claims with user's role from database
 * Call after profile creation/update to ensure claims match database role
 */
export const authSyncHasuraClaims = functions.https.onCall(syncHasuraClaims);

/**
 * Callable: Force refresh Hasura claims
 * After calling, client should call getIdToken(true) to get fresh token
 */
export const authRefreshHasuraClaims = functions.https.onCall(refreshHasuraClaims);

/**
 * Callable: Admin function to set user role (admin only)
 */
export const authAdminSetUserRole = functions.https.onCall(adminSetUserRole);

/**
 * ============================================================================
 * PRIMARY USER TYPE FUNCTIONS - SOLVES userType PERSISTENCE
 * ============================================================================
 */

/**
 * Callable: Set user type during registration
 *
 * THIS IS THE KEY FUNCTION for registration flow:
 * - Call IMMEDIATELY after phone/email verification succeeds
 * - Sets userType in Firebase Custom Claims (server-side, persistent)
 * - userType survives: page refresh, logout, device changes
 * - No localStorage dependency
 *
 * Usage from client:
 *   const setUserType = httpsCallable(functions, 'authSetUserType');
 *   await setUserType({ userType: 'maid' });
 *   await user.getIdToken(true); // Force refresh to get new claims
 */
export const authSetUserType = functions.https.onCall(setUserType);

/**
 * Callable: Get current user type from claims (for debugging)
 */
export const authGetUserType = functions.https.onCall(getUserType);
