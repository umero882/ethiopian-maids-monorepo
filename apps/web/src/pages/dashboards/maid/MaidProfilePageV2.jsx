/**
 * Maid Profile Page V2 - Redesigned to align with Onboarding
 *
 * This page ONLY shows fields that are collected during onboarding.
 * All other fields have been removed for consistency.
 *
 * Onboarding Steps Mapped:
 * 1. Personal Info → PersonalInfoSection
 * 2. Identity Verification → PhotoSection
 * 3. Location → LocationSection
 * 4. Professional Details → ProfessionalSection
 * 5. Skills & Languages → SkillsSection
 * 6. Experience → ExperienceSection
 * 7. Preferences → PreferencesSection
 * 8. About Me → AboutSection
 * 9. Video CV & Gallery → MediaSection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  User,
  MapPin,
  Briefcase,
  Star,
  Heart,
  Video,
  Camera,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Languages,
  Clock,
  DollarSign,
  FileText,
  Image,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import MultiSelect from '@/components/ui/multi-select';
import { DropdownDatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/contexts/AuthContext';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { uploadProfilePhoto, uploadVideoCV } from '@/lib/firebaseClient';
import { differenceInYears } from 'date-fns';
import {
  getProfileCompletionStatus,
  ONBOARDING_REQUIRED_FIELDS,
} from '@/lib/profileCompletion';
import { ProfileSkeleton } from '@/components/ui/loading-states';

// Import dropdown options from maidProfileData (same as onboarding)
import {
  nationalities,
  religions,
  maritalStatuses,
  positions,
  visaStatuses,
  educationLevels,
  skills as skillOptions,
  languages as languageOptions,
  experienceLevels,
  gccCountries,
  salaryRanges,
  workPreferences as workPreferenceOptions,
  contractTypes,
  accommodationPreferences,
} from '@/data/maidProfileData';

// GraphQL query - only fields from onboarding that exist in schema
const GET_MAID_PROFILE = gql`
  query GetMaidProfile($userId: String!) {
    maid_profiles(where: { _or: [{ id: { _eq: $userId } }, { user_id: { _eq: $userId } }] }, limit: 1) {
      id
      user_id
      # Personal Info (MaidPersonalStep)
      full_name
      date_of_birth
      nationality
      religion
      marital_status
      # Location (MaidAddressStep)
      country
      state_province
      street_address
      # Professional (MaidProfessionStep)
      primary_profession
      current_visa_status
      education_level
      # Skills (MaidSkillsStep)
      skills
      languages
      # Experience (MaidExperienceStep)
      experience_years
      previous_countries
      # Preferences (MaidPreferencesStep)
      preferred_salary_min
      work_preferences
      contract_duration_preference
      live_in_preference
      # About (MaidAboutStep)
      about_me
      # Media (MaidVideoCVStep & MaidBiometricDocStep)
      profile_photo_url
      introduction_video_url
      # Status
      profile_completion_percentage
      availability_status
      created_at
      updated_at
    }
    # Fetch gallery photos and documents from maid_documents table
    maid_documents(where: { maid_id: { _eq: $userId } }, order_by: { uploaded_at: desc }) {
      id
      type
      document_type
      file_url
      document_url
      uploaded_at
    }
  }
`;

// Helper to extract gallery photos from documents
const getGalleryPhotosFromDocs = (documents) => {
  if (!documents) return [];
  return documents
    .filter(doc => doc.type === 'gallery_photo' || doc.document_type === 'gallery_photo')
    .map(doc => doc.file_url || doc.document_url)
    .filter(Boolean);
};

// GraphQL mutation to update profile
const UPDATE_MAID_PROFILE = gql`
  mutation UpdateMaidProfile($userId: String!, $data: maid_profiles_set_input!) {
    update_maid_profiles(
      where: { _or: [{ id: { _eq: $userId } }, { user_id: { _eq: $userId } }] }
      _set: $data
    ) {
      affected_rows
      returning {
        id
        profile_completion_percentage
      }
    }
  }
`;

// =====================================================
// PROFILE HEADER COMPONENT
// =====================================================
const ProfileHeader = ({ profile, completionStatus, onEditPhoto }) => {
  const age = profile?.date_of_birth
    ? differenceInYears(new Date(), new Date(profile.date_of_birth))
    : null;

  return (
    <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-white/30">
              <AvatarImage src={profile?.profile_photo_url} />
              <AvatarFallback className="bg-white/20 text-white text-2xl">
                {profile?.full_name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={onEditPhoto}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            {profile?.verification_status === 'verified' && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile?.full_name || 'Your Name'}</h1>
            <p className="text-white/80 text-sm">
              {profile?.primary_profession || 'Profession not set'}
              {age && ` • ${age} years old`}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-white/60" />
              <span className="text-white/60 text-xs">
                {profile?.country || 'Location not set'}
              </span>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.is_available && (
                <Badge className="bg-green-500/20 text-green-200 border-green-500/30">
                  Available
                </Badge>
              )}
              {profile?.verification_status === 'verified' && (
                <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/80">Profile Completion</span>
            <span className="font-semibold">{completionStatus.percentage}%</span>
          </div>
          <Progress
            value={completionStatus.percentage}
            className="h-2 bg-white/20"
          />
          {completionStatus.status !== 'complete' && (
            <p className="text-white/60 text-xs mt-2">
              {completionStatus.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// SECTION WRAPPER COMPONENT
// =====================================================
const ProfileSection = ({ title, icon: Icon, children, isEditing, onEdit, onSave, onCancel, isSaving }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between py-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-purple-500" />}
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      {!isEditing ? (
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      )}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// =====================================================
// FIELD DISPLAY/EDIT COMPONENT
// =====================================================
// Helper to extract display value from string or {value, label} object
const getDisplayValue = (item) => {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    return item.label || item.value || String(item);
  }
  return String(item);
};

// Helper to normalize array values to strings (for MultiSelect)
const normalizeArrayToStrings = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return item.value || item.label || String(item);
    }
    return String(item);
  });
};

const ProfileField = ({ label, value, isEditing, editComponent, emptyText = 'Not set' }) => (
  <div className="space-y-1">
    <Label className="text-sm text-gray-500">{label}</Label>
    {isEditing ? (
      editComponent
    ) : (
      <p className="text-sm font-medium text-gray-900">
        {Array.isArray(value) ? (
          value.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {value.map((v, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {getDisplayValue(v)}
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-gray-400">{emptyText}</span>
          )
        ) : value ? (
          getDisplayValue(value)
        ) : (
          <span className="text-gray-400">{emptyText}</span>
        )}
      </p>
    )}
  </div>
);

// =====================================================
// MAIN PROFILE PAGE COMPONENT
// =====================================================
const MaidProfilePageV2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoGalleryIndex, setPhotoGalleryIndex] = useState(0);

  // Calculate completion status
  const completionStatus = getProfileCompletionStatus(profile || {});

  // Fetch profile on mount
  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await apolloClient.query({
        query: GET_MAID_PROFILE,
        variables: { userId: user.id },
        fetchPolicy: 'network-only',
      });

      if (data?.maid_profiles?.[0]) {
        // Combine profile with gallery photos from documents
        const profileData = data.maid_profiles[0];
        const galleryPhotos = getGalleryPhotosFromDocs(data.maid_documents);

        setProfile({
          ...profileData,
          gallery_photos: galleryPhotos,
          is_available: profileData.availability_status === 'available',
          verification_status: 'pending', // Default since column might not exist
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Start editing a section
  const startEditing = (section) => {
    setEditingSection(section);
    setEditData({ ...profile });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };

  // Update edit data
  const updateEditData = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // Save changes
  const saveChanges = async (section) => {
    try {
      setSaving(true);

      // Prepare update data based on section
      let updateData = {};

      switch (section) {
        case 'personal':
          updateData = {
            full_name: editData.full_name,
            date_of_birth: editData.date_of_birth,
            nationality: editData.nationality,
            religion: editData.religion,
            marital_status: editData.marital_status,
          };
          break;
        case 'location':
          updateData = {
            country: editData.country,
            state_province: editData.state_province,
            street_address: editData.street_address,
          };
          break;
        case 'professional':
          updateData = {
            primary_profession: editData.primary_profession,
            current_visa_status: editData.current_visa_status,
            education_level: editData.education_level,
          };
          break;
        case 'skills':
          updateData = {
            skills: editData.skills,
            languages: editData.languages,
          };
          break;
        case 'experience':
          updateData = {
            experience_years: editData.experience_years,
            previous_countries: editData.previous_countries,
          };
          break;
        case 'preferences':
          updateData = {
            preferred_salary_min: editData.preferred_salary_min,
            work_preferences: editData.work_preferences,
            contract_duration_preference: editData.contract_duration_preference,
            live_in_preference: editData.live_in_preference,
          };
          break;
        case 'about':
          updateData = {
            about_me: editData.about_me,
          };
          break;
        default:
          break;
      }

      // Calculate new completion percentage
      const newProfile = { ...profile, ...updateData };
      const newStatus = getProfileCompletionStatus(newProfile);
      updateData.profile_completion_percentage = newStatus.percentage;

      // Update in database
      await apolloClient.mutate({
        mutation: UPDATE_MAID_PROFILE,
        variables: {
          userId: user.id,
          data: updateData,
        },
      });

      // Update local state
      setProfile((prev) => ({ ...prev, ...updateData }));
      setEditingSection(null);

      toast({
        title: 'Saved!',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (file) => {
    try {
      setSaving(true);
      const photoUrl = await uploadProfilePhoto(file, user.id);

      await apolloClient.mutate({
        mutation: UPDATE_MAID_PROFILE,
        variables: {
          userId: user.id,
          data: { profile_photo_url: photoUrl },
        },
      });

      setProfile((prev) => ({ ...prev, profile_photo_url: photoUrl }));
      toast({ title: 'Photo updated!' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Format salary for display
  const formatSalary = (amount) => {
    if (!amount) return null;
    return `AED ${amount.toLocaleString()}/month`;
  };

  // Format experience years
  const formatExperience = (years) => {
    if (!years || years === 0) return 'No Experience';
    if (years >= 10) return '10+ years';
    if (years >= 6) return '6-10 years';
    if (years >= 3) return '3-5 years';
    if (years >= 1) return '1-2 years';
    return 'Less than 1 year';
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard/maid')}
        className="mb-2"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Button>

      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        completionStatus={completionStatus}
        onEditPhoto={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) handlePhotoUpload(file);
          };
          input.click();
        }}
      />

      {/* Missing Fields Alert */}
      {completionStatus.missingFields.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Complete your profile to get more visibility
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Missing: {completionStatus.missingFields.map((f) => f.label).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="personal" className="text-xs">
            <User className="w-4 h-4 mr-1 hidden sm:inline" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="work" className="text-xs">
            <Briefcase className="w-4 h-4 mr-1 hidden sm:inline" />
            Work
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs">
            <Heart className="w-4 h-4 mr-1 hidden sm:inline" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="media" className="text-xs">
            <Video className="w-4 h-4 mr-1 hidden sm:inline" />
            Media
          </TabsTrigger>
        </TabsList>

        {/* PERSONAL TAB */}
        <TabsContent value="personal" className="space-y-4">
          {/* Personal Info Section */}
          <ProfileSection
            title="Personal Information"
            icon={User}
            isEditing={editingSection === 'personal'}
            onEdit={() => startEditing('personal')}
            onSave={() => saveChanges('personal')}
            onCancel={cancelEditing}
            isSaving={saving}
          >
            <div className="grid grid-cols-2 gap-4">
              <ProfileField
                label="Full Name"
                value={profile?.full_name}
                isEditing={editingSection === 'personal'}
                editComponent={
                  <Input
                    value={editData.full_name || ''}
                    onChange={(e) => updateEditData('full_name', e.target.value)}
                    placeholder="Your full name"
                  />
                }
              />
              <ProfileField
                label="Date of Birth"
                value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null}
                isEditing={editingSection === 'personal'}
                editComponent={
                  <DropdownDatePicker
                    value={editData.date_of_birth}
                    onChange={(date) => updateEditData('date_of_birth', date)}
                  />
                }
              />
              <ProfileField
                label="Nationality"
                value={profile?.nationality}
                isEditing={editingSection === 'personal'}
                editComponent={
                  <Select
                    value={editData.nationality || ''}
                    onValueChange={(v) => updateEditData('nationality', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {nationalities.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="Religion"
                value={profile?.religion}
                isEditing={editingSection === 'personal'}
                editComponent={
                  <Select
                    value={editData.religion || ''}
                    onValueChange={(v) => updateEditData('religion', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select religion" />
                    </SelectTrigger>
                    <SelectContent>
                      {religions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="Marital Status"
                value={profile?.marital_status}
                isEditing={editingSection === 'personal'}
                editComponent={
                  <Select
                    value={editData.marital_status || ''}
                    onValueChange={(v) => updateEditData('marital_status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {maritalStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </div>
          </ProfileSection>

          {/* Location Section */}
          <ProfileSection
            title="Location"
            icon={MapPin}
            isEditing={editingSection === 'location'}
            onEdit={() => startEditing('location')}
            onSave={() => saveChanges('location')}
            onCancel={cancelEditing}
            isSaving={saving}
          >
            <div className="grid grid-cols-2 gap-4">
              <ProfileField
                label="Country"
                value={profile?.country}
                isEditing={editingSection === 'location'}
                editComponent={
                  <Select
                    value={editData.country || ''}
                    onValueChange={(v) => updateEditData('country', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Ethiopia', 'Kenya', 'Uganda', 'Philippines', 'India', 'Sri Lanka', 'Nepal', 'Bangladesh'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="City"
                value={profile?.state_province}
                isEditing={editingSection === 'location'}
                editComponent={
                  <Input
                    value={editData.state_province || ''}
                    onChange={(e) => updateEditData('state_province', e.target.value)}
                    placeholder="City name"
                  />
                }
              />
              <div className="col-span-2">
                <ProfileField
                  label="Address"
                  value={profile?.street_address}
                  isEditing={editingSection === 'location'}
                  editComponent={
                    <Input
                      value={editData.street_address || ''}
                      onChange={(e) => updateEditData('street_address', e.target.value)}
                      placeholder="Street address"
                    />
                  }
                />
              </div>
            </div>
          </ProfileSection>
        </TabsContent>

        {/* WORK TAB */}
        <TabsContent value="work" className="space-y-4">
          {/* Professional Section */}
          <ProfileSection
            title="Professional Details"
            icon={Briefcase}
            isEditing={editingSection === 'professional'}
            onEdit={() => startEditing('professional')}
            onSave={() => saveChanges('professional')}
            onCancel={cancelEditing}
            isSaving={saving}
          >
            <div className="grid grid-cols-2 gap-4">
              <ProfileField
                label="Profession"
                value={profile?.primary_profession}
                isEditing={editingSection === 'professional'}
                editComponent={
                  <Select
                    value={editData.primary_profession || ''}
                    onValueChange={(v) => updateEditData('primary_profession', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="Visa Status"
                value={profile?.current_visa_status}
                isEditing={editingSection === 'professional'}
                editComponent={
                  <Select
                    value={editData.current_visa_status || ''}
                    onValueChange={(v) => updateEditData('current_visa_status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visa status" />
                    </SelectTrigger>
                    <SelectContent>
                      {visaStatuses.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="Education Level"
                value={profile?.education_level}
                isEditing={editingSection === 'professional'}
                editComponent={
                  <Select
                    value={editData.education_level || ''}
                    onValueChange={(v) => updateEditData('education_level', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education" />
                    </SelectTrigger>
                    <SelectContent>
                      {(educationLevels || ['No Formal Education', 'Primary School', 'Secondary School', 'High School', 'Vocational Training', 'College Diploma', 'Bachelor\'s Degree']).map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </div>
          </ProfileSection>

          {/* Skills Section */}
          <ProfileSection
            title="Skills & Languages"
            icon={Star}
            isEditing={editingSection === 'skills'}
            onEdit={() => startEditing('skills')}
            onSave={() => saveChanges('skills')}
            onCancel={cancelEditing}
            isSaving={saving}
          >
            <div className="space-y-4">
              <ProfileField
                label="Skills"
                value={profile?.skills}
                isEditing={editingSection === 'skills'}
                editComponent={
                  <MultiSelect
                    options={skillOptions.map((s) => ({ value: s, label: s }))}
                    selected={normalizeArrayToStrings(editData.skills)}
                    onChange={(v) => updateEditData('skills', v)}
                    placeholder="Select skills"
                  />
                }
              />
              <ProfileField
                label="Languages"
                value={profile?.languages}
                isEditing={editingSection === 'skills'}
                editComponent={
                  <MultiSelect
                    options={languageOptions.map((l) => ({ value: l, label: l }))}
                    selected={normalizeArrayToStrings(editData.languages)}
                    onChange={(v) => updateEditData('languages', v)}
                    placeholder="Select languages"
                  />
                }
              />
            </div>
          </ProfileSection>

          {/* Experience Section */}
          <ProfileSection
            title="Experience"
            icon={Clock}
            isEditing={editingSection === 'experience'}
            onEdit={() => startEditing('experience')}
            onSave={() => saveChanges('experience')}
            onCancel={cancelEditing}
            isSaving={saving}
          >
            <div className="space-y-4">
              <ProfileField
                label="Years of Experience"
                value={formatExperience(profile?.experience_years)}
                isEditing={editingSection === 'experience'}
                editComponent={
                  <Select
                    value={String(editData.experience_years || 0)}
                    onValueChange={(v) => updateEditData('experience_years', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Experience</SelectItem>
                      <SelectItem value="1">1-2 years</SelectItem>
                      <SelectItem value="3">3-5 years</SelectItem>
                      <SelectItem value="6">6-10 years</SelectItem>
                      <SelectItem value="10">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="Countries Worked In"
                value={profile?.previous_countries}
                isEditing={editingSection === 'experience'}
                editComponent={
                  <MultiSelect
                    options={gccCountries.map((c) => ({ value: c, label: c }))}
                    selected={normalizeArrayToStrings(editData.previous_countries)}
                    onChange={(v) => updateEditData('previous_countries', v)}
                    placeholder="Select countries"
                  />
                }
              />
            </div>
          </ProfileSection>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-4">
          {/* Work Preferences Section */}
          <ProfileSection
            title="Work Preferences"
            icon={Heart}
            isEditing={editingSection === 'preferences'}
            onEdit={() => startEditing('preferences')}
            onSave={() => saveChanges('preferences')}
            onCancel={cancelEditing}
            isSaving={saving}
          >
            <div className="space-y-4">
              <ProfileField
                label="Expected Salary"
                value={formatSalary(profile?.preferred_salary_min)}
                isEditing={editingSection === 'preferences'}
                editComponent={
                  <Select
                    value={String(editData.preferred_salary_min || '')}
                    onValueChange={(v) => updateEditData('preferred_salary_min', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salary range" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1000, 1500, 2000, 2500, 3000, 3500, 4000].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          AED {s.toLocaleString()}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="Work Type"
                value={profile?.work_preferences}
                isEditing={editingSection === 'preferences'}
                editComponent={
                  <MultiSelect
                    options={(workPreferenceOptions || []).map((w) => ({ value: w, label: w }))}
                    selected={normalizeArrayToStrings(editData.work_preferences)}
                    onChange={(v) => updateEditData('work_preferences', v)}
                    placeholder="Select work preferences"
                  />
                }
              />
              <ProfileField
                label="Contract Type"
                value={profile?.contract_duration_preference}
                isEditing={editingSection === 'preferences'}
                editComponent={
                  <Select
                    value={editData.contract_duration_preference || ''}
                    onValueChange={(v) => updateEditData('contract_duration_preference', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(contractTypes || ['1 year', '2 years', '3+ years', 'Flexible']).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <ProfileField
                label="Accommodation"
                value={profile?.live_in_preference ? 'Live-in' : 'Live-out or Flexible'}
                isEditing={editingSection === 'preferences'}
                editComponent={
                  <Select
                    value={editData.live_in_preference ? 'true' : 'false'}
                    onValueChange={(v) => updateEditData('live_in_preference', v === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Live-in (Employer-provided)</SelectItem>
                      <SelectItem value="false">Live-out or Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </div>
          </ProfileSection>

          {/* About Me Section */}
          <ProfileSection
            title="About Me"
            icon={FileText}
            isEditing={editingSection === 'about'}
            onEdit={() => startEditing('about')}
            onSave={() => saveChanges('about')}
            onCancel={cancelEditing}
            isSaving={saving}
          >
            <ProfileField
              label="Tell employers about yourself"
              value={profile?.about_me}
              emptyText="Write a brief introduction about yourself, your experience, and what makes you a great candidate."
              isEditing={editingSection === 'about'}
              editComponent={
                <Textarea
                  value={editData.about_me || ''}
                  onChange={(e) => updateEditData('about_me', e.target.value)}
                  placeholder="Write about yourself..."
                  rows={6}
                  maxLength={1000}
                />
              }
            />
          </ProfileSection>
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media" className="space-y-4">
          {/* Video CV Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-lg">Video Introduction</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {profile?.introduction_video_url ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    src={profile.introduction_video_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                  <Video className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No video uploaded</p>
                  <p className="text-xs text-gray-400">Upload from your dashboard</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo Gallery Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-lg">Photo Gallery</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {profile?.gallery_photos && profile.gallery_photos.length > 0 ? (
                <div className="space-y-3">
                  {/* Main photo */}
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={profile.gallery_photos[photoGalleryIndex]}
                      alt={`Gallery photo ${photoGalleryIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {profile.gallery_photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setPhotoGalleryIndex((i) => (i === 0 ? profile.gallery_photos.length - 1 : i - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setPhotoGalleryIndex((i) => (i === profile.gallery_photos.length - 1 ? 0 : i + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {photoGalleryIndex + 1} / {profile.gallery_photos.length}
                    </div>
                  </div>
                  {/* Thumbnails */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {profile.gallery_photos.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoGalleryIndex(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          i === photoGalleryIndex ? 'border-purple-500' : 'border-transparent'
                        }`}
                      >
                        <img src={photo} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                  <Image className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No photos uploaded</p>
                  <p className="text-xs text-gray-400">Add photos to your profile gallery</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaidProfilePageV2;
