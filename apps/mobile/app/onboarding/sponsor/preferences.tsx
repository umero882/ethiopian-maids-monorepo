/**
 * Sponsor Preferences Screen
 *
 * Collects maid preferences.
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
  { value: 'live_in', label: 'Live-in (Full-time)', icon: 'home-outline' as any },
  { value: 'live_out', label: 'Live-out (Daily)', icon: 'time-outline' as any },
  { value: 'part_time', label: 'Part-time', icon: 'timer-outline' as any },
  { value: 'hourly', label: 'Hourly/On-demand', icon: 'flash-outline' as any },
];

const skillsNeeded = [
  { value: 'cleaning', label: 'House Cleaning', icon: 'home-outline' as any },
  { value: 'cooking', label: 'Cooking', icon: 'restaurant-outline' as any },
  { value: 'childcare', label: 'Child Care', icon: 'people-outline' as any },
  { value: 'elderly_care', label: 'Elderly Care', icon: 'heart-outline' as any },
  { value: 'laundry', label: 'Laundry & Ironing', icon: 'shirt-outline' as any },
  { value: 'driving', label: 'Driving', icon: 'car-outline' as any },
  { value: 'pet_care', label: 'Pet Care', icon: 'paw-outline' as any },
  { value: 'tutoring', label: 'Tutoring', icon: 'book-outline' as any },
];

const nationalityPreference = [
  { value: 'any', label: 'No preference' },
  { value: 'ethiopian', label: 'Ethiopian' },
  { value: 'philippine', label: 'Philippine' },
  { value: 'indonesian', label: 'Indonesian' },
  { value: 'indian', label: 'Indian' },
  { value: 'nepali', label: 'Nepali' },
  { value: 'sri_lankan', label: 'Sri Lankan' },
];

const experienceLevelOptions = [
  { value: 'any', label: 'Any experience level' },
  { value: 'first_timer', label: 'First-time workers (more affordable)' },
  { value: 'experienced', label: 'Experienced (1-3 years)' },
  { value: 'highly_experienced', label: 'Highly experienced (3+ years)' },
];

const languageOptions = [
  { value: 'english', label: 'English', icon: 'language-outline' as any },
  { value: 'arabic', label: 'Arabic', icon: 'language-outline' as any },
  { value: 'hindi', label: 'Hindi', icon: 'language-outline' as any },
  { value: 'urdu', label: 'Urdu', icon: 'language-outline' as any },
  { value: 'tagalog', label: 'Tagalog', icon: 'language-outline' as any },
];

export default function SponsorPreferencesScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    nationalityPreference: state.formData.nationalityPreference || '',
    experienceLevel: state.formData.experienceLevel || '',
  });

  const [workTypes, setWorkTypes] = useState<string[]>(state.formData.workTypesNeeded || []);
  const [skills, setSkills] = useState<string[]>(state.formData.skillsNeeded || []);
  const [languages, setLanguages] = useState<string[]>(state.formData.languagesNeeded || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (workTypes.length === 0) {
      newErrors.workTypes = 'Please select at least one work type';
    }

    if (skills.length === 0) {
      newErrors.skills = 'Please select at least one skill';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({
        ...formData,
        workTypesNeeded: workTypes,
        skillsNeeded: skills,
        languagesNeeded: languages,
      });
      awardPoints(25);
      nextStep();
      router.push('/onboarding/sponsor/budget');
    }
  };

  const handleBack = () => {
    updateFormData({
      ...formData,
      workTypesNeeded: workTypes,
      skillsNeeded: skills,
      languagesNeeded: languages,
    });
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
            <Ionicons name="options" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.subtitle}>Profile Step 5 of 9</Text>
          <Text style={styles.title}>Your Preferences</Text>
          <Text style={styles.description}>
            What are you looking for in a domestic worker?
          </Text>
        </View>

        {/* Work Type */}
        <View style={styles.section}>
          <MultiSelect
            label="Work Type Needed"
            options={workTypeOptions}
            selected={workTypes}
            onChange={(selected) => {
              setWorkTypes(selected);
              if (errors.workTypes) {
                setErrors((prev) => ({ ...prev, workTypes: '' }));
              }
            }}
            error={errors.workTypes}
            required
            columns={2}
          />
        </View>

        {/* Skills Needed */}
        <View style={styles.section}>
          <MultiSelect
            label="Skills Needed"
            options={skillsNeeded}
            selected={skills}
            onChange={(selected) => {
              setSkills(selected);
              if (errors.skills) {
                setErrors((prev) => ({ ...prev, skills: '' }));
              }
            }}
            error={errors.skills}
            required
            columns={2}
          />
        </View>

        {/* Nationality Preference */}
        <View style={styles.section}>
          <Dropdown
            label="Nationality Preference"
            placeholder="Any preference for nationality?"
            options={nationalityPreference}
            value={formData.nationalityPreference}
            onChange={(value) => updateField('nationalityPreference', value)}
          />
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Dropdown
            label="Experience Level"
            placeholder="Preferred experience level"
            options={experienceLevelOptions}
            value={formData.experienceLevel}
            onChange={(value) => updateField('experienceLevel', value)}
          />
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <MultiSelect
            label="Language Requirements (Optional)"
            options={languageOptions}
            selected={languages}
            onChange={setLanguages}
            columns={2}
          />
        </View>

        {/* Tip Box */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={20} color="#D97706" />
          <Text style={styles.tipText}>
            Being flexible with preferences can help you find more candidates faster.
          </Text>
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
  section: {
    marginBottom: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
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
