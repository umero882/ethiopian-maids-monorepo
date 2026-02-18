/**
 * UpgradePromptModal Component for Mobile
 *
 * Shows detailed upgrade benefits and pricing when users click upgrade.
 * Supports user-type-specific features and pricing for agency, maid, and sponsor.
 * Now directly opens Stripe checkout for faster conversion.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

// User-type-specific features for PRO plan
const PRO_FEATURES_BY_USER_TYPE = {
  agency: [
    {
      icon: 'people',
      title: '25 Maid Listings',
      description: 'Publish more maids to attract sponsors',
      color: '#3B82F6',
    },
    {
      icon: 'chatbubbles',
      title: '50 Message Threads',
      description: 'Connect with sponsors directly',
      color: '#10B981',
    },
    {
      icon: 'business',
      title: '100 Sponsor Connections',
      description: 'Expand your network',
      color: '#8B5CF6',
    },
    {
      icon: 'bar-chart',
      title: 'Analytics Dashboard',
      description: 'Track performance & trends',
      color: '#F59E0B',
    },
    {
      icon: 'time',
      title: '24-Hour Support',
      description: 'Fast response time',
      color: '#06B6D4',
    },
    {
      icon: 'mail',
      title: 'Direct Messaging',
      description: 'Chat with sponsors instantly',
      color: '#EC4899',
    },
  ],
  maid: [
    {
      icon: 'eye',
      title: '500+ Profile Views',
      description: 'Get seen by more sponsors',
      color: '#3B82F6',
    },
    {
      icon: 'briefcase',
      title: 'Unlimited Applications',
      description: 'Apply to more opportunities',
      color: '#10B981',
    },
    {
      icon: 'chatbubbles',
      title: 'Direct Messaging',
      description: 'Chat instantly with sponsors',
      color: '#8B5CF6',
    },
    {
      icon: 'star',
      title: 'Featured Placement',
      description: 'Appear at top of search results',
      color: '#F59E0B',
    },
    {
      icon: 'shield-checkmark',
      title: 'Verification Badge',
      description: 'Stand out with trust badge',
      color: '#06B6D4',
    },
    {
      icon: 'flash',
      title: 'Priority Support',
      description: 'Get help faster (24hr)',
      color: '#EC4899',
    },
  ],
  sponsor: [
    {
      icon: 'time',
      title: '1 Week Premium Access',
      description: 'Short-term hiring solution',
      color: '#3B82F6',
    },
    {
      icon: 'search',
      title: '10 Candidate Searches',
      description: 'Find the perfect match',
      color: '#10B981',
    },
    {
      icon: 'heart',
      title: '5 Saved Candidates',
      description: 'Build your shortlist',
      color: '#8B5CF6',
    },
    {
      icon: 'chatbubbles',
      title: '3 Message Threads',
      description: 'Contact maids directly',
      color: '#F59E0B',
    },
    {
      icon: 'headset',
      title: 'Standard Support',
      description: 'Customer service included',
      color: '#EC4899',
    },
  ],
};

// User-type-specific features for PREMIUM plan
const PREMIUM_FEATURES_BY_USER_TYPE = {
  agency: [
    {
      icon: 'people',
      title: 'Unlimited Maid Listings',
      description: 'No limits on your listings',
      color: '#3B82F6',
    },
    {
      icon: 'chatbubbles',
      title: 'Unlimited Messages',
      description: 'Connect without restrictions',
      color: '#10B981',
    },
    {
      icon: 'business',
      title: 'Unlimited Sponsor Connections',
      description: 'Grow your network infinitely',
      color: '#8B5CF6',
    },
    {
      icon: 'bar-chart',
      title: 'Advanced Analytics',
      description: 'Deep insights & reporting',
      color: '#F59E0B',
    },
    {
      icon: 'cloud-upload',
      title: 'Bulk Upload',
      description: 'Import multiple profiles at once',
      color: '#06B6D4',
    },
    {
      icon: 'shield-checkmark',
      title: 'Verification Badge',
      description: 'Build trust & credibility',
      color: '#EC4899',
    },
    {
      icon: 'flash',
      title: '6-Hour Priority Support',
      description: 'Fastest response time',
      color: '#059669',
    },
    {
      icon: 'globe',
      title: 'White-Label Options',
      description: 'Custom branding available',
      color: '#7C3AED',
    },
    {
      icon: 'code',
      title: 'API Access',
      description: 'Integrate with your systems',
      color: '#DC2626',
    },
    {
      icon: 'person',
      title: 'Dedicated Account Manager',
      description: 'Personal support contact',
      color: '#0891B2',
    },
  ],
  maid: [
    {
      icon: 'eye',
      title: 'Unlimited Profile Views',
      description: 'Maximum visibility',
      color: '#3B82F6',
    },
    {
      icon: 'briefcase',
      title: 'Unlimited Applications',
      description: 'Apply without limits',
      color: '#10B981',
    },
    {
      icon: 'chatbubbles',
      title: 'Unlimited Messages',
      description: 'Chat without restrictions',
      color: '#8B5CF6',
    },
    {
      icon: 'star',
      title: 'Top Placement',
      description: 'First in search results',
      color: '#F59E0B',
    },
    {
      icon: 'bar-chart',
      title: 'Profile Analytics',
      description: 'Track your performance',
      color: '#06B6D4',
    },
    {
      icon: 'videocam',
      title: 'Video Profile',
      description: 'Stand out with video',
      color: '#EC4899',
    },
  ],
  sponsor: [
    {
      icon: 'briefcase',
      title: 'Unlimited Job Postings',
      description: 'No limits on postings',
      color: '#3B82F6',
    },
    {
      icon: 'search',
      title: 'Unlimited Searches',
      description: 'Find anyone you need',
      color: '#10B981',
    },
    {
      icon: 'heart',
      title: 'Unlimited Saved Candidates',
      description: 'Save as many as you want',
      color: '#8B5CF6',
    },
    {
      icon: 'chatbubbles',
      title: 'Unlimited Messages',
      description: 'Contact without limits',
      color: '#F59E0B',
    },
    {
      icon: 'sparkles',
      title: 'AI-Powered Matching',
      description: 'Let AI find perfect candidates',
      color: '#06B6D4',
    },
    {
      icon: 'flash',
      title: '6-Hour Priority Support',
      description: 'Fastest response time',
      color: '#EC4899',
    },
    {
      icon: 'person',
      title: 'Dedicated Account Manager',
      description: 'Personal support contact',
      color: '#0891B2',
    },
  ],
};

// User-type-specific pricing for PRO plan
const PRO_PRICING_BY_USER_TYPE = {
  agency: { price: 499, currency: 'AED' },
  maid: { price: 29, currency: 'AED' },
  sponsor: { price: 99, currency: 'AED' },
};

// User-type-specific pricing for PREMIUM plan
const PREMIUM_PRICING_BY_USER_TYPE = {
  agency: { price: 999, currency: 'AED' },
  maid: { price: 49, currency: 'AED' },
  sponsor: { price: 599, currency: 'AED' },
};

// User-type-specific colors
const COLORS_BY_USER_TYPE = {
  agency: {
    primary: '#10B981',
    gradient: ['#10B981', '#059669'],
    light: '#D1FAE5',
  },
  maid: {
    primary: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
    light: '#EDE9FE',
  },
  sponsor: {
    primary: '#3B82F6',
    gradient: ['#3B82F6', '#1E40AF'],
    light: '#DBEAFE',
  },
};

type UserType = 'agency' | 'maid' | 'sponsor';
type PlanType = 'free' | 'pro' | 'premium';

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  userType?: UserType;
  currentPlan?: PlanType;
  title?: string;
  subtitle?: string;
  showSuccessHeader?: boolean;
  successMessage?: string;
}

// Helper function to get upgrade info based on current plan
const getUpgradeInfo = (currentPlan: PlanType) => {
  switch (currentPlan) {
    case 'free':
      return {
        targetPlan: 'pro' as PlanType,
        badgeText: 'UPGRADE TO PRO',
        title: 'Upgrade to Pro',
        subtitle: 'Unlock professional features and boost your visibility',
      };
    case 'pro':
      return {
        targetPlan: 'premium' as PlanType,
        badgeText: 'UPGRADE TO PREMIUM',
        title: 'Upgrade to Premium',
        subtitle: 'Get maximum visibility with enterprise-level features',
      };
    case 'premium':
      return {
        targetPlan: 'premium' as PlanType,
        badgeText: 'PREMIUM PLAN',
        title: 'You have Premium',
        subtitle: 'You already have access to all premium features',
      };
    default:
      return {
        targetPlan: 'pro' as PlanType,
        badgeText: 'UPGRADE TO PRO',
        title: 'Upgrade to Pro',
        subtitle: 'Unlock professional features and boost your visibility',
      };
  }
};

export default function UpgradePromptModal({
  visible,
  onClose,
  userType = 'agency',
  currentPlan = 'free',
  title,
  subtitle,
  showSuccessHeader = false,
  successMessage = '',
}: UpgradePromptModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Get upgrade info based on current plan
  const upgradeInfo = getUpgradeInfo(currentPlan);
  const targetPlan = upgradeInfo.targetPlan;

  // Get features based on target plan (pro or premium)
  const features = targetPlan === 'premium'
    ? (PREMIUM_FEATURES_BY_USER_TYPE[userType] || PREMIUM_FEATURES_BY_USER_TYPE.agency)
    : (PRO_FEATURES_BY_USER_TYPE[userType] || PRO_FEATURES_BY_USER_TYPE.agency);

  // Get pricing based on target plan
  const pricing = targetPlan === 'premium'
    ? (PREMIUM_PRICING_BY_USER_TYPE[userType] || PREMIUM_PRICING_BY_USER_TYPE.agency)
    : (PRO_PRICING_BY_USER_TYPE[userType] || PRO_PRICING_BY_USER_TYPE.agency);

  const colors = COLORS_BY_USER_TYPE[userType] || COLORS_BY_USER_TYPE.agency;

  // Use provided title/subtitle or fall back to upgrade-specific info
  const displayTitle = title || upgradeInfo.title;
  const displaySubtitle = subtitle || upgradeInfo.subtitle;

  const handleUpgradeNow = async () => {
    onClose();

    try {
      // Web app base URL - use localhost for development, production URL otherwise
      // @ts-ignore - __DEV__ is available in React Native
      const baseUrl = process.env.EXPO_PUBLIC_WEB_APP_URL ||
        (typeof __DEV__ !== 'undefined' && __DEV__ ? 'http://localhost:5173' : 'https://ethiopianmaids.com');

      // Deep link URL for success redirect back to app via web checkout success page
      const mobileDeepLink = encodeURIComponent(`ethiopianmaids://payment/success?plan=${targetPlan}`);

      // Build checkout URL for web pricing page
      // The web pricing page handles the Stripe checkout properly
      const params = new URLSearchParams({
        plan: targetPlan,
        billing: 'monthly',
        userType: userType,
        mobile: 'true',
        returnUrl: mobileDeepLink,
      });

      if (user?.uid) {
        params.append('userId', user.uid);
      }
      if (user?.email) {
        params.append('email', user.email);
      }

      const checkoutUrl = `${baseUrl}/pricing?${params.toString()}`;

      console.log('[UpgradeModal] Opening web checkout:', checkoutUrl);

      const canOpen = await Linking.canOpenURL(checkoutUrl);
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
      } else {
        // Fallback to subscription page in app
        router.push(`/${userType}/subscriptions` as any);
      }
    } catch (error) {
      console.error('[UpgradeModal] Error opening checkout:', error);
      // Fallback to subscription page
      try {
        router.push(`/${userType}/subscriptions` as any);
      } catch (navError) {
        Alert.alert('Error', 'Unable to open checkout. Please try again.');
      }
    }
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Success Header (optional) */}
          {showSuccessHeader && (
            <View style={styles.successHeader}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Success!</Text>
              {successMessage && (
                <Text style={styles.successSubtitle}>{successMessage}</Text>
              )}
            </View>
          )}

          {/* Premium Header */}
          <View style={styles.premiumHeader}>
            <View style={[styles.premiumBadge, { backgroundColor: colors.light }]}>
              <Ionicons name="diamond" size={20} color={colors.primary} />
              <Text style={[styles.premiumBadgeText, { color: colors.primary }]}>
                {upgradeInfo.badgeText}
              </Text>
            </View>
            <Text style={styles.premiumTitle}>{displayTitle}</Text>
            <Text style={styles.premiumSubtitle}>{displaySubtitle}</Text>
          </View>

          {/* Features List */}
          <ScrollView
            style={styles.featuresScroll}
            showsVerticalScrollIndicator={false}
          >
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <Ionicons name={feature.icon as any} size={20} color={feature.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pricing Section */}
          <View style={styles.pricingSection}>
            <Text style={styles.pricingLabel}>Starting from</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceCurrency, { color: colors.primary }]}>
                {pricing.currency}
              </Text>
              <Text style={[styles.priceAmount, { color: colors.primary }]}>
                {pricing.price}
              </Text>
              <Text style={styles.priceInterval}>/month</Text>
            </View>
            <Text style={styles.pricingNote}>Cancel anytime • 7-day money-back guarantee</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgradeNow}
              activeOpacity={0.8}
            >
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleMaybeLater}
              activeOpacity={0.7}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconContainer: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  featuresScroll: {
    maxHeight: 240,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  pricingSection: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  pricingLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  priceInterval: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  pricingNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  modalActions: {
    gap: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  laterButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});
