/**
 * Edit Maid Screen
 * 4-step wizard for editing maid profile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gql, useQuery, useMutation } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';

// GraphQL Queries & Mutations
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
    }
  }
`;

const UPDATE_MAID_PROFILE = gql`
  mutation UpdateMaidProfile($id: String!, $data: maid_profiles_set_input!) {
    update_maid_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      nationality
      availability_status
      updated_at
    }
  }
`;

// Constants
const NATIONALITIES = [
  'Ethiopian', 'Filipino', 'Indonesian', 'Sri Lankan', 'Bangladeshi',
  'Indian', 'Nepali', 'Kenyan', 'Ugandan', 'Ghanaian'
];

const SKILLS = [
  'Cooking', 'Cleaning', 'Childcare', 'Elderly Care', 'Laundry',
  'Ironing', 'Driving', 'Pet Care', 'Gardening', 'Tutoring',
  'First Aid', 'Special Needs Care'
];

const LANGUAGES = [
  'English', 'Arabic', 'Amharic', 'Tagalog', 'Hindi',
  'Urdu', 'Bengali', 'Indonesian', 'French', 'Swahili'
];

const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];

const RELIGIONS = ['Christian', 'Muslim', 'Hindu', 'Buddhist', 'Other'];

const EDUCATION_LEVELS = [
  'No Formal Education', 'Primary School', 'Secondary School',
  'High School', 'Vocational Training', 'College/University'
];

const AVAILABILITY_STATUSES = [
  { value: 'available', label: 'Available', color: '#10B981' },
  { value: 'placed', label: 'Placed', color: '#3B82F6' },
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'unavailable', label: 'Unavailable', color: '#6B7280' },
];

const CURRENCIES = ['SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'USD', 'ETB'];

const STEPS = [
  { id: 1, title: 'Basic Info', icon: 'person-outline' },
  { id: 2, title: 'Skills', icon: 'construct-outline' },
  { id: 3, title: 'Personal', icon: 'heart-outline' },
  { id: 4, title: 'Salary', icon: 'cash-outline' },
];

interface FormData {
  full_name: string;
  nationality: string;
  current_location: string;
  phone_number: string;
  experience_years: string;
  about_me: string;
  skills: string[];
  languages: string[];
  marital_status: string;
  religion: string;
  date_of_birth: string;
  education_level: string;
  preferred_salary_min: string;
  preferred_salary_max: string;
  preferred_currency: string;
  availability_status: string;
  profile_photo_url: string;
}

export default function EditMaidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    nationality: '',
    current_location: '',
    phone_number: '',
    experience_years: '',
    about_me: '',
    skills: [],
    languages: [],
    marital_status: '',
    religion: '',
    date_of_birth: '',
    education_level: '',
    preferred_salary_min: '',
    preferred_salary_max: '',
    preferred_currency: 'SAR',
    availability_status: 'available',
    profile_photo_url: '',
  });

  const { data, loading: loadingMaid, error } = useQuery(GET_MAID_DETAILS, {
    variables: { id },
    skip: !id,
    onCompleted: (data) => {
      const maid = data.maid_profiles_by_pk;
      if (maid) {
        setFormData({
          full_name: maid.full_name || '',
          nationality: maid.nationality || '',
          current_location: maid.current_location || '',
          phone_number: maid.phone_number || '',
          experience_years: maid.experience_years?.toString() || '',
          about_me: maid.about_me || '',
          skills: maid.skills || [],
          languages: maid.languages || [],
          marital_status: maid.marital_status || '',
          religion: maid.religion || '',
          date_of_birth: maid.date_of_birth || '',
          education_level: maid.education_level || '',
          preferred_salary_min: maid.preferred_salary_min?.toString() || '',
          preferred_salary_max: maid.preferred_salary_max?.toString() || '',
          preferred_currency: maid.preferred_currency || 'SAR',
          availability_status: maid.availability_status || 'available',
          profile_photo_url: maid.profile_photo_url || '',
        });
      }
    },
  });

  const [updateMaid, { loading: updating }] = useMutation(UPDATE_MAID_PROFILE, {
    onCompleted: () => {
      Alert.alert('Success', 'Maid profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const toggleArrayItem = (field: 'skills' | 'languages', item: string) => {
    setFormData(prev => {
      const array = prev[field] as string[];
      if (array.includes(item)) {
        return { ...prev, [field]: array.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...array, item] };
    });
    setHasChanges(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('profile_photo_url', result.assets[0].uri);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.full_name.trim()) {
          Alert.alert('Error', 'Please enter full name');
          return false;
        }
        if (!formData.nationality) {
          Alert.alert('Error', 'Please select nationality');
          return false;
        }
        return true;
      case 2:
        if (formData.skills.length === 0) {
          Alert.alert('Error', 'Please select at least one skill');
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

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSave();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      if (hasChanges) {
        Alert.alert(
          'Discard Changes?',
          'You have unsaved changes. Are you sure you want to go back?',
          [
            { text: 'Stay', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          ]
        );
      } else {
        router.back();
      }
    }
  };

  const handleSave = () => {
    const updateData: any = {
      full_name: formData.full_name.trim(),
      nationality: formData.nationality,
      current_location: formData.current_location.trim() || null,
      phone_number: formData.phone_number.trim() || null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      about_me: formData.about_me.trim() || null,
      skills: formData.skills,
      languages: formData.languages,
      marital_status: formData.marital_status || null,
      religion: formData.religion || null,
      date_of_birth: formData.date_of_birth || null,
      education_level: formData.education_level || null,
      preferred_salary_min: formData.preferred_salary_min ? parseInt(formData.preferred_salary_min) : null,
      preferred_salary_max: formData.preferred_salary_max ? parseInt(formData.preferred_salary_max) : null,
      preferred_currency: formData.preferred_currency,
      availability_status: formData.availability_status,
      profile_photo_url: formData.profile_photo_url || null,
      updated_at: new Date().toISOString(),
    };

    updateMaid({ variables: { id, data: updateData } });
  };

  const progress = (currentStep / 4) * 100;

  // Render Step 1: Basic Info
  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      {/* Profile Photo */}
      <TouchableOpacity style={styles.photoSection} onPress={pickImage}>
        {formData.profile_photo_url ? (
          <Image source={{ uri: formData.profile_photo_url }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={32} color="#9CA3AF" />
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </View>
        )}
        <View style={styles.editPhotoButton}>
          <Ionicons name="pencil" size={14} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.full_name}
          onChangeText={(text) => updateField('full_name', text)}
          placeholder="Enter full name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Nationality */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nationality *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {NATIONALITIES.map((nat) => (
              <TouchableOpacity
                key={nat}
                style={[
                  styles.chip,
                  formData.nationality === nat && styles.chipSelected,
                ]}
                onPress={() => updateField('nationality', nat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.nationality === nat && styles.chipTextSelected,
                  ]}
                >
                  {nat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Phone */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formData.phone_number}
          onChangeText={(text) => updateField('phone_number', text)}
          placeholder="+251 xxx xxx xxxx"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>

      {/* Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Location</Text>
        <TextInput
          style={styles.input}
          value={formData.current_location}
          onChangeText={(text) => updateField('current_location', text)}
          placeholder="e.g., Addis Ababa, Ethiopia"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Experience */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={formData.experience_years}
          onChangeText={(text) => updateField('experience_years', text.replace(/[^0-9]/g, ''))}
          placeholder="Enter years"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      {/* About Me */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>About</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.about_me}
          onChangeText={(text) => updateField('about_me', text)}
          placeholder="Brief description about the maid..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  // Render Step 2: Skills & Languages
  const renderSkillsStep = () => (
    <View style={styles.stepContent}>
      {/* Skills */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Skills * (Select all that apply)</Text>
        <View style={styles.chipsGrid}>
          {SKILLS.map((skill) => (
            <TouchableOpacity
              key={skill}
              style={[
                styles.chip,
                formData.skills.includes(skill) && styles.chipSelected,
              ]}
              onPress={() => toggleArrayItem('skills', skill)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.skills.includes(skill) && styles.chipTextSelected,
                ]}
              >
                {skill}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Languages */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Languages</Text>
        <View style={styles.chipsGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.chip,
                formData.languages.includes(lang) && styles.chipSelected,
              ]}
              onPress={() => toggleArrayItem('languages', lang)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.languages.includes(lang) && styles.chipTextSelected,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Render Step 3: Personal Details
  const renderPersonalStep = () => (
    <View style={styles.stepContent}>
      {/* Marital Status */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Marital Status</Text>
        <View style={styles.chipsRow}>
          {MARITAL_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.chip,
                formData.marital_status === status && styles.chipSelected,
              ]}
              onPress={() => updateField('marital_status', status)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.marital_status === status && styles.chipTextSelected,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Religion */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Religion</Text>
        <View style={styles.chipsRow}>
          {RELIGIONS.map((religion) => (
            <TouchableOpacity
              key={religion}
              style={[
                styles.chip,
                formData.religion === religion && styles.chipSelected,
              ]}
              onPress={() => updateField('religion', religion)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.religion === religion && styles.chipTextSelected,
                ]}
              >
                {religion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date of Birth */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          value={formData.date_of_birth}
          onChangeText={(text) => updateField('date_of_birth', text)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Education */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Education Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {EDUCATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.chip,
                  formData.education_level === level && styles.chipSelected,
                ]}
                onPress={() => updateField('education_level', level)}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.education_level === level && styles.chipTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  // Render Step 4: Salary & Status
  const renderSalaryStep = () => (
    <View style={styles.stepContent}>
      {/* Currency */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.chip,
                  formData.preferred_currency === currency && styles.chipSelected,
                ]}
                onPress={() => updateField('preferred_currency', currency)}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.preferred_currency === currency && styles.chipTextSelected,
                  ]}
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Salary Range */}
      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Min Salary</Text>
          <TextInput
            style={styles.input}
            value={formData.preferred_salary_min}
            onChangeText={(text) => updateField('preferred_salary_min', text.replace(/[^0-9]/g, ''))}
            placeholder="e.g., 1500"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Max Salary</Text>
          <TextInput
            style={styles.input}
            value={formData.preferred_salary_max}
            onChangeText={(text) => updateField('preferred_salary_max', text.replace(/[^0-9]/g, ''))}
            placeholder="e.g., 2000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Availability Status */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Availability Status</Text>
        <View style={styles.statusGrid}>
          {AVAILABILITY_STATUSES.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusOption,
                formData.availability_status === status.value && {
                  borderColor: status.color,
                  backgroundColor: status.color + '15',
                },
              ]}
              onPress={() => updateField('availability_status', status.value)}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: status.color },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  formData.availability_status === status.value && {
                    color: status.color,
                    fontWeight: '600',
                  },
                ]}
              >
                {status.label}
              </Text>
              {formData.availability_status === status.value ? (
                <Ionicons name="checkmark-circle" size={20} color={status.color} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderSkillsStep();
      case 3:
        return renderPersonalStep();
      case 4:
        return renderSalaryStep();
      default:
        return null;
    }
  };

  if (loadingMaid) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading maid data...</Text>
      </View>
    );
  }

  if (error || !data?.maid_profiles_by_pk) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load maid data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Maid',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
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
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStep} of 4</Text>
        </View>

        {/* Step Indicators */}
        <View style={styles.stepsRow}>
          {STEPS.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepIndicator,
                currentStep === step.id && styles.stepIndicatorActive,
                currentStep > step.id && styles.stepIndicatorCompleted,
              ]}
              onPress={() => {
                if (step.id < currentStep || validateStep(currentStep)) {
                  setCurrentStep(step.id);
                }
              }}
            >
              <Ionicons
                name={step.icon as any}
                size={20}
                color={
                  currentStep === step.id
                    ? '#fff'
                    : currentStep > step.id
                    ? '#fff'
                    : '#9CA3AF'
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Step Title */}
        <View style={styles.stepTitleContainer}>
          <Ionicons
            name={STEPS[currentStep - 1].icon as any}
            size={24}
            color="#F97316"
          />
          <Text style={styles.stepTitle}>{STEPS[currentStep - 1].title}</Text>
        </View>

        {/* Form Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonSecondary]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.navButtonSecondaryText}>
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={handleNext}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.navButtonPrimaryText}>
                  {currentStep === 4 ? 'Save Changes' : 'Next'}
                </Text>
                <Ionicons
                  name={currentStep === 4 ? 'checkmark' : 'arrow-forward'}
                  size={20}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>
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
  progressContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: '#F97316',
  },
  stepIndicatorCompleted: {
    backgroundColor: '#10B981',
  },
  stepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  photoSection: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
    height: 100,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  chipTextSelected: {
    color: '#F97316',
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  statusGrid: {
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  navButtonPrimary: {
    backgroundColor: '#F97316',
  },
  navButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  navButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
