import { loadStripe } from '@stripe/stripe-js';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from '@/components/ui/use-toast';
import {
  STRIPE_CONFIG,
  getPriceId,
  validateStripeConfig,
} from '@/config/stripeConfig';
import { createLogger } from '@/utils/logger';
import paymentIdempotencyService from '@/services/paymentIdempotencyService';
const log = createLogger('StripeBilling');

// GraphQL Queries
const GET_USER_SUBSCRIPTION = gql`
  query GetUserSubscription($user_id: uuid!) {
    subscriptions(
      where: { user_id: { _eq: $user_id }, status: { _in: ["active", "trialing"] } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      user_id
      status
      plan_name
      plan_type
      amount
      currency
      billing_period
      created_at
    }
  }
`;

const GET_SUBSCRIPTION_PLANS = gql`
  query GetSubscriptionPlans {
    subscription_plans(where: { active: { _eq: true } }, order_by: { price: asc }) {
      id
      name
      description
      price
      currency
      billing_period
      features
      limits
      active
    }
  }
`;

const GET_USER_USAGE_STATS = gql`
  query GetUserUsageStats($user_id: uuid!, $period_start: timestamptz!) {
    user_usage_stats(
      where: { user_id: { _eq: $user_id }, period_start: { _gte: $period_start } }
    ) {
      profile_views
      contact_requests
      job_posts
      messages_sent
    }
  }
`;

/**
 * Production Stripe Billing Service
 * Replaces mock billing with real Stripe integration
 */
class StripeBillingService {
  constructor() {
    this.stripePromise = null;
    this.initialized = false;
    this.config = STRIPE_CONFIG;
    this.functions = null;
    this.init();
  }

  async init() {
    try {
      // Validate Stripe configuration
      const validation = validateStripeConfig();

      // Log warnings but don't fail initialization
      if (validation.warnings.length > 0) {
        log.warn('Stripe configuration warnings:', validation.warnings);
      }

      if (validation.critical.length > 0) {
        log.warn('Stripe configuration notes:', validation.critical);
      }

      // Only fail if publishable key is missing
      if (!this.config.publishableKey) {
        log.error('Missing Stripe publishable key - cannot initialize');
        this.initialized = false;
        return;
      }

      this.stripePromise = loadStripe(this.config.publishableKey);
      this.functions = getFunctions();
      this.initialized = true;
      log.info('Stripe billing service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize Stripe:', error);
      this.initialized = false;
    }
  }

  /**
   * Call Firebase Cloud Function
   */
  async callFunction(functionName, data) {
    if (!this.functions) {
      throw new Error('Firebase Functions not initialized');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No active session found. Please log in again.');
    }

    const callable = httpsCallable(this.functions, functionName);
    const result = await callable(data);
    return result.data;
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
   * Create subscription checkout session
   */
  async createCheckoutSession(...args) {
    try {
      // Support both (userId, priceId, successUrl, cancelUrl)
      // and ({ userId, priceId, userEmail, planName, billingCycle, successUrl, cancelUrl })
      let params = {};
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        params = args[0];
      } else {
        const [userId, priceId, successUrl, cancelUrl] = args;
        params = { userId, priceId, successUrl, cancelUrl };
      }

      if (!params.userId || !params.priceId) {
        throw new Error('Missing userId or priceId for checkout session');
      }

      // Determine the correct redirect URL based on user type
      const userType = params.userType || 'agency';
      const defaultSuccessUrl = `${window.location.origin}/dashboard/${userType}/billing?success=true`;
      const defaultCancelUrl = `${window.location.origin}/dashboard/${userType}/billing?canceled=true`;

      const requestBody = {
        userId: params.userId,
        priceId: params.priceId,
        planName: params.planName,
        userEmail: params.userEmail,
        billingCycle: params.billingCycle,
        userType: userType,
        planTier: params.planTier,
        successUrl: params.successUrl || defaultSuccessUrl,
        cancelUrl: params.cancelUrl || defaultCancelUrl,
      };

      console.log('stripeBillingService - Request body:', JSON.stringify(requestBody, null, 2));

      // Check current auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No active session found. Please log in again.');
      }

      // Call Firebase Cloud Function
      const data = await this.callFunction('stripeCreateCheckoutSession', requestBody);

      if (!data) {
        console.error('stripeBillingService - No data returned from Cloud Function');
        throw new Error('No data returned from Cloud Function');
      }

      // Redirect to Stripe Checkout URL directly
      if (!data.url) {
        throw new Error('No checkout URL returned from Cloud Function');
      }

      // Redirect to Stripe Checkout page
      window.location.href = data.url;

      return { success: true, url: data.url };
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
   * Create customer portal session
   */
  async createPortalSession(customerId, returnUrl) {
    try {
      const data = await this.callFunction('stripeCreatePortalSession', {
        customerId,
        returnUrl: returnUrl || `${window.location.origin}/dashboard`,
      });

      // Redirect to customer portal
      window.location.href = data.url;
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
   * Get user subscription status
   */
  async getSubscriptionStatus(userId) {
    try {
      console.log('getSubscriptionStatus called with userId:', userId);

      // Check subscriptions table via GraphQL
      const { data: queryData } = await apolloClient.query({
        query: GET_USER_SUBSCRIPTION,
        variables: { user_id: userId },
        fetchPolicy: 'network-only'
      });

      const subscriptionData = queryData?.subscriptions?.[0];

      console.log('Database query result:', subscriptionData);

      const result = {
        hasActiveSubscription: !!subscriptionData,
        subscription: subscriptionData || null,
        plan: subscriptionData ? {
          name: subscriptionData.plan_name,
          type: subscriptionData.plan_type,
          price: subscriptionData.amount,
          currency: subscriptionData.currency,
          billing_period: subscriptionData.billing_period
        } : null,
      };

      console.log('Subscription status result:', result);

      return result;
    } catch (error) {
      log.error('Failed to get subscription status:', error);
      console.error('Exception in getSubscriptionStatus:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        plan: null,
        error: error.message,
      };
    }
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans() {
    try {
      const { data } = await apolloClient.query({
        query: GET_SUBSCRIPTION_PLANS,
        fetchPolicy: 'network-only'
      });

      return {
        success: true,
        plans: data?.subscription_plans || [],
      };
    } catch (error) {
      console.error('Failed to get subscription plans:', error);
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
    const { hasActiveSubscription, plan } =
      await this.getSubscriptionStatus(userId);

    return {
      canAccess: hasActiveSubscription,
      plan: plan,
      features: plan?.features || [],
      limits: plan?.limits || {},
    };
  }

  /**
   * Get usage statistics for current billing period
   */
  async getUsageStats(userId) {
    try {
      const periodStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const { data } = await apolloClient.query({
        query: GET_USER_USAGE_STATS,
        variables: { user_id: userId, period_start: periodStart },
        fetchPolicy: 'network-only'
      });

      const usageData = data?.user_usage_stats?.[0];

      return {
        success: true,
        usage: usageData || {
          profile_views: 0,
          contact_requests: 0,
          job_posts: 0,
          messages_sent: 0,
        },
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
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
   * Track feature usage
   */
  async trackUsage(userId, feature, amount = 1) {
    try {
      // Call Firebase Cloud Function to track usage
      await this.callFunction('paymentIncrementUsage', {
        userId,
        feature,
        amount,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to track usage:', error);
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
        // No active subscription - use free tier limits
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

      // Premium subscription - check plan limits
      const currentUsage = usage[feature] || 0;
      const limit = plan.limits[feature] || Infinity;

      return {
        canUse: currentUsage < limit,
        currentUsage,
        limit,
        remaining:
          limit === Infinity ? Infinity : Math.max(0, limit - currentUsage),
        isFreeTier: false,
        planName: plan.name,
      };
    } catch (error) {
      console.error('❌ Failed to check usage limits:', error);
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
   * Handle successful payment
   */
  async handlePaymentSuccess(sessionId) {
    try {
      const data = await this.callFunction('stripeHandlePaymentSuccess', { sessionId });

      toast({
        title: 'Payment Successful!',
        description: 'Your subscription has been activated.',
        variant: 'default',
      });

      return { success: true, subscription: data };
    } catch (error) {
      console.error('Failed to handle payment success:', error);
      toast({
        title: 'Payment Processing Error',
        description:
          'Payment was successful but there was an issue activating your subscription. Please contact support.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      await this.callFunction('stripeCancelSubscription', { subscriptionId });

      toast({
        title: 'Subscription Canceled',
        description:
          'Your subscription has been canceled and will end at the current billing period.',
        variant: 'default',
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: 'Cancellation Error',
        description:
          'Unable to cancel subscription. Please try again or contact support.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Purchase credits with idempotency protection
   */
  async purchaseCredits(userId, creditsAmount, context = '') {
    try {
      // Credit pricing: $0.50 per credit (50 cents = 50 USD cents)
      const costUsdCents = creditsAmount * 50;

      const result = await paymentIdempotencyService.purchaseCreditsIdempotent(
        userId,
        creditsAmount,
        costUsdCents,
        context
      );

      if (!result.success) {
        return result;
      }

      if (result.duplicate) {
        return result;
      }

      // Create checkout session for credits
      const stripe = await this.getStripe();
      const { error: stripeError } = await stripe.confirmPayment({
        elements: result.paymentIntent.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?credits_purchased=true`,
        },
      });

      if (stripeError) {
        // Update payment status to failed
        await paymentIdempotencyService.updatePaymentStatus(
          result.idempotencyKey,
          'failed'
        );
        throw stripeError;
      }

      return { success: true, paymentIntent: result.paymentIntent };

    } catch (error) {
      log.error('Failed to purchase credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete credit purchase (called after successful Stripe payment)
   */
  async completeCreditPurchase(idempotencyKey, stripePaymentIntentId) {
    try {
      return await paymentIdempotencyService.completeCreditPurchase(
        idempotencyKey,
        stripePaymentIntentId
      );
    } catch (error) {
      log.error('Failed to complete credit purchase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user credit balance
   */
  async getCreditBalance(userId) {
    try {
      return await paymentIdempotencyService.getCreditBalance(userId);
    } catch (error) {
      log.error('Failed to get credit balance:', error);
      return { success: false, credits: 0, error: error.message };
    }
  }

  /**
   * Charge credits for maid contact
   */
  async chargeContactFee(sponsorId, maidId, contactMessage = '') {
    try {
      return await paymentIdempotencyService.chargeContactFeeIdempotent(
        sponsorId,
        maidId,
        1, // 1 credit per contact
        contactMessage
      );
    } catch (error) {
      log.error('Failed to charge contact fee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId, limit = 20, offset = 0) {
    try {
      return await paymentIdempotencyService.getPaymentHistory(userId, limit, offset);
    } catch (error) {
      log.error('Failed to get payment history:', error);
      return { success: false, transactions: [], error: error.message };
    }
  }
}

// Create singleton instance
export const stripeBillingService = new StripeBillingService();
export default stripeBillingService;
