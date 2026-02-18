/**
 * Subscription Page
 *
 * Polished pricing/subscription page displayed immediately after phone verification.
 * Shows user-type-specific pricing tiers with "Most Popular" badges and skip option.
 * All prices displayed in AED (UAE Dirham) for the GCC market.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../context/OnboardingContext';
import { ProgressBar, GamificationBadge } from '../../components/onboarding';
import {
  SUBSCRIPTION_PLANS,
  USER_TYPE_THEMES,
  SubscriptionPlan,
} from '../../data/onboardingConfig';

const { width } = Dimensions.get('window');

// Pricing Card Component
interface PricingCardProps {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  theme: typeof USER_TYPE_THEMES.maid;
  index: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isSelected,
  onSelect,
  theme,
  index,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Selection glow animation
    Animated.timing(glowAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', theme.primary],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSelect}
        style={styles.cardTouchable}
      >
        <Animated.View
          style={[
            styles.card,
            plan.popular && styles.cardPopular,
            {
              borderColor: borderColor,
              shadowOpacity: shadowOpacity,
            },
          ]}
        >
          {/* Popular Badge */}
          {plan.popular && (
            <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>
          )}

          {/* Plan Name */}
          <Text style={styles.planName}>{plan.name}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            {plan.price === 0 ? (
              <Text style={[styles.priceText, styles.freePrice]}>Free</Text>
            ) : (
              <>
                <Text style={styles.currency}>AED</Text>
                <Text style={[styles.priceText, { color: theme.primary }]}>
                  {plan.price}
                </Text>
                <Text style={styles.period}>{plan.period}</Text>
              </>
            )}
          </View>

          {/* Description */}
          <Text style={styles.planDescription}>{plan.description}</Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {plan.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={plan.popular ? theme.primary : '#10B981'}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Select Button */}
          <TouchableOpacity
            style={[
              styles.selectButton,
              isSelected && { backgroundColor: theme.primary },
              !isSelected && plan.popular && styles.selectButtonPopular,
            ]}
            onPress={onSelect}
          >
            <Text
              style={[
                styles.selectButtonText,
                isSelected && styles.selectButtonTextSelected,
                !isSelected && plan.popular && { color: theme.primary },
              ]}
            >
              {isSelected ? 'Selected' : 'Select Plan'}
            </Text>
            {isSelected && (
              <Ionicons name="checkmark" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SubscriptionScreen() {
  const { state, nextStep, previousStep, getProgress } = useOnboarding();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');

  const userType = state.userType || 'maid';
  const theme = USER_TYPE_THEMES[userType];
  const plans = SUBSCRIPTION_PLANS[userType];

  const progress = getProgress();

  // Hero icon animation
  const heroScale = useRef(new Animated.Value(0)).current;
  const heroRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(heroRotate, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = heroRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    // TODO: In production, handle subscription purchase here
    nextStep();
    router.push('/onboarding/congratulations');
  };

  const handleSkip = () => {
    // Skip to congratulations with free plan
    setSelectedPlan('free');
    nextStep();
    router.push('/onboarding/congratulations');
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  const getHeadline = () => {
    switch (userType) {
      case 'maid':
        return 'Boost Your Job Search';
      case 'sponsor':
        return 'Find Your Perfect Match';
      case 'agency':
        return 'Grow Your Business';
      default:
        return 'Choose Your Plan';
    }
  };

  const getSubheadline = () => {
    switch (userType) {
      case 'maid':
        return 'Get noticed by more employers with premium features';
      case 'sponsor':
        return 'Access verified domestic workers and premium support';
      case 'agency':
        return 'Scale your recruitment with powerful tools';
      default:
        return 'Select a plan that fits your needs';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Progress */}
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

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.heroIconContainer,
              {
                transform: [
                  { scale: heroScale },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              style={styles.heroIconGradient}
            >
              <Ionicons name="diamond" size={40} color="#fff" />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.heroTitle}>{getHeadline()}</Text>
          <Text style={styles.heroSubtitle}>{getSubheadline()}</Text>
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingSection}>
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
              theme={theme}
              index={index}
            />
          ))}
        </View>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.trustText}>Secure Payment</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="refresh" size={20} color="#3B82F6" />
            <Text style={styles.trustText}>Cancel Anytime</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="lock-closed" size={20} color="#8B5CF6" />
            <Text style={styles.trustText}>SSL Encrypted</Text>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer with CTA */}
      <View style={styles.footer}>
        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedPlan !== 'free' && { backgroundColor: theme.primary },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {selectedPlan === 'free' ? 'Continue with Free' : 'Get Started'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Ionicons name="play-skip-forward" size={18} color="#6B7280" />
          <Text style={styles.skipButtonText}>Skip for now - Continue with Free</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
    marginRight: 12,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  // Pricing Cards
  pricingSection: {
    marginBottom: 24,
  },
  cardContainer: {
    marginBottom: 16,
  },
  cardTouchable: {
    borderRadius: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPopular: {
    backgroundColor: '#F8FAFF',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currency: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 4,
  },
  priceText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1E40AF',
  },
  freePrice: {
    color: '#10B981',
  },
  period: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 2,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  selectButtonPopular: {
    backgroundColor: '#EEF2FF',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectButtonTextSelected: {
    color: '#fff',
  },

  // Trust Section
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  bottomSpacer: {
    height: 180,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
