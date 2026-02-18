/**
 * Agency Consents Screen
 *
 * Collects required agreements and terms acceptance.
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
  link?: string;
}

const consentItems: ConsentItem[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'I agree to the platform Terms of Service and usage policies',
    required: true,
    link: 'https://ethiopianmaids.com/terms',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'I consent to the collection and processing of data as described',
    required: true,
    link: 'https://ethiopianmaids.com/privacy',
  },
  {
    id: 'agency_agreement',
    title: 'Agency Partner Agreement',
    description: 'I agree to the agency partner terms, including commission structures and conduct guidelines',
    required: true,
    link: 'https://ethiopianmaids.com/agency-agreement',
  },
  {
    id: 'ethical_recruitment',
    title: 'Ethical Recruitment Pledge',
    description: 'I commit to ethical recruitment practices as defined by ILO standards',
    required: true,
    link: 'https://ethiopianmaids.com/ethical-standards',
  },
  {
    id: 'verification',
    title: 'Verification Consent',
    description: 'I authorize verification of business documents and licenses submitted',
    required: true,
  },
  {
    id: 'marketing',
    title: 'Marketing Communications',
    description: 'I would like to receive promotional offers and updates',
    required: false,
  },
];

export default function AgencyConsentsScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints } = useOnboarding();

  const initialConsents: Record<string, boolean> = {};
  consentItems.forEach((item) => {
    initialConsents[item.id] = state.consents[item.id] || false;
  });

  const [consents, setConsents] = useState(initialConsents);
  const [error, setError] = useState('');

  const progress = getProgress();

  const requiredConsents = consentItems.filter((c) => c.required);
  const allRequiredAccepted = requiredConsents.every((c) => consents[c.id]);

  const toggleConsent = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
    if (error) setError('');
  };

  const acceptAllRequired = () => {
    const updated = { ...consents };
    requiredConsents.forEach((c) => {
      updated[c.id] = true;
    });
    setConsents(updated);
    setError('');
  };

  const openLink = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleContinue = () => {
    if (!allRequiredAccepted) {
      setError('Please accept all required agreements to continue');
      return;
    }

    updateFormData({ consents });
    awardPoints(15);
    nextStep();
    router.push('/onboarding/reviews');
  };

  const handleBack = () => {
    updateFormData({ consents });
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
            <Ionicons name="document-text" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 8 of 9</Text>
          <Text style={styles.title}>Agreements</Text>
          <Text style={styles.description}>
            Review and accept the required agreements
          </Text>
        </View>

        {/* Accept All Button */}
        {!allRequiredAccepted && (
          <TouchableOpacity style={styles.acceptAllButton} onPress={acceptAllRequired}>
            <Ionicons name="checkmark-done" size={20} color="#059669" />
            <Text style={styles.acceptAllText}>Accept All Required</Text>
          </TouchableOpacity>
        )}

        {/* Consent Items */}
        <View style={styles.consentsContainer}>
          {consentItems.map((item) => (
            <View key={item.id} style={styles.consentItem}>
              <View style={styles.consentContent}>
                <View style={styles.consentHeader}>
                  <Text style={styles.consentTitle}>
                    {item.title}
                    {item.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  {item.link && (
                    <TouchableOpacity onPress={() => openLink(item.link)}>
                      <Ionicons name="open-outline" size={18} color="#059669" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.consentDescription}>{item.description}</Text>
              </View>
              <Switch
                value={consents[item.id]}
                onValueChange={() => toggleConsent(item.id)}
                trackColor={{ false: '#E5E7EB', true: '#059669' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Compliance Notice */}
        <View style={styles.complianceNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.complianceText}>
            As a recruitment agency, compliance with these agreements ensures your business operates within legal and ethical standards.
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
          <TouchableOpacity
            style={[styles.continueButton, !allRequiredAccepted && styles.continueButtonDisabled]}
            onPress={handleContinue}
          >
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
  acceptAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  acceptAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  consentsContainer: {
    marginBottom: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  consentContent: {
    flex: 1,
    marginRight: 12,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  required: {
    color: '#EF4444',
  },
  consentDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  complianceNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  complianceText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
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
    backgroundColor: '#059669',
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
