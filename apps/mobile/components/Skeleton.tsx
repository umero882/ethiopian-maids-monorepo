/**
 * Skeleton Loading Component
 *
 * Displays animated placeholder content while data is loading.
 */

import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts
export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={18} style={styles.mb8} />
        <Skeleton width="50%" height={14} style={styles.mb8} />
        <Skeleton width="60%" height={14} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profile}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton width="60%" height={20} style={styles.mb8} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  list: {
    padding: 16,
  },
  mb8: {
    marginBottom: 8,
  },
});
