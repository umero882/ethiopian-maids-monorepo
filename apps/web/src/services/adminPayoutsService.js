/**
 * Admin Payouts Service
 * Provides GraphQL operations for admin payout management
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('adminPayoutsService');

// GraphQL Queries

/**
 * Get all payouts with pagination and filters
 */
const GET_PAYOUTS = gql`
  query GetAdminPayouts(
    $limit: Int!
    $offset: Int!
    $where: payouts_bool_exp
    $order_by: [payouts_order_by!]
  ) {
    payouts(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $order_by
    ) {
      id
      payout_number
      user_id
      user_type
      amount
      net_amount
      currency
      processing_fee
      platform_fee
      status
      payout_method
      payout_destination
      description
      notes
      requested_at
      processing_at
      completed_at
      failed_at
      failure_code
      failure_message
      provider_reference
      stripe_payout_id
      stripe_transfer_id
      retry_count
      metadata
      created_at
      updated_at
    }
    payouts_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Get payout statistics/summary
 */
const GET_PAYOUT_STATS = gql`
  query GetPayoutStats {
    # Total payouts
    total: payouts_aggregate {
      aggregate {
        count
        sum {
          amount
          processing_fee
        }
      }
    }

    # By status
    completed: payouts_aggregate(where: { status: { _eq: "completed" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    pending: payouts_aggregate(where: { status: { _eq: "pending" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    processing: payouts_aggregate(where: { status: { _eq: "processing" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    failed: payouts_aggregate(where: { status: { _eq: "failed" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    on_hold: payouts_aggregate(where: { status: { _eq: "on_hold" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    # By user type
    maid_payouts: payouts_aggregate(where: { user_type: { _eq: "maid" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    sponsor_payouts: payouts_aggregate(where: { user_type: { _eq: "sponsor" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }

    agency_payouts: payouts_aggregate(where: { user_type: { _eq: "agency" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
  }
`;

/**
 * Get single payout by ID
 */
const GET_PAYOUT_BY_ID = gql`
  query GetPayoutById($id: uuid!) {
    payouts_by_pk(id: $id) {
      id
      payout_number
      user_id
      user_type
      amount
      net_amount
      currency
      processing_fee
      platform_fee
      status
      payout_method
      payout_destination
      description
      notes
      requested_at
      processing_at
      completed_at
      failed_at
      failure_code
      failure_message
      provider_reference
      stripe_payout_id
      stripe_transfer_id
      retry_count
      metadata
      created_at
      updated_at
      created_by
      updated_by
    }
  }
`;

/**
 * Update payout status
 */
const UPDATE_PAYOUT_STATUS = gql`
  mutation UpdatePayoutStatus(
    $id: uuid!
    $status: String!
    $processing_at: timestamptz
    $completed_at: timestamptz
    $failed_at: timestamptz
    $failure_code: String
    $failure_message: String
    $notes: String
  ) {
    update_payouts_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        processing_at: $processing_at
        completed_at: $completed_at
        failed_at: $failed_at
        failure_code: $failure_code
        failure_message: $failure_message
        notes: $notes
      }
    ) {
      id
      status
      processing_at
      completed_at
      failed_at
      failure_code
      failure_message
      notes
      updated_at
    }
  }
`;

/**
 * Increment retry count
 */
const INCREMENT_RETRY_COUNT = gql`
  mutation IncrementPayoutRetryCount($id: uuid!) {
    update_payouts_by_pk(
      pk_columns: { id: $id }
      _inc: { retry_count: 1 }
      _set: { status: "pending" }
    ) {
      id
      retry_count
      status
      updated_at
    }
  }
`;

/**
 * Get user details for payout enrichment
 */
const GET_USER_DETAILS = gql`
  query GetPayoutUserDetails($userIds: [String!]!) {
    maid_profiles(where: { id: { _in: $userIds } }) {
      id
      full_name
    }
    sponsor_profiles(where: { id: { _in: $userIds } }) {
      id
      full_name
      phone_number
    }
    agency_profiles(where: { id: { _in: $userIds } }) {
      id
      full_name
      phone
      email
    }
    profiles(where: { id: { _in: $userIds } }) {
      id
      email
      full_name
      phone
    }
  }
`;

// Service functions

export const adminPayoutsService = {
  /**
   * Get payouts with pagination, filtering, and sorting
   */
  async getPayouts({
    page = 1,
    limit = 10,
    status = 'all',
    method = 'all',
    userType = 'all',
    searchTerm = '',
    sortBy = 'requested_at',
    sortDirection = 'desc'
  }) {
    try {
      const offset = (page - 1) * limit;

      // Build where clause
      const whereConditions = [];

      if (status && status !== 'all') {
        whereConditions.push({ status: { _eq: status } });
      }

      if (method && method !== 'all') {
        whereConditions.push({ payout_method: { _eq: method } });
      }

      if (userType && userType !== 'all') {
        whereConditions.push({ user_type: { _eq: userType } });
      }

      if (searchTerm) {
        whereConditions.push({
          _or: [
            { payout_number: { _ilike: `%${searchTerm}%` } },
            { description: { _ilike: `%${searchTerm}%` } },
            { user_id: { _ilike: `%${searchTerm}%` } }
          ]
        });
      }

      const where = whereConditions.length > 0
        ? { _and: whereConditions }
        : {};

      // Build order by
      const order_by = [{ [sortBy]: sortDirection }];

      const { data, errors } = await apolloClient.query({
        query: GET_PAYOUTS,
        variables: { limit, offset, where, order_by },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching payouts:', errors);
        return { data: null, error: errors[0] };
      }

      const payouts = data?.payouts || [];
      const totalCount = data?.payouts_aggregate?.aggregate?.count || 0;

      // Enrich payouts with user details
      const enrichedPayouts = await this.enrichPayoutsWithUserDetails(payouts);

      return {
        data: {
          payouts: enrichedPayouts,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching payouts:', error);
      return { data: null, error };
    }
  },

  /**
   * Enrich payouts with user details
   */
  async enrichPayoutsWithUserDetails(payouts) {
    if (!payouts || payouts.length === 0) return [];

    try {
      const userIds = [...new Set(payouts.map(p => p.user_id).filter(Boolean))];

      if (userIds.length === 0) return payouts;

      const { data } = await apolloClient.query({
        query: GET_USER_DETAILS,
        variables: { userIds },
        fetchPolicy: 'network-only'
      });

      // Build lookup maps
      const maidMap = new Map();
      const sponsorMap = new Map();
      const agencyMap = new Map();
      const profilesMap = new Map();

      (data?.maid_profiles || []).forEach(m => {
        if (m.id) maidMap.set(m.id, { name: m.full_name });
      });

      (data?.sponsor_profiles || []).forEach(s => {
        if (s.id) sponsorMap.set(s.id, { name: s.full_name, phone: s.phone_number });
      });

      (data?.agency_profiles || []).forEach(a => {
        if (a.id) agencyMap.set(a.id, { name: a.full_name, email: a.email, phone: a.phone });
      });

      (data?.profiles || []).forEach(p => {
        if (p.id) profilesMap.set(p.id, { name: p.full_name, email: p.email, phone: p.phone });
      });

      return payouts.map(payout => {
        const userId = payout.user_id;
        const userType = payout.user_type;
        const profileInfo = profilesMap.get(userId);
        let recipient = null;

        // Get details from specific profile table based on user_type
        if (userType === 'maid' && maidMap.has(userId)) {
          recipient = {
            id: userId,
            name: maidMap.get(userId).name,
            email: profileInfo?.email,
            type: 'maid'
          };
        } else if (userType === 'sponsor' && sponsorMap.has(userId)) {
          const sponsorInfo = sponsorMap.get(userId);
          recipient = {
            id: userId,
            name: sponsorInfo.name,
            email: profileInfo?.email,
            type: 'sponsor'
          };
        } else if (userType === 'agency' && agencyMap.has(userId)) {
          const agencyInfo = agencyMap.get(userId);
          recipient = {
            id: userId,
            name: agencyInfo.name,
            email: agencyInfo.email || profileInfo?.email,
            type: 'agency'
          };
        } else if (profileInfo) {
          recipient = {
            id: userId,
            name: profileInfo.name || 'Unknown User',
            email: profileInfo.email,
            type: userType || 'unknown'
          };
        } else {
          recipient = {
            id: userId,
            name: 'Unknown User',
            email: null,
            type: userType || 'unknown'
          };
        }

        // Parse payout_destination if it's a string
        let bankDetails = payout.payout_destination;
        if (typeof bankDetails === 'string') {
          try {
            bankDetails = JSON.parse(bankDetails);
          } catch (e) {
            bankDetails = {};
          }
        }

        return {
          ...payout,
          recipient,
          bank_details: bankDetails || {},
          payout_id: payout.payout_number // For UI compatibility
        };
      });
    } catch (error) {
      log.error('Error enriching payouts:', error);
      return payouts.map(payout => ({
        ...payout,
        recipient: {
          id: payout.user_id,
          name: 'Unknown User',
          email: null,
          type: payout.user_type || 'unknown'
        },
        bank_details: payout.payout_destination || {},
        payout_id: payout.payout_number
      }));
    }
  },

  /**
   * Get payout statistics
   */
  async getStats() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_PAYOUT_STATS,
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching payout stats:', errors);
        return { data: null, error: errors[0] };
      }

      const stats = {
        total: {
          count: data?.total?.aggregate?.count || 0,
          amount: parseFloat(data?.total?.aggregate?.sum?.amount) || 0,
          fees: parseFloat(data?.total?.aggregate?.sum?.processing_fee) || 0
        },
        completed: {
          count: data?.completed?.aggregate?.count || 0,
          amount: parseFloat(data?.completed?.aggregate?.sum?.amount) || 0
        },
        pending: {
          count: data?.pending?.aggregate?.count || 0,
          amount: parseFloat(data?.pending?.aggregate?.sum?.amount) || 0
        },
        processing: {
          count: data?.processing?.aggregate?.count || 0,
          amount: parseFloat(data?.processing?.aggregate?.sum?.amount) || 0
        },
        failed: {
          count: data?.failed?.aggregate?.count || 0,
          amount: parseFloat(data?.failed?.aggregate?.sum?.amount) || 0
        },
        onHold: {
          count: data?.on_hold?.aggregate?.count || 0,
          amount: parseFloat(data?.on_hold?.aggregate?.sum?.amount) || 0
        },
        byUserType: {
          maid: {
            count: data?.maid_payouts?.aggregate?.count || 0,
            amount: parseFloat(data?.maid_payouts?.aggregate?.sum?.amount) || 0
          },
          sponsor: {
            count: data?.sponsor_payouts?.aggregate?.count || 0,
            amount: parseFloat(data?.sponsor_payouts?.aggregate?.sum?.amount) || 0
          },
          agency: {
            count: data?.agency_payouts?.aggregate?.count || 0,
            amount: parseFloat(data?.agency_payouts?.aggregate?.sum?.amount) || 0
          }
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      log.error('Error fetching payout stats:', error);
      return { data: null, error };
    }
  },

  /**
   * Get payout by ID
   */
  async getPayoutById(id) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_PAYOUT_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching payout:', errors);
        return { data: null, error: errors[0] };
      }

      const payout = data?.payouts_by_pk;

      if (!payout) {
        return { data: null, error: new Error('Payout not found') };
      }

      // Enrich with user details
      const enriched = await this.enrichPayoutsWithUserDetails([payout]);

      return { data: enriched[0], error: null };
    } catch (error) {
      log.error('Error fetching payout by ID:', error);
      return { data: null, error };
    }
  },

  /**
   * Update payout status
   */
  async updatePayoutStatus(id, action, additionalData = {}) {
    try {
      const now = new Date().toISOString();
      let variables = { id };

      switch (action) {
        case 'approve':
          variables.status = 'processing';
          variables.processing_at = now;
          break;
        case 'complete':
          variables.status = 'completed';
          variables.completed_at = now;
          break;
        case 'reject':
          variables.status = 'failed';
          variables.failed_at = now;
          variables.failure_code = additionalData.failure_code || 'REJECTED';
          variables.failure_message = additionalData.failure_message || 'Payout rejected by admin';
          break;
        case 'hold':
          variables.status = 'on_hold';
          variables.notes = additionalData.notes || 'Placed on hold by admin';
          break;
        case 'release':
          variables.status = 'pending';
          variables.notes = additionalData.notes || 'Released from hold';
          break;
        default:
          return { data: null, error: new Error('Invalid action') };
      }

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_PAYOUT_STATUS,
        variables
      });

      if (errors) {
        log.error('GraphQL errors updating payout:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_payouts_by_pk, error: null };
    } catch (error) {
      log.error('Error updating payout status:', error);
      return { data: null, error };
    }
  },

  /**
   * Retry failed payout
   */
  async retryPayout(id) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: INCREMENT_RETRY_COUNT,
        variables: { id }
      });

      if (errors) {
        log.error('GraphQL errors retrying payout:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_payouts_by_pk, error: null };
    } catch (error) {
      log.error('Error retrying payout:', error);
      return { data: null, error };
    }
  }
};

export default adminPayoutsService;
