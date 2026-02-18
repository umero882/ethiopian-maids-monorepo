/**
 * Maid Profession Screen
 *
 * Collects work type and visa status information.
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
  Dropdown,
  MultiSelect,
} from '../../../components/onboarding';

const workTypeOptions = [
  { value: 'full_time', label: 'Full-Time (Live-in)', icon: 'home-outline' as any },
  { value: 'part_time', label: 'Part-Time', icon: 'time-outline' as any },
  { value: 'hourly', label: 'Hourly/On-Demand', icon: 'timer-outline' as any },
  { value: 'contract', label: 'Contract', icon: 'document-outline' as any },
];

const visaStatusOptions = [
  { value: 'valid_work_visa', label: 'Valid Work Visa' },
  { value: 'tourist_visa', label: 'Tourist Visa' },
  { value: 'residence_visa', label: 'Residence Visa' },
  { value: 'in_country', label: 'In Home Country' },
  { value: 'transfer_available', label: 'Visa Transfer Available' },
  { value: 'need_sponsorship', label: 'Need Visa Sponsorship' },
];

const availabilityOptions = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'one_week', label: 'Within 1 Week' },
  { value: 'two_weeks', label: 'Within 2 Weeks' },
  { value: 'one_month', label: 'Within 1 Month' },
  { value: 'negotiable', label: 'Negotiable' },
];

const contractDurationOptions = [
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' },
  { value: '2_years', label: '2 Years' },
  { value: 'negotiable', label: 'Negotiable' },
];

export default function MaidProfessionScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [workTypes, setWorkTypes] = useState<string[]>(state.formData.workTypes || []);
  const [formData, setFormData] = useState({
    visaStatus: state.formData.visaStatus || '',
    availability: state.formData.availability || '',
    preferredContractDuration: state.formData.preferredContractDuration || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (workTypes.length === 0) {
      newErrors.workTypes = 'Please select at least one work type';
    }

    if (!formData.visaStatus) {
      newErrors.visaStatus = 'Please select your visa status';
    }

    if (!formData.availability) {
      newErrors.availability = 'Please select your availability';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({ ...formData, workTypes });
      awardPoints(20);
      nextStep();
      router.push('/onboarding/maid/skills');
    }
  };

  const handleBack = () => {
    updateFormData({ ...formData, workTypes });
    previousStep();
    router.back();
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleWorkTypeChange = (selected: string[]) => {
    setWorkTypes(selected);
    if (errors.workTypes) {
      setErrors((prev) => ({ ...prev, workTypes: '' }));
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
            <Ionicons name="briefcase" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 4 of 10</Text>
          <Text style={styles.title}>Work Details</Text>
          <Text style={styles.description}>
            Tell us about your work preferences and current status
          </Text>
        </View>

        {/* Work Type Selection */}
        <View style={styles.section}>
          <MultiSelect
            label="Work Type"
            options={workTypeOptions}
            selected={workTypes}
            onChange={handleWorkTypeChange}
            error={errors.workTypes}
            required
            columns={1}
          />
        </View>

        {/* Visa Status */}
        <View style={styles.section}>
          <Dropdown
            label="Visa Status"
            placeholder="Select your current visa status"
            options={visaStatusOptions}
            value={formData.visaStatus}
            onChange={(value) => updateField('visaStatus', value)}
            error={errors.visaStatus}
            required
          />
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Dropdown
            label="Availability"
            placeholder="When can you start working?"
            options={availabilityOptions}
            value={formData.availability}
            onChange={(value) => updateField('availability', value)}
            error={errors.availability}
            required
          />
        </View>

        {/* Contract Duration */}
        <View style={styles.section}>
          <Dropdown
            label="Preferred Contract Duration"
            placeholder="Select preferred contract length"
            options={contractDurationOptions}
            value={formData.preferredContractDuration}
            onChange={(value) => updateField('preferredContractDuration', value)}
          />
        </View>

        {/* Visa Info Box */}
        {formData.visaStatus === 'need_sponsorship' && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#1E40AF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Need Sponsorship?</Text>
              <Text style={styles.infoText}>
                Many families and agencies offer visa sponsorship for qualified candidates. Make sure to highlight your skills and experience to stand out!
              </Text>
            </View>
          </View>
        )}

        {/* Quick Availability Badge */}
        {formData.availability === 'immediate' && (
          <View style={styles.quickBadge}>
            <Ionicons name="flash" size={20} color="#059669" />
            <View style={styles.quickBadgeContent}>
              <Text style={styles.quickBadgeTitle}>Quick Starter!</Text>
              <Text style={styles.quickBadgeText}>
                Candidates who can start immediately often get hired faster
              </Text>
            </View>
          </View>
        )}

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
  section: {
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  quickBadge: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  quickBadgeContent: {
    flex: 1,
  },
  quickBadgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  quickBadgeText: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
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
