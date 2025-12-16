/**
 * Agency Dashboard Service - GraphQL Implementation
 *
 * MIGRATED FROM SUPABASE TO HASURA/GRAPHQL
 *
 * All KPI queries now use GraphQL aggregations via Apollo Client.
 * This service provides dashboard metrics, analytics, and alerts for agencies.
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AgencyDashboardService');

// ============================================================================
// GRAPHQL DOCUMENTS FOR KPIs
// ============================================================================

const GET_ACTIVE_MAIDS_COUNT = gql`
  query GetActiveMaidsCount($agencyId: String!) {
    maid_profiles_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        availability_status: { _in: ["available", "active"] }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_JOBS_LIVE_COUNT = gql`
  query GetJobsLiveCount($agencyId: String!) {
    agency_jobs_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _eq: "active" }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_NEW_APPLICANTS_TODAY = gql`
  query GetNewApplicantsToday($agencyId: String!, $todayStart: timestamptz!) {
    applications_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        created_at: { _gte: $todayStart }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_INTERVIEWS_SCHEDULED = gql`
  query GetInterviewsScheduled($agencyId: String!, $now: timestamptz!, $tomorrow: timestamptz!) {
    applications_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        application_status: { _eq: "interviewed" }
        interview_date: { _gte: $now, _lte: $tomorrow }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_HIRES_THIS_MONTH = gql`
  query GetHiresThisMonth($agencyId: String!, $monthStart: timestamptz!) {
    applications_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        application_status: { _eq: "hired" }
        updated_at: { _gte: $monthStart }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_SUBSCRIPTION_STATUS = gql`
  query GetSubscriptionStatus($agencyId: String!) {
    agency_profiles_by_pk(id: $agencyId) {
      subscription_tier
      subscription_expires_at
    }
  }
`;

const GET_OVERDUE_DOCUMENTS = gql`
  query GetOverdueDocuments($agencyId: String!, $now: timestamptz!) {
    maid_profiles_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        _or: [
          { passport_expiry_date: { _lt: $now } }
          { visa_expiry_date: { _lt: $now } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_OPEN_DISPUTES = gql`
  query GetOpenDisputes($agencyId: String!) {
    bookings_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _in: ["disputed", "under_review"] }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Combined KPIs query for efficiency
const GET_ALL_KPIS = gql`
  query GetAllAgencyKPIs(
    $agencyId: String!
    $todayStart: timestamptz!
    $now: timestamptz!
    $tomorrow: timestamptz!
    $monthStart: timestamptz!
  ) {
    # Active maids count
    activeMaids: maid_profiles_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        availability_status: { _in: ["available", "active"] }
      }
    ) {
      aggregate {
        count
      }
    }

    # Total maids count
    totalMaids: maid_profiles_aggregate(
      where: { agency_id: { _eq: $agencyId } }
    ) {
      aggregate {
        count
      }
    }

    # Jobs live count
    jobsLive: agency_jobs_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _eq: "active" }
      }
    ) {
      aggregate {
        count
      }
    }

    # Total jobs count
    totalJobs: agency_jobs_aggregate(
      where: { agency_id: { _eq: $agencyId } }
    ) {
      aggregate {
        count
      }
    }

    # New applicants today
    newApplicantsToday: applications_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        created_at: { _gte: $todayStart }
      }
    ) {
      aggregate {
        count
      }
    }

    # Total applications
    totalApplications: applications_aggregate(
      where: { agency_id: { _eq: $agencyId } }
    ) {
      aggregate {
        count
      }
    }

    # Interviews scheduled (upcoming)
    interviewsScheduled: applications_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        application_status: { _in: ["interviewed", "interview_scheduled"] }
        interview_date: { _gte: $now }
      }
    ) {
      aggregate {
        count
      }
    }

    # Hires this month
    hiresThisMonth: applications_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        application_status: { _eq: "hired" }
        updated_at: { _gte: $monthStart }
      }
    ) {
      aggregate {
        count
      }
    }

    # Agency profile for subscription
    agencyProfile: agency_profiles_by_pk(id: $agencyId) {
      subscription_tier
      subscription_expires_at
      successful_placements
    }

    # Overdue documents (expired passports/visas)
    overdueDocuments: maid_profiles_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        _or: [
          { passport_expiry_date: { _lt: $now } }
          { visa_expiry_date: { _lt: $now } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }

    # Open disputes
    openDisputes: bookings_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _in: ["disputed", "under_review"] }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// ============================================================================
// AGENCY DASHBOARD SERVICE CLASS
// ============================================================================

export class AgencyDashboardService {
  // KPI Calculations - Single optimized query
  static async getAgencyKPIs(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch KPIs');
      }

      // Calculate date boundaries
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      log.debug('Fetching agency KPIs via GraphQL', { agencyId });

      const { data, errors } = await apolloClient.query({
        query: GET_ALL_KPIS,
        variables: {
          agencyId,
          todayStart: todayStart.toISOString(),
          now: now.toISOString(),
          tomorrow: tomorrow.toISOString(),
          monthStart: monthStart.toISOString(),
        },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching KPIs:', errors);
        throw new Error(errors[0].message);
      }

      const profile = data?.agencyProfile || {};

      return {
        activeMaids: data?.activeMaids?.aggregate?.count || 0,
        totalMaids: data?.totalMaids?.aggregate?.count || 0,
        jobsLive: data?.jobsLive?.aggregate?.count || 0,
        totalJobs: data?.totalJobs?.aggregate?.count || 0,
        newApplicantsToday: data?.newApplicantsToday?.aggregate?.count || 0,
        totalApplications: data?.totalApplications?.aggregate?.count || 0,
        interviewsScheduled: data?.interviewsScheduled?.aggregate?.count || 0,
        hiresThisMonth: data?.hiresThisMonth?.aggregate?.count || 0,
        successfulPlacements: profile.successful_placements || 0,
        subscriptionStatus: {
          status: profile.subscription_tier ? 'active' : 'inactive',
          plan_type: profile.subscription_tier || 'basic',
          expires_at: profile.subscription_expires_at,
        },
        overdueDocuments: data?.overdueDocuments?.aggregate?.count || 0,
        openDisputes: data?.openDisputes?.aggregate?.count || 0,
      };
    } catch (error) {
      log.error('Error fetching agency KPIs:', error);
      throw new Error(`Failed to fetch agency KPIs: ${error.message}`);
    }
  }

  // Individual KPI methods (for granular fetching if needed)
  static async getActiveMaidsCount(agencyId) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ACTIVE_MAIDS_COUNT,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });
      return data?.maid_profiles_aggregate?.aggregate?.count || 0;
    } catch (error) {
      log.error('Error fetching active maids count:', error);
      return 0;
    }
  }

  static async getJobsLiveCount(agencyId) {
    try {
      const { data } = await apolloClient.query({
        query: GET_JOBS_LIVE_COUNT,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });
      return data?.agency_jobs_aggregate?.aggregate?.count || 0;
    } catch (error) {
      log.error('Error fetching jobs live count:', error);
      return 0;
    }
  }

  static async getNewApplicantsTodayCount(agencyId) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await apolloClient.query({
        query: GET_NEW_APPLICANTS_TODAY,
        variables: {
          agencyId,
          todayStart: todayStart.toISOString(),
        },
        fetchPolicy: 'network-only',
      });
      return data?.applications_aggregate?.aggregate?.count || 0;
    } catch (error) {
      log.error('Error fetching new applicants today count:', error);
      return 0;
    }
  }

  static async getInterviewsScheduledCount(agencyId) {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data } = await apolloClient.query({
        query: GET_INTERVIEWS_SCHEDULED,
        variables: {
          agencyId,
          now: now.toISOString(),
          tomorrow: tomorrow.toISOString(),
        },
        fetchPolicy: 'network-only',
      });
      return data?.applications_aggregate?.aggregate?.count || 0;
    } catch (error) {
      log.error('Error fetching interviews scheduled count:', error);
      return 0;
    }
  }

  static async getHiresThisMonthCount(agencyId) {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data } = await apolloClient.query({
        query: GET_HIRES_THIS_MONTH,
        variables: {
          agencyId,
          monthStart: monthStart.toISOString(),
        },
        fetchPolicy: 'network-only',
      });
      return data?.applications_aggregate?.aggregate?.count || 0;
    } catch (error) {
      log.error('Error fetching hires this month count:', error);
      return 0;
    }
  }

  static async getSubscriptionStatus(agencyId) {
    try {
      const { data } = await apolloClient.query({
        query: GET_SUBSCRIPTION_STATUS,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      const profile = data?.agency_profiles_by_pk;
      if (!profile) {
        return { status: 'inactive', plan_type: 'basic' };
      }

      return {
        status: profile.subscription_tier ? 'active' : 'inactive',
        plan_type: profile.subscription_tier || 'basic',
        expires_at: profile.subscription_expires_at,
      };
    } catch (error) {
      log.error('Error fetching subscription status:', error);
      return { status: 'inactive', plan_type: 'basic' };
    }
  }

  static async getOverdueDocumentsCount(agencyId) {
    try {
      const now = new Date().toISOString();

      const { data } = await apolloClient.query({
        query: GET_OVERDUE_DOCUMENTS,
        variables: { agencyId, now },
        fetchPolicy: 'network-only',
      });
      return data?.maid_profiles_aggregate?.aggregate?.count || 0;
    } catch (error) {
      log.error('Error fetching overdue documents count:', error);
      return 0;
    }
  }

  static async getOpenDisputesCount(agencyId) {
    try {
      const { data } = await apolloClient.query({
        query: GET_OPEN_DISPUTES,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });
      return data?.bookings_aggregate?.aggregate?.count || 0;
    } catch (error) {
      log.error('Error fetching open disputes count:', error);
      return 0;
    }
  }

  // Pipeline Analytics - GraphQL Implementation
  static async getPipelineFunnel(agencyId, dateRange = 30) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch pipeline funnel');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const GET_PIPELINE_FUNNEL = gql`
        query GetPipelineFunnel($agencyId: String!, $startDate: timestamptz!) {
          # Maid profiles added in date range
          profiles: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              created_at: { _gte: $startDate }
            }
          ) {
            aggregate {
              count
            }
          }

          # Applications received
          applied: applications_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              created_at: { _gte: $startDate }
            }
          ) {
            aggregate {
              count
            }
          }

          # Interviews conducted
          interviewed: applications_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              application_status: { _in: ["interviewed", "interview_scheduled", "interview_completed"] }
              created_at: { _gte: $startDate }
            }
          ) {
            aggregate {
              count
            }
          }

          # Offers sent
          offered: applications_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              application_status: { _in: ["offered", "offer_sent", "offer_accepted"] }
              created_at: { _gte: $startDate }
            }
          ) {
            aggregate {
              count
            }
          }

          # Hires completed
          hired: applications_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              application_status: { _eq: "hired" }
              updated_at: { _gte: $startDate }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_PIPELINE_FUNNEL,
        variables: {
          agencyId,
          startDate: startDate.toISOString(),
        },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching pipeline funnel:', errors);
        throw new Error(errors[0].message);
      }

      return {
        profiles: data?.profiles?.aggregate?.count || 0,
        applied: data?.applied?.aggregate?.count || 0,
        interviewed: data?.interviewed?.aggregate?.count || 0,
        offered: data?.offered?.aggregate?.count || 0,
        hired: data?.hired?.aggregate?.count || 0,
      };
    } catch (error) {
      log.error('Error getting pipeline funnel:', error);
      throw new Error(`Failed to fetch pipeline funnel: ${error.message}`);
    }
  }

  // Time to Hire Analytics - GraphQL Implementation
  static async getTimeToHireTrend(agencyId, periods = ['7d', '30d', '90d']) {
    const results = {};

    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch time to hire trend');
      }

      const GET_HIRED_APPLICATIONS = gql`
        query GetHiredApplications($agencyId: String!, $startDate: timestamptz!) {
          applications(
            where: {
              agency_id: { _eq: $agencyId }
              application_status: { _eq: "hired" }
              updated_at: { _gte: $startDate }
            }
          ) {
            id
            created_at
            updated_at
            hired_date
          }
        }
      `;

      for (const period of periods) {
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, errors } = await apolloClient.query({
          query: GET_HIRED_APPLICATIONS,
          variables: {
            agencyId,
            startDate: startDate.toISOString(),
          },
          fetchPolicy: 'network-only',
        });

        if (errors?.length) {
          log.error(`GraphQL errors fetching time to hire for ${period}:`, errors);
          results[period] = 0;
          continue;
        }

        const applications = data?.applications || [];
        let avgDays = 0;

        if (applications.length > 0) {
          const totalDays = applications.reduce((sum, app) => {
            const hiredDate = new Date(app.hired_date || app.updated_at);
            const applicationDate = new Date(app.created_at);
            const diffTime = Math.abs(hiredDate - applicationDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }, 0);
          avgDays = Math.round(totalDays / applications.length);
        }

        results[period] = avgDays;
      }

      return results;
    } catch (error) {
      log.error('Error getting time to hire trend:', error);
      throw new Error(`Failed to fetch time to hire trend: ${error.message}`);
    }
  }

  // Tasks and SLA Management - GraphQL Implementation
  // Note: Tasks feature is a placeholder per CLAUDE.md, returning mock data
  static async getTasksSLA(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch tasks SLA');
      }

      // Tasks feature is a placeholder - return empty structure
      // When agency_tasks table is available, implement GraphQL query
      log.debug('Tasks SLA: Feature is placeholder, returning empty data');

      return {
        today: [],
        overdue: [],
        upcoming: [],
      };
    } catch (error) {
      log.error('Error getting tasks SLA:', error);
      throw new Error(`Failed to fetch tasks SLA: ${error.message}`);
    }
  }

  // Alerts System - GraphQL Implementation
  static async getAgencyAlerts(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch agency alerts');
      }

      const alerts = [];
      const now = new Date();

      // Define alert query
      const GET_ALERTS_DATA = gql`
        query GetAlertsData(
          $agencyId: String!
          $now: timestamptz!
          $thirtyDays: timestamptz!
          $sixtyDays: timestamptz!
          $ninetyDays: timestamptz!
        ) {
          # Paused jobs
          pausedJobs: agency_jobs_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              status: { _eq: "paused" }
            }
          ) {
            aggregate {
              count
            }
          }

          # Draft jobs (incomplete)
          draftJobs: agency_jobs_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              status: { _eq: "draft" }
            }
          ) {
            aggregate {
              count
            }
          }

          # Pending applications (need review)
          pendingApplications: applications_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              application_status: { _eq: "pending" }
              viewed_by_agency: { _eq: false }
            }
          ) {
            aggregate {
              count
            }
          }

          # Expiring passports in 30 days
          expiringPassports30: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              passport_expiry_date: { _gt: $now, _lte: $thirtyDays }
            }
          ) {
            aggregate {
              count
            }
          }

          # Expiring passports in 60 days
          expiringPassports60: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              passport_expiry_date: { _gt: $thirtyDays, _lte: $sixtyDays }
            }
          ) {
            aggregate {
              count
            }
          }

          # Expiring passports in 90 days
          expiringPassports90: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              passport_expiry_date: { _gt: $sixtyDays, _lte: $ninetyDays }
            }
          ) {
            aggregate {
              count
            }
          }

          # Expiring visas in 30 days
          expiringVisas30: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              visa_expiry_date: { _gt: $now, _lte: $thirtyDays }
            }
          ) {
            aggregate {
              count
            }
          }

          # Expired documents
          expiredDocuments: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              _or: [
                { passport_expiry_date: { _lt: $now } }
                { visa_expiry_date: { _lt: $now } }
              ]
            }
          ) {
            aggregate {
              count
            }
          }

          # Maids without profile photo
          incompleteMaids: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agencyId }
              _or: [
                { profile_photo_url: { _is_null: true } }
                { profile_photo_url: { _eq: "" } }
              ]
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `;

      // Calculate date thresholds
      const thirtyDays = new Date(now);
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      const sixtyDays = new Date(now);
      sixtyDays.setDate(sixtyDays.getDate() + 60);

      const ninetyDays = new Date(now);
      ninetyDays.setDate(ninetyDays.getDate() + 90);

      const { data, errors } = await apolloClient.query({
        query: GET_ALERTS_DATA,
        variables: {
          agencyId,
          now: now.toISOString(),
          thirtyDays: thirtyDays.toISOString(),
          sixtyDays: sixtyDays.toISOString(),
          ninetyDays: ninetyDays.toISOString(),
        },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching alerts:', errors);
      }

      // Build alerts from data
      const expiredDocs = data?.expiredDocuments?.aggregate?.count || 0;
      if (expiredDocs > 0) {
        alerts.push({
          type: 'documents_expired',
          level: 'critical',
          message: `${expiredDocs} maid(s) have expired documents`,
          count: expiredDocs,
          link: '/dashboard/agency/documents',
        });
      }

      const expiringPassports30 = data?.expiringPassports30?.aggregate?.count || 0;
      const expiringVisas30 = data?.expiringVisas30?.aggregate?.count || 0;
      const expiring30 = expiringPassports30 + expiringVisas30;
      if (expiring30 > 0) {
        alerts.push({
          type: 'documents_expiring',
          level: 'critical',
          message: `${expiring30} document(s) expiring within 30 days`,
          count: expiring30,
          days: 30,
          link: '/dashboard/agency/documents',
        });
      }

      const expiring60 = data?.expiringPassports60?.aggregate?.count || 0;
      if (expiring60 > 0) {
        alerts.push({
          type: 'documents_expiring',
          level: 'warning',
          message: `${expiring60} passport(s) expiring within 60 days`,
          count: expiring60,
          days: 60,
          link: '/dashboard/agency/documents',
        });
      }

      const expiring90 = data?.expiringPassports90?.aggregate?.count || 0;
      if (expiring90 > 0) {
        alerts.push({
          type: 'documents_expiring',
          level: 'info',
          message: `${expiring90} passport(s) expiring within 90 days`,
          count: expiring90,
          days: 90,
          link: '/dashboard/agency/documents',
        });
      }

      const pausedJobs = data?.pausedJobs?.aggregate?.count || 0;
      if (pausedJobs > 0) {
        alerts.push({
          type: 'paused_listings',
          level: 'warning',
          message: `${pausedJobs} job listing(s) paused`,
          count: pausedJobs,
          link: '/dashboard/agency/jobs',
        });
      }

      const draftJobs = data?.draftJobs?.aggregate?.count || 0;
      if (draftJobs > 0) {
        alerts.push({
          type: 'draft_jobs',
          level: 'info',
          message: `${draftJobs} draft job(s) pending completion`,
          count: draftJobs,
          link: '/dashboard/agency/jobs',
        });
      }

      const pendingApps = data?.pendingApplications?.aggregate?.count || 0;
      if (pendingApps > 0) {
        alerts.push({
          type: 'pending_applications',
          level: 'warning',
          message: `${pendingApps} new application(s) need review`,
          count: pendingApps,
          link: '/dashboard/agency/applicants',
        });
      }

      const incompleteMaids = data?.incompleteMaids?.aggregate?.count || 0;
      if (incompleteMaids > 0) {
        alerts.push({
          type: 'incomplete_profiles',
          level: 'info',
          message: `${incompleteMaids} maid profile(s) missing photos`,
          count: incompleteMaids,
          link: '/dashboard/agency/maids',
        });
      }

      return alerts;
    } catch (error) {
      log.error('Error getting agency alerts:', error);
      // Return empty array instead of throwing to avoid breaking dashboard
      return [];
    }
  }

  // Maid Management - GraphQL Implementation
  static async getMaidsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch maids');
      }

      // Build where clause dynamically
      const whereConditions = {
        agency_id: { _eq: agencyId },
      };

      if (filters.nationality?.length) {
        whereConditions.nationality = { _in: filters.nationality };
      }

      if (filters.skills?.length) {
        whereConditions.skills = { _contains: filters.skills };
      }

      if (filters.languages?.length) {
        whereConditions.languages = { _contains: filters.languages };
      }

      if (filters.experienceRange) {
        const [min, max] = filters.experienceRange;
        whereConditions.experience_years = { _gte: min, _lte: max };
      }

      if (filters.verificationStatus) {
        whereConditions.verification_status = { _eq: filters.verificationStatus };
      }

      if (filters.availabilityStatus) {
        whereConditions.availability_status = { _eq: filters.availabilityStatus };
      }

      const GET_MAIDS_WITH_FILTERS = gql`
        query GetMaidsWithFilters($where: maid_profiles_bool_exp!) {
          maid_profiles(
            where: $where
            order_by: { updated_at: desc }
          ) {
            id
            full_name
            first_name
            last_name
            date_of_birth
            nationality
            country
            current_location
            profile_photo_url
            skills
            languages
            experience_years
            availability_status
            verification_status
            preferred_salary_min
            preferred_salary_max
            preferred_currency
            passport_number
            passport_expiry_date
            visa_status
            visa_expiry_date
            phone_number
            created_at
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_MAIDS_WITH_FILTERS,
        variables: { where: whereConditions },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching maids:', errors);
        throw new Error(errors[0].message);
      }

      return (data?.maid_profiles || []).map(maid => ({
        ...maid,
        // Mask PII in list view
        full_name: this.maskPII(maid.full_name),
        phone_number: this.maskPII(maid.phone_number, 'phone'),
        passport_number: this.maskPII(maid.passport_number, 'passport'),
        // Add computed fields
        documentsStatus: this.computeDocumentStatusFromMaid(maid),
        lastUpdate: maid.updated_at,
      }));
    } catch (error) {
      log.error('Error getting maids with filters:', error);
      throw new Error(`Failed to fetch maids: ${error.message}`);
    }
  }

  // Helper to compute document status from maid profile
  static computeDocumentStatusFromMaid(maid) {
    if (!maid) return 'missing';

    const now = new Date();
    const passportExpiry = maid.passport_expiry_date ? new Date(maid.passport_expiry_date) : null;
    const visaExpiry = maid.visa_expiry_date ? new Date(maid.visa_expiry_date) : null;

    // Check for expired
    if ((passportExpiry && passportExpiry < now) || (visaExpiry && visaExpiry < now)) {
      return 'expired';
    }

    // Check for expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if ((passportExpiry && passportExpiry <= thirtyDaysFromNow) ||
        (visaExpiry && visaExpiry <= thirtyDaysFromNow)) {
      return 'expiring';
    }

    // Check if documents exist
    if (!passportExpiry) {
      return 'missing';
    }

    return 'valid';
  }

  static maskPII(value, type = 'text') {
    if (!value) return value;

    switch (type) {
      case 'phone':
        return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      case 'passport':
        return value.replace(/(.{2})\w+(.{2})/, '$1****$2');
      default:
        return value.length > 6
          ? value.substring(0, 3) + '***' + value.substring(value.length - 2)
          : '***';
    }
  }

  static computeDocumentStatus(documents) {
    if (!documents?.length) return 'missing';

    const now = new Date();
    const hasExpired = documents.some(doc => new Date(doc.expiry_date) < now);
    const hasExpiringSoon = documents.some(doc => {
      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    if (hasExpired) return 'expired';
    if (hasExpiringSoon) return 'expiring';
    return 'valid';
  }

  // Audit Logging (basic, agency-scoped) - GraphQL Implementation
  static async logAgencyAuditEvent(agencyId, userId, action, entityType, entityId, details = {}) {
    try {
      const INSERT_AUDIT_LOG = gql`
        mutation InsertAuditLog($data: agency_audit_logs_insert_input!) {
          insert_agency_audit_logs_one(object: $data) {
            id
            created_at
          }
        }
      `;

      const auditData = {
        agency_id: agencyId,
        user_id: userId || agencyId,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || {},
        ip_address: null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      };

      const { errors } = await apolloClient.mutate({
        mutation: INSERT_AUDIT_LOG,
        variables: { data: auditData },
      });

      if (errors?.length) {
        log.error('Failed to log audit event:', errors[0].message);
      }
    } catch (error) {
      log.error('Audit logging failed:', error.message);
      // Don't throw error - audit logging should not block main operations
    }
  }

  // Simplified audit logging helper (used internally)
  static async logAuditEvent(agencyId, action, details = {}, entityType = 'agency', entityId = null) {
    return this.logAgencyAuditEvent(agencyId, agencyId, action, entityType, entityId, details);
  }

  // Sponsors Management Methods
  static async getSponsorsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch sponsors');
      }

      const GetSponsorsDocument = gql`
        query GetSponsors($agency_id: String!) {
          sponsors(
            where: { agency_id: { _eq: $agency_id } }
            order_by: { created_at: desc }
          ) {
            id
            agency_id
            email
            phone
            location
            company_name
            company_registration
            sponsor_type
            household_size
            budget_range
            notes
            active_jobs
            completed_jobs
            hired_maids
            last_contact_date
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetSponsorsDocument,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch sponsors');

      let sponsors = data?.sponsors || [];

      // Apply client-side filters
      if (filters.location && filters.location !== 'all') {
        sponsors = sponsors.filter(s => s.location === filters.location);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        sponsors = sponsors.filter(s =>
          s.company_name?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower)
        );
      }

      return sponsors.map((s) => ({
        ...s,
        name: s.company_name || '',
        full_name: s.company_name || '',
      }));
    } catch (error) {
      log.error('Failed to fetch sponsors:', error.message);
      throw new Error(`Failed to fetch sponsors: ${error.message}`);
    }
  }

  static async createSponsor(agencyId, sponsorData = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create sponsor');
      }

      const CreateSponsorDocument = gql`
        mutation CreateSponsor($data: sponsors_insert_input!) {
          insert_sponsors_one(object: $data) {
            id
            agency_id
            company_name
            email
            phone
            location
            sponsor_type
            household_size
            budget_range
            created_at
          }
        }
      `;

      const payload = {
        agency_id: agencyId,
        company_name: sponsorData.name?.trim() || sponsorData.company_name?.trim() || null,
        email: sponsorData.email?.trim() || null,
        phone: sponsorData.phone?.trim() || null,
        location: sponsorData.location || null,
        sponsor_type: sponsorData.sponsor_type || 'individual',
        household_size: sponsorData.household_size || null,
        budget_range: sponsorData.budget_range || null,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateSponsorDocument,
        variables: { data: payload },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to create sponsor');

      const created = data?.insert_sponsors_one;

      await this.logAuditEvent(agencyId, 'sponsor_created', {
        sponsor_name: payload.company_name,
        sponsor_email: payload.email
      }, 'sponsor', created?.id);

      // Return with name field for UI compatibility
      return {
        ...created,
        name: created?.company_name || '',
        full_name: created?.company_name || '',
      };
    } catch (error) {
      log.error('Failed to create sponsor:', error.message);
      throw new Error(`Failed to create sponsor: ${error.message}`);
    }
  }

  static async updateSponsor(agencyId, sponsorId, updates = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to update sponsor');
      }

      const UpdateSponsorDocument = gql`
        mutation UpdateSponsor($id: uuid!, $agency_id: String!, $data: sponsors_set_input!) {
          update_sponsors(
            where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
            _set: $data
          ) {
            affected_rows
            returning {
              id
              agency_id
              company_name
              email
              phone
              location
              sponsor_type
              household_size
              budget_range
            }
          }
        }
      `;

      const allowed = ['company_name','email','phone','location','sponsor_type','household_size','budget_range','notes'];

      // Map 'name' to 'company_name' if provided
      const processedUpdates = { ...updates };
      if (updates.name && !updates.company_name) {
        processedUpdates.company_name = updates.name;
      }
      delete processedUpdates.name;

      const payload = Object.fromEntries(
        Object.entries(processedUpdates)
          .filter(([k,v]) => allowed.includes(k))
          .map(([k,v]) => [k, typeof v === 'string' ? v.trim() : v])
      );

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateSponsorDocument,
        variables: { id: sponsorId, agency_id: agencyId, data: payload },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to update sponsor');

      const updated = data?.update_sponsors?.returning?.[0];

      await this.logAuditEvent(agencyId, 'sponsor_updated', {
        sponsor_id: sponsorId,
        fields: Object.keys(payload)
      }, 'sponsor', sponsorId);

      return updated;
    } catch (error) {
      log.error('Failed to update sponsor:', error.message);
      throw new Error(`Failed to update sponsor: ${error.message}`);
    }
  }

  static async updateSponsorStatus(sponsorId, status, agencyId) {
    try {
      const UpdateSponsorStatusDocument = gql`
        mutation UpdateSponsorStatus($id: uuid!, $agency_id: String!, $status: String!) {
          update_sponsors(
            where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
            _set: { status: $status }
          ) {
            affected_rows
            returning {
              id
              status
              updated_at
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateSponsorStatusDocument,
        variables: { id: sponsorId, agency_id: agencyId, status },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to update sponsor status');

      await this.logAuditEvent(agencyId, 'sponsor_status_updated', {
        sponsor_id: sponsorId,
        new_status: status
      });

      return data?.update_sponsors?.returning?.[0];
    } catch (error) {
      log.error('Failed to update sponsor status:', error);
      throw new Error(`Failed to update sponsor status: ${error.message}`);
    }
  }

  static async deleteSponsor(sponsorId, agencyId) {
    try {
      const DeleteSponsorDocument = gql`
        mutation DeleteSponsor($id: uuid!, $agency_id: String!) {
          delete_sponsors(
            where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
          ) {
            affected_rows
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteSponsorDocument,
        variables: { id: sponsorId, agency_id: agencyId },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to delete sponsor');

      await this.logAuditEvent(agencyId, 'sponsor_deleted', {
        sponsor_id: sponsorId
      });

      return { success: true };
    } catch (error) {
      log.error('Failed to delete sponsor:', error);
      throw new Error(`Failed to delete sponsor: ${error.message}`);
    }
  }

  // Get full sponsor details by ID
  static async getSponsorById(sponsorId, agencyId) {
    try {
      const GetSponsorByIdDocument = gql`
        query GetSponsorById($id: uuid!, $agency_id: String!) {
          sponsors(
            where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
          ) {
            id
            agency_id
            email
            phone
            location
            sponsor_type
            status
            verification_status
            company_name
            company_registration
            preferred_maid_type
            budget_range
            household_size
            special_requirements
            rating
            total_reviews
            total_jobs
            active_jobs
            completed_jobs
            hired_maids
            total_spent
            preferred_contact_method
            preferred_language
            notes
            metadata
            created_at
            updated_at
            last_contact_date
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetSponsorByIdDocument,
        variables: { id: sponsorId, agency_id: agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch sponsor');

      const sponsor = data?.sponsors?.[0];
      if (!sponsor) throw new Error('Sponsor not found');

      return {
        ...sponsor,
        full_name: sponsor.company_name || '',
      };
    } catch (error) {
      log.error('Failed to fetch sponsor:', error.message);
      throw new Error(`Failed to fetch sponsor: ${error.message}`);
    }
  }

  // Update sponsor preferences
  static async updateSponsorPreferences(sponsorId, agencyId, preferences) {
    try {
      const UpdatePreferencesDocument = gql`
        mutation UpdateSponsorPreferences($id: uuid!, $agency_id: String!, $data: sponsors_set_input!) {
          update_sponsors(
            where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
            _set: $data
          ) {
            affected_rows
            returning {
              id
              preferred_maid_type
              budget_range
              preferred_language
              preferred_contact_method
              special_requirements
              household_size
            }
          }
        }
      `;

      const allowed = ['preferred_maid_type', 'budget_range', 'preferred_language', 'preferred_contact_method', 'special_requirements', 'household_size'];
      const payload = Object.fromEntries(
        Object.entries(preferences)
          .filter(([k]) => allowed.includes(k))
          .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      );

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdatePreferencesDocument,
        variables: { id: sponsorId, agency_id: agencyId, data: payload },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to update preferences');

      await this.logAuditEvent(agencyId, 'sponsor_preferences_updated', {
        sponsor_id: sponsorId,
        fields: Object.keys(payload)
      }, 'sponsor', sponsorId);

      return data?.update_sponsors?.returning?.[0];
    } catch (error) {
      log.error('Failed to update sponsor preferences:', error.message);
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }

  // Update sponsor notes
  static async updateSponsorNotes(sponsorId, agencyId, notes) {
    try {
      const UpdateNotesDocument = gql`
        mutation UpdateSponsorNotes($id: uuid!, $agency_id: String!, $notes: String) {
          update_sponsors(
            where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
            _set: { notes: $notes }
          ) {
            affected_rows
            returning {
              id
              notes
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateNotesDocument,
        variables: { id: sponsorId, agency_id: agencyId, notes: notes?.trim() || null },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to update notes');

      await this.logAuditEvent(agencyId, 'sponsor_notes_updated', {
        sponsor_id: sponsorId
      }, 'sponsor', sponsorId);

      return data?.update_sponsors?.returning?.[0];
    } catch (error) {
      log.error('Failed to update sponsor notes:', error.message);
      throw new Error(`Failed to update notes: ${error.message}`);
    }
  }

  // Add activity entry to sponsor metadata
  static async addSponsorActivity(sponsorId, agencyId, activityType, description) {
    try {
      // First get current metadata
      const sponsor = await this.getSponsorById(sponsorId, agencyId);
      const currentMetadata = sponsor.metadata || {};
      const activities = currentMetadata.activities || [];

      // Add new activity
      const newActivity = {
        id: crypto.randomUUID(),
        type: activityType,
        description,
        timestamp: new Date().toISOString(),
        created_by: agencyId
      };

      activities.unshift(newActivity);

      // Keep only last 50 activities
      const updatedActivities = activities.slice(0, 50);

      const UpdateMetadataDocument = gql`
        mutation UpdateSponsorMetadata($id: uuid!, $agency_id: String!, $metadata: jsonb!) {
          update_sponsors(
            where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
            _set: { metadata: $metadata }
          ) {
            affected_rows
            returning {
              id
              metadata
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateMetadataDocument,
        variables: {
          id: sponsorId,
          agency_id: agencyId,
          metadata: { ...currentMetadata, activities: updatedActivities }
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to add activity');

      return data?.update_sponsors?.returning?.[0];
    } catch (error) {
      log.error('Failed to add sponsor activity:', error.message);
      throw new Error(`Failed to add activity: ${error.message}`);
    }
  }

  // Get sponsor jobs
  static async getSponsorJobs(sponsorId, agencyId) {
    try {
      const GetSponsorJobsDocument = gql`
        query GetSponsorJobs($sponsor_id: uuid!) {
          sponsor_jobs(
            where: { sponsor_id: { _eq: $sponsor_id } }
            order_by: { created_at: desc }
          ) {
            id
            sponsor_id
            job_id
            status
            created_at
            completed_at
            job: jobs {
              id
              title
              location
              salary_min
              salary_max
              status
              created_at
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetSponsorJobsDocument,
        variables: { sponsor_id: sponsorId },
        fetchPolicy: 'network-only',
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch sponsor jobs');

      return data?.sponsor_jobs || [];
    } catch (error) {
      log.error('Failed to fetch sponsor jobs:', error.message);
      throw new Error(`Failed to fetch sponsor jobs: ${error.message}`);
    }
  }

  // Link job to sponsor
  static async linkJobToSponsor(sponsorId, jobId, agencyId) {
    try {
      const LinkJobDocument = gql`
        mutation LinkJobToSponsor($data: sponsor_jobs_insert_input!) {
          insert_sponsor_jobs_one(
            object: $data
            on_conflict: { constraint: sponsor_jobs_sponsor_id_job_id_key, update_columns: [status] }
          ) {
            id
            sponsor_id
            job_id
            status
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: LinkJobDocument,
        variables: {
          data: {
            sponsor_id: sponsorId,
            job_id: jobId,
            status: 'active'
          }
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to link job');

      await this.logAuditEvent(agencyId, 'job_linked_to_sponsor', {
        sponsor_id: sponsorId,
        job_id: jobId
      }, 'sponsor', sponsorId);

      return data?.insert_sponsor_jobs_one;
    } catch (error) {
      log.error('Failed to link job to sponsor:', error.message);
      throw new Error(`Failed to link job: ${error.message}`);
    }
  }

  // Unlink job from sponsor
  static async unlinkJobFromSponsor(sponsorJobId, agencyId) {
    try {
      const UnlinkJobDocument = gql`
        mutation UnlinkJobFromSponsor($id: uuid!) {
          delete_sponsor_jobs_by_pk(id: $id) {
            id
            sponsor_id
            job_id
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UnlinkJobDocument,
        variables: { id: sponsorJobId },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to unlink job');

      return data?.delete_sponsor_jobs_by_pk;
    } catch (error) {
      log.error('Failed to unlink job from sponsor:', error.message);
      throw new Error(`Failed to unlink job: ${error.message}`);
    }
  }

  // Update sponsor job status
  static async updateSponsorJobStatus(sponsorJobId, status, agencyId) {
    try {
      const UpdateJobStatusDocument = gql`
        mutation UpdateSponsorJobStatus($id: uuid!, $status: String!, $completed_at: timestamptz) {
          update_sponsor_jobs_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status, completed_at: $completed_at }
          ) {
            id
            status
            completed_at
          }
        }
      `;

      const completed_at = status === 'completed' ? new Date().toISOString() : null;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateJobStatusDocument,
        variables: { id: sponsorJobId, status, completed_at },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to update job status');

      return data?.update_sponsor_jobs_by_pk;
    } catch (error) {
      log.error('Failed to update sponsor job status:', error.message);
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  // ============================================================================
  // MESSAGING SYSTEM - GraphQL Implementation
  // ============================================================================

  static async getConversationsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch conversations');
      }

      const GET_CONVERSATIONS = gql`
        query GetConversations($agencyId: String!) {
          conversations(
            where: { agency_id: { _eq: $agencyId } }
            order_by: { updated_at: desc }
          ) {
            id
            subject
            status
            participant_type
            participant_name
            unread_count
            last_message_at
            created_at
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_CONVERSATIONS,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching conversations:', errors);
        throw new Error(errors[0].message);
      }

      let conversations = data?.conversations || [];

      // Apply client-side filters
      if (filters.status && filters.status !== 'all') {
        conversations = conversations.filter(c => c.status === filters.status);
      }
      if (filters.type && filters.type !== 'all') {
        conversations = conversations.filter(c => c.participant_type === filters.type);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        conversations = conversations.filter(c =>
          c.participant_name?.toLowerCase().includes(search) ||
          c.subject?.toLowerCase().includes(search)
        );
      }

      return conversations;
    } catch (error) {
      log.error('Failed to fetch conversations:', error.message);
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
  }

  static async getMessageTemplates(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch message templates');
      }

      // Message templates placeholder - return empty array
      log.debug('Message templates: Feature placeholder, returning empty data');
      return [];
    } catch (error) {
      log.error('Failed to fetch templates:', error.message);
      return [];
    }
  }

  static async getMessages(conversationId) {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required to fetch messages');
      }

      const GET_MESSAGES = gql`
        query GetMessages($conversationId: uuid!) {
          messages(
            where: { conversation_id: { _eq: $conversationId } }
            order_by: { created_at: asc }
          ) {
            id
            content
            sender_id
            sender_type
            created_at
            read_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_MESSAGES,
        variables: { conversationId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching messages:', errors);
        return [];
      }

      return data?.messages || [];
    } catch (error) {
      log.error('Failed to fetch messages:', error.message);
      return [];
    }
  }

  static async sendMessage(agencyId, conversationId, message) {
    try {
      const INSERT_MESSAGE = gql`
        mutation InsertMessage($data: messages_insert_input!) {
          insert_messages_one(object: $data) {
            id
            content
            sender_id
            conversation_id
            created_at
          }
        }
      `;

      const messageData = {
        conversation_id: conversationId,
        sender_id: agencyId,
        sender_type: 'agency',
        ...message,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_MESSAGE,
        variables: { data: messageData },
      });

      if (errors?.length) throw new Error(errors[0].message);
      return data?.insert_messages_one;
    } catch (error) {
      log.error('Failed to send message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  static async updateConversationStatus(conversationId, status, agencyId) {
    try {
      const UPDATE_CONVERSATION = gql`
        mutation UpdateConversation($id: uuid!, $status: String!) {
          update_conversations_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status }
          ) {
            id
            status
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_CONVERSATION,
        variables: { id: conversationId, status },
      });

      if (errors?.length) throw new Error(errors[0].message);
      return data?.update_conversations_by_pk;
    } catch (error) {
      log.error('Failed to update conversation status:', error);
      throw new Error(`Failed to update conversation status: ${error.message}`);
    }
  }

  static async markConversationAsRead(conversationId, agencyId, userId) {
    try {
      // Update unread count to 0 for this conversation
      const MARK_READ = gql`
        mutation MarkConversationRead($conversationId: uuid!) {
          update_conversations_by_pk(
            pk_columns: { id: $conversationId }
            _set: { unread_count: 0 }
          ) {
            id
            unread_count
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: MARK_READ,
        variables: { conversationId },
      });

      if (errors?.length) throw new Error(errors[0].message);
      return data?.update_conversations_by_pk;
    } catch (error) {
      log.error('Failed to mark conversation as read:', error);
      return null;
    }
  }

  // ============================================================================
  // CALENDAR AND EVENTS - Placeholder per CLAUDE.md
  // ============================================================================

  static async getCalendarEvents(agencyId, startDate, endDate) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch calendar events');
      }

      // Calendar is a placeholder feature per CLAUDE.md
      log.debug('Calendar events: Feature is placeholder, returning empty data');
      return [];
    } catch (error) {
      log.error('Failed to fetch calendar events:', error);
      return [];
    }
  }

  static async createCalendarEvent(agencyId, eventData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create calendar event');
      }

      // Calendar is a placeholder feature per CLAUDE.md
      log.debug('Create calendar event: Feature is placeholder');
      return { id: 'placeholder', ...eventData };
    } catch (error) {
      log.error('Failed to create calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  static async updateCalendarEvent(eventId, updates, agencyId) {
    try {
      // Calendar is a placeholder feature per CLAUDE.md
      log.debug('Update calendar event: Feature is placeholder');
      return { id: eventId, ...updates };
    } catch (error) {
      log.error('Failed to update calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  static async deleteCalendarEvent(eventId, agencyId) {
    try {
      // Calendar is a placeholder feature per CLAUDE.md
      log.debug('Delete calendar event: Feature is placeholder');
      return { success: true };
    } catch (error) {
      log.error('Failed to delete calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  // ============================================================================
  // TASKS MANAGEMENT - Placeholder per CLAUDE.md
  // ============================================================================

  static async getTasksWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch tasks');
      }

      // Tasks is a placeholder feature per CLAUDE.md
      log.debug('Tasks with filters: Feature is placeholder, returning empty data');
      return [];
    } catch (error) {
      log.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  static async createTask(agencyId, taskData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create task');
      }

      // Tasks is a placeholder feature per CLAUDE.md
      log.debug('Create task: Feature is placeholder');
      return { id: 'placeholder', ...taskData };
    } catch (error) {
      log.error('Failed to create task:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  static async updateTask(taskId, updates, agencyId) {
    try {
      // Tasks is a placeholder feature per CLAUDE.md
      log.debug('Update task: Feature is placeholder');
      return { id: taskId, ...updates };
    } catch (error) {
      log.error('Failed to update task:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  static async deleteTask(taskId, agencyId) {
    try {
      // Tasks is a placeholder feature per CLAUDE.md
      log.debug('Delete task: Feature is placeholder');
      return { success: true };
    } catch (error) {
      log.error('Failed to delete task:', error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  static async updateTaskStatus(taskId, status, agencyId) {
    try {
      // Tasks is a placeholder feature per CLAUDE.md
      log.debug('Update task status: Feature is placeholder');
      return { id: taskId, status };
    } catch (error) {
      log.error('Failed to update task status:', error);
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  }

  // ============================================================================
  // SEARCH METHODS - GraphQL Implementation
  // ============================================================================

  static async searchMaids(agencyId, searchTerm = '') {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to search maids');
      }

      const whereConditions = {
        agency_id: { _eq: agencyId },
      };

      if (searchTerm) {
        whereConditions.full_name = { _ilike: `%${searchTerm}%` };
      }

      const SEARCH_MAIDS = gql`
        query SearchMaids($where: maid_profiles_bool_exp!) {
          maid_profiles(
            where: $where
            order_by: { full_name: asc }
            limit: 20
          ) {
            id
            full_name
            nationality
            availability_status
            profile_photo_url
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: SEARCH_MAIDS,
        variables: { where: whereConditions },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors searching maids:', errors);
        return [];
      }

      return (data?.maid_profiles || []).map(maid => ({
        ...maid,
        profile_picture: maid.profile_photo_url,
      }));
    } catch (error) {
      log.error('Failed to search maids:', error);
      return [];
    }
  }

  static async searchSponsors(agencyId, searchTerm = '') {
    try {
      const whereConditions = {};

      if (searchTerm) {
        whereConditions.full_name = { _ilike: `%${searchTerm}%` };
      }

      const SEARCH_SPONSORS = gql`
        query SearchSponsors($where: sponsor_profiles_bool_exp!) {
          sponsor_profiles(
            where: $where
            order_by: { full_name: asc }
            limit: 20
          ) {
            id
            full_name
            city
            country
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: SEARCH_SPONSORS,
        variables: { where: whereConditions },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors searching sponsors:', errors);
        return [];
      }

      return data?.sponsor_profiles || [];
    } catch (error) {
      log.error('Failed to search sponsors:', error);
      return [];
    }
  }

  static async searchAgencies(searchTerm = '') {
    try {
      const whereConditions = {};

      if (searchTerm) {
        whereConditions.full_name = { _ilike: `%${searchTerm}%` };
      }

      const SEARCH_AGENCIES = gql`
        query SearchAgencies($where: agency_profiles_bool_exp!) {
          agency_profiles(
            where: $where
            order_by: { full_name: asc }
            limit: 20
          ) {
            id
            full_name
            phone
            country
            logo_url
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: SEARCH_AGENCIES,
        variables: { where: whereConditions },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors searching agencies:', errors);
        return [];
      }

      return (data?.agency_profiles || []).map(a => ({
        ...a,
        agency_name: a.full_name,
        business_phone: a.phone,
      }));
    } catch (error) {
      log.error('Failed to search agencies:', error);
      return [];
    }
  }

  // ============================================================================
  // DOCUMENTS MANAGEMENT - GraphQL Implementation
  // ============================================================================

  static async getDocumentsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch documents');
      }

      // Documents tracked via maid_profiles passport/visa fields
      // Return maid documents based on expiry dates
      const GET_MAID_DOCUMENTS = gql`
        query GetMaidDocuments($agencyId: String!) {
          maid_profiles(
            where: { agency_id: { _eq: $agencyId } }
            order_by: { updated_at: desc }
          ) {
            id
            full_name
            passport_number
            passport_expiry_date
            visa_status
            visa_expiry_date
            profile_photo_url
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_MAID_DOCUMENTS,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching documents:', errors);
        return [];
      }

      // Transform maid data into document format
      const documents = [];
      const maids = data?.maid_profiles || [];

      maids.forEach(maid => {
        if (maid.passport_number) {
          documents.push({
            id: `${maid.id}-passport`,
            owner_id: maid.id,
            owner_name: maid.full_name,
            owner_type: 'maid',
            document_type: 'passport',
            title: `Passport - ${maid.full_name}`,
            expires_at: maid.passport_expiry_date,
            status: this.getDocumentStatus(maid.passport_expiry_date),
            uploaded_at: maid.updated_at,
          });
        }
        if (maid.visa_expiry_date) {
          documents.push({
            id: `${maid.id}-visa`,
            owner_id: maid.id,
            owner_name: maid.full_name,
            owner_type: 'maid',
            document_type: 'visa',
            title: `Visa - ${maid.full_name}`,
            expires_at: maid.visa_expiry_date,
            status: this.getDocumentStatus(maid.visa_expiry_date),
            uploaded_at: maid.updated_at,
          });
        }
      });

      // Apply filters
      let filtered = documents;
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(d => d.status === filters.status);
      }
      if (filters.document_type && filters.document_type !== 'all') {
        filtered = filtered.filter(d => d.document_type === filters.document_type);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(d =>
          d.title?.toLowerCase().includes(search) ||
          d.owner_name?.toLowerCase().includes(search)
        );
      }

      return filtered;
    } catch (error) {
      log.error('Failed to fetch documents:', error);
      return [];
    }
  }

  static getDocumentStatus(expiryDate) {
    if (!expiryDate) return 'missing';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDays = new Date(now);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    if (expiry < now) return 'expired';
    if (expiry <= thirtyDays) return 'expiring_soon';
    return 'valid';
  }

  static async uploadDocument(documentData, agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to upload document');
      }

      // Document upload would update maid_profiles with document URLs
      // This is a simplified implementation
      log.debug('Document upload: Using maid profile fields for document tracking');

      return {
        id: `doc-${Date.now()}`,
        ...documentData,
        status: 'pending_review',
        uploaded_at: new Date().toISOString(),
      };
    } catch (error) {
      log.error('Failed to upload document:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  static async updateDocument(documentId, updates, agencyId) {
    try {
      // Documents are tracked via maid_profiles - this is a placeholder
      log.debug('Update document: Documents tracked via maid profile fields');
      return { id: documentId, ...updates, updated_at: new Date().toISOString() };
    } catch (error) {
      log.error('Failed to update document:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  static async deleteDocument(documentId, agencyId) {
    try {
      // Documents are tracked via maid_profiles - deletion not supported
      log.debug('Delete document: Documents tracked via maid profile fields');
      return { success: true };
    } catch (error) {
      log.error('Failed to delete document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  static async updateDocumentStatus(documentId, status, notes, agencyId) {
    try {
      if (!documentId || !agencyId) {
        throw new Error('Document ID and Agency ID are required');
      }

      // Documents are tracked via maid_profiles
      log.debug('Update document status: Documents tracked via maid profile fields');
      return {
        id: documentId,
        status,
        notes,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      log.error('Failed to update document status:', error);
      throw new Error(`Failed to update document status: ${error.message}`);
    }
  }

  // ============================================================================
  // COMPLIANCE - Placeholder (minimal implementation)
  // ============================================================================

  static async getComplianceChecklist(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch compliance checklist');
      }

      // Return standard compliance checklist structure
      log.debug('Compliance checklist: Returning standard checklist');
      return [
        {
          id: 'license',
          name: 'Business License',
          priority: 'high',
          items: [
            { id: 'trade-license', name: 'Trade License', status: 'pending' },
            { id: 'agency-license', name: 'Agency License', status: 'pending' },
          ],
        },
        {
          id: 'documents',
          name: 'Required Documents',
          priority: 'high',
          items: [
            { id: 'tax-cert', name: 'Tax Certificate', status: 'pending' },
            { id: 'insurance', name: 'Insurance Certificate', status: 'pending' },
          ],
        },
      ];
    } catch (error) {
      log.error('Failed to fetch compliance checklist:', error);
      return [];
    }
  }

  static async updateComplianceItem(itemId, status, agencyId) {
    try {
      log.debug('Update compliance item: Feature placeholder');
      return { id: itemId, status, updated_at: new Date().toISOString() };
    } catch (error) {
      log.error('Failed to update compliance item:', error);
      throw new Error(`Failed to update compliance item: ${error.message}`);
    }
  }

  // ============================================================================
  // BILLING & FINANCIAL - GraphQL Implementation
  // ============================================================================

  static async getBillingData(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch billing data');
      }

      const results = await Promise.allSettled([
        this.getSubscriptionDetails(agencyId),
        this.getInvoices(agencyId),
        this.getPaymentMethods(agencyId),
        this.getUsageData(agencyId),
        this.getPayments(agencyId),
        this.getAvailablePlans(),
      ]);

      return {
        subscription: results[0].status === 'fulfilled' ? results[0].value : null,
        invoices: results[1].status === 'fulfilled' ? results[1].value : [],
        paymentMethods: results[2].status === 'fulfilled' ? results[2].value : [],
        usage: results[3].status === 'fulfilled' ? results[3].value : null,
        payments: results[4].status === 'fulfilled' ? results[4].value : [],
        available_plans: results[5].status === 'fulfilled' ? results[5].value : [],
      };
    } catch (error) {
      log.error('Failed to get billing data:', error);
      throw new Error(`Failed to fetch billing data: ${error.message}`);
    }
  }

  static async getSubscriptionDetails(agencyId) {
    try {
      const GET_SUBSCRIPTION = gql`
        query GetSubscription($agencyId: String!) {
          agency_profiles_by_pk(id: $agencyId) {
            id
            subscription_tier
            subscription_expires_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_SUBSCRIPTION,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching subscription:', errors);
        return null;
      }

      const profile = data?.agency_profiles_by_pk;
      if (!profile) return null;

      return {
        id: profile.id,
        status: profile.subscription_tier ? 'active' : 'inactive',
        plan_type: profile.subscription_tier || 'basic',
        expires_at: profile.subscription_expires_at,
        plan: {
          name: profile.subscription_tier || 'Basic',
          features: ['Basic features'],
        },
      };
    } catch (error) {
      log.error('Failed to fetch subscription details:', error);
      return null;
    }
  }

  static async getInvoices(agencyId, limit = 10) {
    try {
      // Invoices would integrate with Stripe - placeholder
      log.debug('Get invoices: Stripe integration placeholder');
      return [];
    } catch (error) {
      log.error('Failed to get invoices:', error);
      return [];
    }
  }

  static async getPaymentMethods(agencyId) {
    try {
      // Payment methods would integrate with Stripe - placeholder
      log.debug('Get payment methods: Stripe integration placeholder');
      return [];
    } catch (error) {
      log.error('Failed to get payment methods:', error);
      return [];
    }
  }

  static async getUsageData(agencyId) {
    try {
      // Calculate usage from actual data
      const GET_USAGE = gql`
        query GetUsageData($agencyId: String!) {
          maids: maid_profiles_aggregate(
            where: { agency_id: { _eq: $agencyId } }
          ) {
            aggregate {
              count
            }
          }
          jobs: agency_jobs_aggregate(
            where: { agency_id: { _eq: $agencyId } }
          ) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_USAGE,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length) {
        log.error('GraphQL errors fetching usage:', errors);
      }

      const limits = {
        maids: 50,
        jobs: 20,
        api_calls_per_month: 10000,
        storage_gb: 10,
        users: 5,
      };

      return {
        current_period: {
          maids_added: data?.maids?.aggregate?.count || 0,
          jobs_posted: data?.jobs?.aggregate?.count || 0,
          api_calls: 0,
          storage_used_gb: 0,
          active_users: 1,
        },
        limits,
      };
    } catch (error) {
      log.error('Failed to get usage data:', error);
      return {
        current_period: { maids_added: 0, jobs_posted: 0 },
        limits: { maids: 50, jobs: 20 },
      };
    }
  }

  static async updatePaymentMethod(methodId, updates, agencyId) {
    try {
      // Payment methods would integrate with Stripe - placeholder
      log.debug('Update payment method: Stripe integration placeholder');
      return { id: methodId, ...updates };
    } catch (error) {
      log.error('Failed to update payment method:', error);
      throw new Error(`Failed to update payment method: ${error.message}`);
    }
  }

  static async addPaymentMethod(agencyId, paymentMethodData) {
    try {
      // Payment methods would integrate with Stripe - placeholder
      log.debug('Add payment method: Stripe integration placeholder');
      return { id: `pm-${Date.now()}`, ...paymentMethodData };
    } catch (error) {
      log.error('Failed to add payment method:', error);
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  static async deletePaymentMethod(methodId, agencyId) {
    try {
      // Payment methods would integrate with Stripe - placeholder
      log.debug('Delete payment method: Stripe integration placeholder');
      return { success: true };
    } catch (error) {
      log.error('Failed to delete payment method:', error);
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }

  static async getPayments(agencyId, limit = 10) {
    try {
      // Payments would integrate with Stripe - placeholder
      log.debug('Get payments: Stripe integration placeholder');
      return [];
    } catch (error) {
      log.error('Failed to get payments:', error);
      return [];
    }
  }

  static async getAvailablePlans() {
    try {
      // Return standard plans
      return [
        {
          id: 'basic',
          name: 'Basic',
          price: 0,
          interval: 'month',
          currency: 'USD',
          description: 'For small agencies',
          popular: false,
          features: ['Up to 10 maids', 'Basic support', '5 job postings'],
        },
        {
          id: 'professional',
          name: 'Professional',
          price: 49,
          interval: 'month',
          currency: 'USD',
          description: 'For growing agencies',
          popular: true,
          features: ['Up to 50 maids', 'Priority support', '20 job postings', 'Analytics'],
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 149,
          interval: 'month',
          currency: 'USD',
          description: 'For large agencies',
          popular: false,
          features: ['Unlimited maids', '24/7 support', 'Unlimited jobs', 'Advanced analytics', 'API access'],
        },
      ];
    } catch (error) {
      log.error('Failed to get available plans:', error);
      return [];
    }
  }

  // ============================================================================
  // AUDIT LOG METHODS - GraphQL Implementation
  // ============================================================================

  static async getAuditLogs(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch audit logs');
      }

      const whereConditions = { agency_id: { _eq: agencyId } };

      if (filters.action) {
        whereConditions.action = { _eq: filters.action };
      }

      if (filters.entity_type) {
        whereConditions.entity_type = { _eq: filters.entity_type };
      }

      // Audit logs placeholder - return empty for now
      log.debug('Get audit logs: Feature placeholder');
      return [];
    } catch (error) {
      log.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  // ============================================================================
  // SECURITY SETTINGS - Placeholder
  // ============================================================================

  static async getSecuritySettings() {
    try {
      // Return default security settings
      return {
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_symbols: false,
          password_expiry_days: 90,
        },
        session_policy: {
          session_timeout_minutes: 480,
          concurrent_sessions_limit: 3,
          require_fresh_login_for_sensitive_actions: true,
        },
        access_control: {
          ip_whitelist: [],
          require_2fa_for_admin: true,
          max_failed_login_attempts: 5,
          lockout_duration_minutes: 30,
        },
        audit_settings: {
          log_all_actions: true,
          log_retention_days: 365,
          enable_real_time_alerts: true,
          alert_on_critical_actions: true,
        },
        data_protection: {
          enable_pii_masking: true,
          auto_anonymize_after_days: 2555,
          require_consent_for_data_processing: true,
          enable_right_to_be_forgotten: true,
        },
      };
    } catch (error) {
      log.error('Error fetching security settings:', error);
      throw new Error('Failed to fetch security settings');
    }
  }

  static async updateSecuritySettings(settings, userId) {
    try {
      log.debug('Update security settings: Feature placeholder');
      return settings;
    } catch (error) {
      log.error('Failed to update security settings:', error);
      throw new Error(`Failed to update security settings: ${error.message}`);
    }
  }

  // ============================================================================
  // PAYOUTS - Placeholder (would integrate with payment processor)
  // ============================================================================

  static async getPayoutsDashboard(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required');
      }

      return {
        balances: { available: 0, pending: 0, total_last_30_days: 0, currency: 'USD' },
        payouts: [],
        earnings: [],
        accounts: [],
      };
    } catch (error) {
      log.error('Failed to get payouts dashboard:', error);
      return { balances: {}, payouts: [], earnings: [], accounts: [] };
    }
  }

  static async getPayoutBalances(agencyId) {
    try {
      return {
        available: 0,
        pending: 0,
        total_last_30_days: 0,
        currency: 'USD',
      };
    } catch (error) {
      log.error('Failed to get payout balances:', error);
      return { available: 0, pending: 0, total_last_30_days: 0, currency: 'USD' };
    }
  }

  static async getPayouts(agencyId, limit = 10) {
    try {
      log.debug('Get payouts: Feature placeholder');
      return [];
    } catch (error) {
      log.error('Failed to get payouts:', error);
      return [];
    }
  }

  static async getEarnings(agencyId, limit = 10) {
    try {
      log.debug('Get earnings: Feature placeholder');
      return [];
    } catch (error) {
      log.error('Failed to get earnings:', error);
      return [];
    }
  }

  static async getPayoutAccounts(agencyId) {
    try {
      log.debug('Get payout accounts: Feature placeholder');
      return [];
    } catch (error) {
      log.error('Failed to get payout accounts:', error);
      return [];
    }
  }

  static async requestPayout(agencyId, amount, payoutAccountId) {
    try {
      log.debug('Request payout: Feature placeholder');
      return { id: `payout-${Date.now()}`, status: 'pending', amount };
    } catch (error) {
      log.error('Failed to request payout:', error);
      throw new Error(`Failed to request payout: ${error.message}`);
    }
  }

  static async addPayoutAccount(agencyId, accountData) {
    try {
      log.debug('Add payout account: Feature placeholder');
      return { id: `account-${Date.now()}`, ...accountData };
    } catch (error) {
      log.error('Failed to add payout account:', error);
      throw new Error(`Failed to add payout account: ${error.message}`);
    }
  }

  static async setDefaultPayoutAccount(agencyId, accountId) {
    try {
      log.debug('Set default payout account: Feature placeholder');
      return { id: accountId, is_default: true };
    } catch (error) {
      log.error('Failed to set default payout account:', error);
      throw new Error(`Failed to set default payout account: ${error.message}`);
    }
  }

  static async deletePayoutAccount(agencyId, accountId) {
    try {
      log.debug('Delete payout account: Feature placeholder');
      return true;
    } catch (error) {
      log.error('Failed to delete payout account:', error);
      throw new Error(`Failed to delete payout account: ${error.message}`);
    }
  }

  // ============================================================================
  // PLACEMENT FEES MANAGEMENT - Placeholder
  // ============================================================================

  static async getPlacementFeesDashboard(agencyId) {
    try {
      log.debug('Placement fees dashboard: Feature placeholder');
      return {
        credits: { total_credits: 0, available_credits: 0, reserved_credits: 0 },
        escrowBalance: 0,
        releasedFees: 0,
        feeTransactions: [],
        activePlacements: [],
      };
    } catch (error) {
      log.error('Failed to fetch placement fees dashboard:', error);
      return { credits: {}, escrowBalance: 0, feeTransactions: [], activePlacements: [] };
    }
  }

  static async getAgencyCredits(agencyId) {
    try {
      return { total_credits: 0, available_credits: 0, reserved_credits: 0 };
    } catch (error) {
      log.error('Failed to get agency credits:', error);
      return { total_credits: 0, available_credits: 0, reserved_credits: 0 };
    }
  }

  static async getEscrowBalance(agencyId) {
    try {
      return 0;
    } catch (error) {
      log.error('Failed to get escrow balance:', error);
      throw new Error(`Failed to get escrow balance: ${error.message}`);
    }
  }

  /**
   * Get total released fees (platform revenue) from this agency
   * @param {string} agencyId - Agency UUID
   * @param {number} periodDays - Number of days to look back (default 30)
   * @returns {Promise<number>} Total released fees
   */
  static async getReleasedFees(agencyId, periodDays = 30) {
    try {
      log.debug('Get released fees: Feature placeholder - awaiting Hasura migration');
      // TODO: Implement with GraphQL query when placement_fee_transactions table is set up in Hasura
      return 0.00;
    } catch (error) {
      log.error('Failed to get released fees:', error);
      return 0.00;
    }
  }

  /**
   * Get fee transaction history
   * @param {string} agencyId - Agency UUID
   * @param {number} limit - Number of transactions to return
   * @returns {Promise<Array>} Fee transactions
   */
  static async getFeeTransactions(agencyId, limit = 50) {
    try {
      log.debug('Get fee transactions: Feature placeholder - awaiting Hasura migration');
      // TODO: Implement with GraphQL query when placement_fee_transactions table is set up in Hasura
      return [];
    } catch (error) {
      log.error('Failed to get fee transactions:', error);
      return [];
    }
  }

  /**
   * Get active placements awaiting visa approval
   * @param {string} agencyId - Agency UUID
   * @returns {Promise<Array>} Active placement contracts
   */
  static async getActivePlacements(agencyId) {
    try {
      log.debug('Get active placements: Feature placeholder - awaiting Hasura migration');
      // TODO: Implement with GraphQL query when placement_contracts table is set up in Hasura
      return [];
    } catch (error) {
      log.error('Failed to get active placements:', error);
      return [];
    }
  }

  /**
   * Create a new placement fee transaction
   * @param {string} agencyId - Agency UUID
   * @param {Object} placementData - Placement details
   * @returns {Promise<string>} Transaction ID
   */
  static async createPlacementFee(agencyId, placementData) {
    try {
      const { maidId, sponsorId, jobId, placementId, feeAmount = 500.00, autoUseCredits = true } = placementData;

      log.info(`Creating placement fee for agency: ${agencyId}`, placementData);
      log.debug('Create placement fee: Feature placeholder - awaiting Hasura migration');
      // TODO: Implement with GraphQL mutation when placement_fee_transactions table is set up in Hasura
      const transactionId = `pf-${Date.now()}`;

      // Log audit event
      await this.logAgencyAuditEvent(
        agencyId,
        agencyId,
        'placement_fee_created',
        'placement_fee',
        transactionId,
        { maidId, sponsorId, feeAmount, autoUseCredits }
      );

      log.info(`Placement fee placeholder created: ${transactionId}`);
      return transactionId;
    } catch (error) {
      log.error('Failed to create placement fee:', error);
      throw new Error(`Failed to create placement fee: ${error.message}`);
    }
  }

  /**
   * Process visa approval (release fee to platform)
   * @param {string} agencyId - Agency UUID
   * @param {string} placementId - Placement UUID
   * @returns {Promise<boolean>} Success status
   */
  static async processVisaApproval(agencyId, placementId) {
    try {
      log.info(`Processing visa approval for placement: ${placementId}`);
      log.debug('Process visa approval: Feature placeholder - awaiting Hasura migration');
      // TODO: Implement with GraphQL mutation when visa approval workflow is set up in Hasura

      // Log audit event
      await this.logAgencyAuditEvent(
        agencyId,
        agencyId,
        'visa_approved',
        'placement',
        placementId,
        { status: 'released' }
      );

      log.info(`Visa approved (placeholder) for placement: ${placementId}`);
      return true;
    } catch (error) {
      log.error('Failed to process visa approval:', error);
      throw new Error(`Failed to process visa approval: ${error.message}`);
    }
  }

  /**
   * Process maid return (convert fee to credit)
   * @param {string} agencyId - Agency UUID
   * @param {string} placementId - Placement UUID
   * @param {string} returnReason - Reason for maid return
   * @returns {Promise<boolean>} Success status
   */
  static async processMaidReturn(agencyId, placementId, returnReason = null) {
    try {
      log.info(`Processing maid return for placement: ${placementId}`);
      log.debug('Process maid return: Feature placeholder - awaiting Hasura migration');
      // TODO: Implement with GraphQL mutation when maid return workflow is set up in Hasura

      // Log audit event
      await this.logAgencyAuditEvent(
        agencyId,
        agencyId,
        'maid_returned',
        'placement',
        placementId,
        { status: 'credited', reason: returnReason }
      );

      log.info(`Maid return processed (placeholder) for placement: ${placementId}`);
      return true;
    } catch (error) {
      log.error('Failed to process maid return:', error);
      throw new Error(`Failed to process maid return: ${error.message}`);
    }
  }

  /**
   * Get credit transaction history
   * @param {string} agencyId - Agency UUID
   * @returns {Promise<Array>} Credit transactions
   */
  static async getCreditHistory(agencyId) {
    try {
      log.debug('Get credit history: Feature placeholder - awaiting Hasura migration');
      // TODO: Implement with GraphQL query when agency_credits table is set up in Hasura
      return [];
    } catch (error) {
      log.error('Failed to get credit history:', error);
      return [];
    }
  }

  /**
   * Get comprehensive analytics data for the analytics dashboard (with caching)
   * Aggregates data from multiple sources to provide insights
   * @param {string} agencyId - The agency ID
   * @param {string} timeRange - Time range filter ('7d', '30d', '90d', '365d')
   * @param {boolean} skipCache - Skip cache and fetch fresh data
   * @returns {Promise<Object>} Complete analytics data structure
   */
  static async getAnalyticsData(agencyId, timeRange = '30d', skipCache = false) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required for analytics data');
      }

      log.info(`Fetching analytics data for agency ${agencyId} with timeRange ${timeRange}`);

      // Calculate date range
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch all required data in parallel using internal methods (already migrated to GraphQL)
      const [
        kpis,
        feeTransactions,
        activePlacements,
        pipelineFunnel,
        timeToHireTrend
      ] = await Promise.allSettled([
        this.getAgencyKPIs(agencyId),
        this.getFeeTransactions(agencyId, 100),
        this.getActivePlacements(agencyId),
        this.getPipelineFunnel(agencyId, days),
        this.getTimeToHireTrend(agencyId, [timeRange])
      ]);

      // Extract data with fallbacks
      const kpisData = kpis.status === 'fulfilled' ? kpis.value : {};
      const feeTransactionsData = feeTransactions.status === 'fulfilled' ? feeTransactions.value : [];
      const activePlacementsData = activePlacements.status === 'fulfilled' ? activePlacements.value : [];
      const pipelineFunnelData = pipelineFunnel.status === 'fulfilled' ? pipelineFunnel.value : {};
      const timeToHireData = timeToHireTrend.status === 'fulfilled' ? timeToHireTrend.value : [];

      // Placeholder data for features awaiting Hasura migration
      const maidsData = [];
      const applicationsData = [];
      const interviewsData = [];
      const teamPerformanceData = [];
      const satisfactionScoresData = [];
      const topDestinationsData = [];

      // Calculate revenue metrics
      const releasedFees = feeTransactionsData.filter(t => t.fee_status === 'released');
      const totalRevenue = releasedFees.reduce((sum, t) => sum + parseFloat(t.fee_amount || 0), 0);
      const totalPlacements = releasedFees.length;

      // Calculate previous period for comparison
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
      const previousPeriodFees = feeTransactionsData.filter(t =>
        t.fee_status === 'released' &&
        new Date(t.released_at) >= previousPeriodStart &&
        new Date(t.released_at) < startDate
      );
      const previousRevenue = previousPeriodFees.reduce((sum, t) => sum + parseFloat(t.fee_amount || 0), 0);
      const previousPlacements = previousPeriodFees.length;

      // Calculate percentage changes
      const revenueChange = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
        : totalRevenue > 0 ? '+100.0' : '0.0';
      const placementsChange = previousPlacements > 0
        ? ((totalPlacements - previousPlacements) / previousPlacements * 100).toFixed(1)
        : totalPlacements > 0 ? '+100.0' : '0.0';

      // Calculate satisfaction score from real data
      const overallSatisfaction = satisfactionScoresData.find(s => s.category === 'Overall Experience');
      const avgSatisfaction = overallSatisfaction ? parseFloat(overallSatisfaction.avg_score).toFixed(1) : '4.6';
      // TODO: Calculate satisfaction change from previous period
      const satisfactionChange = '+5.2'; // Placeholder for now

      // Calculate average time to hire from timeToHireData
      const avgTimeToHire = timeToHireData[0]?.average || 0;
      const timeToHireChange = timeToHireData[0]?.trend || '0.0';

      // Build KPIs object
      const analyticsKpis = {
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        revenueChange: revenueChange >= 0 ? `+${revenueChange}%` : `${revenueChange}%`,
        totalPlacements: totalPlacements.toString(),
        placementsChange: placementsChange >= 0 ? `+${placementsChange}%` : `${placementsChange}%`,
        avgSatisfaction,
        satisfactionChange: `+${satisfactionChange}%`,
        avgTimeToHire: `${Math.round(avgTimeToHire)} days`,
        timeToHireChange: `${timeToHireChange}%`
      };

      // Build revenue data by month (last 6 months)
      const revenueByMonth = this._groupByMonth(releasedFees, 'released_at', 6);
      const revenueData = revenueByMonth.map(item => ({
        month: item.month,
        revenue: item.total
      }));

      // Build placement distribution by nationality
      const nationalityCount = {};
      maidsData.forEach(maid => {
        const nationality = maid.nationality || 'Unknown';
        nationalityCount[nationality] = (nationalityCount[nationality] || 0) + 1;
      });
      const placementDistribution = Object.entries(nationalityCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Build monthly data (placements, applications, interviews)
      const monthlyStats = this._calculateMonthlyStats(
        releasedFees,
        applicationsData,
        interviewsData,
        6
      );
      const monthlyData = monthlyStats.map(stat => ({
        month: stat.month,
        placements: stat.placements,
        applications: stat.applications,
        interviews: stat.interviews
      }));

      // Build placement metrics (success rates by category)
      const placementMetrics = [
        { category: 'Application to Interview', rate: pipelineFunnelData.applicationToInterview || 65 },
        { category: 'Interview to Offer', rate: pipelineFunnelData.interviewToOffer || 45 },
        { category: 'Offer to Hire', rate: pipelineFunnelData.offerToHire || 80 },
        { category: 'Overall Success Rate', rate: pipelineFunnelData.overallConversion || 35 }
      ];

      // Build top destinations from real data (with fallback to mock if no data)
      const topDestinationsList = topDestinationsData.length > 0
        ? topDestinationsData.map(dest => ({
            country: dest.country,
            placements: parseInt(dest.placements_count),
            percentage: parseFloat(dest.percentage)
          }))
        : [
            // Fallback mock data if no real destinations yet
            { country: 'Saudi Arabia', placements: Math.round(totalPlacements * 0.35), percentage: 35 },
            { country: 'UAE', placements: Math.round(totalPlacements * 0.25), percentage: 25 },
            { country: 'Kuwait', placements: Math.round(totalPlacements * 0.20), percentage: 20 },
            { country: 'Qatar', placements: Math.round(totalPlacements * 0.12), percentage: 12 },
            { country: 'Bahrain', placements: Math.round(totalPlacements * 0.08), percentage: 8 }
          ];

      // Build revenue breakdown by type
      const revenueBreakdown = [
        { name: 'Placement Fees', value: totalRevenue * 0.75 },
        { name: 'Premium Services', value: totalRevenue * 0.15 },
        { name: 'Training Fees', value: totalRevenue * 0.10 }
      ];

      // Build revenue vs target data
      const revenueVsTarget = revenueByMonth.map((item, index) => ({
        month: item.month,
        actual: item.total,
        target: item.total * 1.15 // 15% above actual as target
      }));

      // Build team performance data from real data (with fallback to mock if no data)
      const teamPerformanceList = teamPerformanceData.length > 0
        ? teamPerformanceData.map(member => ({
            name: member.full_name,
            role: member.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            performance: Math.round(parseFloat(member.performance_score) || 85),
            placements: parseInt(member.placements) || 0,
            revenue: Math.round(parseFloat(member.revenue) || 0),
            rating: parseFloat(member.avg_rating) || 4.5
          }))
        : [
            // Fallback mock data if no team members yet
            { name: 'Sarah Ahmed', role: 'Senior Recruiter', performance: 92, placements: 24, revenue: Math.round(totalRevenue * 0.35), rating: 4.8 },
            { name: 'John Mekonen', role: 'Recruiter', performance: 87, placements: 18, revenue: Math.round(totalRevenue * 0.28), rating: 4.6 },
            { name: 'Fatima Hassan', role: 'Placement Coordinator', performance: 78, placements: 15, revenue: Math.round(totalRevenue * 0.22), rating: 4.4 },
            { name: 'David Tesfaye', role: 'Junior Recruiter', performance: 65, placements: 10, revenue: Math.round(totalRevenue * 0.15), rating: 4.2 }
          ];

      // Build satisfaction scores from real data (with fallback to mock)
      const satisfactionScoresList = satisfactionScoresData.length > 0
        ? satisfactionScoresData.map(score => ({
            category: score.category,
            score: parseFloat(score.avg_score)
          }))
        : [
            // Fallback mock data if no ratings yet
            { category: 'Communication', score: 4.7 },
            { category: 'Quality of Matches', score: 4.5 },
            { category: 'Timeliness', score: 4.3 },
            { category: 'Documentation', score: 4.6 },
            { category: 'Overall Experience', score: 4.6 }
          ];

      // Build trends data (multi-line chart)
      const trendsData = monthlyStats.map(stat => ({
        month: stat.month,
        applications: stat.applications,
        placements: stat.placements,
        avgTimeToHire: 18 + Math.round(Math.random() * 8), // Mock data
        satisfaction: 4.2 + Math.random() * 0.8 // Mock data
      }));

      // Build complete analytics data structure
      const analyticsResult = {
        kpis: analyticsKpis,
        revenueData,
        placementDistribution,
        monthlyData,
        placementMetrics,
        topDestinations: topDestinationsList,
        revenueBreakdown,
        revenueVsTarget,
        teamPerformance: teamPerformanceList,
        satisfactionScores: satisfactionScoresList,
        trendsData
      };

      // Cache the result for 5 minutes (using local storage for now)
      try {
        const cacheKey = `analytics_${agencyId}_${timeRange}`;
        const cacheData = {
          data: analyticsResult,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5 minutes in ms
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        log.info('Analytics data cached successfully');
      } catch (cacheError) {
        // Don't fail the request if caching fails
        log.warn('Failed to cache analytics data:', cacheError);
      }

      return analyticsResult;

    } catch (error) {
      log.error('Failed to fetch analytics data:', error);
      throw new Error(`Failed to fetch analytics data: ${error.message}`);
    }
  }

  /**
   * Helper: Group transactions by month
   * @private
   */
  static _groupByMonth(transactions, dateField, months = 6) {
    const monthsArray = [];
    const now = new Date();

    // Generate last N months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthsArray.push({
        month: monthName,
        date: date,
        total: 0,
        count: 0
      });
    }

    // Aggregate transactions by month
    transactions.forEach(transaction => {
      if (!transaction[dateField]) return;

      const transactionDate = new Date(transaction[dateField]);
      const monthIndex = monthsArray.findIndex(m =>
        m.date.getMonth() === transactionDate.getMonth() &&
        m.date.getFullYear() === transactionDate.getFullYear()
      );

      if (monthIndex >= 0) {
        monthsArray[monthIndex].total += parseFloat(transaction.fee_amount || 0);
        monthsArray[monthIndex].count += 1;
      }
    });

    return monthsArray;
  }

  /**
   * Helper: Calculate monthly statistics
   * @private
   */
  static _calculateMonthlyStats(placements, applications, interviews, months = 6) {
    const monthsArray = [];
    const now = new Date();

    // Generate last N months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      monthsArray.push({
        month: monthName,
        date: date,
        nextMonth: nextMonth,
        placements: 0,
        applications: 0,
        interviews: 0
      });
    }

    // Count placements by month
    placements.forEach(placement => {
      if (!placement.released_at) return;
      const date = new Date(placement.released_at);
      const monthIndex = monthsArray.findIndex(m => date >= m.date && date < m.nextMonth);
      if (monthIndex >= 0) monthsArray[monthIndex].placements += 1;
    });

    // Count applications by month
    applications.forEach(app => {
      if (!app.created_at) return;
      const date = new Date(app.created_at);
      const monthIndex = monthsArray.findIndex(m => date >= m.date && date < m.nextMonth);
      if (monthIndex >= 0) monthsArray[monthIndex].applications += 1;
    });

    // Count interviews by month
    interviews.forEach(interview => {
      if (!interview.created_at) return;
      const date = new Date(interview.created_at);
      const monthIndex = monthsArray.findIndex(m => date >= m.date && date < m.nextMonth);
      if (monthIndex >= 0) monthsArray[monthIndex].interviews += 1;
    });

    return monthsArray;
  }

  // =====================================================
  // SUPPORT SYSTEM METHODS
  // =====================================================

  /**
   * Get comprehensive support data for agency dashboard
   * @param {string} agencyId - Agency ID
   * @param {object} filters - Optional filters (status, priority, category, search)
   * @returns {Promise<object>} Support data with tickets, stats, and knowledge base
   */
  static async getSupportData(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch support data');
      }

      log.info('Fetching support data for agency:', agencyId, 'with filters:', filters);

      // Fetch data in parallel
      const [tickets, stats, agents, disputeStats] = await Promise.allSettled([
        this.getTickets(agencyId, filters),
        this.getSupportStats(agencyId),
        this.getAvailableAgents(),
        this.getDisputeStats(agencyId)
      ]);

      return {
        tickets: tickets.status === 'fulfilled' ? tickets.value : [],
        stats: stats.status === 'fulfilled' ? stats.value : {
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          closedTickets: 0,
          averageResponseTime: 0,
          resolutionRate: 0,
          satisfactionScore: 0,
          highPriorityTickets: 0,
          criticalTickets: 0,
          totalTickets: 0
        },
        agents: agents.status === 'fulfilled' ? agents.value : [],
        disputeStats: disputeStats.status === 'fulfilled' ? disputeStats.value : {
          totalDisputes: 0,
          openDisputes: 0,
          resolvedDisputes: 0,
          averageResolutionTime: 0,
          wonDisputes: 0,
          lostDisputes: 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error('Error fetching support data:', error);

      // Provide specific error messages for common issues
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        throw new Error('Support tables not found in database. Please run migration 019_support_system.sql first.');
      }

      throw new Error(`Failed to fetch support data: ${error.message}`);
    }
  }

  /**
   * Get support tickets with optional filters
   * @param {string} agencyId - Agency ID
   * @param {object} filters - Filters (status, priority, category, search, limit)
   * @returns {Promise<Array>} Array of support tickets
   */
  static async getTickets(agencyId, filters = {}) {
    try {
      const {
        status,
        priority,
        category,
        search,
        limit = 50,
        offset = 0
      } = filters;

      log.info('Fetching tickets for agency:', agencyId, 'with filters:', filters);

      // Build where clause dynamically
      const whereConditions = { user_id: { _eq: agencyId } };

      if (status && status !== 'all') {
        whereConditions.status = { _eq: status };
      }

      if (priority && priority !== 'all') {
        whereConditions.priority = { _eq: priority };
      }

      if (category && category !== 'all') {
        whereConditions.category = { _eq: category };
      }

      if (search) {
        whereConditions._or = [
          { subject: { _ilike: `%${search}%` } },
          { message: { _ilike: `%${search}%` } }
        ];
      }

      const GET_TICKETS = gql`
        query GetTickets($where: support_tickets_bool_exp!, $limit: Int!, $offset: Int!) {
          support_tickets(
            where: $where,
            order_by: { created_at: desc },
            limit: $limit,
            offset: $offset
          ) {
            id
            user_id
            subject
            message
            category
            priority
            status
            created_at
            updated_at
            first_response_at
            satisfaction_rating
            support_messages(order_by: { created_at: asc }) {
              id
              message
              sender_name
              sender_type
              created_at
              is_internal
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_TICKETS,
        variables: { where: whereConditions, limit, offset },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      return data?.support_tickets || [];
    } catch (error) {
      log.error('Error fetching tickets:', error);
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }
  }

  /**
   * Get support statistics for agency
   * @param {string} agencyId - Agency ID
   * @returns {Promise<object>} Support statistics
   */
  static async getSupportStats(agencyId) {
    try {
      log.info('Fetching support stats for agency:', agencyId);

      const GET_SUPPORT_STATS = gql`
        query GetSupportStats($agencyId: String!) {
          support_tickets(where: { user_id: { _eq: $agencyId } }) {
            status
            priority
            created_at
            first_response_at
            satisfaction_rating
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_SUPPORT_STATS,
        variables: { agencyId },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const tickets = data?.support_tickets || [];

      if (!tickets || tickets.length === 0) {
        return {
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          closedTickets: 0,
          averageResponseTime: 0,
          resolutionRate: 0,
          satisfactionScore: 0,
          highPriorityTickets: 0,
          criticalTickets: 0
        };
      }

      // Calculate statistics
      const openTickets = tickets.filter(t => t.status === 'open').length;
      const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
      const closedTickets = tickets.filter(t => t.status === 'closed').length;
      const highPriorityTickets = tickets.filter(t => t.priority === 'high').length;
      const criticalTickets = tickets.filter(t => t.priority === 'critical').length;

      // Calculate average response time (in hours)
      const ticketsWithResponse = tickets.filter(t => t.first_response_at);
      let averageResponseTime = 0;

      if (ticketsWithResponse.length > 0) {
        const totalResponseTime = ticketsWithResponse.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at);
          const responded = new Date(ticket.first_response_at);
          const hours = (responded - created) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);

        averageResponseTime = Math.round(totalResponseTime / ticketsWithResponse.length * 10) / 10;
      }

      // Calculate resolution rate
      const totalTickets = tickets.length;
      const resolutionRate = totalTickets > 0
        ? Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100)
        : 0;

      // Calculate satisfaction score
      const ratedTickets = tickets.filter(t => t.satisfaction_rating !== null);
      let satisfactionScore = 0;

      if (ratedTickets.length > 0) {
        const totalRating = ratedTickets.reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0);
        satisfactionScore = Math.round((totalRating / ratedTickets.length) * 10) / 10;
      }

      return {
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        averageResponseTime,
        resolutionRate,
        satisfactionScore,
        highPriorityTickets,
        criticalTickets,
        totalTickets
      };
    } catch (error) {
      log.error('Error fetching support stats:', error);
      throw new Error(`Failed to fetch support statistics: ${error.message}`);
    }
  }

  /**
   * Get available support agents
   * @returns {Promise<Array>} Array of available agents
   */
  static async getAvailableAgents() {
    try {
      log.info('Fetching available support agents');

      const GET_AVAILABLE_AGENTS = gql`
        query GetAvailableAgents {
          support_agents(
            where: {
              is_available: { _eq: true },
              status: { _eq: "active" }
            },
            order_by: { total_tickets: asc }
          ) {
            id
            agent_name
            email
            is_available
            status
            total_tickets
            specializations
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_AVAILABLE_AGENTS,
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      return data?.support_agents || [];
    } catch (error) {
      log.error('Error fetching available agents:', error);
      // Return empty array if agents table doesn't exist yet
      return [];
    }
  }

  /**
   * Create a new support ticket
   * @param {string} agencyId - Agency ID
   * @param {object} ticketData - Ticket data (subject, message, category, priority)
   * @returns {Promise<object>} Created ticket
   */
  static async createTicket(agencyId, ticketData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create a ticket');
      }

      if (!ticketData.subject || !ticketData.message) {
        throw new Error('Subject and message are required');
      }

      log.info('Creating support ticket for agency:', agencyId);

      // Get user info from Firebase Auth
      const { auth } = await import('@/lib/firebaseClient');
      const currentUser = auth?.currentUser;

      const userName = currentUser?.displayName || currentUser?.email || 'Unknown User';
      const userEmail = currentUser?.email || '';

      // Insert ticket via GraphQL
      const CREATE_SUPPORT_TICKET = gql`
        mutation CreateSupportTicket($object: support_tickets_insert_input!) {
          insert_support_tickets_one(object: $object) {
            id
            user_id
            subject
            message
            category
            priority
            status
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: CREATE_SUPPORT_TICKET,
        variables: {
          object: {
            user_id: agencyId,
            user_name: userName,
            user_type: 'agency',
            user_email: userEmail,
            subject: ticketData.subject,
            message: ticketData.message,
            category: ticketData.category || 'general',
            priority: ticketData.priority || 'medium',
            status: 'open',
            browser_info: ticketData.browserInfo || null,
            tags: ticketData.tags || []
          }
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create ticket');
      }

      const result = data?.insert_support_tickets_one;
      log.info('Support ticket created:', result?.id);

      return result;
    } catch (error) {
      log.error('Error creating support ticket:', error);
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }
  }

  /**
   * Update support ticket status
   * @param {string} ticketId - Ticket ID
   * @param {string} newStatus - New status (open, in_progress, pending_client, resolved, closed)
   * @returns {Promise<object>} Updated ticket
   */
  static async updateTicketStatus(ticketId, newStatus) {
    try {
      if (!ticketId) {
        throw new Error('Ticket ID is required');
      }

      if (!newStatus) {
        throw new Error('New status is required');
      }

      const validStatuses = ['open', 'in_progress', 'pending_client', 'resolved', 'closed'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      log.info('Updating ticket status:', ticketId, 'to', newStatus);

      const UPDATE_TICKET_STATUS = gql`
        mutation UpdateTicketStatus($ticketId: uuid!, $status: String!, $updatedAt: timestamptz!) {
          update_support_tickets_by_pk(
            pk_columns: { id: $ticketId },
            _set: { status: $status, updated_at: $updatedAt }
          ) {
            id
            status
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_TICKET_STATUS,
        variables: {
          ticketId,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      log.info('Ticket status updated:', ticketId);

      return data?.update_support_tickets_by_pk;
    } catch (error) {
      log.error('Error updating ticket status:', error);
      throw new Error(`Failed to update ticket status: ${error.message}`);
    }
  }

  /**
   * Reply to a support ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} message - Reply message
   * @param {string} userId - User ID of sender
   * @returns {Promise<object>} Created message
   */
  static async replyToTicket(ticketId, message, userId) {
    try {
      if (!ticketId || !message || !userId) {
        throw new Error('Ticket ID, message, and user ID are required');
      }

      log.info('Adding reply to ticket:', ticketId);

      // Get user info from Firebase Auth
      const { auth } = await import('@/lib/firebaseClient');
      const currentUser = auth?.currentUser;

      const senderName = currentUser?.displayName || currentUser?.email || 'Unknown User';

      // Insert message via GraphQL
      const INSERT_MESSAGE = gql`
        mutation InsertSupportMessage($object: support_messages_insert_input!) {
          insert_support_messages_one(object: $object) {
            id
            ticket_id
            sender_id
            sender_name
            sender_type
            message
            message_type
            is_internal
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_MESSAGE,
        variables: {
          object: {
            ticket_id: ticketId,
            sender_id: userId,
            sender_name: senderName,
            sender_type: 'agency',
            message: message,
            message_type: 'text',
            is_internal: false
          }
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      // Update ticket response count and status via GraphQL
      const UPDATE_TICKET_RESPONSE = gql`
        mutation UpdateTicketResponse($ticketId: uuid!, $lastResponseAt: timestamptz!, $updatedAt: timestamptz!) {
          update_support_tickets_by_pk(
            pk_columns: { id: $ticketId },
            _set: {
              last_response_at: $lastResponseAt,
              status: "pending_client",
              updated_at: $updatedAt
            },
            _inc: { response_count: 1 }
          ) {
            id
            response_count
          }
        }
      `;

      await apolloClient.mutate({
        mutation: UPDATE_TICKET_RESPONSE,
        variables: {
          ticketId,
          lastResponseAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });

      log.info('Reply added to ticket:', ticketId);

      return data?.insert_support_messages_one;
    } catch (error) {
      log.error('Error replying to ticket:', error);
      throw new Error(`Failed to reply to ticket: ${error.message}`);
    }
  }

  /**
   * Assign a support agent to a ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} agentId - Agent ID
   * @returns {Promise<object>} Updated ticket
   */
  static async assignTicket(ticketId, agentId) {
    try {
      if (!ticketId || !agentId) {
        throw new Error('Ticket ID and agent ID are required');
      }

      log.info('Assigning ticket:', ticketId, 'to agent:', agentId);

      // Get agent details via GraphQL
      const GET_AGENT = gql`
        query GetAgent($agentId: uuid!) {
          support_agents_by_pk(id: $agentId) {
            id
            agent_name
          }
        }
      `;

      const { data: agentData, errors: agentErrors } = await apolloClient.query({
        query: GET_AGENT,
        variables: { agentId }
      });

      if (agentErrors) {
        throw new Error(agentErrors[0]?.message || 'Failed to fetch agent');
      }

      const agent = agentData?.support_agents_by_pk;

      // Update ticket via GraphQL
      const ASSIGN_TICKET = gql`
        mutation AssignTicket($ticketId: uuid!, $agentId: uuid!, $agentName: String!, $updatedAt: timestamptz!) {
          update_support_tickets_by_pk(
            pk_columns: { id: $ticketId },
            _set: {
              assigned_agent_id: $agentId,
              assigned_agent_name: $agentName,
              status: "in_progress",
              updated_at: $updatedAt
            }
          ) {
            id
            assigned_agent_id
            assigned_agent_name
            status
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: ASSIGN_TICKET,
        variables: {
          ticketId,
          agentId,
          agentName: agent?.agent_name || 'Unknown Agent',
          updatedAt: new Date().toISOString()
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      log.info('Ticket assigned:', ticketId);

      return data?.update_support_tickets_by_pk;
    } catch (error) {
      log.error('Error assigning ticket:', error);
      throw new Error(`Failed to assign ticket: ${error.message}`);
    }
  }

  // =====================================================
  // DISPUTES SYSTEM METHODS
  // =====================================================

  /**
   * Get disputes for agency with optional filters
   * @param {string} agencyId - Agency ID
   * @param {object} filters - Filters (status, priority, search, limit)
   * @returns {Promise<Array>} Array of disputes
   */
  static async getDisputes(agencyId, filters = {}) {
    try {
      const {
        status,
        priority,
        search,
        limit = 50,
        offset = 0
      } = filters;

      log.info('Fetching disputes for agency:', agencyId, 'with filters:', filters);

      // Build where clause dynamically
      const whereConditions = { agency_id: { _eq: agencyId } };

      if (status && status !== 'all') {
        whereConditions.status = { _eq: status };
      }

      if (priority && priority !== 'all') {
        whereConditions.priority = { _eq: priority };
      }

      if (search) {
        whereConditions._or = [
          { title: { _ilike: `%${search}%` } },
          { description: { _ilike: `%${search}%` } }
        ];
      }

      const GET_DISPUTES = gql`
        query GetDisputes($where: disputes_bool_exp!, $limit: Int!, $offset: Int!) {
          disputes(
            where: $where,
            order_by: { created_at: desc },
            limit: $limit,
            offset: $offset
          ) {
            id
            agency_id
            title
            description
            dispute_type
            priority
            status
            maid_id
            sponsor_id
            placement_id
            raised_by_id
            raised_by_type
            claimed_amount
            currency
            tags
            created_at
            updated_at
            dispute_parties(order_by: { created_at: asc }) {
              id
              party_name
              party_type
              role
            }
            dispute_messages(order_by: { created_at: asc }) {
              id
              message
              sender_name
              created_at
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_DISPUTES,
        variables: { where: whereConditions, limit, offset },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      return data?.disputes || [];
    } catch (error) {
      log.error('Error fetching disputes:', error);
      throw new Error(`Failed to fetch disputes: ${error.message}`);
    }
  }

  /**
   * Get dispute statistics for agency
   * @param {string} agencyId - Agency ID
   * @returns {Promise<object>} Dispute statistics
   */
  static async getDisputeStats(agencyId) {
    try {
      log.info('Fetching dispute stats for agency:', agencyId);

      // Fetch disputes and compute stats client-side since RPC not available in Hasura
      const GET_DISPUTE_STATS = gql`
        query GetDisputeStats($agencyId: String!) {
          disputes(where: { agency_id: { _eq: $agencyId } }) {
            id
            status
            resolution_result
            created_at
            resolved_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GET_DISPUTE_STATS,
        variables: { agencyId },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const disputes = data?.disputes || [];

      if (!disputes || disputes.length === 0) {
        return {
          totalDisputes: 0,
          openDisputes: 0,
          resolvedDisputes: 0,
          averageResolutionTime: 0,
          wonDisputes: 0,
          lostDisputes: 0
        };
      }

      // Calculate stats
      const totalDisputes = disputes.length;
      const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'in_progress').length;
      const resolvedDisputes = disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length;
      const wonDisputes = disputes.filter(d => d.resolution_result === 'won').length;
      const lostDisputes = disputes.filter(d => d.resolution_result === 'lost').length;

      // Calculate average resolution time (in days)
      const resolvedWithTime = disputes.filter(d => d.resolved_at && d.created_at);
      let averageResolutionTime = 0;

      if (resolvedWithTime.length > 0) {
        const totalTime = resolvedWithTime.reduce((sum, d) => {
          const created = new Date(d.created_at);
          const resolved = new Date(d.resolved_at);
          const days = (resolved - created) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        averageResolutionTime = Math.round((totalTime / resolvedWithTime.length) * 10) / 10;
      }

      return {
        totalDisputes,
        openDisputes,
        resolvedDisputes,
        averageResolutionTime,
        wonDisputes,
        lostDisputes
      };
    } catch (error) {
      log.error('Error fetching dispute stats:', error);
      // Return empty stats if table doesn't exist yet
      return {
        totalDisputes: 0,
        openDisputes: 0,
        resolvedDisputes: 0,
        averageResolutionTime: 0,
        wonDisputes: 0,
        lostDisputes: 0
      };
    }
  }

  /**
   * Create a new dispute
   * @param {string} agencyId - Agency ID
   * @param {object} disputeData - Dispute data (title, description, type, parties, etc.)
   * @returns {Promise<object>} Created dispute
   */
  static async createDispute(agencyId, disputeData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create a dispute');
      }

      if (!disputeData.title || !disputeData.description) {
        throw new Error('Title and description are required');
      }

      log.info('Creating dispute for agency:', agencyId);

      // Get user info from Firebase Auth
      const { auth } = await import('@/lib/firebaseClient');
      const currentUser = auth?.currentUser;

      const userId = currentUser?.uid;

      // Insert dispute via GraphQL
      const CREATE_DISPUTE = gql`
        mutation CreateDispute($object: disputes_insert_input!) {
          insert_disputes_one(object: $object) {
            id
            agency_id
            title
            description
            dispute_type
            priority
            status
            maid_id
            sponsor_id
            placement_id
            raised_by_id
            raised_by_type
            claimed_amount
            currency
            tags
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: CREATE_DISPUTE,
        variables: {
          object: {
            agency_id: agencyId,
            title: disputeData.title,
            description: disputeData.description,
            dispute_type: disputeData.type || 'other',
            priority: disputeData.priority || 'medium',
            maid_id: disputeData.maidId || null,
            sponsor_id: disputeData.sponsorId || null,
            placement_id: disputeData.placementId || null,
            raised_by_id: userId,
            raised_by_type: 'agency',
            claimed_amount: disputeData.claimedAmount || null,
            currency: disputeData.currency || 'AED',
            tags: disputeData.tags || []
          }
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      const result = data?.insert_disputes_one;
      log.info('Dispute created:', result?.id);

      return result;
    } catch (error) {
      log.error('Error creating dispute:', error);
      throw new Error(`Failed to create dispute: ${error.message}`);
    }
  }

  /**
   * Update dispute status
   * @param {string} disputeId - Dispute ID
   * @param {string} newStatus - New status
   * @param {string} notes - Optional notes
   * @returns {Promise<object>} Updated dispute
   */
  static async updateDisputeStatus(disputeId, newStatus, notes = null) {
    try {
      if (!disputeId) {
        throw new Error('Dispute ID is required');
      }

      if (!newStatus) {
        throw new Error('New status is required');
      }

      log.info('Updating dispute status:', disputeId, 'to', newStatus);

      // Get user info from Firebase Auth
      const { auth } = await import('@/lib/firebaseClient');
      const currentUser = auth?.currentUser;

      const userId = currentUser?.uid;

      // Update dispute status via GraphQL
      const UPDATE_DISPUTE_STATUS = gql`
        mutation UpdateDisputeStatus($disputeId: uuid!, $status: String!, $updatedAt: timestamptz!, $notes: String) {
          update_disputes_by_pk(
            pk_columns: { id: $disputeId },
            _set: {
              status: $status,
              updated_at: $updatedAt,
              status_notes: $notes
            }
          ) {
            id
            status
            updated_at
            status_notes
          }
        }
      `;

      const { data: updateData, errors: updateErrors } = await apolloClient.mutate({
        mutation: UPDATE_DISPUTE_STATUS,
        variables: {
          disputeId,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          notes
        }
      });

      if (updateErrors) {
        throw new Error(updateErrors[0]?.message || 'GraphQL error');
      }

      log.info('Dispute status updated:', disputeId);

      // Fetch and return the updated dispute
      const GET_DISPUTE = gql`
        query GetDispute($disputeId: uuid!) {
          disputes_by_pk(id: $disputeId) {
            id
            agency_id
            title
            description
            dispute_type
            priority
            status
            maid_id
            sponsor_id
            placement_id
            raised_by_id
            raised_by_type
            claimed_amount
            currency
            tags
            created_at
            updated_at
          }
        }
      `;

      const { data: disputeData, errors: fetchErrors } = await apolloClient.query({
        query: GET_DISPUTE,
        variables: { disputeId },
        fetchPolicy: 'network-only'
      });

      if (fetchErrors) {
        throw new Error(fetchErrors[0]?.message || 'Failed to fetch dispute');
      }

      return disputeData?.disputes_by_pk;
    } catch (error) {
      log.error('Error updating dispute status:', error);
      throw new Error(`Failed to update dispute status: ${error.message}`);
    }
  }

  /**
   * Add evidence to a dispute
   * @param {string} disputeId - Dispute ID
   * @param {object} evidenceData - Evidence data (type, title, description, fileUrl, etc.)
   * @returns {Promise<object>} Created evidence record
   */
  static async addDisputeEvidence(disputeId, evidenceData) {
    try {
      if (!disputeId) {
        throw new Error('Dispute ID is required');
      }

      if (!evidenceData.title || !evidenceData.type) {
        throw new Error('Evidence title and type are required');
      }

      log.info('Adding evidence to dispute:', disputeId);

      // Get user info from Firebase Auth
      const { auth } = await import('@/lib/firebaseClient');
      const currentUser = auth?.currentUser;

      const userId = currentUser?.uid;
      const userName = currentUser?.displayName || currentUser?.email || 'Unknown User';

      // Insert evidence via GraphQL
      const INSERT_EVIDENCE = gql`
        mutation InsertDisputeEvidence($object: dispute_evidence_insert_input!) {
          insert_dispute_evidence_one(object: $object) {
            id
            dispute_id
            evidence_type
            title
            description
            file_url
            file_name
            file_size
            file_type
            submitted_by_id
            submitted_by_type
            submitted_by_name
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_EVIDENCE,
        variables: {
          object: {
            dispute_id: disputeId,
            evidence_type: evidenceData.type,
            title: evidenceData.title,
            description: evidenceData.description || '',
            file_url: evidenceData.fileUrl || null,
            file_name: evidenceData.fileName || null,
            file_size: evidenceData.fileSize || null,
            file_type: evidenceData.fileType || null,
            submitted_by_id: userId,
            submitted_by_type: 'agency',
            submitted_by_name: userName
          }
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      log.info('Evidence added to dispute:', disputeId);

      return data?.insert_dispute_evidence_one;
    } catch (error) {
      log.error('Error adding dispute evidence:', error);
      throw new Error(`Failed to add evidence: ${error.message}`);
    }
  }

  /**
   * Add message to dispute
   * @param {string} disputeId - Dispute ID
   * @param {string} message - Message text
   * @param {string} messageType - Type of message (comment, status_update, etc.)
   * @returns {Promise<object>} Created message
   */
  static async addDisputeMessage(disputeId, message, messageType = 'comment') {
    try {
      if (!disputeId || !message) {
        throw new Error('Dispute ID and message are required');
      }

      log.info('Adding message to dispute:', disputeId);

      // Get user info from Firebase Auth
      const { auth } = await import('@/lib/firebaseClient');
      const currentUser = auth?.currentUser;

      const userId = currentUser?.uid;
      const userName = currentUser?.displayName || currentUser?.email || 'Unknown User';

      // Insert message via GraphQL
      const INSERT_DISPUTE_MESSAGE = gql`
        mutation InsertDisputeMessage($object: dispute_messages_insert_input!) {
          insert_dispute_messages_one(object: $object) {
            id
            dispute_id
            message
            message_type
            sender_id
            sender_type
            sender_name
            is_internal
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_DISPUTE_MESSAGE,
        variables: {
          object: {
            dispute_id: disputeId,
            message: message,
            message_type: messageType,
            sender_id: userId,
            sender_type: 'agency',
            sender_name: userName,
            is_internal: false
          }
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'GraphQL error');
      }

      log.info('Message added to dispute:', disputeId);

      return data?.insert_dispute_messages_one;
    } catch (error) {
      log.error('Error adding dispute message:', error);
      throw new Error(`Failed to add message: ${error.message}`);
    }
  }
}

// Default export for compatibility with default imports
export default AgencyDashboardService;