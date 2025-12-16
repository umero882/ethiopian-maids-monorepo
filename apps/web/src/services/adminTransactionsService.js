import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminTransactionsService');

// ============================================
// GraphQL Queries
// ============================================

const GET_ADMIN_TRANSACTIONS = gql`
  query GetAdminTransactions(
    $where: payments_bool_exp
    $orderBy: [payments_order_by!]
    $limit: Int!
    $offset: Int!
  ) {
    payments(
      where: $where
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      amount
      currency
      status
      payment_method
      payment_type
      description
      reference_number
      transaction_id
      stripe_payment_intent_id
      stripe_charge_id
      error_code
      failure_reason
      receipt_url
      metadata
      created_at
      processed_at
      completed_at
      user_id
      booking_id
      subscription_id
    }
    payments_aggregate(where: $where) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
  }
`;

const GET_ADMIN_TRANSACTION_BY_ID = gql`
  query GetAdminTransactionById($id: uuid!) {
    payments_by_pk(id: $id) {
      id
      amount
      currency
      status
      payment_method
      payment_type
      description
      reference_number
      transaction_id
      stripe_payment_intent_id
      stripe_charge_id
      error_code
      failure_reason
      receipt_url
      metadata
      created_at
      processed_at
      completed_at
      user_id
      booking_id
      subscription_id
      booking {
        id
        status
        created_at
      }
    }
  }
`;

const GET_ADMIN_TRANSACTIONS_STATS = gql`
  query GetAdminTransactionsStats {
    total: payments_aggregate {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    completed: payments_aggregate(where: { status: { _eq: "completed" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    pending: payments_aggregate(where: { status: { _eq: "pending" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    failed: payments_aggregate(where: { status: { _eq: "failed" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    refunded: payments_aggregate(where: { status: { _eq: "refunded" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    subscription_payments: payments_aggregate(where: { payment_type: { _eq: "subscription" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
    contact_fee_payments: payments_aggregate(where: { payment_type: { _eq: "contact_fee" } }) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
  }
`;

// Query to get user info by IDs from auth_users
const GET_USERS_BY_IDS = gql`
  query GetUsersByIds($ids: [uuid!]!) {
    auth_users(where: { id: { _in: $ids } }) {
      id
      email
      display_name
      user_type
    }
  }
`;

// Query to get sponsor info
const GET_SPONSORS_BY_USER_IDS = gql`
  query GetSponsorsByUserIds($ids: [String!]!) {
    sponsors(where: { id: { _in: $ids } }) {
      id
      full_name
      email
      phone_number
    }
  }
`;

// Query to get maid info
const GET_MAIDS_BY_USER_IDS = gql`
  query GetMaidsByUserIds($ids: [uuid!]!) {
    maids(where: { user_id: { _in: $ids } }) {
      id
      user_id
      full_name
      email
      phone_number
    }
  }
`;

// Query to get agency info
const GET_AGENCIES_BY_USER_IDS = gql`
  query GetAgenciesByUserIds($ids: [String!]!) {
    agencies(where: { user_id: { _in: $ids } }) {
      id
      user_id
      agency_name
      contact_email
      phone_number
    }
  }
`;

// ============================================
// Service Functions
// ============================================

/**
 * Build GraphQL where clause for admin transaction filters
 */
function buildAdminTransactionFilters(filters) {
  if (!filters) return {};

  const conditions = [];

  // Status filter
  if (filters.status && filters.status !== 'all') {
    conditions.push({ status: { _eq: filters.status } });
  }

  // Payment type filter
  if (filters.type && filters.type !== 'all') {
    conditions.push({ payment_type: { _eq: filters.type } });
  }

  // Payment method filter
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    conditions.push({ payment_method: { _eq: filters.paymentMethod } });
  }

  // Date range filter
  if (filters.dateFrom) {
    conditions.push({ created_at: { _gte: filters.dateFrom } });
  }
  if (filters.dateTo) {
    conditions.push({ created_at: { _lte: filters.dateTo } });
  }

  // Amount range filter
  if (filters.minAmount !== undefined && filters.minAmount !== null) {
    conditions.push({ amount: { _gte: filters.minAmount } });
  }
  if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
    conditions.push({ amount: { _lte: filters.maxAmount } });
  }

  // Search term (searches in description, reference_number, transaction_id)
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const term = `%${filters.searchTerm.trim()}%`;
    conditions.push({
      _or: [
        { description: { _ilike: term } },
        { reference_number: { _ilike: term } },
        { transaction_id: { _ilike: term } },
        { stripe_payment_intent_id: { _ilike: term } },
      ],
    });
  }

  // User ID filter
  if (filters.userId) {
    conditions.push({ user_id: { _eq: filters.userId } });
  }

  // Subscription ID filter
  if (filters.subscriptionId) {
    conditions.push({ subscription_id: { _eq: filters.subscriptionId } });
  }

  return conditions.length > 0 ? { _and: conditions } : {};
}

/**
 * Build order_by clause
 */
function buildOrderBy(sortBy, sortDirection = 'desc') {
  const direction = sortDirection === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'amount':
      return [{ amount: direction }];
    case 'status':
      return [{ status: direction }];
    case 'type':
      return [{ payment_type: direction }];
    case 'created':
    default:
      return [{ created_at: direction }];
  }
}

/**
 * Fetch user details for a list of user IDs
 */
async function fetchUserDetails(userIds) {
  if (!userIds || userIds.length === 0) return {};

  try {
    // Filter out null/undefined user IDs
    const validIds = userIds.filter(id => id != null);
    if (validIds.length === 0) return {};

    const { data, errors } = await apolloClient.query({
      query: GET_USERS_BY_IDS,
      variables: { ids: validIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminTransactions] Error fetching users:', errors);
      return {};
    }

    const userMap = {};
    (data?.auth_users || []).forEach(user => {
      userMap[user.id] = user;
    });
    return userMap;
  } catch (error) {
    log.error('[AdminTransactions] Error fetching users:', error);
    return {};
  }
}

/**
 * Fetch sponsor details
 */
async function fetchSponsorDetails(userIds) {
  if (!userIds || userIds.length === 0) return {};

  try {
    const validIds = userIds.filter(id => id != null);
    if (validIds.length === 0) return {};

    const { data, errors } = await apolloClient.query({
      query: GET_SPONSORS_BY_USER_IDS,
      variables: { ids: validIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminTransactions] Error fetching sponsors:', errors);
      return {};
    }

    const sponsorMap = {};
    (data?.sponsors || []).forEach(sponsor => {
      sponsorMap[sponsor.id] = sponsor;
    });
    return sponsorMap;
  } catch (error) {
    log.error('[AdminTransactions] Error fetching sponsors:', error);
    return {};
  }
}

/**
 * Fetch maid details
 */
async function fetchMaidDetails(userIds) {
  if (!userIds || userIds.length === 0) return {};

  try {
    const validIds = userIds.filter(id => id != null);
    if (validIds.length === 0) return {};

    const { data, errors } = await apolloClient.query({
      query: GET_MAIDS_BY_USER_IDS,
      variables: { ids: validIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminTransactions] Error fetching maids:', errors);
      return {};
    }

    const maidMap = {};
    (data?.maids || []).forEach(maid => {
      maidMap[maid.user_id] = maid;
    });
    return maidMap;
  } catch (error) {
    log.error('[AdminTransactions] Error fetching maids:', error);
    return {};
  }
}

/**
 * Fetch agency details
 */
async function fetchAgencyDetails(userIds) {
  if (!userIds || userIds.length === 0) return {};

  try {
    const validIds = userIds.filter(id => id != null);
    if (validIds.length === 0) return {};

    const { data, errors } = await apolloClient.query({
      query: GET_AGENCIES_BY_USER_IDS,
      variables: { ids: validIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminTransactions] Error fetching agencies:', errors);
      return {};
    }

    const agencyMap = {};
    (data?.agencies || []).forEach(agency => {
      agencyMap[agency.user_id] = agency;
    });
    return agencyMap;
  } catch (error) {
    log.error('[AdminTransactions] Error fetching agencies:', error);
    return {};
  }
}

/**
 * Enrich transaction with user info
 */
function enrichTransaction(transaction, userMap, sponsorMap, maidMap, agencyMap) {
  const userId = transaction.user_id;
  const authUser = userMap[userId];

  let userInfo = {
    id: userId,
    name: 'Unknown User',
    email: null,
    type: 'unknown',
  };

  if (authUser) {
    userInfo = {
      id: userId,
      name: authUser.display_name || authUser.email || 'Unknown',
      email: authUser.email,
      type: authUser.user_type || 'unknown',
    };

    // Get more detailed info based on user type
    if (authUser.user_type === 'sponsor' && sponsorMap[userId]) {
      const sponsor = sponsorMap[userId];
      userInfo.name = sponsor.full_name || userInfo.name;
      userInfo.email = sponsor.email || userInfo.email;
      userInfo.phone = sponsor.phone_number;
    } else if (authUser.user_type === 'maid' && maidMap[userId]) {
      const maid = maidMap[userId];
      userInfo.name = maid.full_name || userInfo.name;
      userInfo.email = maid.email || userInfo.email;
      userInfo.phone = maid.phone_number;
    } else if (authUser.user_type === 'agency' && agencyMap[userId]) {
      const agency = agencyMap[userId];
      userInfo.name = agency.agency_name || userInfo.name;
      userInfo.email = agency.contact_email || userInfo.email;
      userInfo.phone = agency.phone_number;
    }
  }

  // Calculate platform fee (5% of amount, as an example)
  const platformFeeRate = 0.05;
  const platformFee = transaction.amount * platformFeeRate;
  const netAmount = transaction.amount - platformFee;

  return {
    ...transaction,
    // Generate a readable transaction ID if not present
    transaction_id: transaction.transaction_id || `TXN-${transaction.id.substring(0, 8).toUpperCase()}`,
    // Map payment_type to the types expected by the UI
    type: mapPaymentType(transaction.payment_type),
    // User info
    from_user: userInfo,
    to_user: {
      id: 'platform',
      name: 'EthioMaids Platform',
      type: 'platform',
      email: 'billing@ethiomaids.com',
    },
    // Fee calculations
    platform_fee: platformFee,
    net_amount: netAmount,
    // Gateway response based on status
    gateway_response: mapStatusToGateway(transaction.status),
    // Dispute status (from metadata if available)
    dispute_status: transaction.metadata?.dispute_status || null,
    // Refund amount
    refund_amount: transaction.metadata?.refund_amount || 0,
    // Notes from description
    notes: transaction.description || 'No additional notes',
  };
}

/**
 * Map payment_type from DB to UI types
 */
function mapPaymentType(dbType) {
  const typeMap = {
    'subscription': 'subscription',
    'contact_fee': 'payment',
    'placement_fee': 'commission',
    'refund': 'refund',
    'credit_purchase': 'payment',
    'withdrawal': 'withdrawal',
  };
  return typeMap[dbType] || dbType || 'payment';
}

/**
 * Map status to gateway response
 */
function mapStatusToGateway(status) {
  const statusMap = {
    'completed': 'SUCCESS',
    'succeeded': 'SUCCESS',
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'failed': 'FAILED',
    'refunded': 'REFUNDED',
    'disputed': 'DISPUTED',
    'cancelled': 'CANCELLED',
  };
  return statusMap[status] || status?.toUpperCase() || 'UNKNOWN';
}

export const adminTransactionsService = {
  /**
   * Get all transactions with filtering, search, sorting, and pagination
   */
  async getTransactions({
    filters = {},
    sortBy = 'created',
    sortDirection = 'desc',
    page = 1,
    limit = 20,
  } = {}) {
    try {
      const where = buildAdminTransactionFilters(filters);
      const orderBy = buildOrderBy(sortBy, sortDirection);
      const offset = (page - 1) * limit;

      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_TRANSACTIONS,
        variables: { where, orderBy, limit, offset },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const transactions = data?.payments || [];
      const totalCount = data?.payments_aggregate?.aggregate?.count || 0;
      const totalAmount = data?.payments_aggregate?.aggregate?.sum?.amount || 0;

      // Get unique user IDs
      const userIds = [...new Set(transactions.map(t => t.user_id).filter(Boolean))];

      // Fetch related user details
      const [userMap, sponsorMap, maidMap, agencyMap] = await Promise.all([
        fetchUserDetails(userIds),
        fetchSponsorDetails(userIds),
        fetchMaidDetails(userIds),
        fetchAgencyDetails(userIds),
      ]);

      // Enrich transactions with user info
      const enrichedTransactions = transactions.map(transaction =>
        enrichTransaction(transaction, userMap, sponsorMap, maidMap, agencyMap)
      );

      log.debug(`[AdminTransactions] Fetched ${transactions.length} transactions (total: ${totalCount})`);

      return {
        data: {
          transactions: enrichedTransactions,
          totalCount,
          totalAmount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        error: null,
      };
    } catch (error) {
      log.error('[AdminTransactions] Error fetching transactions:', error);
      return { data: null, error };
    }
  },

  /**
   * Get single transaction by ID with full details
   */
  async getTransactionById(transactionId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_TRANSACTION_BY_ID,
        variables: { id: transactionId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const transaction = data?.payments_by_pk;
      if (!transaction) {
        return { data: null, error: new Error('Transaction not found') };
      }

      // Fetch user details
      const [userMap, sponsorMap, maidMap, agencyMap] = await Promise.all([
        fetchUserDetails(transaction.user_id ? [transaction.user_id] : []),
        fetchSponsorDetails(transaction.user_id ? [transaction.user_id] : []),
        fetchMaidDetails(transaction.user_id ? [transaction.user_id] : []),
        fetchAgencyDetails(transaction.user_id ? [transaction.user_id] : []),
      ]);

      const enrichedTransaction = enrichTransaction(
        transaction,
        userMap,
        sponsorMap,
        maidMap,
        agencyMap
      );

      return { data: enrichedTransaction, error: null };
    } catch (error) {
      log.error('[AdminTransactions] Error fetching transaction:', error);
      return { data: null, error };
    }
  },

  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_TRANSACTIONS_STATS,
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const stats = {
        total: {
          count: data?.total?.aggregate?.count || 0,
          amount: data?.total?.aggregate?.sum?.amount || 0,
        },
        completed: {
          count: data?.completed?.aggregate?.count || 0,
          amount: data?.completed?.aggregate?.sum?.amount || 0,
        },
        pending: {
          count: data?.pending?.aggregate?.count || 0,
          amount: data?.pending?.aggregate?.sum?.amount || 0,
        },
        failed: {
          count: data?.failed?.aggregate?.count || 0,
          amount: data?.failed?.aggregate?.sum?.amount || 0,
        },
        refunded: {
          count: data?.refunded?.aggregate?.count || 0,
          amount: data?.refunded?.aggregate?.sum?.amount || 0,
        },
        byType: {
          subscription: {
            count: data?.subscription_payments?.aggregate?.count || 0,
            amount: data?.subscription_payments?.aggregate?.sum?.amount || 0,
          },
          contact_fee: {
            count: data?.contact_fee_payments?.aggregate?.count || 0,
            amount: data?.contact_fee_payments?.aggregate?.sum?.amount || 0,
          },
        },
        // Calculate platform fees (5% of completed)
        platformFees: (data?.completed?.aggregate?.sum?.amount || 0) * 0.05,
      };

      log.debug('[AdminTransactions] Fetched stats:', stats);
      return { data: stats, error: null };
    } catch (error) {
      log.error('[AdminTransactions] Error fetching stats:', error);
      return { data: null, error };
    }
  },
};

export default adminTransactionsService;
