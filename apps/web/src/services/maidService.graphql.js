/**
 * Maid Service - GraphQL Implementation
 * Handles all maid-related operations using Hasura GraphQL API
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';
import {
  GetMaidProfileCompleteDocument,
  GetMaidsWithFiltersDocument,
  GetUserFavoriteMaidsDocument,
  CheckFavoriteStatusDocument,
  UpdateMaidProfileCompleteDocument,
  AddToFavoritesDocument,
  RemoveFromFavoritesDocument,
  IncrementMaidProfileViewsDocument,
} from '@ethio/api-client';

// Query to fetch maid documents
const GET_MAID_DOCUMENTS = gql`
  query GetMaidDocuments($maidId: String!) {
    maid_documents(where: { maid_id: { _eq: $maidId } }) {
      id
      maid_id
      document_type
      document_url
      file_url
      file_path
      status
      created_at
    }
  }
`;

const log = createLogger('MaidService:GraphQL');

/**
 * GraphQL implementation of Maid Service
 */
export const graphqlMaidService = {
  /**
   * Get maids with filtering, pagination, and favorites
   * @param {Object} filters - Filter criteria (country, experience, salary, etc.)
   * @param {Object} options - Pagination and user options
   * @returns {Promise<{data: Array, error: any, pagination: Object}>}
   */
  async getMaids(filters = {}, options = {}) {
    try {
      const { page = 1, pageSize = 20, userId = null } = options;
      const offset = (page - 1) * pageSize;

      // Build GraphQL where clause from filters
      const where = buildMaidFilters(filters);

      log.debug('[GraphQL] Fetching maids with filters:', {
        filters,
        where,
        page,
        pageSize
      });

      const { data, error } = await apolloClient.query({
        query: GetMaidsWithFiltersDocument,
        variables: {
          where,
          limit: pageSize,
          offset,
        },
        fetchPolicy: 'network-only',
      });

      if (error) throw error;

      const maids = data?.maid_profiles || [];
      const total = data?.maid_profiles_aggregate?.aggregate?.count || 0;

      // Batch fetch favorites if user provided
      let favoriteIds = new Set();
      if (userId && maids.length > 0) {
        const maidIds = maids.map(m => m.id);
        const favResult = await this.checkFavoriteStatus(userId, maidIds);
        favoriteIds = favResult.data;
      }

      // Transform and enhance data
      const enhancedMaids = maids.map(maid => ({
        ...maid,
        // full_name is directly on maid_profiles, not nested under profile
        // Only use profile fallback if full_name is not directly available
        full_name: maid.full_name || maid.profile?.full_name,
        phone: maid.phone || maid.profile?.phone,
        avatar_url: maid.avatar_url || maid.profile?.avatar_url,
        // Extract primary image
        primaryImage: maid.maid_images?.[0]?.file_url || null,
        // Add favorite flag
        isFavorite: favoriteIds.has(maid.id),
      }));

      log.info(`[GraphQL] Fetched ${enhancedMaids.length} maids (total: ${total})`);

      return {
        data: enhancedMaids,
        error: null,
        pagination: {
          page,
          pageSize,
          total,
          hasMore: offset + maids.length < total,
        },
      };
    } catch (error) {
      log.error('[GraphQL] Error fetching maids:', error);
      return {
        data: [],
        error,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      };
    }
  },

  /**
   * Get single maid by ID with complete details
   * @param {string} id - Maid profile ID
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async getMaidById(id) {
    try {
      log.debug('[GraphQL] Fetching maid by ID:', id);

      const { data, error } = await apolloClient.query({
        query: GetMaidProfileCompleteDocument,
        variables: { id },
        fetchPolicy: 'network-only',
      });

      if (error) throw error;

      const maid = data?.maid_profiles_by_pk;

      if (!maid) {
        log.warn('[GraphQL] Maid not found:', id);
        return { data: null, error: { message: 'Maid not found' } };
      }

      // Transform data - flatten profile and extract images
      // full_name is directly on maid_profiles, not nested under profile
      const transformedMaid = {
        ...maid,
        // Only use profile fallback if fields are not directly available
        full_name: maid.full_name || maid.profile?.full_name,
        phone: maid.phone || maid.profile?.phone,
        email: maid.email || maid.profile?.email,
        avatar_url: maid.avatar_url || maid.profile?.avatar_url,
        // Extract images
        images: maid.maid_images || [],
        primaryImage: maid.maid_images?.find(img => img.is_primary)?.file_url ||
                     maid.maid_images?.[0]?.file_url ||
                     null,
      };

      log.info('[GraphQL] Fetched maid profile:', transformedMaid.full_name);

      return { data: transformedMaid, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching maid by ID:', error);
      return { data: null, error };
    }
  },

  /**
   * Add maid to user's favorites
   * @param {string} userId - User/Sponsor ID
   * @param {string} maidId - Maid ID
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async addToFavorites(userId, maidId) {
    try {
      log.debug('[GraphQL] Adding to favorites:', { userId, maidId });
      console.log('[GraphQL] Adding to favorites - userId:', userId, 'maidId:', maidId);

      const result = await apolloClient.mutate({
        mutation: AddToFavoritesDocument,
        variables: {
          sponsorId: userId, // Using userId as sponsorId
          maidId
        },
      });

      console.log('[GraphQL] Mutation result:', result);

      if (result.errors && result.errors.length > 0) {
        console.error('[GraphQL] Mutation errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      log.info('[GraphQL] Added to favorites successfully');
      return { data: result.data?.insert_favorites_one, error: null };
    } catch (error) {
      log.error('[GraphQL] Error adding to favorites:', error);
      console.error('[GraphQL] Full error object:', error);
      console.error('[GraphQL] Error message:', error?.message);
      console.error('[GraphQL] GraphQL errors:', error?.graphQLErrors);
      console.error('[GraphQL] Network error:', error?.networkError);
      return { data: null, error };
    }
  },

  /**
   * Remove maid from user's favorites
   * @param {string} userId - User/Sponsor ID
   * @param {string} maidId - Maid ID
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async removeFromFavorites(userId, maidId) {
    try {
      log.debug('[GraphQL] Removing from favorites:', { userId, maidId });

      const { data, error } = await apolloClient.mutate({
        mutation: RemoveFromFavoritesDocument,
        variables: {
          sponsorId: userId, // Using userId as sponsorId
          maidId
        },
      });

      if (error) throw error;

      const affectedRows = data?.delete_favorites?.affected_rows || 0;
      log.info(`[GraphQL] Removed from favorites (${affectedRows} rows affected)`);

      return { data: { affected_rows: affectedRows }, error: null };
    } catch (error) {
      log.error('[GraphQL] Error removing from favorites:', error);
      return { data: null, error };
    }
  },

  /**
   * Check if a maid is in user's favorites (legacy - use checkFavoriteStatus for better performance)
   * @param {string} userId - User/Sponsor ID
   * @param {string} maidId - Maid ID
   * @returns {Promise<{data: boolean, error: any}>}
   */
  async isFavorite(userId, maidId) {
    try {
      const result = await this.checkFavoriteStatus(userId, [maidId]);
      const isFavorited = result.data.has(maidId);

      return { data: isFavorited, error: null };
    } catch (error) {
      log.error('[GraphQL] Error checking if maid is favorite:', error);
      return { data: false, error };
    }
  },

  /**
   * Check favorite status for multiple maids (batch operation - eliminates N+1 queries)
   * @param {string} userId - User/Sponsor ID
   * @param {Array<string>} maidIds - Array of maid IDs
   * @returns {Promise<{data: Set<string>, error: any}>}
   */
  async checkFavoriteStatus(userId, maidIds = []) {
    try {
      if (!userId || maidIds.length === 0) {
        return { data: new Set(), error: null };
      }

      log.debug('[GraphQL] Checking favorite status:', { userId, count: maidIds.length });

      const { data, error } = await apolloClient.query({
        query: CheckFavoriteStatusDocument,
        variables: {
          sponsorId: userId, // Using userId as sponsorId
          maidIds
        },
        fetchPolicy: 'network-only',
      });

      if (error) throw error;

      // Return a Set for O(1) lookup performance
      const favoriteSet = new Set(data?.favorites?.map(f => f.maid_id) || []);

      log.debug(`[GraphQL] Found ${favoriteSet.size} favorites out of ${maidIds.length} maids`);

      return { data: favoriteSet, error: null };
    } catch (error) {
      log.error('[GraphQL] Error checking favorite status:', error);
      return { data: new Set(), error };
    }
  },

  /**
   * Batch check favorites for multiple maids (alias for checkFavoriteStatus)
   * @param {string} userId - User/Sponsor ID
   * @param {Array<string>} maidIds - Array of maid IDs
   * @returns {Promise<{data: Set<string>, error: any}>}
   */
  async getFavoritesForUser(userId, maidIds = []) {
    return this.checkFavoriteStatus(userId, maidIds);
  },

  /**
   * Get user's favorite maids with full details
   * @param {string} userId - User/Sponsor ID
   * @param {Object} options - Pagination options
   * @returns {Promise<{data: Array, error: any, pagination: Object}>}
   */
  async getUserFavorites(userId, options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;
      const offset = (page - 1) * pageSize;

      log.debug('[GraphQL] Fetching user favorites:', { userId, page, pageSize });

      const { data, error } = await apolloClient.query({
        query: GetUserFavoriteMaidsDocument,
        variables: {
          sponsorId: userId, // Using userId as sponsorId
          limit: pageSize,
          offset
        },
        fetchPolicy: 'network-only',
      });

      if (error) throw error;

      const favorites = data?.favorites || [];
      const total = data?.favorites_aggregate?.aggregate?.count || 0;

      // For each favorite, fetch the full maid details
      const maidIds = favorites.map(fav => fav.maid_id);
      const maidsData = await Promise.all(
        maidIds.map(id => this.getMaidById(id))
      );

      // Combine favorites metadata with maid details
      const transformedFavorites = favorites.map((fav, index) => ({
        ...maidsData[index].data,
        favorited_at: fav.created_at,
      })).filter(Boolean); // Filter out any null results

      log.info(`[GraphQL] Fetched ${transformedFavorites.length} favorites (total: ${total})`);

      return {
        data: transformedFavorites,
        error: null,
        pagination: {
          page,
          pageSize,
          total,
          hasMore: offset + favorites.length < total,
        },
      };
    } catch (error) {
      log.error('[GraphQL] Error fetching user favorites:', error);
      return {
        data: [],
        error,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      };
    }
  },

  /**
   * Update maid profile
   * @param {string} userId - Maid user ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async updateMaidProfile(userId, profileData) {
    try {
      log.debug('[GraphQL] Updating maid profile:', userId);

      const { data, error } = await apolloClient.mutate({
        mutation: UpdateMaidProfileCompleteDocument,
        variables: {
          id: userId,
          data: profileData
        },
      });

      if (error) throw error;

      log.info('[GraphQL] Updated maid profile successfully');
      return { data: data?.update_maid_profiles_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating maid profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Upload profile picture (uses Supabase Storage - hybrid approach)
   * Note: This method is kept as a hybrid - GraphQL for metadata, Supabase for storage
   * @param {string} userId - Maid user ID
   * @param {File} file - Image file to upload
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async uploadProfilePicture(userId, file) {
    log.warn('[GraphQL] uploadProfilePicture uses Supabase Storage (hybrid approach)');
    log.debug('[GraphQL] This method should be routed to Supabase implementation');

    // This will be handled by the hybrid approach in the main service
    return {
      data: null,
      error: { message: 'This method requires Supabase Storage implementation' }
    };
  },

  /**
   * Get signed URLs for all maid profile photos (uses Supabase Storage - hybrid approach)
   * Note: This method is kept as a hybrid - GraphQL for metadata, Supabase for storage
   * @param {string} userId - Maid user ID
   * @param {number} expiresInSeconds - URL expiration time
   * @returns {Promise<{data: Array|null, error: any}>}
   */
  async getMaidPhotoUrls(userId, expiresInSeconds = 3600) {
    log.warn('[GraphQL] getMaidPhotoUrls uses Supabase Storage (hybrid approach)');
    log.debug('[GraphQL] This method should be routed to Supabase implementation');

    // This will be handled by the hybrid approach in the main service
    return {
      data: null,
      error: { message: 'This method requires Supabase Storage implementation' }
    };
  },

  /**
   * Get maid documents by maid ID
   * @param {string} maidId - Maid profile ID
   * @returns {Promise<{data: Array|null, error: any}>}
   */
  async getMaidDocuments(maidId) {
    try {
      log.debug('[GraphQL] Fetching maid documents:', maidId);

      const { data, error } = await apolloClient.query({
        query: GET_MAID_DOCUMENTS,
        variables: { maidId },
        fetchPolicy: 'network-only',
      });

      if (error) throw error;

      // Normalize document URLs
      const documents = (data?.maid_documents || []).map(doc => ({
        ...doc,
        url: doc.document_url || doc.file_url,
      }));

      log.info('[GraphQL] Fetched maid documents:', documents.length);
      return { data: documents, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching maid documents:', error);
      return { data: null, error };
    }
  },

  /**
   * Increment profile views count
   * @param {string} maidId - Maid profile ID
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async incrementProfileViews(maidId) {
    try {
      log.debug('[GraphQL] Incrementing profile views:', maidId);

      const { data, error } = await apolloClient.mutate({
        mutation: IncrementMaidProfileViewsDocument,
        variables: { id: maidId },
      });

      if (error) throw error;

      const newViewCount = data?.update_maid_profiles_by_pk?.profile_views;
      log.info('[GraphQL] Profile views incremented:', newViewCount);
      return { data: { profile_views: newViewCount }, error: null };
    } catch (error) {
      log.error('[GraphQL] Error incrementing profile views:', error);
      return { data: null, error };
    }
  },

  /**
   * Real-time subscription methods (uses Supabase Realtime - hybrid approach)
   * Note: These methods are kept as hybrid - GraphQL for data, Supabase for real-time
   */
  subscribeMaidProfiles(callback, filters = {}) {
    log.warn('[GraphQL] subscribeMaidProfiles uses Supabase Realtime (hybrid approach)');
    log.debug('[GraphQL] This method should be routed to Supabase implementation');

    return () => {
      log.debug('[GraphQL] Unsubscribe called (no-op in GraphQL implementation)');
    };
  },

  subscribeUserProfile(callback, userId) {
    log.warn('[GraphQL] subscribeUserProfile uses Supabase Realtime (hybrid approach)');
    log.debug('[GraphQL] This method should be routed to Supabase implementation');

    return () => {
      log.debug('[GraphQL] Unsubscribe called (no-op in GraphQL implementation)');
    };
  },

  unsubscribeAll() {
    log.warn('[GraphQL] unsubscribeAll uses Supabase Realtime (hybrid approach)');
    log.debug('[GraphQL] This method should be routed to Supabase implementation');
  },
};

/**
 * Build GraphQL where clause from filter object
 * Translates UI filter format to Hasura where clause format
 * @param {Object} filters - Filter object from UI
 * @returns {Object} Hasura where clause
 */
function buildMaidFilters(filters) {
  const where = {
    _and: [],
  };

  // By default, only show verified maids on public listings
  // This ensures only admin-approved profiles appear in search results
  // The verification_status is set to 'verified' when admin approves a maid
  if (!filters.includeAllStatuses) {
    where._and.push({
      verification_status: { _eq: 'verified' },
    });
  }

  // Availability status - only filter if explicitly specified
  // Show all maids by default (available, active, pending, etc.)
  if (filters.availabilityStatus && filters.availabilityStatus !== 'all') {
    where._and.push({
      availability_status: { _eq: filters.availabilityStatus },
    });
  }

  // Country/Nationality filter
  if (filters.country && filters.country !== 'all') {
    where._and.push({
      nationality: { _eq: filters.country },
    });
  }

  // Experience years filter
  if (filters.experience && filters.experience !== 'all') {
    if (filters.experience.includes('+')) {
      // "5+" format
      const minExp = parseInt(filters.experience.replace('+', ''));
      where._and.push({ experience_years: { _gte: minExp } });
    } else if (filters.experience.includes('-')) {
      // "1-3" format
      const [min, max] = filters.experience.split('-').map(Number);
      where._and.push({
        experience_years: { _gte: min, _lte: max },
      });
    } else {
      // Exact match
      const exp = parseInt(filters.experience);
      where._and.push({ experience_years: { _eq: exp } });
    }
  }

  // Visa status filter
  if (filters.visaStatus && filters.visaStatus !== 'all') {
    where._and.push({
      visa_status: { _eq: filters.visaStatus },
    });
  }

  // Salary range filter
  if (filters.salaryRange && Array.isArray(filters.salaryRange)) {
    const [min, max] = filters.salaryRange;
    if (min !== null && min !== undefined) {
      where._and.push({ preferred_salary_min: { _gte: min } });
    }
    if (max !== null && max !== undefined) {
      where._and.push({ preferred_salary_max: { _lte: max } });
    }
  }

  // Location filter (search in current_location or preferred_work_location)
  if (filters.location) {
    where._and.push({
      _or: [
        { current_location: { _ilike: `%${filters.location}%` } },
      ],
    });
  }

  // Search by name
  if (filters.search) {
    where._and.push({
      full_name: { _ilike: `%${filters.search}%` },
    });
  }

  // Skills filter (array contains)
  if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
    where._and.push({
      skills: { _contains: filters.skills },
    });
  }

  // Languages filter (array contains)
  if (filters.languages && Array.isArray(filters.languages) && filters.languages.length > 0) {
    where._and.push({
      languages: { _contains: filters.languages },
    });
  }

  // Verification status filter
  if (filters.verificationStatus && filters.verificationStatus !== 'all') {
    where._and.push({
      verification_status: { _eq: filters.verificationStatus },
    });
  }

  // Return empty object if no filters, otherwise return the where clause
  return where._and.length > 0 ? where : {};
}

export default graphqlMaidService;
