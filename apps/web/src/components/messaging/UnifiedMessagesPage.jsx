/**
 * Unified Messages Page Component
 *
 * A single messaging component used across all user types (maid, sponsor, agency).
 * Uses GraphQL/Hasura for data - the consolidated approach for the entire app.
 *
 * Features:
 * - Inline image/document previews
 * - Fullscreen image viewer with save/delete
 * - File upload (images and documents)
 * - Voice messages with waveform visualization
 * - Delete message functionality
 * - Real-time updates via polling
 * - Typing indicators
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Send,
  Search,
  Trash2,
  Check,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  User,
  Plus,
  Building2,
  Users,
  ChevronDown,
  Paperclip,
  FileText,
  MapPin,
  Download,
  X,
  Loader2,
  Mic,
  Briefcase,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import UserListModal from '@/components/UserListModal';
import {
  uploadChatImage,
  uploadChatDocument,
  formatAttachmentMessage,
  parseAttachmentMessage,
  parseLocationMessage,
  isAttachmentMessage,
  formatFileSize,
  downloadFile,
} from '@/utils/chatAttachments';
import {
  uploadVoice,
  formatVoiceMessage,
  parseVoiceMessage,
  isVoiceMessage,
} from '@/utils/voiceUpload';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import VoicePlayer from '@/components/chat/VoicePlayer';
import { graphqlNotificationService } from '@/services/notificationService.graphql';
import EmptyState from '@/components/ui/EmptyState';

// GraphQL Queries
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
  }
`;

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

const DELETE_MESSAGE = gql`
  mutation DeleteMessage($messageId: uuid!) {
    delete_messages_by_pk(id: $messageId) {
      id
    }
  }
`;

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

const GET_TYPING_STATUS = gql`
  query GetTypingStatus($userId: String!) {
    profiles_by_pk(id: $userId) {
      id
      is_typing
      typing_in_conversation_id
    }
  }
`;

// Create a new conversation
const CREATE_CONVERSATION = gql`
  mutation CreateConversation($data: conversations_insert_input!) {
    insert_conversations_one(object: $data) {
      id
      participant1_id
      participant1_type
      participant2_id
      participant2_type
      status
      created_at
      updated_at
    }
  }
`;

// Find existing conversation between two users
const FIND_CONVERSATION = gql`
  query FindConversation($userId1: String!, $userId2: String!) {
    conversations(
      where: {
        _or: [
          { _and: [{ participant1_id: { _eq: $userId1 } }, { participant2_id: { _eq: $userId2 } }] }
          { _and: [{ participant1_id: { _eq: $userId2 } }, { participant2_id: { _eq: $userId1 } }] }
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

// User type configurations for different dashboard types
const USER_TYPE_CONFIG = {
  maid: {
    title: 'Messages',
    subtitle: 'Communicate with sponsors and agencies',
    newChatOptions: [
      { type: 'sponsor', label: 'Browse Sponsors', icon: Users },
      { type: 'agency', label: 'Browse Agencies', icon: Building2 },
    ],
  },
  sponsor: {
    title: 'Messages',
    subtitle: 'Communicate with maids and agencies',
    newChatOptions: [
      { type: 'maid', label: 'Browse Maids', icon: Briefcase },
      { type: 'agency', label: 'Browse Agencies', icon: Building2 },
    ],
  },
  agency: {
    title: 'Messages',
    subtitle: 'Communicate with maids and sponsors',
    newChatOptions: [
      { type: 'maid', label: 'Browse Maids', icon: Briefcase },
      { type: 'sponsor', label: 'Browse Sponsors', icon: Users },
    ],
  },
};

/**
 * Unified Messages Page Component
 * @param {Object} props
 * @param {string} props.userType - 'maid' | 'sponsor' | 'agency'
 */
const UnifiedMessagesPage = ({ userType = 'maid' }) => {
  const { user } = useAuth();
  const config = USER_TYPE_CONFIG[userType] || USER_TYPE_CONFIG.maid;

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // New conversation starter state
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);

  // Image viewer state
  const [viewerImage, setViewerImage] = useState(null);

  // Delete confirmation state
  const [deleteMessageId, setDeleteMessageId] = useState(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  // Typing indicator state
  const typingTimeoutRef = useRef(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  // Track for notifications
  const lastMessageIdRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastUnreadCountsRef = useRef({});
  const conversationsInitializedRef = useRef(false);

  // Get user ID
  const userId = user?.uid || user?.id || '';

  // URL parameters for deep linking (from notification clicks or maid profile)
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');
  const maidIdFromUrl = searchParams.get('maid');
  const maidNameFromUrl = searchParams.get('name');
  const urlConversationHandledRef = useRef(false);
  const maidConversationHandledRef = useRef(null); // Store the maid ID that was handled

  // Fetch conversations
  const {
    data: conversationsData,
    loading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery(GET_CONVERSATIONS, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const conversations = conversationsData?.conversations || [];

  // Collect all participant IDs to fetch profiles
  const participantIds = useMemo(() => {
    return conversations.reduce((ids, conv) => {
      if (conv.participant1_id && !ids.includes(conv.participant1_id)) {
        ids.push(conv.participant1_id);
      }
      if (conv.participant2_id && !ids.includes(conv.participant2_id)) {
        ids.push(conv.participant2_id);
      }
      return ids;
    }, []);
  }, [conversations]);

  // Fetch profiles for all participants
  const { data: profilesData } = useQuery(GET_PROFILES_BY_IDS, {
    variables: { ids: participantIds },
    skip: participantIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Create a map of profiles by ID
  const profilesMap = useMemo(() => {
    const map = {};
    if (profilesData?.profiles) {
      profilesData.profiles.forEach((profile) => {
        map[profile.id] = profile;
      });
    }
    return map;
  }, [profilesData]);

  // Helper function to get display name from profile
  const getDisplayName = useCallback((profile, participantId) => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.email) {
      const emailName = profile.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    if (!participantId) return 'Someone';
    return participantId.substring(0, 8) + '...';
  }, []);

  // Get the other participant info for a conversation
  const getOtherParticipant = useCallback((conversation) => {
    if (!conversation || !userId) return null;

    const isParticipant1 = conversation.participant1_id === userId;
    const otherParticipantId = isParticipant1
      ? conversation.participant2_id
      : conversation.participant1_id;
    const otherParticipantType = isParticipant1
      ? conversation.participant2_type
      : conversation.participant1_type;
    const unreadCount = isParticipant1
      ? conversation.participant1_unread_count || 0
      : conversation.participant2_unread_count || 0;

    const profile = profilesMap[otherParticipantId] || null;

    return {
      id: otherParticipantId,
      type: otherParticipantType || 'user',
      unreadCount,
      profile,
      name: getDisplayName(profile, otherParticipantId),
      avatar: profile?.avatar_url || null,
      isOnline: profile?.is_online || false,
    };
  }, [userId, profilesMap, getDisplayName]);

  // Notification effects (same as MaidMessagesPage)
  useEffect(() => {
    if (conversations.length === 0) return;
    const hasProfiles = Object.keys(profilesMap).length > 0;

    if (!conversationsInitializedRef.current) {
      const counts = {};
      conversations.forEach(conv => {
        const isParticipant1 = conv.participant1_id === userId;
        const unreadCount = isParticipant1
          ? conv.participant1_unread_count || 0
          : conv.participant2_unread_count || 0;
        counts[conv.id] = unreadCount;
      });
      lastUnreadCountsRef.current = counts;
      conversationsInitializedRef.current = true;
      return;
    }

    if (!hasProfiles) return;

    conversations.forEach(conv => {
      const isParticipant1 = conv.participant1_id === userId;
      const currentUnread = isParticipant1
        ? conv.participant1_unread_count || 0
        : conv.participant2_unread_count || 0;
      const previousUnread = lastUnreadCountsRef.current[conv.id] || 0;

      if (selectedConversation?.id === conv.id) {
        lastUnreadCountsRef.current[conv.id] = currentUnread;
        return;
      }

      if (currentUnread > previousUnread) {
        const otherParticipantId = isParticipant1 ? conv.participant2_id : conv.participant1_id;
        const senderProfile = profilesMap[otherParticipantId];
        let senderName = 'Someone';
        if (senderProfile?.full_name) {
          senderName = senderProfile.full_name;
        } else if (senderProfile?.email) {
          const emailName = senderProfile.email.split('@')[0];
          senderName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }

        toast({
          title: `New message from ${senderName}`,
          description: conv.last_message_preview?.substring(0, 50) +
            (conv.last_message_preview?.length > 50 ? '...' : '') || 'New message',
        });
      }

      lastUnreadCountsRef.current[conv.id] = currentUnread;
    });
  }, [conversations, selectedConversation, profilesMap, userId]);

  // Auto-select conversation from URL parameter (deep link from notification)
  useEffect(() => {
    // Only process once when conversations are loaded and URL has conversation param
    if (
      !conversationIdFromUrl ||
      urlConversationHandledRef.current ||
      conversations.length === 0
    ) {
      return;
    }

    // Find the conversation matching the URL param
    const targetConversation = conversations.find(c => c.id === conversationIdFromUrl);

    if (targetConversation) {
      setSelectedConversation(targetConversation);
      urlConversationHandledRef.current = true;
      // Clear the URL parameter to avoid re-selecting on future navigation
      setSearchParams({}, { replace: true });
    }
  }, [conversationIdFromUrl, conversations, setSearchParams]);

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery(GET_CONVERSATION_MESSAGES, {
    variables: { conversationId: selectedConversation?.id },
    skip: !selectedConversation?.id,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000,
  });

  // Mutations
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markAsReadMutation] = useMutation(MARK_MESSAGES_AS_READ);
  const [updateConversationMutation] = useMutation(UPDATE_CONVERSATION);
  const [deleteMessageMutation] = useMutation(DELETE_MESSAGE);
  const [updateTypingStatusMutation] = useMutation(UPDATE_TYPING_STATUS);
  const [createConversationMutation] = useMutation(CREATE_CONVERSATION);

  // Lazy query for finding existing conversation
  const [findConversation] = useLazyQuery(FIND_CONVERSATION, {
    fetchPolicy: 'network-only',
  });

  // Handle maid parameter from URL (when coming from maid profile page)
  useEffect(() => {
    let isMounted = true;

    const handleMaidConversation = async () => {
      // Only process once per maid ID and when we have maid ID from URL
      // Also wait for conversations to finish loading
      if (
        !maidIdFromUrl ||
        maidConversationHandledRef.current === maidIdFromUrl ||
        !userId ||
        conversationsLoading
      ) {
        console.log('[Messages] Skipping - maidId:', maidIdFromUrl, 'handled:', maidConversationHandledRef.current, 'userId:', userId, 'loading:', conversationsLoading);
        return;
      }

      maidConversationHandledRef.current = maidIdFromUrl;
      console.log('[Messages] Starting conversation with maid:', maidIdFromUrl, 'user:', userId);

      try {
        // First, check if conversation already exists in loaded conversations
        console.log('[Messages] Checking for existing conversation in loaded list...');
        const existingInList = conversations.find(c =>
          (c.participant1_id === userId && c.participant2_id === maidIdFromUrl) ||
          (c.participant1_id === maidIdFromUrl && c.participant2_id === userId)
        );

        let conversationId = null;

        if (existingInList) {
          // Found in loaded list, select it directly
          conversationId = existingInList.id;
          console.log('[Messages] Found existing conversation in list:', conversationId);
          setSelectedConversation(existingInList);
          setSearchParams({}, { replace: true });
          return;
        }

        // Query database for existing conversation
        console.log('[Messages] Checking database for existing conversation...');
        const { data: existingData } = await findConversation({
          variables: { userId1: userId, userId2: maidIdFromUrl },
        });

        if (!isMounted) return;

        console.log('[Messages] Find conversation result:', existingData);

        if (existingData?.conversations?.length > 0) {
          // Conversation exists in database
          conversationId = existingData.conversations[0].id;
          console.log('[Messages] Found existing conversation in DB:', conversationId);
        } else {
          // Create new conversation
          console.log('[Messages] Creating new conversation...');
          const { data: newConvData } = await createConversationMutation({
            variables: {
              data: {
                participant1_id: userId,
                participant1_type: userType,
                participant2_id: maidIdFromUrl,
                participant2_type: 'maid',
                status: 'active',
              },
            },
          });

          if (!isMounted) return;

          console.log('[Messages] Create conversation result:', newConvData);

          if (newConvData?.insert_conversations_one) {
            conversationId = newConvData.insert_conversations_one.id;
            console.log('[Messages] Created new conversation:', conversationId);

            toast({
              title: 'Conversation Started',
              description: `You can now message ${maidNameFromUrl || 'the maid'}.`,
            });
          }
        }

        if (conversationId && isMounted) {
          // Refetch conversations to get the full list
          console.log('[Messages] Refetching conversations...');
          const { data: refetchedData } = await refetchConversations();

          if (!isMounted) return;

          console.log('[Messages] Refetched conversations:', refetchedData?.conversations?.length);

          const updatedConversations = refetchedData?.conversations || [];
          const targetConv = updatedConversations.find(c => c.id === conversationId);

          if (targetConv) {
            console.log('[Messages] Selecting conversation:', targetConv);
            setSelectedConversation(targetConv);
          } else {
            console.log('[Messages] Conversation not found in list, setting directly');
            // If not found in list, create a minimal conversation object
            setSelectedConversation({
              id: conversationId,
              participant1_id: userId,
              participant1_type: userType,
              participant2_id: maidIdFromUrl,
              participant2_type: 'maid',
              status: 'active',
            });
          }
        }

        // Clear URL parameters
        if (isMounted) {
          setSearchParams({}, { replace: true });
        }
      } catch (error) {
        // Ignore abort errors (component unmounted)
        if (error.name === 'AbortError' || !isMounted) {
          return;
        }
        console.error('[Messages] Error handling maid conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to start conversation. Please try again.',
          variant: 'destructive',
        });
      }
    };

    handleMaidConversation();

    return () => {
      isMounted = false;
    };
  }, [maidIdFromUrl, maidNameFromUrl, userId, userType, conversations, findConversation, createConversationMutation, refetchConversations, setSearchParams, conversationsLoading]);

  // Get other participant ID for typing status query
  const otherParticipantId = useMemo(() => {
    if (!selectedConversation || !userId) return null;
    return selectedConversation.participant1_id === userId
      ? selectedConversation.participant2_id
      : selectedConversation.participant1_id;
  }, [selectedConversation, userId]);

  // Query other user's typing status with polling
  const { data: typingData } = useQuery(GET_TYPING_STATUS, {
    variables: { userId: otherParticipantId || '' },
    skip: !otherParticipantId || !selectedConversation,
    fetchPolicy: 'network-only',
    pollInterval: 2000,
  });

  // Update isOtherUserTyping based on polling data
  useEffect(() => {
    if (typingData?.profiles_by_pk && selectedConversation) {
      const { is_typing, typing_in_conversation_id } = typingData.profiles_by_pk;
      setIsOtherUserTyping(
        is_typing === true && typing_in_conversation_id === selectedConversation.id
      );
    } else {
      setIsOtherUserTyping(false);
    }
  }, [typingData, selectedConversation]);

  const messages = messagesData?.messages || [];

  // Message notification effect
  useEffect(() => {
    if (messages.length === 0) return;
    const latestMessage = messages[messages.length - 1];

    if (isInitialLoadRef.current) {
      lastMessageIdRef.current = latestMessage.id;
      isInitialLoadRef.current = false;
      return;
    }

    if (latestMessage.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = latestMessage.id;

      if (latestMessage.sender_id !== userId) {
        const senderProfile = profilesMap[latestMessage.sender_id];
        let senderName = 'Someone';
        if (senderProfile?.full_name) {
          senderName = senderProfile.full_name;
        } else if (senderProfile?.email) {
          const emailName = senderProfile.email.split('@')[0];
          senderName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }

        toast({
          title: `New message from ${senderName}`,
          description: latestMessage.content?.substring(0, 50) +
            (latestMessage.content?.length > 50 ? '...' : ''),
        });
      }
    }
  }, [messages, userId, profilesMap]);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    lastMessageIdRef.current = null;
  }, [selectedConversation?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedConversation && userId) {
      markAsReadMutation({
        variables: {
          conversationId: selectedConversation.id,
          userId,
        },
      }).catch(console.error);
    }
  }, [selectedConversation, userId, markAsReadMutation]);

  // Typing functions
  const setTyping = useCallback(async (isTyping) => {
    if (!userId || !selectedConversation) return;
    try {
      await updateTypingStatusMutation({
        variables: {
          userId,
          isTyping,
          conversationId: isTyping ? selectedConversation.id : null,
        },
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [userId, selectedConversation, updateTypingStatusMutation]);

  const handleTextChange = useCallback((e) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (userId && selectedConversation) {
        updateTypingStatusMutation({
          variables: {
            userId,
            isTyping: false,
            conversationId: null,
          },
        }).catch(() => {});
      }
    };
  }, [userId, selectedConversation, updateTypingStatusMutation]);

  const clearTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Format functions
  const formatTime = (dateString) => {
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

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // File handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    e.target.value = '';
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
  };

  // Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !userId) return;

    const otherParticipant = getOtherParticipant(selectedConversation);
    const recipientId = otherParticipant?.id;
    let content = newMessage.trim();

    try {
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(0);

        const isImage = selectedFile.type.startsWith('image/');

        try {
          let uploadResult;
          if (isImage) {
            uploadResult = await uploadChatImage(
              selectedFile,
              userId,
              selectedConversation.id,
              (progress) => setUploadProgress(progress)
            );
          } else {
            uploadResult = await uploadChatDocument(
              selectedFile,
              userId,
              selectedConversation.id,
              (progress) => setUploadProgress(progress)
            );
          }
          content = formatAttachmentMessage(uploadResult, content);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          toast({
            title: 'Upload Failed',
            description: 'Failed to upload file. Please try again.',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
      }

      await sendMessageMutation({
        variables: {
          data: {
            conversation_id: selectedConversation.id,
            sender_id: userId,
            recipient_id: recipientId,
            content: content,
            message_type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'document') : 'text',
            is_read: false,
          },
        },
      });

      const preview = selectedFile
        ? (selectedFile.type.startsWith('image/') ? '📷 Photo' : '📎 Document')
        : content.substring(0, 100);

      await updateConversationMutation({
        variables: {
          id: selectedConversation.id,
          data: {
            last_message_at: new Date().toISOString(),
            last_message_preview: preview,
          },
        },
      });

      // Create or update notification for the recipient (groups messages per conversation)
      if (recipientId && selectedConversation?.id) {
        try {
          // Get sender name from profile (full_name) or email as fallback
          const senderName = user?.full_name || user?.displayName || user?.email?.split('@')[0] || 'Someone';
          const notificationMessage = selectedFile
            ? (selectedFile.type.startsWith('image/') ? `📷 Photo` : `📎 Document`)
            : content.length > 100 ? content.substring(0, 100) + '...' : content;

          // Use createOrUpdateMessageNotification for grouping
          await graphqlNotificationService.createOrUpdateMessageNotification(
            recipientId,
            senderName,
            notificationMessage,
            selectedConversation.id,
            `/messages?conversation=${selectedConversation.id}`
          );
          console.log('[Messages] Notification created/updated for recipient:', recipientId);
        } catch (notifError) {
          // Don't fail the message send if notification creation fails
          console.error('[Messages] Failed to create notification:', notifError);
        }
      }

      setNewMessage('');
      setSelectedFile(null);
      clearTyping();
      refetchMessages();
      refetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete message
  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;

    try {
      await deleteMessageMutation({
        variables: { messageId: deleteMessageId },
      });
      setDeleteMessageId(null);
      setViewerImage(null);
      refetchMessages();
      toast({
        title: 'Message Deleted',
        description: 'The message has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Voice recording
  const handleVoiceRecordingComplete = async (recording) => {
    if (!selectedConversation || !userId) return;

    const otherParticipant = getOtherParticipant(selectedConversation);
    const recipientId = otherParticipant?.id;

    setIsUploadingVoice(true);
    setIsRecordingVoice(false);

    try {
      const uploadResult = await uploadVoice(
        recording.blob,
        userId,
        selectedConversation.id,
        recording.duration,
        recording.waveformData,
        (progress) => console.log('[UnifiedMessagesPage] Voice upload progress:', progress)
      );

      const content = formatVoiceMessage(uploadResult);

      await sendMessageMutation({
        variables: {
          data: {
            conversation_id: selectedConversation.id,
            sender_id: userId,
            recipient_id: recipientId,
            content: content,
            message_type: 'audio',
            is_read: false,
          },
        },
      });

      await updateConversationMutation({
        variables: {
          id: selectedConversation.id,
          data: {
            last_message_at: new Date().toISOString(),
            last_message_preview: '🎤 Voice message',
          },
        },
      });

      refetchMessages();
      refetchConversations();
    } catch (error) {
      console.error('[UnifiedMessagesPage] Voice upload failed:', error);
      const errorMessage = error.message?.includes('Storage bucket')
        ? 'Firebase Storage is not configured. Please contact support.'
        : error.message?.includes('Storage not initialized')
        ? 'Firebase Storage is not available. Please try again later.'
        : 'Failed to send voice message. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingVoice(false);
    }
  };

  // Render message content
  const renderMessageContent = (message, isOwnMessage) => {
    const content = message.content;

    const voiceMessage = parseVoiceMessage(content);
    if (voiceMessage) {
      return (
        <VoicePlayer
          url={voiceMessage.url}
          duration={voiceMessage.duration}
          waveformData={voiceMessage.waveformData}
          isOwn={isOwnMessage}
        />
      );
    }

    const attachment = parseAttachmentMessage(content);
    if (attachment) {
      if (attachment.type === 'image') {
        return (
          <div className="space-y-2">
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setViewerImage({ ...attachment, messageId: message.id })}
            />
            {attachment.caption && (
              <p className={cn('text-sm', isOwnMessage ? 'text-white' : 'text-gray-900')}>
                {attachment.caption}
              </p>
            )}
          </div>
        );
      }
      if (attachment.type === 'document') {
        return (
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
              isOwnMessage ? 'bg-blue-700/50' : 'bg-gray-200'
            )}
            onClick={() => {
              if (window.confirm(`Download "${attachment.fileName}"?`)) {
                downloadFile(attachment.url, attachment.fileName);
              }
            }}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isOwnMessage ? 'bg-blue-600' : 'bg-blue-100'
            )}>
              <FileText className={cn('h-5 w-5', isOwnMessage ? 'text-white' : 'text-blue-600')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium truncate', isOwnMessage ? 'text-white' : 'text-gray-900')}>
                {attachment.fileName}
              </p>
              <p className={cn('text-xs', isOwnMessage ? 'text-blue-200' : 'text-gray-500')}>
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>
            <Download className={cn('h-5 w-5', isOwnMessage ? 'text-blue-200' : 'text-gray-400')} />
          </div>
        );
      }
    }

    const location = parseLocationMessage(content);
    if (location) {
      return (
        <a
          href={location.mapUrl || `https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg',
            isOwnMessage ? 'bg-blue-700/50' : 'bg-gray-200'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isOwnMessage ? 'bg-red-500' : 'bg-red-100'
          )}>
            <MapPin className={cn('h-5 w-5', isOwnMessage ? 'text-white' : 'text-red-600')} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', isOwnMessage ? 'text-white' : 'text-gray-900')}>
              Shared Location
            </p>
            <p className={cn('text-xs truncate', isOwnMessage ? 'text-blue-200' : 'text-gray-500')}>
              {location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
            </p>
          </div>
        </a>
      );
    }

    return (
      <p className={cn('text-sm whitespace-pre-wrap', isOwnMessage ? 'text-white' : 'text-gray-900')}>
        {content}
      </p>
    );
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const preview = conv.last_message_preview || '';
    return preview.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get total unread count
  const totalUnread = conversations.reduce((sum, conv) => {
    const participant = getOtherParticipant(conv);
    return sum + (participant?.unreadCount || 0);
  }, 0);

  // Handle user type selection for new conversation
  const handleUserTypeSelect = (type) => {
    setSelectedUserType(type);
    setShowUserListModal(true);
  };

  // Handle conversation created from modal
  const handleConversationCreated = (conversationId) => {
    refetchConversations();
    const newConv = conversations.find(c => c.id === conversationId);
    if (newConv) {
      setSelectedConversation(newConv);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Please sign in</h3>
        <p className="text-gray-500 mt-1">Sign in to view your messages</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{config.title}</h1>
          <p className="text-gray-500 mt-1">{config.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-sm">
              {totalUnread} unread
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                New Chat
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {config.newChatOptions.map((option) => (
                <DropdownMenuItem
                  key={option.type}
                  onClick={() => handleUserTypeSelect(option.type)}
                  className="cursor-pointer"
                >
                  <option.icon className="h-4 w-4 mr-2" />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchConversations();
              if (selectedConversation) refetchMessages();
            }}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {conversationsLoading && conversations.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : conversationsError ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center">
                    Error loading conversations
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => refetchConversations()}
                  >
                    Try again
                  </Button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title={searchQuery ? 'No conversations found' : 'No conversations yet'}
                  description={searchQuery ? 'Try adjusting your search terms' : 'Start a conversation by messaging someone'}
                  size="small"
                />
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    const unreadCount = otherParticipant?.unreadCount || 0;
                    const isSelected = selectedConversation?.id === conversation.id;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={cn(
                          'p-4 cursor-pointer transition-all hover:bg-gray-50 border-l-4 border-transparent',
                          isSelected && 'bg-blue-100 hover:bg-blue-100 border-l-blue-600',
                          unreadCount > 0 && !isSelected && 'bg-blue-50/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              {otherParticipant?.avatar ? (
                                <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                              ) : null}
                              <AvatarFallback className="bg-blue-600 text-white">
                                {otherParticipant?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                              </AvatarFallback>
                            </Avatar>
                            {otherParticipant?.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  'text-sm font-medium truncate',
                                  unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                )}>
                                  {otherParticipant?.name || 'Someone'}
                                </p>
                                <span className="text-xs text-gray-400 capitalize">
                                  {otherParticipant?.type}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.last_message_at)}
                              </span>
                            </div>
                            <p className={cn(
                              'text-sm truncate mt-1 flex items-center gap-1',
                              unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'
                            )}>
                              {(() => {
                                const preview = conversation.last_message_preview;
                                if (!preview) return 'No messages yet';
                                if (isVoiceMessage(preview)) {
                                  return (
                                    <>
                                      <Mic className="h-3 w-3 flex-shrink-0" />
                                      Voice message
                                    </>
                                  );
                                }
                                return preview;
                              })()}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages View */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <CardHeader className="pb-3 border-b flex-shrink-0">
                {(() => {
                  const chatParticipant = getOtherParticipant(selectedConversation);
                  return (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {chatParticipant?.avatar ? (
                            <AvatarImage src={chatParticipant.avatar} alt={chatParticipant.name} />
                          ) : null}
                          <AvatarFallback className="bg-blue-600 text-white">
                            {chatParticipant?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        {chatParticipant?.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {chatParticipant?.name || 'Someone'}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {isOtherUserTyping ? (
                            <span className="text-blue-600 animate-pulse">typing...</span>
                          ) : chatParticipant?.isOnline ? (
                            <span className="text-green-600">Online</span>
                          ) : (
                            chatParticipant?.type || 'User'
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {messagesLoading && messages.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : messages.length === 0 ? (
                      <EmptyState
                        icon={MessageSquare}
                        title="No messages yet"
                        description="Send a message to start the conversation"
                        size="small"
                      />
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.sender_id === userId;
                          const isAttachment = isAttachmentMessage(message.content);

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                'flex group',
                                isOwnMessage ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div
                                className={cn(
                                  'max-w-[70%] rounded-lg relative',
                                  isAttachment ? 'p-2' : 'px-4 py-2',
                                  isOwnMessage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                )}
                              >
                                {renderMessageContent(message, isOwnMessage)}
                                <div
                                  className={cn(
                                    'flex items-center gap-1 mt-1',
                                    isOwnMessage ? 'justify-end' : 'justify-start'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'text-xs',
                                      isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                                    )}
                                  >
                                    {formatMessageTime(message.created_at)}
                                  </span>
                                  {isOwnMessage && (
                                    message.is_read ? (
                                      <CheckCheck className="h-3 w-3 text-blue-200" />
                                    ) : (
                                      <Check className="h-3 w-3 text-blue-200" />
                                    )
                                  )}
                                </div>

                                {isOwnMessage && (
                                  <button
                                    onClick={() => setDeleteMessageId(message.id)}
                                    className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Upload Progress */}
              {isUploading && (
                <div className="px-4 py-2 border-t bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
              )}

              {/* Selected File Preview */}
              {selectedFile && !isUploading && (
                <div className="px-4 py-2 border-t bg-gray-50">
                  <div className="flex items-center gap-3">
                    {selectedFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={clearSelectedFile}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t flex-shrink-0">
                {isRecordingVoice ? (
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onCancel={() => setIsRecordingVoice(false)}
                    maxDuration={180}
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isUploadingVoice}
                      className="px-3"
                    >
                      <Paperclip className="h-5 w-5 text-gray-500" />
                    </Button>
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={handleTextChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[44px] max-h-[120px] resize-none"
                      rows={1}
                      disabled={isUploading || isUploadingVoice}
                    />

                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(true)}
                      disabled={isUploadingVoice || isUploading}
                      className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
                      title="Record voice message"
                    >
                      {isUploadingVoice ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </button>

                    {(newMessage.trim() || selectedFile) && (
                      <Button
                        onClick={handleSendMessage}
                        disabled={isUploading || isUploadingVoice}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Select a conversation
              </h3>
              <p className="text-gray-500 mt-1 text-center max-w-sm">
                Choose a conversation from the list to view and send messages
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={!!viewerImage} onOpenChange={() => setViewerImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewerImage(null)}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
            {viewerImage && (
              <>
                <img
                  src={viewerImage.url}
                  alt={viewerImage.fileName}
                  className="w-full max-h-[80vh] object-contain"
                />
                {viewerImage.caption && (
                  <div className="absolute bottom-20 left-0 right-0 p-4 bg-black/60 text-white text-center">
                    {viewerImage.caption}
                  </div>
                )}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => downloadFile(viewerImage.url, viewerImage.fileName)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteMessageId(viewerImage.messageId)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User List Modal for New Conversation */}
      <UserListModal
        isOpen={showUserListModal}
        onClose={() => {
          setShowUserListModal(false);
          setSelectedUserType(null);
        }}
        selectedUserType={selectedUserType}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default UnifiedMessagesPage;
