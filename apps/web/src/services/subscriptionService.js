/**
 * Subscription Service
 * Handles all subscription-related database operations and Stripe integration
 *
 * Uses:
 * - Apollo Client/GraphQL for data operations (via Hasura)
 * - Firebase Auth for user authentication
 * - Stripe for payment processing
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { getStripe } from '@/config/stripe';
import { createLogger } from '@/utils/logger';

const log = createLogger('SubscriptionService');

// Stripe Price IDs from environment variables
const STRIPE_PRICE_IDS = {
  maid: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PREMIUM_ANNUAL,
    },
  },
  sponsor: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL,
    },
  },
  agency: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_AGENCY_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_ANNUAL,
    },
  },
};

// GraphQL Queries and Mutations
const GET_ACTIVE_SUBSCRIPTION = gql`
  query GetActiveSubscription($userId: String!) {
    subscriptions(
      where: {
        user_id: { _eq: $userId }
        status: { _in: ["active", "past_due"] }
      }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      user_id
      plan_id
      plan_type
      plan_name
      status
      amount
      currency
      billing_period
      start_date
      end_date
      expires_at
      stripe_subscription_id
      stripe_customer_id
      created_at
      updated_at
    }
  }
`;

const GET_ALL_SUBSCRIPTIONS = gql`
  query GetAllSubscriptions($userId: String!) {
    subscriptions(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      id
      user_id
      plan_id
      plan_type
      plan_name
      status
      amount
      currency
      billing_period
      start_date
      end_date
      expires_at
      stripe_subscription_id
      stripe_customer_id
      created_at
      updated_at
    }
  }
`;

const INSERT_SUBSCRIPTION = gql`
  mutation InsertSubscription($object: subscriptions_insert_input!) {
    insert_subscriptions_one(object: $object) {
      id
      user_id
      plan_id
      plan_type
      plan_name
      status
      amount
      currency
      billing_period
      start_date
      end_date
      stripe_subscription_id
      stripe_customer_id
      created_at
    }
  }
`;

const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateSubscription($id: uuid!, $set: subscriptions_set_input!) {
    update_subscriptions_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      user_id
      plan_id
      plan_type
      plan_name
      status
      amount
      currency
      billing_period
      start_date
      end_date
      cancelled_at
      features
      updated_at
    }
  }
`;

const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($id: uuid!, $cancelledAt: timestamptz!) {
    update_subscriptions_by_pk(
      pk_columns: { id: $id }
      _set: { status: "cancelled", cancelled_at: $cancelledAt }
    ) {
      id
      status
      cancelled_at
      updated_at
    }
  }
`;

/**
 * Subscription Service
 * Handles all subscription-related database operations and Stripe integration
 */
class SubscriptionService {
  /**
   * Get current Firebase user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return auth?.currentUser || null;
  }

  /**
   * Get user's active subscription
   * @param {string} userId - User ID (Firebase UID)
   * @returns {Promise<Object|null>} Subscription data or null
   */
  async getActiveSubscription(userId) {
    try {
      log.info('Fetching active subscription for user:', userId);

      const { data, error } = await apolloClient.query({
        query: GET_ACTIVE_SUBSCRIPTION,
        variables: { userId },
        fetchPolicy: 'network-only', // Always fetch fresh data
      });

      if (error) {
        log.error('GraphQL error fetching subscription:', error);
        return null;
      }

      const subscription = data?.subscriptions?.[0] || null;

      if (subscription) {
        log.info('Found subscription:', {
          id: subscription.id,
          plan_type: subscription.plan_type,
          status: subscription.status,
        });
      } else {
        log.info('No active subscription found for user');
      }

      return subscription;
    } catch (error) {
      log.error('Exception fetching active subscription:', error);
      return null;
    }
  }

  /**
   * Get all user subscriptions (including expired/cancelled)
   * @param {string} userId - User ID (Firebase UID)
   * @returns {Promise<Array>} Array of subscriptions
   */
  async getAllSubscriptions(userId) {
    try {
      const { data, error } = await apolloClient.query({
        query: GET_ALL_SUBSCRIPTIONS,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (error) {
        throw error;
      }

      return data?.subscriptions || [];
    } catch (error) {
      log.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const {
        userId,
        planId,
        planName,
        planType,
        amount,
        currency = 'AED',
        billingPeriod,
        startDate,
        endDate,
        stripeSubscriptionId = null,
        stripeCustomerId = null,
        features = {},
        userType = 'sponsor',
      } = subscriptionData;

      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_SUBSCRIPTION,
        variables: {
          object: {
            user_id: userId,
            plan_id: planId,
            plan_name: planName,
            plan_type: planType,
            amount,
            currency,
            billing_period: billingPeriod,
            status: 'active',
            start_date: startDate,
            end_date: endDate,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
          },
        },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create subscription');
      }

      return data?.insert_subscriptions_one;
    } catch (error) {
      log.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_SUBSCRIPTION,
        variables: {
          id: subscriptionId,
          set: updates,
        },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update subscription');
      }

      return data?.update_subscriptions_by_pk;
    } catch (error) {
      log.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {boolean} cancelImmediately - Whether to cancel immediately
   * @returns {Promise<Object>} Updated subscription
   */
  async cancelSubscription(subscriptionId, cancelImmediately = false) {
    try {
      log.info('Cancelling subscription:', { subscriptionId, cancelImmediately });

      // If there's a Stripe subscription, cancel it first via Firebase Function
      // For now, we'll just update the database
      // Stripe cancellation via Firebase Function — pending Cloud Function deployment

      const { data, errors } = await apolloClient.mutate({
        mutation: CANCEL_SUBSCRIPTION,
        variables: {
          id: subscriptionId,
          cancelledAt: new Date().toISOString(),
        },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to cancel subscription');
      }

      log.info('Subscription cancelled successfully');
      return data?.update_subscriptions_by_pk;
    } catch (error) {
      log.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade/downgrade subscription plan
   * @param {string} userId - User ID
   * @param {string} newPlanType - New plan type
   * @param {Object} planDetails - Plan details
   * @returns {Promise<Object>} Updated or new subscription
   */
  async changePlan(userId, newPlanType, planDetails) {
    try {
      // Get active subscription
      const activeSubscription = await this.getActiveSubscription(userId);

      // If upgrading from free (no subscription), create new subscription
      // Format dates as YYYY-MM-DD for GraphQL 'date' type
      if (!activeSubscription) {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return await this.createSubscription({
          userId,
          ...planDetails,
          planType: newPlanType,
          startDate,
          endDate,
        });
      }

      // If downgrading to free, cancel subscription
      if (newPlanType === 'free') {
        return await this.cancelSubscription(activeSubscription.id);
      }

      // Otherwise, update existing subscription
      return await this.updateSubscription(activeSubscription.id, {
        plan_type: newPlanType,
        plan_name: planDetails.planName,
        amount: planDetails.amount,
        features: planDetails.features,
      });
    } catch (error) {
      log.error('Error changing plan:', error);
      throw error;
    }
  }

  /**
   * Check if subscription is expired
   * @param {Object} subscription - Subscription object
   * @returns {boolean} True if expired
   */
  isSubscriptionExpired(subscription) {
    if (!subscription || !subscription.end_date) return false;

    const endDate = new Date(subscription.end_date);
    const now = new Date();

    return endDate < now;
  }

  /**
   * Get subscription status
   * @param {Object} subscription - Subscription object
   * @returns {string} Status: 'active', 'expired', 'cancelled', 'free'
   */
  getSubscriptionStatus(subscription) {
    if (!subscription) return 'free';

    // Check if expired
    if (this.isSubscriptionExpired(subscription) && subscription.status === 'active') {
      return 'expired';
    }

    return subscription.status;
  }

  /**
   * Calculate days remaining in subscription
   * @param {Object} subscription - Subscription object
   * @returns {number} Days remaining
   */
  getDaysRemaining(subscription) {
    if (!subscription || !subscription.end_date) return 0;

    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get subscription plan type (free, pro, premium)
   * @param {Object} subscription - Subscription object
   * @returns {string} Plan type
   */
  getPlanType(subscription) {
    if (!subscription) return 'free';

    const status = this.getSubscriptionStatus(subscription);
    if (status === 'expired' || status === 'cancelled') return 'free';

    return subscription.plan_type || 'free';
  }

  /**
   * Get Stripe Price ID for a plan
   * @param {string} userType - 'maid', 'sponsor', or 'agency'
   * @param {string} planTier - 'pro' or 'premium'
   * @param {string} billingCycle - 'monthly' or 'annual'
   * @returns {string|null} Stripe Price ID
   */
  getStripePriceId(userType, planTier, billingCycle = 'monthly') {
    try {
      const priceId = STRIPE_PRICE_IDS[userType]?.[planTier]?.[billingCycle];

      if (!priceId) {
        log.error('Price ID not found:', { userType, planTier, billingCycle });
        return null;
      }

      log.debug('Retrieved price ID:', priceId);
      return priceId;
    } catch (error) {
      log.error('Error getting price ID:', error);
      return null;
    }
  }

  /**
   * Create Stripe Checkout Session
   * Uses Firebase Cloud Function for secure server-side session creation
   *
   * @param {string} userType - User type ('maid', 'sponsor', 'agency')
   * @param {string} planTier - Plan tier ('pro', 'premium')
   * @param {string} billingCycle - Billing cycle ('monthly', 'annual')
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  async createCheckoutSession(userType, planTier, billingCycle = 'monthly') {
    try {
      log.info('Creating Stripe checkout session:', { userType, planTier, billingCycle });

      // Get current user from Firebase Auth
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get Stripe price ID
      const priceId = this.getStripePriceId(userType, planTier, billingCycle);
      if (!priceId) {
        throw new Error(
          `Stripe Price ID not configured for ${userType} ${planTier} ${billingCycle}. ` +
          'Please check your .env file.'
        );
      }

      // Get Stripe instance
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized. Please add VITE_STRIPE_PUBLISHABLE_KEY to .env');
      }

      // Get Firebase ID token for authenticated API call
      const idToken = await user.getIdToken();

      log.info('Calling Firebase Function: createCheckoutSession');

      // Call Firebase Cloud Function to create checkout session
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
        `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;

      const response = await fetch(`${functionUrl}/createCheckoutSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          priceId,
          userType,
          planTier,
          billingCycle,
          userId: user.uid,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard/${userType}/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/${userType}/billing?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.sessionId) {
        throw new Error('No session ID returned from server');
      }

      log.info('Checkout session created:', data.sessionId);

      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (redirectError) {
        log.error('Stripe redirect error:', redirectError);
        throw redirectError;
      }

      return { success: true };
    } catch (error) {
      log.error('Error in createCheckoutSession:', error);
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Handle successful checkout (called after Stripe redirects back)
   * @param {string} sessionId - Stripe Session ID
   */
  async handleCheckoutSuccess(sessionId) {
    try {
      log.info('Handling checkout success:', sessionId);

      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const idToken = await user.getIdToken();

      // Call Firebase Function to handle checkout success
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
        `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;

      const response = await fetch(`${functionUrl}/handleCheckoutSuccess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to handle checkout success');
      }

      const data = await response.json();

      log.info('Checkout success handled:', data);
      return { success: true, data };
    } catch (error) {
      log.error('Error handling checkout success:', error);
      return { success: false, error };
    }
  }

  /**
   * Create Customer Portal session for managing subscription
   * @returns {Promise<{success: boolean, url?: string, error?: Error}>}
   */
  async createPortalSession() {
    try {
      log.info('Creating customer portal session');

      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const idToken = await user.getIdToken();

      // Call Firebase Function to create portal session
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
        `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;

      const response = await fetch(`${functionUrl}/createPortalSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          returnUrl: `${window.location.origin}/dashboard/subscriptions`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const data = await response.json();

      if (!data || !data.url) {
        throw new Error('No portal URL returned');
      }

      log.info('Portal session created');
      return { success: true, url: data.url };
    } catch (error) {
      log.error('Error creating portal session:', error);
      return { success: false, error };
    }
  }
}

export default new SubscriptionService();
