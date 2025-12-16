"use strict";
/**
 * Firebase Cloud Functions - Ethiopian Maids Platform (v1 API)
 *
 * This module exports all Cloud Functions for:
 * - Stripe payment processing
 * - Subscription management
 * - Credit system (idempotent operations)
 * - Webhook handling
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledCheckExpiringSubscriptions = exports.scheduledCleanupIdempotency = exports.paymentCleanupIdempotency = exports.paymentCreatePaymentIntent = exports.paymentCompleteCreditPurchase = exports.paymentUpdateStatus = exports.paymentIncrementUsage = exports.paymentChargeContactFee = exports.paymentPurchaseCredits = exports.paymentEnsureIdempotency = exports.stripeHandlePaymentSuccess = exports.stripeCancelSubscription = exports.stripeWebhook = exports.stripeCreatePortalSession = exports.stripeCreateCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Import handlers - Stripe
const createCheckoutSession_1 = require("./stripe/createCheckoutSession");
const createPortalSession_1 = require("./stripe/createPortalSession");
const webhookHandler_1 = require("./stripe/webhookHandler");
const cancelSubscription_1 = require("./stripe/cancelSubscription");
const handlePaymentSuccess_1 = require("./stripe/handlePaymentSuccess");
// Import handlers - Payments
const ensureIdempotency_1 = require("./payments/ensureIdempotency");
const purchaseCredits_1 = require("./payments/purchaseCredits");
const chargeContactFee_1 = require("./payments/chargeContactFee");
const incrementUsage_1 = require("./payments/incrementUsage");
const updatePaymentStatus_1 = require("./payments/updatePaymentStatus");
const completeCreditPurchaseCallable_1 = require("./payments/completeCreditPurchaseCallable");
const createPaymentIntent_1 = require("./payments/createPaymentIntent");
const cleanupIdempotency_1 = require("./payments/cleanupIdempotency");
// =====================================================
// STRIPE FUNCTIONS
// =====================================================
exports.stripeCreateCheckoutSession = functions.https.onCall(createCheckoutSession_1.createCheckoutSession);
exports.stripeCreatePortalSession = functions.https.onCall(createPortalSession_1.createPortalSession);
exports.stripeWebhook = functions.https.onRequest(webhookHandler_1.handleStripeWebhook);
exports.stripeCancelSubscription = functions.https.onCall(cancelSubscription_1.cancelSubscription);
exports.stripeHandlePaymentSuccess = functions.https.onCall(handlePaymentSuccess_1.handlePaymentSuccess);
// =====================================================
// PAYMENT/CREDIT FUNCTIONS
// =====================================================
exports.paymentEnsureIdempotency = functions.https.onCall(ensureIdempotency_1.ensurePaymentIdempotency);
exports.paymentPurchaseCredits = functions.https.onCall(purchaseCredits_1.purchaseCreditsIdempotent);
exports.paymentChargeContactFee = functions.https.onCall(chargeContactFee_1.chargeContactFeeIdempotent);
exports.paymentIncrementUsage = functions.https.onCall(incrementUsage_1.incrementUsageStat);
exports.paymentUpdateStatus = functions.https.onCall(updatePaymentStatus_1.updatePaymentStatus);
exports.paymentCompleteCreditPurchase = functions.https.onCall(completeCreditPurchaseCallable_1.completeCreditPurchaseCallable);
exports.paymentCreatePaymentIntent = functions.https.onCall(createPaymentIntent_1.createPaymentIntent);
exports.paymentCleanupIdempotency = functions.https.onCall(cleanupIdempotency_1.cleanupExpiredIdempotencyCallable);
// =====================================================
// SCHEDULED FUNCTIONS
// =====================================================
exports.scheduledCleanupIdempotency = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async () => {
    const { cleanupExpiredIdempotency } = await Promise.resolve().then(() => __importStar(require('./payments/cleanupIdempotency')));
    return cleanupExpiredIdempotency();
});
exports.scheduledCheckExpiringSubscriptions = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async () => {
    console.log('Checking for expiring subscriptions...');
    return null;
});
//# sourceMappingURL=index.js.map