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
import { auth, functions } from '@/lib/firebaseClient';
import { httpsCallable } from 'firebase/functions';
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

const GET_POINTS_BOOST = gql`
  query GetPointsBoost($userId: String!) {
    subscriptions(
      where: {
        user_id: { _eq: $userId }
        plan_type: { _in: ["points_boost", "points_boost_paid"] }
      }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      user_id
      plan_type
      plan_name
      status
      amount
      start_date
      end_date
      metadata
      created_at
    }
  }
`;

// Paid boost plans: 100 points = 1 day = $1 USD = ~3.67 AED
const PAID_BOOST_PLANS = {
  weekly: {
    key: 'weekly',
    label: '7 Days',
    days: 7,
    points: 700,
    priceUSD: 7,
    priceAED: 25.70,
  },
  fifteen_days: {
    key: 'fifteen_days',
    label: '15 Days',
    days: 15,
    points: 1500,
    priceUSD: 15,
    priceAED: 55.05,
  },
  monthly: {
    key: 'monthly',
    label: '30 Days',
    days: 30,
    points: 3000,
    priceUSD: 30,
    priceAED: 110.10,
  },
};

const GET_PROFILE_COMPLETION = gql`
  query GetProfileCompletion($userId: String!) {
    maid_profiles_by_pk(id: $userId) {
      id
      profile_completion_percentage
      full_name
      date_of_birth
      nationality
      religion
      marital_status
      country
      state_province
      primary_profession
      education_level
      skills
      languages
      experience_years
      preferred_salary_min
      about_me
      profile_photo_url
      introduction_video_url
      work_preferences
      contract_duration_preference
      live_in_preference
      previous_countries
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

    // Map points_boost (free or paid) to premium tier
    if (subscription.plan_type === 'points_boost' || subscription.plan_type === 'points_boost_paid') return 'premium';

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
  /**
   * Get user's points boost subscription
   * @param {string} userId - User ID (Firebase UID)
   * @returns {Promise<Object|null>} Points boost subscription or null
   */
  async getPointsBoost(userId) {
    try {
      log.info('Fetching points boost for user:', userId);

      const { data, error } = await apolloClient.query({
        query: GET_POINTS_BOOST,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (error) {
        log.error('GraphQL error fetching points boost:', error);
        return null;
      }

      return data?.subscriptions?.[0] || null;
    } catch (error) {
      log.error('Exception fetching points boost:', error);
      return null;
    }
  }

  /**
   * Get profile data for points calculation
   * @param {string} userId - User ID (Firebase UID)
   * @returns {Promise<Object|null>} Profile data with fields for step-based points calculation
   */
  async getProfileForPoints(userId) {
    try {
      const { data, error } = await apolloClient.query({
        query: GET_PROFILE_COMPLETION,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (error) {
        log.error('GraphQL error fetching profile for points:', error);
        return null;
      }

      return data?.maid_profiles_by_pk || null;
    } catch (error) {
      log.error('Exception fetching profile for points:', error);
      return null;
    }
  }

  /**
   * Activate points boost subscription
   * @param {string} userId - User ID
   * @param {number} totalPoints - Total points earned from step-based calculation
   * @param {Object} pointsBreakdown - Breakdown of points by step
   * @param {string} userType - User type
   * @returns {Promise<Object>} Created subscription
   */
  async activatePointsBoost(userId, totalPoints, pointsBreakdown = {}, userType = 'maid') {
    try {
      const points = totalPoints;
      const days = points / 100;

      if (days <= 0) {
        throw new Error('Not enough points to activate boost');
      }

      log.info('Activating points boost:', { userId, points, days });

      const now = new Date();
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Note: user_id is set automatically by Hasura's INSERT permission (set: X-Hasura-User-Id)
      // Do NOT include user_id in the object or Hasura will reject it
      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_SUBSCRIPTION,
        variables: {
          object: {
            plan_id: `points_boost_${Date.now()}`,
            plan_type: 'points_boost',
            plan_name: 'Profile Points Boost',
            amount: 0,
            currency: 'AED',
            billing_period: 'one_time',
            status: 'active',
            start_date: now.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            metadata: {
              source: 'onboarding_points',
              points_used: points,
              days_granted: days,
              breakdown: pointsBreakdown,
            },
          },
        },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to activate points boost');
      }

      log.info('Points boost activated:', data?.insert_subscriptions_one?.id);
      return data?.insert_subscriptions_one;
    } catch (error) {
      log.error('Error activating points boost:', error);
      throw error;
    }
  }

  /**
   * Purchase a paid points boost via Stripe Checkout.
   * Uses Firebase httpsCallable to create a Stripe Checkout session, then redirects.
   * On success return, activatePaidBoost() creates the subscription record.
   * @param {string} planKey - 'weekly', 'fifteen_days', or 'monthly'
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  async purchasePointsBoost(planKey) {
    try {
      const plan = PAID_BOOST_PLANS[planKey];
      if (!plan) {
        throw new Error(`Invalid boost plan: ${planKey}`);
      }

      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      log.info('Creating paid boost checkout:', { planKey, days: plan.days, priceAED: plan.priceAED });

      if (!functions) {
        throw new Error('Firebase Functions not initialized');
      }

      // Call Cloud Function via httpsCallable
      const createCheckout = httpsCallable(functions, 'stripeCreateCheckoutSession');
      const result = await createCheckout({
        mode: 'payment',
        amount: Math.round(plan.priceAED * 100), // fils (AED cents)
        currency: 'aed',
        productName: `Premium Boost - ${plan.label}`,
        productDescription: `${plan.days} days of premium features (${plan.points} points)`,
        userType: 'maid',
        planTier: 'points_boost_paid',
        planName: `Premium Boost - ${plan.label}`,
        billingCycle: planKey,
        userEmail: user.email,
        successUrl: `${window.location.origin}/dashboard/maid/subscriptions?boost_success=true&plan=${planKey}`,
        cancelUrl: `${window.location.origin}/dashboard/maid/subscriptions?boost_canceled=true`,
      });

      const { url, sessionId } = result.data;

      if (!url && !sessionId) {
        throw new Error('No checkout URL returned from server');
      }

      log.info('Paid boost checkout session created:', sessionId);

      // Redirect to Stripe Checkout page
      if (url) {
        window.location.href = url;
      } else {
        // Fallback: use Stripe.js redirect
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error('Stripe not initialized');
        }
        const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
        if (redirectError) throw redirectError;
      }

      return { success: true };
    } catch (error) {
      log.error('Error creating paid boost checkout:', error);
      return { success: false, error };
    }
  }

  /**
   * Activate a paid points boost after successful payment
   * Called when user returns from Stripe with boost_success=true
   * @param {string} planKey - 'weekly', 'fifteen_days', or 'monthly'
   * @returns {Promise<Object>} Created subscription
   */
  async activatePaidBoost(planKey) {
    try {
      const plan = PAID_BOOST_PLANS[planKey];
      if (!plan) {
        throw new Error(`Invalid boost plan: ${planKey}`);
      }

      const now = new Date();
      const endDate = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);

      log.info('Activating paid boost:', { planKey, days: plan.days });

      // Note: user_id is set automatically by Hasura's INSERT permission
      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_SUBSCRIPTION,
        variables: {
          object: {
            plan_id: `points_boost_paid_${planKey}_${Date.now()}`,
            plan_type: 'points_boost_paid',
            plan_name: `Premium Boost - ${plan.label}`,
            amount: plan.priceAED,
            currency: 'AED',
            billing_period: 'one_time',
            status: 'active',
            start_date: now.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            metadata: {
              source: 'paid_boost',
              plan_key: planKey,
              points: plan.points,
              days_granted: plan.days,
              price_usd: plan.priceUSD,
              price_aed: plan.priceAED,
            },
          },
        },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to activate paid boost');
      }

      log.info('Paid boost activated:', data?.insert_subscriptions_one?.id);
      return data?.insert_subscriptions_one;
    } catch (error) {
      log.error('Error activating paid boost:', error);
      throw error;
    }
  }

  /**
   * Get available paid boost plans
   * @returns {Object} Paid boost plans config
   */
  getPaidBoostPlans() {
    return PAID_BOOST_PLANS;
  }
}

export default new SubscriptionService();
