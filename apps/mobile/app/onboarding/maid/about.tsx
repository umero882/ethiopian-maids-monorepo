/**
 * Maid About Screen
 *
 * Collects bio and introduction text.
 * Includes AI-powered bio generation based on user's onboarding data.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../../context/OnboardingContext';
import { ProgressBar, GamificationBadge } from '../../../components/onboarding';

const bioPrompts = [
  "What makes you a great worker?",
  "Describe your work style",
  "Share something about your personality",
  "Why do you enjoy this work?",
];

const bioExamples = [
  {
    title: "Experienced & Caring",
    text: "I am a hardworking and caring person with 5 years of experience in household management. I enjoy cooking traditional dishes and taking care of children. I am honest, reliable, and always punctual.",
  },
  {
    title: "First Timer with Skills",
    text: "Although I'm new to professional work, I have been helping my family since childhood. I am a quick learner, very organized, and passionate about keeping homes clean and tidy. I am looking for a family who will give me my first opportunity.",
  },
];

// Skill labels for bio generation
const skillLabels: Record<string, string> = {
  cleaning: 'house cleaning',
  cooking: 'cooking',
  childcare: 'childcare',
  elderly_care: 'elderly care',
  laundry: 'laundry and ironing',
  driving: 'driving',
  pet_care: 'pet care',
  gardening: 'gardening',
  tutoring: 'tutoring',
  sewing: 'sewing',
};

// Experience labels
const experienceLabels: Record<string, string> = {
  'no_experience': 'new to professional work',
  'less_than_1': 'nearly a year of experience',
  '1_2_years': '1-2 years of experience',
  '3_5_years': '3-5 years of experience',
  '5_10_years': '5-10 years of experience',
  'more_than_10': 'over 10 years of experience',
};

// Country labels
const countryLabels: Record<string, string> = {
  uae: 'United Arab Emirates',
  saudi_arabia: 'Saudi Arabia',
  kuwait: 'Kuwait',
  qatar: 'Qatar',
  bahrain: 'Bahrain',
  oman: 'Oman',
  lebanon: 'Lebanon',
  jordan: 'Jordan',
};

// Special experience labels
const specialExpLabels: Record<string, string> = {
  newborn_care: 'newborn care',
  special_needs: 'special needs care',
  elderly_care: 'senior care',
  cooking_specialty: 'specialty cooking',
  large_events: 'event hosting',
  pet_care: 'pet care',
};

/**
 * Generate a personalized bio based on user's onboarding data
 */
function generateBio(formData: any): string {
  const parts: string[] = [];

  // Opening with name and nationality
  const name = formData.full_name || '';
  const nationality = formData.nationality || '';

  if (name && nationality) {
    parts.push(`Hello, my name is ${name} and I am from ${nationality}.`);
  } else if (name) {
    parts.push(`Hello, my name is ${name}.`);
  } else {
    parts.push(`Hello, I am a dedicated and hardworking professional.`);
  }

  // Experience
  const experience = formData.yearsOfExperience || formData.experience_level;
  if (experience && experienceLabels[experience]) {
    if (experience === 'no_experience') {
      parts.push(`Although I am ${experienceLabels[experience]}, I am eager to learn and committed to providing excellent service.`);
    } else {
      parts.push(`I have ${experienceLabels[experience]} in domestic work.`);
    }
  }

  // Skills
  const skills = formData.skills || [];
  if (skills.length > 0) {
    const skillNames = skills
      .map((s: string) => skillLabels[s] || s)
      .filter(Boolean);

    if (skillNames.length === 1) {
      parts.push(`I specialize in ${skillNames[0]}.`);
    } else if (skillNames.length === 2) {
      parts.push(`I am skilled in ${skillNames[0]} and ${skillNames[1]}.`);
    } else if (skillNames.length > 2) {
      const lastSkill = skillNames.pop();
      parts.push(`My skills include ${skillNames.join(', ')}, and ${lastSkill}.`);
    }
  }

  // Special experience
  const specialExp = formData.specialExperience || [];
  if (specialExp.length > 0) {
    const expNames = specialExp
      .map((s: string) => specialExpLabels[s] || s)
      .filter(Boolean);

    if (expNames.length > 0) {
      parts.push(`I also have experience in ${expNames.join(' and ')}.`);
    }
  }

  // Languages
  const languages = formData.languages || [];
  if (languages.length > 0) {
    const langNames = languages.map((l: string) =>
      l.charAt(0).toUpperCase() + l.slice(1)
    );

    if (langNames.length === 1) {
      parts.push(`I speak ${langNames[0]}.`);
    } else if (langNames.length === 2) {
      parts.push(`I am fluent in ${langNames[0]} and ${langNames[1]}.`);
    } else {
      const lastLang = langNames.pop();
      parts.push(`I speak ${langNames.join(', ')}, and ${lastLang}.`);
    }
  }

  // Work preferences
  const preferredCountries = formData.preferredCountries || [];
  if (preferredCountries.length > 0) {
    const countryNames = preferredCountries
      .map((c: string) => countryLabels[c] || c)
      .filter(Boolean);

    if (countryNames.length === 1) {
      parts.push(`I am looking for opportunities in ${countryNames[0]}.`);
    } else if (countryNames.length > 1) {
      parts.push(`I am open to working in various Gulf countries.`);
    }
  }

  // Closing statement - personality traits
  const closingStatements = [
    'I am honest, reliable, and dedicated to my work.',
    'I take pride in maintaining a clean and organized environment.',
    'I am punctual, trustworthy, and easy to work with.',
    'I am committed to providing the best care and service to my employer.',
  ];

  // Pick a closing based on skills
  if (skills.includes('childcare') || skills.includes('elderly_care')) {
    parts.push('I am patient, caring, and attentive to the needs of those I look after.');
  } else if (skills.includes('cooking')) {
    parts.push('I take pride in preparing delicious and nutritious meals for the family.');
  } else {
    parts.push(closingStatements[Math.floor(Math.random() * closingStatements.length)]);
  }

  // Final statement
  parts.push('I am excited to find a family where I can contribute my skills and grow professionally.');

  // Join and limit to 1000 characters
  let bio = parts.join(' ');
  if (bio.length > 1000) {
    bio = bio.substring(0, 997) + '...';
  }

  return bio;
}

export default function MaidAboutScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [bio, setBio] = useState(state.formData.bio || '');
  const [errors, setErrors] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const progress = getProgress();

  const minLength = 50;
  const maxLength = 1000; // Increased to 1000 for AI-generated bios
  const charCount = bio.length;

  // Handle AI bio generation
  const handleGenerateBio = async () => {
    setIsGenerating(true);
    setErrors(null);

    // Simulate a slight delay for better UX (feels like AI is working)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const generatedBio = generateBio(state.formData);
      setBio(generatedBio);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating bio:', error);
      setErrors('Failed to generate bio. Please try again.');
      setIsGenerating(false);
    }
  };

  const validateForm = (): boolean => {
    if (bio.trim().length < minLength) {
      setErrors(`Please write at least ${minLength} characters (current: ${charCount})`);
      return false;
    }

    setErrors(null);
    return true;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({ bio: bio.trim() });
      awardPoints(30);

      // Award storyteller achievement for detailed bio
      if (bio.trim().length >= 200) {
        addAchievement({
          id: 'storyteller',
          name: 'Great Storyteller',
          description: 'Wrote a detailed bio (200+ characters)',
          icon: 'create',
          points: 25,
          trigger: 'bioLength',
          earnedAt: new Date().toISOString(),
        });
        awardPoints(25);
      }

      nextStep();
      router.push('/onboarding/maid/media');
    }
  };

  const handleBack = () => {
    updateFormData({ bio: bio.trim() });
    previousStep();
    router.back();
  };

  const useExample = (exampleText: string) => {
    setBio(exampleText);
    setShowExamples(false);
    setErrors(null);
  };

  const getCharCountColor = () => {
    if (charCount < minLength) return '#DC2626';
    if (charCount >= 200) return '#059669';
    return '#6B7280';
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
          keyboardShouldPersistTaps="handled"
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
            <Ionicons name="document-text" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 8 of 10</Text>
          <Text style={styles.title}>About You</Text>
          <Text style={styles.description}>
            Write a personal introduction to help families get to know you
          </Text>
        </View>

        {/* Bio Prompts */}
        <View style={styles.promptsContainer}>
          <Text style={styles.promptsTitle}>Things to include:</Text>
          <View style={styles.promptsList}>
            {bioPrompts.map((prompt, index) => (
              <View key={index} style={styles.promptItem}>
                <Ionicons name="checkmark-circle" size={16} color="#9333EA" />
                <Text style={styles.promptText}>{prompt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Generate Bio Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerateBio}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#9333EA" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#9333EA" />
              <Text style={styles.generateButtonText}>Generate Bio with AI</Text>
            </>
          )}
        </TouchableOpacity>

        {/* AI Notice */}
        <View style={styles.aiNotice}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.aiNoticeText}>
            AI will create a personalized bio based on your profile information. You can edit it afterward.
          </Text>
        </View>

        {/* Bio Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Your Bio <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.bioInput,
              errors && styles.bioInputError,
            ]}
            value={bio}
            onChangeText={(text) => {
              if (text.length <= maxLength) {
                setBio(text);
                setErrors(null);
              }
            }}
            placeholder="Tell families about yourself, your personality, and what makes you a great worker..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            {errors ? (
              <Text style={styles.errorText}>{errors}</Text>
            ) : (
              <Text style={styles.helperText}>
                Min {minLength} characters
              </Text>
            )}
            <Text style={[styles.charCount, { color: getCharCountColor() }]}>
              {charCount}/{maxLength}
            </Text>
          </View>
        </View>

        {/* Achievement Hint */}
        {charCount >= 50 && charCount < 200 && (
          <View style={styles.hintContainer}>
            <Ionicons name="bulb-outline" size={18} color="#D97706" />
            <Text style={styles.hintText}>
              Write {200 - charCount} more characters to earn the "Great Storyteller" achievement!
            </Text>
          </View>
        )}

        {charCount >= 200 && (
          <View style={[styles.hintContainer, styles.achievementContainer]}>
            <Ionicons name="trophy" size={18} color="#10B981" />
            <Text style={[styles.hintText, styles.achievementText]}>
              You qualify for the "Great Storyteller" achievement (+25 pts)
            </Text>
          </View>
        )}

        {/* Example Toggle */}
        <TouchableOpacity
          style={styles.examplesToggle}
          onPress={() => setShowExamples(!showExamples)}
        >
          <Ionicons
            name={showExamples ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
          <Text style={styles.examplesToggleText}>
            {showExamples ? 'Hide Examples' : 'See Example Bios'}
          </Text>
        </TouchableOpacity>

        {/* Examples */}
        {showExamples && (
          <View style={styles.examplesContainer}>
            {bioExamples.map((example, index) => (
              <View key={index} style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>{example.title}</Text>
                <Text style={styles.exampleText}>{example.text}</Text>
                <TouchableOpacity
                  style={styles.useExampleButton}
                  onPress={() => useExample(example.text)}
                >
                  <Text style={styles.useExampleText}>Use this as template</Text>
                  <Ionicons name="copy-outline" size={16} color="#9333EA" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tips Box */}
        <View style={styles.tipsBox}>
          <Ionicons name="information-circle" size={20} color="#1E40AF" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Writing Tips</Text>
            <Text style={styles.tipsText}>
              • Be honest and genuine{'\n'}
              • Highlight your strengths{'\n'}
              • Mention specific skills{'\n'}
              • Keep it professional but warm
            </Text>
          </View>
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+30 points for completing this step</Text>
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
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#9333EA15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#9333EA',
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
  promptsContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 12,
  },
  promptsList: {
    gap: 8,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#7C3AED',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 2,
    borderColor: '#9333EA',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333EA',
  },
  aiNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  aiNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  bioInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 180,
    lineHeight: 22,
  },
  bioInputError: {
    borderColor: '#DC2626',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  charCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  achievementContainer: {
    backgroundColor: '#D1FAE5',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  achievementText: {
    color: '#065F46',
  },
  examplesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  examplesToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  examplesContainer: {
    marginBottom: 16,
    gap: 12,
  },
  exampleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  useExampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  useExampleText: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '500',
  },
  tipsBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 20,
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
    backgroundColor: '#9333EA',
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
