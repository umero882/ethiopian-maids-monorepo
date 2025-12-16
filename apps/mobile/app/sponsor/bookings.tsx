/**
 * Sponsor Bookings Page
 *
 * Displays all booking requests for the sponsor with stats, filtering,
 * and management actions (cancel, complete).
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL query to get profile ID by email
const GET_PROFILE_ID = gql`
  query GetProfileId($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      user_type
    }
  }
`;

// GraphQL query to get sponsor's bookings (matches actual schema)
const GET_SPONSOR_BOOKINGS = gql`
  query GetSponsorBookings($sponsorId: String!, $limit: Int = 50) {
    booking_requests(
      where: { sponsor_id: { _eq: $sponsorId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      maid_id
      sponsor_id
      status
      requested_start_date
      requested_duration_months
      offered_salary
      currency
      message
      rejection_reason
      created_at
      updated_at
      responded_at
    }
  }
`;

// Query to get maid profiles by their profile IDs
const GET_MAID_PROFILES_BY_IDS = gql`
  query GetMaidProfilesByIds($profileIds: [String!]!) {
    maid_profiles(where: { user_id: { _in: $profileIds } }) {
      id
      user_id
      full_name
      profile_photo_url
      nationality
      date_of_birth
      skills
    }
  }
`;

// GraphQL query for booking stats
const GET_BOOKING_STATS = gql`
  query GetBookingStatistics($sponsorId: String!) {
    total: booking_requests_aggregate(where: { sponsor_id: { _eq: $sponsorId } }) {
      aggregate {
        count
      }
    }
    pending: booking_requests_aggregate(
      where: { sponsor_id: { _eq: $sponsorId }, status: { _eq: "pending" } }
    ) {
      aggregate {
        count
      }
    }
    accepted: booking_requests_aggregate(
      where: { sponsor_id: { _eq: $sponsorId }, status: { _eq: "accepted" } }
    ) {
      aggregate {
        count
      }
    }
    rejected: booking_requests_aggregate(
      where: { sponsor_id: { _eq: $sponsorId }, status: { _eq: "rejected" } }
    ) {
      aggregate {
        count
      }
    }
    cancelled: booking_requests_aggregate(
      where: { sponsor_id: { _eq: $sponsorId }, status: { _eq: "cancelled" } }
    ) {
      aggregate {
        count
      }
    }
    completed: booking_requests_aggregate(
      where: { sponsor_id: { _eq: $sponsorId }, status: { _eq: "completed" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Mutations
const CANCEL_BOOKING = gql`
  mutation CancelBookingRequest($id: uuid!) {
    update_booking_requests_by_pk(
      pk_columns: { id: $id }
      _set: { status: "cancelled", updated_at: "now()" }
    ) {
      id
      status
      updated_at
    }
  }
`;

const COMPLETE_BOOKING = gql`
  mutation CompleteBookingRequest($id: uuid!) {
    update_booking_requests_by_pk(
      pk_columns: { id: $id }
      _set: { status: "completed", updated_at: "now()" }
    ) {
      id
      status
      updated_at
    }
  }
`;

interface MaidProfile {
  id: string;
  user_id: string;
  full_name: string;
  profile_photo_url: string | null;
  nationality: string;
  date_of_birth: string | null;
  skills: string[];
}

interface Booking {
  id: string;
  maid_id: string;
  sponsor_id: string;
  status: string;
  requested_start_date: string | null;
  requested_duration_months: number | null;
  offered_salary: number | null;
  currency: string;
  message: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

interface BookingWithMaid extends Booking {
  maidProfile?: MaidProfile | null;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  completed: number;
}

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#F59E0B' },
  accepted: { bg: '#ECFDF5', text: '#10B981' },
  rejected: { bg: '#FEE2E2', text: '#EF4444' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
  completed: { bg: '#EFF6FF', text: '#3B82F6' },
};

// Filter tabs
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function SponsorBookingsScreen() {
  const { user } = useAuth();
  const { count: unreadNotifications } = useUnreadNotificationCount();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  const { loading: profileLoading } = useQuery(GET_PROFILE_ID, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  // Fetch bookings
  const {
    data: bookingsData,
    loading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery(GET_SPONSOR_BOOKINGS, {
    variables: { sponsorId: profileId },
    skip: !profileId,
    fetchPolicy: 'cache-and-network',
  });

  // Extract maid IDs from bookings
  const maidIds = useMemo(() => {
    const bookings: Booking[] = bookingsData?.booking_requests || [];
    return [...new Set(bookings.map((b) => b.maid_id).filter(Boolean))];
  }, [bookingsData]);

  // Fetch maid profiles
  const { data: maidsData } = useQuery(GET_MAID_PROFILES_BY_IDS, {
    variables: { profileIds: maidIds },
    skip: maidIds.length === 0,
  });

  // Create a map of maid profiles by user_id
  const maidProfilesMap = useMemo(() => {
    const profiles: MaidProfile[] = maidsData?.maid_profiles || [];
    const map = new Map<string, MaidProfile>();
    profiles.forEach((p) => {
      map.set(p.user_id, p);
    });
    return map;
  }, [maidsData]);

  // Fetch stats
  const { data: statsData, refetch: refetchStats } = useQuery(GET_BOOKING_STATS, {
    variables: { sponsorId: profileId },
    skip: !profileId,
  });

  // Mutations
  const [cancelBooking] = useMutation(CANCEL_BOOKING);
  const [completeBooking] = useMutation(COMPLETE_BOOKING);

  // Calculate stats
  const stats: Stats = {
    total: statsData?.total?.aggregate?.count || 0,
    pending: statsData?.pending?.aggregate?.count || 0,
    accepted: statsData?.accepted?.aggregate?.count || 0,
    rejected: statsData?.rejected?.aggregate?.count || 0,
    cancelled: statsData?.cancelled?.aggregate?.count || 0,
    completed: statsData?.completed?.aggregate?.count || 0,
  };

  // Combine bookings with maid profiles
  const bookingsWithMaids: BookingWithMaid[] = useMemo(() => {
    const bookings: Booking[] = bookingsData?.booking_requests || [];
    return bookings.map((booking) => ({
      ...booking,
      maidProfile: maidProfilesMap.get(booking.maid_id) || null,
    }));
  }, [bookingsData, maidProfilesMap]);

  // Filter bookings
  const filteredBookings =
    activeFilter === 'all'
      ? bookingsWithMaids
      : bookingsWithMaids.filter((booking) => booking.status === activeFilter);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBookings(), refetchStats()]);
    setRefreshing(false);
  }, [refetchBookings, refetchStats]);

  // Handle cancel booking
  const handleCancel = (bookingId: string, maidName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel the booking request for "${maidName}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking({ variables: { id: bookingId } });
              Alert.alert('Success', 'Booking cancelled successfully');
              refetchBookings();
              refetchStats();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  // Handle complete booking
  const handleComplete = (bookingId: string, maidName: string) => {
    Alert.alert(
      'Complete Booking',
      `Mark the booking with "${maidName}" as completed?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await completeBooking({ variables: { id: bookingId } });
              Alert.alert('Success', 'Booking marked as completed');
              refetchBookings();
              refetchStats();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete booking');
            }
          },
        },
      ]
    );
  };

  // Show booking actions
  const showBookingActions = (booking: BookingWithMaid) => {
    const maidName = booking.maidProfile?.full_name || 'Unknown Maid';
    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      {
        text: 'View Details',
        onPress: () => router.push(`/sponsor/booking/${booking.id}`),
      },
    ];

    // Status-specific actions
    if (booking.status === 'pending') {
      actions.push({
        text: 'Cancel Request',
        style: 'destructive',
        onPress: () => handleCancel(booking.id, maidName),
      });
    } else if (booking.status === 'accepted') {
      actions.push({
        text: 'Mark as Completed',
        onPress: () => handleComplete(booking.id, maidName),
      });
      actions.push({
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: () => handleCancel(booking.id, maidName),
      });
    }

    // View maid profile
    if (booking.maid_id) {
      actions.push({
        text: 'View Maid Profile',
        onPress: () => router.push(`/maid/${booking.maid_id}`),
      });
    }

    actions.push({ text: 'Close', style: 'cancel' });

    Alert.alert('Booking Actions', maidName, actions);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  // Format currency
  const formatAmount = (amount: number | null, currency: string) => {
    if (!amount) return 'Not specified';
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Render booking card
  const renderBookingCard = ({ item: booking }: { item: BookingWithMaid }) => {
    const statusStyle = statusColors[booking.status] || statusColors.pending;
    const maidProfile = booking.maidProfile;

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => router.push(`/sponsor/booking/${booking.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.maidInfo}>
            <View style={styles.maidAvatar}>
              <Text style={styles.avatarText}>
                {maidProfile?.full_name?.charAt(0) || 'M'}
              </Text>
            </View>
            <View style={styles.maidDetails}>
              <Text style={styles.maidName} numberOfLines={1}>
                {maidProfile?.full_name || 'Unknown Maid'}
              </Text>
              {maidProfile?.nationality && (
                <Text style={styles.maidNationality}>{maidProfile.nationality}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => showBookingActions(booking)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.bookingMeta}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {booking.requested_start_date
                ? formatDate(booking.requested_start_date)
                : 'Date not set'}
            </Text>
          </View>
          {booking.requested_duration_months && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {booking.requested_duration_months} month
                {booking.requested_duration_months > 1 ? 's' : ''} duration
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {formatAmount(booking.offered_salary, booking.currency || 'ETB')}/month
            </Text>
          </View>
        </View>

        {booking.message && (
          <Text style={styles.messageText} numberOfLines={2}>
            "{booking.message}"
          </Text>
        )}

        {booking.rejection_reason && booking.status === 'rejected' && (
          <View style={styles.rejectionContainer}>
            <Ionicons name="information-circle" size={14} color="#EF4444" />
            <Text style={styles.rejectionText} numberOfLines={2}>
              {booking.rejection_reason}
            </Text>
          </View>
        )}

        <View style={styles.bookingFooter}>
          <Text style={styles.dateText}>{formatRelativeTime(booking.created_at)}</Text>
          {booking.responded_at && (
            <Text style={styles.respondedText}>
              Responded {formatRelativeTime(booking.responded_at)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (profileLoading || (bookingsLoading && !bookingsData)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Bookings',
          headerRight: () => (
            <View style={styles.headerRight}>
              {/* Pending Bookings Badge */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setActiveFilter('pending')}
              >
                <Ionicons name="time-outline" size={24} color="#F59E0B" />
                {stats.pending > 0 && (
                  <View style={[styles.notificationBadge, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.notificationBadgeText}>
                      {stats.pending > 99 ? '99+' : stats.pending}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Notifications Badge */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color="#3B82F6" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Search */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/maids')}
              >
                <Ionicons name="search" size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.accepted}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
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

        {/* Bookings List */}
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? "You haven't made any booking requests yet"
                  : `No ${activeFilter} bookings`}
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/maids')}
              >
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.browseButtonText}>Browse Maids</Text>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchButton: {
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
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  maidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  maidAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  maidDetails: {
    flex: 1,
  },
  maidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  maidNationality: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  messageText: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  respondedText: {
    fontSize: 12,
    color: '#6B7280',
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
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
