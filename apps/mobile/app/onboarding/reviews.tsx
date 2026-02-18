/**
 * Reviews Screen
 *
 * Shows platform reviews and ratings (final step before completion).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, ImageSourcePropType } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { PLATFORM_STATS, USER_TYPE_THEMES } from '../../data/onboardingConfig';
import { ProgressBar, GamificationBadge } from '../../components/onboarding';

// Local Success Stories images for reviewers
const REVIEWER_IMAGES: { [key: string]: ImageSourcePropType } = {
  'Hiwot Tadesse': require('../../assets/images/Success Stories/Hiwot Tadesse.jpg'),
  'Meron Hailu': require('../../assets/images/Success Stories/Meron Hailu.png'),
  'Muna Kedir': require('../../assets/images/Success Stories/Muna Kedir.png'),
  'Kedija Jarso': require('../../assets/images/Success Stories/Kedija Jarso.png'),
};

export default function ReviewsScreen() {
  const { state, nextStep, previousStep, getProgress } = useOnboarding();

  const theme = state.userType ? USER_TYPE_THEMES[state.userType] : null;
  const progress = getProgress();

  const handleContinue = () => {
    nextStep();
    router.push('/onboarding/notifications');
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  const reviews = [
    {
      id: 1,
      rating: 5,
      title: 'Found My Dream Family',
      review: 'I found my dream family within 2 weeks! The platform made everything so easy and secure. Now I work with a wonderful family in Dubai.',
      author: 'Muna Kedir',
      location: 'Ethiopia → UAE',
      date: '2 weeks ago',
      verified: true,
    },
    {
      id: 2,
      rating: 5,
      title: 'Safe & Professional',
      review: 'The verification process gave me confidence that I was connecting with real employers. I felt safe throughout the entire process.',
      author: 'Meron Hailu',
      location: 'Ethiopia → Saudi Arabia',
      date: '3 weeks ago',
      verified: true,
    },
    {
      id: 3,
      rating: 5,
      title: 'Great Support Team',
      review: 'Great platform with responsive support. I got multiple offers within a month and chose the best one for my family.',
      author: 'Hiwot Tadesse',
      location: 'Ethiopia → Kuwait',
      date: '1 month ago',
      verified: true,
    },
    {
      id: 4,
      rating: 5,
      title: 'Life Changing Experience',
      review: 'This platform changed my life! I was connected with a respectful employer in Bahrain. The support team helped me every step of the way.',
      author: 'Kedija Jarso',
      location: 'Ethiopia → Bahrain',
      date: '1 month ago',
      verified: true,
    },
  ];

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
            <Ionicons name="star" size={32} color={theme?.primary || '#1E40AF'} />
          </View>
          <Text style={styles.title}>Platform Reviews</Text>
          <Text style={styles.description}>
            See what our users say about their experience
          </Text>
        </View>

        {/* Overall Rating */}
        <View style={styles.overallRatingContainer}>
          <Text style={styles.overallRatingNumber}>4.8</Text>
          <View style={styles.overallRatingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= 5 ? 'star' : 'star-outline'}
                size={24}
                color="#F59E0B"
              />
            ))}
          </View>
          <Text style={styles.overallRatingCount}>Based on 2,500+ reviews</Text>
        </View>

        {/* Rating Breakdown */}
        <View style={styles.ratingBreakdown}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const percentage = rating === 5 ? 78 : rating === 4 ? 15 : rating === 3 ? 5 : rating === 2 ? 1 : 1;
            return (
              <View key={rating} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{rating}</Text>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <View style={styles.ratingBarContainer}>
                  <View
                    style={[
                      styles.ratingBarFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.ratingPercentage}>{percentage}%</Text>
              </View>
            );
          })}
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          <Text style={styles.reviewsListTitle}>Success Stories</Text>
          {reviews.map((review) => {
            const reviewerImage = REVIEWER_IMAGES[review.author];
            return (
            <View key={review.id} style={styles.reviewCard}>
              {/* Reviewer Info Header */}
              <View style={styles.reviewerHeader}>
                <View style={styles.avatarContainer}>
                  {reviewerImage ? (
                    <Image
                      source={reviewerImage}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={24} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerNameRow}>
                    <Text style={styles.reviewerName}>{review.author}</Text>
                    {review.verified && (
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    )}
                  </View>
                  <Text style={styles.reviewerLocation}>{review.location}</Text>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>

              {/* Rating */}
              <View style={styles.reviewRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= review.rating ? 'star' : 'star-outline'}
                    size={16}
                    color="#F59E0B"
                  />
                ))}
              </View>

              {/* Review Content */}
              <Text style={styles.reviewTitle}>{review.title}</Text>
              <Text style={styles.reviewText}>"{review.review}"</Text>
            </View>
            );
          })}
        </View>

        {/* App Store Badges */}
        <View style={styles.appStoreBadges}>
          <View style={styles.appStoreBadge}>
            <Ionicons name="logo-apple" size={24} color="#1F2937" />
            <View style={styles.appStoreBadgeText}>
              <Text style={styles.appStoreBadgeLabel}>App Store</Text>
              <View style={styles.appStoreBadgeRating}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.appStoreBadgeScore}>4.9</Text>
              </View>
            </View>
          </View>
          <View style={styles.appStoreBadge}>
            <Ionicons name="logo-google-playstore" size={24} color="#1F2937" />
            <View style={styles.appStoreBadgeText}>
              <Text style={styles.appStoreBadgeLabel}>Play Store</Text>
              <View style={styles.appStoreBadgeRating}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.appStoreBadgeScore}>4.7</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Almost Done!</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
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
  overallRatingContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overallRatingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  overallRatingStars: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 4,
  },
  overallRatingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingBreakdown: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#4B5563',
    width: 12,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  ratingPercentage: {
    fontSize: 12,
    color: '#6B7280',
    width: 32,
    textAlign: 'right',
  },
  reviewsList: {
    marginBottom: 24,
  },
  reviewsListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewerHeader: {
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
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewerLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 12,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  appStoreBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  appStoreBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  appStoreBadgeText: {},
  appStoreBadgeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  appStoreBadgeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appStoreBadgeScore: {
    fontSize: 12,
    color: '#6B7280',
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
