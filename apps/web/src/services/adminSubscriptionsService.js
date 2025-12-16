/**
 * Admin Subscriptions Service
 * Provides GraphQL operations for admin subscription management
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('adminSubscriptionsService');

// GraphQL Queries

/**
 * Get all subscriptions with pagination and filters
 */
const GET_SUBSCRIPTIONS = gql`
  query GetAdminSubscriptions(
    $limit: Int!
    $offset: Int!
    $where: subscriptions_bool_exp
    $order_by: [subscriptions_order_by!]
  ) {
    subscriptions(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $order_by
    ) {
      id
      user_id
      user_type
      plan_id
      plan_name
      plan_type
      amount
      currency
      billing_period
      status
      start_date
      end_date
      trial_end_date
      expires_at
      cancelled_at
      created_at
      updated_at
      stripe_customer_id
      stripe_subscription_id
      payment_status
      last_payment_attempt
      payment_retry_count
      grace_period_ends
      features
      metadata
    }
    subscriptions_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Get subscription statistics/summary
 */
const GET_SUBSCRIPTION_STATS = gql`
  query GetSubscriptionStats {
    # Total subscriptions count by status
    total: subscriptions_aggregate {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    active: subscriptions_aggregate(where: { status: { _eq: "active" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    past_due: subscriptions_aggregate(where: { status: { _eq: "past_due" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    cancelled: subscriptions_aggregate(where: { status: { _eq: "cancelled" } }) {
      aggregate {
        count
      }
    }

    expired: subscriptions_aggregate(where: { status: { _eq: "expired" } }) {
      aggregate {
        count
      }
    }

    # By plan type
    free_plans: subscriptions_aggregate(where: { plan_type: { _eq: "free" } }) {
      aggregate {
        count
      }
    }

    pro_plans: subscriptions_aggregate(where: { plan_type: { _eq: "pro" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    premium_plans: subscriptions_aggregate(where: { plan_type: { _eq: "premium" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    # By user type
    maid_subs: subscriptions_aggregate(where: { user_type: { _eq: "maid" } }) {
      aggregate {
        count
      }
    }

    sponsor_subs: subscriptions_aggregate(where: { user_type: { _eq: "sponsor" } }) {
      aggregate {
        count
      }
    }

    agency_subs: subscriptions_aggregate(where: { user_type: { _eq: "agency" } }) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Get single subscription by ID with full details
 */
const GET_SUBSCRIPTION_BY_ID = gql`
  query GetSubscriptionById($id: uuid!) {
    subscriptions_by_pk(id: $id) {
      id
      user_id
      user_type
      plan_id
      plan_name
      plan_type
      amount
      currency
      billing_period
      status
      start_date
      end_date
      trial_end_date
      expires_at
      cancelled_at
      created_at
      updated_at
      stripe_customer_id
      stripe_subscription_id
      payment_status
      last_payment_attempt
      payment_retry_count
      grace_period_ends
      features
      metadata
      subscription_status_logs(order_by: { created_at: desc }, limit: 20) {
        id
        old_status
        new_status
        reason
        created_at
        created_by
        metadata
      }
      subscription_usages(order_by: { period_start: desc }, limit: 6) {
        id
        period_start
        period_end
        job_postings_active
        maid_listings_active
        candidate_searches_performed
        candidates_saved
        messages_sent
        message_threads_used
        profile_views
        sponsor_connections
        job_applications_submitted
        bulk_uploads_performed
        created_at
        updated_at
      }
      webhook_event_logs(order_by: { created_at: desc }, limit: 20) {
        id
        event_id
        event_type
        received_at
        processing_started_at
        processing_completed_at
        processing_duration_ms
        response_status
        error_code
        error_message
        retry_count
        created_at
      }
    }
  }
`;

/**
 * Update subscription status
 */
const UPDATE_SUBSCRIPTION_STATUS = gql`
  mutation UpdateSubscriptionStatus($id: uuid!, $status: String!, $cancelled_at: timestamptz) {
    update_subscriptions_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        cancelled_at: $cancelled_at
        updated_at: "now()"
      }
    ) {
      id
      status
      cancelled_at
      updated_at
    }
  }
`;

/**
 * Get user details for subscription enrichment
 * Note: Profile tables use String 'id' (Firebase UID), while auth_users uses UUID 'id'
 * Subscriptions may have either format in user_id field
 */
const GET_USER_DETAILS_PROFILES = gql`
  query GetUserDetailsFromProfiles($userIds: [String!]!) {
    # Get maid profiles - id is the Firebase user_id (String)
    # Note: maid_profiles doesn't have a direct 'phone' field, phone is in profiles table
    maid_profiles(where: { id: { _in: $userIds } }) {
      id
      full_name
    }

    # Get sponsor profiles - id is the Firebase user_id (String)
    sponsor_profiles(where: { id: { _in: $userIds } }) {
      id
      full_name
      phone_number
    }

    # Get agency profiles - id is the Firebase user_id (String)
    agency_profiles(where: { id: { _in: $userIds } }) {
      id
      full_name
      phone
      email
    }

    # Also get from main profiles table for emails (all user types have email here)
    profiles(where: { id: { _in: $userIds } }) {
      id
      email
      full_name
      phone
    }
  }
`;

/**
 * Get auth_users details - separate query because id is UUID type
 */
const GET_USER_DETAILS_AUTH = gql`
  query GetUserDetailsFromAuth($userIds: [uuid!]!) {
    auth_users(where: { id: { _in: $userIds } }) {
      id
      email
      role
    }
  }
`;

/**
 * Get profiles by email - to link auth_users to profiles via email
 */
const GET_PROFILES_BY_EMAIL = gql`
  query GetProfilesByEmail($emails: [String!]!) {
    profiles(where: { email: { _in: $emails } }) {
      id
      email
      full_name
      phone
      maid_profile {
        id
        full_name
      }
      sponsor_profile {
        id
        full_name
      }
      agency_profile {
        id
        full_name
      }
    }
  }
`;

/**
 * Get profiles by ID - for direct profile lookup
 */
const GET_PROFILES_BY_ID = gql`
  query GetProfilesById($userIds: [String!]!) {
    profiles(where: { id: { _in: $userIds } }) {
      id
      email
      full_name
      phone
      maid_profile {
        id
        full_name
      }
      sponsor_profile {
        id
        full_name
      }
      agency_profile {
        id
        full_name
      }
    }
  }
`;

/**
 * Get stripe_customers mapping - links stripe_customer_id to Firebase user_id
 */
const GET_STRIPE_CUSTOMERS = gql`
  query GetStripeCustomers($stripeCustomerIds: [String!]!) {
    stripe_customers(where: { stripe_customer_id: { _in: $stripeCustomerIds } }) {
      stripe_customer_id
      user_id
    }
  }
`;

/**
 * Get monthly subscription revenue trend
 */
const GET_MONTHLY_TREND = gql`
  query GetSubscriptionMonthlyTrend {
    subscriptions(
      where: { status: { _in: ["active", "past_due"] } }
      order_by: { created_at: desc }
    ) {
      id
      amount
      currency
      created_at
      status
      plan_type
      user_type
    }
  }
`;

// Service functions

export const adminSubscriptionsService = {
  /**
   * Get subscriptions with pagination, filtering, and sorting
   */
  async getSubscriptions({
    page = 1,
    limit = 10,
    status = 'all',
    planType = 'all',
    userType = 'all',
    searchTerm = '',
    sortBy = 'created_at',
    sortDirection = 'desc'
  }) {
    try {
      const offset = (page - 1) * limit;

      // Build where clause
      const whereConditions = [];

      if (status && status !== 'all') {
        whereConditions.push({ status: { _eq: status } });
      }

      if (planType && planType !== 'all') {
        whereConditions.push({ plan_type: { _eq: planType } });
      }

      if (userType && userType !== 'all') {
        whereConditions.push({ user_type: { _eq: userType } });
      }

      if (searchTerm) {
        whereConditions.push({
          _or: [
            { user_id: { _ilike: `%${searchTerm}%` } },
            { plan_name: { _ilike: `%${searchTerm}%` } },
            { stripe_subscription_id: { _ilike: `%${searchTerm}%` } }
          ]
        });
      }

      const where = whereConditions.length > 0
        ? { _and: whereConditions }
        : {};

      // Build order by
      const order_by = [{ [sortBy]: sortDirection }];

      const { data, errors } = await apolloClient.query({
        query: GET_SUBSCRIPTIONS,
        variables: { limit, offset, where, order_by },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching subscriptions:', errors);
        return { data: null, error: errors[0] };
      }

      const subscriptions = data?.subscriptions || [];
      const totalCount = data?.subscriptions_aggregate?.aggregate?.count || 0;

      // Filter out any subscriptions that are missing critical data (id)
      const validSubscriptions = subscriptions.filter(sub => sub && sub.id);

      // Enrich subscriptions with user details
      const enrichedSubscriptions = await this.enrichSubscriptionsWithUserDetails(validSubscriptions);

      return {
        data: {
          subscriptions: enrichedSubscriptions,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching subscriptions:', error);
      return { data: null, error };
    }
  },

  /**
   * Enrich subscriptions with user details from related tables
   * Handles both Firebase UIDs (String) and auth_users UUIDs
   * Optimized to run queries in parallel
   */
  async enrichSubscriptionsWithUserDetails(subscriptions) {
    if (!subscriptions || subscriptions.length === 0) return [];

    try {
      // Get unique user IDs
      const userIds = [...new Set(subscriptions.map(s => s.user_id).filter(Boolean))];

      if (userIds.length === 0) return subscriptions;

      // Separate UUID-format IDs from Firebase UID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const uuidIds = userIds.filter(id => uuidRegex.test(id));
      const stringIds = userIds; // Try all IDs against profile tables (they accept strings)

      // Build user lookup maps
      const maidMap = new Map();
      const sponsorMap = new Map();
      const agencyMap = new Map();
      const profilesEmailMap = new Map(); // For email lookup from profiles table
      const authUserMap = new Map();

      // Get stripe_customer_ids for lookup
      const stripeCustomerIds = [...new Set(subscriptions.map(s => s.stripe_customer_id).filter(Boolean))];

      // Run queries in parallel for better performance
      const queryPromises = [];

      // Query 1: Profile tables (maid, sponsor, agency) + main profiles for email
      queryPromises.push(
        apolloClient.query({
          query: GET_USER_DETAILS_PROFILES,
          variables: { userIds: stringIds },
          fetchPolicy: 'network-only' // Always fetch fresh data
        }).catch(err => {
          log.error('Error fetching profile data:', err);
          return { data: null };
        })
      );

      // Query 2: Auth users (for UUID-type user_ids)
      if (uuidIds.length > 0) {
        queryPromises.push(
          apolloClient.query({
            query: GET_USER_DETAILS_AUTH,
            variables: { userIds: uuidIds },
            fetchPolicy: 'network-only'
          }).catch(err => {
            log.error('Error fetching auth_users data:', err);
            return { data: null };
          })
        );
      }

      // Wait for all queries in parallel
      const results = await Promise.all(queryPromises);

      // Process profile data (result 0)
      const profileData = results[0]?.data;
      if (profileData) {
        // Build maps from specific profile tables (maid, sponsor, agency)
        // Note: maid_profiles doesn't have phone field - phone comes from profiles table
        (profileData.maid_profiles || []).forEach(m => {
          if (m.id && m.full_name) {
            maidMap.set(m.id, { name: m.full_name });
          }
        });

        (profileData.sponsor_profiles || []).forEach(s => {
          if (s.id && s.full_name) {
            sponsorMap.set(s.id, { name: s.full_name, phone: s.phone_number });
          }
        });

        (profileData.agency_profiles || []).forEach(a => {
          if (a.id && a.full_name) {
            agencyMap.set(a.id, { name: a.full_name, email: a.email, phone: a.phone });
          }
        });

        // Build profilesEmailMap from main profiles table (for email lookup)
        (profileData.profiles || []).forEach(p => {
          if (p.id) {
            profilesEmailMap.set(p.id, {
              name: p.full_name,
              email: p.email,
              phone: p.phone
            });
          }
        });
      }

      // Process auth users data (result 1 if uuidIds exist)
      if (uuidIds.length > 0 && results[1]?.data?.auth_users) {
        (results[1].data.auth_users || []).forEach(u => {
          authUserMap.set(u.id, { email: u.email, role: u.role });
        });
      }

      // Enrich subscriptions
      return subscriptions.map(sub => {
        let userDetails = null;
        const normalizedUserType = sub.user_type?.toLowerCase?.()?.trim?.();
        const userId = sub.user_id;

        // Get email info from profiles table (available for all user types)
        const profileEmailInfo = profilesEmailMap.get(userId);

        // FIRST: Try specific profile tables based on user_type (they have the names)
        if (normalizedUserType === 'maid' && maidMap.has(userId)) {
          const maidInfo = maidMap.get(userId);
          userDetails = {
            name: maidInfo.name,
            email: profileEmailInfo?.email, // Get email from profiles table
            phone: profileEmailInfo?.phone  // maid_profiles doesn't have phone, get from profiles
          };
        } else if (normalizedUserType === 'sponsor' && sponsorMap.has(userId)) {
          const sponsorInfo = sponsorMap.get(userId);
          userDetails = {
            name: sponsorInfo.name,
            email: profileEmailInfo?.email, // Get email from profiles table
            phone: sponsorInfo.phone || profileEmailInfo?.phone
          };
        } else if (normalizedUserType === 'agency' && agencyMap.has(userId)) {
          const agencyInfo = agencyMap.get(userId);
          userDetails = {
            name: agencyInfo.name,
            email: agencyInfo.email || profileEmailInfo?.email,
            phone: agencyInfo.phone || profileEmailInfo?.phone
          };
        }

        // If no match by user_type, try all specific profile maps
        if (!userDetails) {
          if (maidMap.has(userId)) {
            const info = maidMap.get(userId);
            userDetails = { name: info.name, email: profileEmailInfo?.email, phone: profileEmailInfo?.phone };
          } else if (sponsorMap.has(userId)) {
            const info = sponsorMap.get(userId);
            userDetails = { name: info.name, email: profileEmailInfo?.email, phone: info.phone || profileEmailInfo?.phone };
          } else if (agencyMap.has(userId)) {
            const info = agencyMap.get(userId);
            userDetails = { name: info.name, email: info.email || profileEmailInfo?.email, phone: info.phone || profileEmailInfo?.phone };
          }
        }

        // If still no match, try the main profiles table (it might have name too)
        if (!userDetails && profileEmailInfo && profileEmailInfo.name) {
          userDetails = {
            name: profileEmailInfo.name,
            email: profileEmailInfo.email,
            phone: profileEmailInfo.phone
          };
        }

        // Fallback to auth_users (for UUID-type user_ids)
        if (!userDetails && authUserMap.has(userId)) {
          const authUser = authUserMap.get(userId);
          let displayName = null;
          if (authUser.email) {
            const emailName = authUser.email.split('@')[0];
            displayName = emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : null;
          }
          userDetails = {
            name: displayName,
            email: authUser.email,
            phone: null
          };
        }

        // Determine user type from subscription data or metadata
        const userType = sub.user_type
          || (typeof sub.metadata === 'object' ? sub.metadata?.user_type : null)
          || 'unknown';

        // Format user type for display (capitalize first letter)
        const formattedUserType = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();

        return {
          ...sub,
          user: userDetails && userDetails.name ? {
            name: userDetails.name,
            email: userDetails.email || null,
            phone: userDetails.phone || null,
            isPlaceholder: false
          } : {
            name: `${formattedUserType} User`,
            email: profileEmailInfo?.email || null,
            type: userType,
            isPlaceholder: true
          }
        };
      });
    } catch (error) {
      log.error('Error enriching subscriptions with user details:', error);
      // Return subscriptions with placeholder user data
      return subscriptions.map(sub => {
        const userType = sub.user_type
          || (typeof sub.metadata === 'object' ? sub.metadata?.user_type : null)
          || 'unknown';
        const formattedUserType = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();

        return {
          ...sub,
          user: {
            name: `${formattedUserType} User`,
            email: null,
            type: userType,
            isPlaceholder: true
          }
        };
      });
    }
  },

  /**
   * Get subscription statistics
   */
  async getStats() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_SUBSCRIPTION_STATS,
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching stats:', errors);
        return { data: null, error: errors[0] };
      }

      const stats = {
        total: {
          count: data?.total?.aggregate?.count || 0,
          revenue: data?.total?.aggregate?.sum?.amount || 0
        },
        active: {
          count: data?.active?.aggregate?.count || 0,
          mrr: data?.active?.aggregate?.sum?.amount || 0
        },
        pastDue: {
          count: data?.past_due?.aggregate?.count || 0,
          atRisk: data?.past_due?.aggregate?.sum?.amount || 0
        },
        cancelled: {
          count: data?.cancelled?.aggregate?.count || 0
        },
        expired: {
          count: data?.expired?.aggregate?.count || 0
        },
        byPlanType: {
          free: data?.free_plans?.aggregate?.count || 0,
          pro: {
            count: data?.pro_plans?.aggregate?.count || 0,
            revenue: data?.pro_plans?.aggregate?.sum?.amount || 0
          },
          premium: {
            count: data?.premium_plans?.aggregate?.count || 0,
            revenue: data?.premium_plans?.aggregate?.sum?.amount || 0
          }
        },
        byUserType: {
          maid: data?.maid_subs?.aggregate?.count || 0,
          sponsor: data?.sponsor_subs?.aggregate?.count || 0,
          agency: data?.agency_subs?.aggregate?.count || 0
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      log.error('Error fetching subscription stats:', error);
      return { data: null, error };
    }
  },

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_SUBSCRIPTION_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching subscription:', errors);
        return { data: null, error: errors[0] };
      }

      const subscription = data?.subscriptions_by_pk;

      if (!subscription) {
        return { data: null, error: new Error('Subscription not found') };
      }

      // Enrich with user details
      const enriched = await this.enrichSubscriptionsWithUserDetails([subscription]);

      return { data: enriched[0], error: null };
    } catch (error) {
      log.error('Error fetching subscription by ID:', error);
      return { data: null, error };
    }
  },

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(id, newStatus) {
    try {
      const cancelledAt = newStatus === 'cancelled' ? new Date().toISOString() : null;

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_SUBSCRIPTION_STATUS,
        variables: { id, status: newStatus, cancelled_at: cancelledAt }
      });

      if (errors) {
        log.error('GraphQL errors updating subscription:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_subscriptions_by_pk, error: null };
    } catch (error) {
      log.error('Error updating subscription status:', error);
      return { data: null, error };
    }
  },

  /**
   * Get monthly subscription trend data
   */
  async getMonthlyTrend() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_MONTHLY_TREND,
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching monthly trend:', errors);
        return { data: null, error: errors[0] };
      }

      const subscriptions = data?.subscriptions || [];

      // Group by month
      const monthlyData = {};
      const now = new Date();

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = {
          month: monthKey,
          month_name: monthName,
          new_subscriptions: 0,
          mrr: 0,
          churned: 0
        };
      }

      // Aggregate subscription data
      subscriptions.forEach(sub => {
        const createdDate = new Date(sub.created_at);
        const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].new_subscriptions += 1;
          if (sub.status === 'active') {
            monthlyData[monthKey].mrr += parseFloat(sub.amount) || 0;
          }
        }
      });

      // Convert to array sorted by month
      const trendData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

      return { data: trendData, error: null };
    } catch (error) {
      log.error('Error fetching monthly trend:', error);
      return { data: null, error };
    }
  }
};

export default adminSubscriptionsService;
