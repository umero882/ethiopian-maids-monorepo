import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Loader2, User, MapPin, Phone, Mail } from 'lucide-react';

const COUNTRIES = [
  'Ethiopia',
  'United Arab Emirates',
  'Saudi Arabia',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Lebanon',
  'Jordan',
  'Kenya',
  'Uganda',
  'Tanzania',
  'Other',
];

const USER_TYPES = [
  { value: 'maid', label: 'Maid' },
  { value: 'agency', label: 'Agency' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const ProfileOverviewTab = ({
  profile,
  editingSection,
  pendingChanges,
  onStartEditing,
  onCancelEditing,
  onUpdateField,
  onSave,
  isSaving,
}) => {
  const [localData, setLocalData] = useState({});

  useEffect(() => {
    if (profile) {
      setLocalData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        location: profile.location || '',
        user_type: profile.user_type || '',
        preferred_language: profile.preferred_language || '',
        years_experience: profile.years_experience || 0,
      });
    }
  }, [profile]);

  const isEditing = editingSection === 'overview';

  const handleStartEdit = () => {
    onStartEditing('overview', { ...localData });
  };

  const handleFieldChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    onUpdateField(field, value);
  };

  const handleSave = async () => {
    await onSave(pendingChanges);
  };

  const handleCancel = () => {
    setLocalData({
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      country: profile.country || '',
      location: profile.location || '',
      user_type: profile.user_type || '',
      preferred_language: profile.preferred_language || '',
      years_experience: profile.years_experience || 0,
    });
    onCancelEditing();
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={localData.full_name}
                  onChange={(e) => handleFieldChange('full_name', e.target.value)}
                  placeholder="Enter full name"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.full_name || 'Not provided'}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={localData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.email || 'Not provided'}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={localData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-sm text-gray-900">
                    {profile.phone || 'Not provided'}
                  </span>
                  {profile.phone_verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Verified
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* User Type */}
            <div className="space-y-2">
              <Label htmlFor="user_type">User Type</Label>
              {isEditing ? (
                <Select
                  value={localData.user_type}
                  onValueChange={(value) => handleFieldChange('user_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 py-2 capitalize">
                  {profile.user_type?.replace('_', ' ') || 'Not set'}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              {isEditing ? (
                <Select
                  value={localData.country}
                  onValueChange={(value) => handleFieldChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.country || 'Not provided'}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location/City</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={localData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="Enter city or location"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.location || 'Not provided'}
                </p>
              )}
            </div>

            {/* Preferred Language */}
            <div className="space-y-2">
              <Label htmlFor="preferred_language">Preferred Language</Label>
              {isEditing ? (
                <Select
                  value={localData.preferred_language}
                  onValueChange={(value) => handleFieldChange('preferred_language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="am">Amharic</SelectItem>
                    <SelectItem value="or">Oromo</SelectItem>
                    <SelectItem value="ti">Tigrinya</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 py-2 capitalize">
                  {profile.preferred_language || 'Not set'}
                </p>
              )}
            </div>

            {/* Years of Experience */}
            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience</Label>
              {isEditing ? (
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  value={localData.years_experience}
                  onChange={(e) => handleFieldChange('years_experience', parseInt(e.target.value) || 0)}
                  placeholder="Enter years"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.years_experience || 0} years
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Status</p>
              <Badge
                className={profile.is_active ? 'bg-green-500 mt-1' : 'bg-red-500 mt-1'}
              >
                {profile.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Registration</p>
              <Badge
                className={profile.registration_complete ? 'bg-green-500 mt-1' : 'bg-yellow-500 mt-1'}
              >
                {profile.registration_complete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Verified</p>
              <Badge
                className={profile.phone_verified ? 'bg-green-500 mt-1' : 'bg-gray-400 mt-1'}
              >
                {profile.phone_verified ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Hired Maids</p>
              <p className="text-lg font-semibold mt-1">{profile.hired_maids || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Created At</p>
              <p className="text-sm font-medium mt-1">
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
              <p className="text-sm font-medium mt-1">
                {profile.updated_at
                  ? new Date(profile.updated_at).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Last Seen</p>
              <p className="text-sm font-medium mt-1">
                {profile.last_seen
                  ? new Date(profile.last_seen).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileOverviewTab;
