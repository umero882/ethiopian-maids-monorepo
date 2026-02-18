/**
 * Social Proof Screen
 *
 * Shows testimonials and success stories.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { TESTIMONIALS, PLATFORM_STATS, USER_TYPE_THEMES } from '../../data/onboardingConfig';
import { ProgressBar, GamificationBadge } from '../../components/onboarding';

// Local Success Stories images
const SUCCESS_STORY_IMAGES: { [key: string]: ImageSourcePropType } = {
  'Hiwot Tadesse': require('../../assets/images/Success Stories/Hiwot Tadesse.jpg'),
  'Meron Hailu': require('../../assets/images/Success Stories/Meron Hailu.png'),
  'Muna Kedir': require('../../assets/images/Success Stories/Muna Kedir.png'),
  'Kedija Jarso': require('../../assets/images/Success Stories/Kedija Jarso.png'),
};

// Auto-slide interval in milliseconds
const AUTO_SLIDE_INTERVAL = 4000;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

export default function SocialProofScreen() {
  const { state, nextStep, previousStep, getProgress } = useOnboarding();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  const theme = state.userType ? USER_TYPE_THEMES[state.userType] : null;
  const testimonials = state.userType ? TESTIMONIALS[state.userType] : [];
  const progress = getProgress();

  // Auto-slide functionality
  const scrollToIndex = useCallback((index: number) => {
    if (flatListRef.current && testimonials.length > 0) {
      flatListRef.current.scrollToOffset({
        offset: index * (CARD_WIDTH + 16),
        animated: true,
      });
      setActiveIndex(index);
    }
  }, [testimonials.length]);

  // Setup auto-slide timer
  useEffect(() => {
    if (testimonials.length <= 1) return;

    autoSlideRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % testimonials.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [testimonials.length, scrollToIndex]);

  // Reset auto-slide timer on manual scroll
  const resetAutoSlideTimer = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
    if (testimonials.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % testimonials.length;
          scrollToIndex(nextIndex);
          return nextIndex;
        });
      }, AUTO_SLIDE_INTERVAL);
    }
  }, [testimonials.length, scrollToIndex]);

  const handleContinue = () => {
    nextStep();
    // Navigate to the profile flow based on user type
    switch (state.userType) {
      case 'maid':
        router.push('/onboarding/maid/personal');
        break;
      case 'sponsor':
        router.push('/onboarding/sponsor/personal');
        break;
      case 'agency':
        router.push('/onboarding/agency/basic');
        break;
      default:
        router.push('/onboarding/reviews');
    }
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + 16));
    if (index !== activeIndex) {
      setActiveIndex(index);
      resetAutoSlideTimer(); // Reset timer on manual scroll
    }
  };

  // Get local image for testimonial if available
  const getTestimonialImage = (name: string): ImageSourcePropType | null => {
    return SUCCESS_STORY_IMAGES[name] || null;
  };

  const renderTestimonial = ({ item, index }: { item: any; index: number }) => {
    const localImage = getTestimonialImage(item.name);

    return (
    <View style={[styles.testimonialCard, { width: CARD_WIDTH }]}>
      {/* Header */}
      <View style={styles.testimonialHeader}>
        <View style={styles.avatarContainer}>
          {localImage ? (
            <Image
              source={localImage}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.testimonialInfo}>
          <Text style={styles.testimonialName}>{item.name}</Text>
          <Text style={styles.testimonialLocation}>
            {item.country
              ? `${item.country} → ${item.destination}`
              : item.location}
          </Text>
        </View>
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          </View>
        )}
      </View>

      {/* Rating */}
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= item.rating ? 'star' : 'star-outline'}
            size={18}
            color="#F59E0B"
          />
        ))}
      </View>

      {/* Quote */}
      <Text style={styles.testimonialQuote}>"{item.quote}"</Text>

      {/* Placements (for agencies) */}
      {item.placements && (
        <View style={styles.placementsContainer}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.placementsText}>
            {item.placements}+ successful placements
          </Text>
        </View>
      )}
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} showLabel={false} />
          </View>
          <GamificationBadge
            points={state.gamification.points}
            level={state.gamification.level}
            compact
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: (theme?.primary || '#1E40AF') + '15' }]}>
            <Ionicons name="chatbubbles" size={32} color={theme?.primary || '#1E40AF'} />
          </View>
          <Text style={styles.title}>Success Stories</Text>
          <Text style={styles.description}>
            See what our community says about us
          </Text>
        </View>

        {/* Platform Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{PLATFORM_STATS.totalPlacements}</Text>
            <Text style={styles.statLabel}>Placements</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{PLATFORM_STATS.successRate}</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{PLATFORM_STATS.avgPlacementTime}</Text>
            <Text style={styles.statLabel}>Avg. Time</Text>
          </View>
        </View>

        {/* Testimonials Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={testimonials}
            renderItem={renderTestimonial}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {testimonials.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeIndex === index && styles.paginationDotActive,
                  activeIndex === index && { backgroundColor: theme?.primary || '#1E40AF' },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustBadgesContainer}>
          <Text style={styles.trustBadgesTitle}>Trusted Platform</Text>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              <Text style={styles.trustBadgeText}>Verified Profiles</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="lock-closed" size={24} color="#3B82F6" />
              <Text style={styles.trustBadgeText}>Secure Platform</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="headset" size={24} color="#8B5CF6" />
              <Text style={styles.trustBadgeText}>24/7 Support</Text>
            </View>
          </View>
        </View>
      </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Complete Profile</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  carouselContainer: {
    marginBottom: 24,
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  testimonialCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialInfo: {
    flex: 1,
    marginLeft: 12,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  testimonialLocation: {
    fontSize: 13,
    color: '#6B7280',
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 2,
  },
  testimonialQuote: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  placementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  placementsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  paginationDotActive: {
    width: 24,
  },
  trustBadgesContainer: {
    paddingHorizontal: 24,
  },
  trustBadgesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  trustBadge: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trustBadgeText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
