/**
 * Agency Subscriptions Screen
 *
 * Allows agency users to view and manage their subscription plan.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useSubscription,
  useSubscriptionPricing,
  SUBSCRIPTION_PLANS,
  type PlanConfig,
  type BillingCycle,
} from '../../hooks/useSubscription';

const AGENCY_PLANS = SUBSCRIPTION_PLANS.agency;

interface PlanCardProps {
  plan: PlanConfig;
  isCurrentPlan: boolean;
  billingCycle: BillingCycle;
  onSelect: () => void;
}

const PlanCard = ({ plan, isCurrentPlan, billingCycle, onSelect }: PlanCardProps) => {
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const isPopular = plan.popular === true;

  return (
    <View style={[
      styles.planCard,
      isCurrentPlan && styles.currentPlanCard,
      isPopular && styles.popularPlanCard,
    ]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}

      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planDescription}>{plan.description}</Text>

      <View style={styles.priceContainer}>
        {price === 0 ? (
          <Text style={styles.priceText}>Free</Text>
        ) : (
          <>
            <Text style={styles.priceText}>{plan.currency} {price}</Text>
            <Text style={styles.pricePeriod}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</Text>
          </>
        )}
      </View>

      {billingCycle === 'annual' && price > 0 && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>
            Save {plan.currency} {(plan.monthlyPrice * 12 - plan.annualPrice).toFixed(0)}/year
          </Text>
        </View>
      )}

      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.limitsContainer}>
        <Text style={styles.limitsTitle}>Plan Limits</Text>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Job Postings:</Text>
          <Text style={styles.limitValue}>
            {plan.limits.activeJobPostings === 'Unlimited' ? 'Unlimited' : plan.limits.activeJobPostings}
          </Text>
        </View>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Saved Candidates:</Text>
          <Text style={styles.limitValue}>
            {plan.limits.savedCandidates === 'Unlimited' ? 'Unlimited' : plan.limits.savedCandidates}
          </Text>
        </View>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Messages:</Text>
          <Text style={styles.limitValue}>
            {plan.limits.messageThreads === 'Unlimited' ? 'Unlimited' : plan.limits.messageThreads}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.selectButton,
          isCurrentPlan && styles.currentButton,
          isPopular && !isCurrentPlan && styles.popularButton,
        ]}
        onPress={onSelect}
        disabled={isCurrentPlan}
      >
        <Text style={[
          styles.selectButtonText,
          isCurrentPlan && styles.currentButtonText,
          isPopular && !isCurrentPlan && styles.popularButtonText,
        ]}>
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function AgencySubscriptionsScreen() {
  const {
    subscription,
    currentPlan,
    currentPlanConfig,
    availablePlans,
    loading,
    daysRemaining,
    statusDisplay,
    openCheckout,
    openManagePortal,
  } = useSubscription();

  const { billingCycle, setBillingCycle, formatPrice } = useSubscriptionPricing('agency');

  const handleSelectPlan = async (plan: PlanConfig) => {
    if (plan.id === 'free') {
      Alert.alert(
        'Downgrade to Free',
        'Are you sure you want to downgrade to the free plan? You will lose access to premium features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Downgrade', style: 'destructive', onPress: () => {
            // Handle downgrade
            openManagePortal();
          }},
        ]
      );
      return;
    }

    // For paid plans, open checkout
    Alert.alert(
      'Upgrade Plan',
      `Upgrade to ${plan.name} for ${formatPrice(billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice, plan.currency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => openCheckout(plan.id, billingCycle) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Subscriptions' }} />
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen
        options={{
          title: 'Agency Subscriptions',
          headerStyle: { backgroundColor: '#10B981' },
          headerTintColor: '#fff',
        }}
      />

      {/* Current Plan Summary */}
      <View style={styles.currentPlanContainer}>
        <View style={styles.currentPlanHeader}>
          <View style={styles.currentPlanBadge}>
            <Ionicons name="diamond" size={20} color="#10B981" />
            <Text style={styles.currentPlanBadgeText}>Current Plan</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusDisplay.color + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: statusDisplay.color }]}>
              {statusDisplay.text}
            </Text>
          </View>
        </View>
        <Text style={styles.currentPlanName}>{currentPlanConfig?.name || 'Free'}</Text>
        <Text style={styles.currentPlanPrice}>
          {subscription
            ? formatPrice(subscription.amount, subscription.currency)
            : 'Free'}
        </Text>
        {subscription?.endDate && (
          <Text style={styles.renewalDate}>
            {subscription.cancelledAt
              ? `Expires: ${new Date(subscription.endDate).toLocaleDateString()}`
              : `Renews: ${new Date(subscription.endDate).toLocaleDateString()}`}
          </Text>
        )}
        {daysRemaining !== null && daysRemaining > 0 && (
          <Text style={styles.daysRemaining}>{daysRemaining} days remaining</Text>
        )}
      </View>

      {/* Agency Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Why Upgrade Your Agency Plan?</Text>
        <View style={styles.benefitsGrid}>
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people" size={24} color="#10B981" />
            </View>
            <Text style={styles.benefitTitle}>More Listings</Text>
            <Text style={styles.benefitDesc}>List more workers</Text>
          </View>
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="briefcase" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.benefitTitle}>More Jobs</Text>
            <Text style={styles.benefitDesc}>Post unlimited jobs</Text>
          </View>
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.benefitTitle}>Priority</Text>
            <Text style={styles.benefitDesc}>Featured listings</Text>
          </View>
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="analytics" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.benefitTitle}>Analytics</Text>
            <Text style={styles.benefitDesc}>Advanced insights</Text>
          </View>
        </View>
      </View>

      {/* Billing Cycle Toggle */}
      <View style={styles.billingToggleContainer}>
        <Text style={styles.sectionTitle}>Choose Billing Cycle</Text>
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingOption, billingCycle === 'monthly' && styles.billingOptionActive]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[styles.billingOptionText, billingCycle === 'monthly' && styles.billingOptionTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billingCycle === 'annual' && styles.billingOptionActive]}
            onPress={() => setBillingCycle('annual')}
          >
            <Text style={[styles.billingOptionText, billingCycle === 'annual' && styles.billingOptionTextActive]}>
              Annual
            </Text>
            <View style={styles.saveLabel}>
              <Text style={styles.saveLabelText}>Save 20%</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plan Cards */}
      <View style={styles.plansContainer}>
        {AGENCY_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlan === plan.id}
            billingCycle={billingCycle}
            onSelect={() => handleSelectPlan(plan)}
          />
        ))}
      </View>

      {/* Subscription Management */}
      {currentPlan !== 'free' && (
        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>Manage Subscription</Text>
          <View style={styles.managementCard}>
            <TouchableOpacity
              style={styles.managementButton}
              onPress={openManagePortal}
            >
              <Ionicons name="settings-outline" size={22} color="#10B981" />
              <Text style={styles.managementButtonText}>Manage on Web</Text>
              <Ionicons name="open-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementButton}
              onPress={() => Linking.openURL('mailto:support@ethiopianmaids.com?subject=Agency Subscription Help')}
            >
              <Ionicons name="mail-outline" size={22} color="#10B981" />
              <Text style={styles.managementButtonText}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Can I change plans anytime?</Text>
          <Text style={styles.faqAnswer}>
            Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing cycle for downgrades.
          </Text>
        </View>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>What happens to my data if I downgrade?</Text>
          <Text style={styles.faqAnswer}>
            Your data is preserved, but you may lose access to some features. Excess listings above the new plan limits will become inactive.
          </Text>
        </View>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Do you offer custom enterprise solutions?</Text>
          <Text style={styles.faqAnswer}>
            Yes! Contact our sales team for custom features, dedicated support, API access, and white-label options.
          </Text>
        </View>
      </View>

      {/* Support */}
      <View style={styles.supportSection}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <Text style={styles.supportText}>
          Contact our agency support team for any questions about your subscription.
        </Text>
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => router.push('/profile/help')}
        >
          <Ionicons name="headset-outline" size={20} color="#fff" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  currentPlanContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentPlanBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  currentPlanPrice: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 4,
  },
  renewalDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  daysRemaining: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 4,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  billingToggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  billingOptionActive: {
    backgroundColor: '#fff',
  },
  billingOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  billingOptionTextActive: {
    color: '#1F2937',
  },
  saveLabel: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  plansContainer: {
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentPlanCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  popularPlanCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  savingsBadge: {
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  limitsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  limitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  limitLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  limitValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: '#ECFDF5',
  },
  popularButton: {
    backgroundColor: '#10B981',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  currentButtonText: {
    color: '#10B981',
  },
  popularButtonText: {
    color: '#fff',
  },
  managementSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  managementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  managementButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  faqSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  faqCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  supportSection: {
    backgroundColor: '#ECFDF5',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 40,
  },
});
