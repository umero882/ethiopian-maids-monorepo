/**
 * RealtimeChat Component
 * Real-time chat using GraphQL subscriptions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useConversationSubscription } from '@/hooks/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

// Note: receiver_id and sender_id use String type (Firebase UID)
const SEND_MESSAGE = gql`
  mutation SendMessage($content: String!, $receiver_id: String!, $sender_id: String!) {
    insert_messages_one(object: {
      content: $content
      receiver_id: $receiver_id
      sender_id: $sender_id
    }) {
      id
      content
      sender_id
      receiver_id
      created_at
    }
  }
`;

const MARK_MESSAGE_READ = gql`
  mutation MarkMessageAsRead($id: uuid!) {
    update_messages_by_pk(pk_columns: { id: $id }, _set: { read: true }) {
      id
      read
    }
  }
`;

/**
 * Single message bubble
 */
function MessageBubble({ message, isOwn, showAvatar = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>
            {isOwn ? 'Me' : 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      {!showAvatar && <div className="w-8" />}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Typing indicator
 */
function TypingIndicator() {
  return (
    <div className="flex gap-2 mb-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          <motion.span
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * RealtimeChat - Main component
 */
export function RealtimeChat({ otherUserId, otherUserName, otherUserAvatar }) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Real-time subscription for conversation
  const { messages, loading } = useConversationSubscription(otherUserId, {
    onNewMessage: useCallback((message) => {
      // Auto-scroll to bottom on new message
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, []),
  });

  // Send message mutation
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    onCompleted: () => {
      setNewMessage('');
      inputRef.current?.focus();
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });

  // Mark message as read
  const [markAsRead] = useMutation(MARK_MESSAGE_READ);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark unread messages as read when viewing
  useEffect(() => {
    messages
      .filter((m) => m.sender_id === otherUserId && !m.read)
      .forEach((m) => {
        markAsRead({ variables: { id: m.id } });
      });
  }, [messages, otherUserId, markAsRead]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || sending) return;

    sendMessage({
      variables: {
        content: newMessage.trim(),
        receiver_id: otherUserId,
        sender_id: user?.id,
      },
    });
  }, [newMessage, sending, sendMessage, otherUserId, user?.id]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Group consecutive messages from same sender
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1];
    const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
    return [...groups, { ...message, showAvatar }];
  }, []);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar>
          <AvatarImage src={otherUserAvatar} />
          <AvatarFallback>{otherUserName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{otherUserName || 'User'}</h3>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {groupedMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                showAvatar={message.showAvatar}
              />
            ))}
          </AnimatePresence>
        )}
        {isTyping && <TypingIndicator />}
      </ScrollArea>

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon" aria-label="Send message"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RealtimeChat;
