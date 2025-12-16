/**
 * Notification Preferences Screen
 *
 * Full notification settings synced with web.
 * Includes channel toggles, quiet hours, and per-type preferences.
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useNotificationSettings,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CATEGORIES,
  type ChannelType,
  type EmailFrequency,
} from '../../hooks/useNotificationSettings';

// Setting row component
interface SettingRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
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
  disabled,
}: SettingRowProps) => (
  <TouchableOpacity
    style={[styles.settingRow, disabled && styles.settingRowDisabled]}
    onPress={onPress}
    disabled={(hasSwitch && !onPress) || disabled}
    activeOpacity={hasSwitch ? 1 : 0.7}
  >
    {icon && (
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
    )}
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, disabled && styles.textDisabled]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {value && <Text style={styles.settingValue}>{value}</Text>}
    {hasSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
        thumbColor="#fff"
        disabled={disabled}
      />
    )}
    {showChevron && !hasSwitch && (
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

// Section header
const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeader}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubheader}>{subtitle}</Text>}
  </View>
);

// Email frequency options
const EMAIL_FREQUENCY_OPTIONS: { value: EmailFrequency; label: string; description: string }[] = [
  { value: 'instant', label: 'Instant', description: 'Receive emails immediately' },
  { value: 'daily', label: 'Daily Digest', description: 'One summary email per day' },
  { value: 'weekly', label: 'Weekly Digest', description: 'One summary email per week' },
];

export default function NotificationPreferencesScreen() {
  const {
    settings,
    loading,
    saving,
    toggleChannel,
    setEmailFrequency,
    setQuietHours,
    updateTypePreference,
    resetToDefaults,
    isInQuietHours,
  } = useNotificationSettings();

  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showQuietHoursModal, setShowQuietHoursModal] = useState(false);
  const [showTypePrefsModal, setShowTypePrefsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tempStartTime, setTempStartTime] = useState<Date>(new Date());
  const [tempEndTime, setTempEndTime] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Parse time string to Date
  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Format Date to time string
  const formatTime = (date: Date): string => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Format time for display
  const formatTimeDisplay = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Handle channel toggle with error handling
  const handleChannelToggle = async (channel: ChannelType, value: boolean) => {
    try {
      await toggleChannel(channel, value);
    } catch (err) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  // Handle email frequency change
  const handleFrequencyChange = async (frequency: EmailFrequency) => {
    try {
      await setEmailFrequency(frequency);
      setShowFrequencyModal(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update email frequency');
    }
  };

  // Open quiet hours modal
  const openQuietHoursModal = () => {
    if (settings) {
      setTempStartTime(parseTimeString(settings.quiet_hours_start));
      setTempEndTime(parseTimeString(settings.quiet_hours_end));
    }
    setShowQuietHoursModal(true);
  };

  // Save quiet hours
  const handleSaveQuietHours = async () => {
    try {
      await setQuietHours(
        settings?.quiet_hours_enabled ?? false,
        formatTime(tempStartTime),
        formatTime(tempEndTime)
      );
      setShowQuietHoursModal(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update quiet hours');
    }
  };

  // Handle quiet hours toggle
  const handleQuietHoursToggle = async (enabled: boolean) => {
    try {
      await setQuietHours(enabled);
    } catch (err) {
      Alert.alert('Error', 'Failed to update quiet hours');
    }
  };

  // Handle type preference update
  const handleTypePreferenceToggle = async (
    type: string,
    channel: 'email' | 'push' | 'inApp',
    enabled: boolean
  ) => {
    try {
      await updateTypePreference(type, channel, enabled);
    } catch (err) {
      Alert.alert('Error', 'Failed to update notification preference');
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all notification settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetToDefaults();
              Alert.alert('Success', 'Notification settings have been reset');
            } catch (err) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  // Get current email frequency label
  const currentFrequencyLabel = EMAIL_FREQUENCY_OPTIONS.find(
    (opt) => opt.value === settings?.email_frequency
  )?.label || 'Instant';

  return (
    <>
      <Stack.Screen options={{ title: 'Notification Preferences' }} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Sync Status */}
        <View style={styles.syncStatus}>
          <Ionicons
            name={saving ? 'cloud-upload-outline' : 'cloud-done-outline'}
            size={16}
            color={saving ? '#F59E0B' : '#10B981'}
          />
          <Text style={[styles.syncText, { color: saving ? '#F59E0B' : '#10B981' }]}>
            {saving ? 'Syncing...' : 'Synced with all devices'}
          </Text>
        </View>

        {/* Notification Channels */}
        <SectionHeader
          title="Notification Channels"
          subtitle="Choose how you want to receive notifications"
        />
        <View style={styles.section}>
          <SettingRow
            icon="notifications-outline"
            iconColor="#3B82F6"
            title="Push Notifications"
            subtitle="Alerts on your device"
            hasSwitch
            switchValue={settings?.push_enabled}
            onSwitchChange={(v) => handleChannelToggle('push', v)}
          />
          <SettingRow
            icon="mail-outline"
            iconColor="#F59E0B"
            title="Email Notifications"
            subtitle="Updates via email"
            hasSwitch
            switchValue={settings?.email_enabled}
            onSwitchChange={(v) => handleChannelToggle('email', v)}
          />
          <SettingRow
            icon="chatbubble-outline"
            iconColor="#10B981"
            title="SMS Notifications"
            subtitle="Text message alerts"
            hasSwitch
            switchValue={settings?.sms_enabled}
            onSwitchChange={(v) => handleChannelToggle('sms', v)}
          />
          <SettingRow
            icon="phone-portrait-outline"
            iconColor="#8B5CF6"
            title="In-App Notifications"
            subtitle="Notifications inside the app"
            hasSwitch
            switchValue={settings?.in_app_enabled}
            onSwitchChange={(v) => handleChannelToggle('in_app', v)}
          />
        </View>

        {/* Email Settings */}
        <SectionHeader title="Email Settings" />
        <View style={styles.section}>
          <SettingRow
            icon="time-outline"
            iconColor="#F59E0B"
            title="Email Frequency"
            value={currentFrequencyLabel}
            onPress={() => setShowFrequencyModal(true)}
            disabled={!settings?.email_enabled}
          />
        </View>

        {/* Quiet Hours */}
        <SectionHeader
          title="Quiet Hours"
          subtitle="Pause push notifications during specific times"
        />
        <View style={styles.section}>
          <SettingRow
            icon="moon-outline"
            iconColor="#6366F1"
            title="Enable Quiet Hours"
            subtitle={
              isInQuietHours()
                ? 'Currently in quiet hours'
                : settings?.quiet_hours_enabled
                ? `${formatTimeDisplay(settings.quiet_hours_start)} - ${formatTimeDisplay(settings.quiet_hours_end)}`
                : 'Disabled'
            }
            hasSwitch
            switchValue={settings?.quiet_hours_enabled}
            onSwitchChange={handleQuietHoursToggle}
          />
          {settings?.quiet_hours_enabled && (
            <SettingRow
              icon="time-outline"
              iconColor="#6366F1"
              title="Quiet Hours Schedule"
              value={`${formatTimeDisplay(settings.quiet_hours_start)} - ${formatTimeDisplay(settings.quiet_hours_end)}`}
              onPress={openQuietHoursModal}
            />
          )}
        </View>

        {/* Notification Types */}
        <SectionHeader
          title="Notification Types"
          subtitle="Customize notifications for each category"
        />
        <View style={styles.section}>
          {Object.entries(NOTIFICATION_CATEGORIES).map(([key, category]) => (
            <SettingRow
              key={key}
              icon={
                key === 'applications'
                  ? 'document-text-outline'
                  : key === 'messages'
                  ? 'chatbubbles-outline'
                  : key === 'bookings'
                  ? 'calendar-outline'
                  : key === 'profile'
                  ? 'person-outline'
                  : key === 'jobs'
                  ? 'briefcase-outline'
                  : key === 'payments'
                  ? 'card-outline'
                  : 'megaphone-outline'
              }
              iconColor={
                key === 'applications'
                  ? '#3B82F6'
                  : key === 'messages'
                  ? '#10B981'
                  : key === 'bookings'
                  ? '#F59E0B'
                  : key === 'profile'
                  ? '#EC4899'
                  : key === 'jobs'
                  ? '#8B5CF6'
                  : key === 'payments'
                  ? '#06B6D4'
                  : '#6B7280'
              }
              title={category.label}
              subtitle={`${category.types.length} notification types`}
              onPress={() => {
                setSelectedCategory(key);
                setShowTypePrefsModal(true);
              }}
            />
          ))}
        </View>

        {/* Reset to Defaults */}
        <View style={styles.resetContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetToDefaults}>
            <Ionicons name="refresh-outline" size={18} color="#EF4444" />
            <Text style={styles.resetText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Email Frequency Modal */}
      <Modal
        visible={showFrequencyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Email Frequency</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {EMAIL_FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionRow}
                onPress={() => handleFrequencyChange(option.value)}
              >
                <View>
                  <Text style={styles.optionTitle}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {settings?.email_frequency === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Quiet Hours Modal */}
      <Modal
        visible={showQuietHoursModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuietHoursModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuietHoursModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quiet Hours</Text>
            <TouchableOpacity onPress={handleSaveQuietHours} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.timePickerContainer}>
              <Text style={styles.timePickerLabel}>Start Time</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(formatTime(tempStartTime))}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={tempStartTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, date) => {
                    setShowStartPicker(false);
                    if (date) setTempStartTime(date);
                  }}
                />
              )}
            </View>

            <View style={styles.timePickerContainer}>
              <Text style={styles.timePickerLabel}>End Time</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(formatTime(tempEndTime))}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={tempEndTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, date) => {
                    setShowEndPicker(false);
                    if (date) setTempEndTime(date);
                  }}
                />
              )}
            </View>

            <Text style={styles.quietHoursNote}>
              Push notifications will be silenced during quiet hours.
              You can still view notifications in the app.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Type Preferences Modal */}
      <Modal
        visible={showTypePrefsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTypePrefsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTypePrefsModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedCategory
                ? NOTIFICATION_CATEGORIES[selectedCategory as keyof typeof NOTIFICATION_CATEGORIES]?.label
                : 'Notifications'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {selectedCategory &&
              NOTIFICATION_CATEGORIES[selectedCategory as keyof typeof NOTIFICATION_CATEGORIES]?.types.map(
                (type) => {
                  const typePrefs = settings?.notification_types?.[type] || {
                    email: true,
                    push: true,
                    inApp: true,
                  };

                  return (
                    <View key={type} style={styles.typePrefsContainer}>
                      <Text style={styles.typePrefsTitle}>
                        {NOTIFICATION_TYPE_LABELS[type] || type}
                      </Text>
                      <View style={styles.typePrefsRow}>
                        <View style={styles.typePrefsOption}>
                          <Text style={styles.typePrefsOptionLabel}>Email</Text>
                          <Switch
                            value={typePrefs.email}
                            onValueChange={(v) =>
                              handleTypePreferenceToggle(type, 'email', v)
                            }
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor="#fff"
                            disabled={!settings?.email_enabled}
                          />
                        </View>
                        <View style={styles.typePrefsOption}>
                          <Text style={styles.typePrefsOptionLabel}>Push</Text>
                          <Switch
                            value={typePrefs.push}
                            onValueChange={(v) =>
                              handleTypePreferenceToggle(type, 'push', v)
                            }
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor="#fff"
                            disabled={!settings?.push_enabled}
                          />
                        </View>
                        <View style={styles.typePrefsOption}>
                          <Text style={styles.typePrefsOptionLabel}>In-App</Text>
                          <Switch
                            value={typePrefs.inApp}
                            onValueChange={(v) =>
                              handleTypePreferenceToggle(type, 'inApp', v)
                            }
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor="#fff"
                            disabled={!settings?.in_app_enabled}
                          />
                        </View>
                      </View>
                    </View>
                  );
                }
              )}
          </ScrollView>
        </View>
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
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  syncText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  sectionSubheader: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
  settingRowDisabled: {
    opacity: 0.5,
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
  textDisabled: {
    color: '#9CA3AF',
  },
  resetContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resetText: {
    fontSize: 15,
    color: '#EF4444',
    marginLeft: 6,
    fontWeight: '500',
  },
  footer: {
    height: 40,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  // Quiet hours modal
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  quietHoursNote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  // Type preferences
  typePrefsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  typePrefsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  typePrefsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typePrefsOption: {
    alignItems: 'center',
  },
  typePrefsOptionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
});
