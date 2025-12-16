/**
 * ProfileService - GraphQL Implementation
 *
 * This is the GraphQL version of profileService.js using Hasura
 * Controlled by feature flag: VITE_GRAPHQL_PROFILES
 */

import { apolloClient } from '@ethio/api-client';
import {
  GetMaidProfileDataDocument,
  GetSponsorProfileDataDocument,
  GetAgencyProfileDataDocument,
  GetUserProfileDataDocument,
  UpdateMaidProfileDataDocument,
  UpdateSponsorProfileDataDocument,
  UpdateAgencyProfileDataDocument,
  UpdateProfileAvatarUrlDocument,
} from '@ethio/api-client';
import { uploadProfilePicture as uploadToFirebase } from '@/lib/firebaseStorage';
import { auth } from '@/lib/firebaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('ProfileService:GraphQL');

/**
 * Get profile data with type-specific joins
 */
export async function getProfileData(userId, userType) {
  try {
    let query, queryName;

    // Select appropriate query based on user type
    switch (userType) {
      case 'maid':
        query = GetMaidProfileDataDocument;
        queryName = 'GetMaidProfileData';
        break;
      case 'sponsor':
        query = GetSponsorProfileDataDocument;
        queryName = 'GetSponsorProfileData';
        break;
      case 'agency':
        query = GetAgencyProfileDataDocument;
        queryName = 'GetAgencyProfileData';
        break;
      default:
        query = GetUserProfileDataDocument;
        queryName = 'GetUserProfileData';
    }

    log.debug(`Fetching ${userType} profile via GraphQL`, { userId, queryName });

    const { data, error } = await apolloClient.query({
      query,
      variables: { userId },
      fetchPolicy: 'network-only', // Always get fresh data
    });

    if (error) throw error;

    const profile = data.profiles_by_pk;
    if (!profile) {
      log.warn('Profile not found', { userId });
      return { data: null, error: new Error('Profile not found') };
    }

    // Transform to match existing Supabase structure
    const transformedData = transformProfileData(profile, userType);

    log.info(`[GraphQL] Fetched ${userType} profile for user ${userId}`);
    return { data: transformedData, error: null };

  } catch (error) {
    log.error('[GraphQL] getProfileData error:', error);
    return { data: null, error };
  }
}

/**
 * Update profile with type-specific data
 */
export async function updateProfile(userId, userType, profileData) {
  try {
    log.debug('Starting GraphQL profile update', { userId, userType });

    // Ensure authentication using Firebase
    if (!auth?.currentUser) {
      log.warn('Authentication check failed before update: no Firebase user');
      throw new Error('authentication: no active session');
    }

    // Transform input data to GraphQL format
    const { profileInput, typeSpecificInput, typeSpecificId } =
      transformUpdateInput(profileData, userType, userId);

    // Select mutation based on user type
    let mutation;
    let variables = {
      userId,
      profileData: profileInput,
    };

    switch (userType) {
      case 'maid':
        mutation = UpdateMaidProfileDataDocument;
        variables.maidData = typeSpecificInput;
        variables.maidProfileId = typeSpecificId; // Required for maid profiles
        break;
      case 'sponsor':
        mutation = UpdateSponsorProfileDataDocument;
        variables.sponsorData = typeSpecificInput;
        break;
      case 'agency':
        mutation = UpdateAgencyProfileDataDocument;
        variables.agencyData = typeSpecificInput;
        break;
      default:
        throw new Error(`Unknown user type: ${userType}`);
    }

    log.debug('Executing GraphQL mutation');

    const { data, errors } = await apolloClient.mutate({
      mutation,
      variables,
    });

    if (errors) {
      log.error('GraphQL mutation errors:', errors);
      throw new Error(errors[0].message);
    }

    log.info(`[GraphQL] Updated ${userType} profile for user ${userId}`);
    return { data: profileData, error: null };

  } catch (error) {
    log.error('[GraphQL] updateProfile error:', error);
    return {
      data: null,
      error: {
        message: 'Failed to update profile',
        originalError: error.message,
      },
    };
  }
}

/**
 * Upload profile picture
 * Uses Firebase Storage for file uploads
 */
export async function uploadProfilePicture(userId, file) {
  try {
    log.debug('Uploading profile picture to Firebase Storage', { userId, fileName: file.name });

    // Upload to Firebase Storage
    const { url: publicUrl, path } = await uploadToFirebase(userId, file);

    log.debug('File uploaded successfully', { publicUrl, path });

    // Update avatar URL via GraphQL
    const { errors } = await apolloClient.mutate({
      mutation: UpdateProfileAvatarUrlDocument,
      variables: { userId, avatarUrl: publicUrl },
    });

    if (errors) throw new Error(errors[0].message);

    log.info(`[GraphQL/Firebase] Uploaded avatar for user ${userId}`);
    return { data: { imageUrl: publicUrl }, error: null };

  } catch (error) {
    log.error('[GraphQL] uploadProfilePicture error:', error);
    return { data: null, error };
  }
}

/**
 * Calculate profile completion
 * NOTE: Pure computation, no GraphQL needed
 */
export function getProfileCompletion(profileData, userType) {
  // This is pure computation - same logic as Supabase version
  let requiredFields = [];
  let filledFields = 0;

  switch (userType) {
    case 'maid':
      requiredFields = [
        'first_name',
        'last_name',
        'date_of_birth',
        'nationality',
        'phone_number',
        'languages',
        'experience_years',
        'primary_profession',
        'availability_status',
      ];
      break;
    case 'sponsor':
      requiredFields = [
        'full_name',
        'phone_number',
        'city',
        'country',
        'household_size',
        'required_skills',
        'salary_budget_min',
      ];
      break;
    case 'agency':
      requiredFields = [
        'agency_name',
        'license_number',
        'business_email',
        'business_phone',
        'address',
        'city',
      ];
      break;
    default:
      return 0;
  }

  requiredFields.forEach(field => {
    const value = profileData[field];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) filledFields++;
      else if (!Array.isArray(value)) filledFields++;
    }
  });

  const completion = Math.round((filledFields / requiredFields.length) * 100);
  return completion;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Transform GraphQL response to match Supabase structure
 */
function transformProfileData(graphqlProfile, userType) {
  // Base profile data
  const base = {
    id: graphqlProfile.id,
    email: graphqlProfile.email,
    name: graphqlProfile.name,
    phone: graphqlProfile.phone,
    country: graphqlProfile.country,
    avatar_url: graphqlProfile.avatar_url,
    user_type: graphqlProfile.user_type,
    created_at: graphqlProfile.created_at,
    updated_at: graphqlProfile.updated_at,
  };

  // Add joinDate formatting
  if (graphqlProfile.created_at) {
    base.joinDate = new Date(graphqlProfile.created_at).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } else {
    base.joinDate = 'Recently';
  }

  // Add type-specific data
  if (userType === 'maid' && graphqlProfile.maid_profiles?.length > 0) {
    // NOTE: maid_profiles is an array, take first element
    const maidProfile = graphqlProfile.maid_profiles[0];

    // Flatten maid profile data
    const maidData = { ...maidProfile };

    // Compute derived fields
    const fullNameParts = [
      maidProfile.first_name,
      maidProfile.middle_name,
      maidProfile.last_name,
    ].filter(Boolean).join(' ');

    const derived = {
      fullName: fullNameParts || maidProfile.full_name || null,
      dateOfBirth: maidProfile.date_of_birth || null,
      currentLocation: maidProfile.current_location ||
        [maidProfile.suburb, maidProfile.country].filter(Boolean).join(', ') || null,
      experienceYears: maidProfile.experience_years ?? null,
      skills: maidProfile.skills || maidProfile.special_skills || [],
      languages: maidProfile.languages || [],
      salaryExpectation: maidProfile.preferred_salary_min ?? null,
      availability: maidProfile.availability_status || null,
    };

    return { ...base, ...maidData, ...derived };
  }

  if (userType === 'sponsor' && graphqlProfile.sponsor_profile) {
    // Flatten sponsor profile data
    return { ...base, ...graphqlProfile.sponsor_profile };
  }

  if (userType === 'agency' && graphqlProfile.agency_profile) {
    // Flatten agency profile data
    return { ...base, ...graphqlProfile.agency_profile };
  }

  return base;
}

/**
 * Transform update input from camelCase to snake_case for GraphQL
 */
function transformUpdateInput(profileData, userType, userId) {
  // Extract basic profile fields
  const profileInput = {};
  if (profileData.name !== undefined) profileInput.name = profileData.name;
  if (profileData.phone !== undefined) profileInput.phone = profileData.phone;
  if (profileData.country !== undefined) profileInput.country = profileData.country;

  // Extract type-specific fields
  let typeSpecificInput = {};
  let typeSpecificId = null;

  switch (userType) {
    case 'maid': {
      // Parse fullName if provided
      if (profileData.fullName) {
        const nameParts = splitFullName(profileData.fullName);
        Object.assign(typeSpecificInput, nameParts);
      }

      // Map camelCase to snake_case for maid fields
      const maidFieldMap = {
        firstName: 'first_name',
        middleName: 'middle_name',
        lastName: 'last_name',
        fullName: 'full_name',
        dateOfBirth: 'date_of_birth',
        maritalStatus: 'marital_status',
        nationality: 'nationality',
        country: 'country',
        currentLocation: 'current_location',
        streetAddress: 'street_address',
        languages: 'languages',
        profilePhotoUrl: 'profile_photo_url',
        primaryProfession: 'primary_profession',
        visaStatus: 'visa_status',
        currentVisaStatus: 'current_visa_status',
        skills: 'skills',
        specialSkills: 'special_skills',
        experienceYears: 'experience_years',
        preferredSalaryMin: 'preferred_salary_min',
        preferredSalaryMax: 'preferred_salary_max',
        preferredCurrency: 'preferred_currency',
        availabilityStatus: 'availability_status',
        availableFrom: 'available_from',
        aboutMe: 'about_me',
        additionalServices: 'additional_services',
        workPreferences: 'work_preferences',
        phoneNumber: 'phone_number',
        phoneCountryCode: 'phone_country_code',
        educationLevel: 'education_level',
        religion: 'religion',
        childrenCount: 'children_count',
      };

      Object.keys(maidFieldMap).forEach(camelKey => {
        if (profileData[camelKey] !== undefined) {
          typeSpecificInput[maidFieldMap[camelKey]] = profileData[camelKey];
        }
      });

      // Get maid profile ID (assume it exists and equals user ID for now)
      typeSpecificId = profileData.maidProfileId || profileData.id || userId;
      break;
    }

    case 'sponsor': {
      const sponsorFieldMap = {
        fullName: 'full_name',
        phoneNumber: 'phone_number',
        city: 'city',
        country: 'country',
        address: 'address',
        householdSize: 'household_size',
        numberOfChildren: 'number_of_children',
        childrenAges: 'children_ages',
        elderlyCareNeeded: 'elderly_care_needed',
        pets: 'pets',
        petTypes: 'pet_types',
        accommodationType: 'accommodation_type',
        preferredNationality: 'preferred_nationality',
        preferredExperienceYears: 'preferred_experience_years',
        requiredSkills: 'required_skills',
        preferredLanguages: 'preferred_languages',
        salaryBudgetMin: 'salary_budget_min',
        salaryBudgetMax: 'salary_budget_max',
        currency: 'currency',
        liveInRequired: 'live_in_required',
        workingHoursPerDay: 'working_hours_per_day',
        daysOffPerWeek: 'days_off_per_week',
        overtimeAvailable: 'overtime_available',
        additionalBenefits: 'additional_benefits',
        religion: 'religion',
      };

      Object.keys(sponsorFieldMap).forEach(camelKey => {
        if (profileData[camelKey] !== undefined) {
          typeSpecificInput[sponsorFieldMap[camelKey]] = profileData[camelKey];
        }
      });
      break;
    }

    case 'agency': {
      const agencyFieldMap = {
        agencyName: 'agency_name',
        agencyDescription: 'agency_description',
        licenseNumber: 'license_number',
        licenseExpiryDate: 'license_expiry_date',
        businessEmail: 'business_email',
        businessPhone: 'business_phone',
        address: 'address',
        city: 'city',
        country: 'country',
        websiteUrl: 'website_url',
        logoUrl: 'logo_url',
        authorizedPersonName: 'authorized_person_name',
        authorizedPersonEmail: 'authorized_person_email',
        authorizedPersonPhone: 'authorized_person_phone',
        serviceCountries: 'service_countries',
        specialization: 'specialization',
      };

      Object.keys(agencyFieldMap).forEach(camelKey => {
        if (profileData[camelKey] !== undefined) {
          typeSpecificInput[agencyFieldMap[camelKey]] = profileData[camelKey];
        }
      });
      break;
    }
  }

  return { profileInput, typeSpecificInput, typeSpecificId };
}

/**
 * Split full name into parts
 */
function splitFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') return {};

  const parts = fullName.split(' ').map(p => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    return {
      first_name: parts[0],
      middle_name: parts.slice(1, parts.length - 1).join(' '),
      last_name: parts[parts.length - 1],
    };
  }
  if (parts.length === 2) {
    return {
      first_name: parts[0],
      last_name: parts[1],
    };
  }
  if (parts.length === 1) {
    return {
      first_name: parts[0],
    };
  }

  return {};
}
