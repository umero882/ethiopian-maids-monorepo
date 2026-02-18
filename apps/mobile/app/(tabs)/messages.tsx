/**
 * Messages Screen
 *
 * Modern messaging interface with online status, unread counts,
 * and real-time updates via GraphQL subscriptions
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useConversations, Conversation, getDisplayName, Profile, useOnlineStatus } from '../../hooks/useMessages';
import {
  usePendingSentInterests,
  usePendingReceivedInterests,
  PendingInterestWithProfile,
  ReceivedInterestWithProfile,
  useCancelInterest,
  useRespondToInterest,
  useCreateConversation,
} from '../../hooks/useInterests';
import { router } from 'expo-router';
import { useToast } from '../../context/ToastContext';

// Import notification utilities
import {
  notifyInterestAccepted,
  playReceivedMessageHaptic,
} from '../../utils/messageNotifications';

// User type options for starting new conversations
const USER_TYPE_OPTIONS = [
  { type: 'sponsor', label: 'Sponsors', icon: 'people-outline' as const, description: 'Browse and connect with sponsors' },
  { type: 'agency', label: 'Agencies', icon: 'business-outline' as const, description: 'Browse and connect with agencies' },
  { type: 'maid', label: 'Maids', icon: 'person-outline' as const, description: 'Browse and connect with maids' },
];

// Check if user is online (using is_online field or active within last 5 minutes)
const isUserOnline = (profile?: { is_online?: boolean; last_activity_at?: string } | null): boolean => {
  if (!profile) return false;
  // First check the is_online field
  if (profile.is_online === true) return true;
  // Fallback to last_activity_at
  if (profile.last_activity_at) {
    const lastSeenDate = new Date(profile.last_activity_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffMinutes < 5;
  }
  return false;
};

// Get last seen text for display
const getLastSeenText = (profile?: { is_online?: boolean; last_activity_at?: string } | null): string => {
  if (!profile) return '';
  if (isUserOnline(profile)) return 'Online';
  if (profile.last_activity_at) {
    const lastSeenDate = new Date(profile.last_activity_at);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return '';
};

// Avatar colors for users without photos
const AVATAR_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
];

const getAvatarColor = (name: string): string => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export default function MessagesScreen() {
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserTypeMenu, setShowUserTypeMenu] = useState(false);
  const { showMessage, showSuccess, showError, showInfo } = useToast();

  // Track user's online status - updates is_online and last_activity_at
  useOnlineStatus();

  // Get current user's type to filter out from options
  const currentUserType = user?.user_type || 'maid';

  // Filter options to show only other user types (can't message yourself)
  const availableUserTypes = USER_TYPE_OPTIONS.filter(
    (opt) => opt.type !== currentUserType
  );

  const handleUserTypeSelect = (type: string) => {
    setShowUserTypeMenu(false);
    router.push(`/browse/${type}`);
  };

  // Toast callback for new messages
  const handleNewMessage = useCallback((info: { senderName?: string; messagePreview?: string }) => {
    showMessage({
      title: info.senderName || 'New Message',
      message: info.messagePreview || 'You have a new message',
      duration: 4000,
      onPress: () => {
        // Stay on messages screen, user is already here
      },
    });
  }, [showMessage]);

  const {
    conversations,
    loading,
    error,
    refetch,
    getOtherParticipant,
  } = useConversations({ enableSubscription: true, onNewMessage: handleNewMessage });

  // Pending sent interests (interests I sent)
  const {
    pendingInterests,
    loading: pendingLoading,
    refetch: refetchPending,
  } = usePendingSentInterests();
  const { cancelInterest, loading: cancelling } = useCancelInterest();

  // Received interests (interests others sent to me)
  const {
    receivedInterests,
    count: receivedCount,
    loading: receivedLoading,
    refetch: refetchReceived,
  } = usePendingReceivedInterests();
  const { acceptInterest, rejectInterest, loading: responding } = useRespondToInterest();
  const { createConversation } = useCreateConversation();

  const handleCancelInterest = useCallback((interest: PendingInterestWithProfile) => {
    Alert.alert(
      'Cancel Interest',
      `Cancel your interest request to ${interest.recipient_profile?.full_name || 'this user'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelInterest(interest.id);
              showInfo('Interest Cancelled', 'Your interest request has been cancelled');
              refetchPending();
            } catch (err: any) {
              showError('Error', err.message || 'Failed to cancel interest');
              Alert.alert('Error', err.message || 'Failed to cancel interest');
            }
          },
        },
      ]
    );
  }, [cancelInterest, refetchPending, showInfo, showError]);

  // Accept interest and start conversation
  const handleAcceptInterest = useCallback(async (interest: ReceivedInterestWithProfile) => {
    try {
      await acceptInterest(interest.id);
      // Play success haptic after accepting
      notifyInterestAccepted();

      // Create conversation after accepting
      const conversation = await createConversation(
        interest.sender_id,
        interest.sender_type
      );

      // Show success toast
      showSuccess(
        'Interest Accepted!',
        `You can now chat with ${interest.sender_profile?.full_name || 'this user'}`
      );

      Alert.alert(
        'Interest Accepted!',
        `You can now chat with ${interest.sender_profile?.full_name || 'this user'}`,
        [
          {
            text: 'Start Chat',
            onPress: () => {
              if (conversation?.id) {
                router.push(`/chat/${conversation.id}`);
              }
            },
          },
          { text: 'Later', style: 'cancel' },
        ]
      );

      refetchReceived();
      refetch();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to accept interest');
      Alert.alert('Error', err.message || 'Failed to accept interest');
    }
  }, [acceptInterest, createConversation, refetchReceived, refetch, showSuccess, showError]);

  // Reject interest
  const handleRejectInterest = useCallback((interest: ReceivedInterestWithProfile) => {
    Alert.alert(
      'Reject Interest',
      `Are you sure you want to reject the interest from ${interest.sender_profile?.full_name || 'this user'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectInterest(interest.id);
              // Light haptic for rejection
              playReceivedMessageHaptic();
              showInfo('Interest Rejected', 'The interest request has been rejected');
              refetchReceived();
            } catch (err: any) {
              showError('Error', err.message || 'Failed to reject interest');
              Alert.alert('Error', err.message || 'Failed to reject interest');
            }
          },
        },
      ]
    );
  }, [rejectInterest, refetchReceived, showInfo, showError]);

  // Calculate total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((total, conv) => {
      const participant = getOtherParticipant(conv);
      return total + (participant.unreadCount || 0);
    }, 0);
  }, [conversations, getOtherParticipant]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const participant = getOtherParticipant(conv);
      const name = getDisplayName(participant.profile as any).toLowerCase();
      return name.includes(query) || conv.last_message_preview?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, getOtherParticipant]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPending(), refetchReceived()]);
    setRefreshing(false);
  }, [refetch, refetchPending, refetchReceived]);

  const handleConversationPress = useCallback((conversation: Conversation) => {
    router.push(`/chat/${conversation.id}`);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderAvatar = (
    profile: Profile | null | undefined,
    isOnline?: boolean,
    participantId?: string
  ) => {
    const displayName = getDisplayName(profile, participantId);
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
    const bgColor = getAvatarColor(displayName);

    return (
      <View style={styles.avatarContainer}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: bgColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>
    );
  };

  // Render a pending interest card
  const renderPendingInterest = (interest: PendingInterestWithProfile) => {
    const profile = interest.recipient_profile;
    const displayName = profile?.full_name || profile?.email || 'Unknown User';
    const isOnline = profile?.is_online || false;
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
    const bgColor = getAvatarColor(displayName);

    return (
      <View key={interest.id} style={styles.pendingCard}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: bgColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <Text style={styles.time}>{formatDate(interest.created_at)}</Text>
          </View>

          <View style={styles.messageRow}>
            <Text style={styles.pendingMessage} numberOfLines={1}>
              {interest.message || 'Interest sent - waiting for response'}
            </Text>
          </View>

          <View style={styles.pendingBadgeRow}>
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={12} color="#D97706" />
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
            {profile?.user_type && (
              <View
                style={[
                  styles.typeBadge,
                  profile.user_type === 'maid'
                    ? styles.typeBadgeMaid
                    : profile.user_type === 'agency'
                    ? styles.typeBadgeAgency
                    : styles.typeBadgeSponsor,
                ]}
              >
                <Ionicons
                  name={
                    profile.user_type === 'maid'
                      ? 'person'
                      : profile.user_type === 'agency'
                      ? 'business'
                      : 'briefcase'
                  }
                  size={10}
                  color={
                    profile.user_type === 'maid'
                      ? '#7C3AED'
                      : profile.user_type === 'agency'
                      ? '#059669'
                      : '#0891B2'
                  }
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    profile.user_type === 'maid'
                      ? styles.typeBadgeTextMaid
                      : profile.user_type === 'agency'
                      ? styles.typeBadgeTextAgency
                      : styles.typeBadgeTextSponsor,
                  ]}
                >
                  {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.cancelInterestButton}
          onPress={() => handleCancelInterest(interest)}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render a received interest card (with accept/reject buttons)
  const renderReceivedInterest = (interest: ReceivedInterestWithProfile) => {
    const profile = interest.sender_profile;
    const displayName = profile?.full_name || profile?.email || 'Unknown User';
    const isOnline = profile?.is_online || false;
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
    const bgColor = getAvatarColor(displayName);

    return (
      <View key={interest.id} style={styles.receivedCard}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: bgColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              {isOnline && (
                <View style={styles.onlineTextBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>{formatDate(interest.created_at)}</Text>
          </View>

          <View style={styles.messageRow}>
            <Text style={styles.receivedMessage} numberOfLines={2}>
              {interest.message || 'Wants to connect with you!'}
            </Text>
          </View>

          <View style={styles.receivedBadgeRow}>
            <View style={styles.receivedBadge}>
              <Ionicons name="heart" size={12} color="#EC4899" />
              <Text style={styles.receivedBadgeText}>Interest Request</Text>
            </View>
            {profile?.user_type && (
              <View
                style={[
                  styles.typeBadge,
                  profile.user_type === 'maid'
                    ? styles.typeBadgeMaid
                    : profile.user_type === 'agency'
                    ? styles.typeBadgeAgency
                    : styles.typeBadgeSponsor,
                ]}
              >
                <Ionicons
                  name={
                    profile.user_type === 'maid'
                      ? 'person'
                      : profile.user_type === 'agency'
                      ? 'business'
                      : 'briefcase'
                  }
                  size={10}
                  color={
                    profile.user_type === 'maid'
                      ? '#7C3AED'
                      : profile.user_type === 'agency'
                      ? '#059669'
                      : '#0891B2'
                  }
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    profile.user_type === 'maid'
                      ? styles.typeBadgeTextMaid
                      : profile.user_type === 'agency'
                      ? styles.typeBadgeTextAgency
                      : styles.typeBadgeTextSponsor,
                  ]}
                >
                  {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Accept/Reject Actions */}
        <View style={styles.interestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptInterest(interest)}
            disabled={responding}
          >
            {responding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectInterest(interest)}
            disabled={responding}
          >
            <Ionicons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.center}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles" size={48} color="#1E40AF" />
          </View>
          <Text style={styles.emptyTitle}>Sign in to chat</Text>
          <Text style={styles.emptySubtext}>
            Connect with maids and agencies through secure messaging
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Messages</Text>
              {totalUnread > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Text>
                </View>
              )}
              {receivedCount > 0 && (
                <View style={styles.interestBadge}>
                  <Ionicons name="heart" size={12} color="#fff" />
                  <Text style={styles.interestBadgeText}>{receivedCount}</Text>
                </View>
              )}
            </View>
            {(totalUnread > 0 || receivedCount > 0) && (
              <Text style={styles.headerSubtitle}>
                {totalUnread > 0 && `${totalUnread} unread`}
                {totalUnread > 0 && receivedCount > 0 && ' • '}
                {receivedCount > 0 && `${receivedCount} interest${receivedCount > 1 ? 's' : ''}`}
              </Text>
            )}
          </View>
          {/* New Chat Button */}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => setShowUserTypeMenu(true)}
          >
            <Ionicons name="add" size={24} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="cloud-offline" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorSubtext}>
            Unable to load your messages. Please check your connection.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => refetch()}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1E40AF']}
              tintColor="#1E40AF"
            />
          }
          ListHeaderComponent={
            (receivedInterests.length > 0 || pendingInterests.length > 0) ? (
              <View>
                {/* Received Interests Section (requires action) */}
                {receivedInterests.length > 0 && (
                  <View style={styles.receivedSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="heart" size={18} color="#EC4899" />
                      <Text style={styles.receivedSectionTitle}>Interest Requests</Text>
                      <View style={styles.receivedCountBadge}>
                        <Text style={styles.receivedCountText}>{receivedInterests.length}</Text>
                      </View>
                    </View>
                    {receivedInterests.map(renderReceivedInterest)}
                  </View>
                )}

                {/* Pending Sent Interests Section */}
                {pendingInterests.length > 0 && (
                  <View style={styles.pendingSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="time-outline" size={18} color="#D97706" />
                      <Text style={styles.sectionTitle}>Sent Interests</Text>
                      <View style={styles.pendingCountBadge}>
                        <Text style={styles.pendingCountText}>{pendingInterests.length}</Text>
                      </View>
                    </View>
                    {pendingInterests.map(renderPendingInterest)}
                  </View>
                )}

                {/* Divider before conversations */}
                {filteredConversations.length > 0 && (receivedInterests.length > 0 || pendingInterests.length > 0) && (
                  <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Conversations</Text>
                    <View style={styles.dividerLine} />
                  </View>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const otherParticipant = getOtherParticipant(item);
            const hasUnread = (otherParticipant.unreadCount || 0) > 0;
            const online = isUserOnline(otherParticipant.profile);
            const lastSeenText = getLastSeenText(otherParticipant.profile);
            const displayName = getDisplayName(otherParticipant.profile, otherParticipant.id);

            return (
              <TouchableOpacity
                style={[styles.card, hasUnread && styles.cardUnread]}
                onPress={() => handleConversationPress(item)}
                activeOpacity={0.7}
              >
                {renderAvatar(otherParticipant.profile, online, otherParticipant.id)}

                <View style={styles.content}>
                  <View style={styles.cardHeader}>
                    <View style={styles.nameContainer}>
                      <Text
                        style={[styles.name, hasUnread && styles.nameUnread]}
                        numberOfLines={1}
                      >
                        {displayName}
                      </Text>
                      {online ? (
                        <View style={styles.onlineTextBadge}>
                          <View style={styles.onlineDot} />
                          <Text style={styles.onlineText}>Online</Text>
                        </View>
                      ) : lastSeenText ? (
                        <View style={styles.lastSeenBadge}>
                          <Text style={styles.lastSeenText}>{lastSeenText}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                      {formatDate(item.last_message_at)}
                    </Text>
                  </View>

                  <View style={styles.messageRow}>
                    <Text
                      style={[styles.preview, hasUnread && styles.previewUnread]}
                      numberOfLines={1}
                    >
                      {item.last_message_preview || 'Start a conversation...'}
                    </Text>
                    {hasUnread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {otherParticipant.unreadCount > 99
                            ? '99+'
                            : otherParticipant.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* User type badge */}
                  <View style={styles.typeBadgeContainer}>
                    <View
                      style={[
                        styles.typeBadge,
                        otherParticipant.type === 'maid'
                          ? styles.typeBadgeMaid
                          : otherParticipant.type === 'agency'
                          ? styles.typeBadgeAgency
                          : styles.typeBadgeSponsor,
                      ]}
                    >
                      <Ionicons
                        name={
                          otherParticipant.type === 'maid'
                            ? 'person'
                            : otherParticipant.type === 'agency'
                            ? 'business'
                            : 'briefcase'
                        }
                        size={10}
                        color={
                          otherParticipant.type === 'maid'
                            ? '#7C3AED'
                            : otherParticipant.type === 'agency'
                            ? '#059669'
                            : '#0891B2'
                        }
                      />
                      <Text
                        style={[
                          styles.typeBadgeText,
                          otherParticipant.type === 'maid'
                            ? styles.typeBadgeTextMaid
                            : otherParticipant.type === 'agency'
                            ? styles.typeBadgeTextAgency
                            : styles.typeBadgeTextSponsor,
                        ]}
                      >
                        {otherParticipant.type === 'maid'
                          ? 'Maid'
                          : otherParticipant.type === 'agency'
                          ? 'Agency'
                          : 'Sponsor'}
                      </Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={[
            styles.list,
            filteredConversations.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name={searchQuery ? 'search' : 'chatbubbles'}
                  size={48}
                  color="#1E40AF"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No results found' : 'No conversations yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? `No conversations match "${searchQuery}"`
                  : 'Browse maids and start a conversation to connect'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Ionicons name="search" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Browse Maids</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* User Type Selection Modal */}
      <Modal
        visible={showUserTypeMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserTypeMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowUserTypeMenu(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start New Chat</Text>
              <Text style={styles.modalSubtitle}>Select who you want to connect with</Text>
            </View>

            {availableUserTypes.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.userTypeOption}
                onPress={() => handleUserTypeSelect(option.type)}
              >
                <View style={styles.userTypeIconContainer}>
                  <Ionicons name={option.icon} size={24} color="#1E40AF" />
                </View>
                <View style={styles.userTypeInfo}>
                  <Text style={styles.userTypeLabel}>Browse {option.label}</Text>
                  <Text style={styles.userTypeDescription}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowUserTypeMenu(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E40AF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  list: {
    padding: 16,
    paddingTop: 20,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardUnread: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  nameUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  onlineTextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  lastSeenBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lastSeenText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  timeUnread: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  preview: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    lineHeight: 20,
  },
  previewUnread: {
    color: '#334155',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#25D366', // WhatsApp green
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadgeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  typeBadgeMaid: {
    backgroundColor: '#F3E8FF',
  },
  typeBadgeSponsor: {
    backgroundColor: '#ECFEFF',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  typeBadgeTextMaid: {
    color: '#7C3AED',
  },
  typeBadgeTextSponsor: {
    color: '#0891B2',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 280,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userTypeInfo: {
    flex: 1,
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  userTypeDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  modalCancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  // Pending Interests Styles
  pendingSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  pendingCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingMessage: {
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
    flex: 1,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  cancelInterestButton: {
    padding: 4,
    marginLeft: 8,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBadgeAgency: {
    backgroundColor: '#D1FAE5',
  },
  typeBadgeTextAgency: {
    color: '#059669',
  },
  // Received Interests Styles
  receivedSection: {
    marginBottom: 16,
  },
  receivedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
  },
  receivedCountBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  receivedCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EC4899',
  },
  receivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  receivedMessage: {
    fontSize: 14,
    color: '#9D174D',
    flex: 1,
  },
  receivedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  receivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  receivedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EC4899',
  },
  interestActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC4899',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  interestBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
