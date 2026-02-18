/**
 * ConfettiCelebration Component
 *
 * Animated confetti celebration effect for milestone screens.
 * Plays celebratory sound when activated.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSoundContext } from '../../context/SoundContext';

const { width, height } = Dimensions.get('window');

interface ConfettiParticleProps {
  delay: number;
  startX: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'rectangle';
}

const ConfettiParticle = ({ delay, startX, color, size, shape }: ConfettiParticleProps) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const duration = 3000 + Math.random() * 1000;
    const swayAmount = Math.random() * 150 - 75;

    Animated.parallel([
      // Fall down
      Animated.timing(translateY, {
        toValue: height + 100,
        duration,
        delay,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      // Sway side to side
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: swayAmount,
          duration: duration / 2,
          delay,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -swayAmount,
          duration: duration / 2,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
      ]),
      // Rotate
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 800 + Math.random() * 400,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      // Fade out at the end
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getShapeStyle = () => {
    switch (shape) {
      case 'circle':
        return { borderRadius: size / 2 };
      case 'rectangle':
        return { borderRadius: 2, width: size * 0.6, height: size * 1.5 };
      default:
        return { borderRadius: 2 };
    }
  };

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          backgroundColor: color,
          width: size,
          height: size,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
        getShapeStyle(),
      ]}
    />
  );
};

interface ConfettiCelebrationProps {
  /**
   * Number of confetti particles to generate
   * @default 40
   */
  particleCount?: number;
  /**
   * Custom colors for confetti. Defaults to a festive mix.
   */
  colors?: string[];
  /**
   * Whether the confetti is active
   * @default true
   */
  active?: boolean;
  /**
   * Duration before auto-stopping (ms). Set to 0 for infinite.
   * @default 5000
   */
  duration?: number;
}

const DEFAULT_COLORS = [
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
];

export default function ConfettiCelebration({
  particleCount = 40,
  colors = DEFAULT_COLORS,
  active = true,
  duration = 5000,
}: ConfettiCelebrationProps) {
  const [isVisible, setIsVisible] = useState(active);

  // Sound effects
  let playConfetti: (() => Promise<void>) | undefined;
  try {
    const soundContext = useSoundContext();
    playConfetti = soundContext.playConfetti;
  } catch {
    // SoundContext not available, sounds will be silent
  }

  useEffect(() => {
    if (active) {
      setIsVisible(true);

      // Play confetti sound
      if (playConfetti) {
        playConfetti();
      }

      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [active, duration]);

  if (!isVisible) return null;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const shapes: ('square' | 'circle' | 'rectangle')[] = ['square', 'circle', 'rectangle'];
    return {
      id: i,
      delay: Math.random() * 800,
      startX: Math.random() * width,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          delay={particle.delay}
          startX={particle.startX}
          color={particle.color}
          size={particle.size}
          shape={particle.shape}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
  },
});
