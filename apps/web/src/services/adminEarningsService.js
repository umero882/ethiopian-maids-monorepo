import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminEarningsService');

// ============================================
// GraphQL Queries
// ============================================

const GET_EARNINGS_SUMMARY = gql`
  query GetEarningsSummary {
    # Total revenue (released fees)
    total_released: placement_fee_transactions_aggregate(
      where: { fee_status: { _eq: "released" } }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # Fees in escrow (pending visa approval)
    total_escrow: placement_fee_transactions_aggregate(
      where: { fee_status: { _eq: "escrow" } }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # This month's revenue
    monthly_revenue: placement_fee_transactions_aggregate(
      where: {
        _and: [
          { fee_status: { _eq: "released" } }
          { released_at: { _gte: "${getMonthStart()}" } }
        ]
      }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # Last month's revenue (for comparison)
    last_month_revenue: placement_fee_transactions_aggregate(
      where: {
        _and: [
          { fee_status: { _eq: "released" } }
          { released_at: { _gte: "${getLastMonthStart()}" } }
          { released_at: { _lt: "${getMonthStart()}" } }
        ]
      }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # Total transactions (all statuses)
    total_transactions: placement_fee_transactions_aggregate {
      aggregate {
        count
        sum {
          fee_amount
        }
        avg {
          fee_amount
        }
      }
    }

    # Credited/refunded fees
    total_credited: placement_fee_transactions_aggregate(
      where: { fee_status: { _eq: "credited" } }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }
  }
`;

// Helper functions for date calculations
function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function getLastMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
}

const GET_EARNINGS_SUMMARY_DYNAMIC = gql`
  query GetEarningsSummaryDynamic(
    $monthStart: timestamptz!
    $lastMonthStart: timestamptz!
  ) {
    # Total revenue (released fees)
    total_released: placement_fee_transactions_aggregate(
      where: { fee_status: { _eq: "released" } }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # Fees in escrow (pending visa approval)
    total_escrow: placement_fee_transactions_aggregate(
      where: { fee_status: { _eq: "escrow" } }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # This month's revenue
    monthly_revenue: placement_fee_transactions_aggregate(
      where: {
        _and: [
          { fee_status: { _eq: "released" } }
          { released_at: { _gte: $monthStart } }
        ]
      }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # Last month's revenue
    last_month_revenue: placement_fee_transactions_aggregate(
      where: {
        _and: [
          { fee_status: { _eq: "released" } }
          { released_at: { _gte: $lastMonthStart } }
          { released_at: { _lt: $monthStart } }
        ]
      }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }

    # Total transactions
    total_transactions: placement_fee_transactions_aggregate {
      aggregate {
        count
        sum {
          fee_amount
        }
        avg {
          fee_amount
        }
      }
    }

    # Credited fees
    total_credited: placement_fee_transactions_aggregate(
      where: { fee_status: { _eq: "credited" } }
    ) {
      aggregate {
        count
        sum {
          fee_amount
        }
      }
    }
  }
`;

const GET_TOP_AGENCIES = gql`
  query GetTopAgencies($limit: Int!) {
    agencies(
      limit: $limit
      order_by: { created_at: desc }
    ) {
      id
      user_id
      agency_name
      contact_email
      phone_number
      is_verified
      created_at
    }
  }
`;

const GET_AGENCY_EARNINGS = gql`
  query GetAgencyEarnings($agencyIds: [uuid!]!) {
    # Released fees by agency
    released: placement_fee_transactions(
      where: {
        agency_id: { _in: $agencyIds }
        fee_status: { _eq: "released" }
      }
    ) {
      agency_id
      fee_amount
    }

    # Escrow fees by agency
    escrow: placement_fee_transactions(
      where: {
        agency_id: { _in: $agencyIds }
        fee_status: { _eq: "escrow" }
      }
    ) {
      agency_id
      fee_amount
    }

    # All transactions by agency for counts
    all_transactions: placement_fee_transactions(
      where: { agency_id: { _in: $agencyIds } }
    ) {
      agency_id
      fee_status
      fee_amount
    }
  }
`;

const GET_RECENT_TRANSACTIONS = gql`
  query GetRecentTransactions($limit: Int!, $offset: Int!) {
    placement_fee_transactions(
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      agency_id
      maid_id
      sponsor_id
      fee_amount
      fee_status
      visa_status
      currency
      created_at
      released_at
      credited_at
      notes
    }
    placement_fee_transactions_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const GET_MONTHLY_TREND = gql`
  query GetMonthlyTrend {
    placement_fee_transactions(
      where: { fee_status: { _eq: "released" } }
      order_by: { released_at: desc }
    ) {
      id
      agency_id
      fee_amount
      released_at
    }
  }
`;

// Query for agency names
const GET_AGENCIES_BY_IDS = gql`
  query GetAgenciesByIds($ids: [uuid!]!) {
    agencies(where: { id: { _in: $ids } }) {
      id
      agency_name
      contact_email
      is_verified
    }
  }
`;

// Query for maid names
const GET_MAIDS_BY_IDS = gql`
  query GetMaidsByIds($ids: [uuid!]!) {
    maids(where: { id: { _in: $ids } }) {
      id
      full_name
      email
    }
  }
`;

// Query for sponsor names
const GET_SPONSORS_BY_IDS = gql`
  query GetSponsorsByIds($ids: [String!]!) {
    sponsors(where: { id: { _in: $ids } }) {
      id
      full_name
      email
    }
  }
`;

// ============================================
// Service Functions
// ============================================

/**
 * Fetch agency details
 */
async function fetchAgencyDetails(agencyIds) {
  if (!agencyIds || agencyIds.length === 0) return {};

  try {
    const validIds = agencyIds.filter(id => id != null);
    if (validIds.length === 0) return {};

    const { data, errors } = await apolloClient.query({
      query: GET_AGENCIES_BY_IDS,
      variables: { ids: validIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminEarnings] Error fetching agencies:', errors);
      return {};
    }

    const agencyMap = {};
    (data?.agencies || []).forEach(agency => {
      agencyMap[agency.id] = agency;
    });
    return agencyMap;
  } catch (error) {
    log.error('[AdminEarnings] Error fetching agencies:', error);
    return {};
  }
}

/**
 * Fetch maid details
 */
async function fetchMaidDetails(maidIds) {
  if (!maidIds || maidIds.length === 0) return {};

  try {
    const validIds = maidIds.filter(id => id != null);
    if (validIds.length === 0) return {};

    const { data, errors } = await apolloClient.query({
      query: GET_MAIDS_BY_IDS,
      variables: { ids: validIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminEarnings] Error fetching maids:', errors);
      return {};
    }

    const maidMap = {};
    (data?.maids || []).forEach(maid => {
      maidMap[maid.id] = maid;
    });
    return maidMap;
  } catch (error) {
    log.error('[AdminEarnings] Error fetching maids:', error);
    return {};
  }
}

/**
 * Fetch sponsor details
 */
async function fetchSponsorDetails(sponsorIds) {
  if (!sponsorIds || sponsorIds.length === 0) return {};

  try {
    const validIds = sponsorIds.filter(id => id != null);
    if (validIds.length === 0) return {};

    const { data, errors } = await apolloClient.query({
      query: GET_SPONSORS_BY_IDS,
      variables: { ids: validIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminEarnings] Error fetching sponsors:', errors);
      return {};
    }

    const sponsorMap = {};
    (data?.sponsors || []).forEach(sponsor => {
      sponsorMap[sponsor.id] = sponsor;
    });
    return sponsorMap;
  } catch (error) {
    log.error('[AdminEarnings] Error fetching sponsors:', error);
    return {};
  }
}

/**
 * Calculate monthly trend from transactions
 */
function calculateMonthlyTrend(transactions) {
  const monthlyData = {};

  transactions.forEach(tx => {
    if (!tx.released_at) return;

    const date = new Date(tx.released_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month_key: monthKey,
        month_name: monthName,
        revenue: 0,
        transaction_count: 0,
        agencies: new Set(),
      };
    }

    monthlyData[monthKey].revenue += parseFloat(tx.fee_amount) || 0;
    monthlyData[monthKey].transaction_count += 1;
    if (tx.agency_id) {
      monthlyData[monthKey].agencies.add(tx.agency_id);
    }
  });

  // Convert to array and sort by month descending
  return Object.values(monthlyData)
    .map(m => ({
      ...m,
      agency_count: m.agencies.size,
      agencies: undefined, // Remove the Set
    }))
    .sort((a, b) => b.month_key.localeCompare(a.month_key))
    .slice(0, 6); // Last 6 months
}

export const adminEarningsService = {
  /**
   * Get earnings summary statistics
   */
  async getSummary() {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const { data, errors } = await apolloClient.query({
        query: GET_EARNINGS_SUMMARY_DYNAMIC,
        variables: { monthStart, lastMonthStart },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const totalRevenue = data?.total_released?.aggregate?.sum?.fee_amount || 0;
      const totalTransactions = data?.total_released?.aggregate?.count || 0;
      const escrowBalance = data?.total_escrow?.aggregate?.sum?.fee_amount || 0;
      const escrowCount = data?.total_escrow?.aggregate?.count || 0;
      const monthlyRevenue = data?.monthly_revenue?.aggregate?.sum?.fee_amount || 0;
      const monthlyTransactions = data?.monthly_revenue?.aggregate?.count || 0;
      const lastMonthRevenue = data?.last_month_revenue?.aggregate?.sum?.fee_amount || 0;
      const avgFee = data?.total_transactions?.aggregate?.avg?.fee_amount || 500;
      const creditedAmount = data?.total_credited?.aggregate?.sum?.fee_amount || 0;

      // Calculate growth rate
      const growthRate = lastMonthRevenue > 0
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : monthlyRevenue > 0 ? 100 : 0;

      const summary = {
        total_revenue: parseFloat(totalRevenue) || 0,
        monthly_revenue: parseFloat(monthlyRevenue) || 0,
        escrow_balance: parseFloat(escrowBalance) || 0,
        escrow_count: escrowCount,
        total_transactions: totalTransactions,
        monthly_transactions: monthlyTransactions,
        average_fee: parseFloat(avgFee) || 500,
        last_month_revenue: parseFloat(lastMonthRevenue) || 0,
        growth_rate: growthRate,
        credited_amount: parseFloat(creditedAmount) || 0,
      };

      log.debug('[AdminEarnings] Fetched summary:', summary);
      return { data: summary, error: null };
    } catch (error) {
      log.error('[AdminEarnings] Error fetching summary:', error);
      return { data: null, error };
    }
  },

  /**
   * Get top revenue-generating agencies
   */
  async getTopAgencies(limit = 10) {
    try {
      // First get agencies
      const { data: agencyData, errors: agencyErrors } = await apolloClient.query({
        query: GET_TOP_AGENCIES,
        variables: { limit: 50 }, // Get more to filter by earnings
        fetchPolicy: 'network-only',
      });

      if (agencyErrors?.length > 0) {
        throw new Error(agencyErrors[0].message);
      }

      const agencies = agencyData?.agencies || [];
      if (agencies.length === 0) {
        return { data: [], error: null };
      }

      const agencyIds = agencies.map(a => a.id);

      // Get earnings data for these agencies
      const { data: earningsData, errors: earningsErrors } = await apolloClient.query({
        query: GET_AGENCY_EARNINGS,
        variables: { agencyIds },
        fetchPolicy: 'network-only',
      });

      if (earningsErrors?.length > 0) {
        throw new Error(earningsErrors[0].message);
      }

      // Calculate earnings per agency
      const agencyEarnings = {};

      // Initialize all agencies
      agencies.forEach(agency => {
        agencyEarnings[agency.id] = {
          agency_id: agency.id,
          agency_name: agency.agency_name || 'Unknown Agency',
          total_revenue: 0,
          transaction_count: 0,
          escrow_count: 0,
          success_count: 0,
          is_verified: agency.is_verified,
        };
      });

      // Sum released fees
      (earningsData?.released || []).forEach(tx => {
        if (agencyEarnings[tx.agency_id]) {
          agencyEarnings[tx.agency_id].total_revenue += parseFloat(tx.fee_amount) || 0;
        }
      });

      // Count escrow
      (earningsData?.escrow || []).forEach(tx => {
        if (agencyEarnings[tx.agency_id]) {
          agencyEarnings[tx.agency_id].escrow_count += 1;
        }
      });

      // Count all transactions
      (earningsData?.all_transactions || []).forEach(tx => {
        if (agencyEarnings[tx.agency_id]) {
          agencyEarnings[tx.agency_id].transaction_count += 1;
          if (tx.fee_status === 'released') {
            agencyEarnings[tx.agency_id].success_count += 1;
          }
        }
      });

      // Calculate success rate and average fee
      const topAgencies = Object.values(agencyEarnings)
        .map(a => ({
          ...a,
          success_rate: a.transaction_count > 0
            ? (a.success_count / a.transaction_count) * 100
            : 0,
          average_fee: a.success_count > 0
            ? a.total_revenue / a.success_count
            : 500,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);

      log.debug(`[AdminEarnings] Fetched ${topAgencies.length} top agencies`);
      return { data: topAgencies, error: null };
    } catch (error) {
      log.error('[AdminEarnings] Error fetching top agencies:', error);
      return { data: [], error };
    }
  },

  /**
   * Get recent fee transactions
   */
  async getRecentTransactions(limit = 10, offset = 0) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_RECENT_TRANSACTIONS,
        variables: { limit, offset },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const transactions = data?.placement_fee_transactions || [];
      const totalCount = data?.placement_fee_transactions_aggregate?.aggregate?.count || 0;

      // Get unique IDs for related entities
      const agencyIds = [...new Set(transactions.map(t => t.agency_id).filter(Boolean))];
      const maidIds = [...new Set(transactions.map(t => t.maid_id).filter(Boolean))];
      const sponsorIds = [...new Set(transactions.map(t => t.sponsor_id).filter(Boolean))];

      // Fetch related details
      const [agencyMap, maidMap, sponsorMap] = await Promise.all([
        fetchAgencyDetails(agencyIds),
        fetchMaidDetails(maidIds),
        fetchSponsorDetails(sponsorIds),
      ]);

      // Enrich transactions
      const enrichedTransactions = transactions.map(tx => ({
        ...tx,
        agency_name: agencyMap[tx.agency_id]?.agency_name || 'Unknown Agency',
        maid_name: maidMap[tx.maid_id]?.full_name || 'Unknown Maid',
        sponsor_name: sponsorMap[tx.sponsor_id]?.full_name || 'Unknown Sponsor',
      }));

      log.debug(`[AdminEarnings] Fetched ${transactions.length} transactions`);
      return {
        data: {
          transactions: enrichedTransactions,
          totalCount,
        },
        error: null,
      };
    } catch (error) {
      log.error('[AdminEarnings] Error fetching transactions:', error);
      return { data: null, error };
    }
  },

  /**
   * Get monthly revenue trend
   */
  async getMonthlyTrend() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_MONTHLY_TREND,
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const transactions = data?.placement_fee_transactions || [];
      const monthlyTrend = calculateMonthlyTrend(transactions);

      log.debug(`[AdminEarnings] Calculated ${monthlyTrend.length} months of trend data`);
      return { data: monthlyTrend, error: null };
    } catch (error) {
      log.error('[AdminEarnings] Error fetching monthly trend:', error);
      return { data: [], error };
    }
  },
};

export default adminEarningsService;
