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

// Import handlers - Profile (Onboarding)
import {
  saveOnboardingProfile,
  ensureProfileExists,
} from './profile/saveOnboardingProfile';

// Import handlers - Notifications (Telegram)
import { adminNotifyHandler } from './notifications/adminNotify';

// Import handlers - Notifications (Email & WhatsApp)
import { sendNotificationEmailHandler } from './notifications/sendNotificationEmail';
import { sendWhatsAppNotificationHandler } from './notifications/sendWhatsAppNotification';

// Import handlers - Onboarding Welcome Notifications
import { sendOnboardingWelcomeHandler } from './notifications/sendOnboardingWelcome';

// Import handlers - WhatsApp Flows
import { whatsappFlowEndpointHandler } from './whatsapp/flowEndpoint';

// Import handlers - WhatsApp Webhook (Auto-Reply)
import { whatsappWebhookHandler } from './whatsapp/webhookHandler';

// Import handlers - Jobs
import { manageJob } from './jobs/createJob';
import { manageApplication } from './jobs/manageApplication';

// Import handlers - Profile
import { incrementViews } from './profiles/incrementViews';

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
// PROFILE / ONBOARDING FUNCTIONS
// =====================================================

/**
 * Callable: Save onboarding profile using admin secret
 * Bypasses Hasura JWT permission issues by writing directly with admin secret.
 * Upserts both the profiles row AND the type-specific table (maid/sponsor/agency).
 */
export const profileSaveOnboarding = functions.https.onCall(saveOnboardingProfile);

/**
 * Callable: Ensure a profiles row exists for the current user
 * Creates the row if missing, no-ops if it already exists.
 */
export const profileEnsureExists = functions.https.onCall(ensureProfileExists);

// =====================================================
// JOB MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Callable: Create/update/delete jobs using admin secret
 * Bypasses Hasura JWT permission issues for the jobs table.
 */
export const jobManage = functions.https.onCall(manageJob);

/**
 * Callable: Submit/manage job applications using admin secret
 * Bypasses Hasura JWT permission issues for the applications table.
 */
export const jobApplicationManage = functions.https.onCall(manageApplication);

/**
 * Callable: Increment maid profile views using admin secret
 * Bypasses Hasura row-level permissions (viewers can't update other users' rows).
 */
export const profileIncrementViews = functions.https.onCall(incrementViews);

// =====================================================
// ADMIN NOTIFICATIONS (Telegram)
// =====================================================

/**
 * Callable: Send admin notification via Telegram
 * Used by frontend for client-side events (bookings, interviews, errors).
 */
export const adminNotify = functions.https.onCall(adminNotifyHandler);

/**
 * Callable: Send email notification via SendGrid (admin only)
 */
export const notificationSendEmail = functions.https.onCall(sendNotificationEmailHandler);

/**
 * Callable: Send WhatsApp notification via Meta Cloud API (admin only)
 */
export const notificationSendWhatsApp = functions.https.onCall(sendWhatsAppNotificationHandler);

/**
 * Callable: Send onboarding welcome notifications (any authenticated user)
 * Sends in-app, WhatsApp, and email to user + admin Telegram/in-app notification
 */
export const notificationSendOnboardingWelcome = functions.https.onCall(sendOnboardingWelcomeHandler);

// =====================================================
// WHATSAPP FLOWS (Interactive Onboarding)
// =====================================================

/**
 * HTTP endpoint: WhatsApp Flow data exchange endpoint.
 * Receives encrypted requests from Meta, decrypts, processes, encrypts response.
 * Used for interactive onboarding (maid/sponsor/agency registration via WhatsApp).
 */
export const whatsappFlowEndpoint = functions.https.onRequest(whatsappFlowEndpointHandler);

/**
 * HTTP endpoint: WhatsApp Webhook for auto-reply.
 * GET: Webhook verification (hub.verify_token challenge)
 * POST: Incoming message processing → auto-reply with welcome + registration flow
 */
export const whatsappWebhook = functions.https.onRequest(whatsappWebhookHandler);

/**
 * Scheduled: Error digest every 6 hours
 * Queries error_logs for recent errors and sends a summary to Telegram.
 */
export const scheduledErrorDigest = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    const { sendTelegramMessage, sendMonitorTelegramMessage } = await import('./notifications/telegramService');
    const { formatErrorDigest } = await import('./notifications/adminMessages');
    const { GraphQLClient, gql } = await import('graphql-request');

    // Prefer process.env over deprecated functions.config()
    let _legacy: Record<string, any> = {};
    try { _legacy = functions.config()?.hasura || {}; } catch { /* deprecated */ }
    const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT || _legacy.endpoint;
    const adminSecret = process.env.HASURA_ADMIN_SECRET || _legacy.admin_secret;

    if (!endpoint || !adminSecret) {
      console.warn('[ErrorDigest] Hasura config not set, skipping');
      return null;
    }

    const client = new GraphQLClient(endpoint, {
      headers: { 'x-hasura-admin-secret': adminSecret },
    });

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    try {
      const GET_RECENT_ERRORS = gql`
        query GetRecentErrors($since: timestamptz!) {
          error_logs(where: { created_at: { _gte: $since } }, order_by: { created_at: desc }) {
            id
            title
            message
            created_at
          }
          error_logs_aggregate(where: { created_at: { _gte: $since } }) {
            aggregate {
              count
            }
          }
        }
      `;

      const data = await client.request<{
        error_logs: Array<{ title: string; message: string }>;
        error_logs_aggregate: { aggregate: { count: number } };
      }>(GET_RECENT_ERRORS, { since: sixHoursAgo });

      const totalErrors = data.error_logs_aggregate.aggregate.count;

      if (totalErrors === 0) {
        console.log('[ErrorDigest] No errors in the last 6 hours');
        return null;
      }

      // Group by title and count
      const titleCounts: Record<string, number> = {};
      data.error_logs.forEach((e) => {
        titleCounts[e.title] = (titleCounts[e.title] || 0) + 1;
      });

      const topErrors = Object.entries(titleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([title, count]) => ({ title, count }));

      const digestMsg = formatErrorDigest({
        totalErrors,
        period: 'Last 6 hours',
        topErrors,
      });
      await sendTelegramMessage(digestMsg);
      await sendMonitorTelegramMessage(digestMsg);

      console.log(`[ErrorDigest] Sent digest: ${totalErrors} errors`);
    } catch (error) {
      console.error('[ErrorDigest] Failed:', error);
    }

    return null;
  });

// =====================================================
// ADMIN AI MONITOR (Scheduled Watchdog)
// =====================================================

/**
 * Scheduled: Daily briefing at 8 AM UAE (4 AM UTC)
 * Sends a comprehensive summary of platform stats to Telegram.
 */
export const monitorDailyBriefing = functions.pubsub
  .schedule('every day 04:00')
  .timeZone('Asia/Dubai')
  .onRun(async () => {
    const { runDailyBriefing } = await import('./monitoring/adminAiMonitor');
    await runDailyBriefing();
    return null;
  });

/**
 * Scheduled: Stale registration check every 12 hours
 * Alerts on users who registered 24h+ ago but haven't completed onboarding.
 */
export const monitorStaleRegistrations = functions.pubsub
  .schedule('every 12 hours')
  .onRun(async () => {
    const { runStaleRegistrationCheck } = await import('./monitoring/adminAiMonitor');
    await runStaleRegistrationCheck();
    return null;
  });

/**
 * Scheduled: Site health check every hour
 * Pings Hasura and checks error rate spikes. Only alerts when unhealthy.
 */
export const monitorSiteHealth = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const { runSiteHealthCheck } = await import('./monitoring/adminAiMonitor');
    await runSiteHealthCheck();
    return null;
  });

/**
 * Scheduled: Revenue report every 24 hours
 * Reports active subscriptions, expiring subs, cancellations, and revenue.
 */
export const monitorRevenue = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const { runRevenueReport } = await import('./monitoring/adminAiMonitor');
    await runRevenueReport();
    return null;
  });

/**
 * Scheduled: Security monitor every 6 hours
 * Scans admin_activity_logs for suspicious actions. Only alerts if found.
 */
export const monitorSecurity = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    const { runSecurityMonitor } = await import('./monitoring/adminAiMonitor');
    await runSecurityMonitor();
    return null;
  });

/**
 * Scheduled: Monitor maintenance daily at 3 AM UTC
 * Auto-archives resolved items > 7 days, auto-deletes archived items > 30 days.
 */
export const monitorMaintenance = functions.pubsub
  .schedule('every day 03:00')
  .onRun(async () => {
    const { runMonitorMaintenance } = await import('./monitoring/adminAiMonitor');
    await runMonitorMaintenance();
    return null;
  });

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
