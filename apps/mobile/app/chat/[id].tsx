/**
 * Chat Screen
 *
 * Modern real-time chat with proper keyboard handling,
 * message bubbles, read receipts, online status, emoji picker, and attachments
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../hooks/useAuth';
import { useMessages, Message, getDisplayName, Profile, useOnlineStatus, useTypingIndicator } from '../../hooks/useMessages';
import { useQuery, gql } from '@apollo/client';

// Query to get profile by ID - includes user-type specific names
// Note: maid_profiles uses user_id as key, so we alias it as id for Apollo caching
const GET_PROFILE_BY_ID = gql`
  query GetProfileById($id: String!) {
    profiles_by_pk(id: $id) {
      id
      full_name
      email
      avatar_url
      user_type
      is_online
      last_activity_at
    }
    # Also get name from user-type specific tables
    sponsor_profiles_by_pk(id: $id) {
      id
      full_name
    }
    maid_profiles(where: { user_id: { _eq: $id } }, limit: 1) {
      id: user_id
      user_id
      full_name
      first_name
      last_name
      profile_photo_url
    }
    agency_profiles_by_pk(id: $id) {
      id
      full_name
      logo_url
    }
  }
`;
import {
  uploadImage,
  uploadDocument,
  uploadVoice,
  formatLocationMessage,
  formatAttachmentMessage,
  formatVoiceMessage,
  parseAttachmentMessage,
  parseLocationMessage,
  parseVoiceMessage,
  isAttachmentMessage,
  formatFileSize,
  UploadProgress,
} from '../../utils/fileUpload';
import VoiceRecorder, { VoiceRecordingResult } from '../../components/VoiceRecorder';
import VoicePlayer from '../../components/VoicePlayer';

// Common emoji categories
const EMOJI_CATEGORIES = {
  recent: ['😀', '😂', '❤️', '👍', '🙏', '😊', '🔥', '💯'],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  objects: ['📱', '💻', '🖥️', '📷', '📸', '📹', '🎥', '📞', '☎️', '📺', '📻', '🎙️', '⏰', '⏱️', '💡', '🔦', '📦', '📫', '📝', '✏️', '📌', '📎', '🔑', '🔒'],
  symbols: ['✅', '❌', '❓', '❗', '💯', '🔥', '⭐', '💫', '✨', '🎉', '🎊', '🎁', '🏆', '🥇', '🎯', '💪', '👀', '💬', '💭', '🗯️'],
};

type EmojiCategory = keyof typeof EMOJI_CATEGORIES;

const GET_CONVERSATION_DETAILS = gql`
  query GetConversationDetails($id: uuid!) {
    conversations_by_pk(id: $id) {
      id
      participant1_id
      participant1_type
      participant2_id
      participant2_type
      status
      last_message_at
      created_at
    }
  }
`;

// Avatar colors
const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#0EA5E9', '#3B82F6',
];

const getAvatarColor = (name: string): string => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

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

// Get status text (Online or Last seen X ago)
const getStatusText = (profile?: { is_online?: boolean; last_activity_at?: string; user_type?: string } | null, userType?: string): string => {
  if (!profile) return userType?.charAt(0).toUpperCase() + (userType?.slice(1) || '') || 'User';

  // Check if online
  if (isUserOnline(profile)) return 'Online';

  // Show last seen time
  if (profile.last_activity_at) {
    const lastSeenDate = new Date(profile.last_activity_at);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Last seen just now';
    if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays} days ago`;
    return `Last seen ${lastSeenDate.toLocaleDateString()}`;
  }

  return userType?.charAt(0).toUpperCase() + (userType?.slice(1) || '') || 'Offline';
};

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<EmojiCategory>('recent');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ url: string; caption?: string; messageId: string } | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingResult | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // Track user's online status - updates is_online and last_activity_at
  const { updateActivity } = useOnlineStatus();

  // Animated value for keyboard height
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  const {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    deleteMessage,
    loadMore,
    hasMore,
  } = useMessages({
    conversationId: conversationId || '',
    enableSubscription: true,
  });

  const { data: conversationData } = useQuery(GET_CONVERSATION_DETAILS, {
    variables: { id: conversationId },
    skip: !conversationId,
  });

  // Keyboard listeners with animation
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      // On Android, we need the full keyboard height
      // On iOS, subtract the bottom inset to avoid double padding
      const targetHeight = Platform.OS === 'ios'
        ? e.endCoordinates.height - insets.bottom
        : e.endCoordinates.height;

      Animated.timing(keyboardHeight, {
        toValue: targetHeight,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [insets.bottom]);

  // Mark messages as read when opening the conversation
  useEffect(() => {
    if (conversationId && isAuthenticated) {
      markAsRead();
    }
  }, [conversationId, isAuthenticated, markAsRead]);

  // Get other participant info - check both Firebase UID and legacy profile_id
  const myFirebaseUid = user?.uid;
  const myLegacyProfileId = (user as any)?.profile_id;
  const conversation = conversationData?.conversations_by_pk;

  // Check if current user is participant1 (by either Firebase UID or legacy profile ID)
  const isCurrentUserParticipant1 = conversation && (
    conversation.participant1_id === myFirebaseUid ||
    conversation.participant1_id === myLegacyProfileId
  );

  const otherParticipantId = conversation
    ? isCurrentUserParticipant1
      ? conversation.participant2_id
      : conversation.participant1_id
    : null;
  const otherParticipantType = conversation
    ? isCurrentUserParticipant1
      ? conversation.participant2_type || 'user'
      : conversation.participant1_type || 'user'
    : 'user';

  // Fetch other participant's profile with polling for online status updates
  const { data: profileData } = useQuery(GET_PROFILE_BY_ID, {
    variables: { id: otherParticipantId },
    skip: !otherParticipantId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000, // Poll every 30 seconds for online status updates
  });

  // Fetch current user's profile to get their full_name for notifications
  const currentUserId = myFirebaseUid || myLegacyProfileId;
  const { data: myProfileData } = useQuery(GET_PROFILE_BY_ID, {
    variables: { id: currentUserId },
    skip: !currentUserId,
    fetchPolicy: 'cache-first', // Cache first since our own name doesn't change often
  });

  // Build current user's display name from profile data
  const getMyDisplayName = (): string => {
    // Check user-type specific profiles first
    if (myProfileData?.sponsor_profiles_by_pk?.full_name) {
      return myProfileData.sponsor_profiles_by_pk.full_name;
    }
    const myMaidProfile = myProfileData?.maid_profiles?.[0];
    if (myMaidProfile?.full_name) {
      return myMaidProfile.full_name;
    }
    if (myMaidProfile?.first_name || myMaidProfile?.last_name) {
      return [myMaidProfile.first_name, myMaidProfile.last_name].filter(Boolean).join(' ');
    }
    if (myProfileData?.agency_profiles_by_pk?.full_name) {
      return myProfileData.agency_profiles_by_pk.full_name;
    }
    // Fall back to base profile
    if (myProfileData?.profiles_by_pk?.full_name) {
      return myProfileData.profiles_by_pk.full_name;
    }
    // Last resort: Firebase displayName or email
    return user?.displayName || user?.email?.split('@')[0] || 'Someone';
  };

  // Build profile with name from user-type specific tables
  const buildProfileWithName = (): Profile | null => {
    const baseProfile = profileData?.profiles_by_pk;
    if (!baseProfile) return null;

    let displayName = baseProfile.full_name;

    // Check sponsor_profiles
    if (profileData?.sponsor_profiles_by_pk?.full_name) {
      displayName = profileData.sponsor_profiles_by_pk.full_name;
    }

    // Check maid_profiles (returns array)
    let avatarUrl = baseProfile.avatar_url;
    const maidProfile = profileData?.maid_profiles?.[0];
    if (maidProfile) {
      if (maidProfile.full_name) {
        displayName = maidProfile.full_name;
      } else if (maidProfile.first_name || maidProfile.last_name) {
        const parts = [maidProfile.first_name, maidProfile.last_name].filter(Boolean);
        if (parts.length > 0) {
          displayName = parts.join(' ');
        }
      }
      // Merge profile_photo_url into avatar_url
      if (maidProfile.profile_photo_url) {
        avatarUrl = maidProfile.profile_photo_url;
      }
    }

    // Check agency_profiles
    if (profileData?.agency_profiles_by_pk?.full_name) {
      displayName = profileData.agency_profiles_by_pk.full_name;
    }
    // Merge agency logo_url into avatar_url
    if (profileData?.agency_profiles_by_pk?.logo_url) {
      avatarUrl = profileData.agency_profiles_by_pk.logo_url;
    }

    return {
      ...baseProfile,
      full_name: displayName || baseProfile.full_name,
      avatar_url: avatarUrl,
    } as Profile;
  };

  const otherParticipant = {
    id: otherParticipantId,
    type: otherParticipantType,
    profile: buildProfileWithName(),
  };

  // Typing indicator
  const { isOtherUserTyping, onTextChange, clearTyping } = useTypingIndicator({
    conversationId: conversationId || '',
    otherParticipantId: otherParticipantId || '',
  });

  // Check if user is online and get status text
  const online = isUserOnline(otherParticipant.profile);
  const baseStatusText = getStatusText(otherParticipant.profile, otherParticipant.type);
  // Show "typing..." if other user is typing, otherwise show normal status
  const statusText = isOtherUserTyping ? 'typing...' : baseStatusText;

  const handleSend = useCallback(async () => {
    // Allow sending if there's text, image, or document
    const hasContent = messageText.trim() || selectedImage || selectedDocument;
    if (!hasContent || sending || isUploading || !otherParticipant?.id || !user?.uid || !conversationId) {
      return;
    }

    setSending(true);

    // Only set uploading if we have an attachment
    const hasAttachment = selectedImage || selectedDocument;
    if (hasAttachment) {
      setIsUploading(true);
      setUploadProgress(0);
    }

    try {
      let content = messageText.trim();

      // Handle image upload
      if (selectedImage) {
        try {
          console.log('[Chat] Uploading image...');
          const uploadResult = await uploadImage(
            selectedImage,
            user.uid,
            conversationId,
            (progress) => setUploadProgress(progress.progress)
          );
          content = formatAttachmentMessage(uploadResult, content);
          console.log('[Chat] Image uploaded successfully');
        } catch (uploadError) {
          console.error('[Chat] Image upload failed:', uploadError);
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
          setSending(false);
          setIsUploading(false);
          return;
        }
      }

      // Handle document upload
      if (selectedDocument) {
        try {
          console.log('[Chat] Uploading document...');
          const uploadResult = await uploadDocument(
            selectedDocument.uri,
            selectedDocument.name,
            selectedDocument.mimeType,
            user.uid,
            conversationId,
            (progress) => setUploadProgress(progress.progress)
          );
          content = formatAttachmentMessage(uploadResult, content);
          console.log('[Chat] Document uploaded successfully');
        } catch (uploadError) {
          console.error('[Chat] Document upload failed:', uploadError);
          Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
          setSending(false);
          setIsUploading(false);
          return;
        }
      }

      console.log('[Chat] Sending message:', content.substring(0, 50) + '...');
      // Pass sender name for notification (using profile data)
      const senderName = getMyDisplayName();
      const result = await sendMessage(content, otherParticipant.id, senderName);
      console.log('[Chat] Message sent result:', result);
      if (result) {
        setMessageText('');
        setSelectedImage(null);
        setSelectedDocument(null);
        // Update online status when message is sent
        updateActivity();
        // Clear typing indicator
        clearTyping();
      }
    } catch (error) {
      console.error('[Chat] Send message error:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [messageText, selectedImage, selectedDocument, sending, isUploading, otherParticipant?.id, user?.uid, conversationId, sendMessage, updateActivity, clearTyping]);

  // Voice message handler
  const handleSendVoice = useCallback(async (recording: VoiceRecordingResult) => {
    if (!user?.uid || !conversationId || !otherParticipant?.id) {
      console.error('[Chat] Missing required data for voice message');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setVoiceRecording(null);

    try {
      console.log('[Chat] Uploading voice message...', {
        duration: recording.duration,
        waveformLength: recording.waveformData.length,
      });

      const uploadResult = await uploadVoice(
        recording.uri,
        user.uid,
        conversationId,
        recording.duration,
        recording.waveformData,
        (progress) => setUploadProgress(progress.progress)
      );

      const content = formatVoiceMessage(uploadResult);
      console.log('[Chat] Voice uploaded, sending message...');

      console.log('[Chat] Voice message content to send:', content.substring(0, 100));
      // Pass sender name for notification (using profile data)
      const senderName = getMyDisplayName();
      const result = await sendMessage(content, otherParticipant.id, senderName);
      console.log('[Chat] Voice sendMessage result:', result);
      if (result) {
        console.log('[Chat] Voice message sent successfully, ID:', result.id);
        updateActivity();
        clearTyping();
      } else {
        console.error('[Chat] Voice message send returned null');
      }
    } catch (error) {
      console.error('[Chat] Voice message failed:', error);
      Alert.alert('Upload Failed', 'Failed to send voice message. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setIsRecordingVoice(false);
    }
  }, [user?.uid, conversationId, otherParticipant?.id, sendMessage, updateActivity, clearTyping]);

  // Emoji handlers
  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessageText(prev => prev + emoji);
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
      setShowAttachmentMenu(false);
    }
  }, [showEmojiPicker]);

  // Attachment handlers
  const toggleAttachmentMenu = useCallback(() => {
    setShowAttachmentMenu(prev => !prev);
    setShowEmojiPicker(false);
  }, []);

  const requestPermission = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const pickImage = useCallback(() => {
    setShowAttachmentMenu(false);

    setTimeout(async () => {
      try {
        const hasPermission = await requestPermission('library');
        if (!hasPermission) {
          Alert.alert('Permission Required', 'Please grant access to your photo library.');
          return;
        }

        console.log('[Chat] Opening image library...');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          exif: false, // Reduce file size
          base64: false,
        });
        console.log('[Chat] Image library result:', result.canceled ? 'canceled' : 'selected');

        if (!result.canceled && result.assets?.[0]) {
          console.log('[Chat] Selected image URI:', result.assets[0].uri);
          setSelectedImage(result.assets[0].uri);
        }
      } catch (error) {
        console.error('[Chat] Pick image error:', error);
      }
    }, 500);
  }, []);

  const takePhoto = useCallback(() => {
    setShowAttachmentMenu(false);

    setTimeout(async () => {
      try {
        const hasPermission = await requestPermission('camera');
        if (!hasPermission) {
          Alert.alert('Permission Required', 'Please grant camera access.');
          return;
        }

        console.log('[Chat] Opening camera...');
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          exif: false,
          base64: false,
        });
        console.log('[Chat] Camera result:', result.canceled ? 'canceled' : 'selected');

        if (!result.canceled && result.assets?.[0]) {
          console.log('[Chat] Captured photo URI:', result.assets[0].uri);
          setSelectedImage(result.assets[0].uri);
        }
      } catch (error) {
        console.error('[Chat] Take photo error:', error);
      }
    }, 500);
  }, []);

  const pickDocument = useCallback(() => {
    setShowAttachmentMenu(false);

    setTimeout(async () => {
      try {
        console.log('[Chat] Opening document picker...');
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        console.log('[Chat] Document picker result:', result.canceled ? 'canceled' : 'selected');

        if (!result.canceled && result.assets?.[0]) {
          const doc = result.assets[0];
          setSelectedDocument({
            uri: doc.uri,
            name: doc.name,
            mimeType: doc.mimeType || 'application/octet-stream',
          });
          setSelectedImage(null);
        }
      } catch (error) {
        console.error('[Chat] Document picker error:', error);
      }
    }, 500);
  }, []);

  const shareLocation = useCallback(() => {
    setShowAttachmentMenu(false);

    setTimeout(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant location access.');
          return;
        }

        setSending(true);

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        let address: string | undefined;
        try {
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (geocode) {
            const parts = [geocode.street, geocode.city, geocode.region, geocode.country].filter(Boolean);
            address = parts.join(', ');
          }
        } catch (geocodeError) {
          console.warn('[Chat] Geocoding failed:', geocodeError);
        }

        const locationMessage = formatLocationMessage({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address,
        });

        if (otherParticipant?.id) {
          // Pass sender name for notification (using profile data)
          const senderName = getMyDisplayName();
          await sendMessage(locationMessage, otherParticipant.id, senderName);
        }
      } catch (error) {
        console.error('[Chat] Location sharing error:', error);
        Alert.alert('Error', 'Failed to get your location.');
      } finally {
        setSending(false);
      }
    }, 300);
  }, [otherParticipant?.id, sendMessage]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Save image to device gallery
  const handleSaveImage = useCallback(async (url: string) => {
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to save images to your gallery.');
        return;
      }

      // Show loading
      Alert.alert('Saving...', 'Downloading image to your gallery');

      // Download the image to a local file
      const fileName = `image_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('Ethiopian Maids', asset, false);

        Alert.alert('Saved!', 'Image saved to your gallery');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('[Chat] Save image error:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  }, []);

  // Download and save document
  const handleDownloadDocument = useCallback(async (url: string, fileName: string) => {
    try {
      // Show loading
      Alert.alert('Downloading...', `Downloading "${fileName}"`);

      // Download the file
      const fileUri = FileSystem.documentDirectory + fileName;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        // Check if sharing is available
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          // Open share sheet to save/open the document
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: downloadResult.headers['content-type'] || 'application/octet-stream',
            dialogTitle: `Save ${fileName}`,
          });
        } else {
          Alert.alert('Downloaded!', `File saved to: ${fileUri}`);
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('[Chat] Download document error:', error);
      Alert.alert('Error', 'Failed to download document. Please try again.');
    }
  }, []);

  // Handle delete message
  const handleDeleteMessage = useCallback((messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMessage(messageId);
            setViewerImage(null); // Close viewer if open
          },
        },
      ]
    );
  }, [deleteMessage]);

  // Show document options (Download & Save, Delete)
  const handleDocumentOptions = useCallback((url: string, fileName: string, messageId: string) => {
    Alert.alert(
      fileName,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download & Save', onPress: () => handleDownloadDocument(url, fileName) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(messageId) },
      ]
    );
  }, [handleDownloadDocument, handleDeleteMessage]);

  // Render attachment content (image, document, location, or voice)
  const renderAttachmentContent = (content: string, isOwnMessage: boolean, messageId: string) => {
    // Check for voice message first
    try {
      const voiceMessage = parseVoiceMessage(content);
      if (voiceMessage) {
        console.log('[Chat] Rendering voice message:', {
          url: voiceMessage.url?.substring(0, 80),
          duration: voiceMessage.duration,
          hasWaveform: voiceMessage.waveformData?.length > 0,
          platform: Platform.OS,
        });

        // Check if URL is valid
        if (!voiceMessage.url) {
          console.error('[Chat] Voice message has no URL!');
          return <Text style={styles.messageText}>Voice message (no URL)</Text>;
        }

        return (
          <VoicePlayer
            uri={voiceMessage.url}
            duration={voiceMessage.duration}
            waveformData={voiceMessage.waveformData}
            isOwnMessage={isOwnMessage}
          />
        );
      }
    } catch (e) {
      console.error('[Chat] Error rendering voice message:', e);
    }

    // Check for image/document attachment
    const attachment = parseAttachmentMessage(content);
    if (attachment) {
      if (attachment.type === 'image') {
        return (
          <TouchableOpacity
            onPress={() => setViewerImage({ url: attachment.url, caption: attachment.caption, messageId })}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: attachment.url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {attachment.caption && (
              <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText, { marginTop: 8 }]}>
                {attachment.caption}
              </Text>
            )}
          </TouchableOpacity>
        );
      }
      if (attachment.type === 'document') {
        return (
          <TouchableOpacity
            style={styles.documentAttachment}
            onPress={() => handleDocumentOptions(attachment.url, attachment.fileName, messageId)}
            activeOpacity={0.7}
          >
            <View style={[styles.documentIcon, isOwnMessage && styles.documentIconOwn]}>
              <Ionicons name="document-text" size={24} color={isOwnMessage ? '#fff' : '#1E40AF'} />
            </View>
            <View style={styles.documentInfo}>
              <Text style={[styles.documentName, isOwnMessage && styles.ownMessageText]} numberOfLines={1}>
                {attachment.fileName}
              </Text>
              <Text style={[styles.documentSize, isOwnMessage && styles.documentSizeOwn]}>
                {formatFileSize(attachment.fileSize)}
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={isOwnMessage ? 'rgba(255,255,255,0.7)' : '#64748B'} />
          </TouchableOpacity>
        );
      }
    }

    // Check for location
    const location = parseLocationMessage(content);
    if (location) {
      return (
        <TouchableOpacity
          style={styles.locationAttachment}
          onPress={() => Linking.openURL(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`)}
          activeOpacity={0.7}
        >
          <View style={[styles.locationIcon, isOwnMessage && styles.locationIconOwn]}>
            <Ionicons name="location" size={24} color={isOwnMessage ? '#fff' : '#EF4444'} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={[styles.locationTitle, isOwnMessage && styles.ownMessageText]}>
              Shared Location
            </Text>
            <Text style={[styles.locationAddress, isOwnMessage && styles.locationAddressOwn]} numberOfLines={2}>
              {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </Text>
          </View>
          <Ionicons name="open-outline" size={18} color={isOwnMessage ? 'rgba(255,255,255,0.7)' : '#64748B'} />
        </TouchableOpacity>
      );
    }

    // Regular text message
    return (
      <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
        {content}
      </Text>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Check if message is from current user (by either Firebase UID or legacy profile ID)
    const isOwnMessage = item.sender_id === myFirebaseUid || item.sender_id === myLegacyProfileId;
    const showDateHeader =
      index === messages.length - 1 ||
      new Date(messages[index + 1]?.created_at).toDateString() !==
        new Date(item.created_at).toDateString();

    // Determine if this is an attachment message for styling
    const isAttachment = isAttachmentMessage(item.content);

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <View style={styles.dateHeaderBadge}>
              <Text style={styles.dateHeaderText}>{formatDateHeader(item.created_at)}</Text>
            </View>
          </View>
        )}
        <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            isAttachment && styles.attachmentBubble
          ]}>
            {renderAttachmentContent(item.content, isOwnMessage, item.id)}
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
                {formatTime(item.created_at)}
              </Text>
              {isOwnMessage && (
                <View style={styles.readStatus}>
                  <Ionicons
                    name={item.is_read ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color={item.is_read ? '#60A5FA' : 'rgba(255,255,255,0.6)'}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  const displayName = getDisplayName(otherParticipant.profile, otherParticipant.id);
  const avatarColor = getAvatarColor(displayName);
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
        <View style={[styles.safeAreaTop, { height: insets.top }]} />
        <View style={styles.center}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#1E40AF" />
          </View>
          <Text style={styles.emptyTitle}>Sign in required</Text>
          <Text style={styles.emptySubtext}>Please sign in to view messages</Text>
        </View>
      </View>
    );
  }

  // Wrapper component - KeyboardAvoidingView for Android, regular View for iOS
  const ContainerComponent = Platform.OS === 'android' ? KeyboardAvoidingView : View;
  const containerProps = Platform.OS === 'android'
    ? { behavior: 'height' as const, keyboardVerticalOffset: 0 }
    : {};

  return (
    <ContainerComponent style={styles.container} {...containerProps}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      {/* Safe Area Top */}
      <View style={[styles.safeAreaTop, { height: insets.top }]} />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerProfile} activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            {otherParticipant?.profile?.avatar_url ? (
              <Image
                source={{ uri: otherParticipant.profile.avatar_url }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={[styles.headerAvatarPlaceholder, { backgroundColor: avatarColor }]}>
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </View>
            )}
            {online && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.statusContainer}>
              {isOtherUserTyping ? (
                <>
                  <View style={styles.typingDot} />
                  <Text style={styles.headerStatusTyping}>{statusText}</Text>
                </>
              ) : (
                <>
                  {online && <View style={styles.statusDot} />}
                  <Text style={[styles.headerStatus, online && styles.headerStatusOnline]}>
                    {statusText}
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="call-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Area */}
      <View style={styles.chatArea}>
        {loading && messages.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="cloud-offline" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorSubtext}>Unable to load messages</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <View style={styles.emptyMessagesIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={56} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyMessagesTitle}>Start the conversation</Text>
                <Text style={styles.emptyMessagesSubtext}>
                  Send a message to begin chatting
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop - tap to close */}
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowAttachmentMenu(false)}
          />
          {/* Menu content - doesn't close on tap */}
          <View style={[styles.attachmentMenu, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.attachmentMenuHandle} />
            <Text style={styles.attachmentMenuTitle}>Share</Text>

            <View style={styles.attachmentOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.attachmentOption,
                  pressed && styles.attachmentOptionPressed
                ]}
                onPress={() => {
                  console.log('[Chat] Camera button pressed');
                  takePhoto();
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: '#EF4444' }]}>
                  <Ionicons name="camera" size={28} color="#fff" />
                </View>
                <Text style={styles.attachmentOptionText}>Camera</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.attachmentOption,
                  pressed && styles.attachmentOptionPressed
                ]}
                onPress={() => {
                  console.log('[Chat] Gallery button pressed');
                  pickImage();
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="images" size={28} color="#fff" />
                </View>
                <Text style={styles.attachmentOptionText}>Gallery</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.attachmentOption,
                  pressed && styles.attachmentOptionPressed
                ]}
                onPress={() => {
                  console.log('[Chat] Document button pressed');
                  pickDocument();
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: '#3B82F6' }]}>
                  <Ionicons name="document" size={28} color="#fff" />
                </View>
                <Text style={styles.attachmentOptionText}>Document</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.attachmentOption,
                  pressed && styles.attachmentOptionPressed
                ]}
                onPress={() => {
                  console.log('[Chat] Location button pressed');
                  shareLocation();
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="location" size={28} color="#fff" />
                </View>
                <Text style={styles.attachmentOptionText}>Location</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.attachmentCancelButton,
                pressed && styles.attachmentCancelButtonPressed
              ]}
              onPress={() => setShowAttachmentMenu(false)}
            >
              <Text style={styles.attachmentCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={!!viewerImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
        statusBarTranslucent
      >
        <View style={styles.imageViewerContainer}>
          {/* Background overlay with tap to close */}
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setViewerImage(null)}
          />

          {/* Close button */}
          <TouchableOpacity
            style={[styles.imageViewerCloseButton, { top: insets.top + 10 }]}
            onPress={() => setViewerImage(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Image */}
          {viewerImage && (
            <View style={styles.imageViewerContent}>
              <Image
                source={{ uri: viewerImage.url }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              {viewerImage.caption && (
                <View style={[styles.imageViewerCaption, { paddingBottom: insets.bottom + 20 }]}>
                  <Text style={styles.imageViewerCaptionText}>{viewerImage.caption}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={[styles.imageViewerActions, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.imageViewerActionButton}
              onPress={() => {
                if (viewerImage) {
                  handleSaveImage(viewerImage.url);
                }
              }}
            >
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.imageViewerActionText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageViewerActionButton}
              onPress={() => {
                if (viewerImage) {
                  handleDeleteMessage(viewerImage.messageId);
                }
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.imageViewerActionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Progress */}
      {isUploading && (
        <View style={styles.uploadProgressContainer}>
          <View style={styles.uploadProgressBar}>
            <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
          </View>
          <Text style={styles.uploadProgressText}>Uploading... {Math.round(uploadProgress)}%</Text>
        </View>
      )}

      {/* Selected Image Preview */}
      {selectedImage && !isUploading && (
        <View style={styles.imagePreviewContainer}>
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.imagePreviewText}>Image ready to send</Text>
        </View>
      )}

      {/* Selected Document Preview */}
      {selectedDocument && !isUploading && (
        <View style={styles.documentPreviewContainer}>
          <View style={styles.documentPreviewIcon}>
            <Ionicons name="document-text" size={28} color="#1E40AF" />
          </View>
          <View style={styles.documentPreviewInfo}>
            <Text style={styles.documentPreviewName} numberOfLines={1}>
              {selectedDocument.name}
            </Text>
            <Text style={styles.documentPreviewType}>
              {selectedDocument.mimeType.split('/')[1]?.toUpperCase() || 'Document'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeDocumentButton}
            onPress={() => setSelectedDocument(null)}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            paddingBottom: showEmojiPicker ? 0 : Math.max(insets.bottom, 12),
            // Only use animated margin on iOS, Android uses KeyboardAvoidingView
            marginBottom: Platform.OS === 'ios' && !showEmojiPicker ? keyboardHeight : 0,
          }
        ]}
      >
        {/* Voice Recorder UI */}
        {isRecordingVoice ? (
          <VoiceRecorder
            onRecordingComplete={handleSendVoice}
            onCancel={() => setIsRecordingVoice(false)}
            maxDuration={180}
          />
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={toggleAttachmentMenu}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add-circle-outline" size={26} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.inputFieldContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={messageText}
                onChangeText={(text) => {
                  setMessageText(text);
                  // Trigger typing indicator when user types
                  if (text.length > 0) {
                    onTextChange();
                  }
                }}
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={1000}
                returnKeyType="default"
                onFocus={() => {
                  setShowEmojiPicker(false);
                  // Scroll to bottom when input is focused
                  setTimeout(() => {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                  }, 150);
                }}
              />
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={toggleEmojiPicker}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showEmojiPicker ? 'keypad-outline' : 'happy-outline'}
                  size={24}
                  color={showEmojiPicker ? '#1E40AF' : '#94A3B8'}
                />
              </TouchableOpacity>
            </View>

            {/* Show mic button when no content, send button when there's content */}
            {!messageText.trim() && !selectedImage && !selectedDocument ? (
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={() => setIsRecordingVoice(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isUploading}
              >
                <Ionicons name="mic" size={22} color="#1E40AF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (sending || isUploading) ? styles.sendButtonDisabled : null,
                ]}
                onPress={handleSend}
                disabled={sending || isUploading}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {sending || isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name={selectedImage ? 'image' : selectedDocument ? 'document' : 'send'}
                    size={20}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Emoji Picker Panel */}
        {showEmojiPicker && (
          <View style={[styles.emojiPickerContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.emojiCategoryTabs}
              contentContainerStyle={styles.emojiCategoryTabsContent}
            >
              {(Object.keys(EMOJI_CATEGORIES) as EmojiCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.emojiCategoryTab,
                    selectedEmojiCategory === category && styles.emojiCategoryTabActive
                  ]}
                  onPress={() => setSelectedEmojiCategory(category)}
                >
                  <Text style={[
                    styles.emojiCategoryTabText,
                    selectedEmojiCategory === category && styles.emojiCategoryTabTextActive
                  ]}>
                    {category === 'recent' ? '🕐' :
                     category === 'smileys' ? '😀' :
                     category === 'gestures' ? '👋' :
                     category === 'hearts' ? '❤️' :
                     category === 'objects' ? '📱' : '✅'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Emoji Grid */}
            <ScrollView style={styles.emojiGrid} showsVerticalScrollIndicator={false}>
              <View style={styles.emojiGridContent}>
                {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, index) => (
                  <TouchableOpacity
                    key={`${emoji}-${index}`}
                    style={styles.emojiItem}
                    onPress={() => handleEmojiSelect(emoji)}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </Animated.View>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeAreaTop: {
    backgroundColor: '#1E40AF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 5,
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  headerStatusOnline: {
    color: '#4ADE80',
  },
  headerStatusTyping: {
    fontSize: 12,
    color: '#60A5FA',
    fontStyle: 'italic',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    padding: 8,
    marginLeft: 4,
  },
  chatArea: {
    flex: 1,
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateHeaderBadge: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#1E40AF',
    borderBottomRightRadius: 6,
    marginLeft: 40,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    marginRight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingBubble: {
    opacity: 0.7,
  },
  failedBubble: {
    opacity: 0.8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  messageText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 21,
  },
  ownMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  readStatus: {
    marginLeft: 2,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  attachButton: {
    padding: 6,
    marginBottom: 4,
  },
  inputFieldContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 12,
    maxHeight: 120,
  },
  emojiButton: {
    padding: 8,
    marginBottom: 2,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  voiceButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    transform: [{ scaleY: -1 }], // Flip because list is inverted
  },
  emptyMessagesIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyMessagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#94A3B8',
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
  },
  // Attachment Menu Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  attachmentMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  attachmentMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  attachmentMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  attachmentOption: {
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  attachmentOptionPressed: {
    opacity: 0.6,
  },
  attachmentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentOptionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  attachmentCancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
  },
  attachmentCancelButtonPressed: {
    backgroundColor: '#E2E8F0',
  },
  attachmentCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  // Image Preview Styles
  imagePreviewContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 2,
  },
  imagePreviewText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  // Emoji Picker Styles
  emojiPickerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  emojiCategoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  emojiCategoryTabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  emojiCategoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  emojiCategoryTabActive: {
    backgroundColor: '#1E40AF',
  },
  emojiCategoryTabText: {
    fontSize: 20,
  },
  emojiCategoryTabTextActive: {
    opacity: 1,
  },
  emojiGrid: {
    height: 220,
  },
  emojiGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  emojiItem: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  // Attachment Message Styles
  attachmentBubble: {
    padding: 8,
  },
  messageImage: {
    width: 220,
    height: 165,
    borderRadius: 12,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 200,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentIconOwn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    color: '#64748B',
  },
  documentSizeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  locationAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 200,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconOwn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#64748B',
  },
  locationAddressOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Upload Progress Styles
  uploadProgressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  uploadProgressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 3,
  },
  uploadProgressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  // Document Preview Styles
  documentPreviewContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentPreviewIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentPreviewInfo: {
    flex: 1,
  },
  documentPreviewName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  documentPreviewType: {
    fontSize: 12,
    color: '#64748B',
  },
  removeDocumentButton: {
    padding: 4,
  },
  // Fullscreen Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  imageViewerCaption: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  imageViewerCaptionText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
  },
  imageViewerActions: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  imageViewerActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  imageViewerActionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
});
