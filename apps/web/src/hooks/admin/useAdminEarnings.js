/**
 * useAdminEarnings Hook
 * Manages admin earnings page state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { adminEarningsService } from '@/services/adminEarningsService';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('useAdminEarnings');

/**
 * Main hook for admin earnings management
 */
export function useAdminEarnings() {
  // Core state
  const [summary, setSummary] = useState(null);
  const [topAgencies, setTopAgencies] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [agenciesLoading, setAgenciesLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  // Error state
  const [error, setError] = useState(null);

  // Pagination for transactions
  const [transactionPage, setTransactionPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;

  /**
   * Fetch earnings summary
   */
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);

    try {
      const result = await adminEarningsService.getSummary();

      if (result.error) {
        throw result.error;
      }

      setSummary(result.data);
      log.debug('Fetched earnings summary');
    } catch (err) {
      log.error('Error fetching summary:', err);
      setError(err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  /**
   * Fetch top agencies
   */
  const fetchTopAgencies = useCallback(async (limit = 10) => {
    setAgenciesLoading(true);

    try {
      const result = await adminEarningsService.getTopAgencies(limit);

      if (result.error) {
        throw result.error;
      }

      setTopAgencies(result.data);
      log.debug(`Fetched ${result.data.length} top agencies`);
    } catch (err) {
      log.error('Error fetching top agencies:', err);
    } finally {
      setAgenciesLoading(false);
    }
  }, []);

  /**
   * Fetch recent transactions
   */
  const fetchRecentTransactions = useCallback(async (page = 1) => {
    setTransactionsLoading(true);

    try {
      const offset = (page - 1) * transactionsPerPage;
      const result = await adminEarningsService.getRecentTransactions(
        transactionsPerPage,
        offset
      );

      if (result.error) {
        throw result.error;
      }

      setRecentTransactions(result.data.transactions);
      setTotalTransactions(result.data.totalCount);
      setTransactionPage(page);
      log.debug(`Fetched ${result.data.transactions.length} transactions`);
    } catch (err) {
      log.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [transactionsPerPage]);

  /**
   * Fetch monthly trend
   */
  const fetchMonthlyTrend = useCallback(async () => {
    setTrendLoading(true);

    try {
      const result = await adminEarningsService.getMonthlyTrend();

      if (result.error) {
        throw result.error;
      }

      setMonthlyTrend(result.data);
      log.debug(`Fetched ${result.data.length} months of trend data`);
    } catch (err) {
      log.error('Error fetching monthly trend:', err);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  /**
   * Fetch all data
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSummary(),
        fetchTopAgencies(),
        fetchRecentTransactions(),
        fetchMonthlyTrend(),
      ]);
    } catch (err) {
      log.error('Error fetching earnings data:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, fetchTopAgencies, fetchRecentTransactions, fetchMonthlyTrend]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  /**
   * Go to transaction page
   */
  const goToTransactionPage = useCallback((page) => {
    const totalPages = Math.ceil(totalTransactions / transactionsPerPage);
    if (page >= 1 && page <= totalPages) {
      fetchRecentTransactions(page);
    }
  }, [totalTransactions, transactionsPerPage, fetchRecentTransactions]);

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Computed values
  const totalTransactionPages = Math.ceil(totalTransactions / transactionsPerPage);

  const isLoading = loading || summaryLoading || agenciesLoading || transactionsLoading || trendLoading;

  return {
    // Data
    summary,
    topAgencies,
    recentTransactions,
    monthlyTrend,
    totalTransactions,

    // Loading states
    loading: isLoading,
    summaryLoading,
    agenciesLoading,
    transactionsLoading,
    trendLoading,

    // Error
    error,

    // Pagination
    transactionPage,
    totalTransactionPages,
    goToTransactionPage,

    // Actions
    refresh,
    fetchSummary,
    fetchTopAgencies,
    fetchRecentTransactions,
    fetchMonthlyTrend,
  };
}

export default useAdminEarnings;
