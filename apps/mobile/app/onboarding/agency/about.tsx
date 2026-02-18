/**
 * Agency About Screen
 *
 * Collects agency description and value propositions.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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

const valuePropositions = [
  { value: 'quality_workers', label: 'Quality Workers', icon: 'star-outline' as any },
  { value: 'fast_processing', label: 'Fast Processing', icon: 'flash-outline' as any },
  { value: 'competitive_pricing', label: 'Competitive Pricing', icon: 'cash-outline' as any },
  { value: 'replacement_guarantee', label: 'Replacement Guarantee', icon: 'shield-outline' as any },
  { value: 'training_programs', label: 'Training Programs', icon: 'school-outline' as any },
  { value: 'legal_compliance', label: '100% Legal Compliance', icon: 'checkmark-circle-outline' as any },
  { value: '24_7_support', label: '24/7 Support', icon: 'call-outline' as any },
  { value: 'transparent_process', label: 'Transparent Process', icon: 'eye-outline' as any },
];

const exampleDescriptions = [
  {
    title: 'Professional & Experienced',
    text: 'With over 10 years of experience in international recruitment, we pride ourselves on connecting families with qualified, trained domestic workers. Our rigorous screening process ensures only the best candidates join our network.',
  },
  {
    title: 'Customer-Focused',
    text: 'We understand that finding the right domestic helper is a personal decision. Our dedicated team works closely with sponsors to understand their specific needs and match them with the perfect candidate.',
  },
  {
    title: 'Ethical Recruitment',
    text: 'We are committed to ethical recruitment practices that protect both workers and employers. All our processes comply with international labor standards and local regulations.',
  },
];

export default function AgencyAboutScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [description, setDescription] = useState(state.formData.agencyDescription || '');
  const [values, setValues] = useState<string[]>(state.formData.valuePropositions || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();
  const charCount = description.length;
  const minChars = 100;
  const maxChars = 1000;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (charCount < minChars) {
      newErrors.description = `Please write at least ${minChars} characters`;
    }

    if (values.length === 0) {
      newErrors.values = 'Please select at least one value proposition';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({
        agencyDescription: description,
        valuePropositions: values,
      });
      awardPoints(25);

      // Award achievement for comprehensive profile
      if (charCount >= 300 && values.length >= 3) {
        addAchievement({
          id: 'professional_agency',
          name: 'Professional Agency',
          description: 'Created a comprehensive agency profile',
          icon: 'briefcase',
          points: 40,
          trigger: 'profileCompletion',
          earnedAt: new Date().toISOString(),
        });
        awardPoints(40);
      }

      nextStep();
      router.push('/onboarding/agency/consents');
    }
  };

  const handleBack = () => {
    updateFormData({
      agencyDescription: description,
      valuePropositions: values,
    });
    previousStep();
    router.back();
  };

  const useTemplate = (text: string) => {
    setDescription(text);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: '' }));
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
            <Ionicons name="information-circle" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 7 of 9</Text>
          <Text style={styles.title}>About Your Agency</Text>
          <Text style={styles.description}>
            Tell sponsors why they should choose your agency
          </Text>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Company Description <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.textAreaContainer, errors.description && styles.textAreaError]}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your agency, mission, and what makes you unique..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={(text) => {
                if (text.length <= maxChars) {
                  setDescription(text);
                  if (errors.description && text.length >= minChars) {
                    setErrors((prev) => ({ ...prev, description: '' }));
                  }
                }
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.charCountRow}>
            <Text style={[styles.charCount, charCount < minChars && styles.charCountWarning]}>
              {charCount}/{maxChars} characters
              {charCount < minChars && ` (min ${minChars})`}
            </Text>
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>
        </View>

        {/* Example Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need inspiration?</Text>
          {exampleDescriptions.map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleCard}
              onPress={() => useTemplate(example.text)}
            >
              <View style={styles.exampleHeader}>
                <Text style={styles.exampleTitle}>{example.title}</Text>
                <Text style={styles.useTemplate}>Use this</Text>
              </View>
              <Text style={styles.exampleText} numberOfLines={2}>
                {example.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Value Propositions */}
        <View style={styles.section}>
          <MultiSelect
            label="What Sets You Apart"
            options={valuePropositions}
            selected={values}
            onChange={(selected) => {
              setValues(selected);
              if (errors.values) {
                setErrors((prev) => ({ ...prev, values: '' }));
              }
            }}
            error={errors.values}
            required
            columns={2}
          />
        </View>

        {/* Achievement Hint */}
        {(charCount < 300 || values.length < 3) && (
          <View style={styles.hintBox}>
            <Ionicons name="trophy-outline" size={18} color="#D97706" />
            <Text style={styles.hintText}>
              Write 300+ chars and select 3+ values to earn "Professional Agency" badge (+40 pts)
            </Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  textAreaContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  textAreaError: {
    borderColor: '#EF4444',
  },
  textArea: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 140,
    lineHeight: 24,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  charCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  charCountWarning: {
    color: '#F59E0B',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  exampleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  useTemplate: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  exampleText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  hintText: {
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
