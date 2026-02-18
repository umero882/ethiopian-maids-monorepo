/**
 * User Intro Screen
 *
 * Shows role-specific introduction based on selected user type.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { USER_TYPE_THEMES } from '../../data/onboardingConfig';

const { width } = Dimensions.get('window');

interface IntroContent {
  title: string;
  subtitle: string;
  benefits: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[];
  stats: { label: string; value: string }[];
}

const getIntroContent = (userType: string | null): IntroContent => {
  switch (userType) {
    case 'maid':
      return {
        title: "Let's Build Your Future",
        subtitle: 'Thousands of families are waiting to connect with talented domestic workers like you',
        benefits: [
          {
            icon: 'shield-checkmark',
            title: 'Verified Employers',
            description: 'Connect only with verified families and agencies',
          },
          {
            icon: 'cash-outline',
            title: 'Competitive Salaries',
            description: 'Find positions that match your salary expectations',
          },
          {
            icon: 'globe-outline',
            title: 'GCC Opportunities',
            description: 'Access jobs across UAE, Saudi Arabia, Kuwait, and more',
          },
          {
            icon: 'document-text-outline',
            title: 'Easy Application',
            description: 'Apply to multiple positions with your profile',
          },
        ],
        stats: [
          { label: 'Active Jobs', value: '500+' },
          { label: 'Avg. Placement', value: '8 days' },
          { label: 'Success Rate', value: '95%' },
        ],
      };
    case 'sponsor':
      return {
        title: 'Find Your Perfect Match',
        subtitle: 'Connect with pre-screened, verified domestic workers who fit your needs',
        benefits: [
          {
            icon: 'search',
            title: 'Smart Matching',
            description: 'Our algorithm finds workers that match your requirements',
          },
          {
            icon: 'shield-checkmark',
            title: 'Verified Profiles',
            description: 'All workers undergo identity and background verification',
          },
          {
            icon: 'chatbubbles-outline',
            title: 'Direct Communication',
            description: 'Message candidates directly through the platform',
          },
          {
            icon: 'document-outline',
            title: 'Contract Support',
            description: 'Access ready-to-use contract templates',
          },
        ],
        stats: [
          { label: 'Available Workers', value: '3,500+' },
          { label: 'Avg. Response', value: '24 hrs' },
          { label: 'Happy Families', value: '1,500+' },
        ],
      };
    case 'agency':
      return {
        title: 'Scale Your Business',
        subtitle: 'Powerful tools to manage workers and connect with families efficiently',
        benefits: [
          {
            icon: 'people',
            title: 'Worker Management',
            description: 'Manage all your workers from one dashboard',
          },
          {
            icon: 'trending-up',
            title: 'Lead Generation',
            description: 'Connect with families looking for agency services',
          },
          {
            icon: 'analytics-outline',
            title: 'Analytics Dashboard',
            description: 'Track placements and performance metrics',
          },
          {
            icon: 'flash-outline',
            title: 'Bulk Operations',
            description: 'Import and manage multiple workers at once',
          },
        ],
        stats: [
          { label: 'Agencies', value: '120+' },
          { label: 'Placements', value: '4,500+' },
          { label: 'Coverage', value: '6 Countries' },
        ],
      };
    default:
      return {
        title: 'Welcome',
        subtitle: 'Join our platform',
        benefits: [],
        stats: [],
      };
  }
};

export default function UserIntroScreen() {
  const { state, nextStep, previousStep } = useOnboarding();
  const theme = state.userType ? USER_TYPE_THEMES[state.userType] : null;
  const content = getIntroContent(state.userType);

  const handleContinue = () => {
    nextStep();
    router.push('/onboarding/account');
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  return (
    <LinearGradient
      colors={theme?.bgGradient as [string, string, ...string[]] || ['#1E3A8A', '#1E40AF', '#3B82F6']}
      style={styles.gradient}
    >
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
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {content.stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>What You'll Get</Text>
            {content.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIconContainer}>
                  <Ionicons name={benefit.icon} size={24} color={theme?.accent || '#3B82F6'} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

          {/* CTA Button */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity style={styles.ctaButton} onPress={handleContinue}>
              <Text style={styles.ctaText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={20} color={theme?.primary || '#1E40AF'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  backButton: {
    marginTop: 8,
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  benefitsContainer: {
    gap: 12,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
});
