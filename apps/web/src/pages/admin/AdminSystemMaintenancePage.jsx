import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Power,
  RefreshCw,
  Database,
  Shield,
  Send,
  Users,
  Download,
  Activity,
} from 'lucide-react';

// GraphQL Queries & Mutations using correct schema
const GET_MAINTENANCE_SETTINGS = gql`
  query GetMaintenanceSettings {
    system_settings(where: { setting_key: { _in: [
      "maintenance_mode",
      "maintenance_scheduled_start",
      "maintenance_scheduled_end"
    ] } }) {
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

const GET_BACKUP_DATA = gql`
  query GetBackupData {
    system_settings {
      setting_key
      setting_value
      updated_at
    }
    admin_users {
      id
      email
      full_name
      role
      is_active
      created_at
    }
    profiles_aggregate {
      aggregate { count }
    }
    maid_profiles_aggregate {
      aggregate { count }
    }
  }
`;

const SECURITY_CHECK_QUERY = gql`
  query SecurityCheck {
    admin_users(where: { is_active: { _eq: true } }) {
      id
      email
      role
      last_login_at
    }
    system_settings(where: { setting_key: { _in: [
      "maintenance_mode",
      "require_email_verification",
      "max_login_attempts",
      "session_timeout"
    ] } }) {
      setting_key
      setting_value
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

function toLocalDatetime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDatetime(localStr) {
  if (!localStr) return null;
  return new Date(localStr).toISOString();
}

function getScheduleStatus(start, end) {
  if (!start && !end) return null;
  const now = new Date();
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (startDate && startDate > now) return 'upcoming';
  if (endDate && endDate < now) return 'expired';
  return 'active';
}

function formatDate(dateString) {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AdminSystemMaintenancePage = () => {
  const { toast } = useToast();
  const { adminUser, logAdminActivity } = useAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // tracks which system action is running
  const [securityResults, setSecurityResults] = useState(null);

  // Settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [originalMode, setOriginalMode] = useState(false);

  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apolloClient.query({
        query: GET_MAINTENANCE_SETTINGS,
        fetchPolicy: 'network-only',
      });

      const rows = data?.system_settings || [];
      const settingsMap = {};
      rows.forEach(({ setting_key, setting_value }) => {
        settingsMap[setting_key] = setting_value;
      });

      const mode = settingsMap.maintenance_mode === true || settingsMap.maintenance_mode === 'true';
      setMaintenanceMode(mode);
      setOriginalMode(mode);
      setScheduledStart(toLocalDatetime(settingsMap.maintenance_scheduled_start));
      setScheduledEnd(toLocalDatetime(settingsMap.maintenance_scheduled_end));
    } catch (err) {
      logger.error('Failed to fetch maintenance status:', err);
      toast({
        title: 'Error',
        description: 'Failed to load maintenance settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, [fetchMaintenanceStatus]);

  const saveSetting = async (key, value) => {
    await apolloClient.mutate({
      mutation: UPSERT_SYSTEM_SETTING,
      variables: {
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const sendMaintenanceNotifications = async (type) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_USER_IDS,
        fetchPolicy: 'network-only',
      });

      const userIds = data?.profiles?.map(p => p.id) || [];
      if (userIds.length === 0) return 0;

      const isDown = type === 'maintenance_started';
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: isDown ? 'Scheduled Maintenance' : "We're Back Online!",
        message: isDown
          ? 'Ethiopian Maids Platform is undergoing scheduled maintenance. We apologize for the inconvenience and will be back shortly.'
          : 'Ethiopian Maids Platform maintenance is complete. All services are now restored. Thank you for your patience!',
        type: 'system_announcement',
      }));

      // Batch insert (100 at a time)
      let totalInserted = 0;
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        const { data: result } = await apolloClient.mutate({
          mutation: CREATE_BULK_NOTIFICATIONS,
          variables: { data: batch },
        });
        totalInserted += result?.insert_notifications?.affected_rows || 0;
      }

      return totalInserted;
    } catch (err) {
      logger.error('Failed to send notifications:', err);
      return 0;
    }
  };

  const handleMaintenanceModeToggle = () => {
    setShowMaintenanceAlert(true);
  };

  const confirmMaintenanceModeToggle = async () => {
    try {
      setSaving(true);
      const newMode = !maintenanceMode;

      await saveSetting('maintenance_mode', newMode);

      // Log activity
      if (adminUser) {
        try {
          await logAdminActivity(
            newMode ? 'maintenance_mode_enabled' : 'maintenance_mode_disabled',
            'system',
            'maintenance_mode',
            { previous_state: maintenanceMode, new_state: newMode }
          );
        } catch (logErr) {
          logger.warn('Failed to log activity:', logErr);
        }
      }

      // Send notifications
      if (newMode) {
        const count = await sendMaintenanceNotifications('maintenance_started');
        toast({
          title: 'Maintenance Mode Enabled',
          description: `Platform is in maintenance mode. ${count} user(s) notified.`,
        });
      } else {
        const count = await sendMaintenanceNotifications('maintenance_ended');
        toast({
          title: 'Site Back Online',
          description: `Maintenance mode disabled. ${count} user(s) notified.`,
        });
      }

      setMaintenanceMode(newMode);
      setOriginalMode(newMode);
      setShowMaintenanceAlert(false);
    } catch (err) {
      logger.error('Failed to toggle maintenance mode:', err);
      toast({
        title: 'Error',
        description: 'Failed to update maintenance mode.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);

      const startISO = fromLocalDatetime(scheduledStart);
      const endISO = fromLocalDatetime(scheduledEnd);

      // Validate
      if (startISO && endISO && new Date(startISO) >= new Date(endISO)) {
        toast({
          title: 'Validation Error',
          description: 'End time must be after start time.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      await saveSetting('maintenance_scheduled_start', startISO);
      await saveSetting('maintenance_scheduled_end', endISO);

      if (adminUser) {
        try {
          await logAdminActivity('maintenance_schedule_updated', 'system', 'maintenance_schedule', {
            scheduled_start: startISO,
            scheduled_end: endISO,
          });
        } catch (logErr) {
          logger.warn('Failed to log activity:', logErr);
        }
      }

      toast({
        title: 'Schedule Saved',
        description: 'Maintenance schedule has been updated.',
      });
    } catch (err) {
      logger.error('Failed to save schedule:', err);
      toast({
        title: 'Error',
        description: 'Failed to save maintenance schedule.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearSchedule = async () => {
    try {
      setSaving(true);
      await saveSetting('maintenance_scheduled_start', null);
      await saveSetting('maintenance_scheduled_end', null);
      setScheduledStart('');
      setScheduledEnd('');

      toast({
        title: 'Schedule Cleared',
        description: 'Maintenance schedule has been cleared.',
      });
    } catch (err) {
      logger.error('Failed to clear schedule:', err);
      toast({
        title: 'Error',
        description: 'Failed to clear schedule.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManualNotify = async (type) => {
    try {
      setNotifying(true);
      const count = await sendMaintenanceNotifications(type);
      toast({
        title: 'Notifications Sent',
        description: `${count} user(s) have been notified.`,
      });

      if (adminUser) {
        try {
          await logAdminActivity('manual_notification_sent', 'system', 'maintenance_notification', {
            notification_type: type,
            users_notified: count,
          });
        } catch (logErr) {
          logger.warn('Failed to log activity:', logErr);
        }
      }
    } catch (err) {
      logger.error('Failed to send notifications:', err);
      toast({
        title: 'Error',
        description: 'Failed to send notifications.',
        variant: 'destructive',
      });
    } finally {
      setNotifying(false);
    }
  };

  // System Action handlers
  const handleDatabaseBackup = async () => {
    try {
      setActionLoading('backup');
      const { data } = await apolloClient.query({
        query: GET_BACKUP_DATA,
        fetchPolicy: 'network-only',
      });

      const backup = {
        exported_at: new Date().toISOString(),
        exported_by: adminUser?.email || 'unknown',
        system_settings: data.system_settings,
        admin_users: data.admin_users,
        stats: {
          total_profiles: data.profiles_aggregate?.aggregate?.count || 0,
          total_maid_profiles: data.maid_profiles_aggregate?.aggregate?.count || 0,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (adminUser) {
        try {
          await logAdminActivity('database_backup', 'system', 'backup', { type: 'settings_export' });
        } catch {}
      }

      toast({ title: 'Backup Downloaded', description: 'System settings and admin data exported successfully.' });
    } catch (err) {
      logger.error('Backup failed:', err);
      toast({ title: 'Backup Failed', description: 'Failed to export system data.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCache = async () => {
    try {
      setActionLoading('cache');
      await apolloClient.clearStore();
      await fetchMaintenanceStatus();

      toast({ title: 'Cache Cleared', description: 'Apollo cache cleared and data refreshed from server.' });
    } catch (err) {
      logger.error('Clear cache failed:', err);
      toast({ title: 'Error', description: 'Failed to clear cache.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSecurityScan = async () => {
    try {
      setActionLoading('security');
      const start = Date.now();
      const { data } = await apolloClient.query({
        query: SECURITY_CHECK_QUERY,
        fetchPolicy: 'network-only',
      });
      const responseTime = Date.now() - start;

      const activeAdmins = data.admin_users || [];
      const settingsMap = {};
      (data.system_settings || []).forEach(({ setting_key, setting_value }) => {
        settingsMap[setting_key] = setting_value;
      });

      const issues = [];
      const passed = [];

      // Check API responsiveness
      if (responseTime < 500) {
        passed.push(`API responding (${responseTime}ms)`);
      } else {
        issues.push(`Slow API response (${responseTime}ms)`);
      }

      // Check email verification
      if (settingsMap.require_email_verification) {
        passed.push('Email verification required');
      } else {
        issues.push('Email verification disabled');
      }

      // Check max login attempts
      const maxAttempts = settingsMap.max_login_attempts;
      if (maxAttempts && maxAttempts <= 5) {
        passed.push(`Login attempts limited (${maxAttempts})`);
      } else {
        issues.push(`Login attempts too high or unlimited (${maxAttempts || 'unlimited'})`);
      }

      // Check for admins without recent login
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const staleAdmins = activeAdmins.filter(a =>
        !a.last_login_at || new Date(a.last_login_at) < thirtyDaysAgo
      );
      if (staleAdmins.length > 0) {
        issues.push(`${staleAdmins.length} admin(s) haven't logged in for 30+ days`);
      } else {
        passed.push('All admins recently active');
      }

      // Auth token check
      const token = localStorage.getItem('firebase_auth_token');
      if (token) {
        passed.push('Auth token present');
      } else {
        issues.push('No auth token found');
      }

      setSecurityResults({ issues, passed, scannedAt: new Date().toLocaleTimeString() });
      toast({
        title: 'Security Scan Complete',
        description: issues.length === 0 ? 'No issues found.' : `${issues.length} issue(s) detected.`,
        variant: issues.length > 0 ? 'default' : 'default',
      });
    } catch (err) {
      logger.error('Security scan failed:', err);
      toast({ title: 'Scan Failed', description: 'Failed to run security scan.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleHealthCheck = () => {
    navigate('/admin/system/health');
  };

  const scheduleStatus = getScheduleStatus(
    fromLocalDatetime(scheduledStart),
    fromLocalDatetime(scheduledEnd)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Maintenance</h1>
          <p className="text-muted-foreground">Manage system maintenance mode and scheduled downtime</p>
        </div>
        <Button variant="outline" onClick={fetchMaintenanceStatus} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Maintenance Mode Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Power className="h-5 w-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Enable to prevent user access during system maintenance
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={maintenanceMode ? 'destructive' : 'default'} className="text-sm">
                {maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceModeToggle}
                disabled={saving}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {maintenanceMode ? (
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Maintenance Mode is Active</p>
                <p className="text-xs text-red-700 mt-1">
                  Users are currently unable to access the platform. Only administrators can log in.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">System is Operational</p>
                <p className="text-xs text-green-700 mt-1">
                  All users have normal access to the platform.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Maintenance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Maintenance
              </CardTitle>
              <CardDescription>Plan a maintenance window to automatically block users</CardDescription>
            </div>
            {scheduleStatus && (
              <Badge
                variant={scheduleStatus === 'active' ? 'destructive' : scheduleStatus === 'upcoming' ? 'secondary' : 'outline'}
                className="text-sm"
              >
                {scheduleStatus === 'active' && <Clock className="h-3 w-3 mr-1" />}
                {scheduleStatus === 'upcoming' && <Calendar className="h-3 w-3 mr-1" />}
                {scheduleStatus === 'expired' && <CheckCircle className="h-3 w-3 mr-1" />}
                {scheduleStatus.charAt(0).toUpperCase() + scheduleStatus.slice(1)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduleStatus === 'active' && (
              <Alert className="border-red-200 bg-red-50/50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Scheduled maintenance is currently <strong>active</strong>. Users are being blocked by the maintenance gate.
                </AlertDescription>
              </Alert>
            )}

            {scheduleStatus === 'upcoming' && (
              <Alert className="border-blue-200 bg-blue-50/50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Maintenance is <strong>scheduled</strong>. It will activate on {formatDate(fromLocalDatetime(scheduledStart))}.
                </AlertDescription>
              </Alert>
            )}

            {scheduleStatus === 'expired' && (
              <Alert className="border-yellow-200 bg-yellow-50/50">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Previous schedule has <strong>expired</strong>. Clear it or set a new window.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="mt-1"
                />
                {scheduledStart && (
                  <p className="text-xs text-muted-foreground mt-1">
                    UTC: {fromLocalDatetime(scheduledStart)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="mt-1"
                />
                {scheduledEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    UTC: {fromLocalDatetime(scheduledEnd)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSaveSchedule} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="mr-2 h-4 w-4" />
                )}
                Save Schedule
              </Button>
              {(scheduledStart || scheduledEnd) && (
                <Button variant="outline" onClick={handleClearSchedule} disabled={saving}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Clear Schedule
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              When a scheduled window is active, the MaintenanceGate blocks all non-admin routes automatically.
              This works independently of the manual maintenance toggle above.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            User Notifications
          </CardTitle>
          <CardDescription>Manually notify users about maintenance or site restoration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Notify: Maintenance Starting</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Send notification to all active users that maintenance is starting
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManualNotify('maintenance_started')}
                  disabled={notifying}
                >
                  {notifying ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-3 w-3" />
                  )}
                  Send Notification
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Notify: Site Back Online</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Send notification to all active users that the site is back online
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManualNotify('maintenance_ended')}
                  disabled={notifying}
                >
                  {notifying ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-3 w-3" />
                  )}
                  Send Notification
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Toggling maintenance mode above automatically sends notifications. Use these buttons for manual resends.
          </p>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Actions
          </CardTitle>
          <CardDescription>Administrative actions for system management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Database className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Export System Data</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Download system settings, admin users, and stats as JSON
                </p>
                <Button variant="outline" size="sm" onClick={handleDatabaseBackup} disabled={actionLoading === 'backup'}>
                  {actionLoading === 'backup' ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-3 w-3" />
                  )}
                  Export Now
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <RefreshCw className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Clear Cache</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Clear Apollo cache and refresh data from server
                </p>
                <Button variant="outline" size="sm" onClick={handleClearCache} disabled={actionLoading === 'cache'}>
                  {actionLoading === 'cache' ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-3 w-3" />
                  )}
                  Clear Cache
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Security Scan</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Check API health, auth config, and admin account activity
                </p>
                <Button variant="outline" size="sm" onClick={handleSecurityScan} disabled={actionLoading === 'security'}>
                  {actionLoading === 'security' ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-3 w-3" />
                  )}
                  Run Scan
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Activity className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Health Check</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Open the real-time System Health Monitor
                </p>
                <Button variant="outline" size="sm" onClick={handleHealthCheck}>
                  <Activity className="mr-2 h-3 w-3" />
                  Open Monitor
                </Button>
              </div>
            </div>
          </div>

          {/* Security Scan Results */}
          {securityResults && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Security Scan Results</p>
                <span className="text-xs text-muted-foreground">Scanned at {securityResults.scannedAt}</span>
              </div>
              {securityResults.passed.length > 0 && (
                <div className="space-y-1 mb-3">
                  {securityResults.passed.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="text-green-700">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {securityResults.issues.length > 0 && (
                <div className="space-y-1">
                  {securityResults.issues.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />
                      <span className="text-yellow-700">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Mode Confirmation */}
      <AlertDialog open={showMaintenanceAlert} onOpenChange={setShowMaintenanceAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {maintenanceMode ? 'Disable Maintenance Mode?' : 'Enable Maintenance Mode?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {maintenanceMode
                ? 'This will restore normal user access to the platform and notify all users that the site is back online. Make sure all maintenance work is complete.'
                : 'This will prevent all users (except administrators) from accessing the platform and send a notification to all users. Use this only during critical maintenance work.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMaintenanceModeToggle} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {maintenanceMode ? 'Disable' : 'Enable'} Maintenance Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSystemMaintenancePage;
