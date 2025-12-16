/**
 * Stripe Billing Service - GraphQL Implementation
 * Uses Firebase Auth + Hasura GraphQL + Firebase Cloud Functions
 *
 * MIGRATED FROM SUPABASE TO FIREBASE/HASURA
 *
 * This service handles:
 * - Subscription checkout and management
 * - Credit purchases and balances
 * - Usage tracking and limits
 */

import { loadStripe } from '@stripe/stripe-js';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth, getIdToken } from '@/lib/firebaseClient';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from '@/components/ui/use-toast';
import { STRIPE_CONFIG, validateStripeConfig } from '@/config/stripeConfig';
import { createLogger } from '@/utils/logger';

const log = createLogger('StripeBilling.GraphQL');

// =====================================================
// GRAPHQL DOCUMENTS
// =====================================================

const GetSubscriptionStatusDocument = gql`
  query GetSubscriptionStatus($userId: String!) {
    subscriptions(
      where: { user_id: { _eq: $userId }, status: { _in: ["active", "trialing"] } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      user_id
      stripe_subscription_id
      stripe_customer_id
      status
      plan_name
      plan_type
      amount
      currency
      billing_period
      start_date
      end_date
      expires_at
      created_at
      updated_at
    }
  }
`;

const GetSubscriptionPlansDocument = gql`
  query GetSubscriptionPlans {
    subscription_plans(where: { active: { _eq: true } }, order_by: { price: asc }) {
      id
      name
      description
      price
      currency
      billing_period
      stripe_price_id
      features
      limits
      active
    }
  }
`;

// Note: user_usage_stats table may not exist - usage is tracked via subscription_usage
// This query will gracefully fail if table doesn't exist
const GetUsageStatsDocument = gql`
  query GetUsageStats($subscriptionId: uuid!, $periodStart: timestamptz!) {
    subscription_usage(
      where: { subscription_id: { _eq: $subscriptionId }, period_start: { _gte: $periodStart } }
      limit: 1
    ) {
      id
      subscription_id
      maid_listings_active
      job_postings_active
      messages_sent
      profile_views
      period_start
      period_end
    }
  }
`;

// Note: user_credits table currently uses uuid for user_id (legacy from Supabase)
// This will be deprecated - credits are managed via Firebase Cloud Functions
// For now, return empty balance - credits handled by Stripe/Firebase
const GetCreditBalanceDocument = null; // Disabled - uses legacy Supabase UUIDs

// Get credit transactions - uses legacy Supabase UUIDs
// Disabled for now - transactions managed via Firebase Cloud Functions
const GetCreditTransactionsDocument = null; // Disabled - uses legacy Supabase UUIDs

// Mutations
const IncrementUsageStatDocument = gql`
  mutation IncrementUsageStat($userId: String!, $feature: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { profile_views: 0 }
    ) {
      affected_rows
    }
  }
`;

// =====================================================
// SERVICE CLASS
// =====================================================

class GraphQLStripeBillingService {
  constructor() {
    this.stripePromise = null;
    this.initialized = false;
    this.config = STRIPE_CONFIG;
    this.functions = null;
    this.init();
  }

  async init() {
    try {
      const validation = validateStripeConfig();

      // Only fail on truly critical errors (missing publishable key)
      if (validation.critical.length > 0) {
        log.warn('Stripe configuration warnings:', validation.critical);
        // Don't fail initialization for price ID warnings - those may be loaded from env
      }

      // Check if we have the minimum required config (publishable key)
      if (!this.config.publishableKey) {
        log.error('Missing Stripe publishable key - cannot initialize');
        this.initialized = false;
        return;
      }

      this.stripePromise = loadStripe(this.config.publishableKey);
      this.functions = getFunctions();
      this.initialized = true;
      log.info('GraphQL Stripe billing service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize Stripe:', error);
      this.initialized = false;
    }
  }

  /**
   * Get current user ID from Firebase Auth
   */
  async getCurrentUserId() {
    const user = auth?.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }
    return user.uid;
  }

  /**
   * Get Stripe instance
   */
  async getStripe() {
    if (!this.initialized) {
      log.error('Attempting to use uninitialized Stripe service');
      throw new Error('Payment service is temporarily unavailable. Please try again later.');
    }
    return await this.stripePromise;
  }

  /**
   * Create subscription checkout session via Firebase Cloud Function
   */
  async createCheckoutSession(params) {
    try {
      const { userId, priceId, userEmail, planName, billingCycle, successUrl, cancelUrl, userType, planTier } =
        typeof params === 'object' ? params : { userId: arguments[0], priceId: arguments[1], successUrl: arguments[2], cancelUrl: arguments[3] };

      if (!userId || !priceId) {
        throw new Error('Missing userId or priceId for checkout session');
      }

      // Check if service is initialized
      if (!this.initialized || !this.functions) {
        log.error('Stripe service not initialized. Attempting re-initialization...');
        await this.init();
        if (!this.initialized || !this.functions) {
          throw new Error('Payment service is not available. Please refresh the page and try again.');
        }
      }

      // Get Firebase ID token for authentication
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('No authentication token. Please log in again.');
      }

      // Call Firebase Cloud Function (exported as stripeCreateCheckoutSession)
      const createCheckout = httpsCallable(this.functions, 'stripeCreateCheckoutSession');
      const result = await createCheckout({
        userId,
        priceId,
        planName,
        userEmail,
        billingCycle,
        userType,
        planTier,
        successUrl: successUrl || `${window.location.origin}/dashboard?success=true`,
        cancelUrl: cancelUrl || `${window.location.origin}/dashboard?canceled=true`,
      });

      if (!result.data?.url) {
        throw new Error('No checkout URL returned from Cloud Function');
      }

      // Redirect to Stripe Checkout page
      window.location.href = result.data.url;

      return { success: true, url: result.data.url };
    } catch (error) {
      log.error('Failed to create checkout session:', error);
      toast({
        title: 'Payment Error',
        description: 'Unable to start checkout process. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create customer portal session via Firebase Cloud Function
   */
  async createPortalSession(customerId, returnUrl) {
    try {
      const createPortal = httpsCallable(this.functions, 'stripeCreatePortalSession');
      const result = await createPortal({
        customerId,
        returnUrl: returnUrl || `${window.location.origin}/dashboard`,
      });

      if (!result.data?.url) {
        throw new Error('No portal URL returned');
      }

      window.location.href = result.data.url;
      return { success: true };
    } catch (error) {
      log.error('Failed to create portal session:', error);
      toast({
        title: 'Portal Error',
        description: 'Unable to access billing portal. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user subscription status via GraphQL
   */
  async getSubscriptionStatus(userId) {
    try {
      log.debug('Getting subscription status for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetSubscriptionStatusDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('Subscription query error:', errors[0]);
        throw errors[0];
      }

      const subscription = data?.subscriptions?.[0] || null;

      return {
        hasActiveSubscription: !!subscription,
        subscription,
        plan: subscription ? {
          name: subscription.plan_name,
          type: subscription.plan_type,
          price: subscription.amount,
          currency: subscription.currency,
          billing_period: subscription.billing_period,
        } : null,
      };
    } catch (error) {
      log.error('Failed to get subscription status:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        plan: null,
        error: error.message,
      };
    }
  }

  /**
   * Get available subscription plans via GraphQL
   */
  async getSubscriptionPlans() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetSubscriptionPlansDocument,
        fetchPolicy: 'cache-first',
      });

      if (errors && errors.length > 0) {
        throw errors[0];
      }

      return {
        success: true,
        plans: data?.subscription_plans || [],
      };
    } catch (error) {
      log.error('Failed to get subscription plans:', error);
      return {
        success: false,
        plans: [],
        error: error.message,
      };
    }
  }

  /**
   * Check if user can access premium features
   */
  async canAccessPremiumFeatures(userId) {
    const { hasActiveSubscription, plan } = await this.getSubscriptionStatus(userId);

    return {
      canAccess: hasActiveSubscription,
      plan,
      features: plan?.features || [],
      limits: plan?.limits || {},
    };
  }

  /**
   * Get usage statistics for current billing period
   * Uses subscription_usage table with subscription ID
   */
  async getUsageStats(userId) {
    try {
      // First get the user's subscription to get the subscription ID
      const { subscription } = await this.getSubscriptionStatus(userId);

      if (!subscription?.id) {
        // No subscription - return empty usage
        return {
          success: true,
          usage: {
            profile_views: 0,
            contact_requests: 0,
            job_posts: 0,
            messages_sent: 0,
          },
        };
      }

      const periodStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const { data, errors } = await apolloClient.query({
        query: GetUsageStatsDocument,
        variables: { subscriptionId: subscription.id, periodStart },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw errors[0];
      }

      const stats = data?.subscription_usage?.[0];

      return {
        success: true,
        usage: {
          profile_views: stats?.profile_views || 0,
          contact_requests: 0, // Not tracked in subscription_usage
          job_posts: stats?.job_postings_active || 0,
          messages_sent: stats?.messages_sent || 0,
          maid_listings: stats?.maid_listings_active || 0,
        },
      };
    } catch (error) {
      log.error('Failed to get usage stats:', error);
      return {
        success: false,
        usage: {
          profile_views: 0,
          contact_requests: 0,
          job_posts: 0,
          messages_sent: 0,
        },
        error: error.message,
      };
    }
  }

  /**
   * Track feature usage via Firebase Cloud Function
   */
  async trackUsage(userId, feature, amount = 1) {
    try {
      const incrementUsage = httpsCallable(this.functions, 'paymentIncrementUsage');
      await incrementUsage({ userId, feature, amount });
      return { success: true };
    } catch (error) {
      log.error('Failed to track usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has reached usage limits
   */
  async checkUsageLimits(userId, feature) {
    try {
      const [subscriptionResult, usageResult] = await Promise.all([
        this.getSubscriptionStatus(userId),
        this.getUsageStats(userId),
      ]);

      const { plan } = subscriptionResult;
      const { usage } = usageResult;

      if (!plan || !plan.limits) {
        // Free tier limits
        const freeLimits = {
          profile_views: 10,
          contact_requests: 3,
          job_posts: 1,
          messages_sent: 20,
        };

        const currentUsage = usage[feature] || 0;
        const limit = freeLimits[feature] || 0;

        return {
          canUse: currentUsage < limit,
          currentUsage,
          limit,
          remaining: Math.max(0, limit - currentUsage),
          isFreeTier: true,
        };
      }

      const currentUsage = usage[feature] || 0;
      const limit = plan.limits[feature] || Infinity;

      return {
        canUse: currentUsage < limit,
        currentUsage,
        limit,
        remaining: limit === Infinity ? Infinity : Math.max(0, limit - currentUsage),
        isFreeTier: false,
        planName: plan.name,
      };
    } catch (error) {
      log.error('Failed to check usage limits:', error);
      return {
        canUse: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        error: error.message,
      };
    }
  }

  /**
   * Handle successful payment via Firebase Cloud Function
   */
  async handlePaymentSuccess(sessionId) {
    try {
      const handleSuccess = httpsCallable(this.functions, 'stripeHandlePaymentSuccess');
      const result = await handleSuccess({ sessionId });

      toast({
        title: 'Payment Successful!',
        description: 'Your subscription has been activated.',
        variant: 'default',
      });

      return { success: true, subscription: result.data };
    } catch (error) {
      log.error('Failed to handle payment success:', error);
      toast({
        title: 'Payment Processing Error',
        description: 'Payment was successful but there was an issue activating your subscription. Please contact support.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel subscription via Firebase Cloud Function
   */
  async cancelSubscription(subscriptionId) {
    try {
      const cancelSub = httpsCallable(this.functions, 'stripeCancelSubscription');
      await cancelSub({ subscriptionId });

      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription has been canceled and will end at the current billing period.',
        variant: 'default',
      });

      return { success: true };
    } catch (error) {
      log.error('Failed to cancel subscription:', error);
      toast({
        title: 'Cancellation Error',
        description: 'Unable to cancel subscription. Please try again or contact support.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Purchase credits via Firebase Cloud Function (with idempotency)
   */
  async purchaseCredits(userId, creditsAmount, context = '') {
    try {
      const costUsdCents = creditsAmount * 50; // $0.50 per credit

      const purchaseCredits = httpsCallable(this.functions, 'paymentPurchaseCredits');
      const result = await purchaseCredits({
        userId,
        creditsAmount,
        costUsdCents,
        context,
      });

      if (!result.data?.success) {
        return { success: false, error: result.data?.error || 'Purchase failed' };
      }

      if (result.data.duplicate) {
        return { success: true, duplicate: true, message: result.data.message };
      }

      // Redirect to Stripe for payment
      if (result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      }

      return { success: true, paymentIntent: result.data.paymentIntent };
    } catch (error) {
      log.error('Failed to purchase credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user credit balance
   * Note: Credit system uses Firebase Cloud Functions for management
   * This returns 0 as credits are handled via Stripe billing
   */
  async getCreditBalance(userId) {
    // Credit balance is managed via Stripe/Firebase Cloud Functions
    // Return 0 for now - will be implemented via Firebase callable functions
    return {
      success: true,
      credits: 0,
      totalPurchased: 0,
    };
  }

  /**
   * Charge credits for maid contact via Firebase Cloud Function
   */
  async chargeContactFee(sponsorId, maidId, contactMessage = '') {
    try {
      const chargeContact = httpsCallable(this.functions, 'paymentChargeContactFee');
      const result = await chargeContact({
        sponsorId,
        maidId,
        creditsAmount: 1,
        contactMessage,
      });

      return result.data;
    } catch (error) {
      log.error('Failed to charge contact fee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment/credit transaction history
   * Note: Transaction history is managed via Stripe - use Stripe's payment history API
   */
  async getPaymentHistory(userId, limit = 20, offset = 0) {
    // Transaction history managed via Stripe billing
    // Return empty for now - will be fetched via Stripe API in customer portal
    return {
      success: true,
      transactions: [],
      total: 0,
    };
  }
}

// Create singleton instance
export const graphqlStripeBillingService = new GraphQLStripeBillingService();
export default graphqlStripeBillingService;
