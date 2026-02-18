/**
 * Agency Coverage Screen
 *
 * Collects operating regions and countries.
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

const headquartersOptions = [
  { value: 'ethiopia', label: 'Ethiopia' },
  { value: 'uae', label: 'United Arab Emirates' },
  { value: 'saudi_arabia', label: 'Saudi Arabia' },
  { value: 'kuwait', label: 'Kuwait' },
  { value: 'qatar', label: 'Qatar' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'oman', label: 'Oman' },
];

const sourceCountries = [
  { value: 'ethiopia', label: 'Ethiopia', icon: 'flag-outline' as any },
  { value: 'kenya', label: 'Kenya', icon: 'flag-outline' as any },
  { value: 'uganda', label: 'Uganda', icon: 'flag-outline' as any },
  { value: 'philippines', label: 'Philippines', icon: 'flag-outline' as any },
  { value: 'indonesia', label: 'Indonesia', icon: 'flag-outline' as any },
  { value: 'india', label: 'India', icon: 'flag-outline' as any },
  { value: 'nepal', label: 'Nepal', icon: 'flag-outline' as any },
  { value: 'sri_lanka', label: 'Sri Lanka', icon: 'flag-outline' as any },
];

const destinationCountries = [
  { value: 'uae', label: 'United Arab Emirates', icon: 'flag-outline' as any },
  { value: 'saudi_arabia', label: 'Saudi Arabia', icon: 'flag-outline' as any },
  { value: 'kuwait', label: 'Kuwait', icon: 'flag-outline' as any },
  { value: 'qatar', label: 'Qatar', icon: 'flag-outline' as any },
  { value: 'bahrain', label: 'Bahrain', icon: 'flag-outline' as any },
  { value: 'oman', label: 'Oman', icon: 'flag-outline' as any },
  { value: 'lebanon', label: 'Lebanon', icon: 'flag-outline' as any },
  { value: 'jordan', label: 'Jordan', icon: 'flag-outline' as any },
];

export default function AgencyCoverageScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    headquarters: state.formData.headquarters || '',
  });

  const [sources, setSources] = useState<string[]>(state.formData.sourceCountries || []);
  const [destinations, setDestinations] = useState<string[]>(state.formData.destinationCountries || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.headquarters) {
      newErrors.headquarters = 'Please select your headquarters location';
    }

    if (sources.length === 0) {
      newErrors.sources = 'Please select at least one source country';
    }

    if (destinations.length === 0) {
      newErrors.destinations = 'Please select at least one destination country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({
        ...formData,
        sourceCountries: sources,
        destinationCountries: destinations,
      });
      awardPoints(20);
      nextStep();
      router.push('/onboarding/agency/contact');
    }
  };

  const handleBack = () => {
    updateFormData({
      ...formData,
      sourceCountries: sources,
      destinationCountries: destinations,
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
            <Ionicons name="globe" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 3 of 9</Text>
          <Text style={styles.title}>Coverage Area</Text>
          <Text style={styles.description}>
            Where does your agency operate?
          </Text>
        </View>

        {/* Headquarters */}
        <View style={styles.section}>
          <Dropdown
            label="Headquarters Location"
            placeholder="Where is your main office?"
            options={headquartersOptions}
            value={formData.headquarters}
            onChange={(value) => updateField('headquarters', value)}
            error={errors.headquarters}
            required
          />
        </View>

        {/* Source Countries */}
        <View style={styles.section}>
          <MultiSelect
            label="Source Countries"
            options={sourceCountries}
            selected={sources}
            onChange={(selected) => {
              setSources(selected);
              if (errors.sources) {
                setErrors((prev) => ({ ...prev, sources: '' }));
              }
            }}
            error={errors.sources}
            required
            columns={2}
          />
          <Text style={styles.helperText}>
            Countries where you recruit workers from
          </Text>
        </View>

        {/* Destination Countries */}
        <View style={styles.section}>
          <MultiSelect
            label="Destination Countries"
            options={destinationCountries}
            selected={destinations}
            onChange={(selected) => {
              setDestinations(selected);
              if (errors.destinations) {
                setErrors((prev) => ({ ...prev, destinations: '' }));
              }
            }}
            error={errors.destinations}
            required
            columns={2}
          />
          <Text style={styles.helperText}>
            Countries where you place workers
          </Text>
        </View>

        {/* Coverage Summary */}
        {(sources.length > 0 || destinations.length > 0) && (
          <View style={styles.summaryBox}>
            <Ionicons name="analytics" size={20} color="#059669" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Coverage Summary</Text>
              <Text style={styles.summaryText}>
                {sources.length} source {sources.length === 1 ? 'country' : 'countries'} → {destinations.length} destination {destinations.length === 1 ? 'country' : 'countries'}
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
