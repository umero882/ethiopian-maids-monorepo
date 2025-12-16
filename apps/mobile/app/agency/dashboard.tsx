/**
 * Agency Dashboard Overview Screen
 *
 * Comprehensive dashboard with agency stats, performance metrics,
 * maid status summary, financial overview, quick actions,
 * recent activities, and calendar events.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useAgencyDashboardRealtime, useRecentJobs, useCalendar } from '../../hooks';
import type { AgencyActivity } from '../../hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to format event dates
const formatEventDate = (dateString: string | undefined): string => {
  if (!dateString) return 'No date';
  try {
    const date = new Date(dateString + 'T12:00:00');
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

// Helper to format currency
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

// Helper to format time ago
const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

// Activity type icons and colors
const getActivityIcon = (type: string): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } => {
  switch (type) {
    case 'new_registration':
      return { name: 'person-add', color: '#10B981', bg: '#ECFDF5' };
    case 'new_hire':
    case 'placement':
      return { name: 'checkmark-circle', color: '#3B82F6', bg: '#EFF6FF' };
    case 'new_application':
      return { name: 'document-text', color: '#8B5CF6', bg: '#F5F3FF' };
    case 'interview':
      return { name: 'videocam', color: '#F59E0B', bg: '#FFFBEB' };
    case 'contract':
      return { name: 'document-attach', color: '#06B6D4', bg: '#ECFEFF' };
    default:
      return { name: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
  }
};

const formatEventTime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  try {
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
};

const isEventToday = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateString.split('T')[0] === todayStr;
};

export default function AgencyDashboardScreen() {
  const { user } = useAuth();
  // Use real-time subscriptions for live updates from Hasura
  const { stats, isLoading, error, refetch, isSubscribed } = useAgencyDashboardRealtime(user?.email);
  const { jobs, isLoading: jobsLoading, refetch: refetchJobs } = useRecentJobs(user?.email, 'agency');
  const { events, tasks, isLoading: calendarLoading, refetch: refetchCalendar } = useCalendar(user?.uid);

  const [refreshing, setRefreshing] = React.useState(false);

  // Get important events (high priority or interviews, sorted by date)
  const importantEvents = React.useMemo(() => {
    return events
      .filter(e => e.priority === 'high' || e.event_type === 'interview')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 3);
  }, [events]);

  // Get upcoming tasks (pending or in_progress, sorted by due date)
  const urgentTasks = React.useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed' && (t.priority === 'high' ||
        (t.due_date && new Date(t.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))))
      .sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime())
      .slice(0, 3);
  }, [tasks]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchJobs(), refetchCalendar()]);
    setRefreshing(false);
  }, [refetch, refetchJobs, refetchCalendar]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Real-time Status Indicator */}
        {isSubscribed && (
          <View style={styles.realtimeIndicator}>
            <View style={styles.realtimeDot} />
            <Text style={styles.realtimeText}>Live Updates Active</Text>
          </View>
        )}

        {/* Agency Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agency Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.totalMaids}</Text>
              <Text style={styles.statLabel}>Total Maids</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="briefcase" size={24} color="#3B82F6" />
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.activeJobs}</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="person-add" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.newApplicantsToday}</Text>
              <Text style={styles.statLabel}>New Today</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="checkmark-done" size={24} color="#8B5CF6" />
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{stats.successfulPlacements}</Text>
              <Text style={styles.statLabel}>Placements</Text>
            </View>
            {/* NEW: Additional KPIs synced with web */}
            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={24} color="#D97706" />
              <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.interviewsScheduled}</Text>
              <Text style={styles.statLabel}>Interviews</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="trending-up" size={24} color="#4F46E5" />
              <Text style={[styles.statValue, { color: '#4F46E5' }]}>{stats.hiresThisMonth}</Text>
              <Text style={styles.statLabel}>Hires (Month)</Text>
            </View>
          </View>
        </View>

        {/* Pipeline Funnel - NEW: Synced with web dashboard */}
        {stats.pipelineFunnel && stats.pipelineFunnel.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pipeline Funnel</Text>
            <View style={styles.pipelineCard}>
              {stats.pipelineFunnel.map((stage, index) => {
                const maxCount = Math.max(...stats.pipelineFunnel.map(s => s.count), 1);
                const barWidth = (stage.count / maxCount) * 100;
                return (
                  <View key={`pipeline-${stage.name}`} style={styles.pipelineRow}>
                    <Text style={styles.pipelineLabel}>{stage.name}</Text>
                    <View style={styles.pipelineBarContainer}>
                      <View
                        style={[
                          styles.pipelineBar,
                          { width: `${barWidth}%`, backgroundColor: stage.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.pipelineCount, { color: stage.color }]}>{stage.count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Performance Metrics */}
        <View style={styles.section}>
          <View style={styles.metricsCard}>
            <View style={styles.metricsHeader}>
              <Text style={styles.metricsTitle}>Performance</Text>
              {stats.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.metricValue}>
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                </Text>
                <Text style={styles.metricLabel}>Rating</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="list" size={20} color="#3B82F6" />
                <Text style={styles.metricValue}>{stats.activeListings}</Text>
                <Text style={styles.metricLabel}>Active Listings</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text style={styles.metricValue}>{stats.successfulPlacements}</Text>
                <Text style={styles.metricLabel}>Placements</Text>
              </View>
            </View>
            {/* Subscription Info */}
            {stats.subscriptionTier && (
              <View style={styles.subscriptionRow}>
                <View style={styles.subscriptionInfo}>
                  <Ionicons name="ribbon" size={16} color="#8B5CF6" />
                  <Text style={styles.subscriptionText}>
                    {stats.subscriptionTier.charAt(0).toUpperCase() + stats.subscriptionTier.slice(1)} Plan
                  </Text>
                </View>
                {stats.subscriptionExpiresAt && (
                  <Text style={styles.subscriptionExpiry}>
                    Expires: {new Date(stats.subscriptionExpiresAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Maid Status Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maid Status</Text>
          <View style={styles.maidStatusCard}>
            <View style={styles.maidStatusRow}>
              <View style={styles.maidStatusItem}>
                <View style={[styles.maidStatusDot, { backgroundColor: '#10B981' }]} />
                <View>
                  <Text style={styles.maidStatusValue}>{stats.maidStatus.available}</Text>
                  <Text style={styles.maidStatusLabel}>Available</Text>
                </View>
              </View>
              <View style={styles.maidStatusItem}>
                <View style={[styles.maidStatusDot, { backgroundColor: '#3B82F6' }]} />
                <View>
                  <Text style={styles.maidStatusValue}>{stats.maidStatus.placed}</Text>
                  <Text style={styles.maidStatusLabel}>Placed</Text>
                </View>
              </View>
              <View style={styles.maidStatusItem}>
                <View style={[styles.maidStatusDot, { backgroundColor: '#F59E0B' }]} />
                <View>
                  <Text style={styles.maidStatusValue}>{stats.maidStatus.pending}</Text>
                  <Text style={styles.maidStatusLabel}>Pending</Text>
                </View>
              </View>
            </View>
            {/* Progress Bar */}
            <View style={styles.maidStatusBarContainer}>
              {stats.maidStatus.total > 0 ? (
                <View style={styles.maidStatusBar}>
                  <View
                    style={[
                      styles.maidStatusBarSegment,
                      {
                        backgroundColor: '#10B981',
                        flex: stats.maidStatus.available / stats.maidStatus.total,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.maidStatusBarSegment,
                      {
                        backgroundColor: '#3B82F6',
                        flex: stats.maidStatus.placed / stats.maidStatus.total,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.maidStatusBarSegment,
                      {
                        backgroundColor: '#F59E0B',
                        flex: stats.maidStatus.pending / stats.maidStatus.total,
                      },
                    ]}
                  />
                </View>
              ) : (
                <View style={[styles.maidStatusBar, { backgroundColor: '#E5E7EB' }]} />
              )}
            </View>
            <TouchableOpacity
              style={styles.maidStatusButton}
              onPress={() => router.push('/agency/maids')}
            >
              <Text style={styles.maidStatusButtonText}>View All Maids</Text>
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Overview */}
        {stats.financials && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Overview</Text>
              <TouchableOpacity onPress={() => router.push('/agency/billing')}>
                <Text style={styles.seeAllText}>View Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.financialCard}>
              <View style={styles.financialMain}>
                <Text style={styles.financialLabel}>Account Balance</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(stats.financials.balance, stats.financials.currency)}
                </Text>
                {stats.financials.lastTransactionAt && (
                  <Text style={styles.financialSubtext}>
                    Last transaction: {formatTimeAgo(stats.financials.lastTransactionAt)}
                  </Text>
                )}
              </View>
              <View style={styles.financialActions}>
                <TouchableOpacity
                  style={[styles.financialButton, { backgroundColor: '#ECFDF5' }]}
                  onPress={() => router.push('/agency/billing')}
                >
                  <Ionicons name="add-circle" size={20} color="#10B981" />
                  <Text style={[styles.financialButtonText, { color: '#10B981' }]}>Top Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.financialButton, { backgroundColor: '#EFF6FF' }]}
                  onPress={() => router.push('/agency/billing')}
                >
                  <Ionicons name="receipt" size={20} color="#3B82F6" />
                  <Text style={[styles.financialButtonText, { color: '#3B82F6' }]}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/maids')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="people" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Manage Maids</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/maids/add')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person-add" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Add Maid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/jobs/new')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="add-circle" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.actionText}>Post Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/applicants')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="people-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Applicants</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/calendar')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar" size={24} color="#D97706" />
              </View>
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/sponsors')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ECFEFF' }]}>
                <Ionicons name="business" size={24} color="#06B6D4" />
              </View>
              <Text style={styles.actionText}>Sponsors</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/analytics')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="analytics" size={24} color="#EF4444" />
              </View>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/agency/messages')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="chatbubbles" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activities */}
        {stats.recentActivities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={styles.activitiesCard}>
              {stats.recentActivities.slice(0, 5).map((activity: AgencyActivity, index: number) => {
                const iconInfo = getActivityIcon(activity.activityType);
                return (
                  <View
                    key={`activity-${activity.id}-${index}`}
                    style={[
                      styles.activityItem,
                      index < Math.min(stats.recentActivities.length, 5) - 1 && styles.activityItemBorder,
                    ]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {activity.title}
                      </Text>
                      {activity.description && (
                        <Text style={styles.activityDescription} numberOfLines={1}>
                          {activity.description}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.activityTime}>{formatTimeAgo(activity.createdAt)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Important Events & Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Important Events</Text>
            <TouchableOpacity onPress={() => router.push('/agency/calendar')}>
              <Text style={styles.seeAllText}>View Calendar</Text>
            </TouchableOpacity>
          </View>
          {calendarLoading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : importantEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No important events</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/agency/calendar')}
              >
                <Text style={styles.emptyButtonText}>View Calendar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            importantEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => router.push('/agency/calendar')}
              >
                <View style={[styles.eventTypeIndicator, {
                  backgroundColor: event.event_type === 'interview' ? '#3B82F6' : '#EF4444'
                }]} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    {isEventToday(event.start_date) && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.eventDetailText}>{formatEventDate(event.start_date)}</Text>
                    </View>
                    {event.start_time && (
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.eventDetailText}>{formatEventTime(event.start_time)}</Text>
                      </View>
                    )}
                    {event.meeting_link && (
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="videocam-outline" size={14} color="#3B82F6" />
                        <Text style={[styles.eventDetailText, { color: '#3B82F6' }]}>Video Call</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.eventFooter}>
                    <View style={[styles.eventTypeBadge, {
                      backgroundColor: event.event_type === 'interview' ? '#DBEAFE' : '#FEE2E2'
                    }]}>
                      <Text style={[styles.eventTypeBadgeText, {
                        color: event.event_type === 'interview' ? '#3B82F6' : '#EF4444'
                      }]}>
                        {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                      </Text>
                    </View>
                    {event.priority === 'high' && (
                      <View style={[styles.priorityBadge, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.priorityBadgeText, { color: '#EF4444' }]}>High Priority</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Urgent Tasks */}
        {urgentTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Urgent Tasks</Text>
              <TouchableOpacity onPress={() => router.push('/agency/calendar')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {urgentTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => router.push('/agency/calendar')}
              >
                <View style={[styles.taskCheckbox, task.status === 'completed' && styles.taskCheckboxCompleted]}>
                  {task.status === 'completed' && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                  <View style={styles.taskDetails}>
                    {task.due_date && (
                      <View style={styles.taskDetailRow}>
                        <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                        <Text style={styles.taskDetailText}>{formatEventDate(task.due_date)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={[styles.taskPriorityDot, {
                  backgroundColor: task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#10B981'
                }]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Job Postings</Text>
            <TouchableOpacity onPress={() => router.push('/agency/jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {jobsLoading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : jobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No jobs posted yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/agency/jobs/new')}
              >
                <Text style={styles.emptyButtonText}>Post a Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.listCard}
                onPress={() => router.push(`/agency/jobs/${job.id}` as any)}
              >
                <View style={styles.listCardLeft}>
                  <View style={[styles.statusDot, { backgroundColor: job.status === 'active' ? '#10B981' : '#6B7280' }]} />
                  <View style={styles.listCardContent}>
                    <Text style={styles.listCardTitle}>{job.title}</Text>
                    <Text style={styles.listCardSubtitle}>
                      {job.applicationsCount} applications | {job.viewsCount} views
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: job.status === 'active' ? '#ECFDF5' : '#F3F4F6' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: job.status === 'active' ? '#10B981' : '#6B7280' }
                  ]}>
                    {job.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Management Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/agency/calendar')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="calendar-outline" size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Calendar & Tasks</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/agency/sponsors')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="business-outline" size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Sponsors (CRM)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/agency/shortlists')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="heart-outline" size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Shortlists</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/agency/documents')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="folder-outline" size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Documents</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/agency/analytics')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="analytics-outline" size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/agency/billing')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="card-outline" size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Billing & Subscription</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
    </ScrollView>
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
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  realtimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  metricsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subscriptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  subscriptionExpiry: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  listCardContent: {
    flex: 1,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  listCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  // Event card styles
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventTypeIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  todayBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  eventFooter: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Task card styles
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  // Maid Status styles
  maidStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  maidStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  maidStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maidStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  maidStatusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  maidStatusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  maidStatusBarContainer: {
    marginBottom: 12,
  },
  maidStatusBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  maidStatusBarSegment: {
    height: '100%',
  },
  maidStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  maidStatusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
    marginRight: 4,
  },
  // Financial styles
  financialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  financialMain: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  financialLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
  },
  financialSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  financialActions: {
    flexDirection: 'row',
    gap: 12,
  },
  financialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  financialButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Activity styles
  activitiesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  // Pipeline Funnel styles - NEW: Synced with web dashboard
  pipelineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pipelineLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  pipelineBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  pipelineBar: {
    height: '100%',
    borderRadius: 4,
  },
  pipelineCount: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
