import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { uploadProfilePicture } from '@/lib/firebaseStorage';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  User,
  Lock,
  Bell,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { countries } from '@/data/countryStateData';

// --- GraphQL queries/mutations used locally ---
const GET_MAID_PROFILE_FOR_SETTINGS = gql`
  query GetMaidProfileForSettings($id: String!) {
    maid_profiles_by_pk(id: $id) {
      id
      full_name
      date_of_birth
      current_location
      about_me
      profile_photo_url
    }
    profiles_by_pk(id: $id) {
      id
      full_name
      email
      phone
      country
      avatar_url
    }
  }
`;

const UPDATE_MAID_SETTINGS_PROFILE = gql`
  mutation UpdateMaidSettingsProfile(
    $userId: String!
    $profileData: profiles_set_input!
    $maidData: maid_profiles_set_input!
  ) {
    update_profiles_by_pk(pk_columns: { id: $userId }, _set: $profileData) {
      id
      full_name
      phone
      country
      avatar_url
      updated_at
    }
    update_maid_profiles_by_pk(pk_columns: { id: $userId }, _set: $maidData) {
      id
      full_name
      current_location
      date_of_birth
      about_me
      profile_photo_url
      updated_at
    }
  }
`;

const PRIVACY_STORAGE_KEY = 'maid_privacy_settings';
const LANGUAGE_STORAGE_KEY = 'maid_language_settings';

const MaidSettingsPage = () => {
  const { user, updateUserProfileData, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    dateOfBirth: '',
    bio: '',
    profilePhoto: null,
    profilePhotoPreview: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingAlerts: true,
    messageAlerts: true,
    jobRecommendations: true,
    promotionalEmails: false,
    weeklyDigest: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showPhoneNumber: false,
    showEmail: false,
    showLocation: true,
    allowDirectMessages: true,
    showOnlineStatus: true,
    dataProcessingConsent: true,
    marketingConsent: false,
  });

  const [languageSettings, setLanguageSettings] = useState({
    preferredLanguage: 'en',
    timezone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    currency: 'AED',
  });

  // --- Load maid profile data from DB ---
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await apolloClient.query({
        query: GET_MAID_PROFILE_FOR_SETTINGS,
        variables: { id: user.id },
        fetchPolicy: 'network-only',
      });

      const profile = data?.profiles_by_pk;
      const maidProfile = data?.maid_profiles_by_pk;

      setProfileData({
        name: maidProfile?.full_name || profile?.full_name || user.full_name || '',
        email: profile?.email || user.email || '',
        phone: profile?.phone || user.phone || '',
        country: profile?.country || user.country || '',
        city: maidProfile?.current_location || '',
        dateOfBirth: maidProfile?.date_of_birth || '',
        bio: maidProfile?.about_me || '',
        profilePhoto: null,
        profilePhotoPreview:
          maidProfile?.profile_photo_url || profile?.avatar_url || null,
      });
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }
  }, [user]);

  // --- Load notification settings from DB ---
  const loadNotificationSettings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await notificationSettingsService.getSettings(user.id);
      if (data) {
        setNotificationSettings({
          emailNotifications: data.email_enabled ?? true,
          smsNotifications: data.sms_enabled ?? false,
          pushNotifications: data.push_enabled ?? true,
          bookingAlerts: data.notification_types?.booking_created?.inApp ?? true,
          messageAlerts: data.notification_types?.message_received?.inApp ?? true,
          jobRecommendations: data.notification_types?.job_posted?.inApp ?? true,
          promotionalEmails: data.notification_types?.system_announcement?.email ?? false,
          weeklyDigest: data.email_frequency === 'weekly',
        });
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    }
  }, [user]);

  // --- Load privacy settings from localStorage ---
  const loadPrivacySettings = useCallback(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${PRIVACY_STORAGE_KEY}_${user.id}`);
      if (stored) {
        setPrivacySettings(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load privacy settings:', err);
    }
  }, [user]);

  // --- Load language settings from localStorage ---
  const loadLanguageSettings = useCallback(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${LANGUAGE_STORAGE_KEY}_${user.id}`);
      if (stored) {
        setLanguageSettings(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load language settings:', err);
    }
  }, [user]);

  // --- Initial data load ---
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setInitialLoading(true);
      await Promise.all([
        loadProfileData(),
        loadNotificationSettings(),
      ]);
      loadPrivacySettings();
      loadLanguageSettings();
      setInitialLoading(false);
    };
    load();
  }, [user, loadProfileData, loadNotificationSettings, loadPrivacySettings, loadLanguageSettings]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handlePrivacyToggle = (setting) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a JPG or PNG image.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData((prev) => ({
          ...prev,
          profilePhoto: file,
          profilePhotoPreview: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Fix 2 & 8: Real profile save with photo upload ---
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let photoUrl = null;

      // Upload photo if a new file was selected
      if (profileData.profilePhoto) {
        try {
          const result = await uploadProfilePicture(user.id, profileData.profilePhoto);
          photoUrl = result.url;
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr);
          toast({
            title: 'Photo upload failed',
            description: 'Profile saved without photo. Please try uploading again.',
            variant: 'destructive',
          });
        }
      }

      // Build update payloads
      const profilePayload = {
        full_name: profileData.name,
        phone: profileData.phone,
        country: profileData.country,
        updated_at: new Date().toISOString(),
      };
      if (photoUrl) {
        profilePayload.avatar_url = photoUrl;
      }

      const maidPayload = {
        full_name: profileData.name,
        current_location: profileData.city,
        date_of_birth: profileData.dateOfBirth || null,
        about_me: profileData.bio,
        updated_at: new Date().toISOString(),
      };
      if (photoUrl) {
        maidPayload.profile_photo_url = photoUrl;
      }

      await apolloClient.mutate({
        mutation: UPDATE_MAID_SETTINGS_PROFILE,
        variables: {
          userId: user.id,
          profileData: profilePayload,
          maidData: maidPayload,
        },
      });

      // Also update AuthContext's local user state
      try {
        await updateUserProfileData({
          name: profileData.name,
          phone: profileData.phone,
          country: profileData.country,
        });
      } catch (_) {
        // Non-critical: AuthContext update may fail but DB is already saved
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Profile save failed:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Fix 3: Real password change via Firebase Auth ---
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordData.currentPassword) {
      toast({
        title: 'Current password required',
        description: 'Please enter your current password.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No authenticated user found. Please log in again.');
      }

      // Re-authenticate with current password
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update to new password
      await updatePassword(firebaseUser, passwordData.newPassword);

      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
        variant: 'default',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password change failed:', error);
      let message = 'Failed to change password. Please try again.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        message = 'New password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        message = 'Session expired. Please log out and log in again before changing your password.';
      }
      toast({
        title: 'Password change failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Fix 5: Real notification settings persistence ---
  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await notificationSettingsService.saveSettings(user.id, {
        email_enabled: notificationSettings.emailNotifications,
        push_enabled: notificationSettings.pushNotifications,
        sms_enabled: notificationSettings.smsNotifications,
        in_app_enabled: true,
        email_frequency: notificationSettings.weeklyDigest ? 'weekly' : 'instant',
        notification_types: {
          booking_created: {
            email: notificationSettings.emailNotifications,
            push: notificationSettings.pushNotifications,
            inApp: notificationSettings.bookingAlerts,
          },
          message_received: {
            email: notificationSettings.emailNotifications,
            push: notificationSettings.pushNotifications,
            inApp: notificationSettings.messageAlerts,
          },
          job_posted: {
            email: notificationSettings.promotionalEmails,
            push: false,
            inApp: notificationSettings.jobRecommendations,
          },
          system_announcement: {
            email: notificationSettings.promotionalEmails,
            push: false,
            inApp: true,
          },
        },
      });

      toast({
        title: 'Notification settings saved',
        description: 'Your notification preferences have been updated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Notification settings save failed:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save notification settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Fix 6: Privacy settings persistence via localStorage ---
  const handleSavePrivacy = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      localStorage.setItem(
        `${PRIVACY_STORAGE_KEY}_${user.id}`,
        JSON.stringify(privacySettings)
      );
      toast({
        title: 'Privacy settings saved',
        description: 'Your privacy preferences have been updated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Privacy settings save failed:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save privacy settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Fix 7: Language settings persistence via localStorage ---
  const handleSaveLanguage = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      localStorage.setItem(
        `${LANGUAGE_STORAGE_KEY}_${user.id}`,
        JSON.stringify(languageSettings)
      );
      toast({
        title: 'Language settings saved',
        description:
          'Your language and regional preferences have been updated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Language settings save failed:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save language settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Fix 4: Real account deletion with proper confirmation ---
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user found.');
      }

      // Delete the Firebase user (this also invalidates the session)
      await deleteUser(firebaseUser);

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
        variant: 'default',
      });

      // Logout and redirect
      await logout();
    } catch (error) {
      console.error('Account deletion failed:', error);
      let message = 'Failed to delete account. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        message = 'For security, please log out and log back in before deleting your account.';
      }
      toast({
        title: 'Deletion failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  if (initialLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>Settings</h1>
          <p className='text-gray-500 mt-1'>Loading your settings...</p>
        </div>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin h-8 w-8 border-4 border-primary border-b-transparent rounded-full' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-800'>Settings</h1>
        <p className='text-gray-500 mt-1'>
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue='profile' className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='profile' className='flex items-center space-x-2'>
            <User className='h-4 w-4' />
            <span className='hidden sm:inline'>Profile</span>
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center space-x-2'>
            <Lock className='h-4 w-4' />
            <span className='hidden sm:inline'>Security</span>
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='flex items-center space-x-2'
          >
            <Bell className='h-4 w-4' />
            <span className='hidden sm:inline'>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value='privacy' className='flex items-center space-x-2'>
            <Shield className='h-4 w-4' />
            <span className='hidden sm:inline'>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value='language' className='flex items-center space-x-2'>
            <Globe className='h-4 w-4' />
            <span className='hidden sm:inline'>Language</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value='profile' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <User className='h-5 w-5' />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Profile Photo */}
              <div className='space-y-4'>
                <Label className='text-base font-semibold'>Profile Photo</Label>
                <div className='flex items-center space-x-6'>
                  {profileData.profilePhotoPreview ? (
                    <img
                      src={profileData.profilePhotoPreview}
                      alt='Profile'
                      className='w-20 h-20 rounded-full object-cover border-2 border-gray-200'
                    />
                  ) : (
                    <div className='w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center'>
                      <User className='h-8 w-8 text-gray-400' />
                    </div>
                  )}

                  <div className='space-y-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        document.getElementById('profile-photo-upload').click()
                      }
                      className='flex items-center space-x-2'
                    >
                      <Upload className='h-4 w-4' />
                      <span>Upload Photo</span>
                    </Button>
                    <input
                      id='profile-photo-upload'
                      type='file'
                      accept='image/jpeg,image/png'
                      onChange={handleProfilePhotoUpload}
                      className='hidden'
                    />
                    <p className='text-xs text-gray-500'>JPG or PNG, max 5MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Full Name</Label>
                  <Input
                    id='name'
                    name='name'
                    value={profileData.name}
                    onChange={handleProfileInputChange}
                    placeholder='Enter your full name'
                  />
                </div>

                {/* Fix 9: Email is read-only */}
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={profileData.email}
                    disabled
                    className='bg-gray-50'
                  />
                  <p className='text-xs text-gray-500'>
                    Email cannot be changed here. Contact support if needed.
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone Number</Label>
                  <Input
                    id='phone'
                    name='phone'
                    type='tel'
                    value={profileData.phone}
                    onChange={handleProfileInputChange}
                    placeholder='Enter your phone number'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='dateOfBirth'>Date of Birth</Label>
                  <Input
                    id='dateOfBirth'
                    name='dateOfBirth'
                    type='date'
                    value={profileData.dateOfBirth}
                    onChange={handleProfileInputChange}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='country'>Country</Label>
                  <Select
                    value={profileData.country}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({ ...prev, country: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select country' />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    name='city'
                    value={profileData.city}
                    onChange={handleProfileInputChange}
                    placeholder='Enter your city'
                  />
                </div>
              </div>

              {/* Bio */}
              <div className='space-y-2'>
                <Label htmlFor='bio'>Bio</Label>
                <Textarea
                  id='bio'
                  name='bio'
                  value={profileData.bio}
                  onChange={handleProfileInputChange}
                  placeholder='Tell us about yourself, your experience, and skills...'
                  className='min-h-[100px]'
                />
                <p className='text-sm text-gray-500'>
                  This will be displayed on your profile to help families get to
                  know you better.
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Lock className='h-5 w-5' />
                <span>Password & Security</span>
              </CardTitle>
              <CardDescription>
                Manage your password and account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>Current Password</Label>
                  <div className='relative'>
                    <Input
                      id='currentPassword'
                      name='currentPassword'
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder='Enter current password'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New Password</Label>
                  <div className='relative'>
                    <Input
                      id='newPassword'
                      name='newPassword'
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      placeholder='Enter new password'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                  <div className='relative'>
                    <Input
                      id='confirmPassword'
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      placeholder='Confirm new password'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className='w-full md:w-auto'
                >
                  {loading ? (
                    <>
                      <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className='mr-2 h-4 w-4' />
                      Change Password
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-medium'>
                    Two-Factor Authentication
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Add an extra layer of security to your account
                  </p>
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='space-y-1'>
                    <p className='font-medium'>SMS Authentication</p>
                    <p className='text-sm text-gray-500'>
                      Receive codes via SMS
                    </p>
                  </div>
                  <Badge variant='outline'>Coming Soon</Badge>
                </div>
              </div>

              <Separator />

              {/* Account Deletion - Fix 4: Proper confirmation dialog */}
              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-medium text-red-600'>
                    Danger Zone
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Irreversible and destructive actions
                  </p>
                </div>

                <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
                  <div className='flex items-start space-x-3'>
                    <AlertTriangle className='h-5 w-5 text-red-500 mt-0.5' />
                    <div className='flex-1'>
                      <h4 className='font-medium text-red-800'>
                        Delete Account
                      </h4>
                      <p className='text-sm text-red-600 mt-1'>
                        Once you delete your account, there is no going back.
                        All your data will be permanently removed.
                      </p>

                      {!showDeleteConfirm ? (
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={loading}
                          className='mt-3'
                        >
                          Delete Account
                        </Button>
                      ) : (
                        <div className='mt-3 space-y-3 p-3 bg-red-100 rounded-md'>
                          <p className='text-sm font-medium text-red-800'>
                            Type <strong>DELETE</strong> to confirm:
                          </p>
                          <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder='Type DELETE'
                            className='bg-white'
                          />
                          <div className='flex space-x-2'>
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={handleDeleteAccount}
                              disabled={loading || deleteConfirmText !== 'DELETE'}
                            >
                              {loading ? 'Deleting...' : 'Permanently Delete'}
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Bell className='h-5 w-5' />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Communication Preferences */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>
                  Communication Preferences
                </h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Email Notifications</p>
                      <p className='text-sm text-gray-500'>
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('emailNotifications')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>SMS Notifications</p>
                      <p className='text-sm text-gray-500'>
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('smsNotifications')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Push Notifications</p>
                      <p className='text-sm text-gray-500'>
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('pushNotifications')
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Activity Notifications */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Activity Notifications</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Booking Alerts</p>
                      <p className='text-sm text-gray-500'>
                        New bookings and booking updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.bookingAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle('bookingAlerts')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Message Alerts</p>
                      <p className='text-sm text-gray-500'>
                        New messages from families
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.messageAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle('messageAlerts')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Job Recommendations</p>
                      <p className='text-sm text-gray-500'>
                        Personalized job recommendations
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.jobRecommendations}
                      onCheckedChange={() =>
                        handleNotificationToggle('jobRecommendations')
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Marketing Preferences */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Marketing & Updates</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Promotional Emails</p>
                      <p className='text-sm text-gray-500'>
                        Special offers and promotions
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.promotionalEmails}
                      onCheckedChange={() =>
                        handleNotificationToggle('promotionalEmails')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Weekly Digest</p>
                      <p className='text-sm text-gray-500'>
                        Weekly summary of your activity
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={() =>
                        handleNotificationToggle('weeklyDigest')
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value='privacy' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Shield className='h-5 w-5' />
                <span>Privacy & Visibility</span>
              </CardTitle>
              <CardDescription>
                Control who can see your information and how it's used
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Profile Visibility */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Profile Visibility</h3>

                <div className='space-y-2'>
                  <Label htmlFor='profileVisibility'>
                    Who can see your profile?
                  </Label>
                  <Select
                    value={privacySettings.profileVisibility}
                    onValueChange={(value) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        profileVisibility: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='public'>Everyone (Public)</SelectItem>
                      <SelectItem value='sponsors-only'>
                        Sponsors Only
                      </SelectItem>
                      <SelectItem value='private'>Private (Hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-sm text-gray-500'>
                    Control who can discover and view your profile
                  </p>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Contact Information</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Phone Number</p>
                      <p className='text-sm text-gray-500'>
                        Display your phone number on your profile
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showPhoneNumber}
                      onCheckedChange={() =>
                        handlePrivacyToggle('showPhoneNumber')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Email Address</p>
                      <p className='text-sm text-gray-500'>
                        Display your email address on your profile
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={() => handlePrivacyToggle('showEmail')}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Location</p>
                      <p className='text-sm text-gray-500'>
                        Display your city and country
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showLocation}
                      onCheckedChange={() =>
                        handlePrivacyToggle('showLocation')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Allow Direct Messages</p>
                      <p className='text-sm text-gray-500'>
                        Allow families to message you directly
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.allowDirectMessages}
                      onCheckedChange={() =>
                        handlePrivacyToggle('allowDirectMessages')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Online Status</p>
                      <p className='text-sm text-gray-500'>
                        Show when you're online
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showOnlineStatus}
                      onCheckedChange={() =>
                        handlePrivacyToggle('showOnlineStatus')
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data & Marketing Consent */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Data & Marketing</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Data Processing Consent</p>
                      <p className='text-sm text-gray-500'>
                        Allow us to process your data to provide services
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.dataProcessingConsent}
                      onCheckedChange={() =>
                        handlePrivacyToggle('dataProcessingConsent')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Marketing Consent</p>
                      <p className='text-sm text-gray-500'>
                        Receive marketing communications
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.marketingConsent}
                      onCheckedChange={() =>
                        handlePrivacyToggle('marketingConsent')
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSavePrivacy}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Privacy Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Settings */}
        <TabsContent value='language' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Globe className='h-5 w-5' />
                <span>Language & Regional Settings</span>
              </CardTitle>
              <CardDescription>
                Configure your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='preferredLanguage'>Preferred Language</Label>
                  <Select
                    value={languageSettings.preferredLanguage}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        preferredLanguage: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='en'>English</SelectItem>
                      <SelectItem value='ar'>Arabic</SelectItem>
                      <SelectItem value='am'>Amharic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='timezone'>Timezone</Label>
                  <Select
                    value={languageSettings.timezone}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        timezone: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Asia/Dubai'>
                        Asia/Dubai (GMT+4)
                      </SelectItem>
                      <SelectItem value='Asia/Riyadh'>
                        Asia/Riyadh (GMT+3)
                      </SelectItem>
                      <SelectItem value='Asia/Kuwait'>
                        Asia/Kuwait (GMT+3)
                      </SelectItem>
                      <SelectItem value='Asia/Qatar'>
                        Asia/Qatar (GMT+3)
                      </SelectItem>
                      <SelectItem value='Asia/Bahrain'>
                        Asia/Bahrain (GMT+3)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='dateFormat'>Date Format</Label>
                  <Select
                    value={languageSettings.dateFormat}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        dateFormat: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                      <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                      <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='currency'>Currency</Label>
                  <Select
                    value={languageSettings.currency}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='AED'>AED (UAE Dirham)</SelectItem>
                      <SelectItem value='SAR'>SAR (Saudi Riyal)</SelectItem>
                      <SelectItem value='KWD'>KWD (Kuwaiti Dinar)</SelectItem>
                      <SelectItem value='QAR'>QAR (Qatari Riyal)</SelectItem>
                      <SelectItem value='BHD'>BHD (Bahraini Dinar)</SelectItem>
                      <SelectItem value='USD'>USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSaveLanguage}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Language Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaidSettingsPage;
