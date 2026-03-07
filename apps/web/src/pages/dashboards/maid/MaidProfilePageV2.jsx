/**
 * Maid Profile Page V2 - Redesigned to Mirror Onboarding Steps
 *
 * Single-page scrollable layout with 10 card sections (one per onboarding step),
 * sticky sidebar navigation with per-section completion indicators.
 *
 * Sections:
 * 1. Personal Info       6. Experience
 * 2. Identity             7. Preferences
 * 3. Current Location     8. About Me
 * 4. Profession           9. Media Gallery
 * 5. Skills & Languages  10. Consents
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  User,
  MapPin,
  Briefcase,
  Heart,
  Video,
  Camera,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Image,
  ChevronLeft,
  ChevronRight,
  Wrench,
  CheckSquare,
  Globe,
  Calendar,
  Users,
  Plus,
  Check,
  Copy,
  Sparkles,
  Upload,
  Trash2,
  Shield,
  Bell,
  ExternalLink,
  DollarSign,
} from 'lucide-react';

import MultiSelect from '@/components/ui/multi-select';
import { DropdownDatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/contexts/AuthContext';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { uploadProfilePhoto, uploadVideoCV, uploadDocument, getStoredToken, getIdToken, updateProfileViaFunction } from '@/lib/firebaseClient';
import { differenceInYears } from 'date-fns';
import { getProfileCompletionStatus } from '@/lib/profileCompletion';
import { ProfileSkeleton } from '@/components/ui/loading-states';
import {
  nationalities,
  religions,
  maritalStatuses,
  positions,
  visaStatuses,
  educationLevels,
  skills as skillOptions,
  languages as languageOptions,
  gccCountries,
  workPreferences as workPreferenceOptions,
  contractTypes,
  countries,
} from '@/data/maidProfileData';

// =====================================================
// CONSTANTS
// =====================================================

const SECTION_CONFIG = [
  { id: 'personal', title: 'Personal Info', subtitle: 'Basic Details', icon: User, step: 1 },
  { id: 'identity', title: 'Identity', subtitle: 'Photo & Passport', icon: Camera, step: 2 },
  { id: 'location', title: 'Location', subtitle: 'Address Details', icon: MapPin, step: 3 },
  { id: 'profession', title: 'Profession', subtitle: 'Work Details', icon: Briefcase, step: 4 },
  { id: 'skills', title: 'Skills', subtitle: 'Your Expertise', icon: Wrench, step: 5 },
  { id: 'experience', title: 'Experience', subtitle: 'Work History', icon: Clock, step: 6 },
  { id: 'preferences', title: 'Preferences', subtitle: 'Work Terms', icon: Heart, step: 7 },
  { id: 'about', title: 'About Me', subtitle: 'Your Story', icon: FileText, step: 8 },
  { id: 'media', title: 'Media', subtitle: 'Photos & Video', icon: Video, step: 9 },
  { id: 'consents', title: 'Consents', subtitle: 'Agreements', icon: CheckSquare, step: 10 },
];

const SKILL_EMOJIS = {
  'Cooking': '👨‍🍳',
  'Cleaning': '🧹',
  'Childcare': '👶',
  'Eldercare': '👵',
  'Laundry': '👕',
  'Ironing': '👔',
  'Pet Care': '🐕',
  'Gardening': '🌱',
  'Driving': '🚗',
  'First Aid': '🏥',
  'Computer Skills': '💻',
  'Language Skills': '🗣️',
  'Sewing': '🧵',
  'Tutoring': '📚',
  'Massage Therapy': '💆',
};

const LANGUAGE_FLAGS = {
  'English': '🇬🇧',
  'Arabic': '🇸🇦',
  'Hindi': '🇮🇳',
  'Urdu': '🇵🇰',
  'Tagalog': '🇵🇭',
  'Indonesian': '🇮🇩',
  'Sinhala': '🇱🇰',
  'Tamil': '🇮🇳',
  'Bengali': '🇧🇩',
  'Nepali': '🇳🇵',
  'Amharic': '🇪🇹',
  'Tigrinya': '🇪🇷',
  'Oromo (Afaan Oromo)': '🇪🇹',
  'French': '🇫🇷',
  'Spanish': '🇪🇸',
  'Other': '🌐',
};

const PROFESSION_EMOJIS = {
  'Housemaid': '🏠',
  'Nanny': '👶',
  'Cook': '👨‍🍳',
  'Cleaner': '🧹',
  'Caregiver': '❤️',
  'Driver': '🚗',
  'Gardener': '🌱',
  'General Helper': '🤝',
  'Baby Sitter': '👶',
  'Elder Care': '👵',
  'Other': '💼',
};

const WORK_PREF_EMOJIS = {
  'Live-in': '🏠',
  'Live-out': '🚶',
  'Part-time': '⏰',
  'Full-time': '📅',
  'Flexible hours': '🔄',
  'Weekend only': '📆',
  'Weekdays only': '📋',
};

const GCC_COUNTRY_FLAGS = {
  'Saudi Arabia': '🇸🇦',
  'United Arab Emirates': '🇦🇪',
  'Kuwait': '🇰🇼',
  'Qatar': '🇶🇦',
  'Bahrain': '🇧🇭',
  'Oman': '🇴🇲',
};

const COUNTRY_FLAGS = {
  ...GCC_COUNTRY_FLAGS,
  'Ethiopia': '🇪🇹',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Sri Lanka': '🇱🇰',
  'India': '🇮🇳',
  'Bangladesh': '🇧🇩',
  'Nepal': '🇳🇵',
  'Pakistan': '🇵🇰',
  'Kenya': '🇰🇪',
  'Uganda': '🇺🇬',
  'Tanzania': '🇹🇿',
  'Egypt': '🇪🇬',
  'Morocco': '🇲🇦',
  'Sudan': '🇸🇩',
  'Eritrea': '🇪🇷',
  'Somalia': '🇸🇴',
  'Lebanon': '🇱🇧',
  'Jordan': '🇯🇴',
};

const CITIES_BY_COUNTRY = {
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Taif', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Abha', 'Najran', 'Jizan', 'Yanbu', 'Al Ahsa', 'Jubail'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra', 'Ahmadi', 'Mangaf', 'Fahaheel'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor', 'Al Rayyan', 'Umm Salal', 'Mesaieed'],
  'Bahrain': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri', 'Seeb', 'Barka'],
  'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama', 'Hawassa', 'Bahir Dar', 'Dessie', 'Jimma', 'Jijiga', 'Harar'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi'],
  'Uganda': ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Entebbe'],
  'Philippines': ['Manila', 'Quezon City', 'Davao City', 'Cebu City', 'Makati', 'Pasig'],
  'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar'],
  'Sri Lanka': ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Kochi'],
  'Bangladesh': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet'],
  'Nepal': ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bharatpur'],
  'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi'],
  'Tanzania': ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Zanzibar City'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Port Said', 'Suez', 'Luxor'],
};

const EXPERIENCE_INFO = {
  'No Experience': { color: 'blue', description: 'Perfect for families who want to train' },
  '1-2 years': { color: 'green', description: 'Basic experience, knows fundamentals' },
  '3-5 years': { color: 'yellow', description: 'Skilled worker, minimal supervision' },
  '6-10 years': { color: 'orange', description: 'Highly experienced, very reliable' },
  '10+ years': { color: 'purple', description: 'Expert level, can manage households' },
};

const CONSENT_ITEMS = [
  { id: 'termsAccepted', title: 'Terms of Service', description: 'I agree to the Terms of Service', icon: FileText, required: true, link: '/terms' },
  { id: 'privacyAccepted', title: 'Privacy Policy', description: 'I consent to the collection and use of my personal data', icon: Shield, required: true, link: '/privacy' },
  { id: 'backgroundCheckConsent', title: 'Background Check', description: 'I consent to background verification for employment purposes', icon: Users, required: true, link: null },
  { id: 'communicationConsent', title: 'Communication', description: 'I agree to receive job opportunities and platform updates', icon: Bell, required: false, link: null },
];

// =====================================================
// GRAPHQL
// =====================================================

const GET_MAID_PROFILE = gql`
  query GetMaidProfile($userId: String!) {
    maid_profiles(where: { _or: [{ id: { _eq: $userId } }, { user_id: { _eq: $userId } }] }, limit: 1) {
      id
      user_id
      full_name
      first_name
      middle_name
      last_name
      date_of_birth
      nationality
      religion
      religion_other
      marital_status
      children_count
      country
      state_province
      street_address
      primary_profession
      primary_profession_other
      current_visa_status
      current_visa_status_other
      education_level
      skills
      languages
      experience_years
      previous_countries
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      available_from
      work_preferences
      contract_duration_preference
      live_in_preference
      about_me
      profile_photo_url
      introduction_video_url
      profile_completion_percentage
      availability_status
      verification_status
      phone_country_code
      phone_number
      alternative_phone
      current_location
      passport_number
      passport_expiry
      visa_status
      medical_certificate_valid
      police_clearance_valid
      is_agency_managed
      agency_id
      key_responsibilities
      work_history
      additional_notes
      created_at
      updated_at
    }
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

// NOTE: UPDATE_MAID_PROFILE removed — maid role has no UPDATE permission on maid_profiles.
// All profile updates go through updateProfileViaFunction() Cloud Function with admin secret.

const INSERT_MAID_DOCUMENT = gql`
  mutation InsertMaidDocument($object: maid_documents_insert_input!) {
    insert_maid_documents_one(object: $object) {
      id
      type
      document_type
      file_url
      uploaded_at
    }
  }
`;

const DELETE_MAID_DOCUMENT = gql`
  mutation DeleteMaidDocument($id: uuid!) {
    delete_maid_documents_by_pk(id: $id) {
      id
    }
  }
`;

// =====================================================
// HELPERS
// =====================================================

const getGalleryPhotosFromDocs = (documents) => {
  if (!documents) return [];
  return documents
    .filter(doc => doc.type === 'gallery_photo' || doc.document_type === 'gallery_photo')
    .map(doc => ({ id: doc.id, url: doc.file_url || doc.document_url }))
    .filter(p => p.url);
};

const getPassportDocsFromDocs = (documents) => {
  if (!documents) return { front: null, back: null };
  // Support both new passport types and legacy id_front/id_back types
  const front = documents.find(doc =>
    doc.document_type === 'passport_front' || doc.type === 'passport_front' ||
    doc.document_type === 'id_front' || doc.type === 'id_front'
  );
  const back = documents.find(doc =>
    doc.document_type === 'passport_back' || doc.type === 'passport_back' ||
    doc.document_type === 'id_back' || doc.type === 'id_back'
  );
  return {
    front: front ? (front.file_url || front.document_url) : null,
    back: back ? (back.file_url || back.document_url) : null,
  };
};

const getDisplayValue = (item) => {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') return item.label || item.value || String(item);
  return String(item);
};

const normalizeArrayToStrings = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return item.value || item.label || String(item);
    return String(item);
  });
};

const formatSalary = (amount) => {
  if (!amount) return null;
  return `AED ${Number(amount).toLocaleString()}/month`;
};

const formatExperience = (years) => {
  if (years === null || years === undefined) return 'Not set';
  if (years === 0) return 'No Experience';
  if (years >= 10) return '10+ years';
  if (years >= 6) return '6-10 years';
  if (years >= 3) return '3-5 years';
  if (years >= 1) return '1-2 years';
  return 'Less than 1 year';
};

const getCountryFlag = (country) => COUNTRY_FLAGS[country] || '🌍';

const getExperienceInfo = (level) => EXPERIENCE_INFO[level] || { color: 'gray', description: '' };

const isSectionComplete = (profile, sectionId) => {
  if (!profile) return false;
  switch (sectionId) {
    case 'personal':
      return !!(profile.full_name && profile.date_of_birth && profile.nationality);
    case 'identity':
      return !!profile.profile_photo_url;
    case 'location':
      return !!(profile.country && profile.state_province);
    case 'profession':
      return !!profile.primary_profession;
    case 'skills':
      return !!(Array.isArray(profile.skills) && profile.skills.length > 0 && Array.isArray(profile.languages) && profile.languages.length > 0);
    case 'experience':
      return profile.experience_years !== null && profile.experience_years !== undefined;
    case 'preferences':
      return !!profile.preferred_salary_min;
    case 'about':
      return !!(profile.about_me && profile.about_me.length >= 50);
    case 'media':
      return !!(profile.introduction_video_url || (profile.gallery_photos && profile.gallery_photos.length > 0));
    case 'consents':
      return true;
    default:
      return false;
  }
};

// Bio templates adapted for snake_case profile fields
const BIO_TEMPLATES = [
  {
    label: 'Professional',
    emoji: '💼',
    generate: (p) =>
      `Dedicated and experienced ${p.primary_profession || 'domestic worker'} with ${formatExperience(p.experience_years)}. I specialize in ${(normalizeArrayToStrings(p.skills)).slice(0, 3).join(', ') || 'household tasks'} and speak ${(normalizeArrayToStrings(p.languages)).slice(0, 2).join(' and ') || 'multiple languages'}. Currently based in ${p.country || 'the GCC region'}, looking for a ${(normalizeArrayToStrings(p.work_preferences))[0] || 'full-time'} position.`,
  },
  {
    label: 'Friendly',
    emoji: '😊',
    generate: (p) =>
      `Hello! I'm a ${p.nationality || ''} ${p.primary_profession || 'domestic helper'} who loves taking care of families. With ${formatExperience(p.experience_years)}, I'm skilled in ${(normalizeArrayToStrings(p.skills)).slice(0, 2).join(' and ') || 'household management'}. I'm ${(p.marital_status || '').toLowerCase()}, reliable, and looking for a caring family in ${p.country || 'the GCC'}.`,
  },
  {
    label: 'Detailed',
    emoji: '📋',
    generate: (p) =>
      `Experienced ${p.primary_profession || 'household professional'} from ${p.nationality || 'abroad'} with ${formatExperience(p.experience_years)}. Key skills include ${(normalizeArrayToStrings(p.skills)).join(', ') || 'various household duties'}. Fluent in ${(normalizeArrayToStrings(p.languages)).join(', ') || 'multiple languages'}. ${(normalizeArrayToStrings(p.previous_countries)).length > 0 ? `Previously worked in ${normalizeArrayToStrings(p.previous_countries).join(', ')}.` : ''} Seeking ${p.preferred_salary_min ? `AED ${p.preferred_salary_min}` : 'competitive'} salary with ${(normalizeArrayToStrings(p.work_preferences))[0] || 'flexible'} arrangement.`,
  },
];

const MIN_BIO_CHARS = 50;
const MAX_BIO_CHARS = 500;

// =====================================================
// PROFILE HEADER
// =====================================================
const ProfileHeader = ({ profile, completionStatus, onEditPhoto }) => {
  const age = profile?.date_of_birth
    ? differenceInYears(new Date(), new Date(profile.date_of_birth))
    : null;

  return (
    <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
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
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile?.full_name || 'Your Name'}</h1>
            <p className="text-white/80 text-sm">
              {profile?.primary_profession && `${PROFESSION_EMOJIS[profile.primary_profession] || '💼'} ${profile.primary_profession}`}
              {!profile?.primary_profession && 'Profession not set'}
              {age && ` · ${age} years old`}
            </p>
            {profile?.country && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm">{getCountryFlag(profile.country)}</span>
                <span className="text-white/70 text-xs">
                  {profile.state_province ? `${profile.state_province}, ` : ''}{profile.country}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.availability_status === 'available' && (
                <Badge className="bg-green-500/20 text-green-200 border-green-500/30 text-xs">
                  Available
                </Badge>
              )}
              {profile?.profile_photo_url && (
                <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs">
                  Photo Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/80">Profile Completion</span>
            <span className="font-semibold">{completionStatus.percentage}%</span>
          </div>
          <Progress value={completionStatus.percentage} className="h-2 bg-white/20" />
          {completionStatus.status !== 'complete' && (
            <p className="text-white/60 text-xs mt-2">{completionStatus.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// SIDEBAR NAVIGATION
// =====================================================
const SidebarNav = ({ activeSection, profile, onSectionClick }) => (
  <nav className="space-y-1">
    {SECTION_CONFIG.map((section) => {
      const isActive = activeSection === section.id;
      const isComplete = isSectionComplete(profile, section.id);
      const Icon = section.icon;
      return (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
            isActive
              ? 'bg-purple-50 text-purple-700 font-medium border border-purple-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            isComplete
              ? 'bg-green-100 text-green-600'
              : isActive
                ? 'bg-purple-100 text-purple-600'
                : 'bg-gray-100 text-gray-400'
          }`}>
            {isComplete ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <span className="text-xs font-medium">{section.step}</span>
            )}
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="truncate">{section.title}</p>
            <p className={`text-xs truncate ${isActive ? 'text-purple-500' : 'text-gray-400'}`}>
              {section.subtitle}
            </p>
          </div>
        </button>
      );
    })}
  </nav>
);

// =====================================================
// MOBILE STEP INDICATOR
// =====================================================
const MobileStepIndicator = ({ activeSection, profile, onSectionClick }) => (
  <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none md:hidden">
    {SECTION_CONFIG.map((section) => {
      const isActive = activeSection === section.id;
      const isComplete = isSectionComplete(profile, section.id);
      const Icon = section.icon;
      return (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
            isActive
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : isComplete
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-500 border border-transparent'
          }`}
        >
          {isComplete && <Check className="w-3 h-3" />}
          <Icon className="w-3.5 h-3.5" />
          <span>{section.title}</span>
        </button>
      );
    })}
  </div>
);

// =====================================================
// SECTION WRAPPER
// =====================================================
const SectionWrapper = ({
  id,
  step,
  title,
  subtitle,
  icon: Icon,
  isComplete,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isSaving,
  editLabel = 'Edit',
  saveLabel = 'Save',
  noEditButton = false,
  children,
}) => (
  <Card id={`section-${id}`} className="scroll-mt-24">
    <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          isComplete ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-xs text-gray-400">Step {step} · {subtitle}</p>
        </div>
      </div>
      {!noEditButton && (
        !isEditing ? (
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            <Edit2 className="w-4 h-4 mr-1.5" />
            {editLabel}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              {saveLabel}
            </Button>
          </div>
        )
      )}
    </CardHeader>
    <CardContent className="px-6 pb-6">{children}</CardContent>
  </Card>
);

// =====================================================
// PROFILE FIELD
// =====================================================
const ProfileField = ({ label, value, icon: FieldIcon, isEditing, editComponent, emptyText = 'Not set' }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
      {FieldIcon && <FieldIcon className="w-3.5 h-3.5" />}
      {label}
    </Label>
    {isEditing ? (
      editComponent
    ) : (
      <p className="text-sm font-medium text-gray-900">
        {Array.isArray(value) ? (
          value.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {value.map((v, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {getDisplayValue(v)}
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-gray-400 font-normal">{emptyText}</span>
          )
        ) : value ? (
          getDisplayValue(value)
        ) : (
          <span className="text-gray-400 font-normal">{emptyText}</span>
        )}
      </p>
    )}
  </div>
);

// =====================================================
// SECTION 1: PERSONAL INFO
// =====================================================
const PersonalInfoSection = ({ profile, isEditing, editData, updateEditData, onEdit, onSave, onCancel, saving }) => {
  const age = profile?.date_of_birth
    ? differenceInYears(new Date(), new Date(profile.date_of_birth))
    : null;

  return (
    <SectionWrapper
      id="personal" step={1} title="Personal Info" subtitle="Basic Details"
      icon={User} isComplete={isSectionComplete(profile, 'personal')}
      isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} isSaving={saving}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProfileField
          label="Full Name" icon={User}
          value={profile?.full_name}
          isEditing={isEditing}
          editComponent={
            <Input value={editData.full_name || ''} onChange={(e) => updateEditData('full_name', e.target.value)} placeholder="Your full name" />
          }
        />
        <ProfileField
          label={`Date of Birth${age ? ` (${age} years)` : ''}`} icon={Calendar}
          value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null}
          isEditing={isEditing}
          editComponent={
            <DropdownDatePicker
              selected={editData.date_of_birth ? new Date(editData.date_of_birth) : null}
              onSelect={(date) => {
                if (date) {
                  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  updateEditData('date_of_birth', formatted);
                } else {
                  updateEditData('date_of_birth', null);
                }
              }}
            />
          }
        />
        <ProfileField
          label="Nationality" icon={Globe}
          value={profile?.nationality ? `${getCountryFlag(profile.nationality)} ${profile.nationality}` : null}
          isEditing={isEditing}
          editComponent={
            <Select value={editData.nationality || ''} onValueChange={(v) => updateEditData('nationality', v)}>
              <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
              <SelectContent>
                {nationalities.map((n) => (<SelectItem key={n} value={n}>{n}</SelectItem>))}
              </SelectContent>
            </Select>
          }
        />
        <ProfileField
          label="Religion" icon={Heart}
          value={profile?.religion}
          isEditing={isEditing}
          editComponent={
            <Select value={editData.religion || ''} onValueChange={(v) => updateEditData('religion', v)}>
              <SelectTrigger><SelectValue placeholder="Select religion" /></SelectTrigger>
              <SelectContent>
                {religions.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
          }
        />
        <ProfileField
          label="Marital Status" icon={Users}
          value={profile?.marital_status}
          isEditing={isEditing}
          editComponent={
            <Select value={editData.marital_status || ''} onValueChange={(v) => updateEditData('marital_status', v)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {maritalStatuses.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          }
        />
      </div>
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 2: IDENTITY VERIFICATION
// =====================================================
const IdentitySection = ({ profile, documents, userId, onProfileUpdate, onDocumentsUpdate }) => {
  const [uploading, setUploading] = useState(null);
  const passportDocs = getPassportDocsFromDocs(documents);
  const totalItems = 3;
  const completedItems = [profile?.profile_photo_url, passportDocs.front, passportDocs.back].filter(Boolean).length;

  const handleUpload = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    const cleanup = () => { if (input.parentNode) input.parentNode.removeChild(input); };
    input.addEventListener('cancel', cleanup);
    input.onchange = async (e) => {
      cleanup();
      const file = e.target.files[0];
      if (!file) return;
      try {
        setUploading(type);
        if (type === 'face') {
          const url = await uploadProfilePhoto(file, userId);
          // Save via Cloud Function (maid role has no direct UPDATE permission)
          await updateProfileViaFunction('maid', { ...profile, profile_photo_url: url });
          onProfileUpdate({ profile_photo_url: url });
        } else {
          const result = await uploadDocument(userId, file, type);
          const fileUrl = result.url || result;
          // Delete existing document of same type before inserting new one
          // Also check for legacy id_front/id_back types
          const legacyType = type === 'passport_front' ? 'id_front' : type === 'passport_back' ? 'id_back' : null;
          const existingDoc = documents?.find(d =>
            d.document_type === type || d.type === type ||
            (legacyType && (d.document_type === legacyType || d.type === legacyType))
          );
          if (existingDoc?.id) {
            try {
              await apolloClient.mutate({ mutation: DELETE_MAID_DOCUMENT, variables: { id: existingDoc.id } });
            } catch (delErr) {
              // Could not delete old doc - continue
            }
          }
          await apolloClient.mutate({
            mutation: INSERT_MAID_DOCUMENT,
            variables: { object: { maid_id: userId, type, document_type: type, file_url: fileUrl } },
          });
          onDocumentsUpdate();
        }
        toast({ title: 'Uploaded!', description: `${type === 'face' ? 'Photo' : 'Document'} uploaded successfully.` });
      } catch (error) {
        console.error('[IdentitySection] Upload failed:', error);
        toast({ title: 'Upload failed', description: error?.message || 'Please try again.', variant: 'destructive' });
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  return (
    <SectionWrapper
      id="identity" step={2} title="Identity Verification" subtitle="Photo & Passport"
      icon={Camera} isComplete={completedItems === totalItems} noEditButton
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Verification progress</span>
          <span className="font-medium text-gray-700">{completedItems}/{totalItems} complete</span>
        </div>
        <Progress value={(completedItems / totalItems) * 100} className="h-2" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* Face Photo */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Face Photo</Label>
            {profile?.profile_photo_url ? (
              <div className="space-y-2">
                <div className="relative aspect-[3/4] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <img src={profile.profile_photo_url} alt="Face" className="w-full h-full object-cover" />
                </div>
                <Button size="sm" variant="outline" onClick={() => handleUpload('face')} disabled={!!uploading} className="w-full text-xs">
                  {uploading === 'face' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1" />}
                  Change Photo
                </Button>
              </div>
            ) : (
              <div className="relative aspect-[3/4] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden">
                <button
                  onClick={() => handleUpload('face')}
                  disabled={!!uploading}
                  className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {uploading === 'face' ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8 mb-2" />}
                  <span className="text-xs">Upload Photo</span>
                </button>
              </div>
            )}
          </div>

          {/* Passport Photo Page */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Passport Photo Page</Label>
            {passportDocs.front ? (
              <div className="space-y-2">
                <div className="relative aspect-[3/4] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <img src={passportDocs.front} alt="Passport Photo Page" className="w-full h-full object-cover" />
                </div>
                <Button size="sm" variant="outline" onClick={() => handleUpload('passport_front')} disabled={!!uploading} className="w-full text-xs">
                  {uploading === 'passport_front' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                  Change Passport
                </Button>
              </div>
            ) : (
              <div className="relative aspect-[3/4] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden">
                <button
                  onClick={() => handleUpload('passport_front')}
                  disabled={!!uploading}
                  className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {uploading === 'passport_front' ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8 mb-2" />}
                  <span className="text-xs">Upload Passport</span>
                </button>
              </div>
            )}
          </div>

          {/* Passport Visa Page */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Passport Visa Page</Label>
            {passportDocs.back ? (
              <div className="space-y-2">
                <div className="relative aspect-[3/4] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <img src={passportDocs.back} alt="Passport Visa Page" className="w-full h-full object-cover" />
                </div>
                <Button size="sm" variant="outline" onClick={() => handleUpload('passport_back')} disabled={!!uploading} className="w-full text-xs">
                  {uploading === 'passport_back' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                  Change Visa Page
                </Button>
              </div>
            ) : (
              <div className="relative aspect-[3/4] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden">
                <button
                  onClick={() => handleUpload('passport_back')}
                  disabled={!!uploading}
                  className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {uploading === 'passport_back' ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8 mb-2" />}
                  <span className="text-xs">Upload Visa Page</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 3: CURRENT LOCATION
// =====================================================
const LocationSection = ({ profile, isEditing, editData, updateEditData, onEdit, onSave, onCancel, saving }) => {
  const isGCC = gccCountries.includes(profile?.country);
  const cityOptions = CITIES_BY_COUNTRY[isEditing ? editData.country : profile?.country] || [];

  // Ordered countries: GCC first, then the rest
  const orderedCountries = [
    ...gccCountries,
    ...countries.filter(c => !gccCountries.includes(c)),
  ];

  return (
    <SectionWrapper
      id="location" step={3} title="Current Location" subtitle="Address Details"
      icon={MapPin} isComplete={isSectionComplete(profile, 'location')}
      isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} isSaving={saving}
    >
      {isGCC && !isEditing && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700">Located in GCC region - higher demand area</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProfileField
          label="Country" icon={Globe}
          value={profile?.country ? `${getCountryFlag(profile.country)} ${profile.country}` : null}
          isEditing={isEditing}
          editComponent={
            <Select value={editData.country || ''} onValueChange={(v) => { updateEditData('country', v); updateEditData('state_province', ''); }}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {orderedCountries.map((c, i) => (
                  <React.Fragment key={c}>
                    {i === gccCountries.length && <Separator className="my-1" />}
                    <SelectItem value={c}>
                      {getCountryFlag(c)} {c}
                    </SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <ProfileField
          label="City" icon={MapPin}
          value={profile?.state_province}
          isEditing={isEditing}
          editComponent={
            cityOptions.length > 0 ? (
              <Select value={editData.state_province || ''} onValueChange={(v) => updateEditData('state_province', v)}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cityOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={editData.state_province || ''} onChange={(e) => updateEditData('state_province', e.target.value)} placeholder="Enter city name" />
            )
          }
        />
        <div className="sm:col-span-2">
          <ProfileField
            label="Street Address"
            value={profile?.street_address}
            isEditing={isEditing}
            editComponent={
              <Input value={editData.street_address || ''} onChange={(e) => updateEditData('street_address', e.target.value)} placeholder="Street address (optional)" />
            }
          />
        </div>
      </div>
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 4: PROFESSION
// =====================================================
const ProfessionSection = ({ profile, isEditing, editData, updateEditData, onEdit, onSave, onCancel, saving }) => (
  <SectionWrapper
    id="profession" step={4} title="Profession" subtitle="Work Details"
    icon={Briefcase} isComplete={isSectionComplete(profile, 'profession')}
    isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} isSaving={saving}
  >
    {!isEditing && profile?.primary_profession && (
      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{PROFESSION_EMOJIS[profile.primary_profession] || '💼'}</span>
          <div>
            <p className="font-medium text-purple-800">{profile.primary_profession}</p>
            <p className="text-xs text-purple-600">High demand profession</p>
          </div>
        </div>
      </div>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ProfileField
        label="Primary Profession" icon={Briefcase}
        value={isEditing ? null : (profile?.primary_profession ? `${PROFESSION_EMOJIS[profile.primary_profession] || '💼'} ${profile.primary_profession}` : null)}
        isEditing={isEditing}
        editComponent={
          <Select value={editData.primary_profession || ''} onValueChange={(v) => updateEditData('primary_profession', v)}>
            <SelectTrigger><SelectValue placeholder="Select profession" /></SelectTrigger>
            <SelectContent>
              {positions.map((p) => (<SelectItem key={p} value={p}>{PROFESSION_EMOJIS[p] || '💼'} {p}</SelectItem>))}
            </SelectContent>
          </Select>
        }
      />
      <ProfileField
        label="Visa Status"
        value={profile?.current_visa_status}
        isEditing={isEditing}
        editComponent={
          <Select value={editData.current_visa_status || ''} onValueChange={(v) => updateEditData('current_visa_status', v)}>
            <SelectTrigger><SelectValue placeholder="Select visa status" /></SelectTrigger>
            <SelectContent>
              {visaStatuses.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        }
      />
      <ProfileField
        label="Education Level"
        value={profile?.education_level}
        isEditing={isEditing}
        editComponent={
          <Select value={editData.education_level || ''} onValueChange={(v) => updateEditData('education_level', v)}>
            <SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger>
            <SelectContent>
              {educationLevels.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  </SectionWrapper>
);

// =====================================================
// SECTION 5: SKILLS & LANGUAGES
// =====================================================
const SkillsSection = ({ profile, isEditing, editData, updateEditData, onEdit, onSave, onCancel, saving }) => {
  const [activeTab, setActiveTab] = useState('skills');
  const profileSkills = normalizeArrayToStrings(profile?.skills);
  const profileLangs = normalizeArrayToStrings(profile?.languages);
  const editSkills = normalizeArrayToStrings(editData.skills);
  const editLangs = normalizeArrayToStrings(editData.languages);

  const toggleItem = (field, item, currentList) => {
    const updated = currentList.includes(item)
      ? currentList.filter(i => i !== item)
      : [...currentList, item];
    updateEditData(field, updated);
  };

  return (
    <SectionWrapper
      id="skills" step={5} title="Skills & Languages" subtitle="Your Expertise"
      icon={Wrench} isComplete={isSectionComplete(profile, 'skills')}
      isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} isSaving={saving}
    >
      {/* Summary badges in view mode */}
      {!isEditing && (
        <div className="flex flex-wrap gap-2 mb-4">
          {profileSkills.length > 0 && (
            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
              {profileSkills.length} skill{profileSkills.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {profileLangs.length > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              {profileLangs.length} language{profileLangs.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {profileSkills.length >= 3 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Multi-skilled</Badge>
          )}
          {profileLangs.includes('English') && profileLangs.includes('Arabic') && (
            <Badge className="bg-green-100 text-green-700 border-green-200">Bilingual (EN+AR)</Badge>
          )}
        </div>
      )}

      {/* Tab toggle in edit mode */}
      {isEditing && (
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'skills' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            Skills ({editSkills.length})
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'languages' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            Languages ({editLangs.length})
          </button>
        </div>
      )}

      {/* Skills */}
      {(!isEditing || activeTab === 'skills') && (
        <div className="space-y-2">
          {!isEditing && <Label className="text-xs text-gray-500">Skills</Label>}
          <div className="grid grid-cols-2 gap-2">
            {(isEditing ? skillOptions : profileSkills).map((skill) => {
              const name = getDisplayValue(skill);
              const isSelected = isEditing ? editSkills.includes(name) : true;
              return (
                <button
                  key={name}
                  onClick={isEditing ? () => toggleItem('skills', name, editSkills) : undefined}
                  disabled={!isEditing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    isSelected
                      ? isEditing
                        ? 'bg-purple-50 border-purple-400 text-purple-700 font-medium'
                        : 'bg-gray-50 border-gray-200 text-gray-800'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span>{SKILL_EMOJIS[name] || '✨'}</span>
                  <span className="flex-1 truncate">{name}</span>
                  {isEditing && (isSelected ? <Check className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0 opacity-40" />)}
                </button>
              );
            })}
          </div>
          {!isEditing && profileSkills.length === 0 && (
            <p className="text-sm text-gray-400">No skills selected</p>
          )}
        </div>
      )}

      {/* Languages */}
      {(!isEditing || activeTab === 'languages') && (
        <div className={`space-y-2 ${!isEditing ? 'mt-4' : ''}`}>
          {!isEditing && <Label className="text-xs text-gray-500">Languages</Label>}
          <div className="grid grid-cols-2 gap-2">
            {(isEditing ? languageOptions : profileLangs).map((lang) => {
              const name = getDisplayValue(lang);
              const isSelected = isEditing ? editLangs.includes(name) : true;
              return (
                <button
                  key={name}
                  onClick={isEditing ? () => toggleItem('languages', name, editLangs) : undefined}
                  disabled={!isEditing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    isSelected
                      ? isEditing
                        ? 'bg-purple-50 border-purple-400 text-purple-700 font-medium'
                        : 'bg-gray-50 border-gray-200 text-gray-800'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span>{LANGUAGE_FLAGS[name] || '🌐'}</span>
                  <span className="flex-1 truncate">{name}</span>
                  {isEditing && (isSelected ? <Check className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0 opacity-40" />)}
                </button>
              );
            })}
          </div>
          {!isEditing && profileLangs.length === 0 && (
            <p className="text-sm text-gray-400">No languages selected</p>
          )}
        </div>
      )}
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 6: EXPERIENCE
// =====================================================
const ExperienceSection = ({ profile, isEditing, editData, updateEditData, onEdit, onSave, onCancel, saving }) => {
  const expLabel = formatExperience(profile?.experience_years);
  const expInfo = getExperienceInfo(expLabel);
  const prevCountries = normalizeArrayToStrings(profile?.previous_countries);
  const editCountries = normalizeArrayToStrings(editData.previous_countries);

  const toggleCountry = (country) => {
    const updated = editCountries.includes(country)
      ? editCountries.filter(c => c !== country)
      : [...editCountries, country];
    updateEditData('previous_countries', updated);
  };

  return (
    <SectionWrapper
      id="experience" step={6} title="Experience" subtitle="Work History"
      icon={Clock} isComplete={isSectionComplete(profile, 'experience')}
      isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} isSaving={saving}
    >
      {/* Experience level display */}
      {!isEditing && profile?.experience_years !== null && profile?.experience_years !== undefined && (
        <div className={`mb-4 p-3 rounded-lg border ${
          expInfo.color === 'purple' ? 'bg-purple-50 border-purple-200' :
          expInfo.color === 'orange' ? 'bg-orange-50 border-orange-200' :
          expInfo.color === 'yellow' ? 'bg-amber-50 border-amber-200' :
          expInfo.color === 'green' ? 'bg-green-50 border-green-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <p className="font-medium text-gray-800">{expLabel}</p>
          <p className="text-xs text-gray-500 mt-0.5">{expInfo.description}</p>
        </div>
      )}

      <div className="space-y-4">
        {isEditing && (
          <ProfileField
            label="Experience Level"
            isEditing
            editComponent={
              <Select value={String(editData.experience_years ?? '')} onValueChange={(v) => updateEditData('experience_years', parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
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
        )}

        {/* GCC Countries */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">GCC Countries Worked In</Label>
          {isEditing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gccCountries.map((country) => {
                const isSelected = editCountries.includes(country);
                return (
                  <button
                    key={country}
                    onClick={() => toggleCountry(country)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-400 text-purple-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{GCC_COUNTRY_FLAGS[country]}</span>
                    <span className="truncate">{country}</span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            prevCountries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {prevCountries.map((c) => (
                  <Badge key={c} variant="secondary" className="text-sm py-1 px-2.5">
                    {GCC_COUNTRY_FLAGS[c] || '🌍'} {c}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No previous GCC experience</p>
            )
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 7: PREFERENCES
// =====================================================
const PreferencesSection = ({ profile, isEditing, editData, updateEditData, onEdit, onSave, onCancel, saving }) => {
  const workPrefs = normalizeArrayToStrings(profile?.work_preferences);
  const editWorkPrefs = normalizeArrayToStrings(editData.work_preferences);

  const toggleWorkPref = (pref) => {
    const updated = editWorkPrefs.includes(pref)
      ? editWorkPrefs.filter(p => p !== pref)
      : [...editWorkPrefs, pref];
    updateEditData('work_preferences', updated);
  };

  return (
    <SectionWrapper
      id="preferences" step={7} title="Preferences" subtitle="Work Terms"
      icon={Heart} isComplete={isSectionComplete(profile, 'preferences')}
      isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} isSaving={saving}
    >
      <div className="space-y-4">
        {/* Salary */}
        <ProfileField
          label="Expected Salary" icon={DollarSign}
          value={formatSalary(profile?.preferred_salary_min)}
          isEditing={isEditing}
          editComponent={
            <Select value={String(editData.preferred_salary_min || '')} onValueChange={(v) => updateEditData('preferred_salary_min', parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Select salary range" /></SelectTrigger>
              <SelectContent>
                {[1000, 1500, 2000, 2500, 3000, 3500, 4000].map((s) => (
                  <SelectItem key={s} value={String(s)}>AED {s.toLocaleString()}/month</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Work Type */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Work Type</Label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-2">
              {workPreferenceOptions.map((pref) => {
                const isSelected = editWorkPrefs.includes(pref);
                return (
                  <button
                    key={pref}
                    onClick={() => toggleWorkPref(pref)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-400 text-purple-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{WORK_PREF_EMOJIS[pref] || '📌'}</span>
                    <span className="flex-1">{pref}</span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            workPrefs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {workPrefs.map((p) => (
                  <Badge key={p} variant="secondary" className="text-sm py-1 px-2.5">
                    {WORK_PREF_EMOJIS[p] || '📌'} {p}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No work preferences set</p>
            )
          )}
        </div>

        {/* Contract & Accommodation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProfileField
            label="Contract Type"
            value={profile?.contract_duration_preference}
            isEditing={isEditing}
            editComponent={
              <Select value={editData.contract_duration_preference || ''} onValueChange={(v) => updateEditData('contract_duration_preference', v)}>
                <SelectTrigger><SelectValue placeholder="Select contract type" /></SelectTrigger>
                <SelectContent>
                  {contractTypes.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            }
          />
          <ProfileField
            label="Accommodation"
            value={profile?.live_in_preference === true ? '🏠 Live-in (Employer-provided)' : profile?.live_in_preference === false ? '🚶 Live-out or Flexible' : null}
            isEditing={isEditing}
            editComponent={
              <Select value={editData.live_in_preference === true ? 'true' : editData.live_in_preference === false ? 'false' : ''} onValueChange={(v) => updateEditData('live_in_preference', v === 'true')}>
                <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">🏠 Live-in (Employer-provided)</SelectItem>
                  <SelectItem value="false">🚶 Live-out or Flexible</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </div>
      </div>
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 8: ABOUT ME
// =====================================================
const AboutSection = ({ profile, isEditing, editData, updateEditData, onEdit, onSave, onCancel, saving }) => {
  const bioText = isEditing ? (editData.about_me || '') : (profile?.about_me || '');
  const charCount = bioText.length;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(profile?.about_me || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTemplate = (template) => {
    const generated = template.generate(editData);
    updateEditData('about_me', generated);
  };

  return (
    <SectionWrapper
      id="about" step={8} title="About Me" subtitle="Your Story"
      icon={FileText} isComplete={isSectionComplete(profile, 'about')}
      isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} isSaving={saving}
    >
      {isEditing ? (
        <div className="space-y-4">
          {/* AI Template Buttons */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Generate with AI
            </Label>
            <div className="flex flex-wrap gap-2">
              {BIO_TEMPLATES.map((t) => (
                <Button
                  key={t.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(t)}
                  className="text-xs"
                >
                  <span className="mr-1">{t.emoji}</span> {t.label}
                </Button>
              ))}
            </div>
          </div>

          <Textarea
            value={editData.about_me || ''}
            onChange={(e) => updateEditData('about_me', e.target.value)}
            placeholder="Write about yourself, your experience, and what makes you a great candidate..."
            rows={6}
            maxLength={MAX_BIO_CHARS}
          />

          <div className="flex items-center justify-between text-xs">
            <span className={charCount < MIN_BIO_CHARS ? 'text-amber-600' : 'text-gray-400'}>
              {charCount < MIN_BIO_CHARS ? `${MIN_BIO_CHARS - charCount} more characters needed` : 'Looks great!'}
            </span>
            <span className={charCount > MAX_BIO_CHARS * 0.9 ? 'text-amber-600' : 'text-gray-400'}>
              {charCount}/{MAX_BIO_CHARS}
            </span>
          </div>

          {charCount === 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 font-medium mb-1">Writing Tips:</p>
              <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
                <li>Mention your key skills and experience</li>
                <li>Describe what makes you a reliable worker</li>
                <li>Share your work goals and availability</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {profile?.about_me ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.about_me}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{profile.about_me.length} characters</span>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="text-xs text-gray-500">
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <FileText className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-amber-700">No bio written yet</p>
              <p className="text-xs text-amber-600 mt-1">Write a brief introduction to stand out to employers</p>
            </div>
          )}
        </div>
      )}
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 9: MEDIA GALLERY
// =====================================================
const MediaSection = ({ profile, documents, userId, onProfileUpdate, onDocumentsUpdate }) => {
  const [uploading, setUploading] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const galleryPhotos = getGalleryPhotosFromDocs(documents);

  const handleVideoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    const cleanup = () => { if (input.parentNode) input.parentNode.removeChild(input); };
    input.addEventListener('cancel', cleanup);
    input.onchange = async (e) => {
      cleanup();
      const file = e.target.files[0];
      if (!file) return;
      try {
        setUploading('video');
        const url = await uploadVideoCV(userId, file);
        // Save via Cloud Function (maid role has no direct UPDATE permission)
        await updateProfileViaFunction('maid', { ...profile, introduction_video_url: url });
        onProfileUpdate({ introduction_video_url: url });
        toast({ title: 'Video uploaded!' });
      } catch (error) {
        toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  const handlePhotoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    const cleanup = () => { if (input.parentNode) input.parentNode.removeChild(input); };
    input.addEventListener('cancel', cleanup);
    input.onchange = async (e) => {
      cleanup();
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const maxNew = 5 - galleryPhotos.length;
      const filesToUpload = files.slice(0, Math.max(0, maxNew));
      if (filesToUpload.length === 0) {
        toast({ title: 'Gallery full', description: 'Maximum 5 photos allowed.', variant: 'destructive' });
        return;
      }
      try {
        setUploading('photos');
        for (const file of filesToUpload) {
          const result = await uploadDocument(userId, file, 'gallery_photo');
          const fileUrl = result.url || result;
          await apolloClient.mutate({
            mutation: INSERT_MAID_DOCUMENT,
            variables: { object: { maid_id: userId, type: 'gallery_photo', document_type: 'gallery_photo', file_url: fileUrl } },
          });
        }
        onDocumentsUpdate();
        toast({ title: `${filesToUpload.length} photo${filesToUpload.length > 1 ? 's' : ''} uploaded!` });
      } catch (error) {
        toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await apolloClient.mutate({
        mutation: DELETE_MAID_DOCUMENT,
        variables: { id: photoId },
      });
      onDocumentsUpdate();
      setPhotoIndex(0);
      toast({ title: 'Photo deleted' });
    } catch (error) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <SectionWrapper
      id="media" step={9} title="Media Gallery" subtitle="Photos & Video"
      icon={Video} isComplete={isSectionComplete(profile, 'media')} noEditButton
    >
      <div className="space-y-6">
        {/* Video */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-500 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" /> Video Introduction
            </Label>
            <Button variant="outline" size="sm" onClick={handleVideoUpload} disabled={!!uploading} className="text-xs">
              {uploading === 'video' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              {profile?.introduction_video_url ? 'Replace' : 'Upload'}
            </Button>
          </div>
          {profile?.introduction_video_url ? (
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video src={profile.introduction_video_url} controls className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Video className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No video uploaded</p>
              <p className="text-xs mt-0.5">A video introduction helps you stand out</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-500 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" /> Gallery Photos ({galleryPhotos.length}/5)
            </Label>
            {galleryPhotos.length < 5 && (
              <Button variant="outline" size="sm" onClick={handlePhotoUpload} disabled={!!uploading} className="text-xs">
                {uploading === 'photos' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                Add Photos
              </Button>
            )}
          </div>
          {galleryPhotos.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group">
                <img src={galleryPhotos[photoIndex]?.url} alt={`Gallery ${photoIndex + 1}`} className="w-full h-full object-cover" />
                {galleryPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIndex((i) => (i === 0 ? galleryPhotos.length - 1 : i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPhotoIndex((i) => (i === galleryPhotos.length - 1 ? 0 : i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {photoIndex + 1} / {galleryPhotos.length}
                </div>
                <button
                  onClick={() => handleDeletePhoto(galleryPhotos[photoIndex]?.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryPhotos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setPhotoIndex(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === photoIndex ? 'border-purple-500' : 'border-transparent'
                    }`}
                  >
                    <img src={photo.url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Image className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No photos uploaded</p>
              <p className="text-xs mt-0.5">Add up to 5 photos to your profile gallery</p>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

// =====================================================
// SECTION 10: CONSENTS
// =====================================================
const ConsentsSection = ({ profile }) => (
  <SectionWrapper
    id="consents" step={10} title="Terms & Conditions" subtitle="Agreements"
    icon={CheckSquare} isComplete noEditButton
  >
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-3">These consents were accepted during registration.</p>
      {CONSENT_ITEMS.map((item) => {
        const ItemIcon = item.icon;
        return (
          <div key={item.id} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                {item.required && <Badge className="bg-green-100 text-green-700 border-0 text-[10px] px-1.5 py-0">Required</Badge>}
                {!item.required && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Optional</Badge>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            </div>
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 flex-shrink-0">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  </SectionWrapper>
);

// =====================================================
// MAIN COMPONENT
// =====================================================
const MaidProfilePageV2 = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  const completionStatus = getProfileCompletionStatus(profile || {});

  // Fetch profile only after auth is fully settled and user is available
  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id, authLoading]);

  const fetchProfile = async (userId) => {
    setLoading(true);
    // Get a fresh token from Firebase Auth (also updates localStorage for Apollo).
    // This is more reliable than getStoredToken() on page refresh because
    // the force-refreshed token from AuthContext may not be in localStorage yet.
    let token = await getIdToken();
    if (!token) {
      token = getStoredToken();
    }

    // If still no token, wait briefly for auth to settle (max 3 attempts)
    if (!token) {
      for (let attempt = 0; attempt < 3 && !token; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        token = await getIdToken();
        if (!token) token = getStoredToken();
      }
    }

    if (!token) {
      console.error('[MaidProfile] No auth token available after retries');
      toast({ title: 'Error', description: 'Authentication error. Please try logging in again.', variant: 'destructive' });
      setLoading(false);
      return;
    }
    try {
      const result = await apolloClient.query({
        query: GET_MAID_PROFILE,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      // Check for GraphQL errors (not thrown with errorPolicy: 'all')
      if (result.errors?.length > 0) {
        console.error('[MaidProfile] GraphQL errors:', result.errors);
        const errMsg = result.errors[0]?.message || '';
        if (errMsg.includes('permission') || errMsg.includes('not found in type') || !result.data?.maid_profiles) {
          await fetchProfileDirect(userId, token);
          return;
        }
      }

      if (result.data?.maid_profiles?.[0]) {
        const profileData = result.data.maid_profiles[0];
        const galleryPhotos = getGalleryPhotosFromDocs(result.data.maid_documents);
        setProfile({
          ...profileData,
          gallery_photos: galleryPhotos.map(p => p.url),
        });
        setDocuments(result.data.maid_documents || []);
      } else {
        await fetchProfileDirect(userId, token);
      }
    } catch (error) {
      console.error('[MaidProfile] Fetch error:', error);
      try {
        await fetchProfileDirect(userId, token);
      } catch (fallbackError) {
        console.error('[MaidProfile] Direct fallback also failed:', fallbackError);
        toast({ title: 'Error', description: 'Failed to load profile. Please refresh the page.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Direct fetch fallback - bypasses Apollo client
  const fetchProfileDirect = async (userId, token) => {
    const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT || 'https://api.ethiopianmaids.com/v1/graphql';
    const query = `
      query GetMaidProfile($userId: String!) {
        maid_profiles(where: { _or: [{ id: { _eq: $userId } }, { user_id: { _eq: $userId } }] }, limit: 1) {
          id user_id full_name first_name middle_name last_name
          date_of_birth nationality religion religion_other marital_status children_count
          country state_province street_address current_location
          primary_profession primary_profession_other current_visa_status current_visa_status_other education_level
          skills languages experience_years previous_countries
          preferred_salary_min preferred_salary_max preferred_currency available_from
          work_preferences contract_duration_preference live_in_preference about_me
          profile_photo_url introduction_video_url profile_completion_percentage availability_status
          verification_status phone_country_code phone_number alternative_phone
          passport_number passport_expiry visa_status
          medical_certificate_valid police_clearance_valid
          is_agency_managed agency_id key_responsibilities work_history additional_notes
          created_at updated_at
        }
        maid_documents(where: { maid_id: { _eq: $userId } }, order_by: { uploaded_at: desc }) {
          id type document_type file_url document_url uploaded_at
        }
      }
    `;
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables: { userId } }),
    });
    const result = await response.json();
    if (result.data?.maid_profiles?.[0]) {
      const profileData = result.data.maid_profiles[0];
      const galleryPhotos = getGalleryPhotosFromDocs(result.data.maid_documents || []);
      setProfile({
        ...profileData,
        gallery_photos: galleryPhotos.map(p => p.url),
      });
      setDocuments(result.data.maid_documents || []);
    } else {
      // Direct fetch - no profile found
    }
  };

  // IntersectionObserver for scroll tracking
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActiveSection(id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    SECTION_CONFIG.forEach(section => {
      const el = document.getElementById(`section-${section.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Edit handlers
  const startEditing = (section) => {
    setEditingSection(section);
    setEditData({ ...profile });
  };
  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };
  const updateEditData = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // Save changes via Cloud Function (maid role has no direct UPDATE permission)
  const saveChanges = async (section) => {
    try {
      setSaving(true);
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
        case 'profession':
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
          updateData = { about_me: editData.about_me };
          break;
        default:
          break;
      }

      // Merge current profile with edits so Cloud Function doesn't wipe unedited fields
      const mergedProfile = { ...profile, ...updateData };
      const newStatus = getProfileCompletionStatus(mergedProfile);
      mergedProfile.profile_completion_percentage = newStatus.percentage;

      // Use Cloud Function with admin secret (bypasses Hasura role permissions)
      await updateProfileViaFunction('maid', mergedProfile);

      setProfile((prev) => ({ ...prev, ...updateData, profile_completion_percentage: newStatus.percentage }));
      setEditingSection(null);
      toast({ title: 'Saved!', description: 'Your changes have been saved successfully.' });
    } catch (error) {
      console.error('Save failed:', error);
      toast({ title: 'Error', description: 'Failed to save changes. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Profile photo handler for header
  const handleHeaderPhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    const cleanup = () => { if (input.parentNode) input.parentNode.removeChild(input); };
    input.addEventListener('cancel', cleanup);
    input.onchange = async (e) => {
      cleanup();
      const file = e.target.files[0];
      if (!file) return;
      try {
        setSaving(true);
        const url = await uploadProfilePhoto(file, user.id);
        // Save via Cloud Function (maid role has no direct UPDATE permission)
        const mergedProfile = { ...profile, profile_photo_url: url };
        await updateProfileViaFunction('maid', mergedProfile);
        setProfile((prev) => ({ ...prev, profile_photo_url: url }));
        toast({ title: 'Photo updated!' });
      } catch (error) {
        console.error('Photo upload failed:', error);
        toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
      } finally {
        setSaving(false);
      }
    };
    input.click();
  };

  // Handlers for upload-based sections
  const handleProfileUpdate = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };
  const handleDocumentsUpdate = () => {
    if (user?.id) fetchProfile(user.id);
  };

  if (loading || authLoading) return <ProfileSkeleton />;

  // Section edit props factory
  const sectionEditProps = (sectionId) => ({
    isEditing: editingSection === sectionId,
    editData,
    updateEditData,
    onEdit: () => startEditing(sectionId),
    onSave: () => saveChanges(sectionId),
    onCancel: cancelEditing,
    saving,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/maid')} className="mb-4 -ml-2">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Button>

      {/* Profile Header */}
      <ProfileHeader profile={profile} completionStatus={completionStatus} onEditPhoto={handleHeaderPhotoUpload} />

      {/* Missing Fields Alert */}
      {completionStatus.missingFields.length > 0 && (
        <Card className="bg-amber-50 border-amber-200 mt-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Complete your profile to get more visibility</p>
                <p className="text-xs text-amber-600 mt-1">
                  Missing: {completionStatus.missingFields.map((f) => f.label).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Step Indicator */}
      <div className="mt-4">
        <MobileStepIndicator activeSection={activeSection} profile={profile} onSectionClick={scrollToSection} />
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6 mt-4">
        {/* Sidebar - Desktop/Tablet */}
        <aside className="hidden md:block w-14 lg:w-56 flex-shrink-0">
          <div className="sticky top-24">
            <SidebarNav activeSection={activeSection} profile={profile} onSectionClick={scrollToSection} />
            {/* Completion summary */}
            <div className="hidden lg:block mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Sections complete</span>
                <span className="font-medium text-gray-700">
                  {SECTION_CONFIG.filter(s => isSectionComplete(profile, s.id)).length}/{SECTION_CONFIG.length}
                </span>
              </div>
              <Progress
                value={(SECTION_CONFIG.filter(s => isSectionComplete(profile, s.id)).length / SECTION_CONFIG.length) * 100}
                className="h-1.5"
              />
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-4 min-w-0">
          <PersonalInfoSection profile={profile} {...sectionEditProps('personal')} />
          <IdentitySection profile={profile} documents={documents} userId={user.id} onProfileUpdate={handleProfileUpdate} onDocumentsUpdate={handleDocumentsUpdate} />
          <LocationSection profile={profile} {...sectionEditProps('location')} />
          <ProfessionSection profile={profile} {...sectionEditProps('profession')} />
          <SkillsSection profile={profile} {...sectionEditProps('skills')} />
          <ExperienceSection profile={profile} {...sectionEditProps('experience')} />
          <PreferencesSection profile={profile} {...sectionEditProps('preferences')} />
          <AboutSection profile={profile} {...sectionEditProps('about')} />
          <MediaSection profile={profile} documents={documents} userId={user.id} onProfileUpdate={handleProfileUpdate} onDocumentsUpdate={handleDocumentsUpdate} />
          <ConsentsSection profile={profile} />
        </div>
      </div>
    </div>
  );
};

export default MaidProfilePageV2;
