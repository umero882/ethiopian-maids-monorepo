/**
 * Maid Details View Screen
 * Shows detailed information about a specific maid for agency management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL Queries
const GET_MAID_DETAILS = gql`
  query GetMaidDetails($id: String!) {
    maid_profiles_by_pk(id: $id) {
      id
      full_name
      nationality
      current_location
      experience_years
      skills
      languages
      availability_status
      verification_status
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      profile_photo_url
      phone_number
      date_of_birth
      marital_status
      religion
      education_level
      about_me
      agency_id
      created_at
      updated_at
    }
  }
`;

const UPDATE_MAID_STATUS = gql`
  mutation UpdateMaidStatus($id: String!, $status: String!) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { availability_status: $status, updated_at: "now()" }
    ) {
      id
      availability_status
    }
  }
`;

const DELETE_MAID = gql`
  mutation DeleteMaid($id: String!) {
    delete_maid_profiles_by_pk(id: $id) {
      id
    }
  }
`;

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: '#10B981', icon: 'checkmark-circle' },
  { value: 'placed', label: 'Placed', color: '#3B82F6', icon: 'briefcase' },
  { value: 'pending', label: 'Pending', color: '#F59E0B', icon: 'time' },
  { value: 'unavailable', label: 'Unavailable', color: '#6B7280', icon: 'close-circle' },
];

export default function MaidDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_MAID_DETAILS, {
    variables: { id },
    skip: !id,
  });

  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_MAID_STATUS, {
    onCompleted: () => {
      Alert.alert('Success', 'Maid status updated successfully');
      refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const [deleteMaid, { loading: deleting }] = useMutation(DELETE_MAID, {
    onCompleted: () => {
      Alert.alert('Success', 'Maid deleted successfully');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const maid = data?.maid_profiles_by_pk;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleStatusChange = (status: string) => {
    setShowStatusModal(false);
    updateStatus({ variables: { id, status } });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Maid',
      `Are you sure you want to delete ${maid?.full_name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMaid({ variables: { id } }),
        },
      ]
    );
  };

  const handleCall = () => {
    if (maid?.phone_number) {
      Linking.openURL(`tel:${maid.phone_number}`);
    }
  };

  const handleWhatsApp = () => {
    if (maid?.phone_number) {
      const phone = maid.phone_number.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${phone}`);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[3];
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return { color: '#10B981', icon: 'shield-checkmark', label: 'Verified' };
      case 'pending':
        return { color: '#F59E0B', icon: 'time', label: 'Pending Verification' };
      default:
        return { color: '#6B7280', icon: 'shield-outline', label: 'Not Verified' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dob: string) => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading maid details...</Text>
      </View>
    );
  }

  if (error || !maid) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load maid details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = getStatusConfig(maid.availability_status);
  const verificationBadge = getVerificationBadge(maid.verification_status);
  const age = calculateAge(maid.date_of_birth);

  return (
    <>
      <Stack.Screen
        options={{
          title: maid.full_name || 'Maid Details',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(`/agency/maids/${id}/edit`)}
              >
                <Ionicons name="create-outline" size={24} color="#F97316" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.photoContainer}>
            {maid.profile_photo_url ? (
              <Image source={{ uri: maid.profile_photo_url }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={60} color="#9CA3AF" />
              </View>
            )}
            <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
          </View>

          <Text style={styles.name}>{maid.full_name}</Text>
          <Text style={styles.subtitle}>
            {maid.nationality} • {maid.experience_years || 0} years experience
          </Text>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <Text style={[styles.badgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: verificationBadge.color + '20' }]}>
              <Ionicons name={verificationBadge.icon as any} size={14} color={verificationBadge.color} />
              <Text style={[styles.badgeText, { color: verificationBadge.color }]}>
                {verificationBadge.label}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#10B981' }]}
              onPress={handleCall}
              disabled={!maid.phone_number}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#25D366' }]}
              onPress={handleWhatsApp}
              disabled={!maid.phone_number}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F97316' }]}
              onPress={() => setShowStatusModal(true)}
            >
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Salary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Salary</Text>
          <View style={styles.salaryCard}>
            <Ionicons name="cash-outline" size={24} color="#F97316" />
            <Text style={styles.salaryText}>
              {maid.preferred_currency || 'SAR'} {maid.preferred_salary_min || 0} - {maid.preferred_salary_max || 0}
            </Text>
            <Text style={styles.salaryPeriod}>/month</Text>
          </View>
        </View>

        {/* About Section */}
        {maid.about_me ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{maid.about_me}</Text>
          </View>
        ) : null}

        {/* Skills Section */}
        {maid.skills && maid.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.chipsContainer}>
              {maid.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Languages Section */}
        {maid.languages && maid.languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.chipsContainer}>
              {maid.languages.map((lang: string, index: number) => (
                <View key={index} style={[styles.chip, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="language" size={14} color="#3B82F6" />
                  <Text style={[styles.chipText, { color: '#3B82F6' }]}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{age ? `${age} years` : 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{maid.current_location || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="heart-outline" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Marital Status</Text>
                <Text style={styles.detailValue}>{maid.marital_status || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="book-outline" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Religion</Text>
                <Text style={styles.detailValue}>{maid.religion || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="school-outline" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Education</Text>
                <Text style={styles.detailValue}>{maid.education_level || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{maid.phone_number || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Info</Text>
          <View style={styles.timestampRow}>
            <View style={styles.timestampItem}>
              <Ionicons name="add-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.timestampLabel}>Created:</Text>
              <Text style={styles.timestampValue}>{formatDate(maid.created_at)}</Text>
            </View>
            <View style={styles.timestampItem}>
              <Ionicons name="refresh-outline" size={16} color="#6B7280" />
              <Text style={styles.timestampLabel}>Updated:</Text>
              <Text style={styles.timestampValue}>{formatDate(maid.updated_at)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Status Change Modal */}
      {showStatusModal ? (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Status</Text>
            <Text style={styles.modalSubtitle}>Select new availability status</Text>

            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusOption,
                  maid.availability_status === status.value && styles.statusOptionActive,
                ]}
                onPress={() => handleStatusChange(status.value)}
                disabled={updatingStatus}
              >
                <View style={[styles.statusIconContainer, { backgroundColor: status.color + '20' }]}>
                  <Ionicons name={status.icon as any} size={24} color={status.color} />
                </View>
                <Text style={styles.statusOptionText}>{status.label}</Text>
                {maid.availability_status === status.value ? (
                  <Ionicons name="checkmark-circle" size={24} color="#F97316" />
                ) : null}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Loading Overlay */}
      {(updatingStatus || deleting) ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : null}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F97316',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  salaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  salaryText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
  },
  salaryPeriod: {
    fontSize: 14,
    color: '#9A6A3E',
  },
  bioText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  physicalRow: {
    flexDirection: 'row',
    gap: 16,
  },
  physicalItem: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  physicalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  physicalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  timestampRow: {
    gap: 8,
  },
  timestampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestampLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  timestampValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    gap: 12,
  },
  statusOptionActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelButton: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
