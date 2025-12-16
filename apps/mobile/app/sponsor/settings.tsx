/**
 * Sponsor Settings Screen
 *
 * Comprehensive settings page for managing account preferences,
 * notifications, privacy, and app settings.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import {
  useSettings,
  useAuth,
  useBiometrics,
  AVAILABLE_LANGUAGES,
  THEME_OPTIONS,
} from '../../hooks';

// Key to track if user just signed out (to skip biometric auto-prompt)
const JUST_SIGNED_OUT_KEY = 'just_signed_out';

// Setting row component
interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

const SettingRow = ({
  icon,
  iconColor = '#3B82F6',
  title,
  subtitle,
  value,
  hasSwitch,
  switchValue,
  onSwitchChange,
  onPress,
  showChevron = true,
  danger,
}: SettingRowProps) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={hasSwitch && !onPress}
    activeOpacity={hasSwitch ? 1 : 0.7}
  >
    <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {value && <Text style={styles.settingValue}>{value}</Text>}
    {hasSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
        thumbColor="#fff"
      />
    )}
    {showChevron && !hasSwitch && (
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

// Section header
const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SponsorSettingsScreen() {
  const { signOut, user } = useAuth();
  const {
    settings,
    settingsLoading,
    profile,
    profileLoading,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAppSettings,
    updateProfile,
    profileUpdating,
  } = useSettings();

  // Biometric authentication
  const {
    state: biometricState,
    loading: biometricLoading,
    enableBiometrics,
    disableBiometrics,
    getBiometricTypeLabel,
    getBiometricIcon,
  } = useBiometrics();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBiometricPasswordModal, setShowBiometricPasswordModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [biometricPassword, setBiometricPassword] = useState('');
  const [biometricProcessing, setBiometricProcessing] = useState(false);

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Set flag to skip biometric auto-prompt on login page
            await SecureStore.setItemAsync(JUST_SIGNED_OUT_KEY, 'true');
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Contact Support',
              'To delete your account, please contact our support team at support@ethiopianmaids.com'
            );
          },
        },
      ]
    );
  };

  // Open edit profile modal
  const openEditProfile = () => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setShowEditProfileModal(true);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: editName.trim() || undefined,
        phone: editPhone.trim() || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfileModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    }
  };

  // Handle language change
  const handleLanguageChange = async (langCode: string) => {
    await updateAppSettings({ language: langCode });
    setShowLanguageModal(false);
    Alert.alert('Language Changed', 'App language has been updated. Some changes may require restarting the app.');
  };

  // Handle notification toggle
  const handleNotificationToggle = async (key: string, value: boolean) => {
    await updateNotificationSettings({ [key]: value });
  };

  // Handle privacy toggle
  const handlePrivacyToggle = async (key: string, value: boolean) => {
    await updatePrivacySettings({ [key]: value });
  };

  // Handle biometric toggle
  const handleBiometricToggle = async (enabled: boolean) => {
    if (!user?.email) {
      Alert.alert('Error', 'Please sign in to enable biometric authentication');
      return;
    }

    if (enabled) {
      // Check if device has biometrics enrolled
      if (!biometricState.isEnrolled) {
        Alert.alert(
          'Setup Required',
          `Please set up ${getBiometricTypeLabel()} in your device settings first, then try again.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Show password prompt modal
      setBiometricPassword('');
      setShowBiometricPasswordModal(true);
    } else {
      setBiometricProcessing(true);
      try {
        const success = await disableBiometrics();
        if (success) {
          Alert.alert('Biometric Sign-In Disabled', 'You will need to use your password to sign in.');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to disable biometric settings');
      } finally {
        setBiometricProcessing(false);
      }
    }
  };

  // Confirm biometric setup with password
  const handleConfirmBiometricSetup = async () => {
    if (!user?.email || !biometricPassword.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setBiometricProcessing(true);
    setShowBiometricPasswordModal(false);

    try {
      const success = await enableBiometrics(user.email, biometricPassword.trim());
      if (success) {
        Alert.alert(
          'Biometric Sign-In Enabled',
          `You can now sign in using ${getBiometricTypeLabel()}.`
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to enable biometric settings');
    } finally {
      setBiometricProcessing(false);
      setBiometricPassword('');
    }
  };

  // Get current language name
  const currentLanguage = AVAILABLE_LANGUAGES.find(
    (l) => l.code === settings.app.language
  )?.name || 'English';

  // Loading state
  if (settingsLoading || profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          <SettingRow
            icon="person-outline"
            title="Edit Profile"
            subtitle={profile?.name || profile?.email || 'Update your information'}
            onPress={openEditProfile}
          />
          <SettingRow
            icon="mail-outline"
            title="Email"
            value={profile?.email || 'Not set'}
            showChevron={false}
          />
          <SettingRow
            icon="call-outline"
            title="Phone"
            value={profile?.phone || 'Not set'}
            onPress={openEditProfile}
          />
          <SettingRow
            icon="card-outline"
            title="Payment Methods"
            subtitle="Manage your payment options"
            onPress={() => router.push('/sponsor/payments')}
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <View style={styles.section}>
          <SettingRow
            icon="options-outline"
            iconColor="#F59E0B"
            title="Notification Preferences"
            subtitle="Customize all notification settings"
            onPress={() => router.push('/profile/notifications')}
          />
          <SettingRow
            icon="notifications-outline"
            iconColor="#F59E0B"
            title="Push Notifications"
            subtitle="Receive alerts on your device"
            hasSwitch
            switchValue={settings.notifications.pushNotifications}
            onSwitchChange={(v) => handleNotificationToggle('pushNotifications', v)}
          />
          <SettingRow
            icon="mail-outline"
            iconColor="#F59E0B"
            title="Email Notifications"
            subtitle="Receive updates via email"
            hasSwitch
            switchValue={settings.notifications.emailNotifications}
            onSwitchChange={(v) => handleNotificationToggle('emailNotifications', v)}
          />
          <SettingRow
            icon="chatbubble-outline"
            iconColor="#F59E0B"
            title="SMS Notifications"
            subtitle="Receive text message alerts"
            hasSwitch
            switchValue={settings.notifications.smsNotifications}
            onSwitchChange={(v) => handleNotificationToggle('smsNotifications', v)}
          />
          <SettingRow
            icon="calendar-outline"
            iconColor="#F59E0B"
            title="Booking Alerts"
            subtitle="Get notified about bookings"
            hasSwitch
            switchValue={settings.notifications.bookingAlerts}
            onSwitchChange={(v) => handleNotificationToggle('bookingAlerts', v)}
          />
          <SettingRow
            icon="chatbubbles-outline"
            iconColor="#F59E0B"
            title="Message Alerts"
            subtitle="Get notified about new messages"
            hasSwitch
            switchValue={settings.notifications.messageAlerts}
            onSwitchChange={(v) => handleNotificationToggle('messageAlerts', v)}
          />
          <SettingRow
            icon="megaphone-outline"
            iconColor="#F59E0B"
            title="Promotional Emails"
            subtitle="Receive offers and promotions"
            hasSwitch
            switchValue={settings.notifications.promotionalEmails}
            onSwitchChange={(v) => handleNotificationToggle('promotionalEmails', v)}
          />
        </View>

        {/* Privacy Section */}
        <SectionHeader title="Privacy" />
        <View style={styles.section}>
          <SettingRow
            icon="eye-outline"
            iconColor="#10B981"
            title="Profile Visibility"
            value={settings.privacy.profileVisibility}
            onPress={() => {
              Alert.alert('Profile Visibility', 'Choose who can see your profile', [
                { text: 'Public', onPress: () => handlePrivacyToggle('profileVisibility', 'public' as any) },
                { text: 'Contacts Only', onPress: () => handlePrivacyToggle('profileVisibility', 'contacts' as any) },
                { text: 'Private', onPress: () => handlePrivacyToggle('profileVisibility', 'private' as any) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
          <SettingRow
            icon="call-outline"
            iconColor="#10B981"
            title="Show Phone Number"
            subtitle="Display your phone on profile"
            hasSwitch
            switchValue={settings.privacy.showPhoneNumber}
            onSwitchChange={(v) => handlePrivacyToggle('showPhoneNumber', v)}
          />
          <SettingRow
            icon="mail-outline"
            iconColor="#10B981"
            title="Show Email"
            subtitle="Display your email on profile"
            hasSwitch
            switchValue={settings.privacy.showEmail}
            onSwitchChange={(v) => handlePrivacyToggle('showEmail', v)}
          />
          <SettingRow
            icon="radio-button-on-outline"
            iconColor="#10B981"
            title="Show Online Status"
            subtitle="Let others see when you're online"
            hasSwitch
            switchValue={settings.privacy.showOnlineStatus}
            onSwitchChange={(v) => handlePrivacyToggle('showOnlineStatus', v)}
          />
          <SettingRow
            icon="chatbubble-ellipses-outline"
            iconColor="#10B981"
            title="Allow Direct Messages"
            subtitle="Let anyone send you messages"
            hasSwitch
            switchValue={settings.privacy.allowDirectMessages}
            onSwitchChange={(v) => handlePrivacyToggle('allowDirectMessages', v)}
          />
        </View>

        {/* Security Section */}
        <SectionHeader title="Security" />
        <View style={styles.section}>
          {biometricState.isAvailable ? (
            <SettingRow
              icon={getBiometricIcon() as keyof typeof Ionicons.glyphMap}
              iconColor="#EC4899"
              title={`${getBiometricTypeLabel()} Sign-In`}
              subtitle={
                biometricState.isEnrolled
                  ? `Use ${getBiometricTypeLabel()} to sign in quickly`
                  : `Set up ${getBiometricTypeLabel()} in device settings first`
              }
              hasSwitch
              switchValue={biometricState.isEnabled}
              onSwitchChange={handleBiometricToggle}
              showChevron={false}
            />
          ) : (
            <SettingRow
              icon="finger-print-outline"
              iconColor="#9CA3AF"
              title="Biometric Sign-In"
              subtitle="Not available on this device"
              showChevron={false}
            />
          )}
          <SettingRow
            icon="lock-closed-outline"
            iconColor="#EC4899"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => Alert.alert('Change Password', 'Password change will be sent to your email.')}
          />
          <SettingRow
            icon="shield-outline"
            iconColor="#EC4899"
            title="Two-Factor Authentication"
            subtitle="Add an extra layer of security"
            onPress={() => Alert.alert('Coming Soon', 'Two-factor authentication will be available soon.')}
          />
        </View>

        {/* App Settings Section */}
        <SectionHeader title="App Settings" />
        <View style={styles.section}>
          <SettingRow
            icon="language-outline"
            iconColor="#8B5CF6"
            title="Language"
            value={currentLanguage}
            onPress={() => setShowLanguageModal(true)}
          />
          <SettingRow
            icon="moon-outline"
            iconColor="#8B5CF6"
            title="Theme"
            value={THEME_OPTIONS.find(t => t.value === settings.app.theme)?.label || 'System'}
            onPress={() => {
              Alert.alert('Theme', 'Choose app theme', [
                { text: 'Light', onPress: () => updateAppSettings({ theme: 'light' }) },
                { text: 'Dark', onPress: () => updateAppSettings({ theme: 'dark' }) },
                { text: 'System Default', onPress: () => updateAppSettings({ theme: 'system' }) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
        </View>

        {/* Support Section */}
        <SectionHeader title="Support" />
        <View style={styles.section}>
          <SettingRow
            icon="help-circle-outline"
            iconColor="#6B7280"
            title="Help Center"
            onPress={() => router.push('/profile/help')}
          />
          <SettingRow
            icon="document-text-outline"
            iconColor="#6B7280"
            title="Terms of Service"
            onPress={() => router.push('/profile/terms')}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#6B7280"
            title="Privacy Policy"
            onPress={() => router.push('/profile/privacy')}
          />
          <SettingRow
            icon="analytics-outline"
            iconColor="#6B7280"
            title="Cookie Policy"
            onPress={() => router.push('/profile/cookies')}
          />
          <SettingRow
            icon="information-circle-outline"
            iconColor="#6B7280"
            title="About"
            value="v1.0.0"
            onPress={() => router.push('/profile/about')}
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Account Actions" />
        <View style={styles.section}>
          <SettingRow
            icon="log-out-outline"
            iconColor="#F59E0B"
            title="Sign Out"
            onPress={handleSignOut}
          />
          <SettingRow
            icon="trash-outline"
            iconColor="#EF4444"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ethiopian Maids v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Language</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {AVAILABLE_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.languageOption}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <View>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.languageNative}>{lang.nativeName}</Text>
                </View>
                {settings.app.language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={profileUpdating}>
              <Text style={[styles.modalSave, profileUpdating && styles.modalSaveDisabled]}>
                {profileUpdating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Biometric Password Confirmation Modal */}
      <Modal
        visible={showBiometricPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBiometricPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBiometricPasswordModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Enable {getBiometricTypeLabel()}</Text>
            <TouchableOpacity onPress={handleConfirmBiometricSetup} disabled={biometricProcessing}>
              <Text style={[styles.modalSave, biometricProcessing && styles.modalSaveDisabled]}>
                {biometricProcessing ? 'Enabling...' : 'Enable'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.biometricIconContainer}>
              <Ionicons
                name={getBiometricIcon() as keyof typeof Ionicons.glyphMap}
                size={64}
                color="#EC4899"
              />
            </View>
            <Text style={styles.biometricDescription}>
              Enter your password to enable {getBiometricTypeLabel()} sign-in.
              Your password will be securely stored on this device.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={biometricPassword}
                onChangeText={setBiometricPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoFocus
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  dangerText: {
    color: '#EF4444',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  languageNative: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  biometricIconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  biometricDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
});
