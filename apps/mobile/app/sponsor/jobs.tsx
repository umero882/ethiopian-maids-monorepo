/**
 * Sponsor Jobs Page
 *
 * Displays all jobs posted by the sponsor with stats, filtering,
 * and management actions (create, edit, delete, change status).
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { gql, useQuery, useMutation, useLazyQuery } from '@apollo/client';

// GraphQL query to get profile ID by email
const GET_PROFILE_ID = gql`
  query GetProfileId($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      user_type
    }
  }
`;

// GraphQL query to get sponsor's jobs
const GET_SPONSOR_JOBS = gql`
  query GetSponsorJobs($profileId: String!, $limit: Int = 50) {
    jobs(
      where: { sponsor_id: { _eq: $profileId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      title
      description
      job_type
      country
      city
      status
      salary_min
      salary_max
      currency
      applications_count
      views_count
      featured
      urgency_level
      created_at
      updated_at
    }
  }
`;

// GraphQL query for job stats
const GET_JOB_STATS = gql`
  query GetSponsorJobStats($profileId: String!) {
    all_jobs: jobs_aggregate(where: { sponsor_id: { _eq: $profileId } }) {
      aggregate {
        count
        sum {
          applications_count
          views_count
        }
      }
    }
    active_jobs: jobs_aggregate(
      where: { sponsor_id: { _eq: $profileId }, status: { _eq: "active" } }
    ) {
      aggregate {
        count
      }
    }
    draft_jobs: jobs_aggregate(
      where: { sponsor_id: { _eq: $profileId }, status: { _eq: "draft" } }
    ) {
      aggregate {
        count
      }
    }
    filled_jobs: jobs_aggregate(
      where: { sponsor_id: { _eq: $profileId }, status: { _eq: "filled" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Mutations
const CHANGE_JOB_STATUS = gql`
  mutation ChangeJobStatus($id: uuid!, $status: String!) {
    update_jobs_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

const DELETE_JOB = gql`
  mutation DeleteJob($id: uuid!) {
    delete_jobs_by_pk(id: $id) {
      id
    }
  }
`;

interface Job {
  id: string;
  title: string;
  description: string;
  job_type: string;
  country: string;
  city: string;
  status: string;
  salary_min: number;
  salary_max: number | null;
  currency: string;
  applications_count: number;
  views_count: number;
  featured: boolean;
  urgency_level: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  filledJobs: number;
  totalApplications: number;
  totalViews: number;
}

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: '#ECFDF5', text: '#10B981' },
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  paused: { bg: '#FEF3C7', text: '#F59E0B' },
  filled: { bg: '#EFF6FF', text: '#3B82F6' },
  expired: { bg: '#FEE2E2', text: '#EF4444' },
  cancelled: { bg: '#FEE2E2', text: '#EF4444' },
};

// Filter tabs
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'filled', label: 'Filled' },
  { key: 'paused', label: 'Paused' },
];

export default function SponsorJobsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  const { data: profileData, loading: profileLoading } = useQuery(GET_PROFILE_ID, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  // Fetch jobs
  const {
    data: jobsData,
    loading: jobsLoading,
    refetch: refetchJobs,
  } = useQuery(GET_SPONSOR_JOBS, {
    variables: { profileId },
    skip: !profileId,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch stats
  const { data: statsData, refetch: refetchStats } = useQuery(GET_JOB_STATS, {
    variables: { profileId },
    skip: !profileId,
  });

  // Mutations
  const [changeJobStatus] = useMutation(CHANGE_JOB_STATUS);
  const [deleteJob] = useMutation(DELETE_JOB);

  // Calculate stats
  const stats: Stats = {
    totalJobs: statsData?.all_jobs?.aggregate?.count || 0,
    activeJobs: statsData?.active_jobs?.aggregate?.count || 0,
    draftJobs: statsData?.draft_jobs?.aggregate?.count || 0,
    filledJobs: statsData?.filled_jobs?.aggregate?.count || 0,
    totalApplications: statsData?.all_jobs?.aggregate?.sum?.applications_count || 0,
    totalViews: statsData?.all_jobs?.aggregate?.sum?.views_count || 0,
  };

  // Filter jobs
  const jobs: Job[] = jobsData?.jobs || [];
  const filteredJobs = activeFilter === 'all'
    ? jobs
    : jobs.filter((job) => job.status === activeFilter);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchJobs(), refetchStats()]);
    setRefreshing(false);
  }, [refetchJobs, refetchStats]);

  // Handle status change
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await changeJobStatus({
        variables: { id: jobId, status: newStatus },
      });
      Alert.alert('Success', `Job status changed to ${newStatus}`);
      refetchJobs();
      refetchStats();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change status');
    }
  };

  // Handle delete
  const handleDelete = (jobId: string, jobTitle: string) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJob({ variables: { id: jobId } });
              Alert.alert('Success', 'Job deleted successfully');
              refetchJobs();
              refetchStats();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  // Show job actions
  const showJobActions = (job: Job) => {
    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      {
        text: 'View Details',
        onPress: () => router.push(`/sponsor/job/${job.id}`),
      },
      {
        text: 'Edit',
        onPress: () => router.push(`/sponsor/job/${job.id}/edit`),
      },
    ];

    // Status-specific actions
    if (job.status === 'active') {
      actions.push({
        text: 'Pause',
        onPress: () => handleStatusChange(job.id, 'paused'),
      });
      actions.push({
        text: 'Mark as Filled',
        onPress: () => handleStatusChange(job.id, 'filled'),
      });
    } else if (job.status === 'paused') {
      actions.push({
        text: 'Activate',
        onPress: () => handleStatusChange(job.id, 'active'),
      });
    } else if (job.status === 'draft') {
      actions.push({
        text: 'Publish',
        onPress: () => handleStatusChange(job.id, 'active'),
      });
    }

    actions.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => handleDelete(job.id, job.title),
    });

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Job Actions', job.title, actions);
  };

  // Format salary
  const formatSalary = (min: number, max: number | null, currency: string) => {
    if (max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return `${currency} ${min.toLocaleString()}`;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Render job card
  const renderJobCard = ({ item: job }: { item: Job }) => {
    const statusStyle = statusColors[job.status] || statusColors.draft;

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push(`/sponsor/job/${job.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.title}
            </Text>
            {job.featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => showJobActions(job)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.jobMeta}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.locationText}>
              {job.city}, {job.country}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.salaryText}>
          {formatSalary(job.salary_min, job.salary_max, job.currency)}/month
        </Text>

        <View style={styles.jobStats}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.statText}>{job.applications_count} applications</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={14} color="#6B7280" />
            <Text style={styles.statText}>{job.views_count} views</Text>
          </View>
          <Text style={styles.dateText}>{formatRelativeTime(job.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (profileLoading || (jobsLoading && !jobsData)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Jobs',
          headerRight: () => (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/sponsor/job/create')}
            >
              <Ionicons name="add" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.totalJobs}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.activeJobs}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.totalApplications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.totalViews}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                activeFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Jobs List */}
        <FlatList
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Jobs Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? "You haven't posted any jobs yet"
                  : `No ${activeFilter} jobs`}
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/sponsor/job/create')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Post a Job</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    marginRight: 8,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  filterContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  featuredBadge: {
    backgroundColor: '#FEF3C7',
    padding: 4,
    borderRadius: 4,
  },
  moreButton: {
    padding: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  salaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
