/**
 * AdminUserDetailPage
 * Full CRUD user management page for Super Admins
 * Allows viewing, editing, and deleting any user
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Star,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Briefcase,
  Building2,
  Heart,
  FileText,
  Globe,
  DollarSign,
  Users,
  Activity,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  Download,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { userManagementService } from '@/services/userManagementService';
import { cn } from '@/lib/utils';

// =====================================================
// CONSTANTS
// =====================================================

const USER_TYPES = [
  { value: 'maid', label: 'Maid', icon: User },
  { value: 'agency', label: 'Agency', icon: Building2 },
  { value: 'sponsor', label: 'Sponsor', icon: Heart },
  { value: 'admin', label: 'Admin', icon: Shield },
];

const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'verified', label: 'Verified', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
];

// =====================================================
// HELPER COMPONENTS
// =====================================================

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && <Icon className="h-4 w-4 text-gray-400 mt-0.5" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">
        {value || 'Not specified'}
      </p>
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = 'blue' }) => (
  <div className={cn('p-4 rounded-lg', `bg-${color}-50`)}>
    <div className="flex items-center gap-3">
      <div className={cn('p-2 rounded-lg', `bg-${color}-100`)}>
        <Icon className={cn('h-5 w-5', `text-${color}-600`)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================

export function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { adminUser, logAdminActivity } = useAdminAuth();

  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: 'soft' });
  const [verifyDialog, setVerifyDialog] = useState({ open: false, status: '' });

  // Check if current admin is Super Admin
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';

  // Fetch user data
  const fetchUser = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await userManagementService.getUserById(userId);

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error('User not found');
      }

      setUser(result.data);
      setEditData(result.data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to load user');
      toast({
        title: 'Error',
        description: 'Failed to load user details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Handle edit mode toggle
  const handleStartEdit = () => {
    setEditData({ ...user });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData({ ...user });
    setIsEditing(false);
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedFieldChange = (profileType, field, value) => {
    setEditData(prev => ({
      ...prev,
      [profileType]: {
        ...prev[profileType],
        [field]: value,
      },
    }));
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);

      // Update main profile
      const profileFields = {
        full_name: editData.full_name,
        email: editData.email,
        phone: editData.phone,
        country: editData.country,
        city: editData.city,
        is_active: editData.is_active,
        verification_status: editData.verification_status,
        subscription_status: editData.subscription_status,
      };

      const result = await userManagementService.updateProfile(userId, profileFields);

      if (result.error) {
        throw result.error;
      }

      // Update type-specific profile if exists
      if (user.user_type === 'maid' && editData.maid_profile?.id) {
        const maidFields = {
          full_name: editData.maid_profile.full_name,
          nationality: editData.maid_profile.nationality,
          experience_years: editData.maid_profile.experience_years,
          primary_profession: editData.maid_profile.primary_profession,
          availability_status: editData.maid_profile.availability_status,
          verification_status: editData.maid_profile.verification_status,
          about_me: editData.maid_profile.about_me,
        };
        await userManagementService.updateMaidProfile(editData.maid_profile.id, maidFields);
      }

      if (user.user_type === 'agency' && editData.agency_profile?.id) {
        const agencyFields = {
          agency_name: editData.agency_profile.agency_name,
          license_number: editData.agency_profile.license_number,
          phone: editData.agency_profile.phone,
          email: editData.agency_profile.email,
          website: editData.agency_profile.website,
          description: editData.agency_profile.description,
          verification_status: editData.agency_profile.verification_status,
        };
        await userManagementService.updateAgencyProfile(editData.agency_profile.id, agencyFields);
      }

      if (user.user_type === 'sponsor' && editData.sponsor_profile?.id) {
        const sponsorFields = {
          full_name: editData.sponsor_profile.full_name,
          phone: editData.sponsor_profile.phone,
          occupation: editData.sponsor_profile.occupation,
          company: editData.sponsor_profile.company,
        };
        await userManagementService.updateSponsorProfile(editData.sponsor_profile.id, sponsorFields);
      }

      await logAdminActivity('user_update', 'profiles', userId);

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      setIsEditing(false);
      fetchUser(); // Refresh data
    } catch (err) {
      console.error('Error saving user:', err);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle verification status change
  const handleVerify = async (status) => {
    try {
      setSaving(true);

      const result = await userManagementService.verifyUser(userId, status);

      if (result.error) {
        throw result.error;
      }

      await logAdminActivity(`user_verification_${status}`, 'profiles', userId);

      toast({
        title: 'Success',
        description: `User ${status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'set to pending'}`,
      });

      setVerifyDialog({ open: false, status: '' });
      fetchUser();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setSaving(true);

      let result;
      if (deleteDialog.type === 'hard') {
        result = await userManagementService.hardDeleteUser(userId, user.user_type);
        await logAdminActivity('user_hard_delete', 'profiles', userId);
      } else {
        result = await userManagementService.softDeleteUser(userId);
        await logAdminActivity('user_soft_delete', 'profiles', userId);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'Success',
        description: deleteDialog.type === 'hard'
          ? 'User permanently deleted'
          : 'User deactivated successfully',
      });

      setDeleteDialog({ open: false, type: 'soft' });
      navigate('/admin/users');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async () => {
    try {
      setSaving(true);

      const result = await userManagementService.setUserActive(userId, !user.is_active);

      if (result.error) {
        throw result.error;
      }

      await logAdminActivity(
        user.is_active ? 'user_deactivate' : 'user_activate',
        'profiles',
        userId
      );

      toast({
        title: 'Success',
        description: `User ${user.is_active ? 'deactivated' : 'activated'}`,
      });

      fetchUser();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-16 w-16 text-red-400" />
        <h2 className="text-xl font-semibold text-gray-900">User Not Found</h2>
        <p className="text-gray-500">{error}</p>
        <Button onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  if (!user) return null;

  const userTypeConfig = USER_TYPES.find(t => t.value === user.user_type) || USER_TYPES[0];
  const UserTypeIcon = userTypeConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {user.full_name || 'Unknown User'}
                {user.verification_status === 'verified' && (
                  <BadgeCheck className="h-5 w-5 text-blue-500" />
                )}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  <UserTypeIcon className="h-3 w-3 mr-1" />
                  {user.user_type}
                </Badge>
                <Badge
                  className={cn(
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  )}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {isSuperAdmin && (
                <Button variant="outline" onClick={handleStartEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleToggleActive}>
                    {user.is_active ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate User
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate User
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setVerifyDialog({ open: true, status: 'verified' })}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Verify User
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setVerifyDialog({ open: true, status: 'pending' })}
                  >
                    <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                    Set Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setVerifyDialog({ open: true, status: 'rejected' })}
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Reject User
                  </DropdownMenuItem>

                  {isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog({ open: true, type: 'soft' })}
                        className="text-orange-600"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Deactivate Account
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog({ open: true, type: 'hard' })}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Permanently
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editData.full_name || ''}
                          onChange={(e) => handleFieldChange('full_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editData.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={editData.country || ''}
                          onChange={(e) => handleFieldChange('country', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={editData.city || ''}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editData.is_active}
                            onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
                          />
                          <span className="text-sm">
                            {editData.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRow label="Full Name" value={user.full_name} icon={User} />
                      <InfoRow label="Email" value={user.email} icon={Mail} />
                      <InfoRow label="Phone" value={user.phone} icon={Phone} />
                      <InfoRow label="Country" value={user.country} icon={Globe} />
                      <InfoRow label="City" value={user.city} icon={MapPin} />
                      <InfoRow
                        label="Joined"
                        value={user.created_at ? format(new Date(user.created_at), 'PPP') : null}
                        icon={Calendar}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Status & Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Status & Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Verification Status</Label>
                        <Select
                          value={editData.verification_status || 'pending'}
                          onValueChange={(value) => handleFieldChange('verification_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VERIFICATION_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Subscription</Label>
                        <Select
                          value={editData.subscription_status || 'free'}
                          onValueChange={(value) => handleFieldChange('subscription_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBSCRIPTION_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Verification Status</p>
                        <Badge
                          className={cn(
                            VERIFICATION_STATUSES.find(s => s.value === user.verification_status)?.color ||
                            'bg-gray-100 text-gray-800'
                          )}
                        >
                          {user.verification_status || 'pending'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Subscription</p>
                        <Badge variant="outline" className="capitalize">
                          <Crown className="h-3 w-3 mr-1" />
                          {user.subscription_status || 'free'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Registration</p>
                        <Badge variant={user.registration_complete ? 'default' : 'secondary'}>
                          {user.registration_complete ? 'Complete' : 'Incomplete'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Phone Verified</p>
                        <Badge variant={user.phone_verified ? 'default' : 'secondary'}>
                          {user.phone_verified ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6 mt-6">
              {/* Type-Specific Profile */}
              {user.user_type === 'maid' && user.maid_profile && (
                <MaidProfileSection
                  profile={isEditing ? editData.maid_profile : user.maid_profile}
                  isEditing={isEditing}
                  onChange={(field, value) => handleNestedFieldChange('maid_profile', field, value)}
                />
              )}

              {user.user_type === 'agency' && user.agency_profile && (
                <AgencyProfileSection
                  profile={isEditing ? editData.agency_profile : user.agency_profile}
                  isEditing={isEditing}
                  onChange={(field, value) => handleNestedFieldChange('agency_profile', field, value)}
                />
              )}

              {user.user_type === 'sponsor' && user.sponsor_profile && (
                <SponsorProfileSection
                  profile={isEditing ? editData.sponsor_profile : user.sponsor_profile}
                  isEditing={isEditing}
                  onChange={(field, value) => handleNestedFieldChange('sponsor_profile', field, value)}
                />
              )}

              {!user.maid_profile && !user.agency_profile && !user.sponsor_profile && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No detailed profile information available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-8">
                    Activity logging coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Stats & Quick Actions */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {user.profile_completion || 0}%
                  </p>
                  <p className="text-xs text-gray-500">Profile Complete</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                    <Star className="h-4 w-4 mr-1" />
                    {user.rating || 0}
                  </p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {user.trust_score || 0}
                  </p>
                  <p className="text-xs text-gray-500">Trust Score</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {user.total_reviews || 0}
                  </p>
                  <p className="text-xs text-gray-500">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">User ID</span>
                <span className="font-mono text-xs">{user.id?.slice(0, 8)}...</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>
                  {user.created_at
                    ? format(new Date(user.created_at), 'PP')
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span>
                  {user.updated_at
                    ? format(new Date(user.updated_at), 'PP')
                    : 'N/A'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Online</span>
                <Badge variant={user.is_online ? 'default' : 'secondary'}>
                  {user.is_online ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {isSuperAdmin && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={() => setDeleteDialog({ open: true, type: 'soft' })}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Deactivate Account
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteDialog({ open: true, type: 'hard' })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Verification Dialog */}
      <AlertDialog
        open={verifyDialog.open}
        onOpenChange={(open) => setVerifyDialog({ ...verifyDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {verifyDialog.status === 'verified' && 'Verify User'}
              {verifyDialog.status === 'pending' && 'Set User to Pending'}
              {verifyDialog.status === 'rejected' && 'Reject User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's verification status to "{verifyDialog.status}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleVerify(verifyDialog.status)}
              className={cn(
                verifyDialog.status === 'verified' && 'bg-green-600 hover:bg-green-700',
                verifyDialog.status === 'rejected' && 'bg-red-600 hover:bg-red-700',
                verifyDialog.status === 'pending' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {deleteDialog.type === 'hard' ? 'Permanently Delete User' : 'Deactivate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'hard' ? (
                <>
                  This action <strong>cannot be undone</strong>. This will permanently delete the
                  user account and all associated data including their profile, bookings, and reviews.
                </>
              ) : (
                <>
                  This will deactivate the user account. The user will not be able to log in
                  until reactivated. Their data will be preserved.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDialog.type === 'hard' ? 'Delete Permanently' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =====================================================
// TYPE-SPECIFIC PROFILE SECTIONS
// =====================================================

function MaidProfileSection({ profile, isEditing, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Maid Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name || ''}
                onChange={(e) => onChange('full_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input
                value={profile.nationality || ''}
                onChange={(e) => onChange('nationality', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Experience (Years)</Label>
              <Input
                type="number"
                value={profile.experience_years || ''}
                onChange={(e) => onChange('experience_years', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Primary Profession</Label>
              <Input
                value={profile.primary_profession || ''}
                onChange={(e) => onChange('primary_profession', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Availability Status</Label>
              <Select
                value={profile.availability_status || 'available'}
                onValueChange={(value) => onChange('availability_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verification Status</Label>
              <Select
                value={profile.verification_status || 'pending'}
                onValueChange={(value) => onChange('verification_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFICATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>About</Label>
              <Textarea
                value={profile.about_me || ''}
                onChange={(e) => onChange('about_me', e.target.value)}
                rows={3}
              />
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Full Name" value={profile.full_name} icon={User} />
            <InfoRow label="Nationality" value={profile.nationality} icon={Globe} />
            <InfoRow label="Experience" value={`${profile.experience_years || 0} years`} icon={Briefcase} />
            <InfoRow label="Profession" value={profile.primary_profession} icon={Briefcase} />
            <InfoRow label="Location" value={profile.current_location || profile.country} icon={MapPin} />
            <InfoRow label="Languages" value={(profile.languages || []).join(', ')} icon={Globe} />
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Availability</p>
              <Badge
                className={cn(
                  profile.availability_status === 'available' && 'bg-green-100 text-green-800',
                  profile.availability_status === 'busy' && 'bg-yellow-100 text-yellow-800',
                  profile.availability_status === 'unavailable' && 'bg-red-100 text-red-800'
                )}
              >
                {profile.availability_status || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Verification</p>
              <Badge
                className={cn(
                  VERIFICATION_STATUSES.find(s => s.value === profile.verification_status)?.color ||
                  'bg-gray-100 text-gray-800'
                )}
              >
                {profile.verification_status || 'pending'}
              </Badge>
            </div>
            {profile.about_me && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">About</p>
                <p className="text-sm text-gray-700">{profile.about_me}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AgencyProfileSection({ profile, isEditing, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Agency Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Agency Name</Label>
              <Input
                value={profile.agency_name || ''}
                onChange={(e) => onChange('agency_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input
                value={profile.license_number || ''}
                onChange={(e) => onChange('license_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={profile.phone || ''}
                onChange={(e) => onChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={profile.website || ''}
                onChange={(e) => onChange('website', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Verification Status</Label>
              <Select
                value={profile.verification_status || 'pending'}
                onValueChange={(value) => onChange('verification_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFICATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={profile.description || ''}
                onChange={(e) => onChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Agency Name" value={profile.agency_name} icon={Building2} />
            <InfoRow label="License Number" value={profile.license_number} icon={FileText} />
            <InfoRow label="Phone" value={profile.phone} icon={Phone} />
            <InfoRow label="Email" value={profile.email} icon={Mail} />
            <InfoRow label="Website" value={profile.website} icon={Globe} />
            <InfoRow label="Location" value={`${profile.city || ''}, ${profile.country || ''}`} icon={MapPin} />
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Verification</p>
              <Badge
                className={cn(
                  VERIFICATION_STATUSES.find(s => s.value === profile.verification_status)?.color ||
                  'bg-gray-100 text-gray-800'
                )}
              >
                {profile.verification_status || 'pending'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Total Maids</p>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {profile.total_maids || 0}
              </Badge>
            </div>
            {profile.description && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{profile.description}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SponsorProfileSection({ profile, isEditing, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Sponsor Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name || ''}
                onChange={(e) => onChange('full_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={profile.phone || ''}
                onChange={(e) => onChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Occupation</Label>
              <Input
                value={profile.occupation || ''}
                onChange={(e) => onChange('occupation', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={profile.company || ''}
                onChange={(e) => onChange('company', e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Full Name" value={profile.full_name} icon={User} />
            <InfoRow label="Phone" value={profile.phone} icon={Phone} />
            <InfoRow label="Location" value={`${profile.city || ''}, ${profile.country || ''}`} icon={MapPin} />
            <InfoRow label="Occupation" value={profile.occupation} icon={Briefcase} />
            <InfoRow label="Company" value={profile.company} icon={Building2} />
            <InfoRow label="Family Size" value={profile.family_size} icon={Users} />
            {profile.budget_min && (
              <InfoRow
                label="Budget"
                value={`${profile.budget_currency || 'USD'} ${profile.budget_min} - ${profile.budget_max}`}
                icon={DollarSign}
              />
            )}
            {profile.preferred_nationality && (
              <InfoRow
                label="Preferred Nationality"
                value={profile.preferred_nationality}
                icon={Globe}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminUserDetailPage;
