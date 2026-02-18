/**
 * Welcome Screen (Onboarding Index)
 *
 * First screen in the onboarding flow.
 * Introduces the platform and checks for saved drafts.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { DraftRecoveryModal } from '../../components/onboarding';
import { PLATFORM_STATS } from '../../data/onboardingConfig';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { resetOnboarding, loadDraftData, getDraftInfo, clearDraft } = useOnboarding();
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{
    userType: any;
    timestamp: number | null;
    daysRemaining: number | null;
  } | null>(null);

  useEffect(() => {
    checkForDraft();
  }, []);

  const checkForDraft = async () => {
    const info = await getDraftInfo();
    if (info?.exists && info.userType) {
      setDraftInfo({
        userType: info.userType,
        timestamp: info.timestamp,
        daysRemaining: info.daysRemaining,
      });
      setShowDraftModal(true);
    }
  };

  const handleResumeDraft = async () => {
    setShowDraftModal(false);
    await loadDraftData();
    router.push('/onboarding/user-type');
  };

  const handleStartFresh = async () => {
    setShowDraftModal(false);
    await clearDraft(); // Clear AsyncStorage draft and reset state
    router.push('/onboarding/user-type');
  };

  const handleGetStarted = () => {
    router.push('/onboarding/user-type');
  };

  const handleSignIn = () => {
    router.replace('/auth/login');
  };

  return (
    <LinearGradient
      colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="people" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>Ethiopian Maids</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Connect with Trusted Domestic Workers</Text>
          <Text style={styles.heroSubtitle}>
            Join thousands of families and workers across the GCC region
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{PLATFORM_STATS.totalMaids}</Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{PLATFORM_STATS.totalFamilies}</Text>
            <Text style={styles.statLabel}>Families</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{PLATFORM_STATS.successRate}</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.featureText}>Verified Profiles</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={24} color="#10B981" />
            <Text style={styles.featureText}>Secure Platform</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={24} color="#10B981" />
            <Text style={styles.featureText}>Quick Matching</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#1E40AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Draft Recovery Modal */}
        <DraftRecoveryModal
          visible={showDraftModal}
          userType={draftInfo?.userType || null}
          timestamp={draftInfo?.timestamp || null}
          daysRemaining={draftInfo?.daysRemaining || null}
          onResume={handleResumeDraft}
          onStartFresh={handleStartFresh}
          onDismiss={() => setShowDraftModal(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  featuresContainer: {
    marginTop: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  ctaContainer: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
