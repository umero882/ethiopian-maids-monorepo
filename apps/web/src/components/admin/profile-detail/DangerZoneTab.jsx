import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle,
  Power,
  Trash2,
  Download,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

const DangerZoneTab = ({
  profile,
  onToggleActive,
  onDelete,
  onExport,
  isSaving,
}) => {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No profile data available
      </div>
    );
  }

  const isActive = profile.is_active;
  const userEmail = profile.email || '';
  const canDelete = deleteConfirmation === userEmail;

  const handleToggleActive = async () => {
    await onToggleActive();
    setShowDeactivateDialog(false);
  };

  const handleDelete = async () => {
    if (canDelete) {
      await onDelete();
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
            <p className="text-sm text-red-700 mt-1">
              Actions on this page can have permanent consequences. Please proceed with caution
              and ensure you understand the impact of each action before confirming.
            </p>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Profile Data
          </CardTitle>
          <CardDescription>
            Download all profile data as a JSON file. Sensitive information will be excluded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Export Profile Data</p>
              <p className="text-xs text-gray-500 mt-1">
                Downloads a JSON file containing all non-sensitive profile information
              </p>
            </div>
            <Button variant="outline" onClick={onExport} disabled={isSaving}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate/Activate Account */}
      <Card className={isActive ? 'border-orange-200' : 'border-green-200'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className={isActive ? 'h-5 w-5 text-orange-600' : 'h-5 w-5 text-green-600'} />
            {isActive ? 'Deactivate Account' : 'Activate Account'}
          </CardTitle>
          <CardDescription>
            {isActive
              ? 'Deactivating will prevent the user from logging in and hide their profile from search results.'
              : 'Activating will allow the user to log in and make their profile visible again.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Current Status:</p>
                <Badge className={isActive ? 'bg-green-500' : 'bg-red-500'}>
                  {isActive ? 'Active' : 'Deactivated'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isActive
                  ? 'User can currently access their account and is visible on the platform'
                  : 'User cannot log in and their profile is hidden from search'}
              </p>
            </div>
            <Button
              variant={isActive ? 'destructive' : 'default'}
              onClick={() => setShowDeactivateDialog(true)}
              disabled={isSaving}
              className={!isActive ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>

          {/* Deactivation Effects */}
          {isActive && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">
                Deactivation will:
              </p>
              <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                <li>Prevent the user from logging into their account</li>
                <li>Hide their profile from all search results</li>
                <li>Keep all their data intact (can be reactivated later)</li>
                <li>Cancel any pending applications or bookings</li>
                <li>Send a notification email to the user</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Account Permanently
          </CardTitle>
          <CardDescription>
            Permanently delete this account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  This action is irreversible
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Deleting this account will permanently remove:
                </p>
                <ul className="text-xs text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>User profile and all personal information</li>
                  <li>All role-specific data (maid/agency/sponsor profile)</li>
                  <li>All messages, applications, and bookings</li>
                  <li>All reviews and ratings</li>
                  <li>All uploaded documents and media</li>
                  <li>Transaction and payment history</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-red-600">
                Permanently Delete Account
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This will delete all data associated with {profile.email}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate/Activate Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? 'Deactivate Account?' : 'Activate Account?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive ? (
                <>
                  Are you sure you want to deactivate the account for{' '}
                  <strong>{profile.full_name || profile.email}</strong>?
                  <br />
                  <br />
                  The user will not be able to log in and their profile will be hidden
                  from all search results. This action can be reversed.
                </>
              ) : (
                <>
                  Are you sure you want to activate the account for{' '}
                  <strong>{profile.full_name || profile.email}</strong>?
                  <br />
                  <br />
                  The user will be able to log in and their profile will be visible
                  again on the platform.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={isSaving}
              className={isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isActive ? (
                'Deactivate Account'
              ) : (
                'Activate Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) setDeleteConfirmation('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account Permanently
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  This will permanently delete the account for{' '}
                  <strong>{profile.full_name || 'Unknown'}</strong> and all associated data.
                  This action cannot be undone.
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800 mb-2">
                    To confirm deletion, please type the user's email address:
                  </p>
                  <p className="text-sm font-mono text-red-600 mb-2">{userEmail}</p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type email to confirm"
                    className="border-red-300 focus:ring-red-500"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSaving || !canDelete}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DangerZoneTab;
