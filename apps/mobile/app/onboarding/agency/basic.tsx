/**
 * Agency Basic Info Screen
 *
 * Collects basic agency information.
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

const agencyTypeOptions = [
  { value: 'recruitment', label: 'Recruitment Agency' },
  { value: 'staffing', label: 'Staffing Company' },
  { value: 'placement', label: 'Placement Service' },
  { value: 'labor_supply', label: 'Labor Supply' },
  { value: 'manpower', label: 'Manpower Services' },
];

const companySizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const yearsInBusinessOptions = [
  { value: 'new', label: 'Less than 1 year' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10+', label: '10+ years' },
];

export default function AgencyBasicScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    companyName: state.formData.companyName || '',
    tradeName: state.formData.tradeName || '',
    agencyType: state.formData.agencyType || '',
    companySize: state.formData.companySize || '',
    yearsInBusiness: state.formData.yearsInBusiness || '',
    licenseNumber: state.formData.licenseNumber || '',
    taxNumber: state.formData.taxNumber || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.agencyType) {
      newErrors.agencyType = 'Please select agency type';
    }

    if (!formData.licenseNumber?.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData(formData);
      awardPoints(30);
      nextStep();
      router.push('/onboarding/agency/biometric-doc');
    }
  };

  const handleBack = () => {
    updateFormData(formData);
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
            <Ionicons name="business" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 1 of 9</Text>
          <Text style={styles.title}>Agency Information</Text>
          <Text style={styles.description}>
            Tell us about your recruitment agency
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label="Company Name"
            placeholder="Enter legal company name"
            icon="business-outline"
            value={formData.companyName}
            onChangeText={(text) => updateField('companyName', text)}
            error={errors.companyName}
            required
            autoCapitalize="words"
          />

          <FormInput
            label="Trade Name (Optional)"
            placeholder="Enter trade/brand name if different"
            icon="pricetag-outline"
            value={formData.tradeName}
            onChangeText={(text) => updateField('tradeName', text)}
            autoCapitalize="words"
          />

          <Dropdown
            label="Agency Type"
            placeholder="Select your agency type"
            options={agencyTypeOptions}
            value={formData.agencyType}
            onChange={(value) => updateField('agencyType', value)}
            error={errors.agencyType}
            required
          />

          <Dropdown
            label="Company Size"
            placeholder="How many employees?"
            options={companySizeOptions}
            value={formData.companySize}
            onChange={(value) => updateField('companySize', value)}
          />

          <Dropdown
            label="Years in Business"
            placeholder="How long have you been operating?"
            options={yearsInBusinessOptions}
            value={formData.yearsInBusiness}
            onChange={(value) => updateField('yearsInBusiness', value)}
          />

          <FormInput
            label="License Number"
            placeholder="Enter your business license number"
            icon="document-outline"
            value={formData.licenseNumber}
            onChangeText={(text) => updateField('licenseNumber', text)}
            error={errors.licenseNumber}
            required
          />

          <FormInput
            label="Tax Registration Number"
            placeholder="Enter TRN/VAT number (optional)"
            icon="receipt-outline"
            value={formData.taxNumber}
            onChangeText={(text) => updateField('taxNumber', text)}
          />
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+30 points for completing this step</Text>
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
  form: {
    marginBottom: 16,
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
