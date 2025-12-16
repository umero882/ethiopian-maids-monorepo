/**
 * Sponsor Profile Edit Screen
 *
 * Allows sponsors to view and edit their complete profile information.
 * Includes all fields from the web app for full CRUD functionality.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';

// GraphQL query to fetch base profile to get user ID
const GET_BASE_PROFILE = gql`
  query GetBaseProfile($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      user_type
    }
  }
`;

// GraphQL query to fetch sponsor profile with all fields by ID
// Using sponsor_profiles table which has String IDs matching Firebase UIDs
const GET_SPONSOR_PROFILE = gql`
  query GetSponsorProfile($userId: String!) {
    sponsor_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      city
      country
      address
      phone_number
      religion
      household_size
      number_of_children
      children_ages
      elderly_care_needed
      pets
      pet_types
      accommodation_type
      preferred_nationality
      preferred_experience_years
      required_skills
      preferred_languages
      salary_budget_min
      salary_budget_max
      currency
      live_in_required
      working_hours_per_day
      days_off_per_week
      overtime_available
      additional_benefits
      identity_verified
      background_check_completed
      active_job_postings
      total_hires
      average_rating
      avatar_url
    }
  }
`;

// GraphQL mutation to update sponsor profile
// Using sponsor_profiles table which has String IDs matching Firebase UIDs
const UPDATE_SPONSOR_PROFILE = gql`
  mutation UpdateSponsorProfile($id: String!, $data: sponsor_profiles_set_input!) {
    update_sponsor_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      city
      country
      address
      phone_number
      religion
      household_size
      number_of_children
      children_ages
      elderly_care_needed
      pets
      pet_types
      accommodation_type
      preferred_nationality
      preferred_experience_years
      required_skills
      preferred_languages
      salary_budget_min
      salary_budget_max
      currency
      live_in_required
      working_hours_per_day
      days_off_per_week
      overtime_available
      additional_benefits
    }
  }
`;

interface ProfileData {
  id: string;
  full_name: string;
  city: string;
  country: string;
  address: string;
  phone_number: string;
  religion: string;
  household_size: number;
  number_of_children: number;
  children_ages: string[];
  elderly_care_needed: boolean;
  pets: boolean;
  pet_types: string[];
  accommodation_type: string;
  preferred_nationality: string[];
  preferred_experience_years: number;
  required_skills: string[];
  preferred_languages: string[];
  salary_budget_min: number | null;
  salary_budget_max: number | null;
  currency: string;
  live_in_required: boolean;
  working_hours_per_day: number;
  days_off_per_week: number;
  overtime_available: boolean;
  additional_benefits: string[];
  identity_verified: boolean;
  background_check_completed: boolean;
  active_job_postings: number;
  total_hires: number;
  average_rating: number;
  avatar_url: string;
}

export default function SponsorProfileScreen() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editedData, setEditedData] = useState<Partial<ProfileData>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('[SponsorProfile] Base profile data:', JSON.stringify(data));
      const baseProfile = data?.profiles?.[0];
      if (baseProfile?.id) {
        console.log('[SponsorProfile] Found base profile ID:', baseProfile.id);
        setUserId(baseProfile.id);
      } else {
        console.log('[SponsorProfile] No base profile found');
      }
    },
    onError: (error) => {
      console.error('[SponsorProfile] Base profile error:', error);
    },
  });

  const [fetchProfile, { loading, error }] = useLazyQuery(GET_SPONSOR_PROFILE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('[SponsorProfile] Sponsor profile data:', JSON.stringify(data));
      const profile = data?.sponsor_profiles?.[0];
      if (profile) {
        console.log('[SponsorProfile] Found sponsor profile:', profile.full_name);
        setProfileData(profile);
        setEditedData(profile);
      } else {
        console.log('[SponsorProfile] No sponsor profile found for user');
      }
    },
    onError: (error) => {
      console.error('[SponsorProfile] Sponsor profile error:', error);
    },
  });

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_SPONSOR_PROFILE, {
    onCompleted: () => {
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      if (userId) {
        fetchProfile({ variables: { userId } });
      }
    },
    onError: (err) => {
      Alert.alert('Error', err.message || 'Failed to update profile');
    },
  });

  // Step 1: Fetch base profile to get user ID
  useEffect(() => {
    if (user?.email) {
      fetchBaseProfile({ variables: { email: user.email } });
    }
  }, [user?.email]);

  // Step 2: Fetch sponsor profile when we have user ID
  useEffect(() => {
    if (userId) {
      fetchProfile({ variables: { userId } });
    }
  }, [userId]);

  const handleSave = () => {
    if (!profileData?.id) return;

    updateProfile({
      variables: {
        id: profileData.id,
        data: {
          full_name: editedData.full_name,
          city: editedData.city,
          country: editedData.country,
          address: editedData.address,
          phone_number: editedData.phone_number,
          religion: editedData.religion,
          household_size: editedData.household_size,
          number_of_children: editedData.number_of_children,
          children_ages: editedData.children_ages,
          elderly_care_needed: editedData.elderly_care_needed,
          pets: editedData.pets,
          pet_types: editedData.pet_types,
          accommodation_type: editedData.accommodation_type,
          preferred_nationality: editedData.preferred_nationality,
          preferred_experience_years: editedData.preferred_experience_years,
          required_skills: editedData.required_skills,
          preferred_languages: editedData.preferred_languages,
          salary_budget_min: editedData.salary_budget_min,
          salary_budget_max: editedData.salary_budget_max,
          currency: editedData.currency,
          live_in_required: editedData.live_in_required,
          working_hours_per_day: editedData.working_hours_per_day,
          days_off_per_week: editedData.days_off_per_week,
          overtime_available: editedData.overtime_available,
          additional_benefits: editedData.additional_benefits,
        },
      },
    });
  };

  const handleCancel = () => {
    setEditedData(profileData || {});
    setIsEditing(false);
  };

  const handleArrayInput = (field: keyof ProfileData, text: string) => {
    const array = text.split(',').map(item => item.trim()).filter(Boolean);
    setEditedData({ ...editedData, [field]: array });
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      handlePhotoUpdate(asset);
    }
  };

  const takePhoto = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take a profile picture.');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      handlePhotoUpdate(asset);
    }
  };

  const handlePhotoUpdate = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!profileData?.id) return;

    setUploadingPhoto(true);
    try {
      // Create data URL from base64
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;

      // Update profile with new avatar URL
      await updateProfile({
        variables: {
          id: profileData.id,
          data: {
            avatar_url: dataUrl,
          },
        },
      });

      // Update local state
      setEditedData({ ...editedData, avatar_url: dataUrl });
      setProfileData({ ...profileData, avatar_url: dataUrl });
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchProfile({ variables: { email: user?.email } })}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.headerButton}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={showPhotoOptions} style={styles.avatarContainer}>
              {editedData.avatar_url || profileData?.avatar_url ? (
                <Image
                  source={{ uri: editedData.avatar_url || profileData?.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {editedData.full_name?.charAt(0) || user?.email?.charAt(0) || 'S'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{editedData.full_name || 'Sponsor'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            {/* Account Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileData?.total_hires || 0}</Text>
                <Text style={styles.statLabel}>Hires</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileData?.active_job_postings || 0}</Text>
                <Text style={styles.statLabel}>Active Jobs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profileData?.average_rating ? profileData.average_rating.toFixed(1) : '-'}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Full Name *</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedData.full_name || ''}
                    onChangeText={(text) => setEditedData({ ...editedData, full_name: text })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.full_name || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedData.phone_number || ''}
                    onChangeText={(text) => setEditedData({ ...editedData, phone_number: text })}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.phone_number || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Religion</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedData.religion || ''}
                    onChangeText={(text) => setEditedData({ ...editedData, religion: text })}
                    placeholder="Enter religion"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.religion || 'Not set'}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Address</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editedData.address || ''}
                    onChangeText={(text) => setEditedData({ ...editedData, address: text })}
                    placeholder="Enter your address"
                    multiline
                    numberOfLines={2}
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.address || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>City *</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedData.city || ''}
                    onChangeText={(text) => setEditedData({ ...editedData, city: text })}
                    placeholder="Enter city"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.city || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Country *</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedData.country || ''}
                    onChangeText={(text) => setEditedData({ ...editedData, country: text })}
                    placeholder="Enter country"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.country || 'Not set'}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Family Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family Information</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Household Size</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={String(editedData.household_size || '')}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, household_size: parseInt(text) || 0 })
                    }
                    placeholder="Number of household members"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.household_size || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Number of Children</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={String(editedData.number_of_children || '')}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, number_of_children: parseInt(text) || 0 })
                    }
                    placeholder="Number of children"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.number_of_children || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Children Ages</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={(editedData.children_ages || []).join(', ')}
                    onChangeText={(text) => handleArrayInput('children_ages', text)}
                    placeholder="e.g., 5, 8, 12"
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.children_ages?.length ? profileData.children_ages.join(', ') : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.switchField}>
                <Text style={styles.label}>Elderly Care Needed</Text>
                {isEditing ? (
                  <Switch
                    value={editedData.elderly_care_needed || false}
                    onValueChange={(value) =>
                      setEditedData({ ...editedData, elderly_care_needed: value })
                    }
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={editedData.elderly_care_needed ? '#3B82F6' : '#F3F4F6'}
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.elderly_care_needed ? 'Yes' : 'No'}
                  </Text>
                )}
              </View>

              <View style={styles.switchField}>
                <Text style={styles.label}>Have Pets</Text>
                {isEditing ? (
                  <Switch
                    value={editedData.pets || false}
                    onValueChange={(value) =>
                      setEditedData({ ...editedData, pets: value })
                    }
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={editedData.pets ? '#3B82F6' : '#F3F4F6'}
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.pets ? 'Yes' : 'No'}</Text>
                )}
              </View>

              {(editedData.pets || profileData?.pets) && (
                <View style={styles.field}>
                  <Text style={styles.label}>Pet Types</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={(editedData.pet_types || []).join(', ')}
                      onChangeText={(text) => handleArrayInput('pet_types', text)}
                      placeholder="e.g., Dog, Cat"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {profileData?.pet_types?.length ? profileData.pet_types.join(', ') : 'Not set'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Maid Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maid Preferences</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Preferred Nationality</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={(editedData.preferred_nationality || []).join(', ')}
                    onChangeText={(text) => handleArrayInput('preferred_nationality', text)}
                    placeholder="e.g., Ethiopian, Filipino"
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.preferred_nationality?.length
                      ? profileData.preferred_nationality.join(', ')
                      : 'Any'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Preferred Experience (Years)</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={String(editedData.preferred_experience_years || '')}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, preferred_experience_years: parseInt(text) || 0 })
                    }
                    placeholder="Minimum years of experience"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.preferred_experience_years
                      ? `${profileData.preferred_experience_years}+ years`
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Required Skills</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={(editedData.required_skills || []).join(', ')}
                    onChangeText={(text) => handleArrayInput('required_skills', text)}
                    placeholder="e.g., Cooking, Cleaning, Childcare"
                    multiline
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.required_skills?.length
                      ? profileData.required_skills.join(', ')
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Preferred Languages</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={(editedData.preferred_languages || []).join(', ')}
                    onChangeText={(text) => handleArrayInput('preferred_languages', text)}
                    placeholder="e.g., English, Arabic"
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.preferred_languages?.length
                      ? profileData.preferred_languages.join(', ')
                      : 'Not set'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Work Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Conditions</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Accommodation Type</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedData.accommodation_type || ''}
                    onChangeText={(text) => setEditedData({ ...editedData, accommodation_type: text })}
                    placeholder="e.g., Apartment, Villa"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.accommodation_type || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.switchField}>
                <Text style={styles.label}>Live-in Required</Text>
                {isEditing ? (
                  <Switch
                    value={editedData.live_in_required || false}
                    onValueChange={(value) =>
                      setEditedData({ ...editedData, live_in_required: value })
                    }
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={editedData.live_in_required ? '#3B82F6' : '#F3F4F6'}
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.live_in_required ? 'Yes' : 'No'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Working Hours/Day</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={String(editedData.working_hours_per_day || '')}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, working_hours_per_day: parseInt(text) || 0 })
                    }
                    placeholder="e.g., 8"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.working_hours_per_day
                      ? `${profileData.working_hours_per_day} hours`
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Days Off/Week</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={String(editedData.days_off_per_week || '')}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, days_off_per_week: parseInt(text) || 0 })
                    }
                    placeholder="e.g., 1"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.days_off_per_week !== undefined
                      ? `${profileData.days_off_per_week} days`
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.switchField}>
                <Text style={styles.label}>Overtime Available</Text>
                {isEditing ? (
                  <Switch
                    value={editedData.overtime_available || false}
                    onValueChange={(value) =>
                      setEditedData({ ...editedData, overtime_available: value })
                    }
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={editedData.overtime_available ? '#3B82F6' : '#F3F4F6'}
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.overtime_available ? 'Yes' : 'No'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salary Budget</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Currency</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedData.currency || 'USD'}
                    onChangeText={(text) => setEditedData({ ...editedData, currency: text })}
                    placeholder="e.g., USD, AED"
                  />
                ) : (
                  <Text style={styles.value}>{profileData?.currency || 'USD'}</Text>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Min Salary</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={String(editedData.salary_budget_min || '')}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, salary_budget_min: parseInt(text) || null })
                      }
                      placeholder="Min"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.value}>{profileData?.salary_budget_min || 'Not set'}</Text>
                  )}
                </View>
                <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Max Salary</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={String(editedData.salary_budget_max || '')}
                      onChangeText={(text) =>
                        setEditedData({ ...editedData, salary_budget_max: parseInt(text) || null })
                      }
                      placeholder="Max"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.value}>{profileData?.salary_budget_max || 'Not set'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Additional Benefits</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={(editedData.additional_benefits || []).join(', ')}
                    onChangeText={(text) => handleArrayInput('additional_benefits', text)}
                    placeholder="e.g., Health Insurance, Air Tickets"
                    multiline
                  />
                ) : (
                  <Text style={styles.value}>
                    {profileData?.additional_benefits?.length
                      ? profileData.additional_benefits.join(', ')
                      : 'Not set'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Account Status (Read-only) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Status</Text>
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Ionicons
                    name={profileData?.identity_verified ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={profileData?.identity_verified ? '#10B981' : '#9CA3AF'}
                  />
                  <Text style={styles.statusLabel}>Identity Verified</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons
                    name={profileData?.background_check_completed ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={profileData?.background_check_completed ? '#10B981' : '#9CA3AF'}
                  />
                  <Text style={styles.statusLabel}>Background Check</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cancel Button when editing */}
          {isEditing && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
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
  headerButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  field: {
    marginBottom: 16,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
