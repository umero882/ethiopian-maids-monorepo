/**
 * useAdminListings Hook
 * Manages admin job listings page state and operations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { adminListingsService } from '@/services/adminListingsService';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('useAdminListings');

/**
 * Main hook for admin listings management
 */
export function useAdminListings(initialFilters = {}) {
  // Core state
  const [listings, setListings] = useState([]);
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
    jobType: 'all',
    country: 'all',
    searchTerm: '',
    featured: null,
    urgent: null,
    ...initialFilters,
  });

  // Sort state
  const [sortBy, setSortBy] = useState('created');
  const [sortDirection, setSortDirection] = useState('desc');

  // Selected listing for detail view
  const [selectedListing, setSelectedListing] = useState(null);

  /**
   * Fetch listings with current filters and pagination
   */
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminListingsService.getListings({
        filters,
        sortBy,
        sortDirection,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (result.error) {
        throw result.error;
      }

      setListings(result.data.listings);
      setTotalCount(result.data.totalCount);
      setTotalPages(result.data.totalPages);

      log.debug(`Fetched ${result.data.listings.length} listings`);
    } catch (err) {
      log.error('Error fetching listings:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to load listings. Please try again.',
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
      const result = await adminListingsService.getStats();

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
   * Fetch single listing by ID
   */
  const fetchListingById = useCallback(async (listingId) => {
    try {
      const result = await adminListingsService.getListingById(listingId);

      if (result.error) {
        throw result.error;
      }

      setSelectedListing(result.data);
      return result.data;
    } catch (err) {
      log.error('Error fetching listing:', err);
      toast({
        title: 'Error',
        description: 'Failed to load listing details.',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  /**
   * Update listing status
   */
  const updateStatus = useCallback(async (listingId, status) => {
    setIsOperating(true);

    try {
      const result = await adminListingsService.updateStatus(listingId, status);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setListings(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? { ...listing, status }
            : listing
        )
      );

      // Refresh stats
      fetchStats();

      toast({
        title: 'Status Updated',
        description: `Listing status changed to ${status}.`,
      });

      return { success: true };
    } catch (err) {
      log.error('Error updating status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update listing status.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Toggle featured status
   */
  const toggleFeatured = useCallback(async (listingId, featured) => {
    setIsOperating(true);

    try {
      const result = await adminListingsService.toggleFeatured(listingId, featured);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setListings(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? { ...listing, featured, featured_until: result.data?.featured_until }
            : listing
        )
      );

      // Refresh stats
      fetchStats();

      toast({
        title: featured ? 'Listing Featured' : 'Featured Removed',
        description: featured
          ? 'Listing is now featured for 7 days.'
          : 'Listing is no longer featured.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error toggling featured:', err);
      toast({
        title: 'Error',
        description: 'Failed to update featured status.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Toggle urgent status
   */
  const toggleUrgent = useCallback(async (listingId, urgent) => {
    setIsOperating(true);

    try {
      const result = await adminListingsService.toggleUrgent(listingId, urgent);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setListings(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? { ...listing, urgent, urgency_level: urgent ? 'urgent' : 'normal' }
            : listing
        )
      );

      // Refresh stats
      fetchStats();

      toast({
        title: urgent ? 'Marked as Urgent' : 'Urgent Removed',
        description: urgent
          ? 'Listing is now marked as urgent.'
          : 'Listing is no longer urgent.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error toggling urgent:', err);
      toast({
        title: 'Error',
        description: 'Failed to update urgent status.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    } finally {
      setIsOperating(false);
    }
  }, [fetchStats]);

  /**
   * Delete a listing
   */
  const deleteListing = useCallback(async (listingId) => {
    setIsOperating(true);

    try {
      const result = await adminListingsService.deleteListing(listingId);

      if (result.error) {
        throw result.error;
      }

      // Remove from local state
      setListings(prev => prev.filter(listing => listing.id !== listingId));
      setTotalCount(prev => prev - 1);

      // Refresh stats
      fetchStats();

      toast({
        title: 'Listing Deleted',
        description: 'The listing has been permanently deleted.',
      });

      return { success: true };
    } catch (err) {
      log.error('Error deleting listing:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete listing.',
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
      status: 'all',
      jobType: 'all',
      country: 'all',
      searchTerm: '',
      featured: null,
      urgent: null,
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
    fetchListings();
    fetchStats();
  }, [fetchListings, fetchStats]);

  /**
   * Export listings to CSV
   */
  const exportListings = useCallback(() => {
    if (listings.length === 0) {
      toast({
        title: 'No Data',
        description: 'No listings to export.',
        variant: 'default',
      });
      return;
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Title',
      'Status',
      'Job Type',
      'Employer',
      'Country',
      'City',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Featured',
      'Urgent',
      'Created At',
      'Expires At',
    ];

    // Convert listings to CSV rows
    const rows = listings.map(listing => [
      listing.id,
      `"${(listing.title || '').replace(/"/g, '""')}"`,
      listing.status || '',
      listing.job_type || '',
      `"${(listing.sponsor_profile?.full_name || '').replace(/"/g, '""')}"`,
      listing.country || '',
      listing.city || '',
      listing.salary_min || '',
      listing.salary_max || '',
      listing.currency || 'USD',
      listing.featured ? 'Yes' : 'No',
      listing.urgent ? 'Yes' : 'No',
      listing.created_at ? new Date(listing.created_at).toLocaleDateString() : '',
      listing.expires_at ? new Date(listing.expires_at).toLocaleDateString() : '',
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
    link.download = `listings_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Export Complete',
      description: `Exported ${listings.length} listings to CSV.`,
    });

    log.info(`Exported ${listings.length} listings to CSV`);
  }, [listings]);

  // Initial fetch
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.jobType !== 'all' ||
      filters.country !== 'all' ||
      filters.searchTerm !== '' ||
      filters.featured !== null ||
      filters.urgent !== null
    );
  }, [filters]);

  return {
    // Data
    listings,
    stats,
    selectedListing,
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
    updateStatus,
    toggleFeatured,
    toggleUrgent,
    deleteListing,
    fetchListingById,
    setSelectedListing,

    // Refresh
    refresh,
    refreshListings: refresh, // Alias for backward compatibility

    // Feature listing (alias)
    featureListing: (id) => toggleFeatured(id, true),

    // Export
    exportListings,
  };
}

export default useAdminListings;
