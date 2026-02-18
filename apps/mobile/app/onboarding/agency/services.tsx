/**
 * Agency Services Screen
 *
 * Collects services offered by the agency.
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
  MultiSelect,
  Dropdown,
} from '../../../components/onboarding';

const serviceOptions = [
  { value: 'recruitment', label: 'Recruitment', icon: 'people-outline' as any },
  { value: 'training', label: 'Pre-departure Training', icon: 'school-outline' as any },
  { value: 'visa_processing', label: 'Visa Processing', icon: 'document-text-outline' as any },
  { value: 'medical_checkup', label: 'Medical Check-up', icon: 'medkit-outline' as any },
  { value: 'travel_arrangement', label: 'Travel Arrangement', icon: 'airplane-outline' as any },
  { value: 'documentation', label: 'Documentation', icon: 'folder-outline' as any },
  { value: 'post_arrival', label: 'Post-arrival Support', icon: 'hand-left-outline' as any },
  { value: 'replacement', label: 'Replacement Guarantee', icon: 'refresh-outline' as any },
];

const specializations = [
  { value: 'housemaids', label: 'Housemaids', icon: 'home-outline' as any },
  { value: 'nannies', label: 'Nannies / Childcare', icon: 'heart-outline' as any },
  { value: 'elderly_care', label: 'Elderly Care', icon: 'accessibility-outline' as any },
  { value: 'cooks', label: 'Cooks / Chefs', icon: 'restaurant-outline' as any },
  { value: 'drivers', label: 'Drivers', icon: 'car-outline' as any },
  { value: 'gardeners', label: 'Gardeners', icon: 'leaf-outline' as any },
  { value: 'security', label: 'Security Guards', icon: 'shield-outline' as any },
  { value: 'general', label: 'General Labor', icon: 'construct-outline' as any },
];

const averagePlacementsOptions = [
  { value: '1-10', label: '1-10 per month' },
  { value: '11-25', label: '11-25 per month' },
  { value: '26-50', label: '26-50 per month' },
  { value: '51-100', label: '51-100 per month' },
  { value: '100+', label: '100+ per month' },
];

export default function AgencyServicesScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [services, setServices] = useState<string[]>(state.formData.services || []);
  const [specs, setSpecs] = useState<string[]>(state.formData.specializations || []);
  const [placements, setPlacements] = useState(state.formData.averagePlacements || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (services.length === 0) {
      newErrors.services = 'Please select at least one service';
    }

    if (specs.length === 0) {
      newErrors.specializations = 'Please select at least one specialization';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({
        services,
        specializations: specs,
        averagePlacements: placements,
      });
      awardPoints(20);
      nextStep();
      router.push('/onboarding/agency/about');
    }
  };

  const handleBack = () => {
    updateFormData({
      services,
      specializations: specs,
      averagePlacements: placements,
    });
    previousStep();
    router.back();
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
            <Ionicons name="briefcase" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 6 of 9</Text>
          <Text style={styles.title}>Services Offered</Text>
          <Text style={styles.description}>
            What services does your agency provide?
          </Text>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <MultiSelect
            label="Services Provided"
            options={serviceOptions}
            selected={services}
            onChange={(selected) => {
              setServices(selected);
              if (errors.services) {
                setErrors((prev) => ({ ...prev, services: '' }));
              }
            }}
            error={errors.services}
            required
            columns={2}
          />
        </View>

        {/* Specializations */}
        <View style={styles.section}>
          <MultiSelect
            label="Worker Specializations"
            options={specializations}
            selected={specs}
            onChange={(selected) => {
              setSpecs(selected);
              if (errors.specializations) {
                setErrors((prev) => ({ ...prev, specializations: '' }));
              }
            }}
            error={errors.specializations}
            required
            columns={2}
          />
          <Text style={styles.helperText}>
            Types of workers you recruit and place
          </Text>
        </View>

        {/* Average Placements */}
        <View style={styles.section}>
          <Dropdown
            label="Average Monthly Placements"
            placeholder="How many workers do you place?"
            options={averagePlacementsOptions}
            value={placements}
            onChange={setPlacements}
          />
        </View>

        {/* Service Summary */}
        {(services.length > 0 || specs.length > 0) && (
          <View style={styles.summaryBox}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Service Profile</Text>
              <Text style={styles.summaryText}>
                {services.length} services • {specs.length} specializations
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
  section: {
    marginBottom: 20,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 13,
    color: '#059669',
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
