/**
 * Step Navigation Component
 *
 * Navigation buttons for onboarding steps.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface StepNavigationProps {
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextLabel?: string;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}

export default function StepNavigation({
  canGoBack = true,
  canGoNext = true,
  nextLabel = 'Continue',
  onNext,
  onBack,
  isLoading = false,
  skipLabel,
  onSkip,
}: StepNavigationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {canGoBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !canGoNext && styles.nextButtonDisabled,
            isLoading && styles.nextButtonLoading,
          ]}
          onPress={onNext}
          disabled={!canGoNext || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.nextText}>{nextLabel}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {skipLabel && onSkip && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipText}>{skipLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  placeholder: {
    width: 80,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonLoading: {
    paddingHorizontal: 32,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
