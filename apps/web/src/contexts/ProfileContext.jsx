import { createContext, useContext, useState, useCallback } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { toast } from '@/components/ui/use-toast';
import { handleDatabaseError } from '@/services/centralizedErrorHandler';
import { createLogger } from '@/utils/logger';

const log = createLogger('ProfileContext');

// GraphQL mutations for maid profiles
const UPSERT_MAID_PROFILE = gql`
  mutation UpsertMaidProfile($object: maid_profiles_insert_input!) {
    insert_maid_profiles_one(
      object: $object
      on_conflict: {
        constraint: maid_profiles_pkey
        update_columns: [
          full_name, first_name, middle_name, last_name, date_of_birth,
          nationality, current_location, marital_status, children_count,
          experience_years, previous_countries, skills, languages,
          education_level, preferred_salary_min, preferred_salary_max,
          preferred_currency, available_from, contract_duration_preference,
          live_in_preference, passport_number, passport_expiry, visa_status,
          medical_certificate_valid, police_clearance_valid, availability_status,
          profile_completion_percentage, verification_status, profile_photo_url,
          phone_country_code, phone_number, street_address, state_province,
          religion, religion_other, primary_profession, current_visa_status,
          current_visa_status_other, primary_profession_other,
          introduction_video_url, is_agency_managed, agency_id, about_me, updated_at
        ]
      }
    ) {
      id
      full_name
      profile_completion_percentage
    }
  }
`;

// GraphQL mutations for sponsor profiles
const UPSERT_SPONSOR_PROFILE = gql`
  mutation UpsertSponsorProfile($object: sponsor_profiles_insert_input!) {
    insert_sponsor_profiles_one(
      object: $object
      on_conflict: {
        constraint: sponsor_profiles_pkey
        update_columns: [
          family_size, children_count, preferred_nationality,
          preferred_experience_level, accommodation_type, preferred_skills,
          budget_range_min, budget_range_max, preferred_languages,
          urgency_level, background_check_required, contract_duration_preference,
          profile_completion_percentage, updated_at
        ]
      }
    ) {
      id
      profile_completion_percentage
    }
  }
`;

// GraphQL query for user profile
const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: String!) {
    profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      email
      full_name
      first_name
      user_type
      profile_completed
      created_at
      updated_at
    }
  }
`;

// Profile Context - handles profile management operations
const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Clear profile error
  const clearProfileError = useCallback(() => {
    setProfileError(null);
  }, []);

  // Normalize profession helper
  const normalizePrimaryProfession = useCallback((value) => {
    const v = (value || '').toString().trim();
    const map = {
      Cook: 'Cook',
      Cleaner: 'Cleaner',
      Nanny: 'Baby Care',
      'Baby Sitter': 'Baby Care',
      'Baby Care': 'Baby Care',
      'Elder Care': 'Elderly Care',
      'Elderly Care': 'Elderly Care',
      Nursing: 'Nursing',
      Caregiver: 'Elderly Care',
      Driver: 'Other',
      Gardener: 'Other',
      'General Helper': 'Other',
      Other: 'Other',
    };
    return map[v] || (v ? 'Other' : null);
  }, []);

  // Normalize marital status helper
  const normalizeMaritalStatus = useCallback((value) => {
    if (!value) return null;
    const v = value.toString().trim().toLowerCase();
    const allowed = new Set(['single', 'married', 'divorced', 'widowed']);
    return allowed.has(v) ? v : null;
  }, []);

  // Normalize religion helper
  const normalizeReligion = useCallback((value) => {
    if (!value) return null;
    const allowed = new Set(['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Judaism', 'Other']);
    return allowed.has(value) ? value : null;
  }, []);

  // Normalize visa status helper
  const normalizeCurrentVisaStatus = useCallback((value) => {
    if (!value) return null;
    const v = value.toString().trim();
    const allowed = new Set([
      'Visit Visa',
      'Visa Cancellation in Process',
      'Own Visa',
      'Husband Visa',
      'No Visa',
      'Other',
    ]);
    if (allowed.has(v)) return v;

    const map = {
      'No Visa Required': 'No Visa',
      'Residence Visa': 'Other',
      'Employment Visa': 'Other',
      'Student Visa': 'Other',
      'Family Visa': 'Other',
      'Business Visa': 'Other',
      'Transit Visa': 'Other',
    };
    return map[v] || 'Other';
  }, []);

  // Create or update maid profile
  const createOrUpdateMaidProfile = useCallback(async (userId, profileData) => {
    try {
      setProfileLoading(true);
      setProfileError(null);

      if (!userId) throw new Error('User ID is required for maid profile');

      // Derive name fields
      const firstName = (profileData.firstName || '').trim();
      const middleName = (profileData.middleName || '').trim();
      const lastName = (profileData.lastName || '').trim();
      const fullName = (
        profileData.full_name ||
        profileData.fullName ||
        [firstName, middleName, lastName].filter(Boolean).join(' ')
      ).trim();

      // Handle visa status normalization
      const originalVisa = profileData.currentVisaStatus;
      const normalizedVisa = normalizeCurrentVisaStatus(originalVisa);
      const visaOtherValue =
        profileData.currentVisaStatusOther ||
        (normalizedVisa === 'Other' && originalVisa &&
        !new Set([
          'Visit Visa',
          'Visa Cancellation in Process',
          'Own Visa',
          'Husband Visa',
          'No Visa',
          'Other',
        ]).has(originalVisa)
          ? originalVisa
          : null);

      // Map to maid_profiles schema
      const maidData = {
        id: userId,
        full_name: fullName || null,
        first_name: firstName || null,
        middle_name: middleName || null,
        last_name: lastName || null,
        date_of_birth: profileData.dateOfBirth || null,
        nationality: profileData.nationality || null,
        current_location:
          profileData.current_location ||
          [profileData.stateProvince, profileData.country]
            .filter(Boolean)
            .join(', ') || null,
        marital_status: normalizeMaritalStatus(profileData.maritalStatus),
        children_count:
          profileData.childrenCount !== undefined
            ? parseInt(profileData.childrenCount) || 0
            : 0,
        experience_years:
          profileData.totalExperienceYears !== undefined
            ? parseInt(profileData.totalExperienceYears) || 0
            : 0,
        previous_countries: Array.isArray(profileData.previousCountries)
          ? profileData.previousCountries
          : [],
        skills: Array.isArray(profileData.skills) ? profileData.skills : [],
        languages: Array.isArray(profileData.languagesSpoken)
          ? profileData.languagesSpoken
          : Array.isArray(profileData.languages)
          ? profileData.languages
          : [],
        education_level: profileData.educationLevel || null,
        preferred_salary_min:
          profileData.salaryExpectations !== undefined &&
          profileData.salaryExpectations !== ''
            ? parseInt(profileData.salaryExpectations)
            : null,
        preferred_salary_max: null,
        preferred_currency: profileData.currency || 'USD',
        available_from:
          profileData.availability === 'immediately'
            ? new Date().toISOString().slice(0, 10)
            : null,
        contract_duration_preference: profileData.contractDuration || null,
        live_in_preference:
          profileData.live_in_preference !== undefined
            ? !!profileData.live_in_preference
            : true,
        passport_number: profileData.passportNumber || null,
        passport_expiry: profileData.passportExpiryDate || null,
        visa_status: profileData.currentVisaStatusOther || profileData.currentVisaStatus || null,
        medical_certificate_valid: !!(
          profileData.medicalCertificate && profileData.medicalCertificate.file
        ),
        police_clearance_valid: !!profileData.police_clearance_valid || false,
        availability_status: 'available',
        profile_completion_percentage: 100,
        verification_status: 'pending',
        profile_photo_url: profileData.profile_photo_url || null,
        phone_country_code: profileData.phone_country_code || null,
        phone_number: profileData.phone_number || null,
        street_address: profileData.streetAddress || null,
        state_province: profileData.stateProvince || null,
        religion: normalizeReligion(profileData.religion),
        religion_other: profileData.religionOther || null,
        primary_profession: normalizePrimaryProfession(profileData.primaryProfession),
        current_visa_status: normalizedVisa,
        current_visa_status_other: visaOtherValue,
        primary_profession_other: profileData.primaryProfessionOther || null,
        introduction_video_url: profileData.introduction_video_url || null,
        is_agency_managed:
          profileData.is_agency_managed !== undefined
            ? !!profileData.is_agency_managed
            : profileData.mode === 'agency-managed',
        agency_id: profileData.agency_id || null,
        about_me: profileData.aboutMe || null,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(maidData).forEach((k) => {
        if (maidData[k] === undefined) delete maidData[k];
      });

      const { data, errors } = await apolloClient.mutate({
        mutation: UPSERT_MAID_PROFILE,
        variables: { object: maidData }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to save maid profile');
      }

      log.info('Maid profile saved successfully');
      return { data: data?.insert_maid_profiles_one, error: null };
    } catch (error) {
      const dbError = await handleDatabaseError(error);
      setProfileError(dbError.message);
      log.error('Maid profile creation/update failed:', dbError.message);
      return { data: null, error: dbError };
    } finally {
      setProfileLoading(false);
    }
  }, [normalizePrimaryProfession, normalizeMaritalStatus, normalizeReligion, normalizeCurrentVisaStatus]);

  // Create or update sponsor profile
  const createOrUpdateSponsorProfile = useCallback(async (userId, profileData) => {
    try {
      setProfileLoading(true);
      setProfileError(null);

      if (!userId) throw new Error('User ID is required for sponsor profile');

      const sponsorData = {
        id: userId,
        family_size: profileData.familySize ? parseInt(profileData.familySize) : null,
        children_count: profileData.childrenCount ? parseInt(profileData.childrenCount) : null,
        preferred_nationality: profileData.preferredNationality || null,
        preferred_experience_level: profileData.preferredExperienceLevel || null,
        accommodation_type: profileData.accommodationType || null,
        preferred_skills: Array.isArray(profileData.preferredSkills)
          ? profileData.preferredSkills
          : [],
        budget_range_min: profileData.budgetMin ? parseInt(profileData.budgetMin) : null,
        budget_range_max: profileData.budgetMax ? parseInt(profileData.budgetMax) : null,
        preferred_languages: Array.isArray(profileData.preferredLanguages)
          ? profileData.preferredLanguages
          : [],
        urgency_level: profileData.urgencyLevel || null,
        background_check_required: !!profileData.backgroundCheckRequired,
        contract_duration_preference: profileData.contractDuration || null,
        profile_completion_percentage: 100,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(sponsorData).forEach((k) => {
        if (sponsorData[k] === undefined) delete sponsorData[k];
      });

      const { data, errors } = await apolloClient.mutate({
        mutation: UPSERT_SPONSOR_PROFILE,
        variables: { object: sponsorData }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to save sponsor profile');
      }

      log.info('Sponsor profile saved successfully');
      return { data: data?.insert_sponsor_profiles_one, error: null };
    } catch (error) {
      const dbError = await handleDatabaseError(error);
      setProfileError(dbError.message);
      log.error('Sponsor profile creation/update failed:', dbError.message);
      return { data: null, error: dbError };
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Get user profile
  const getUserProfile = useCallback(async (userId) => {
    try {
      setProfileLoading(true);
      setProfileError(null);

      const { data, errors } = await apolloClient.query({
        query: GET_USER_PROFILE,
        variables: { userId },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to get user profile');
      }

      const profile = data?.profiles?.[0] || null;
      return { data: profile, error: null };
    } catch (error) {
      const dbError = await handleDatabaseError(error);
      setProfileError(dbError.message);
      log.error('Get user profile failed:', dbError.message);
      return { data: null, error: dbError };
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const value = {
    // State
    profileLoading,
    profileError,

    // Profile functions
    createOrUpdateMaidProfile,
    createOrUpdateSponsorProfile,
    getUserProfile,
    clearProfileError,

    // Helper functions
    normalizePrimaryProfession,
    normalizeMaritalStatus,
    normalizeReligion,
    normalizeCurrentVisaStatus,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
