/**
 * Payment Idempotency Service - GraphQL Implementation
 *
 * MIGRATED FROM SUPABASE TO FIREBASE/HASURA
 *
 * Prevents duplicate charges and ensures payment reliability
 * Uses Firebase Cloud Functions for payment operations
 * Uses GraphQL/Hasura for data queries
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('PaymentIdempotency');

// =====================================================
// GRAPHQL DOCUMENTS
// =====================================================

const GetUserCreditsDocument = gql`
  query GetUserCredits($userId: String!) {
    user_credits(where: { user_id: { _eq: $userId } }) {
      id
      user_id
      credits_available
      credits_total_purchased
      last_purchase_at
    }
  }
`;

const GetCreditTransactionsDocument = gql`
  query GetCreditTransactions($userId: String!, $limit: Int!, $offset: Int!) {
    credit_transactions(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      user_id
      amount
      transaction_type
      description
      stripe_payment_intent_id
      created_at
    }
    credit_transactions_aggregate(where: { user_id: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
  }
`;

// =====================================================
// SERVICE CLASS
// =====================================================

class PaymentIdempotencyService {
  constructor() {
    this.functions = null;
    this.init();
  }

  init() {
    try {
      this.functions = getFunctions();
      log.info('Payment idempotency service initialized');
    } catch (error) {
      log.error('Failed to initialize payment idempotency service:', error);
    }
  }

  /**
   * Generate a unique idempotency key for a payment operation
   */
  generateIdempotencyKey(userId, operationType, context = '') {
    const timestamp = Date.now();
    const contextHash = this.hashString(context);
    return `${userId}-${operationType}-${timestamp}-${contextHash}`;
  }

  /**
   * Simple hash function for context
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if payment operation is idempotent (prevents duplicates)
   * Uses Firebase Cloud Function
   */
  async ensurePaymentIdempotency(idempotencyKey, userId, operationType, amount, currency = 'USD', metadata = {}) {
    try {
      const ensureIdempotency = httpsCallable(this.functions, 'paymentEnsureIdempotency');
      const result = await ensureIdempotency({
        idempotencyKey,
        userId,
        operationType,
        amount,
        currency,
        metadata
      });

      return {
        isDuplicate: result.data?.isDuplicate || false,
        paymentRecord: result.data?.paymentRecord || null
      };
    } catch (error) {
      log.error('Failed to ensure payment idempotency:', error);
      throw error;
    }
  }

  /**
   * Update payment status in idempotency system
   * Uses Firebase Cloud Function
   */
  async updatePaymentStatus(idempotencyKey, status, stripePaymentIntentId = null, stripeChargeId = null) {
    try {
      const updateStatus = httpsCallable(this.functions, 'paymentUpdateStatus');
      const result = await updateStatus({
        idempotencyKey,
        status,
        stripePaymentIntentId,
        stripeChargeId
      });

      return result.data;
    } catch (error) {
      log.error('Failed to update payment status:', error);
      throw error;
    }
  }

  /**
   * Purchase credits with idempotency protection
   * Uses Firebase Cloud Function
   */
  async purchaseCreditsIdempotent(userId, creditsAmount, costUsdCents, context = '') {
    const idempotencyKey = this.generateIdempotencyKey(userId, 'credit_purchase', context);

    try {
      const purchaseCredits = httpsCallable(this.functions, 'paymentPurchaseCredits');
      const result = await purchaseCredits({
        userId,
        creditsAmount,
        costUsdCents,
        idempotencyKey,
        context
      });

      if (!result.data?.success) {
        return {
          success: false,
          duplicate: result.data?.duplicate || false,
          error: result.data?.error || 'Purchase failed',
          idempotencyKey
        };
      }

      if (result.data.duplicate) {
        log.info('Duplicate credit purchase detected, returning existing result');
        return {
          success: true,
          duplicate: true,
          creditsBalance: result.data.creditsBalance || 0,
          message: result.data.message,
          idempotencyKey
        };
      }

      return {
        success: true,
        duplicate: false,
        paymentIntent: result.data.paymentIntent,
        checkoutUrl: result.data.checkoutUrl,
        idempotencyKey
      };

    } catch (error) {
      log.error('Failed to purchase credits:', error);

      toast({
        title: 'Credit Purchase Failed',
        description: error.message || 'Unable to process credit purchase. Please try again.',
        variant: 'destructive'
      });

      return {
        success: false,
        duplicate: false,
        error: error.message,
        idempotencyKey
      };
    }
  }

  /**
   * Complete credit purchase after successful Stripe payment
   * Uses Firebase Cloud Function
   */
  async completeCreditPurchase(idempotencyKey, stripePaymentIntentId) {
    try {
      const completePurchase = httpsCallable(this.functions, 'paymentCompleteCreditPurchase');
      const result = await completePurchase({
        idempotencyKey,
        stripePaymentIntentId
      });

      if (!result.data?.success) {
        throw new Error(result.data?.error || 'Failed to complete credit purchase');
      }

      toast({
        title: 'Credits Purchased Successfully!',
        description: `You now have ${result.data.creditsBalance} credits available.`,
        variant: 'default'
      });

      return {
        success: true,
        creditsBalance: result.data.creditsBalance,
        transactionId: result.data.transactionId
      };

    } catch (error) {
      log.error('Failed to complete credit purchase:', error);
      throw error;
    }
  }

  /**
   * Charge credits for maid contact with idempotency
   * Uses Firebase Cloud Function
   */
  async chargeContactFeeIdempotent(sponsorId, maidId, creditsToCharge = 1, contactMessage = '') {
    const context = `contact-${maidId}-${this.hashString(contactMessage)}`;
    const idempotencyKey = this.generateIdempotencyKey(sponsorId, 'contact_fee', context);

    try {
      const chargeContactFee = httpsCallable(this.functions, 'paymentChargeContactFee');
      const result = await chargeContactFee({
        sponsorId,
        maidId,
        creditsToCharge,
        contactMessage,
        idempotencyKey
      });

      if (!result.data?.success) {
        if (result.data?.alreadyContacted) {
          return {
            success: false,
            alreadyContacted: true,
            creditsRemaining: result.data.creditsRemaining,
            message: 'You have already contacted this maid.'
          };
        } else if (result.data?.insufficientCredits) {
          return {
            success: false,
            insufficientCredits: true,
            creditsRemaining: result.data.creditsRemaining,
            message: `Insufficient credits. You need ${creditsToCharge} credits but only have ${result.data.creditsRemaining}.`
          };
        } else {
          return {
            success: false,
            message: 'Failed to charge contact fee. Please try again.'
          };
        }
      }

      return {
        success: true,
        creditsRemaining: result.data.creditsRemaining,
        message: 'Contact fee charged successfully. Your message has been sent.'
      };

    } catch (error) {
      log.error('Failed to charge contact fee:', error);

      toast({
        title: 'Contact Fee Failed',
        description: error.message || 'Unable to process contact fee. Please try again.',
        variant: 'destructive'
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to charge contact fee. Please try again.'
      };
    }
  }

  /**
   * Get user credit balance via GraphQL
   */
  async getCreditBalance(userId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetUserCreditsDocument,
        variables: { userId },
        fetchPolicy: 'network-only'
      });

      if (errors && errors.length > 0) {
        throw errors[0];
      }

      const credits = data?.user_credits?.[0];
      return {
        success: true,
        credits: credits?.credits_available || 0,
        totalPurchased: credits?.credits_total_purchased || 0,
        lastPurchaseAt: credits?.last_purchase_at
      };
    } catch (error) {
      log.error('Failed to get credit balance:', error);
      return {
        success: false,
        credits: 0,
        error: error.message
      };
    }
  }

  /**
   * Create Stripe payment intent via Firebase Cloud Function
   */
  async createStripePaymentIntent(amount, currency, metadata) {
    try {
      const createPaymentIntent = httpsCallable(this.functions, 'paymentCreatePaymentIntent');
      const result = await createPaymentIntent({
        amount,
        currency,
        metadata
      });

      if (!result.data?.success) {
        throw new Error(result.data?.error || 'Failed to create payment intent');
      }

      return {
        success: true,
        paymentIntent: result.data.paymentIntent
      };
    } catch (error) {
      log.error('Failed to create Stripe payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment history for user via GraphQL
   */
  async getPaymentHistory(userId, limit = 20, offset = 0) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetCreditTransactionsDocument,
        variables: { userId, limit, offset },
        fetchPolicy: 'network-only'
      });

      if (errors && errors.length > 0) {
        throw errors[0];
      }

      return {
        success: true,
        transactions: data?.credit_transactions || [],
        total: data?.credit_transactions_aggregate?.aggregate?.count || 0
      };
    } catch (error) {
      log.error('Failed to get payment history:', error);
      return {
        success: false,
        transactions: [],
        error: error.message
      };
    }
  }

  /**
   * Cleanup expired idempotency records via Firebase Cloud Function
   */
  async cleanupExpiredRecords() {
    try {
      const cleanup = httpsCallable(this.functions, 'paymentCleanupIdempotency');
      await cleanup();

      log.info('Cleaned up expired idempotency records');
      return { success: true };
    } catch (error) {
      log.error('Failed to cleanup expired records:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const paymentIdempotencyService = new PaymentIdempotencyService();
export default paymentIdempotencyService;
