/**
 * Sponsor Personal Info Screen
 *
 * Collects basic personal information for sponsor profile.
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
} from '../../../components/onboarding';

const titleOptions = [
  { value: 'mr', label: 'Mr.' },
  { value: 'mrs', label: 'Mrs.' },
  { value: 'ms', label: 'Ms.' },
  { value: 'dr', label: 'Dr.' },
  { value: 'other', label: 'Other' },
];

const nationalityOptions = [
  { value: 'emirati', label: 'Emirati' },
  { value: 'saudi', label: 'Saudi' },
  { value: 'kuwaiti', label: 'Kuwaiti' },
  { value: 'qatari', label: 'Qatari' },
  { value: 'bahraini', label: 'Bahraini' },
  { value: 'omani', label: 'Omani' },
  { value: 'lebanese', label: 'Lebanese' },
  { value: 'jordanian', label: 'Jordanian' },
  { value: 'egyptian', label: 'Egyptian' },
  { value: 'indian', label: 'Indian' },
  { value: 'pakistani', label: 'Pakistani' },
  { value: 'british', label: 'British' },
  { value: 'american', label: 'American' },
  { value: 'other', label: 'Other' },
];

export default function SponsorPersonalScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    title: state.formData.title || '',
    full_name: state.formData.full_name || '',
    nationality: state.formData.nationality || '',
    phoneSecondary: state.formData.phoneSecondary || '',
    preferredContactMethod: state.formData.preferredContactMethod || 'phone',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) {
      newErrors.title = 'Please select a title';
    }

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.nationality) {
      newErrors.nationality = 'Nationality is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData(formData);
      awardPoints(25);
      nextStep();
      router.push('/onboarding/sponsor/biometric-doc');
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
            <Ionicons name="person" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.subtitle}>Profile Step 1 of 9</Text>
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.description}>
            Tell us about yourself so we can help you find the perfect match
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Dropdown
            label="Title"
            placeholder="Select your title"
            options={titleOptions}
            value={formData.title}
            onChange={(value) => updateField('title', value)}
            error={errors.title}
            required
          />

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

          <FormInput
            label="Secondary Phone (Optional)"
            placeholder="Enter secondary phone number"
            icon="call-outline"
            value={formData.phoneSecondary}
            onChangeText={(text) => updateField('phoneSecondary', text)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+25 points for completing this step</Text>
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
    backgroundColor: '#1E40AF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#1E40AF',
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
    backgroundColor: '#1E40AF',
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
