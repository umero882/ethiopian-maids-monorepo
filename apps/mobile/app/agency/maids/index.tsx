/**
 * Agency Maids Management Screen
 *
 * Full management of agency maids with:
 * - List view with search, filter, and sort
 * - Quick status updates
 * - Add/Edit/Delete actions
 * - Bulk operations
 */

import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
  ImageBackground,
  Alert,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../hooks';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import * as SecureStore from 'expo-secure-store';

const DISPLAY_SETTINGS_KEY = 'maid_card_display_settings';
const FAVORITES_KEY = 'maid_favorites';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// Types
interface MaidProfile {
  id: string;
  full_name?: string;
  date_of_birth?: string;
  nationality?: string;
  current_location?: string;
  experience_years?: number;
  skills?: string[];
  languages?: string[];
  availability_status?: string;
  verification_status?: string;
  preferred_salary_min?: number;
  preferred_salary_max?: number;
  preferred_currency?: string;
  profile_photo_url?: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
  introduction_video_url?: string;
  primary_profession?: string;
  live_in_preference?: boolean;
  contract_duration_preference?: string;
  is_agency_managed?: boolean;
  iso_country_code?: string;
}

// Card Display Settings Type
interface CardDisplaySettings {
  showPhoto: boolean;
  showNationality: boolean;
  showLocation: boolean;
  showSalary: boolean;
  showSkills: boolean;
  showExperienceBadge: boolean;
  showVerificationBadge: boolean;
  showAgencyBadge: boolean;
  showVideoBadge: boolean;
  showProfessionBadge: boolean;
  showPreferenceBadge: boolean;
  showFavoriteIcon: boolean;
}

const DEFAULT_DISPLAY_SETTINGS: CardDisplaySettings = {
  showPhoto: true,
  showNationality: true,
  showLocation: true,
  showSalary: true,
  showSkills: true,
  showExperienceBadge: true,
  showVerificationBadge: true,
  showAgencyBadge: true,
  showVideoBadge: true,
  showProfessionBadge: true,
  showPreferenceBadge: true,
  showFavoriteIcon: true,
};

// Country code to flag emoji mapping
const getCountryFlag = (countryCode?: string, nationality?: string): string => {
  if (countryCode && countryCode.length === 2) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  // Fallback mappings for common nationalities
  const nationalityMap: Record<string, string> = {
    'ethiopian': '🇪🇹',
    'ethiopia': '🇪🇹',
    'filipino': '🇵🇭',
    'philippines': '🇵🇭',
    'kenyan': '🇰🇪',
    'kenya': '🇰🇪',
    'ugandan': '🇺🇬',
    'uganda': '🇺🇬',
    'indian': '🇮🇳',
    'india': '🇮🇳',
    'indonesian': '🇮🇩',
    'indonesia': '🇮🇩',
    'sri lankan': '🇱🇰',
    'sri lanka': '🇱🇰',
    'nepalese': '🇳🇵',
    'nepal': '🇳🇵',
    'bangladeshi': '🇧🇩',
    'bangladesh': '🇧🇩',
    'pakistani': '🇵🇰',
    'pakistan': '🇵🇰',
  };
  const key = (nationality || '').toLowerCase();
  return nationalityMap[key] || '🏳️';
};

// GraphQL Queries
const GET_AGENCY_MAIDS = gql`
  query GetAgencyMaids($agency_id: String!) {
    maid_profiles(
      where: { agency_id: { _eq: $agency_id } }
      order_by: { created_at: desc }
    ) {
      id
      full_name
      date_of_birth
      nationality
      current_location
      experience_years
      skills
      languages
      availability_status
      verification_status
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      profile_photo_url
      phone_number
      created_at
      updated_at
      introduction_video_url
      primary_profession
      live_in_preference
      contract_duration_preference
      is_agency_managed
      iso_country_code
    }
    maid_profiles_aggregate(where: { agency_id: { _eq: $agency_id } }) {
      aggregate {
        count
      }
    }
  }
`;

const UPDATE_MAID_STATUS = gql`
  mutation UpdateMaidStatus($id: String!, $status: String!) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { availability_status: $status, updated_at: "now()" }
    ) {
      id
      availability_status
    }
  }
`;

const DELETE_MAID = gql`
  mutation DeleteMaid($id: String!) {
    delete_maid_profiles_by_pk(id: $id) {
      id
    }
  }
`;

// Filter options
const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Placed', value: 'placed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Unavailable', value: 'unavailable' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest', icon: 'time-outline' },
  { label: 'Name A-Z', value: 'name', icon: 'text-outline' },
  { label: 'Experience', value: 'experience', icon: 'briefcase-outline' },
  { label: 'Salary', value: 'salary', icon: 'cash-outline' },
];

// Helper functions
const getInitials = (name?: string): string => {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatSalary = (min?: number, max?: number, currency: string = 'USD'): string => {
  const symbol = currency === 'USD' ? '$' : currency;
  if (min && max) return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  if (min) return `From ${symbol}${min.toLocaleString()}`;
  if (max) return `Up to ${symbol}${max.toLocaleString()}`;
  return 'Negotiable';
};

const getStatusColor = (status?: string): { bg: string; text: string; dot: string } => {
  switch (status?.toLowerCase()) {
    case 'available':
      return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
    case 'placed':
      return { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' };
    case 'pending':
      return { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' };
    case 'unavailable':
      return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
  }
};

export default function AgencyMaidsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [maids, setMaids] = useState<MaidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMaid, setSelectedMaid] = useState<MaidProfile | null>(null);

  // Display settings state
  const [displaySettings, setDisplaySettings] = useState<CardDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Set header options with custom back button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ padding: 8, marginLeft: -4 }}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => router.push('/agency/maids/add')}
          >
            <Ionicons name="add" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  // Load display settings from SecureStore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await SecureStore.getItemAsync(DISPLAY_SETTINGS_KEY);
        if (stored) {
          setDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(stored) });
        }
        const storedFavorites = await SecureStore.getItemAsync(FAVORITES_KEY);
        if (storedFavorites) {
          setFavorites(new Set(JSON.parse(storedFavorites)));
        }
      } catch (e) {
        console.error('Failed to load display settings:', e);
      }
    };
    loadSettings();
  }, []);

  // Save display settings to SecureStore
  const updateDisplaySetting = async (key: keyof CardDisplaySettings, value: boolean) => {
    const newSettings = { ...displaySettings, [key]: value };
    setDisplaySettings(newSettings);
    try {
      await SecureStore.setItemAsync(DISPLAY_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save display settings:', e);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (maidId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(maidId)) {
      newFavorites.delete(maidId);
    } else {
      newFavorites.add(maidId);
    }
    setFavorites(newFavorites);
    try {
      await SecureStore.setItemAsync(FAVORITES_KEY, JSON.stringify([...newFavorites]));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  };

  // Load maids
  const loadMaids = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setError(null);
      const { data, errors } = await apolloClient.query({
        query: GET_AGENCY_MAIDS,
        variables: { agency_id: user.uid },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      setMaids(data?.maid_profiles || []);
    } catch (err: any) {
      console.error('Error loading maids:', err);
      setError(err.message || 'Failed to load maids');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadMaids();
  }, [loadMaids]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMaids();
  }, [loadMaids]);

  // Update maid status
  const updateMaidStatus = async (maidId: string, newStatus: string) => {
    try {
      const { errors } = await apolloClient.mutate({
        mutation: UPDATE_MAID_STATUS,
        variables: { id: maidId, status: newStatus },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Update local state
      setMaids((prev) =>
        prev.map((m) =>
          m.id === maidId ? { ...m, availability_status: newStatus } : m
        )
      );

      setShowStatusModal(false);
      setSelectedMaid(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  // Delete maid
  const deleteMaid = (maid: MaidProfile) => {
    Alert.alert(
      'Delete Maid',
      `Are you sure you want to remove ${maid.full_name || 'this maid'} from your agency?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { errors } = await apolloClient.mutate({
                mutation: DELETE_MAID,
                variables: { id: maid.id },
              });

              if (errors && errors.length > 0) {
                throw new Error(errors[0].message);
              }

              setMaids((prev) => prev.filter((m) => m.id !== maid.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete maid');
            }
          },
        },
      ]
    );
  };

  // Filter and sort maids
  const filteredMaids = useMemo(() => {
    let result = [...maids];

    // Search filter
    if (debouncedTerm.trim()) {
      const term = debouncedTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(term) ||
          m.nationality?.toLowerCase().includes(term) ||
          m.current_location?.toLowerCase().includes(term) ||
          m.skills?.some((s) => s.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(
        (m) => m.availability_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sorting
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        break;
      case 'experience':
        result.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
        break;
      case 'salary':
        result.sort(
          (a, b) => (b.preferred_salary_min || 0) - (a.preferred_salary_min || 0)
        );
        break;
      case 'newest':
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        break;
    }

    return result;
  }, [maids, debouncedTerm, statusFilter, sortBy]);

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = { available: 0, placed: 0, pending: 0, unavailable: 0, total: maids.length };
    maids.forEach((m) => {
      const status = m.availability_status?.toLowerCase() || '';
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [maids]);

  // Helper to get preference text
  const getPreferenceText = (liveIn?: boolean, contract?: string): string => {
    const parts: string[] = [];
    if (contract) {
      parts.push(contract.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
    if (liveIn !== undefined) {
      parts.push(liveIn ? 'Live-in' : 'Live-out');
    }
    return parts.join(' + ') || 'Flexible';
  };

  // Render maid card
  const renderMaidCard = ({ item }: { item: MaidProfile }) => {
    const statusColor = getStatusColor(item.availability_status);
    const isFavorite = favorites.has(item.id);

    return (
      <TouchableOpacity
        style={styles.maidCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/agency/maids/${item.id}`)}
      >
        {/* Image Container */}
        {displaySettings.showPhoto && (
          <View style={styles.maidImageContainer}>
            {item.profile_photo_url ? (
              <ImageBackground
                source={{ uri: item.profile_photo_url }}
                style={styles.maidImageBg}
                imageStyle={styles.maidImageStyle}
                resizeMode="cover"
              >
                {/* Gradient overlay for better badge visibility */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.maidImageGradient}
                />
              </ImageBackground>
            ) : (
              <View style={styles.maidImagePlaceholder}>
                <View style={styles.maidPlaceholderIcon}>
                  <Ionicons name="person" size={40} color="#9CA3AF" />
                </View>
                <Text style={styles.maidInitials}>{getInitials(item.full_name)}</Text>
                <Text style={styles.maidPlaceholderText}>No photo</Text>
              </View>
            )}

            {/* Top Left - Favorite Icon */}
            {displaySettings.showFavoriteIcon && (
              <TouchableOpacity
                style={[styles.favoriteButtonTop, isFavorite && styles.favoriteButtonTopActive]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite ? '#fff' : '#fff'}
                />
              </TouchableOpacity>
            )}

            {/* Top Right Badges Container */}
            <View style={styles.topRightBadges}>
              {/* Verification Badge */}
              {displaySettings.showVerificationBadge && item.verification_status === 'verified' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                </View>
              )}
              {/* Video Badge */}
              {displaySettings.showVideoBadge && (
                <View style={styles.videoBadge}>
                  <Ionicons name="play" size={14} color="#fff" />
                </View>
              )}
            </View>

            {/* Status Badge - Bottom Left */}
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
              onPress={() => {
                setSelectedMaid(item);
                setShowStatusModal(true);
              }}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
                {item.availability_status || 'Unknown'}
              </Text>
              <Ionicons name="chevron-down" size={12} color={statusColor.text} />
            </TouchableOpacity>

            {/* Agency Badge - Bottom Right */}
            {displaySettings.showAgencyBadge && item.is_agency_managed !== false && (
              <View style={styles.agencyBadge}>
                <Ionicons name="business" size={12} color="#fff" />
                <Text style={styles.agencyBadgeText}>Agency</Text>
              </View>
            )}
          </View>
        )}

        {/* Info Section - Two Column Layout */}
        <View style={styles.maidInfo}>
          <View style={styles.maidInfoContent}>
            {/* Left Column - Main Info */}
            <View style={styles.maidInfoLeft}>
              <Text style={styles.maidName} numberOfLines={1}>
                {item.full_name || 'No Name'}
              </Text>

              {displaySettings.showNationality && (
                <View style={styles.maidLocationRow}>
                  <Text style={styles.countryFlag}>
                    {getCountryFlag(item.iso_country_code, item.nationality)}
                  </Text>
                  <Text style={styles.maidNationality} numberOfLines={1}>
                    {item.nationality || 'Unknown'}
                  </Text>
                </View>
              )}

              {displaySettings.showLocation && item.current_location && (
                <View style={styles.maidLocationRow}>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text style={styles.maidLocation} numberOfLines={1}>
                    {item.current_location}
                  </Text>
                </View>
              )}

              {displaySettings.showSalary && (
                <Text style={styles.maidSalary}>
                  {formatSalary(
                    item.preferred_salary_min,
                    item.preferred_salary_max,
                    item.preferred_currency
                  )}
                  /mo
                </Text>
              )}

              {/* Skills */}
              {displaySettings.showSkills && item.skills && Array.isArray(item.skills) && item.skills.length > 0 && (
                <View style={styles.skillsRow}>
                  {item.skills.slice(0, 2).map((skill, idx) =>
                    skill ? (
                      <View key={idx} style={styles.skillBadge}>
                        <Text style={styles.skillText}>{String(skill)}</Text>
                      </View>
                    ) : null
                  )}
                  {item.skills.length > 2 && (
                    <Text style={styles.moreSkills}>{`+${item.skills.length - 2}`}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Right Column - Badges */}
            <View style={styles.maidInfoRight}>
              {/* Profession Badge */}
              {displaySettings.showProfessionBadge && (
                <View style={[styles.professionBadge, !item.primary_profession && styles.professionBadgeDisabled]}>
                  <Text style={[styles.professionBadgeText, !item.primary_profession && styles.professionBadgeTextDisabled]}>
                    {item.primary_profession
                      ? item.primary_profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      : 'N/A'}
                  </Text>
                </View>
              )}

              {/* Experience Badge */}
              {displaySettings.showExperienceBadge && item.experience_years && item.experience_years > 0 && (
                <View style={styles.experienceBadgeRight}>
                  <Text style={styles.experienceBadgeRightText}>{`${item.experience_years} yrs`}</Text>
                </View>
              )}

              {/* Preference Badge */}
              {displaySettings.showPreferenceBadge && (item.live_in_preference !== undefined || item.contract_duration_preference) && (
                <View style={styles.preferenceBadge}>
                  <Text style={styles.preferenceBadgeText} numberOfLines={1}>
                    {getPreferenceText(item.live_in_preference, item.contract_duration_preference)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => router.push(`/agency/maids/${item.id}`)}
            >
              <Ionicons name="eye-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonTextPrimary}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonOutline]}
              onPress={() => router.push(`/agency/maids/${item.id}/edit`)}
            >
              <Ionicons name="create-outline" size={16} color="#10B981" />
              <Text style={styles.actionButtonTextOutline}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => deleteMaid(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading maids...</Text>
      </View>
    );
  }

  // Tab configuration for status filter
  const TABS = [
    { key: 'all', label: 'All', count: statusCounts.total },
    { key: 'available', label: 'Available', count: statusCounts.available, color: '#10B981' },
    { key: 'placed', label: 'Placed', count: statusCounts.placed, color: '#3B82F6' },
    { key: 'pending', label: 'Pending', count: statusCounts.pending, color: '#F59E0B' },
    { key: 'unavailable', label: 'Unavailable', count: statusCounts.unavailable, color: '#EF4444' },
  ];

  return (
    <View style={styles.container}>
      {/* Segmented Tab Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                  isActive && tab.color && { borderBottomColor: tab.color },
                ]}
                onPress={() => setStatusFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                    isActive && tab.color && { color: tab.color },
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    isActive && styles.tabBadgeActive,
                    isActive && tab.color && { backgroundColor: tab.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive && styles.tabBadgeTextActive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Sort Section */}
      <View style={styles.searchSortSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search maids..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchTerm('');
                  setDebouncedTerm('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sort Pills */}
        <View style={styles.sortPillsContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortPillsContent}
          >
            {SORT_OPTIONS.map((option) => {
              const isActive = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortPill,
                    isActive && styles.sortPillActive,
                  ]}
                  onPress={() => setSortBy(option.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={14}
                    color={isActive ? '#fff' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.sortPillText,
                      isActive && styles.sortPillTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Summary */}
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsCount}>
            {filteredMaids.length} {filteredMaids.length === 1 ? 'maid' : 'maids'}
          </Text>
          {(statusFilter !== 'all' || searchTerm) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setStatusFilter('all');
                setSearchTerm('');
                setDebouncedTerm('');
                setSortBy('newest');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear filters</Text>
              <Ionicons name="close" size={14} color="#10B981" />
            </TouchableOpacity>
          )}
        </View>
      </View>

        {/* Maid List */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadMaids}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredMaids}
            keyExtractor={(item) => item.id}
            renderItem={renderMaidCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No maids found</Text>
                <Text style={styles.emptyText}>
                  {maids.length === 0
                    ? 'Add your first maid to get started'
                    : 'Try adjusting your search or filters'}
                </Text>
                {maids.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => router.push('/agency/maids/add')}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.emptyButtonText}>Add Maid</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          />
        )}

        {/* FAB - Add Maid */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/agency/maids/add')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

      {/* Status Update Modal */}
        <Modal
          visible={showStatusModal}
          animationType="fade"
          transparent
          onRequestClose={() => {
            setShowStatusModal(false);
            setSelectedMaid(null);
          }}
        >
          <TouchableOpacity
            style={styles.statusModalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowStatusModal(false);
              setSelectedMaid(null);
            }}
          >
            <View style={styles.statusModalContent}>
              <Text style={styles.statusModalTitle}>Update Status</Text>
              <Text style={styles.statusModalSubtitle}>{selectedMaid?.full_name}</Text>

              {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((status) => {
                const isSelected =
                  selectedMaid?.availability_status?.toLowerCase() === status.value;
                const color = getStatusColor(status.value);
                return (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusOption,
                      isSelected && { backgroundColor: color.bg },
                    ]}
                    onPress={() =>
                      selectedMaid && updateMaidStatus(selectedMaid.id, status.value)
                    }
                  >
                    <View style={[styles.statusOptionDot, { backgroundColor: color.dot }]} />
                    <Text
                      style={[
                        styles.statusOptionText,
                        isSelected && { color: color.text, fontWeight: '600' },
                      ]}
                    >
                      {status.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={20} color={color.text} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Display Settings Modal */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={styles.settingsModalOverlay}>
            <View style={styles.settingsModalContent}>
              <View style={styles.settingsModalHeader}>
                <Text style={styles.settingsModalTitle}>Card Display Settings</Text>
                <TouchableOpacity
                  style={styles.settingsCloseButton}
                  onPress={() => setShowSettingsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.settingsScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.settingsSectionTitle}>Photo & Badges</Text>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="image-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Photo</Text>
                  </View>
                  <Switch
                    value={displaySettings.showPhoto}
                    onValueChange={(value) => updateDisplaySetting('showPhoto', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showPhoto ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Verification Badge</Text>
                  </View>
                  <Switch
                    value={displaySettings.showVerificationBadge}
                    onValueChange={(value) => updateDisplaySetting('showVerificationBadge', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showVerificationBadge ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="play-circle-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Video Icon</Text>
                  </View>
                  <Switch
                    value={displaySettings.showVideoBadge}
                    onValueChange={(value) => updateDisplaySetting('showVideoBadge', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showVideoBadge ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="business-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Agency Badge</Text>
                  </View>
                  <Switch
                    value={displaySettings.showAgencyBadge}
                    onValueChange={(value) => updateDisplaySetting('showAgencyBadge', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showAgencyBadge ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <Text style={styles.settingsSectionTitle}>Maid Information</Text>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="flag-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Nationality</Text>
                  </View>
                  <Switch
                    value={displaySettings.showNationality}
                    onValueChange={(value) => updateDisplaySetting('showNationality', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showNationality ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="location-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Location</Text>
                  </View>
                  <Switch
                    value={displaySettings.showLocation}
                    onValueChange={(value) => updateDisplaySetting('showLocation', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showLocation ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="cash-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Salary</Text>
                  </View>
                  <Switch
                    value={displaySettings.showSalary}
                    onValueChange={(value) => updateDisplaySetting('showSalary', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showSalary ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="construct-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Skills</Text>
                  </View>
                  <Switch
                    value={displaySettings.showSkills}
                    onValueChange={(value) => updateDisplaySetting('showSkills', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showSkills ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <Text style={styles.settingsSectionTitle}>Right Column Badges</Text>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="briefcase-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Profession Badge</Text>
                  </View>
                  <Switch
                    value={displaySettings.showProfessionBadge}
                    onValueChange={(value) => updateDisplaySetting('showProfessionBadge', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showProfessionBadge ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Experience Badge</Text>
                  </View>
                  <Switch
                    value={displaySettings.showExperienceBadge}
                    onValueChange={(value) => updateDisplaySetting('showExperienceBadge', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showExperienceBadge ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="home-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Preference Badge</Text>
                  </View>
                  <Switch
                    value={displaySettings.showPreferenceBadge}
                    onValueChange={(value) => updateDisplaySetting('showPreferenceBadge', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showPreferenceBadge ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="heart-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingLabel}>Favorite Icon</Text>
                  </View>
                  <Switch
                    value={displaySettings.showFavoriteIcon}
                    onValueChange={(value) => updateDisplaySetting('showFavoriteIcon', value)}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={displaySettings.showFavoriteIcon ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
    </View>
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
  // Tab Bar Styles
  tabBarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabBarContent: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10B981',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 6,
  },
  tabLabelActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: '#10B981',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  // Search & Sort Section
  searchSortSection: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  // Sort Pills
  sortPillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sortLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 10,
  },
  sortPillsContent: {
    gap: 8,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  sortPillActive: {
    backgroundColor: '#10B981',
  },
  sortPillText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortPillTextActive: {
    color: '#fff',
  },
  // Results Summary
  resultsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  resultsCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  // Maid Card
  maidCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
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
  },
  maidImageContainer: {
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  maidImageBg: {
    width: '100%',
    height: '100%',
  },
  maidImageStyle: {
    resizeMode: 'cover',
    width: '100%',
    height: '150%',
    top: 0,
  },
  maidImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  maidImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  maidPlaceholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  maidInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  maidPlaceholderText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  verifiedBadge: {
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
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  experienceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  agencyBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  agencyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  maidInfo: {
    padding: 14,
  },
  maidName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  maidLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  maidNationality: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  maidLocation: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  maidSalary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 8,
    marginBottom: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  actionButtonOutline: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  actionButtonDanger: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
  },
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonTextOutline: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  // Status Modal
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  statusOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
  },
  // New Styles for Card Display Settings
  topRightBadges: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  videoBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  videoBadgeDisabled: {
    backgroundColor: '#CCCCCC',
  },
  countryFlag: {
    fontSize: 14,
  },
  maidInfoContent: {
    flexDirection: 'row',
  },
  maidInfoLeft: {
    flex: 1,
  },
  maidInfoRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingLeft: 12,
    gap: 8,
  },
  professionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  professionBadgeDisabled: {
    backgroundColor: '#F3F4F6',
  },
  professionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  professionBadgeTextDisabled: {
    color: '#9CA3AF',
  },
  experienceBadgeRight: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  experienceBadgeRightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  preferenceBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 120,
  },
  preferenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteButtonTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  favoriteButtonTopActive: {
    backgroundColor: '#EF4444',
  },
  // Settings Modal Styles
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  settingsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingsCloseButton: {
    padding: 4,
  },
  settingsScrollView: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#1F2937',
  },
});
