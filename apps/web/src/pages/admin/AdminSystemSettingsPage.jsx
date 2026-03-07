import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Save,
  RefreshCw,
  Settings,
  Shield,
  Mail,
  Upload,
  Clock,
  Globe,
  CheckCircle2,
  XCircle,
  Calendar,
  Bell,
  Send,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminSystemSettingsPage');

// GraphQL Queries and Mutations
const GET_SYSTEM_SETTINGS = gql`
  query GetSystemSettings {
    system_settings {
      setting_key
      setting_value
    }
  }
`;

const UPSERT_SYSTEM_SETTING = gql`
  mutation UpsertSystemSetting($setting_key: String!, $setting_value: jsonb!, $updated_at: timestamptz!) {
    insert_system_settings_one(
      object: { setting_key: $setting_key, setting_value: $setting_value, updated_at: $updated_at }
      on_conflict: { constraint: system_settings_setting_key_key, update_columns: [setting_value, updated_at] }
    ) {
      setting_key
      setting_value
    }
  }
`;

const GET_ALL_USER_IDS = gql`
  query GetAllUserIds {
    profiles(where: { is_active: { _eq: true } }) {
      id
    }
  }
`;

const CREATE_BULK_NOTIFICATIONS = gql`
  mutation CreateBulkNotifications($data: [notifications_insert_input!]!) {
    insert_notifications(objects: $data) {
      affected_rows
    }
  }
`;

const AdminSystemSettingsPage = () => {
  const { canAccess, logAdminActivity } = useAdminAuth();
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const settingsConfig = [
    {
      section: 'Platform Settings',
      icon: Globe,
      description: 'Core platform configuration and behavior',
      settings: [
        {
          key: 'maintenance_mode',
          type: 'boolean',
          label: 'Maintenance Mode',
          description: 'Enable maintenance mode to temporarily disable the platform',
          icon: AlertTriangle,
          severity: 'high'
        },
        {
          key: 'new_registrations',
          type: 'boolean',
          label: 'Allow New Registrations',
          description: 'Allow new users to register on the platform',
          icon: Shield
        },
        {
          key: 'platform_name',
          type: 'string',
          label: 'Platform Name',
          description: 'Display name for the platform',
          icon: Globe
        }
      ]
    },
    {
      section: 'File & Upload Settings',
      icon: Upload,
      description: 'File upload and media management settings',
      settings: [
        {
          key: 'max_upload_size',
          type: 'number',
          label: 'Max Upload Size (MB)',
          description: 'Maximum file size for uploads in megabytes',
          icon: Upload,
          transform: (value) => Math.max(0, Math.round(value / 1048576)), // bytes to MB
          reverseTransform: (value) => Math.max(0, value) * 1048576 // MB to bytes
        }
      ]
    },
    {
      section: 'Security Settings',
      icon: Shield,
      description: 'Authentication and security configuration',
      settings: [
        {
          key: 'require_email_verification',
          type: 'boolean',
          label: 'Require Email Verification',
          description: 'Require users to verify their email before accessing the platform',
          icon: Mail
        },
        {
          key: 'session_timeout',
          type: 'number',
          label: 'Session Timeout (minutes)',
          description: 'User session timeout duration in minutes',
          icon: Clock
        },
        {
          key: 'max_login_attempts',
          type: 'number',
          label: 'Max Login Attempts',
          description: 'Maximum failed login attempts before account lockout',
          icon: Shield
        }
      ]
    },
    {
      section: 'Contact & Support',
      icon: Mail,
      description: 'Contact information and support settings',
      settings: [
        {
          key: 'support_email',
          type: 'string',
          label: 'Support Email',
          description: 'Email address for customer support',
          icon: Mail
        }
      ]
    }
  ];

  useEffect(() => {
    loadSettings();
    logAdminActivity('system_settings_view', 'settings', 'list');
  }, [logAdminActivity]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data } = await apolloClient.query({
        query: GET_SYSTEM_SETTINGS,
        fetchPolicy: 'network-only'
      });

      const settingsData = data?.system_settings || [];

      const settingsMap = {};
      settingsData.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      setSettings(settingsMap);
      setOriginalSettings({ ...settingsMap });
    } catch (error) {
      log.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    const hasChanges = Object.keys(newSettings).some(k => {
      return JSON.stringify(newSettings[k]) !== JSON.stringify(originalSettings[k]);
    });
    setIsDirty(hasChanges);
  };

  // Send in-app notifications to all active users
  const sendMaintenanceNotifications = async (type) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_USER_IDS,
        fetchPolicy: 'network-only',
      });

      const userIds = data?.profiles?.map(p => p.id) || [];
      if (userIds.length === 0) return 0;

      const platformName = settings.platform_name || 'Ethiopian Maids';
      const scheduledEnd = settings.maintenance_scheduled_end;

      let title, message;
      if (type === 'maintenance_started') {
        title = 'Scheduled Maintenance';
        message = `${platformName} is undergoing scheduled maintenance. ${scheduledEnd ? `Expected back online: ${new Date(scheduledEnd).toLocaleString()}.` : 'We\'ll be back shortly.'} Thank you for your patience.`;
      } else {
        title = 'We\'re Back Online!';
        message = `${platformName} maintenance is complete. All services are now restored. Thank you for your patience!`;
      }

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'system_announcement',
        title,
        message,
        priority: type === 'maintenance_started' ? 'high' : 'medium',
        link: '/',
      }));

      // Insert in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        await apolloClient.mutate({
          mutation: CREATE_BULK_NOTIFICATIONS,
          variables: { data: batch },
        });
      }

      return userIds.length;
    } catch (error) {
      log.error('Failed to send maintenance notifications:', error);
      throw error;
    }
  };

  const saveSettings = async () => {
    if (!canAccess('system', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to modify system settings.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Get changed settings
      const changedSettings = Object.keys(settings).filter(key => {
        return JSON.stringify(settings[key]) !== JSON.stringify(originalSettings[key]);
      });

      if (changedSettings.length === 0) {
        toast({
          title: 'No Changes',
          description: 'No settings have been modified.',
        });
        return;
      }

      // Update changed settings
      for (const key of changedSettings) {
        const value = settings[key];

        await apolloClient.mutate({
          mutation: UPSERT_SYSTEM_SETTING,
          variables: {
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString()
          }
        });
      }

      await logAdminActivity('system_settings_updated', 'settings', 'bulk', {
        changed_settings: changedSettings,
        changes: changedSettings.reduce((acc, key) => {
          acc[key] = {
            old_value: originalSettings[key],
            new_value: settings[key]
          };
          return acc;
        }, {})
      });

      // Auto-notify users on maintenance mode changes
      const maintenanceJustEnabled = changedSettings.includes('maintenance_mode') && settings.maintenance_mode && !originalSettings.maintenance_mode;
      const maintenanceJustDisabled = changedSettings.includes('maintenance_mode') && !settings.maintenance_mode && originalSettings.maintenance_mode;

      if (maintenanceJustEnabled) {
        try {
          const count = await sendMaintenanceNotifications('maintenance_started');
          toast({
            title: 'Maintenance Mode Enabled',
            description: `Platform is in maintenance mode. ${count} user(s) notified.`,
            variant: 'destructive',
          });
        } catch {
          toast({
            title: 'Maintenance Mode Enabled',
            description: 'Platform is in maintenance mode. Failed to send user notifications.',
            variant: 'destructive',
          });
        }
      } else if (maintenanceJustDisabled) {
        try {
          const count = await sendMaintenanceNotifications('maintenance_ended');
          toast({
            title: 'Site Back Online',
            description: `Maintenance mode disabled. ${count} user(s) notified that the site is back online.`,
          });
        } catch {
          toast({
            title: 'Site Back Online',
            description: 'Maintenance mode disabled. Failed to send user notifications.',
          });
        }
      } else {
        toast({
          title: 'Settings Saved',
          description: `Successfully updated ${changedSettings.length} setting(s).`,
        });
      }

      setOriginalSettings({ ...settings });
      setIsDirty(false);

    } catch (error) {
      log.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Manual notify button for sending notifications without toggling maintenance
  const handleManualNotify = async (type) => {
    setNotifying(true);
    try {
      const count = await sendMaintenanceNotifications(type);
      toast({
        title: 'Notifications Sent',
        description: `${count} user(s) have been notified.`,
      });
      await logAdminActivity('maintenance_notification_sent', 'settings', type, { users_notified: count });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send notifications.',
        variant: 'destructive',
      });
    } finally {
      setNotifying(false);
    }
  };

  const resetSettings = () => {
    setSettings({ ...originalSettings });
    setIsDirty(false);
  };

  const renderSettingInput = (settingConfig) => {
    const { key, type, label, description, transform, reverseTransform, severity } = settingConfig;
    let value = settings[key];

    // Apply transform for display
    if (transform && value != null) {
      value = transform(value);
    }

    const handleChange = (newValue) => {
      // Apply reverse transform for storage
      if (reverseTransform && newValue != null) {
        newValue = reverseTransform(newValue);
      }
      updateSetting(key, newValue);
    };

    const commonProps = {
      id: key,
      disabled: !canAccess('system', 'write')
    };

    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor={key} className="flex items-center gap-2">
                <settingConfig.icon className="h-4 w-4" />
                {label}
                {severity === 'high' && (
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                {...commonProps}
                checked={Boolean(value)}
                onCheckedChange={handleChange}
              />
              {value ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              <settingConfig.icon className="h-4 w-4" />
              {label}
            </Label>
            <Input
              {...commonProps}
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
              placeholder="Enter value"
            />
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        );

      case 'string':
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              <settingConfig.icon className="h-4 w-4" />
              {label}
            </Label>
            <Input
              {...commonProps}
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter value"
            />
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        );
    }
  };

  // Convert ISO string to datetime-local input value
  const toLocalDatetime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    // Format: YYYY-MM-DDTHH:MM
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Convert datetime-local input value to ISO string
  const fromLocalDatetime = (value) => {
    if (!value) return null;
    return new Date(value).toISOString();
  };

  const isScheduleActive = () => {
    const start = settings.maintenance_scheduled_start;
    const end = settings.maintenance_scheduled_end;
    if (!start && !end) return false;
    const now = new Date();
    if (start && new Date(start) > now) return false;
    if (end && new Date(end) < now) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform-wide settings and behavior
          </p>
        </div>

        {isDirty && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
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
          </div>
        )}
      </div>

      {/* Warning for maintenance mode */}
      {(settings.maintenance_mode || isScheduleActive()) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> {settings.maintenance_mode
              ? 'Maintenance mode is currently enabled. The platform is inaccessible to regular users.'
              : 'Scheduled maintenance is currently active. The platform is inaccessible to regular users.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsConfig.map((section) => (
          <Card key={section.section}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.section}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.settings.map((setting, settingIndex) => (
                <div key={setting.key}>
                  {renderSettingInput(setting)}
                  {settingIndex < section.settings.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Maintenance Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Maintenance Schedule
            </CardTitle>
            <CardDescription>
              Schedule maintenance windows. The site will automatically show a maintenance page during the scheduled time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance_scheduled_start" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Date & Time
                </Label>
                <Input
                  id="maintenance_scheduled_start"
                  type="datetime-local"
                  value={toLocalDatetime(settings.maintenance_scheduled_start)}
                  onChange={(e) => updateSetting('maintenance_scheduled_start', fromLocalDatetime(e.target.value))}
                  disabled={!canAccess('system', 'write')}
                />
                <p className="text-sm text-muted-foreground">When maintenance begins</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance_scheduled_end" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Date & Time
                </Label>
                <Input
                  id="maintenance_scheduled_end"
                  type="datetime-local"
                  value={toLocalDatetime(settings.maintenance_scheduled_end)}
                  onChange={(e) => updateSetting('maintenance_scheduled_end', fromLocalDatetime(e.target.value))}
                  disabled={!canAccess('system', 'write')}
                />
                <p className="text-sm text-muted-foreground">When maintenance ends (shown to users)</p>
              </div>
            </div>

            {/* Schedule status */}
            {(settings.maintenance_scheduled_start || settings.maintenance_scheduled_end) && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${isScheduleActive() ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                <Calendar className="h-4 w-4" />
                {isScheduleActive() ? (
                  <span><strong>Active now</strong> — Site is in scheduled maintenance</span>
                ) : settings.maintenance_scheduled_start && new Date(settings.maintenance_scheduled_start) > new Date() ? (
                  <span><strong>Upcoming</strong> — Maintenance scheduled for {new Date(settings.maintenance_scheduled_start).toLocaleString()}</span>
                ) : (
                  <span><strong>Expired</strong> — This schedule has passed</span>
                )}
              </div>
            )}

            {/* Clear schedule button */}
            {(settings.maintenance_scheduled_start || settings.maintenance_scheduled_end) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateSetting('maintenance_scheduled_start', null);
                  updateSetting('maintenance_scheduled_end', null);
                }}
                disabled={!canAccess('system', 'write')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear Schedule
              </Button>
            )}
          </CardContent>
        </Card>

        {/* User Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Maintenance Notifications
            </CardTitle>
            <CardDescription>
              Send in-app notifications to all users. Notifications are sent automatically when toggling maintenance mode.
              Use these buttons to send manual notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span>Notifications are automatically sent when you enable or disable maintenance mode via the toggle above.</span>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Manual Notifications</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleManualNotify('maintenance_started')}
                  disabled={notifying || !canAccess('system', 'write')}
                  className="flex-1"
                >
                  {notifying ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Notify: Maintenance Starting
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleManualNotify('maintenance_ended')}
                  disabled={notifying || !canAccess('system', 'write')}
                  className="flex-1"
                >
                  {notifying ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Notify: Site Back Online
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Changes Banner */}
      {isDirty && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96">
          <Card className="shadow-lg border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Unsaved Changes</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetSettings}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminSystemSettingsPage;
