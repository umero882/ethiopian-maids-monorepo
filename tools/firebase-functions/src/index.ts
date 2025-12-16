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
