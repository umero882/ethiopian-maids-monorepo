/**
 * Sponsor Dashboard Component
 *
 * Dashboard view for sponsor users showing stats, quick actions,
 * and navigation menu similar to the web app.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSponsorDashboard, useRecentBookings, useRecentJobs, useSubscription } from '../../hooks';
import UpgradePromptModal from '../UpgradePromptModal';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const StatCard = ({ title, value, icon, color, bgColor }: StatCardProps) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <View style={styles.statContent}>
      <Text style={[styles.statTitle, { color }]}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
    <Ionicons name={icon} size={32} color={color} style={styles.statIcon} />
  </View>
);

// Helper function to get upgrade button config based on plan
const getUpgradeConfig = (planType: string) => {
  switch (planType) {
    case 'free':
      return { text: 'Upgrade to Pro', targetPlan: 'pro', color: '#3B82F6', bgColor: '#EFF6FF' };
    case 'pro':
      return { text: 'Upgrade to Premium', targetPlan: 'premium', color: '#8B5CF6', bgColor: '#F5F3FF' };
    case 'premium':
      return null;
    default:
      return { text: 'Upgrade to Pro', targetPlan: 'pro', color: '#3B82F6', bgColor: '#EFF6FF' };
  }
};

// Helper function to get plan display info
const getPlanDisplayInfo = (planType: string) => {
  switch (planType) {
    case 'free':
      return { name: 'Free Plan', icon: 'diamond-outline' as const, color: '#6B7280', bgColor: '#F3F4F6' };
    case 'pro':
      return { name: 'Pro Plan', icon: 'diamond' as const, color: '#3B82F6', bgColor: '#EFF6FF' };
    case 'premium':
      return { name: 'Premium Plan', icon: 'crown' as const, color: '#8B5CF6', bgColor: '#F5F3FF' };
    default:
      return { name: 'Free Plan', icon: 'diamond-outline' as const, color: '#6B7280', bgColor: '#F3F4F6' };
  }
};

interface SubscriptionCardProps {
  planType: string;
  status: string;
  daysRemaining: number | null;
  onUpgrade: (targetPlan: string) => void;
  onManage: () => void;
}

const SubscriptionCard = ({ planType, status, daysRemaining, onUpgrade, onManage }: SubscriptionCardProps) => {
  const planInfo = getPlanDisplayInfo(planType);
  const upgradeConfig = getUpgradeConfig(planType);
  const isActive = status === 'active' || status === 'past_due';

  return (
    <View style={[styles.subscriptionCard, { borderColor: planInfo.color }]}>
      <View style={styles.subscriptionHeader}>
        <View style={styles.subscriptionTitleRow}>
          <Ionicons name={planInfo.icon} size={20} color={planInfo.color} />
          <Text style={styles.subscriptionLabel}>Your Plan</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2' }]}>
          <Text style={[styles.statusText, { color: isActive ? '#059669' : '#DC2626' }]}>
            {planType === 'free' ? 'Free' : isActive ? 'Active' : 'Expired'}
          </Text>
        </View>
      </View>

      <Text style={[styles.planName, { color: planInfo.color }]}>{planInfo.name}</Text>

      {planType !== 'free' && daysRemaining !== null && (
        <Text style={styles.renewalText}>
          {daysRemaining > 0 ? `Renews in ${daysRemaining} days` : 'Renewal due'}
        </Text>
      )}
      {planType === 'free' && (
        <Text style={styles.renewalText}>Limited features</Text>
      )}

      <View style={styles.subscriptionActions}>
        {planType !== 'free' && (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={onManage}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        )}
        {upgradeConfig && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: upgradeConfig.color }]}
            onPress={() => onUpgrade(upgradeConfig.targetPlan)}
          >
            <Ionicons name="arrow-up-circle" size={16} color="#fff" />
            <Text style={styles.upgradeButtonText}>{upgradeConfig.text}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
}

const MenuItem = ({ icon, title, subtitle, route, badge, badgeColor, onPress }: MenuItemProps) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress || (route ? () => router.push(route as any) : undefined)}
  >
    <View style={styles.menuItemLeft}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={22} color="#6366F1" />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.menuItemRight}>
      {badge && (
        <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : {}]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </View>
  </TouchableOpacity>
);

interface SponsorDashboardProps {
  user: any;
  onSignOut: () => void;
}

export default function SponsorDashboard({ user, onSignOut }: SponsorDashboardProps) {
  // Fetch real stats from API - use email instead of uid for profile lookup
  const { stats, profile, isLoading, error, refetch } = useSponsorDashboard(user?.email);
  const { bookings: recentBookings, isLoading: bookingsLoading } = useRecentBookings(user?.email, 'sponsor');
  const { jobs: recentJobs, isLoading: jobsLoading } = useRecentJobs(user?.email, 'sponsor');

  // Fetch subscription data
  const { currentPlan, subscription, daysRemaining, openCheckout, openManagePortal } = useSubscription();

  const [refreshing, setRefreshing] = React.useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const menuItems: MenuItemProps[] = [
    { icon: 'grid-outline', title: 'Dashboard Overview', route: '/sponsor/dashboard' },
    { icon: 'person-outline', title: 'Edit Profile', route: '/sponsor/profile' },
    { icon: 'briefcase-outline', title: 'My Jobs', subtitle: 'Manage job postings', route: '/sponsor/jobs', badge: stats.activeJobs > 0 ? String(stats.activeJobs) : undefined, badgeColor: '#10B981' },
    {
      icon: 'calendar-outline',
      title: 'Active Bookings',
      subtitle: 'View all bookings',
      route: '/sponsor/bookings',
      badge: stats.pendingBookings > 0 ? String(stats.pendingBookings) : undefined,
      badgeColor: '#F59E0B'
    },
    { icon: 'heart-outline', title: 'Favorites', subtitle: 'Saved maids', route: '/sponsor/favorites', badge: stats.savedFavorites > 0 ? String(stats.savedFavorites) : undefined, badgeColor: '#EC4899' },
    { icon: 'chatbubbles-outline', title: 'Messages', badge: '0', route: '/(tabs)/messages' },
    { icon: 'diamond-outline', title: 'Subscriptions', subtitle: 'Upgrade your plan', route: '/sponsor/subscriptions' },
    { icon: 'card-outline', title: 'Payment Settings', route: '/sponsor/payments' },
    { icon: 'receipt-outline', title: 'Invoices', route: '/sponsor/invoices' },
    { icon: 'star-outline', title: 'Reviews & Feedback', route: '/sponsor/feedback' },
    { icon: 'settings-outline', title: 'Settings', route: '/sponsor/settings' },
    { icon: 'help-circle-outline', title: 'Help & Support', route: '/profile/help' },
  ];

  // Show loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/sponsor/profile')}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.fullName?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'S'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.userName}>{profile.fullName || user?.displayName || 'Sponsor'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.userTypeBadge}>
          <Text style={styles.userTypeText}>Family/Sponsor</Text>
        </View>
      </View>

      {/* Subscription Status Card */}
      <View style={styles.subscriptionContainer}>
        <SubscriptionCard
          planType={currentPlan}
          status={subscription?.status || 'free'}
          daysRemaining={daysRemaining}
          onUpgrade={handleUpgrade}
          onManage={openManagePortal}
        />
      </View>

      {/* Upgrade Modal with sponsor-specific benefits */}
      <UpgradePromptModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userType="sponsor"
        currentPlan={currentPlan}
      />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon="briefcase"
          color="#3B82F6"
          bgColor="#EFF6FF"
        />
        <StatCard
          title="Active"
          value={stats.activeBookings}
          icon="checkmark-circle"
          color="#8B5CF6"
          bgColor="#F5F3FF"
        />
        <StatCard
          title="Favorites"
          value={stats.savedFavorites}
          icon="heart"
          color="#EC4899"
          bgColor="#FDF2F8"
        />
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Ethiopian Maids v1.0.0</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  userTypeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  userTypeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statIcon: {
    opacity: 0.5,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    paddingVertical: 24,
  },
  // Subscription Card Styles
  subscriptionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  renewalText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  manageButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  upgradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
