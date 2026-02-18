/**
 * Maids Screen
 *
 * Browse and search maids with filtering and sorting.
 * Card design matching featured maids from home screen.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  ImageBackground,
  Dimensions,
  Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useGetMaidsWithFiltersQuery } from '@ethio/api-client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width with padding
const FAVORITES_KEY = 'sponsor_maid_favorites';

// Types
interface MaidProfile {
  id: string;
  full_name?: string;
  nationality?: string;
  experience_years?: number;
  availability_status?: string;
  skills?: string[];
  languages?: string[];
  current_location?: string;
  preferred_salary_min?: number;
  preferred_salary_max?: number;
  preferred_currency?: string;
  verification_status?: string;
  average_rating?: number;
  profile_completion_percentage?: number;
  profile_photo_url?: string;
  created_at?: string;
  introduction_video_url?: string;
  primary_profession?: string;
  live_in_preference?: boolean;
  contract_duration_preference?: string;
  is_agency_managed?: boolean;
  iso_country_code?: string;
}

// Helper function to check if maid is verified (based on verification_status)
const isVerifiedMaid = (maid: MaidProfile): boolean => {
  return maid.verification_status === 'verified';
};

// Get initials from name
const getInitials = (name?: string): string => {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
    'ethiopian': '\u{1F1EA}\u{1F1F9}',
    'ethiopia': '\u{1F1EA}\u{1F1F9}',
    'filipino': '\u{1F1F5}\u{1F1ED}',
    'philippines': '\u{1F1F5}\u{1F1ED}',
    'kenyan': '\u{1F1F0}\u{1F1EA}',
    'kenya': '\u{1F1F0}\u{1F1EA}',
    'ugandan': '\u{1F1FA}\u{1F1EC}',
    'uganda': '\u{1F1FA}\u{1F1EC}',
    'indian': '\u{1F1EE}\u{1F1F3}',
    'india': '\u{1F1EE}\u{1F1F3}',
    'indonesian': '\u{1F1EE}\u{1F1E9}',
    'indonesia': '\u{1F1EE}\u{1F1E9}',
    'sri lankan': '\u{1F1F1}\u{1F1F0}',
    'sri lanka': '\u{1F1F1}\u{1F1F0}',
    'nepalese': '\u{1F1F3}\u{1F1F5}',
    'nepal': '\u{1F1F3}\u{1F1F5}',
    'bangladeshi': '\u{1F1E7}\u{1F1E9}',
    'bangladesh': '\u{1F1E7}\u{1F1E9}',
    'pakistani': '\u{1F1F5}\u{1F1F0}',
    'pakistan': '\u{1F1F5}\u{1F1F0}',
  };
  const key = (nationality || '').toLowerCase();
  return nationalityMap[key] || '\u{1F3F3}\u{FE0F}';
};

// Format posted date (relative time)
const getPostedDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

// Get status color
const getStatusColor = (status?: string) => {
  const statusLower = (status || '').toLowerCase();
  switch (statusLower) {
    case 'available':
      return { bg: 'rgba(16, 185, 129, 0.9)', text: '#fff', dot: '#fff' };
    case 'placed':
      return { bg: 'rgba(59, 130, 246, 0.9)', text: '#fff', dot: '#fff' };
    case 'pending':
      return { bg: 'rgba(245, 158, 11, 0.9)', text: '#fff', dot: '#fff' };
    case 'unavailable':
      return { bg: 'rgba(239, 68, 68, 0.9)', text: '#fff', dot: '#fff' };
    default:
      return { bg: 'rgba(107, 114, 128, 0.9)', text: '#fff', dot: '#fff' };
  }
};

// Filter options
const NATIONALITIES = [
  { label: 'All Nationalities', value: 'all' },
  { label: 'Ethiopian', value: 'Ethiopian' },
  { label: 'Filipino', value: 'Filipino' },
  { label: 'Indonesian', value: 'Indonesian' },
  { label: 'Sri Lankan', value: 'Sri Lankan' },
  { label: 'Indian', value: 'Indian' },
  { label: 'Kenyan', value: 'Kenyan' },
  { label: 'Ugandan', value: 'Ugandan' },
];

const EXPERIENCE_LEVELS = [
  { label: 'Any Experience', value: 'all' },
  { label: '0-1 years', value: '0-1' },
  { label: '1-3 years', value: '1-3' },
  { label: '3-5 years', value: '3-5' },
  { label: '5+ years', value: '5+' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'Any Status', value: 'all' },
  { label: 'Available Now', value: 'available' },
  { label: 'Available Soon', value: 'available_soon' },
];

const SORT_OPTIONS = [
  { label: 'Best Match', value: 'bestMatch', icon: 'star-outline' },
  { label: 'Rating', value: 'rating', icon: 'star' },
  { label: 'Experience', value: 'experience', icon: 'briefcase-outline' },
  { label: 'Newest', value: 'newest', icon: 'time-outline' },
];

// Profession filter options
// Values MUST match exact database values from PRIMARY_PROFESSION_OPTIONS in maid/profile.tsx
const PROFESSION_OPTIONS = [
  { label: 'All', value: 'all', icon: 'people' },
  { label: 'Housemaid', value: 'Housemaid', icon: 'home' },
  { label: 'Nanny', value: 'Nanny', icon: 'happy' },
  { label: 'Baby Sitter', value: 'Baby Sitter', icon: 'heart' },
  { label: 'Cook', value: 'Cook', icon: 'restaurant' },
  { label: 'Cleaner', value: 'Cleaner', icon: 'sparkles' },
  { label: 'Caregiver', value: 'Caregiver', icon: 'medkit' },
  { label: 'Elder Care', value: 'Elder Care', icon: 'accessibility' },
  { label: 'General Helper', value: 'General Helper', icon: 'hand-left' },
  { label: 'Driver', value: 'Driver', icon: 'car' },
  { label: 'Gardener', value: 'Gardener', icon: 'leaf' },
  { label: 'Other', value: 'Other', icon: 'ellipsis-horizontal' },
];

export default function MaidsScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites from SecureStore
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedFavorites = await SecureStore.getItemAsync(FAVORITES_KEY);
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    loadFavorites();
  }, []);

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
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Filters state
  const [filters, setFilters] = useState({
    nationality: 'all',
    experience: 'all',
    availability: 'all',
    profession: 'all',
    verifiedOnly: false,
  });

  const [sortBy, setSortBy] = useState('newest');

  // Build GraphQL where clause
  const buildWhereClause = useCallback(() => {
    const where: any = { _and: [] };

    // Nationality filter
    if (filters.nationality !== 'all') {
      where._and.push({ nationality: { _eq: filters.nationality } });
    }

    // Experience filter
    if (filters.experience !== 'all') {
      switch (filters.experience) {
        case '0-1':
          where._and.push({ experience_years: { _lte: 1 } });
          break;
        case '1-3':
          where._and.push({ experience_years: { _gte: 1, _lte: 3 } });
          break;
        case '3-5':
          where._and.push({ experience_years: { _gte: 3, _lte: 5 } });
          break;
        case '5+':
          where._and.push({ experience_years: { _gte: 5 } });
          break;
      }
    }

    // Availability filter
    if (filters.availability !== 'all') {
      where._and.push({ availability_status: { _eq: filters.availability } });
    }

    // Profession filter (exact match - values must match DB exactly)
    if (filters.profession !== 'all') {
      where._and.push({ primary_profession: { _eq: filters.profession } });
    }

    // Search term
    if (debouncedTerm.trim()) {
      const term = `%${debouncedTerm.trim()}%`;
      where._and.push({
        _or: [
          { full_name: { _ilike: term } },
          { nationality: { _ilike: term } },
          { current_location: { _ilike: term } },
        ],
      });
    }

    return where._and.length > 0 ? where : {};
  }, [filters, debouncedTerm]);

  // Build order by clause
  const buildOrderBy = useCallback(() => {
    switch (sortBy) {
      case 'rating':
        return [{ average_rating: 'desc_nulls_last' }];
      case 'experience':
        return [{ experience_years: 'desc_nulls_last' }];
      case 'newest':
      case 'bestMatch':
      default:
        return [{ created_at: 'desc' }];
    }
  }, [sortBy]);

  // GraphQL query
  const { data, loading, error, refetch } = useGetMaidsWithFiltersQuery({
    variables: {
      where: buildWhereClause(),
      orderBy: buildOrderBy(),
      limit: 50,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Debounce search
  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setTimeout(() => {
      setDebouncedTerm(text);
    }, 300);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Process and sort maids
  const maids = useMemo(() => {
    let maidList = (data?.maid_profiles || []) as MaidProfile[];

    // Filter verified only
    if (filters.verifiedOnly) {
      maidList = maidList.filter(m => isVerifiedMaid(m));
    }

    // Apply "best match" sorting on client side
    if (sortBy === 'bestMatch') {
      maidList = [...maidList].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Rating scores higher
        scoreA += (a.average_rating || 0) * 2;
        scoreB += (b.average_rating || 0) * 2;

        // Experience scores (capped at 10)
        scoreA += Math.min(a.experience_years || 0, 10);
        scoreB += Math.min(b.experience_years || 0, 10);

        // Verified users score higher
        if (isVerifiedMaid(a)) scoreA += 5;
        if (isVerifiedMaid(b)) scoreB += 5;

        // Profile completion scores
        scoreA += (a.profile_completion_percentage || 0) / 20;
        scoreB += (b.profile_completion_percentage || 0) / 20;

        return scoreB - scoreA;
      });
    }

    return maidList;
  }, [data?.maid_profiles, sortBy, filters.verifiedOnly]);

  const totalCount = data?.maid_profiles_aggregate?.aggregate?.count || maids.length;

  // Format salary display
  const formatSalary = (min?: number, max?: number, currency?: string) => {
    const curr = currency || 'USD';
    const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '\u20AC' : curr;
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    }
    if (min) return `From ${symbol}${min.toLocaleString()}`;
    if (max) return `Up to ${symbol}${max.toLocaleString()}`;
    return 'Negotiable';
  };

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

  // Reset filters
  const resetFilters = () => {
    setFilters({
      nationality: 'all',
      experience: 'all',
      availability: 'all',
      profession: 'all',
      verifiedOnly: false,
    });
    setSortBy('bestMatch');
    setSearchTerm('');
    setDebouncedTerm('');
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.nationality !== 'all') count++;
    if (filters.experience !== 'all') count++;
    if (filters.availability !== 'all') count++;
    if (filters.profession !== 'all') count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  // Render filter option
  const renderFilterOption = (
    options: { label: string; value: string }[],
    currentValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.filterOptionsRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterChip,
            currentValue === option.value && styles.filterChipActive,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.filterChipText,
              currentValue === option.value && styles.filterChipTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render maid card - New polished design
  const renderMaidCard = ({ item }: { item: MaidProfile }) => {
    const statusColor = getStatusColor(item.availability_status);
    const isFavorite = favorites.has(item.id);

    return (
      <TouchableOpacity
        style={styles.maidCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/maid/${item.id}`)}
      >
        {/* Image Container */}
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
              color="#fff"
            />
          </TouchableOpacity>

          {/* Top Right Badges Container */}
          <View style={styles.topRightBadges}>
            {/* Verification Badge */}
            {isVerifiedMaid(item) && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            )}
            {/* Video Badge - Always show with disabled state if no video */}
            <View style={[styles.videoBadge, !item.introduction_video_url && styles.videoBadgeDisabled]}>
              <Ionicons name="play" size={14} color={item.introduction_video_url ? '#fff' : '#9CA3AF'} />
            </View>
          </View>

          {/* Status Badge - Bottom Left */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
              {item.availability_status || 'Unknown'}
            </Text>
          </View>

          {/* Agency Badge - Bottom Right */}
          {item.is_agency_managed && (
            <View style={styles.agencyBadge}>
              <Ionicons name="business" size={12} color="#fff" />
              <Text style={styles.agencyBadgeText}>Agency</Text>
            </View>
          )}
        </View>

        {/* Info Section - Two Column Layout */}
        <View style={styles.maidInfo}>
          <View style={styles.maidInfoContent}>
            {/* Left Column - Main Info */}
            <View style={styles.maidInfoLeft}>
              <Text style={styles.maidName} numberOfLines={1}>
                {item.full_name || 'No Name'}
              </Text>

              <View style={styles.maidLocationRow}>
                <Text style={styles.countryFlag}>
                  {getCountryFlag(item.iso_country_code, item.nationality)}
                </Text>
                <Text style={styles.maidNationality} numberOfLines={1}>
                  {item.nationality || 'Unknown'}
                </Text>
              </View>

              {item.current_location && (
                <View style={styles.maidLocationRow}>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text style={styles.maidLocation} numberOfLines={1}>
                    {item.current_location}
                  </Text>
                </View>
              )}

              <Text style={styles.maidSalary}>
                {formatSalary(
                  item.preferred_salary_min,
                  item.preferred_salary_max,
                  item.preferred_currency
                )}
                /mo
              </Text>

              {/* Skills */}
              {item.skills && Array.isArray(item.skills) && item.skills.length > 0 && (
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
              {/* Profession Badge - Always show with placeholder */}
              <View style={[styles.professionBadge, !item.primary_profession && styles.professionBadgeDisabled]}>
                <Text style={[styles.professionBadgeText, !item.primary_profession && styles.professionBadgeTextDisabled]}>
                  {item.primary_profession
                    ? item.primary_profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : 'N/A'}
                </Text>
              </View>

              {/* Experience Badge */}
              {item.experience_years != null && item.experience_years > 0 && (
                <View style={styles.experienceBadgeRight}>
                  <Text style={styles.experienceBadgeRightText}>{`${item.experience_years} yrs`}</Text>
                </View>
              )}

              {/* Preference Badge - Always show with placeholder */}
              <View style={[styles.preferenceBadge, !(item.live_in_preference !== undefined || item.contract_duration_preference) && styles.preferenceBadgeDisabled]}>
                <Text style={[styles.preferenceBadgeText, !(item.live_in_preference !== undefined || item.contract_duration_preference) && styles.preferenceBadgeTextDisabled]} numberOfLines={1}>
                  {(item.live_in_preference !== undefined || item.contract_duration_preference)
                    ? getPreferenceText(item.live_in_preference, item.contract_duration_preference)
                    : 'Flexible'}
                </Text>
              </View>

              {/* Posted Date */}
              {item.created_at && (
                <View style={styles.postedDateContainer}>
                  <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.postedDateText}>{getPostedDate(item.created_at)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => router.push(`/maid/${item.id}`)}
            >
              <Ionicons name="eye-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonTextPrimary}>View</Text>
            </TouchableOpacity>
            {item.is_agency_managed ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonAgency]}
                onPress={() => router.push(`/maid/${item.id}?action=contact-agency`)}
              >
                <Ionicons name="business-outline" size={16} color="#3B82F6" />
                <Text style={styles.actionButtonTextAgency}>Contact Agency</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonOutline]}
                onPress={() => router.push(`/maid/${item.id}?action=hire`)}
              >
                <Ionicons name="briefcase-outline" size={16} color="#10B981" />
                <Text style={styles.actionButtonTextOutline}>Hire Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, nationality..."
            value={searchTerm}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchTerm(''); setDebouncedTerm(''); }}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? '#fff' : '#6B7280'}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort & Filter Bar */}
      <View style={styles.sortFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
        >
          <Text style={styles.sortLabel}>Sort by:</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortChip, sortBy === option.value && styles.sortChipActive]}
              onPress={() => setSortBy(option.value)}
            >
              <Text style={[styles.sortChipText, sortBy === option.value && styles.sortChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Profession Filter Bar */}
      <View style={styles.professionFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.professionContent}
        >
          {PROFESSION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.professionChip,
                filters.profession === option.value && styles.professionChipActive
              ]}
              onPress={() => setFilters(prev => ({ ...prev, profession: option.value }))}
            >
              <Ionicons
                name={option.icon as any}
                size={14}
                color={filters.profession === option.value ? '#fff' : '#6B7280'}
              />
              <Text style={[
                styles.professionChipText,
                filters.profession === option.value && styles.professionChipTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Summary Bar */}
      <View style={styles.resultsBar}>
        <View style={styles.resultsLeft}>
          <Text style={styles.resultCount}>
            {totalCount} {totalCount === 1 ? 'maid' : 'maids'}
          </Text>
          {sortBy === 'bestMatch' && (
            <View style={styles.aiMatchedBadge}>
              <Ionicons name="sparkles" size={12} color="#8B5CF6" />
              <Text style={styles.aiMatchedText}>AI Matched</Text>
            </View>
          )}
        </View>
        {activeFilterCount > 0 && (
          <TouchableOpacity style={styles.clearFiltersInline} onPress={resetFilters}>
            <Ionicons name="close-circle" size={14} color="#6366F1" />
            <Text style={styles.clearFiltersInlineText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Maid Grid */}
      {loading && maids.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Error loading maids</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={maids}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
          }
          renderItem={renderMaidCard}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No maids found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Maids</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Nationality Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Nationality</Text>
              {renderFilterOption(NATIONALITIES, filters.nationality, (value) =>
                setFilters({ ...filters, nationality: value })
              )}
            </View>

            {/* Experience Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Experience</Text>
              {renderFilterOption(EXPERIENCE_LEVELS, filters.experience, (value) =>
                setFilters({ ...filters, experience: value })
              )}
            </View>

            {/* Availability Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Availability</Text>
              {renderFilterOption(AVAILABILITY_OPTIONS, filters.availability, (value) =>
                setFilters({ ...filters, availability: value })
              )}
            </View>

            {/* Verified Only Toggle */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
              >
                <View style={styles.toggleInfo}>
                  <Ionicons name="shield-checkmark" size={20} color="#059669" />
                  <Text style={styles.toggleLabel}>Verified Profiles Only</Text>
                </View>
                <View style={[styles.toggle, filters.verifiedOnly && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, filters.verifiedOnly && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Sort & Filter Bar
  sortFilterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  sortContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  sortChip: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  sortChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Profession Filter Bar
  professionFilterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
  },
  professionContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  professionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  professionChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  professionChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  professionChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Results Bar
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultCount: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  aiMatchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiMatchedText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '600',
  },
  clearFiltersInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersInlineText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '500',
  },
  grid: {
    padding: 16,
    paddingTop: 0,
  },

  // Maid Card Styles - Polished Design
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
  // Top badges
  topRightBadges: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
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
  videoBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  videoBadgeDisabled: {
    backgroundColor: '#CCCCCC',
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
  // Status badge
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
  // Agency badge
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
  // Info section
  maidInfo: {
    padding: 14,
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
  countryFlag: {
    fontSize: 14,
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
    marginBottom: 4,
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
  // Right column badges
  professionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  professionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  professionBadgeDisabled: {
    backgroundColor: '#F3F4F6',
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
  preferenceBadgeDisabled: {
    backgroundColor: '#F3F4F6',
  },
  preferenceBadgeTextDisabled: {
    color: '#9CA3AF',
  },
  // Posted date
  postedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  postedDateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Action buttons
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
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
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextOutline: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonAgency: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  actionButtonTextAgency: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },

  // Error & Empty States
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
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
  empty: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#6366F1',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
