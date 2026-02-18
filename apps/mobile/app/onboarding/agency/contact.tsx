/**
 * Agency Contact Screen
 *
 * Collects contact information.
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
} from '../../../components/onboarding';

export default function AgencyContactScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [formData, setFormData] = useState({
    officeAddress: state.formData.officeAddress || '',
    city: state.formData.city || '',
    country: state.formData.country || '',
    postalCode: state.formData.postalCode || '',
    officePhone: state.formData.officePhone || '',
    whatsapp: state.formData.whatsapp || '',
    companyEmail: state.formData.companyEmail || '',
    website: state.formData.website || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.officeAddress?.trim()) {
      newErrors.officeAddress = 'Office address is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.officePhone?.trim()) {
      newErrors.officePhone = 'Office phone is required';
    }

    if (!formData.companyEmail?.trim()) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData(formData);
      awardPoints(20);
      nextStep();
      router.push('/onboarding/agency/representative');
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
            <Ionicons name="call" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 4 of 9</Text>
          <Text style={styles.title}>Contact Information</Text>
          <Text style={styles.description}>
            How can clients and workers reach your agency?
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label="Office Address"
            placeholder="Enter full office address"
            icon="location-outline"
            value={formData.officeAddress}
            onChangeText={(text) => updateField('officeAddress', text)}
            error={errors.officeAddress}
            required
            multiline
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <FormInput
                label="City"
                placeholder="City"
                icon="business-outline"
                value={formData.city}
                onChangeText={(text) => updateField('city', text)}
                error={errors.city}
                required
              />
            </View>
            <View style={styles.halfWidth}>
              <FormInput
                label="Postal Code"
                placeholder="Code"
                icon="mail-outline"
                value={formData.postalCode}
                onChangeText={(text) => updateField('postalCode', text)}
              />
            </View>
          </View>

          <FormInput
            label="Office Phone"
            placeholder="Enter office phone number"
            icon="call-outline"
            value={formData.officePhone}
            onChangeText={(text) => updateField('officePhone', text)}
            error={errors.officePhone}
            required
            keyboardType="phone-pad"
          />

          <FormInput
            label="WhatsApp Number"
            placeholder="WhatsApp for inquiries (optional)"
            icon="logo-whatsapp"
            value={formData.whatsapp}
            onChangeText={(text) => updateField('whatsapp', text)}
            keyboardType="phone-pad"
          />

          <FormInput
            label="Company Email"
            placeholder="Enter company email"
            icon="mail-outline"
            value={formData.companyEmail}
            onChangeText={(text) => updateField('companyEmail', text)}
            error={errors.companyEmail}
            required
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormInput
            label="Website"
            placeholder="https://your-agency.com (optional)"
            icon="globe-outline"
            value={formData.website}
            onChangeText={(text) => updateField('website', text)}
            autoCapitalize="none"
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
