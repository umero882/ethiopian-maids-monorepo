import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { UserX } from 'lucide-react';

function RegistrationClosedPage({ supportEmail }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <UserX className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Registration Closed</h1>
        <p className="text-gray-600 mb-6">
          New registrations are temporarily disabled. Please check back later or contact support for assistance.
        </p>
        {supportEmail && (
          <p className="text-sm text-muted-foreground">
            Contact us at{' '}
            <a href={`mailto:${supportEmail}`} className="text-primary underline">{supportEmail}</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function RegistrationGate({ children }) {
  const { settings, loaded } = useSystemSettings();

  if (!loaded) return children;

  if (settings.new_registrations === false) {
    return <RegistrationClosedPage supportEmail={settings.support_email} />;
  }

  return children;
}
