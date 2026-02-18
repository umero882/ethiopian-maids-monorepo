/**
 * Maid Preferences Screen
 *
 * Collects salary expectations and work preferences.
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

const salaryRangeOptions = [
  { value: '500_1000', label: '500 - 1,000 AED/month' },
  { value: '1000_1500', label: '1,000 - 1,500 AED/month' },
  { value: '1500_2000', label: '1,500 - 2,000 AED/month' },
  { value: '2000_2500', label: '2,000 - 2,500 AED/month' },
  { value: '2500_3000', label: '2,500 - 3,000 AED/month' },
  { value: '3000_plus', label: '3,000+ AED/month' },
  { value: 'negotiable', label: 'Negotiable' },
];

const preferredCountryOptions = [
  { value: 'uae', label: 'United Arab Emirates', icon: 'flag-outline' as any },
  { value: 'saudi_arabia', label: 'Saudi Arabia', icon: 'flag-outline' as any },
  { value: 'kuwait', label: 'Kuwait', icon: 'flag-outline' as any },
  { value: 'qatar', label: 'Qatar', icon: 'flag-outline' as any },
  { value: 'bahrain', label: 'Bahrain', icon: 'flag-outline' as any },
  { value: 'oman', label: 'Oman', icon: 'flag-outline' as any },
  { value: 'lebanon', label: 'Lebanon', icon: 'flag-outline' as any },
  { value: 'jordan', label: 'Jordan', icon: 'flag-outline' as any },
];

const accommodationOptions = [
  { value: 'live_in', label: 'Live-in (with family)' },
  { value: 'live_out', label: 'Live-out (own accommodation)' },
  { value: 'either', label: 'Either is fine' },
];

const familyTypeOptions = [
  { value: 'any', label: 'Any Family Type', icon: 'people-outline' as any },
  { value: 'small', label: 'Small Family (1-3 people)', icon: 'person-outline' as any },
  { value: 'medium', label: 'Medium Family (4-6 people)', icon: 'people-outline' as any },
  { value: 'large', label: 'Large Family (7+ people)', icon: 'people-outline' as any },
  { value: 'single_person', label: 'Single Person', icon: 'person-outline' as any },
  { value: 'elderly_only', label: 'Elderly Care Only', icon: 'heart-outline' as any },
];

const workScheduleOptions = [
  { value: 'flexible', label: 'Flexible Schedule', icon: 'time-outline' as any },
  { value: 'fixed', label: 'Fixed Schedule (9-5)', icon: 'calendar-outline' as any },
  { value: 'split', label: 'Split Shift', icon: 'swap-horizontal-outline' as any },
  { value: 'weekends_off', label: 'Weekends Off', icon: 'sunny-outline' as any },
  { value: 'one_day_off', label: 'One Day Off Weekly', icon: 'today-outline' as any },
];

const mustHaveOptions = [
  { value: 'private_room', label: 'Private Room', icon: 'bed-outline' as any },
  { value: 'day_off', label: 'Weekly Day Off', icon: 'calendar-outline' as any },
  { value: 'phone_allowed', label: 'Phone Allowed', icon: 'phone-portrait-outline' as any },
  { value: 'internet_access', label: 'Internet Access', icon: 'wifi-outline' as any },
  { value: 'food_provided', label: 'Food Provided', icon: 'restaurant-outline' as any },
  { value: 'health_insurance', label: 'Health Insurance', icon: 'medkit-outline' as any },
  { value: 'annual_ticket', label: 'Annual Flight Ticket', icon: 'airplane-outline' as any },
];

export default function MaidPreferencesScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    expectedSalary: state.formData.expectedSalary || '',
    accommodation: state.formData.accommodation || '',
    additionalNotes: state.formData.additionalNotes || '',
  });

  const [preferredCountries, setPreferredCountries] = useState<string[]>(
    state.formData.preferredCountries || []
  );
  const [familyTypes, setFamilyTypes] = useState<string[]>(
    state.formData.familyTypes || []
  );
  const [workSchedule, setWorkSchedule] = useState<string[]>(
    state.formData.workSchedule || []
  );
  const [mustHaves, setMustHaves] = useState<string[]>(
    state.formData.mustHaves || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.expectedSalary) {
      newErrors.expectedSalary = 'Please select your expected salary';
    }

    if (preferredCountries.length === 0) {
      newErrors.preferredCountries = 'Please select at least one preferred country';
    }

    if (!formData.accommodation) {
      newErrors.accommodation = 'Please select your accommodation preference';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({
        ...formData,
        preferredCountries,
        familyTypes,
        workSchedule,
        mustHaves,
      });
      awardPoints(20);
      nextStep();
      router.push('/onboarding/maid/about');
    }
  };

  const handleBack = () => {
    updateFormData({
      ...formData,
      preferredCountries,
      familyTypes,
      workSchedule,
      mustHaves,
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
            <Ionicons name="settings" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 7 of 10</Text>
          <Text style={styles.title}>Your Preferences</Text>
          <Text style={styles.description}>
            Tell us what you're looking for in your next position
          </Text>
        </View>

        {/* Expected Salary */}
        <View style={styles.section}>
          <Dropdown
            label="Expected Salary"
            placeholder="Select your salary expectation"
            options={salaryRangeOptions}
            value={formData.expectedSalary}
            onChange={(value) => updateField('expectedSalary', value)}
            error={errors.expectedSalary}
            required
          />
        </View>

        {/* Preferred Countries */}
        <View style={styles.section}>
          <MultiSelect
            label="Preferred Countries"
            options={preferredCountryOptions}
            selected={preferredCountries}
            onChange={(selected) => {
              setPreferredCountries(selected);
              if (errors.preferredCountries) {
                setErrors((prev) => ({ ...prev, preferredCountries: '' }));
              }
            }}
            error={errors.preferredCountries}
            required
            columns={2}
          />
          {/* Multi-select notice */}
          <View style={styles.multiSelectNotice}>
            <Ionicons name="information-circle" size={18} color="#B45309" />
            <Text style={styles.multiSelectNoticeText}>
              You can select multiple countries to increase your job opportunities
            </Text>
          </View>
        </View>

        {/* Accommodation */}
        <View style={styles.section}>
          <Dropdown
            label="Accommodation Preference"
            placeholder="Select accommodation type"
            options={accommodationOptions}
            value={formData.accommodation}
            onChange={(value) => updateField('accommodation', value)}
            error={errors.accommodation}
            required
          />
        </View>

        {/* Family Types */}
        <View style={styles.section}>
          <MultiSelect
            label="Preferred Family Type (Optional)"
            options={familyTypeOptions}
            selected={familyTypes}
            onChange={setFamilyTypes}
            columns={2}
          />
        </View>

        {/* Work Schedule */}
        <View style={styles.section}>
          <MultiSelect
            label="Work Schedule Preference (Optional)"
            options={workScheduleOptions}
            selected={workSchedule}
            onChange={setWorkSchedule}
            columns={2}
          />
        </View>

        {/* Must-Haves */}
        <View style={styles.section}>
          <MultiSelect
            label="Must-Have Benefits (Optional)"
            options={mustHaveOptions}
            selected={mustHaves}
            onChange={setMustHaves}
            columns={2}
          />
          <Text style={styles.helperText}>
            Select the benefits that are important to you
          </Text>
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <FormInput
            label="Additional Preferences"
            placeholder="Any other preferences or requirements..."
            icon="chatbubble-outline"
            value={formData.additionalNotes}
            onChangeText={(text) => updateField('additionalNotes', text)}
            multiline
          />
        </View>

        {/* Tip Box */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={20} color="#D97706" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipText}>
              Being flexible with your preferences can help you find more opportunities. Consider what's most important vs. nice-to-have.
            </Text>
          </View>
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
  multiSelectNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 8,
  },
  multiSelectNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#B45309',
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
