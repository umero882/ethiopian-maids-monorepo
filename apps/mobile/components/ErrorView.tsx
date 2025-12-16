/**
 * ErrorView Component
 *
 * Displays user-friendly error messages with retry functionality.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorViewProps {
  error?: Error | string | null;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorView({
  error,
  message,
  onRetry,
  fullScreen = true
}: ErrorViewProps) {
  const errorMessage = message || getErrorMessage(error);

  const content = (
    <>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>{errorMessage}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return <View style={styles.container}>{content}</View>;
}

function getErrorMessage(error?: Error | string | null): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  if (typeof error === 'string') return error;

  // Handle common error types
  const message = error.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes('forbidden') || message.includes('403')) {
    return 'You do not have permission to access this resource.';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'The requested resource was not found.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}

// Inline error banner for forms
export function ErrorBanner({ error, onDismiss }: { error?: string | null; onDismiss?: () => void }) {
  if (!error) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="warning-outline" size={20} color="#DC2626" />
      <Text style={styles.bannerText}>{error}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons name="close-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
});
