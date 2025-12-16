/**
 * EmptyState Component
 *
 * Displays when a list or view has no data to show.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color="#D1D5DB" />
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Pre-built empty states
export function NoMaidsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon="people-outline"
      title="No maids found"
      description="Try adjusting your search filters or check back later."
      actionLabel={onReset ? 'Clear Filters' : undefined}
      onAction={onReset}
    />
  );
}

export function NoJobsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon="briefcase-outline"
      title="No jobs available"
      description="No job postings match your criteria at the moment."
      actionLabel={onReset ? 'Clear Filters' : undefined}
      onAction={onReset}
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon="notifications-outline"
      title="No notifications"
      description="You're all caught up! Check back later for updates."
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon="chatbubbles-outline"
      title="No messages yet"
      description="Start a conversation with a maid or employer."
    />
  );
}

export function NoFavorites({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon="heart-outline"
      title="No favorites yet"
      description="Save maids you're interested in by tapping the heart icon."
      actionLabel={onBrowse ? 'Browse Maids' : undefined}
      onAction={onBrowse}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  button: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
