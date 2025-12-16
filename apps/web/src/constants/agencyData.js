/**
 * Agency Profile Data Constants
 *
 * Shared constants for agency profile forms - synced with mobile app.
 * Contains country data, worker types, service categories, and step configuration.
 */

// ============================================
// Country Data with Regions/Cities
// ============================================

export const COUNTRY_DATA = {
  'Ethiopia': {
    currency: 'ETB',
    regions: [
      'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
      'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
      'South West Ethiopia', 'Southern Nations', 'Tigray'
    ]
  },
  'United Arab Emirates': {
    currency: 'AED',
    emirates: [
      'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain',
      'Ras Al Khaimah', 'Fujairah'
    ]
  },
  'Saudi Arabia': {
    currency: 'SAR',
    regions: [
      'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir',
      'Jizan', 'Najran', 'Al Bahah', 'Northern Borders', 'Jawf',
      'Hail', 'Qassim', 'Tabuk'
    ]
  },
  'Kuwait': {
    currency: 'KWD',
    governorates: [
      'Kuwait City', 'Hawalli', 'Farwaniya', 'Mubarak Al-Kabeer',
      'Ahmadi', 'Jahra'
    ]
  },
  'Qatar': {
    currency: 'QAR',
    regions: [
      'Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Al Shamal',
      'Umm Salal', 'Al Daayen', 'Madinat ash Shamal'
    ]
  },
  'Bahrain': {
    currency: 'BHD',
    governorates: [
      'Capital Governorate', 'Muharraq', 'Northern Governorate',
      'Southern Governorate'
    ]
  },
  'Oman': {
    currency: 'OMR',
    governorates: [
      'Muscat', 'Dhofar', 'Musandam', 'Al Buraimi', 'Ad Dakhiliyah',
      'Al Batinah North', 'Al Batinah South', 'Ash Sharqiyah North',
      'Ash Sharqiyah South', 'Ad Dhahirah', 'Al Wusta'
    ]
  }
};

// Get cities/regions for a country
export const getCitiesForCountry = (country) => {
  const countryData = COUNTRY_DATA[country];
  if (!countryData) return [];
  return countryData.regions || countryData.emirates || countryData.governorates || [];
};

// Get all country names
export const getCountryOptions = () => Object.keys(COUNTRY_DATA);

// ============================================
// Worker Types
// ============================================

export const WORKER_TYPES = [
  'Housemaids',
  'Nannies',
  'Cooks',
  'Cleaners',
  'Caregivers (Elderly)',
  'Caregivers (Disabled)',
  'Drivers',
  'Gardeners',
  'General Helpers',
  'Baby Sitters',
  'Pet Care Specialists'
];

// ============================================
// Service Categories
// ============================================

export const SERVICE_CATEGORIES = [
  'Live-in Workers',
  'Live-out Workers',
  'Part-time Services',
  'Full-time Services',
  'Contract Workers (1-2 years)',
  'Permanent Placement',
  'Worker Training Programs',
  'Document Verification',
  'Background Checks',
  '24/7 Support Services',
  'Emergency Replacement',
  'Multi-lingual Workers'
];

// Combined specializations
export const ALL_SPECIALIZATIONS = [...WORKER_TYPES, ...SERVICE_CATEGORIES];

// ============================================
// Step Configuration for Wizard
// ============================================

export const STEPS = [
  {
    id: 1,
    title: 'Agency Information',
    subtitle: 'Basic agency details',
    icon: 'Building2'
  },
  {
    id: 2,
    title: 'Identity Verification',
    subtitle: 'Passport or National ID',
    icon: 'ShieldCheck'
  },
  {
    id: 3,
    title: 'Contact Information',
    subtitle: 'Authorized person details',
    icon: 'User'
  },
  {
    id: 4,
    title: 'Location',
    subtitle: 'Business location & service areas',
    icon: 'MapPin'
  },
  {
    id: 5,
    title: 'Service Specializations',
    subtitle: 'Worker types & services',
    icon: 'Briefcase'
  },
  {
    id: 6,
    title: 'Online Presence',
    subtitle: 'Website & social media',
    icon: 'Globe'
  },
  {
    id: 7,
    title: 'License Upload',
    subtitle: 'Trade license document',
    icon: 'FileText'
  },
  {
    id: 8,
    title: 'Terms & Conditions',
    subtitle: 'Review and accept policies',
    icon: 'FileCheck'
  },
  {
    id: 9,
    title: 'Account Status',
    subtitle: 'Verification & subscription',
    icon: 'CheckCircle2'
  },
];

// ============================================
// Validation Rules per Step
// ============================================

export const STEP_VALIDATION = {
  1: { // Agency Information
    required: ['full_name', 'license_number'],
    messages: {
      full_name: 'Agency name is required',
      license_number: 'License number is required'
    }
  },
  2: { // Identity Verification
    required: [], // Optional
    messages: {}
  },
  3: { // Contact Information
    required: ['business_email', 'business_phone'],
    messages: {
      business_email: 'Business email is required',
      business_phone: 'Business phone is required'
    }
  },
  4: { // Location
    required: ['country'],
    messages: {
      country: 'Country is required'
    }
  },
  5: { // Service Specializations
    required: ['specialization'],
    messages: {
      specialization: 'Please select at least one specialization'
    }
  },
  6: { // Online Presence
    required: [], // Optional
    messages: {}
  },
  7: { // License Upload
    required: [], // Optional but recommended
    messages: {}
  },
  8: { // Terms & Conditions (for new registrations)
    required: ['termsAccepted', 'privacyAccepted'],
    messages: {
      termsAccepted: 'You must accept the Terms of Service',
      privacyAccepted: 'You must accept the Privacy Policy'
    }
  },
  9: { // Account Status
    required: [], // Read-only
    messages: {}
  }
};

// ============================================
// Terms of Service Content
// ============================================

export const TERMS_OF_SERVICE = `
1. Agency Registration
By registering as an agency on Ethiopian Maids platform, you agree to provide accurate and complete information about your business, including valid trade license and contact details.

2. Worker Management
Agencies are responsible for ensuring all workers registered through their account have proper documentation, background checks, and necessary work permits.

3. Service Standards
Agencies must maintain professional standards in all interactions with clients and workers. Any complaints or disputes must be handled promptly and fairly.

4. Fees and Payments
Agencies agree to the platform's fee structure and payment terms. All payments must be made through the platform's approved payment methods.

5. Account Termination
The platform reserves the right to suspend or terminate agency accounts that violate these terms or engage in fraudulent activities.

6. Updates to Terms
These terms may be updated periodically. Continued use of the platform constitutes acceptance of any changes.
`;

// ============================================
// Privacy Policy Content
// ============================================

export const PRIVACY_POLICY = `
1. Information We Collect
We collect information you provide during registration, including agency details, contact information, and uploaded documents for verification.

2. How We Use Your Information
Your information is used to verify your agency, facilitate connections with clients, and improve our services. We never sell your data to third parties.

3. Data Security
We implement industry-standard security measures to protect your data. All sensitive information is encrypted in transit and at rest.

4. Data Retention
We retain your data for as long as your account is active. You can request deletion of your data by contacting support.

5. Your Rights
You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.

6. Contact Us
For privacy-related inquiries, please contact our privacy team at privacy@ethiopianmaids.com
`;

// ============================================
// Document Types
// ============================================

export const DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  NATIONAL_ID: 'national_id',
  TRADE_LICENSE: 'trade_license'
};

// ============================================
// Verification Status Colors
// ============================================

export const VERIFICATION_STATUS_CONFIG = {
  verified: {
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: 'CheckCircle',
    label: 'Verified'
  },
  pending: {
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    icon: 'Clock',
    label: 'Pending Review'
  },
  rejected: {
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'XCircle',
    label: 'Rejected'
  },
  unverified: {
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    icon: 'FileQuestion',
    label: 'Not Submitted'
  }
};

// Helper to get verification status config
export const getVerificationStatusConfig = (status) => {
  return VERIFICATION_STATUS_CONFIG[status?.toLowerCase()] || VERIFICATION_STATUS_CONFIG.unverified;
};

// ============================================
// Profile Completion Check
// ============================================

export const isProfileComplete = (profile) => {
  if (!profile) return false;
  return !!(
    profile.full_name &&
    profile.license_number &&
    (profile.business_email || profile.authorized_person_email) &&
    (profile.business_phone || profile.authorized_person_phone) &&
    profile.country &&
    profile.specialization && profile.specialization.length > 0
  );
};
