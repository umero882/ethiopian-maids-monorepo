/**
 * Maid Experience Screen
 *
 * Collects work experience information.
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
  MultiSelect,
} from '../../../components/onboarding';

const experienceYearsOptions = [
  { value: 'no_experience', label: 'No experience (first job)' },
  { value: 'less_than_1', label: 'Less than 1 year' },
  { value: '1_2_years', label: '1-2 years' },
  { value: '3_5_years', label: '3-5 years' },
  { value: '5_10_years', label: '5-10 years' },
  { value: 'more_than_10', label: 'More than 10 years' },
];

const previousCountryOptions = [
  { value: 'ethiopia_only', label: 'Ethiopia Only' },
  { value: 'uae', label: 'United Arab Emirates' },
  { value: 'saudi_arabia', label: 'Saudi Arabia' },
  { value: 'kuwait', label: 'Kuwait' },
  { value: 'qatar', label: 'Qatar' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'oman', label: 'Oman' },
  { value: 'lebanon', label: 'Lebanon' },
  { value: 'jordan', label: 'Jordan' },
  { value: 'other', label: 'Other Countries' },
];

const workSettingOptions = [
  { value: 'single_family', label: 'Single Family Home', icon: 'home-outline' as any },
  { value: 'apartment', label: 'Apartment', icon: 'business-outline' as any },
  { value: 'villa', label: 'Villa/Large Property', icon: 'home-outline' as any },
  { value: 'hotel', label: 'Hotel/Hospitality', icon: 'bed-outline' as any },
  { value: 'office', label: 'Office/Commercial', icon: 'briefcase-outline' as any },
  { value: 'multiple', label: 'Multiple Properties', icon: 'layers-outline' as any },
];

const specialExperienceOptions = [
  { value: 'newborn_care', label: 'Newborn Care', icon: 'heart-outline' as any },
  { value: 'special_needs', label: 'Special Needs Care', icon: 'accessibility-outline' as any },
  { value: 'elderly_care', label: 'Elderly/Senior Care', icon: 'people-outline' as any },
  { value: 'cooking_specialty', label: 'Specialty Cooking', icon: 'restaurant-outline' as any },
  { value: 'large_events', label: 'Large Events/Parties', icon: 'wine-outline' as any },
  { value: 'pet_care', label: 'Pet Care Experience', icon: 'paw-outline' as any },
];

const reasonForLeavingOptions = [
  { value: 'contract_ended', label: 'Contract ended/completed' },
  { value: 'employer_relocated', label: 'Employer relocated' },
  { value: 'returned_home', label: 'Returned to home country' },
  { value: 'better_opportunity', label: 'Found better opportunity' },
  { value: 'family_reasons', label: 'Family reasons' },
  { value: 'health_reasons', label: 'Health reasons' },
  { value: 'visa_issues', label: 'Visa/Immigration issues' },
  { value: 'salary_issues', label: 'Salary/Payment issues' },
  { value: 'working_conditions', label: 'Working conditions' },
  { value: 'mutual_agreement', label: 'Mutual agreement' },
  { value: 'employer_no_longer_needed', label: 'Employer no longer needed help' },
  { value: 'seeking_new_experience', label: 'Seeking new experience' },
  { value: 'personal_reasons', label: 'Personal reasons' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function MaidExperienceScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [formData, setFormData] = useState({
    yearsOfExperience: state.formData.yearsOfExperience || '',
    previousCountries: state.formData.previousCountries || [],
    previousEmployerCount: state.formData.previousEmployerCount || '',
    longestEmployment: state.formData.longestEmployment || '',
    reasonForLeaving: state.formData.reasonForLeaving || '',
  });

  const [workSettings, setWorkSettings] = useState<string[]>(state.formData.workSettings || []);
  const [specialExperience, setSpecialExperience] = useState<string[]>(state.formData.specialExperience || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = 'Please select your years of experience';
    }

    if (workSettings.length === 0) {
      newErrors.workSettings = 'Please select at least one work setting';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({ ...formData, workSettings, specialExperience });
      awardPoints(25);

      // Award experienced worker achievement
      const experienceLevel = formData.yearsOfExperience;
      if (['3_5_years', '5_10_years', 'more_than_10'].includes(experienceLevel)) {
        addAchievement({
          id: 'experienced_worker',
          name: 'Experienced Professional',
          description: '3+ years of work experience',
          icon: 'medal',
          points: 40,
          trigger: 'experienceLevel',
          earnedAt: new Date().toISOString(),
        });
        awardPoints(40);
      }

      nextStep();
      router.push('/onboarding/maid/preferences');
    }
  };

  const handleBack = () => {
    updateFormData({ ...formData, workSettings, specialExperience });
    previousStep();
    router.back();
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const isExperienced = ['3_5_years', '5_10_years', 'more_than_10'].includes(formData.yearsOfExperience);
  const hasNoExperience = formData.yearsOfExperience === 'no_experience';

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
            <Ionicons name="time" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 6 of 10</Text>
          <Text style={styles.title}>Work Experience</Text>
          <Text style={styles.description}>
            Share your work history to help families understand your background
          </Text>
        </View>

        {/* Years of Experience */}
        <View style={styles.section}>
          <Dropdown
            label="Years of Experience"
            placeholder="Select your total experience"
            options={experienceYearsOptions}
            value={formData.yearsOfExperience}
            onChange={(value) => updateField('yearsOfExperience', value)}
            error={errors.yearsOfExperience}
            required
          />
        </View>

        {/* Experience Badge */}
        {isExperienced && (
          <View style={styles.achievementHint}>
            <Ionicons name="trophy" size={20} color="#059669" />
            <Text style={styles.achievementHintText}>
              You qualify for the "Experienced Professional" achievement (+40 pts)
            </Text>
          </View>
        )}

        {/* First Timer Encouragement */}
        {hasNoExperience && (
          <View style={styles.encouragementBox}>
            <Ionicons name="sparkles" size={20} color="#7C3AED" />
            <View style={styles.encouragementContent}>
              <Text style={styles.encouragementTitle}>Everyone starts somewhere!</Text>
              <Text style={styles.encouragementText}>
                Many families specifically look for first-time workers. Focus on your skills and eagerness to learn.
              </Text>
            </View>
          </View>
        )}

        {/* Work Settings */}
        <View style={styles.section}>
          <MultiSelect
            label="Work Settings"
            options={workSettingOptions}
            selected={workSettings}
            onChange={(selected) => {
              setWorkSettings(selected);
              if (errors.workSettings) {
                setErrors((prev) => ({ ...prev, workSettings: '' }));
              }
            }}
            error={errors.workSettings}
            required
            columns={2}
          />
        </View>

        {/* Previous Countries */}
        {!hasNoExperience && (
          <View style={styles.section}>
            <Dropdown
              label="Countries Worked In"
              placeholder="Select countries you've worked in"
              options={previousCountryOptions}
              value={formData.previousCountries[0] || ''}
              onChange={(value) => updateField('previousCountries', [value])}
            />
          </View>
        )}

        {/* Special Experience */}
        <View style={styles.section}>
          <MultiSelect
            label="Special Experience (Optional)"
            options={specialExperienceOptions}
            selected={specialExperience}
            onChange={setSpecialExperience}
            columns={2}
          />
          <Text style={styles.helperText}>
            Select any specialized skills or experience you have
          </Text>
        </View>

        {/* Previous Employer Details */}
        {!hasNoExperience && (
          <View style={styles.section}>
            <FormInput
              label="Longest Employment Duration"
              placeholder="e.g., 2 years with same family"
              icon="calendar-outline"
              value={formData.longestEmployment}
              onChangeText={(text) => updateField('longestEmployment', text)}
            />

            <Dropdown
              label="Reason for Leaving Last Job"
              placeholder="Select reason for leaving"
              options={reasonForLeavingOptions}
              value={formData.reasonForLeaving}
              onChange={(value) => updateField('reasonForLeaving', value)}
            />
          </View>
        )}

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
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  achievementHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  achievementHintText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  encouragementBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  encouragementContent: {
    flex: 1,
  },
  encouragementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 4,
  },
  encouragementText: {
    fontSize: 13,
    color: '#7C3AED',
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
