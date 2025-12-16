/**
 * Maid Profile Preview Screen
 *
 * Shows detailed information about a specific maid
 * Includes video CV, all attributes, and action buttons
 */

import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Platform,
  Linking,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useCreateConversation } from '../../hooks/useMessages';

const { width } = Dimensions.get('window');

// Helper to check if string is valid UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const GET_MAID_PROFILE = gql`
  query GetMaidProfile($id: String!) {
    maid_profiles_by_pk(id: $id) {
      id
      user_id
      full_name
      first_name
      last_name
      date_of_birth
      nationality
      current_location
      country
      state_province
      experience_years
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      profile_photo_url
      about_me
      skills
      special_skills
      languages
      education_level
      marital_status
      children_count
      religion
      availability_status
      available_from
      verification_status
      created_at
      updated_at
      introduction_video_url
      video_duration
      primary_profession
      primary_profession_other
      live_in_preference
      contract_duration_preference
      work_preferences
      key_responsibilities
      additional_services
      is_agency_managed
      agency_id
      agency_badge
      iso_country_code
      phone_number
      phone_country_code
      phone_verified
      visa_status
      current_visa_status
      passport_expiry
      medical_certificate_valid
      police_clearance_valid
      average_rating
      profile_views
      successful_placements
      total_applications
      previous_countries
    }
  }
`;

// Query to get maid gallery images
const GET_MAID_IMAGES = gql`
  query GetMaidImages($maidId: uuid!) {
    maid_images(
      where: { maid_id: { _eq: $maidId } }
      order_by: [{ is_primary: desc }, { display_order: asc }]
    ) {
      id
      file_url
      is_primary
      display_order
    }
  }
`;

// Query to get profile ID by email
const GET_PROFILE_ID = gql`
  query GetProfileId($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      user_type
    }
  }
`;

// Check if maid is favorited
const CHECK_FAVORITE = gql`
  query CheckFavorite($sponsorId: String!, $maidId: String!) {
    favorites(
      where: {
        sponsor_id: { _eq: $sponsorId }
        maid_id: { _eq: $maidId }
      }
      limit: 1
    ) {
      id
    }
  }
`;

// Add to favorites mutation
const ADD_TO_FAVORITES = gql`
  mutation AddToFavorites($sponsorId: String!, $maidId: String!) {
    insert_favorites_one(object: { sponsor_id: $sponsorId, maid_id: $maidId }) {
      id
    }
  }
`;

// Remove from favorites mutation
const REMOVE_FROM_FAVORITES = gql`
  mutation RemoveFromFavorites($sponsorId: String!, $maidId: String!) {
    delete_favorites(
      where: {
        sponsor_id: { _eq: $sponsorId }
        maid_id: { _eq: $maidId }
      }
    ) {
      affected_rows
    }
  }
`;

// Helper to calculate age from date of birth
const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
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
  };
  const key = (nationality || '').toLowerCase();
  return nationalityMap[key] || '\u{1F3F3}\u{FE0F}';
};

// Get status color
const getStatusColor = (status?: string) => {
  const statusLower = (status || '').toLowerCase();
  switch (statusLower) {
    case 'available':
      return { bg: '#10B981', text: '#fff' };
    case 'placed':
      return { bg: '#3B82F6', text: '#fff' };
    case 'pending':
      return { bg: '#F59E0B', text: '#fff' };
    case 'unavailable':
      return { bg: '#EF4444', text: '#fff' };
    default:
      return { bg: '#6B7280', text: '#fff' };
  }
};

// Format salary
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

// Format posted date
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

export default function MaidProfileScreen() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const { user, userType } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Create conversation hook
  const { createConversation, userId: myProfileId } = useCreateConversation();

  // Fetch maid profile
  const { data, loading, error } = useQuery(GET_MAID_PROFILE, {
    variables: { id },
    skip: !id,
  });

  // Fetch maid images (only if id is a valid UUID - maid_images.maid_id is uuid type)
  const { data: imagesData } = useQuery(GET_MAID_IMAGES, {
    variables: { maidId: id },
    skip: !id || !isValidUUID(id),
  });

  // Fetch profile ID
  useQuery(GET_PROFILE_ID, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  // Get maid's user_id for favorites
  const maidUserId = data?.maid_profiles_by_pk?.user_id;

  // Check if maid is favorited
  useQuery(CHECK_FAVORITE, {
    variables: { sponsorId: profileId, maidId: maidUserId },
    skip: !profileId || !maidUserId,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setIsFavorited(data?.favorites?.length > 0);
    },
  });

  // Mutations
  const [addToFavorites] = useMutation(ADD_TO_FAVORITES);
  const [removeFromFavorites] = useMutation(REMOVE_FROM_FAVORITES);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(async () => {
    if (!profileId || !maidUserId) {
      Alert.alert('Sign In Required', 'Please sign in as a sponsor to save maids to favorites.');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites({
          variables: { sponsorId: profileId, maidId: maidUserId },
        });
        setIsFavorited(false);
      } else {
        await addToFavorites({
          variables: { sponsorId: profileId, maidId: maidUserId },
        });
        setIsFavorited(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  }, [profileId, maidUserId, isFavorited, addToFavorites, removeFromFavorites]);

  // Handle contact/start conversation
  const handleContact = useCallback(async () => {
    if (!myProfileId) {
      Alert.alert('Sign In Required', 'Please sign in to send messages.');
      return;
    }

    if (!maidUserId) {
      Alert.alert('Error', 'Unable to contact this maid. Please try again.');
      return;
    }

    setContactLoading(true);
    try {
      const myType = userType || 'sponsor';
      const conversation = await createConversation(maidUserId, 'maid', myType);

      if (conversation?.id) {
        router.push(`/chat/${conversation.id}`);
      } else {
        Alert.alert('Error', 'Failed to start conversation. Please try again.');
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', error.message || 'Failed to start conversation');
    } finally {
      setContactLoading(false);
    }
  }, [myProfileId, maidUserId, userType, createConversation]);

  // Handle hire now
  const handleHireNow = useCallback(() => {
    Alert.alert(
      'Hire Request',
      `Send a hire request to ${data?.maid_profiles_by_pk?.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Request', onPress: () => handleContact() },
      ]
    );
  }, [data, handleContact]);

  // Handle contact agency
  const handleContactAgency = useCallback(() => {
    Alert.alert(
      'Contact Agency',
      'Would you like to contact the agency managing this maid?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact', onPress: () => handleContact() },
      ]
    );
  }, [handleContact]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !data?.maid_profiles_by_pk) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maid = data.maid_profiles_by_pk;
  const statusColor = getStatusColor(maid.availability_status);
  const age = calculateAge(maid.date_of_birth);

  // Prepare images for slideshow - combine gallery images with profile photo
  const galleryImages = imagesData?.maid_images || [];
  const allImages = galleryImages.length > 0
    ? galleryImages.map((img: any) => ({ id: img.id, uri: img.file_url }))
    : maid.profile_photo_url
      ? [{ id: 'profile', uri: maid.profile_photo_url }]
      : [];

  // Handle scroll event for pagination dots
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setActiveImageIndex(index);
  };

  // Render single image for slideshow
  const renderImageItem = ({ item }: { item: { id: string; uri: string } }) => (
    <View style={styles.slideImageContainer}>
      <Image
        source={{ uri: item.uri }}
        style={styles.slideImage}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Image Slideshow */}
        <View style={styles.heroSection}>
          {allImages.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={allImages}
                renderItem={renderImageItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.imageSlideshow}
              />
              {/* Pagination Dots */}
              {allImages.length > 1 && (
                <View style={styles.paginationDots}>
                  {allImages.map((_: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === activeImageIndex && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
              {/* Image Counter */}
              {allImages.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {activeImageIndex + 1} / {allImages.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="person" size={80} color="#9CA3AF" />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
            pointerEvents="none"
          />
          {/* Only Verified Badge on Image */}
          <View style={styles.heroBadges}>
            {maid.verification_status === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Main Info Card */}
        <View style={styles.mainInfoCard}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{maid.full_name || 'No Name'}</Text>
            <TouchableOpacity
              style={[styles.favoriteBtn, isFavorited && styles.favoriteBtnActive]}
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
            >
              {favoriteLoading ? (
                <ActivityIndicator size="small" color={isFavorited ? '#fff' : '#EF4444'} />
              ) : (
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorited ? '#fff' : '#EF4444'}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <Text style={styles.countryFlag}>
              {getCountryFlag(maid.iso_country_code, maid.nationality)}
            </Text>
            <Text style={styles.nationality}>{maid.nationality || 'Unknown'}</Text>
            {maid.current_location && (
              <>
                <Text style={styles.locationDivider}>•</Text>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.location}>{maid.current_location}</Text>
              </>
            )}
          </View>

          {maid.primary_profession && (
            <View style={styles.professionRow}>
              <View style={styles.professionBadge}>
                <Text style={styles.professionBadgeText}>
                  {maid.primary_profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.salary}>
            {formatSalary(maid.preferred_salary_min, maid.preferred_salary_max, maid.preferred_currency)}/mo
          </Text>

          {/* Status and Agency Badges Row */}
          <View style={styles.cardBadgesRow}>
            {/* Availability Status Badge */}
            <View style={[styles.statusBadgeCard, { backgroundColor: statusColor.bg }]}>
              <View style={[styles.statusDotCard, { backgroundColor: statusColor.text }]} />
              <Text style={[styles.statusBadgeCardText, { color: statusColor.text }]}>
                {maid.availability_status || 'Unknown'}
              </Text>
            </View>
            {/* Agency Badge */}
            {maid.is_agency_managed ? (
              <View style={styles.agencyBadgeCard}>
                <Ionicons name="business" size={14} color="#fff" />
                <Text style={styles.agencyBadgeCardText}>Agency Managed</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.postedRow}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text style={styles.postedText}>Posted {getPostedDate(maid.created_at)}</Text>
          </View>
        </View>

        {/* Video CV Section */}
        {maid.introduction_video_url ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="videocam" size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Video CV</Text>
            </View>
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: maid.introduction_video_url }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                shouldPlay={videoPlaying}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setVideoPlaying(status.isPlaying);
                  }
                }}
              />
            </View>
          </View>
        ) : null}

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={24} color="#6366F1" />
            <Text style={styles.statValue}>{age || '-'}</Text>
            <Text style={styles.statLabel}>Years Old</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="briefcase-outline" size={24} color="#10B981" />
            <Text style={styles.statValue}>{maid.experience_years || 0}</Text>
            <Text style={styles.statLabel}>Years Exp.</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="globe-outline" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{maid.languages?.length || 0}</Text>
            <Text style={styles.statLabel}>Languages</Text>
          </View>
        </View>

        {/* About Section */}
        {maid.about_me ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <Text style={styles.aboutText}>{maid.about_me}</Text>
          </View>
        ) : null}

        {/* Work Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Work Preferences</Text>
          </View>
          <View style={styles.preferencesGrid}>
            <View style={styles.preferenceItem}>
              <Ionicons name="home-outline" size={18} color="#6B7280" />
              <Text style={styles.preferenceLabel}>Live-in</Text>
              <Text style={styles.preferenceValue}>
                {maid.live_in_preference === true ? 'Yes' : maid.live_in_preference === false ? 'No' : 'Flexible'}
              </Text>
            </View>
            <View style={styles.preferenceItem}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.preferenceLabel}>Contract</Text>
              <Text style={styles.preferenceValue}>
                {maid.contract_duration_preference?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Flexible'}
              </Text>
            </View>
            {maid.available_from && (
              <View style={styles.preferenceItem}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={styles.preferenceLabel}>Available</Text>
                <Text style={styles.preferenceValue}>
                  {new Date(maid.available_from).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
          {maid.work_preferences && maid.work_preferences.length > 0 ? (
            <View style={styles.workPrefTags}>
              {maid.work_preferences.map((pref: string, index: number) => (
                <View key={index} style={styles.workPrefTag}>
                  <Text style={styles.workPrefTagText}>{pref}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Skills Section */}
        {maid.skills && maid.skills.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct-outline" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <View style={styles.tagsContainer}>
              {maid.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Special Skills & Services */}
        {((maid.special_skills && maid.special_skills.length > 0) ||
          (maid.additional_services && maid.additional_services.length > 0) ||
          (maid.key_responsibilities && maid.key_responsibilities.length > 0)) ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Special Skills & Services</Text>
            </View>
            {maid.special_skills && maid.special_skills.length > 0 ? (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Special Skills</Text>
                <View style={styles.tagsContainer}>
                  {maid.special_skills.map((skill: string, index: number) => (
                    <View key={index} style={styles.specialSkillTag}>
                      <Text style={styles.specialSkillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {maid.additional_services && maid.additional_services.length > 0 ? (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Additional Services</Text>
                <View style={styles.tagsContainer}>
                  {maid.additional_services.map((service: string, index: number) => (
                    <View key={index} style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {maid.key_responsibilities && maid.key_responsibilities.length > 0 ? (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Key Responsibilities</Text>
                <View style={styles.tagsContainer}>
                  {maid.key_responsibilities.map((resp: string, index: number) => (
                    <View key={index} style={styles.responsibilityTag}>
                      <Text style={styles.responsibilityTagText}>{resp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Languages Section */}
        {maid.languages && maid.languages.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            <View style={styles.tagsContainer}>
              {maid.languages.map((language: string, index: number) => (
                <View key={index} style={styles.languageTag}>
                  <Text style={styles.languageTagText}>{language}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Personal Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Personal Details</Text>
          </View>
          <View style={styles.detailsGrid}>
            {maid.education_level && (
              <View style={styles.detailRow}>
                <Ionicons name="school-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Education</Text>
                <Text style={styles.detailValue}>{maid.education_level}</Text>
              </View>
            )}
            {maid.marital_status && (
              <View style={styles.detailRow}>
                <Ionicons name="heart-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Marital Status</Text>
                <Text style={styles.detailValue}>{maid.marital_status}</Text>
              </View>
            )}
            {maid.children_count !== null && maid.children_count !== undefined && (
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Children</Text>
                <Text style={styles.detailValue}>{maid.children_count}</Text>
              </View>
            )}
            {maid.religion && (
              <View style={styles.detailRow}>
                <Ionicons name="star-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Religion</Text>
                <Text style={styles.detailValue}>{maid.religion}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Documents & Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Documents & Verification</Text>
          </View>
          <View style={styles.documentsGrid}>
            <View style={styles.documentItem}>
              <Ionicons
                name={maid.passport_expiry ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={maid.passport_expiry ? '#10B981' : '#9CA3AF'}
              />
              <Text style={styles.documentLabel}>Passport</Text>
              <Text style={styles.documentValue}>
                {maid.passport_expiry ? `Exp: ${new Date(maid.passport_expiry).toLocaleDateString()}` : 'Not Set'}
              </Text>
            </View>
            <View style={styles.documentItem}>
              <Ionicons
                name={maid.visa_status ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={maid.visa_status ? '#10B981' : '#9CA3AF'}
              />
              <Text style={styles.documentLabel}>Visa</Text>
              <Text style={styles.documentValue}>{maid.visa_status || maid.current_visa_status || 'Not Set'}</Text>
            </View>
            <View style={styles.documentItem}>
              <Ionicons
                name={maid.medical_certificate_valid ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={maid.medical_certificate_valid ? '#10B981' : '#9CA3AF'}
              />
              <Text style={styles.documentLabel}>Medical</Text>
              <Text style={styles.documentValue}>{maid.medical_certificate_valid ? 'Valid' : 'Not Valid'}</Text>
            </View>
            <View style={styles.documentItem}>
              <Ionicons
                name={maid.police_clearance_valid ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={maid.police_clearance_valid ? '#10B981' : '#9CA3AF'}
              />
              <Text style={styles.documentLabel}>Police Clearance</Text>
              <Text style={styles.documentValue}>{maid.police_clearance_valid ? 'Valid' : 'Not Valid'}</Text>
            </View>
            <View style={styles.documentItem}>
              <Ionicons
                name={maid.phone_verified ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={maid.phone_verified ? '#10B981' : '#9CA3AF'}
              />
              <Text style={styles.documentLabel}>Phone</Text>
              <Text style={styles.documentValue}>{maid.phone_verified ? 'Verified' : 'Not Verified'}</Text>
            </View>
          </View>
        </View>

        {/* Profile Stats */}
        {(maid.average_rating || maid.profile_views !== null || maid.successful_placements !== null) ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Profile Stats</Text>
            </View>
            <View style={styles.statsGrid}>
              {maid.average_rating ? (
                <View style={styles.statGridItem}>
                  <Ionicons name="star" size={24} color="#F59E0B" />
                  <Text style={styles.statGridValue}>{Number(maid.average_rating).toFixed(1)}</Text>
                  <Text style={styles.statGridLabel}>Rating</Text>
                </View>
              ) : null}
              {maid.profile_views !== null && maid.profile_views !== undefined ? (
                <View style={styles.statGridItem}>
                  <Ionicons name="eye-outline" size={24} color="#6366F1" />
                  <Text style={styles.statGridValue}>{maid.profile_views}</Text>
                  <Text style={styles.statGridLabel}>Views</Text>
                </View>
              ) : null}
              {maid.successful_placements !== null && maid.successful_placements !== undefined ? (
                <View style={styles.statGridItem}>
                  <Ionicons name="checkmark-done-outline" size={24} color="#10B981" />
                  <Text style={styles.statGridValue}>{maid.successful_placements}</Text>
                  <Text style={styles.statGridLabel}>Placements</Text>
                </View>
              ) : null}
              {maid.total_applications !== null && maid.total_applications !== undefined ? (
                <View style={styles.statGridItem}>
                  <Ionicons name="document-outline" size={24} color="#3B82F6" />
                  <Text style={styles.statGridValue}>{maid.total_applications}</Text>
                  <Text style={styles.statGridLabel}>Applications</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Previous Countries */}
        {maid.previous_countries && maid.previous_countries.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="globe-outline" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Previous Work Countries</Text>
            </View>
            <View style={styles.tagsContainer}>
              {maid.previous_countries.map((country: string, index: number) => (
                <View key={index} style={styles.countryTag}>
                  <Text style={styles.countryTagText}>{country}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleContact}
          disabled={contactLoading}
        >
          {contactLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.messageButtonText}>Message</Text>
            </>
          )}
        </TouchableOpacity>
        {maid.is_agency_managed ? (
          <TouchableOpacity style={styles.agencyButton} onPress={handleContactAgency}>
            <Ionicons name="business-outline" size={20} color="#3B82F6" />
            <Text style={styles.agencyButtonText}>Contact Agency</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.hireButton} onPress={handleHireNow}>
            <Ionicons name="briefcase-outline" size={20} color="#10B981" />
            <Text style={styles.hireButtonText}>Hire Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 12,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Hero Section
  heroSection: {
    height: 300,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  // Slideshow styles
  imageSlideshow: {
    width: '100%',
    height: 300,
  },
  slideImageContainer: {
    width: width,
    height: 300,
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '150%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroBadges: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
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
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  agencyBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  agencyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadgeHero: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Card Badges Row (for status and agency in mainInfoCard)
  cardBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  statusBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDotCard: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeCardText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  agencyBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  agencyBadgeCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Main Info Card
  mainInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 16,
    padding: 20,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  favoriteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  favoriteBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  countryFlag: {
    fontSize: 16,
  },
  nationality: {
    fontSize: 15,
    color: '#6B7280',
  },
  locationDivider: {
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  location: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  professionRow: {
    marginTop: 12,
  },
  professionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  professionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  salary: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 12,
  },
  postedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  postedText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  // Video Section
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: 220,
  },
  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Sections
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  aboutText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  // Preferences Grid
  preferencesGrid: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  workPrefTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  workPrefTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  workPrefTagText: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '500',
  },
  subSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  specialSkillTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialSkillTagText: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '500',
  },
  serviceTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  serviceTagText: {
    fontSize: 13,
    color: '#4338CA',
    fontWeight: '500',
  },
  responsibilityTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  responsibilityTagText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  statGridItem: {
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderRadius: 12,
  },
  statGridValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statGridLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  countryTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countryTagText: {
    fontSize: 14,
    color: '#4338CA',
    fontWeight: '500',
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillTagText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  languageTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageTagText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  certTagText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500',
  },
  // Experience Grid
  experienceGrid: {
    gap: 16,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  experienceLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
  },
  experienceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  // Details Grid
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  // Documents Grid
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  documentItem: {
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderRadius: 12,
  },
  documentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  documentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  // Additional Skills
  additionalSkillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  additionalSkillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  additionalSkillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  additionalSkillDisabled: {
    color: '#9CA3AF',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hireButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  hireButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  agencyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  agencyButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});
