/**
 * Agency Representative Screen
 *
 * Collects authorized representative information.
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

const positionOptions = [
  { value: 'owner', label: 'Owner / Founder' },
  { value: 'ceo', label: 'CEO / Managing Director' },
  { value: 'general_manager', label: 'General Manager' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'recruitment_manager', label: 'Recruitment Manager' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'other', label: 'Other' },
];

export default function AgencyRepresentativeScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    repName: state.formData.repName || '',
    repPosition: state.formData.repPosition || '',
    repPhone: state.formData.repPhone || '',
    repEmail: state.formData.repEmail || '',
    repNationality: state.formData.repNationality || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.repName?.trim()) {
      newErrors.repName = 'Representative name is required';
    }

    if (!formData.repPosition) {
      newErrors.repPosition = 'Position is required';
    }

    if (!formData.repPhone?.trim()) {
      newErrors.repPhone = 'Phone number is required';
    }

    if (!formData.repEmail?.trim()) {
      newErrors.repEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.repEmail)) {
      newErrors.repEmail = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData(formData);
      awardPoints(20);
      nextStep();
      router.push('/onboarding/agency/services');
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
            <Ionicons name="person-circle" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 5 of 9</Text>
          <Text style={styles.title}>Authorized Representative</Text>
          <Text style={styles.description}>
            Who is the main contact person for your agency?
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label="Full Name"
            placeholder="Enter representative's full name"
            icon="person-outline"
            value={formData.repName}
            onChangeText={(text) => updateField('repName', text)}
            error={errors.repName}
            required
            autoCapitalize="words"
          />

          <Dropdown
            label="Position"
            placeholder="Select position in company"
            options={positionOptions}
            value={formData.repPosition}
            onChange={(value) => updateField('repPosition', value)}
            error={errors.repPosition}
            required
          />

          <FormInput
            label="Direct Phone"
            placeholder="Enter direct phone number"
            icon="call-outline"
            value={formData.repPhone}
            onChangeText={(text) => updateField('repPhone', text)}
            error={errors.repPhone}
            required
            keyboardType="phone-pad"
          />

          <FormInput
            label="Email Address"
            placeholder="Enter email address"
            icon="mail-outline"
            value={formData.repEmail}
            onChangeText={(text) => updateField('repEmail', text)}
            error={errors.repEmail}
            required
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#059669" />
          <Text style={styles.infoText}>
            This person will be the primary contact for all platform communications and verifications.
          </Text>
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+20 points for completing this step</Text>
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
    backgroundColor: '#05966915',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#059669',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
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
    backgroundColor: '#059669',
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
