import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';

// ============================================
// GraphQL Queries
// ============================================

const GET_ADMIN_PROFILE_DETAIL = gql`
  query GetAdminProfileDetail($id: String!) {
    profiles_by_pk(id: $id) {
      id
      email
      full_name
      phone
      avatar_url
      user_type
      profile_completion
      verification_status
      subscription_status
      rating
      total_reviews
      trust_score
      country
      location
      is_active
      phone_verified
      registration_complete
      preferred_language
      years_experience
      hired_maids
      created_at
      updated_at
      last_seen

      maid_profile {
        id
        user_id
        agency_id
        first_name
        middle_name
        last_name
        full_name
        date_of_birth
        nationality
        country
        current_location
        phone_number
        phone_verified
        marital_status
        children_count
        religion
        primary_profession
        experience_years
        education_level
        skills
        special_skills
        key_responsibilities
        languages
        work_preferences
        preferred_salary_min
        preferred_salary_max
        preferred_currency
        availability_status
        available_from
        live_in_preference
        current_visa_status
        passport_expiry
        medical_certificate_valid
        police_clearance_valid
        profile_photo_url
        introduction_video_url
        about_me
        verification_status
        is_approved
        is_agency_managed
        agency_badge
        average_rating
        profile_views
        successful_placements
        total_applications
        profile_completion_percentage
        two_factor_enabled
        created_at
        updated_at
      }

      agency_profile {
        id
        full_name
        email
        phone
        business_email
        business_phone
        emergency_contact_phone
        business_address
        city
        country
        website_url
        license_number
        license_verified
        license_expiry_date
        logo_url
        trade_license_verification_status
        authorized_person_name
        authorized_person_email
        authorized_person_phone
        authorized_person_position
        authorized_person_id_number
        authorized_person_id_verification_status
        authorized_person_email_verified
        authorized_person_phone_verified
        established_year
        agency_description
        specialization
        certifications
        service_countries
        guarantee_period_months
        placement_fee_percentage
        support_hours_start
        support_hours_end
        subscription_tier
        subscription_expires_at
        verification_status
        verified
        official_email_verified
        active_maids
        active_listings
        total_maids_managed
        successful_placements
        average_rating
        created_at
        updated_at
      }

      sponsor_profile {
        id
        full_name
        phone_number
        phone_verified
        country
        city
        address
        accommodation_type
        household_size
        number_of_children
        children_ages
        elderly_care_needed
        pets
        pet_types
        live_in_required
        preferred_nationality
        preferred_experience_years
        required_skills
        preferred_languages
        additional_benefits
        salary_budget_min
        salary_budget_max
        currency
        working_hours_per_day
        days_off_per_week
        overtime_available
        identity_verified
        background_check_completed
        profile_completed
        profile_completed_at
        onboarding_completed
        onboarding_completed_at
        religion
        active_job_postings
        total_hires
        average_rating
        two_factor_enabled
        created_at
        updated_at
      }
    }
  }
`;

const GET_PROFILE_ACTIVITY_LOGS = gql`
  query GetProfileActivityLogs($userId: uuid!, $limit: Int = 50) {
    activity_log(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      action
      action_type
      entity_type
      entity_id
      description
      details
      ip_address
      created_at
    }
  }
`;

// ============================================
// GraphQL Mutations
// ============================================

const ADMIN_UPDATE_PROFILE = gql`
  mutation AdminUpdateProfile($id: String!, $data: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      email
      phone
      avatar_url
      country
      location
      is_active
      verification_status
      subscription_status
      profile_completion
      updated_at
    }
  }
`;

const ADMIN_UPDATE_MAID_PROFILE = gql`
  mutation AdminUpdateMaidProfile($id: String!, $data: maid_profiles_set_input!) {
    update_maid_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      verification_status
      availability_status
      profile_completion_percentage
      updated_at
    }
  }
`;

const ADMIN_UPDATE_AGENCY_PROFILE = gql`
  mutation AdminUpdateAgencyProfile($id: String!, $data: agency_profiles_set_input!) {
    update_agency_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      verification_status
      license_verified
      updated_at
    }
  }
`;

const ADMIN_UPDATE_SPONSOR_PROFILE = gql`
  mutation AdminUpdateSponsorProfile($id: String!, $data: sponsor_profiles_set_input!) {
    update_sponsor_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      profile_completed
      updated_at
    }
  }
`;

const ADMIN_DEACTIVATE_PROFILE = gql`
  mutation AdminDeactivateProfile($id: String!, $isActive: Boolean!) {
    update_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { is_active: $isActive }
    ) {
      id
      is_active
      updated_at
    }
  }
`;

const ADMIN_DELETE_PROFILE = gql`
  mutation AdminDeleteProfile($id: String!) {
    delete_maid_profiles(where: { user_id: { _eq: $id } }) {
      affected_rows
    }
    delete_agency_profiles(where: { id: { _eq: $id } }) {
      affected_rows
    }
    delete_sponsor_profiles(where: { id: { _eq: $id } }) {
      affected_rows
    }
    delete_profiles_by_pk(id: $id) {
      id
    }
  }
`;

const ADMIN_CHANGE_VERIFICATION_STATUS = gql`
  mutation AdminChangeVerificationStatus($id: String!, $status: String!) {
    update_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { verification_status: $status }
    ) {
      id
      verification_status
      updated_at
    }
  }
`;

const ADMIN_UPDATE_SUBSCRIPTION = gql`
  mutation AdminUpdateSubscription($id: String!, $status: String!) {
    update_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { subscription_status: $status }
    ) {
      id
      subscription_status
      updated_at
    }
  }
`;

// ============================================
// Service Functions
// ============================================

export const adminProfileService = {
  /**
   * Get full profile details by ID
   */
  async getProfileById(profileId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_PROFILE_DETAIL,
        variables: { id: profileId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to fetch profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Get activity logs for a profile
   */
  async getActivityLogs(userId, limit = 50) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_PROFILE_ACTIVITY_LOGS,
        variables: { userId, limit },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.activity_log || [], error: null };
    } catch (error) {
      logger.error('Failed to fetch activity logs:', error);
      return { data: [], error };
    }
  },

  /**
   * Update base profile fields
   */
  async updateProfile(profileId, profileData) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_UPDATE_PROFILE,
        variables: { id: profileId, data: profileData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to update profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Update maid-specific profile fields
   */
  async updateMaidProfile(maidProfileId, maidData) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_UPDATE_MAID_PROFILE,
        variables: { id: maidProfileId, data: maidData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_maid_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to update maid profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Update agency-specific profile fields
   */
  async updateAgencyProfile(agencyProfileId, agencyData) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_UPDATE_AGENCY_PROFILE,
        variables: { id: agencyProfileId, data: agencyData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_agency_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to update agency profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Update sponsor-specific profile fields
   */
  async updateSponsorProfile(sponsorProfileId, sponsorData) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_UPDATE_SPONSOR_PROFILE,
        variables: { id: sponsorProfileId, data: sponsorData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_sponsor_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to update sponsor profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Deactivate or reactivate a profile
   */
  async toggleProfileActive(profileId, isActive) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_DEACTIVATE_PROFILE,
        variables: { id: profileId, isActive },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to toggle profile active status:', error);
      return { data: null, error };
    }
  },

  /**
   * Permanently delete a profile and all related data
   */
  async deleteProfile(profileId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_DELETE_PROFILE,
        variables: { id: profileId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.delete_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to delete profile:', error);
      return { data: null, error };
    }
  },

  /**
   * Change verification status
   */
  async changeVerificationStatus(profileId, status) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_CHANGE_VERIFICATION_STATUS,
        variables: { id: profileId, status },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to change verification status:', error);
      return { data: null, error };
    }
  },

  /**
   * Update subscription status
   */
  async updateSubscription(profileId, status) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADMIN_UPDATE_SUBSCRIPTION,
        variables: { id: profileId, status },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_profiles_by_pk, error: null };
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      return { data: null, error };
    }
  },

  /**
   * Export profile data as JSON
   */
  exportProfileAsJson(profile) {
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        ...profile,
        // Remove sensitive fields
        maid_profile: profile.maid_profile ? {
          ...profile.maid_profile,
          passport_number_encrypted: undefined,
          national_id_encrypted: undefined,
          bank_account_encrypted: undefined,
          emergency_contact_phone_encrypted: undefined,
        } : null,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-${profile.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export default adminProfileService;
