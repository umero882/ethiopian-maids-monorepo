/**
 * useSubscription Hook
 *
 * Hook for managing subscription functionality in the mobile app.
 * Provides subscription plans, current status, usage stats, and upgrade/downgrade actions.
 * Implements industry-standard checkout flow with return path tracking.
 */

import { useCallback, useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from './useAuth';
import { useSubscriptionContext } from '../context/SubscriptionContext';

// Subscription plan types
export type PlanType = 'free' | 'pro' | 'premium';
export type BillingCycle = 'monthly' | 'annual';
export type UserType = 'sponsor' | 'maid' | 'agency';

// Plan configuration
export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
}

export interface PlanLimits {
  // Sponsor limits
  activeJobPostings?: number | 'Unlimited';
  candidateSearches?: number | 'Unlimited';
  savedCandidates?: number | 'Unlimited';
  // Maid limits
  profileViews?: number | 'Unlimited';
  jobApplications?: number | 'Unlimited';
  // Shared limits
  messageThreads?: number | 'Unlimited';
  prioritySupport?: boolean;
  advancedFilters?: boolean;
  analytics?: boolean;
  verifiedBadge?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planType: PlanType;
  planName: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  amount: number;
  currency: string;
  billingPeriod: BillingCycle;
  startDate: string;
  endDate: string;
  expiresAt?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  cancelledAt?: string;
  features: Record<string, any>;
  paymentStatus?: string;
  gracePeriodEnds?: string;
  userType?: string;
}

export interface UsageStats {
  activeJobPostings?: number;
  candidateSearches?: number;
  savedCandidates?: number;
  profileViews?: number;
  jobApplications?: number;
  messageThreads?: number;
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: Record<UserType, PlanConfig[]> = {
  sponsor: [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic access for employers',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        '1 active job posting',
        '10 candidate searches per month',
        '3 saved candidates',
        'Basic messaging',
      ],
      limits: {
        activeJobPostings: 1,
        candidateSearches: 10,
        savedCandidates: 3,
        messageThreads: 3,
        prioritySupport: false,
        advancedFilters: false,
        analytics: false,
        verifiedBadge: false,
      },
    },
    {
      id: 'pro',
      name: 'Weekly',
      description: 'Short-term access for quick hiring',
      monthlyPrice: 99,
      annualPrice: 891,
      currency: 'AED',
      popular: true,
      features: [
        '1 week of premium access',
        '10 candidate searches',
        '5 saved candidates',
        '3 message threads',
        'Standard customer support',
      ],
      limits: {
        activeJobPostings: 3,
        candidateSearches: 10,
        savedCandidates: 5,
        messageThreads: 3,
        prioritySupport: false,
        advancedFilters: false,
        analytics: false,
        verifiedBadge: false,
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Unlimited hiring power with AI matching',
      monthlyPrice: 599,
      annualPrice: 5391,
      currency: 'AED',
      features: [
        'Unlimited job postings',
        'Unlimited candidate searches',
        'Unlimited saved candidates',
        'Unlimited message threads',
        'AI-powered matching',
        '6-hour priority support',
        'Priority candidate access',
        'Dedicated account manager',
      ],
      limits: {
        activeJobPostings: 'Unlimited',
        candidateSearches: 'Unlimited',
        savedCandidates: 'Unlimited',
        messageThreads: 'Unlimited',
        prioritySupport: true,
        advancedFilters: true,
        analytics: true,
        verifiedBadge: true,
      },
    },
  ],
  maid: [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic profile to get started',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        'Create your profile',
        'Apply to 5 jobs/month',
        'Basic visibility',
        '5 messages/day',
        'Email support',
      ],
      limits: {
        profileViews: 50,
        jobApplications: 5,
        messageThreads: 5,
        prioritySupport: false,
        advancedFilters: false,
        analytics: false,
        verifiedBadge: false,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Boost your profile visibility',
      monthlyPrice: 29,
      annualPrice: 280,
      currency: 'AED',
      popular: true,
      features: [
        'Unlimited job applications',
        'Featured profile',
        'Priority in search results',
        'Unlimited messages',
        'Priority support',
        'Verified badge',
      ],
      limits: {
        profileViews: 500,
        jobApplications: 'Unlimited',
        messageThreads: 'Unlimited',
        prioritySupport: true,
        advancedFilters: true,
        analytics: false,
        verifiedBadge: true,
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Maximum visibility and premium features',
      monthlyPrice: 49,
      annualPrice: 470,
      currency: 'AED',
      features: [
        'Everything in Pro',
        'Top placement in search',
        'Profile analytics',
        'Skill verification badges',
        'Video profile option',
        'Direct employer contact',
      ],
      limits: {
        profileViews: 'Unlimited',
        jobApplications: 'Unlimited',
        messageThreads: 'Unlimited',
        prioritySupport: true,
        advancedFilters: true,
        analytics: true,
        verifiedBadge: true,
      },
    },
  ],
  agency: [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic agency management',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        '3 maid listings',
        '5 message threads',
        '10 sponsor connections',
        'Standard customer support',
      ],
      limits: {
        activeJobPostings: 3,
        candidateSearches: 30,
        savedCandidates: 10,
        messageThreads: 5,
        prioritySupport: false,
        advancedFilters: false,
        analytics: false,
        verifiedBadge: false,
      },
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'Comprehensive agency tools',
      monthlyPrice: 499,
      annualPrice: 4491,
      currency: 'AED',
      popular: true,
      features: [
        '25 maid listings',
        '50 message threads',
        '100 sponsor connections',
        'Analytics dashboard',
        '24-hour support response',
        'Direct messaging',
      ],
      limits: {
        activeJobPostings: 'Unlimited',
        candidateSearches: 'Unlimited',
        savedCandidates: 100,
        messageThreads: 50,
        prioritySupport: true,
        advancedFilters: true,
        analytics: true,
        verifiedBadge: false,
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Enterprise agency solution',
      monthlyPrice: 999,
      annualPrice: 8991,
      currency: 'AED',
      features: [
        'Unlimited maid listings',
        'Unlimited message threads',
        'Unlimited sponsor connections',
        'Advanced analytics dashboard',
        'Bulk upload capabilities',
        'Verification badge',
        '6-hour priority support',
        'White-label options',
        'API access',
        'Dedicated account manager',
      ],
      limits: {
        activeJobPostings: 'Unlimited',
        candidateSearches: 'Unlimited',
        savedCandidates: 'Unlimited',
        messageThreads: 'Unlimited',
        prioritySupport: true,
        advancedFilters: true,
        analytics: true,
        verifiedBadge: true,
      },
    },
  ],
};

// Stripe Payment Links - Direct checkout URLs
// These are Stripe Payment Links that allow users to pay without needing a backend
// NOTE: These test links need to be replaced with live Stripe Payment Links in production
// To create Payment Links: Stripe Dashboard > Products > Payment Links
export const STRIPE_PAYMENT_LINKS: Record<UserType, Record<string, { monthly: string; yearly: string } | string>> = {
  sponsor: {
    pro: {
      monthly: 'https://buy.stripe.com/test_5kQ28kc3E17v7dvbEt8og0c',
      yearly: 'https://buy.stripe.com/test_dRm4gs2t417v8hz23T8og0f',
    },
    premium: {
      monthly: 'https://buy.stripe.com/test_dRm4gs2t417v8hz23T8og0f',
      yearly: 'https://buy.stripe.com/test_6oU7sE8Rs6rP7dv8sh8og0k',
    },
  },
  agency: {
    pro: {
      monthly: 'https://buy.stripe.com/test_00wcMY5Fg7vT0P70ZP8og0g',
      yearly: 'https://buy.stripe.com/test_bJe7sEgjU03r41jgYN8og0l',
    },
    premium: {
      monthly: 'https://buy.stripe.com/test_cNi3co8RseYl41j6k98og0h',
      yearly: 'https://buy.stripe.com/test_fZu5kwgjUg2pgO537X8og0m',
    },
  },
  maid: {
    pro: {
      monthly: '', // Maids don't have paid plans yet
      yearly: '',
    },
    premium: {
      monthly: '',
      yearly: '',
    },
  },
};

// Helper function to get payment link for a plan
export const getPaymentLink = (
  userType: UserType,
  planType: PlanType,
  billingCycle: BillingCycle = 'monthly'
): string | null => {
  if (planType === 'free') return null;

  const planLinks = STRIPE_PAYMENT_LINKS[userType]?.[planType];
  if (!planLinks) return null;

  if (typeof planLinks === 'string') return planLinks;

  const cycleKey = billingCycle === 'annual' ? 'yearly' : 'monthly';
  return planLinks[cycleKey] || null;
};

// GraphQL Queries
// Note: subscriptions.user_id uses String type (Firebase UID)
const GET_USER_SUBSCRIPTION = gql`
  query GetUserSubscription($userId: String!) {
    subscriptions(
      where: { user_id: { _eq: $userId }, status: { _in: ["active", "past_due"] } }
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
      cancelled_at
      features
      payment_status
      grace_period_ends
      user_type
      created_at
      updated_at
    }
  }
`;

const GET_SUBSCRIPTION_HISTORY = gql`
  query GetSubscriptionHistory($userId: String!) {
    subscriptions(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 10
    ) {
      id
      plan_type
      plan_name
      status
      amount
      currency
      billing_period
      start_date
      end_date
      cancelled_at
      created_at
    }
  }
`;

// Get profile by Firebase UID (profiles.id IS the Firebase UID)
const GET_PROFILE_BY_USER_ID = gql`
  query GetProfileByUserId($userId: String!) {
    profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      user_type
    }
  }
`;

/**
 * Main subscription hook
 */
export function useSubscription() {
  const { user, userType } = useAuth();
  const subscriptionContext = useSubscriptionContext();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [effectiveUserType, setEffectiveUserType] = useState<UserType>('sponsor');

  // Get profile ID from Firebase UID
  useQuery(GET_PROFILE_BY_USER_ID, {
    variables: { userId: user?.uid || '' },
    skip: !user?.uid,
    onCompleted: (data) => {
      if (data?.profiles?.[0]) {
        setProfileId(data.profiles[0].id);
        setEffectiveUserType((data.profiles[0].user_type as UserType) || 'sponsor');
      }
    },
  });

  // Fetch current subscription using Firebase UID directly
  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery(GET_USER_SUBSCRIPTION, {
    variables: { userId: user?.uid || '' },
    skip: !user?.uid,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch subscription history using Firebase UID
  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useQuery(GET_SUBSCRIPTION_HISTORY, {
    variables: { userId: user?.uid || '' },
    skip: !user?.uid,
    fetchPolicy: 'cache-and-network',
  });

  // Parse subscription data
  const rawSubscription = subscriptionData?.subscriptions?.[0];
  const subscription: Subscription | null = rawSubscription
    ? {
        id: rawSubscription.id,
        userId: rawSubscription.user_id,
        planId: rawSubscription.plan_id,
        planType: rawSubscription.plan_type || 'free',
        planName: rawSubscription.plan_name || 'Free',
        status: rawSubscription.status,
        amount: rawSubscription.amount || 0,
        currency: rawSubscription.currency || 'AED',
        billingPeriod: rawSubscription.billing_period || 'monthly',
        startDate: rawSubscription.start_date,
        endDate: rawSubscription.end_date,
        expiresAt: rawSubscription.expires_at,
        stripeSubscriptionId: rawSubscription.stripe_subscription_id,
        stripeCustomerId: rawSubscription.stripe_customer_id,
        cancelledAt: rawSubscription.cancelled_at,
        features: rawSubscription.features || {},
        paymentStatus: rawSubscription.payment_status,
        gracePeriodEnds: rawSubscription.grace_period_ends,
        userType: rawSubscription.user_type,
      }
    : null;

  // Get current plan type
  const currentPlan: PlanType = subscription?.planType || 'free';

  // Get plans for user type
  const availablePlans = SUBSCRIPTION_PLANS[effectiveUserType] || SUBSCRIPTION_PLANS.sponsor;

  // Get current plan config
  const currentPlanConfig = availablePlans.find((p) => p.id === currentPlan) || availablePlans[0];

  // Calculate days remaining
  const getDaysRemaining = useCallback(() => {
    if (!subscription?.endDate) return null;
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [subscription?.endDate]);

  // Check if subscription is expired
  const isExpired = useCallback(() => {
    if (!subscription?.endDate) return false;
    return new Date(subscription.endDate) < new Date();
  }, [subscription?.endDate]);

  // Get status display
  const getStatusDisplay = useCallback(() => {
    if (!subscription) return { text: 'Free Plan', color: '#6B7280' };

    switch (subscription.status) {
      case 'active':
        return { text: 'Active', color: '#10B981' };
      case 'past_due':
        return { text: 'Payment Due', color: '#F59E0B' };
      case 'cancelled':
        return { text: 'Cancelled', color: '#EF4444' };
      case 'expired':
        return { text: 'Expired', color: '#6B7280' };
      default:
        return { text: subscription.status, color: '#6B7280' };
    }
  }, [subscription]);

  // Open Stripe checkout - redirects to web pricing page which handles Stripe checkout
  // After successful payment, redirects back to app via deep link
  // Industry standard: saves return path to redirect user back after payment
  const openCheckout = useCallback(
    async (planType: PlanType, billingCycle: BillingCycle = 'monthly', returnPath?: string) => {
      try {
        if (planType === 'free') {
          Alert.alert('Free Plan', 'You are already on the free plan or want to downgrade. Please contact support.');
          return;
        }

        // Save the return path and pending plan before opening checkout
        // This allows us to redirect the user back after successful payment
        const currentPath = returnPath || `/${effectiveUserType}/subscriptions`;
        await subscriptionContext.startCheckout(currentPath, planType);

        console.log('[Subscription] Starting checkout, will return to:', currentPath);

        // Web app base URL - use localhost for development, production URL otherwise
        // IMPORTANT: Set EXPO_PUBLIC_WEB_APP_URL in your .env for production
        const baseUrl = process.env.EXPO_PUBLIC_WEB_APP_URL ||
          (__DEV__ ? 'http://localhost:5173' : 'https://ethiopianmaids.com');

        // Success URL redirects to web checkout success page, which then redirects back to the app
        // The web page handles the deep link redirect: ethiopianmaids://payment/success
        const mobileDeepLink = encodeURIComponent(`ethiopianmaids://payment/success?plan=${planType}`);

        // Build checkout URL for web pricing page
        // The web pricing page handles the Stripe checkout properly
        const params = new URLSearchParams({
          plan: planType,
          billing: billingCycle,
          userType: effectiveUserType,
          mobile: 'true',
          returnUrl: mobileDeepLink,
        });

        if (user?.uid) {
          params.append('userId', user.uid);
        }
        if (user?.email) {
          params.append('email', user.email);
        }

        const checkoutUrl = `${baseUrl}/pricing?${params.toString()}`;

        console.log('[Subscription] Opening web checkout:', checkoutUrl);

        const canOpen = await Linking.canOpenURL(checkoutUrl);
        if (canOpen) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert(
            'Unable to Open',
            'Please visit the web app to upgrade your subscription.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Copy URL',
                onPress: () => {
                  // Copy URL to clipboard - user can paste in browser
                  console.log('[Subscription] Checkout URL:', checkoutUrl);
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('[Subscription] Error opening checkout:', error);
        Alert.alert('Error', 'Unable to open checkout. Please try again.');
      }
    },
    [user?.uid, user?.email, effectiveUserType, subscriptionContext]
  );

  // Open subscription management portal
  const openManagePortal = useCallback(async () => {
    try {
      // Use environment variable or fallback to production URL
      const baseUrl = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://ethiopianmaids.com';
      const portalUrl = `${baseUrl}/dashboard/${effectiveUserType}/subscriptions`;

      const canOpen = await Linking.canOpenURL(portalUrl);
      if (canOpen) {
        await Linking.openURL(portalUrl);
      } else {
        Alert.alert(
          'Unable to Open',
          'Please visit the web app to manage your subscription.'
        );
      }
    } catch (error) {
      console.error('[Subscription] Error opening portal:', error);
      Alert.alert('Error', 'Unable to open subscription portal.');
    }
  }, [effectiveUserType]);

  // Refresh subscription data
  const refresh = useCallback(async () => {
    await Promise.all([refetchSubscription(), refetchHistory()]);
  }, [refetchSubscription, refetchHistory]);

  return {
    // Subscription data
    subscription,
    currentPlan,
    currentPlanConfig,
    availablePlans,
    subscriptionHistory: historyData?.subscriptions || [],

    // Status
    loading: subscriptionLoading || historyLoading,
    error: subscriptionError,
    isExpired: isExpired(),
    daysRemaining: getDaysRemaining(),
    statusDisplay: getStatusDisplay(),

    // User info
    userType: effectiveUserType,
    profileId,

    // Actions
    openCheckout,
    openManagePortal,
    refresh,
  };
}

/**
 * Hook for subscription pricing display
 */
export function useSubscriptionPricing(userType: UserType = 'sponsor') {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plans = SUBSCRIPTION_PLANS[userType] || SUBSCRIPTION_PLANS.sponsor;

  const getPrice = useCallback(
    (plan: PlanConfig) => {
      return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    },
    [billingCycle]
  );

  const getSavings = useCallback(
    (plan: PlanConfig) => {
      if (billingCycle === 'monthly' || plan.monthlyPrice === 0) return 0;
      const annualIfMonthly = plan.monthlyPrice * 12;
      return Math.round(((annualIfMonthly - plan.annualPrice) / annualIfMonthly) * 100);
    },
    [billingCycle]
  );

  const formatPrice = useCallback(
    (amount: number, currency: string = 'AED') => {
      if (amount === 0) return 'Free';
      return `${currency} ${amount}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`;
    },
    [billingCycle]
  );

  return {
    plans,
    billingCycle,
    setBillingCycle,
    getPrice,
    getSavings,
    formatPrice,
  };
}

/**
 * Hook for checking feature access
 */
export function useFeatureAccess() {
  const { currentPlanConfig } = useSubscription();

  const hasFeature = useCallback(
    (feature: keyof PlanLimits) => {
      const value = currentPlanConfig?.limits?.[feature];
      if (typeof value === 'boolean') return value;
      if (value === 'Unlimited') return true;
      return (value as number) > 0;
    },
    [currentPlanConfig]
  );

  const getLimit = useCallback(
    (feature: keyof PlanLimits) => {
      return currentPlanConfig?.limits?.[feature];
    },
    [currentPlanConfig]
  );

  const isWithinLimit = useCallback(
    (feature: keyof PlanLimits, currentUsage: number) => {
      const limit = currentPlanConfig?.limits?.[feature];
      if (limit === 'Unlimited') return true;
      if (typeof limit !== 'number') return false;
      return currentUsage < limit;
    },
    [currentPlanConfig]
  );

  return {
    hasFeature,
    getLimit,
    isWithinLimit,
    limits: currentPlanConfig?.limits || {},
  };
}

export default useSubscription;
