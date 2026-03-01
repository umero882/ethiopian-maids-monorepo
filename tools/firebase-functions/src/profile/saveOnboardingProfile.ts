/**
 * saveOnboardingProfile Cloud Function
 *
 * Uses Hasura admin secret to upsert profiles and type-specific tables,
 * bypassing JWT role permission issues entirely.
 *
 * This solves:
 * - Root Cause 1: Hasura role permissions not configured for singular roles
 * - Root Cause 2: profiles row never created (client-side INSERT fails silently)
 * - Root Cause 3: Sponsor field name mismatches (normalized here)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GraphQLClient, gql } from 'graphql-request';

// Hasura config
const HASURA_ENDPOINT =
  functions.config().hasura?.endpoint || process.env.HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET =
  functions.config().hasura?.admin_secret || process.env.HASURA_ADMIN_SECRET;

function getAdminClient(): GraphQLClient {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Hasura configuration missing. Set hasura.endpoint and hasura.admin_secret.'
    );
  }
  return new GraphQLClient(HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET },
  });
}

// ---- GraphQL Mutations ----

const UPSERT_PROFILE = gql`
  mutation UpsertProfile($data: profiles_insert_input!) {
    insert_profiles_one(
      object: $data
      on_conflict: {
        constraint: profiles_pkey
        update_columns: [
          full_name
          phone
          country
          user_type
          avatar_url
          registration_complete
          updated_at
        ]
      }
    ) {
      id
      full_name
      email
      user_type
      registration_complete
    }
  }
`;

const UPSERT_MAID_PROFILE = gql`
  mutation UpsertMaidProfile($data: maid_profiles_insert_input!) {
    insert_maid_profiles_one(
      object: $data
      on_conflict: {
        constraint: maid_profiles_pkey
        update_columns: [
          user_id
          full_name
          first_name
          middle_name
          last_name
          date_of_birth
          nationality
          current_location
          marital_status
          children_count
          experience_years
          previous_countries
          skills
          languages
          education_level
          preferred_salary_min
          preferred_salary_max
          preferred_currency
          available_from
          availability_status
          contract_duration_preference
          live_in_preference
          passport_number
          passport_expiry
          visa_status
          medical_certificate_valid
          police_clearance_valid
          profile_completion_percentage
          verification_status
          profile_photo_url
          phone_country_code
          phone_number
          alternative_phone
          street_address
          state_province
          country
          religion
          religion_other
          primary_profession
          current_visa_status
          current_visa_status_other
          primary_profession_other
          introduction_video_url
          is_agency_managed
          agency_id
          about_me
          key_responsibilities
          work_history
          work_preferences
          additional_notes
          updated_at
        ]
      }
    ) {
      id
      full_name
      created_at
      updated_at
    }
  }
`;

const UPSERT_SPONSOR_PROFILE = gql`
  mutation UpsertSponsorProfile($data: sponsor_profiles_insert_input!) {
    insert_sponsor_profiles_one(
      object: $data
      on_conflict: {
        constraint: sponsor_profiles_pkey
        update_columns: [
          full_name
          household_size
          number_of_children
          children_ages
          elderly_care_needed
          pets
          pet_types
          city
          country
          address
          accommodation_type
          preferred_nationality
          preferred_experience_years
          required_skills
          preferred_languages
          salary_budget_min
          salary_budget_max
          currency
          live_in_required
          working_hours_per_day
          days_off_per_week
          overtime_available
          additional_benefits
          occupation
          company
          payment_frequency
          contract_duration
          room_amenities
          religion
          avatar_url
          identity_verified
          background_check_completed
          onboarding_completed
          onboarding_completed_at
          profile_completed
          profile_completed_at
          updated_at
        ]
      }
    ) {
      id
      full_name
      avatar_url
      created_at
      updated_at
    }
  }
`;

const UPSERT_AGENCY_PROFILE = gql`
  mutation UpsertAgencyProfile($data: agency_profiles_insert_input!) {
    insert_agency_profiles_one(
      object: $data
      on_conflict: {
        constraint: agency_profiles_pkey
        update_columns: [
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
          logo_url
          logo_file_preview
          license_expiry_date
          updated_at
        ]
      }
    ) {
      id
      full_name
      created_at
      updated_at
    }
  }
`;

// ---- Interfaces ----

interface ProfileData {
  [key: string]: unknown;
}

interface SaveOnboardingRequest {
  userType: 'maid' | 'sponsor' | 'agency';
  profileData: ProfileData;
  basicProfileData?: ProfileData;
}

// ---- Helper: Normalize sponsor data ----

function normalizeSponsorData(userId: string, data: ProfileData): Record<string, unknown> {
  return {
    id: userId,
    full_name: (data.full_name as string) || (data.fullName as string) || '',
    // FIX Root Cause 3: Map family_size -> household_size, children_count -> number_of_children
    household_size:
      data.household_size !== undefined
        ? parseInt(String(data.household_size)) || 1
        : data.family_size !== undefined
          ? parseInt(String(data.family_size)) || 1
          : 1,
    number_of_children:
      data.number_of_children !== undefined
        ? parseInt(String(data.number_of_children)) || 0
        : data.children_count !== undefined
          ? parseInt(String(data.children_count)) || 0
          : 0,
    children_ages: Array.isArray(data.children_ages)
      ? data.children_ages.map((age: any) => {
          if (typeof age === 'number') return age;
          // Convert string labels to representative integer ages
          const labelMap: Record<string, number[]> = {
            'none': [], 'infants': [1], 'toddlers': [3],
            'children': [8], 'teenagers': [14], 'mixed': [3, 8, 14],
          };
          const key = String(age).toLowerCase().trim();
          if (labelMap[key]) return labelMap[key];
          const parsed = parseInt(key);
          return isNaN(parsed) ? null : parsed;
        }).flat().filter((v: any) => v !== null && v !== undefined)
      : [],
    elderly_care_needed: Boolean(data.elderly_care_needed),
    pets: Boolean(data.pets),
    pet_types: Array.isArray(data.pet_types) ? data.pet_types : [],
    city: data.city || null,
    country: data.country || null,
    address: data.address || null,
    accommodation_type: data.accommodation_type || null,
    preferred_nationality: Array.isArray(data.preferred_nationality) ? data.preferred_nationality : [],
    preferred_experience_years: parseInt(String(data.preferred_experience_years || 0)) || 0,
    required_skills: Array.isArray(data.required_skills) ? data.required_skills : [],
    preferred_languages: Array.isArray(data.preferred_languages) ? data.preferred_languages : [],
    salary_budget_min:
      data.salary_budget_min !== undefined && data.salary_budget_min !== ''
        ? parseInt(String(data.salary_budget_min))
        : null,
    salary_budget_max:
      data.salary_budget_max !== undefined && data.salary_budget_max !== ''
        ? parseInt(String(data.salary_budget_max))
        : null,
    currency: data.currency || 'USD',
    live_in_required: data.live_in_required !== false,
    working_hours_per_day: parseInt(String(data.working_hours_per_day || 8)) || 8,
    days_off_per_week: parseInt(String(data.days_off_per_week || 1)) || 1,
    overtime_available: Boolean(data.overtime_available),
    additional_benefits: Array.isArray(data.additional_benefits)
      ? data.additional_benefits
      : Array.isArray(data.benefits)
        ? data.benefits
        : [],
    occupation: (data.occupation as string) || null,
    company: (data.company as string) || null,
    payment_frequency: (data.payment_frequency as string) || null,
    contract_duration: (data.contract_duration as string) || null,
    room_amenities: Array.isArray(data.room_amenities) ? data.room_amenities : [],
    religion: data.religion || data.preferred_religion || null,
    avatar_url: data.avatar_url || null,
    identity_verified: Boolean(data.identity_verified),
    background_check_completed: Boolean(data.background_check_completed),
    onboarding_completed: data.onboarding_completed !== undefined
      ? Boolean(data.onboarding_completed) : true,
    onboarding_completed_at: data.onboarding_completed_at || new Date().toISOString(),
    profile_completed: data.profile_completed !== undefined
      ? Boolean(data.profile_completed) : true,
    profile_completed_at: data.profile_completed_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ---- Helper: Normalize maid data ----

function normalizeMaidData(userId: string, data: ProfileData): Record<string, unknown> {
  const maidData: Record<string, unknown> = {
    id: userId,
    user_id: userId,
    full_name: (data.full_name as string) || '',
    first_name: data.first_name || null,
    middle_name: data.middle_name || null,
    last_name: data.last_name || null,
    date_of_birth: data.date_of_birth || data.dateOfBirth || null,
    nationality: data.nationality || null,
    current_location: data.current_location || null,
    marital_status: data.marital_status || data.maritalStatus || null,
    children_count: parseInt(String(data.children_count || 0)) || 0,
    experience_years: parseInt(String(data.experience_years || data.totalExperienceYears || 0)) || 0,
    previous_countries: Array.isArray(data.previous_countries) ? data.previous_countries : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    languages: Array.isArray(data.languages) ? data.languages
      : Array.isArray(data.languagesSpoken) ? data.languagesSpoken : [],
    education_level: data.education_level || data.educationLevel || null,
    preferred_salary_min: data.preferred_salary_min !== undefined ? parseInt(String(data.preferred_salary_min)) || null : null,
    preferred_salary_max: data.preferred_salary_max !== undefined ? parseInt(String(data.preferred_salary_max)) || null : null,
    preferred_currency: data.preferred_currency || data.currency || 'USD',
    available_from: data.available_from || null,
    availability_status: data.availability_status || data.availability || 'available',
    contract_duration_preference: data.contract_duration_preference || data.contractDuration || null,
    live_in_preference: data.live_in_preference !== undefined ? Boolean(data.live_in_preference) : true,
    passport_number: data.passport_number || null,
    passport_expiry: data.passport_expiry || null,
    visa_status: data.visa_status || null,
    medical_certificate_valid: Boolean(data.medical_certificate_valid),
    police_clearance_valid: Boolean(data.police_clearance_valid),
    profile_completion_percentage: parseInt(String(data.profile_completion_percentage || 100)) || 100,
    verification_status: (data.verification_status as string) || 'pending',
    profile_photo_url: data.profile_photo_url || data.profilePictureUrl || null,
    phone_country_code: data.phone_country_code || null,
    phone_number: data.phone_number || data.phone || null,
    alternative_phone: data.alternative_phone || null,
    street_address: data.street_address || data.streetAddress || null,
    state_province: data.state_province || data.stateProvince || null,
    country: data.country || null,
    religion: data.religion || null,
    religion_other: data.religion_other || null,
    primary_profession: data.primary_profession || data.primaryProfession || null,
    current_visa_status: data.current_visa_status || data.currentVisaStatus || null,
    current_visa_status_other: data.current_visa_status_other || null,
    primary_profession_other: data.primary_profession_other || null,
    introduction_video_url: data.introduction_video_url || null,
    is_agency_managed: Boolean(data.is_agency_managed),
    agency_id: data.agency_id || null,
    about_me: data.about_me || data.aboutMe || null,
    key_responsibilities: Array.isArray(data.key_responsibilities) ? data.key_responsibilities : [],
    work_history: Array.isArray(data.work_history) ? data.work_history : [],
    work_preferences: Array.isArray(data.work_preferences) ? data.work_preferences : [],
    additional_notes: data.additional_notes || null,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined values
  Object.keys(maidData).forEach((k) => {
    if (maidData[k] === undefined) delete maidData[k];
  });

  return maidData;
}

// ---- Helper: Normalize agency data ----

function normalizeAgencyData(userId: string, data: ProfileData): Record<string, unknown> {
  const agencyName = (data.agencyName as string) || (data.full_name as string) || '';
  return {
    id: userId,
    full_name: agencyName.trim(),
    license_number: data.tradeLicenseNumber || data.licenseNumber || data.license_number || null,
    country: data.countryOfRegistration || data.country || null,
    business_phone: data.contactPhone || data.business_phone || data.phone || null,
    business_email: data.officialEmail || data.business_email || data.email || null,
    website_url: data.website || data.website_url || null,
    head_office_address: data.headOfficeAddress || data.head_office_address || null,
    service_countries: Array.isArray(data.operatingCities) ? data.operatingCities
      : Array.isArray(data.operatingRegions) ? data.operatingRegions
        : Array.isArray(data.service_countries) ? data.service_countries : [],
    specialization: Array.isArray(data.servicesOffered) ? data.servicesOffered
      : Array.isArray(data.specialization) ? data.specialization : [],
    placement_fee_percentage: parseFloat(String(data.placementFee || data.placement_fee_percentage || 5.0)) || 5.0,
    agency_description: data.aboutAgency || data.agency_description || null,
    support_hours_start: data.supportHoursStart || data.support_hours_start || '09:00',
    support_hours_end: data.supportHoursEnd || data.support_hours_end || '17:00',
    emergency_contact_phone: data.emergencyContactPhone || data.emergency_contact_phone || null,
    authorized_person_name: data.authorizedPersonName || data.authorized_person_name || null,
    authorized_person_position: data.authorizedPersonPosition || data.authorized_person_position || null,
    authorized_person_phone: data.authorizedPersonPhone || data.authorized_person_phone || null,
    authorized_person_email: data.authorizedPersonEmail || data.authorized_person_email || null,
    authorized_person_id_number: data.authorizedPersonIdNumber || data.authorized_person_id_number || null,
    logo_url: data.logo || data.logo_url || null,
    logo_file_preview: data.logoFilePreview || data.logo_file_preview || null,
    license_expiry_date: data.licenseExpiryDate
      ? new Date(data.licenseExpiryDate as string).toISOString()
      : data.license_expiry_date || null,
    updated_at: new Date().toISOString(),
  };
}

// ---- Main Cloud Function ----

export async function saveOnboardingProfile(
  data: SaveOnboardingRequest,
  context: functions.https.CallableContext
): Promise<{ success: boolean; profile: unknown; typeProfile: unknown }> {
  // Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { userType, profileData, basicProfileData } = data;

  console.log(`[saveOnboardingProfile] Starting for user ${userId}, type=${userType}`);

  // Validate userType
  const validTypes = ['maid', 'sponsor', 'agency'];
  if (!userType || !validTypes.includes(userType)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid userType: "${userType}". Must be one of: maid, sponsor, agency`
    );
  }

  const client = getAdminClient();

  // Get user email from Firebase Auth
  let userEmail = '';
  try {
    const userRecord = await admin.auth().getUser(userId);
    userEmail = userRecord.email || '';
  } catch (e) {
    console.warn(`[saveOnboardingProfile] Could not get user email:`, e);
  }

  // STEP 1: Upsert the profiles row (basic user info + registration_complete)
  const basicData = basicProfileData || {};
  const profileRow = {
    id: userId,
    email: userEmail || basicData.email || profileData.email || '',
    full_name: basicData.full_name || profileData.full_name || profileData.agencyName || '',
    phone: basicData.phone || profileData.phone || profileData.phone_number || '',
    country: basicData.country || profileData.country || '',
    avatar_url: basicData.avatar_url || profileData.profile_photo_url || profileData.profilePictureUrl || profileData.logo || null,
    user_type: userType,
    registration_complete: true,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  console.log(`[saveOnboardingProfile] Upserting profiles row:`, JSON.stringify(profileRow));

  let profileResult: unknown;
  try {
    profileResult = await client.request(UPSERT_PROFILE, { data: profileRow });
    console.log(`[saveOnboardingProfile] Profiles row upserted successfully`);
  } catch (profileError) {
    console.error(`[saveOnboardingProfile] Failed to upsert profiles row:`, profileError);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to create/update profile: ${(profileError as Error).message}`
    );
  }

  // STEP 2: Upsert type-specific table
  let typeProfileResult: unknown = null;

  try {
    if (userType === 'maid') {
      const maidData = normalizeMaidData(userId, profileData);
      console.log(`[saveOnboardingProfile] Upserting maid_profiles`);
      typeProfileResult = await client.request(UPSERT_MAID_PROFILE, { data: maidData });
    } else if (userType === 'sponsor') {
      const sponsorData = normalizeSponsorData(userId, profileData);
      console.log(`[saveOnboardingProfile] Upserting sponsor_profiles`);
      typeProfileResult = await client.request(UPSERT_SPONSOR_PROFILE, { data: sponsorData });
    } else if (userType === 'agency') {
      const agencyData = normalizeAgencyData(userId, profileData);
      console.log(`[saveOnboardingProfile] Upserting agency_profiles`);
      typeProfileResult = await client.request(UPSERT_AGENCY_PROFILE, { data: agencyData });
    }
    console.log(`[saveOnboardingProfile] Type-specific profile upserted successfully`);
  } catch (typeError) {
    console.error(`[saveOnboardingProfile] Failed to upsert ${userType} profile:`, typeError);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to create/update ${userType} profile: ${(typeError as Error).message}`
    );
  }

  console.log(`[saveOnboardingProfile] Complete for user ${userId}`);

  return {
    success: true,
    profile: profileResult,
    typeProfile: typeProfileResult,
  };
}

// ---- ensureProfileExists Cloud Function ----

/**
 * Creates the profiles row if it doesn't exist.
 * Called from fetchUserProfile when the client-side INSERT fails.
 */
export async function ensureProfileExists(
  data: { userType?: string },
  context: functions.https.CallableContext
): Promise<{ success: boolean; profile: unknown }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const userType = data?.userType || 'user';

  console.log(`[ensureProfileExists] Ensuring profile for user ${userId}, type=${userType}`);

  const client = getAdminClient();

  let userEmail = '';
  let displayName = '';
  let phoneNumber = '';
  try {
    const userRecord = await admin.auth().getUser(userId);
    userEmail = userRecord.email || '';
    displayName = userRecord.displayName || '';
    phoneNumber = userRecord.phoneNumber || '';
  } catch (e) {
    console.warn(`[ensureProfileExists] Could not get user record:`, e);
  }

  const profileRow = {
    id: userId,
    email: userEmail,
    full_name: displayName,
    phone: phoneNumber,
    user_type: userType,
    registration_complete: false,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  try {
    const result = await client.request(UPSERT_PROFILE, { data: profileRow });
    console.log(`[ensureProfileExists] Profile ensured for user ${userId}`);
    return { success: true, profile: result };
  } catch (error) {
    console.error(`[ensureProfileExists] Failed:`, error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to ensure profile exists: ${(error as Error).message}`
    );
  }
}
