/**
 * WhatsApp Flow Definitions - Dropdown data and screen configurations
 *
 * Contains all reference data for the onboarding Flow screens:
 * nationalities, religions, professions, visa statuses, etc.
 *
 * WhatsApp Flows v7.3 format.
 */

// ── Dropdown option helpers ──

interface DropdownOption {
  id: string;
  title: string;
}

function toOptions(items: string[]): DropdownOption[] {
  return items.map((item) => ({ id: item.toLowerCase().replace(/[\s/]+/g, '_'), title: item }));
}

// ── Reference Data ──

export const NATIONALITIES = [
  'Ethiopian', 'Kenyan', 'Ugandan', 'Filipino', 'Indonesian',
  'Sri Lankan', 'Indian', 'Nepali', 'Bangladeshi', 'Ghanaian',
  'Nigerian', 'Cameroonian', 'Tanzanian', 'Eritrean', 'Somali',
  'Malagasy', 'Other',
];

export const RELIGIONS = [
  'Orthodox Christian', 'Muslim', 'Protestant', 'Catholic',
  'Hindu', 'Buddhist', 'Other', 'Prefer not to say',
];

export const MARITAL_STATUSES = [
  'Single', 'Married', 'Divorced', 'Widowed', 'Separated',
];

export const GCC_COUNTRIES = [
  'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'Jordan', 'Lebanon', 'Ethiopia', 'Kenya', 'Uganda', 'Other',
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  saudi_arabia: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Tabuk', 'Other'],
  uae: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Fujairah', 'Ras Al Khaimah', 'Other'],
  qatar: ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail', 'Other'],
  kuwait: ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Other'],
  bahrain: ['Manama', 'Muharraq', 'Riffa', 'Other'],
  oman: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Other'],
  jordan: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Other'],
  lebanon: ['Beirut', 'Tripoli', 'Sidon', 'Jounieh', 'Other'],
  ethiopia: ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Adama', 'Other'],
  kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Other'],
  uganda: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Other'],
  other: ['Other'],
};

export function getCitiesForCountry(countryId: string): DropdownOption[] {
  const key = countryId.toLowerCase().replace(/[\s/]+/g, '_');
  const cities = CITIES_BY_COUNTRY[key] || ['Other'];
  return toOptions(cities);
}

export const PROFESSIONS = [
  'Housemaid', 'Nanny / Babysitter', 'Cook / Chef', 'Cleaner',
  'Elderly Caregiver', 'Driver', 'Laundry / Ironing', 'Gardener',
  'All-around Helper', 'Other',
];

export const VISA_STATUSES = [
  'New (No visa)', 'Valid work visa', 'Visit visa', 'Transfer visa',
  'Freelance visa', 'Expired visa', 'Runaway / Absconded', 'Other',
];

export const EXPERIENCE_LEVELS = [
  'No experience', 'Less than 1 year', '1-2 years', '3-5 years',
  '5-10 years', '10+ years',
];

export const SALARY_RANGES = [
  '1000-1500 AED', '1500-2000 AED', '2000-2500 AED', '2500-3000 AED',
  '3000-3500 AED', '3500-4000 AED', '4000+ AED', 'Negotiable',
];

export const SKILLS = [
  'Cooking', 'Cleaning', 'Laundry & Ironing', 'Childcare',
  'Elderly care', 'Baby care', 'Driving', 'Gardening',
  'Pet care', 'First aid', 'Sewing', 'Tutoring',
];

export const LANGUAGES = [
  'Arabic', 'English', 'Amharic', 'Swahili', 'Tagalog',
  'Hindi', 'Urdu', 'French', 'Oromo', 'Tigrinya', 'Somali', 'Other',
];

export const OCCUPATIONS = [
  'Business Owner', 'Engineer', 'Doctor / Medical', 'Teacher / Professor',
  'Government Employee', 'Military / Police', 'IT Professional',
  'Lawyer', 'Accountant', 'Homemaker', 'Retired', 'Other',
];

export const FAMILY_SIZES = [
  '1 (Single)', '2 (Couple)', '3-4 members', '5-6 members',
  '7-8 members', '9+ members',
];

export const PROPERTY_TYPES = [
  'Apartment', 'Villa', 'Townhouse', 'Compound', 'Farm / Rural', 'Other',
];

export const SALARY_BUDGETS = [
  '1000-1500 AED/month', '1500-2000 AED/month', '2000-2500 AED/month',
  '2500-3000 AED/month', '3000-3500 AED/month', '3500-4000 AED/month', '4000+ AED/month',
];

export const LIVING_ARRANGEMENTS = [
  'Live-in (room provided)', 'Live-out (daily)',
];

export const AGENCY_TYPES = [
  'Licensed recruitment agency', 'Freelance recruiter',
  'Manpower company', 'Household services company', 'Other',
];

export const REP_POSITIONS = [
  'Owner / CEO', 'General Manager', 'Operations Manager',
  'HR Manager', 'Agent / Recruiter', 'Other',
];

export const AGENCY_SERVICES = [
  'Maid recruitment', 'Visa processing', 'Document attestation',
  'Medical checkup coordination', 'Airport pickup / transfer',
  'Training programs', 'Contract management',
  'Replacement guarantee', 'Post-placement support',
];

// ── V2 Additional Reference Data ──

export const EDUCATION_LEVELS = [
  'No formal education', 'Primary school', 'Secondary school',
  'High school diploma', 'Vocational/Technical', 'Associate degree',
  'Bachelor\'s degree', 'Master\'s or higher',
];

export const CONTRACT_TYPES = [
  '1 year', '2 years', '3 years', 'Flexible / Negotiable',
];

export const ACCOMMODATION_PREFERENCES = [
  'Live-in (room provided)', 'Live-out (own accommodation)', 'Either is fine',
];

export const YEARS_IN_BUSINESS = [
  'Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years',
];

export const CHILDREN_COUNTS = [
  '0', '1', '2', '3', '4', '5+',
];

export const ELDERLY_CARE_OPTIONS = [
  'Yes', 'No',
];

export const PREFERRED_NATIONALITIES = [
  'Ethiopian', 'Kenyan', 'Ugandan', 'Filipino', 'Indonesian',
  'Sri Lankan', 'Indian', 'Nepali', 'Any nationality',
];

export const SPONSOR_ACCOMMODATION_TYPES = [
  'Apartment', 'Villa', 'Townhouse', 'Compound', 'Studio', 'Other',
];

export const CONTRACT_DURATIONS = [
  '6 months', '1 year', '2 years', '3 years', 'Flexible',
];

export const COUNTRIES_WORKED_IN = [
  'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'Jordan', 'Lebanon', 'None (first time)',
];

// ── Dropdown option exports (pre-built for Flow screens) ──

export const nationalityOptions = toOptions(NATIONALITIES);
export const religionOptions = toOptions(RELIGIONS);
export const maritalStatusOptions = toOptions(MARITAL_STATUSES);
export const countryOptions = toOptions(GCC_COUNTRIES);
export const professionOptions = toOptions(PROFESSIONS);
export const visaStatusOptions = toOptions(VISA_STATUSES);
export const experienceLevelOptions = toOptions(EXPERIENCE_LEVELS);
export const salaryRangeOptions = toOptions(SALARY_RANGES);
export const skillOptions = toOptions(SKILLS);
export const languageOptions = toOptions(LANGUAGES);
export const occupationOptions = toOptions(OCCUPATIONS);
export const familySizeOptions = toOptions(FAMILY_SIZES);
export const propertyTypeOptions = toOptions(PROPERTY_TYPES);
export const salaryBudgetOptions = toOptions(SALARY_BUDGETS);
export const livingArrangementOptions = toOptions(LIVING_ARRANGEMENTS);
export const agencyTypeOptions = toOptions(AGENCY_TYPES);
export const repPositionOptions = toOptions(REP_POSITIONS);
export const agencyServiceOptions = toOptions(AGENCY_SERVICES);

// V2 additional dropdown options
export const educationLevelOptions = toOptions(EDUCATION_LEVELS);
export const contractTypeOptions = toOptions(CONTRACT_TYPES);
export const accommodationPreferenceOptions = toOptions(ACCOMMODATION_PREFERENCES);
export const yearsInBusinessOptions = toOptions(YEARS_IN_BUSINESS);
export const childrenCountOptions = toOptions(CHILDREN_COUNTS);
export const elderlyCareOptions = toOptions(ELDERLY_CARE_OPTIONS);
export const preferredNationalityOptions = toOptions(PREFERRED_NATIONALITIES);
export const sponsorAccommodationTypeOptions = toOptions(SPONSOR_ACCOMMODATION_TYPES);
export const contractDurationOptions = toOptions(CONTRACT_DURATIONS);
export const countriesWorkedInOptions = toOptions(COUNTRIES_WORKED_IN);

// ── ID-to-Label reverse lookup ──

/**
 * Build a reverse lookup map from options array: { id: string } → title
 */
function buildLabelMap(options: DropdownOption[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const opt of options) {
    map[opt.id] = opt.title;
  }
  return map;
}

export const labelMaps = {
  nationality: buildLabelMap(nationalityOptions),
  religion: buildLabelMap(religionOptions),
  maritalStatus: buildLabelMap(maritalStatusOptions),
  country: buildLabelMap(countryOptions),
  profession: buildLabelMap(professionOptions),
  visaStatus: buildLabelMap(visaStatusOptions),
  experienceLevel: buildLabelMap(experienceLevelOptions),
  salaryRange: buildLabelMap(salaryRangeOptions),
  skill: buildLabelMap(skillOptions),
  language: buildLabelMap(languageOptions),
  occupation: buildLabelMap(occupationOptions),
  familySize: buildLabelMap(familySizeOptions),
  propertyType: buildLabelMap(propertyTypeOptions),
  salaryBudget: buildLabelMap(salaryBudgetOptions),
  livingArrangement: buildLabelMap(livingArrangementOptions),
  agencyType: buildLabelMap(agencyTypeOptions),
  repPosition: buildLabelMap(repPositionOptions),
  agencyService: buildLabelMap(agencyServiceOptions),
  educationLevel: buildLabelMap(educationLevelOptions),
  contractType: buildLabelMap(contractTypeOptions),
  accommodationPreference: buildLabelMap(accommodationPreferenceOptions),
  yearsInBusiness: buildLabelMap(yearsInBusinessOptions),
  childrenCount: buildLabelMap(childrenCountOptions),
  elderlyCare: buildLabelMap(elderlyCareOptions),
  preferredNationality: buildLabelMap(preferredNationalityOptions),
  sponsorAccommodationType: buildLabelMap(sponsorAccommodationTypeOptions),
  contractDuration: buildLabelMap(contractDurationOptions),
  countriesWorkedIn: buildLabelMap(countriesWorkedInOptions),
};
