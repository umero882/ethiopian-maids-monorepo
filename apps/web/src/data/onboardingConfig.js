import {
  Sparkles,
  Users,
  Info,
  Mail,
  Phone,
  PartyPopper,
  Crown,
  MessageSquare,
  Star,
  Bell,
  User,
  Camera,
  MapPin,
  Briefcase,
  Wrench,
  Globe,
  Heart,
  FileText,
  Video,
  CheckSquare,
  Home,
  Baby,
  Wallet,
  Building,
  Shield,
  ClipboardList,
  Clock,
  Contact,
} from 'lucide-react';

// Step types for consistent identification
export const STEP_TYPES = {
  // Shared steps (all users)
  WELCOME: 'welcome',
  USER_TYPE: 'userType',
  USER_INTRO: 'userIntro',
  ACCOUNT: 'account',
  PHONE_VERIFY: 'phoneVerify',
  CONGRATULATIONS: 'congratulations',
  SERVICE_OVERVIEW: 'serviceOverview',
  SOCIAL_PROOF: 'socialProof',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',

  // Maid steps
  MAID_PERSONAL: 'maidPersonal',
  MAID_BIOMETRIC_DOC: 'maidBiometricDoc',
  MAID_ADDRESS: 'maidAddress',
  MAID_PROFESSION: 'maidProfession',
  MAID_SKILLS: 'maidSkills',
  MAID_EXPERIENCE: 'maidExperience',
  MAID_PREFERENCES: 'maidPreferences',
  MAID_ABOUT: 'maidAbout',
  MAID_VIDEO_CV: 'maidVideoCV',
  MAID_CONSENTS: 'maidConsents',

  // Sponsor steps
  SPONSOR_PERSONAL: 'sponsorPersonal',
  SPONSOR_BIOMETRIC_DOC: 'sponsorBiometricDoc',
  SPONSOR_LOCATION: 'sponsorLocation',
  SPONSOR_FAMILY: 'sponsorFamily',
  SPONSOR_PREFERENCES: 'sponsorPreferences',
  SPONSOR_BUDGET: 'sponsorBudget',
  SPONSOR_ACCOMMODATION: 'sponsorAccommodation',
  SPONSOR_CONSENTS: 'sponsorConsents',
  SPONSOR_PREMIUM_UPSELL: 'sponsorPremiumUpsell',

  // Agency steps
  AGENCY_BASIC: 'agencyBasic',
  AGENCY_BIOMETRIC_DOC: 'agencyBiometricDoc',
  AGENCY_LOCATION: 'agencyLocation',
  AGENCY_CONTACT: 'agencyContact',
  AGENCY_REPRESENTATIVE: 'agencyRepresentative',
  AGENCY_SERVICES: 'agencyServices',
  AGENCY_ABOUT: 'agencyAbout',
  AGENCY_CONSENTS: 'agencyConsents',
  AGENCY_PREMIUM_UPSELL: 'agencyPremiumUpsell',
};

// Shared steps configuration (before user type selection)
const SHARED_STEPS_BEFORE = [
  {
    id: STEP_TYPES.WELCOME,
    title: 'Welcome',
    subtitle: 'Platform Introduction',
    description: 'Discover how Ethiopian Maids connects domestic workers with families across the GCC.',
    icon: Sparkles,
    phase: 'welcome',
    isSkippable: false,
  },
  {
    id: STEP_TYPES.USER_TYPE,
    title: 'Account Type',
    subtitle: 'Choose Your Role',
    description: 'Select the option that best describes you.',
    icon: Users,
    phase: 'welcome',
    isSkippable: false,
  },
];

// Shared steps after user type selection (before profile)
const SHARED_STEPS_ACCOUNT = [
  {
    id: STEP_TYPES.USER_INTRO,
    title: 'Your Journey',
    subtitle: 'What to Expect',
    description: 'See how our platform helps you achieve your goals.',
    icon: Info,
    phase: 'intro',
    isSkippable: false,
  },
  {
    id: STEP_TYPES.ACCOUNT,
    title: 'Create Account',
    subtitle: 'Email & Password',
    description: 'Set up your secure login credentials.',
    icon: Mail,
    phase: 'account',
    isSkippable: false,
    validation: {
      required: ['email', 'password', 'confirmPassword'],
      rules: {
        email: { type: 'email' },
        password: { type: 'password', minLength: 8 },
        confirmPassword: { type: 'match', matchField: 'password' },
      },
    },
  },
  {
    id: STEP_TYPES.PHONE_VERIFY,
    title: 'Verify Phone',
    subtitle: 'OTP Verification',
    description: 'Secure your account with phone verification.',
    icon: Phone,
    phase: 'account',
    isSkippable: false,
    validation: {
      required: ['phone', 'phoneVerified'],
    },
  },
  {
    id: STEP_TYPES.CONGRATULATIONS,
    title: 'Welcome!',
    subtitle: 'Account Created',
    description: 'Your account is ready. Let\'s complete your profile.',
    icon: PartyPopper,
    phase: 'celebration',
    isSkippable: false,
    celebration: 'confetti-burst',
    points: 50,
  },
];

// Service overview steps (all users)
const SERVICE_OVERVIEW_STEPS = [
  {
    id: STEP_TYPES.SERVICE_OVERVIEW,
    title: 'Features',
    subtitle: 'Free vs Premium',
    description: 'Discover what\'s included in your plan.',
    icon: Crown,
    phase: 'serviceOverview',
    isSkippable: false,
  },
  {
    id: STEP_TYPES.SOCIAL_PROOF,
    title: 'Success Stories',
    subtitle: 'Testimonials',
    description: 'See how others have benefited from our platform.',
    icon: MessageSquare,
    phase: 'serviceOverview',
    isSkippable: false,
  },
];

// Final steps (all users)
const FINAL_STEPS = [
  {
    id: STEP_TYPES.REVIEWS,
    title: 'Reviews',
    subtitle: 'User Ratings',
    description: 'Read reviews from our community.',
    icon: Star,
    phase: 'finish',
    isSkippable: false,
  },
  {
    id: STEP_TYPES.NOTIFICATIONS,
    title: 'Notifications',
    subtitle: 'Stay Updated',
    description: 'Choose how you want to receive updates.',
    icon: Bell,
    phase: 'finish',
    isSkippable: true,
  },
];

// MAID PROFILE STEPS
const MAID_PROFILE_STEPS = [
  {
    id: STEP_TYPES.MAID_PERSONAL,
    title: 'Personal Info',
    subtitle: 'Basic Details',
    description: 'Tell us about yourself.',
    icon: User,
    phase: 'profile',
    isSkippable: false,
    points: 30,
    validation: {
      required: ['full_name', 'dateOfBirth', 'nationality', 'religion', 'maritalStatus'],
    },
  },
  {
    id: STEP_TYPES.MAID_BIOMETRIC_DOC,
    title: 'Identity Verification',
    subtitle: 'Photo & Documents',
    description: 'Capture your photo and upload your ID for verification.',
    icon: Camera,
    phase: 'profile',
    isSkippable: false,
    points: 100,
    validation: {
      required: ['facePhoto', 'idDocument'],
    },
  },
  {
    id: STEP_TYPES.MAID_ADDRESS,
    title: 'Current Location',
    subtitle: 'Address Details',
    description: 'Where are you currently located?',
    icon: MapPin,
    phase: 'profile',
    isSkippable: false,
    points: 20,
    validation: {
      required: ['country', 'city'],
    },
  },
  {
    id: STEP_TYPES.MAID_PROFESSION,
    title: 'Profession',
    subtitle: 'Work Details',
    description: 'What is your primary profession and visa status?',
    icon: Briefcase,
    phase: 'profile',
    isSkippable: false,
    points: 25,
    validation: {
      required: ['primaryProfession', 'visaStatus'],
    },
  },
  {
    id: STEP_TYPES.MAID_SKILLS,
    title: 'Skills',
    subtitle: 'Your Expertise',
    description: 'Select the skills you have.',
    icon: Wrench,
    phase: 'profile',
    isSkippable: false,
    points: 20,
    validation: {
      required: ['skills'],
      rules: {
        skills: { type: 'array', minLength: 1 },
      },
    },
  },
  {
    id: STEP_TYPES.MAID_EXPERIENCE,
    title: 'Experience',
    subtitle: 'Work History',
    description: 'Share your work experience.',
    icon: Globe,
    phase: 'profile',
    isSkippable: false,
    points: 35,
    validation: {
      required: ['experienceYears'],
    },
  },
  {
    id: STEP_TYPES.MAID_PREFERENCES,
    title: 'Preferences',
    subtitle: 'Work Terms',
    description: 'Set your salary expectations and work preferences.',
    icon: Heart,
    phase: 'profile',
    isSkippable: false,
    points: 25,
    validation: {
      required: ['salaryExpectation', 'workPreferences'],
    },
  },
  {
    id: STEP_TYPES.MAID_ABOUT,
    title: 'About Me',
    subtitle: 'Your Story',
    description: 'Write a brief introduction about yourself.',
    icon: FileText,
    phase: 'profile',
    isSkippable: false,
    points: 25,
    validation: {
      required: ['aboutMe'],
      rules: {
        aboutMe: { type: 'string', minLength: 50 },
      },
    },
  },
  {
    id: STEP_TYPES.MAID_VIDEO_CV,
    title: 'Media Gallery',
    subtitle: 'Photos & Video',
    description: 'Add photos and optionally record a video introduction to stand out.',
    icon: Video,
    phase: 'profile',
    isSkippable: true, // Optional step
    points: 75,
  },
  {
    id: STEP_TYPES.MAID_CONSENTS,
    title: 'Terms & Conditions',
    subtitle: 'Agreements',
    description: 'Review and accept our terms to complete registration.',
    icon: CheckSquare,
    phase: 'consents',
    isSkippable: false,
    points: 10,
    validation: {
      required: ['termsAccepted', 'privacyAccepted', 'profileSharingAccepted'],
    },
  },
];

// SPONSOR PROFILE STEPS
const SPONSOR_PROFILE_STEPS = [
  {
    id: STEP_TYPES.SPONSOR_PERSONAL,
    title: 'Personal Info',
    subtitle: 'Basic Details',
    description: 'Tell us about yourself.',
    icon: User,
    phase: 'profile',
    isSkippable: false,
    points: 30,
    validation: {
      required: ['full_name'],
    },
  },
  {
    id: STEP_TYPES.SPONSOR_BIOMETRIC_DOC,
    title: 'Identity Verification',
    subtitle: 'Photo & Documents',
    description: 'Capture your photo and upload your ID for verification.',
    icon: Camera,
    phase: 'profile',
    isSkippable: false,
    points: 100,
    validation: {
      required: ['facePhoto', 'idDocument'],
    },
  },
  {
    id: STEP_TYPES.SPONSOR_LOCATION,
    title: 'Location',
    subtitle: 'Where You Live',
    description: 'Select your country and city in the GCC.',
    icon: MapPin,
    phase: 'profile',
    isSkippable: false,
    points: 25,
    validation: {
      required: ['country', 'city'],
    },
  },
  {
    id: STEP_TYPES.SPONSOR_FAMILY,
    title: 'Family Details',
    subtitle: 'Household Info',
    description: 'Tell us about your family and household needs.',
    icon: Baby,
    phase: 'profile',
    isSkippable: false,
    points: 30,
    validation: {
      required: ['familySize'],
    },
  },
  {
    id: STEP_TYPES.SPONSOR_PREFERENCES,
    title: 'Preferences',
    subtitle: 'Maid Requirements',
    description: 'What are you looking for in a domestic worker?',
    icon: Heart,
    phase: 'profile',
    isSkippable: false,
    points: 25,
  },
  {
    id: STEP_TYPES.SPONSOR_BUDGET,
    title: 'Budget',
    subtitle: 'Salary Range',
    description: 'Set your expected salary budget.',
    icon: Wallet,
    phase: 'profile',
    isSkippable: false,
    points: 20,
    validation: {
      required: ['salaryBudgetMin', 'salaryBudgetMax'],
    },
  },
  {
    id: STEP_TYPES.SPONSOR_ACCOMMODATION,
    title: 'Accommodation',
    subtitle: 'Living Arrangement',
    description: 'Describe the accommodation you can provide.',
    icon: Home,
    phase: 'profile',
    isSkippable: false,
    points: 20,
    validation: {
      required: ['accommodationType'],
    },
  },
  {
    id: STEP_TYPES.SPONSOR_CONSENTS,
    title: 'Terms & Conditions',
    subtitle: 'Agreements',
    description: 'Review and accept our terms to complete registration.',
    icon: CheckSquare,
    phase: 'consents',
    isSkippable: false,
    points: 10,
    validation: {
      required: ['termsAccepted', 'privacyAccepted'],
    },
  },
  {
    id: STEP_TYPES.SPONSOR_PREMIUM_UPSELL,
    title: 'Upgrade',
    subtitle: 'Go Premium',
    description: 'Unlock premium features for a better experience.',
    icon: Crown,
    phase: 'upsell',
    isSkippable: true,
  },
];

// AGENCY PROFILE STEPS
const AGENCY_PROFILE_STEPS = [
  {
    id: STEP_TYPES.AGENCY_BASIC,
    title: 'Agency Info',
    subtitle: 'Basic Details',
    description: 'Tell us about your agency.',
    icon: Building,
    phase: 'profile',
    isSkippable: false,
    points: 30,
    validation: {
      required: ['agencyName', 'tradeLicenseNumber'],
    },
  },
  {
    id: STEP_TYPES.AGENCY_BIOMETRIC_DOC,
    title: 'Verification',
    subtitle: 'Documents & Photo',
    description: 'Upload trade license and investor ID for verification.',
    icon: Shield,
    phase: 'profile',
    isSkippable: false,
    points: 100,
    validation: {
      required: ['facePhoto', 'tradeLicense', 'investorId'],
    },
  },
  {
    id: STEP_TYPES.AGENCY_LOCATION,
    title: 'Coverage',
    subtitle: 'Operating Areas',
    description: 'Select the countries and cities where you operate.',
    icon: MapPin,
    phase: 'profile',
    isSkippable: false,
    points: 25,
    validation: {
      required: ['countriesOfOperation'],
    },
  },
  {
    id: STEP_TYPES.AGENCY_CONTACT,
    title: 'Contact',
    subtitle: 'Communication',
    description: 'Provide your agency contact details.',
    icon: Contact,
    phase: 'profile',
    isSkippable: false,
    points: 20,
    validation: {
      required: ['contactPhone', 'contactEmail'],
    },
  },
  {
    id: STEP_TYPES.AGENCY_REPRESENTATIVE,
    title: 'Representative',
    subtitle: 'Authorized Person',
    description: 'Who is the authorized representative?',
    icon: User,
    phase: 'profile',
    isSkippable: false,
    points: 25,
    validation: {
      required: ['authorizedPersonName', 'authorizedPersonTitle'],
    },
  },
  {
    id: STEP_TYPES.AGENCY_SERVICES,
    title: 'Services',
    subtitle: 'What You Offer',
    description: 'Select the services your agency provides.',
    icon: ClipboardList,
    phase: 'profile',
    isSkippable: false,
    points: 20,
    validation: {
      required: ['servicesOffered'],
    },
  },
  {
    id: STEP_TYPES.AGENCY_ABOUT,
    title: 'About Agency',
    subtitle: 'Description',
    description: 'Write about your agency and its strengths.',
    icon: FileText,
    phase: 'profile',
    isSkippable: false,
    points: 25,
    validation: {
      required: ['aboutAgency'],
      rules: {
        aboutAgency: { type: 'string', minLength: 100 },
      },
    },
  },
  {
    id: STEP_TYPES.AGENCY_CONSENTS,
    title: 'Terms & Conditions',
    subtitle: 'Agreements',
    description: 'Review and accept our terms to complete registration.',
    icon: CheckSquare,
    phase: 'consents',
    isSkippable: false,
    points: 10,
    validation: {
      required: ['termsAccepted', 'privacyAccepted'],
    },
  },
  {
    id: STEP_TYPES.AGENCY_PREMIUM_UPSELL,
    title: 'Upgrade',
    subtitle: 'Go Premium',
    description: 'Unlock premium features for your agency.',
    icon: Crown,
    phase: 'upsell',
    isSkippable: true,
  },
];

// Get all steps for a user type
export const getStepsForUserType = (userType) => {
  const sharedBefore = SHARED_STEPS_BEFORE;
  const sharedAccount = SHARED_STEPS_ACCOUNT;
  const serviceOverview = SERVICE_OVERVIEW_STEPS;
  const final = FINAL_STEPS;

  let profileSteps = [];

  switch (userType) {
    case 'maid':
      profileSteps = MAID_PROFILE_STEPS;
      break;
    case 'sponsor':
      profileSteps = SPONSOR_PROFILE_STEPS;
      break;
    case 'agency':
      profileSteps = AGENCY_PROFILE_STEPS;
      break;
    default:
      // Return only shared steps before user type selection
      return sharedBefore;
  }

  return [
    ...sharedBefore,
    ...sharedAccount,
    ...serviceOverview,
    ...profileSteps,
    ...final,
  ];
};

// Get step by index for a user type
export const getStepByIndex = (userType, index) => {
  const steps = getStepsForUserType(userType);
  return steps[index] || null;
};

// Get total steps for a user type
export const getTotalSteps = (userType) => {
  return getStepsForUserType(userType).length;
};

// Get step index by ID
export const getStepIndexById = (userType, stepId) => {
  const steps = getStepsForUserType(userType);
  return steps.findIndex(step => step.id === stepId);
};

// Theme colors by user type
export const USER_TYPE_THEMES = {
  maid: {
    primary: 'from-purple-600 to-pink-600',
    secondary: 'from-purple-500 to-pink-500',
    accent: '#EC4899',
    bgGradient: 'from-purple-900 via-purple-800 to-pink-900',
    icon: '/images/Registration icon/maid-new.png',
    label: 'Domestic Worker',
    description: 'Find employment opportunities with verified families',
  },
  sponsor: {
    primary: 'from-blue-600 to-cyan-600',
    secondary: 'from-blue-500 to-cyan-500',
    accent: '#06B6D4',
    bgGradient: 'from-blue-900 via-indigo-800 to-cyan-900',
    icon: '/images/Registration icon/sponsor-new.png',
    label: 'Family / Sponsor',
    description: 'Hire trusted domestic workers for your home',
  },
  agency: {
    primary: 'from-green-600 to-emerald-600',
    secondary: 'from-green-500 to-emerald-500',
    accent: '#10B981',
    bgGradient: 'from-green-900 via-emerald-800 to-teal-900',
    icon: '/images/Registration icon/agency-new.png',
    label: 'Recruitment Agency',
    description: 'Connect domestic workers with families',
  },
};

// Gamification achievements
export const ACHIEVEMENTS = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Started your journey',
    icon: 'rocket',
    points: 10,
    trigger: 'completeStep',
    condition: { stepIndex: 0 },
  },
  {
    id: 'verified_member',
    name: 'Verified Member',
    description: 'Phone number verified',
    icon: 'shield-check',
    points: 50,
    trigger: 'phoneVerified',
  },
  {
    id: 'profile_starter',
    name: 'Profile Starter',
    description: 'Started building your profile',
    icon: 'user-check',
    points: 25,
    trigger: 'startProfile',
  },
  {
    id: 'identity_verified',
    name: 'Identity Verified',
    description: 'Completed biometric verification',
    icon: 'fingerprint',
    points: 100,
    trigger: 'biometricComplete',
  },
  {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Added 5+ skills',
    icon: 'award',
    points: 50,
    trigger: 'skillsCount',
    condition: { min: 5 },
    userTypes: ['maid'],
  },
  {
    id: 'document_pro',
    name: 'Document Pro',
    description: 'Uploaded all required documents',
    icon: 'file-check',
    points: 75,
    trigger: 'allDocumentsUploaded',
  },
  {
    id: 'video_star',
    name: 'Video Star',
    description: 'Created a video CV',
    icon: 'video',
    points: 75,
    trigger: 'videoUploaded',
    userTypes: ['maid'],
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: 'Completed registration in under 10 minutes',
    icon: 'zap',
    points: 200,
    trigger: 'fastCompletion',
    condition: { maxMinutes: 10 },
  },
  {
    id: 'halfway_there',
    name: 'Halfway There',
    description: 'Reached 50% completion',
    icon: 'target',
    points: 100,
    trigger: 'progressReached',
    condition: { percentage: 50 },
  },
  {
    id: 'fully_complete',
    name: 'Fully Complete',
    description: '100% profile completion',
    icon: 'trophy',
    points: 300,
    trigger: 'fullCompletion',
  },
];

// Testimonials/Social proof data
// Using authentic Ethiopian women photos for realistic testimonials
export const TESTIMONIALS = {
  maid: [
    {
      id: 1,
      name: 'Muna Kedir',
      country: 'Ethiopia',
      destination: 'UAE',
      rating: 5,
      quote: 'I found my dream family within 2 weeks! The platform made everything so easy and secure. Now I work with a wonderful family in Dubai.',
      avatar: '/images/testimonials/muna-kedir.jpg',
      verified: true,
    },
    {
      id: 2,
      name: 'Meron Hailu',
      country: 'Ethiopia',
      destination: 'Saudi Arabia',
      rating: 5,
      quote: 'The verification process gave me confidence that I was connecting with real employers. I felt safe throughout the entire process.',
      avatar: '/images/testimonials/ethiopian-maid-2.png',
      verified: true,
    },
    {
      id: 3,
      name: 'Hiwot Tadesse',
      country: 'Ethiopia',
      destination: 'Kuwait',
      rating: 5,
      quote: 'Great platform with responsive support. I got multiple offers within a month and chose the best one for my family.',
      avatar: '/images/testimonials/ethiopian-maid-3.jpg',
      verified: true,
    },
    {
      id: 4,
      name: 'Kedija Jarso',
      country: 'Ethiopia',
      destination: 'Qatar',
      rating: 5,
      quote: 'This platform changed my life! The process was smooth and now I have a stable job with an amazing sponsor family.',
      avatar: '/images/testimonials/kedija-jarso.png',
      verified: true,
    },
  ],
  sponsor: [
    {
      id: 1,
      name: 'Al-Maktoum Family',
      location: 'Dubai, UAE',
      rating: 5,
      quote: 'Found a wonderful nanny for our children within a week. The verified profiles gave us peace of mind. Highly recommend!',
      avatar: '/images/testimonials/sponsor-male-1.jpg',
      verified: true,
    },
    {
      id: 2,
      name: 'Fatima Al-Rashid',
      location: 'Riyadh, KSA',
      rating: 5,
      quote: 'The verification system gave us complete peace of mind. We found a trustworthy helper who has become part of our family.',
      avatar: '/images/testimonials/sponsor-female-1.jpg',
      verified: true,
    },
    {
      id: 3,
      name: 'Ahmed Al-Thani',
      location: 'Doha, Qatar',
      rating: 5,
      quote: 'Easy to use platform. We found our housekeeper in just 5 days. The whole process was transparent and professional.',
      avatar: '/images/testimonials/sponsor-male-2.jpg',
      verified: true,
    },
  ],
  agency: [
    {
      id: 1,
      name: 'GCC Staffing Solutions',
      location: 'Dubai, UAE',
      rating: 5,
      placements: 450,
      quote: 'This platform doubled our placement rate in the first 6 months. The dashboard analytics are incredibly useful.',
      avatar: '/images/testimonials/agency-male-1.jpg',
      verified: true,
    },
    {
      id: 2,
      name: 'Premier Domestic Services',
      location: 'Riyadh, KSA',
      rating: 5,
      placements: 320,
      quote: 'The analytics dashboard helps us understand market trends and optimize our recruitment strategy effectively.',
      avatar: '/images/testimonials/agency-female-1.jpg',
      verified: true,
    },
    {
      id: 3,
      name: 'Elite Home Care Agency',
      location: 'Kuwait City',
      rating: 5,
      placements: 280,
      quote: 'Streamlined our recruitment process significantly. We can now serve more families while maintaining quality service.',
      avatar: '/images/testimonials/agency-male-2.jpg',
      verified: true,
    },
  ],
};

// Platform statistics
export const PLATFORM_STATS = {
  totalMaids: '3,500+',
  totalFamilies: '1,500+',
  totalAgencies: '120+',
  avgPlacementTime: '8 days',
  successRate: '95%',
  countriesCovered: 6,
  totalPlacements: '4,500+',
};

// Premium features comparison
export const PREMIUM_FEATURES = {
  maid: {
    free: [
      'Basic profile visibility',
      '5 job applications per month',
      'Limited direct messages',
      '1 video CV upload',
      'Email support',
    ],
    premium: [
      'Featured profile placement',
      'Unlimited job applications',
      'Unlimited direct messages',
      'Unlimited video CVs with AI tips',
      'Profile analytics dashboard',
      'Verified badge',
      '24/7 priority support',
    ],
    comparison: [
      { feature: 'Profile Visibility', free: 'Basic', premium: 'Featured' },
      { feature: 'Job Applications', free: '5/month', premium: 'Unlimited' },
      { feature: 'Direct Messages', free: 'Limited', premium: 'Unlimited' },
      { feature: 'Video CV', free: '1', premium: 'Unlimited' },
      { feature: 'Profile Analytics', free: false, premium: true },
      { feature: 'Verified Badge', free: false, premium: true },
      { feature: 'Priority Support', free: false, premium: true },
    ],
  },
  sponsor: {
    free: [
      'View 10 profiles per month',
      'Contact 3 maids per month',
      'Basic background checks',
      'Save 1 search filter',
      'Email support',
    ],
    premium: [
      'Unlimited profile views',
      'Unlimited maid contacts',
      'Comprehensive background checks',
      'Interview scheduling tools',
      'Contract templates',
      'Unlimited saved searches',
      '24/7 priority support',
    ],
    comparison: [
      { feature: 'Profile Views', free: '10/month', premium: 'Unlimited' },
      { feature: 'Contact Maids', free: '3/month', premium: 'Unlimited' },
      { feature: 'Background Checks', free: 'Basic', premium: 'Full' },
      { feature: 'Interview Scheduling', free: false, premium: true },
      { feature: 'Contract Templates', free: false, premium: true },
      { feature: 'Saved Searches', free: '1', premium: 'Unlimited' },
      { feature: 'Priority Support', free: false, premium: true },
    ],
  },
  agency: {
    free: [
      'List up to 10 maids',
      'Basic lead generation',
      'Basic analytics dashboard',
      '1 team member',
      'Manual placement tracking',
    ],
    premium: [
      'Unlimited maid listings',
      'Advanced lead generation',
      'Advanced analytics dashboard',
      '10+ team members',
      'Automated placement tracking',
      'Bulk import tools',
      'API access',
    ],
    comparison: [
      { feature: 'Maid Listings', free: '10', premium: 'Unlimited' },
      { feature: 'Lead Generation', free: 'Basic', premium: 'Advanced' },
      { feature: 'Analytics', free: 'Basic', premium: 'Advanced' },
      { feature: 'Team Members', free: '1', premium: '10+' },
      { feature: 'Bulk Import', free: false, premium: true },
      { feature: 'API Access', free: false, premium: true },
      { feature: 'Priority Support', free: false, premium: true },
    ],
  },
};

export default {
  STEP_TYPES,
  getStepsForUserType,
  getStepByIndex,
  getTotalSteps,
  getStepIndexById,
  USER_TYPE_THEMES,
  ACHIEVEMENTS,
  TESTIMONIALS,
  PLATFORM_STATS,
  PREMIUM_FEATURES,
};
