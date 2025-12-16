import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminListingsService');

// ============================================
// GraphQL Queries
// ============================================

const GET_ADMIN_LISTINGS = gql`
  query GetAdminListings(
    $where: jobs_bool_exp
    $orderBy: [jobs_order_by!]
    $limit: Int!
    $offset: Int!
  ) {
    jobs(
      where: $where
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      title
      description
      job_type
      status
      location
      city
      country
      salary_min
      salary_max
      currency
      salary_period
      required_skills
      requirements
      benefits
      languages_required
      preferred_nationality
      minimum_experience_years
      live_in_required
      working_hours_per_day
      days_off_per_week
      featured
      featured_until
      urgent
      urgency_level
      views_count
      applications_count
      max_applications
      expires_at
      created_at
      updated_at
      sponsor_id
      sponsor_profile {
        id
        full_name
        country
        city
      }
    }
    jobs_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GET_ADMIN_LISTING_BY_ID = gql`
  query GetAdminListingById($id: uuid!) {
    jobs_by_pk(id: $id) {
      id
      title
      description
      job_type
      status
      location
      address
      city
      country
      salary_min
      salary_max
      currency
      salary_period
      required_skills
      requirements
      benefits
      languages_required
      preferred_nationality
      minimum_experience_years
      education_requirement
      age_preference_min
      age_preference_max
      live_in_required
      accommodation
      working_hours_per_day
      working_days_per_week
      days_off_per_week
      overtime_available
      contract_duration
      contract_duration_months
      probation_period_months
      start_date
      end_date
      featured
      featured_until
      urgent
      urgency_level
      views_count
      applications_count
      max_applications
      auto_expire_days
      requires_approval
      expires_at
      created_at
      updated_at
      sponsor_id
      sponsor_profile {
        id
        full_name
        phone_number
        country
        city
        address
        average_rating
        total_hires
        identity_verified
      }
      applications_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

const GET_ADMIN_LISTINGS_STATS = gql`
  query GetAdminListingsStats {
    total: jobs_aggregate {
      aggregate {
        count
      }
    }
    active: jobs_aggregate(where: { status: { _eq: "active" } }) {
      aggregate {
        count
      }
    }
    draft: jobs_aggregate(where: { status: { _eq: "draft" } }) {
      aggregate {
        count
      }
    }
    paused: jobs_aggregate(where: { status: { _eq: "paused" } }) {
      aggregate {
        count
      }
    }
    filled: jobs_aggregate(where: { status: { _eq: "filled" } }) {
      aggregate {
        count
      }
    }
    expired: jobs_aggregate(where: { status: { _eq: "expired" } }) {
      aggregate {
        count
      }
    }
    cancelled: jobs_aggregate(where: { status: { _eq: "cancelled" } }) {
      aggregate {
        count
      }
    }
    featured: jobs_aggregate(where: { featured: { _eq: true } }) {
      aggregate {
        count
      }
    }
    urgent: jobs_aggregate(where: { urgent: { _eq: true } }) {
      aggregate {
        count
      }
    }
    total_applications: jobs_aggregate {
      aggregate {
        sum {
          applications_count
        }
      }
    }
    total_views: jobs_aggregate {
      aggregate {
        sum {
          views_count
        }
      }
    }
  }
`;

// ============================================
// GraphQL Mutations
// ============================================

const UPDATE_JOB_STATUS = gql`
  mutation UpdateJobStatus($id: uuid!, $status: String!) {
    update_jobs_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
      updated_at
    }
  }
`;

const UPDATE_JOB = gql`
  mutation UpdateJob($id: uuid!, $data: jobs_set_input!) {
    update_jobs_by_pk(
      pk_columns: { id: $id }
      _set: $data
    ) {
      id
      title
      status
      featured
      urgent
      updated_at
    }
  }
`;

const TOGGLE_JOB_FEATURED = gql`
  mutation ToggleJobFeatured($id: uuid!, $featured: Boolean!, $featuredUntil: timestamptz) {
    update_jobs_by_pk(
      pk_columns: { id: $id }
      _set: { featured: $featured, featured_until: $featuredUntil }
    ) {
      id
      featured
      featured_until
      updated_at
    }
  }
`;

const TOGGLE_JOB_URGENT = gql`
  mutation ToggleJobUrgent($id: uuid!, $urgent: Boolean!, $urgencyLevel: String!) {
    update_jobs_by_pk(
      pk_columns: { id: $id }
      _set: { urgent: $urgent, urgency_level: $urgencyLevel }
    ) {
      id
      urgent
      urgency_level
      updated_at
    }
  }
`;

const DELETE_JOB = gql`
  mutation DeleteJob($id: uuid!) {
    delete_jobs_by_pk(id: $id) {
      id
    }
  }
`;

// ============================================
// Service Functions
// ============================================

/**
 * Build GraphQL where clause for admin listing filters
 */
function buildAdminListingFilters(filters) {
  if (!filters) return {};

  const conditions = [];

  // Status filter
  if (filters.status && filters.status !== 'all') {
    conditions.push({ status: { _eq: filters.status } });
  }

  // Job type filter
  if (filters.jobType && filters.jobType !== 'all') {
    conditions.push({ job_type: { _eq: filters.jobType } });
  }

  // Country filter
  if (filters.country && filters.country !== 'all') {
    conditions.push({ country: { _eq: filters.country } });
  }

  // Featured filter
  if (filters.featured === true) {
    conditions.push({ featured: { _eq: true } });
  }

  // Urgent filter
  if (filters.urgent === true) {
    conditions.push({ urgent: { _eq: true } });
  }

  // Date range filter
  if (filters.dateFrom) {
    conditions.push({ created_at: { _gte: filters.dateFrom } });
  }
  if (filters.dateTo) {
    conditions.push({ created_at: { _lte: filters.dateTo } });
  }

  // Search term
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const term = `%${filters.searchTerm.trim()}%`;
    conditions.push({
      _or: [
        { title: { _ilike: term } },
        { description: { _ilike: term } },
        { city: { _ilike: term } },
        { country: { _ilike: term } },
      ],
    });
  }

  return conditions.length > 0 ? { _and: conditions } : {};
}

/**
 * Build order_by clause
 */
function buildOrderBy(sortBy, sortDirection = 'desc') {
  const direction = sortDirection === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'title':
      return [{ title: direction }];
    case 'status':
      return [{ status: direction }];
    case 'applications':
      return [{ applications_count: direction }];
    case 'views':
      return [{ views_count: direction }];
    case 'salary':
      return [{ salary_min: direction }];
    case 'expires':
      return [{ expires_at: direction }];
    case 'created':
    default:
      return [{ created_at: direction }];
  }
}

export const adminListingsService = {
  /**
   * Get all listings with filtering, search, sorting, and pagination
   */
  async getListings({
    filters = {},
    sortBy = 'created',
    sortDirection = 'desc',
    page = 1,
    limit = 20,
  } = {}) {
    try {
      const where = buildAdminListingFilters(filters);
      const orderBy = buildOrderBy(sortBy, sortDirection);
      const offset = (page - 1) * limit;

      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_LISTINGS,
        variables: { where, orderBy, limit, offset },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const listings = data?.jobs || [];
      const totalCount = data?.jobs_aggregate?.aggregate?.count || 0;

      log.debug(`[AdminListings] Fetched ${listings.length} listings (total: ${totalCount})`);

      return {
        data: {
          listings,
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        error: null,
      };
    } catch (error) {
      log.error('[AdminListings] Error fetching listings:', error);
      return { data: null, error };
    }
  },

  /**
   * Get single listing by ID with full details
   */
  async getListingById(listingId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_LISTING_BY_ID,
        variables: { id: listingId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.jobs_by_pk, error: null };
    } catch (error) {
      log.error('[AdminListings] Error fetching listing:', error);
      return { data: null, error };
    }
  },

  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_LISTINGS_STATS,
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const stats = {
        total: data?.total?.aggregate?.count || 0,
        active: data?.active?.aggregate?.count || 0,
        draft: data?.draft?.aggregate?.count || 0,
        paused: data?.paused?.aggregate?.count || 0,
        filled: data?.filled?.aggregate?.count || 0,
        expired: data?.expired?.aggregate?.count || 0,
        cancelled: data?.cancelled?.aggregate?.count || 0,
        featured: data?.featured?.aggregate?.count || 0,
        urgent: data?.urgent?.aggregate?.count || 0,
        totalApplications: data?.total_applications?.aggregate?.sum?.applications_count || 0,
        totalViews: data?.total_views?.aggregate?.sum?.views_count || 0,
      };

      log.debug('[AdminListings] Fetched stats:', stats);
      return { data: stats, error: null };
    } catch (error) {
      log.error('[AdminListings] Error fetching stats:', error);
      return { data: null, error };
    }
  },

  /**
   * Update job status (active, paused, filled, expired, cancelled)
   */
  async updateStatus(listingId, status) {
    try {
      const validStatuses = ['draft', 'active', 'paused', 'filled', 'expired', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_JOB_STATUS,
        variables: { id: listingId, status },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminListings] Status updated: ${listingId} -> ${status}`);
      return { data: data?.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[AdminListings] Error updating status:', error);
      return { data: null, error };
    }
  },

  /**
   * Update job data
   */
  async updateListing(listingId, listingData) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_JOB,
        variables: { id: listingId, data: listingData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminListings] Listing updated: ${listingId}`);
      return { data: data?.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[AdminListings] Error updating listing:', error);
      return { data: null, error };
    }
  },

  /**
   * Toggle featured status
   */
  async toggleFeatured(listingId, featured, daysToFeature = 7) {
    try {
      let featuredUntil = null;
      if (featured) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysToFeature);
        featuredUntil = futureDate.toISOString();
      }

      const { data, errors } = await apolloClient.mutate({
        mutation: TOGGLE_JOB_FEATURED,
        variables: { id: listingId, featured, featuredUntil },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminListings] Featured toggled: ${listingId} -> ${featured}`);
      return { data: data?.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[AdminListings] Error toggling featured:', error);
      return { data: null, error };
    }
  },

  /**
   * Toggle urgent status
   */
  async toggleUrgent(listingId, urgent) {
    try {
      const urgencyLevel = urgent ? 'urgent' : 'normal';

      const { data, errors } = await apolloClient.mutate({
        mutation: TOGGLE_JOB_URGENT,
        variables: { id: listingId, urgent, urgencyLevel },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminListings] Urgent toggled: ${listingId} -> ${urgent}`);
      return { data: data?.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[AdminListings] Error toggling urgent:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a listing permanently
   */
  async deleteListing(listingId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: DELETE_JOB,
        variables: { id: listingId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminListings] Listing deleted: ${listingId}`);
      return { data: data?.delete_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[AdminListings] Error deleting listing:', error);
      return { data: null, error };
    }
  },

  /**
   * Archive a listing (soft delete by setting status to cancelled)
   */
  async archiveListing(listingId) {
    return this.updateStatus(listingId, 'cancelled');
  },

  /**
   * Activate a listing
   */
  async activateListing(listingId) {
    return this.updateStatus(listingId, 'active');
  },

  /**
   * Pause a listing
   */
  async pauseListing(listingId) {
    return this.updateStatus(listingId, 'paused');
  },
};

export default adminListingsService;
