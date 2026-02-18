/**
 * Draft Recovery Modal Component
 *
 * Prompts user to resume their saved onboarding draft.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserType } from '../../context/OnboardingContext';

/**
 * Format timestamp for display
 */
const formatDraftTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};

/**
 * Get user type display label
 */
const getUserTypeLabel = (userType: UserType | null): string => {
  switch (userType) {
    case 'maid':
      return 'Domestic Worker';
    case 'sponsor':
      return 'Family / Sponsor';
    case 'agency':
      return 'Recruitment Agency';
    default:
      return 'Unknown';
  }
};

interface DraftRecoveryModalProps {
  visible: boolean;
  userType: UserType | null;
  timestamp: number | null;
  daysRemaining: number | null;
  onResume: () => void;
  onStartFresh: () => void;
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export default function DraftRecoveryModal({
  visible,
  userType,
  timestamp,
  daysRemaining,
  onResume,
  onStartFresh,
  onDismiss,
}: DraftRecoveryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={40} color="#1E40AF" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Continue Where You Left Off?</Text>

          {/* Description */}
          <Text style={styles.description}>
            We found a saved draft from your previous session.
          </Text>

          {/* Draft info */}
          <View style={styles.draftInfo}>
            {userType && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{getUserTypeLabel(userType)}</Text>
              </View>
            )}
            {timestamp && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{formatDraftTimestamp(timestamp)}</Text>
              </View>
            )}
            {daysRemaining !== null && (
              <View style={styles.infoRow}>
                <Ionicons name="hourglass-outline" size={16} color="#F59E0B" />
                <Text style={styles.infoTextWarning}>
                  Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.resumeButton} onPress={onResume}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.resumeText}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.freshButton} onPress={onStartFresh}>
              <Ionicons name="refresh" size={20} color="#6B7280" />
              <Text style={styles.freshText}>Start Fresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: Math.min(width - 48, 400),
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  draftInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  infoTextWarning: {
    fontSize: 14,
    color: '#D97706',
    marginLeft: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  resumeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  freshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  freshText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
});
