/**
 * useMessages Hook
 * React hooks for Message operations using ServiceFactory
 */

import { useState, useCallback, useEffect } from 'react';
import { useEnsureServiceFactory, ServiceFactory } from './useServiceFactory';

/**
 * Hook for fetching a single message
 */
export function useMessage(messageId) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchMessage = useCallback(async (id) => {
    const targetId = id || messageId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      const result = await service.getMessage(targetId);
      setMessage(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    if (messageId) {
      fetchMessage(messageId);
    }
  }, [messageId, fetchMessage]);

  return {
    message,
    loading,
    error,
    refetch: fetchMessage,
  };
}

/**
 * Hook for sending a message
 */
export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sentMessage, setSentMessage] = useState(null);

  useEnsureServiceFactory();

  const send = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      const result = await service.sendMessage(data);
      setSentMessage(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSentMessage(null);
    setError(null);
  }, []);

  return {
    send,
    loading,
    error,
    sentMessage,
    reset,
  };
}

/**
 * Hook for fetching a conversation between two users
 */
export function useConversation(userId1, userId2, options = {}) {
  const { limit, offset, autoFetch = true } = options;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchConversation = useCallback(async (opts = {}) => {
    if (!userId1 || !userId2) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      const result = await service.getConversation({
        userId1,
        userId2,
        limit: opts.limit ?? limit,
        offset: opts.offset ?? offset,
      });
      setMessages(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId1, userId2, limit, offset]);

  useEffect(() => {
    if (autoFetch && userId1 && userId2) {
      fetchConversation();
    }
  }, [userId1, userId2, autoFetch, fetchConversation]);

  return {
    messages,
    loading,
    error,
    refetch: fetchConversation,
  };
}

/**
 * Hook for fetching all conversations for a user
 */
export function useUserConversations(userId, options = {}) {
  const { limit, offset, autoFetch = true } = options;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchConversations = useCallback(async (id, opts = {}) => {
    const targetId = id || userId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      const result = await service.getUserConversations(
        targetId,
        opts.limit ?? limit,
        opts.offset ?? offset
      );
      setConversations(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, limit, offset]);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchConversations(userId);
    }
  }, [userId, autoFetch, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
}

/**
 * Hook for fetching unread messages
 */
export function useUnreadMessages(userId, options = {}) {
  const { limit, autoFetch = true } = options;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchUnread = useCallback(async (id, opts = {}) => {
    const targetId = id || userId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      const result = await service.getUnreadMessages(targetId, opts.limit ?? limit);
      setMessages(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchUnread(userId);
    }
  }, [userId, autoFetch, fetchUnread]);

  const unreadCount = messages.length;

  return {
    messages,
    unreadCount,
    loading,
    error,
    refetch: fetchUnread,
  };
}

/**
 * Hook for marking messages as read
 */
export function useMarkMessageRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const markAsRead = useCallback(async (messageId) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      const result = await service.markMessageAsRead(messageId);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markConversationAsRead = useCallback(async (userId1, userId2) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      await service.markConversationAsRead(userId1, userId2);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markAsRead,
    markConversationAsRead,
    loading,
    error,
  };
}

/**
 * Hook for deleting a message
 */
export function useDeleteMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const deleteMessage = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      await service.deleteMessage(id);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteMessage,
    loading,
    error,
  };
}

/**
 * Hook for searching messages
 */
export function useSearchMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const search = useCallback(async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMessageService();
      const result = await service.searchMessages(filters);
      setMessages(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    search,
    reset,
  };
}

/**
 * Combined conversation hook with send functionality
 */
export function useChat(userId1, userId2, options = {}) {
  const conversationHook = useConversation(userId1, userId2, options);
  const sendHook = useSendMessage();
  const markReadHook = useMarkMessageRead();

  const sendMessage = useCallback(async (content, messageType = 'text') => {
    const result = await sendHook.send({
      senderId: userId1,
      receiverId: userId2,
      content,
      messageType,
    });
    // Refetch conversation after sending
    await conversationHook.refetch();
    return result;
  }, [userId1, userId2, sendHook.send, conversationHook.refetch]);

  const markAllRead = useCallback(async () => {
    await markReadHook.markConversationAsRead(userId1, userId2);
  }, [userId1, userId2, markReadHook.markConversationAsRead]);

  return {
    messages: conversationHook.messages,
    loading: conversationHook.loading || sendHook.loading,
    error: conversationHook.error || sendHook.error,
    sendMessage,
    markAllRead,
    refetch: conversationHook.refetch,
    isSending: sendHook.loading,
  };
}

/**
 * Combined hook for all message operations
 */
export function useMessageService() {
  useEnsureServiceFactory();

  const getService = useCallback(() => {
    return ServiceFactory.getMessageService();
  }, []);

  return {
    getService,
    // Individual operation hooks
    useMessage,
    useSend: useSendMessage,
    useConversation,
    useUserConversations,
    useUnread: useUnreadMessages,
    useMarkRead: useMarkMessageRead,
    useDelete: useDeleteMessage,
    useSearch: useSearchMessages,
    useChat,
  };
}
