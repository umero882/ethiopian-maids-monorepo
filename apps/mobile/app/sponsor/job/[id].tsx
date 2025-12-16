/**
 * Sponsor Job Detail Page
 *
 * Displays complete job details with applications list
 * and management actions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL query to get job details with applications
const GET_JOB_DETAIL = gql`
  query GetJobDetail($id: uuid!) {
    jobs_by_pk(id: $id) {
      id
      title
      description
      job_type
      country
      city
      address
      required_skills
      preferred_nationality
      languages_required
      minimum_experience_years
      age_preference_min
      age_preference_max
      education_requirement
      working_hours_per_day
      working_days_per_week
      days_off_per_week
      overtime_available
      live_in_required
      salary_min
      salary_max
      currency
      salary_period
      benefits
      contract_duration_months
      start_date
      end_date
      probation_period_months
      status
      urgency_level
      max_applications
      featured
      expires_at
      applications_count
      views_count
      created_at
      updated_at
      applications(order_by: { created_at: desc }) {
        id
        status
        cover_letter
        created_at
        maid: profile {
          id
          name
          email
          avatar_url
        }
      }
    }
  }
`;

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

const UPDATE_APPLICATION_STATUS = gql`
  mutation UpdateApplicationStatus($id: uuid!, $status: String!) {
    update_applications_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

// Status colors
const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: '#ECFDF5', text: '#10B981' },
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  paused: { bg: '#FEF3C7', text: '#F59E0B' },
  filled: { bg: '#EFF6FF', text: '#3B82F6' },
  expired: { bg: '#FEE2E2', text: '#EF4444' },
  cancelled: { bg: '#FEE2E2', text: '#EF4444' },
};

const applicationStatusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#F59E0B' },
  reviewed: { bg: '#EFF6FF', text: '#3B82F6' },
  shortlisted: { bg: '#ECFDF5', text: '#10B981' },
  interviewed: { bg: '#F3E8FF', text: '#9333EA' },
  offered: { bg: '#ECFDF5', text: '#10B981' },
  accepted: { bg: '#ECFDF5', text: '#10B981' },
  rejected: { bg: '#FEE2E2', text: '#EF4444' },
  withdrawn: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'applications'>('details');

  const { data, loading, error, refetch } = useQuery(GET_JOB_DETAIL, {
    variables: { id },
    skip: !id,
  });

  const [changeJobStatus] = useMutation(CHANGE_JOB_STATUS);
  const [deleteJob] = useMutation(DELETE_JOB);
  const [updateApplicationStatus] = useMutation(UPDATE_APPLICATION_STATUS);

  const job = data?.jobs_by_pk;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await changeJobStatus({ variables: { id, status: newStatus } });
      Alert.alert('Success', `Job status changed to ${newStatus}`);
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change status');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJob({ variables: { id } });
              Alert.alert('Success', 'Job deleted successfully');
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  const handleApplicationAction = (applicationId: string, currentStatus: string) => {
    const actions = [
      { text: 'Mark Reviewed', status: 'reviewed' },
      { text: 'Shortlist', status: 'shortlisted' },
      { text: 'Mark Interviewed', status: 'interviewed' },
      { text: 'Send Offer', status: 'offered' },
      { text: 'Reject', status: 'rejected' },
    ];

    const buttons = actions.map((action) => ({
      text: action.text,
      onPress: async () => {
        try {
          await updateApplicationStatus({
            variables: { id: applicationId, status: action.status },
          });
          Alert.alert('Success', `Application ${action.text.toLowerCase()}`);
          refetch();
        } catch (err: any) {
          Alert.alert('Error', err.message);
        }
      },
    }));

    buttons.push({ text: 'Cancel', onPress: () => {} });

    Alert.alert('Update Application', 'Choose an action', buttons as any);
  };

  const showMoreActions = () => {
    const actions: any[] = [
      {
        text: 'Edit Job',
        onPress: () => router.push(`/sponsor/job/${id}/edit`),
      },
    ];

    if (job?.status === 'active') {
      actions.push({ text: 'Pause', onPress: () => handleStatusChange('paused') });
      actions.push({ text: 'Mark as Filled', onPress: () => handleStatusChange('filled') });
    } else if (job?.status === 'paused') {
      actions.push({ text: 'Activate', onPress: () => handleStatusChange('active') });
    } else if (job?.status === 'draft') {
      actions.push({ text: 'Publish', onPress: () => handleStatusChange('active') });
    }

    actions.push({ text: 'Delete', style: 'destructive', onPress: handleDelete });
    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Actions', '', actions);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load job</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = statusColors[job.status] || statusColors.draft;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Job Details',
          headerRight: () => (
            <TouchableOpacity style={styles.moreButton} onPress={showMoreActions}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Text>
            </View>
            {job.featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>
              {job.city}, {job.country}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{job.applications_count}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="eye-outline" size={24} color="#10B981" />
            <Text style={styles.statValue}>{job.views_count}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>
              {Math.ceil((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))}
            </Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'applications' && styles.tabActive]}
            onPress={() => setActiveTab('applications')}
          >
            <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>
              Applications ({job.applications?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' ? (
          <View style={styles.content}>
            {/* Salary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Compensation</Text>
              <Text style={styles.salaryText}>
                {job.currency} {job.salary_min?.toLocaleString()}
                {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : ''}
                <Text style={styles.salaryPeriod}> / {job.salary_period || 'month'}</Text>
              </Text>
              {job.benefits?.length > 0 && (
                <View style={styles.tagsRow}>
                  {job.benefits.map((benefit: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.description}>{job.description}</Text>
            </View>

            {/* Requirements */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Requirements</Text>
              {job.required_skills?.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Skills</Text>
                  <View style={styles.tagsRow}>
                    {job.required_skills.map((skill: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {job.languages_required?.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Languages</Text>
                  <View style={styles.tagsRow}>
                    {job.languages_required.map((lang: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{lang}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {job.minimum_experience_years > 0 && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Experience</Text>
                  <Text style={styles.fieldValue}>{job.minimum_experience_years}+ years</Text>
                </View>
              )}
            </View>

            {/* Work Conditions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Work Conditions</Text>
              <View style={styles.conditionsGrid}>
                <View style={styles.conditionItem}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.conditionText}>
                    {job.working_hours_per_day || 8} hrs/day
                  </Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text style={styles.conditionText}>
                    {job.working_days_per_week || 6} days/week
                  </Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="home-outline" size={20} color="#6B7280" />
                  <Text style={styles.conditionText}>
                    {job.live_in_required ? 'Live-in' : 'Live-out'}
                  </Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="add-circle-outline" size={20} color="#6B7280" />
                  <Text style={styles.conditionText}>
                    {job.overtime_available ? 'Overtime Available' : 'No Overtime'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {job.applications?.length === 0 ? (
              <View style={styles.emptyApplications}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No applications yet</Text>
              </View>
            ) : (
              job.applications?.map((app: any) => {
                const appStatus = applicationStatusColors[app.status] || applicationStatusColors.pending;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.applicationCard}
                    onPress={() => handleApplicationAction(app.id, app.status)}
                  >
                    <View style={styles.applicantRow}>
                      {app.maid?.avatar_url ? (
                        <Image source={{ uri: app.maid.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {app.maid?.name?.charAt(0) || 'M'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.applicantInfo}>
                        <Text style={styles.applicantName}>{app.maid?.name || 'Unknown'}</Text>
                        <Text style={styles.applicantEmail}>{app.maid?.email}</Text>
                      </View>
                      <View style={[styles.appStatusBadge, { backgroundColor: appStatus.bg }]}>
                        <Text style={[styles.appStatusText, { color: appStatus.text }]}>
                          {app.status}
                        </Text>
                      </View>
                    </View>
                    {app.cover_letter && (
                      <Text style={styles.coverLetter} numberOfLines={2}>
                        {app.cover_letter}
                      </Text>
                    )}
                    <Text style={styles.applicationDate}>
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  moreButton: {
    marginRight: 8,
    padding: 8,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  salaryText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  salaryPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    color: '#1F2937',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    gap: 8,
  },
  conditionText: {
    fontSize: 13,
    color: '#4B5563',
  },
  emptyApplications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  applicantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  applicantEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  appStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appStatusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  coverLetter: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  applicationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
