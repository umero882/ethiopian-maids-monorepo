/**
 * Add New Maid Screen
 *
 * Multi-step form for adding a new maid to the agency.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';

// GraphQL Mutation
const CREATE_MAID_PROFILE = gql`
  mutation CreateMaidProfile($data: maid_profiles_insert_input!) {
    insert_maid_profiles_one(object: $data) {
      id
      full_name
      nationality
      availability_status
      created_at
    }
  }
`;

// Constants
const NATIONALITIES = [
  'Ethiopian', 'Filipino', 'Indonesian', 'Sri Lankan', 'Indian', 'Kenyan', 'Ugandan', 'Nepalese', 'Bangladeshi', 'Other'
];

const SKILLS = [
  'Cooking', 'Cleaning', 'Childcare', 'Elderly Care', 'Laundry', 'Driving',
  'Pet Care', 'Gardening', 'Ironing', 'Grocery Shopping', 'First Aid', 'Swimming'
];

const LANGUAGES = [
  'English', 'Arabic', 'Amharic', 'Hindi', 'Tagalog', 'Indonesian', 'Swahili', 'French', 'Other'
];

const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];

const RELIGIONS = ['Christianity', 'Islam', 'Hindu', 'Buddhist', 'Other', 'Prefer not to say'];

export default function AddMaidScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    nationality: 'Ethiopian',
    current_location: '',
    phone_number: '',
    marital_status: 'Single',
    religion: '',
    children_count: '0',
    experience_years: '0',
    skills: [] as string[],
    languages: ['English'] as string[],
    preferred_salary_min: '',
    preferred_salary_max: '',
    preferred_currency: 'USD',
    availability_status: 'available',
    about_me: '',
    passport_number: '',
    visa_status: '',
  });

  const totalSteps = 4;

  // Update form field
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle array item
  const toggleArrayItem = (field: 'skills' | 'languages', item: string) => {
    setFormData((prev) => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return { ...prev, [field]: newArray };
    });
  };

  // Pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Validate step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.full_name.trim()) {
          Alert.alert('Required', 'Please enter the maid\'s full name');
          return false;
        }
        if (!formData.nationality) {
          Alert.alert('Required', 'Please select nationality');
          return false;
        }
        return true;
      case 2:
        if (formData.skills.length === 0) {
          Alert.alert('Required', 'Please select at least one skill');
          return false;
        }
        if (formData.languages.length === 0) {
          Alert.alert('Required', 'Please select at least one language');
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  // Next step
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  // Previous step
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to add a maid');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        agency_id: user.uid,
        is_agency_managed: true,
        full_name: formData.full_name.trim(),
        date_of_birth: formData.date_of_birth || null,
        nationality: formData.nationality,
        current_location: formData.current_location || null,
        phone_number: formData.phone_number || null,
        marital_status: formData.marital_status,
        religion: formData.religion || null,
        children_count: parseInt(formData.children_count) || 0,
        experience_years: parseInt(formData.experience_years) || 0,
        skills: formData.skills,
        languages: formData.languages,
        preferred_salary_min: formData.preferred_salary_min ? parseInt(formData.preferred_salary_min) : null,
        preferred_salary_max: formData.preferred_salary_max ? parseInt(formData.preferred_salary_max) : null,
        preferred_currency: formData.preferred_currency,
        availability_status: formData.availability_status,
        about_me: formData.about_me || null,
        passport_number: formData.passport_number || null,
        visa_status: formData.visa_status || null,
        profile_photo_url: profileImage || null,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: CREATE_MAID_PROFILE,
        variables: { data: payload },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      Alert.alert(
        'Success',
        `${formData.full_name} has been added successfully!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('Error creating maid:', err);
      Alert.alert('Error', err.message || 'Failed to add maid');
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Enter the maid's personal details</Text>

            {/* Profile Photo */}
            <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#9CA3AF" />
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.full_name}
                onChangeText={(text) => updateField('full_name', text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.date_of_birth}
                onChangeText={(text) => updateField('date_of_birth', text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Nationality */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nationality *</Text>
              <View style={styles.chipContainer}>
                {NATIONALITIES.map((nat) => (
                  <TouchableOpacity
                    key={nat}
                    style={[styles.chip, formData.nationality === nat && styles.chipActive]}
                    onPress={() => updateField('nationality', nat)}
                  >
                    <Text style={[styles.chipText, formData.nationality === nat && styles.chipTextActive]}>
                      {nat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Current Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Location</Text>
              <TextInput
                style={styles.input}
                placeholder="City, Country"
                value={formData.current_location}
                onChangeText={(text) => updateField('current_location', text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                value={formData.phone_number}
                onChangeText={(text) => updateField('phone_number', text)}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Skills & Experience</Text>
            <Text style={styles.stepSubtitle}>Select skills and languages</Text>

            {/* Skills */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Skills * (select multiple)</Text>
              <View style={styles.chipContainer}>
                {SKILLS.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.chip, formData.skills.includes(skill) && styles.chipActive]}
                    onPress={() => toggleArrayItem('skills', skill)}
                  >
                    <Text style={[styles.chipText, formData.skills.includes(skill) && styles.chipTextActive]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Languages */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Languages * (select multiple)</Text>
              <View style={styles.chipContainer}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.chip, formData.languages.includes(lang) && styles.chipActive]}
                    onPress={() => toggleArrayItem('languages', lang)}
                  >
                    <Text style={[styles.chipText, formData.languages.includes(lang) && styles.chipTextActive]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.experience_years}
                onChangeText={(text) => updateField('experience_years', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Personal Details</Text>
            <Text style={styles.stepSubtitle}>Additional information</Text>

            {/* Marital Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Marital Status</Text>
              <View style={styles.chipContainer}>
                {MARITAL_STATUS.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.chip, formData.marital_status === status && styles.chipActive]}
                    onPress={() => updateField('marital_status', status)}
                  >
                    <Text style={[styles.chipText, formData.marital_status === status && styles.chipTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Religion */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Religion</Text>
              <View style={styles.chipContainer}>
                {RELIGIONS.map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.chip, formData.religion === rel && styles.chipActive]}
                    onPress={() => updateField('religion', rel)}
                  >
                    <Text style={[styles.chipText, formData.religion === rel && styles.chipTextActive]}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Children Count */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of Children</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.children_count}
                onChangeText={(text) => updateField('children_count', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* About */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>About / Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description about the maid..."
                value={formData.about_me}
                onChangeText={(text) => updateField('about_me', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Salary & Status</Text>
            <Text style={styles.stepSubtitle}>Set salary expectations and availability</Text>

            {/* Salary Range */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expected Salary Range (USD/month)</Text>
              <View style={styles.salaryRow}>
                <TextInput
                  style={[styles.input, styles.salaryInput]}
                  placeholder="Min"
                  value={formData.preferred_salary_min}
                  onChangeText={(text) => updateField('preferred_salary_min', text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.salaryDash}>-</Text>
                <TextInput
                  style={[styles.input, styles.salaryInput]}
                  placeholder="Max"
                  value={formData.preferred_salary_max}
                  onChangeText={(text) => updateField('preferred_salary_max', text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Availability Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Availability Status</Text>
              <View style={styles.chipContainer}>
                {[
                  { label: 'Available', value: 'available', color: '#10B981' },
                  { label: 'Pending', value: 'pending', color: '#F59E0B' },
                  { label: 'Placed', value: 'placed', color: '#3B82F6' },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.chip,
                      formData.availability_status === status.value && {
                        backgroundColor: status.color,
                        borderColor: status.color,
                      },
                    ]}
                    onPress={() => updateField('availability_status', status.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.availability_status === status.value && styles.chipTextActive,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Passport Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Passport Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter passport number"
                value={formData.passport_number}
                onChangeText={(text) => updateField('passport_number', text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Visa Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Visa Status</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Valid Work Visa, In Process"
                value={formData.visa_status}
                onChangeText={(text) => updateField('visa_status', text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add New Maid',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>

        {/* Form Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          {currentStep > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          {currentStep < totalSteps ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.nextButtonText}>Add Maid</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  photoUpload: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoText: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  salaryInput: {
    flex: 1,
  },
  salaryDash: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    minWidth: 100,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
