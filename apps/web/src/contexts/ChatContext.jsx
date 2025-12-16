import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { createLogger } from '@/utils/logger';

const log = createLogger('ChatContext');

/**
 * ChatContext - Legacy Supabase-based chat
 *
 * NOTE: This context has been deprecated. Supabase has been removed.
 * For messaging functionality, use the GraphQL-based messaging system:
 * - MaidMessagesPage component for the messaging UI
 * - communicationsService.graphql.js for the service layer
 *
 * This context now provides stub implementations to prevent crashes
 * in components that still reference it.
 */

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children, mockValue }) => {
  // Allow mock value for testing
  if (mockValue) {
    return (
      <ChatContext.Provider value={mockValue}>{children}</ChatContext.Provider>
    );
  }

  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ============================================================================
  // STUB IMPLEMENTATIONS - Supabase removed, use GraphQL messaging instead
  // ============================================================================

  const isUserOnline = useCallback((userId) => {
    // Online status is now tracked via GraphQL in profiles.is_online
    return false;
  }, []);

  const loadConversations = useCallback(async () => {
    log.debug('loadConversations: Use GraphQL-based messaging (MaidMessagesPage)');
    // No-op - use GraphQL messaging instead
  }, [user]);

  const loadMessages = useCallback(async (conversationId) => {
    log.debug('loadMessages: Use GraphQL-based messaging (MaidMessagesPage)');
    // No-op - use GraphQL messaging instead
  }, [user]);

  const sendMessage = useCallback(async (conversationId, content, type = 'text') => {
    log.warn('sendMessage: ChatContext is deprecated. Use GraphQL-based messaging.');
    return null;
  }, [user]);

  const markAsRead = useCallback(async (conversationId) => {
    log.debug('markAsRead: Use GraphQL-based messaging');
    // No-op
  }, [user]);

  const startTyping = useCallback((conversationId) => {
    // No-op - typing indicators not implemented in GraphQL version
  }, [user]);

  const stopTyping = useCallback((conversationId) => {
    // No-op
  }, []);

  const createConversation = useCallback(async (partnerId, partnerName, partnerAvatar) => {
    log.debug('createConversation: Use GraphQL-based messaging');
    // Return a stub conversation
    const newConv = {
      id: partnerId,
      partnerId,
      partnerName: partnerName || 'User',
      partnerAvatar,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };
    setConversations((prev) => [newConv, ...prev]);
    return newConv;
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  const value = useMemo(() => ({
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    unreadCounts,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    createConversation,
    setActiveConversation,
    markAsRead,
    loadMessages,
    loadConversations,
    isUserOnline,
    // Flag to indicate this is the deprecated version
    isDeprecated: true,
  }), [
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    unreadCounts,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    createConversation,
    markAsRead,
    loadMessages,
    loadConversations,
    isUserOnline,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
