/**
 * Messages Screen
 *
 * List of conversations and messages (accessible from Profile menu)
 */

import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import { Link, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

// User type options for browsing
const USER_TYPE_OPTIONS = [
  { type: 'sponsor', label: 'Sponsors', icon: 'people-outline' as const },
  { type: 'agency', label: 'Agencies', icon: 'business-outline' as const },
  { type: 'maid', label: 'Maids', icon: 'person-outline' as const },
];

// GraphQL Query - Synced with web MaidMessagesPage
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
      participant2_id
      participant2_type
      status
      last_message_at
      last_message_preview
      participant1_unread_count
      participant2_unread_count
      created_at
      updated_at
    }
  }
`;

interface Conversation {
  id: string;
  participant1_id: string;
  participant1_type?: string;
  participant2_id: string;
  participant2_type?: string;
  status: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  participant1_unread_count: number;
  participant2_unread_count: number;
  created_at: string;
  updated_at: string;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showUserTypeMenu, setShowUserTypeMenu] = useState(false);

  // Get current user's type to filter out from options
  const currentUserType = user?.user_type || 'maid';

  // Filter options to show only other user types
  const availableUserTypes = USER_TYPE_OPTIONS.filter(
    (opt) => opt.type !== currentUserType
  );

  const handleUserTypeSelect = (type: string) => {
    setShowUserTypeMenu(false);
    router.push(`/browse/${type}`);
  };

  const { data, loading, error, refetch } = useQuery(GET_CONVERSATIONS, {
    variables: { userId: user?.uid || '' },
    skip: !user?.uid,
    fetchPolicy: 'cache-and-network',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const conversations: Conversation[] = data?.conversations || [];

  // Get other participant ID from conversation
  const getOtherParticipantId = (conversation: Conversation) => {
    if (conversation.participant1_id === user?.uid) {
      return conversation.participant2_id;
    }
    return conversation.participant1_id;
  };

  // Get unread count for current user
  const getUnreadCount = (conversation: Conversation) => {
    if (conversation.participant1_id === user?.uid) {
      return conversation.participant1_unread_count || 0;
    }
    return conversation.participant2_unread_count || 0;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isUnread = (conversation: Conversation) => {
    return getUnreadCount(conversation) > 0;
  };

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: 'Messages', headerShown: true }} />
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Please sign in</Text>
          <Text style={styles.emptySubtitle}>Sign in to view your messages</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerShown: true,
          headerStyle: { backgroundColor: '#1E40AF' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowUserTypeMenu(true)}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {loading && conversations.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E40AF" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Error loading messages</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation with a maid or sponsor
            </Text>
            <Link href="/(tabs)/maids" asChild>
              <TouchableOpacity style={styles.searchButton}>
                <Text style={styles.searchButtonText}>Browse Maids</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E40AF']} />
            }
            renderItem={({ item }) => {
              const otherParticipantId = getOtherParticipantId(item);
              const unread = isUnread(item);
              const unreadCount = getUnreadCount(item);

              return (
                <Link href={`/messages/${item.id}`} asChild>
                  <TouchableOpacity style={[styles.conversationCard, unread && styles.conversationUnread]}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {otherParticipantId?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.conversationContent}>
                      <View style={styles.conversationHeader}>
                        <Text style={[styles.conversationName, unread && styles.textUnread]}>
                          {otherParticipantId?.substring(0, 12) || 'Unknown'}...
                        </Text>
                        <Text style={styles.conversationTime}>
                          {formatTime(item.last_message_at)}
                        </Text>
                      </View>
                      <Text style={[styles.lastMessage, unread && styles.textUnread]} numberOfLines={1}>
                        {item.last_message_preview || 'No messages yet'}
                      </Text>
                    </View>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Link>
              );
            }}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

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
            <Text style={styles.modalTitle}>Start New Chat</Text>
            <Text style={styles.modalSubtitle}>Select who you want to chat with</Text>

            {availableUserTypes.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.userTypeOption}
                onPress={() => handleUserTypeSelect(option.type)}
              >
                <View style={styles.userTypeIconContainer}>
                  <Ionicons name={option.icon} size={24} color="#1E40AF" />
                </View>
                <Text style={styles.userTypeLabel}>Browse {option.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUserTypeMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationUnread: {
    backgroundColor: '#F0F9FF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  textUnread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E40AF',
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userTypeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userTypeLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
