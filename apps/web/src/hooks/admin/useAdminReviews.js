/**
 * useAdminReviews Hook
 * Manages admin reviews page state and operations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { adminReviewsService } from '@/services/adminReviewsService';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('useAdminReviews');

/**
 * Main hook for admin reviews management
 */
export function useAdminReviews(initialFilters = {}) {
  // Core state
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOperating, setIsOperating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [averageRating, setAverageRating] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    rating: 'all',
    searchTerm: '',
    maidId: null,
    sponsorId: null,
    dateFrom: null,
    dateTo: null,
    ...initialFilters,
  });

  // Sort state
  const [sortBy, setSortBy] = useState('created');
  const [sortDirection, setSortDirection] = useState('desc');

  // Selected review for detail view
  const [selectedReview, setSelectedReview] = useState(null);

  /**
   * Fetch reviews with current filters and pagination
   */
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminReviewsService.getReviews({
        filters,
        sortBy,
        sortDirection,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (result.error) {
        throw result.error;
      }

      setReviews(result.data.reviews);
      setTotalCount(result.data.totalCount);
      setTotalPages(result.data.totalPages);
      setAverageRating(result.data.averageRating);

      log.debug(`Fetched ${result.data.reviews.length} reviews`);
    } catch (err) {
      log.error('Error fetching reviews:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to load reviews. Please try again.',
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
      const result = await adminReviewsService.getStats();

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
   * Fetch single review by ID
   */
  const fetchReviewById = useCallback(async (reviewId) => {
    try {
      const result = await adminReviewsService.getReviewById(reviewId);

      if (result.error) {
        throw result.error;
      }

      setSelectedReview(result.data);
      return result.data;
    } catch (err) {
      log.error('Error fetching review:', err);
      toast({
        title: 'Error',
        description: 'Failed to load review details.',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  /**
   * Delete a review
   */
  const deleteReview = useCallback(async (reviewId) => {
    setIsOperating(true);

    try {
      const result = await adminReviewsService.deleteReview(reviewId);

      if (result.error) {
        throw result.error;
      }

      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setTotalCount(prev => prev - 1);

      // Refresh stats
      fetchStats();

      toast({
        title: 'Review Deleted',
        description: 'The review has been permanently deleted.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error deleting review:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete review.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Update a review
   */
  const updateReview = useCallback(async (reviewId, reviewData) => {
    setIsOperating(true);

    try {
      const result = await adminReviewsService.updateReview(reviewId, reviewData);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { ...review, ...reviewData }
            : review
        )
      );

      // Refresh stats if rating changed
      if (reviewData.rating !== undefined) {
        fetchStats();
      }

      toast({
        title: 'Review Updated',
        description: 'The review has been updated successfully.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error updating review:', err);
      toast({
        title: 'Error',
        description: 'Failed to update review.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Update a filter
   */
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  /**
   * Update multiple filters at once
   */
  const updateFilters = useCallback((filterUpdates) => {
    setFilters(prev => ({ ...prev, ...filterUpdates }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      rating: 'all',
      searchTerm: '',
      maidId: null,
      sponsorId: null,
      dateFrom: null,
      dateTo: null,
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
    fetchReviews();
    fetchStats();
  }, [fetchReviews, fetchStats]);

  /**
   * Export reviews to CSV
   */
  const exportReviews = useCallback(() => {
    if (reviews.length === 0) {
      toast({
        title: 'No Data',
        description: 'No reviews to export.',
        variant: 'default',
      });
      return;
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Rating',
      'Comment',
      'Reviewer Name',
      'Reviewer ID',
      'Maid Name',
      'Maid ID',
      'Created At',
    ];

    // Convert reviews to CSV rows
    const rows = reviews.map(review => [
      review.id,
      review.rating || '',
      `"${(review.comment || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(review.reviewer?.name || review.sponsor_id?.substring(0, 8) || 'Unknown').replace(/"/g, '""')}"`,
      review.sponsor_id || '',
      `"${(review.maid?.name || review.maid_id?.substring(0, 8) || 'Unknown').replace(/"/g, '""')}"`,
      review.maid_id || '',
      review.created_at ? new Date(review.created_at).toLocaleDateString() : '',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reviews_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Export Complete',
      description: `Exported ${reviews.length} reviews to CSV.`,
    });

    log.info(`Exported ${reviews.length} reviews to CSV`);
  }, [reviews]);

  // Initial fetch
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      filters.rating !== 'all' ||
      filters.searchTerm !== '' ||
      filters.maidId !== null ||
      filters.sponsorId !== null ||
      filters.dateFrom !== null ||
      filters.dateTo !== null
    );
  }, [filters]);

  // Rating distribution for stats
  const ratingDistribution = useMemo(() => {
    if (!stats) return [];
    return [
      { rating: 5, count: stats.rating5, percentage: stats.total ? (stats.rating5 / stats.total) * 100 : 0 },
      { rating: 4, count: stats.rating4, percentage: stats.total ? (stats.rating4 / stats.total) * 100 : 0 },
      { rating: 3, count: stats.rating3, percentage: stats.total ? (stats.rating3 / stats.total) * 100 : 0 },
      { rating: 2, count: stats.rating2, percentage: stats.total ? (stats.rating2 / stats.total) * 100 : 0 },
      { rating: 1, count: stats.rating1, percentage: stats.total ? (stats.rating1 / stats.total) * 100 : 0 },
    ];
  }, [stats]);

  return {
    // Data
    reviews,
    stats,
    selectedReview,
    totalCount,
    averageRating,
    ratingDistribution,

    // State
    loading,
    statsLoading,
    error,
    isOperating,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    goToPage,
    setCurrentPage: goToPage, // Alias for backward compatibility

    // Filters
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters,

    // Sorting
    sortBy,
    sortDirection,
    updateSort,

    // Actions
    deleteReview,
    updateReview,
    fetchReviewById,
    setSelectedReview,

    // Refresh
    refresh,
    refreshReviews: refresh, // Alias for backward compatibility

    // Export
    exportReviews,
  };
}

export default useAdminReviews;
