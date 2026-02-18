/**
 * Profile Completion Utility
 *
 * Shared logic for calculating profile completion percentage
 * Used by both OnboardingContext and Profile Page
 *
 * This ensures consistency between:
 * 1. The profile completion shown during onboarding
 * 2. The profile completion shown on the profile page
 */

// Required fields that are collected during onboarding
// These map to the actual field names used in onboarding step components
export const ONBOARDING_REQUIRED_FIELDS = {
  // Personal Info (MaidPersonalStep)
  full_name: { label: 'Full Name', weight: 1 },
  date_of_birth: { label: 'Date of Birth', weight: 1 },
  nationality: { label: 'Nationality', weight: 1 },
  religion: { label: 'Religion', weight: 0.5 },
  marital_status: { label: 'Marital Status', weight: 0.5 },

  // Location (MaidAddressStep)
  country: { label: 'Country', weight: 1 },
  state_province: { label: 'City', weight: 0.5 },

  // Professional (MaidProfessionStep)
  primary_profession: { label: 'Profession', weight: 1 },
  education_level: { label: 'Education', weight: 0.5 },

  // Skills (MaidSkillsStep)
  skills: { label: 'Skills', weight: 1, isArray: true },
  languages: { label: 'Languages', weight: 1, isArray: true },

  // Experience (MaidExperienceStep)
  experience_years: { label: 'Experience', weight: 1 },

  // Preferences (MaidPreferencesStep)
  preferred_salary_min: { label: 'Salary Expectation', weight: 1 },

  // About (MaidAboutStep)
  about_me: { label: 'About Me', weight: 1 },

  // Photo (MaidBiometricDocStep)
  profile_photo_url: { label: 'Profile Photo', weight: 1 },
};

// Optional fields that boost profile but aren't required
// NOTE: Only include columns that exist in maid_profiles schema
export const OPTIONAL_PROFILE_FIELDS = {
  // Video CV (MaidVideoCVStep)
  introduction_video_url: { label: 'Video CV', bonus: 5 },

  // Work preferences
  work_preferences: { label: 'Work Preferences', bonus: 2, isArray: true },
  contract_duration_preference: { label: 'Contract Preference', bonus: 1 },
  live_in_preference: { label: 'Accommodation Preference', bonus: 1 },

  // Experience verification
  previous_countries: { label: 'Previous Countries', bonus: 2, isArray: true },
};

/**
 * Calculate profile completion percentage based on required fields
 *
 * @param {Object} profile - The profile data object (database format with snake_case)
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  let totalWeight = 0;
  let completedWeight = 0;

  Object.entries(ONBOARDING_REQUIRED_FIELDS).forEach(([field, config]) => {
    totalWeight += config.weight;

    const value = profile[field];

    if (config.isArray) {
      // For arrays, check if not empty
      if (Array.isArray(value) && value.length > 0) {
        completedWeight += config.weight;
      }
    } else if (typeof value === 'number') {
      // For numbers, check if > 0
      if (value > 0) {
        completedWeight += config.weight;
      }
    } else if (typeof value === 'boolean') {
      // Booleans are always considered "filled"
      completedWeight += config.weight;
    } else {
      // For strings/dates, check if not empty
      if (value && String(value).trim().length > 0) {
        completedWeight += config.weight;
      }
    }
  });

  return Math.round((completedWeight / totalWeight) * 100);
};

/**
 * Calculate bonus percentage from optional fields
 *
 * @param {Object} profile - The profile data object
 * @returns {number} - Bonus percentage (0-15 typically)
 */
export const calculateOptionalBonus = (profile) => {
  if (!profile) return 0;

  let bonus = 0;

  Object.entries(OPTIONAL_PROFILE_FIELDS).forEach(([field, config]) => {
    const value = profile[field];

    if (config.isArray) {
      if (Array.isArray(value) && value.length > 0) {
        bonus += config.bonus;
      }
    } else if (typeof value === 'boolean') {
      if (value === true) {
        bonus += config.bonus;
      }
    } else {
      if (value && String(value).trim().length > 0) {
        bonus += config.bonus;
      }
    }
  });

  return bonus;
};

/**
 * Get list of missing required fields
 *
 * @param {Object} profile - The profile data object
 * @returns {Array<{field: string, label: string}>} - List of missing fields
 */
export const getMissingRequiredFields = (profile) => {
  if (!profile) return Object.entries(ONBOARDING_REQUIRED_FIELDS).map(([field, config]) => ({
    field,
    label: config.label,
  }));

  const missing = [];

  Object.entries(ONBOARDING_REQUIRED_FIELDS).forEach(([field, config]) => {
    const value = profile[field];

    let isMissing = false;

    if (config.isArray) {
      isMissing = !Array.isArray(value) || value.length === 0;
    } else if (typeof value === 'number') {
      isMissing = value <= 0;
    } else if (typeof value === 'boolean') {
      isMissing = false; // Booleans are always "filled"
    } else {
      isMissing = !value || String(value).trim().length === 0;
    }

    if (isMissing) {
      missing.push({
        field,
        label: config.label,
      });
    }
  });

  return missing;
};

/**
 * Get profile completion status with details
 *
 * @param {Object} profile - The profile data object
 * @returns {Object} - Completion status object
 */
export const getProfileCompletionStatus = (profile) => {
  const percentage = calculateProfileCompletion(profile);
  const bonus = calculateOptionalBonus(profile);
  const missing = getMissingRequiredFields(profile);

  let status = 'incomplete';
  let message = '';

  if (percentage === 100) {
    status = 'complete';
    message = 'Your profile is complete!';
  } else if (percentage >= 80) {
    status = 'almost_complete';
    message = `Almost there! Complete ${missing.length} more field${missing.length > 1 ? 's' : ''}.`;
  } else if (percentage >= 50) {
    status = 'in_progress';
    message = `Keep going! Complete ${missing.length} more field${missing.length > 1 ? 's' : ''}.`;
  } else {
    status = 'just_started';
    message = 'Complete your profile to get more visibility.';
  }

  return {
    percentage,
    bonus,
    totalScore: Math.min(100, percentage + bonus), // Cap at 100
    status,
    message,
    missingFields: missing,
    completedCount: Object.keys(ONBOARDING_REQUIRED_FIELDS).length - missing.length,
    totalRequired: Object.keys(ONBOARDING_REQUIRED_FIELDS).length,
  };
};

/**
 * Map onboarding form data to database profile format
 * Use this when converting form data to database columns
 *
 * @param {Object} formData - The onboarding form data (camelCase)
 * @returns {Object} - Database format (snake_case)
 */
export const mapOnboardingToProfile = (formData) => {
  return {
    // Personal Info
    full_name: formData.full_name || '',
    date_of_birth: formData.dateOfBirth || null,
    nationality: formData.nationality || '',
    religion: formData.religion || '',
    marital_status: formData.maritalStatus || '',

    // Location
    country: formData.country || '',
    state_province: formData.city || '',
    street_address: formData.address || '',

    // Professional
    primary_profession: formData.primaryProfession || '',
    current_visa_status: formData.visaStatus || '',
    education_level: formData.educationLevel || '',

    // Skills & Languages
    skills: formData.skills || [],
    languages: formData.languages || [],

    // Experience
    experience_years: parseExperienceLevelToYears(formData.experience_level),
    previous_countries: formData.countries_worked_in || [],

    // Preferences
    preferred_salary_min: parseSalaryToNumber(formData.expected_salary),
    work_preferences: formData.work_preferences || [],
    contract_duration_preference: formData.contract_type || null,
    live_in_preference: formData.accommodation_preference === 'Live-in' ||
                        formData.accommodation_preference === 'Employer-provided accommodation',

    // Content
    about_me: formData.about_me || '',
  };
};

// Helper: Parse experience level to years
const parseExperienceLevelToYears = (level) => {
  if (!level) return 0;
  const map = {
    'No Experience': 0,
    '1-2 years': 1,
    '3-5 years': 3,
    '6-10 years': 6,
    '10+ years': 10,
  };
  return map[level] ?? 0;
};

// Helper: Parse salary string to number
const parseSalaryToNumber = (salaryString) => {
  if (!salaryString) return null;
  const match = salaryString.toString().match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export default {
  calculateProfileCompletion,
  calculateOptionalBonus,
  getMissingRequiredFields,
  getProfileCompletionStatus,
  mapOnboardingToProfile,
  ONBOARDING_REQUIRED_FIELDS,
  OPTIONAL_PROFILE_FIELDS,
};
