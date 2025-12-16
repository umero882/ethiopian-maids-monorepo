/**
 * Sponsor Service - GraphQL Implementation
 * Handles sponsor operations using GraphQL/Hasura
 *
 * Now includes: profiles, favorites, maid search, and dashboard stats
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';
import {
  GetSponsorProfileCompleteDocument,
  GetSponsorProfileDocument,
  ListSponsorProfilesDocument,
  CreateSponsorProfileDocument,
  UpdateSponsorProfileDocument,
  DeleteSponsorProfileDocument,
  IncrementActiveJobPostingsDocument,
  DecrementActiveJobPostingsDocument,
  IncrementTotalHiresDocument,
  UpdateSponsorAverageRatingDocument,
} from '@ethio/api-client';

const log = createLogger('SponsorService:GraphQL');

/**
 * GraphQL-based sponsor service implementation
 * Focuses on sponsor_profiles table operations
 */
export const graphqlSponsorService = {

  // ============================================================================
  // SPONSOR PROFILE CRUD OPERATIONS
  // ============================================================================

  /**
   * Get sponsor profile by user ID
   * @param {string} userId - The user ID
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async getSponsorProfile(userId) {
    try {
      log.debug('[GraphQL] Fetching sponsor profile:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetSponsorProfileCompleteDocument,
        variables: { id: userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('[GraphQL] Error fetching sponsor profile:', errors);
        return { data: null, error: errors[0] };
      }

      const profile = data?.sponsor_profiles_by_pk;

      // If profile doesn't exist, return special error code like Supabase version
      if (!profile) {
        log.info('[GraphQL] Sponsor profile not found for user:', userId);
        return {
          data: null,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' }
        };
      }

      // Map database column names to what the UI expects
      // Database: household_size, number_of_children
      // UI expects: family_size, children_count
      const mappedData = {
        ...profile,
        family_size: profile.household_size,
        children_count: profile.number_of_children,
      };

      log.info('[GraphQL] Sponsor profile loaded successfully:', userId);
      return { data: mappedData, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception fetching sponsor profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Create sponsor profile
   * @param {string} userId - The user ID
   * @param {object} profileData - Profile data to create
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async createSponsorProfile(userId, profileData) {
    try {
      log.debug('[GraphQL] Creating sponsor profile for user:', userId);

      // Map UI field names to database column names
      const mappedData = {
        id: userId,
        full_name: profileData.full_name || profileData.name || '',
        household_size: parseInt(profileData.family_size) || 1,
        number_of_children: parseInt(profileData.children_count) || 0,
        children_ages: Array.isArray(profileData.children_ages) ? profileData.children_ages : [],
        elderly_care_needed: Boolean(profileData.elderly_care_needed),
        pets: Boolean(profileData.pets),
        pet_types: Array.isArray(profileData.pet_types) ? profileData.pet_types : [],
        city: profileData.city || '',
        country: profileData.country || '',
        address: profileData.address || '',
        accommodation_type: profileData.accommodation_type || '',
        preferred_nationality: Array.isArray(profileData.preferred_nationality)
          ? profileData.preferred_nationality : [],
        preferred_experience_years: parseInt(profileData.preferred_experience_years) || 0,
        required_skills: Array.isArray(profileData.required_skills)
          ? profileData.required_skills : [],
        preferred_languages: Array.isArray(profileData.preferred_languages)
          ? profileData.preferred_languages : [],
        salary_budget_min: profileData.salary_budget_min
          ? parseInt(profileData.salary_budget_min) : null,
        salary_budget_max: profileData.salary_budget_max
          ? parseInt(profileData.salary_budget_max) : null,
        currency: profileData.currency || 'USD',
        live_in_required: profileData.live_in_required !== false,
        working_hours_per_day: parseInt(profileData.working_hours_per_day) || 8,
        days_off_per_week: parseInt(profileData.days_off_per_week) || 1,
        overtime_available: Boolean(profileData.overtime_available),
        additional_benefits: Array.isArray(profileData.additional_benefits)
          ? profileData.additional_benefits : [],
        identity_verified: Boolean(profileData.identity_verified),
        background_check_completed: Boolean(profileData.background_check_completed),
        active_job_postings: parseInt(profileData.active_job_postings) || 0,
        total_hires: parseInt(profileData.total_hires) || 0,
        average_rating: parseFloat(profileData.average_rating) || 0.0,
      };

      log.debug('[GraphQL] Mapped data for creation:', mappedData);

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateSponsorProfileDocument,
        variables: { data: mappedData },
      });

      if (errors) {
        log.error('[GraphQL] Error creating sponsor profile:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Sponsor profile created successfully:', data.insert_sponsor_profiles_one.id);
      return { data: data.insert_sponsor_profiles_one, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception creating sponsor profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update sponsor profile
   * @param {string} userId - The user ID
   * @param {object} profileData - Profile data to update
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async updateSponsorProfile(userId, profileData) {
    try {
      log.debug('[GraphQL] Updating sponsor profile for user:', userId);
      log.debug('[GraphQL] Profile data received:', profileData);

      // Map UI field names to database column names
      const mappedData = {
        full_name: profileData.full_name || profileData.name,
        household_size: profileData.family_size !== undefined
          ? parseInt(profileData.family_size) : undefined,
        number_of_children: profileData.children_count !== undefined
          ? parseInt(profileData.children_count) : undefined,
        children_ages: profileData.children_ages,
        elderly_care_needed: profileData.elderly_care_needed !== undefined
          ? Boolean(profileData.elderly_care_needed) : undefined,
        pets: profileData.pets !== undefined ? Boolean(profileData.pets) : undefined,
        pet_types: profileData.pet_types,
        city: profileData.city,
        country: profileData.country,
        address: profileData.address,
        accommodation_type: profileData.accommodation_type,
        preferred_nationality: profileData.preferred_nationality,
        preferred_experience_years: profileData.preferred_experience_years !== undefined
          ? parseInt(profileData.preferred_experience_years) : undefined,
        required_skills: profileData.required_skills,
        preferred_languages: profileData.preferred_languages,
        salary_budget_min: profileData.salary_budget_min !== null && profileData.salary_budget_min !== ''
          ? parseInt(profileData.salary_budget_min) : null,
        salary_budget_max: profileData.salary_budget_max !== null && profileData.salary_budget_max !== ''
          ? parseInt(profileData.salary_budget_max) : null,
        currency: profileData.currency,
        live_in_required: profileData.live_in_required !== undefined
          ? Boolean(profileData.live_in_required) : undefined,
        working_hours_per_day: profileData.working_hours_per_day !== undefined
          ? parseInt(profileData.working_hours_per_day) : undefined,
        days_off_per_week: profileData.days_off_per_week !== undefined
          ? parseInt(profileData.days_off_per_week) : undefined,
        overtime_available: profileData.overtime_available !== undefined
          ? Boolean(profileData.overtime_available) : undefined,
        additional_benefits: profileData.additional_benefits,
        identity_verified: profileData.identity_verified !== undefined
          ? Boolean(profileData.identity_verified) : undefined,
        background_check_completed: profileData.background_check_completed !== undefined
          ? Boolean(profileData.background_check_completed) : undefined,
      };

      // Remove undefined values
      Object.keys(mappedData).forEach(key =>
        mappedData[key] === undefined && delete mappedData[key]
      );

      log.debug('[GraphQL] Mapped data for update:', mappedData);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateSponsorProfileDocument,
        variables: {
          id: userId,
          data: mappedData
        },
      });

      if (errors) {
        log.error('[GraphQL] Error updating sponsor profile:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Sponsor profile updated successfully:', userId);
      return { data: data.update_sponsor_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception updating sponsor profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Delete sponsor profile
   * @param {string} userId - The user ID
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async deleteSponsorProfile(userId) {
    try {
      log.debug('[GraphQL] Deleting sponsor profile:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteSponsorProfileDocument,
        variables: { id: userId },
      });

      if (errors) {
        log.error('[GraphQL] Error deleting sponsor profile:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Sponsor profile deleted successfully:', userId);
      return { data: data.delete_sponsor_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception deleting sponsor profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // SPONSOR STATISTICS OPERATIONS
  // ============================================================================

  /**
   * Increment active job postings counter
   * @param {string} userId - The user ID
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async incrementActiveJobPostings(userId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: IncrementActiveJobPostingsDocument,
        variables: { id: userId },
      });

      if (errors) {
        log.error('[GraphQL] Error incrementing job postings:', errors);
        return { data: null, error: errors[0] };
      }

      log.debug('[GraphQL] Incremented active job postings for:', userId);
      return { data: data.update_sponsor_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception incrementing job postings:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Decrement active job postings counter
   * @param {string} userId - The user ID
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async decrementActiveJobPostings(userId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: DecrementActiveJobPostingsDocument,
        variables: { id: userId },
      });

      if (errors) {
        log.error('[GraphQL] Error decrementing job postings:', errors);
        return { data: null, error: errors[0] };
      }

      log.debug('[GraphQL] Decremented active job postings for:', userId);
      return { data: data.update_sponsor_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception decrementing job postings:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Increment total hires counter
   * @param {string} userId - The user ID
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async incrementTotalHires(userId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: IncrementTotalHiresDocument,
        variables: { id: userId },
      });

      if (errors) {
        log.error('[GraphQL] Error incrementing total hires:', errors);
        return { data: null, error: errors[0] };
      }

      log.debug('[GraphQL] Incremented total hires for:', userId);
      return { data: data.update_sponsor_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception incrementing total hires:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update average rating
   * @param {string} userId - The user ID
   * @param {number} rating - The new average rating
   * @returns {Promise<{data: object | null, error: object | null}>}
   */
  async updateAverageRating(userId, rating) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateSponsorAverageRatingDocument,
        variables: { id: userId, rating },
      });

      if (errors) {
        log.error('[GraphQL] Error updating average rating:', errors);
        return { data: null, error: errors[0] };
      }

      log.debug('[GraphQL] Updated average rating for:', userId);
      return { data: data.update_sponsor_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception updating average rating:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // FAVORITES OPERATIONS
  // ============================================================================

  /**
   * Add maid to favorites
   */
  async addToFavorites(maidId, notes = '') {
    try {
      log.debug('[GraphQL] Adding maid to favorites:', maidId);

      // Get current user from auth context
      const userId = await this._getCurrentUserId();

      const AddToFavoritesDocument = gql`
        mutation AddToFavorites($sponsorId: String!, $maidId: String!) {
          insert_favorites_one(
            object: { sponsor_id: $sponsorId, maid_id: $maidId }
            on_conflict: { constraint: favorites_sponsor_id_maid_id_key, update_columns: [] }
          ) {
            sponsor_id
            maid_id
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: AddToFavoritesDocument,
        variables: {
          sponsorId: userId,
          maidId: maidId,
        },
      });

      if (errors) {
        log.error('[GraphQL] Error adding to favorites:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Added to favorites successfully');
      return { data: data?.insert_favorites_one, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception adding to favorites:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Remove maid from favorites
   */
  async removeFromFavorites(maidId) {
    try {
      log.debug('[GraphQL] Removing maid from favorites:', maidId);

      const userId = await this._getCurrentUserId();

      // Note: sponsor_id and maid_id use String type (Firebase UID)
      const RemoveFromFavoritesDocument = gql`
        mutation RemoveFromFavorites($sponsor_id: String!, $maid_id: String!) {
          delete_favorites(
            where: {
              sponsor_id: {_eq: $sponsor_id}
              maid_id: {_eq: $maid_id}
            }
          ) {
            affected_rows
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: RemoveFromFavoritesDocument,
        variables: {
          sponsor_id: userId,
          maid_id: maidId,
        },
      });

      if (errors) {
        log.error('[GraphQL] Error removing from favorites:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Removed from favorites successfully');
      return { data: { affected_rows: data.delete_favorites.affected_rows }, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception removing from favorites:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Check if maid is favorited
   */
  async checkIfFavorited(maidId) {
    try {
      log.debug('[GraphQL] Checking if maid is favorited:', maidId);

      const userId = await this._getCurrentUserId();

      // Note: sponsor_id and maid_id use String type (Firebase UID)
      const CheckFavoritedDocument = gql`
        query CheckFavorited($sponsor_id: String!, $maid_id: String!) {
          favorites(
            where: {
              sponsor_id: {_eq: $sponsor_id}
              maid_id: {_eq: $maid_id}
            }
            limit: 1
          ) {
            id
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: CheckFavoritedDocument,
        variables: {
          sponsor_id: userId,
          maid_id: maidId,
        },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Error checking favorites:', errors);
        return { data: false, error: errors[0] };
      }

      const isFavorited = data.favorites && data.favorites.length > 0;
      log.debug('[GraphQL] Is favorited:', isFavorited);
      return { data: isFavorited, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception checking favorites:', error);
      return { data: false, error: { message: error.message } };
    }
  },

  /**
   * Get all favorites
   */
  async getFavorites() {
    try {
      log.debug('[GraphQL] Fetching favorites');

      const userId = await this._getCurrentUserId();

      // Note: sponsor_id uses String type (Firebase UID)
      const GetFavoritesDocument = gql`
        query GetFavorites($sponsor_id: String!) {
          favorites(
            where: {sponsor_id: {_eq: $sponsor_id}}
            order_by: {created_at: desc}
          ) {
            id
            maid_id
            notes
            created_at
            maid_profile {
              id
              full_name
              nationality
              years_experience
              skills
              photo_url
              availability_status
              hourly_rate
              monthly_salary
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetFavoritesDocument,
        variables: { sponsor_id: userId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Error fetching favorites:', errors);
        return { data: [], error: errors[0] };
      }

      log.info('[GraphQL] Fetched favorites:', data.favorites.length);
      return { data: data.favorites, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception fetching favorites:', error);
      return { data: [], error: { message: error.message } };
    }
  },

  // ============================================================================
  // MAID SEARCH AND PROFILE OPERATIONS
  // ============================================================================

  /**
   * Search for maids with filters
   */
  async searchMaids(filters = {}) {
    try {
      log.debug('[GraphQL] Searching maids with filters:', filters);

      // Build where clause
      const where = {};

      if (filters.skills && filters.skills.length > 0) {
        where.skills = { _contains: filters.skills };
      }

      if (filters.nationality) {
        where.nationality = { _eq: filters.nationality };
      }

      if (filters.minExperience) {
        where.years_experience = { _gte: parseInt(filters.minExperience) };
      }

      if (filters.maxSalary) {
        where.monthly_salary = { _lte: parseInt(filters.maxSalary) };
      }

      if (filters.availability) {
        where.availability_status = { _eq: filters.availability };
      }

      const SearchMaidsDocument = gql`
        query SearchMaids(
          $where: maid_profiles_bool_exp
          $limit: Int = 20
          $offset: Int = 0
        ) {
          maid_profiles(
            where: $where
            limit: $limit
            offset: $offset
            order_by: {created_at: desc}
          ) {
            id
            full_name
            nationality
            years_experience
            skills
            languages
            photo_url
            availability_status
            hourly_rate
            monthly_salary
            bio
            religion
            marital_status
            date_of_birth
          }
          maid_profiles_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: SearchMaidsDocument,
        variables: {
          where,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Error searching maids:', errors);
        return { data: [], error: errors[0] };
      }

      log.info('[GraphQL] Found maids:', data.maid_profiles.length);
      return {
        data: data.maid_profiles,
        total: data.maid_profiles_aggregate.aggregate.count,
        error: null,
      };

    } catch (error) {
      log.error('[GraphQL] Exception searching maids:', error);
      return { data: [], error: { message: error.message } };
    }
  },

  /**
   * Get maid profile with stats
   */
  async getMaidProfile(maidId) {
    try {
      log.debug('[GraphQL] Fetching maid profile:', maidId);

      // Note: maid_profiles.id uses String type (Firebase UID)
      const GetMaidProfileDocument = gql`
        query GetMaidProfile($id: String!) {
          maid_profiles_by_pk(id: $id) {
            id
            full_name
            nationality
            years_experience
            skills
            languages
            photo_url
            availability_status
            hourly_rate
            monthly_salary
            bio
            religion
            marital_status
            date_of_birth
            education_level
            previous_employers
            special_skills
            dietary_restrictions
            medical_conditions
            total_bookings
            successful_placements
            average_rating
            created_at
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetMaidProfileDocument,
        variables: { id: maidId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Error fetching maid profile:', errors);
        return { data: null, error: errors[0] };
      }

      if (!data.maid_profiles_by_pk) {
        return { data: null, error: { code: 'PROFILE_NOT_FOUND', message: 'Maid profile not found' } };
      }

      log.info('[GraphQL] Maid profile fetched successfully');
      return { data: data.maid_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception fetching maid profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get recommended maids (simple algorithm based on preferences)
   */
  async getRecommendedMaids(limit = 10) {
    try {
      log.debug('[GraphQL] Fetching recommended maids');

      const userId = await this._getCurrentUserId();

      // Get sponsor preferences
      const { data: sponsorData } = await this.getSponsorProfile(userId);

      if (!sponsorData) {
        // No preferences, return popular maids
        return this.searchMaids({ limit });
      }

      // Build recommendations based on preferences
      const where = {};

      if (sponsorData.preferred_nationality && sponsorData.preferred_nationality.length > 0) {
        where.nationality = { _in: sponsorData.preferred_nationality };
      }

      if (sponsorData.preferred_experience_years > 0) {
        where.years_experience = { _gte: sponsorData.preferred_experience_years };
      }

      if (sponsorData.required_skills && sponsorData.required_skills.length > 0) {
        where.skills = { _contains: sponsorData.required_skills };
      }

      if (sponsorData.salary_budget_max) {
        where.monthly_salary = { _lte: sponsorData.salary_budget_max };
      }

      where.availability_status = { _eq: 'available' };

      const GetRecommendedMaidsDocument = gql`
        query GetRecommendedMaids($where: maid_profiles_bool_exp, $limit: Int!) {
          maid_profiles(
            where: $where
            limit: $limit
            order_by: {average_rating: desc_nulls_last, total_bookings: desc}
          ) {
            id
            full_name
            nationality
            years_experience
            skills
            languages
            photo_url
            availability_status
            hourly_rate
            monthly_salary
            bio
            average_rating
            total_bookings
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetRecommendedMaidsDocument,
        variables: { where, limit },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Error fetching recommended maids:', errors);
        return { data: [], error: errors[0] };
      }

      log.info('[GraphQL] Fetched recommended maids:', data.maid_profiles.length);
      return { data: data.maid_profiles, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception fetching recommended maids:', error);
      return { data: [], error: { message: error.message } };
    }
  },

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      log.debug('[GraphQL] Fetching dashboard stats');

      const userId = await this._getCurrentUserId();

      // Note: sponsor_id uses String type (Firebase UID)
      const GetDashboardStatsDocument = gql`
        query GetDashboardStats($sponsor_id: String!) {
          # Favorites count
          favorites_aggregate(where: {sponsor_id: {_eq: $sponsor_id}}) {
            aggregate {
              count
            }
          }

          # Bookings stats (using bookings table)
          bookings_aggregate(where: {sponsor_id: {_eq: $sponsor_id}}) {
            aggregate {
              count
            }
          }

          active_bookings: bookings_aggregate(
            where: {
              sponsor_id: {_eq: $sponsor_id}
              status: {_in: ["pending_approval", "approved", "active"]}
            }
          ) {
            aggregate {
              count
            }
          }

          completed_bookings: bookings_aggregate(
            where: {
              sponsor_id: {_eq: $sponsor_id}
              status: {_eq: "completed"}
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetDashboardStatsDocument,
        variables: { sponsor_id: userId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Error fetching dashboard stats:', errors);
        return { data: null, error: errors[0] };
      }

      const stats = {
        favorites: data.favorites_aggregate.aggregate.count,
        total_bookings: data.bookings_aggregate.aggregate.count,
        active_bookings: data.active_bookings.aggregate.count,
        completed_bookings: data.completed_bookings.aggregate.count,
      };

      log.info('[GraphQL] Dashboard stats fetched successfully');
      return { data: stats, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception fetching dashboard stats:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // PROFILE METADATA OPERATIONS
  // ============================================================================

  /**
   * Upload avatar (hybrid: Storage in Firebase, URL in GraphQL)
   * Uploads file to Firebase Storage, then updates avatar_url in profiles table via GraphQL
   */
  async uploadAvatar(userId, file) {
    try {
      log.debug('[GraphQL] Uploading avatar for user:', userId);

      if (!file) {
        return { data: null, error: new Error('No file provided') };
      }

      // Step 1: Upload to Firebase Storage
      const { storage } = await import('@/lib/firebaseClient');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `sponsor-avatars/${fileName}`;

      const storageRef = ref(storage, `avatars/${filePath}`);

      try {
        await uploadBytes(storageRef, file, {
          contentType: file.type,
          cacheControl: 'public, max-age=3600',
        });
      } catch (uploadError) {
        log.error('[GraphQL] Error uploading to storage:', uploadError);
        return { data: null, error: uploadError };
      }

      // Get public URL
      const publicUrl = await getDownloadURL(storageRef);

      // Step 2: Update avatar_url in profiles table via GraphQL
      // Note: profiles.id uses String type (Firebase UID)
      const UpdateAvatarDocument = gql`
        mutation UpdateAvatar($id: String!, $avatar_url: String!) {
          update_profiles_by_pk(
            pk_columns: {id: $id}
            _set: {avatar_url: $avatar_url}
          ) {
            id
            avatar_url
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateAvatarDocument,
        variables: {
          id: userId,
          avatar_url: publicUrl,
        },
      });

      if (errors) {
        log.error('[GraphQL] Error updating avatar URL:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Avatar uploaded and URL updated successfully');
      return { data: { url: publicUrl, path: filePath }, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception uploading avatar:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get sponsor completion data from profiles table
   */
  async getSponsorCompletionData(userId) {
    try {
      log.debug('[GraphQL] Fetching completion data for user:', userId);

      // Note: profiles.id uses String type (Firebase UID)
      const GetCompletionDataDocument = gql`
        query GetCompletionData($id: String!) {
          profiles_by_pk(id: $id) {
            id
            name
            email
            phone
            country
            user_metadata
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetCompletionDataDocument,
        variables: { id: userId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Error fetching completion data:', errors);
        return { data: null, error: errors[0] };
      }

      const profile = data?.profiles_by_pk;

      if (!profile) {
        return { data: null, error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } };
      }

      // Extract completion data from user_metadata or fields
      const completionData = {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        country: profile.country,
        // From user_metadata JSONB field
        idType: profile.user_metadata?.idType || '',
        idNumber: profile.user_metadata?.idNumber || '',
        residenceCountry: profile.user_metadata?.residenceCountry || profile.country || '',
        contactPhone: profile.user_metadata?.contactPhone || profile.phone || '',
        employmentProofType: profile.user_metadata?.employmentProofType || '',
        idFileFront: profile.user_metadata?.idFileFront || null,
        idFileBack: profile.user_metadata?.idFileBack || null,
        employmentProofFile: profile.user_metadata?.employmentProofFile || null,
      };

      log.info('[GraphQL] Completion data fetched successfully');
      return { data: completionData, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception fetching completion data:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update sponsor completion data in profiles table
   */
  async updateSponsorCompletionData(userId, completionData) {
    try {
      log.debug('[GraphQL] Updating completion data for user:', userId);

      // Note: profiles.id uses String type (Firebase UID)
      const UpdateCompletionDataDocument = gql`
        mutation UpdateCompletionData($id: String!, $user_metadata: jsonb!) {
          update_profiles_by_pk(
            pk_columns: {id: $id}
            _set: {user_metadata: $user_metadata}
          ) {
            id
            user_metadata
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateCompletionDataDocument,
        variables: {
          id: userId,
          user_metadata: completionData,
        },
      });

      if (errors) {
        log.error('[GraphQL] Error updating completion data:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Completion data updated successfully');
      return { data: data.update_profiles_by_pk, error: null };

    } catch (error) {
      log.error('[GraphQL] Exception updating completion data:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get current user ID from context/auth
   * @private
   */
  async _getCurrentUserId() {
    // Get current user from Firebase Auth
    const { auth } = await import('@/lib/firebaseClient');
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    return currentUser.uid;
  },
};

export default graphqlSponsorService;
