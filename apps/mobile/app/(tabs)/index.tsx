/**
 * Home Screen
 *
 * Dashboard with hero section, featured maids, stats, and quick actions
 * Similar design to web app - Polished version
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  RefreshControl,
  ImageBackground,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Announcement data matching web app
const announcementData = [
  {
    id: '1',
    text: '1000+ Verified Workers Across GCC',
    icon: 'people',
    color: '#2563EB',
  },
  {
    id: '2',
    text: '97% Successful Placement Rate',
    icon: 'trending-up',
    color: '#16A34A',
  },
  {
    id: '3',
    text: '24/7 Customer Support Available',
    icon: 'headset',
    color: '#9333EA',
  },
  {
    id: '4',
    text: 'Enhanced Search Features Live',
    icon: 'sparkles',
    color: '#D97706',
  },
  {
    id: '5',
    text: 'New Agencies Join Daily',
    icon: 'ribbon',
    color: '#DC2626',
  },
];

// Query for featured maids
const GET_FEATURED_MAIDS = gql`
  query GetFeaturedMaids($limit: Int!) {
    maid_profiles(limit: $limit, order_by: { created_at: desc }) {
      id
      full_name
      date_of_birth
      nationality
      experience_years
      preferred_salary_min
      preferred_salary_max
      profile_photo_url
      skills
      languages
    }
  }
`;

// Query for recent jobs
const GET_RECENT_JOBS = gql`
  query GetRecentJobs($limit: Int!) {
    jobs(limit: $limit, order_by: { created_at: desc }) {
      id
      title
      location
      salary_min
      salary_max
      job_type
      employer
    }
  }
`;

// Query to check user's profile completion status
const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: String!) {
    profiles_by_pk(id: $userId) {
      id
      full_name
      email
      phone
      country
      avatar_url
      user_type
      registration_complete
    }
  }
`;

interface MaidProfile {
  id: string;
  full_name: string;
  date_of_birth: string;
  nationality: string;
  experience_years: number;
  preferred_salary_min: number;
  preferred_salary_max: number;
  profile_photo_url: string;
  skills: string[];
  languages: string[];
}

interface Job {
  id: string;
  title: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  employer: string;
}

// Stats data matching web app
const statsData = [
  {
    id: 'verified',
    icon: 'shield-checkmark',
    number: '1,247+',
    label: 'Verified Profiles',
    color: '#3B82F6',
  },
  {
    id: 'countries',
    icon: 'globe',
    number: '6',
    label: 'GCC Countries',
    color: '#10B981',
  },
  {
    id: 'time',
    icon: 'flash',
    number: '8 Days',
    label: 'Avg. Placement',
    color: '#F59E0B',
  },
];

// How it works steps
const howItWorksSteps = [
  {
    step: '1',
    icon: 'person-add',
    title: 'Create Account',
    description: 'Sign up and verify your identity',
    color: '#6366F1',
  },
  {
    step: '2',
    icon: 'search',
    title: 'Browse Profiles',
    description: 'Find your perfect match',
    color: '#8B5CF6',
  },
  {
    step: '3',
    icon: 'chatbubbles',
    title: 'Connect',
    description: 'Interview and discuss terms',
    color: '#EC4899',
  },
  {
    step: '4',
    icon: 'checkmark-done-circle',
    title: 'Hire',
    description: 'Complete paperwork & start',
    color: '#10B981',
  },
];

// Quick action buttons
const quickActions = [
  {
    id: 'maids',
    icon: 'people',
    label: 'Browse Maids',
    description: '1,247+ profiles',
    route: '/maids',
    color: '#6366F1',
    bgColor: '#EEF2FF',
  },
  {
    id: 'jobs',
    icon: 'briefcase',
    label: 'Find Jobs',
    description: 'Latest openings',
    route: '/jobs',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'favorites',
    icon: 'heart',
    label: 'Saved Maids',
    description: 'Your favorites',
    route: '/sponsor/favorites',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    id: 'bookings',
    icon: 'calendar',
    label: 'My Bookings',
    description: 'Manage requests',
    route: '/sponsor/bookings',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  {
    id: 'myjobs',
    icon: 'document-text',
    label: 'My Jobs',
    description: 'Posted jobs',
    route: '/sponsor/jobs',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 'messages',
    icon: 'chatbubble-ellipses',
    label: 'Messages',
    description: 'Chat with others',
    route: '/messages',
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
];

// Trust indicators
const trustIndicators = [
  { icon: 'shield-checkmark', text: '100% Verified' },
  { icon: 'lock-closed', text: 'Secure Platform' },
  { icon: 'star', text: '4.8 Rating' },
];

// Announcement Banner Component
const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const checkDismissed = async () => {
      try {
        const dismissed = await SecureStore.getItemAsync('announcement_dismissed');
        if (dismissed === 'true') {
          setIsVisible(false);
        }
      } catch (e) {
        // Ignore storage errors
      }
    };
    checkDismissed();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const contentWidth = announcementData.length * 250;
    let scrollPosition = 0;

    const scrollInterval = setInterval(() => {
      scrollPosition += 1;
      if (scrollPosition >= contentWidth) {
        scrollPosition = 0;
      }
      scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: false });
    }, 30);

    return () => clearInterval(scrollInterval);
  }, [isVisible]);

  const handleDismiss = async () => {
    setIsVisible(false);
    try {
      await SecureStore.setItemAsync('announcement_dismissed', 'true');
    } catch (e) {
      // Ignore storage errors
    }
  };

  if (!isVisible) return null;

  const duplicatedAnnouncements = [...announcementData, ...announcementData, ...announcementData];

  return (
    <View style={styles.announcementBanner}>
      <View style={styles.announcementLiveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.announcementScroll}
      >
        {duplicatedAnnouncements.map((announcement, index) => (
          <View key={`${announcement.id}-${index}`} style={styles.announcementItem}>
            <View style={[styles.announcementIconContainer, { backgroundColor: `${announcement.color}15` }]}>
              <Ionicons name={announcement.icon as any} size={14} color={announcement.color} />
            </View>
            <Text style={[styles.announcementText, { color: announcement.color }]} numberOfLines={1}>
              {announcement.text}
            </Text>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.announcementClose} onPress={handleDismiss}>
        <Ionicons name="close" size={14} color="#92400E" />
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Navigation handler with debug
  const handleNavigation = (route: string) => {
    console.log('Navigating to:', route);
    router.push(route as any);
  };

  const {
    data: maidsData,
    loading: maidsLoading,
    error: maidsError,
    refetch: refetchMaids,
  } = useQuery(GET_FEATURED_MAIDS, {
    variables: { limit: 10 },
  });

  const {
    data: jobsData,
    loading: jobsLoading,
    refetch: refetchJobs,
  } = useQuery(GET_RECENT_JOBS, {
    variables: { limit: 5 },
  });

  // Query user profile to check completion status
  const {
    data: profileData,
    refetch: refetchProfile,
  } = useQuery(GET_USER_PROFILE, {
    variables: { userId: user?.uid || '' },
    skip: !user?.uid,
  });

  const userProfile = profileData?.profiles_by_pk;
  const isProfileIncomplete = userProfile && !userProfile.registration_complete;

  // Calculate profile completion percentage
  const calculateProfileProgress = () => {
    if (!userProfile) return { percentage: 0, filled: 0, total: 5 };

    const fields = [
      userProfile.name,
      userProfile.email,
      userProfile.phone,
      userProfile.country,
      userProfile.avatar_url,
    ];

    const filledFields = fields.filter(field => field && field.trim && field.trim() !== '').length;
    const percentage = Math.round((filledFields / fields.length) * 100);

    return { percentage, filled: filledFields, total: fields.length };
  };

  const profileProgress = calculateProfileProgress();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMaids(), refetchJobs(), refetchProfile()]);
    setRefreshing(false);
  }, [refetchMaids, refetchJobs, refetchProfile]);

  const maids: MaidProfile[] = maidsData?.maid_profiles || [];
  const jobs: Job[] = jobsData?.jobs || [];

  const formatSalary = (min: number, max: number) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return 'Negotiable';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMaidCard = ({ item }: { item: MaidProfile }) => (
    <TouchableOpacity
      style={styles.maidCard}
      activeOpacity={0.7}
      delayPressIn={0}
      onPress={() => handleNavigation(`/maid/${item.id}`)}
    >
      <View style={styles.maidImageContainer}>
        {item.profile_photo_url ? (
          <Image source={{ uri: item.profile_photo_url }} style={styles.maidImage} />
        ) : (
          <View style={styles.maidImagePlaceholder}>
            <Text style={styles.maidInitials}>{getInitials(item.full_name || 'NA')}</Text>
          </View>
        )}
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        </View>
        {item.experience_years && item.experience_years >= 3 ? (
          <View style={styles.experienceBadge}>
            <Text style={styles.experienceBadgeText}>{`${item.experience_years}+ yrs`}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.maidInfo}>
        <Text style={styles.maidName} numberOfLines={1}>
          {item.full_name || 'No Name'}
        </Text>
        <View style={styles.maidLocationRow}>
          <Ionicons name="flag" size={12} color="#6B7280" />
          <Text style={styles.maidDetails}>{item.nationality || 'Ethiopian'}</Text>
        </View>
        <Text style={styles.maidSalary}>
          {formatSalary(item.preferred_salary_min, item.preferred_salary_max)}/mo
        </Text>
        {item.skills && Array.isArray(item.skills) && item.skills.length > 0 ? (
          <View style={styles.skillsRow}>
            {item.skills.slice(0, 2).map((skill, idx) => (
              skill ? (
                <View key={idx} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{String(skill)}</Text>
                </View>
              ) : null
            ))}
            {item.skills.length > 2 ? (
              <Text style={styles.moreSkills}>{`+${item.skills.length - 2}`}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderJobCard = ({ item, showKey = false }: { item: Job; showKey?: boolean }) => (
    <TouchableOpacity
      key={showKey ? item.id : undefined}
      style={styles.jobCard}
      activeOpacity={0.7}
      delayPressIn={0}
      onPress={() => handleNavigation(`/job/${item.id}`)}
    >
      <View style={styles.jobIconContainer}>
        <Ionicons name="briefcase" size={20} color="#6366F1" />
      </View>
      <View style={styles.jobContent}>
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.jobTypeBadge}>
            <Text style={styles.jobTypeText}>{item.job_type || 'Full-time'}</Text>
          </View>
        </View>
        {item.employer ? (
          <Text style={styles.jobEmployer} numberOfLines={1}>
            {item.employer}
          </Text>
        ) : null}
        <View style={styles.jobFooter}>
          <View style={styles.jobLocation}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.jobLocationText} numberOfLines={1}>
              {item.location || 'Location not specified'}
            </Text>
          </View>
          <Text style={styles.jobSalary}>{formatSalary(item.salary_min, item.salary_max)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
      }
    >
      {/* Sticky Announcement Banner */}
      <AnnouncementBanner />

      {/* Complete Profile Button - shown for new users */}
      {isProfileIncomplete && (
        <View style={styles.completeProfileContainer}>
          <TouchableOpacity
            style={styles.completeProfileButton}
            activeOpacity={0.8}
            onPress={() => {
              const profileRoute = userProfile?.user_type === 'maid'
                ? '/maid/profile'
                : userProfile?.user_type === 'agency'
                ? '/agency/profile'
                : '/sponsor/profile';
              handleNavigation(profileRoute);
            }}
          >
            <Ionicons name="person-circle-outline" size={20} color="#fff" />
            <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Hero Section */}
      <ImageBackground
        source={require('../../assets/images/hero-background.png')}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} pointerEvents="box-none">
          <View style={styles.heroContent} pointerEvents="box-none">
            {/* Trust indicators */}
            <View style={styles.trustRow}>
              {trustIndicators.map((item, idx) => (
                <View key={idx} style={styles.trustItem}>
                  <Ionicons name={item.icon as any} size={12} color="#FCD34D" />
                  <Text style={styles.trustText}>{item.text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.heroTitle}>Find Trusted</Text>
            <Text style={styles.heroTitleAccent}>Domestic Workers</Text>
            <Text style={styles.heroSubtitle}>
              Connect with verified Ethiopian domestic workers across GCC countries
            </Text>

            {/* CTA Buttons */}
            <View style={styles.ctaContainer} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.ctaPrimary}
                activeOpacity={0.8}
                delayPressIn={0}
                onPress={() => handleNavigation('/maids')}
              >
                <Ionicons name="people" size={20} color="#6366F1" />
                <Text style={styles.ctaPrimaryText}>Browse Maids</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ctaSecondary}
                activeOpacity={0.8}
                delayPressIn={0}
                onPress={() => handleNavigation('/jobs')}
              >
                <Ionicons name="briefcase" size={20} color="#fff" />
                <Text style={styles.ctaSecondaryText}>View Jobs</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {statsData.map((stat) => (
                <View key={stat.id} style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}30` }]}>
                    <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                  </View>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionCard, { backgroundColor: action.bgColor }]}
              activeOpacity={0.7}
              delayPressIn={0}
              onPress={() => handleNavigation(action.route)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={22} color="#fff" />
              </View>
              <Text style={[styles.quickActionLabel, { color: action.color }]}>{action.label}</Text>
              <Text style={styles.quickActionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Maids Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color="#9333EA" />
              <Text style={styles.premiumBadgeText}>Premium Profiles</Text>
            </View>
            <Text style={styles.sectionTitle}>Featured Maids</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllButton}
            activeOpacity={0.7}
            delayPressIn={0}
            onPress={() => handleNavigation('/maids')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="arrow-forward" size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {maidsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading profiles...</Text>
          </View>
        ) : maidsError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>Unable to load profiles</Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.7}
              delayPressIn={0}
              onPress={() => refetchMaids()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={maids}
            keyExtractor={(item) => item.id}
            renderItem={renderMaidCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            nestedScrollEnabled={true}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No profiles available</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Find Jobs CTA */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBanner}>
          <View style={styles.ctaBannerContent}>
            <View style={styles.ctaBannerIcon}>
              <Ionicons name="briefcase" size={28} color="#7C3AED" />
            </View>
            <View style={styles.ctaBannerText}>
              <Text style={styles.ctaBannerTitle}>Find Jobs Matching Your Skills</Text>
              <Text style={styles.ctaBannerSubtitle}>
                Explore curated opportunities across GCC countries
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.ctaBannerButton}
            activeOpacity={0.8}
            delayPressIn={0}
            onPress={() => handleNavigation('/jobs')}
          >
            <Text style={styles.ctaBannerButtonText}>Browse Jobs</Text>
            <Ionicons name="arrow-forward" size={18} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <View style={[styles.premiumBadge, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="flash" size={12} color="#2563EB" />
              <Text style={[styles.premiumBadgeText, { color: '#2563EB' }]}>Latest Openings</Text>
            </View>
            <Text style={styles.sectionTitle}>Recent Job Postings</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllButton}
            activeOpacity={0.7}
            delayPressIn={0}
            onPress={() => handleNavigation('/jobs')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="arrow-forward" size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {jobsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <View style={styles.jobsList}>
            {jobs.slice(0, 3).map((job) => renderJobCard({ item: job, showKey: true }))}
            {jobs.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="briefcase-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No jobs available</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* How It Works Section */}
      <View style={[styles.section, styles.howItWorksSection]}>
        <View style={styles.howItWorksHeader}>
          <View style={styles.stepBadge}>
            <Ionicons name="play-circle" size={16} color="#6366F1" />
            <Text style={styles.stepBadgeText}>Step-by-Step Process</Text>
          </View>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>
            Our streamlined process makes it easy to find trusted domestic workers
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          {howItWorksSteps.map((step, index) => (
            <View key={step.step} style={styles.stepCard}>
              <View style={[styles.stepIconContainer, { backgroundColor: `${step.color}15` }]}>
                <Ionicons name={step.icon as any} size={24} color={step.color} />
                <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
                  <Text style={styles.stepNumberText}>{step.step}</Text>
                </View>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Platform Stats Summary */}
      <View style={styles.section}>
        <View style={styles.platformStats}>
          <View style={styles.platformStatsHeader}>
            <Ionicons name="analytics" size={20} color="#6366F1" />
            <Text style={styles.platformStatsTitle}>Platform Excellence</Text>
          </View>
          <View style={styles.platformStatsGrid}>
            <View style={styles.platformStatItem}>
              <Text style={styles.platformStatNumber}>4.8/5</Text>
              <Text style={styles.platformStatLabel}>Rating</Text>
            </View>
            <View style={styles.platformStatDivider} />
            <View style={styles.platformStatItem}>
              <Text style={styles.platformStatNumber}>99.8%</Text>
              <Text style={styles.platformStatLabel}>Uptime</Text>
            </View>
            <View style={styles.platformStatDivider} />
            <View style={styles.platformStatItem}>
              <Text style={styles.platformStatNumber}>2.3hr</Text>
              <Text style={styles.platformStatLabel}>Response</Text>
            </View>
            <View style={styles.platformStatDivider} />
            <View style={styles.platformStatItem}>
              <Text style={styles.platformStatNumber}>97%</Text>
              <Text style={styles.platformStatLabel}>Satisfaction</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Ethiopian Maids Platform</Text>
        <Text style={styles.footerSubtext}>Connecting families with trusted workers since 2024</Text>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Announcement Banner
  announcementBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingVertical: 8,
    paddingRight: 36,
    paddingLeft: 60,
    position: 'relative',
  },
  announcementLiveBadge: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingRight: 8,
    zIndex: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  announcementScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  announcementIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  announcementClose: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Section
  hero: {
    width: '100%',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    paddingTop: 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroContent: {
    alignItems: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FCD34D',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaPrimaryText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaSecondaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    maxWidth: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Section styles
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 4,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
    gap: 4,
  },
  premiumBadgeText: {
    color: '#9333EA',
    fontSize: 11,
    fontWeight: '600',
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Maid Cards
  horizontalList: {
    paddingRight: 16,
  },
  maidCard: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
    overflow: 'hidden',
  },
  maidImageContainer: {
    height: 130,
    position: 'relative',
  },
  maidImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  maidImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maidInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  experienceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  experienceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  maidInfo: {
    padding: 12,
  },
  maidName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  maidLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  maidDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  maidSalary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // CTA Banner
  ctaSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaBanner: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#7C3AED',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  ctaBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ctaBannerText: {
    flex: 1,
  },
  ctaBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  ctaBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  ctaBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  ctaBannerButtonText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '700',
  },

  // Job Cards
  jobsList: {
    gap: 10,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  jobIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jobContent: {
    flex: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  jobTypeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobTypeText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '600',
  },
  jobEmployer: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  jobLocationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  jobSalary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },

  // How It Works
  howItWorksSection: {
    backgroundColor: '#F9FAFB',
  },
  howItWorksHeader: {
    marginBottom: 20,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  stepBadgeText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stepCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },

  // Platform Stats
  platformStats: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  platformStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  platformStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  platformStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  platformStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  platformStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  platformStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 2,
  },
  platformStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Loading & Error states
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    width: width - 32,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },

  // Complete Profile Button
  completeProfileContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  completeProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
