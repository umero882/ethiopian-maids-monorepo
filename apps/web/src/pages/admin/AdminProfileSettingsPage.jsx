import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  User,
  Mail,
  Shield,
  Key,
  Bell,
  Activity,
  Settings,
  Camera,
  Edit,
  Save,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Monitor,
  RefreshCw,
  Loader2,
  Phone,
  Building2,
  Calendar,
  Clock,
  Globe,
  Palette,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  AlertTriangle,
  Lock,
  Fingerprint,
  History,
  LogOut,
  Trash2,
  Download,
  Upload,
  Info,
  BellRing,
  BellOff,
  MessageSquare,
  FileText,
  DollarSign,
  Users,
  AlertCircle,
  Check,
  XCircle
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// GraphQL queries for admin profile
const GET_ADMIN_PROFILE_FULL = gql`
  query GetAdminProfileFull($id: uuid!) {
    admin_users_by_pk(id: $id) {
      id
      email
      full_name
      role
      is_active
      department
      phone
      avatar_url
      preferences
      notification_settings
      created_at
      last_login_at
    }
  }
`;

const UPDATE_ADMIN_PROFILE = gql`
  mutation UpdateAdminProfile($id: uuid!, $updates: admin_users_set_input!) {
    update_admin_users_by_pk(pk_columns: { id: $id }, _set: $updates) {
      id
      email
      full_name
      role
      department
      phone
      avatar_url
      preferences
      notification_settings
    }
  }
`;

const GET_ADMIN_ACTIVITY_LOGS = gql`
  query GetAdminActivityLogs($adminId: uuid!, $limit: Int!) {
    admin_activity_logs(
      where: { admin_id: { _eq: $adminId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      action
      resource_type
      resource_id
      details
      user_agent
      created_at
    }
  }
`;

// Role display names and colors
const ROLE_CONFIG = {
  'super_admin': { name: 'Super Administrator', color: 'bg-purple-100 text-purple-800', icon: Shield },
  'admin': { name: 'Administrator', color: 'bg-blue-100 text-blue-800', icon: Shield },
  'moderator': { name: 'Content Moderator', color: 'bg-green-100 text-green-800', icon: FileText },
  'support_agent': { name: 'Support Agent', color: 'bg-yellow-100 text-yellow-800', icon: MessageSquare },
  'analyst': { name: 'Data Analyst', color: 'bg-cyan-100 text-cyan-800', icon: Activity },
  'manager': { name: 'Department Manager', color: 'bg-orange-100 text-orange-800', icon: Users },
  'financial_admin': { name: 'Financial Admin', color: 'bg-emerald-100 text-emerald-800', icon: DollarSign }
};

// Activity action display config
const ACTION_CONFIG = {
  'login': { label: 'Logged In', color: 'bg-green-100 text-green-800', icon: LogOut },
  'logout': { label: 'Logged Out', color: 'bg-gray-100 text-gray-800', icon: LogOut },
  'admin_profile_updated': { label: 'Profile Updated', color: 'bg-blue-100 text-blue-800', icon: User },
  'admin_password_changed': { label: 'Password Changed', color: 'bg-yellow-100 text-yellow-800', icon: Key },
  'admin_profile_page_view': { label: 'Viewed Profile', color: 'bg-gray-100 text-gray-600', icon: Eye },
  'user_approved': { label: 'User Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  'user_rejected': { label: 'User Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  'content_moderated': { label: 'Content Moderated', color: 'bg-orange-100 text-orange-800', icon: FileText },
};

// Password strength calculator
const calculatePasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  Object.values(checks).forEach(passed => {
    if (passed) strength += 20;
  });

  return { strength, checks };
};

const getPasswordStrengthLabel = (strength) => {
  if (strength <= 20) return { label: 'Very Weak', color: 'text-red-600' };
  if (strength <= 40) return { label: 'Weak', color: 'text-orange-600' };
  if (strength <= 60) return { label: 'Fair', color: 'text-yellow-600' };
  if (strength <= 80) return { label: 'Strong', color: 'text-blue-600' };
  return { label: 'Very Strong', color: 'text-green-600' };
};

const AdminProfileSettingsPage = () => {
  const { adminUser, logAdminActivity, loading: authLoading, permissions } = useAdminAuth();
  const fileInputRef = useRef(null);

  // Profile state
  const [profile, setProfile] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password form state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: ''
  });

  // Default preferences
  const defaultPreferences = {
    theme: 'light',
    language: 'en',
    timezone: 'Africa/Addis_Ababa',
    compactMode: false,
    showWelcomeMessage: true,
    autoRefreshDashboard: true,
    refreshInterval: 30,
  };

  // Default notification settings
  const defaultNotifications = {
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    newUserRegistration: true,
    pendingVerifications: true,
    supportTickets: true,
    systemAlerts: true,
    financialAlerts: true,
    weeklyReport: true,
    monthlyReport: true,
  };

  // Preferences state (synced with database)
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Notification settings state (synced with database)
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  // Saving states for preferences and notifications
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Password strength calculation
  const passwordStrength = calculatePasswordStrength(passwordForm.new_password);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength.strength);

  // Load profile data from database
  const loadProfileData = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!adminUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: profileData, errors } = await apolloClient.query({
        query: GET_ADMIN_PROFILE_FULL,
        variables: { id: adminUser.id },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        console.error('[AdminProfile] GraphQL errors:', errors);
      }

      if (profileData?.admin_users_by_pk) {
        const adminProfile = profileData.admin_users_by_pk;
        setProfile(adminProfile);
        setProfileForm({
          full_name: adminProfile.full_name || '',
          email: adminProfile.email || '',
          phone: adminProfile.phone || '',
          department: adminProfile.department || ''
        });

        // Load preferences from database
        if (adminProfile.preferences && typeof adminProfile.preferences === 'object') {
          setPreferences(prev => ({ ...prev, ...adminProfile.preferences }));
        }
        setPreferencesLoaded(true);

        // Load notification settings from database
        if (adminProfile.notification_settings && typeof adminProfile.notification_settings === 'object') {
          setNotifications(prev => ({ ...prev, ...adminProfile.notification_settings }));
        }
        setNotificationsLoaded(true);
      } else {
        setProfile(adminUser);
        setProfileForm({
          full_name: adminUser.full_name || '',
          email: adminUser.email || '',
          phone: adminUser.phone || '',
          department: adminUser.department || ''
        });
        setPreferencesLoaded(true);
        setNotificationsLoaded(true);
      }

      // Fetch activity logs
      try {
        const { data: logsData } = await apolloClient.query({
          query: GET_ADMIN_ACTIVITY_LOGS,
          variables: { adminId: adminUser.id, limit: 50 },
          fetchPolicy: 'network-only'
        });

        if (logsData?.admin_activity_logs) {
          setActivityLogs(logsData.admin_activity_logs);
        }
      } catch (logsError) {
        console.warn('[AdminProfile] Could not load activity logs:', logsError);
      }

      logAdminActivity?.('admin_profile_page_view', 'admin_profile', 'settings');
    } catch (error) {
      console.error('[AdminProfile] Error loading profile:', error);

      if (adminUser) {
        setProfile(adminUser);
        setProfileForm({
          full_name: adminUser.full_name || '',
          email: adminUser.email || '',
          phone: adminUser.phone || '',
          department: adminUser.department || ''
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          variant: 'destructive',
        });
      }
      setPreferencesLoaded(true);
      setNotificationsLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [adminUser, authLoading, logAdminActivity]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Initialize profile from adminUser immediately when available
  useEffect(() => {
    if (adminUser && !profile && !authLoading) {
      setProfile(adminUser);
      setProfileForm({
        full_name: adminUser.full_name || '',
        email: adminUser.email || '',
        phone: adminUser.phone || '',
        department: adminUser.department || ''
      });
    }
  }, [adminUser, profile, authLoading]);

  // Save preferences to database when changed
  const savePreferences = useCallback(async (newPreferences) => {
    if (!profile?.id || !preferencesLoaded) return;

    setSavingPreferences(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ADMIN_PROFILE,
        variables: {
          id: profile.id,
          updates: {
            preferences: newPreferences
          }
        }
      });

      if (data?.update_admin_users_by_pk) {
        setProfile(prev => ({
          ...prev,
          preferences: newPreferences
        }));
      }

      toast({
        title: 'Preferences Saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingPreferences(false);
    }
  }, [profile?.id, preferencesLoaded]);

  // Save notifications to database when changed
  const saveNotifications = useCallback(async (newNotifications) => {
    if (!profile?.id || !notificationsLoaded) return;

    setSavingNotifications(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ADMIN_PROFILE,
        variables: {
          id: profile.id,
          updates: {
            notification_settings: newNotifications
          }
        }
      });

      if (data?.update_admin_users_by_pk) {
        setProfile(prev => ({
          ...prev,
          notification_settings: newNotifications
        }));
      }

      toast({
        title: 'Notifications Saved',
        description: 'Your notification settings have been updated.',
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingNotifications(false);
    }
  }, [profile?.id, notificationsLoaded]);

  // Handler for preference changes
  const handlePreferenceChange = useCallback((key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Handler for notification changes
  const handleNotificationChange = useCallback((key, value) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    saveNotifications(newNotifications);
  }, [notifications, saveNotifications]);

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ADMIN_PROFILE,
        variables: {
          id: profile.id,
          updates: {
            full_name: profileForm.full_name,
            phone: profileForm.phone,
            department: profileForm.department
          }
        }
      });

      if (data?.update_admin_users_by_pk) {
        setProfile(prev => ({
          ...prev,
          ...data.update_admin_users_by_pk
        }));
      }

      await logAdminActivity?.('admin_profile_updated', 'admin_profile', profile.id);

      setIsEditingProfile(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `admin-avatars/${profile.id}-${Date.now()}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update profile with new avatar URL
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ADMIN_PROFILE,
        variables: {
          id: profile.id,
          updates: { avatar_url: downloadURL }
        }
      });

      if (data?.update_admin_users_by_pk) {
        setProfile(prev => ({
          ...prev,
          avatar_url: downloadURL
        }));
      }

      toast({
        title: 'Avatar Updated',
        description: 'Your profile photo has been updated successfully.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: 'Password Mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordStrength.strength < 60) {
      toast({
        title: 'Weak Password',
        description: 'Please choose a stronger password with at least 8 characters, uppercase, lowercase, numbers, and special characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordForm.current_password) {
      toast({
        title: 'Current Password Required',
        description: 'Please enter your current password.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const credential = EmailAuthProvider.credential(user.email, passwordForm.current_password);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordForm.new_password);

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      await logAdminActivity?.('admin_password_changed', 'admin_security', profile?.id);

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
    } catch (error) {
      console.error('Password change error:', error);
      let errorMessage = 'Failed to change password. Please try again.';

      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in before changing your password.';
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleConfig = (role) => {
    return ROLE_CONFIG[role] || { name: role || 'Unknown', color: 'bg-gray-100 text-gray-800', icon: User };
  };

  const getActionConfig = (action) => {
    return ACTION_CONFIG[action] || { label: action?.replace(/_/g, ' ') || 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Activity };
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
  };

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Profile</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't load your profile data. Please try refreshing the page.
              </p>
              <Button onClick={loadProfileData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleConfig = getRoleConfig(profile.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings, security, and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadProfileData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent h-24" />
        <CardContent className="relative pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon" aria-label="Upload avatar"
                aria-label="Upload avatar"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* User Info */}
            <div className="flex-grow space-y-1 pb-2">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={`${roleConfig.color} flex items-center gap-1`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleConfig.name}
                </Badge>
                <Badge className={profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {profile.department && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {profile.department}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{activityLogs.length}</p>
                <p className="text-muted-foreground">Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.created_at ? Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)) : 0}
                </p>
                <p className="text-muted-foreground">Days Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 py-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 py-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 py-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================== PROFILE TAB ==================== */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditingProfile ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isEditingProfile) {
                      // Reset form on cancel
                      setProfileForm({
                        full_name: profile.full_name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        department: profile.department || ''
                      });
                    }
                    setIsEditingProfile(!isEditingProfile);
                  }}
                >
                  {isEditingProfile ? (
                    <><X className="h-4 w-4 mr-2" />Cancel</>
                  ) : (
                    <><Edit className="h-4 w-4 mr-2" />Edit Profile</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        full_name: e.target.value
                      }))}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-sm p-3 bg-muted/50 rounded-md">{profile.full_name || 'Not set'}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm p-3 bg-muted/50 rounded-md flex-grow flex items-center gap-2">
                      {profile.email}
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Email cannot be changed for security reasons
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      placeholder="+251-9XX-XXX-XXX"
                    />
                  ) : (
                    <p className="text-sm p-3 bg-muted/50 rounded-md">{profile.phone || 'Not set'}</p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Department
                  </Label>
                  {isEditingProfile ? (
                    <Select
                      value={profileForm.department || ''}
                      onValueChange={(value) => setProfileForm(prev => ({
                        ...prev,
                        department: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Support">Customer Support</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">Human Resources</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm p-3 bg-muted/50 rounded-md">{profile.department || 'Not set'}</p>
                  )}
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Role
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <Badge className={`${roleConfig.color} flex items-center gap-1 w-fit`}>
                      <RoleIcon className="h-3 w-3" />
                      {roleConfig.name}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Contact a super admin to change your role
                  </p>
                </div>

                {/* Status (Read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Account Status
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <Badge className={profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                    <p className="font-medium">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                    <p className="font-medium">{formatRelativeTime(profile.last_login_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Fingerprint className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin ID</p>
                    <p className="font-mono text-sm">{profile.id?.substring(0, 8)}...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SECURITY TAB ==================== */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password regularly to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative max-w-md">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        current_password: e.target.value
                      }))}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative max-w-md">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        new_password: e.target.value
                      }))}
                      placeholder="Enter your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordForm.new_password && (
                    <div className="space-y-2 max-w-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Password Strength</span>
                        <span className={`text-sm font-medium ${strengthInfo.color}`}>
                          {strengthInfo.label}
                        </span>
                      </div>
                      <Progress value={passwordStrength.strength} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          Uppercase letter
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          Lowercase letter
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.numbers ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.checks.numbers ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          Number
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          Special character
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative max-w-md">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        confirm_password: e.target.value
                      }))}
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={saving || !passwordForm.current_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                Security Status
              </CardTitle>
              <CardDescription>
                Your account security overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Email Verified</p>
                      <p className="text-sm text-muted-foreground">
                        Your email address has been verified
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Monitor className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Active session on this device
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Smartphone className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
                <div>
                  <p className="font-medium">Deactivate Account</p>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable your admin access
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                      Deactivate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will disable your admin access. You will need to contact a super admin to reactivate your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== PREFERENCES TAB ==================== */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the admin panel looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {preferences.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Theme
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => handlePreferenceChange('theme', value)}
                  disabled={savingPreferences}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for more content on screen
                  </p>
                </div>
                <Switch
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) => handlePreferenceChange('compactMode', checked)}
                  disabled={savingPreferences}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Welcome Message</Label>
                  <p className="text-sm text-muted-foreground">
                    Show welcome message on dashboard
                  </p>
                </div>
                <Switch
                  checked={preferences.showWelcomeMessage}
                  onCheckedChange={(checked) => handlePreferenceChange('showWelcomeMessage', checked)}
                  disabled={savingPreferences}
                />
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Configure language and timezone preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => handlePreferenceChange('language', value)}
                    disabled={savingPreferences}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="am">Amharic</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => handlePreferenceChange('timezone', value)}
                    disabled={savingPreferences}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Addis_Ababa">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Dubai">Gulf Standard Time (GST)</SelectItem>
                      <SelectItem value="Asia/Riyadh">Arabia Standard Time (AST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                Dashboard Settings
              </CardTitle>
              <CardDescription>
                Configure your dashboard behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Refresh Dashboard</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh dashboard data
                  </p>
                </div>
                <Switch
                  checked={preferences.autoRefreshDashboard}
                  onCheckedChange={(checked) => handlePreferenceChange('autoRefreshDashboard', checked)}
                  disabled={savingPreferences}
                />
              </div>

              {preferences.autoRefreshDashboard && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Refresh Interval</Label>
                    <Select
                      value={String(preferences.refreshInterval)}
                      onValueChange={(value) => handlePreferenceChange('refreshInterval', parseInt(value))}
                      disabled={savingPreferences}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Every 15 seconds</SelectItem>
                        <SelectItem value="30">Every 30 seconds</SelectItem>
                        <SelectItem value="60">Every minute</SelectItem>
                        <SelectItem value="300">Every 5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {savingPreferences ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving preferences...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Preferences are saved automatically to database
                  </>
                )}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        <TabsContent value="notifications" className="space-y-6">
          {/* General Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  disabled={savingNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                  disabled={savingNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    {notifications.soundEnabled ? (
                      <Volume2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <Label>Sound Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound for important notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.soundEnabled}
                  onCheckedChange={(checked) => handleNotificationChange('soundEnabled', checked)}
                  disabled={savingNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BellRing className="h-5 w-5" />
                Notification Types
              </CardTitle>
              <CardDescription>
                Select which events you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">New User Registrations</p>
                      <p className="text-sm text-muted-foreground">When new users sign up</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.newUserRegistration}
                    onCheckedChange={(checked) => handleNotificationChange('newUserRegistration', checked)}
                    disabled={savingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Pending Verifications</p>
                      <p className="text-sm text-muted-foreground">Profiles awaiting approval</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.pendingVerifications}
                    onCheckedChange={(checked) => handleNotificationChange('pendingVerifications', checked)}
                    disabled={savingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Support Tickets</p>
                      <p className="text-sm text-muted-foreground">New support requests</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.supportTickets}
                    onCheckedChange={(checked) => handleNotificationChange('supportTickets', checked)}
                    disabled={savingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">System Alerts</p>
                      <p className="text-sm text-muted-foreground">Critical system notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.systemAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('systemAlerts', checked)}
                    disabled={savingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">Financial Alerts</p>
                      <p className="text-sm text-muted-foreground">Payment and transaction updates</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.financialAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('financialAlerts', checked)}
                    disabled={savingNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Receive periodic summary reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Weekly Summary Report</p>
                  <p className="text-sm text-muted-foreground">Sent every Monday morning</p>
                </div>
                <Switch
                  checked={notifications.weeklyReport}
                  onCheckedChange={(checked) => handleNotificationChange('weeklyReport', checked)}
                  disabled={savingNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Monthly Summary Report</p>
                  <p className="text-sm text-muted-foreground">Sent on the 1st of each month</p>
                </div>
                <Switch
                  checked={notifications.monthlyReport}
                  onCheckedChange={(checked) => handleNotificationChange('monthlyReport', checked)}
                  disabled={savingNotifications}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {savingNotifications ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving notification settings...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Notification settings are saved automatically to database
                  </>
                )}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ==================== ACTIVITY TAB ==================== */}
        <TabsContent value="activity" className="space-y-6">
          {/* Activity Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activityLogs.length}</p>
                    <p className="text-sm text-muted-foreground">Total Activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <LogOut className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {activityLogs.filter(l => l.action === 'login').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Login Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {formatRelativeTime(activityLogs[0]?.created_at)}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <History className="h-5 w-5" />
                    Activity Log
                  </CardTitle>
                  <CardDescription>
                    Your recent actions and events
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadProfileData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.map((log, index) => {
                    const actionConfig = getActionConfig(log.action);
                    const ActionIcon = actionConfig.icon;

                    return (
                      <div
                        key={log.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${
                          index === 0 ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${actionConfig.color}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{actionConfig.label}</p>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">Latest</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.resource_type && (
                              <span className="capitalize">{log.resource_type.replace(/_/g, ' ')}</span>
                            )}
                            {log.resource_id && (
                              <span className="font-mono text-xs ml-1">
                                ({log.resource_id.substring(0, 8)}...)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right text-sm shrink-0">
                          <p className="font-medium">{formatRelativeTime(log.created_at)}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDateTime(log.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                  <p className="text-muted-foreground">
                    Your actions will appear here as you use the admin panel
                  </p>
                </div>
              )}
            </CardContent>
            {activityLogs.length > 0 && (
              <CardFooter className="border-t pt-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {activityLogs.length} most recent activities
                </p>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Log
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                Role & Permissions
              </CardTitle>
              <CardDescription>
                Your current access level and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className={`p-3 rounded-lg ${roleConfig.color}`}>
                    <RoleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{roleConfig.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.role === 'super_admin'
                        ? 'Full access to all admin features and settings'
                        : 'Limited access based on assigned permissions'}
                    </p>
                  </div>
                </div>

                {permissions && permissions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Active Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {permissions.includes('*') ? (
                        <Badge className="bg-purple-100 text-purple-800">All Permissions</Badge>
                      ) : (
                        permissions.slice(0, 10).map((perm, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))
                      )}
                      {permissions.length > 10 && !permissions.includes('*') && (
                        <Badge variant="outline" className="text-xs">
                          +{permissions.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProfileSettingsPage;
