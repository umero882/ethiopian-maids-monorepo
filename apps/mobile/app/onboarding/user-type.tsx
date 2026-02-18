/**
 * User Type Selection Screen
 *
 * Allows user to select their account type: Maid, Sponsor, or Agency.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding, UserType } from '../../context/OnboardingContext';
import { USER_TYPE_THEMES } from '../../data/onboardingConfig';

// Import custom registration icons
const maidIcon = require('../../assets/images/Registration icon/maid-new.png');
const sponsorIcon = require('../../assets/images/Registration icon/sponsor-new.png');
const agencyIcon = require('../../assets/images/Registration icon/agency-new.png');

interface UserTypeOption {
  type: UserType;
  title: string;
  description: string;
  image: ImageSourcePropType;
  colors: { primary: string; secondary: string };
}

const userTypes: UserTypeOption[] = [
  {
    type: 'maid',
    title: 'Domestic Worker',
    description: 'Find employment opportunities with verified families',
    image: maidIcon,
    colors: { primary: '#9333EA', secondary: '#EC4899' },
  },
  {
    type: 'sponsor',
    title: 'Family / Sponsor',
    description: 'Hire trusted domestic workers for your home',
    image: sponsorIcon,
    colors: { primary: '#2563EB', secondary: '#06B6D4' },
  },
  {
    type: 'agency',
    title: 'Recruitment Agency',
    description: 'Connect domestic workers with families',
    image: agencyIcon,
    colors: { primary: '#16A34A', secondary: '#10B981' },
  },
];

export default function UserTypeScreen() {
  const { setUserType, nextStep } = useOnboarding();

  const handleSelectType = (type: UserType) => {
    setUserType(type);
    nextStep();
    router.push('/onboarding/user-intro');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={40} color="#1E40AF" />
        </View>
        <Text style={styles.title}>Join Ethiopian Maids</Text>
        <Text style={styles.subtitle}>Choose your account type to get started</Text>
      </View>

      {/* User Type Options */}
      <View style={styles.optionsContainer}>
        {userTypes.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={styles.optionCard}
            onPress={() => handleSelectType(option.type)}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: option.colors.primary + '15' },
                ]}
              >
                <Image
                  source={option.image}
                  style={styles.optionImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text style={styles.linkText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 8,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  linkText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
});
