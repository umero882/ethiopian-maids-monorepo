/**
 * Maid Consents Screen
 *
 * Terms and conditions acceptance.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../../context/OnboardingContext';
import { ProgressBar, GamificationBadge } from '../../../components/onboarding';

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  linkText?: string;
  linkUrl?: string;
}

const consentItems: ConsentItem[] = [
  {
    id: 'termsAccepted',
    title: 'Terms of Service',
    description: 'I agree to the Terms of Service',
    required: true,
    linkText: 'Read Terms',
    linkUrl: 'https://ethiopianmaids.com/terms',
  },
  {
    id: 'privacyAccepted',
    title: 'Privacy Policy',
    description: 'I agree to the Privacy Policy',
    required: true,
    linkText: 'Read Policy',
    linkUrl: 'https://ethiopianmaids.com/privacy',
  },
  {
    id: 'profileSharingAccepted',
    title: 'Profile Sharing',
    description: 'I consent to sharing my profile with verified families and agencies',
    required: true,
  },
  {
    id: 'marketingAccepted',
    title: 'Marketing Communications',
    description: 'I would like to receive updates and promotional content',
    required: false,
  },
];

export default function MaidConsentsScreen() {
  const { state, updateConsent, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const [consents, setConsents] = useState<Record<string, boolean>>({
    termsAccepted: state.consents.termsAccepted || false,
    privacyAccepted: state.consents.privacyAccepted || false,
    profileSharingAccepted: state.consents.profileSharingAccepted || false,
    marketingAccepted: state.consents.marketingAccepted || false,
  });

  const [errors, setErrors] = useState<string | null>(null);

  const progress = getProgress();

  const toggleConsent = (id: string) => {
    const newValue = !consents[id];
    setConsents((prev) => ({ ...prev, [id]: newValue }));
    updateConsent(id, newValue);
    setErrors(null);
  };

  const validateForm = (): boolean => {
    const requiredConsents = consentItems.filter((item) => item.required);
    const allRequired = requiredConsents.every((item) => consents[item.id]);

    if (!allRequired) {
      setErrors('Please accept all required agreements');
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (validateForm()) {
      awardPoints(10); // Points for completing consents
      nextStep();
      router.push('/onboarding/reviews');
    }
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  const handleLink = (url: string) => {
    Linking.openURL(url);
  };

  const allRequiredAccepted = consentItems
    .filter((item) => item.required)
    .every((item) => consents[item.id]);

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
            <Ionicons name="checkbox" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 10 of 10</Text>
          <Text style={styles.title}>Terms & Agreements</Text>
          <Text style={styles.description}>
            Please review and accept our terms to complete your registration
          </Text>
        </View>

        {/* Error Message */}
        {errors && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errors}</Text>
          </View>
        )}

        {/* Consent Items */}
        <View style={styles.consentsContainer}>
          {consentItems.map((item) => (
            <View key={item.id} style={styles.consentItem}>
              <View style={styles.consentContent}>
                <View style={styles.consentHeader}>
                  <Text style={styles.consentTitle}>{item.title}</Text>
                  {item.required && (
                    <Text style={styles.requiredBadge}>Required</Text>
                  )}
                </View>
                <Text style={styles.consentDescription}>{item.description}</Text>
                {item.linkUrl && (
                  <TouchableOpacity
                    onPress={() => handleLink(item.linkUrl!)}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>{item.linkText}</Text>
                    <Ionicons name="open-outline" size={14} color="#1E40AF" />
                  </TouchableOpacity>
                )}
              </View>
              <Switch
                value={consents[item.id]}
                onValueChange={() => toggleConsent(item.id)}
                trackColor={{ false: '#E5E7EB', true: '#9333EA50' }}
                thumbColor={consents[item.id] ? '#9333EA' : '#fff'}
              />
            </View>
          ))}
        </View>

        {/* Accept All Button */}
        {!allRequiredAccepted && (
          <TouchableOpacity
            style={styles.acceptAllButton}
            onPress={() => {
              consentItems.forEach((item) => {
                if (item.required && !consents[item.id]) {
                  setConsents((prev) => ({ ...prev, [item.id]: true }));
                  updateConsent(item.id, true);
                }
              });
              setErrors(null);
            }}
          >
            <Ionicons name="checkmark-done" size={20} color="#9333EA" />
            <Text style={styles.acceptAllText}>Accept All Required</Text>
          </TouchableOpacity>
        )}

        {/* Completion Notice */}
        <View style={styles.completionNotice}>
          <Ionicons name="trophy" size={24} color="#F59E0B" />
          <View style={styles.completionNoticeContent}>
            <Text style={styles.completionNoticeTitle}>Almost Done!</Text>
            <Text style={styles.completionNoticeText}>
              Accept the terms to complete your profile and start connecting with families
            </Text>
          </View>
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+10 points for completing this step</Text>
        </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !allRequiredAccepted && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!allRequiredAccepted}
          >
            <Text style={styles.continueText}>Complete Profile</Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  consentsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  consentContent: {
    flex: 1,
    marginRight: 12,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  requiredBadge: {
    marginLeft: 8,
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  consentDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
  acceptAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  acceptAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9333EA',
  },
  completionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  completionNoticeContent: {
    flex: 1,
  },
  completionNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  completionNoticeText: {
    fontSize: 14,
    color: '#B45309',
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
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
