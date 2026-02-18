/**
 * Onboarding Layout Component
 *
 * Provides consistent layout for onboarding screens with progress bar,
 * gamification badge, and navigation controls.
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../context/OnboardingContext';
import { USER_TYPE_THEMES } from '../../data/onboardingConfig';
import ProgressBar from './ProgressBar';
import GamificationBadge from './GamificationBadge';
import StepNavigation from './StepNavigation';

interface OnboardingLayoutProps {
  children: ReactNode;
  showProgress?: boolean;
  showGamification?: boolean;
  showNavigation?: boolean;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextLabel?: string;
  onNext?: () => void | Promise<void>;
  onBack?: () => void;
  isNextLoading?: boolean;
  scrollable?: boolean;
  gradientBackground?: boolean;
}

export default function OnboardingLayout({
  children,
  showProgress = true,
  showGamification = true,
  showNavigation = true,
  canGoBack = true,
  canGoNext = true,
  nextLabel,
  onNext,
  onBack,
  isNextLoading = false,
  scrollable = true,
  gradientBackground = false,
}: OnboardingLayoutProps) {
  const { state, nextStep, previousStep, getProgress } = useOnboarding();

  const progress = getProgress();
  const theme = state.userType ? USER_TYPE_THEMES[state.userType] : null;

  const handleNext = async () => {
    if (onNext) {
      await onNext();
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      previousStep();
    }
  };

  const content = (
    <View style={styles.contentContainer}>
      {/* Header with progress and gamification */}
      {(showProgress || showGamification) && (
        <View style={styles.header}>
          {showProgress && (
            <ProgressBar
              progress={progress}
              currentStep={state.currentStep}
              totalSteps={progress > 0 ? Math.round(state.currentStep / progress) : 0}
            />
          )}
          {showGamification && (
            <GamificationBadge
              points={state.gamification.points}
              level={state.gamification.level}
            />
          )}
        </View>
      )}

      {/* Main content */}
      <View style={styles.content}>{children}</View>

      {/* Navigation */}
      {showNavigation && (
        <StepNavigation
          canGoBack={canGoBack && state.currentStep > 0}
          canGoNext={canGoNext}
          nextLabel={nextLabel}
          onNext={handleNext}
          onBack={handleBack}
          isLoading={isNextLoading}
        />
      )}
    </View>
  );

  const wrappedContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  const backgroundColor = gradientBackground && theme
    ? theme.bgGradient
    : ['#F9FAFB', '#F9FAFB'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={backgroundColor as [string, string, ...string[]]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {wrappedContent}
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
});
