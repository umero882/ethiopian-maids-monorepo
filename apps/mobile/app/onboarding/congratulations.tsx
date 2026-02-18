/**
 * Congratulations Screen
 *
 * Celebration screen after account creation.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { USER_TYPE_THEMES } from '../../data/onboardingConfig';

const { width, height } = Dimensions.get('window');

// Confetti particle component
const ConfettiParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateConfetti = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: 3000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: Math.random() * 100 - 50,
          duration: 3000,
          delay,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    };

    animateConfetti();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    />
  );
};

export default function CongratulationsScreen() {
  const { state, nextStep, previousStep, awardPoints } = useOnboarding();
  const theme = state.userType ? USER_TYPE_THEMES[state.userType] : null;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Award account creation points
    awardPoints(50);

    // Animate celebration
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    nextStep();
    router.push('/onboarding/social-proof');
  };

  const handleBack = () => {
    previousStep();
    router.push('/onboarding/subscription');
  };

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    startX: Math.random() * width,
  }));

  const getUserTypeLabel = () => {
    switch (state.userType) {
      case 'maid':
        return 'Domestic Worker';
      case 'sponsor':
        return 'Family / Sponsor';
      case 'agency':
        return 'Recruitment Agency';
      default:
        return 'Member';
    }
  };

  return (
    <LinearGradient
      colors={theme?.bgGradient as [string, string, ...string[]] || ['#1E3A8A', '#1E40AF', '#3B82F6']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Confetti */}
        <View style={styles.confettiContainer}>
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              delay={particle.delay}
              startX={particle.startX}
            />
          ))}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Success Icon */}
          <Animated.View
            style={[
              styles.successIconContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Animated.View
              style={[
                styles.checkmarkContainer,
                { transform: [{ scale: checkmarkAnim }] },
              ]}
            >
              <Ionicons name="checkmark" size={48} color="#fff" />
            </Animated.View>
          </Animated.View>

          {/* Celebration Text */}
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>
            Your account has been created successfully
          </Text>

          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.userIconContainer}>
              <Ionicons name="person" size={24} color={theme?.primary || '#1E40AF'} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{state.account.email}</Text>
              <Text style={styles.userType}>{getUserTypeLabel()}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              {state.account.phoneVerified && (
                <View style={styles.verifiedIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}
            </View>
          </View>

          {/* Points Earned */}
          <View style={styles.pointsCard}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsEarned}>+50 Points Earned!</Text>
              <Text style={styles.totalPoints}>
                Total: {state.gamification.points} pts
              </Text>
            </View>
          </View>

          {/* Next Steps */}
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
            <Text style={styles.nextStepsText}>
              Complete your profile to unlock all features and get matched with{' '}
              {state.userType === 'maid' ? 'employers' : 'domestic workers'}
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleContinue}>
            <Text style={styles.ctaText}>Continue Profile Setup</Text>
            <Ionicons name="arrow-forward" size={20} color={theme?.primary || '#1E40AF'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  verifiedIcon: {
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  pointsInfo: {
    marginLeft: 12,
  },
  pointsEarned: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  totalPoints: {
    fontSize: 14,
    color: '#92400E',
  },
  nextStepsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  nextStepsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
});
