import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Edit,
  Save,
  X,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  FileText,
  Image,
  DollarSign,
  Globe,
} from 'lucide-react';

const MARITAL_STATUS_OPTIONS = ['single', 'married', 'divorced', 'widowed'];
const RELIGIONS = ['Christian', 'Muslim', 'Orthodox', 'Protestant', 'Catholic', 'Other'];
const EDUCATION_LEVELS = ['none', 'primary', 'secondary', 'diploma', 'bachelors', 'masters'];
const AVAILABILITY_STATUS = ['available', 'employed', 'unavailable', 'pending'];
const VISA_STATUS_OPTIONS = ['valid', 'expired', 'none', 'processing', 'other'];
const PROFESSIONS = [
  'housemaid',
  'nanny',
  'caregiver',
  'cook',
  'cleaner',
  'babysitter',
  'elderly_care',
  'driver',
  'other',
];

const MaidProfileTab = ({
  maidProfile,
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
    if (maidProfile) {
      setLocalData({ ...maidProfile });
    }
  }, [maidProfile]);

  if (!maidProfile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No maid profile data available
      </div>
    );
  }

  const isEditing = (section) => editingSection === section;

  const handleStartEdit = (section) => {
    const sectionData = getSectionData(section);
    onStartEditing(section, sectionData);
  };

  const handleFieldChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    onUpdateField(field, value);
  };

  const handleSave = async () => {
    await onSave(pendingChanges);
  };

  const handleCancel = (section) => {
    setLocalData({ ...maidProfile });
    onCancelEditing();
  };

  const getSectionData = (section) => {
    switch (section) {
      case 'maid-personal':
        return {
          first_name: localData.first_name,
          middle_name: localData.middle_name,
          last_name: localData.last_name,
          date_of_birth: localData.date_of_birth,
          nationality: localData.nationality,
          marital_status: localData.marital_status,
          children_count: localData.children_count,
          religion: localData.religion,
        };
      case 'maid-professional':
        return {
          primary_profession: localData.primary_profession,
          experience_years: localData.experience_years,
          education_level: localData.education_level,
          about_me: localData.about_me,
        };
      case 'maid-skills':
        return {
          skills: localData.skills,
          special_skills: localData.special_skills,
          languages: localData.languages,
          key_responsibilities: localData.key_responsibilities,
        };
      case 'maid-preferences':
        return {
          preferred_salary_min: localData.preferred_salary_min,
          preferred_salary_max: localData.preferred_salary_max,
          preferred_currency: localData.preferred_currency,
          availability_status: localData.availability_status,
          live_in_preference: localData.live_in_preference,
          work_preferences: localData.work_preferences,
        };
      case 'maid-documents':
        return {
          passport_expiry: localData.passport_expiry,
          current_visa_status: localData.current_visa_status,
          medical_certificate_valid: localData.medical_certificate_valid,
          police_clearance_valid: localData.police_clearance_valid,
        };
      default:
        return {};
    }
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const EditButtons = ({ section }) => (
    <div className="flex items-center gap-2">
      {isEditing(section) ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCancel(section)}
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
            Save
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={() => handleStartEdit(section)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );

  return (
    <Accordion type="multiple" defaultValue={['personal', 'professional']} className="space-y-4">
      {/* Personal Information */}
      <AccordionItem value="personal" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Personal Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="maid-personal" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              {isEditing('maid-personal') ? (
                <Input
                  value={localData.first_name || ''}
                  onChange={(e) => handleFieldChange('first_name', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{maidProfile.first_name || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              {isEditing('maid-personal') ? (
                <Input
                  value={localData.middle_name || ''}
                  onChange={(e) => handleFieldChange('middle_name', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{maidProfile.middle_name || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              {isEditing('maid-personal') ? (
                <Input
                  value={localData.last_name || ''}
                  onChange={(e) => handleFieldChange('last_name', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{maidProfile.last_name || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              {isEditing('maid-personal') ? (
                <Input
                  type="date"
                  value={localData.date_of_birth?.split('T')[0] || ''}
                  onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">
                  {maidProfile.date_of_birth
                    ? new Date(maidProfile.date_of_birth).toLocaleDateString()
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              {isEditing('maid-personal') ? (
                <Input
                  value={localData.nationality || ''}
                  onChange={(e) => handleFieldChange('nationality', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{maidProfile.nationality || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Marital Status</Label>
              {isEditing('maid-personal') ? (
                <Select
                  value={localData.marital_status || ''}
                  onValueChange={(value) => handleFieldChange('marital_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 capitalize">{maidProfile.marital_status || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Number of Children</Label>
              {isEditing('maid-personal') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.children_count || 0}
                  onChange={(e) => handleFieldChange('children_count', parseInt(e.target.value) || 0)}
                />
              ) : (
                <p className="text-sm py-2">{maidProfile.children_count || 0}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Religion</Label>
              {isEditing('maid-personal') ? (
                <Select
                  value={localData.religion || ''}
                  onValueChange={(value) => handleFieldChange('religion', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select religion" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELIGIONS.map((religion) => (
                      <SelectItem key={religion} value={religion}>
                        {religion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2">{maidProfile.religion || 'N/A'}</p>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Professional Information */}
      <AccordionItem value="professional" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Professional Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="maid-professional" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Profession</Label>
              {isEditing('maid-professional') ? (
                <Select
                  value={localData.primary_profession || ''}
                  onValueChange={(value) => handleFieldChange('primary_profession', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map((prof) => (
                      <SelectItem key={prof} value={prof}>
                        {prof.charAt(0).toUpperCase() + prof.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 capitalize">
                  {maidProfile.primary_profession?.replace('_', ' ') || 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              {isEditing('maid-professional') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.experience_years || 0}
                  onChange={(e) => handleFieldChange('experience_years', parseInt(e.target.value) || 0)}
                />
              ) : (
                <p className="text-sm py-2">{maidProfile.experience_years || 0} years</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Education Level</Label>
              {isEditing('maid-professional') ? (
                <Select
                  value={localData.education_level || ''}
                  onValueChange={(value) => handleFieldChange('education_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 capitalize">{maidProfile.education_level || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>About Me</Label>
              {isEditing('maid-professional') ? (
                <Textarea
                  value={localData.about_me || ''}
                  onChange={(e) => handleFieldChange('about_me', e.target.value)}
                  rows={4}
                  placeholder="Personal description..."
                />
              ) : (
                <p className="text-sm py-2 whitespace-pre-wrap">
                  {maidProfile.about_me || 'No description provided'}
                </p>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Skills & Languages */}
      <AccordionItem value="skills" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Skills & Languages</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {maidProfile.skills?.length > 0 ? (
                  maidProfile.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills listed</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Special Skills</Label>
              <div className="flex flex-wrap gap-2">
                {maidProfile.special_skills?.length > 0 ? (
                  maidProfile.special_skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No special skills listed</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-2">
                {maidProfile.languages?.length > 0 ? (
                  maidProfile.languages.map((lang, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                      {lang}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No languages listed</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Key Responsibilities</Label>
              <div className="flex flex-wrap gap-2">
                {maidProfile.key_responsibilities?.length > 0 ? (
                  maidProfile.key_responsibilities.map((resp, idx) => (
                    <Badge key={idx} variant="secondary">
                      {resp}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No responsibilities listed</p>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Salary & Preferences */}
      <AccordionItem value="preferences" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Salary & Preferences</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="maid-preferences" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Minimum Salary</Label>
              {isEditing('maid-preferences') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.preferred_salary_min || ''}
                  onChange={(e) => handleFieldChange('preferred_salary_min', parseInt(e.target.value) || 0)}
                />
              ) : (
                <p className="text-sm py-2">
                  {maidProfile.preferred_salary_min
                    ? `${maidProfile.preferred_currency || 'USD'} ${maidProfile.preferred_salary_min}`
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Maximum Salary</Label>
              {isEditing('maid-preferences') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.preferred_salary_max || ''}
                  onChange={(e) => handleFieldChange('preferred_salary_max', parseInt(e.target.value) || 0)}
                />
              ) : (
                <p className="text-sm py-2">
                  {maidProfile.preferred_salary_max
                    ? `${maidProfile.preferred_currency || 'USD'} ${maidProfile.preferred_salary_max}`
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              {isEditing('maid-preferences') ? (
                <Select
                  value={localData.preferred_currency || 'USD'}
                  onValueChange={(value) => handleFieldChange('preferred_currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="KWD">KWD</SelectItem>
                    <SelectItem value="QAR">QAR</SelectItem>
                    <SelectItem value="ETB">ETB</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2">{maidProfile.preferred_currency || 'USD'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Availability Status</Label>
              {isEditing('maid-preferences') ? (
                <Select
                  value={localData.availability_status || ''}
                  onValueChange={(value) => handleFieldChange('availability_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  className={
                    maidProfile.availability_status === 'available'
                      ? 'bg-green-500'
                      : maidProfile.availability_status === 'employed'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }
                >
                  {maidProfile.availability_status || 'N/A'}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <Label>Live-in Preference</Label>
              {isEditing('maid-preferences') ? (
                <Select
                  value={localData.live_in_preference || ''}
                  onValueChange={(value) => handleFieldChange('live_in_preference', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live_in">Live-in</SelectItem>
                    <SelectItem value="live_out">Live-out</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 capitalize">
                  {maidProfile.live_in_preference?.replace('_', ' ') || 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Available From</Label>
              <p className="text-sm py-2">
                {maidProfile.available_from
                  ? new Date(maidProfile.available_from).toLocaleDateString()
                  : 'Immediately'}
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Documents */}
      <AccordionItem value="documents" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Documents & Verification</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="maid-documents" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Passport Expiry</Label>
              {isEditing('maid-documents') ? (
                <Input
                  type="date"
                  value={localData.passport_expiry?.split('T')[0] || ''}
                  onChange={(e) => handleFieldChange('passport_expiry', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">
                  {maidProfile.passport_expiry
                    ? new Date(maidProfile.passport_expiry).toLocaleDateString()
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Visa Status</Label>
              {isEditing('maid-documents') ? (
                <Select
                  value={localData.current_visa_status || ''}
                  onValueChange={(value) => handleFieldChange('current_visa_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  className={
                    maidProfile.current_visa_status === 'valid'
                      ? 'bg-green-500'
                      : maidProfile.current_visa_status === 'expired'
                      ? 'bg-red-500'
                      : 'bg-gray-500'
                  }
                >
                  {maidProfile.current_visa_status || 'N/A'}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <Label>Medical Certificate</Label>
              <Badge
                className={maidProfile.medical_certificate_valid ? 'bg-green-500' : 'bg-gray-400'}
              >
                {maidProfile.medical_certificate_valid ? 'Valid' : 'Not Valid'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Police Clearance</Label>
              <Badge
                className={maidProfile.police_clearance_valid ? 'bg-green-500' : 'bg-gray-400'}
              >
                {maidProfile.police_clearance_valid ? 'Valid' : 'Not Valid'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Phone Verified</Label>
              <Badge
                className={maidProfile.phone_verified ? 'bg-green-500' : 'bg-gray-400'}
              >
                {maidProfile.phone_verified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Two-Factor Auth</Label>
              <Badge
                className={maidProfile.two_factor_enabled ? 'bg-green-500' : 'bg-gray-400'}
              >
                {maidProfile.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Media */}
      <AccordionItem value="media" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Media & Photos</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Photo */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              {maidProfile.profile_photo_url ? (
                <img
                  src={maidProfile.profile_photo_url}
                  alt="Profile"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  No photo
                </div>
              )}
            </div>
            {/* Full Body Photo */}
            <div className="space-y-2">
              <Label>Full Body Photo</Label>
              {maidProfile.full_body_photo_url ? (
                <img
                  src={maidProfile.full_body_photo_url}
                  alt="Full body"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  No photo
                </div>
              )}
            </div>
            {/* Video */}
            <div className="space-y-2">
              <Label>Introduction Video</Label>
              {maidProfile.introduction_video_url ? (
                <video
                  src={maidProfile.introduction_video_url}
                  controls
                  className="w-full h-48 rounded-lg border"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  No video
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Metrics */}
      <AccordionItem value="metrics" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Profile Metrics</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">
                {maidProfile.profile_views || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Profile Views</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {maidProfile.successful_placements || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Successful Placements</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">
                {maidProfile.total_applications || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Applications</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {maidProfile.average_rating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average Rating</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {maidProfile.profile_completion_percentage || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Profile Completion</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={
                  maidProfile.verification_status === 'verified'
                    ? 'bg-green-500'
                    : maidProfile.verification_status === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
                }
              >
                {maidProfile.verification_status || 'unverified'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Verification Status</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge className={maidProfile.is_approved ? 'bg-green-500' : 'bg-gray-400'}>
                {maidProfile.is_approved ? 'Approved' : 'Not Approved'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Approval Status</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={
                  maidProfile.is_agency_managed ? 'bg-indigo-500' : 'bg-gray-400'
                }
              >
                {maidProfile.is_agency_managed ? 'Agency' : 'Independent'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Management Type</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default MaidProfileTab;
