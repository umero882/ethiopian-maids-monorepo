/**
 * useAdminMedia Hook
 * Manages admin media content page state and operations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { adminMediaService } from '@/services/adminMediaService';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('useAdminMedia');

/**
 * Main hook for admin media management
 */
export function useAdminMedia(initialFilters = {}) {
  // Core state
  const [media, setMedia] = useState([]);
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

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    mediaType: 'all',
    documentType: 'all',
    searchTerm: '',
    mediaSource: 'all', // 'all', 'documents', 'images'
    ...initialFilters,
  });

  // Sort state
  const [sortBy, setSortBy] = useState('created');
  const [sortDirection, setSortDirection] = useState('desc');

  // Selected media for detail view
  const [selectedMedia, setSelectedMedia] = useState(null);

  /**
   * Fetch media with current filters and pagination
   */
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminMediaService.getAllMedia({
        filters: {
          ...filters,
          status: filters.status,
          documentType: filters.documentType,
          searchTerm: filters.searchTerm,
        },
        sortBy,
        sortDirection,
        page: currentPage,
        limit: itemsPerPage,
        mediaSource: filters.mediaSource,
      });

      if (result.error) {
        throw result.error;
      }

      // Apply client-side media type filter
      let filteredMedia = result.data.media;
      if (filters.mediaType !== 'all') {
        filteredMedia = filteredMedia.filter(m => m.media_type === filters.mediaType);
      }

      setMedia(filteredMedia);
      setTotalCount(result.data.totalCount);
      setTotalPages(result.data.totalPages);

      log.debug(`Fetched ${filteredMedia.length} media items`);
    } catch (err) {
      log.error('Error fetching media:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to load media. Please try again.',
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
      const result = await adminMediaService.getStats();

      if (result.error) {
        throw result.error;
      }

      setStats(result.data);
      log.debug('Fetched stats:', result.data);
    } catch (err) {
      log.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Approve media
   */
  const approveMedia = useCallback(async (mediaId, source) => {
    setIsOperating(true);

    try {
      const result = await adminMediaService.updateModerationStatus(mediaId, source, 'approved');

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setMedia(prev =>
        prev.map(item =>
          item.id === mediaId
            ? { ...item, moderation_status: 'approved', verified: true }
            : item
        )
      );

      fetchStats();

      toast({
        title: 'Media Approved',
        description: 'The media has been approved successfully.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error approving media:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve media.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Reject media
   */
  const rejectMedia = useCallback(async (mediaId, source) => {
    setIsOperating(true);

    try {
      const result = await adminMediaService.updateModerationStatus(mediaId, source, 'rejected');

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setMedia(prev =>
        prev.map(item =>
          item.id === mediaId
            ? { ...item, moderation_status: 'rejected', verified: false }
            : item
        )
      );

      fetchStats();

      toast({
        title: 'Media Rejected',
        description: 'The media has been rejected.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error rejecting media:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject media.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Delete media
   */
  const deleteMedia = useCallback(async (mediaId, source) => {
    setIsOperating(true);

    try {
      const result = await adminMediaService.deleteMedia(mediaId, source);

      if (result.error) {
        throw result.error;
      }

      // Remove from local state
      setMedia(prev => prev.filter(item => item.id !== mediaId));
      setTotalCount(prev => prev - 1);

      fetchStats();

      toast({
        title: 'Media Deleted',
        description: 'The media has been permanently deleted.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error deleting media:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete media.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Flag media for review (set to pending)
   */
  const flagMedia = useCallback(async (mediaId, source) => {
    // For now, just update local state since there's no flag status in DB
    setMedia(prev =>
      prev.map(item =>
        item.id === mediaId
          ? { ...item, moderation_status: 'flagged' }
          : item
      )
    );

    toast({
      title: 'Media Flagged',
      description: 'The media has been flagged for review.',
    });

    return { success: true };
  }, []);

  /**
   * Update a filter
   */
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      mediaType: 'all',
      documentType: 'all',
      searchTerm: '',
      mediaSource: 'all',
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
    fetchMedia();
    fetchStats();
  }, [fetchMedia, fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.mediaType !== 'all' ||
      filters.documentType !== 'all' ||
      filters.searchTerm !== '' ||
      filters.mediaSource !== 'all'
    );
  }, [filters]);

  return {
    // Data
    media,
    stats,
    selectedMedia,
    totalCount,

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
    approveMedia,
    rejectMedia,
    deleteMedia,
    flagMedia,
    setSelectedMedia,

    // Refresh
    refresh,
  };
}

export default useAdminMedia;
