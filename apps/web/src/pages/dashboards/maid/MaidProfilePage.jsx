/**
 * Enhanced Maid Profile Page with Polished UI/UX
 * Features: Auto-save, Progress tracking, Better validation, Modern design
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertTriangle,
  Camera,
  Edit,
  Save,
  Star,
  Briefcase,
  User,
  Globe,
  Calendar,
  MapPin,
  FileText,
  Video,
  Loader2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Upload,
  Eye,
  EyeOff,
  Clock,
  Shield,
  Zap,
  Award,
  Heart,
  TrendingUp,
  Phone,
  Mail,
  Sparkles,
  Plus,
} from 'lucide-react';

import MultiSelect from '@/components/ui/multi-select';
import { DropdownDatePicker } from '@/components/ui/date-picker';
import { differenceInYears } from 'date-fns';
import { maidService } from '@/services/maidService';
import { useAuth } from '@/contexts/AuthContext';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { uploadVideoCV, uploadDocument } from '@/lib/firebaseClient';

// GraphQL query for fetching maid profile
// Try both id and user_id since the original Supabase code used .eq('id', user.id)
const GET_MAID_PROFILE_FULL = gql`
  query GetMaidProfileFull($userId: String!) {
    maid_profiles(where: { _or: [{ id: { _eq: $userId } }, { user_id: { _eq: $userId } }] }, limit: 1) {
      id
      user_id
      full_name
      date_of_birth
      marital_status
      children_count
      nationality
      religion
      country
      state_province
      suburb
      iso_country_code
      street_address
      alternative_phone
      primary_profession
      current_visa_status
      visa_status
      experience_years
      previous_countries
      key_responsibilities
      skills
      languages
      education_level
      work_history
      preferred_salary_min
      preferred_currency
      availability_status
      work_preferences
      contract_duration_preference
      live_in_preference
      about_me
      additional_notes
      profile_photo_url
      introduction_video_url
      medical_certificate_valid
      police_clearance_valid
      profile_completion_percentage
      created_at
      updated_at
    }
  }
`;

// GraphQL query for fetching maid documents
const GET_MAID_DOCUMENTS = gql`
  query GetMaidDocuments($maidId: String!) {
    maid_documents(where: { maid_id: { _eq: $maidId } }, order_by: { uploaded_at: desc }) {
      id
      maid_id
      type
      document_type
      custom_type_name
      title
      description
      file_url
      document_url
      file_path
      file_name
      file_size
      mime_type
      uploaded_at
      created_at
    }
  }
`;

// GraphQL mutation to insert a document
const INSERT_MAID_DOCUMENT = gql`
  mutation InsertMaidDocument($object: maid_documents_insert_input!) {
    insert_maid_documents_one(object: $object) {
      id
      maid_id
      type
      document_type
      title
      file_url
      document_url
      uploaded_at
    }
  }
`;

// GraphQL mutation to delete a document
const DELETE_MAID_DOCUMENT = gql`
  mutation DeleteMaidDocument($id: uuid!) {
    delete_maid_documents_by_pk(id: $id) {
      id
    }
  }
`;

import {
  positions,
  skills,
  languages,
  religions,
  maritalStatuses,
  visaStatuses,
  nationalities,
  workPreferences as workPreferenceOptions,
} from '@/data/maidProfileData';
import { gccCountries } from '@/data/maidProfileData';
import GccLocationSelector from '@/components/location/GccLocationSelector';
import { useGccLocations } from '@/hooks/useGccLocations';
import VideoCV from '@/components/ui/VideoCV';
import AdditionalDocuments from '@/components/ui/AdditionalDocuments';
// Local storage mode: no remote document service
import { getDefaultLocation, getDefaultCurrencyForRegion } from '@/lib/locationUtils';
import { ProfileSkeleton } from '@/components/ui/loading-states';
import { usePageTitle } from '@/hooks/usePageTitle';

// Enhanced constants with better UX
const KEY_RESPONSIBILITIES = [
  'General Housekeeping',
  'Cooking & Meal Prep',
  'Childcare & Nanny Services',
  'Infant Care (0-2 years)',
  'Elderly Care & Assistance',
  'Laundry & Garment Care',
  'Ironing & Pressing',
  'Grocery Shopping',
  'Pet Care & Walking',
  'Driving & Transportation',
  'Tutoring & Education',
  'Deep Cleaning Services',
  'Gardening & Plant Care',
  'Home Organization',
  'Event Assistance',
];

const SPECIAL_SKILLS = [
  '🚑 First Aid / CPR Certified',
  '🧼 Food Safety & Hygiene Training',
  '👶 Specialized Infant Care',
  '👴 Elderly Care Training',
  '🏠 Professional Housekeeping Certified',
  '👶 Certified Nanny Training',
  '🚗 Valid Driving License',
  '🍛 Ethiopian Cuisine Expert',
  '🥙 Middle Eastern Cuisine',
  '🍛 Indian Cuisine Specialist',
  '💉 COVID-19 Vaccinated',
  '💻 Basic Computer Skills',
  '🏥 Health & Safety Certified',
  '🧘 Yoga & Fitness Instructor',
  '🎨 Arts & Crafts for Kids',
  '📚 Reading & Storytelling',
];

const EDUCATION_LEVELS = [
  'No Formal Education',
  'Primary School (Elementary)',
  'Primary school',
  'Secondary School (Middle)',
  'Secondary school',
  'High School Graduate',
  'High school',
  'Technical/Vocational Certificate',
  'Vocational training',
  'College/University Degree',
  'University degree',
  "Bachelor's degree",
  'Graduate/Postgraduate Degree',
  "Master's degree",
  'Doctorate',
];

// Normalize education level for display (map legacy values to standard ones)
const normalizeEducationLevel = (level) => {
  if (!level) return '';
  const normalized = level.toLowerCase().trim();
  if (normalized.includes('primary')) return 'Primary School (Elementary)';
  if (normalized.includes('secondary')) return 'Secondary School (Middle)';
  if (normalized.includes('high school')) return 'High School Graduate';
  if (normalized.includes('vocational') || normalized.includes('technical')) return 'Technical/Vocational Certificate';
  if (normalized.includes('college') || normalized.includes('university') || normalized.includes('bachelor')) return 'College/University Degree';
  if (normalized.includes('master') || normalized.includes('graduate') || normalized.includes('postgraduate') || normalized.includes('doctorate')) return 'Graduate/Postgraduate Degree';
  return level; // Return original if no match
};

const REASONS_FOR_LEAVING = [
  'Contract Completed',
  'Family Relocated',
  'End of Visa/Residency',
  'Employer No Longer Needed Help',
  'Better Opportunity',
  'Salary/Benefits',
  'Personal/Family Reasons',
  'Health Reasons',
  'Returned to Home Country',
  'Other',
];

const EMPLOYER_TYPES = [
  'Single Family',
  'Family with Children',
  'Family with Elderly',
  'Elderly Couple',
  'Single Professional',
  'Working Couple',
  'Large Family (5+ members)',
  'Diplomatic Family',
  'Business Executive Family',
  'Other',
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: '✅ Available Immediately', color: 'bg-green-100 text-green-800' },
  { value: '2-weeks', label: '📅 Available in 2 weeks', color: 'bg-blue-100 text-blue-800' },
  { value: '1-month', label: '📆 Available in 1 month', color: 'bg-orange-100 text-orange-800' },
  { value: 'negotiable', label: '🤝 Negotiable', color: 'bg-purple-100 text-purple-800' },
  { value: 'hired', label: '👥 Currently Hired', color: 'bg-gray-100 text-gray-800' },
];

const MaidProfilePage = () => {
  usePageTitle('Maid Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isGeneratingAboutMe, setIsGeneratingAboutMe] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [documentUploadProgress, setDocumentUploadProgress] = useState({});
  const LOCAL_DOCS_KEY = useMemo(() => (user?.id ? `maid_documents_${user.id}` : null), [user?.id]);
  const LOCAL_VIDEO_KEY = useMemo(() => (user?.id ? `maid_intro_video_${user.id}` : null), [user?.id]);
  const handleClickUploadPhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePhotoSelected = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      setFormData((prev) => ({ ...prev, profilePictureUrl: dataUrl }));
      setProfile((prev) => ({ ...(prev || {}), profilePictureUrl: dataUrl }));
      setHasUnsavedChanges(true);

      try {
        setSaving(true);
        const { error } = await maidService.updateMaidProfile(user?.id, {
          profile_photo_url: dataUrl,
        });
        if (error) throw error;
        toast({ title: 'Profile photo updated', description: 'Your photo has been saved.' });
      } catch (err) {
        console.error('Photo update failed:', err);
        toast({ title: 'Upload failed', description: 'Could not save profile photo.', variant: 'destructive' });
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  }, [user]);

  const handleRemoveWork = useCallback((index) => {
    const ok = window.confirm('Remove this work experience?');
    if (!ok) return;
    setFormData((prev) => ({
      ...prev,
      workHistory: (prev.workHistory || []).filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleMoveWork = useCallback((index, direction) => {
    setFormData((prev) => {
      const list = [...(prev.workHistory || [])];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const tmp = list[index];
      list[index] = list[target];
      list[target] = tmp;
      return { ...prev, workHistory: list };
    });
    setHasUnsavedChanges(true);
  }, []);
  const tabsRef = useRef(null);
  const progressAnnouncementRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    dateOfBirth: null,
    age: 0,
    maritalStatus: '',
    childrenCount: 0,
    nationality: '',
    religion: '',

    // Contact & Location
    country: '',
    stateProvince: '',
    suburb: '',
    isoCountryCode: '',
    streetAddress: '',
    phoneNumber: '',
    alternativePhoneNumber: '',
    email: '',

    // Professional Information
    primaryProfession: '',
    currentVisaStatus: '',
    totalExperienceYears: 0,
    previousCountries: [],
    keyResponsibilities: [],
    specialSkills: [],
    languagesSpoken: [],
    educationLevel: '',

    // Work History
    workHistory: [],

    // Preferences & Expectations
    salaryExpectations: '',
    currency: 'AED',
    availability: 'available',
    workPreferences: [],
    contractPreference: '',
    livingArrangement: 'live-in',

    // Additional Information
    aboutMe: '',
    additionalNotes: '',
    profilePictureUrl: '',

    // Verification Status
    verificationStatus: {
      email: false,
      phone: false,
      documents: false,
    },
    // Documents & Media
    introductionVideoUrl: '',
    additionalDocuments: [],
    medicalCertificateValid: false,
    policeClearanceValid: false,
  });

  // GCC locations helper
  const { getStates, getSuburbs, isValidCountry, isValidState, getIsoCode } = useGccLocations();

  // Auto-save functionality
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveQueueRef = useRef([]);

  const handleAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !editMode || !isFormValid) return;

    // If already saving, queue this save request
    if (isSaving) {
      saveQueueRef.current.push(() => handleAutoSave());
      return;
    }

    try {
      setIsSaving(true);
      setAutoSaving(true);
      await handleSaveProfile(true); // Pass true for silent save
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
      setIsSaving(false);

      // Process next save in queue if any
      if (saveQueueRef.current.length > 0) {
        const nextSave = saveQueueRef.current.shift();
        setTimeout(nextSave, 100); // Small delay before next save
      }
    }
  }, [hasUnsavedChanges, editMode, isFormValid, formData, isSaving]);

  // Debounced auto-save (only when form is valid)
  useEffect(() => {
    if (hasUnsavedChanges && editMode && isFormValid) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      const timeout = setTimeout(handleAutoSave, 3000); // Auto-save after 3 seconds of inactivity
      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [hasUnsavedChanges, editMode, isFormValid, handleAutoSave]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.nationality) {
      errors.nationality = 'Nationality is required';
    }
    if (!formData.country) {
      errors.country = 'Country is required';
    }
    // Location validation: strict for GCC selections, flexible for 'Other/custom'
    if (formData.country) {
      if (isValidCountry(formData.country)) {
        const states = getStates(formData.country);
        if (!formData.stateProvince || !states.includes(formData.stateProvince)) {
          errors.stateProvince = 'Select a valid state/province';
        }
        const suburbs = getSuburbs(formData.country, formData.stateProvince);
        if (!formData.suburb || !(suburbs.includes(formData.suburb) || String(formData.suburb).trim().length > 0)) {
          errors.suburb = 'Select a suburb/city/district or enter a custom one';
        }
      } else {
        // Custom country: require at least a city/suburb text
        if (!formData.suburb || !String(formData.suburb).trim()) {
          errors.suburb = 'Please enter your city/district';
        }
      }
    }
    if (!formData.primaryProfession) {
      errors.primaryProfession = 'Primary profession is required';
    }
    if (!formData.totalExperienceYears && formData.totalExperienceYears !== 0) {
      errors.totalExperienceYears = 'Experience years is required';
    }
    if (!formData.languagesSpoken?.length) {
      errors.languagesSpoken = 'At least one language is required';
    }
    if (!formData.aboutMe?.trim()) {
      errors.aboutMe = 'About me section is required';
    } else if (formData.aboutMe.length < 100) {
      errors.aboutMe = 'About me should be at least 100 characters';
    }
    if (!formData.salaryExpectations) {
      errors.salaryExpectations = 'Salary expectations are required';
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  }, [formData]);

  // Calculate profile completeness with better logic
  const profileCompleteness = useMemo(() => {
    if (!profile) return 0;

    const sections = {
      personal: {
        weight: 25,
        fields: ['fullName', 'dateOfBirth', 'nationality', 'country', 'stateProvince', 'suburb'],
        completed: 0
      },
      professional: {
        weight: 30,
        fields: ['primaryProfession', 'totalExperienceYears', 'languagesSpoken', 'keyResponsibilities'],
        completed: 0
      },
      experience: {
        weight: 20,
        fields: ['workHistory'],
        completed: 0
      },
      preferences: {
        weight: 15,
        fields: ['salaryExpectations', 'availability', 'contractPreference'],
        completed: 0
      },
      additional: {
        weight: 10,
        fields: ['aboutMe'],
        completed: 0
      }
    };

    let totalScore = 0;

    Object.keys(sections).forEach(sectionKey => {
      const section = sections[sectionKey];
      const completedFields = section.fields.filter(field => {
        const value = profile[field];
        if (field === 'workHistory') {
          return value?.some(work => work.country && work.duration);
        }
        return value && (Array.isArray(value) ? value.length > 0 : true);
      });

      section.completed = (completedFields.length / section.fields.length) * 100;
      totalScore += (section.completed * section.weight) / 100;
    });

    const completionScore = Math.round(totalScore);

    // Announce progress changes to screen readers
    if (progressAnnouncementRef.current && profile) {
      progressAnnouncementRef.current.textContent = `Profile completion: ${completionScore}%`;
    }

    return completionScore;
  }, [profile]);

  // Load profile data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch maid profile using GraphQL
        console.log('[MaidProfilePage] Fetching profile for user:', user.id);
        const { data: result, errors } = await apolloClient.query({
          query: GET_MAID_PROFILE_FULL,
          variables: { userId: user.id },
          fetchPolicy: 'network-only',
        });

        if (errors) {
          console.error('[MaidProfilePage] GraphQL errors:', errors);
        }

        const maidProfileData = result?.maid_profiles?.[0] || null;
        console.log('[MaidProfilePage] Fetched maid profile data:', maidProfileData);
        console.log('[MaidProfilePage] Key fields:', {
          date_of_birth: maidProfileData?.date_of_birth,
          education_level: maidProfileData?.education_level,
          work_history: maidProfileData?.work_history,
          work_history_type: typeof maidProfileData?.work_history,
          work_history_isArray: Array.isArray(maidProfileData?.work_history),
          contract_duration_preference: maidProfileData?.contract_duration_preference,
          introduction_video_url: maidProfileData?.introduction_video_url,
        });

        let profileData;
        if (maidProfileData) {
          // Map database to form data
          profileData = {
            fullName: maidProfileData.full_name || user.name || '',
            dateOfBirth: maidProfileData.date_of_birth ? new Date(maidProfileData.date_of_birth) : null,
            age: maidProfileData.date_of_birth ? differenceInYears(new Date(), new Date(maidProfileData.date_of_birth)) : 0,
            maritalStatus: maidProfileData.marital_status || '',
            childrenCount: maidProfileData.children_count || 0,
            nationality: maidProfileData.nationality || '',
            religion: maidProfileData.religion || '',
            country: maidProfileData.country || user.country || '',
            stateProvince: maidProfileData.state_province || '',
            suburb: maidProfileData.suburb || '',
            isoCountryCode: maidProfileData.iso_country_code || '',
            streetAddress: maidProfileData.street_address || '',
            phoneNumber: user.phone || '',
            alternativePhoneNumber: maidProfileData.alternative_phone || '',
            email: user.email || '',
            primaryProfession: maidProfileData.primary_profession || '',
            currentVisaStatus: maidProfileData.current_visa_status || maidProfileData.visa_status || '',
            totalExperienceYears: maidProfileData.experience_years || 0,
            previousCountries: maidProfileData.previous_countries || [],
            keyResponsibilities: maidProfileData.key_responsibilities || [],
            specialSkills: maidProfileData.skills || [],
            languagesSpoken: maidProfileData.languages || [],
            educationLevel: maidProfileData.education_level || '',
            workHistory: (() => {
              // Parse work_history from database (handles both array and object formats)
              let rawHistory = [];
              if (Array.isArray(maidProfileData.work_history)) {
                rawHistory = maidProfileData.work_history;
              } else if (maidProfileData.work_history && typeof maidProfileData.work_history === 'object') {
                rawHistory = Object.values(maidProfileData.work_history).filter(
                  item => item && typeof item === 'object' && !item.availability
                );
              }
              // Map snake_case database fields to camelCase form fields
              return rawHistory.map(item => ({
                country: item.country || '',
                employerType: item.employerType || item.employer_type || '',
                customEmployerType: item.customEmployerType || item.custom_employer_type || '',
                duration: item.duration || '',
                keyResponsibilities: item.keyResponsibilities || item.key_responsibilities || [],
                reasonForLeaving: item.reasonForLeaving || item.reason_for_leaving || '',
                optional: item.optional !== undefined ? item.optional : true,
              }));
            })(),
            salaryExpectations: maidProfileData.preferred_salary_min || '',
            currency: maidProfileData.preferred_currency || 'AED',
            availability: maidProfileData.availability_status || 'available',
            workPreferences: maidProfileData.work_preferences || [],
            contractPreference: maidProfileData.contract_duration_preference || '',
            livingArrangement: maidProfileData.live_in_preference ? 'live-in' : 'live-out',
            aboutMe: maidProfileData.about_me || '',
            additionalNotes: maidProfileData.additional_notes || '',
            profilePictureUrl: maidProfileData.profile_photo_url || '/images/default-avatar.png',
            introductionVideoUrl: maidProfileData.introduction_video_url || '',
            verificationStatus: {
              email: true,
              phone: user.registration_complete || false,
              documents: maidProfileData.medical_certificate_valid && maidProfileData.police_clearance_valid,
            },
            medicalCertificateValid: !!maidProfileData.medical_certificate_valid,
            policeClearanceValid: !!maidProfileData.police_clearance_valid,
          };
        } else {
          // Create default profile
          profileData = {
            fullName: user.name || '',
            dateOfBirth: null,
            age: 0,
            maritalStatus: '',
            childrenCount: 0,
            nationality: '',
            religion: '',
            country: user.country || '',
            stateProvince: '',
            suburb: '',
            isoCountryCode: '',
            streetAddress: '',
            phoneNumber: user.phone || '',
            alternativePhoneNumber: '',
            email: user.email || '',
            primaryProfession: '',
            currentVisaStatus: '',
            totalExperienceYears: 0,
            previousCountries: [],
            keyResponsibilities: [],
            specialSkills: [],
            languagesSpoken: [],
            educationLevel: '',
            workHistory: [],
            salaryExpectations: '',
            currency: '',
            availability: 'available',
            workPreferences: [],
            contractPreference: '',
            livingArrangement: 'live-in',
            aboutMe: '',
            additionalNotes: '',
            profilePictureUrl: '/images/default-avatar.png',
            introductionVideoUrl: '',
            verificationStatus: {
              email: true,
              phone: user.registration_complete || false,
              documents: false,
            },
            medicalCertificateValid: false,
            policeClearanceValid: false,
          };
        }

        // Apply default country & currency based on user's current location when empty
        try {
          const { country: defaultCountry, currency: defaultCurrency } = getDefaultLocation();
          if (!profileData.country && defaultCountry) {
            profileData.country = defaultCountry;
            profileData.isoCountryCode = isValidCountry(defaultCountry) ? (getIsoCode(defaultCountry) || '') : '';
          }
          if (!profileData.currency && defaultCurrency) {
            profileData.currency = defaultCurrency;
          }
        } catch (e) {
          console.warn('MaidProfilePage: default location detection failed');
        }

        console.log('[MaidProfilePage] Setting profile data:', {
          dateOfBirth: profileData.dateOfBirth,
          educationLevel: profileData.educationLevel,
          workHistory: profileData.workHistory,
          contractPreference: profileData.contractPreference,
          introductionVideoUrl: profileData.introductionVideoUrl,
        });
        setProfile(profileData);
        setFormData(profileData);

        // Fetch documents from database
        try {
          const maidId = maidProfileData?.id || user?.id;
          if (maidId) {
            const { data: docsData } = await apolloClient.query({
              query: GET_MAID_DOCUMENTS,
              variables: { maidId },
              fetchPolicy: 'network-only',
            });

            const dbDocuments = (docsData?.maid_documents || []).map(doc => ({
              id: doc.id,
              type: doc.type || doc.document_type,
              customTypeName: doc.custom_type_name,
              title: doc.title || doc.file_name,
              description: doc.description || '',
              uploadDate: doc.uploaded_at || doc.created_at,
              fileSize: doc.file_size,
              fileType: doc.mime_type,
              url: doc.file_url || doc.document_url,
              storagePath: doc.file_path,
            }));

            if (dbDocuments.length > 0) {
              setUploadedDocuments(dbDocuments);
              setFormData(prev => ({ ...prev, additionalDocuments: dbDocuments }));
              console.log('[MaidProfilePage] Loaded documents from database:', dbDocuments.length);
            }
          }
        } catch (docErr) {
          console.warn('[MaidProfilePage] Failed to fetch documents:', docErr);
        }

        // Clear legacy localStorage cache if documents loaded from database
        if (LOCAL_DOCS_KEY) {
          localStorage.removeItem(LOCAL_DOCS_KEY);
        }
        if (LOCAL_VIDEO_KEY) {
          localStorage.removeItem(LOCAL_VIDEO_KEY);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error Loading Profile',
          description: 'Failed to load your profile. Please refresh and try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle form changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleDateChange = useCallback((name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleArrayChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleLocationChange = useCallback((loc) => {
    setFormData(prev => {
      const next = {
        ...prev,
        country: loc.country ?? prev.country,
        isoCountryCode: loc.isoCountryCode ?? prev.isoCountryCode,
        stateProvince: loc.stateProvince ?? prev.stateProvince,
        suburb: loc.suburb ?? prev.suburb,
      };

      const prevCountry = prev.country || '';
      const newCountry = next.country || '';
      if (newCountry && newCountry !== prevCountry) {
        if (isValidCountry(newCountry)) {
          const iso = loc.isoCountryCode || getIsoCode(newCountry) || '';
          const mapped = getDefaultCurrencyForRegion(iso);
          if (mapped) next.currency = mapped;
          next.isoCountryCode = iso;
        } else {
          // Non-GCC or custom countries default to USD
          next.isoCountryCode = '';
          next.currency = 'USD';
        }
      }

      return next;
    });
    setHasUnsavedChanges(true);
  }, [getIsoCode, isValidCountry]);

  // Upload Video CV to Firebase Storage
  const handleVideoCvChange = useCallback(async (blob) => {
    try {
      if (!blob || !user?.id) {
        console.warn('Cannot upload video: missing blob or user ID');
        return;
      }

      setIsUploadingVideo(true);
      setVideoUploadProgress(0);

      toast({ title: 'Uploading Video CV...', description: 'Please wait while your video is being uploaded.' });

      // Upload to Firebase Storage
      const videoUrl = await uploadVideoCV(user.id, blob, (progress) => {
        setVideoUploadProgress(progress);
      });

      // Update form and profile with the cloud URL
      setFormData(prev => ({ ...prev, introductionVideoUrl: videoUrl }));
      setProfile(prev => ({ ...(prev || {}), introductionVideoUrl: videoUrl }));
      setHasUnsavedChanges(true);

      // Clear local storage cache
      if (LOCAL_VIDEO_KEY) {
        localStorage.removeItem(LOCAL_VIDEO_KEY);
      }

      toast({ title: 'Video CV uploaded!', description: 'Your introduction video has been saved to the cloud.' });
    } catch (err) {
      console.error('Video CV upload failed:', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'Could not upload video. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
    }
  }, [user?.id, LOCAL_VIDEO_KEY]);

  // Upload documents to Firebase Storage and save to database
  const handleDocumentsChange = useCallback(async (docs) => {
    try {
      if (!user?.id) {
        console.warn('Cannot upload documents: missing user ID');
        return;
      }

      if (!Array.isArray(docs)) {
        setUploadedDocuments([]);
        setFormData(prev => ({ ...prev, additionalDocuments: [] }));
        return;
      }

      // Check if we're adding or removing documents
      const currentIds = new Set(uploadedDocuments.map(d => d.id));
      const newIds = new Set(docs.map(d => d.id));

      // Handle deleted documents
      const deletedDocs = uploadedDocuments.filter(d => !newIds.has(d.id) && d.url?.startsWith('http'));
      for (const doc of deletedDocs) {
        try {
          await apolloClient.mutate({
            mutation: DELETE_MAID_DOCUMENT,
            variables: { id: doc.id },
          });
          console.log('[MaidProfilePage] Deleted document from database:', doc.id);
        } catch (deleteErr) {
          console.warn('Failed to delete document from database:', deleteErr);
        }
      }

      // Immediately update state with the new docs (for UI responsiveness)
      setUploadedDocuments(docs);

      // Process each document - upload new files to Firebase Storage and save to database
      const processedDocs = await Promise.all(docs.map(async (d) => {
        // Skip if already has a cloud URL (already uploaded and saved)
        if (d?.url && (d.url.startsWith('http://') || d.url.startsWith('https://'))) {
          const { file, ...rest } = d || {};
          return rest;
        }

        // Upload new file to Firebase Storage and save to database
        if (d?.file) {
          const tempId = d.id || String(Date.now() + Math.random());

          // Set progress for this document
          setDocumentUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

          try {
            // Upload to Firebase Storage
            const result = await uploadDocument(
              user.id,
              d.file,
              d.type || 'other',
              (progress) => {
                setDocumentUploadProgress(prev => ({ ...prev, [tempId]: progress }));
              }
            );

            // Save to database
            const { data: insertData } = await apolloClient.mutate({
              mutation: INSERT_MAID_DOCUMENT,
              variables: {
                object: {
                  maid_id: user.id,
                  type: d.type || 'other',
                  document_type: d.type || 'other',
                  custom_type_name: d.customTypeName || null,
                  title: d.title || d.file.name,
                  description: d.description || '',
                  file_url: result.url,
                  document_url: result.url,
                  file_path: result.path,
                  file_name: d.file.name,
                  file_size: d.file.size,
                  mime_type: d.file.type,
                  uploaded_at: new Date().toISOString(),
                },
              },
            });

            // Clear progress after upload
            setDocumentUploadProgress(prev => {
              const { [tempId]: _, ...rest } = prev;
              return rest;
            });

            const insertedDoc = insertData?.insert_maid_documents_one;
            return {
              id: insertedDoc?.id || tempId,
              type: d.type,
              customTypeName: d.customTypeName,
              title: d.title || d.file.name,
              description: d.description || '',
              uploadDate: insertedDoc?.uploaded_at || new Date().toISOString(),
              fileSize: d.file.size,
              fileType: d.file.type,
              url: result.url,
              storagePath: result.path,
            };
          } catch (uploadErr) {
            console.error('Failed to upload document:', uploadErr);
            // Clear progress on error
            setDocumentUploadProgress(prev => {
              const { [tempId]: _, ...rest } = prev;
              return rest;
            });
            toast({
              title: 'Document upload failed',
              description: `Failed to upload ${d.title || d.file?.name || 'document'}. Please try again.`,
              variant: 'destructive'
            });
            // Keep the document with file reference for retry
            return d;
          }
        }

        // Return as-is if no file to upload
        const { file, ...rest } = d || {};
        return rest;
      }));

      // Update state with processed documents
      setUploadedDocuments(processedDocs);
      setFormData(prev => ({ ...prev, additionalDocuments: processedDocs }));

      // Clear localStorage cache
      if (LOCAL_DOCS_KEY) {
        localStorage.removeItem(LOCAL_DOCS_KEY);
      }

      // Show success toast if all documents uploaded successfully
      const allUploaded = processedDocs.every(d => d.url?.startsWith('http'));
      if (allUploaded && processedDocs.length > 0) {
        toast({ title: 'Documents uploaded!', description: 'Your documents have been saved to the cloud.' });
      }
    } catch (e) {
      console.error('Documents upload failed:', e);
      toast({
        title: 'Upload failed',
        description: 'Could not upload documents. Please try again.',
        variant: 'destructive'
      });
    }
  }, [user?.id, LOCAL_DOCS_KEY, uploadedDocuments]);

  const handleWorkHistoryChange = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      workHistory: prev.workHistory.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle tab keyboard navigation
  const handleTabKeyDown = useCallback((e) => {
    const tabs = ['personal', 'professional', 'experience', 'preferences', 'additional', 'documents'];
    const currentIndex = tabs.indexOf(activeTab);

    if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
      e.preventDefault();
      setActiveTab(tabs[currentIndex + 1]);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      setActiveTab(tabs[currentIndex - 1]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(tabs[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(tabs[tabs.length - 1]);
    }
  }, [activeTab]);

  // AI generation for About Me section
  const handleGenerateAboutMe = useCallback(() => {
    if (isGeneratingAboutMe) return;

    setIsGeneratingAboutMe(true);

    // Simulate AI processing delay
    setTimeout(() => {
      try {
        const generatePersonalizedAboutMe = () => {
          const nameParts = [formData.firstName, formData.middleName, formData.lastName]
            .filter(Boolean)
            .map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
        const fullName = (formData.fullName || '').trim() || 'I';
          const nationality = formData.nationality ? formData.nationality.toLowerCase() : 'Ethiopian';
          const profession = formData.primaryProfession ? formData.primaryProfession.toLowerCase() : 'domestic worker';
          const years = parseInt(formData.totalExperienceYears) || 0;
          const skills = formData.skills || [];
          const languages = formData.languagesSpoken || [];
          const previousCountries = formData.previousCountries || [];
          const age = formData.age || 25;
          const maritalStatus = formData.maritalStatus || 'single';

          // Base introduction
          let aboutMe = years > 0
            ? `${fullName} am a dedicated and experienced ${nationality} ${profession} with ${years} year${years > 1 ? 's' : ''} of professional experience. `
            : `${fullName} am a motivated and reliable ${nationality} ${profession} eager to begin my career in domestic services. `;

          // Add personal qualities based on age and marital status
          const personalQualities = [
            'trustworthy', 'hardworking', 'detail-oriented', 'caring', 'reliable',
            'respectful', 'patient', 'dedicated', 'honest', 'responsible'
          ];
          const selectedQualities = personalQualities.slice(0, 3).join(', ');
          aboutMe += `I am ${selectedQualities}, and I take great pride in maintaining high standards in all my work. `;

          // Add skills section if skills are available
          if (skills.length > 0) {
            const topSkills = skills.slice(0, 4);
            aboutMe += `My key strengths include ${topSkills.join(', ').toLowerCase()}. `;
          }

          // Add language skills
          if (languages.length > 0) {
            const languageText = languages.length > 1
              ? `I am fluent in ${languages.slice(0, -1).join(', ')} and ${languages[languages.length - 1]}. `
              : `I am fluent in ${languages[0]}. `;
            aboutMe += languageText;
          } else {
            aboutMe += 'I communicate effectively and am committed to understanding and meeting my employer\'s needs. ';
          }

          // Add experience section
          if (years > 0 && previousCountries.length > 0) {
            const countryText = previousCountries.length > 1
              ? `I have worked in ${previousCountries.slice(0, -1).join(', ')} and ${previousCountries[previousCountries.length - 1]}`
              : `I have experience working in ${previousCountries[0]}`;
            aboutMe += `${countryText}, which has given me valuable cultural understanding and adaptability. `;
          }

          // Add work ethic and values
          aboutMe += 'I believe in treating every family I work with as my own, ensuring their comfort, safety, and happiness is my top priority. ';

          // Add availability and commitment
          const commitmentText = maritalStatus === 'single'
            ? 'I am single and fully committed to providing excellent service with flexible availability. '
            : 'I am committed to providing excellent service while maintaining a healthy work-life balance. ';
          aboutMe += commitmentText;

          // Closing statement
          aboutMe += 'I am seeking a long-term position with a family that values quality, reliability, and mutual respect. I am excited to bring my skills and positive attitude to create a harmonious and well-managed household.';

          return aboutMe;
        };

        const generatedText = generatePersonalizedAboutMe();

        setFormData(prev => ({
          ...prev,
          aboutMe: generatedText
        }));

        // Clear any existing errors
        setValidationErrors(prev => ({
          ...prev,
          aboutMe: null
        }));

        setHasUnsavedChanges(true);

        toast({
          title: 'About Me Generated! ✨',
          description: 'Your personalized About Me section has been created based on your profile information. You can edit it further if needed.',
          duration: 4000,
        });

      } catch (error) {
        console.error('Error generating About Me:', error);
        toast({
          title: 'Generation Failed',
          description: 'Unable to generate About Me text. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsGeneratingAboutMe(false);
      }
    }, 2000); // 2 second delay for better UX
  }, [formData, isGeneratingAboutMe]);

  // Save profile
  const handleSaveProfile = async (silent = false) => {
    // Prevent concurrent saves
    if (isSaving) {
      if (!silent) {
        toast({
          title: 'Save in Progress',
          description: 'Please wait for the current save to complete.',
          variant: 'default',
        });
      }
      return;
    }

    try {
      if (!silent) {
        if (!validateForm()) {
          toast({
            title: 'Validation Error',
            description: 'Please fix the errors before saving.',
            variant: 'destructive',
          });
          return;
        }
        // Extra validation for work experience: require at least a country or duration when present
        const invalidWork = (formData.workHistory || []).some((w) => {
          const hasCountry = !!(w.country && String(w.country).trim());
          const hasDuration = !!(w.duration && String(w.duration).trim());
          return !(hasCountry || hasDuration);
        });
        if (invalidWork) {
          toast({
            title: 'Work Experience Incomplete',
            description: 'Each work entry must have at least a country or a duration.',
            variant: 'destructive',
          });
          return;
        }
        setSaving(true);
        setIsSaving(true);
      }

      // Transform form data to database format
      const locationString = [formData.suburb, formData.stateProvince, formData.country]
        .filter(Boolean)
        .join(', ');

      const dbData = {
        full_name: (formData.fullName || '').trim(),
        date_of_birth: formData.dateOfBirth,
        marital_status: formData.maritalStatus,
        children_count: formData.childrenCount,
        nationality: formData.nationality,
        religion: formData.religion,
        country: formData.country,
        iso_country_code: formData.isoCountryCode || null,
        suburb: formData.suburb || null,
        current_location: locationString || formData.country,
        state_province: formData.stateProvince,
        street_address: formData.streetAddress,
        alternative_phone: formData.alternativePhoneNumber,
        primary_profession: formData.primaryProfession,
        visa_status: formData.currentVisaStatus,
        experience_years: formData.totalExperienceYears,
        previous_countries: formData.previousCountries,
        key_responsibilities: formData.keyResponsibilities,
        skills: formData.specialSkills,
        languages: formData.languagesSpoken,
        education_level: formData.educationLevel,
        // Ensure work_history is always saved as an array with proper field names
        work_history: Array.isArray(formData.workHistory)
          ? formData.workHistory
              .filter(item => item && typeof item === 'object')
              .map(item => ({
                country: item.country || '',
                employer_type: item.employerType || '',
                custom_employer_type: item.customEmployerType || '',
                duration: item.duration || '',
                key_responsibilities: item.keyResponsibilities || [],
                reason_for_leaving: item.reasonForLeaving || '',
                optional: item.optional !== undefined ? item.optional : true,
              }))
          : [],
        preferred_salary_min: formData.salaryExpectations,
        preferred_currency: formData.currency,
        availability_status: formData.availability,
        work_preferences: formData.workPreferences,
        contract_duration_preference: formData.contractPreference,
        live_in_preference: formData.livingArrangement === 'live-in',
        about_me: formData.aboutMe,
        additional_notes: formData.additionalNotes,
        profile_photo_url: formData.profilePictureUrl,
        introduction_video_url: formData.introductionVideoUrl,
        // Note: Documents are stored in maid_documents table, not here
      };

      const { data, error } = await maidService.updateMaidProfile(user?.id, dbData);
      if (error) throw error;

      setProfile(formData);
      if (!silent) {
        setEditMode(false);
        toast({
          title: 'Profile Saved',
          description: 'Your profile has been updated successfully!',
        });
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      if (!silent) {
        toast({
          title: 'Save Failed',
          description: 'Failed to save your profile. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) setSaving(false);
      setIsSaving(false);

      // Process next save in queue if any
      if (saveQueueRef.current.length > 0) {
        const nextSave = saveQueueRef.current.shift();
        setTimeout(nextSave, 100); // Small delay before next save
      }
    }
  };

  // Removed previous country->states wiring; now handled by GCC selector

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Calculate age when date of birth changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const age = differenceInYears(new Date(), formData.dateOfBirth);
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.dateOfBirth]);

  const getAvailabilityOption = (value) => {
    return AVAILABILITY_OPTIONS.find(opt => opt.value === value) || AVAILABILITY_OPTIONS[0];
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className='space-y-6 pb-10'>
      {/* Enhanced Header with Status */}
      <div className='bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6'>
        <div className='flex justify-between items-start'>
          <div className='flex items-start gap-4'>
            <Button variant='ghost' asChild className='gap-2 text-gray-600 hover:text-purple-600 hover:bg-white/60'>
              <a href='/dashboard/maid'>
                <ArrowLeft className='h-4 w-4' />
                Dashboard
              </a>
            </Button>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Build Your Professional Profile
              </h1>
              <p className='text-gray-600 max-w-2xl'>
                Create a compelling profile to attract the best employers. Complete all sections to maximize your visibility.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {/* Auto-save indicator */}
            {autoSaving && (
              <div className='flex items-center gap-2 text-sm text-gray-500' role='status' aria-live='polite'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Saving changes...
              </div>
            )}

            {/* Progress announcement for screen readers */}
            <div
              ref={progressAnnouncementRef}
              className='sr-only'
              aria-live='polite'
              aria-atomic='true'
            />

            {/* Edit/Save buttons */}
            {!editMode ? (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setShowPreview(!showPreview)}
                  className='gap-2'
                >
                  {showPreview ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </Button>
                <Button
                  onClick={() => setEditMode(true)}
                  className='gap-2 bg-purple-600 hover:bg-purple-700'
                >
                  <Edit className='h-4 w-4' />
                  Edit Profile
                </Button>
              </div>
            ) : (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setFormData(profile);
                    setEditMode(false);
                    setHasUnsavedChanges(false);
                  }}
                  disabled={saving}
                >
                  <X className='h-4 w-4 mr-1' />
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveProfile()}
                  className='gap-2 bg-green-600 hover:bg-green-700'
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4' />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profile completion progress */}
        <div className='mt-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>
              Profile Completion
            </span>
            <span className='text-sm font-bold text-purple-700'>
              {profileCompleteness}%
            </span>
          </div>
          <Progress
            value={profileCompleteness}
            className='h-3 bg-white border'
          />
          <div className='flex justify-between mt-1'>
            <span className='text-xs text-gray-500'>
              {profileCompleteness < 50 ? 'Getting started' :
               profileCompleteness < 80 ? 'Almost there' : 'Excellent profile!'}
            </span>
            <span className='text-xs text-gray-500'>
              {profileCompleteness === 100 ? 'Complete' : 'Complete all sections to maximize visibility'}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {Object.keys(validationErrors).length > 0 && editMode && (
        <Alert className='border-red-200 bg-red-50'>
          <AlertTriangle className='h-4 w-4 text-red-600' />
          <AlertDescription className='text-red-800'>
            <strong>Please fix these errors:</strong>
            <ul className='list-disc list-inside mt-2 space-y-1'>
              {Object.values(validationErrors).map((error, index) => (
                <li key={index} className='text-sm'>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Enhanced Profile Sidebar */}
        <div className='lg:col-span-1'>
          <Card className='border-0 shadow-lg bg-gradient-to-b from-white to-gray-50'>
            <CardContent className='p-6'>
              <div className='flex flex-col items-center'>
                {/* Profile Picture with Upload */}
                <div className='relative mb-4'>
                  <Avatar className='h-28 w-28 border-4 border-white shadow-lg'>
                    <AvatarImage src={profile?.profilePictureUrl} alt={profile?.fullName || profile?.full_name || profile?.name} />
                    <AvatarFallback className='text-2xl bg-purple-100 text-purple-700'>
                      {(profile?.fullName || profile?.full_name || profile?.name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white border-2 border-gray-200 hover:bg-gray-50'
                      onClick={handleClickUploadPhoto}
                    >
                      <Camera className='h-4 w-4' />
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handlePhotoSelected}
                  />
                </div>

                {/* Name and Location */}
                <div className='text-center mb-4'>
                  <h2 className='text-xl font-bold text-gray-900'>
                    {profile?.fullName || profile?.full_name || profile?.name || 'Your Name'}
                  </h2>
                  <div className='flex items-center justify-center gap-1 text-gray-600 mb-2'>
                    <MapPin className='h-4 w-4' />
                    <span className='text-sm'>{profile?.country || 'Location'}</span>
                  </div>

                  {/* Rating */}
                  <div className='flex items-center justify-center mb-2'>
                    <div className='flex gap-1'>
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                      ))}
                    </div>
                    <span className='text-sm font-medium ml-2 text-gray-700'>4.8 (12 reviews)</span>
                  </div>

                  {/* Availability Badge */}
                  {profile?.availability && (
                    <Badge className={`${getAvailabilityOption(profile.availability).color} border-0`}>
                      {getAvailabilityOption(profile.availability).label}
                    </Badge>
                  )}
                </div>

                <Separator className='my-4 w-full' />

                {/* Quick Stats */}
                <div className='w-full space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Award className='h-4 w-4 text-purple-600' />
                      <span className='text-sm text-gray-600'>Experience</span>
                    </div>
                    <span className='font-semibold text-gray-900'>
                      {profile?.totalExperienceYears || 0} years
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Briefcase className='h-4 w-4 text-purple-600' />
                      <span className='text-sm text-gray-600'>Profession</span>
                    </div>
                    <span className='font-semibold text-gray-900 text-right text-xs'>
                      {profile?.primaryProfession || 'Not set'}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Globe className='h-4 w-4 text-purple-600' />
                      <span className='text-sm text-gray-600'>Languages</span>
                    </div>
                    <span className='font-semibold text-gray-900'>
                      {profile?.languagesSpoken?.length || 0}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Shield className='h-4 w-4 text-green-600' />
                      <span className='text-sm text-gray-600'>Verified</span>
                    </div>
                    <div className='flex gap-1'>
                      {profile?.verificationStatus?.email &&
                        <CheckCircle className='h-4 w-4 text-green-600' />}
                      {profile?.verificationStatus?.phone &&
                        <CheckCircle className='h-4 w-4 text-blue-600' />}
                      {profile?.verificationStatus?.documents &&
                        <CheckCircle className='h-4 w-4 text-purple-600' />}
                    </div>
                  </div>
                </div>

                {/* Profile Strength Indicator */}
                <div className='w-full mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-purple-800'>Profile Completeness</span>
                    <TrendingUp className='h-4 w-4 text-purple-600' />
                  </div>
                  <Progress value={profileCompleteness} className='h-2 mb-2' />
                  <span className='text-xs text-purple-600'>
                    {profileCompleteness < 50 ? 'Build your profile to get noticed!' :
                     profileCompleteness < 80 ? 'Looking good! Keep going!' :
                     'Outstanding profile!'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Profile Form */}
        <div className='lg:col-span-3'>
          <Card className='border-0 shadow-lg'>
            <CardHeader className='pb-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg'>
              <div className='flex justify-between items-center'>
                <div>
                  <CardTitle className='text-2xl text-gray-900'>Profile Information</CardTitle>
                  <CardDescription className='text-gray-600'>
                    {editMode
                      ? 'Update your information. Changes save automatically every 3 seconds when valid.'
                      : 'View your complete profile information'}
                  </CardDescription>
                </div>
                {hasUnsavedChanges && editMode && (
                  <Badge variant='outline' className='bg-orange-50 text-orange-700 border-orange-200'>
                    <Clock className='h-3 w-3 mr-1' />
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className='p-6'>
              {/* Skip navigation for screen readers */}
              <a href='#profile-content' className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50'>
                Skip to profile content
              </a>

              <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                <TabsList
                  ref={tabsRef}
                  className='grid grid-cols-6 mb-8 h-12 bg-gray-100'
                  role='tablist'
                  aria-label='Profile sections'
                  onKeyDown={handleTabKeyDown}
                >
                  <TabsTrigger
                    value='personal'
                    className='flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white focus:ring-2 focus:ring-purple-300 focus:ring-offset-2'
                    role='tab'
                    aria-selected={activeTab === 'personal'}
                    aria-controls='personal-panel'
                  >
                    <User className='h-4 w-4' />
                    <span className='hidden sm:inline'>Personal</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value='professional'
                    className='flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white focus:ring-2 focus:ring-purple-300 focus:ring-offset-2'
                    role='tab'
                    aria-selected={activeTab === 'professional'}
                    aria-controls='professional-panel'
                  >
                    <Briefcase className='h-4 w-4' />
                    <span className='hidden sm:inline'>Professional</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value='experience'
                    className='flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white focus:ring-2 focus:ring-purple-300 focus:ring-offset-2'
                    role='tab'
                    aria-selected={activeTab === 'experience'}
                    aria-controls='experience-panel'
                  >
                    <Calendar className='h-4 w-4' />
                    <span className='hidden sm:inline'>Experience</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value='preferences'
                    className='flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white focus:ring-2 focus:ring-purple-300 focus:ring-offset-2'
                    role='tab'
                    aria-selected={activeTab === 'preferences'}
                    aria-controls='preferences-panel'
                  >
                    <Globe className='h-4 w-4' />
                    <span className='hidden sm:inline'>Preferences</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value='additional'
                    className='flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white focus:ring-2 focus:ring-purple-300 focus:ring-offset-2'
                    role='tab'
                    aria-selected={activeTab === 'additional'}
                    aria-controls='additional-panel'
                  >
                    <FileText className='h-4 w-4' />
                    <span className='hidden sm:inline'>Additional</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value='documents'
                    className='flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white focus:ring-2 focus:ring-purple-300 focus:ring-offset-2'
                    role='tab'
                    aria-selected={activeTab === 'documents'}
                    aria-controls='documents-panel'
                  >
                    <FileText className='h-4 w-4' />
                    <span className='hidden sm:inline'>Documents</span>
                  </TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent
                  id='profile-content'
                  value='personal'
                  className='space-y-8'
                  role='tabpanel'
                  aria-labelledby='personal-tab'
                  tabIndex={0}
                >
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <User className='h-5 w-5 text-blue-600 mt-0.5' />
                      <div>
                        <h3 className='font-semibold text-blue-900 mb-1'>Personal Information</h3>
                        <p className='text-sm text-blue-700'>
                          Provide accurate personal details. This information helps employers understand your background.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='fullName' className='text-sm font-semibold text-gray-900'>
                        Full Name <span className='text-red-500'>*</span>
                      </Label>
                      {editMode ? (
                        <Input
                          id='fullName'
                          name='fullName'
                          value={formData.fullName || ''}
                          onChange={handleInputChange}
                          placeholder='Your full name'
                          className={validationErrors.fullName ? 'border-red-500' : ''}
                          required
                        />
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.fullName || profile?.full_name || 'Not provided'}
                        </p>
                      )}
                      {validationErrors.fullName && (
                        <p className='text-sm text-red-600'>{validationErrors.fullName}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Personal Details */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-semibold text-gray-900'>
                        Date of Birth <span className='text-red-500'>*</span>
                      </Label>
                      {editMode ? (
                        <DropdownDatePicker
                          selected={formData.dateOfBirth}
                          onSelect={(date) => handleDateChange('dateOfBirth', date)}
                          placeholder='Select your date of birth'
                          className={validationErrors.dateOfBirth ? 'border-red-500' : ''}
                          required
                        />
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.dateOfBirth ? (
                            <>
                              {profile.dateOfBirth.toLocaleDateString()}
                              {profile?.age ? (
                                <span className='text-gray-600 ml-2'>({profile.age} years old)</span>
                              ) : ''}
                            </>
                          ) : 'Not provided'}
                        </p>
                      )}
                      {validationErrors.dateOfBirth && (
                        <p className='text-sm text-red-600'>{validationErrors.dateOfBirth}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='maritalStatus' className='text-sm font-semibold text-gray-900'>
                        Marital Status
                      </Label>
                      {editMode ? (
                        <Select
                          name='maritalStatus'
                          value={formData.maritalStatus}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, maritalStatus: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select marital status' />
                          </SelectTrigger>
                          <SelectContent>
                            {maritalStatuses.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.maritalStatus || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nationality and Religion */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='nationality' className='text-sm font-semibold text-gray-900'>
                        Nationality <span className='text-red-500'>*</span>
                      </Label>
                      {editMode ? (
                        <Select
                          name='nationality'
                          value={formData.nationality}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, nationality: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger className={validationErrors.nationality ? 'border-red-500' : ''}>
                            <SelectValue placeholder='Select your nationality' />
                          </SelectTrigger>
                          <SelectContent>
                            {nationalities.map(nationality => (
                              <SelectItem key={nationality} value={nationality}>
                                {nationality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.nationality || 'Not provided'}
                        </p>
                      )}
                      {validationErrors.nationality && (
                        <p className='text-sm text-red-600'>{validationErrors.nationality}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='religion' className='text-sm font-semibold text-gray-900'>
                        Religion
                      </Label>
                      {editMode ? (
                        <Select
                          name='religion'
                          value={formData.religion}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, religion: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select religion' />
                          </SelectTrigger>
                          <SelectContent>
                            {religions.map(religion => (
                              <SelectItem key={religion} value={religion}>
                                {religion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.religion || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Location Information */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Location Information</h3>
                    {editMode ? (
                      <GccLocationSelector
                        country={formData.country}
                        stateProvince={formData.stateProvince}
                        suburb={formData.suburb}
                        isoCountryCode={formData.isoCountryCode}
                        allowOtherCountry={true}
                        onChange={handleLocationChange}
                        errors={{
                          country: validationErrors.country,
                          stateProvince: validationErrors.stateProvince,
                          suburb: validationErrors.suburb,
                        }}
                      />
                    ) : (
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div>
                          <Label className='text-sm font-semibold text-gray-900'>Country</Label>
                          <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                            {profile?.country || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <Label className='text-sm font-semibold text-gray-900'>State/Province</Label>
                          <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                            {profile?.stateProvince || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <Label className='text-sm font-semibold text-gray-900'>Suburb/City/District</Label>
                          <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                            {profile?.suburb || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className='mt-6 space-y-2'>
                      <Label htmlFor='streetAddress' className='text-sm font-semibold text-gray-900'>
                        Street Address
                      </Label>
                      {editMode ? (
                        <Textarea
                          id='streetAddress'
                          name='streetAddress'
                          value={formData.streetAddress || ''}
                          onChange={handleInputChange}
                          placeholder='Your full street address (optional)'
                          rows={2}
                          className='resize-none'
                        />
                      ) : (
                        <p className='text-gray-800 py-2 px-3 bg-gray-50 rounded-md min-h-[80px] flex items-start'>
                          {profile?.streetAddress || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Documents & Video CV Tab */}
                <TabsContent
                  value='documents'
                  className='space-y-8'
                  role='tabpanel'
                  aria-labelledby='documents-tab'
                  tabIndex={0}
                >
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <FileText className='h-5 w-5 text-amber-600 mt-0.5' />
                      <div>
                        <h3 className='font-semibold text-amber-900 mb-1'>Verification Documents & Video CV</h3>
                        <p className='text-sm text-amber-700'>
                          Preview your verification documents and introduction video. Contact support to update verified documents if needed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Documents Status */}
                  <div>
                    <h4 className='text-md font-semibold text-gray-900 mb-3'>Verification Documents</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='flex items-center justify-between p-4 bg-gray-50 border rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <Heart className='h-5 w-5 text-red-500' />
                          <div>
                            <div className='font-medium text-gray-900'>Medical Certificate</div>
                            <div className='text-xs text-gray-500'>Health clearance document</div>
                          </div>
                        </div>
                        {profile?.medicalCertificateValid ? (
                          <div className='flex items-center gap-1 text-green-600'>
                            <CheckCircle className='h-4 w-4' />
                            <span className='text-sm font-medium'>Verified</span>
                          </div>
                        ) : (
                          <div className='flex items-center gap-1 text-amber-600'>
                            <AlertTriangle className='h-4 w-4' />
                            <span className='text-sm font-medium'>Not provided</span>
                          </div>
                        )}
                      </div>

                      <div className='flex items-center justify-between p-4 bg-gray-50 border rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <Shield className='h-5 w-5 text-purple-600' />
                          <div>
                            <div className='font-medium text-gray-900'>Police Clearance</div>
                            <div className='text-xs text-gray-500'>Background check document</div>
                          </div>
                        </div>
                        {profile?.policeClearanceValid ? (
                          <div className='flex items-center gap-1 text-green-600'>
                            <CheckCircle className='h-4 w-4' />
                            <span className='text-sm font-medium'>Verified</span>
                          </div>
                        ) : (
                          <div className='flex items-center gap-1 text-amber-600'>
                            <AlertTriangle className='h-4 w-4' />
                            <span className='text-sm font-medium'>Not provided</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video CV Controls + Preview */}
                  <div className='space-y-4'>
                    <h4 className='text-md font-semibold text-gray-900 flex items-center gap-2'>
                      <Video className='h-5 w-5 text-blue-600' />
                      Video CV
                    </h4>
                    <div className='border rounded-lg p-4'>
                      <VideoCV onVideoChange={handleVideoCvChange} minDuration={20} maxDuration={90} disabled={isUploadingVideo} />
                    </div>
                    {isUploadingVideo && (
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <div className='flex items-center gap-3'>
                          <Loader2 className='h-5 w-5 text-blue-600 animate-spin' />
                          <div className='flex-1'>
                            <p className='text-sm font-medium text-blue-900'>Uploading Video CV...</p>
                            <Progress value={videoUploadProgress} className='h-2 mt-2' />
                            <p className='text-xs text-blue-700 mt-1'>{videoUploadProgress}% complete</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {profile?.introductionVideoUrl && !isUploadingVideo && (
                      <div className='bg-black/5 border rounded-lg p-3'>
                        {profile.introductionVideoUrl.startsWith('http://') ||
                         profile.introductionVideoUrl.startsWith('https://') ||
                         profile.introductionVideoUrl.startsWith('data:') ||
                         profile.introductionVideoUrl.startsWith('blob:') ? (
                          <>
                            <video
                              controls
                              className='w-full rounded-md border bg-black'
                              src={profile.introductionVideoUrl}
                            />
                            <p className='text-xs text-gray-500 mt-2'>Your current published Video CV.</p>
                          </>
                        ) : (
                          <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                            <div className='flex items-center gap-2 text-amber-700'>
                              <AlertTriangle className='h-5 w-5' />
                              <span className='font-medium'>Video recorded on mobile device</span>
                            </div>
                            <p className='text-sm text-amber-600 mt-2'>
                              Your Video CV was recorded on the mobile app and stored locally.
                              Please record a new video using the recorder above to make it available on web.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Additional Document Uploads */}
                  <div className='space-y-3'>
                    <h4 className='text-md font-semibold text-gray-900'>Additional Documents</h4>
                    <AdditionalDocuments
                      documents={uploadedDocuments}
                      onDocumentsChange={handleDocumentsChange}
                      maxDocuments={8}
                      className='mt-2'
                    />
                  </div>
                </TabsContent>

                {/* Professional Information Tab */}
                <TabsContent
                  value='professional'
                  className='space-y-8'
                  role='tabpanel'
                  aria-labelledby='professional-tab'
                  tabIndex={0}
                >
                  <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <Briefcase className='h-5 w-5 text-purple-600 mt-0.5' />
                      <div>
                        <h3 className='font-semibold text-purple-900 mb-1'>Professional Details</h3>
                        <p className='text-sm text-purple-700'>
                          Highlight your professional skills and experience to stand out to employers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profession and Experience */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='primaryProfession' className='text-sm font-semibold text-gray-900'>
                        Primary Profession <span className='text-red-500'>*</span>
                      </Label>
                      {editMode ? (
                        <Select
                          name='primaryProfession'
                          value={formData.primaryProfession}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, primaryProfession: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger className={validationErrors.primaryProfession ? 'border-red-500' : ''}>
                            <SelectValue placeholder='Select your primary profession' />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map(position => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.primaryProfession || 'Not provided'}
                        </p>
                      )}
                      {validationErrors.primaryProfession && (
                        <p className='text-sm text-red-600'>{validationErrors.primaryProfession}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='totalExperienceYears' className='text-sm font-semibold text-gray-900'>
                        Total Experience (Years) <span className='text-red-500'>*</span>
                      </Label>
                      {editMode ? (
                        <Input
                          id='totalExperienceYears'
                          name='totalExperienceYears'
                          type='number'
                          min='0'
                          max='50'
                          value={formData.totalExperienceYears || ''}
                          onChange={handleInputChange}
                          placeholder='Years of experience'
                          className={validationErrors.totalExperienceYears ? 'border-red-500' : ''}
                          required
                        />
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.totalExperienceYears || 0} years
                        </p>
                      )}
                      {validationErrors.totalExperienceYears && (
                        <p className='text-sm text-red-600'>{validationErrors.totalExperienceYears}</p>
                      )}
                    </div>
                  </div>

                  {/* Visa Status and Education */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='currentVisaStatus' className='text-sm font-semibold text-gray-900'>
                        Current Visa Status
                      </Label>
                      {editMode ? (
                        <Select
                          name='currentVisaStatus'
                          value={formData.currentVisaStatus}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, currentVisaStatus: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select your visa status' />
                          </SelectTrigger>
                          <SelectContent>
                            {visaStatuses.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.currentVisaStatus || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='educationLevel' className='text-sm font-semibold text-gray-900'>
                        Education Level
                      </Label>
                      {editMode ? (
                        <Select
                          name='educationLevel'
                          value={formData.educationLevel}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, educationLevel: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select education level' />
                          </SelectTrigger>
                          <SelectContent>
                            {EDUCATION_LEVELS.map(level => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.educationLevel || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Languages */}
                  <div className='space-y-2'>
                    <Label className='text-sm font-semibold text-gray-900'>
                      Languages Spoken <span className='text-red-500'>*</span>
                    </Label>
                    {editMode ? (
                      <div>
                        <MultiSelect
                          options={languages}
                          selected={formData.languagesSpoken || []}
                          onChange={(value) => handleArrayChange('languagesSpoken', value)}
                          placeholder='Select languages you speak fluently'
                          className={validationErrors.languagesSpoken ? 'border-red-500' : ''}
                          aria-describedby='languages-description languages-error'
                        />
                        <div id='languages-description' className='sr-only'>
                          {(formData.languagesSpoken || []).length} language{(formData.languagesSpoken || []).length !== 1 ? 's' : ''} selected
                        </div>
                      </div>
                    ) : (
                      <div className='flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px]' role='list' aria-label='Selected languages'>
                        {(profile?.languagesSpoken || []).length > 0 ? (
                          (profile?.languagesSpoken || []).map((language, index) => (
                            <Badge key={index} variant='secondary' className='bg-blue-100 text-blue-800' role='listitem'>
                              {language}
                            </Badge>
                          ))
                        ) : (
                          <span className='text-gray-500'>No languages selected</span>
                        )}
                      </div>
                    )}
                    {validationErrors.languagesSpoken && (
                      <p id='languages-error' className='text-sm text-red-600' role='alert' aria-live='polite'>
                        {validationErrors.languagesSpoken}
                      </p>
                    )}
                  </div>

                  {/* Special Skills */}
                  <div className='space-y-2'>
                    <Label className='text-sm font-semibold text-gray-900'>
                      Special Skills & Certifications
                      <span className='text-gray-500 text-xs ml-1'>(highly recommended)</span>
                    </Label>
                    {editMode ? (
                      <MultiSelect
                        options={SPECIAL_SKILLS}
                        selected={formData.specialSkills || []}
                        onChange={(value) => handleArrayChange('specialSkills', value)}
                        placeholder='Select your certifications and special skills'
                      />
                    ) : (
                      <div className='flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px]'>
                        {(profile?.specialSkills || []).length > 0 ? (
                          (profile?.specialSkills || []).map((skill, index) => (
                            <Badge key={index} variant='secondary' className='bg-green-100 text-green-800'>
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className='text-gray-500'>No special skills selected</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Key Responsibilities */}
                  <div className='space-y-2'>
                    <Label className='text-sm font-semibold text-gray-900'>
                      Key Responsibilities & Services
                    </Label>
                    {editMode ? (
                      <MultiSelect
                        options={KEY_RESPONSIBILITIES}
                        selected={formData.keyResponsibilities || []}
                        onChange={(value) => handleArrayChange('keyResponsibilities', value)}
                        placeholder='Select the services you can provide'
                      />
                    ) : (
                      <div className='flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px]'>
                        {(profile?.keyResponsibilities || []).length > 0 ? (
                          (profile?.keyResponsibilities || []).map((responsibility, index) => (
                            <Badge key={index} variant='outline' className='bg-purple-50 text-purple-700'>
                              {responsibility}
                            </Badge>
                          ))
                        ) : (
                          <span className='text-gray-500'>No responsibilities selected</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Previous Countries */}
                  <div className='space-y-2'>
                    <Label className='text-sm font-semibold text-gray-900'>
                      Previous Countries Worked In
                    </Label>
                    {editMode ? (
                      <MultiSelect
                        options={gccCountries}
                        selected={formData.previousCountries || []}
                        onChange={(value) => handleArrayChange('previousCountries', value)}
                        placeholder='Select countries where you have worked before'
                      />
                    ) : (
                      <div className='flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px]'>
                        {(profile?.previousCountries || []).length > 0 ? (
                          (profile?.previousCountries || []).map((country, index) => (
                            <Badge key={index} variant='secondary' className='bg-orange-100 text-orange-800'>
                              {country}
                            </Badge>
                          ))
                        ) : (
                          <span className='text-gray-500'>No previous countries</span>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent
                  value='experience'
                  className='space-y-8'
                  role='tabpanel'
                  aria-labelledby='experience-tab'
                  tabIndex={0}
                >
                  {formData.workHistory?.length > 0 && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <Calendar className='h-5 w-5 text-green-600 mt-0.5' />
                      <div>
                        <h3 className='font-semibold text-green-900 mb-1'>Work Experience</h3>
                        <p className='text-sm text-green-700'>
                          Share your work history to build trust with potential employers. Include your most recent positions.
                        </p>
                      </div>
                    </div>
                  </div>
                  )}
                  
                  {editMode && (
                    <div className='flex justify-end mb-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            workHistory: [
                              ...(prev.workHistory || []),
                              { country: '', employerType: '', customEmployerType: '', duration: '', keyResponsibilities: [], reasonForLeaving: '', optional: true },
                            ],
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        className='gap-1'
                      >
                        <Plus className='w-4 h-4' />
                        Add Work Experience (optional)
                      </Button>
                    </div>
                  )}

                  {formData.workHistory?.length > 0 && formData.workHistory.map((work, index) => (
                    <Card key={index} className='border-l-4 border-l-purple-500 shadow-sm'>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Badge variant='outline' className='w-6 h-6 rounded-full p-0 flex items-center justify-center'>
                            {index + 1}
                          </Badge>
                          Position #{index + 1} {index === 0 ? '(Most Recent)' : '(Previous)'}
                          {editMode && (
                            <span className='ml-auto flex items-center gap-2'>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => handleMoveWork(index, 'up')}
                                disabled={index === 0}
                                title='Move up'
                              >
                                <ArrowUp className='w-4 h-4' />
                              </Button>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => handleMoveWork(index, 'down')}
                                disabled={index === (formData.workHistory?.length || 1) - 1}
                                title='Move down'
                              >
                                <ArrowDown className='w-4 h-4' />
                              </Button>
                              {work?.optional && (
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  onClick={() => handleRemoveWork(index)}
                                  title='Remove'
                                >
                                  <X className='w-4 h-4' />
                                </Button>
                              )}
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label className='text-sm font-semibold text-gray-900'>Country</Label>
                            {editMode ? (
                              <Select
                                value={work.country}
                                onValueChange={(value) => handleWorkHistoryChange(index, 'country', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder='Select country' />
                                </SelectTrigger>
                                <SelectContent>
                                  {gccCountries.map(country => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className='text-gray-800 py-2 px-3 bg-gray-50 rounded-md'>
                                {work.country || 'Not provided'}
                              </p>
                            )}
                          </div>

                          <div className='space-y-2'>
                            <Label className='text-sm font-semibold text-gray-900'>Duration</Label>
                            {editMode ? (
                              <Input
                                value={work.duration}
                                onChange={(e) => handleWorkHistoryChange(index, 'duration', e.target.value)}
                                placeholder='e.g., 2 years 3 months'
                              />
                            ) : (
                              <p className='text-gray-800 py-2 px-3 bg-gray-50 rounded-md'>
                                {work.duration || 'Not provided'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-gray-900'>Employer Type</Label>
                          {editMode ? (
                            <div className='space-y-2'>
                              <Select
                                value={work.employerType}
                                onValueChange={(value) => handleWorkHistoryChange(index, 'employerType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder='Select employer type' />
                                </SelectTrigger>
                                <SelectContent>
                                  {EMPLOYER_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {work.employerType === 'Other' && (
                                <Input
                                  value={work.customEmployerType}
                                  onChange={(e) => handleWorkHistoryChange(index, 'customEmployerType', e.target.value)}
                                  placeholder='Please specify employer type'
                                  className='mt-2'
                                />
                              )}
                            </div>
                          ) : (
                            <p className='text-gray-800 py-2 px-3 bg-gray-50 rounded-md'>
                              {work.employerType === 'Other' && work.customEmployerType
                                ? work.customEmployerType
                                : work.employerType || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-gray-900'>Key Responsibilities</Label>
                          {editMode ? (
                            <MultiSelect
                              options={KEY_RESPONSIBILITIES}
                              selected={work.keyResponsibilities || []}
                              onChange={(value) => handleWorkHistoryChange(index, 'keyResponsibilities', value)}
                              placeholder='Select responsibilities for this position'
                            />
                          ) : (
                            <div className='flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px]'>
                              {(work.keyResponsibilities || []).length > 0 ? (
                                (work.keyResponsibilities || []).map((responsibility, respIndex) => (
                                  <Badge key={respIndex} variant='outline' className='bg-blue-50 text-blue-700'>
                                    {responsibility}
                                  </Badge>
                                ))
                              ) : (
                                <span className='text-gray-500'>No responsibilities listed</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-sm font-semibold text-gray-900'>Reason for Leaving</Label>
                          {editMode ? (
                            <Select
                              value={work.reasonForLeaving}
                              onValueChange={(value) => handleWorkHistoryChange(index, 'reasonForLeaving', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select reason' />
                              </SelectTrigger>
                              <SelectContent>
                                {REASONS_FOR_LEAVING.map((reason) => (
                                  <SelectItem key={reason} value={reason}>
                                    {reason}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className='text-gray-800 py-2 px-3 bg-gray-50 rounded-md'>
                              {work.reasonForLeaving || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent
                  value='preferences'
                  className='space-y-8'
                  role='tabpanel'
                  aria-labelledby='preferences-tab'
                  tabIndex={0}
                >
                  <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <Globe className='h-5 w-5 text-orange-600 mt-0.5' />
                      <div>
                        <h3 className='font-semibold text-orange-900 mb-1'>Work Preferences</h3>
                        <p className='text-sm text-orange-700'>
                          Set your expectations and preferences to match with the right employers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Salary and Availability */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='salaryExpectations' className='text-sm font-semibold text-gray-900'>
                        Monthly Salary Expectations <span className='text-red-500'>*</span>
                      </Label>
                      {editMode ? (
                        <div className='flex gap-2'>
                          <Input
                            id='salaryExpectations'
                            name='salaryExpectations'
                            type='number'
                            value={formData.salaryExpectations || ''}
                            onChange={handleInputChange}
                            placeholder='Enter amount'
                            className={`flex-1 ${validationErrors.salaryExpectations ? 'border-red-500' : ''}`}
                            required
                          />
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => {
                              setFormData(prev => ({ ...prev, currency: value }));
                              setHasUnsavedChanges(true);
                            }}
                          >
                            <SelectTrigger className='w-24'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='AED'>AED</SelectItem>
                              <SelectItem value='SAR'>SAR</SelectItem>
                              <SelectItem value='USD'>USD</SelectItem>
                              <SelectItem value='QAR'>QAR</SelectItem>
                              <SelectItem value='KWD'>KWD</SelectItem>
                              <SelectItem value='BHD'>BHD</SelectItem>
                              <SelectItem value='OMR'>OMR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.salaryExpectations ?
                            `${profile.salaryExpectations} ${profile.currency}` :
                            'Not provided'}
                        </p>
                      )}
                      {validationErrors.salaryExpectations && (
                        <p className='text-sm text-red-600'>{validationErrors.salaryExpectations}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='availability' className='text-sm font-semibold text-gray-900'>
                        Availability Status
                      </Label>
                      {editMode ? (
                        <Select
                          name='availability'
                          value={formData.availability}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, availability: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select availability' />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABILITY_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className='py-2 px-3 bg-gray-50 rounded-md'>
                          <Badge className={getAvailabilityOption(profile?.availability).color}>
                            {getAvailabilityOption(profile?.availability).label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contract Preference */}
                  <div className='grid grid-cols-1 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='contractPreference' className='text-sm font-semibold text-gray-900'>
                        Contract Duration Preference
                      </Label>
                      {editMode ? (
                        <Select
                          name='contractPreference'
                          value={formData.contractPreference}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, contractPreference: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select contract preference' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='1 year'>1 Year</SelectItem>
                            <SelectItem value='1-year'>1 Year</SelectItem>
                            <SelectItem value='2 years'>2 Years</SelectItem>
                            <SelectItem value='2-years'>2 Years</SelectItem>
                            <SelectItem value='flexible'>Flexible</SelectItem>
                            <SelectItem value='long-term'>Long-term (3+ years)</SelectItem>
                            <SelectItem value='3+ years'>3+ Years</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.contractPreference || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='livingArrangement' className='text-sm font-semibold text-gray-900'>
                        Living Arrangement Preference
                      </Label>
                      {editMode ? (
                        <Select
                          name='livingArrangement'
                          value={formData.livingArrangement}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, livingArrangement: value }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select living arrangement' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='live-in'>🏠 Live-in (Stay with employer)</SelectItem>
                            <SelectItem value='live-out'>🚗 Live-out (Go home daily)</SelectItem>
                            <SelectItem value='both'>🤝 Either (Flexible)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md'>
                          {profile?.livingArrangement === 'live-in' ? '🏠 Live-in (Stay with employer)' :
                           profile?.livingArrangement === 'live-out' ? '🚗 Live-out (Go home daily)' :
                           profile?.livingArrangement === 'both' ? '🤝 Either (Flexible)' :
                           'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Work Preferences */}
                  <div className='space-y-2'>
                    <Label className='text-sm font-semibold text-gray-900'>
                      Additional Work Preferences
                    </Label>
                    {editMode ? (
                      <MultiSelect
                        options={workPreferenceOptions}
                        selected={formData.workPreferences || []}
                        onChange={(value) => handleArrayChange('workPreferences', value)}
                        placeholder='Select your work preferences and requirements'
                      />
                    ) : (
                      <div className='flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px]'>
                        {(profile?.workPreferences || []).length > 0 ? (
                          (profile?.workPreferences || []).map((preference, index) => (
                            <Badge key={index} variant='secondary' className='bg-indigo-100 text-indigo-800'>
                              {preference}
                            </Badge>
                          ))
                        ) : (
                          <span className='text-gray-500'>No specific preferences</span>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Additional Information Tab */}
                <TabsContent
                  value='additional'
                  className='space-y-8'
                  role='tabpanel'
                  aria-labelledby='additional-tab'
                  tabIndex={0}
                >
                  <div className='bg-pink-50 border border-pink-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <FileText className='h-5 w-5 text-pink-600 mt-0.5' />
                      <div>
                        <h3 className='font-semibold text-pink-900 mb-1'>About You & Contact</h3>
                        <p className='text-sm text-pink-700'>
                          Tell your story and provide contact information for interested employers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* About Me Section */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor='aboutMe' className='text-sm font-semibold text-gray-900'>
                        About Me <span className='text-red-500'>*</span>
                      </Label>
                      {editMode && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleGenerateAboutMe}
                          disabled={isGeneratingAboutMe}
                          className='flex items-center gap-2 text-xs'
                        >
                          {isGeneratingAboutMe ? (
                            <>
                              <Loader2 className='w-3 h-3 animate-spin' />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className='w-3 h-3' />
                              AI Generate
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <p className='text-xs text-gray-600 mb-2'>
                      Write a compelling description about yourself, your work ethic, personality, and what makes you special.
                      This is the first thing employers read!
                      {editMode && <span className='text-purple-600 font-medium'> Or click "AI Generate" to create one automatically.</span>}
                    </p>
                    {editMode ? (
                      <div className='space-y-2'>
                        <Textarea
                          id='aboutMe'
                          name='aboutMe'
                          value={formData.aboutMe || ''}
                          onChange={handleInputChange}
                          placeholder='Tell potential employers about yourself, your personality, work ethic, and what makes you a great domestic worker. Be specific about your experience and strengths. For example: "I am a dedicated and caring professional with 5 years of experience..." Or click "AI Generate" to create a personalized description automatically.'
                          rows={8}
                          className={`resize-none ${validationErrors.aboutMe ? 'border-red-500' : ''}`}
                          required
                        />
                        <div className='flex justify-between items-center text-xs'>
                          <span className={`${(formData.aboutMe?.length || 0) < 100 ? 'text-red-600' : 'text-gray-500'}`}>
                            {(formData.aboutMe?.length || 0) < 100 ?
                              `Minimum 100 characters required (${formData.aboutMe?.length || 0}/100)` :
                              `${formData.aboutMe?.length || 0}/1000 characters`}
                          </span>
                          <span className='text-gray-500'>
                            {1000 - (formData.aboutMe?.length || 0)} characters remaining
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className='text-gray-800 whitespace-pre-wrap py-4 px-4 bg-gray-50 rounded-md min-h-[120px] border'>
                        {profile?.aboutMe || (
                          <span className='text-gray-500 italic'>
                            Complete your About Me section to help employers understand your unique strengths and experience.
                          </span>
                        )}
                      </div>
                    )}
                    {validationErrors.aboutMe && (
                      <p className='text-sm text-red-600'>{validationErrors.aboutMe}</p>
                    )}
                  </div>

                  {/* Additional Notes removed per request */}

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                      <Phone className='h-5 w-5 text-purple-600' />
                      Contact Information
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <Label htmlFor='phoneNumber' className='text-sm font-semibold text-gray-900'>
                          Primary Phone Number
                        </Label>
                        {editMode ? (
                          <Input
                            id='phoneNumber'
                            name='phoneNumber'
                            value={formData.phoneNumber || ''}
                            onChange={handleInputChange}
                            placeholder='Your primary phone number'
                            type='tel'
                          />
                        ) : (
                          <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md flex items-center gap-2'>
                            <Phone className='h-4 w-4 text-gray-500' />
                            {profile?.phoneNumber || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='alternativePhoneNumber' className='text-sm font-semibold text-gray-900'>
                          Alternative Phone
                          <span className='text-gray-500 text-xs ml-1'>(optional)</span>
                        </Label>
                        {editMode ? (
                          <Input
                            id='alternativePhoneNumber'
                            name='alternativePhoneNumber'
                            value={formData.alternativePhoneNumber || ''}
                            onChange={handleInputChange}
                            placeholder='Alternative phone number'
                            type='tel'
                          />
                        ) : (
                          <p className='text-gray-800 font-medium py-2 px-3 bg-gray-50 rounded-md flex items-center gap-2'>
                            <Phone className='h-4 w-4 text-gray-500' />
                            {profile?.alternativePhoneNumber || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='mt-6 space-y-2'>
                      <Label htmlFor='email' className='text-sm font-semibold text-gray-900'>
                        Email Address
                      </Label>
                      <div className='py-2 px-3 bg-gray-100 rounded-md flex items-center gap-2'>
                        <Mail className='h-4 w-4 text-gray-500' />
                        <span className='text-gray-800 font-medium'>{profile?.email || 'Not provided'}</span>
                        <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
                          <CheckCircle className='h-3 w-3 mr-1' />
                          Verified
                        </Badge>
                      </div>
                      <p className='text-xs text-gray-500'>
                        Email cannot be changed from this page. Contact support if you need to update your email.
                      </p>
                    </div>
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaidProfilePage;
