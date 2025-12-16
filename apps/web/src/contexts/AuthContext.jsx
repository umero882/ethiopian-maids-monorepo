import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { notificationService } from '@/services/notificationService';
import {
  handleAuthError,
  handleDatabaseError,
} from '@/services/centralizedErrorHandler';
import { createLogger } from '@/utils/logger';
import { secureLogin, secureLogout, secureRegister } from '@/lib/secureAuth';
import sessionManager from '@/lib/sessionManager';
import { apolloClient, GetProfileDocument } from '@ethio/api-client';
import { gql } from '@apollo/client';

// Firebase Auth imports
import { auth, FIREBASE_TOKEN_KEY, getStoredToken } from '@/lib/firebaseClient';
import { onAuthStateChanged, sendEmailVerification, reload } from 'firebase/auth';

const log = createLogger('AuthContext');

// Direct GraphQL fetch function to bypass Apollo Client issues
const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

async function fetchProfileDirect(userId) {
  const query = `
    query GetProfile($id: String!) {
      profiles_by_pk(id: $id) {
        id
        full_name
        email
        phone
        user_type
        avatar_url
        country
        location
        registration_complete
        is_active
        profile_completion
        verification_status
        created_at
        updated_at
      }
    }
  `;

  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HASURA_ADMIN_SECRET ? { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET } : {}),
      },
      body: JSON.stringify({
        query,
        variables: { id: userId }
      }),
    });

    const result = await response.json();
    console.log('🔍 fetchProfileDirect - Raw response:', result);
    return result;
  } catch (error) {
    console.error('🔍 fetchProfileDirect - Error:', error);
    return { data: null, errors: [{ message: error.message }] };
  }
}

// GraphQL mutation for creating profiles (upsert)
const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile($data: profiles_insert_input!) {
    insert_profiles_one(object: $data, on_conflict: {
      constraint: profiles_pkey,
      update_columns: [full_name, phone, country, user_type, updated_at]
    }) {
      id
      full_name
      email
      phone
      user_type
      avatar_url
      country
      location
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

// GraphQL mutation for updating profiles
// Note: profiles.id uses String type (Firebase UID)
const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($id: String!, $data: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
      id
      full_name
      email
      phone
      user_type
      avatar_url
      country
      location
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

// Helper function to update profile via GraphQL
const updateProfileViaGraphQL = async (userId, updateData) => {
  const { data, errors } = await apolloClient.mutate({
    mutation: UPDATE_PROFILE_MUTATION,
    variables: {
      id: userId,
      data: {
        ...updateData,
        updated_at: new Date().toISOString(),
      },
    },
  });

  if (errors && errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return data?.update_profiles_by_pk;
};

// Helper function to fetch profile via GraphQL
const fetchProfileViaGraphQL = async (userId) => {
  const { data, errors } = await apolloClient.query({
    query: GetProfileDocument,
    variables: { id: userId },
    fetchPolicy: 'network-only',
  });

  if (errors && errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return data?.profiles_by_pk;
};

const AuthContext = createContext();

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

/**
 * Creates or updates a maid profile with normalized data fields
 * @param {string} userId - The unique identifier for the user
 * @param {Object} profileData - Raw profile data from form submission
 * @returns {Promise<Object>} Database operation result with created/updated maid profile
 * @throws {Error} When userId is missing or database operation fails
 */
const createOrUpdateMaidProfile = async (userId, profileData) => {
  try {
    log.debug('Creating/updating maid profile for user:', userId);
    log.debug('Maid profile data received:', JSON.stringify(profileData, null, 2));

    if (!userId) throw new Error('User ID is required for maid profile');

    // Validate essential data
    if (!profileData) {
      throw new Error('Profile data is required for maid profile creation');
    }

    // Check for required fields from the form (prefer full_name for consistency)
    const hasFullName = (profileData.full_name || profileData.fullName || '').toString().trim().length > 0;
    if (!hasFullName) {
      // Fall back to legacy first/last if present, otherwise fail
      const firstOk = (profileData.firstName || '').toString().trim().length > 0;
      const lastOk = (profileData.lastName || '').toString().trim().length > 0;
      if (!(firstOk && lastOk)) {
        throw new Error('Missing required field: full_name');
      }
    }

    // Derive name fields
    const firstName = (profileData.firstName || '').trim();
    const middleName = (profileData.middleName || '').trim();
    const lastName = (profileData.lastName || '').trim();
    const fullName = (
      profileData.full_name ||
      profileData.fullName ||
      [firstName, middleName, lastName].filter(Boolean).join(' ')
    ).trim();

    // Normalize constrained enums/values
    const normalizePrimaryProfession = (value) => {
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
    };

    const normalizeMaritalStatus = (value) => {
      if (!value) return null;
      const v = value.toString().trim().toLowerCase();
      const allowed = new Set(['single', 'married', 'divorced', 'widowed']);
      return allowed.has(v) ? v : null;
    };

    const normalizeReligion = (value) => {
      if (!value) return null;
      const allowed = new Set(['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Judaism', 'Other']);
      return allowed.has(value) ? value : null;
    };

    const normalizeCurrentVisaStatus = (value) => {
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
    };

    // Map to maid_profiles schema
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

    // Ensure we always have a full_name for the database constraint
    const finalFullName = fullName || [firstName, lastName].filter(Boolean).join(' ') || 'Profile User';

    const maidData = {
      id: userId,
      full_name: finalFullName,
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
      availability_status:
        profileData.availability || 'available',
      contract_duration_preference: profileData.contractDuration || null,
      live_in_preference:
        profileData.livingArrangement
          ? profileData.livingArrangement === 'live-in'
          : (profileData.live_in_preference !== undefined
              ? !!profileData.live_in_preference
              : true),
      passport_number: profileData.passportNumber || null,
      passport_expiry: profileData.passportExpiryDate || null,
      visa_status: profileData.currentVisaStatusOther || profileData.currentVisaStatus || null,
      medical_certificate_valid: !!(
        profileData.medicalCertificate && profileData.medicalCertificate.file
      ),
      police_clearance_valid: !!profileData.police_clearance_valid || false,
      profile_completion_percentage: 100,
      verification_status: 'pending',
      profile_photo_url:
        profileData.profilePictureUrl ||
        (Array.isArray(profileData.images) && profileData.images[0]?.url) ||
        profileData.profile_photo_url ||
        null,
      phone_country_code: profileData.phone_country_code || null,
      phone_number: profileData.phone_number || profileData.phone || null,
      alternative_phone: profileData.alternativePhoneNumber || null,
      street_address: profileData.streetAddress || null,
      state_province: profileData.stateProvince || null,
      religion: normalizeReligion(profileData.religion),
      religion_other: profileData.religionOther || null,
      primary_profession: normalizePrimaryProfession(profileData.primaryProfession),
      current_visa_status: normalizedVisa,
      current_visa_status_other: visaOtherValue,
      primary_profession_other: profileData.primaryProfessionOther || null,
      introduction_video_url: profileData.introduction_video_url || null,
      primary_image_processed: !!profileData.primary_image_processed || false,
      primary_image_original_url: profileData.primary_image_original_url || null,
      primary_image_processed_url: profileData.primary_image_processed_url || null,
      image_processing_metadata: profileData.image_processing_metadata || {},
      is_agency_managed:
        profileData.is_agency_managed !== undefined
          ? !!profileData.is_agency_managed
          : profileData.mode === 'agency-managed',
      agency_id: profileData.agency_id || null,
      about_me: profileData.aboutMe || null,
      key_responsibilities: Array.isArray(profileData.keyResponsibilities)
        ? profileData.keyResponsibilities
        : Array.isArray(profileData.additionalServices)
        ? profileData.additionalServices
        : [],
      work_history: Array.isArray(profileData.workHistory)
        ? profileData.workHistory
        : Array.isArray(profileData.workExperiences)
        ? profileData.workExperiences
        : [],
      work_preferences: Array.isArray(profileData.workPreferences)
        ? profileData.workPreferences
        : [],
      additional_notes: profileData.additionalNotes || null,
    };

    // Remove undefined to avoid overwriting with null unintentionally
    Object.keys(maidData).forEach((k) => {
      if (maidData[k] === undefined) delete maidData[k];
    });

    log.debug('Final maid data to be saved:', JSON.stringify(maidData, null, 2));

    // Use GraphQL mutation for maid profile upsert
    const UPSERT_MAID_PROFILE = gql`
      mutation UpsertMaidProfile($data: maid_profiles_insert_input!) {
        insert_maid_profiles_one(
          object: $data,
          on_conflict: {
            constraint: maid_profiles_pkey,
            update_columns: [full_name, first_name, middle_name, last_name, date_of_birth, nationality, current_location, marital_status, children_count, experience_years, previous_countries, skills, languages, education_level, preferred_salary_min, preferred_salary_max, preferred_currency, available_from, availability_status, contract_duration_preference, live_in_preference, passport_number, passport_expiry, visa_status, medical_certificate_valid, police_clearance_valid, profile_completion_percentage, verification_status, profile_photo_url, phone_country_code, phone_number, alternative_phone, street_address, state_province, religion, religion_other, primary_profession, current_visa_status, current_visa_status_other, primary_profession_other, introduction_video_url, primary_image_processed, primary_image_original_url, primary_image_processed_url, image_processing_metadata, is_agency_managed, agency_id, about_me, key_responsibilities, work_history, work_preferences, additional_notes, updated_at]
          }
        ) {
          id
          full_name
          created_at
          updated_at
        }
      }
    `;

    const { data, errors } = await apolloClient.mutate({
      mutation: UPSERT_MAID_PROFILE,
      variables: {
        data: {
          ...maidData,
          updated_at: new Date().toISOString(),
        },
      },
    });

    if (errors && errors.length > 0) {
      log.error('Error in maid profile upsert:', errors[0]);
      throw new Error(errors[0].message);
    }

    log.debug('Maid profile upserted:', data?.insert_maid_profiles_one);
    return data?.insert_maid_profiles_one;
  } catch (error) {
    log.error('Error in createOrUpdateMaidProfile:', error);
    throw error;
  }
};

// Helper function to create or update agency profile
const createOrUpdateAgencyProfile = async (userId, profileData) => {
  try {
    log.debug('Creating/updating agency profile for user:', userId);
    log.debug('Profile data received:', profileData);

    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required for agency profile creation');
    }

    if (!profileData) {
      throw new Error('Profile data is required for agency profile creation');
    }

    // Transform the profile completion data to agency_profiles format
    const agencyName =
      profileData.agencyName ||
      profileData.businessName ||
      profileData.full_name ||
      profileData.fullName ||
      '';

    // Validate required fields
    if (!agencyName.trim()) {
      throw new Error(
        'Agency name is required but not provided in profile data'
      );
    }

    const agencyData = {
      id: userId,
      full_name: agencyName.trim(),
      license_number: profileData.tradeLicenseNumber || profileData.licenseNumber || null,
      country: profileData.countryOfRegistration || profileData.country || null,
      business_phone: profileData.contactPhone || profileData.phone || null,
      business_email: profileData.officialEmail || profileData.email || null,
      website_url: profileData.website || null,
      head_office_address: profileData.headOfficeAddress || null,
      service_countries: Array.isArray(profileData.operatingCities)
        ? profileData.operatingCities
        : Array.isArray(profileData.operatingRegions)
        ? profileData.operatingRegions
        : [],
      specialization: Array.isArray(profileData.servicesOffered)
        ? profileData.servicesOffered
        : [],
      placement_fee_percentage: parseFloat(profileData.placementFee) || parseFloat(profileData.commissionRate) || 5.0,
      agency_description: profileData.aboutAgency || null,
      support_hours_start: profileData.supportHoursStart || '09:00',
      support_hours_end: profileData.supportHoursEnd || '17:00',
      emergency_contact_phone: profileData.emergencyContactPhone || null,
      authorized_person_name: profileData.authorizedPersonName || null,
      authorized_person_position: profileData.authorizedPersonPosition || null,
      authorized_person_phone: profileData.authorizedPersonPhone || null,
      authorized_person_email: profileData.authorizedPersonEmail || null,
      authorized_person_id_number: profileData.authorizedPersonIdNumber || null,
      contact_phone_verified: Boolean(profileData.contactPhoneVerified),
      official_email_verified: Boolean(profileData.officialEmailVerified),
      authorized_person_phone_verified: Boolean(profileData.authorizedPersonPhoneVerified),
      authorized_person_email_verified: Boolean(profileData.authorizedPersonEmailVerified),
      license_verified: false,
      profile_completed_at: profileData.registration_complete ? new Date().toISOString() : null,
      subscription_tier: 'basic',
      guarantee_period_months: 3,
      total_maids_managed: 0,
      successful_placements: 0,
      active_listings: 0,
      average_rating: 0.0,
      logo_url: profileData.logo || profileData.logoFile || null,
      logo_file_preview: profileData.logoFilePreview || null,
      license_expiry_date: profileData.licenseExpiryDate ?
        new Date(profileData.licenseExpiryDate).toISOString() : null,
    };

    log.debug('Transformed agency data:', agencyData);

    // Use GraphQL mutation for agency profile upsert
    const UPSERT_AGENCY_PROFILE = gql`
      mutation UpsertAgencyProfile($data: agency_profiles_insert_input!) {
        insert_agency_profiles_one(
          object: $data,
          on_conflict: {
            constraint: agency_profiles_pkey,
            update_columns: [full_name, license_number, country, business_phone, business_email, website_url, head_office_address, service_countries, specialization, placement_fee_percentage, agency_description, support_hours_start, support_hours_end, emergency_contact_phone, authorized_person_name, authorized_person_position, authorized_person_phone, authorized_person_email, authorized_person_id_number, contact_phone_verified, official_email_verified, authorized_person_phone_verified, authorized_person_email_verified, license_verified, profile_completed_at, logo_url, logo_file_preview, license_expiry_date, updated_at]
          }
        ) {
          id
          full_name
          created_at
          updated_at
        }
      }
    `;

    const { data, errors } = await apolloClient.mutate({
      mutation: UPSERT_AGENCY_PROFILE,
      variables: {
        data: {
          ...agencyData,
          updated_at: new Date().toISOString(),
        },
      },
    });

    if (errors && errors.length > 0) {
      log.error('Error in agency profile upsert:', errors[0]);
      throw new Error(errors[0].message);
    }

    log.debug('Agency profile upserted:', data?.insert_agency_profiles_one);
    return data?.insert_agency_profiles_one;
  } catch (error) {
    log.error('Error in createOrUpdateAgencyProfile:', error);
    throw error;
  }
};

// Helper function to create or update sponsor profile
const createOrUpdateSponsorProfile = async (userId, profileData) => {
  try {
    log.debug('Creating/updating sponsor profile for user:', userId);
    log.debug('Profile data received:', profileData);

    // Transform the profile completion data to match sponsor_profiles schema
    const sponsorData = {
      id: userId,
      full_name: profileData.full_name || profileData.fullName || '',
      family_size:
        profileData.family_size !== undefined
          ? typeof profileData.family_size === 'string'
            ? parseInt(profileData.family_size.replace(/[^\d]/g, '')) || 1
            : parseInt(profileData.family_size) || 1
          : 1,
      children_count:
        profileData.children_count !== undefined
          ? parseInt(profileData.children_count) || 0
          : 0,
      children_ages: Array.isArray(profileData.children_ages)
        ? profileData.children_ages
        : [],
      elderly_care_needed: Boolean(profileData.elderly_care_needed),
      pets: Boolean(profileData.pets),
      pet_types: Array.isArray(profileData.pet_types)
        ? profileData.pet_types
        : [],
      city: profileData.city || null,
      country: profileData.country || null,
      address: profileData.address || null,
      accommodation_type: profileData.accommodation_type || null,
      preferred_nationality: Array.isArray(profileData.preferred_nationality)
        ? profileData.preferred_nationality
        : [],
      preferred_experience_years:
        profileData.preferred_experience_years !== undefined
          ? parseInt(profileData.preferred_experience_years) || 0
          : 0,
      required_skills: Array.isArray(profileData.required_skills)
        ? profileData.required_skills
        : [],
      preferred_languages: Array.isArray(profileData.preferred_languages)
        ? profileData.preferred_languages
        : [],
      salary_budget_min:
        profileData.salary_budget_min !== undefined &&
        profileData.salary_budget_min !== ''
          ? parseInt(profileData.salary_budget_min)
          : null,
      salary_budget_max:
        profileData.salary_budget_max !== undefined &&
        profileData.salary_budget_max !== ''
          ? parseInt(profileData.salary_budget_max)
          : null,
      currency: profileData.currency || 'USD',
      live_in_required: profileData.live_in_required !== false,
      working_hours_per_day:
        profileData.working_hours_per_day !== undefined
          ? parseInt(profileData.working_hours_per_day) || 8
          : 8,
      days_off_per_week:
        profileData.days_off_per_week !== undefined
          ? parseInt(profileData.days_off_per_week) || 1
          : 1,
      overtime_available: Boolean(profileData.overtime_available),
      additional_benefits: Array.isArray(profileData.additional_benefits)
        ? profileData.additional_benefits
        : [],
      identity_verified: Boolean(profileData.identity_verified),
      background_check_completed: Boolean(
        profileData.background_check_completed
      ),
    };

    log.debug('Transformed sponsor data:', sponsorData);

    // Use GraphQL mutation for sponsor profile upsert
    const UPSERT_SPONSOR_PROFILE = gql`
      mutation UpsertSponsorProfile($data: sponsor_profiles_insert_input!) {
        insert_sponsor_profiles_one(
          object: $data,
          on_conflict: {
            constraint: sponsor_profiles_pkey,
            update_columns: [full_name, family_size, children_count, children_ages, elderly_care_needed, pets, pet_types, city, country, address, accommodation_type, preferred_nationality, preferred_experience_years, required_skills, preferred_languages, salary_budget_min, salary_budget_max, currency, live_in_required, working_hours_per_day, days_off_per_week, overtime_available, additional_benefits, identity_verified, background_check_completed, updated_at]
          }
        ) {
          id
          full_name
          created_at
          updated_at
        }
      }
    `;

    const { data, errors } = await apolloClient.mutate({
      mutation: UPSERT_SPONSOR_PROFILE,
      variables: {
        data: {
          ...sponsorData,
          updated_at: new Date().toISOString(),
        },
      },
    });

    if (errors && errors.length > 0) {
      log.error('Error in sponsor profile upsert:', errors[0]);
      throw new Error(errors[0].message);
    }

    log.debug('Sponsor profile upserted:', data?.insert_sponsor_profiles_one);
    return data?.insert_sponsor_profiles_one;
  } catch (error) {
    log.error('Error in createOrUpdateSponsorProfile:', error);
    throw error;
  }
};

const AuthProvider = ({ children, mockValue }) => {
  // Testing hook: allow injection of a mock context value
  if (mockValue) {
    return (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );
  }
  log.debug('AuthProvider initializing...');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return null;
    try {
      console.log('🔍 fetchUserProfile - Starting for Firebase UID:', firebaseUser.uid);
      log.debug('Fetching user profile via GraphQL for:', firebaseUser.uid);

      // Use Apollo Client with proper Apollo 4 link chain configuration
      console.log('🔍 fetchUserProfile - Executing Apollo Client query...');

      let queryResult, errors, data;

      try {
        // Primary: Use Apollo Client (now fixed for Apollo 4)
        const apolloResult = await apolloClient.query({
          query: GetProfileDocument,
          variables: { id: firebaseUser.uid },
          fetchPolicy: 'network-only',
        });

        queryResult = apolloResult?.data;
        errors = apolloResult?.errors;
        data = queryResult?.profiles_by_pk;

        console.log('🔍 fetchUserProfile - Apollo Client query successful');
        console.log('🔍 fetchUserProfile - profiles_by_pk:', data);
        console.log('🔍 fetchUserProfile - user_type from query:', data?.user_type);
      } catch (apolloError) {
        // Fallback: Direct fetch if Apollo Client fails
        console.warn('🔍 fetchUserProfile - Apollo Client failed, using direct fetch:', apolloError.message);
        const directResult = await fetchProfileDirect(firebaseUser.uid);

        queryResult = directResult?.data;
        errors = directResult?.errors;
        data = queryResult?.profiles_by_pk;

        console.log('🔍 fetchUserProfile - Direct fetch result:', data);
        console.log('🔍 fetchUserProfile - user_type from direct fetch:', data?.user_type);
      }

      log.debug('Profile fetch result:', {
        hasData: !!data,
        errors: errors?.map(e => e.message),
      });

      if (errors && errors.length > 0) {
        log.error('Error fetching user profile:', errors[0].message);
        const msg = errors[0]?.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('Network')) {
          throw new Error(
            'Unable to load user profile. Please check your connection and try again.'
          );
        }
      }

      if (!data) {
        // Profile not found - create it now via GraphQL
        log.debug('Profile not found, creating new profile via GraphQL...');

        try {
          // Get user type from Firebase custom claims or default to 'sponsor'
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const userTypeValue =
            idTokenResult.claims?.user_type ||
            (firebaseUser.displayName?.includes('maid') ? 'maid' : 'sponsor');

          log.debug('Creating profile with user type:', {
            userTypeFromClaims: idTokenResult.claims?.user_type,
            finalUserType: userTypeValue,
          });

          const profileInput = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            user_type: userTypeValue,
            full_name: firebaseUser.displayName || '',
            phone: firebaseUser.phoneNumber || '',
            country: '',
            registration_complete: false,
            is_active: true,
          };

          const { data: mutationResult, errors: mutationErrors } = await apolloClient.mutate({
            mutation: CREATE_PROFILE_MUTATION,
            variables: { data: profileInput },
          });

          if (mutationErrors && mutationErrors.length > 0) {
            log.warn(
              'Profile creation failed:',
              mutationErrors[0]?.message || '(no error message)'
            );

            // Return basic profile from Firebase user - allow registration to proceed
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              userType: userTypeValue,
              full_name: firebaseUser.displayName || '',
              registration_complete: false,
              country: '',
              phone: firebaseUser.phoneNumber || '',
            };
          } else {
            log.debug('Profile created successfully via GraphQL');
            data = mutationResult?.insert_profiles_one;
          }
        } catch (createException) {
          log.warn('Profile creation exception:', createException.message);
          // Return basic profile from Firebase user
          return {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            userType: 'sponsor',
            full_name: firebaseUser.displayName || '',
            registration_complete: false,
            country: '',
            phone: firebaseUser.phoneNumber || '',
          };
        }
      }

      // Create a consistent user object structure
      console.log('🔍 AuthContext - FULL Profile data from database:', JSON.stringify(data, null, 2));
      console.log('🔍 AuthContext - user_type field value:', data?.user_type);
      console.log('🔍 AuthContext - user_type field type:', typeof data?.user_type);
      log.debug('AuthContext - Profile data from database:', {
        user_type: data?.user_type,
        role: data?.role,
        email: data?.email,
        registration_complete: data?.registration_complete,
      });

      // User type detection - prefer profiles.user_type
      // IMPORTANT: Don't default to 'sponsor' if user_type exists but is empty string
      let detectedUserType = data?.user_type;
      if (!detectedUserType || detectedUserType === '' || detectedUserType === 'null') {
        console.warn('⚠️ AuthContext - user_type is empty or invalid, defaulting to sponsor');
        detectedUserType = 'sponsor';
      }

      console.log('🎯 AuthContext - Final detected userType:', detectedUserType);
      log.debug('AuthContext - Final detected userType:', detectedUserType);

      const baseProfile = data
        ? {
            id: data.id,
            email: data.email,
            full_name: data.full_name || firebaseUser.displayName || '',
            phone: data.phone || firebaseUser.phoneNumber || '',
            country: data.country || '',
            userType: detectedUserType,
            registration_complete: data.registration_complete || false,
            is_active: data.is_active,
            email_confirmed_at: firebaseUser.emailVerified ? new Date().toISOString() : null,
          }
        : {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            userType: 'sponsor',
            full_name: firebaseUser.displayName || '',
            registration_complete: false,
            country: '',
            phone: firebaseUser.phoneNumber || '',
            email_confirmed_at: firebaseUser.emailVerified ? new Date().toISOString() : null,
          };

      // If user is an agency and registration is complete, fetch agency profile data
      console.log('🔍 AuthContext - Checking agency profile fetch conditions:', {
        userType: detectedUserType,
        registrationComplete: baseProfile.registration_complete,
        shouldFetchAgencyProfile: detectedUserType === 'agency' && baseProfile.registration_complete,
      });
      if (detectedUserType === 'agency' && baseProfile.registration_complete) {
        try {
          log.debug('Fetching agency profile data for:', firebaseUser.uid);

          // Note: agency_profiles.id uses String type (Firebase UID)
          const FETCH_AGENCY_PROFILE = gql`
            query GetAgencyProfile($id: String!) {
              agency_profiles_by_pk(id: $id) {
                id
                full_name
                license_number
                country
                business_phone
                business_email
                website_url
                head_office_address
                service_countries
                specialization
                placement_fee_percentage
                agency_description
                support_hours_start
                support_hours_end
                emergency_contact_phone
                authorized_person_name
                authorized_person_position
                authorized_person_phone
                authorized_person_email
                authorized_person_id_number
                contact_phone_verified
                official_email_verified
                authorized_person_phone_verified
                authorized_person_email_verified
                logo_url
                logo_file_preview
                license_expiry_date
                verification_status
              }
            }
          `;

          const { data: agencyQueryResult, errors: agencyErrors } = await apolloClient.query({
            query: FETCH_AGENCY_PROFILE,
            variables: { id: firebaseUser.uid },
            fetchPolicy: 'network-only',
          });

          const agencyData = agencyQueryResult?.agency_profiles_by_pk;

          if (!agencyErrors && agencyData) {
            log.debug('Agency profile data fetched:', agencyData);
            // Merge agency profile data into the base profile
            const enrichedProfile = {
              ...baseProfile,
              agencyName: agencyData.full_name,
              tradeLicenseNumber: agencyData.license_number,
              countryOfRegistration: agencyData.country,
              contactPhone: agencyData.business_phone,
              officialEmail: agencyData.business_email,
              website: agencyData.website_url,
              headOfficeAddress: agencyData.head_office_address,
              operatingCities: agencyData.service_countries || [],
              servicesOffered: agencyData.specialization || [],
              placementFee: agencyData.placement_fee_percentage?.toString() || '5.0',
              aboutAgency: agencyData.agency_description,
              supportHoursStart: agencyData.support_hours_start,
              supportHoursEnd: agencyData.support_hours_end,
              emergencyContactPhone: agencyData.emergency_contact_phone,
              logo: agencyData.logo_url,
              logoFilePreview: agencyData.logo_file_preview,
              authorizedPersonName: agencyData.authorized_person_name,
              authorizedPersonPosition: agencyData.authorized_person_position,
              authorizedPersonPhone: agencyData.authorized_person_phone,
              authorizedPersonEmail: agencyData.authorized_person_email,
              authorizedPersonIdNumber: agencyData.authorized_person_id_number,
              contactPhoneVerified: agencyData.contact_phone_verified || false,
              officialEmailVerified: agencyData.official_email_verified || false,
              authorizedPersonPhoneVerified: agencyData.authorized_person_phone_verified || false,
              authorizedPersonEmailVerified: agencyData.authorized_person_email_verified || false,
              licenseExpiryDate: agencyData.license_expiry_date,
              verificationStatus: agencyData.verification_status || 'pending',
            };
            log.debug('Enriched profile with agency data:', enrichedProfile);
            return enrichedProfile;
          } else if (agencyErrors) {
            log.warn('Error fetching agency profile:', agencyErrors);
          }
        } catch (agencyFetchError) {
          log.error('Exception fetching agency profile:', agencyFetchError);
        }
      }

      // Return database profile only
      return baseProfile;
    } catch (e) {
      log.error('Exception fetching user profile:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      log.warn('Firebase Auth not initialized');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      log.debug('Firebase auth state changed:', firebaseUser ? 'user logged in' : 'no user');

      try {
        if (firebaseUser) {
          // Get the ID token for Hasura
          const token = await firebaseUser.getIdToken();
          localStorage.setItem(FIREBASE_TOKEN_KEY, token);

          // Create session object for compatibility
          const sessionData = {
            access_token: token,
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              email_confirmed_at: firebaseUser.emailVerified ? new Date().toISOString() : null,
            },
          };
          setSession(sessionData);

          // Fetch user profile
          const profile = await fetchUserProfile(firebaseUser);
          setUser(profile);

          // Initialize notification service for the user (non-blocking)
          notificationService.initialize(profile).catch((notificationError) => {
            log.warn('Notification service initialization failed:', notificationError);
          });

          // Ensure session manager is running
          sessionManager.ensureSession().catch((sessionError) => {
            log.warn('Session manager check failed:', sessionError);
          });
        } else {
          // User signed out
          setUser(null);
          setSession(null);
          localStorage.removeItem(FIREBASE_TOKEN_KEY);
        }
      } catch (error) {
        log.error('Error in auth state change handler:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();

      // Clean up notification service
      try {
        if (notificationService.cleanup) {
          notificationService.cleanup();
        }
      } catch (cleanupError) {
        log.warn('Notification service cleanup failed:', cleanupError);
      }

      // Clean up session manager
      try {
        if (sessionManager.cleanup) {
          sessionManager.cleanup();
        }
      } catch (cleanupError) {
        log.warn('Session manager cleanup failed:', cleanupError);
      }
    };
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      log.debug('AuthContext.logout: starting');
      await secureLogout();
      setUser(null);
      setSession(null);
      log.debug('AuthContext.logout: success');
    } catch (error) {
      await handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Email verification methods using Firebase
  const resendVerificationEmail = useCallback(async () => {
    try {
      log.debug('Resending verification email...');

      if (!auth?.currentUser) {
        const error = new Error('No user logged in');
        log.error('Resend failed: No user');
        return { error };
      }

      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/verify-email`,
      });

      log.debug('Verification email resent successfully');
      return { error: null };
    } catch (error) {
      log.error('Exception resending verification email:', error);
      return { error };
    }
  }, []);

  const checkEmailVerification = useCallback(async () => {
    try {
      log.debug('Checking email verification status...');

      if (!auth?.currentUser) {
        log.warn('No current user found');
        return false;
      }

      // Reload the user to get fresh data from Firebase
      await reload(auth.currentUser);

      if (auth.currentUser.emailVerified) {
        // Update local user state with fresh data via GraphQL
        try {
          const profile = await fetchProfileViaGraphQL(auth.currentUser.uid);

          if (profile) {
            setUser({
              ...profile,
              email_confirmed_at: new Date().toISOString(),
            });
          }
        } catch (profileError) {
          log.warn('Could not fetch profile during email verification check:', profileError.message);
        }

        log.debug('Email verified');
        return true;
      }

      log.debug('Email not verified yet');
      return false;
    } catch (error) {
      log.error('Exception checking email verification:', error);
      return false;
    }
  }, []);

  // Password reset methods (using custom Identity Module API)
  const requestPasswordReset = useCallback(async (email) => {
    try {
      log.debug('Requesting password reset for:', email);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const error = {
          message: data.message || 'Failed to send password reset email'
        };
        log.error('Password reset request failed:', error);
        return { error };
      }

      log.debug('Password reset email sent successfully');
      return { error: null };
    } catch (error) {
      log.error('Exception requesting password reset:', error);
      return { error: { message: error.message || 'An error occurred' } };
    }
  }, []);

  const resetPassword = useCallback(async (newPassword) => {
    try {
      log.debug('Resetting password with token...');

      // Extract token from URL (added by ResetPassword page from URL params)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        const error = { message: 'No reset token found. Please use the link from your email.' };
        log.error('Password reset failed:', error);
        return { error };
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const error = {
          message: data.message || 'Failed to reset password',
          error: data.error
        };
        log.error('Password reset failed:', error);
        return { error };
      }

      log.debug('Password reset successfully');
      return { error: null };
    } catch (error) {
      log.error('Exception resetting password:', error);
      return { error: { message: error.message || 'An error occurred' } };
    }
  }, []);

  // Update registration_complete flag via GraphQL
  const updateRegistrationStatus = useCallback(async (status) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    setLoading(true);
    try {
      const updatedRow = await updateProfileViaGraphQL(user.id, {
        registration_complete: !!status,
      });

      setUser((prev) => ({
        ...prev,
        registration_complete: !!status,
        ...(updatedRow || {}),
      }));
      return updatedRow;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const register = useCallback(async (credentials) => {
    setLoading(true);
    try {
      log.debug('AuthContext.register: starting');
      const result = await secureRegister(credentials);

      if (result.session) {
        setSession(result.session);

        // Fetch or create user profile
        try {
          const profile = await fetchUserProfile(auth?.currentUser);
          setUser(profile);
        } catch (profileError) {
          log.error('Error fetching/creating profile after registration:', profileError);
          // Don't fail registration if profile fetch fails - user can complete profile later
          const basicProfile = {
            id: result.user.id,
            email: result.user.email,
            userType: credentials.userType || 'sponsor',
            full_name: credentials.name || result.user.user_metadata?.name || '',
            phone: credentials.phone || '',
            country: credentials.country || '',
            registration_complete: false,
          };
          setUser(basicProfile);
          log.warn('Using basic profile from registration data due to profile fetch error');
        }
      } else {
        toast({
          title: 'Verify Your Email',
          description:
            'We sent you a verification link to complete registration.',
        });
      }

      log.debug('AuthContext.register: success');
      return result;
    } catch (error) {
      log.error('AuthContext.register: failed', error);

      // Provide more specific error message
      const errorMessage = error.message || 'Registration failed';
      if (errorMessage.includes('Database error') || errorMessage.includes('profile')) {
        throw new Error('Database error saving new user. Please try again or contact support.');
      }

      await handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      log.debug('AuthContext.login: starting');
      const result = await secureLogin(credentials);

      setSession(result.session);

      const profile = await fetchUserProfile(auth?.currentUser);
      setUser(profile);

      log.debug('AuthContext.login: success');
      return { user: profile, session: result.session };
    } catch (error) {
      await handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const updateUserProfileData = useCallback(async (newData) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    if (!session) {
      log.error('No active session found, attempting to refresh...');

      // Try to refresh the token
      try {
        if (auth?.currentUser) {
          const token = await auth.currentUser.getIdToken(true);
          localStorage.setItem(FIREBASE_TOKEN_KEY, token);
          setSession({
            access_token: token,
            user: {
              id: auth.currentUser.uid,
              email: auth.currentUser.email,
            },
          });
          log.debug('Session refreshed successfully');
        } else {
          throw new Error('Authentication session expired. Please log in again.');
        }
      } catch (refreshError) {
        log.error('Session refresh failed:', refreshError);
        throw new Error('Authentication session expired. Please log in again.');
      }
    }

    setLoading(true);
    try {
      log.debug('Starting profile update process...');
      log.debug('Profile data to save:', newData);
      log.debug('Current user:', {
        id: user.id,
        email: user.email,
        userType: user.userType,
        full_name: user.full_name,
      });

      // First try to update the existing user profile
      const userUpdateData = {
        full_name: newData.name || newData.full_name || user.full_name || '',
        phone: newData.phone || user.phone,
        country: newData.country || user.country,
        registration_complete: true,
        user_type: user.userType || user.user_type || newData.userType || null,
      };

      log.debug('Attempting to update profile via GraphQL with:', userUpdateData);

      // Update profile via GraphQL
      let updatedRow = null;
      let error = null;
      try {
        updatedRow = await updateProfileViaGraphQL(user.id, userUpdateData);
        log.debug('Profile update result:', { updatedRow });
      } catch (updateError) {
        error = updateError;
        log.error('Profile update error:', updateError);
      }

      if (!error && updatedRow) {
        // Successfully updated profiles table
        log.debug('Profile updated successfully in profiles table');

        // Now handle user-type specific data
        if (user.userType === 'sponsor') {
          log.debug('Creating/updating sponsor profile...');
          try {
            await createOrUpdateSponsorProfile(user.id, newData);
            log.debug('Sponsor profile created/updated successfully');
          } catch (sponsorError) {
            log.error('Error with sponsor profile:', sponsorError);
            toast({
              title: 'Profile Saved with Warning',
              description:
                'Main profile saved, but sponsor details may need attention.',
              variant: 'default',
            });
          }
        } else if (user.userType === 'maid') {
          log.debug('Creating/updating maid profile...');
          try {
            await createOrUpdateMaidProfile(user.id, newData);
            log.debug('Maid profile created/updated successfully');
          } catch (maidError) {
            log.error('Error with maid profile:', maidError);

            let errorMessage = 'Main profile saved, but maid details may need attention.';
            if (maidError.message?.includes('constraint')) {
              errorMessage = 'Profile saved, but some maid information doesn\'t meet requirements.';
            }

            toast({
              title: 'Profile Saved with Warning',
              description: errorMessage,
              variant: 'default',
            });
          }
        } else if (user.userType === 'agency') {
          log.debug('Creating/updating agency profile...');
          try {
            await createOrUpdateAgencyProfile(user.id, newData);
            log.debug('Agency profile created/updated successfully');
          } catch (agencyError) {
            log.error('Error with agency profile:', agencyError);
            toast({
              title: 'Profile Saved with Warning',
              description:
                'Main profile saved, but agency details may need attention.',
              variant: 'default',
            });
          }
        }

        // Clear localStorage since data is now in database
        try {
          localStorage.removeItem('ethio-maids-user');
          log.debug('Cleared localStorage completion data - now in database');
        } catch (e) {
          log.warn('Failed to clear localStorage:', e);
        }

        log.debug('Updating user state after successful profile update');

        // For agency users, refresh the profile to include agency data
        if (user.userType === 'agency' && auth?.currentUser) {
          try {
            log.debug('Refreshing agency profile data after update');
            const refreshedProfile = await fetchUserProfile(auth.currentUser);
            if (refreshedProfile) {
              setUser(refreshedProfile);
              return refreshedProfile;
            }
          } catch (refreshError) {
            log.warn('Failed to refresh agency profile, using basic profile:', refreshError);
          }
        }

        setUser((prevUser) => ({
          ...prevUser,
          ...updatedRow,
          profileInDatabase: true,
          registration_complete: true,
        }));
        return updatedRow;
      }

      if (error) {
        log.error('Profile update failed:', {
          message: error.message,
        });

        // If profile doesn't exist, create it now
        if (
          error.message.includes('No rows found') ||
          error.message.includes('row-level security')
        ) {
          log.debug('Profile not found, creating new profile via GraphQL...');

          const userInsertData = {
            id: user.id,
            email: user.email,
            full_name: newData.name || newData.full_name || user.full_name || '',
            user_type: user.userType,
            is_active: true,
            phone: user.phone || newData.phone,
            country: user.country || newData.country,
            registration_complete: true,
          };

          log.debug('Attempting to insert new profile via GraphQL:', userInsertData);

          let newProfile = null;
          let insertError = null;

          try {
            const { data: mutationResult, errors } = await apolloClient.mutate({
              mutation: CREATE_PROFILE_MUTATION,
              variables: { data: userInsertData },
            });

            if (errors && errors.length > 0) {
              insertError = { message: errors[0].message };
            } else {
              newProfile = mutationResult?.insert_profiles_one;
            }
          } catch (mutationError) {
            insertError = { message: mutationError.message };
          }

          if (insertError) {
            log.error('Error creating profile:', {
              message: insertError.message,
            });

            let errorMessage =
              'Unable to save profile to database. Please try again.';
            if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
              errorMessage =
                'Profile already exists. Please try logging in instead.';
            } else if (insertError.message.includes('permission')) {
              errorMessage = 'Permission denied. Please contact support.';
            }

            toast({
              title: 'Profile Creation Failed',
              description: errorMessage,
              variant: 'destructive',
            });

            throw new Error(insertError.message);
          } else {
            log.debug('Profile created successfully:', newProfile);

            // Create user-type specific profile after successful profile creation
            if (user.userType === 'sponsor') {
              try {
                await createOrUpdateSponsorProfile(user.id, newData);
                log.debug('Sponsor profile created successfully');
              } catch (sponsorError) {
                log.error('Error creating sponsor profile:', sponsorError);
                toast({
                  title: 'Profile Created with Warning',
                  description:
                    'Main profile created, but sponsor details may need attention.',
                  variant: 'default',
                });
              }
            } else if (user.userType === 'maid') {
              try {
                await createOrUpdateMaidProfile(user.id, newData);
                log.debug('Maid profile created successfully');
              } catch (maidError) {
                log.error('Error creating maid profile:', maidError);
                toast({
                  title: 'Profile Created with Warning',
                  description:
                    'Main profile created, but maid details may need attention.',
                  variant: 'default',
                });
              }
            } else if (user.userType === 'agency') {
              try {
                await createOrUpdateAgencyProfile(user.id, newData);
                log.debug('Agency profile created successfully');
              } catch (agencyError) {
                log.error('Error creating agency profile:', agencyError);
                toast({
                  title: 'Profile Created with Warning',
                  description:
                    'Main profile created, but agency details may need attention.',
                  variant: 'default',
                });
              }
            }

            // Clear localStorage since data is now in database
            try {
              localStorage.removeItem('ethio-maids-user');
              log.debug(
                'Cleared localStorage completion data - now in database'
              );
            } catch (e) {
              log.warn('Failed to clear localStorage:', e);
            }

            setUser((prevUser) => ({
              ...prevUser,
              ...newProfile,
              profileInDatabase: true,
              registration_complete: true,
            }));
            return newProfile;
          }
        } else {
          // Handle other types of profile update errors
          log.error('Profile update failed with unhandled error:', error);

          let errorMessage =
            'Unable to save profile changes. Please try again.';
          if (error.message.includes('row-level security')) {
            errorMessage =
              'You do not have permission to update this profile.';
          } else if (error.message.includes('JWT')) {
            errorMessage = 'Your session has expired. Please log in again.';
          }

          toast({
            title: 'Profile Update Failed',
            description: errorMessage,
            variant: 'destructive',
          });
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      log.error('Error updating user profile data:', {
        message: error.message,
        stack: error.stack,
      });

      let errorTitle = 'Profile Update Failed';
      let errorDescription =
        'Unable to save profile changes. Please try again.';

      if (error.message.includes('connection')) {
        errorTitle = 'Connection Error';
        errorDescription =
          'Please check your internet connection and try again.';
      } else if (error.message.includes('row-level security')) {
        errorTitle = 'Permission Error';
        errorDescription =
          'You do not have permission to perform this action.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, session, fetchUserProfile]);

  // Add updateUser function for compatibility (uses GraphQL)
  const updateUser = useCallback(async (userData) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);

      // Update the profiles table via GraphQL
      const updatedData = await updateProfileViaGraphQL(user.id, userData);

      // Update local user state with database response or provided data
      const updatedUser = { ...user, ...(updatedData || userData) };
      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      log.error('Error in updateUser:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to fix user type mismatch (uses GraphQL)
  const fixUserType = useCallback(async (correctUserType) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setLoading(true);
    try {
      log.debug(
        'Fixing user type from',
        user.userType,
        'to',
        correctUserType
      );

      // Update the database profile via GraphQL
      const updatedRow = await updateProfileViaGraphQL(user.id, {
        user_type: correctUserType,
      });

      // Update the user state
      setUser((prevUser) => ({
        ...prevUser,
        userType: correctUserType,
        user_type: correctUserType,
        ...(updatedRow || {}),
      }));

      log.debug('User type fixed successfully');

      toast({
        title: 'User Type Updated',
        description: `Your account has been updated to: ${correctUserType}`,
        variant: 'default',
      });

      return updatedRow;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to refresh user profile (useful after profile updates)
  const refreshUserProfile = useCallback(async () => {
    if (!auth?.currentUser) {
      log.warn('No Firebase user available for profile refresh');
      return null;
    }

    try {
      log.debug('Refreshing user profile...');
      setLoading(true);
      const refreshedProfile = await fetchUserProfile(auth.currentUser);
      if (refreshedProfile) {
        setUser(refreshedProfile);
        log.debug('User profile refreshed successfully');
        return refreshedProfile;
      }
      return null;
    } catch (error) {
      log.error('Error refreshing user profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const value = useMemo(() => ({
    user,
    session,
    login,
    logout,
    register,
    loading,
    updateRegistrationStatus,
    updateUserProfileData,
    updateUser,
    fixUserType,
    refreshUserProfile,
    resendVerificationEmail,
    checkEmailVerification,
    requestPasswordReset,
    resetPassword,
  }), [user, session, login, logout, register, loading, updateRegistrationStatus, updateUserProfileData, updateUser, fixUserType, refreshUserProfile, resendVerificationEmail, checkEmailVerification, requestPasswordReset, resetPassword]);

  log.debug('AuthProvider rendering with value:', {
    hasUser: !!user,
    loading,
    userType: user?.userType,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
