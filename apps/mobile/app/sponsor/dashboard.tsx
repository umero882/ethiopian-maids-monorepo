/**
 * Sponsor Dashboard Overview Screen
 *
 * Shows detailed dashboard overview with recent activity,
 * statistics, and quick actions for sponsors.
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
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useSponsorDashboardRealtime, useRecentBookings, useRecentJobs } from '../../hooks';

export default function SponsorDashboardScreen() {
  const { user } = useAuth();
  // Use real-time subscriptions for live updates from Hasura
  const { stats, isLoading, error, refetch, isSubscribed } = useSponsorDashboardRealtime(user?.email);
  const { bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useRecentBookings(user?.email, 'sponsor');
  const { jobs, isLoading: jobsLoading, refetch: refetchJobs } = useRecentJobs(user?.email, 'sponsor');

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchBookings(), refetchJobs()]);
    setRefreshing(false);
  }, [refetch, refetchBookings, refetchJobs]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'cancelled': case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
        {/* Real-time Status Indicator */}
        {isSubscribed && (
          <View style={styles.realtimeIndicator}>
            <View style={styles.realtimeDot} />
            <Text style={styles.realtimeText}>Live Updates Active</Text>
          </View>
        )}

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="briefcase" size={24} color="#3B82F6" />
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{stats.activeBookings}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="heart" size={24} color="#EC4899" />
              <Text style={[styles.statValue, { color: '#EC4899' }]}>{stats.savedFavorites}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="document-text" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.totalJobs}</Text>
              <Text style={styles.statLabel}>Jobs Posted</Text>
            </View>
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/sponsor/bookings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {bookingsLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : bookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/maids')}
              >
                <Text style={styles.emptyButtonText}>Find Maids</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.listCard}
                onPress={() => router.push(`/sponsor/bookings/${booking.id}` as any)}
              >
                <View style={styles.listCardLeft}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                  <View>
                    <Text style={styles.listCardTitle}>Booking #{booking.id.slice(0, 8)}</Text>
                    <Text style={styles.listCardSubtitle}>
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Job Postings</Text>
            <TouchableOpacity onPress={() => router.push('/sponsor/jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {jobsLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : jobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No jobs posted yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/sponsor/jobs/new')}
              >
                <Text style={styles.emptyButtonText}>Post a Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.listCard}
                onPress={() => router.push(`/sponsor/jobs/${job.id}` as any)}
              >
                <View style={styles.listCardLeft}>
                  <View style={[styles.statusDot, { backgroundColor: job.status === 'active' ? '#10B981' : '#6B7280' }]} />
                  <View>
                    <Text style={styles.listCardTitle}>{job.title}</Text>
                    <Text style={styles.listCardSubtitle}>
                      {job.applicationsCount} applications | {job.viewsCount} views
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/maids')}
            >
              <Ionicons name="search" size={24} color="#3B82F6" />
              <Text style={styles.actionText}>Find Maids</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/sponsor/jobs/new')}
            >
              <Ionicons name="add-circle" size={24} color="#10B981" />
              <Text style={styles.actionText}>Post Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/sponsor/favorites')}
            >
              <Ionicons name="heart" size={24} color="#EC4899" />
              <Text style={styles.actionText}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/messages')}
            >
              <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  // Real-time indicator
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  realtimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
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
    color: '#3B82F6',
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
    backgroundColor: '#3B82F6',
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 8,
  },
});
