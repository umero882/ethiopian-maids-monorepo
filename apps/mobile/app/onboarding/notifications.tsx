/**
 * Notifications Screen
 *
 * Final onboarding step - notification preferences and completion.
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Animated, Easing } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { USER_TYPE_THEMES } from '../../data/onboardingConfig';
import { ProgressBar, GamificationBadge } from '../../components/onboarding';
import { useAuth } from '../../hooks/useAuth';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const { state, previousStep, getProgress, completeOnboarding, awardPoints, addAchievement, clearDraft } = useOnboarding();
  const { signUp } = useAuth();

  const theme = state.userType ? USER_TYPE_THEMES[state.userType] : null;
  const progress = getProgress();

  const [isCompleting, setIsCompleting] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Get instant updates on your device',
      icon: 'notifications',
      enabled: true,
    },
    {
      id: 'email',
      title: 'Email Updates',
      description: 'Receive important updates via email',
      icon: 'mail',
      enabled: true,
    },
    {
      id: 'sms',
      title: 'SMS Alerts',
      description: 'Get SMS for urgent notifications',
      icon: 'chatbubble',
      enabled: false,
    },
    {
      id: 'marketing',
      title: 'Marketing & Tips',
      description: 'Receive tips and promotional content',
      icon: 'megaphone',
      enabled: false,
    },
  ]);

  const confettiScale = useRef(new Animated.Value(0)).current;

  const toggleNotification = (id: string) => {
    setNotificationSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      // Create the user account with Firebase
      const result = await signUp(
        state.account.email,
        state.account.password,
        {
          user_type: state.userType || 'maid',
          full_name: state.formData.fullName || state.formData.firstName || '',
          phone: state.account.phone || '',
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create account');
      }

      // Award completion points and achievement
      awardPoints(300);
      addAchievement({
        id: 'fully_complete',
        name: 'Fully Complete',
        description: '100% profile completion',
        icon: 'trophy',
        points: 300,
        trigger: 'fullCompletion',
        earnedAt: new Date().toISOString(),
      });

      // Clear the draft
      await clearDraft();

      // Complete onboarding in context
      await completeOnboarding();

      // Show celebration animation
      Animated.spring(confettiScale, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }).start();

      // Navigate to dashboard after short delay
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
      // Show error to user
      alert(error instanceof Error ? error.message : 'Failed to complete registration');
    }
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Celebration Overlay */}
      {isCompleting && (
        <Animated.View
          style={[
            styles.celebrationOverlay,
            { transform: [{ scale: confettiScale }] },
          ]}
        >
          <View style={styles.celebrationContent}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            <Text style={styles.celebrationTitle}>Welcome!</Text>
            <Text style={styles.celebrationSubtitle}>
              Your account is ready
            </Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.content}>
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
            <Ionicons name="notifications" size={32} color={theme?.primary || '#1E40AF'} />
          </View>
          <Text style={styles.title}>Stay Updated</Text>
          <Text style={styles.description}>
            Choose how you want to receive notifications
          </Text>
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsContainer}>
          {notificationSettings.map((setting) => (
            <View key={setting.id} style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Ionicons name={setting.icon} size={24} color="#6B7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDescription}>{setting.description}</Text>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleNotification(setting.id)}
                trackColor={{ false: '#E5E7EB', true: (theme?.primary || '#1E40AF') + '50' }}
                thumbColor={setting.enabled ? theme?.primary || '#1E40AF' : '#fff'}
              />
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <Text style={styles.summaryTitle}>You're All Set!</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{state.gamification.points}</Text>
              <Text style={styles.summaryStatLabel}>Points Earned</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>
                {state.gamification.achievements?.length || 0}
              </Text>
              <Text style={styles.summaryStatLabel}>Achievements</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>Lv.{state.gamification.level}</Text>
              <Text style={styles.summaryStatLabel}>Level</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            You can change these settings anytime in your profile
          </Text>
        </View>
      </View>

      {/* Complete Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            { backgroundColor: theme?.primary || '#1E40AF' },
            isCompleting && styles.buttonDisabled,
          ]}
          onPress={handleComplete}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <Text style={styles.completeText}>Creating Account...</Text>
          ) : (
            <>
              <Text style={styles.completeText}>Complete Registration</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  summaryContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#92400E',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F59E0B',
    opacity: 0.3,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  completeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
});
