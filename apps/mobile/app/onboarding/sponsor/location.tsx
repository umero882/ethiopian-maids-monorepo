/**
 * Sponsor Location Screen
 *
 * Collects location and address information.
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

const countryOptions = [
  { value: 'uae', label: 'United Arab Emirates' },
  { value: 'saudi_arabia', label: 'Saudi Arabia' },
  { value: 'kuwait', label: 'Kuwait' },
  { value: 'qatar', label: 'Qatar' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'oman', label: 'Oman' },
  { value: 'lebanon', label: 'Lebanon' },
  { value: 'jordan', label: 'Jordan' },
];

const uaeCities = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'ras_al_khaimah', label: 'Ras Al Khaimah' },
  { value: 'fujairah', label: 'Fujairah' },
  { value: 'umm_al_quwain', label: 'Umm Al Quwain' },
];

const saudiCities = [
  { value: 'riyadh', label: 'Riyadh' },
  { value: 'jeddah', label: 'Jeddah' },
  { value: 'dammam', label: 'Dammam' },
  { value: 'mecca', label: 'Mecca' },
  { value: 'medina', label: 'Medina' },
  { value: 'khobar', label: 'Khobar' },
];

const cityOptions: Record<string, { value: string; label: string }[]> = {
  uae: uaeCities,
  saudi_arabia: saudiCities,
  kuwait: [{ value: 'kuwait_city', label: 'Kuwait City' }],
  qatar: [{ value: 'doha', label: 'Doha' }],
  bahrain: [{ value: 'manama', label: 'Manama' }],
  oman: [{ value: 'muscat', label: 'Muscat' }],
  lebanon: [{ value: 'beirut', label: 'Beirut' }],
  jordan: [{ value: 'amman', label: 'Amman' }],
};

const propertyTypeOptions = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'compound', label: 'Compound' },
];

export default function SponsorLocationScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    country: state.formData.country || '',
    city: state.formData.city || '',
    area: state.formData.area || '',
    propertyType: state.formData.propertyType || '',
    propertySize: state.formData.propertySize || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const getCityOptions = () => {
    return formData.country ? cityOptions[formData.country] || [] : [];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.country) {
      newErrors.country = 'Please select your country';
    }

    if (!formData.city) {
      newErrors.city = 'Please select your city';
    }

    if (!formData.propertyType) {
      newErrors.propertyType = 'Please select your property type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData(formData);
      awardPoints(20);
      nextStep();
      router.push('/onboarding/sponsor/family');
    }
  };

  const handleBack = () => {
    updateFormData(formData);
    previousStep();
    router.back();
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'country') {
        updated.city = '';
      }
      return updated;
    });
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
            <Ionicons name="location" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.subtitle}>Profile Step 3 of 9</Text>
          <Text style={styles.title}>Your Location</Text>
          <Text style={styles.description}>
            Help us find domestic workers in your area
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Dropdown
            label="Country"
            placeholder="Select your country"
            options={countryOptions}
            value={formData.country}
            onChange={(value) => updateField('country', value)}
            error={errors.country}
            required
          />

          {getCityOptions().length > 0 && (
            <Dropdown
              label="City"
              placeholder="Select your city"
              options={getCityOptions()}
              value={formData.city}
              onChange={(value) => updateField('city', value)}
              error={errors.city}
              required
            />
          )}

          <FormInput
            label="Area/Neighborhood"
            placeholder="e.g., Dubai Marina, Al Barsha"
            icon="map-outline"
            value={formData.area}
            onChangeText={(text) => updateField('area', text)}
          />

          <Dropdown
            label="Property Type"
            placeholder="Select your property type"
            options={propertyTypeOptions}
            value={formData.propertyType}
            onChange={(value) => updateField('propertyType', value)}
            error={errors.propertyType}
            required
          />

          <FormInput
            label="Property Size (sq ft/m)"
            placeholder="e.g., 2000 sq ft"
            icon="resize-outline"
            value={formData.propertySize}
            onChangeText={(text) => updateField('propertySize', text)}
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#1E40AF" />
          <Text style={styles.infoText}>
            Your exact address is only shared with matched workers after you approve.
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
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
