/**
 * Progress Bar Component
 *
 * Displays animated progress bar for onboarding flow.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  currentStep?: number;
  totalSteps?: number;
  showLabel?: boolean;
  color?: string;
  height?: number;
}

export default function ProgressBar({
  progress,
  currentStep,
  totalSteps,
  showLabel = true,
  color = '#1E40AF',
  height = 6,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {showLabel && currentStep !== undefined && totalSteps !== undefined && totalSteps > 0 && (
        <Text style={styles.label}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolate,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  track: {
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 3,
  },
  percentage: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'right',
  },
});
