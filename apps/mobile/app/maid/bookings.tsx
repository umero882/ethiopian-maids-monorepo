/**
 * Maid Bookings Page
 *
 * Fully synced with web MaidBookingsPage.jsx
 * Shows: Tabs (All, Pending, Accepted, Rejected), Booking list, Details modal, Accept/Reject actions
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../hooks';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';

// GraphQL Queries
const GET_MAID_BOOKINGS = gql`
  query GetMaidBookings($maidId: String!) {
    booking_requests(
      where: { maid_id: { _eq: $maidId } }
      order_by: { created_at: desc }
    ) {
      id
      sponsor_id
      maid_id
      status
      message
      requested_start_date
      requested_duration_months
      offered_salary
      amount
      currency
      rejection_reason
      created_at
      updated_at
      responded_at
    }
  }
`;

// Query to get sponsor profile info - query profiles with sponsor_profile relationship
const GET_SPONSOR_PROFILES = gql`
  query GetSponsorProfiles($sponsorIds: [String!]!) {
    profiles(where: { id: { _in: $sponsorIds } }) {
      id
      email
      full_name
      phone
      sponsor_profile {
        id
        full_name
        phone_number
        city
        country
      }
    }
  }
`;

const UPDATE_BOOKING_STATUS = gql`
  mutation UpdateBookingStatus($id: uuid!, $status: String!) {
    update_booking_requests_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, updated_at: "now()" }
    ) {
      id
      status
      updated_at
    }
  }
`;

// Get base profile query
const GET_BASE_PROFILE = gql`
  query GetBaseProfile($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      user_type
    }
  }
`;

type BookingStatus = 'all' | 'pending' | 'accepted' | 'rejected';

interface Booking {
  id: string;
  sponsor_id: string;
  maid_id: string;
  status: string;
  message: string | null;
  requested_start_date: string | null;
  requested_duration_months: number | null;
  offered_salary: number | null;
  amount: number | null;
  currency: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

interface SponsorProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  sponsor_profile: {
    id: string;
    full_name: string;
    phone_number: string | null;
    city: string | null;
    country: string | null;
  } | null;
}

export default function MaidBookingsScreen() {
  const { user } = useAuth();
  const { count: unreadNotifications } = useUnreadNotificationCount();
  const [activeTab, setActiveTab] = useState<BookingStatus>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Persistent state for sponsor profiles - using useState to trigger re-renders
  const [sponsorProfilesCache, setSponsorProfilesCache] = useState<Record<string, SponsorProfile>>({});

  // Get base profile to get user ID
  const { data: profileData } = useQuery(GET_BASE_PROFILE, {
    variables: { email: user?.email },
    skip: !user?.email,
  });

  const userId = profileData?.profiles?.[0]?.id;

  // Fetch bookings
  const { data, loading, refetch } = useQuery(GET_MAID_BOOKINGS, {
    variables: { maidId: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const bookings: Booking[] = data?.booking_requests || [];

  // Get unique sponsor IDs from bookings - memoized to prevent unnecessary refetches
  const sponsorIds = useMemo(() => {
    const ids = [...new Set(bookings.map(b => b.sponsor_id).filter(Boolean))];
    return ids;
  }, [bookings]);

  // Fetch sponsor profiles - use cache-first to avoid refetch issues
  const { data: sponsorData, refetch: refetchSponsors } = useQuery(GET_SPONSOR_PROFILES, {
    variables: { sponsorIds },
    skip: sponsorIds.length === 0,
    fetchPolicy: 'cache-first', // Changed from cache-and-network to prevent overwrites
  });

  // Update sponsor cache when new data arrives - MERGE, never replace
  useEffect(() => {
    if (sponsorData?.profiles && sponsorData.profiles.length > 0) {
      setSponsorProfilesCache(prev => {
        const updated = { ...prev };
        sponsorData.profiles.forEach((sp: SponsorProfile) => {
          updated[sp.id] = sp;
        });
        return updated;
      });
    }
  }, [sponsorData]);

  // Use the cached sponsor profiles - this map is stable and only grows
  const sponsorProfiles = sponsorProfilesCache;

  // Update booking status mutation
  const [updateBookingStatus, { loading: updating }] = useMutation(UPDATE_BOOKING_STATUS, {
    refetchQueries: [{ query: GET_MAID_BOOKINGS, variables: { maidId: userId } }],
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    // Also refetch sponsor profiles if we have sponsor IDs
    if (sponsorIds.length > 0) {
      await refetchSponsors();
    }
    setRefreshing(false);
  }, [refetch, refetchSponsors, sponsorIds.length]);

  const handleAcceptBooking = async (bookingId: string) => {
    Alert.alert(
      'Accept Booking',
      'Are you sure you want to accept this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              await updateBookingStatus({
                variables: { id: bookingId, status: 'accepted' },
              });
              Alert.alert('Success', 'Booking request accepted successfully.');
              if (selectedBooking?.id === bookingId) {
                setSelectedBooking({ ...selectedBooking, status: 'accepted' });
              }
            } catch (err) {
              console.error('Error accepting booking:', err);
              Alert.alert('Error', 'Failed to accept booking. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = async (bookingId: string) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateBookingStatus({
                variables: { id: bookingId, status: 'rejected' },
              });
              Alert.alert('Success', 'Booking request rejected.');
              if (selectedBooking?.id === bookingId) {
                setSelectedBooking({ ...selectedBooking, status: 'rejected' });
              }
            } catch (err) {
              console.error('Error rejecting booking:', err);
              Alert.alert('Error', 'Failed to reject booking. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFullDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', label: 'Pending' };
      case 'accepted':
        return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46', label: 'Accepted' };
      case 'rejected':
        return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B', label: 'Rejected' };
      default:
        return { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151', label: 'Unknown' };
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter((booking) => booking.status === activeTab);

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  const tabs: { key: BookingStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
  ];

  if (loading && !refreshing && bookings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading booking requests...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Booking Requests',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerRight: () => (
            <View style={styles.headerRight}>
              {/* Pending Bookings Badge */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setActiveTab('pending')}
              >
                <Ionicons name="time-outline" size={24} color="#F59E0B" />
                {pendingCount > 0 && (
                  <View style={[styles.notificationBadge, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.notificationBadgeText}>
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Notifications Badge */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color="#8B5CF6" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Booking Requests</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} Pending</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bookings List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
          }
        >
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No booking requests</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'all'
                  ? "You don't have any booking requests at the moment."
                  : activeTab === 'pending'
                  ? "You don't have any pending booking requests."
                  : activeTab === 'accepted'
                  ? "You don't have any accepted bookings."
                  : "You don't have any rejected booking requests."}
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking) => {
              const status = getStatusBadge(booking.status);
              const sponsor = sponsorProfiles[booking.sponsor_id];
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => handleViewDetails(booking)}
                >
                  <View style={styles.bookingHeader}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.sponsorName}>
                        {sponsor?.sponsor_profile?.full_name || sponsor?.full_name || sponsor?.email?.split('@')[0] || 'Unknown Sponsor'}
                      </Text>
                      <Text style={styles.bookingType}>
                        {booking.offered_salary ? `Offered: ${booking.offered_salary} ${booking.currency || 'ETB'}` : 'Booking Request'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
                      <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{formatDate(booking.requested_start_date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {booking.requested_duration_months ? `${booking.requested_duration_months} months` : 'Duration not specified'}
                      </Text>
                    </View>
                  </View>

                  {booking.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectBooking(booking.id)}
                        disabled={updating}
                      >
                        <Ionicons name="close" size={16} color="#DC2626" />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptBooking(booking.id)}
                        disabled={updating}
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Booking Details Modal */}
        <Modal
          visible={showDetailsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (() => {
              const selectedSponsor = sponsorProfiles[selectedBooking.sponsor_id];
              return (
              <ScrollView style={styles.modalContent}>
                {/* Sponsor Info */}
                <View style={styles.sponsorSection}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(selectedSponsor?.sponsor_profile?.full_name || selectedSponsor?.full_name || selectedSponsor?.email)?.charAt(0)?.toUpperCase() || 'S'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.sponsorNameLarge}>
                        {selectedSponsor?.sponsor_profile?.full_name || selectedSponsor?.full_name || selectedSponsor?.email?.split('@')[0] || 'Unknown Sponsor'}
                      </Text>
                      <View style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: getStatusBadge(selectedBooking.status).bg }
                      ]}>
                        <Text style={[
                          styles.statusTextLarge,
                          { color: getStatusBadge(selectedBooking.status).text }
                        ]}>
                          {getStatusBadge(selectedBooking.status).label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Contact Info */}
                  <View style={styles.contactSection}>
                    {selectedSponsor?.email && (
                      <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`mailto:${selectedSponsor?.email}`)}
                      >
                        <Ionicons name="mail-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactLink}>{selectedSponsor?.email}</Text>
                      </TouchableOpacity>
                    )}
                    {(selectedSponsor?.sponsor_profile?.phone_number || selectedSponsor?.phone) && (
                      <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText}>{selectedSponsor?.sponsor_profile?.phone_number || selectedSponsor?.phone}</Text>
                      </View>
                    )}
                    {(selectedSponsor?.sponsor_profile?.city || selectedSponsor?.sponsor_profile?.country) && (
                      <View style={styles.contactRow}>
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText}>{[selectedSponsor?.sponsor_profile?.city, selectedSponsor?.sponsor_profile?.country].filter(Boolean).join(', ')}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Booking Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Booking Details</Text>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailItemRow}>
                        <Ionicons name="calendar" size={18} color="#6B7280" />
                        <View>
                          <Text style={styles.detailLabel}>Start Date</Text>
                          <Text style={styles.detailValue}>{formatFullDate(selectedBooking.requested_start_date)}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <View style={styles.detailItemRow}>
                        <Ionicons name="time" size={18} color="#6B7280" />
                        <View>
                          <Text style={styles.detailLabel}>Duration</Text>
                          <Text style={styles.detailValue}>{selectedBooking.requested_duration_months ? `${selectedBooking.requested_duration_months} months` : 'Not specified'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Offered Salary</Text>
                    <Text style={styles.detailValueLarge}>{selectedBooking.offered_salary ? `${selectedBooking.offered_salary} ${selectedBooking.currency || 'ETB'}` : 'Not specified'}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Message</Text>
                    <Text style={styles.detailValue}>
                      {selectedBooking.message || 'No message provided'}
                    </Text>
                  </View>

                  {selectedBooking.rejection_reason && selectedBooking.status === 'rejected' && (
                    <View style={styles.notesBlock}>
                      <Text style={styles.detailLabel}>Rejection Reason</Text>
                      <View style={styles.notesContent}>
                        <Text style={styles.notesText}>{selectedBooking.rejection_reason}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {selectedBooking.status === 'pending' ? (
                    <>
                      <TouchableOpacity
                        style={styles.modalRejectButton}
                        onPress={() => handleRejectBooking(selectedBooking.id)}
                        disabled={updating}
                      >
                        <Ionicons name="close" size={18} color="#DC2626" />
                        <Text style={styles.modalRejectText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalAcceptButton}
                        onPress={() => handleAcceptBooking(selectedBooking.id)}
                        disabled={updating}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.modalAcceptText}>Accept</Text>
                      </TouchableOpacity>
                    </>
                  ) : selectedBooking.status === 'accepted' ? (
                    <View style={styles.contactOptions}>
                      <Text style={styles.contactOptionsTitle}>Contact Options</Text>
                      <View style={styles.contactButtonsRow}>
                        {selectedSponsor?.email && (
                          <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => Linking.openURL(`mailto:${selectedSponsor?.email}`)}
                          >
                            <Ionicons name="mail-outline" size={18} color="#374151" />
                            <Text style={styles.contactButtonText}>Email</Text>
                          </TouchableOpacity>
                        )}
                        {(selectedSponsor?.sponsor_profile?.phone_number || selectedSponsor?.phone) && (
                          <>
                            <TouchableOpacity
                              style={styles.contactButton}
                              onPress={() => Linking.openURL(`https://wa.me/${(selectedSponsor?.sponsor_profile?.phone_number || selectedSponsor?.phone)?.replace(/[^0-9]/g, '')}`)}
                            >
                              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                              <Text style={styles.contactButtonText}>WhatsApp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.contactButton}
                              onPress={() => Linking.openURL(`tel:${selectedSponsor?.sponsor_profile?.phone_number || selectedSponsor?.phone}`)}
                            >
                              <Ionicons name="call-outline" size={18} color="#374151" />
                              <Text style={styles.contactButtonText}>Call</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowDetailsModal(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            );
            })()}
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  pendingBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 12,
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  bookingType: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  rejectButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    gap: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
  },

  // Sponsor Section
  sponsorSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1E40AF',
  },
  sponsorNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  statusTextLarge: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactLink: {
    fontSize: 14,
    color: '#2563EB',
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
  },

  // Details Section
  detailsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  detailValueLarge: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailBlock: {
    marginBottom: 16,
  },
  notesBlock: {
    marginTop: 8,
  },
  notesContent: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Modal Actions
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginBottom: 12,
    gap: 8,
  },
  modalRejectText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  modalAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    gap: 8,
  },
  modalAcceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },

  // Contact Options
  contactOptions: {},
  contactOptionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
