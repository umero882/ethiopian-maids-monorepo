/**
 * Message Detail Screen
 *
 * Shows conversation messages and allows sending new messages.
 * Synced with web MaidMessagesPage.jsx
 *
 * Uses:
 * - Apollo Client/GraphQL for data operations (via Hasura)
 * - Firebase Auth for user authentication
 */

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

// GraphQL Queries - Synced with web MaidMessagesPage
const GET_CONVERSATION_MESSAGES = gql`
  query GetConversationMessages($conversationId: uuid!, $limit: Int = 50) {
    messages(
      where: { conversation_id: { _eq: $conversationId } }
      order_by: { created_at: asc }
      limit: $limit
    ) {
      id
      conversation_id
      sender_id
      recipient_id
      content
      message_type
      is_read
      read_at
      created_at
    }
  }
`;

const GET_CONVERSATION = gql`
  query GetConversation($id: uuid!) {
    conversations_by_pk(id: $id) {
      id
      participant1_id
      participant1_type
      participant2_id
      participant2_type
      status
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($data: messages_insert_input!) {
    insert_messages_one(object: $data) {
      id
      conversation_id
      sender_id
      recipient_id
      content
      message_type
      is_read
      created_at
    }
  }
`;

const MARK_MESSAGES_AS_READ = gql`
  mutation MarkMessagesAsRead($conversationId: uuid!, $userId: String!) {
    update_messages(
      where: {
        conversation_id: { _eq: $conversationId }
        recipient_id: { _eq: $userId }
        is_read: { _eq: false }
      }
      _set: { is_read: true, read_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

const UPDATE_CONVERSATION = gql`
  mutation UpdateConversation($id: uuid!, $data: conversations_set_input!) {
    update_conversations_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      last_message_at
      last_message_preview
    }
  }
`;

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Fetch conversation details
  const { data: conversationData } = useQuery(GET_CONVERSATION, {
    variables: { id },
    skip: !id,
  });

  // Fetch messages
  const {
    data: messagesData,
    loading,
    error,
    refetch,
  } = useQuery(GET_CONVERSATION_MESSAGES, {
    variables: { conversationId: id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Mutations
  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE);
  const [markAsReadMutation] = useMutation(MARK_MESSAGES_AS_READ);
  const [updateConversationMutation] = useMutation(UPDATE_CONVERSATION);

  const conversation = conversationData?.conversations_by_pk;
  const messages: Message[] = messagesData?.messages || [];

  // Get other participant ID
  const getOtherParticipantId = () => {
    if (!conversation || !user?.uid) return null;
    return conversation.participant1_id === user.uid
      ? conversation.participant2_id
      : conversation.participant1_id;
  };

  // Mark messages as read when viewing
  useEffect(() => {
    if (id && user?.uid) {
      markAsReadMutation({
        variables: {
          conversationId: id,
          userId: user.uid,
        },
      }).catch(console.error);
    }
  }, [id, user?.uid, markAsReadMutation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Format time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !user?.uid || sending) return;

    const recipientId = getOtherParticipantId();
    if (!recipientId) return;

    try {
      await sendMessageMutation({
        variables: {
          data: {
            conversation_id: id,
            sender_id: user.uid,
            recipient_id: recipientId,
            content: newMessage.trim(),
            message_type: 'text',
            is_read: false,
          },
        },
      });

      // Update conversation with last message
      await updateConversationMutation({
        variables: {
          id,
          data: {
            last_message_at: new Date().toISOString(),
            last_message_preview: newMessage.trim().substring(0, 100),
          },
        },
      });

      setNewMessage('');
      refetch();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatMessageTime(item.created_at)}
            </Text>
            {isOwnMessage && (
              <Ionicons
                name={item.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={isOwnMessage ? 'rgba(255,255,255,0.7)' : '#9CA3AF'}
                style={styles.readIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: 'Messages', headerShown: true }} />
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Please sign in</Text>
          <Text style={styles.emptySubtitle}>Sign in to view messages</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: getOtherParticipantId()?.substring(0, 12) + '...' || 'Messages',
          headerShown: true,
          headerStyle: { backgroundColor: '#1E40AF' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBack}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading && messages.length === 0 ? (
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
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Send a message to start the conversation
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  emptyContainer: {
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
  headerBack: {
    marginLeft: 8,
    padding: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#1E40AF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    fontSize: 15,
    color: '#1F2937',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
});
