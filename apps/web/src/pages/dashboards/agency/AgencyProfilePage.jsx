/**
 * Agency Profile Page - 9-Step Wizard
 *
 * Full feature parity with mobile app implementation.
 * Includes: Progress bar, step navigation, document upload with scan simulation,
 * terms acceptance, and admin approval workflow for edits.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import MultiSelect from '@/components/ui/multi-select';
import FileUpload from '@/components/ui/FileUpload';
import ProgressWizard from '@/components/ui/ProgressWizard';
import TermsModal from '@/components/ui/TermsModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Building2,
  ShieldCheck,
  User,
  MapPin,
  Briefcase,
  Globe,
  FileText,
  FileCheck,
  CheckCircle2,
  Save,
  Edit,
  Eye,
  Clock,
  Mail,
  Phone,
  Award,
  Users,
  Star,
  ArrowLeft,
  ArrowRight,
  X,
  AlertCircle,
  Loader2,
  Camera,
  Scan,
} from 'lucide-react';

import {
  COUNTRY_DATA,
  getCitiesForCountry,
  getCountryOptions,
  WORKER_TYPES,
  SERVICE_CATEGORIES,
  ALL_SPECIALIZATIONS,
  STEPS,
  STEP_VALIDATION,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  VERIFICATION_STATUS_CONFIG,
  getVerificationStatusConfig,
  isProfileComplete,
} from '@/constants/agencyData';

// Map step icon names to Lucide components
const STEP_ICONS = {
  Building2,
  ShieldCheck,
  User,
  MapPin,
  Briefcase,
  Globe,
  FileText,
  FileCheck,
  CheckCircle2,
};

const AgencyProfilePage = () => {
  const { user, refreshUserProfile } = useAuth();

  // ============================================
  // State Management
  // ============================================

  // Core state
  const [profileData, setProfileData] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isNewRegistration, setIsNewRegistration] = useState(true);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit mode with admin approval
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [editRequestModal, setEditRequestModal] = useState(false);
  const [editRequestReason, setEditRequestReason] = useState('');

  // Document upload
  const [documentUploadModal, setDocumentUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [uploadState, setUploadState] = useState({ isUploading: false, progress: 0, isScanning: false });

  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // UI state
  const [logoError, setLogoError] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ============================================
  // Load Profile Data
  // ============================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user) {
          const profileFields = {
            // Basic Info
            full_name: user.agencyName || user.full_name || '',
            license_number: user.tradeLicenseNumber || user.license_number || '',
            license_expiry_date: user.licenseExpiryDate || user.license_expiry_date || '',
            established_year: user.established_year || user.year_established || '',
            agency_description: user.aboutAgency || user.agency_description || user.description || '',

            // Identity Verification
            authorized_person_id_number: user.authorizedPersonIdNumber || user.authorized_person_id_number || '',
            authorized_person_id_document: user.authorizedPersonIdDocument || user.authorized_person_id_document || null,

            // Contact Info
            authorized_person_name: user.authorizedPersonName || user.authorized_person_name || '',
            authorized_person_position: user.authorizedPersonPosition || user.authorized_person_position || '',
            business_email: user.officialEmail || user.business_email || user.contactEmail || user.email || '',
            business_phone: user.contactPhone || user.business_phone || '',
            authorized_person_phone: user.authorizedPersonPhone || user.authorized_person_phone || '',
            authorized_person_email: user.authorizedPersonEmail || user.authorized_person_email || '',

            // Location
            country: user.countryOfRegistration || user.country || '',
            city: user.city || '',
            address: user.headOfficeAddress || user.address || '',
            service_countries: user.service_countries || [],

            // Specializations
            specialization: user.servicesOffered || user.specialization || [],

            // Online Presence
            website: user.website || '',

            // License Document
            trade_license_document: user.tradeLicenseDocument || user.trade_license_document || null,

            // Verification Status
            authorized_person_id_verification_status: user.authorizedPersonIdVerificationStatus || 'pending',
            trade_license_verification_status: user.tradeLicenseVerificationStatus || 'pending',
            verification_status: user.verificationStatus || user.verification_status || 'pending',

            // Profile completion
            profile_completion: user.profile_completion || 0,

            // Logo
            logo: user.logo || '',
          };

          setProfileData(profileFields);
          setEditedData(profileFields);

          // Check if profile is complete
          const complete = isProfileComplete(profileFields);
          setIsNewRegistration(!complete);

          // If complete, start in view mode
          if (complete) {
            setCurrentStep(9); // Account Status step
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error loading profile',
          description: 'An error occurred while loading your profile.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // ============================================
  // Field Change Handlers
  // ============================================

  const handleFieldChange = useCallback((field, value) => {
    if (isEditMode && !isNewRegistration) {
      // Track changes for admin approval
      trackChange(field, value);
    } else {
      setEditedData(prev => ({ ...prev, [field]: value }));
    }
  }, [isEditMode, isNewRegistration]);

  const trackChange = useCallback((field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    setPendingChanges(prev => ({
      ...prev,
      [field]: {
        oldValue: profileData?.[field],
        newValue: value,
      },
    }));
  }, [profileData]);

  // ============================================
  // Validation
  // ============================================

  const validateStep = useCallback((step) => {
    const validation = STEP_VALIDATION[step];
    if (!validation || !validation.required) return true;

    // Skip terms validation in edit mode (already accepted during registration)
    if (step === 8 && isEditMode && !isNewRegistration) {
      return true;
    }

    const errors = {};
    let isValid = true;

    validation.required.forEach(field => {
      const value = editedData[field];
      if (field === 'termsAccepted' && !termsAccepted) {
        errors[field] = validation.messages[field];
        isValid = false;
      } else if (field === 'privacyAccepted' && !privacyAccepted) {
        errors[field] = validation.messages[field];
        isValid = false;
      } else if (field === 'specialization') {
        if (!value || value.length === 0) {
          errors[field] = validation.messages[field];
          isValid = false;
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = validation.messages[field];
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  }, [editedData, termsAccepted, privacyAccepted, isEditMode, isNewRegistration]);

  // ============================================
  // Navigation
  // ============================================

  const handleNextStep = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    // Auto-save on step change
    if (isNewRegistration || isEditMode) {
      await handleSaveProgress();
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    if (currentStep < 9) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    const targetStep = stepIndex + 1;
    // Allow clicking on completed steps or current step - 1
    if (completedSteps.includes(targetStep) || targetStep <= currentStep) {
      setCurrentStep(targetStep);
    }
  };

  // ============================================
  // Save Functions
  // ============================================

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      // Only send snake_case fields that match the database schema
      const profileUpdate = {
        // Basic Info
        full_name: editedData.full_name,
        license_number: editedData.license_number,
        license_expiry_date: editedData.license_expiry_date,
        established_year: editedData.established_year ? parseInt(editedData.established_year, 10) : null,
        agency_description: editedData.agency_description,

        // Identity Verification
        authorized_person_id_number: editedData.authorized_person_id_number,
        authorized_person_id_document: editedData.authorized_person_id_document,

        // Contact Info
        authorized_person_name: editedData.authorized_person_name,
        authorized_person_position: editedData.authorized_person_position,
        authorized_person_phone: editedData.authorized_person_phone,
        authorized_person_email: editedData.authorized_person_email,
        phone: editedData.business_phone,
        email: editedData.business_email,

        // Location
        country: editedData.country,
        city: editedData.city,
        address: editedData.address,
        service_countries: editedData.service_countries,

        // Specializations
        specialization: editedData.specialization,

        // Online Presence
        website: editedData.website,

        // License Document
        trade_license_document: editedData.trade_license_document,
      };

      // Remove undefined/null values
      Object.keys(profileUpdate).forEach(key => {
        if (profileUpdate[key] === undefined || profileUpdate[key] === null) {
          delete profileUpdate[key];
        }
      });

      const { error } = await agencyService.updateAgencyProfile(profileUpdate);

      if (error) {
        toast({
          title: 'Error saving progress',
          description: error.message || 'Failed to save your progress.',
          variant: 'destructive',
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: 'Error saving progress',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!validateStep(8)) {
      toast({
        title: 'Terms Required',
        description: 'Please accept the Terms of Service and Privacy Policy.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const success = await handleSaveProgress();
      if (success) {
        toast({
          title: 'Profile Completed',
          description: 'Your agency profile has been submitted for verification.',
        });
        setIsNewRegistration(false);
        setCurrentStep(9);
        await refreshUserProfile();
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Edit Mode Functions
  // ============================================

  const enterEditMode = () => {
    setIsEditMode(true);
    setPendingChanges({});
    setCurrentStep(1); // Go to first step to start editing
    setCompletedSteps([]); // Reset completed steps for edit mode
  };

  const cancelEditMode = () => {
    setIsEditMode(false);
    setPendingChanges({});
    setEditedData(profileData);
    setCurrentStep(9); // Go back to account status view
  };

  const handleSubmitEditRequest = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast({
        title: 'No Changes',
        description: 'You have not made any changes to submit.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Submit edit request for admin approval
      const { error } = await agencyService.submitProfileEditRequest({
        agency_id: user?.id,
        requested_changes: pendingChanges,
        original_data: profileData,
        reason: editRequestReason,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit edit request.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Edit Request Submitted',
          description: 'Your changes have been submitted for admin approval.',
        });
        setEditRequestModal(false);
        setIsEditMode(false);
        setPendingChanges({});
        setEditRequestReason('');
        setCurrentStep(9); // Go back to account status view
      }
    } catch (err) {
      console.error('Submit edit request error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Document Upload Functions
  // ============================================

  const handleDocumentUpload = async (docType, file) => {
    if (!file) return;

    setUploadState({ isUploading: true, progress: 0, isScanning: false });

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadState(prev => ({ ...prev, progress: i }));
      }

      // Simulate scan effect
      setUploadState(prev => ({ ...prev, isScanning: true }));
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Convert to base64
      const base64 = await fileToBase64(file);

      // Update the appropriate field
      if (docType === 'identity') {
        handleFieldChange('authorized_person_id_document', base64);
      } else if (docType === 'license') {
        handleFieldChange('trade_license_document', base64);
      }

      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadState({ isUploading: false, progress: 0, isScanning: false });
      setDocumentUploadModal(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // ============================================
  // Step Render Functions
  // ============================================

  const renderAgencyInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Agency Information</h2>
        <p className="text-gray-500 text-sm mt-1">Basic details about your agency</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Agency Name *</Label>
          <Input
            id="full_name"
            placeholder="Enter your agency name"
            value={editedData.full_name || ''}
            onChange={(e) => handleFieldChange('full_name', e.target.value)}
            className={validationErrors.full_name ? 'border-red-500' : ''}
          />
          {validationErrors.full_name && (
            <p className="text-red-500 text-xs">{validationErrors.full_name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="license_number">License Number *</Label>
            <Input
              id="license_number"
              placeholder="Trade license number"
              value={editedData.license_number || ''}
              onChange={(e) => handleFieldChange('license_number', e.target.value)}
              className={validationErrors.license_number ? 'border-red-500' : ''}
            />
            {validationErrors.license_number && (
              <p className="text-red-500 text-xs">{validationErrors.license_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_expiry_date">License Expiry Date</Label>
            <Input
              id="license_expiry_date"
              type="date"
              value={editedData.license_expiry_date || ''}
              onChange={(e) => handleFieldChange('license_expiry_date', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="established_year">Year Established</Label>
          <Input
            id="established_year"
            type="number"
            placeholder="e.g., 2015"
            min="1900"
            max={new Date().getFullYear()}
            value={editedData.established_year || ''}
            onChange={(e) => handleFieldChange('established_year', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency_description">About Your Agency</Label>
          <Textarea
            id="agency_description"
            placeholder="Describe your agency, services, and experience..."
            rows={4}
            value={editedData.agency_description || ''}
            onChange={(e) => handleFieldChange('agency_description', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            {(editedData.agency_description || '').length}/500 characters
          </p>
        </div>
      </div>
    </div>
  );

  const renderIdentityVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Identity Verification</h2>
        <p className="text-gray-500 text-sm mt-1">Upload your passport or national ID</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Document Type</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={editedData.authorized_person_id_type === 'passport' ? 'default' : 'outline'}
              onClick={() => handleFieldChange('authorized_person_id_type', 'passport')}
              className="flex-1"
            >
              Passport
            </Button>
            <Button
              type="button"
              variant={editedData.authorized_person_id_type === 'national_id' ? 'default' : 'outline'}
              onClick={() => handleFieldChange('authorized_person_id_type', 'national_id')}
              className="flex-1"
            >
              National ID
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorized_person_id_number">
            {editedData.authorized_person_id_type === 'passport' ? 'Passport Number' : 'ID Number'}
          </Label>
          <Input
            id="authorized_person_id_number"
            placeholder={editedData.authorized_person_id_type === 'passport' ? 'Enter passport number' : 'Enter ID number'}
            value={editedData.authorized_person_id_number || ''}
            onChange={(e) => handleFieldChange('authorized_person_id_number', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Upload Document</Label>
          {editedData.authorized_person_id_document ? (
            <div className="space-y-3">
              {renderDocumentPreview(
                editedData.authorized_person_id_document,
                () => handleFieldChange('authorized_person_id_document', null),
                editedData.authorized_person_id_type === 'passport' ? 'Passport' : 'National ID'
              )}
              <VerificationStatusBadge
                status={editedData.authorized_person_id_verification_status}
              />
            </div>
          ) : (
            <FileUpload
              accept="image/*,.pdf"
              maxSize={5 * 1024 * 1024}
              onFileSelect={(file, error) => {
                if (error) {
                  toast({ title: 'Error', description: error, variant: 'destructive' });
                } else {
                  handleDocumentUpload('identity', file);
                }
              }}
              title={`Upload ${editedData.authorized_person_id_type === 'passport' ? 'Passport' : 'National ID'}`}
              description="Scan or take a clear photo of your document"
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderContactInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <User className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
        <p className="text-gray-500 text-sm mt-1">Authorized person and business contact details</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="authorized_person_name">Authorized Person Name</Label>
            <Input
              id="authorized_person_name"
              placeholder="Full name"
              value={editedData.authorized_person_name || ''}
              onChange={(e) => handleFieldChange('authorized_person_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorized_person_position">Position</Label>
            <Input
              id="authorized_person_position"
              placeholder="e.g., Managing Director"
              value={editedData.authorized_person_position || ''}
              onChange={(e) => handleFieldChange('authorized_person_position', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business_email">Business Email *</Label>
            <Input
              id="business_email"
              type="email"
              placeholder="contact@agency.com"
              value={editedData.business_email || ''}
              onChange={(e) => handleFieldChange('business_email', e.target.value)}
              className={validationErrors.business_email ? 'border-red-500' : ''}
            />
            {validationErrors.business_email && (
              <p className="text-red-500 text-xs">{validationErrors.business_email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_phone">Business Phone *</Label>
            <Input
              id="business_phone"
              placeholder="+971 50 123 4567"
              value={editedData.business_phone || ''}
              onChange={(e) => handleFieldChange('business_phone', e.target.value)}
              className={validationErrors.business_phone ? 'border-red-500' : ''}
            />
            {validationErrors.business_phone && (
              <p className="text-red-500 text-xs">{validationErrors.business_phone}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="authorized_person_phone">Personal Phone</Label>
            <Input
              id="authorized_person_phone"
              placeholder="Personal contact number"
              value={editedData.authorized_person_phone || ''}
              onChange={(e) => handleFieldChange('authorized_person_phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorized_person_email">Personal Email</Label>
            <Input
              id="authorized_person_email"
              type="email"
              placeholder="personal@email.com"
              value={editedData.authorized_person_email || ''}
              onChange={(e) => handleFieldChange('authorized_person_email', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationStep = () => {
    const countries = getCountryOptions();
    const cities = getCitiesForCountry(editedData.country);

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Location</h2>
          <p className="text-gray-500 text-sm mt-1">Business location and service areas</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <select
              id="country"
              value={editedData.country || ''}
              onChange={(e) => {
                handleFieldChange('country', e.target.value);
                handleFieldChange('city', ''); // Reset city when country changes
              }}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${validationErrors.country ? 'border-red-500' : ''}`}
            >
              <option value="">Select country</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {validationErrors.country && (
              <p className="text-red-500 text-xs">{validationErrors.country}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City/Region</Label>
            <select
              id="city"
              value={editedData.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              disabled={!editedData.country}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select city/region</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              placeholder="Enter your full business address"
              rows={2}
              value={editedData.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Service Countries</Label>
            <MultiSelect
              options={countries}
              selected={editedData.service_countries || []}
              onChange={(values) => handleFieldChange('service_countries', values)}
              placeholder="Select countries you serve"
            />
            <p className="text-xs text-gray-500">
              Select all countries where your agency provides services
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSpecializationsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Service Specializations</h2>
        <p className="text-gray-500 text-sm mt-1">Worker types and services you offer</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Worker Types</Label>
          <div className="flex flex-wrap gap-2">
            {WORKER_TYPES.map((type) => {
              const isSelected = (editedData.specialization || []).includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const current = editedData.specialization || [];
                    const updated = isSelected
                      ? current.filter(s => s !== type)
                      : [...current, type];
                    handleFieldChange('specialization', updated);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Service Categories</Label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((category) => {
              const isSelected = (editedData.specialization || []).includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    const current = editedData.specialization || [];
                    const updated = isSelected
                      ? current.filter(s => s !== category)
                      : [...current, category];
                    handleFieldChange('specialization', updated);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {validationErrors.specialization && (
          <p className="text-red-500 text-sm">{validationErrors.specialization}</p>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <strong>Selected:</strong> {(editedData.specialization || []).length} specializations
          </p>
          {(editedData.specialization || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(editedData.specialization || []).map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOnlinePresenceStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100 flex items-center justify-center">
          <Globe className="w-8 h-8 text-cyan-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Online Presence</h2>
        <p className="text-gray-500 text-sm mt-1">Website and social media (optional)</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website">Website URL</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
              <Globe className="w-4 h-4" />
            </span>
            <Input
              id="website"
              placeholder="www.youragency.com"
              value={editedData.website || ''}
              onChange={(e) => handleFieldChange('website', e.target.value)}
              className="rounded-l-none"
            />
          </div>
          <p className="text-xs text-gray-500">
            Optional: Add your website to help clients learn more about your agency
          </p>
        </div>
      </div>
    </div>
  );

  // Helper to render industry-standard document preview for base64 data
  const renderDocumentPreview = (base64Data, onRemove, label = 'Document') => {
    if (!base64Data) return null;

    const isImage = base64Data.startsWith('data:image');
    const isPDF = base64Data.startsWith('data:application/pdf');

    // Estimate file size from base64 (rough approximation)
    const base64Length = base64Data.length - (base64Data.indexOf(',') + 1);
    const estimatedSize = Math.round((base64Length * 3) / 4);
    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Get file extension from mime type
    const getFileType = () => {
      if (isImage) {
        if (base64Data.includes('image/png')) return 'PNG';
        if (base64Data.includes('image/jpeg') || base64Data.includes('image/jpg')) return 'JPG';
        if (base64Data.includes('image/webp')) return 'WEBP';
        return 'IMAGE';
      }
      if (isPDF) return 'PDF';
      return 'FILE';
    };

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Document Preview Area */}
        <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 p-4">
          {isImage ? (
            <div className="flex justify-center">
              <img
                src={base64Data}
                alt={label}
                className="max-h-52 max-w-full object-contain rounded-lg shadow-md border border-gray-200"
              />
            </div>
          ) : isPDF ? (
            <div className="flex justify-center py-6">
              <div className="relative">
                {/* PDF Document Visual */}
                <div className="w-32 h-40 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                  {/* PDF Header Bar */}
                  <div className="h-6 bg-red-500 flex items-center px-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-300"></div>
                      <div className="w-2 h-2 rounded-full bg-red-300"></div>
                      <div className="w-2 h-2 rounded-full bg-red-300"></div>
                    </div>
                  </div>
                  {/* PDF Content Lines */}
                  <div className="flex-1 p-3 space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/5"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </div>
                {/* PDF Badge */}
                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                  PDF
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-6">
              <div className="w-32 h-40 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center">
                <FileText className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Document Info Footer */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* File Type Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isPDF ? 'bg-red-100' : isImage ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {isPDF ? (
                  <FileText className="h-5 w-5 text-red-600" />
                ) : isImage ? (
                  <Eye className="h-5 w-5 text-blue-600" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-600" />
                )}
              </div>

              {/* File Details */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isPDF ? 'bg-red-100 text-red-700' : isImage ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {getFileType()}
                  </span>
                  <span className="text-xs text-gray-500">{formatFileSize(estimatedSize)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Uploaded successfully</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {isImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(base64Data, '_blank')}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                  title="View full size"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                  title="Remove document"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLicenseUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
          <FileText className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">License Upload</h2>
        <p className="text-gray-500 text-sm mt-1">Upload your trade license document</p>
      </div>

      <div className="space-y-4">
        {editedData.trade_license_document ? (
          <div className="space-y-3">
            {renderDocumentPreview(
              editedData.trade_license_document,
              () => handleFieldChange('trade_license_document', null),
              'Trade License'
            )}
            <VerificationStatusBadge
              status={editedData.trade_license_verification_status}
            />
          </div>
        ) : (
          <FileUpload
            accept="image/*,.pdf"
            maxSize={10 * 1024 * 1024}
            onFileSelect={(file, error) => {
              if (error) {
                toast({ title: 'Error', description: error, variant: 'destructive' });
              } else {
                handleDocumentUpload('license', file);
              }
            }}
            title="Upload Trade License"
            description="Upload a clear scan or photo of your trade license (PDF, JPG, PNG up to 10MB)"
          />
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Important</p>
              <p className="text-sm text-amber-700 mt-1">
                Your trade license will be verified by our team. Please ensure the document is clear and all information is readable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTermsStep = () => {
    // In edit mode, show a summary instead of re-acceptance
    if (isEditMode && !isNewRegistration) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <FileCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Terms & Conditions</h2>
            <p className="text-gray-500 text-sm mt-1">Review your changes before submitting</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Terms Already Accepted</p>
                <p className="text-sm text-green-700 mt-1">
                  You accepted the Terms of Service and Privacy Policy during your initial registration.
                </p>
              </div>
            </div>
          </div>

          {/* Changes Summary */}
          {Object.keys(pendingChanges).length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Your Changes ({Object.keys(pendingChanges).length})</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {Object.entries(pendingChanges).map(([field, change]) => (
                  <div key={field} className="text-sm py-2 border-b last:border-0">
                    <span className="font-medium capitalize">{field.replace(/_/g, ' ')}</span>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                      <div className="text-red-600">
                        <span className="text-gray-400">Before: </span>
                        {typeof change.oldValue === 'object'
                          ? JSON.stringify(change.oldValue)?.substring(0, 50)
                          : String(change.oldValue || '(empty)').substring(0, 50)
                        }
                      </div>
                      <div className="text-green-600">
                        <span className="text-gray-400">After: </span>
                        {typeof change.newValue === 'object'
                          ? JSON.stringify(change.newValue)?.substring(0, 50)
                          : String(change.newValue || '(empty)').substring(0, 50)
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">No Changes Made</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You haven't made any changes to your profile. Go back to edit fields or cancel to exit edit mode.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
          <FileCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Terms & Conditions</h2>
        <p className="text-gray-500 text-sm mt-1">Review and accept our policies</p>
      </div>

      <div className="space-y-4">
        {/* Terms of Service */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked)}
              className={validationErrors.termsAccepted ? 'border-red-500' : ''}
            />
            <div className="flex-1">
              <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                I accept the Terms of Service *
              </label>
              <p className="text-xs text-gray-500 mt-1">
                By checking this box, you agree to our terms and conditions for agency registration.
              </p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-orange-600"
                onClick={() => setTermsModalOpen(true)}
              >
                Read Terms of Service
              </Button>
            </div>
          </div>
          {validationErrors.termsAccepted && (
            <p className="text-red-500 text-xs mt-2 ml-7">{validationErrors.termsAccepted}</p>
          )}
        </div>

        {/* Privacy Policy */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked)}
              className={validationErrors.privacyAccepted ? 'border-red-500' : ''}
            />
            <div className="flex-1">
              <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                I accept the Privacy Policy *
              </label>
              <p className="text-xs text-gray-500 mt-1">
                By checking this box, you acknowledge that you have read and understood our privacy policy.
              </p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-orange-600"
                onClick={() => setPrivacyModalOpen(true)}
              >
                Read Privacy Policy
              </Button>
            </div>
          </div>
          {validationErrors.privacyAccepted && (
            <p className="text-red-500 text-xs mt-2 ml-7">{validationErrors.privacyAccepted}</p>
          )}
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="Terms of Service"
        content={TERMS_OF_SERVICE}
        type="terms"
      />

      {/* Privacy Modal */}
      <TermsModal
        open={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="Privacy Policy"
        content={PRIVACY_POLICY}
        type="privacy"
      />
    </div>
    );
  };

  const renderAccountStatusStep = () => {
    const statusConfig = getVerificationStatusConfig(editedData.verification_status);
    const idVerificationConfig = getVerificationStatusConfig(editedData.authorized_person_id_verification_status);
    const licenseVerificationConfig = getVerificationStatusConfig(editedData.trade_license_verification_status);

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
            <CheckCircle2 className={`w-8 h-8 ${statusConfig.textColor}`} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Account Status & Profile Preview</h2>
          <p className="text-gray-500 text-sm mt-1">Complete overview of your agency profile</p>
        </div>

        <div className="space-y-4">
          {/* Verification Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">{statusConfig.label}</span>
              </div>

              {editedData.verification_status === 'pending' && (
                <p className="text-sm text-gray-600 mt-3">
                  Your profile is under review. You will be notified once verification is complete.
                </p>
              )}

              {editedData.verification_status === 'verified' && (
                <p className="text-sm text-green-700 mt-3">
                  Your agency has been verified and approved! You can now access all platform features.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Section 1: Agency Information */}
          <Card>
            <CardHeader className="pb-3 bg-orange-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                Agency Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Agency Name</p>
                  <p className="font-medium text-gray-900">{editedData.full_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">License Number</p>
                  <p className="font-medium text-gray-900">{editedData.license_number || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">License Expiry</p>
                  <p className="font-medium text-gray-900">{editedData.license_expiry_date || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Year Established</p>
                  <p className="font-medium text-gray-900">{editedData.established_year || '-'}</p>
                </div>
              </div>
              {editedData.agency_description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">About Agency</p>
                  <p className="text-sm text-gray-700">{editedData.agency_description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Identity Verification */}
          <Card>
            <CardHeader className="pb-3 bg-blue-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Identity Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Document Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {editedData.authorized_person_id_type?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">ID Number</p>
                  <p className="font-medium text-gray-900">{editedData.authorized_person_id_number || '-'}</p>
                </div>
              </div>
              {editedData.authorized_person_id_document && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Uploaded Document</p>
                  <div className="flex items-center gap-3">
                    {renderDocumentPreview(
                      editedData.authorized_person_id_document,
                      null,
                      editedData.authorized_person_id_type === 'passport' ? 'Passport' : 'National ID'
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${idVerificationConfig.bgColor} ${idVerificationConfig.textColor}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {idVerificationConfig.label}
                    </span>
                  </div>
                </div>
              )}
              {!editedData.authorized_person_id_document && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 italic">No identity document uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Contact Information */}
          <Card>
            <CardHeader className="pb-3 bg-green-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Authorized Person</p>
                  <p className="font-medium text-gray-900">{editedData.authorized_person_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Position</p>
                  <p className="font-medium text-gray-900">{editedData.authorized_person_position || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Business Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{editedData.business_email || '-'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Business Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{editedData.business_phone || '-'}</p>
                  </div>
                </div>
                {editedData.authorized_person_phone && (
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Personal Phone</p>
                    <p className="font-medium text-gray-900">{editedData.authorized_person_phone}</p>
                  </div>
                )}
                {editedData.authorized_person_email && (
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Personal Email</p>
                    <p className="font-medium text-gray-900">{editedData.authorized_person_email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Location */}
          <Card>
            <CardHeader className="pb-3 bg-purple-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Location & Service Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Country</p>
                  <p className="font-medium text-gray-900">{editedData.country || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">City/Region</p>
                  <p className="font-medium text-gray-900">{editedData.city || '-'}</p>
                </div>
              </div>
              {editedData.address && (
                <div className="mt-4 space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Full Address</p>
                  <p className="font-medium text-gray-900">{editedData.address}</p>
                </div>
              )}
              {editedData.service_countries && editedData.service_countries.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Service Countries</p>
                  <div className="flex flex-wrap gap-2">
                    {editedData.service_countries.map((country, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Specializations */}
          <Card>
            <CardHeader className="pb-3 bg-amber-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-600" />
                Service Specializations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {editedData.specialization && editedData.specialization.length > 0 ? (
                <>
                  {/* Worker Types */}
                  <div className="mb-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Worker Types</p>
                    <div className="flex flex-wrap gap-2">
                      {editedData.specialization
                        .filter(s => WORKER_TYPES.includes(s))
                        .map((type, i) => (
                          <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            {type}
                          </span>
                        ))}
                      {editedData.specialization.filter(s => WORKER_TYPES.includes(s)).length === 0 && (
                        <span className="text-gray-400 text-sm italic">No worker types selected</span>
                      )}
                    </div>
                  </div>
                  {/* Service Categories */}
                  <div className="pt-4 border-t">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {editedData.specialization
                        .filter(s => SERVICE_CATEGORIES.includes(s))
                        .map((cat, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {cat}
                          </span>
                        ))}
                      {editedData.specialization.filter(s => SERVICE_CATEGORIES.includes(s)).length === 0 && (
                        <span className="text-gray-400 text-sm italic">No service categories selected</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic text-sm">No specializations selected</p>
              )}
            </CardContent>
          </Card>

          {/* Section 6: Online Presence */}
          <Card>
            <CardHeader className="pb-3 bg-cyan-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-600" />
                Online Presence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {editedData.website ? (
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Website</p>
                  <a
                    href={editedData.website.startsWith('http') ? editedData.website : `https://${editedData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    {editedData.website}
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No website added</p>
              )}
            </CardContent>
          </Card>

          {/* Section 7: Trade License Document */}
          <Card>
            <CardHeader className="pb-3 bg-indigo-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Trade License Document
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {editedData.trade_license_document ? (
                <div>
                  {renderDocumentPreview(
                    editedData.trade_license_document,
                    null,
                    'Trade License'
                  )}
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${licenseVerificationConfig.bgColor} ${licenseVerificationConfig.textColor}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {licenseVerificationConfig.label}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No trade license uploaded</p>
              )}
            </CardContent>
          </Card>

          {/* Section 8: Terms Acceptance */}
          <Card>
            <CardHeader className="pb-3 bg-emerald-50 rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-700">Terms of Service accepted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-700">Privacy Policy accepted</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Button for Completed Profiles */}
          {!isNewRegistration && !isEditMode && (
            <Button
              onClick={enterEditMode}
              className="w-full"
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Request Profile Edit
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // Verification Status Badge Component
  // ============================================

  const VerificationStatusBadge = ({ status }) => {
    const config = getVerificationStatusConfig(status);
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor} ${config.borderColor} border text-sm`}>
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">{config.label}</span>
      </div>
    );
  };

  // ============================================
  // Main Render
  // ============================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderAgencyInfoStep();
      case 2:
        return renderIdentityVerificationStep();
      case 3:
        return renderContactInfoStep();
      case 4:
        return renderLocationStep();
      case 5:
        return renderSpecializationsStep();
      case 6:
        return renderOnlinePresenceStep();
      case 7:
        return renderLicenseUploadStep();
      case 8:
        return renderTermsStep();
      case 9:
        return renderAccountStatusStep();
      default:
        return null;
    }
  };

  // Prepare steps for ProgressWizard
  const wizardSteps = STEPS.map(step => ({
    ...step,
    icon: STEP_ICONS[step.icon],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agency Profile</h1>
          <p className="text-gray-600 mt-1">
            {isNewRegistration
              ? 'Complete your agency registration'
              : isEditMode
                ? 'Edit your profile (requires admin approval)'
                : 'View your agency profile'
            }
          </p>
        </div>

        {/* Edit Mode Actions */}
        {isEditMode && !isNewRegistration && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditMode}>
              Cancel
            </Button>
            <Button
              onClick={() => setEditRequestModal(true)}
              disabled={Object.keys(pendingChanges).length === 0}
            >
              Review Changes ({Object.keys(pendingChanges).length})
            </Button>
          </div>
        )}
      </div>

      {/* Progress Wizard */}
      {(isNewRegistration || isEditMode) && currentStep < 9 && (
        <Card className="p-4">
          <ProgressWizard
            steps={wizardSteps}
            currentStep={currentStep - 1}
            completedSteps={completedSteps.map(s => s - 1)}
            onStepClick={handleStepClick}
            showProgress={true}
          />
        </Card>
      )}

      {/* Step Content */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6 md:p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {(isNewRegistration || isEditMode) && currentStep < 9 && (
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep === 8 ? (
            isEditMode && !isNewRegistration ? (
              // Edit mode: Submit changes for admin approval
              <Button
                onClick={() => setEditRequestModal(true)}
                disabled={saving || Object.keys(pendingChanges).length === 0}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Changes ({Object.keys(pendingChanges).length})
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              // New registration: Complete profile
              <Button
                onClick={handleCompleteProfile}
                disabled={saving || !termsAccepted || !privacyAccepted}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            )
          ) : (
            <Button
              onClick={handleNextStep}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Edit Request Modal */}
      <Dialog open={editRequestModal} onOpenChange={setEditRequestModal}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Fixed Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-orange-50 to-amber-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Edit className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Submit Edit Request
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-0.5">
                  Your changes will be reviewed by an administrator
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
            {/* Changes Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Changes Summary</Label>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {Object.keys(pendingChanges).length} change{Object.keys(pendingChanges).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 max-h-48 overflow-y-auto scroll-smooth">
                {Object.entries(pendingChanges).map(([field, change], index) => (
                  <div
                    key={field}
                    className="p-3 hover:bg-gray-100/50 transition-colors duration-150"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm text-gray-800 capitalize">
                          {field.replace(/_/g, ' ')}
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="text-gray-500 bg-red-50 px-2 py-0.5 rounded truncate max-w-[120px]" title={String(change.oldValue || '(empty)')}>
                            {typeof change.oldValue === 'object'
                              ? JSON.stringify(change.oldValue).slice(0, 20) + '...'
                              : String(change.oldValue || '(empty)').slice(0, 20) || '(empty)'
                            }
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-700 bg-green-50 px-2 py-0.5 rounded truncate max-w-[120px] font-medium" title={String(change.newValue || '(empty)')}>
                            {typeof change.newValue === 'object'
                              ? JSON.stringify(change.newValue).slice(0, 20) + '...'
                              : String(change.newValue || '(empty)').slice(0, 20) || '(empty)'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="editReason" className="text-sm font-medium text-gray-700">
                Reason for Changes
                <span className="text-gray-400 font-normal ml-1">(Optional)</span>
              </Label>
              <Textarea
                id="editReason"
                placeholder="Help the admin understand why you're requesting these changes..."
                rows={3}
                className="resize-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                value={editRequestReason}
                onChange={(e) => setEditRequestReason(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Providing context helps expedite the review process
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Review Timeline</p>
                <p className="text-blue-700 text-xs mt-0.5">
                  Most requests are reviewed within 24-48 hours. You'll receive a notification once approved.
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setEditRequestModal(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEditRequest}
              disabled={saving}
              className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Upload Progress Modal */}
      <Dialog open={uploadState.isUploading} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Document Upload Progress</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            {uploadState.isScanning ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                  <Scan className="w-10 h-10 text-blue-600" />
                </div>
                <p className="font-medium">Scanning document...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                </div>
                <p className="font-medium">Uploading document...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{uploadState.progress}%</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyProfilePage;
