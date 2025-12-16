/**
 * User Management Service
 * Full CRUD operations for Super Admin user management
 * Supports all user types: maid, agency, sponsor, admin
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('UserManagementService');

// =====================================================
// GRAPHQL DOCUMENTS
// =====================================================

// Get user by ID with all related profiles
const GetUserByIdDocument = gql`
  query GetUserById($id: uuid!) {
    profiles_by_pk(id: $id) {
      id
      full_name
      email
      phone
      user_type
      country
      city
      location
      is_active
      registration_complete
      avatar_url
      created_at
      updated_at
      profile_completion
      rating
      total_reviews
      trust_score
      subscription_status
      verification_status
      is_online
      available
      phone_verified
      maid_profile {
        id
        user_id
        full_name
        first_name
        middle_name
        last_name
        phone_number
        phone_country_code
        phone_verified
        nationality
        country
        current_location
        date_of_birth
        marital_status
        children_count
        religion
        primary_profession
        experience_years
        skills
        languages
        education_level
        preferred_salary_min
        preferred_salary_max
        preferred_currency
        availability_status
        verification_status
        is_approved
        is_agency_managed
        agency_id
        average_rating
        profile_completion_percentage
        about_me
        passport_number
        passport_expiry
        visa_status
        medical_certificate_valid
        police_clearance_valid
        profile_photo_url
        primary_image_processed_url
        created_at
        updated_at
      }
      agency_profile {
        id
        user_id
        agency_name
        license_number
        country
        city
        address
        phone
        email
        website
        description
        logo_url
        verification_status
        is_verified
        total_maids
        active_maids
        rating
        total_reviews
        subscription_tier
        created_at
        updated_at
      }
      sponsor_profile {
        id
        user_id
        full_name
        phone
        country
        city
        address
        occupation
        company
        preferred_nationality
        preferred_age_range
        preferred_experience
        budget_min
        budget_max
        budget_currency
        family_size
        children_count
        special_requirements
        created_at
        updated_at
      }
    }
  }
`;

// Get all users with pagination and filters
const GetAllUsersDocument = gql`
  query GetAllUsers(
    $limit: Int = 50
    $offset: Int = 0
    $where: profiles_bool_exp
    $order_by: [profiles_order_by!]
  ) {
    profiles(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      id
      full_name
      email
      phone
      user_type
      country
      is_active
      registration_complete
      avatar_url
      created_at
      updated_at
      verification_status
      subscription_status
      maid_profile {
        id
        verification_status
        nationality
        experience_years
      }
      agency_profile {
        id
        verification_status
        agency_name
      }
      sponsor_profile {
        id
        full_name
      }
    }
    profiles_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// Update profile (main user data)
const UpdateProfileDocument = gql`
  mutation UpdateProfile($id: uuid!, $data: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      email
      phone
      user_type
      country
      city
      location
      is_active
      registration_complete
      avatar_url
      verification_status
      subscription_status
      updated_at
    }
  }
`;

// Update maid profile
const UpdateMaidProfileDocument = gql`
  mutation UpdateMaidProfile($id: uuid!, $data: maid_profiles_set_input!) {
    update_maid_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      verification_status
      availability_status
      updated_at
    }
  }
`;

// Update agency profile
const UpdateAgencyProfileDocument = gql`
  mutation UpdateAgencyProfile($id: uuid!, $data: agency_profiles_set_input!) {
    update_agency_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      agency_name
      verification_status
      updated_at
    }
  }
`;

// Update sponsor profile
const UpdateSponsorProfileDocument = gql`
  mutation UpdateSponsorProfile($id: uuid!, $data: sponsor_profiles_set_input!) {
    update_sponsor_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      updated_at
    }
  }
`;

// Delete user profile (soft delete by setting is_active = false and adding deleted flag)
const DeleteUserDocument = gql`
  mutation DeleteUser($id: uuid!) {
    update_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { is_active: false }
    ) {
      id
      is_active
    }
  }
`;

// Hard delete user - removes the profile completely
const HardDeleteUserDocument = gql`
  mutation HardDeleteUser($id: uuid!) {
    delete_profiles_by_pk(id: $id) {
      id
    }
  }
`;

// Delete maid profile
const DeleteMaidProfileDocument = gql`
  mutation DeleteMaidProfile($userId: uuid!) {
    delete_maid_profiles(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

// Delete agency profile
const DeleteAgencyProfileDocument = gql`
  mutation DeleteAgencyProfile($userId: uuid!) {
    delete_agency_profiles(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

// Delete sponsor profile
const DeleteSponsorProfileDocument = gql`
  mutation DeleteSponsorProfile($userId: uuid!) {
    delete_sponsor_profiles(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

// Create new user profile
const CreateProfileDocument = gql`
  mutation CreateProfile($data: profiles_insert_input!) {
    insert_profiles_one(object: $data) {
      id
      full_name
      email
      phone
      user_type
      is_active
      created_at
    }
  }
`;

// Create maid profile
const CreateMaidProfileDocument = gql`
  mutation CreateMaidProfile($data: maid_profiles_insert_input!) {
    insert_maid_profiles_one(object: $data) {
      id
      user_id
      full_name
    }
  }
`;

// Create agency profile
const CreateAgencyProfileDocument = gql`
  mutation CreateAgencyProfile($data: agency_profiles_insert_input!) {
    insert_agency_profiles_one(object: $data) {
      id
      user_id
      agency_name
    }
  }
`;

// Create sponsor profile
const CreateSponsorProfileDocument = gql`
  mutation CreateSponsorProfile($data: sponsor_profiles_insert_input!) {
    insert_sponsor_profiles_one(object: $data) {
      id
      user_id
      full_name
    }
  }
`;

// Get user activity logs
const GetUserActivityDocument = gql`
  query GetUserActivity($userId: uuid!, $limit: Int = 50) {
    admin_activity_logs(
      where: {
        _or: [
          { target_id: { _eq: $userId } },
          { admin_id: { _eq: $userId } }
        ]
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      admin_id
      action_type
      target_type
      target_id
      details
      ip_address
      created_at
    }
  }
`;

// Bulk update users
const BulkUpdateUsersDocument = gql`
  mutation BulkUpdateUsers($ids: [uuid!]!, $data: profiles_set_input!) {
    update_profiles(where: { id: { _in: $ids } }, _set: $data) {
      affected_rows
      returning {
        id
        is_active
        verification_status
      }
    }
  }
`;

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const userManagementService = {
  /**
   * Get user by ID with all related profiles
   */
  async getUserById(userId) {
    try {
      log.info('Fetching user by ID:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetUserByIdDocument,
        variables: { id: userId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error fetching user:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(options = {}) {
    try {
      const { limit = 50, offset = 0, filters = {}, orderBy = [{ created_at: 'desc' }] } = options;

      // Build where clause
      const where = this.buildWhereClause(filters);

      const { data, errors } = await apolloClient.query({
        query: GetAllUsersDocument,
        variables: { limit, offset, where, order_by: orderBy },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return {
        data: data?.profiles || [],
        totalCount: data?.profiles_aggregate?.aggregate?.count || 0,
        error: null,
      };
    } catch (error) {
      log.error('Error fetching users:', error);
      return { data: [], totalCount: 0, error };
    }
  },

  /**
   * Build where clause for filtering
   */
  buildWhereClause(filters) {
    const conditions = {};

    if (filters.search) {
      conditions._or = [
        { full_name: { _ilike: `%${filters.search}%` } },
        { email: { _ilike: `%${filters.search}%` } },
        { phone: { _ilike: `%${filters.search}%` } },
      ];
    }

    if (filters.userType && filters.userType !== 'all') {
      conditions.user_type = { _eq: filters.userType };
    }

    if (filters.status && filters.status !== 'all') {
      conditions.is_active = { _eq: filters.status === 'active' };
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      conditions.verification_status = { _eq: filters.verificationStatus };
    }

    if (filters.subscriptionStatus && filters.subscriptionStatus !== 'all') {
      conditions.subscription_status = { _eq: filters.subscriptionStatus };
    }

    return Object.keys(conditions).length > 0 ? conditions : null;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    try {
      log.info('Updating profile:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateProfileDocument,
        variables: { id: userId, data: profileData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error updating profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Update maid profile
   */
  async updateMaidProfile(maidProfileId, maidData) {
    try {
      log.info('Updating maid profile:', maidProfileId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateMaidProfileDocument,
        variables: { id: maidProfileId, data: maidData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_maid_profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error updating maid profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Update agency profile
   */
  async updateAgencyProfile(agencyProfileId, agencyData) {
    try {
      log.info('Updating agency profile:', agencyProfileId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateAgencyProfileDocument,
        variables: { id: agencyProfileId, data: agencyData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_agency_profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error updating agency profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Update sponsor profile
   */
  async updateSponsorProfile(sponsorProfileId, sponsorData) {
    try {
      log.info('Updating sponsor profile:', sponsorProfileId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateSponsorProfileDocument,
        variables: { id: sponsorProfileId, data: sponsorData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_sponsor_profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error updating sponsor profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Soft delete user (deactivate)
   */
  async softDeleteUser(userId) {
    try {
      log.info('Soft deleting user:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteUserDocument,
        variables: { id: userId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error soft deleting user:', error);
      return { data: null, error };
    }
  },

  /**
   * Hard delete user (permanent - use with caution)
   */
  async hardDeleteUser(userId, userType) {
    try {
      log.info('Hard deleting user:', userId, 'type:', userType);

      // First delete the type-specific profile
      if (userType === 'maid') {
        await apolloClient.mutate({
          mutation: DeleteMaidProfileDocument,
          variables: { userId },
        });
      } else if (userType === 'agency') {
        await apolloClient.mutate({
          mutation: DeleteAgencyProfileDocument,
          variables: { userId },
        });
      } else if (userType === 'sponsor') {
        await apolloClient.mutate({
          mutation: DeleteSponsorProfileDocument,
          variables: { userId },
        });
      }

      // Then delete the main profile
      const { data, errors } = await apolloClient.mutate({
        mutation: HardDeleteUserDocument,
        variables: { id: userId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.delete_profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error hard deleting user:', error);
      return { data: null, error };
    }
  },

  /**
   * Create new user profile
   */
  async createUser(profileData, typeSpecificData = null) {
    try {
      log.info('Creating new user:', profileData.user_type);

      // Create main profile
      const { data, errors } = await apolloClient.mutate({
        mutation: CreateProfileDocument,
        variables: { data: profileData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const newProfile = data?.insert_profiles_one;
      if (!newProfile) {
        throw new Error('Failed to create profile');
      }

      // Create type-specific profile if data provided
      if (typeSpecificData) {
        const userId = newProfile.id;
        typeSpecificData.user_id = userId;

        if (profileData.user_type === 'maid') {
          await apolloClient.mutate({
            mutation: CreateMaidProfileDocument,
            variables: { data: typeSpecificData },
          });
        } else if (profileData.user_type === 'agency') {
          await apolloClient.mutate({
            mutation: CreateAgencyProfileDocument,
            variables: { data: typeSpecificData },
          });
        } else if (profileData.user_type === 'sponsor') {
          await apolloClient.mutate({
            mutation: CreateSponsorProfileDocument,
            variables: { data: typeSpecificData },
          });
        }
      }

      return { data: newProfile, error: null };
    } catch (error) {
      log.error('Error creating user:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user activity logs
   */
  async getUserActivity(userId, limit = 50) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetUserActivityDocument,
        variables: { userId, limit },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.admin_activity_logs || [], error: null };
    } catch (error) {
      log.error('Error fetching user activity:', error);
      return { data: [], error };
    }
  },

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(userIds, updateData) {
    try {
      log.info('Bulk updating users:', userIds.length);

      const { data, errors } = await apolloClient.mutate({
        mutation: BulkUpdateUsersDocument,
        variables: { ids: userIds, data: updateData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return {
        data: data?.update_profiles?.returning || [],
        affectedRows: data?.update_profiles?.affected_rows || 0,
        error: null
      };
    } catch (error) {
      log.error('Error bulk updating users:', error);
      return { data: [], affectedRows: 0, error };
    }
  },

  /**
   * Verify user
   */
  async verifyUser(userId, status = 'verified') {
    return this.updateProfile(userId, { verification_status: status });
  },

  /**
   * Activate/Deactivate user
   */
  async setUserActive(userId, isActive) {
    return this.updateProfile(userId, { is_active: isActive });
  },

  /**
   * Update user subscription
   */
  async updateSubscription(userId, subscriptionStatus) {
    return this.updateProfile(userId, { subscription_status: subscriptionStatus });
  },
};

export default userManagementService;
