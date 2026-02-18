/**
 * Maid Skills Screen
 *
 * Allows maid to select their skills.
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
} from '../../../components/onboarding';

const skillsOptions = [
  { value: 'cleaning', label: 'House Cleaning', icon: 'home-outline' as any },
  { value: 'cooking', label: 'Cooking', icon: 'restaurant-outline' as any },
  { value: 'childcare', label: 'Child Care', icon: 'people-outline' as any },
  { value: 'elderly_care', label: 'Elderly Care', icon: 'heart-outline' as any },
  { value: 'laundry', label: 'Laundry & Ironing', icon: 'shirt-outline' as any },
  { value: 'driving', label: 'Driving', icon: 'car-outline' as any },
  { value: 'pet_care', label: 'Pet Care', icon: 'paw-outline' as any },
  { value: 'gardening', label: 'Gardening', icon: 'leaf-outline' as any },
  { value: 'tutoring', label: 'Tutoring', icon: 'book-outline' as any },
  { value: 'sewing', label: 'Sewing', icon: 'cut-outline' as any },
];

const languageOptions = [
  { value: 'amharic', label: 'Amharic' },
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'french', label: 'French' },
  { value: 'tigrinya', label: 'Tigrinya' },
  { value: 'oromo', label: 'Oromo' },
  { value: 'somali', label: 'Somali' },
  { value: 'swahili', label: 'Swahili' },
];

export default function MaidSkillsScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [skills, setSkills] = useState<string[]>(state.formData.skills || []);
  const [languages, setLanguages] = useState<string[]>(state.formData.languages || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (skills.length === 0) {
      newErrors.skills = 'Please select at least one skill';
    }

    if (languages.length === 0) {
      newErrors.languages = 'Please select at least one language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({ skills, languages });
      awardPoints(20);

      // Award skill master achievement if 5+ skills selected
      if (skills.length >= 5) {
        awardPoints(50);
        addAchievement({
          id: 'skill_master',
          name: 'Skill Master',
          description: 'Added 5+ skills',
          icon: 'ribbon',
          points: 50,
          trigger: 'skillsCount',
          earnedAt: new Date().toISOString(),
        });
      }

      nextStep();
      router.push('/onboarding/maid/experience');
    }
  };

  const handleBack = () => {
    updateFormData({ skills, languages });
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
            <Ionicons name="construct" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 5 of 10</Text>
          <Text style={styles.title}>Your Skills</Text>
          <Text style={styles.description}>
            Select all the skills you have to show families what you can do
          </Text>
        </View>

        {/* Skills Selection */}
        <View style={styles.section}>
          <MultiSelect
            label="Skills"
            options={skillsOptions}
            selected={skills}
            onChange={setSkills}
            error={errors.skills}
            required
            columns={1}
          />

          {/* Skill Master Hint */}
          {skills.length > 0 && skills.length < 5 && (
            <View style={styles.hintContainer}>
              <Ionicons name="bulb-outline" size={18} color="#D97706" />
              <Text style={styles.hintText}>
                Select {5 - skills.length} more skills to earn the "Skill Master" achievement!
              </Text>
            </View>
          )}

          {skills.length >= 5 && (
            <View style={[styles.hintContainer, styles.achievementContainer]}>
              <Ionicons name="trophy" size={18} color="#10B981" />
              <Text style={[styles.hintText, styles.achievementText]}>
                Great! You qualify for the "Skill Master" achievement (+50 pts)
              </Text>
            </View>
          )}
        </View>

        {/* Languages Selection */}
        <View style={styles.section}>
          <MultiSelect
            label="Languages Spoken"
            options={languageOptions}
            selected={languages}
            onChange={setLanguages}
            error={errors.languages}
            required
            columns={2}
          />
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
    marginBottom: 24,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  achievementContainer: {
    backgroundColor: '#D1FAE5',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  achievementText: {
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
