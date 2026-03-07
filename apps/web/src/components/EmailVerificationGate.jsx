import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebaseClient';
import { sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';

function VerifyEmailPrompt({ supportEmail }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    try {
      setSending(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, {
          url: `${window.location.origin}/verify-email`,
        });
        setSent(true);
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
          <MailWarning className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verification Required</h1>
        <p className="text-gray-600 mb-6">
          Please verify your email address before accessing the platform.
          Check your inbox for a verification link.
        </p>
        {sent ? (
          <p className="text-green-600 text-sm mb-4">Verification email sent! Check your inbox.</p>
        ) : (
          <Button onClick={handleResend} disabled={sending} className="mb-4">
            {sending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        )}
        {supportEmail && (
          <p className="text-sm text-muted-foreground">
            Need help? Contact{' '}
            <a href={`mailto:${supportEmail}`} className="text-primary underline">{supportEmail}</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function EmailVerificationGate({ children }) {
  const { settings, loaded } = useSystemSettings();
  const { user, loading } = useAuth();
  const location = useLocation();

  // Skip check for public/auth routes and admin routes
  const publicPaths = ['/', '/login', '/get-started', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicPaths.includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (!loaded || loading) return children;
  if (isPublicRoute || isAdminRoute) return children;
  if (!user) return children; // Not logged in — let auth guards handle it

  // If setting is enabled and user hasn't verified email, block access
  if (settings.require_email_verification && !user.email_confirmed_at) {
    return <VerifyEmailPrompt supportEmail={settings.support_email} />;
  }

  return children;
}
