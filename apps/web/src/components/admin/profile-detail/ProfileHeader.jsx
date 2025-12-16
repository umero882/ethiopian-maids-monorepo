import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  MoreVertical,
  Download,
  Power,
  Trash2,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getVerificationBadge = (status) => {
  const configs = {
    verified: { label: 'Verified', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
    pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    unverified: { label: 'Unverified', variant: 'outline', className: 'border-gray-400 text-gray-600' },
    rejected: { label: 'Rejected', variant: 'destructive', className: '' },
  };
  const config = configs[status?.toLowerCase()] || configs.unverified;
  return <Badge className={config.className}>{config.label}</Badge>;
};

const getSubscriptionBadge = (status) => {
  const configs = {
    active: { label: 'Active', className: 'bg-blue-500 hover:bg-blue-600' },
    trial: { label: 'Trial', className: 'bg-purple-500 hover:bg-purple-600' },
    expired: { label: 'Expired', className: 'bg-gray-500 hover:bg-gray-600' },
    cancelled: { label: 'Cancelled', className: 'bg-red-500 hover:bg-red-600' },
    free: { label: 'Free', className: 'bg-green-600 hover:bg-green-700' },
  };
  const config = configs[status?.toLowerCase()] || { label: status || 'N/A', className: 'bg-gray-400' };
  return <Badge className={config.className}>{config.label}</Badge>;
};

const getUserTypeBadge = (userType) => {
  const configs = {
    maid: { label: 'Maid', className: 'bg-pink-500 hover:bg-pink-600' },
    agency: { label: 'Agency', className: 'bg-indigo-500 hover:bg-indigo-600' },
    sponsor: { label: 'Sponsor', className: 'bg-teal-500 hover:bg-teal-600' },
    admin: { label: 'Admin', className: 'bg-orange-500 hover:bg-orange-600' },
    super_admin: { label: 'Super Admin', className: 'bg-red-600 hover:bg-red-700' },
  };
  const config = configs[userType?.toLowerCase()] || { label: userType || 'Unknown', className: 'bg-gray-400' };
  return <Badge className={config.className}>{config.label}</Badge>;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ProfileHeader = ({
  profile,
  profileType,
  onExport,
  onToggleActive,
  onDelete,
  onRefresh,
  isSaving,
}) => {
  const navigate = useNavigate();

  if (!profile) return null;

  const avatarUrl = profile.avatar_url || profile.maid_profile?.profile_photo_url || profile.agency_profile?.logo_url;
  const displayName = profile.full_name || profile.email || 'Unknown User';

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Top Row: Back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/content/profiles')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profiles
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isSaving}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isSaving && "animate-spin")} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onToggleActive}
                disabled={isSaving}
                className={profile.is_active ? 'text-orange-600' : 'text-green-600'}
              >
                <Power className="h-4 w-4 mr-2" />
                {profile.is_active ? 'Deactivate Account' : 'Activate Account'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                disabled={isSaving}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Main Info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            {getUserTypeBadge(profile.user_type)}
            {getVerificationBadge(profile.verification_status)}
            {getSubscriptionBadge(profile.subscription_status)}
            {!profile.is_active && (
              <Badge variant="destructive">Deactivated</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{profile.email || 'No email'}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{profile.phone || 'No phone'}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>
                {profile.location || profile.country || 'No location'}
              </span>
            </div>

            {/* Joined Date */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
            {/* Rating */}
            {profile.rating !== null && profile.rating !== undefined && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{profile.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-500 text-sm">
                  ({profile.total_reviews || 0} reviews)
                </span>
              </div>
            )}

            {/* Trust Score */}
            {profile.trust_score !== null && profile.trust_score !== undefined && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="font-medium">{profile.trust_score}%</span>
                <span className="text-gray-500 text-sm">trust score</span>
              </div>
            )}

            {/* Profile Completion */}
            {profile.profile_completion !== null && profile.profile_completion !== undefined && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${profile.profile_completion}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {profile.profile_completion}% complete
                </span>
              </div>
            )}

            {/* Last Seen */}
            {profile.last_seen && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                <span>Last seen {formatDate(profile.last_seen)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
