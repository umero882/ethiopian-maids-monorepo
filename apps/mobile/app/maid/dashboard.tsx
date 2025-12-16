/**
 * Maid Dashboard Overview Screen
 *
 * Fully synced with web MaidOverview.jsx
 * Shows: Header, Hints, Stats, At a Glance, Recent Bookings, Profile Status, Notifications
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
import { useAuth, useMaidDashboardRealtime, useRecentBookings } from '../../hooks';

export default function MaidDashboardScreen() {
  const { user } = useAuth();
  // Use real-time subscriptions for live updates from Hasura
  const { stats, profile, isLoading, error, refetch, isSubscribed } = useMaidDashboardRealtime(user?.email);
  const { bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useRecentBookings(user?.email, 'maid');

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchBookings()]);
    setRefreshing(false);
  }, [refetch, refetchBookings]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        {/* Real-time Status Indicator */}
        {isSubscribed && (
          <View style={styles.realtimeIndicator}>
            <View style={styles.realtimeDot} />
            <Text style={styles.realtimeText}>Live Updates Active</Text>
          </View>
        )}

        {/* Header - synced with web */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard Overview</Text>
            <Text style={styles.headerSubtitle}>Welcome back, {profile.fullName || user?.name || 'User'}!</Text>
          </View>
          {stats.profileCompleteness < 100 && (
            <TouchableOpacity
              style={styles.completeProfileBtn}
              onPress={() => router.push('/maid/profile')}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.completeProfileBtnText}>Complete Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Photo Hint - synced with web */}
        {!stats.hasPhoto && (
          <View style={[styles.hintCard, styles.hintYellow]}>
            <View style={styles.hintContent}>
              <Ionicons name="warning" size={16} color="#92400E" />
              <Text style={styles.hintText}>
                Add a profile photo to boost your visibility and build trust with employers.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => router.push('/maid/profile')}
            >
              <Text style={styles.hintButtonText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Languages Hint - synced with web */}
        {!stats.hasLanguages && (
          <View style={[styles.hintCard, styles.hintBlue]}>
            <View style={styles.hintContent}>
              <Ionicons name="globe" size={16} color="#1E40AF" />
              <Text style={styles.hintText}>
                Add languages you speak so employers can find you more easily.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => router.push('/maid/profile')}
            >
              <Text style={[styles.hintButtonText, { color: '#1E40AF' }]}>Add Languages</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skills Hint - synced with web */}
        {!stats.hasSkills && (
          <View style={[styles.hintCard, styles.hintIndigo]}>
            <View style={styles.hintContent}>
              <Ionicons name="star" size={16} color="#4338CA" />
              <Text style={styles.hintText}>
                Add your key skills to stand out to employers.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => router.push('/maid/profile')}
            >
              <Text style={[styles.hintButtonText, { color: '#4338CA' }]}>Add Skills</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Documents Hint - synced with web */}
        {!stats.documentsVerified && (
          <View style={[styles.hintCard, styles.hintRed]}>
            <View style={styles.hintContent}>
              <Ionicons name="document-text" size={16} color="#991B1B" />
              <Text style={styles.hintText}>
                Upload required documents (Passport, Visa, Medical Certificate) to get verified.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => router.push('/maid/documents')}
            >
              <Text style={[styles.hintButtonText, { color: '#991B1B' }]}>Upload Docs</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards - synced with web (4 cards) */}
        <View style={styles.statsGrid}>
          {/* Profile Status */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <View>
                <Text style={styles.statLabel}>Profile Status</Text>
                <Text style={styles.statValue}>{stats.profileCompleteness}%</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="person" size={20} color="#9333EA" />
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.profileCompleteness}%` }]} />
            </View>
          </View>

          {/* Pending Bookings */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <View>
                <Text style={styles.statLabel}>Pending Bookings</Text>
                <Text style={styles.statValue}>{stats.pendingBookings}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <View>
                <Text style={styles.statLabel}>Rating</Text>
                <Text style={styles.statValue}>
                  {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/5` : '4.8/5'}
                </Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={20} color="#D97706" />
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <View>
                <Text style={styles.statLabel}>Notifications</Text>
                <Text style={styles.statValue}>{stats.unreadNotifications}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="trending-up" size={20} color="#059669" />
              </View>
            </View>
          </View>
        </View>

        {/* At a Glance - synced with web */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>At a Glance</Text>
              <Text style={styles.cardDescription}>Quick view of your current status</Text>
            </View>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/maid/profile')}
            >
              <Text style={styles.outlineButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            {/* Row 1: Visa, Availability, Skills */}
            <View style={styles.glanceRow}>
              <View style={styles.glanceItem}>
                <Text style={styles.glanceLabel}>VISA STATUS</Text>
                <Text style={styles.glanceValue}>{stats.visaStatus}</Text>
              </View>
              <View style={styles.glanceItem}>
                <Text style={styles.glanceLabel}>AVAILABILITY</Text>
                <Text style={styles.glanceValue}>{stats.availability}</Text>
              </View>
              <View style={[styles.glanceItem, { flex: 1.5 }]}>
                <Text style={styles.glanceLabel}>TOP SKILLS</Text>
                <View style={styles.badgeRow}>
                  {stats.skills.slice(0, 3).map((skill, idx) => (
                    <View key={idx} style={[styles.badge, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={[styles.badgeText, { color: '#4338CA' }]}>{skill}</Text>
                    </View>
                  ))}
                  {stats.skills.length === 0 && (
                    <Text style={styles.noDataText}>No skills added</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Row 2: Languages, Living */}
            <View style={styles.glanceRow}>
              <View style={[styles.glanceItem, { flex: 2 }]}>
                <Text style={styles.glanceLabel}>TOP LANGUAGES</Text>
                <View style={styles.badgeRow}>
                  {stats.languages.slice(0, 3).map((lang, idx) => (
                    <View key={idx} style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.badgeText, { color: '#1E40AF' }]}>{lang}</Text>
                    </View>
                  ))}
                  {stats.languages.length === 0 && (
                    <Text style={styles.noDataText}>No languages added</Text>
                  )}
                </View>
              </View>
              <View style={styles.glanceItem}>
                <Text style={styles.glanceLabel}>LIVING</Text>
                <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.badgeText, { color: '#065F46' }]}>{stats.livingArrangement}</Text>
                </View>
              </View>
            </View>

            {/* Row 3: Salary, Contract, Photo */}
            <View style={styles.glanceRow}>
              <View style={styles.glanceItem}>
                <Text style={styles.glanceLabel}>SALARY</Text>
                <Text style={styles.glanceValue}>{stats.salaryRange}</Text>
              </View>
              <View style={styles.glanceItem}>
                <Text style={styles.glanceLabel}>CONTRACT</Text>
                <Text style={styles.glanceValue}>{stats.contractPreference}</Text>
              </View>
              <View style={styles.glanceItem}>
                <Text style={styles.glanceLabel}>PHOTO</Text>
                {stats.hasPhoto ? (
                  <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.badgeText, { color: '#065F46' }]}>Set</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' }]}>
                    <Text style={[styles.badgeText, { color: '#92400E' }]}>Missing</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.lastUpdated}>
              Last updated: {formatDate(stats.lastUpdated)}
            </Text>
          </View>
        </View>

        {/* Recent Bookings - synced with web */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Recent Bookings</Text>
              <Text style={styles.cardDescription}>Your latest booking requests</Text>
            </View>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/maid/bookings')}
            >
              <Text style={styles.outlineButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            {bookingsLoading ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No bookings yet</Text>
                <Text style={styles.emptySubtext}>Complete your profile to start receiving bookings</Text>
              </View>
            ) : (
              bookings.slice(0, 3).map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingItem}
                  onPress={() => router.push('/maid/bookings')}
                >
                  <View>
                    <Text style={styles.bookingTitle}>Booking Request</Text>
                    <Text style={styles.bookingDate}>{formatDate(booking.createdAt)}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: booking.status === 'pending' ? 'transparent' :
                        booking.status === 'accepted' ? '#8B5CF6' : '#EF4444',
                      borderWidth: booking.status === 'pending' ? 1 : 0,
                      borderColor: '#D1D5DB',
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: booking.status === 'pending' ? '#6B7280' : '#fff' }
                    ]}>
                      {booking.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Profile Status - synced with web */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Profile Status</Text>
              <Text style={styles.cardDescription}>Complete your profile to get more visibility</Text>
            </View>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/maid/profile')}
            >
              <Text style={styles.outlineButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            {/* Email Verified */}
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={stats.emailVerified ? '#10B981' : '#D1D5DB'}
                />
                <Text style={styles.statusLabel}>Email Verified</Text>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: stats.emailVerified ? '#8B5CF6' : 'transparent',
                  borderWidth: stats.emailVerified ? 0 : 1,
                  borderColor: '#D1D5DB',
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: stats.emailVerified ? '#fff' : '#6B7280' }
                ]}>
                  {stats.emailVerified ? 'Done' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Phone Verified */}
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={stats.phoneVerified ? '#10B981' : '#D1D5DB'}
                />
                <Text style={styles.statusLabel}>Phone Verified</Text>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: stats.phoneVerified ? '#8B5CF6' : 'transparent',
                  borderWidth: stats.phoneVerified ? 0 : 1,
                  borderColor: '#D1D5DB',
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: stats.phoneVerified ? '#fff' : '#6B7280' }
                ]}>
                  {stats.phoneVerified ? 'Done' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Documents Verified */}
            <TouchableOpacity
              style={styles.statusRow}
              onPress={() => router.push('/maid/documents')}
            >
              <View style={styles.statusLeft}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={stats.documentsVerified ? '#10B981' : '#D1D5DB'}
                />
                <Text style={styles.statusLabel}>Documents Verified</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: stats.documentsVerified ? '#8B5CF6' : 'transparent',
                    borderWidth: stats.documentsVerified ? 0 : 1,
                    borderColor: '#D1D5DB',
                  }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: stats.documentsVerified ? '#fff' : '#6B7280' }
                  ]}>
                    {stats.documentsVerified ? 'Done' : 'Pending'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            {/* Overall Progress */}
            <View style={styles.overallProgress}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressValue}>{stats.profileCompleteness}%</Text>
              </View>
              <View style={styles.progressBarLarge}>
                <View style={[styles.progressFillLarge, { width: `${stats.profileCompleteness}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Notifications - synced with web */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Recent Notifications</Text>
              <Text style={styles.cardDescription}>Stay updated with your latest activity</Text>
            </View>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/maid/notifications' as any)}
            >
              <Text style={styles.outlineButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            {stats.unreadNotifications === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>We'll notify you when something important happens</Text>
              </View>
            ) : (
              <View style={styles.notificationPlaceholder}>
                <Text style={styles.notificationCount}>{stats.unreadNotifications} unread notification(s)</Text>
                <TouchableOpacity onPress={() => router.push('/maid/notifications' as any)}>
                  <Text style={styles.viewAllLink}>View all notifications</Text>
                </TouchableOpacity>
              </View>
            )}
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
    backgroundColor: '#F5F3FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  realtimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  completeProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  completeProfileBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Hint Cards
  hintCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintYellow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  hintBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  hintIndigo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  hintRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  hintButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  hintButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },

  // Cards
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
  },
  outlineButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  outlineButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },

  // At a Glance
  glanceRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  glanceItem: {
    flex: 1,
  },
  glanceLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  glanceValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },

  // Booking Items
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  bookingDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Status Badge
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

  // Status Rows
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#374151',
  },

  // Overall Progress
  overallProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },

  // Notifications
  notificationPlaceholder: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  notificationCount: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});
