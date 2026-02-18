/**
 * Sponsor Budget Screen
 *
 * Collects budget and salary expectations.
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

const salaryRangeOptions = [
  { value: '500_1000', label: 'AED 500 - 1,000/month' },
  { value: '1000_1500', label: 'AED 1,000 - 1,500/month' },
  { value: '1500_2000', label: 'AED 1,500 - 2,000/month' },
  { value: '2000_2500', label: 'AED 2,000 - 2,500/month' },
  { value: '2500_3000', label: 'AED 2,500 - 3,000/month' },
  { value: '3000_plus', label: 'AED 3,000+/month' },
  { value: 'negotiable', label: 'Negotiable' },
];

const paymentFrequencyOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi_weekly', label: 'Bi-weekly' },
  { value: 'weekly', label: 'Weekly' },
];

const benefitsOffered = [
  { value: 'food', label: 'Food Provided', icon: 'restaurant-outline' as any },
  { value: 'accommodation', label: 'Accommodation', icon: 'home-outline' as any },
  { value: 'health_insurance', label: 'Health Insurance', icon: 'medkit-outline' as any },
  { value: 'annual_ticket', label: 'Annual Flight Ticket', icon: 'airplane-outline' as any },
  { value: 'day_off', label: 'Weekly Day Off', icon: 'calendar-outline' as any },
  { value: 'phone', label: 'Phone/SIM Card', icon: 'phone-portrait-outline' as any },
  { value: 'end_of_service', label: 'End of Service Gratuity', icon: 'cash-outline' as any },
];

const contractDurationOptions = [
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' },
  { value: '2_years', label: '2 Years' },
  { value: 'negotiable', label: 'Negotiable' },
];

export default function SponsorBudgetScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    salaryBudget: state.formData.salaryBudget || '',
    paymentFrequency: state.formData.paymentFrequency || 'monthly',
    contractDuration: state.formData.contractDuration || '',
  });

  const [benefits, setBenefits] = useState<string[]>(state.formData.benefitsOffered || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.salaryBudget) {
      newErrors.salaryBudget = 'Please select a salary range';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({ ...formData, benefitsOffered: benefits });
      awardPoints(20);
      nextStep();
      router.push('/onboarding/sponsor/accommodation');
    }
  };

  const handleBack = () => {
    updateFormData({ ...formData, benefitsOffered: benefits });
    previousStep();
    router.back();
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const getBenefitCount = () => benefits.length;

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
            <Ionicons name="wallet" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.subtitle}>Profile Step 6 of 9</Text>
          <Text style={styles.title}>Budget & Benefits</Text>
          <Text style={styles.description}>
            Set your budget and the benefits you'll provide
          </Text>
        </View>

        {/* Salary Budget */}
        <View style={styles.section}>
          <Dropdown
            label="Monthly Salary Budget"
            placeholder="Select your budget range"
            options={salaryRangeOptions}
            value={formData.salaryBudget}
            onChange={(value) => updateField('salaryBudget', value)}
            error={errors.salaryBudget}
            required
          />
        </View>

        {/* Payment Frequency */}
        <View style={styles.section}>
          <Dropdown
            label="Payment Frequency"
            placeholder="How often will you pay?"
            options={paymentFrequencyOptions}
            value={formData.paymentFrequency}
            onChange={(value) => updateField('paymentFrequency', value)}
          />
        </View>

        {/* Contract Duration */}
        <View style={styles.section}>
          <Dropdown
            label="Contract Duration"
            placeholder="Preferred contract length"
            options={contractDurationOptions}
            value={formData.contractDuration}
            onChange={(value) => updateField('contractDuration', value)}
          />
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <MultiSelect
            label="Benefits You'll Provide"
            options={benefitsOffered}
            selected={benefits}
            onChange={setBenefits}
            columns={2}
          />
          {getBenefitCount() > 0 && (
            <View style={styles.benefitCount}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.benefitCountText}>
                {getBenefitCount()} benefit{getBenefitCount() > 1 ? 's' : ''} selected
              </Text>
            </View>
          )}
        </View>

        {/* Market Info */}
        <View style={styles.infoBox}>
          <Ionicons name="trending-up" size={20} color="#1E40AF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Market Insight</Text>
            <Text style={styles.infoText}>
              Competitive packages attract more qualified candidates. Most sponsors offer food, accommodation, and annual tickets.
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
  benefitCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  benefitCountText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
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
