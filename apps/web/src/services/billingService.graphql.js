import { gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { createLogger } from '@/utils/logger';

const log = createLogger('BillingService.GraphQL');

// Get current user's subscription
// Note: user_id is String for Firebase Auth compatibility
const GetUserSubscriptionDocument = gql`
  query GetUserSubscription($userId: String!) {
    subscriptions(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      plan_name
      plan_type
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

// Get subscription usage for current period
const GetSubscriptionUsageDocument = gql`
  query GetSubscriptionUsage($subscriptionId: uuid!) {
    subscription_usage(
      where: { subscription_id: { _eq: $subscriptionId } }
      order_by: { period_start: desc }
      limit: 1
    ) {
      id
      subscription_id
      period_start
      period_end
      maid_listings_active
      job_postings_active
      job_applications_submitted
      candidate_searches_performed
      candidates_saved
      messages_sent
      message_threads_used
      profile_views
      sponsor_connections
      bulk_uploads_performed
      created_at
      updated_at
    }
  }
`;

// Get user's payment history
// Note: Using subscription_id to link payments since user_id may be uuid in payments table
// For Firebase Auth users, we query by subscription's stripe_subscription_id instead
const GetPaymentsBySubscriptionDocument = gql`
  query GetPaymentsBySubscription($subscriptionId: uuid!, $limit: Int = 10) {
    payments(
      where: { subscription_id: { _eq: $subscriptionId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      amount
      currency
      status
      payment_type
      payment_method
      description
      reference_number
      transaction_id
      receipt_url
      stripe_payment_intent_id
      stripe_charge_id
      error_code
      failure_reason
      processed_at
      completed_at
      created_at
      metadata
    }
  }
`;

// Get payment failures by subscription ID (Firebase compatible)
const GetPaymentFailuresBySubscriptionDocument = gql`
  query GetPaymentFailuresBySubscription($subscriptionId: uuid!, $limit: Int = 5) {
    agency_payment_failures(
      where: { subscription_id: { _eq: $subscriptionId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      agency_id
      subscription_id
      amount
      currency
      error_code
      error_message
      stripe_payment_intent_id
      retry_count
      next_retry_at
      resolved
      resolved_at
      created_at
    }
  }
`;

// Get subscription status logs
const GetSubscriptionLogsDocument = gql`
  query GetSubscriptionLogs($subscriptionId: uuid!, $limit: Int = 10) {
    subscription_status_log(
      where: { subscription_id: { _eq: $subscriptionId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      subscription_id
      old_status
      new_status
      changed_by
      reason
      metadata
      created_at
    }
  }
`;

// Aggregate usage data
const GetUsageAggregateDocument = gql`
  query GetUsageAggregate($subscriptionId: uuid!) {
    subscription_usage_aggregate(
      where: { subscription_id: { _eq: $subscriptionId } }
    ) {
      aggregate {
        sum {
          maid_listings_active
          job_postings_active
          messages_sent
          profile_views
        }
      }
    }
  }
`;

// Default plan features and limits
const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Get started with basic features',
    features: [
      'Up to 3 maid listings',
      'Up to 3 job postings',
      'Basic search',
      'Email support',
    ],
    limits: {
      maids: 3,
      jobs: 3,
      messages_per_month: 3,
      storage_gb: 1,
      users: 1,
      api_calls_per_month: 1000,
    },
  },
  pro: {
    name: 'Professional',
    price: 49,
    interval: 'month',
    description: 'For growing agencies',
    popular: true,
    features: [
      'Up to 50 maid listings',
      'Up to 20 job postings',
      'Advanced search & filters',
      'Priority support',
      'Analytics dashboard',
      'Bulk uploads',
    ],
    limits: {
      maids: 50,
      jobs: 20,
      messages_per_month: 500,
      storage_gb: 10,
      users: 5,
      api_calls_per_month: 10000,
    },
  },
  premium: {
    name: 'Premium',
    price: 149,
    interval: 'month',
    description: 'For large agencies',
    features: [
      'Unlimited maid listings',
      'Unlimited job postings',
      'Advanced analytics',
      'Dedicated support',
      'Custom branding',
      'API access',
      'Team collaboration',
      'Priority placement',
    ],
    limits: {
      maids: -1, // Unlimited
      jobs: -1,
      messages_per_month: -1,
      storage_gb: 100,
      users: -1,
      api_calls_per_month: -1,
    },
  },
};

class BillingService {
  async getSubscription(userId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetUserSubscriptionDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      const subscription = data?.subscriptions?.[0];

      if (!subscription) {
        // Return default free plan
        return {
          data: {
            plan_name: 'Free',
            plan_type: 'free',
            status: 'active',
            amount: 0,
            currency: 'USD',
            features: PLAN_FEATURES.free.features,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          error: null,
        };
      }

      // Parse features if it's a JSON string
      let features = subscription.features;
      if (typeof features === 'string') {
        try {
          features = JSON.parse(features);
        } catch (e) {
          features = PLAN_FEATURES[subscription.plan_type]?.features || [];
        }
      }
      if (!Array.isArray(features)) {
        features = PLAN_FEATURES[subscription.plan_type]?.features || [];
      }

      return {
        data: {
          ...subscription,
          features,
          current_period_end: subscription.end_date || subscription.expires_at,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error fetching subscription:', error);
      return { data: null, error };
    }
  }

  async getUsage(subscriptionId, planType = 'free') {
    try {
      if (!subscriptionId) {
        // Return empty usage with free plan limits
        return {
          data: {
            current_period: {
              maids_added: 0,
              jobs_posted: 0,
              api_calls: 0,
              storage_used_gb: 0,
              active_users: 1,
            },
            limits: PLAN_FEATURES.free.limits,
          },
          error: null,
        };
      }

      const { data, errors } = await apolloClient.query({
        query: GetSubscriptionUsageDocument,
        variables: { subscriptionId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      const usage = data?.subscription_usage?.[0];
      const limits = PLAN_FEATURES[planType]?.limits || PLAN_FEATURES.free.limits;

      return {
        data: {
          current_period: {
            maids_added: usage?.maid_listings_active || 0,
            jobs_posted: usage?.job_postings_active || 0,
            api_calls: usage?.candidate_searches_performed || 0,
            storage_used_gb: 0, // Would need separate tracking
            active_users: 1,
            messages_sent: usage?.messages_sent || 0,
            profile_views: usage?.profile_views || 0,
            period_start: usage?.period_start,
            period_end: usage?.period_end,
          },
          limits,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error fetching usage:', error);
      return { data: null, error };
    }
  }

  async getPayments(subscriptionId, limit = 10) {
    try {
      // Skip if no subscription ID
      if (!subscriptionId) {
        log.debug('Skipping payments query - no subscription ID');
        return { data: [], error: null };
      }

      const { data, errors } = await apolloClient.query({
        query: GetPaymentsBySubscriptionDocument,
        variables: { subscriptionId, limit },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      // Transform payments to match expected format
      const payments = (data?.payments || []).map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        currency: payment.currency || 'USD',
        status: payment.status,
        description: payment.description || `${payment.payment_type} payment`,
        payment_method: payment.payment_method,
        receipt_url: payment.receipt_url,
        created_at: payment.created_at,
        processed_at: payment.processed_at,
        completed_at: payment.completed_at,
      }));

      return { data: payments, error: null };
    } catch (error) {
      log.error('Error fetching payments:', error);
      return { data: [], error };
    }
  }

  async getPaymentFailures(subscriptionId, limit = 5) {
    try {
      // Skip if no subscription ID
      if (!subscriptionId) {
        log.debug('Skipping payment failures query - no subscription ID');
        return { data: [], error: null };
      }

      const { data, errors } = await apolloClient.query({
        query: GetPaymentFailuresBySubscriptionDocument,
        variables: { subscriptionId, limit },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      return { data: data?.agency_payment_failures || [], error: null };
    } catch (error) {
      log.error('Error fetching payment failures:', error);
      return { data: [], error };
    }
  }

  async getInvoices(subscriptionId) {
    // Generate invoices from payment history
    // In a real system, this would query an invoices table
    try {
      const { data: payments } = await this.getPayments(subscriptionId, 20);

      const invoices = payments
        .filter(p => p.status === 'succeeded' || p.status === 'completed')
        .map((payment, index) => ({
          id: payment.id,
          invoice_number: `INV-${new Date(payment.created_at).getFullYear()}-${String(index + 1).padStart(4, '0')}`,
          amount: payment.amount,
          currency: payment.currency,
          status: 'paid',
          description: payment.description,
          issued_date: payment.created_at,
          due_date: payment.created_at,
          paid_date: payment.completed_at || payment.processed_at || payment.created_at,
        }));

      return { data: invoices, error: null };
    } catch (error) {
      log.error('Error generating invoices:', error);
      return { data: [], error };
    }
  }

  async getSubscriptionLogs(subscriptionId, limit = 10) {
    try {
      if (!subscriptionId) {
        return { data: [], error: null };
      }

      const { data, errors } = await apolloClient.query({
        query: GetSubscriptionLogsDocument,
        variables: { subscriptionId, limit },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      return { data: data?.subscription_status_log || [], error: null };
    } catch (error) {
      log.error('Error fetching subscription logs:', error);
      return { data: [], error };
    }
  }

  getAvailablePlans() {
    return Object.entries(PLAN_FEATURES).map(([id, plan]) => ({
      id,
      ...plan,
    }));
  }

  async getBillingData(userId, agencyId) {
    try {
      // First get subscription using Firebase user ID (String)
      const subscriptionResult = await this.getSubscription(userId);
      const subscription = subscriptionResult.data;
      const planType = subscription?.plan_type || 'free';
      const subscriptionId = subscription?.id;

      // Fetch remaining billing data using subscription ID (uuid)
      const [paymentsResult, paymentFailuresResult, usageResult, invoicesResult] = await Promise.all([
        this.getPayments(subscriptionId),
        this.getPaymentFailures(subscriptionId),
        this.getUsage(subscriptionId, planType),
        this.getInvoices(subscriptionId),
      ]);

      return {
        data: {
          subscription,
          usage: usageResult.data,
          payments: paymentsResult.data,
          invoices: invoicesResult.data,
          payment_failures: paymentFailuresResult.data,
          available_plans: this.getAvailablePlans(),
        },
        error: null,
      };
    } catch (error) {
      log.error('Error fetching billing data:', error);
      return { data: null, error };
    }
  }
}

export const billingService = new BillingService();
export default billingService;
