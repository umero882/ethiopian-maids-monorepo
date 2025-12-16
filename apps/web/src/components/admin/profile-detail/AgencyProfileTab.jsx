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
  Building,
  FileCheck,
  User,
  Phone,
  Globe,
  CreditCard,
  BarChart3,
} from 'lucide-react';

const SUBSCRIPTION_TIERS = ['free', 'basic', 'premium', 'enterprise'];
const VERIFICATION_STATUS_OPTIONS = ['pending', 'verified', 'rejected', 'unverified'];

const AgencyProfileTab = ({
  agencyProfile,
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
    if (agencyProfile) {
      setLocalData({ ...agencyProfile });
    }
  }, [agencyProfile]);

  if (!agencyProfile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No agency profile data available
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
    setLocalData({ ...agencyProfile });
    onCancelEditing();
  };

  const getSectionData = (section) => {
    switch (section) {
      case 'agency-business':
        return {
          full_name: localData.full_name,
          agency_description: localData.agency_description,
          established_year: localData.established_year,
          website_url: localData.website_url,
          specialization: localData.specialization,
        };
      case 'agency-license':
        return {
          license_number: localData.license_number,
          license_verified: localData.license_verified,
          license_expiry_date: localData.license_expiry_date,
        };
      case 'agency-contact':
        return {
          business_email: localData.business_email,
          business_phone: localData.business_phone,
          business_address: localData.business_address,
          city: localData.city,
          country: localData.country,
        };
      case 'agency-authorized':
        return {
          authorized_person_name: localData.authorized_person_name,
          authorized_person_email: localData.authorized_person_email,
          authorized_person_phone: localData.authorized_person_phone,
          authorized_person_position: localData.authorized_person_position,
        };
      case 'agency-services':
        return {
          placement_fee_percentage: localData.placement_fee_percentage,
          guarantee_period_months: localData.guarantee_period_months,
          support_hours_start: localData.support_hours_start,
          support_hours_end: localData.support_hours_end,
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
    <Accordion type="multiple" defaultValue={['business', 'license']} className="space-y-4">
      {/* Business Information */}
      <AccordionItem value="business" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Business Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="agency-business" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agency Name</Label>
              {isEditing('agency-business') ? (
                <Input
                  value={localData.full_name || ''}
                  onChange={(e) => handleFieldChange('full_name', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.full_name || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Established Year</Label>
              {isEditing('agency-business') ? (
                <Input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={localData.established_year || ''}
                  onChange={(e) => handleFieldChange('established_year', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.established_year || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              {isEditing('agency-business') ? (
                <Input
                  value={localData.website_url || ''}
                  onChange={(e) => handleFieldChange('website_url', e.target.value)}
                  placeholder="https://..."
                />
              ) : (
                <p className="text-sm py-2">
                  {agencyProfile.website_url ? (
                    <a
                      href={agencyProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {agencyProfile.website_url}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              {isEditing('agency-business') ? (
                <Input
                  value={localData.specialization || ''}
                  onChange={(e) => handleFieldChange('specialization', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.specialization || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              {isEditing('agency-business') ? (
                <Textarea
                  value={localData.agency_description || ''}
                  onChange={(e) => handleFieldChange('agency_description', e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="text-sm py-2 whitespace-pre-wrap">
                  {agencyProfile.agency_description || 'No description provided'}
                </p>
              )}
            </div>
          </div>
          {/* Logo */}
          <div className="mt-4">
            <Label>Agency Logo</Label>
            {agencyProfile.logo_url ? (
              <img
                src={agencyProfile.logo_url}
                alt="Agency Logo"
                className="w-32 h-32 object-contain border rounded-lg mt-2"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mt-2">
                No logo
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* License & Verification */}
      <AccordionItem value="license" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">License & Verification</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="agency-license" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>License Number</Label>
              {isEditing('agency-license') ? (
                <Input
                  value={localData.license_number || ''}
                  onChange={(e) => handleFieldChange('license_number', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.license_number || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>License Verified</Label>
              <Badge
                className={agencyProfile.license_verified ? 'bg-green-500' : 'bg-gray-400'}
              >
                {agencyProfile.license_verified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>License Expiry</Label>
              {isEditing('agency-license') ? (
                <Input
                  type="date"
                  value={localData.license_expiry_date?.split('T')[0] || ''}
                  onChange={(e) => handleFieldChange('license_expiry_date', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">
                  {agencyProfile.license_expiry_date
                    ? new Date(agencyProfile.license_expiry_date).toLocaleDateString()
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Verification Status</Label>
              <Badge
                className={
                  agencyProfile.verification_status === 'verified'
                    ? 'bg-green-500'
                    : agencyProfile.verification_status === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
                }
              >
                {agencyProfile.verification_status || 'unverified'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Trade License Status</Label>
              <Badge
                className={
                  agencyProfile.trade_license_verification_status === 'verified'
                    ? 'bg-green-500'
                    : agencyProfile.trade_license_verification_status === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
                }
              >
                {agencyProfile.trade_license_verification_status || 'not submitted'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Official Email Verified</Label>
              <Badge
                className={agencyProfile.official_email_verified ? 'bg-green-500' : 'bg-gray-400'}
              >
                {agencyProfile.official_email_verified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Contact Information */}
      <AccordionItem value="contact" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Contact Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="agency-contact" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Email</Label>
              {isEditing('agency-contact') ? (
                <Input
                  type="email"
                  value={localData.business_email || ''}
                  onChange={(e) => handleFieldChange('business_email', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.business_email || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Business Phone</Label>
              {isEditing('agency-contact') ? (
                <Input
                  value={localData.business_phone || ''}
                  onChange={(e) => handleFieldChange('business_phone', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.business_phone || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Business Address</Label>
              {isEditing('agency-contact') ? (
                <Textarea
                  value={localData.business_address || ''}
                  onChange={(e) => handleFieldChange('business_address', e.target.value)}
                  rows={2}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.business_address || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              {isEditing('agency-contact') ? (
                <Input
                  value={localData.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.city || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              {isEditing('agency-contact') ? (
                <Input
                  value={localData.country || ''}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.country || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact</Label>
              <p className="text-sm py-2">{agencyProfile.emergency_contact_phone || 'N/A'}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Authorized Person */}
      <AccordionItem value="authorized" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Authorized Person</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="agency-authorized" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              {isEditing('agency-authorized') ? (
                <Input
                  value={localData.authorized_person_name || ''}
                  onChange={(e) => handleFieldChange('authorized_person_name', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.authorized_person_name || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              {isEditing('agency-authorized') ? (
                <Input
                  value={localData.authorized_person_position || ''}
                  onChange={(e) => handleFieldChange('authorized_person_position', e.target.value)}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.authorized_person_position || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {isEditing('agency-authorized') ? (
                <Input
                  type="email"
                  value={localData.authorized_person_email || ''}
                  onChange={(e) => handleFieldChange('authorized_person_email', e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm py-2">{agencyProfile.authorized_person_email || 'N/A'}</p>
                  {agencyProfile.authorized_person_email_verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Verified
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              {isEditing('agency-authorized') ? (
                <Input
                  value={localData.authorized_person_phone || ''}
                  onChange={(e) => handleFieldChange('authorized_person_phone', e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm py-2">{agencyProfile.authorized_person_phone || 'N/A'}</p>
                  {agencyProfile.authorized_person_phone_verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Verified
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <p className="text-sm py-2">{agencyProfile.authorized_person_id_number || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label>ID Verification Status</Label>
              <Badge
                className={
                  agencyProfile.authorized_person_id_verification_status === 'verified'
                    ? 'bg-green-500'
                    : 'bg-gray-400'
                }
              >
                {agencyProfile.authorized_person_id_verification_status || 'not submitted'}
              </Badge>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Service Information */}
      <AccordionItem value="services" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Service Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-4">
            <EditButtons section="agency-services" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Placement Fee (%)</Label>
              {isEditing('agency-services') ? (
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={localData.placement_fee_percentage || ''}
                  onChange={(e) => handleFieldChange('placement_fee_percentage', parseFloat(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.placement_fee_percentage || 0}%</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Guarantee Period (months)</Label>
              {isEditing('agency-services') ? (
                <Input
                  type="number"
                  min="0"
                  value={localData.guarantee_period_months || ''}
                  onChange={(e) => handleFieldChange('guarantee_period_months', parseInt(e.target.value))}
                />
              ) : (
                <p className="text-sm py-2">{agencyProfile.guarantee_period_months || 0} months</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Support Hours</Label>
              {isEditing('agency-services') ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={localData.support_hours_start || ''}
                    onChange={(e) => handleFieldChange('support_hours_start', e.target.value)}
                    className="w-full"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    value={localData.support_hours_end || ''}
                    onChange={(e) => handleFieldChange('support_hours_end', e.target.value)}
                    className="w-full"
                  />
                </div>
              ) : (
                <p className="text-sm py-2">
                  {agencyProfile.support_hours_start && agencyProfile.support_hours_end
                    ? `${agencyProfile.support_hours_start} - ${agencyProfile.support_hours_end}`
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Service Countries</Label>
              <div className="flex flex-wrap gap-2">
                {agencyProfile.service_countries?.length > 0 ? (
                  agencyProfile.service_countries.map((country, idx) => (
                    <Badge key={idx} variant="secondary">
                      {country}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No countries listed</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Certifications</Label>
              <div className="flex flex-wrap gap-2">
                {agencyProfile.certifications?.length > 0 ? (
                  agencyProfile.certifications.map((cert, idx) => (
                    <Badge key={idx} variant="outline">
                      {cert}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No certifications</p>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Subscription */}
      <AccordionItem value="subscription" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Subscription</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Badge
                className={
                  agencyProfile.subscription_tier === 'enterprise'
                    ? 'bg-purple-500'
                    : agencyProfile.subscription_tier === 'premium'
                    ? 'bg-yellow-500'
                    : agencyProfile.subscription_tier === 'basic'
                    ? 'bg-blue-500'
                    : 'bg-gray-500'
                }
              >
                {agencyProfile.subscription_tier || 'free'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Expires At</Label>
              <p className="text-sm py-2">
                {agencyProfile.subscription_expires_at
                  ? new Date(agencyProfile.subscription_expires_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Metrics */}
      <AccordionItem value="metrics" className="bg-white rounded-lg border">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <span className="font-semibold">Agency Metrics</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">
                {agencyProfile.total_maids_managed || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Maids Managed</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {agencyProfile.active_maids || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active Maids</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">
                {agencyProfile.successful_placements || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Successful Placements</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {agencyProfile.average_rating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average Rating</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {agencyProfile.active_listings || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active Listings</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Badge className={agencyProfile.verified ? 'bg-green-500' : 'bg-gray-400'}>
                {agencyProfile.verified ? 'Verified' : 'Not Verified'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">Account Status</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AgencyProfileTab;
