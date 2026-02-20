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
  .onRun(async (_context) => {
    const now = admin.firestore.Timestamp.now();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3); // warn 3 days before expiry
    const cutoffTs = admin.firestore.Timestamp.fromDate(cutoff);

    try {
      // Find subscriptions expiring within 3 days
      const expiringSnap = await admin
        .firestore()
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where('current_period_end', '<=', cutoffTs)
        .get();

      // Find subscriptions already past their end date
      const expiredSnap = await admin
        .firestore()
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where('current_period_end', '<', now)
        .get();

      // Mark expired subscriptions
      const expiredBatch = admin.firestore().batch();
      expiredSnap.forEach((doc) => {
        expiredBatch.update(doc.ref, {
          status: 'expired',
          expired_at: now,
          updated_at: now,
        });
      });
      await expiredBatch.commit();

      // Send expiry warning notifications
      const notifyBatch = admin.firestore().batch();
      const notifyPromises: Promise<FirebaseFirestore.DocumentReference>[] = [];
      expiringSnap.forEach((doc) => {
        const data = doc.data();
        if (!data.expiry_warning_sent) {
          notifyBatch.update(doc.ref, { expiry_warning_sent: true });
          notifyPromises.push(
            admin.firestore().collection('notifications').add({
              user_id: data.user_id,
              type: 'subscription_expiring',
              message: 'Your subscription expires in 3 days. Renew now to keep access.',
              created_at: now,
              read: false,
            })
          );
        }
      });
      await notifyBatch.commit();
      await Promise.all(notifyPromises);

      console.log(
        `Processed: ${expiredSnap.size} expired, ${expiringSnap.size} expiring soon`
      );
      return null;
    } catch (error) {
      console.error('scheduledCheckExpiringSubscriptions error:', error);
      throw error;
    }
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

// =====================================================
// HEALTH CHECK
// =====================================================

/**
 * HTTP endpoint: Health check for monitoring and load balancer probes.
 * GET /healthCheck -> { status: 'ok', timestamp, version, environment }
 */
export const healthCheck = functions.https.onRequest((_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
  });
});
