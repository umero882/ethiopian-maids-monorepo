/**
 * useAgencyMaids Hook
 *
 * Custom hook for managing agency maids using GraphQL/Hasura.
 * Provides CRUD operations, filtering, sorting, and pagination for maids.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

const log = createLogger('useAgencyMaids');

// GraphQL Queries
const GET_AGENCY_MAIDS = gql`
  query GetAgencyMaids(
    $agencyId: String!
    $limit: Int!
    $offset: Int!
    $orderBy: [maid_profiles_order_by!]
  ) {
    maid_profiles(
      where: { agency_id: { _eq: $agencyId } }
      limit: $limit
      offset: $offset
      order_by: $orderBy
    ) {
      id
      user_id
      first_name
      middle_name
      last_name
      full_name
      date_of_birth
      nationality
      country
      current_location
      profile_photo_url
      primary_profession
      skills
      experience_years
      availability_status
      verification_status
      languages
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      created_at
      updated_at
    }
    maid_profiles_aggregate(
      where: { agency_id: { _eq: $agencyId } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_MAID_DETAILS = gql`
  query GetMaidDetails($maidId: String!) {
    maid_profiles_by_pk(id: $maidId) {
      id
      user_id
      agency_id
      first_name
      middle_name
      last_name
      full_name
      date_of_birth
      marital_status
      nationality
      country
      current_location
      street_address
      suburb
      state_province
      profile_photo_url
      primary_profession
      primary_profession_other
      skills
      special_skills
      experience_years
      key_responsibilities
      availability_status
      available_from
      verification_status
      languages
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      about_me
      additional_services
      work_preferences
      introduction_video_url
      phone_number
      phone_country_code
      education_level
      religion
      children_count
      visa_status
      current_visa_status
      created_at
      updated_at
    }
  }
`;

const DELETE_MAID = gql`
  mutation DeleteMaid($maidId: String!) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $maidId }
      _set: { availability_status: "archived", updated_at: "now()" }
    ) {
      id
      availability_status
    }
  }
`;

export const useAgencyMaids = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [maids, setMaids] = useState([]);
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const agencyId = user?.id;

  /**
   * Load maids with current filters and pagination
   */
  const loadMaids = useCallback(async (page = pagination.page, newFilters = filters) => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pagination.limit;
      const orderBy = [{ [sortBy]: sortOrder }];

      const { data, errors } = await apolloClient.query({
        query: GET_AGENCY_MAIDS,
        variables: {
          agencyId,
          limit: pagination.limit,
          offset,
          orderBy
        },
        fetchPolicy: 'network-only'
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      let maidsData = data?.maid_profiles || [];
      const total = data?.maid_profiles_aggregate?.aggregate?.count || 0;

      // Apply client-side filters (until we implement server-side filtering)
      if (newFilters.status) {
        maidsData = maidsData.filter(m => m.availability_status === newFilters.status);
      }
      if (newFilters.verificationStatus) {
        maidsData = maidsData.filter(m => m.verification_status === newFilters.verificationStatus);
      }
      if (newFilters.nationality) {
        maidsData = maidsData.filter(m => m.nationality === newFilters.nationality);
      }
      if (newFilters.search) {
        const searchLower = newFilters.search.toLowerCase();
        maidsData = maidsData.filter(m =>
          m.full_name?.toLowerCase().includes(searchLower) ||
          m.first_name?.toLowerCase().includes(searchLower) ||
          m.last_name?.toLowerCase().includes(searchLower)
        );
      }

      const totalPages = Math.ceil(total / pagination.limit);

      setMaids(maidsData);
      setPagination({
        page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      });

      log.info('Loaded maids:', { count: maidsData.length, total });

    } catch (err) {
      log.error('Error loading maids:', err);
      setError(err.message);
      setMaids([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId, sortBy, sortOrder, pagination.limit, filters, pagination.page]);

  /**
   * Load detailed information for a specific maid
   */
  const loadMaidDetails = useCallback(async (maidId) => {
    if (!agencyId || !maidId) return null;

    try {
      setLoading(true);
      setError(null);

      const { data, errors } = await apolloClient.query({
        query: GET_MAID_DETAILS,
        variables: { maidId },
        fetchPolicy: 'network-only'
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const maidData = data?.maid_profiles_by_pk;

      if (maidData) {
        // Verify this maid belongs to the agency
        if (maidData.agency_id !== agencyId) {
          throw new Error('Maid does not belong to this agency');
        }
        setSelectedMaid(maidData);
        log.info('Loaded maid details:', { maidId });
        return maidData;
      }

      return null;

    } catch (err) {
      log.error('Error loading maid details:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  /**
   * Delete or archive a maid
   */
  const deleteMaid = useCallback(async (maidId, reason = null, hardDelete = false) => {
    if (!agencyId || !maidId) return false;

    try {
      setLoading(true);
      setError(null);

      // Soft delete by setting status to archived
      const { errors } = await apolloClient.mutate({
        mutation: DELETE_MAID,
        variables: { maidId }
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info('Maid archived successfully:', { maidId });
      // Reload the maids list
      await loadMaids();
      return true;

    } catch (err) {
      log.error('Error deleting maid:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [agencyId, loadMaids]);

  /**
   * Bulk upload maids (placeholder - needs implementation)
   */
  const bulkUploadMaids = useCallback(async (maidsData, validateOnly = false) => {
    // TODO: Implement bulk upload via GraphQL mutation
    log.warn('Bulk upload not yet implemented for GraphQL');
    return {
      summary: { total: 0, succeeded: 0, failed: 0 },
      results: []
    };
  }, []);

  /**
   * Update filters and reload maids
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    loadMaids(1, newFilters);
  }, [loadMaids]);

  /**
   * Update sort and reload maids
   */
  const updateSort = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      loadMaids(pagination.page + 1);
    }
  }, [pagination.hasNextPage, pagination.page, loadMaids]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      loadMaids(pagination.page - 1);
    }
  }, [pagination.hasPrevPage, pagination.page, loadMaids]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadMaids(page);
    }
  }, [pagination.totalPages, loadMaids]);

  /**
   * Refresh/reload current view
   */
  const refresh = useCallback(() => {
    loadMaids();
  }, [loadMaids]);

  // Load maids on mount and when sort changes
  useEffect(() => {
    if (agencyId) {
      loadMaids();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId, sortBy, sortOrder]); // loadMaids excluded to prevent infinite loop

  return {
    // State
    maids,
    selectedMaid,
    loading,
    error,
    filters,
    sortBy,
    sortOrder,
    pagination,

    // Actions
    loadMaids,
    loadMaidDetails,
    deleteMaid,
    bulkUploadMaids,
    updateFilters,
    updateSort,
    refresh,

    // Pagination actions
    nextPage,
    prevPage,
    goToPage,

    // Utilities
    clearError: () => setError(null),
    clearSelectedMaid: () => setSelectedMaid(null)
  };
};
