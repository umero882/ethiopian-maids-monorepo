import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { graphqlAgencyService } from '@/services/agencyService.graphql';
import { agencyService } from '@/services/agencyService';
import { createLogger } from '@/utils/logger';

const log = createLogger('useAgencyDashboard');

export const useAgencyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [pipelineFunnel, setPipelineFunnel] = useState({});
  const [timeToHireTrend, setTimeToHireTrend] = useState({});
  const [tasksSLA, setTasksSLA] = useState({});
  const [error, setError] = useState(null);

  const agencyId = user?.id;

  const loadDashboardData = useCallback(async () => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch data from Hasura GraphQL in parallel
      const [
        profileResult,
        maidsResult,
        jobsResult,
        applicationsResult,
        applicationStatsResult,
      ] = await Promise.all([
        agencyService.getAgencyProfile(agencyId),
        graphqlAgencyService.getAgencyMaids(),
        graphqlAgencyService.getAgencyJobs(),
        graphqlAgencyService.getApplications(),
        graphqlAgencyService.getApplicationStats(),
      ]);

      // Calculate KPIs from real data
      const profile = profileResult?.data || {};
      const maids = maidsResult?.data || [];
      const jobs = jobsResult?.data || [];
      const applications = applicationsResult?.data || [];
      const applicationStats = applicationStatsResult?.data || {};

      // Calculate active maids (available status)
      const activeMaids = maids.filter(m =>
        m.availability_status === 'available' ||
        m.availability_status === 'active'
      ).length;

      // Calculate jobs live (active/published status)
      const jobsLive = jobs.filter(j =>
        j.status === 'active' ||
        j.status === 'published' ||
        j.status === 'open'
      ).length;

      // Calculate today's applicants
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newApplicantsToday = applications.filter(a => {
        const createdAt = new Date(a.created_at);
        return createdAt >= today;
      }).length;

      // Calculate interviews scheduled (upcoming)
      const interviewsScheduled = applications.filter(a =>
        a.application_status === 'interviewed' ||
        (a.interview_date && new Date(a.interview_date) >= new Date())
      ).length;

      // Calculate hires this month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const hiresThisMonth = applications.filter(a => {
        if (a.application_status !== 'hired') return false;
        const hiredDate = new Date(a.hired_date || a.updated_at);
        return hiredDate >= firstDayOfMonth;
      }).length;

      // Build KPIs object
      const kpisData = {
        activeMaids,
        totalMaids: maids.length,
        jobsLive,
        totalJobs: jobs.length,
        newApplicantsToday,
        totalApplications: applications.length,
        interviewsScheduled,
        hiresThisMonth,
        successfulPlacements: profile.successful_placements || hiresThisMonth,
        overdueDocuments: 0, // Would need document expiry tracking
        openDisputes: 0, // Would need disputes table
        subscriptionStatus: {
          status: user?.subscription_status || 'active',
          plan_type: user?.subscription_plan || 'Basic',
        },
        // Additional stats from applicationStats
        applicationsByStatus: applicationStats.byStatus || {},
        avgMatchScore: applicationStats.avgMatchScore || 0,
        highPriorityApplications: applicationStats.highPriority || 0,
      };

      setKpis(kpisData);

      // Build pipeline funnel from application stats
      const pipelineData = {
        stages: [
          { name: 'New', count: applicationStats.byStatus?.new || 0, color: '#3B82F6' },
          { name: 'Reviewed', count: applicationStats.byStatus?.reviewed || 0, color: '#8B5CF6' },
          { name: 'Shortlisted', count: applicationStats.byStatus?.shortlisted || 0, color: '#F59E0B' },
          { name: 'Interviewed', count: applicationStats.byStatus?.interviewed || 0, color: '#10B981' },
          { name: 'Offered', count: applicationStats.byStatus?.offered || 0, color: '#6366F1' },
          { name: 'Hired', count: applicationStats.byStatus?.hired || 0, color: '#22C55E' },
        ],
        total: applicationStats.total || 0,
      };
      setPipelineFunnel(pipelineData);

      // Build time to hire trend (mock data for now - would need historical tracking)
      const timeToHireData = {
        periods: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        averageDays: [14, 12, 10, 11],
        target: 10,
      };
      setTimeToHireTrend(timeToHireData);

      // Build tasks/SLA data
      const tasksData = {
        todayTasks: [
          ...(newApplicantsToday > 0 ? [{
            id: 'review-apps',
            title: `Review ${newApplicantsToday} new application${newApplicantsToday > 1 ? 's' : ''}`,
            priority: 'high',
            dueTime: 'Today',
            type: 'application_review',
          }] : []),
          ...(interviewsScheduled > 0 ? [{
            id: 'interviews',
            title: `${interviewsScheduled} interview${interviewsScheduled > 1 ? 's' : ''} scheduled`,
            priority: 'medium',
            dueTime: 'This week',
            type: 'interview',
          }] : []),
        ],
        overdueTasks: [],
        slaMetrics: {
          responseTime: { target: 24, actual: 18, unit: 'hours' },
          placementRate: { target: 80, actual: Math.round((hiresThisMonth / Math.max(applications.length, 1)) * 100), unit: '%' },
        },
      };
      setTasksSLA(tasksData);

      // Build alerts from real data
      const alertsData = [];

      // Alert for unreviewed applications
      const unreviewedApps = applications.filter(a => !a.viewed_by_agency).length;
      if (unreviewedApps > 0) {
        alertsData.push({
          id: 'unreviewed-apps',
          type: 'warning',
          title: 'Unreviewed Applications',
          message: `You have ${unreviewedApps} application${unreviewedApps > 1 ? 's' : ''} waiting for review.`,
          action: '/dashboard/agency/applicants',
          actionText: 'Review Now',
        });
      }

      // Alert for profile completion
      if (!profile.verified) {
        alertsData.push({
          id: 'profile-incomplete',
          type: 'info',
          title: 'Complete Your Profile',
          message: 'Complete your agency profile to unlock all features and get verified.',
          action: '/dashboard/agency/profile',
          actionText: 'Complete Profile',
        });
      }

      // Alert for no active jobs
      if (jobsLive === 0 && maids.length > 0) {
        alertsData.push({
          id: 'no-jobs',
          type: 'info',
          title: 'No Active Jobs',
          message: 'Create job listings to start receiving applications for your maids.',
          action: '/dashboard/agency/jobs/create',
          actionText: 'Create Job',
        });
      }

      setAlerts(alertsData);

    } catch (err) {
      log.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId, user?.subscription_status, user?.subscription_plan]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refreshKPIs = useCallback(async () => {
    if (!agencyId) return;
    await loadDashboardData();
  }, [agencyId, loadDashboardData]);

  const refreshAlerts = useCallback(async () => {
    if (!agencyId) return;
    await loadDashboardData();
  }, [agencyId, loadDashboardData]);

  const logAuditEvent = useCallback(async (action, entityType, entityId, details = {}) => {
    if (!agencyId || !user) return;

    try {
      // Log audit event (could be stored in Hasura if needed)
      log.info('Audit event:', {
        agencyId,
        userId: user.id,
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date(),
      });
    } catch (err) {
      log.error('Error logging audit event:', err);
    }
  }, [agencyId, user]);

  return {
    // Data
    kpis,
    alerts,
    pipelineFunnel,
    timeToHireTrend,
    tasksSLA,

    // State
    loading,
    error,

    // Actions
    refreshData: loadDashboardData,
    refreshKPIs,
    refreshAlerts,
    logAuditEvent
  };
};

export const useMaidsManagement = (filters = {}) => {
  const { user } = useAuth();
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0
  });

  const agencyId = user?.id;

  const loadMaids = useCallback(async (newFilters = filters) => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      // Use GraphQL service to get maids
      const { data: maidsData, error: maidsError } = await graphqlAgencyService.getAgencyMaids(newFilters);

      if (maidsError) {
        throw new Error(maidsError.message);
      }

      setMaids(maidsData || []);
      setPagination(prev => ({
        ...prev,
        total: (maidsData || []).length
      }));

    } catch (err) {
      log.error('Error loading maids:', err);
      setError(err.message);
      setMaids([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId, filters]);

  useEffect(() => {
    loadMaids();
  }, [loadMaids]);

  const publishMaid = useCallback(async (maidId) => {
    try {
      const { error } = await graphqlAgencyService.updateAgencyMaid(maidId, {
        availability_status: 'available',
      });
      if (error) throw new Error(error.message);
      await loadMaids();
    } catch (err) {
      log.error('Error publishing maid:', err);
      throw err;
    }
  }, [loadMaids]);

  const hideMaid = useCallback(async (maidId) => {
    try {
      const { error } = await graphqlAgencyService.updateAgencyMaid(maidId, {
        availability_status: 'unavailable',
      });
      if (error) throw new Error(error.message);
      await loadMaids();
    } catch (err) {
      log.error('Error hiding maid:', err);
      throw err;
    }
  }, [loadMaids]);

  const requestDocuments = useCallback(async (maidId, documentTypes) => {
    // Implementation for requesting documents
    log.info('Requesting documents:', { maidId, documentTypes });
  }, []);

  const scheduleInterview = useCallback(async (maidId, interviewDetails) => {
    // Implementation for scheduling interview
    log.info('Scheduling interview:', { maidId, interviewDetails });
  }, []);

  const addToShortlist = useCallback(async (maidId, shortlistId) => {
    try {
      const { error } = await graphqlAgencyService.addCandidateToShortlist(shortlistId, maidId);
      if (error) throw new Error(error.message);
    } catch (err) {
      log.error('Error adding to shortlist:', err);
      throw err;
    }
  }, []);

  const exportMaids = useCallback(async (selectedMaids = []) => {
    // Implementation for exporting maids data
    log.info('Exporting maids:', { count: selectedMaids.length });
  }, []);

  return {
    // Data
    maids,
    pagination,

    // State
    loading,
    error,

    // Actions
    loadMaids,
    publishMaid,
    hideMaid,
    requestDocuments,
    scheduleInterview,
    addToShortlist,
    exportMaids
  };
};
