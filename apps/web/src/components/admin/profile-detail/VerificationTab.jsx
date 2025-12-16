import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Loader2,
} from 'lucide-react';

const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
  { value: 'verified', label: 'Verified', icon: CheckCircle, color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-500' },
  { value: 'unverified', label: 'Unverified', icon: AlertTriangle, color: 'bg-gray-500' },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'free', label: 'Free', color: 'bg-gray-500' },
  { value: 'trial', label: 'Trial', color: 'bg-purple-500' },
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'expired', label: 'Expired', color: 'bg-red-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-orange-500' },
];

const VerificationTab = ({
  profile,
  onChangeVerificationStatus,
  onUpdateSubscription,
  isSaving,
}) => {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [pendingVerificationStatus, setPendingVerificationStatus] = useState(null);
  const [pendingSubscriptionStatus, setPendingSubscriptionStatus] = useState(null);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No profile data available
      </div>
    );
  }

  const currentVerification = VERIFICATION_STATUSES.find(
    (s) => s.value === profile.verification_status
  ) || VERIFICATION_STATUSES[3];

  const currentSubscription = SUBSCRIPTION_STATUSES.find(
    (s) => s.value === profile.subscription_status
  ) || SUBSCRIPTION_STATUSES[0];

  const handleVerificationChange = (value) => {
    setPendingVerificationStatus(value);
    setShowVerificationDialog(true);
  };

  const handleSubscriptionChange = (value) => {
    setPendingSubscriptionStatus(value);
    setShowSubscriptionDialog(true);
  };

  const confirmVerificationChange = async () => {
    await onChangeVerificationStatus(pendingVerificationStatus);
    setShowVerificationDialog(false);
    setPendingVerificationStatus(null);
  };

  const confirmSubscriptionChange = async () => {
    await onUpdateSubscription(pendingSubscriptionStatus);
    setShowSubscriptionDialog(false);
    setPendingSubscriptionStatus(null);
  };

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Status
          </CardTitle>
          <CardDescription>
            Overview of the user's verification and subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Verification Status */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">
                Verification Status
              </Label>
              <div className="flex items-center gap-2 mt-2">
                {React.createElement(currentVerification.icon, {
                  className: `h-5 w-5 ${
                    currentVerification.value === 'verified'
                      ? 'text-green-500'
                      : currentVerification.value === 'pending'
                      ? 'text-yellow-500'
                      : currentVerification.value === 'rejected'
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`,
                })}
                <Badge className={currentVerification.color}>
                  {currentVerification.label}
                </Badge>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">
                Subscription Status
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <Badge className={currentSubscription.color}>
                  {currentSubscription.label}
                </Badge>
              </div>
            </div>

            {/* Account Status */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">
                Account Status
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={profile.is_active ? 'bg-green-500' : 'bg-red-500'}>
                  {profile.is_active ? 'Active' : 'Deactivated'}
                </Badge>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">
                Profile Completion
              </Label>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${profile.profile_completion || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {profile.profile_completion || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verification Management
          </CardTitle>
          <CardDescription>
            Change the user's verification status. This affects their visibility and trust level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Change Verification Status</Label>
              <Select
                value={profile.verification_status || 'unverified'}
                onValueChange={handleVerificationChange}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFICATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        {React.createElement(status.icon, { className: 'h-4 w-4' })}
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Verification Status Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Verified</p>
                    <p className="text-xs text-gray-500">
                      Profile has been reviewed and approved. User appears in search results with a verified badge.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-500 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-xs text-gray-500">
                      Profile is waiting for admin review. Limited visibility.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-xs text-gray-500">
                      Profile failed verification. User is notified and can resubmit.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Unverified</p>
                    <p className="text-xs text-gray-500">
                      Profile has not been submitted for verification yet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>
            Manually change the user's subscription status. Use with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Change Subscription Status</Label>
              <Select
                value={profile.subscription_status || 'free'}
                onValueChange={handleSubscriptionChange}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Manual Override Warning
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Changing subscription status manually will bypass the payment system.
                    Only use this for special cases like refunds, credits, or testing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Score & Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Trust Score & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600">
                {profile.trust_score || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-2">Trust Score</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-yellow-600">
                {profile.rating?.toFixed(1) || '0.0'}
              </div>
              <p className="text-sm text-gray-500 mt-2">Average Rating</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600">
                {profile.total_reviews || 0}
              </div>
              <p className="text-sm text-gray-500 mt-2">Total Reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Change Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Verification Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the verification status to{' '}
              <strong className="capitalize">{pendingVerificationStatus}</strong>?
              This will affect the user's visibility and trust level on the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVerificationChange} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Change'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscription Change Dialog */}
      <AlertDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subscription Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the subscription status to{' '}
              <strong className="capitalize">{pendingSubscriptionStatus}</strong>?
              This is a manual override and bypasses the payment system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubscriptionChange} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Change'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VerificationTab;
