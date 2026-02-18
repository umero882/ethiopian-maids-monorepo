/**
 * Sponsor Accommodation Screen
 *
 * Collects accommodation details for live-in workers.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../../context/OnboardingContext';
import {
  ProgressBar,
  GamificationBadge,
  Dropdown,
  MultiSelect,
} from '../../../components/onboarding';

const roomTypeOptions = [
  { value: 'private', label: 'Private Room' },
  { value: 'shared', label: 'Shared Room' },
  { value: 'maid_quarters', label: 'Maid Quarters' },
  { value: 'studio', label: 'Separate Studio' },
];

const roomAmenitiesOptions = [
  { value: 'private_bathroom', label: 'Private Bathroom', icon: 'water-outline' as any },
  { value: 'ac', label: 'Air Conditioning', icon: 'snow-outline' as any },
  { value: 'tv', label: 'Television', icon: 'tv-outline' as any },
  { value: 'wifi', label: 'WiFi Access', icon: 'wifi-outline' as any },
  { value: 'wardrobe', label: 'Wardrobe/Closet', icon: 'file-tray-full-outline' as any },
  { value: 'desk', label: 'Desk/Work Area', icon: 'desktop-outline' as any },
];

const mealArrangementOptions = [
  { value: 'full_board', label: 'Full Board (All meals provided)' },
  { value: 'partial', label: 'Partial (Some meals provided)' },
  { value: 'food_allowance', label: 'Food Allowance' },
  { value: 'self_catering', label: 'Self-Catering (Kitchen access)' },
];

const timeOffOptions = [
  { value: 'friday', label: 'Friday Off' },
  { value: 'saturday', label: 'Saturday Off' },
  { value: 'sunday', label: 'Sunday Off' },
  { value: 'alternating', label: 'Alternating Weekends' },
  { value: 'negotiable', label: 'Negotiable' },
];

export default function SponsorAccommodationScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [formData, setFormData] = useState({
    roomType: state.formData.roomType || '',
    mealArrangement: state.formData.mealArrangement || '',
    dayOff: state.formData.dayOff || '',
  });

  const [roomAmenities, setRoomAmenities] = useState<string[]>(state.formData.roomAmenities || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomType) {
      newErrors.roomType = 'Please select room type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({ ...formData, roomAmenities });
      awardPoints(20);

      // Award great employer achievement if all amenities selected
      if (roomAmenities.length >= 4 && formData.mealArrangement === 'full_board') {
        addAchievement({
          id: 'great_employer',
          name: 'Great Employer',
          description: 'Offering excellent accommodation',
          icon: 'star',
          points: 30,
          trigger: 'accommodationQuality',
          earnedAt: new Date().toISOString(),
        });
        awardPoints(30);
      }

      nextStep();
      router.push('/onboarding/sponsor/consents');
    }
  };

  const handleBack = () => {
    updateFormData({ ...formData, roomAmenities });
    previousStep();
    router.back();
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const hasGoodAccommodation = roomAmenities.length >= 4 && formData.mealArrangement === 'full_board';

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
          <View style={styles.iconContainer}>
            <Ionicons name="bed" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.subtitle}>Profile Step 7 of 9</Text>
          <Text style={styles.title}>Accommodation</Text>
          <Text style={styles.description}>
            Describe the living arrangements you'll provide
          </Text>
        </View>

        {/* Room Type */}
        <View style={styles.section}>
          <Dropdown
            label="Room Type"
            placeholder="What type of room will you provide?"
            options={roomTypeOptions}
            value={formData.roomType}
            onChange={(value) => updateField('roomType', value)}
            error={errors.roomType}
            required
          />
        </View>

        {/* Room Amenities */}
        <View style={styles.section}>
          <MultiSelect
            label="Room Amenities"
            options={roomAmenitiesOptions}
            selected={roomAmenities}
            onChange={setRoomAmenities}
            columns={2}
          />
        </View>

        {/* Meal Arrangement */}
        <View style={styles.section}>
          <Dropdown
            label="Meal Arrangement"
            placeholder="How will meals be handled?"
            options={mealArrangementOptions}
            value={formData.mealArrangement}
            onChange={(value) => updateField('mealArrangement', value)}
          />
        </View>

        {/* Day Off */}
        <View style={styles.section}>
          <Dropdown
            label="Weekly Day Off"
            placeholder="When is the day off?"
            options={timeOffOptions}
            value={formData.dayOff}
            onChange={(value) => updateField('dayOff', value)}
          />
        </View>

        {/* Achievement Hint */}
        {!hasGoodAccommodation && (
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={18} color="#D97706" />
            <Text style={styles.hintText}>
              Offer 4+ amenities and full board meals to earn the "Great Employer" badge!
            </Text>
          </View>
        )}

        {hasGoodAccommodation && (
          <View style={[styles.hintBox, styles.achievementBox]}>
            <Ionicons name="trophy" size={18} color="#059669" />
            <Text style={[styles.hintText, styles.achievementText]}>
              Excellent! You qualify for the "Great Employer" achievement (+30 pts)
            </Text>
          </View>
        )}

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+20 points for completing this step</Text>
        </View>
      </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
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
    backgroundColor: '#1E40AF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 4,
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
  section: {
    marginBottom: 20,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  achievementBox: {
    backgroundColor: '#D1FAE5',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  achievementText: {
    color: '#065F46',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#92400E',
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
