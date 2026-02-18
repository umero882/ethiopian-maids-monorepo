/**
 * Tab Navigator Layout
 *
 * Bottom tab navigation for main app screens
 * Notifications/Alerts and Profile photo moved to header right
 */

import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadMessageCount } from '../../hooks/useMessages';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { gql, useQuery } from '@apollo/client';

// GraphQL query to fetch base profile by email
const GET_BASE_PROFILE = gql`
  query GetBaseProfile($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      full_name
      email
      user_type
      avatar_url
    }
  }
`;

// Separate queries for each profile type by user_id
const GET_MAID_PROFILE_PHOTO = gql`
  query GetMaidProfilePhoto($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      profile_photo_url
    }
  }
`;

const GET_SPONSOR_PROFILE_PHOTO = gql`
  query GetSponsorProfilePhoto($userId: String!) {
    sponsor_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      avatar_url
    }
  }
`;

const GET_AGENCY_PROFILE_PHOTO = gql`
  query GetAgencyProfilePhoto($userId: String!) {
    agency_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      logo_url
    }
  }
`;

// Header right component with notifications and profile photo
const HeaderRight = () => {
  const { user, userType } = useAuth();
  const { count: notificationCount } = useUnreadNotificationCount();

  // Step 1: Fetch base profile to get user ID and type
  const { data: baseProfileData } = useQuery(GET_BASE_PROFILE, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    fetchPolicy: 'cache-and-network',
    onError: (err) => {
      console.error('[HeaderRight] Base profile error:', err.message);
    },
  });

  const baseProfile = baseProfileData?.profiles?.[0];
  const profileId = baseProfile?.id;
  const effectiveUserType = baseProfile?.user_type || userType;

  // Step 2: Fetch specific profile type based on user_type
  const { data: maidData } = useQuery(GET_MAID_PROFILE_PHOTO, {
    variables: { userId: profileId },
    skip: !profileId || effectiveUserType !== 'maid',
  });

  const { data: sponsorData } = useQuery(GET_SPONSOR_PROFILE_PHOTO, {
    variables: { userId: profileId },
    skip: !profileId || effectiveUserType !== 'sponsor',
  });

  const { data: agencyData } = useQuery(GET_AGENCY_PROFILE_PHOTO, {
    variables: { userId: profileId },
    skip: !profileId || effectiveUserType !== 'agency',
  });

  // Get photo and name based on which profile exists
  let userPhoto: string | null = null;
  let userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // Use base profile as default
  if (baseProfile) {
    userName = baseProfile.full_name || userName;
    userPhoto = baseProfile.avatar_url;
  }

  // Check specific profile type data
  if (maidData?.maid_profiles?.[0]) {
    const maidProfile = maidData.maid_profiles[0];
    userPhoto = maidProfile.profile_photo_url || userPhoto;
    userName = maidProfile.full_name || userName;
  } else if (sponsorData?.sponsor_profiles?.[0]) {
    const sponsorProfile = sponsorData.sponsor_profiles[0];
    userPhoto = sponsorProfile.avatar_url || userPhoto;
    userName = sponsorProfile.full_name || userName;
  } else if (agencyData?.agency_profiles?.[0]) {
    const agencyProfile = agencyData.agency_profiles[0];
    userPhoto = agencyProfile.logo_url || userPhoto;
    userName = agencyProfile.full_name || userName;
  }

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.headerRightContainer}>
      {/* Notifications Button */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => router.push('/notifications')}
        activeOpacity={0.7}
        delayPressIn={0}
      >
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {/* Notification badge - shows unread count */}
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Profile Photo Button */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => router.push('/profile')}
        activeOpacity={0.7}
        delayPressIn={0}
      >
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profileInitials}>{getInitials(userName)}</Text>
          </View>
        )}
        {/* Online status indicator */}
        <View style={styles.onlineIndicator} />
      </TouchableOpacity>
    </View>
  );
};

// Messages tab icon with unread badge (WhatsApp style)
const MessagesTabIcon = ({ color, size }: { color: string; size: number }) => {
  const { count } = useUnreadMessageCount();

  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name="chatbubble-outline" size={size} color={color} />
      {count > 0 && (
        <View style={styles.messageBadge}>
          <Text style={styles.messageBadgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: '#1E40AF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="maids"
        options={{
          title: 'Maids',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessagesTabIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          // Hide from tab bar but keep the screen accessible
          href: null,
          title: 'Alerts',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 12,
  },
  headerButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Messages tab icon with badge (WhatsApp style)
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: -6,
    right: -12,
    backgroundColor: '#25D366', // WhatsApp green
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  profileButton: {
    position: 'relative',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
});
