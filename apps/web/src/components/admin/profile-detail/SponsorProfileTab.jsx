import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Home,
  Users,
  Heart,
  DollarSign,
  Clock,
  Shield,
  BarChart3,
} from 'lucide-react';

const ACCOMMODATION_TYPES = ['apartment', 'villa', 'house', 'studio', 'townhouse', 'other'];
const RELIGIONS = ['Christian', 'Muslim', 'Orthodox', 'Protestant', 'Catholic', 'Other', 'No Preference'];

const SponsorProfileTab = ({
  sponsorProfile,
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
    if (sponsorProfile) {
      setLocalData({ ...sponsorProfile });
    }
  }, [sponsorProfile]);

  if (!sponsorProfile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No sponsor profile data available
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

  const handleCancel = () => {
    setLocalData({ ...sponsorProfile });
    onCancelEditing();
  };

  const getSectionData = (section) => {
    switch (section) {
      case 'sponsor-household':
        return {
          household_size: localData.household_size,
          number_of_children: localData.number_of_children,
          children_ages: localData.children_ages,
          elderly_care_needed: localData.elderly_care_needed,
          pets: localData.pets,
          pet_types: localData.pet_types,
        };
      case 'sponsor-location':
        return {
          country: localData.country,
          city: localData.city,
          address: localData.address,
          accommodation_type: localData.accommodation_type,
        };
      case 'sponsor-preferences':
        return {
          preferred_nationality: localData.preferred_nationality,
          preferred_experience_years: localData.preferred_experience_years,
          preferred_languages: localData.preferred_languages,
          required_skills: localData.required_skills,
          live_in_required: localData.live_in_required,
          religion: localData.religion,
        };
      case 'sponsor-budget':
        return {
          salary_budget_min: localData.salary_budget_min,
          salary_budget_max: localData.salary_budget_max,
          currency: localData.currency,
          additional_benefits: localData.additional_benefits,
        };
      case 'sponsor-work':
        return {
          working_hours_per_day: localData.working_hours_per_day,
          days_off_per_week: localData.days_off_per_week,
          overtime_available: localData.overtime_available,
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
    <Accordion type="multiple" defaultValue={['household', 'location']} className="space-y-4">
      {/* Household Information */}
      <AccordionItem value="household" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Household Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="sponsor-household" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Household Size</Label>
              {isEditing('sponsor-household') ? (
                <Input
                  type="number"
                  min="1"
                  value={localData.household_size || ''}
                  onChange={(e) => handleFieldChange('household_size', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">{sponsorProfile.household_size || 'N/A'} members</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Number of Children</Label>
              {isEditing('sponsor-household') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.number_of_children || ''}
                  onChange={(e) => handleFieldChange('number_of_children', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">{sponsorProfile.number_of_children || 0}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Children Ages</Label>
              {isEditing('sponsor-household') ? (
                <Input
                  value={localData.children_ages?.join(', ') || ''}
                  onChange={(e) => handleFieldChange('children_ages', e.target.value.split(',').map(a => a.trim()))}
                  placeholder="e.g., 3, 5, 8"
                />
              ) : (
                <p className="text-sm py-2">
                  {sponsorProfile.children_ages?.length > 0
                    ? sponsorProfile.children_ages.join(', ') + ' years'
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Elderly Care Needed</Label>
              {isEditing('sponsor-household') ? (
                <Select
                  value={localData.elderly_care_needed ? 'yes' : 'no'}
                  onValueChange={(value) => handleFieldChange('elderly_care_needed', value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  className={sponsorProfile.elderly_care_needed ? 'bg-blue-500' : 'bg-gray-400'}
                >
                  {sponsorProfile.elderly_care_needed ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <Label>Has Pets</Label>
              {isEditing('sponsor-household') ? (
                <Select
                  value={localData.pets ? 'yes' : 'no'}
                  onValueChange={(value) => handleFieldChange('pets', value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={sponsorProfile.pets ? 'bg-blue-500' : 'bg-gray-400'}>
                  {sponsorProfile.pets ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
            {sponsorProfile.pets && (
              <div className="space-y-2">
                <Label>Pet Types</Label>
                <div className="flex flex-wrap gap-2">
                  {sponsorProfile.pet_types?.length > 0 ? (
                    sponsorProfile.pet_types.map((pet, idx) => (
                      <Badge key={idx} variant="secondary">
                        {pet}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Not specified</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Location */}
      <AccordionItem value="location" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Location</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="sponsor-location" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              {isEditing('sponsor-location') ? (
                <Input
                  value={localData.country || ''}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{sponsorProfile.country || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              {isEditing('sponsor-location') ? (
                <Input
                  value={localData.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{sponsorProfile.city || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              {isEditing('sponsor-location') ? (
                <Input
                  value={localData.address || ''}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{sponsorProfile.address || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Accommodation Type</Label>
              {isEditing('sponsor-location') ? (
                <Select
                  value={localData.accommodation_type || ''}
                  onValueChange={(value) => handleFieldChange('accommodation_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOMMODATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 capitalize">
                  {sponsorProfile.accommodation_type || 'N/A'}
                </p>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Preferences */}
      <AccordionItem value="preferences" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Preferences</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="sponsor-preferences" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preferred Nationality</Label>
              {isEditing('sponsor-preferences') ? (
                <Input
                  value={localData.preferred_nationality || ''}
                  onChange={(e) => handleFieldChange('preferred_nationality', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">
                  {sponsorProfile.preferred_nationality || 'No preference'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preferred Experience (years)</Label>
              {isEditing('sponsor-preferences') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.preferred_experience_years || ''}
                  onChange={(e) => handleFieldChange('preferred_experience_years', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">
                  {sponsorProfile.preferred_experience_years || 0}+ years
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Live-in Required</Label>
              {isEditing('sponsor-preferences') ? (
                <Select
                  value={localData.live_in_required ? 'yes' : 'no'}
                  onValueChange={(value) => handleFieldChange('live_in_required', value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  className={sponsorProfile.live_in_required ? 'bg-blue-500' : 'bg-gray-400'}
                >
                  {sponsorProfile.live_in_required ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <Label>Religion Preference</Label>
              {isEditing('sponsor-preferences') ? (
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
                <p className="text-sm py-2">{sponsorProfile.religion || 'No preference'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preferred Languages</Label>
              <div className="flex flex-wrap gap-2">
                {sponsorProfile.preferred_languages?.length > 0 ? (
                  sponsorProfile.preferred_languages.map((lang, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                      {lang}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No preference</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex flex-wrap gap-2">
                {sponsorProfile.required_skills?.length > 0 ? (
                  sponsorProfile.required_skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No specific requirements</p>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Budget */}
      <AccordionItem value="budget" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Budget & Benefits</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="sponsor-budget" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Minimum Budget</Label>
              {isEditing('sponsor-budget') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.salary_budget_min || ''}
                  onChange={(e) => handleFieldChange('salary_budget_min', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">
                  {sponsorProfile.salary_budget_min
                    ? `${sponsorProfile.currency || 'USD'} ${sponsorProfile.salary_budget_min}`
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Maximum Budget</Label>
              {isEditing('sponsor-budget') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.salary_budget_max || ''}
                  onChange={(e) => handleFieldChange('salary_budget_max', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">
                  {sponsorProfile.salary_budget_max
                    ? `${sponsorProfile.currency || 'USD'} ${sponsorProfile.salary_budget_max}`
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              {isEditing('sponsor-budget') ? (
                <Select
                  value={localData.currency || 'USD'}
                  onValueChange={(value) => handleFieldChange('currency', value)}
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
                <p className="text-sm py-2">{sponsorProfile.currency || 'USD'}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Additional Benefits</Label>
              <div className="flex flex-wrap gap-2">
                {sponsorProfile.additional_benefits?.length > 0 ? (
                  sponsorProfile.additional_benefits.map((benefit, idx) => (
                    <Badge key={idx} variant="outline" className="text-green-600 border-green-600">
                      {benefit}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No additional benefits specified</p>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Work Details */}
      <AccordionItem value="work" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Work Details</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="sponsor-work" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Working Hours/Day</Label>
              {isEditing('sponsor-work') ? (
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={localData.working_hours_per_day || ''}
                  onChange={(e) => handleFieldChange('working_hours_per_day', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">
                  {sponsorProfile.working_hours_per_day || 'N/A'} hours
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Days Off/Week</Label>
              {isEditing('sponsor-work') ? (
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={localData.days_off_per_week || ''}
                  onChange={(e) => handleFieldChange('days_off_per_week', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">
                  {sponsorProfile.days_off_per_week || 0} days
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Overtime Available</Label>
              {isEditing('sponsor-work') ? (
                <Select
                  value={localData.overtime_available ? 'yes' : 'no'}
                  onValueChange={(value) => handleFieldChange('overtime_available', value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  className={sponsorProfile.overtime_available ? 'bg-green-500' : 'bg-gray-400'}
                >
                  {sponsorProfile.overtime_available ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Verification Status */}
      <AccordionItem value="verification" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Verification Status</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={sponsorProfile.identity_verified ? 'bg-green-500' : 'bg-gray-400'}
              >
                {sponsorProfile.identity_verified ? 'Verified' : 'Not Verified'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Identity Verified</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={sponsorProfile.background_check_completed ? 'bg-green-500' : 'bg-gray-400'}
              >
                {sponsorProfile.background_check_completed ? 'Completed' : 'Pending'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Background Check</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={sponsorProfile.phone_verified ? 'bg-green-500' : 'bg-gray-400'}
              >
                {sponsorProfile.phone_verified ? 'Verified' : 'Not Verified'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Phone Verified</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={sponsorProfile.profile_completed ? 'bg-green-500' : 'bg-yellow-500'}
              >
                {sponsorProfile.profile_completed ? 'Complete' : 'Incomplete'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Profile Status</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={sponsorProfile.onboarding_completed ? 'bg-green-500' : 'bg-yellow-500'}
              >
                {sponsorProfile.onboarding_completed ? 'Complete' : 'Incomplete'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Onboarding</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge
                className={sponsorProfile.two_factor_enabled ? 'bg-green-500' : 'bg-gray-400'}
              >
                {sponsorProfile.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Two-Factor Auth</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Metrics */}
      <AccordionItem value="metrics" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Sponsor Metrics</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">
                {sponsorProfile.active_job_postings || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active Job Postings</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {sponsorProfile.total_hires || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Hires</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {sponsorProfile.average_rating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average Rating</p>
            </div>
          </div>
          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Profile Completed At</Label>
              <p className="text-sm">
                {sponsorProfile.profile_completed_at
                  ? new Date(sponsorProfile.profile_completed_at).toLocaleString()
                  : 'Not completed'}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Onboarding Completed At</Label>
              <p className="text-sm">
                {sponsorProfile.onboarding_completed_at
                  ? new Date(sponsorProfile.onboarding_completed_at).toLocaleString()
                  : 'Not completed'}
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SponsorProfileTab;
