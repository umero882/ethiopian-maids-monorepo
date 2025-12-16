import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';

const log = logger.child({ context: 'AdminFinancialService' });

/**
 * Admin Financial Service
 * Handles platform earnings and financial data for admin dashboard
 * Migrated to GraphQL/Hasura
 */

// GraphQL Queries
const GET_PLATFORM_TRANSACTIONS = gql`
  query GetPlatformTransactions {
    placement_fee_transactions(where: { fee_status: { _eq: "released" } }) {
      id
      agency_id
      fee_amount
      currency
      fee_status
      released_at
      created_at
    }
  }
`;

const GET_TRANSACTIONS_BY_DATE = gql`
  query GetTransactionsByDate($startDate: timestamptz!, $endDate: timestamptz!) {
    placement_fee_transactions(
      where: {
        fee_status: { _eq: "released" },
        released_at: { _gte: $startDate, _lte: $endDate }
      },
      order_by: { released_at: desc }
    ) {
      id
      agency_id
      fee_amount
      currency
      released_at
      created_at
    }
  }
`;

const GET_AGENCY_REVENUES = gql`
  query GetAgencyRevenues {
    placement_fee_transactions(where: { fee_status: { _eq: "released" } }) {
      agency_id
      fee_amount
    }
    profiles(where: { user_type: { _eq: "agency" } }) {
      id
      full_name
      company_name
    }
  }
`;

const GET_RECENT_TRANSACTIONS = gql`
  query GetRecentTransactions($limit: Int!) {
    placement_fee_transactions(
      where: { fee_status: { _eq: "released" } },
      order_by: { released_at: desc },
      limit: $limit
    ) {
      id
      agency_id
      maid_id
      sponsor_id
      fee_amount
      currency
      fee_status
      released_at
      created_at
    }
  }
`;

const GET_ALL_TRANSACTIONS = gql`
  query GetAllTransactions($where: placement_fee_transactions_bool_exp!, $limit: Int!, $offset: Int!) {
    placement_fee_transactions(
      where: $where,
      order_by: { released_at: desc },
      limit: $limit,
      offset: $offset
    ) {
      id
      agency_id
      maid_id
      sponsor_id
      fee_amount
      currency
      fee_status
      visa_status
      released_at
      created_at
    }
    placement_fee_transactions_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export class AdminFinancialService {
  /**
   * Get platform earnings summary
   * @returns {Promise<Object>} Earnings summary with total revenue, monthly revenue, escrow, etc.
   */
  static async getPlatformEarningsSummary() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_PLATFORM_TRANSACTIONS,
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const transactions = data?.placement_fee_transactions || [];

      if (transactions.length === 0) {
        return {
          total_revenue: 0.00,
          monthly_revenue: 0.00,
          escrow_balance: 0.00,
          total_transactions: 0,
          monthly_transactions: 0,
          average_fee: 0.00
        };
      }

      // Calculate totals
      const total_revenue = transactions.reduce((sum, t) => sum + parseFloat(t.fee_amount || 0), 0);
      const total_transactions = transactions.length;
      const average_fee = total_transactions > 0 ? total_revenue / total_transactions : 0;

      // Calculate monthly revenue
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyTransactions = transactions.filter(t => new Date(t.released_at) >= startOfMonth);
      const monthly_revenue = monthlyTransactions.reduce((sum, t) => sum + parseFloat(t.fee_amount || 0), 0);
      const monthly_transactions = monthlyTransactions.length;

      return {
        total_revenue: Math.round(total_revenue * 100) / 100,
        monthly_revenue: Math.round(monthly_revenue * 100) / 100,
        escrow_balance: 0.00, // Would need separate escrow query
        total_transactions,
        monthly_transactions,
        average_fee: Math.round(average_fee * 100) / 100
      };
    } catch (error) {
      log.error('Failed to get platform earnings summary:', error);
      throw new Error(`Failed to get platform earnings summary: ${error.message}`);
    }
  }

  /**
   * Get platform earnings by date
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Array>} Daily earnings breakdown
   */
  static async getPlatformEarningsByDate(startDate, endDate) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_TRANSACTIONS_BY_DATE,
        variables: { startDate, endDate },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const transactions = data?.placement_fee_transactions || [];

      // Group by date
      const dailyEarnings = {};
      transactions.forEach(t => {
        const date = new Date(t.released_at).toISOString().split('T')[0];
        if (!dailyEarnings[date]) {
          dailyEarnings[date] = { date, revenue: 0, transactions: 0 };
        }
        dailyEarnings[date].revenue += parseFloat(t.fee_amount || 0);
        dailyEarnings[date].transactions += 1;
      });

      return Object.values(dailyEarnings).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      log.error('Failed to get platform earnings by date:', error);
      throw new Error(`Failed to get platform earnings by date: ${error.message}`);
    }
  }

  /**
   * Get top revenue-generating agencies
   * @param {number} limit - Number of agencies to return
   * @returns {Promise<Array>} Top agencies by revenue
   */
  static async getTopRevenueAgencies(limit = 10) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_AGENCY_REVENUES,
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const transactions = data?.placement_fee_transactions || [];
      const profiles = data?.profiles || [];

      // Create a map of agency names
      const agencyNames = {};
      profiles.forEach(p => {
        agencyNames[p.id] = p.company_name || p.full_name || 'Unknown Agency';
      });

      // Group revenue by agency
      const agencyRevenue = {};
      transactions.forEach(t => {
        if (!agencyRevenue[t.agency_id]) {
          agencyRevenue[t.agency_id] = {
            agency_id: t.agency_id,
            agency_name: agencyNames[t.agency_id] || 'Unknown Agency',
            total_revenue: 0,
            transaction_count: 0
          };
        }
        agencyRevenue[t.agency_id].total_revenue += parseFloat(t.fee_amount || 0);
        agencyRevenue[t.agency_id].transaction_count += 1;
      });

      // Sort by revenue and limit
      return Object.values(agencyRevenue)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit)
        .map(a => ({
          ...a,
          total_revenue: Math.round(a.total_revenue * 100) / 100
        }));
    } catch (error) {
      log.error('Failed to get top revenue agencies:', error);
      throw new Error(`Failed to get top revenue agencies: ${error.message}`);
    }
  }

  /**
   * Get recent revenue transactions
   * @param {number} limit - Number of transactions to return
   * @returns {Promise<Array>} Recent revenue transactions
   */
  static async getRecentRevenueTransactions(limit = 20) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_RECENT_TRANSACTIONS,
        variables: { limit },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      return data?.placement_fee_transactions || [];
    } catch (error) {
      log.error('Failed to get recent revenue transactions:', error);
      throw new Error(`Failed to get recent revenue transactions: ${error.message}`);
    }
  }

  /**
   * Get monthly revenue trend (last 12 months)
   * @returns {Promise<Array>} Monthly revenue trend
   */
  static async getMonthlyRevenueTrend() {
    try {
      // Fetch all released transactions for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data, errors } = await apolloClient.query({
        query: GET_TRANSACTIONS_BY_DATE,
        variables: {
          startDate: twelveMonthsAgo.toISOString(),
          endDate: new Date().toISOString()
        },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const transactions = data?.placement_fee_transactions || [];

      // Group by month
      const monthlyData = {};
      transactions.forEach(t => {
        const date = new Date(t.released_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, revenue: 0, transactions: 0 };
        }
        monthlyData[monthKey].revenue += parseFloat(t.fee_amount || 0);
        monthlyData[monthKey].transactions += 1;
      });

      return Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(m => ({
          ...m,
          revenue: Math.round(m.revenue * 100) / 100
        }));
    } catch (error) {
      log.error('Failed to get monthly revenue trend:', error);
      throw new Error(`Failed to get monthly revenue trend: ${error.message}`);
    }
  }

  /**
   * Get complete earnings dashboard data
   * @returns {Promise<Object>} All dashboard data
   */
  static async getEarningsDashboard() {
    try {
      log.info('Fetching complete earnings dashboard data');

      const [summary, topAgencies, recentTransactions, monthlyTrend] = await Promise.all([
        this.getPlatformEarningsSummary(),
        this.getTopRevenueAgencies(10),
        this.getRecentRevenueTransactions(20),
        this.getMonthlyRevenueTrend()
      ]);

      return {
        summary,
        topAgencies,
        recentTransactions,
        monthlyTrend
      };
    } catch (error) {
      log.error('Failed to fetch earnings dashboard:', error);
      throw new Error(`Failed to fetch earnings dashboard: ${error.message}`);
    }
  }

  /**
   * Get all revenue transactions with filtering
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @param {string} filters.agencyId - Agency ID filter
   * @param {string} filters.status - Status filter
   * @param {number} filters.limit - Limit
   * @param {number} filters.offset - Offset for pagination
   * @returns {Promise<Object>} Transactions and count
   */
  static async getAllRevenueTransactions(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        agencyId,
        status = 'released',
        limit = 50,
        offset = 0
      } = filters;

      // Build where clause
      const whereConditions = { fee_status: { _eq: status } };

      if (startDate) {
        whereConditions.released_at = whereConditions.released_at || {};
        whereConditions.released_at._gte = startDate;
      }

      if (endDate) {
        whereConditions.released_at = whereConditions.released_at || {};
        whereConditions.released_at._lte = endDate;
      }

      if (agencyId) {
        whereConditions.agency_id = { _eq: agencyId };
      }

      const { data, errors } = await apolloClient.query({
        query: GET_ALL_TRANSACTIONS,
        variables: { where: whereConditions, limit, offset },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      return {
        transactions: data?.placement_fee_transactions || [],
        total: data?.placement_fee_transactions_aggregate?.aggregate?.count || 0
      };
    } catch (error) {
      log.error('Failed to get all revenue transactions:', error);
      throw new Error(`Failed to get all revenue transactions: ${error.message}`);
    }
  }

  /**
   * Calculate growth rate
   * @param {number} current - Current period value
   * @param {number} previous - Previous period value
   * @returns {number} Growth rate percentage
   */
  static calculateGrowthRate(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get earnings statistics with growth rate
   * @returns {Promise<Object>} Earnings with growth calculations
   */
  static async getEarningsStatistics() {
    try {
      const summary = await this.getPlatformEarningsSummary();

      // Get previous month for comparison
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const { data, errors } = await apolloClient.query({
        query: GET_TRANSACTIONS_BY_DATE,
        variables: {
          startDate: lastMonthStart.toISOString(),
          endDate: lastMonthEnd.toISOString()
        },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const lastMonthTransactions = data?.placement_fee_transactions || [];
      const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + parseFloat(t.fee_amount || 0), 0);
      const growthRate = this.calculateGrowthRate(summary.monthly_revenue, lastMonthRevenue);

      return {
        ...summary,
        last_month_revenue: Math.round(lastMonthRevenue * 100) / 100,
        growth_rate: Math.round(growthRate * 100) / 100
      };
    } catch (error) {
      log.error('Failed to get earnings statistics:', error);
      throw new Error(`Failed to get earnings statistics: ${error.message}`);
    }
  }
}

export default AdminFinancialService;
