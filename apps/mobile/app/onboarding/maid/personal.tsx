/**
 * Maid Personal Info Screen
 *
 * Collects basic personal information for maid profile.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../../context/OnboardingContext';
import {
  ProgressBar,
  GamificationBadge,
  FormInput,
  Dropdown,
  DatePicker,
} from '../../../components/onboarding';

const nationalityOptions = [
  { value: 'ethiopian', label: 'Ethiopian' },
  { value: 'kenyan', label: 'Kenyan' },
  { value: 'ugandan', label: 'Ugandan' },
  { value: 'tanzanian', label: 'Tanzanian' },
  { value: 'philippine', label: 'Philippine' },
  { value: 'indonesian', label: 'Indonesian' },
  { value: 'bangladeshi', label: 'Bangladeshi' },
  { value: 'indian', label: 'Indian' },
  { value: 'nepali', label: 'Nepali' },
  { value: 'sri_lankan', label: 'Sri Lankan' },
];

const religionOptions = [
  { value: 'orthodox', label: 'Orthodox Christian' },
  { value: 'protestant', label: 'Protestant' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'Prefer not to say' },
];

const maritalStatusOptions = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export default function MaidPersonalScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    full_name: state.formData.full_name || '',
    dateOfBirth: state.formData.dateOfBirth || null,
    nationality: state.formData.nationality || '',
    religion: state.formData.religion || '',
    maritalStatus: state.formData.maritalStatus || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    }

    if (!formData.nationality) {
      newErrors.nationality = 'Nationality is required';
    }

    if (!formData.religion) {
      newErrors.religion = 'Please select an option';
    }

    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'Marital status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData(formData);
      awardPoints(30); // Points for completing personal info
      nextStep();
      router.push('/onboarding/maid/biometric-doc');
    }
  };

  const handleBack = () => {
    updateFormData(formData);
    previousStep();
    router.back();
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  // Calculate maximum date (18 years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} showLabel={false} />
          </View>
          <GamificationBadge
            points={state.gamification.points}
            level={state.gamification.level}
            compact
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 1 of 10</Text>
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.description}>
            Tell us about yourself to help families find you
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label="Full Name"
            placeholder="Enter your full name"
            icon="person-outline"
            value={formData.full_name}
            onChangeText={(text) => updateField('full_name', text)}
            error={errors.full_name}
            required
            autoCapitalize="words"
          />

          <DatePicker
            label="Date of Birth"
            value={formData.dateOfBirth}
            onChange={(date) => updateField('dateOfBirth', date)}
            error={errors.dateOfBirth}
            required
            maximumDate={maxDate}
          />

          <Dropdown
            label="Nationality"
            placeholder="Select your nationality"
            options={nationalityOptions}
            value={formData.nationality}
            onChange={(value) => updateField('nationality', value)}
            error={errors.nationality}
            required
            searchable
          />

          <Dropdown
            label="Religion"
            placeholder="Select your religion"
            options={religionOptions}
            value={formData.religion}
            onChange={(value) => updateField('religion', value)}
            error={errors.religion}
            required
          />

          <Dropdown
            label="Marital Status"
            placeholder="Select your marital status"
            options={maritalStatusOptions}
            value={formData.maritalStatus}
            onChange={(value) => updateField('maritalStatus', value)}
            error={errors.maritalStatus}
            required
          />
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+30 points for completing this step</Text>
        </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleContainer: {
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#9333EA15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  form: {
    marginBottom: 16,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#92400E',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
