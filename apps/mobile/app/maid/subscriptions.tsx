/**
 * Maid Subscriptions Screen
 *
 * Displays subscription plans, current plan status, and upgrade options for maids.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription, useSubscriptionPricing, useFeatureAccess } from '../../hooks';

export default function MaidSubscriptionsScreen() {
  const {
    subscription,
    currentPlan,
    currentPlanConfig,
    availablePlans,
    loading,
    isExpired,
    daysRemaining,
    statusDisplay,
    openCheckout,
    openManagePortal,
    refresh,
  } = useSubscription();

  const { billingCycle, setBillingCycle, getPrice, getSavings, formatPrice } =
    useSubscriptionPricing('maid');

  const { limits } = useFeatureAccess();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan) return;
    openCheckout(planId as any, billingCycle);
  };

  if (loading && !subscription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Subscriptions' }} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Header */}
        <View
          style={[
            styles.currentPlanCard,
            currentPlan === 'premium'
              ? styles.premiumCard
              : currentPlan === 'pro'
                ? styles.proCard
                : styles.freeCard,
          ]}
        >
          <View style={styles.currentPlanHeader}>
            <View>
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
              <Text style={styles.currentPlanName}>{currentPlanConfig?.name || 'Free'}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusDisplay.color + '20' },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusDisplay.color }]}
              />
              <Text style={[styles.statusText, { color: statusDisplay.color }]}>
                {statusDisplay.text}
              </Text>
            </View>
          </View>

          {subscription && currentPlan !== 'free' && (
            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#fff" />
                <Text style={styles.detailText}>
                  {daysRemaining !== null
                    ? `${daysRemaining} days remaining`
                    : 'No expiration'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={16} color="#fff" />
                <Text style={styles.detailText}>
                  {subscription.currency} {subscription.amount}/{subscription.billingPeriod === 'monthly' ? 'mo' : 'yr'}
                </Text>
              </View>
            </View>
          )}

          {currentPlan !== 'free' && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={openManagePortal}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
              <Ionicons name="open-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Why Upgrade Section for Free Users */}
        {currentPlan === 'free' && (
          <View style={styles.whyUpgradeSection}>
            <View style={styles.whyUpgradeIcon}>
              <Ionicons name="trending-up" size={32} color="#8B5CF6" />
            </View>
            <Text style={styles.whyUpgradeTitle}>Boost Your Profile</Text>
            <Text style={styles.whyUpgradeText}>
              Upgrade to Pro or Premium to get featured in search results, apply to unlimited jobs,
              and increase your visibility to potential employers.
            </Text>
          </View>
        )}

        {/* Billing Cycle Toggle */}
        <View style={styles.billingToggle}>
          <Text style={styles.billingLabel}>Billing Cycle</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                billingCycle === 'monthly' && styles.toggleOptionActive,
              ]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text
                style={[
                  styles.toggleText,
                  billingCycle === 'monthly' && styles.toggleTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                billingCycle === 'annual' && styles.toggleOptionActive,
              ]}
              onPress={() => setBillingCycle('annual')}
            >
              <Text
                style={[
                  styles.toggleText,
                  billingCycle === 'annual' && styles.toggleTextActive,
                ]}
              >
                Annual
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 20%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plan Cards */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {availablePlans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isCurrentPlan && styles.planCardCurrent,
                  plan.popular && styles.planCardPopular,
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      {price === 0 ? 'Free' : `${plan.currency} ${price}`}
                    </Text>
                    {price > 0 && (
                      <Text style={styles.priceInterval}>
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </Text>
                    )}
                    {savings > 0 && billingCycle === 'annual' && (
                      <Text style={styles.savingsText}>Save {savings}%</Text>
                    )}
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={isCurrentPlan ? '#10B981' : '#8B5CF6'}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    isCurrentPlan && styles.selectButtonCurrent,
                    plan.id === 'premium' && !isCurrentPlan && styles.selectButtonPremium,
                    plan.id === 'pro' && !isCurrentPlan && styles.selectButtonPro,
                  ]}
                  onPress={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      isCurrentPlan && styles.selectButtonTextCurrent,
                    ]}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : plan.id === 'free'
                        ? 'Downgrade'
                        : currentPlan === 'premium' && plan.id === 'pro'
                          ? 'Downgrade'
                          : 'Upgrade'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Upgrade?</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.benefitTitle}>Featured Profile</Text>
              <Text style={styles.benefitText}>Stand out in search results</Text>
            </View>
            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="briefcase" size={24} color="#10B981" />
              </View>
              <Text style={styles.benefitTitle}>More Applications</Text>
              <Text style={styles.benefitText}>Apply to unlimited jobs</Text>
            </View>
            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.benefitTitle}>Verified Badge</Text>
              <Text style={styles.benefitText}>Build trust with employers</Text>
            </View>
            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="analytics" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.benefitTitle}>Profile Analytics</Text>
              <Text style={styles.benefitText}>See who views your profile</Text>
            </View>
          </View>
        </View>

        {/* Current Limits */}
        <View style={styles.usageSection}>
          <Text style={styles.sectionTitle}>Your Current Limits</Text>
          <View style={styles.usageCard}>
            {Object.entries(limits).map(([key, value]) => {
              if (typeof value === 'boolean') {
                return (
                  <View key={key} style={styles.usageRow}>
                    <Text style={styles.usageLabel}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <View
                      style={[
                        styles.featureStatus,
                        value ? styles.featureEnabled : styles.featureDisabled,
                      ]}
                    >
                      <Ionicons
                        name={value ? 'checkmark' : 'close'}
                        size={14}
                        color={value ? '#10B981' : '#EF4444'}
                      />
                      <Text
                        style={[
                          styles.featureStatusText,
                          { color: value ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {value ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>
                );
              }
              return (
                <View key={key} style={styles.usageRow}>
                  <Text style={styles.usageLabel}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Text style={styles.usageValue}>
                    {value === 'Unlimited' ? '∞ Unlimited' : value}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Our support team is here to help with any questions
          </Text>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => router.push('/profile/help')}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#8B5CF6" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  currentPlanCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  freeCard: {
    backgroundColor: '#6B7280',
  },
  proCard: {
    backgroundColor: '#8B5CF6',
  },
  premiumCard: {
    backgroundColor: '#7C3AED',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  currentPlanLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentPlanName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionDetails: {
    marginTop: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  whyUpgradeSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  whyUpgradeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  whyUpgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },
  whyUpgradeText: {
    fontSize: 14,
    color: '#7C3AED',
    textAlign: 'center',
    lineHeight: 20,
  },
  billingToggle: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  billingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#1F2937',
  },
  saveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  plansSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planCardCurrent: {
    borderColor: '#10B981',
  },
  planCardPopular: {
    borderColor: '#8B5CF6',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    maxWidth: 180,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceInterval: {
    fontSize: 14,
    color: '#6B7280',
  },
  savingsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonCurrent: {
    backgroundColor: '#ECFDF5',
  },
  selectButtonPro: {
    backgroundColor: '#8B5CF6',
  },
  selectButtonPremium: {
    backgroundColor: '#7C3AED',
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  selectButtonTextCurrent: {
    color: '#10B981',
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  benefitCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  benefitText: {
    fontSize: 12,
    color: '#6B7280',
  },
  usageSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  usageLabel: {
    fontSize: 14,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  featureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featureEnabled: {
    backgroundColor: '#ECFDF5',
  },
  featureDisabled: {
    backgroundColor: '#FEF2F2',
  },
  featureStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  supportSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
  },
  supportText: {
    fontSize: 14,
    color: '#7C3AED',
    marginTop: 4,
    textAlign: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
