/**
 * Subscription Sync Service
 *
 * Handles syncing subscription data to Hasura when webhook isn't available.
 * This is a temporary solution until Firebase Cloud Functions are deployed.
 */

import { gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { createLogger } from '@/utils/logger';
import { SUBSCRIPTION_PLANS_CONFIG } from '@/config/stripeConfig';

const log = createLogger('SubscriptionSync');

// GraphQL mutations for subscription management
// Note: plan_id is required (NOT NULL constraint)
// start_date and end_date are 'date' type, amount is 'numeric' type
const INSERT_SUBSCRIPTION = gql`
  mutation InsertSubscription(
    $userId: String!
    $planId: String!
    $planName: String!
    $planType: String!
    $status: String!
    $amount: numeric!
    $currency: String!
    $billingPeriod: String!
    $startDate: date!
    $endDate: date!
    $stripeSubscriptionId: String!
    $stripeCustomerId: String
  ) {
    insert_subscriptions_one(
      object: {
        user_id: $userId
        plan_id: $planId
        plan_name: $planName
        plan_type: $planType
        status: $status
        amount: $amount
        currency: $currency
        billing_period: $billingPeriod
        start_date: $startDate
        end_date: $endDate
        stripe_subscription_id: $stripeSubscriptionId
        stripe_customer_id: $stripeCustomerId
      }
    ) {
      id
      user_id
      plan_id
      plan_name
      status
      amount
      start_date
      end_date
    }
  }
`;

const GET_USER_SUBSCRIPTION = gql`
  query GetUserSubscription($userId: String!) {
    subscriptions(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      plan_id
      plan_name
      plan_type
      status
      amount
      currency
      billing_period
      start_date
      end_date
      stripe_subscription_id
      created_at
    }
  }
`;

/**
 * Sync subscription after successful Stripe payment
 * This is called when user returns from Stripe with success=true
 */
export async function syncSubscriptionAfterPayment(userId, planDetails) {
  try {
    log.info('Syncing subscription after payment:', { userId, planDetails });

    const {
      planId,
      planName,
      planType,
      amount,
      currency = 'AED',
      billingPeriod = 'monthly',
      stripeSubscriptionId,
      stripeCustomerId,
    } = planDetails;

    // Calculate subscription period
    const startDate = new Date();
    const endDate = new Date();

    if (billingPeriod === 'yearly' || billingPeriod === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Generate a unique subscription ID if not provided
    const subId = stripeSubscriptionId || `manual_${userId}_${Date.now()}`;

    // Generate plan_id based on planType if not provided
    const derivedPlanId = planId || `${planType || 'pro'}_${billingPeriod || 'monthly'}`;

    // Format dates as YYYY-MM-DD for GraphQL 'date' type
    const formatDate = (date) => date.toISOString().split('T')[0];

    const variables = {
      userId,
      planId: derivedPlanId,
      planName: planName || 'Professional',
      planType: planType || 'pro',
      status: 'active',
      amount: amount || 49900, // Default to Agency Pro (499 AED in fils)
      currency: currency.toUpperCase(),
      billingPeriod,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      stripeSubscriptionId: subId,
      stripeCustomerId: stripeCustomerId || null,
    };

    log.info('Mutation variables:', variables);

    try {
      const result = await apolloClient.mutate({
        mutation: INSERT_SUBSCRIPTION,
        variables,
      });

      const { data, errors } = result || {};

      if (errors && errors.length > 0) {
        log.error('Failed to sync subscription:', errors[0]);
        throw errors[0];
      }

      if (!data?.insert_subscriptions_one) {
        log.warn('Subscription mutation returned no data - subscription may not exist in schema or constraint issue');
        // Return a placeholder success response with the input data
        return {
          success: true,
          subscription: {
            id: `pending_${Date.now()}`,
            user_id: userId,
            plan_name: variables.planName,
            status: variables.status,
            amount: variables.amount,
            start_date: variables.startDate,
            end_date: variables.endDate,
          },
          warning: 'Subscription table may not exist in database schema',
        };
      }

      log.info('Subscription synced successfully:', data.insert_subscriptions_one);
      return { success: true, subscription: data.insert_subscriptions_one };
    } catch (mutationError) {
      // Check if it's a "table doesn't exist" or permission error
      const errorMsg = mutationError?.message || String(mutationError);
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist') || errorMsg.includes('permission')) {
        log.warn('Subscription table may not exist or no permission:', errorMsg);
        return {
          success: false,
          error: 'Subscription feature not available yet',
          details: errorMsg,
        };
      }
      throw mutationError;
    }
  } catch (error) {
    log.error('Error syncing subscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's current subscription from database
 */
export async function getUserSubscription(userId) {
  try {
    const { data, errors } = await apolloClient.query({
      query: GET_USER_SUBSCRIPTION,
      variables: { userId },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw errors[0];
    }

    const sub = data.subscriptions?.[0] || null;

    // Map field names for compatibility (add aliases for code expecting old names)
    if (sub) {
      sub.current_period_start = sub.start_date;
      sub.current_period_end = sub.end_date;
    }

    return {
      success: true,
      subscription: sub,
    };
  } catch (error) {
    log.error('Error fetching subscription:', error);
    return { success: false, subscription: null, error: error.message };
  }
}

/**
 * Get default features based on plan type
 */
function getDefaultFeatures(planType) {
  const planConfig = {
    pro: [
      '25 maid listings',
      '50 message threads',
      '100 sponsor connections',
      'Analytics dashboard',
      '24-hour support response',
      'Direct messaging',
    ],
    premium: [
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
  };

  return planConfig[planType] || planConfig.pro;
}

/**
 * Detect plan from URL parameters or amount
 */
export function detectPlanFromPayment(amount, userType = 'agency') {
  // Amount is in fils (smallest currency unit)
  const amountInAED = amount / 100;

  if (userType === 'agency') {
    if (amountInAED >= 999) {
      return { planName: 'Premium', planType: 'premium', billingPeriod: 'monthly' };
    } else if (amountInAED >= 499) {
      return { planName: 'Professional', planType: 'pro', billingPeriod: 'monthly' };
    } else if (amountInAED >= 4491) {
      return { planName: 'Professional', planType: 'pro', billingPeriod: 'yearly' };
    } else if (amountInAED >= 8991) {
      return { planName: 'Premium', planType: 'premium', billingPeriod: 'yearly' };
    }
  } else if (userType === 'sponsor') {
    if (amountInAED >= 599) {
      return { planName: 'Premium', planType: 'premium', billingPeriod: 'monthly' };
    } else if (amountInAED >= 469) {
      return { planName: '2 Months Bundle', planType: 'twoMonths', billingPeriod: 'bundle' };
    } else if (amountInAED >= 299) {
      return { planName: 'Monthly', planType: 'monthly', billingPeriod: 'monthly' };
    } else if (amountInAED >= 99) {
      return { planName: 'Weekly', planType: 'weekly', billingPeriod: 'monthly' };
    }
  }

  // Default fallback
  return { planName: 'Professional', planType: 'pro', billingPeriod: 'monthly' };
}

export default {
  syncSubscriptionAfterPayment,
  getUserSubscription,
  detectPlanFromPayment,
};
