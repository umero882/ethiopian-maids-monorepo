/**
 * useMessages Hook
 *
 * Real-time messaging using GraphQL subscriptions.
 * Provides conversation list, messages, and send functionality.
 * Includes haptic and sound notifications for new messages.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { useAuth } from './useAuth';
import {
  notifyNewMessage,
  notifySentMessage,
  preloadSounds,
  cleanup as cleanupNotifications,
} from '../utils/messageNotifications';

// Module-level tracker for when we send messages (shared between hooks)
// This prevents showing toast notifications for our own sent messages
let lastSentMessageTime = 0;
export const markMessageAsSent = () => {
  lastSentMessageTime = Date.now();
};
export const wasRecentlySentByMe = (messageTime: number): boolean => {
  const timeSinceWeSent = messageTime - lastSentMessageTime;
  return timeSinceWeSent >= 0 && timeSinceWeSent < 5000; // Within 5 seconds
};

// GraphQL Queries - Synced with web MaidMessagesPage
const GET_CONVERSATIONS = gql`
  query GetConversations($userId: String!) {
    conversations(
      where: {
        _or: [
          { participant1_id: { _eq: $userId } }
          { participant2_id: { _eq: $userId } }
        ]
        status: { _eq: "active" }
      }
      order_by: { last_message_at: desc_nulls_last }
    ) {
      id
      participant1_id
      participant1_type
      participant1_unread_count
      participant2_id
      participant2_type
      participant2_unread_count
      last_message_preview
      last_message_at
      status
      created_at
      updated_at
    }
  }
`;

// Query to get unread message counts per conversation
const GET_UNREAD_COUNTS_PER_CONVERSATION = gql`
  query GetUnreadCountsPerConversation($userId: String!) {
    messages(
      where: {
        recipient_id: { _eq: $userId }
        is_read: { _eq: false }
      }
    ) {
      id
      conversation_id
    }
  }
`;

// Query to get profiles by IDs for conversation display
// Also fetches full_name from user-type specific tables
// Note: maid_profiles uses user_id as key, so we alias it as id for Apollo caching
const GET_PROFILES_BY_IDS = gql`
  query GetProfilesByIds($ids: [String!]!) {
    profiles(where: { id: { _in: $ids } }) {
      id
      full_name
      email
      avatar_url
      user_type
      is_online
      last_activity_at
    }
    sponsor_profiles(where: { id: { _in: $ids } }) {
      id
      full_name
    }
    maid_profiles(where: { user_id: { _in: $ids } }) {
      id: user_id
      user_id
      full_name
      first_name
      last_name
      profile_photo_url
    }
    agency_profiles(where: { id: { _in: $ids } }) {
      id
      full_name
      logo_url
    }
  }
`;

const GET_MESSAGES = gql`
  query GetMessages($conversationId: uuid!, $limit: Int = 50, $offset: Int = 0) {
    messages(
      where: { conversation_id: { _eq: $conversationId } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      content
      sender_id
      recipient_id
      is_read
      read_at
      created_at
    }
    messages_aggregate(where: { conversation_id: { _eq: $conversationId } }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_UNREAD_MESSAGE_COUNT = gql`
  query GetUnreadMessageCount($userId: String!) {
    messages_aggregate(
      where: {
        recipient_id: { _eq: $userId }
        is_read: { _eq: false }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// GraphQL Mutations
const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: uuid!, $content: String!, $senderId: String!, $recipientId: String!, $messagePreview: String!) {
    # Insert the message
    insert_messages_one(
      object: {
        conversation_id: $conversationId
        content: $content
        sender_id: $senderId
        recipient_id: $recipientId
        message_type: "text"
        is_read: false
      }
    ) {
      id
      content
      sender_id
      recipient_id
      is_read
      created_at
    }
    # Update conversation with last message info (moves it to top of list)
    update_conversations_by_pk(
      pk_columns: { id: $conversationId }
      _set: {
        last_message_at: "now()"
        last_message_preview: $messagePreview
      }
    ) {
      id
      last_message_at
      last_message_preview
    }
  }
`;

// Mutation to update user's online status
const UPDATE_ONLINE_STATUS = gql`
  mutation UpdateOnlineStatus($userId: String!, $isOnline: Boolean!, $lastActivityAt: timestamptz!) {
    update_profiles_by_pk(
      pk_columns: { id: $userId }
      _set: { is_online: $isOnline, last_activity_at: $lastActivityAt }
    ) {
      id
      is_online
      last_activity_at
    }
  }
`;

// Mutation to update typing status
const UPDATE_TYPING_STATUS = gql`
  mutation UpdateTypingStatus($userId: String!, $isTyping: Boolean!, $conversationId: uuid) {
    update_profiles_by_pk(
      pk_columns: { id: $userId }
      _set: {
        is_typing: $isTyping,
        typing_in_conversation_id: $conversationId
      }
    ) {
      id
      is_typing
      typing_in_conversation_id
    }
  }
`;

// Subscription to watch typing status of a user
const ON_TYPING_STATUS = gql`
  subscription OnTypingStatus($userId: String!) {
    profiles_by_pk(id: $userId) {
      id
      is_typing
      typing_in_conversation_id
    }
  }
`;

const MARK_MESSAGES_AS_READ = gql`
  mutation MarkMessagesAsRead($conversationId: uuid!, $recipientId: String!) {
    update_messages(
      where: {
        conversation_id: { _eq: $conversationId }
        recipient_id: { _eq: $recipientId }
        is_read: { _eq: false }
      }
      _set: { is_read: true, read_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

const DELETE_MESSAGE = gql`
  mutation DeleteMessage($messageId: uuid!) {
    delete_messages_by_pk(id: $messageId) {
      id
    }
  }
`;

// Mutation to create notification for message recipient
const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($data: notifications_insert_input!) {
    insert_notifications_one(object: $data) {
      id
      user_id
      title
      message
      type
      link
      related_id
      related_type
      read
      created_at
    }
  }
`;

// Query to find existing unread message notification for a specific conversation
// Uses related_id (uuid type) to store conversation_id for precise matching
const GET_EXISTING_MESSAGE_NOTIFICATION = gql`
  query GetExistingMessageNotification($userId: String!, $conversationId: uuid!) {
    notifications(
      where: {
        user_id: { _eq: $userId }
        type: { _eq: "message_received" }
        read: { _eq: false }
        related_id: { _eq: $conversationId }
        related_type: { _eq: "conversation" }
      }
      limit: 1
      order_by: { created_at: desc }
    ) {
      id
      title
      message
      created_at
    }
  }
`;

// Mutation to update notification
const UPDATE_NOTIFICATION = gql`
  mutation UpdateNotification($id: uuid!, $data: notifications_set_input!) {
    update_notifications_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      title
      message
      updated_at
    }
  }
`;

// Query to find existing conversation between two users (in either direction)
const FIND_EXISTING_CONVERSATION = gql`
  query FindExistingConversation($user1: String!, $user2: String!) {
    conversations(
      where: {
        _or: [
          { _and: [{ participant1_id: { _eq: $user1 } }, { participant2_id: { _eq: $user2 } }] }
          { _and: [{ participant1_id: { _eq: $user2 } }, { participant2_id: { _eq: $user1 } }] }
        ]
      }
      limit: 1
    ) {
      id
      participant1_id
      participant2_id
      status
    }
  }
`;

const CREATE_CONVERSATION = gql`
  mutation CreateConversation(
    $participant1Id: String!
    $participant1Type: String!
    $participant2Id: String!
    $participant2Type: String!
  ) {
    insert_conversations_one(
      object: {
        participant1_id: $participant1Id
        participant1_type: $participant1Type
        participant2_id: $participant2Id
        participant2_type: $participant2Type
        status: "active"
      }
      on_conflict: {
        constraint: unique_conversation
        update_columns: [status]
      }
    ) {
      id
      participant1_id
      participant2_id
    }
  }
`;

// GraphQL Subscriptions
const ON_NEW_MESSAGE = gql`
  subscription OnNewMessage($conversationId: uuid!) {
    messages(
      where: { conversation_id: { _eq: $conversationId } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      content
      sender_id
      recipient_id
      is_read
      created_at
    }
  }
`;

const ON_CONVERSATION_UPDATE = gql`
  subscription OnConversationUpdate($userId: String!) {
    conversations(
      where: {
        _or: [
          { participant1_id: { _eq: $userId } }
          { participant2_id: { _eq: $userId } }
        ]
      }
      order_by: { last_message_at: desc_nulls_last }
      limit: 1
    ) {
      id
      participant1_id
      participant2_id
      participant1_type
      participant2_type
      last_message_preview
      last_message_at
      participant1_unread_count
      participant2_unread_count
    }
  }
`;

// Profile interface for participant display
export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  user_type?: string;
  is_online?: boolean;
  last_activity_at?: string;
}

// Helper function to get display name from profile or participant ID
export function getDisplayName(profile?: Profile | null, participantId?: string | null): string {
  // Priority 1: profile full_name
  if (profile?.full_name && profile.full_name.trim()) {
    return profile.full_name;
  }

  // Priority 2: email - extract name from email (before @)
  if (profile?.email && profile.email.trim()) {
    const emailName = profile.email.split('@')[0];
    // Capitalize first letter and replace dots/underscores with spaces
    const formattedName = emailName
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return formattedName;
  }

  // Priority 3: User type badge (more user-friendly than UUID)
  if (profile?.user_type) {
    const userType = profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1);
    return userType;
  }

  // Priority 4: Generic fallback (better UX than showing UUID)
  if (!participantId) return 'Unknown User';

  // Only show truncated ID as last resort (should rarely happen now)
  return 'User';
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant1_type?: string;
  participant1_unread_count?: number;
  participant2_id: string;
  participant2_type?: string;
  participant2_unread_count?: number;
  last_message_preview?: string;
  last_message_at?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface NewMessageCallback {
  senderName?: string;
  messagePreview?: string;
}

interface UseConversationsOptions {
  enableSubscription?: boolean;
  onNewMessage?: (info: NewMessageCallback) => void;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { enableSubscription = true, onNewMessage } = options;
  const { user } = useAuth();

  // Use Firebase UID for queries - conversations are stored with Firebase UIDs
  // Fall back to profile_id only if uid is not available
  const userId = user?.uid || (user as any)?.profile_id;

  // Debug logging for user ID
  useEffect(() => {
    console.log('[useConversations] User debug:', {
      firebaseUid: user?.uid,
      profileId: (user as any)?.profile_id,
      resolvedUserId: userId,
      email: user?.email,
      userType: (user as any)?.user_type,
    });
  }, [user, userId]);

  // Track last message time to detect new messages
  const lastMessageTimeRef = useRef<string | null>(null);

  // Preload notification sounds on mount
  useEffect(() => {
    preloadSounds();
    return () => {
      cleanupNotifications();
    };
  }, []);

  const {
    data: conversationsData,
    loading,
    error,
    refetch,
  } = useQuery(GET_CONVERSATIONS, {
    variables: { userId: userId || '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const conversations: Conversation[] = conversationsData?.conversations || [];

  // Debug log conversations
  useEffect(() => {
    console.log('[useConversations] Query result:', {
      userId,
      count: conversations.length,
      loading,
      error: error?.message,
    });
    if (conversations.length > 0) {
      console.log('[useConversations] First conversation:', {
        id: conversations[0].id,
        p1: conversations[0].participant1_id,
        p2: conversations[0].participant2_id,
      });
    }
  }, [conversations, loading, error, userId]);

  // Collect all participant IDs to fetch profiles
  const participantIds = conversations.reduce((ids: string[], conv) => {
    if (conv.participant1_id && !ids.includes(conv.participant1_id)) {
      ids.push(conv.participant1_id);
    }
    if (conv.participant2_id && !ids.includes(conv.participant2_id)) {
      ids.push(conv.participant2_id);
    }
    return ids;
  }, []);

  // Fetch profiles for all participants
  const { data: profilesData } = useQuery(GET_PROFILES_BY_IDS, {
    variables: { ids: participantIds },
    skip: participantIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch unread message counts per conversation - with polling for updates
  const { data: unreadData, refetch: refetchUnread } = useQuery(GET_UNREAD_COUNTS_PER_CONVERSATION, {
    variables: { userId: userId || '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000, // Poll every 5 seconds for updates
  });

  // Create a map of profiles by ID, merging names from user-type specific tables
  const profilesMap = useCallback(() => {
    const map: Record<string, Profile> = {};

    // First, add base profiles
    if (profilesData?.profiles) {
      profilesData.profiles.forEach((profile: Profile) => {
        map[profile.id] = { ...profile };
      });
    }

    // Merge sponsor full_names from sponsor_profiles table (uses String ID matching profiles.id)
    if (profilesData?.sponsor_profiles) {
      profilesData.sponsor_profiles.forEach((sponsor: { id: string; full_name?: string }) => {
        // Create base entry if doesn't exist
        if (!map[sponsor.id]) {
          map[sponsor.id] = { id: sponsor.id, user_type: 'sponsor' };
        }
        if (sponsor.full_name) {
          map[sponsor.id].full_name = sponsor.full_name;
        }
      });
    }

    // Merge maid names and photos (uses user_id as key)
    // Priority: full_name > first_name + last_name
    if (profilesData?.maid_profiles) {
      profilesData.maid_profiles.forEach((maid: { user_id: string; full_name?: string; first_name?: string; last_name?: string; profile_photo_url?: string }) => {
        // Create base entry if doesn't exist
        if (!map[maid.user_id]) {
          map[maid.user_id] = { id: maid.user_id, user_type: 'maid' };
        }
        // Try full_name first
        if (maid.full_name) {
          map[maid.user_id].full_name = maid.full_name;
        }
        // Fall back to first_name + last_name
        else if (maid.first_name || maid.last_name) {
          const parts = [maid.first_name, maid.last_name].filter(Boolean);
          if (parts.length > 0) {
            map[maid.user_id].full_name = parts.join(' ');
          }
        }
        // Merge profile photo URL into avatar_url
        if (maid.profile_photo_url) {
          map[maid.user_id].avatar_url = maid.profile_photo_url;
        }
      });
    }

    // Merge agency names and logo
    if (profilesData?.agency_profiles) {
      profilesData.agency_profiles.forEach((agency: { id: string; full_name?: string; logo_url?: string }) => {
        // Create base entry if doesn't exist
        if (!map[agency.id]) {
          map[agency.id] = { id: agency.id, user_type: 'agency' };
        }
        if (agency.full_name) {
          map[agency.id].full_name = agency.full_name;
        }
        // Merge logo_url into avatar_url
        if (agency.logo_url) {
          map[agency.id].avatar_url = agency.logo_url;
        }
      });
    }

    return map;
  }, [profilesData, participantIds]);

  // Create a map of unread counts per conversation
  const unreadCountsMap = useCallback(() => {
    const map: Record<string, number> = {};
    if (unreadData?.messages) {
      unreadData.messages.forEach((msg: { id: string; conversation_id: string }) => {
        map[msg.conversation_id] = (map[msg.conversation_id] || 0) + 1;
      });
    }
    return map;
  }, [unreadData]);

  // Subscribe to conversation updates with notification
  useSubscription(ON_CONVERSATION_UPDATE, {
    variables: { userId: userId || '' },
    skip: !userId || !enableSubscription,
    onData: ({ data }) => {
      const newConversation = data?.data?.conversations?.[0];
      if (newConversation?.last_message_at) {
        // Check if this is a new message (not the initial load)
        if (lastMessageTimeRef.current &&
            newConversation.last_message_at !== lastMessageTimeRef.current) {

          // Check if this message was sent by us (within last 5 seconds)
          const messageTime = new Date(newConversation.last_message_at).getTime();
          const wasSentByMe = wasRecentlySentByMe(messageTime);

          // Only notify if message was NOT sent by us
          if (!wasSentByMe) {
            // New message received - notify!
            notifyNewMessage();

            // Find sender info for toast
            const profiles = profilesMap();
            const isParticipant1 = newConversation.participant1_id === userId;
            const senderId = isParticipant1
              ? newConversation.participant2_id
              : newConversation.participant1_id;
            const senderType = isParticipant1
              ? newConversation.participant2_type
              : newConversation.participant1_type;
            const senderProfile = profiles[senderId];

            // Get sender name with fallback to user type
            let senderName = getDisplayName(senderProfile, senderId);
            if (senderName === 'User' || senderName === 'Unknown User') {
              // Fallback to capitalized user type
              if (senderType) {
                senderName = senderType.charAt(0).toUpperCase() + senderType.slice(1);
              } else {
                senderName = 'Someone';
              }
            }

            // Call toast callback if provided
            if (onNewMessage) {
              onNewMessage({
                senderName,
                messagePreview: newConversation.last_message_preview || 'New message',
              });
            }
          }
        }
        lastMessageTimeRef.current = newConversation.last_message_at;
      }
      refetch();
      refetchUnread(); // Immediately refetch unread counts
    },
  });

  // Get the other participant info for display
  const getOtherParticipant = useCallback((conversation: Conversation) => {
    const profiles = profilesMap();
    const unreadCounts = unreadCountsMap();
    // Get unread count from the separate query (polls every 3 seconds)
    const unreadCount = unreadCounts[conversation.id] || 0;

    if (conversation.participant1_id === userId) {
      // I am participant1, return participant2 info with my unread count
      return {
        id: conversation.participant2_id,
        type: conversation.participant2_type || 'user',
        unreadCount,
        profile: profiles[conversation.participant2_id] || null,
      };
    }
    // I am participant2, return participant1 info with my unread count
    return {
      id: conversation.participant1_id,
      type: conversation.participant1_type || 'user',
      unreadCount,
      profile: profiles[conversation.participant1_id] || null,
    };
  }, [userId, profilesMap, unreadCountsMap]);

  return {
    conversations,
    loading,
    error,
    refetch,
    getOtherParticipant,
    userId, // Export for use in other hooks
  };
}

interface UseMessagesOptions {
  conversationId: string;
  limit?: number;
  enableSubscription?: boolean;
  onNewMessage?: (message: Message) => void;
}

export function useMessages(options: UseMessagesOptions) {
  const { conversationId, limit = 50, enableSubscription = true, onNewMessage } = options;
  const { user } = useAuth();

  // Use Firebase UID for queries - messages are stored with Firebase UIDs
  const userId = user?.uid || (user as any)?.profile_id;

  // Track last message ID to detect new messages
  const lastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const {
    data: messagesData,
    loading,
    error,
    refetch,
    fetchMore,
  } = useQuery(GET_MESSAGES, {
    variables: { conversationId, limit, offset: 0 },
    skip: !conversationId,
    fetchPolicy: 'cache-and-network',
  });

  // Subscribe to new messages with notification
  useSubscription(ON_NEW_MESSAGE, {
    variables: { conversationId },
    skip: !conversationId || !enableSubscription,
    onData: ({ data }) => {
      const newMessage = data?.data?.messages?.[0];
      if (newMessage && !isInitialLoadRef.current) {
        // Only notify for messages from other users
        if (newMessage.sender_id !== userId &&
            newMessage.id !== lastMessageIdRef.current) {
          notifyNewMessage();

          // Call callback if provided
          if (onNewMessage) {
            onNewMessage(newMessage);
          }
        }
        lastMessageIdRef.current = newMessage.id;
      }
      refetch();
    },
  });

  // Mark initial load complete after first data
  useEffect(() => {
    if (messagesData?.messages?.length > 0 && isInitialLoadRef.current) {
      lastMessageIdRef.current = messagesData.messages[0]?.id || null;
      isInitialLoadRef.current = false;
    }
  }, [messagesData]);

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markAsReadMutation] = useMutation(MARK_MESSAGES_AS_READ);
  const [deleteMessageMutation] = useMutation(DELETE_MESSAGE);
  const [createNotificationMutation] = useMutation(CREATE_NOTIFICATION);
  const [updateNotificationMutation] = useMutation(UPDATE_NOTIFICATION);

  const messages: Message[] = messagesData?.messages || [];
  const totalCount = messagesData?.messages_aggregate?.aggregate?.count || 0;

  // Debug: Log when messages change
  useEffect(() => {
    if (messages.length > 0) {
      console.log('[useMessages] Messages loaded:', messages.length, 'total');
      // Log last 3 messages for debugging
      messages.slice(0, 3).forEach((msg, i) => {
        const isVoice = msg.content?.includes('"type":"voice"');
        console.log(`[useMessages] Message ${i}:`, {
          id: msg.id?.substring(0, 8),
          sender: msg.sender_id?.substring(0, 8),
          isVoice,
          contentPreview: msg.content?.substring(0, 50),
        });
      });
    }
  }, [messages.length]);

  const sendMessage = useCallback(async (content: string, recipientId: string, senderName?: string) => {
    if (!userId || !conversationId) return null;

    try {
      // Mark that we're sending a message (to prevent toast for our own message)
      markMessageAsSent();

      // Create message preview (truncate to 100 chars)
      const messagePreview = content.length > 100
        ? content.substring(0, 100) + '...'
        : content;

      const result = await sendMessageMutation({
        variables: {
          conversationId,
          content,
          senderId: userId,
          recipientId,
          messagePreview,
        },
      });

      // Haptic feedback for sent message
      if (result.data?.insert_messages_one) {
        console.log('[useMessages] Message sent successfully:', result.data.insert_messages_one.id);
        notifySentMessage();

        // Create or update notification for the recipient (groups messages per conversation)
        try {
          const displayName = senderName || 'Someone';
          const notificationMessage = content.length > 100 ? content.substring(0, 100) + '...' : content;

          let existingNotification = null;

          // Try to find existing unread notification for this conversation
          try {
            const { data: existingData } = await apolloClient.query({
              query: GET_EXISTING_MESSAGE_NOTIFICATION,
              variables: {
                userId: recipientId,
                conversationId: conversationId,
              },
              fetchPolicy: 'network-only',
            });
            existingNotification = existingData?.notifications?.[0];
            console.log('[useMessages] Existing notification:', existingNotification?.id || 'none');
          } catch (queryError) {
            console.warn('[useMessages] Could not check for existing notification');
          }

          if (existingNotification) {
            // Update existing notification with message count
            try {
              const countMatch = existingNotification.title.match(/\((\d+)\s+(?:new\s+)?messages?\)/i);
              const currentCount = countMatch ? parseInt(countMatch[1], 10) : 1;
              const newCount = currentCount + 1;

              const newTitle = `${displayName} (${newCount} messages)`;

              await updateNotificationMutation({
                variables: {
                  id: existingNotification.id,
                  data: {
                    title: newTitle,
                    message: notificationMessage,
                    created_at: new Date().toISOString(),
                  },
                },
              });
              console.log('[useMessages] Notification updated (count:', newCount, ')');
            } catch (updateError) {
              console.warn('[useMessages] Update failed, creating new notification');
              existingNotification = null; // Fall through to create
            }
          }

          if (!existingNotification) {
            // Create new notification with related_id for future grouping
            await createNotificationMutation({
              variables: {
                data: {
                  user_id: recipientId,
                  title: displayName,
                  message: notificationMessage,
                  type: 'message_received',
                  link: `/messages?conversation=${conversationId}`,
                  related_id: conversationId,
                  related_type: 'conversation',
                },
              },
            });
            console.log('[useMessages] Notification created for recipient:', recipientId);
          }
        } catch (notifError) {
          // Don't fail the message send if notification creation fails
          console.error('[useMessages] Failed to create notification:', notifError);
        }

        // Immediately refetch messages to update the UI
        // This ensures the message appears even if subscription doesn't trigger (e.g., on web)
        console.log('[useMessages] Calling refetch to update message list...');
        await refetch();
        console.log('[useMessages] Refetch completed');
      }

      return result.data?.insert_messages_one;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, [userId, conversationId, sendMessageMutation, createNotificationMutation, updateNotificationMutation, refetch]);

  const markAsRead = useCallback(async () => {
    if (!userId || !conversationId) return;

    try {
      await markAsReadMutation({
        variables: {
          conversationId,
          recipientId: userId,
        },
        // Refetch unread counts after marking as read
        refetchQueries: [
          {
            query: GET_UNREAD_MESSAGE_COUNT,
            variables: { userId },
          },
          {
            query: GET_UNREAD_COUNTS_PER_CONVERSATION,
            variables: { userId },
          },
        ],
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [userId, conversationId, markAsReadMutation]);

  const loadMore = useCallback(async () => {
    if (messages.length >= totalCount) return;

    await fetchMore({
      variables: {
        offset: messages.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...fetchMoreResult,
          messages: [...prev.messages, ...fetchMoreResult.messages],
        };
      },
    });
  }, [messages.length, totalCount, fetchMore]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const result = await deleteMessageMutation({
        variables: { messageId },
      });
      // Refetch messages after deletion
      refetch();
      return result.data?.delete_messages_by_pk;
    } catch (error) {
      console.error('Error deleting message:', error);
      return null;
    }
  }, [deleteMessageMutation, refetch]);

  return {
    messages,
    totalCount,
    loading,
    error,
    sendMessage,
    markAsRead,
    deleteMessage,
    loadMore,
    refetch,
    hasMore: messages.length < totalCount,
  };
}

export function useCreateConversation() {
  const { user } = useAuth();
  const [createConversationMutation] = useMutation(CREATE_CONVERSATION);

  // Use Firebase UID for mutations - data is stored with Firebase UIDs
  const userId = user?.uid || (user as any)?.profile_id;

  const createConversation = useCallback(async (
    otherUserId: string,
    otherUserType: string,
    myUserType?: string
  ) => {
    if (!userId) return null;

    try {
      // First, check if a conversation already exists between these two users
      const { data: existingData } = await apolloClient.query({
        query: FIND_EXISTING_CONVERSATION,
        variables: {
          user1: userId,
          user2: otherUserId,
        },
        fetchPolicy: 'network-only',
      });

      // If conversation exists, return it
      if (existingData?.conversations?.length > 0) {
        console.log('[useCreateConversation] Found existing conversation:', existingData.conversations[0].id);
        return existingData.conversations[0];
      }

      // No existing conversation, create a new one
      console.log('[useCreateConversation] Creating new conversation');
      const result = await createConversationMutation({
        variables: {
          participant1Id: userId,
          participant1Type: myUserType || user?.user_type || 'user',
          participant2Id: otherUserId,
          participant2Type: otherUserType,
        },
      });
      return result.data?.insert_conversations_one;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [userId, createConversationMutation, user?.user_type]);

  return { createConversation, userId };
}

// Simplified hook just for unread message count (for tab badge)
export function useUnreadMessageCount() {
  const { user } = useAuth();

  // Use Firebase UID for queries - data is stored with Firebase UIDs
  const userId = user?.uid || (user as any)?.profile_id;

  const { data, loading, refetch } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    variables: { userId: userId || '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000, // Poll every 5 seconds for updates
  });

  return {
    count: data?.messages_aggregate?.aggregate?.count || 0,
    loading,
    refetch,
  };
}

// Hook to manage user's online status
export function useOnlineStatus() {
  const { user } = useAuth();
  const [updateOnlineStatusMutation] = useMutation(UPDATE_ONLINE_STATUS);

  // Use Firebase UID for mutations
  const userId = user?.uid || (user as any)?.profile_id;

  // Update online status
  const setOnline = useCallback(async () => {
    if (!userId) return;
    try {
      await updateOnlineStatusMutation({
        variables: {
          userId,
          isOnline: true,
          lastActivityAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[useOnlineStatus] Error setting online:', error);
    }
  }, [userId, updateOnlineStatusMutation]);

  // Update last activity (keeps online status true and updates timestamp)
  const updateActivity = useCallback(async () => {
    if (!userId) return;
    try {
      await updateOnlineStatusMutation({
        variables: {
          userId,
          isOnline: true,
          lastActivityAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[useOnlineStatus] Error updating activity:', error);
    }
  }, [userId, updateOnlineStatusMutation]);

  // Set offline status
  const setOffline = useCallback(async () => {
    if (!userId) return;
    try {
      await updateOnlineStatusMutation({
        variables: {
          userId,
          isOnline: false,
          lastActivityAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[useOnlineStatus] Error setting offline:', error);
    }
  }, [userId, updateOnlineStatusMutation]);

  // Auto-update activity on mount and periodically
  useEffect(() => {
    if (!userId) return;

    // Set online immediately
    setOnline();

    // Update activity every 2 minutes to keep online status fresh
    const activityInterval = setInterval(() => {
      updateActivity();
    }, 2 * 60 * 1000); // 2 minutes

    return () => {
      clearInterval(activityInterval);
      // Note: setOffline on unmount doesn't work reliably in React Native
      // We rely on last_activity_at timeout instead
    };
  }, [userId, setOnline, updateActivity]);

  return { setOnline, setOffline, updateActivity };
}

// Hook to manage typing indicator
interface UseTypingIndicatorOptions {
  conversationId: string;
  otherParticipantId: string;
}

export function useTypingIndicator(options: UseTypingIndicatorOptions) {
  const { conversationId, otherParticipantId } = options;
  const { user } = useAuth();
  const [updateTypingStatusMutation] = useMutation(UPDATE_TYPING_STATUS);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use Firebase UID for mutations
  const userId = user?.uid || (user as any)?.profile_id;

  // Subscribe to other participant's typing status
  const { data: typingData } = useSubscription(ON_TYPING_STATUS, {
    variables: { userId: otherParticipantId },
    skip: !otherParticipantId,
  });

  // Check if other user is typing in this conversation
  const isOtherUserTyping =
    typingData?.profiles_by_pk?.is_typing === true &&
    typingData?.profiles_by_pk?.typing_in_conversation_id === conversationId;

  // Set typing status (called when user starts typing)
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!userId || !conversationId) return;

    try {
      await updateTypingStatusMutation({
        variables: {
          userId,
          isTyping,
          conversationId: isTyping ? conversationId : null,
        },
      });
    } catch (error) {
      console.error('[useTypingIndicator] Error updating typing status:', error);
    }
  }, [userId, conversationId, updateTypingStatusMutation]);

  // Handle text input change - sets typing and auto-clears after 3 seconds
  const onTextChange = useCallback(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true
    setTyping(true);

    // Auto-clear typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  // Clear typing status when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear typing status on unmount
      if (userId && conversationId) {
        updateTypingStatusMutation({
          variables: {
            userId,
            isTyping: false,
            conversationId: null,
          },
        }).catch(() => {});
      }
    };
  }, [userId, conversationId, updateTypingStatusMutation]);

  // Clear typing when message is sent
  const clearTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  return {
    isOtherUserTyping,
    onTextChange,
    clearTyping,
  };
}
