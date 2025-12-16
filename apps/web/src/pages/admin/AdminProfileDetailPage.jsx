import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminProfileDetail } from '@/hooks/admin/useAdminProfileDetail';
import ProfileHeader from '@/components/admin/profile-detail/ProfileHeader';
import ProfileOverviewTab from '@/components/admin/profile-detail/ProfileOverviewTab';
import MaidProfileTab from '@/components/admin/profile-detail/MaidProfileTab';
import AgencyProfileTab from '@/components/admin/profile-detail/AgencyProfileTab';
import SponsorProfileTab from '@/components/admin/profile-detail/SponsorProfileTab';
import VerificationTab from '@/components/admin/profile-detail/VerificationTab';
import DangerZoneTab from '@/components/admin/profile-detail/DangerZoneTab';
import {
  User,
  Briefcase,
  Building,
  Home,
  Shield,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const AdminProfileDetailPage = () => {
  const { profileId } = useParams();

  const {
    profile,
    profileType,
    loading,
    error,
    isSaving,
    editingSection,
    pendingChanges,
    hasChanges,
    startEditing,
    cancelEditing,
    updateField,
    saveProfileChanges,
    saveMaidProfileChanges,
    saveAgencyProfileChanges,
    saveSponsorProfileChanges,
    toggleActiveStatus,
    deleteProfile,
    changeVerificationStatus,
    updateSubscription,
    exportProfile,
    refresh,
  } = useAdminProfileDetail(profileId);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load profile
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Profile not found
          </h2>
          <p className="text-gray-600">
            The profile you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  // Get role-specific tab content
  const getRoleTab = () => {
    switch (profileType) {
      case 'maid':
        return {
          label: 'Maid Profile',
          icon: Briefcase,
          content: (
            <MaidProfileTab
              maidProfile={profile.maid_profile}
              editingSection={editingSection}
              pendingChanges={pendingChanges}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onUpdateField={updateField}
              onSave={saveMaidProfileChanges}
              isSaving={isSaving}
            />
          ),
        };
      case 'agency':
        return {
          label: 'Agency Profile',
          icon: Building,
          content: (
            <AgencyProfileTab
              agencyProfile={profile.agency_profile}
              editingSection={editingSection}
              pendingChanges={pendingChanges}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onUpdateField={updateField}
              onSave={saveAgencyProfileChanges}
              isSaving={isSaving}
            />
          ),
        };
      case 'sponsor':
        return {
          label: 'Sponsor Profile',
          icon: Home,
          content: (
            <SponsorProfileTab
              sponsorProfile={profile.sponsor_profile}
              editingSection={editingSection}
              pendingChanges={pendingChanges}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onUpdateField={updateField}
              onSave={saveSponsorProfileChanges}
              isSaving={isSaving}
            />
          ),
        };
      default:
        return null;
    }
  };

  const roleTab = getRoleTab();

  return (
    <div className="space-y-6 p-6">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        profileType={profileType}
        onExport={exportProfile}
        onToggleActive={toggleActiveStatus}
        onDelete={deleteProfile}
        onRefresh={refresh}
        isSaving={isSaving}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>

          {roleTab && (
            <TabsTrigger value="role-details" className="flex items-center gap-2">
              <roleTab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{roleTab.label}</span>
            </TabsTrigger>
          )}

          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>

          <TabsTrigger value="danger" className="flex items-center gap-2 text-red-600 data-[state=active]:text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Danger Zone</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <ProfileOverviewTab
            profile={profile}
            editingSection={editingSection}
            pendingChanges={pendingChanges}
            onStartEditing={startEditing}
            onCancelEditing={cancelEditing}
            onUpdateField={updateField}
            onSave={saveProfileChanges}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Role Details Tab */}
        {roleTab && (
          <TabsContent value="role-details" className="mt-6">
            {roleTab.content}
          </TabsContent>
        )}

        {/* Verification Tab */}
        <TabsContent value="verification" className="mt-6">
          <VerificationTab
            profile={profile}
            onChangeVerificationStatus={changeVerificationStatus}
            onUpdateSubscription={updateSubscription}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-6">
          <DangerZoneTab
            profile={profile}
            onToggleActive={toggleActiveStatus}
            onDelete={deleteProfile}
            onExport={exportProfile}
            isSaving={isSaving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProfileDetailPage;
