/**
 * Dashboard Hooks
 *
 * Custom hooks for fetching dashboard data for different user types.
 * Uses Apollo Client directly with GraphQL queries.
 *
 * Note: Uses Firebase Auth UIDs which are stored as user_id in the database.
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { gql, useLazyQuery, useSubscription } from '@apollo/client';

// ============================================
// GraphQL Queries
// ============================================

// Query base profile to get user ID
const GET_BASE_PROFILE = gql`
  query GetBaseProfile($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      user_type
    }
  }
`;

// Query sponsor profile by user_id (sponsor_profiles uses id as the link)
const GET_SPONSOR_STATS = gql`
  query GetSponsorStats($userId: String!) {
    sponsor_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      avatar_url
      active_job_postings
      total_hires
      average_rating
    }
  }
`;

// Query maid profile by user_id (synced with web MaidOverview.jsx)
const GET_MAID_STATS = gql`
  query GetMaidStats($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      profile_photo_url
      primary_image_processed_url
      total_applications
      profile_views
      successful_placements
      average_rating
      availability_status
      date_of_birth
      nationality
      religion
      languages
      education_level
      experience_years
      about_me
      current_visa_status
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      skills
      live_in_preference
      contract_duration_preference
      medical_certificate_valid
      police_clearance_valid
      verification_status
      created_at
      updated_at
    }
    # Get booking counts
    booking_requests_aggregate(where: { maid_id: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
    # Get pending bookings count
    pending_bookings: booking_requests_aggregate(where: { maid_id: { _eq: $userId }, status: { _eq: "pending" } }) {
      aggregate {
        count
      }
    }
    # Get notifications count
    notifications_aggregate(where: { user_id: { _eq: $userId }, read: { _eq: false } }) {
      aggregate {
        count
      }
    }
  }
`;

// Query agency profile by user_id (agency_profiles uses id as the link - String type)
// Enhanced with additional KPIs to match web dashboard
const GET_AGENCY_STATS = gql`
  query GetAgencyStats($userId: String!, $today: timestamptz!, $monthStart: timestamptz!) {
    agency_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      logo_url
      total_maids_managed
      total_maids
      active_maids
      successful_placements
      active_listings
      average_rating
      verified
      subscription_tier
      subscription_expires_at
      placement_fee_percentage
      guarantee_period_months
      service_countries
      specialization
      established_year
    }
    # Get maid statistics by status (agency_id in maid_profiles is String)
    available_maids: maid_profiles_aggregate(
      where: { agency_id: { _eq: $userId }, availability_status: { _eq: "available" } }
    ) {
      aggregate {
        count
      }
    }
    placed_maids: maid_profiles_aggregate(
      where: { agency_id: { _eq: $userId }, availability_status: { _eq: "placed" } }
    ) {
      aggregate {
        count
      }
    }
    pending_maids: maid_profiles_aggregate(
      where: { agency_id: { _eq: $userId }, availability_status: { _eq: "pending" } }
    ) {
      aggregate {
        count
      }
    }
    # Get active jobs count (global - no agency filter needed)
    active_jobs: jobs_aggregate(where: { status: { _eq: "active" } }) {
      aggregate {
        count
      }
    }
    # Get total jobs
    total_jobs: jobs_aggregate {
      aggregate {
        count
      }
    }
    # Get pending applications (global count)
    pending_applications: applications_aggregate(
      where: { application_status: { _eq: "pending" } }
    ) {
      aggregate {
        count
      }
    }
    # NEW: Get new applicants today (synced with web)
    new_applicants_today: applications_aggregate(
      where: { created_at: { _gte: $today } }
    ) {
      aggregate {
        count
      }
    }
    # NEW: Get interviews scheduled (applications with future interview date)
    interviews_scheduled: applications_aggregate(
      where: { interview_date: { _gte: $today } }
    ) {
      aggregate {
        count
      }
    }
    # NEW: Get hires this month (applications with hired status this month)
    hires_this_month: applications_aggregate(
      where: {
        application_status: { _eq: "hired" },
        updated_at: { _gte: $monthStart }
      }
    ) {
      aggregate {
        count
      }
    }
    # NEW: Pipeline funnel data - applications by status
    pipeline_new: applications_aggregate(where: { application_status: { _eq: "new" } }) {
      aggregate { count }
    }
    pipeline_reviewed: applications_aggregate(where: { application_status: { _eq: "reviewed" } }) {
      aggregate { count }
    }
    pipeline_shortlisted: applications_aggregate(where: { application_status: { _eq: "shortlisted" } }) {
      aggregate { count }
    }
    pipeline_interviewed: applications_aggregate(where: { application_status: { _eq: "interviewed" } }) {
      aggregate { count }
    }
    pipeline_offered: applications_aggregate(where: { application_status: { _eq: "offered" } }) {
      aggregate { count }
    }
    pipeline_hired: applications_aggregate(where: { application_status: { _eq: "hired" } }) {
      aggregate { count }
    }
  }
`;

// Query agency financial data - separate query with uuid type
const GET_AGENCY_FINANCIALS = gql`
  query GetAgencyFinancials($agencyUuid: uuid!) {
    agency_credits(where: { agency_id: { _eq: $agencyUuid } }) {
      id
      available_credits
      reserved_credits
      total_credits
      last_credit_earned_at
      last_credit_used_at
    }
  }
`;

// Query recent activities - separate query with uuid type
const GET_RECENT_ACTIVITIES = gql`
  query GetRecentActivities {
    activity_announcements(
      limit: 10
      order_by: { created_at: desc }
    ) {
      id
      title
      description
      activity_type
      created_at
    }
  }
`;

// GET_RECENT_JOBS query commented out - needs profile.email filtering
// Will be implemented when the relationship structure is confirmed
// const GET_RECENT_JOBS = gql`
//   query GetRecentJobs($where: jobs_bool_exp, $limit: Int = 5) {
//     jobs(where: $where, limit: $limit, order_by: { created_at: desc }) {
//       id
//       title
//       status
//       applications_count
//       views_count
//       created_at
//     }
//   }
// `;

// ============================================
// GraphQL Subscriptions for Real-time Updates
// ============================================

// Subscription for agency stats - uses String type for agency_id
const SUBSCRIBE_AGENCY_STATS = gql`
  subscription SubscribeAgencyStats($agencyId: String!) {
    agency_profiles(where: { id: { _eq: $agencyId } }, limit: 1) {
      id
      full_name
      logo_url
      total_maids_managed
      total_maids
      active_maids
      successful_placements
      active_listings
      average_rating
      verified
      subscription_tier
      subscription_expires_at
      placement_fee_percentage
      guarantee_period_months
      service_countries
      specialization
      established_year
    }
  }
`;

// Subscription for total maid count (Hasura requires single root field per subscription)
const SUBSCRIBE_TOTAL_MAIDS = gql`
  subscription SubscribeTotalMaids($agencyId: String!) {
    maid_profiles_aggregate(where: { agency_id: { _eq: $agencyId } }) {
      aggregate {
        count
      }
    }
  }
`;

// Subscription for active jobs count
const SUBSCRIBE_ACTIVE_JOBS = gql`
  subscription SubscribeActiveJobs {
    jobs_aggregate(where: { status: { _eq: "active" } }) {
      aggregate {
        count
      }
    }
  }
`;

// Subscription for pending applications
const SUBSCRIBE_PENDING_APPLICATIONS = gql`
  subscription SubscribePendingApplications {
    applications_aggregate(where: { application_status: { _eq: "pending" } }) {
      aggregate {
        count
      }
    }
  }
`;

// Subscription for recent activities
const SUBSCRIBE_RECENT_ACTIVITIES = gql`
  subscription SubscribeRecentActivities {
    activity_announcements(
      limit: 10
      order_by: { created_at: desc }
    ) {
      id
      title
      description
      activity_type
      created_at
    }
  }
`;

// ============================================
// Maid Dashboard Subscriptions
// ============================================

// Subscription for maid bookings
const SUBSCRIBE_MAID_BOOKINGS = gql`
  subscription SubscribeMaidBookings($maidId: String!) {
    booking_requests(
      where: { maid_id: { _eq: $maidId } }
      order_by: { updated_at: desc }
      limit: 1
    ) {
      id
      status
      updated_at
    }
  }
`;

// Subscription for maid notifications
const SUBSCRIBE_MAID_NOTIFICATIONS = gql`
  subscription SubscribeMaidNotifications($userId: String!) {
    notifications(
      where: { user_id: { _eq: $userId }, read: { _eq: false } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      read
      created_at
    }
  }
`;

// Subscription for maid profile updates
const SUBSCRIBE_MAID_PROFILE = gql`
  subscription SubscribeMaidProfile($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      updated_at
      profile_views
      total_applications
    }
  }
`;

// ============================================
// Sponsor Dashboard Subscriptions
// ============================================

// Subscription for sponsor bookings
const SUBSCRIBE_SPONSOR_BOOKINGS = gql`
  subscription SubscribeSponsorBookings($sponsorId: String!) {
    booking_requests(
      where: { sponsor_id: { _eq: $sponsorId } }
      order_by: { updated_at: desc }
      limit: 1
    ) {
      id
      status
      updated_at
    }
  }
`;

// Subscription for sponsor favorites
const SUBSCRIBE_SPONSOR_FAVORITES = gql`
  subscription SubscribeSponsorFavorites($sponsorId: String!) {
    favorites(
      where: { sponsor_id: { _eq: $sponsorId } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      created_at
    }
  }
`;

// Subscription for sponsor notifications
const SUBSCRIBE_SPONSOR_NOTIFICATIONS = gql`
  subscription SubscribeSponsorNotifications($userId: String!) {
    notifications(
      where: { user_id: { _eq: $userId }, read: { _eq: false } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      read
      created_at
    }
  }
`;

// ============================================
// Types
// ============================================

export interface ProfileInfo {
  fullName: string;
  avatarUrl: string | null;
}

export interface SponsorDashboardStats {
  totalBookings: number;
  activeBookings: number;
  savedFavorites: number;
  totalJobs: number;
  activeJobs: number;
  pendingBookings: number;
}

export interface MaidDashboardStats {
  totalApplications: number;
  profileViews: number;
  successfulPlacements: number;
  averageRating: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  unreadNotifications: number;
  // Profile completeness data (synced with web)
  profileCompleteness: number;
  hasPhoto: boolean;
  hasSkills: boolean;
  hasLanguages: boolean;
  // Profile details for "At a Glance" section
  visaStatus: string;
  availability: string;
  salaryRange: string;
  livingArrangement: string;
  contractPreference: string;
  skills: string[];
  languages: string[];
  // Verification status
  emailVerified: boolean;
  phoneVerified: boolean;
  documentsVerified: boolean;
  // Last updated
  lastUpdated: string | null;
}

export interface AgencyActivity {
  id: string;
  title: string;
  description: string | null;
  activityType: string;
  createdAt: string;
}

export interface MaidStatusSummary {
  available: number;
  placed: number;
  pending: number;
  total: number;
}

export interface AgencyFinancials {
  balance: number;
  currency: string;
  lastTransactionAt: string | null;
}

// Pipeline stage for funnel visualization
export interface PipelineStage {
  name: string;
  count: number;
  color: string;
}

export interface AgencyDashboardStats {
  // Core stats
  totalMaids: number;
  activeJobs: number;
  totalJobs: number;
  newApplicants: number;
  pendingApplicants: number;
  successfulPlacements: number;
  activeListings: number;
  averageRating: number;
  isVerified: boolean;
  // NEW: Additional KPIs (synced with web)
  newApplicantsToday: number;
  interviewsScheduled: number;
  hiresThisMonth: number;
  // NEW: Pipeline funnel data
  pipelineFunnel: PipelineStage[];
  // Maid breakdown
  maidStatus: MaidStatusSummary;
  // Subscription
  subscriptionTier: string | null;
  subscriptionExpiresAt: string | null;
  // Business info
  placementFeePercentage: number | null;
  guaranteePeriodMonths: number | null;
  serviceCountries: string[];
  specialization: string[];
  establishedYear: number | null;
  // Recent activities
  recentActivities: AgencyActivity[];
  // Financials
  financials: AgencyFinancials | null;
}

export interface DashboardData<T> {
  stats: T;
  profile: ProfileInfo;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================
// Sponsor Dashboard Hook
// ============================================

export function useSponsorDashboard(email: string | null | undefined): DashboardData<SponsorDashboardStats> {
  const [stats, setStats] = useState<SponsorDashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    savedFavorites: 0,
    totalJobs: 0,
    activeJobs: 0,
    pendingBookings: 0,
  });
  const [profile, setProfile] = useState<ProfileInfo>({
    fullName: '',
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
  });

  const [fetchStats] = useLazyQuery(GET_SPONSOR_STATS, {
    fetchPolicy: 'network-only',
  });

  const fetchDashboardData = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Dashboard] Fetching sponsor stats for email:', email);

      // Step 1: Get base profile to get user ID
      const { data: baseData, error: baseError } = await fetchBaseProfile({
        variables: { email },
      });

      if (baseError) throw baseError;

      const baseProfile = baseData?.profiles?.[0];
      if (!baseProfile?.id) {
        console.log('[Dashboard] No base profile found');
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch sponsor profile using the profile ID
      const { data, error: queryError } = await fetchStats({
        variables: { userId: baseProfile.id },
      });

      if (queryError) throw queryError;

      const profileData = data?.sponsor_profiles?.[0];
      console.log('[Dashboard] Sponsor profile found:', profileData ? 'yes' : 'no');

      setProfile({
        fullName: profileData?.full_name || '',
        avatarUrl: profileData?.avatar_url || null,
      });

      setStats({
        totalBookings: profileData?.total_hires || 0,
        activeBookings: profileData?.active_job_postings || 0,
        savedFavorites: 0, // Will need separate query
        totalJobs: 0, // Will need separate query
        activeJobs: 0, // Will need separate query
        pendingBookings: 0,
      });
    } catch (err) {
      console.error('[Dashboard] Error fetching sponsor stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [email, fetchBaseProfile, fetchStats]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    profile,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
}

// ============================================
// Maid Dashboard Hook
// ============================================

// Helper function to calculate profile completeness with weighted sections (synced with web MaidOverview.jsx)
function calculateProfileCompleteness(profileData: any, baseProfile: any): number {
  if (!profileData) return 0;

  const sections = {
    personal: {
      weight: 25,
      fields: [
        profileData.full_name && profileData.full_name !== 'New Maid',
        profileData.date_of_birth,
        profileData.nationality,
      ],
    },
    professional: {
      weight: 30,
      fields: [
        profileData.experience_years !== null && profileData.experience_years !== undefined,
        Array.isArray(profileData.languages) && profileData.languages.length > 0,
        Array.isArray(profileData.skills) && profileData.skills.length > 0,
      ],
    },
    preferences: {
      weight: 25,
      fields: [
        profileData.preferred_salary_min,
        profileData.availability_status,
        profileData.live_in_preference !== null && profileData.live_in_preference !== undefined,
      ],
    },
    additional: {
      weight: 20,
      fields: [
        profileData.about_me && profileData.about_me !== 'Please complete your profile',
        profileData.profile_photo_url || profileData.primary_image_processed_url,
      ],
    },
  };

  let totalScore = 0;

  Object.keys(sections).forEach((sectionKey) => {
    const section = sections[sectionKey as keyof typeof sections];
    const completedFields = section.fields.filter(Boolean).length;
    const sectionScore = (completedFields / section.fields.length) * 100;
    totalScore += (sectionScore * section.weight) / 100;
  });

  return Math.round(totalScore);
}

export function useMaidDashboard(email: string | null | undefined): DashboardData<MaidDashboardStats> {
  const [stats, setStats] = useState<MaidDashboardStats>({
    totalApplications: 0,
    profileViews: 0,
    successfulPlacements: 0,
    averageRating: 0,
    totalBookings: 0,
    activeBookings: 0,
    pendingBookings: 0,
    unreadNotifications: 0,
    profileCompleteness: 0,
    hasPhoto: false,
    hasSkills: false,
    hasLanguages: false,
    visaStatus: 'Not specified',
    availability: 'Not specified',
    salaryRange: 'Not specified',
    livingArrangement: 'Not specified',
    contractPreference: 'Not specified',
    skills: [],
    languages: [],
    emailVerified: true,
    phoneVerified: false,
    documentsVerified: false,
    lastUpdated: null,
  });
  const [profile, setProfile] = useState<ProfileInfo>({
    fullName: '',
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
  });

  const [fetchStats] = useLazyQuery(GET_MAID_STATS, {
    fetchPolicy: 'network-only',
  });

  const fetchDashboardData = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Dashboard] Fetching maid stats for email:', email);

      // Step 1: Get base profile to get user ID
      const { data: baseData, error: baseError } = await fetchBaseProfile({
        variables: { email },
      });

      if (baseError) throw baseError;

      const baseProfile = baseData?.profiles?.[0];
      if (!baseProfile?.id) {
        console.log('[Dashboard] No base profile found');
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch maid profile using the profile ID
      const { data, error: queryError } = await fetchStats({
        variables: { userId: baseProfile.id },
      });

      if (queryError) throw queryError;

      const profileData = data?.maid_profiles?.[0];
      const totalBookings = data?.booking_requests_aggregate?.aggregate?.count || 0;
      const pendingBookings = data?.pending_bookings?.aggregate?.count || 0;
      const unreadNotifications = data?.notifications_aggregate?.aggregate?.count || 0;

      console.log('[Dashboard] Maid profile found:', profileData ? 'yes' : 'no');

      const photoUrl = profileData?.profile_photo_url || profileData?.primary_image_processed_url || null;
      const skills = Array.isArray(profileData?.skills) ? profileData.skills : [];
      const languages = Array.isArray(profileData?.languages) ? profileData.languages : [];

      setProfile({
        fullName: profileData?.full_name || '',
        avatarUrl: photoUrl,
      });

      // Build salary range string (synced with web)
      let salaryRange = 'Not specified';
      if (profileData?.preferred_salary_min) {
        const currency = profileData?.preferred_currency || 'USD';
        if (profileData?.preferred_salary_max && profileData.preferred_salary_max !== profileData.preferred_salary_min) {
          salaryRange = `${profileData.preferred_salary_min}-${profileData.preferred_salary_max} ${currency}`;
        } else {
          salaryRange = `${profileData.preferred_salary_min} ${currency}`;
        }
      }

      // Build living arrangement string (synced with web)
      let livingArrangement = 'Not specified';
      if (profileData?.live_in_preference === true) {
        livingArrangement = 'Live-in';
      } else if (profileData?.live_in_preference === false) {
        livingArrangement = 'Live-out';
      }

      setStats({
        totalApplications: profileData?.total_applications || 0,
        profileViews: profileData?.profile_views || 0,
        successfulPlacements: profileData?.successful_placements || 0,
        averageRating: profileData?.average_rating || 0,
        totalBookings,
        activeBookings: pendingBookings, // Active = pending for maids
        pendingBookings,
        unreadNotifications,
        profileCompleteness: calculateProfileCompleteness(profileData, baseProfile),
        hasPhoto: !!photoUrl,
        hasSkills: skills.length > 0,
        hasLanguages: languages.length > 0,
        visaStatus: profileData?.current_visa_status || 'Not specified',
        availability: profileData?.availability_status || 'Not specified',
        salaryRange,
        livingArrangement,
        contractPreference: profileData?.contract_duration_preference || 'Not specified',
        skills,
        languages,
        emailVerified: true,
        phoneVerified: baseProfile?.registration_complete || false,
        documentsVerified: (profileData?.medical_certificate_valid && profileData?.police_clearance_valid) || false,
        lastUpdated: profileData?.updated_at || profileData?.created_at || null,
      });
    } catch (err) {
      console.error('[Dashboard] Error fetching maid stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [email, fetchBaseProfile, fetchStats]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    profile,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
}

// ============================================
// Agency Dashboard Hook
// ============================================

// Helper to get date strings for queries
function getDateParams() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    today: today.toISOString(),
    monthStart: monthStart.toISOString(),
  };
}

export function useAgencyDashboard(email: string | null | undefined): DashboardData<AgencyDashboardStats> {
  const [stats, setStats] = useState<AgencyDashboardStats>({
    totalMaids: 0,
    activeJobs: 0,
    totalJobs: 0,
    newApplicants: 0,
    pendingApplicants: 0,
    successfulPlacements: 0,
    activeListings: 0,
    averageRating: 0,
    isVerified: false,
    // NEW: Additional KPIs
    newApplicantsToday: 0,
    interviewsScheduled: 0,
    hiresThisMonth: 0,
    pipelineFunnel: [],
    maidStatus: { available: 0, placed: 0, pending: 0, total: 0 },
    subscriptionTier: null,
    subscriptionExpiresAt: null,
    placementFeePercentage: null,
    guaranteePeriodMonths: null,
    serviceCountries: [],
    specialization: [],
    establishedYear: null,
    recentActivities: [],
    financials: null,
  });
  const [profile, setProfile] = useState<ProfileInfo>({
    fullName: '',
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
  });

  const [fetchStats] = useLazyQuery(GET_AGENCY_STATS, {
    fetchPolicy: 'network-only',
  });

  const [fetchActivities] = useLazyQuery(GET_RECENT_ACTIVITIES, {
    fetchPolicy: 'network-only',
  });

  const fetchDashboardData = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Dashboard] Fetching agency stats for email:', email);

      // Step 1: Get base profile to get user ID
      const { data: baseData, error: baseError } = await fetchBaseProfile({
        variables: { email },
      });

      if (baseError) throw baseError;

      const baseProfile = baseData?.profiles?.[0];
      if (!baseProfile?.id) {
        console.log('[Dashboard] No base profile found');
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch agency profile and activities in parallel
      // Note: financials query requires uuid but we have string, so we skip it for now
      const { today, monthStart } = getDateParams();
      const [statsResult, activitiesResult] = await Promise.all([
        fetchStats({ variables: { userId: baseProfile.id, today, monthStart } }),
        fetchActivities(),
      ]);

      if (statsResult.error) throw statsResult.error;

      const data = statsResult.data;
      const profileData = data?.agency_profiles?.[0];
      console.log('[Dashboard] Agency profile found:', profileData ? 'yes' : 'no');

      // Extract maid status counts
      const availableMaids = data?.available_maids?.aggregate?.count || 0;
      const placedMaids = data?.placed_maids?.aggregate?.count || 0;
      const pendingMaids = data?.pending_maids?.aggregate?.count || 0;
      const totalManagedMaids = profileData?.total_maids_managed || profileData?.total_maids || 0;

      // Extract job counts
      const activeJobs = data?.active_jobs?.aggregate?.count || 0;
      const totalJobs = data?.total_jobs?.aggregate?.count || 0;

      // Extract application counts
      const pendingApplications = data?.pending_applications?.aggregate?.count || 0;

      // NEW: Extract additional KPIs (synced with web)
      const newApplicantsToday = data?.new_applicants_today?.aggregate?.count || 0;
      const interviewsScheduled = data?.interviews_scheduled?.aggregate?.count || 0;
      const hiresThisMonth = data?.hires_this_month?.aggregate?.count || 0;

      // NEW: Build pipeline funnel data (synced with web)
      const pipelineFunnel: PipelineStage[] = [
        { name: 'New', count: data?.pipeline_new?.aggregate?.count || 0, color: '#3B82F6' },
        { name: 'Reviewed', count: data?.pipeline_reviewed?.aggregate?.count || 0, color: '#8B5CF6' },
        { name: 'Shortlisted', count: data?.pipeline_shortlisted?.aggregate?.count || 0, color: '#F59E0B' },
        { name: 'Interviewed', count: data?.pipeline_interviewed?.aggregate?.count || 0, color: '#10B981' },
        { name: 'Offered', count: data?.pipeline_offered?.aggregate?.count || 0, color: '#6366F1' },
        { name: 'Hired', count: data?.pipeline_hired?.aggregate?.count || 0, color: '#22C55E' },
      ];

      // Map recent activities
      const recentActivities: AgencyActivity[] = (activitiesResult.data?.activity_announcements || []).map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        activityType: activity.activity_type,
        createdAt: activity.created_at,
      }));

      // Financial data - we use credits from agency profile if available
      // The agency_credits table uses uuid, so we set null for now
      const financials: AgencyFinancials | null = null;

      setProfile({
        fullName: profileData?.full_name || '',
        avatarUrl: profileData?.logo_url || null,
      });

      setStats({
        totalMaids: totalManagedMaids,
        activeJobs,
        totalJobs,
        newApplicants: pendingApplications, // Using pending as "new"
        pendingApplicants: pendingApplications,
        successfulPlacements: profileData?.successful_placements || 0,
        activeListings: profileData?.active_listings || 0,
        averageRating: profileData?.average_rating || 0,
        isVerified: profileData?.verified || false,
        // NEW: Additional KPIs
        newApplicantsToday,
        interviewsScheduled,
        hiresThisMonth,
        pipelineFunnel,
        maidStatus: {
          available: availableMaids,
          placed: placedMaids,
          pending: pendingMaids,
          total: totalManagedMaids,
        },
        subscriptionTier: profileData?.subscription_tier || null,
        subscriptionExpiresAt: profileData?.subscription_expires_at || null,
        placementFeePercentage: profileData?.placement_fee_percentage || null,
        guaranteePeriodMonths: profileData?.guarantee_period_months || null,
        serviceCountries: profileData?.service_countries || [],
        specialization: profileData?.specialization || [],
        establishedYear: profileData?.established_year || null,
        recentActivities,
        financials,
      });
    } catch (err) {
      console.error('[Dashboard] Error fetching agency stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [email, fetchBaseProfile, fetchStats, fetchActivities]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    profile,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
}

// ============================================
// Agency Dashboard Hook with Real-time Subscriptions
// ============================================

export interface RealtimeDashboardData<T> extends DashboardData<T> {
  isSubscribed: boolean;
}

/**
 * Real-time Agency Dashboard Hook
 *
 * This hook uses GraphQL subscriptions to provide live updates to the dashboard.
 * It first fetches initial data, then maintains real-time sync with the database.
 */
export function useAgencyDashboardRealtime(email: string | null | undefined): RealtimeDashboardData<AgencyDashboardStats> {
  const [stats, setStats] = useState<AgencyDashboardStats>({
    totalMaids: 0,
    activeJobs: 0,
    totalJobs: 0,
    newApplicants: 0,
    pendingApplicants: 0,
    successfulPlacements: 0,
    activeListings: 0,
    averageRating: 0,
    isVerified: false,
    // NEW: Additional KPIs
    newApplicantsToday: 0,
    interviewsScheduled: 0,
    hiresThisMonth: 0,
    pipelineFunnel: [],
    maidStatus: { available: 0, placed: 0, pending: 0, total: 0 },
    subscriptionTier: null,
    subscriptionExpiresAt: null,
    placementFeePercentage: null,
    guaranteePeriodMonths: null,
    serviceCountries: [],
    specialization: [],
    establishedYear: null,
    recentActivities: [],
    financials: null,
  });
  const [profile, setProfile] = useState<ProfileInfo>({
    fullName: '',
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Track if initial load is complete
  const initialLoadComplete = useRef(false);

  // Initial query to get base profile and agency ID
  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
  });

  // Subscribe to agency profile updates
  const { data: agencyData, loading: agencyLoading, error: agencyError } = useSubscription(
    SUBSCRIBE_AGENCY_STATS,
    {
      variables: { agencyId: agencyId || '' },
      skip: !agencyId,
      onData: ({ data }) => {
        console.log('[Dashboard Realtime] Agency profile update received');
        setIsSubscribed(true);
      },
    }
  );

  // Subscribe to total maid count (single field per subscription for Hasura)
  const { data: totalMaidsData, error: totalMaidsError } = useSubscription(
    SUBSCRIBE_TOTAL_MAIDS,
    {
      variables: { agencyId: agencyId || '' },
      skip: !agencyId,
      onData: ({ data }) => {
        const count = data?.data?.maid_profiles_aggregate?.aggregate?.count ?? 0;
        console.log('[Dashboard Realtime] Total maids update:', count);
      },
      onError: (error) => {
        console.error('[Dashboard Realtime] Total maids subscription error:', error);
      },
    }
  );

  // Subscribe to active jobs count
  const { data: activeJobsData } = useSubscription(
    SUBSCRIBE_ACTIVE_JOBS,
    {
      skip: !agencyId,
      onData: ({ data }) => {
        const count = data?.data?.jobs_aggregate?.aggregate?.count ?? 0;
        console.log('[Dashboard Realtime] Active jobs update:', count);
      },
    }
  );

  // Subscribe to pending applications count
  const { data: pendingApplicationsData } = useSubscription(
    SUBSCRIBE_PENDING_APPLICATIONS,
    {
      skip: !agencyId,
      onData: ({ data }) => {
        const count = data?.data?.applications_aggregate?.aggregate?.count ?? 0;
        console.log('[Dashboard Realtime] Pending applications update:', count);
      },
    }
  );

  // Subscribe to recent activities
  const { data: activitiesData, loading: activitiesLoading } = useSubscription(
    SUBSCRIBE_RECENT_ACTIVITIES,
    {
      skip: !agencyId,
      onData: ({ data }) => {
        console.log('[Dashboard Realtime] Activities update received');
      },
    }
  );

  // Initial load to get agency ID
  const fetchInitialData = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Dashboard Realtime] Fetching initial data for email:', email);

      const { data: baseData, error: baseError } = await fetchBaseProfile({
        variables: { email },
      });

      if (baseError) throw baseError;

      const baseProfile = baseData?.profiles?.[0];
      if (!baseProfile?.id) {
        console.log('[Dashboard Realtime] No base profile found');
        setIsLoading(false);
        return;
      }

      console.log('[Dashboard Realtime] Agency ID found:', baseProfile.id);
      setAgencyId(baseProfile.id);
      initialLoadComplete.current = true;
    } catch (err) {
      console.error('[Dashboard Realtime] Error fetching initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setIsLoading(false);
    }
  }, [email, fetchBaseProfile]);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Update stats when subscription data changes
  useEffect(() => {
    if (!agencyId) return;

    const profileData = agencyData?.agency_profiles?.[0];

    // Extract total maid count from subscription
    const totalMaidsFromAggregate = totalMaidsData?.maid_profiles_aggregate?.aggregate?.count ?? 0;

    // Use the actual aggregate count from subscription, fallback to profile data
    const totalManagedMaids = totalMaidsFromAggregate || profileData?.total_maids_managed || profileData?.total_maids || 0;

    console.log('[Dashboard Realtime] Total maids count:', totalManagedMaids, 'agencyId:', agencyId);

    // Extract job counts from subscription
    const activeJobs = activeJobsData?.jobs_aggregate?.aggregate?.count ?? 0;

    // Extract application counts from subscription
    const pendingApplications = pendingApplicationsData?.applications_aggregate?.aggregate?.count ?? 0;

    // Map recent activities from subscription
    const recentActivities: AgencyActivity[] = (activitiesData?.activity_announcements || []).map((activity: any) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      activityType: activity.activity_type,
      createdAt: activity.created_at,
    }));

    // Update profile
    if (profileData) {
      setProfile({
        fullName: profileData.full_name || '',
        avatarUrl: profileData.logo_url || null,
      });
    }

    // Only update stats if we have some data
    if (profileData || totalMaidsData || activeJobsData || pendingApplicationsData || activitiesData) {
      setStats(prevStats => ({
        ...prevStats,
        // Use actual aggregate count for totalMaids
        totalMaids: totalMaidsData ? totalManagedMaids : prevStats.totalMaids,
        activeJobs: activeJobsData ? activeJobs : prevStats.activeJobs,
        totalJobs: prevStats.totalJobs, // Keep existing - we don't have a separate subscription for this
        newApplicants: pendingApplicationsData ? pendingApplications : prevStats.newApplicants,
        pendingApplicants: pendingApplicationsData ? pendingApplications : prevStats.pendingApplicants,
        successfulPlacements: profileData?.successful_placements ?? prevStats.successfulPlacements,
        activeListings: profileData?.active_listings ?? prevStats.activeListings,
        averageRating: profileData?.average_rating ?? prevStats.averageRating,
        isVerified: profileData?.verified ?? prevStats.isVerified,
        maidStatus: totalMaidsData ? {
          available: totalManagedMaids, // Simplified - all maids shown as available for now
          placed: 0,
          pending: 0,
          total: totalManagedMaids,
        } : prevStats.maidStatus,
        subscriptionTier: profileData?.subscription_tier ?? prevStats.subscriptionTier,
        subscriptionExpiresAt: profileData?.subscription_expires_at ?? prevStats.subscriptionExpiresAt,
        placementFeePercentage: profileData?.placement_fee_percentage ?? prevStats.placementFeePercentage,
        guaranteePeriodMonths: profileData?.guarantee_period_months ?? prevStats.guaranteePeriodMonths,
        serviceCountries: profileData?.service_countries || prevStats.serviceCountries,
        specialization: profileData?.specialization || prevStats.specialization,
        establishedYear: profileData?.established_year ?? prevStats.establishedYear,
        recentActivities: activitiesData ? recentActivities : prevStats.recentActivities,
        financials: prevStats.financials, // Keep existing financials
      }));

      setIsLoading(false);
    }
  }, [agencyId, agencyData, totalMaidsData, activeJobsData, pendingApplicationsData, activitiesData]);

  // Handle subscription errors
  useEffect(() => {
    if (agencyError) {
      console.error('[Dashboard Realtime] Agency subscription error:', agencyError);
      setError(agencyError.message);
    }
    if (totalMaidsError) {
      console.error('[Dashboard Realtime] Total maids subscription error:', totalMaidsError);
    }
  }, [agencyError, totalMaidsError]);

  const refetch = useCallback(() => {
    // For real-time subscriptions, we just need to refetch the initial data
    // The subscriptions will automatically update
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    stats,
    profile,
    isLoading,
    error,
    refetch,
    isSubscribed,
  };
}

// ============================================
// Recent Items Hooks
// ============================================

export interface RecentBooking {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  amount: number | null;
  currency: string | null;
  createdAt: string;
}

export function useRecentBookings(email: string | null | undefined, userType: 'sponsor' | 'maid') {
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // For now, return empty array since booking queries may not be generated
      // This can be updated once the booking queries are available
      setBookings([]);
    } catch (err) {
      console.error('[Dashboard] Error fetching recent bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [email, userType]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return { bookings, isLoading, refetch: loadBookings };
}

export interface RecentJob {
  id: string;
  title: string;
  status: string;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
}

export function useRecentJobs(email: string | null | undefined, userType: 'sponsor' | 'agency') {
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // For now, return empty array since jobs queries need to be filtered by profile email
      // through the profile relationship, which requires a more complex query setup
      // This can be updated once the proper query structure is determined
      setJobs([]);
    } catch (err) {
      console.error('[Dashboard] Error fetching recent jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [email, userType]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return { jobs, isLoading, refetch: loadJobs };
}

// ============================================
// Maid Dashboard Hook with Real-time Subscriptions
// ============================================

/**
 * Real-time Maid Dashboard Hook
 *
 * This hook uses GraphQL subscriptions to provide live updates to the maid dashboard.
 * Subscribes to: bookings, notifications, profile updates
 */
export function useMaidDashboardRealtime(email: string | null | undefined): RealtimeDashboardData<MaidDashboardStats> {
  const [stats, setStats] = useState<MaidDashboardStats>({
    totalApplications: 0,
    profileViews: 0,
    successfulPlacements: 0,
    averageRating: 0,
    totalBookings: 0,
    activeBookings: 0,
    pendingBookings: 0,
    unreadNotifications: 0,
    profileCompleteness: 0,
    hasPhoto: false,
    hasSkills: false,
    hasLanguages: false,
    visaStatus: 'Not specified',
    availability: 'Not specified',
    salaryRange: 'Not specified',
    livingArrangement: 'Not specified',
    contractPreference: 'Not specified',
    skills: [],
    languages: [],
    emailVerified: true,
    phoneVerified: false,
    documentsVerified: false,
    lastUpdated: null,
  });
  const [profile, setProfile] = useState<ProfileInfo>({
    fullName: '',
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
  });

  const [fetchStats] = useLazyQuery(GET_MAID_STATS, {
    fetchPolicy: 'network-only',
  });

  // Subscribe to booking updates
  const { data: bookingsData } = useSubscription(
    SUBSCRIBE_MAID_BOOKINGS,
    {
      variables: { maidId: userId || '' },
      skip: !userId,
      onData: () => {
        console.log('[Maid Dashboard Realtime] Booking update received');
        setIsSubscribed(true);
        // Refetch stats when bookings change
        if (userId) refetchStats();
      },
    }
  );

  // Subscribe to notification updates
  const { data: notificationsData } = useSubscription(
    SUBSCRIBE_MAID_NOTIFICATIONS,
    {
      variables: { userId: userId || '' },
      skip: !userId,
      onData: () => {
        console.log('[Maid Dashboard Realtime] Notification update received');
        setIsSubscribed(true);
        if (userId) refetchStats();
      },
    }
  );

  // Subscribe to profile updates
  const { data: profileSubData } = useSubscription(
    SUBSCRIBE_MAID_PROFILE,
    {
      variables: { userId: userId || '' },
      skip: !userId,
      onData: () => {
        console.log('[Maid Dashboard Realtime] Profile update received');
        setIsSubscribed(true);
        if (userId) refetchStats();
      },
    }
  );

  // Function to refetch stats
  const refetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: queryError } = await fetchStats({
        variables: { userId },
      });

      if (queryError) {
        console.error('[Maid Dashboard Realtime] Error refetching stats:', queryError);
        return;
      }

      const profileData = data?.maid_profiles?.[0];
      const totalBookings = data?.booking_requests_aggregate?.aggregate?.count || 0;
      const pendingBookings = data?.pending_bookings?.aggregate?.count || 0;
      const unreadNotifications = data?.notifications_aggregate?.aggregate?.count || 0;

      const photoUrl = profileData?.profile_photo_url || profileData?.primary_image_processed_url || null;
      const skills = Array.isArray(profileData?.skills) ? profileData.skills : [];
      const languages = Array.isArray(profileData?.languages) ? profileData.languages : [];

      setProfile({
        fullName: profileData?.full_name || '',
        avatarUrl: photoUrl,
      });

      // Build salary range string
      let salaryRange = 'Not specified';
      if (profileData?.preferred_salary_min) {
        const currency = profileData?.preferred_currency || 'USD';
        if (profileData?.preferred_salary_max && profileData.preferred_salary_max !== profileData.preferred_salary_min) {
          salaryRange = `${profileData.preferred_salary_min}-${profileData.preferred_salary_max} ${currency}`;
        } else {
          salaryRange = `${profileData.preferred_salary_min} ${currency}`;
        }
      }

      // Build living arrangement string
      let livingArrangement = 'Not specified';
      if (profileData?.live_in_preference === true) {
        livingArrangement = 'Live-in';
      } else if (profileData?.live_in_preference === false) {
        livingArrangement = 'Live-out';
      }

      setStats({
        totalApplications: profileData?.total_applications || 0,
        profileViews: profileData?.profile_views || 0,
        successfulPlacements: profileData?.successful_placements || 0,
        averageRating: profileData?.average_rating || 0,
        totalBookings,
        activeBookings: pendingBookings,
        pendingBookings,
        unreadNotifications,
        profileCompleteness: calculateProfileCompleteness(profileData, null),
        hasPhoto: !!photoUrl,
        hasSkills: skills.length > 0,
        hasLanguages: languages.length > 0,
        visaStatus: profileData?.current_visa_status || 'Not specified',
        availability: profileData?.availability_status || 'Not specified',
        salaryRange,
        livingArrangement,
        contractPreference: profileData?.contract_duration_preference || 'Not specified',
        skills,
        languages,
        emailVerified: true,
        phoneVerified: false,
        documentsVerified: (profileData?.medical_certificate_valid && profileData?.police_clearance_valid) || false,
        lastUpdated: profileData?.updated_at || profileData?.created_at || null,
      });
    } catch (err) {
      console.error('[Maid Dashboard Realtime] Error in refetchStats:', err);
    }
  }, [userId, fetchStats]);

  // Initial load
  const fetchInitialData = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Maid Dashboard Realtime] Fetching initial data for email:', email);

      const { data: baseData, error: baseError } = await fetchBaseProfile({
        variables: { email },
      });

      if (baseError) throw baseError;

      const baseProfile = baseData?.profiles?.[0];
      if (!baseProfile?.id) {
        console.log('[Maid Dashboard Realtime] No base profile found');
        setIsLoading(false);
        return;
      }

      console.log('[Maid Dashboard Realtime] User ID found:', baseProfile.id);
      setUserId(baseProfile.id);

      // Fetch initial stats
      const { data, error: queryError } = await fetchStats({
        variables: { userId: baseProfile.id },
      });

      if (queryError) throw queryError;

      const profileData = data?.maid_profiles?.[0];
      const totalBookings = data?.booking_requests_aggregate?.aggregate?.count || 0;
      const pendingBookings = data?.pending_bookings?.aggregate?.count || 0;
      const unreadNotifications = data?.notifications_aggregate?.aggregate?.count || 0;

      const photoUrl = profileData?.profile_photo_url || profileData?.primary_image_processed_url || null;
      const skills = Array.isArray(profileData?.skills) ? profileData.skills : [];
      const languages = Array.isArray(profileData?.languages) ? profileData.languages : [];

      setProfile({
        fullName: profileData?.full_name || '',
        avatarUrl: photoUrl,
      });

      // Build salary range string
      let salaryRange = 'Not specified';
      if (profileData?.preferred_salary_min) {
        const currency = profileData?.preferred_currency || 'USD';
        if (profileData?.preferred_salary_max && profileData.preferred_salary_max !== profileData.preferred_salary_min) {
          salaryRange = `${profileData.preferred_salary_min}-${profileData.preferred_salary_max} ${currency}`;
        } else {
          salaryRange = `${profileData.preferred_salary_min} ${currency}`;
        }
      }

      // Build living arrangement string
      let livingArrangement = 'Not specified';
      if (profileData?.live_in_preference === true) {
        livingArrangement = 'Live-in';
      } else if (profileData?.live_in_preference === false) {
        livingArrangement = 'Live-out';
      }

      setStats({
        totalApplications: profileData?.total_applications || 0,
        profileViews: profileData?.profile_views || 0,
        successfulPlacements: profileData?.successful_placements || 0,
        averageRating: profileData?.average_rating || 0,
        totalBookings,
        activeBookings: pendingBookings,
        pendingBookings,
        unreadNotifications,
        profileCompleteness: calculateProfileCompleteness(profileData, baseProfile),
        hasPhoto: !!photoUrl,
        hasSkills: skills.length > 0,
        hasLanguages: languages.length > 0,
        visaStatus: profileData?.current_visa_status || 'Not specified',
        availability: profileData?.availability_status || 'Not specified',
        salaryRange,
        livingArrangement,
        contractPreference: profileData?.contract_duration_preference || 'Not specified',
        skills,
        languages,
        emailVerified: true,
        phoneVerified: baseProfile?.registration_complete || false,
        documentsVerified: (profileData?.medical_certificate_valid && profileData?.police_clearance_valid) || false,
        lastUpdated: profileData?.updated_at || profileData?.created_at || null,
      });
    } catch (err) {
      console.error('[Maid Dashboard Realtime] Error fetching initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [email, fetchBaseProfile, fetchStats]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    stats,
    profile,
    isLoading,
    error,
    refetch: fetchInitialData,
    isSubscribed,
  };
}

// ============================================
// Sponsor Dashboard Hook with Real-time Subscriptions
// ============================================

/**
 * Real-time Sponsor Dashboard Hook
 *
 * This hook uses GraphQL subscriptions to provide live updates to the sponsor dashboard.
 * Subscribes to: bookings, favorites, notifications
 */
export function useSponsorDashboardRealtime(email: string | null | undefined): RealtimeDashboardData<SponsorDashboardStats> {
  const [stats, setStats] = useState<SponsorDashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    savedFavorites: 0,
    totalJobs: 0,
    activeJobs: 0,
    pendingBookings: 0,
  });
  const [profile, setProfile] = useState<ProfileInfo>({
    fullName: '',
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
  });

  const [fetchStats] = useLazyQuery(GET_SPONSOR_STATS, {
    fetchPolicy: 'network-only',
  });

  // Subscribe to booking updates
  const { data: bookingsData } = useSubscription(
    SUBSCRIBE_SPONSOR_BOOKINGS,
    {
      variables: { sponsorId: userId || '' },
      skip: !userId,
      onData: () => {
        console.log('[Sponsor Dashboard Realtime] Booking update received');
        setIsSubscribed(true);
        if (userId) refetchStats();
      },
    }
  );

  // Subscribe to favorites updates
  const { data: favoritesData } = useSubscription(
    SUBSCRIBE_SPONSOR_FAVORITES,
    {
      variables: { sponsorId: userId || '' },
      skip: !userId,
      onData: () => {
        console.log('[Sponsor Dashboard Realtime] Favorites update received');
        setIsSubscribed(true);
        if (userId) refetchStats();
      },
    }
  );

  // Subscribe to notification updates
  const { data: notificationsData } = useSubscription(
    SUBSCRIBE_SPONSOR_NOTIFICATIONS,
    {
      variables: { userId: userId || '' },
      skip: !userId,
      onData: () => {
        console.log('[Sponsor Dashboard Realtime] Notification update received');
        setIsSubscribed(true);
      },
    }
  );

  // Function to refetch stats
  const refetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: queryError } = await fetchStats({
        variables: { userId },
      });

      if (queryError) {
        console.error('[Sponsor Dashboard Realtime] Error refetching stats:', queryError);
        return;
      }

      const profileData = data?.sponsor_profiles?.[0];

      setProfile({
        fullName: profileData?.full_name || '',
        avatarUrl: profileData?.avatar_url || null,
      });

      setStats({
        totalBookings: profileData?.total_hires || 0,
        activeBookings: profileData?.active_job_postings || 0,
        savedFavorites: 0, // Would need separate query
        totalJobs: 0,
        activeJobs: 0,
        pendingBookings: 0,
      });
    } catch (err) {
      console.error('[Sponsor Dashboard Realtime] Error in refetchStats:', err);
    }
  }, [userId, fetchStats]);

  // Initial load
  const fetchInitialData = useCallback(async () => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Sponsor Dashboard Realtime] Fetching initial data for email:', email);

      const { data: baseData, error: baseError } = await fetchBaseProfile({
        variables: { email },
      });

      if (baseError) throw baseError;

      const baseProfile = baseData?.profiles?.[0];
      if (!baseProfile?.id) {
        console.log('[Sponsor Dashboard Realtime] No base profile found');
        setIsLoading(false);
        return;
      }

      console.log('[Sponsor Dashboard Realtime] User ID found:', baseProfile.id);
      setUserId(baseProfile.id);

      // Fetch initial stats
      const { data, error: queryError } = await fetchStats({
        variables: { userId: baseProfile.id },
      });

      if (queryError) throw queryError;

      const profileData = data?.sponsor_profiles?.[0];

      setProfile({
        fullName: profileData?.full_name || '',
        avatarUrl: profileData?.avatar_url || null,
      });

      setStats({
        totalBookings: profileData?.total_hires || 0,
        activeBookings: profileData?.active_job_postings || 0,
        savedFavorites: 0,
        totalJobs: 0,
        activeJobs: 0,
        pendingBookings: 0,
      });
    } catch (err) {
      console.error('[Sponsor Dashboard Realtime] Error fetching initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [email, fetchBaseProfile, fetchStats]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    stats,
    profile,
    isLoading,
    error,
    refetch: fetchInitialData,
    isSubscribed,
  };
}
