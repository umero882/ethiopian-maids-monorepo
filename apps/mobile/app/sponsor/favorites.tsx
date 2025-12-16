/**
 * Sponsor Favorites Page
 *
 * Displays all saved/favorite maids for the sponsor with the ability
 * to view profiles, remove from favorites, and send booking requests.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL query to get profile ID by email
const GET_PROFILE_ID = gql`
  query GetProfileId($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      user_type
    }
  }
`;

// GraphQL query to get sponsor's favorites
const GET_SPONSOR_FAVORITES = gql`
  query GetSponsorFavorites($sponsorId: String!) {
    favorites(
      where: { sponsor_id: { _eq: $sponsorId } }
      order_by: { created_at: desc }
    ) {
      id
      sponsor_id
      maid_id
      created_at
    }
  }
`;

// Query to get maid profiles by their IDs
const GET_MAID_PROFILES_BY_IDS = gql`
  query GetMaidProfilesByIds($maidIds: [String!]!) {
    maid_profiles(where: { user_id: { _in: $maidIds } }) {
      id
      user_id
      full_name
      profile_photo_url
      nationality
      date_of_birth
      skills
      languages
      experience_years
      availability_status
      preferred_salary_min
      preferred_salary_max
    }
  }
`;

// Get favorites count
const GET_FAVORITES_COUNT = gql`
  query GetFavoritesCount($sponsorId: String!) {
    favorites_aggregate(where: { sponsor_id: { _eq: $sponsorId } }) {
      aggregate {
        count
      }
    }
  }
`;

// Mutations
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

interface MaidProfile {
  id: string;
  user_id: string;
  full_name: string;
  profile_photo_url: string | null;
  nationality: string;
  date_of_birth: string | null;
  skills: string[];
  languages: string[];
  experience_years: number | null;
  availability_status: string | null;
  preferred_salary_min: number | null;
  preferred_salary_max: number | null;
}

interface Favorite {
  id: string;
  sponsor_id: string;
  maid_id: string;
  created_at: string;
}

interface FavoriteWithMaid extends Favorite {
  maidProfile?: MaidProfile | null;
}

// Availability status colors
const availabilityColors: Record<string, { bg: string; text: string }> = {
  available: { bg: '#ECFDF5', text: '#10B981' },
  busy: { bg: '#FEF3C7', text: '#F59E0B' },
  unavailable: { bg: '#FEE2E2', text: '#EF4444' },
  hired: { bg: '#EFF6FF', text: '#3B82F6' },
};

export default function SponsorFavoritesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  const { loading: profileLoading } = useQuery(GET_PROFILE_ID, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  // Fetch favorites
  const {
    data: favoritesData,
    loading: favoritesLoading,
    refetch: refetchFavorites,
  } = useQuery(GET_SPONSOR_FAVORITES, {
    variables: { sponsorId: profileId },
    skip: !profileId,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch favorites count
  const { data: countData, refetch: refetchCount } = useQuery(GET_FAVORITES_COUNT, {
    variables: { sponsorId: profileId },
    skip: !profileId,
  });

  // Extract maid IDs from favorites
  const maidIds = useMemo(() => {
    const favorites: Favorite[] = favoritesData?.favorites || [];
    return [...new Set(favorites.map((f) => f.maid_id).filter(Boolean))];
  }, [favoritesData]);

  // Fetch maid profiles
  const { data: maidsData } = useQuery(GET_MAID_PROFILES_BY_IDS, {
    variables: { maidIds },
    skip: maidIds.length === 0,
  });

  // Create a map of maid profiles by user_id
  const maidProfilesMap = useMemo(() => {
    const profiles: MaidProfile[] = maidsData?.maid_profiles || [];
    const map = new Map<string, MaidProfile>();
    profiles.forEach((p) => {
      map.set(p.user_id, p);
    });
    return map;
  }, [maidsData]);

  // Combine favorites with maid profiles
  const favoritesWithMaids: FavoriteWithMaid[] = useMemo(() => {
    const favorites: Favorite[] = favoritesData?.favorites || [];
    return favorites.map((favorite) => ({
      ...favorite,
      maidProfile: maidProfilesMap.get(favorite.maid_id) || null,
    }));
  }, [favoritesData, maidProfilesMap]);

  // Mutations
  const [removeFavorite] = useMutation(REMOVE_FROM_FAVORITES);

  const favoritesCount = countData?.favorites_aggregate?.aggregate?.count || 0;

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFavorites(), refetchCount()]);
    setRefreshing(false);
  }, [refetchFavorites, refetchCount]);

  // Handle remove from favorites
  const handleRemoveFavorite = (maidId: string, maidName: string) => {
    Alert.alert(
      'Remove from Favorites',
      `Remove "${maidName}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavorite({
                variables: { sponsorId: profileId, maidId },
              });
              refetchFavorites();
              refetchCount();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  // Show maid actions
  const showMaidActions = (favorite: FavoriteWithMaid) => {
    const maidName = favorite.maidProfile?.full_name || 'Unknown Maid';
    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      {
        text: 'View Profile',
        onPress: () => router.push(`/maid/${favorite.maid_id}`),
      },
      {
        text: 'Send Booking Request',
        onPress: () => router.push(`/maid/${favorite.maid_id}/book`),
      },
      {
        text: 'Remove from Favorites',
        style: 'destructive',
        onPress: () => handleRemoveFavorite(favorite.maid_id, maidName),
      },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert('Actions', maidName, actions);
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format salary range
  const formatSalary = (min: number | null, max: number | null) => {
    if (min && max) {
      return `ETB ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) return `From ETB ${min.toLocaleString()}`;
    if (max) return `Up to ETB ${max.toLocaleString()}`;
    return 'Negotiable';
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Render favorite card
  const renderFavoriteCard = ({ item: favorite }: { item: FavoriteWithMaid }) => {
    const maid = favorite.maidProfile;
    const age = maid?.date_of_birth ? calculateAge(maid.date_of_birth) : null;
    const availabilityStyle =
      availabilityColors[maid?.availability_status || ''] || availabilityColors.available;

    return (
      <TouchableOpacity
        style={styles.maidCard}
        onPress={() => router.push(`/maid/${favorite.maid_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.maidAvatar}>
            {maid?.profile_photo_url ? (
              <Image source={{ uri: maid.profile_photo_url }} style={styles.maidPhoto} />
            ) : (
              <Text style={styles.avatarText}>{maid?.full_name?.charAt(0) || 'M'}</Text>
            )}
          </View>
          <View style={styles.maidInfo}>
            <Text style={styles.maidName} numberOfLines={1}>
              {maid?.full_name || 'Unknown Maid'}
            </Text>
            <View style={styles.maidMeta}>
              {maid?.nationality && (
                <View style={styles.metaItem}>
                  <Ionicons name="flag-outline" size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{maid.nationality}</Text>
                </View>
              )}
              {age && (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{age} yrs</Text>
                </View>
              )}
              {maid?.experience_years && (
                <View style={styles.metaItem}>
                  <Ionicons name="briefcase-outline" size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{maid.experience_years} yr exp</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => showMaidActions(favorite)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          {maid?.availability_status && (
            <View style={[styles.availabilityBadge, { backgroundColor: availabilityStyle.bg }]}>
              <View
                style={[styles.availabilityDot, { backgroundColor: availabilityStyle.text }]}
              />
              <Text style={[styles.availabilityText, { color: availabilityStyle.text }]}>
                {maid.availability_status.charAt(0).toUpperCase() +
                  maid.availability_status.slice(1)}
              </Text>
            </View>
          )}

          <Text style={styles.salaryText}>
            {formatSalary(maid?.preferred_salary_min || null, maid?.preferred_salary_max || null)}
            /month
          </Text>

          {maid?.skills && maid.skills.length > 0 && (
            <View style={styles.skillsRow}>
              {maid.skills.slice(0, 4).map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
              {maid.skills.length > 4 && (
                <Text style={styles.moreSkills}>+{maid.skills.length - 4}</Text>
              )}
            </View>
          )}

          {maid?.languages && maid.languages.length > 0 && (
            <View style={styles.languagesRow}>
              <Ionicons name="language-outline" size={14} color="#6B7280" />
              <Text style={styles.languagesText} numberOfLines={1}>
                {maid.languages.join(', ')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.savedText}>
            <Ionicons name="heart" size={12} color="#EF4444" /> Saved{' '}
            {formatRelativeTime(favorite.created_at)}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push(`/maid/${favorite.maid_id}/book`)}
            >
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                handleRemoveFavorite(favorite.maid_id, maid?.full_name || 'Unknown')
              }
            >
              <Ionicons name="heart-dislike-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (profileLoading || (favoritesLoading && !favoritesData)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Saved Maids',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/maids')}
            >
              <Ionicons name="search" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Stats Header */}
        <View style={styles.statsHeader}>
          <View style={styles.statsCard}>
            <Ionicons name="heart" size={24} color="#EF4444" />
            <Text style={styles.statsCount}>{favoritesCount}</Text>
            <Text style={styles.statsLabel}>Saved Maids</Text>
          </View>
        </View>

        {/* Favorites List */}
        <FlatList
          data={favoritesWithMaids}
          renderItem={renderFavoriteCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Saved Maids</Text>
              <Text style={styles.emptySubtitle}>
                Browse maids and tap the heart icon to save them here
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/maids')}
              >
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.browseButtonText}>Browse Maids</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </>
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
  headerButton: {
    marginRight: 8,
    padding: 8,
  },
  statsHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  statsCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  statsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  maidCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  maidAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  maidPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  maidInfo: {
    flex: 1,
  },
  maidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  maidMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreButton: {
    padding: 4,
  },
  cardBody: {
    padding: 16,
    paddingTop: 12,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  salaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  skillChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    color: '#4B5563',
  },
  moreSkills: {
    fontSize: 12,
    color: '#9CA3AF',
    alignSelf: 'center',
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languagesText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
    paddingTop: 12,
  },
  savedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
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
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
