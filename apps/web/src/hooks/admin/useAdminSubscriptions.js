/**
 * useAdminSubscriptions Hook
 * Manages admin subscriptions page state and operations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { adminSubscriptionsService } from '@/services/adminSubscriptionsService';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('useAdminSubscriptions');

/**
 * Main hook for admin subscriptions management
 */
export function useAdminSubscriptions(initialFilters = {}) {
  // Core state
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    planType: 'all',
    userType: 'all',
    searchTerm: '',
    ...initialFilters
  });

  // Sort state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  /**
   * Fetch subscriptions with current filters and pagination
   */
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminSubscriptionsService.getSubscriptions({
        page: currentPage,
        limit: itemsPerPage,
        status: filters.status,
        planType: filters.planType,
        userType: filters.userType,
        searchTerm: filters.searchTerm,
        sortBy,
        sortDirection
      });

      if (result.error) {
        throw result.error;
      }

      setSubscriptions(result.data.subscriptions);
      setTotalCount(result.data.totalCount);
      setTotalPages(result.data.totalPages);

      log.debug(`Fetched ${result.data.subscriptions.length} subscriptions`);
    } catch (err) {
      log.error('Error fetching subscriptions:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to load subscriptions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, sortBy, sortDirection]);

  /**
   * Fetch subscription statistics
   */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const result = await adminSubscriptionsService.getStats();

      if (result.error) {
        throw result.error;
      }

      setStats(result.data);
      log.debug('Fetched subscription stats');
    } catch (err) {
      log.error('Error fetching stats:', err);
      // Don't show toast for stats error - not critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Fetch monthly trend data
   */
  const fetchMonthlyTrend = useCallback(async () => {
    setTrendLoading(true);

    try {
      const result = await adminSubscriptionsService.getMonthlyTrend();

      if (result.error) {
        throw result.error;
      }

      setMonthlyTrend(result.data);
      log.debug('Fetched monthly trend data');
    } catch (err) {
      log.error('Error fetching monthly trend:', err);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  /**
   * Fetch subscription by ID for detail view
   */
  const fetchSubscriptionById = useCallback(async (id) => {
    try {
      const result = await adminSubscriptionsService.getSubscriptionById(id);

      if (result.error) {
        throw result.error;
      }

      setSelectedSubscription(result.data);
      return result.data;
    } catch (err) {
      log.error('Error fetching subscription:', err);
      toast({
        title: 'Error',
        description: 'Failed to load subscription details.',
        variant: 'destructive'
      });
      return null;
    }
  }, []);

  /**
   * Update subscription status
   */
  const updateSubscriptionStatus = useCallback(async (id, newStatus) => {
    setActionLoading(true);

    try {
      const result = await adminSubscriptionsService.updateSubscriptionStatus(id, newStatus);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === id ? { ...sub, status: newStatus } : sub
        )
      );

      // Update selected subscription if it's the same
      if (selectedSubscription?.id === id) {
        setSelectedSubscription(prev => ({ ...prev, status: newStatus }));
      }

      toast({
        title: 'Success',
        description: `Subscription status updated to ${newStatus}.`
      });

      // Refresh stats
      fetchStats();

      return true;
    } catch (err) {
      log.error('Error updating subscription status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update subscription status.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [selectedSubscription, fetchStats]);

  /**
   * Pause subscription
   */
  const pauseSubscription = useCallback(async (id) => {
    return updateSubscriptionStatus(id, 'paused');
  }, [updateSubscriptionStatus]);

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async (id) => {
    return updateSubscriptionStatus(id, 'cancelled');
  }, [updateSubscriptionStatus]);

  /**
   * Reactivate subscription
   */
  const reactivateSubscription = useCallback(async (id) => {
    return updateSubscriptionStatus(id, 'active');
  }, [updateSubscriptionStatus]);

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
      planType: 'all',
      userType: 'all',
      searchTerm: ''
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
    fetchSubscriptions();
    fetchStats();
    fetchMonthlyTrend();
  }, [fetchSubscriptions, fetchStats, fetchMonthlyTrend]);

  // Initial fetch
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Fetch stats and trend on mount
  useEffect(() => {
    fetchStats();
    fetchMonthlyTrend();
  }, [fetchStats, fetchMonthlyTrend]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.planType !== 'all' ||
      filters.userType !== 'all' ||
      filters.searchTerm !== ''
    );
  }, [filters]);

  // Summary computed from stats
  const summary = useMemo(() => {
    if (!stats) {
      return {
        totalRevenue: 0,
        monthlyRecurring: 0,
        activeCount: 0,
        trialingCount: 0,
        pastDueCount: 0,
        cancelledCount: 0
      };
    }

    return {
      totalRevenue: stats.total?.revenue || 0,
      monthlyRecurring: stats.active?.mrr || 0,
      activeCount: stats.active?.count || 0,
      trialingCount: 0, // No trial in current schema
      pastDueCount: stats.pastDue?.count || 0,
      cancelledCount: stats.cancelled?.count || 0,
      atRiskRevenue: stats.pastDue?.atRisk || 0,
      byPlanType: stats.byPlanType,
      byUserType: stats.byUserType
    };
  }, [stats]);

  return {
    // Data
    subscriptions,
    stats,
    summary,
    monthlyTrend,
    selectedSubscription,
    totalCount,

    // Loading states
    loading,
    statsLoading,
    trendLoading,
    actionLoading,

    // Error
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
    fetchSubscriptionById,
    setSelectedSubscription,
    pauseSubscription,
    cancelSubscription,
    reactivateSubscription,
    updateSubscriptionStatus,

    // Refresh
    refresh
  };
}

export default useAdminSubscriptions;
