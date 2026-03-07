import { useLocation } from 'react-router-dom';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { AlertTriangle, Wrench, Calendar } from 'lucide-react';

function isWithinScheduledWindow(start, end) {
  if (!start && !end) return false;
  const now = new Date();
  if (start && new Date(start) > now) return false;
  if (end && new Date(end) < now) return false;
  // If only start is set (no end), maintenance is active from start onwards
  // If only end is set (no start), maintenance is active until end
  return true;
}

function formatScheduleTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function MaintenancePage({ platformName, supportEmail, scheduledEnd }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-6">
          <Wrench className="h-10 w-10 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Under Maintenance</h1>
        <p className="text-gray-600 mb-6">
          {platformName || 'Our platform'} is currently undergoing scheduled maintenance to improve your experience.
          Please check back shortly.
        </p>
        {scheduledEnd && (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-3 mb-4">
            <Calendar className="h-4 w-4" />
            <span>Expected back online: {formatScheduleTime(scheduledEnd)}</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4" />
          <span>We'll be back online soon</span>
        </div>
        {supportEmail && (
          <p className="text-sm text-muted-foreground mt-4">
            Questions? Contact us at{' '}
            <a href={`mailto:${supportEmail}`} className="text-primary underline">{supportEmail}</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function MaintenanceGate({ children }) {
  const { settings, loaded } = useSystemSettings();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Don't block rendering while loading
  if (!loaded) return children;

  // Admin routes always accessible
  if (isAdminRoute) return children;

  // Check manual toggle OR scheduled maintenance window
  const isManualMaintenance = settings.maintenance_mode;
  const isScheduledMaintenance = isWithinScheduledWindow(
    settings.maintenance_scheduled_start,
    settings.maintenance_scheduled_end
  );

  if (isManualMaintenance || isScheduledMaintenance) {
    return (
      <MaintenancePage
        platformName={settings.platform_name}
        supportEmail={settings.support_email}
        scheduledEnd={settings.maintenance_scheduled_end}
      />
    );
  }

  return children;
}
