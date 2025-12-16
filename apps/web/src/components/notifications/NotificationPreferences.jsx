/**
 * NotificationPreferences Component
 * Allows users to manage their notification settings with persistence to Hasura
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/LoadingStates';
import {
  notificationSettingsService,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CATEGORIES,
} from '@/services/notificationSettingsService';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Moon,
  Save,
  RefreshCw,
  Settings,
  Briefcase,
  Calendar,
  CreditCard,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Category icons mapping
const CATEGORY_ICONS = {
  applications: Briefcase,
  messages: MessageSquare,
  bookings: Calendar,
  profile: Users,
  jobs: Briefcase,
  payments: CreditCard,
  system: Settings,
};

/**
 * Channel Toggle - Toggle a notification channel on/off
 */
function ChannelToggle({ channel, label, icon: Icon, enabled, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <Label className="font-medium">{label}</Label>
          <p className="text-sm text-gray-500">
            {channel === 'email' && 'Receive notifications via email'}
            {channel === 'push' && 'Receive push notifications on your device'}
            {channel === 'sms' && 'Receive SMS notifications (requires phone number)'}
            {channel === 'inApp' && 'See notifications in the app'}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => onChange(channel, checked)}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Notification Type Setting - Individual notification type preferences
 */
function NotificationTypeSetting({ type, label, preferences, channels, onChange, disabled }) {
  return (
    <div className="py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-4">
          {channels.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-gray-400" />
              <Switch
                checked={preferences?.email ?? true}
                onCheckedChange={(checked) => onChange(type, 'email', checked)}
                disabled={disabled}
                className="scale-75"
              />
            </div>
          )}
          {channels.push && (
            <div className="flex items-center gap-1">
              <Smartphone className="h-3 w-3 text-gray-400" />
              <Switch
                checked={preferences?.push ?? true}
                onCheckedChange={(checked) => onChange(type, 'push', checked)}
                disabled={disabled}
                className="scale-75"
              />
            </div>
          )}
          {channels.inApp && (
            <div className="flex items-center gap-1">
              <Bell className="h-3 w-3 text-gray-400" />
              <Switch
                checked={preferences?.inApp ?? true}
                onCheckedChange={(checked) => onChange(type, 'inApp', checked)}
                disabled={disabled}
                className="scale-75"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Category Section - Collapsible category with notification types
 */
function CategorySection({ categoryKey, category, settings, channels, onTypeChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const CategoryIcon = CATEGORY_ICONS[categoryKey] || Bell;

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <CategoryIcon className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{category.label}</span>
          <span className="text-xs text-gray-400">({category.types.length} types)</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="border-t px-4 pb-4">
          <div className="space-y-1 pt-2">
            {category.types.map((type) => (
              <NotificationTypeSetting
                key={type}
                type={type}
                label={NOTIFICATION_TYPE_LABELS[type] || type}
                preferences={settings.notification_types?.[type]}
                channels={channels}
                onChange={onTypeChange}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quiet Hours Setting
 */
function QuietHoursSetting({ enabled, startTime, endTime, onChange, disabled }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Moon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Quiet Hours</CardTitle>
            <CardDescription>
              Pause notifications during specific times
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Enable Quiet Hours</Label>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => onChange('quiet_hours_enabled', checked)}
            disabled={disabled}
          />
        </div>

        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Start Time</Label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => onChange('quiet_hours_start', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">End Time</Label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => onChange('quiet_hours_end', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </motion.div>
        )}

        <p className="text-xs text-gray-500">
          During quiet hours, you won't receive push notifications. Important alerts will still be delivered.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * NotificationPreferences - Main component
 */
export function NotificationPreferences({ onClose }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const result = await notificationSettingsService.getSettings(user.id);
      if (result.error) {
        console.error('Error fetching settings:', result.error);
      }
      setSettings(result.data);
      setOriginalSettings(result.data);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      // Use defaults on error
      const defaults = notificationSettingsService.getDefaultSettings();
      setSettings({ ...defaults, user_id: user.id });
      setOriginalSettings({ ...defaults, user_id: user.id });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Track changes
  useEffect(() => {
    if (settings && originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  // Handle channel toggle
  const handleChannelToggle = useCallback((channel, enabled) => {
    setSettings(prev => ({
      ...prev,
      [`${channel}_enabled`]: enabled,
    }));
  }, []);

  // Handle notification type preference change
  const handleTypePreferenceChange = useCallback((type, channel, enabled) => {
    setSettings(prev => {
      const notificationTypes = { ...prev.notification_types };
      if (!notificationTypes[type]) {
        notificationTypes[type] = { email: true, push: true, inApp: true };
      }
      notificationTypes[type][channel] = enabled;
      return { ...prev, notification_types: notificationTypes };
    });
  }, []);

  // Handle quiet hours and email frequency changes
  const handleSettingChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Save settings
  const handleSave = async () => {
    if (!user?.id || !hasChanges) return;

    setIsSaving(true);
    try {
      const result = await notificationSettingsService.saveSettings(user.id, settings);

      if (result.error) {
        throw result.error;
      }

      setOriginalSettings(settings);
      setHasChanges(false);
      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    const defaults = notificationSettingsService.getDefaultSettings();
    setSettings({ ...defaults, user_id: user?.id });
  };

  // Discard changes
  const handleDiscard = () => {
    setSettings(originalSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading notification settings..." />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load notification settings.</p>
        <Button variant="outline" onClick={fetchSettings} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Get enabled channels for type preferences
  const enabledChannels = {
    email: settings.email_enabled,
    push: settings.push_enabled,
    inApp: settings.in_app_enabled,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-500">Manage how you receive notifications</p>
          </div>
        </div>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Button variant="outline" size="sm" onClick={handleDiscard}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Notification Channels */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <ChannelToggle
            channel="email"
            label="Email Notifications"
            icon={Mail}
            enabled={settings.email_enabled}
            onChange={handleChannelToggle}
            disabled={isSaving}
          />
          <Separator />
          <ChannelToggle
            channel="push"
            label="Push Notifications"
            icon={Smartphone}
            enabled={settings.push_enabled}
            onChange={handleChannelToggle}
            disabled={isSaving}
          />
          <Separator />
          <ChannelToggle
            channel="sms"
            label="SMS Notifications"
            icon={MessageSquare}
            enabled={settings.sms_enabled}
            onChange={handleChannelToggle}
            disabled={isSaving}
          />
          <Separator />
          <ChannelToggle
            channel="inApp"
            label="In-App Notifications"
            icon={Bell}
            enabled={settings.in_app_enabled}
            onChange={(_, checked) => handleSettingChange('in_app_enabled', checked)}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Email Frequency */}
      {settings.email_enabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Email Digest Frequency</CardTitle>
              <CardDescription>
                How often would you like to receive email notifications?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.email_frequency}
                onValueChange={(value) => handleSettingChange('email_frequency', value)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant (as they happen)</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quiet Hours */}
      <QuietHoursSetting
        enabled={settings.quiet_hours_enabled}
        startTime={settings.quiet_hours_start}
        endTime={settings.quiet_hours_end}
        onChange={handleSettingChange}
        disabled={isSaving}
      />

      {/* Notification Types by Category */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notification Types</CardTitle>
          <CardDescription>
            Customize which notifications you receive for each category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 mb-4 text-xs text-gray-500 justify-end pr-3">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              <span>Push</span>
            </div>
            <div className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              <span>In-App</span>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(NOTIFICATION_CATEGORIES).map(([categoryKey, category]) => (
              <CategorySection
                key={categoryKey}
                categoryKey={categoryKey}
                category={category}
                settings={settings}
                channels={enabledChannels}
                onTypeChange={handleTypePreferenceChange}
                disabled={isSaving}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Note about notifications</p>
          <p className="text-blue-700">
            Critical security and account notifications will always be sent regardless of your preferences.
            You can unsubscribe from marketing emails at any time.
          </p>
        </div>
      </div>

      {/* Reset to Defaults */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>

        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

export default NotificationPreferences;
