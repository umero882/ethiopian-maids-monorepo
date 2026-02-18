/**
 * AchievementUnlocked Component
 *
 * Modal/toast to celebrate when a user earns an achievement.
 * Plays achievement sound when displayed.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSoundContext } from '../../context/SoundContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface AchievementUnlockedProps {
  achievement: Achievement | null;
  visible: boolean;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function AchievementUnlocked({
  achievement,
  visible,
  onDismiss,
  autoDismissMs = 4000,
}: AchievementUnlockedProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const starBurstAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  // Sound effects
  let playAchievement: (() => Promise<void>) | undefined;
  try {
    const soundContext = useSoundContext();
    playAchievement = soundContext.playAchievement;
  } catch {
    // SoundContext not available, sounds will be silent
  }

  useEffect(() => {
    if (visible && achievement) {
      // Play achievement sound
      if (playAchievement) {
        playAchievement();
      }

      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      starBurstAnim.setValue(0);
      shineAnim.setValue(0);

      // Play entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(starBurstAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();

      // Auto dismiss
      if (autoDismissMs > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissMs);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, achievement]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!achievement) return null;

  const starBurstScale = starBurstAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.2],
  });

  const starBurstOpacity = starBurstAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Star burst effect */}
          <Animated.View
            style={[
              styles.starBurst,
              {
                opacity: starBurstOpacity,
                transform: [{ scale: starBurstScale }],
              },
            ]}
          >
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.starRay,
                  { transform: [{ rotate: `${i * 45}deg` }] },
                ]}
              />
            ))}
          </Animated.View>

          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Shine effect */}
            <Animated.View
              style={[
                styles.shine,
                {
                  transform: [{ translateX: shineTranslate }],
                },
              ]}
            />

            {/* Badge icon */}
            <View style={styles.badgeContainer}>
              <View style={styles.badgeOuter}>
                <View style={styles.badgeInner}>
                  <Ionicons
                    name={achievement.icon as any}
                    size={36}
                    color="#F59E0B"
                  />
                </View>
              </View>
            </View>

            {/* Achievement unlocked label */}
            <View style={styles.unlockedLabel}>
              <Ionicons name="trophy" size={14} color="#fff" />
              <Text style={styles.unlockedText}>ACHIEVEMENT UNLOCKED!</Text>
            </View>

            {/* Achievement name */}
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>

            {/* Points earned */}
            <View style={styles.pointsContainer}>
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={styles.pointsText}>+{achievement.points} Points</Text>
            </View>

            {/* Tap to dismiss hint */}
            <Text style={styles.dismissHint}>Tap anywhere to continue</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBurst: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starRay: {
    position: 'absolute',
    width: 4,
    height: 150,
    backgroundColor: '#F59E0B',
    opacity: 0.3,
  },
  card: {
    width: 300,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  badgeContainer: {
    marginBottom: 16,
  },
  badgeOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  dismissHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
  },
});
