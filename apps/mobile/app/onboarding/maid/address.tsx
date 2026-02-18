/**
 * Maid Address Screen
 *
 * Collects current location and address information.
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
  { value: 'ethiopia', label: 'Ethiopia' },
  { value: 'uae', label: 'United Arab Emirates' },
  { value: 'saudi_arabia', label: 'Saudi Arabia' },
  { value: 'kuwait', label: 'Kuwait' },
  { value: 'qatar', label: 'Qatar' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'oman', label: 'Oman' },
  { value: 'lebanon', label: 'Lebanon' },
  { value: 'jordan', label: 'Jordan' },
];

const ethiopiaRegions = [
  { value: 'addis_ababa', label: 'Addis Ababa' },
  { value: 'oromia', label: 'Oromia' },
  { value: 'amhara', label: 'Amhara' },
  { value: 'tigray', label: 'Tigray' },
  { value: 'snnpr', label: 'SNNPR' },
  { value: 'somali', label: 'Somali' },
  { value: 'afar', label: 'Afar' },
  { value: 'benishangul', label: 'Benishangul-Gumuz' },
  { value: 'gambela', label: 'Gambela' },
  { value: 'harari', label: 'Harari' },
  { value: 'dire_dawa', label: 'Dire Dawa' },
  { value: 'sidama', label: 'Sidama' },
];

const gccCities: Record<string, { value: string; label: string }[]> = {
  uae: [
    { value: 'dubai', label: 'Dubai' },
    { value: 'abu_dhabi', label: 'Abu Dhabi' },
    { value: 'sharjah', label: 'Sharjah' },
    { value: 'ajman', label: 'Ajman' },
    { value: 'ras_al_khaimah', label: 'Ras Al Khaimah' },
  ],
  saudi_arabia: [
    { value: 'riyadh', label: 'Riyadh' },
    { value: 'jeddah', label: 'Jeddah' },
    { value: 'dammam', label: 'Dammam' },
    { value: 'mecca', label: 'Mecca' },
    { value: 'medina', label: 'Medina' },
  ],
  kuwait: [
    { value: 'kuwait_city', label: 'Kuwait City' },
    { value: 'hawalli', label: 'Hawalli' },
    { value: 'salmiya', label: 'Salmiya' },
  ],
  qatar: [
    { value: 'doha', label: 'Doha' },
    { value: 'al_wakrah', label: 'Al Wakrah' },
    { value: 'al_khor', label: 'Al Khor' },
  ],
  bahrain: [
    { value: 'manama', label: 'Manama' },
    { value: 'muharraq', label: 'Muharraq' },
    { value: 'riffa', label: 'Riffa' },
  ],
  oman: [
    { value: 'muscat', label: 'Muscat' },
    { value: 'salalah', label: 'Salalah' },
    { value: 'sohar', label: 'Sohar' },
  ],
};

export default function MaidAddressScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    currentCountry: state.formData.currentCountry || '',
    region: state.formData.region || '',
    city: state.formData.city || '',
    address: state.formData.address || '',
    postalCode: state.formData.postalCode || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const isInEthiopia = formData.currentCountry === 'ethiopia';
  const isInGcc = ['uae', 'saudi_arabia', 'kuwait', 'qatar', 'bahrain', 'oman'].includes(formData.currentCountry);

  const getCityOptions = () => {
    if (isInGcc && gccCities[formData.currentCountry]) {
      return gccCities[formData.currentCountry];
    }
    return [];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentCountry) {
      newErrors.currentCountry = 'Please select your current country';
    }

    if (isInEthiopia && !formData.region) {
      newErrors.region = 'Please select your region';
    }

    if (isInGcc && !formData.city) {
      newErrors.city = 'Please select your city';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData(formData);
      awardPoints(15);
      nextStep();
      router.push('/onboarding/maid/profession');
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
      // Reset dependent fields when country changes
      if (key === 'currentCountry') {
        updated.region = '';
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
            <Ionicons name="location" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 3 of 10</Text>
          <Text style={styles.title}>Your Location</Text>
          <Text style={styles.description}>
            Tell us where you currently live so we can match you with nearby opportunities
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Dropdown
            label="Current Country"
            placeholder="Select your current country"
            options={countryOptions}
            value={formData.currentCountry}
            onChange={(value) => updateField('currentCountry', value)}
            error={errors.currentCountry}
            required
            searchable
          />

          {isInEthiopia && (
            <Dropdown
              label="Region"
              placeholder="Select your region"
              options={ethiopiaRegions}
              value={formData.region}
              onChange={(value) => updateField('region', value)}
              error={errors.region}
              required
              searchable
            />
          )}

          {isInGcc && getCityOptions().length > 0 && (
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
            label="Street Address"
            placeholder="Enter your street address"
            icon="home-outline"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            multiline
          />

          <FormInput
            label="Postal Code"
            placeholder="Enter postal code (optional)"
            icon="mail-outline"
            value={formData.postalCode}
            onChangeText={(text) => updateField('postalCode', text)}
            keyboardType="numeric"
          />
        </View>

        {/* Location Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#1E40AF" />
          <Text style={styles.infoText}>
            Your exact address is never shared publicly. Families only see your general area until you accept a job offer.
          </Text>
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+15 points for completing this step</Text>
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
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
