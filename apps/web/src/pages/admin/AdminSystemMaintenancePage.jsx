import React, { useState, useEffect, useCallback } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from 'lucide-react';

const AdminSystemMaintenancePage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [scheduledMaintenance, setScheduledMaintenance] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    notify_users: true,
  });

  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch maintenance mode status via GraphQL
      const { data, errors: settingsError } = await apolloClient.query({
        query: gql`
          query GetMaintenanceStatus {
            system_settings(where: { key: { _eq: "maintenance_mode" } }) {
              key
              value
            }
            scheduled_maintenance(order_by: { start_time: asc }) {
              id
              title
              description
              start_time
              end_time
              notify_users
              created_at
            }
          }
        `,
        fetchPolicy: 'network-only'
      });

      if (settingsError) {
        throw new Error(settingsError[0]?.message || 'Failed to fetch settings');
      }

      const settings = data?.system_settings?.[0];
      setMaintenanceMode(settings?.value === 'true' || false);

      // Set scheduled maintenance
      setScheduledMaintenance(data?.scheduled_maintenance || []);
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

  const handleMaintenanceModeToggle = () => {
    setShowMaintenanceAlert(true);
  };

  const confirmMaintenanceModeToggle = async () => {
    try {
      setLoading(true);

      const newMode = !maintenanceMode;

      // Update system settings via GraphQL upsert
      const { errors: updateError } = await apolloClient.mutate({
        mutation: gql`
          mutation UpsertMaintenanceMode($key: String!, $value: String!, $updated_at: timestamptz!) {
            insert_system_settings_one(
              object: { key: $key, value: $value, updated_at: $updated_at }
              on_conflict: { constraint: system_settings_pkey, update_columns: [value, updated_at] }
            ) {
              key
              value
            }
          }
        `,
        variables: {
          key: 'maintenance_mode',
          value: newMode.toString(),
          updated_at: new Date().toISOString()
        }
      });

      if (updateError) throw new Error(updateError[0]?.message || 'Update failed');

      // Log activity via GraphQL
      await apolloClient.mutate({
        mutation: gql`
          mutation LogMaintenanceActivity($action: String!, $target_type: String!, $target_id: String!, $details: jsonb!) {
            insert_admin_activity_logs_one(object: {
              action: $action
              target_type: $target_type
              target_id: $target_id
              details: $details
            }) {
              id
            }
          }
        `,
        variables: {
          action: newMode ? 'maintenance_mode_enabled' : 'maintenance_mode_disabled',
          target_type: 'system',
          target_id: 'maintenance_mode',
          details: {
            previous_state: maintenanceMode,
            new_state: newMode,
          }
        }
      });

      setMaintenanceMode(newMode);

      toast({
        title: 'Maintenance Mode Updated',
        description: `Maintenance mode has been ${newMode ? 'enabled' : 'disabled'}.`,
      });

      setShowMaintenanceAlert(false);
    } catch (err) {
      logger.error('Failed to toggle maintenance mode:', err);
      toast({
        title: 'Error',
        description: 'Failed to update maintenance mode.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!scheduleForm.title || !scheduleForm.start_time || !scheduleForm.end_time) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { errors: insertError } = await apolloClient.mutate({
        mutation: gql`
          mutation InsertScheduledMaintenance($title: String!, $description: String, $start_time: timestamptz!, $end_time: timestamptz!, $notify_users: Boolean!, $status: String!) {
            insert_scheduled_maintenance_one(object: {
              title: $title
              description: $description
              start_time: $start_time
              end_time: $end_time
              notify_users: $notify_users
              status: $status
            }) {
              id
            }
          }
        `,
        variables: {
          title: scheduleForm.title,
          description: scheduleForm.description || null,
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          notify_users: scheduleForm.notify_users,
          status: 'scheduled'
        }
      });

      if (insertError) throw new Error(insertError[0]?.message || 'Failed to schedule');

      toast({
        title: 'Maintenance Scheduled',
        description: 'Scheduled maintenance has been created.',
      });

      setShowScheduleModal(false);
      setScheduleForm({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        notify_users: true,
      });

      fetchMaintenanceStatus();
    } catch (err) {
      logger.error('Failed to schedule maintenance:', err);
      toast({
        title: 'Error',
        description: 'Failed to schedule maintenance.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMaintenance = async (id) => {
    try {
      setLoading(true);

      const { errors: updateError } = await apolloClient.mutate({
        mutation: gql`
          mutation CancelScheduledMaintenance($id: uuid!, $cancelled_at: timestamptz!) {
            update_scheduled_maintenance_by_pk(
              pk_columns: { id: $id }
              _set: { status: "cancelled", cancelled_at: $cancelled_at }
            ) {
              id
            }
          }
        `,
        variables: {
          id,
          cancelled_at: new Date().toISOString()
        }
      });

      if (updateError) throw new Error(updateError[0]?.message || 'Failed to cancel');

      toast({
        title: 'Maintenance Cancelled',
        description: 'The scheduled maintenance has been cancelled.',
      });

      fetchMaintenanceStatus();
    } catch (err) {
      logger.error('Failed to cancel maintenance:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel maintenance.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      scheduled: { variant: 'secondary', icon: Clock, color: 'text-blue-500' },
      in_progress: { variant: 'default', icon: RefreshCw, color: 'text-yellow-500' },
      completed: { variant: 'outline', icon: CheckCircle, color: 'text-green-500' },
      cancelled: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
    };

    const { variant, icon: Icon, color } = config[status] || config.scheduled;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  if (loading && scheduledMaintenance.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Maintenance</h1>
        <p className="text-muted-foreground">Manage system maintenance mode and scheduled downtime</p>
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
                disabled={loading}
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
              <CardDescription>Plan and manage upcoming maintenance windows</CardDescription>
            </div>
            <Button onClick={() => setShowScheduleModal(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scheduledMaintenance.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Scheduled Maintenance</h3>
              <p className="text-sm text-muted-foreground">
                Schedule maintenance windows to notify users in advance
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledMaintenance.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{maintenance.title}</h4>
                      {getStatusBadge(maintenance.status)}
                    </div>
                    {maintenance.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {maintenance.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Start: {formatDate(maintenance.start_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        End: {formatDate(maintenance.end_time)}
                      </span>
                      {maintenance.notify_users && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          Users Notified
                        </span>
                      )}
                    </div>
                  </div>
                  {maintenance.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelMaintenance(maintenance.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
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
                <p className="text-sm font-medium">Database Backup</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Create a full database backup
                </p>
                <Button variant="outline" size="sm" disabled>
                  <Database className="mr-2 h-3 w-3" />
                  Backup Now
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <RefreshCw className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Clear Cache</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Clear system cache to improve performance
                </p>
                <Button variant="outline" size="sm" disabled>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Clear Cache
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Security Scan</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Run a security vulnerability scan
                </p>
                <Button variant="outline" size="sm" disabled>
                  <Shield className="mr-2 h-3 w-3" />
                  Run Scan
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Health Check</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Verify all system components
                </p>
                <Button variant="outline" size="sm" disabled>
                  <CheckCircle className="mr-2 h-3 w-3" />
                  Run Check
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Some actions are disabled in this interface for safety. Contact system administrator.
          </p>
        </CardContent>
      </Card>

      {/* Schedule Maintenance Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              Plan a maintenance window and notify users in advance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                placeholder="e.g., Database Upgrade"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                placeholder="Additional details about the maintenance"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="datetime-local"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Notify Users</label>
              <Switch
                checked={scheduleForm.notify_users}
                onCheckedChange={(checked) =>
                  setScheduleForm({ ...scheduleForm, notify_users: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleMaintenance} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Mode Confirmation */}
      <AlertDialog open={showMaintenanceAlert} onOpenChange={setShowMaintenanceAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {maintenanceMode ? 'Disable Maintenance Mode?' : 'Enable Maintenance Mode?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {maintenanceMode
                ? 'This will restore normal user access to the platform. Make sure all maintenance work is complete.'
                : 'This will prevent all users (except administrators) from accessing the platform. Use this only during critical maintenance work.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMaintenanceModeToggle}>
              {maintenanceMode ? 'Disable' : 'Enable'} Maintenance Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSystemMaintenancePage;
