import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import subscriptionService from '@/services/subscriptionService';
import { useToast } from '@/components/ui/use-toast';

// Subscription plans definition
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium',
};

// Feature limits by plan and user type
export const FEATURE_LIMITS = {
  maid: {
    [SUBSCRIPTION_PLANS.FREE]: {
      profileViews: 100,
      jobApplications: 5,
      messageThreads: 3,
      featuredDays: 0,
      customization: false,
      supportResponseTime: '48 hours',
      verifiedBadge: false,
      directMessaging: false,
    },
    [SUBSCRIPTION_PLANS.PRO]: {
      profileViews: 500,
      jobApplications: 25,
      messageThreads: 15,
      featuredDays: 3,
      customization: true,
      supportResponseTime: '24 hours',
      verifiedBadge: false,
      directMessaging: true,
    },
    [SUBSCRIPTION_PLANS.PREMIUM]: {
      profileViews: 'Unlimited',
      jobApplications: 'Unlimited',
      messageThreads: 'Unlimited',
      featuredDays: 30,
      customization: true,
      supportResponseTime: '6 hours',
      verifiedBadge: true,
      directMessaging: true,
    },
  },
  sponsor: {
    [SUBSCRIPTION_PLANS.FREE]: {
      activeJobPostings: 1,
      candidateSearches: 50,
      savedCandidates: 10,
      messageThreads: 3,
      advancedFilters: false,
      supportResponseTime: '48 hours',
      aiMatching: false,
      directMessaging: false,
    },
    [SUBSCRIPTION_PLANS.PRO]: {
      activeJobPostings: 5,
      candidateSearches: 250,
      savedCandidates: 50,
      messageThreads: 25,
      advancedFilters: true,
      supportResponseTime: '24 hours',
      aiMatching: false,
      directMessaging: true,
    },
    [SUBSCRIPTION_PLANS.PREMIUM]: {
      activeJobPostings: 'Unlimited',
      candidateSearches: 'Unlimited',
      savedCandidates: 'Unlimited',
      messageThreads: 'Unlimited',
      advancedFilters: true,
      supportResponseTime: '6 hours',
      aiMatching: true,
      directMessaging: true,
    },
  },
  agency: {
    [SUBSCRIPTION_PLANS.FREE]: {
      maidListings: 3,
      messageThreads: 5,
      sponsorConnections: 10,
      analytics: false,
      bulkUpload: false,
      supportResponseTime: '48 hours',
      verifiedBadge: false,
      directMessaging: false,
    },
    [SUBSCRIPTION_PLANS.PRO]: {
      maidListings: 25,
      messageThreads: 50,
      sponsorConnections: 100,
      analytics: true,
      bulkUpload: false,
      supportResponseTime: '24 hours',
      verifiedBadge: false,
      directMessaging: true,
    },
    [SUBSCRIPTION_PLANS.PREMIUM]: {
      maidListings: 'Unlimited',
      messageThreads: 'Unlimited',
      sponsorConnections: 'Unlimited',
      analytics: true,
      bulkUpload: true,
      supportResponseTime: '6 hours',
      verifiedBadge: true,
      directMessaging: true,
    },
  },
};

// Usage tracking initialization by user type
const getInitialUsage = (userType) => {
  switch (userType) {
    case 'maid':
      return {
        profileViews: 0,
        jobApplications: 0,
        messageThreads: 0,
      };
    case 'sponsor':
      return {
        activeJobPostings: 0,
        candidateSearches: 0,
        savedCandidates: 0,
        messageThreads: 0,
      };
    case 'agency':
      return {
        maidListings: 0,
        messageThreads: 0,
        sponsorConnections: 0,
      };
    default:
      return {};
  }
};

// Create the context with a default value
const SubscriptionContext = createContext(undefined);

export const SubscriptionProvider = ({ children, mockValue }) => {
  // Call hooks BEFORE any conditional returns (Rules of Hooks)
  const { user } = useAuth();
  const { toast } = useToast();

  // Early return for mock value AFTER hooks are called
  if (mockValue) {
    return (
      <SubscriptionContext.Provider value={mockValue}>
        {children}
      </SubscriptionContext.Provider>
    );
  }

  const userType = user?.userType || 'sponsor';

  const [subscriptionPlan, setSubscriptionPlan] = useLocalStorage(
    'subscriptionPlan',
    SUBSCRIPTION_PLANS.FREE
  );
  const [subscriptionDetails, setSubscriptionDetails] = useLocalStorage(
    'subscriptionDetails',
    {
      startDate: null,
      endDate: null,
      autoRenew: false,
      paymentMethod: null,
      invoices: [],
      subscriptionId: null,
    }
  );

  const [usageStats, setUsageStats] = useLocalStorage(
    'usageStats',
    getInitialUsage(userType)
  );

  const [loading, setLoading] = useState(false);
  const [dbSubscription, setDbSubscription] = useState(null);
  const [pointsBoost, setPointsBoost] = useState(null);

  // Fetch subscription from database - using useCallback to stabilize reference
  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    // Gate: Don't fetch if the user hasn't completed registration yet
    // This prevents Hasura JWT claims errors during onboarding
    if (!user?.registrationComplete && !user?.userType) {
      return;
    }

    try {
      setLoading(true);
      const [subscription, boost] = await Promise.all([
        subscriptionService.getActiveSubscription(user.id),
        userType === 'maid' ? subscriptionService.getPointsBoost(user.id) : null,
      ]);

      // Process points boost
      if (boost) {
        const now = new Date();
        const endDate = new Date(boost.end_date);
        const isActive = boost.status === 'active' && endDate > now;
        const daysRemaining = isActive
          ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          : 0;
        const meta = typeof boost.metadata === 'string' ? JSON.parse(boost.metadata) : boost.metadata;
        setPointsBoost({
          status: isActive ? 'active' : 'expired',
          points: meta?.points_used || 0,
          days: meta?.days_granted || 0,
          daysRemaining,
          expiresAt: boost.end_date,
          subscription: boost,
        });
      } else {
        setPointsBoost(null);
      }

      if (subscription) {
        setDbSubscription(subscription);

        // Update local state from database
        const planType = subscriptionService.getPlanType(subscription);
        setSubscriptionPlan(planType);

        setSubscriptionDetails({
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          autoRenew: subscription.status === 'active',
          paymentMethod: subscription.metadata?.paymentMethod || null,
          invoices: subscription.metadata?.invoices || [],
          subscriptionId: subscription.id,
          status: subscription.status,
          features: subscription.features,
        });
      } else if (boost && boost.status === 'active' && new Date(boost.end_date) > new Date()) {
        // No paid subscription but active points boost → treat as premium
        setDbSubscription(boost);
        setSubscriptionPlan(SUBSCRIPTION_PLANS.PREMIUM);
        setSubscriptionDetails({
          startDate: boost.start_date,
          endDate: boost.end_date,
          autoRenew: false,
          paymentMethod: null,
          invoices: [],
          subscriptionId: boost.id,
          status: 'active',
          features: {},
        });
      } else {
        // User is on free plan
        setDbSubscription(null);
        setSubscriptionPlan(SUBSCRIPTION_PLANS.FREE);
      }
    } catch (error) {
      console.error('[SubscriptionContext] Error fetching subscription:', error);
      // Fall back to localStorage values
    } finally {
      setLoading(false);
    }
  }, [user?.id, setSubscriptionPlan, setSubscriptionDetails]);

  // Fetch subscription on mount or when user changes
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Expose refresh function to allow manual subscription refresh
  const refreshSubscription = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    // If user type changes, update usage stats structure
    if (user?.userType && usageStats && Object.keys(usageStats).length === 0) {
      setUsageStats(getInitialUsage(user.userType));
    }
  }, [user, usageStats, setUsageStats]);

  // Function to check if a feature is available for the current subscription
  const hasFeatureAccess = (featureName) => {
    if (!user || !userType) return false;

    const planLimits = FEATURE_LIMITS[userType][subscriptionPlan];
    if (!planLimits) return false;

    return (
      planLimits[featureName] === true ||
      (typeof planLimits[featureName] === 'number' &&
        planLimits[featureName] > 0) ||
      planLimits[featureName] === 'Unlimited'
    );
  };

  // Function to check if user has reached usage limit
  const hasReachedLimit = (limitType) => {
    if (!user || !userType) return true;

    const planLimits = FEATURE_LIMITS[userType][subscriptionPlan];
    if (!planLimits) return true;

    const limit = planLimits[limitType];
    const usage = usageStats[limitType] || 0;

    if (limit === 'Unlimited') return false;
    if (typeof limit === 'number') return usage >= limit;

    return true;
  };

  // Function to increment usage counter
  const incrementUsage = (usageType, amount = 1) => {
    if (!user || !usageStats || !(usageType in usageStats)) return;

    setUsageStats((prev) => ({
      ...prev,
      [usageType]: (prev[usageType] || 0) + amount,
    }));
  };

  // Function to reset usage counters (e.g., on billing cycle renewal)
  const resetUsage = () => {
    setUsageStats(getInitialUsage(userType));
  };

  // Function to update subscription
  const updateSubscription = async (newPlan, details = {}) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return false;
    }

    // Safety check: If upgrading to a paid plan, ensure payment method exists
    const isUpgradingToPaidPlan =
      (newPlan === SUBSCRIPTION_PLANS.PRO ||
        newPlan === SUBSCRIPTION_PLANS.PREMIUM) &&
      subscriptionPlan === SUBSCRIPTION_PLANS.FREE;

    const hasPaymentMethod =
      details.paymentMethod || subscriptionDetails.paymentMethod;

    // Prevent direct upgrades to paid plans without payment method
    if (isUpgradingToPaidPlan && !hasPaymentMethod) {
      console.error('Cannot upgrade to paid plan without payment method');
      toast({
        title: 'Payment Method Required',
        description: 'Please add a payment method before upgrading to a paid plan',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);

      // Determine plan details
      const planDetails = {
        userId: user.id,
        planId: `${newPlan}_${Date.now()}`,
        planName: newPlan.charAt(0).toUpperCase() + newPlan.slice(1),
        planType: newPlan,
        amount: newPlan === SUBSCRIPTION_PLANS.PRO ? 99.99 : newPlan === SUBSCRIPTION_PLANS.PREMIUM ? 199.99 : 0,
        currency: 'ETB',
        billingPeriod: details.billingPeriod || 'monthly',
        startDate: details.startDate || new Date().toISOString(),
        endDate: details.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: FEATURE_LIMITS[userType]?.[newPlan] || {},
        metadata: {
          paymentMethod: details.paymentMethod || subscriptionDetails.paymentMethod,
          invoices: subscriptionDetails.invoices || [],
        },
      };

      // Save to database
      const subscription = await subscriptionService.changePlan(
        user.id,
        newPlan,
        planDetails
      );

      setDbSubscription(subscription);

      // Update local state
      setSubscriptionPlan(newPlan);
      setSubscriptionDetails((prev) => ({
        ...prev,
        ...details,
        subscriptionId: subscription.id,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        status: subscription.status,
        features: subscription.features,
      }));

      toast({
        title: 'Subscription Updated',
        description: `Successfully ${isUpgradingToPaidPlan ? 'upgraded' : 'changed'} to ${newPlan} plan`,
      });

      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to update subscription. Please try again.';

      if (error.message?.includes('Edge Function')) {
        errorMessage = 'Unable to process subscription change. Our payment service is temporarily unavailable. Please try again later or contact support.';
      } else if (error.message?.includes('Stripe')) {
        errorMessage = 'Payment processing error. Please check your payment method and try again.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Subscription not found. Please refresh the page and try again.';
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = 'Authentication error. Please log out and log back in.';
      }

      toast({
        title: 'Subscription Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to add an invoice to history
  const addInvoice = (invoice) => {
    setSubscriptionDetails((prev) => ({
      ...prev,
      invoices: [
        ...(prev.invoices || []),
        {
          ...invoice,
          date: invoice.date || new Date().toISOString(),
        },
      ],
    }));
  };

  // Activate points boost
  const activatePointsBoost = async (totalPoints, pointsBreakdown = {}) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      const result = await subscriptionService.activatePointsBoost(
        user.id,
        totalPoints,
        pointsBreakdown,
        userType
      );

      toast({
        title: 'Points Boost Activated!',
        description: `You earned ${totalPoints} points (${(totalPoints / 100).toFixed(1)} days of premium features)`,
      });

      // Refresh subscription to pick up the new boost
      await fetchSubscription();
      return true;
    } catch (error) {
      console.error('Error activating points boost:', error);
      toast({
        title: 'Activation Failed',
        description: error.message || 'Failed to activate points boost. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Purchase paid points boost (redirects to Stripe Checkout)
  const purchasePointsBoost = async (planKey) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      const result = await subscriptionService.purchasePointsBoost(planKey);

      if (!result.success) {
        throw result.error || new Error('Failed to create checkout session');
      }

      // User will be redirected to Stripe Checkout — no further action here
      return true;
    } catch (error) {
      console.error('Error purchasing points boost:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Activate paid boost after successful Stripe payment
  const activatePaidBoost = async (planKey) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      await subscriptionService.activatePaidBoost(planKey);

      const plans = subscriptionService.getPaidBoostPlans();
      const plan = plans[planKey];

      toast({
        title: 'Premium Boost Activated!',
        description: `${plan?.days || ''} days of premium features have been activated.`,
      });

      await fetchSubscription();
      return true;
    } catch (error) {
      console.error('Error activating paid boost:', error);
      toast({
        title: 'Activation Failed',
        description: error.message || 'Failed to activate boost. Please contact support.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get current plan limits
  const getCurrentLimits = () => {
    if (!userType) return {};
    return FEATURE_LIMITS[userType][subscriptionPlan] || {};
  };

  const value = {
    subscriptionPlan,
    subscriptionDetails,
    usageStats,
    updateSubscription,
    refreshSubscription,
    hasFeatureAccess,
    hasReachedLimit,
    incrementUsage,
    resetUsage,
    addInvoice,
    getCurrentLimits,
    SUBSCRIPTION_PLANS,
    FEATURE_LIMITS,
    loading,
    dbSubscription,
    pointsBoost,
    activatePointsBoost,
    purchasePointsBoost,
    activatePaidBoost,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);

  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
};
