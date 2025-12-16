/**
 * Sponsor Booking Detail Page
 *
 * Shows complete booking details including maid info, dates,
 * and provides actions based on booking status.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL query to get booking details (matches actual schema)
const GET_BOOKING_COMPLETE = gql`
  query GetBookingComplete($id: uuid!) {
    booking_requests_by_pk(id: $id) {
      id
      maid_id
      sponsor_id
      agency_id
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

// Query to get maid profile
const GET_MAID_PROFILE = gql`
  query GetMaidProfile($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      user_id
      full_name
      profile_photo_url
      nationality
      date_of_birth
      gender
      religion
      marital_status
      education_level
      skills
      languages
      experience_years
      availability_status
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
    }
  }
`;

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#F59E0B' },
  accepted: { bg: '#ECFDF5', text: '#10B981' },
  rejected: { bg: '#FEE2E2', text: '#EF4444' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
  completed: { bg: '#EFF6FF', text: '#3B82F6' },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch booking details
  const { data: bookingData, loading: bookingLoading, refetch, error } = useQuery(GET_BOOKING_COMPLETE, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const booking = bookingData?.booking_requests_by_pk;

  // Fetch maid profile when we have maid_id
  const { data: maidData } = useQuery(GET_MAID_PROFILE, {
    variables: { userId: booking?.maid_id },
    skip: !booking?.maid_id,
  });

  const maid = maidData?.maid_profiles?.[0];

  // Mutations
  const [cancelBooking, { loading: cancelling }] = useMutation(CANCEL_BOOKING);
  const [completeBooking, { loading: completing }] = useMutation(COMPLETE_BOOKING);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle cancel booking
  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking({ variables: { id } });
              Alert.alert('Success', 'Booking cancelled successfully');
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  // Handle complete booking
  const handleComplete = () => {
    Alert.alert(
      'Complete Booking',
      'Mark this booking as completed? This indicates the service period has ended.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await completeBooking({ variables: { id } });
              Alert.alert('Success', 'Booking marked as completed');
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to complete booking');
            }
          },
        },
      ]
    );
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format short date
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatAmount = (amount: number | null, currency: string) => {
    if (!amount) return 'Not specified';
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Loading state
  if (bookingLoading && !booking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Booking Not Found</Text>
        <Text style={styles.errorSubtitle}>
          {error?.message || 'Unable to load booking details'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = statusColors[booking.status] || statusColors.pending;
  const maidAge = maid?.date_of_birth ? calculateAge(maid.date_of_birth) : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Booking Details',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                const actions: {
                  text: string;
                  onPress?: () => void;
                  style?: 'cancel' | 'destructive';
                }[] = [];

                if (booking.status === 'pending') {
                  actions.push({
                    text: 'Cancel Request',
                    style: 'destructive',
                    onPress: handleCancel,
                  });
                } else if (booking.status === 'accepted') {
                  actions.push({
                    text: 'Mark as Completed',
                    onPress: handleComplete,
                  });
                  actions.push({
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: handleCancel,
                  });
                }

                if (maid?.user_id) {
                  actions.push({
                    text: 'View Maid Profile',
                    onPress: () => router.push(`/maid/${maid.user_id}`),
                  });
                }

                actions.push({ text: 'Close', style: 'cancel' });

                if (actions.length > 1) {
                  Alert.alert('Booking Actions', '', actions);
                }
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
          <Ionicons
            name={
              booking.status === 'completed'
                ? 'checkmark-circle'
                : booking.status === 'accepted'
                ? 'thumbs-up'
                : booking.status === 'rejected'
                ? 'close-circle'
                : booking.status === 'cancelled'
                ? 'ban'
                : 'time'
            }
            size={24}
            color={statusStyle.text}
          />
          <Text style={[styles.statusBannerText, { color: statusStyle.text }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>

        {/* Maid Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Maid Information</Text>
          <TouchableOpacity
            style={styles.maidCard}
            onPress={() => maid?.user_id && router.push(`/maid/${maid.user_id}`)}
            disabled={!maid?.user_id}
          >
            <View style={styles.maidAvatar}>
              {maid?.profile_photo_url ? (
                <Image source={{ uri: maid.profile_photo_url }} style={styles.maidPhoto} />
              ) : (
                <Text style={styles.avatarText}>{maid?.full_name?.charAt(0) || 'M'}</Text>
              )}
            </View>
            <View style={styles.maidDetails}>
              <Text style={styles.maidName}>{maid?.full_name || 'Unknown Maid'}</Text>
              <View style={styles.maidMeta}>
                {maid?.nationality && (
                  <View style={styles.metaItem}>
                    <Ionicons name="flag-outline" size={12} color="#6B7280" />
                    <Text style={styles.metaText}>{maid.nationality}</Text>
                  </View>
                )}
                {maidAge && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={12} color="#6B7280" />
                    <Text style={styles.metaText}>{maidAge} years</Text>
                  </View>
                )}
                {maid?.experience_years && (
                  <View style={styles.metaItem}>
                    <Ionicons name="briefcase-outline" size={12} color="#6B7280" />
                    <Text style={styles.metaText}>{maid.experience_years}yr exp</Text>
                  </View>
                )}
              </View>
              {maid?.skills && maid.skills.length > 0 && (
                <View style={styles.skillsRow}>
                  {maid.skills.slice(0, 3).map((skill: string, index: number) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {maid.skills.length > 3 && (
                    <Text style={styles.moreSkills}>+{maid.skills.length - 3}</Text>
                  )}
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Booking Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={18} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Requested Start Date</Text>
              <Text style={styles.detailValue}>
                {formatDate(booking.requested_start_date)}
              </Text>
            </View>
          </View>

          {booking.requested_duration_months && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={18} color="#3B82F6" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {booking.requested_duration_months} month
                  {booking.requested_duration_months > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash" size={18} color="#10B981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Offered Salary</Text>
              <Text style={[styles.detailValue, styles.salaryValue]}>
                {formatAmount(booking.offered_salary, booking.currency || 'ETB')}/month
              </Text>
            </View>
          </View>

          {booking.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Your Message</Text>
              <Text style={styles.messageValue}>"{booking.message}"</Text>
            </View>
          )}
        </View>

        {/* Rejection Reason */}
        {booking.rejection_reason && booking.status === 'rejected' && (
          <View style={[styles.card, styles.rejectionCard]}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="information-circle" size={20} color="#EF4444" />
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            </View>
            <Text style={styles.rejectionText}>{booking.rejection_reason}</Text>
          </View>
        )}

        {/* Timeline Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Request Created</Text>
              <Text style={styles.timelineValue}>{formatShortDate(booking.created_at)}</Text>
            </View>
          </View>

          {booking.responded_at && (
            <View style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor:
                      booking.status === 'accepted' ? '#10B981' : '#EF4444',
                  },
                ]}
              />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>
                  {booking.status === 'accepted' ? 'Accepted' : 'Responded'}
                </Text>
                <Text style={styles.timelineValue}>
                  {formatShortDate(booking.responded_at)}
                </Text>
              </View>
            </View>
          )}

          {booking.updated_at !== booking.created_at && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#9CA3AF' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Last Updated</Text>
                <Text style={styles.timelineValue}>{formatShortDate(booking.updated_at)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {booking.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                    Cancel Request
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {booking.status === 'accepted' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={handleComplete}
                disabled={completing}
              >
                {completing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.completeButtonText}>Mark as Completed</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                      Cancel Booking
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* View Maid Profile Button */}
          {maid?.user_id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.contactButton]}
              onPress={() => router.push(`/maid/${maid.user_id}`)}
            >
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
              <Text style={[styles.actionButtonText, styles.contactButtonText]}>
                View Maid Profile
              </Text>
            </TouchableOpacity>
          )}
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
  contentContainer: {
    paddingBottom: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    marginRight: 8,
    padding: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  maidCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maidAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  maidPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  maidDetails: {
    flex: 1,
  },
  maidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  maidMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  skillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  skillText: {
    fontSize: 11,
    color: '#3B82F6',
  },
  moreSkills: {
    fontSize: 11,
    color: '#6B7280',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  salaryValue: {
    color: '#10B981',
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  messageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageValue: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  rejectionText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  timelineValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actionContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  contactButtonText: {
    color: '#3B82F6',
  },
});
