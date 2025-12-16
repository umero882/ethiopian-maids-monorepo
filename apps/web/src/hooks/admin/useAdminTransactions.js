/**
 * useAdminTransactions Hook
 * Manages admin financial transactions page state and operations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { adminTransactionsService } from '@/services/adminTransactionsService';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('useAdminTransactions');

/**
 * Main hook for admin transactions management
 */
export function useAdminTransactions(initialFilters = {}) {
  // Core state
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    paymentMethod: 'all',
    searchTerm: '',
    dateFrom: null,
    dateTo: null,
    minAmount: null,
    maxAmount: null,
    userId: null,
    subscriptionId: null,
    ...initialFilters,
  });

  // Sort state
  const [sortBy, setSortBy] = useState('created');
  const [sortDirection, setSortDirection] = useState('desc');

  // Selected transaction for detail view
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  /**
   * Fetch transactions with current filters and pagination
   */
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminTransactionsService.getTransactions({
        filters,
        sortBy,
        sortDirection,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (result.error) {
        throw result.error;
      }

      setTransactions(result.data.transactions);
      setTotalCount(result.data.totalCount);
      setTotalAmount(result.data.totalAmount);
      setTotalPages(result.data.totalPages);

      log.debug(`Fetched ${result.data.transactions.length} transactions`);
    } catch (err) {
      log.error('Error fetching transactions:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to load transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortDirection, currentPage, itemsPerPage]);

  /**
   * Fetch dashboard statistics
   */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const result = await adminTransactionsService.getStats();

      if (result.error) {
        throw result.error;
      }

      setStats(result.data);
      log.debug('Fetched stats:', result.data);
    } catch (err) {
      log.error('Error fetching stats:', err);
      // Don't show toast for stats error - not critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Fetch single transaction by ID
   */
  const fetchTransactionById = useCallback(async (transactionId) => {
    try {
      const result = await adminTransactionsService.getTransactionById(transactionId);

      if (result.error) {
        throw result.error;
      }

      setSelectedTransaction(result.data);
      return result.data;
    } catch (err) {
      log.error('Error fetching transaction:', err);
      toast({
        title: 'Error',
        description: 'Failed to load transaction details.',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  /**
   * Update a filter
   */
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      type: 'all',
      paymentMethod: 'all',
      searchTerm: '',
      dateFrom: null,
      dateTo: null,
      minAmount: null,
      maxAmount: null,
      userId: null,
      subscriptionId: null,
    });
    setCurrentPage(1);
  }, []);

  /**
   * Update sort
   */
  const updateSort = useCallback((newSortBy, newSortDirection = 'desc') => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    setCurrentPage(1);
  }, []);

  /**
   * Go to page
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    fetchTransactions();
    fetchStats();
  }, [fetchTransactions, fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.type !== 'all' ||
      filters.paymentMethod !== 'all' ||
      filters.searchTerm !== '' ||
      filters.dateFrom !== null ||
      filters.dateTo !== null ||
      filters.minAmount !== null ||
      filters.maxAmount !== null ||
      filters.userId !== null ||
      filters.subscriptionId !== null
    );
  }, [filters]);

  // Transaction summary computed from current data
  const transactionSummary = useMemo(() => {
    if (!stats) {
      return {
        total: totalAmount || 0,
        completed: 0,
        pending: 0,
        fees: 0,
        completedCount: 0,
        pendingCount: 0,
      };
    }

    return {
      total: stats.total?.amount || 0,
      completed: stats.completed?.amount || 0,
      pending: stats.pending?.amount || 0,
      fees: stats.platformFees || 0,
      completedCount: stats.completed?.count || 0,
      pendingCount: stats.pending?.count || 0,
      failedCount: stats.failed?.count || 0,
      refundedCount: stats.refunded?.count || 0,
    };
  }, [stats, totalAmount]);

  return {
    // Data
    transactions,
    stats,
    selectedTransaction,
    totalCount,
    totalAmount,
    transactionSummary,

    // State
    loading,
    statsLoading,
    error,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    goToPage,

    // Filters
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,

    // Sorting
    sortBy,
    sortDirection,
    updateSort,

    // Actions
    fetchTransactionById,
    setSelectedTransaction,

    // Refresh
    refresh,
  };
}

export default useAdminTransactions;
