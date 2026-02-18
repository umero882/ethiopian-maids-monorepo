/**
 * Sponsor Family Screen
 *
 * Collects family composition information.
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

const familySizeOptions = [
  { value: '1', label: '1 person (Single)' },
  { value: '2', label: '2 people' },
  { value: '3-4', label: '3-4 people' },
  { value: '5-6', label: '5-6 people' },
  { value: '7+', label: '7+ people' },
];

const childrenOptions = [
  { value: '0', label: 'No children' },
  { value: '1', label: '1 child' },
  { value: '2', label: '2 children' },
  { value: '3', label: '3 children' },
  { value: '4+', label: '4+ children' },
];

const childAgeGroups = [
  { value: 'infant', label: 'Infant (0-1 years)', icon: 'heart-outline' as any },
  { value: 'toddler', label: 'Toddler (1-3 years)', icon: 'walk-outline' as any },
  { value: 'preschool', label: 'Preschool (3-5 years)', icon: 'happy-outline' as any },
  { value: 'school_age', label: 'School Age (6-12 years)', icon: 'school-outline' as any },
  { value: 'teenager', label: 'Teenager (13+ years)', icon: 'person-outline' as any },
];

const elderlyOptions = [
  { value: 'none', label: 'No elderly members' },
  { value: '1', label: '1 elderly person' },
  { value: '2+', label: '2+ elderly people' },
];

const petsOptions = [
  { value: 'none', label: 'No pets', icon: 'close-circle-outline' as any },
  { value: 'dog', label: 'Dog(s)', icon: 'paw-outline' as any },
  { value: 'cat', label: 'Cat(s)', icon: 'paw-outline' as any },
  { value: 'bird', label: 'Bird(s)', icon: 'flower-outline' as any },
  { value: 'fish', label: 'Fish', icon: 'water-outline' as any },
  { value: 'other', label: 'Other pets', icon: 'paw-outline' as any },
];

export default function SponsorFamilyScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    familySize: state.formData.familySize || '',
    numberOfChildren: state.formData.numberOfChildren || '',
    elderlyMembers: state.formData.elderlyMembers || '',
  });

  const [childAges, setChildAges] = useState<string[]>(state.formData.childAges || []);
  const [pets, setPets] = useState<string[]>(state.formData.pets || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const hasChildren = formData.numberOfChildren && formData.numberOfChildren !== '0';

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.familySize) {
      newErrors.familySize = 'Please select your family size';
    }

    if (!formData.numberOfChildren) {
      newErrors.numberOfChildren = 'Please select number of children';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({ ...formData, childAges, pets });
      awardPoints(20);
      nextStep();
      router.push('/onboarding/sponsor/preferences');
    }
  };

  const handleBack = () => {
    updateFormData({ ...formData, childAges, pets });
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
            <Ionicons name="people" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.subtitle}>Profile Step 4 of 9</Text>
          <Text style={styles.title}>Your Family</Text>
          <Text style={styles.description}>
            Help us understand your household needs
          </Text>
        </View>

        {/* Family Size */}
        <View style={styles.section}>
          <Dropdown
            label="Family Size"
            placeholder="How many people in your household?"
            options={familySizeOptions}
            value={formData.familySize}
            onChange={(value) => updateField('familySize', value)}
            error={errors.familySize}
            required
          />
        </View>

        {/* Children */}
        <View style={styles.section}>
          <Dropdown
            label="Number of Children"
            placeholder="How many children?"
            options={childrenOptions}
            value={formData.numberOfChildren}
            onChange={(value) => updateField('numberOfChildren', value)}
            error={errors.numberOfChildren}
            required
          />
        </View>

        {/* Child Ages */}
        {hasChildren && (
          <View style={styles.section}>
            <MultiSelect
              label="Children's Age Groups"
              options={childAgeGroups}
              selected={childAges}
              onChange={setChildAges}
              columns={1}
            />
          </View>
        )}

        {/* Elderly Members */}
        <View style={styles.section}>
          <Dropdown
            label="Elderly Family Members"
            placeholder="Any elderly members needing care?"
            options={elderlyOptions}
            value={formData.elderlyMembers}
            onChange={(value) => updateField('elderlyMembers', value)}
          />
        </View>

        {/* Pets */}
        <View style={styles.section}>
          <MultiSelect
            label="Pets in Household"
            options={petsOptions}
            selected={pets}
            onChange={setPets}
            columns={2}
          />
          <Text style={styles.helperText}>
            Some workers have experience with pet care
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="heart" size={20} color="#1E40AF" />
          <Text style={styles.infoText}>
            This helps us match you with workers who have relevant experience with your family needs.
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
  section: {
    marginBottom: 20,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
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
