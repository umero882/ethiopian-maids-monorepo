/**
 * Agency Profile Edit Screen
 *
 * Step-by-step card-based registration/editing flow.
 * 9 Steps: Agency Info, Identity Verification, Contact Info, Location,
 * Service Specializations, Online Presence, License Upload, Terms & Conditions,
 * Account Status.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
  Modal,
  Animated,
  FlatList,
  Dimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Data Constants
// ============================================

interface CountryData {
  currency: string;
  regions?: string[];
  emirates?: string[];
  governorates?: string[];
}

const COUNTRY_DATA: Record<string, CountryData> = {
  'Ethiopia': {
    currency: 'ETB',
    regions: [
      'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
      'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
      'South West Ethiopia', 'Southern Nations', 'Tigray'
    ]
  },
  'United Arab Emirates': {
    currency: 'AED',
    emirates: [
      'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain',
      'Ras Al Khaimah', 'Fujairah'
    ]
  },
  'Saudi Arabia': {
    currency: 'SAR',
    regions: [
      'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir',
      'Jizan', 'Najran', 'Al Bahah', 'Northern Borders', 'Jawf',
      'Hail', 'Qassim', 'Tabuk'
    ]
  },
  'Kuwait': {
    currency: 'KWD',
    governorates: [
      'Kuwait City', 'Hawalli', 'Farwaniya', 'Mubarak Al-Kabeer',
      'Ahmadi', 'Jahra'
    ]
  },
  'Qatar': {
    currency: 'QAR',
    regions: [
      'Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Al Shamal',
      'Umm Salal', 'Al Daayen', 'Madinat ash Shamal'
    ]
  },
  'Bahrain': {
    currency: 'BHD',
    governorates: [
      'Capital Governorate', 'Muharraq', 'Northern Governorate',
      'Southern Governorate'
    ]
  },
  'Oman': {
    currency: 'OMR',
    governorates: [
      'Muscat', 'Dhofar', 'Musandam', 'Al Buraimi', 'Ad Dakhiliyah',
      'Al Batinah North', 'Al Batinah South', 'Ash Sharqiyah North',
      'Ash Sharqiyah South', 'Ad Dhahirah', 'Al Wusta'
    ]
  }
};

// Worker Types
const WORKER_TYPES = [
  'Housemaids',
  'Nannies',
  'Cooks',
  'Cleaners',
  'Caregivers (Elderly)',
  'Caregivers (Disabled)',
  'Drivers',
  'Gardeners',
  'General Helpers',
  'Baby Sitters',
  'Pet Care Specialists'
];

// Service Categories
const SERVICE_CATEGORIES = [
  'Live-in Workers',
  'Live-out Workers',
  'Part-time Services',
  'Full-time Services',
  'Contract Workers (1-2 years)',
  'Permanent Placement',
  'Worker Training Programs',
  'Document Verification',
  'Background Checks',
  '24/7 Support Services',
  'Emergency Replacement',
  'Multi-lingual Workers'
];

// Combined specializations
const ALL_SPECIALIZATIONS = [...WORKER_TYPES, ...SERVICE_CATEGORIES];

// Step configuration
interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const STEPS: StepConfig[] = [
  { id: 1, title: 'Agency Information', subtitle: 'Basic agency details', icon: 'business' },
  { id: 2, title: 'Identity Verification', subtitle: 'Passport or National ID', icon: 'shield-checkmark' },
  { id: 3, title: 'Contact Information', subtitle: 'Authorized person details', icon: 'person' },
  { id: 4, title: 'Location', subtitle: 'Business location & service areas', icon: 'location' },
  { id: 5, title: 'Service Specializations', subtitle: 'Worker types & services', icon: 'briefcase' },
  { id: 6, title: 'Online Presence', subtitle: 'Website & social media', icon: 'globe' },
  { id: 7, title: 'License Upload', subtitle: 'Trade license document', icon: 'document-text' },
  { id: 8, title: 'Terms & Conditions', subtitle: 'Review and accept policies', icon: 'document-lock' },
  { id: 9, title: 'Account Status', subtitle: 'Verification & subscription', icon: 'checkmark-done-circle' },
];

// Get cities/regions for a country
const getCitiesForCountry = (country: string): string[] => {
  const countryData = COUNTRY_DATA[country];
  if (!countryData) return [];
  return countryData.regions || countryData.emirates || countryData.governorates || [];
};

// GraphQL query to fetch base profile to get user ID
const GET_BASE_PROFILE = gql`
  query GetBaseProfile($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      user_type
    }
  }
`;

// GraphQL query to fetch agency profile with all fields by ID
const GET_AGENCY_PROFILE = gql`
  query GetAgencyProfile($userId: String!) {
    agency_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      authorized_person_name
      authorized_person_email
      authorized_person_phone
      contact_person_name
      business_email
      business_phone
      business_address
      address
      city
      country
      license_number
      license_expiry_date
      agency_description
      website_url
      website
      logo_url
      service_countries
      specialization
      total_maids
      active_maids
      successful_placements
      average_rating
      subscription_tier
      verification_status
      verified
      established_year
      phone
      email
      created_at
      updated_at
      # Document fields
      authorized_person_id_document
      authorized_person_id_number
      authorized_person_id_verification_status
      authorized_person_id_verified_at
      authorized_person_id_rejection_reason
      trade_license_document
      trade_license_verification_status
      trade_license_verified_at
      trade_license_rejection_reason
    }
    # Get actual maid count from maid_profiles table
    total_maids_count: maid_profiles_aggregate(where: { agency_id: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
    # Get active maids count
    active_maids_count: maid_profiles_aggregate(
      where: { agency_id: { _eq: $userId }, availability_status: { _in: ["available", "active"] } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// GraphQL mutation to update agency profile
const UPDATE_AGENCY_PROFILE = gql`
  mutation UpdateAgencyProfile($id: String!, $data: agency_profiles_set_input!) {
    update_agency_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      authorized_person_name
      authorized_person_email
      authorized_person_phone
      contact_person_name
      business_email
      business_phone
      business_address
      address
      city
      country
      license_number
      license_expiry_date
      established_year
      agency_description
      website_url
      website
      logo_url
      service_countries
      specialization
    }
  }
`;

// GraphQL mutation to create profile edit request (needs admin approval)
const CREATE_PROFILE_EDIT_REQUEST = gql`
  mutation CreateProfileEditRequest($data: profile_edit_requests_insert_input!) {
    insert_profile_edit_requests_one(object: $data) {
      id
      agency_id
      requested_changes
      reason
      status
      created_at
    }
  }
`;

// Helper function to check if profile is complete
const isProfileComplete = (profile: ProfileData | null): boolean => {
  if (!profile) return false;
  return !!(
    profile.full_name &&
    profile.license_number &&
    (profile.business_email || profile.authorized_person_email) &&
    (profile.business_phone || profile.authorized_person_phone) &&
    profile.country &&
    profile.specialization && profile.specialization.length > 0
  );
};

interface ProfileData {
  id: string;
  full_name: string;
  authorized_person_name: string;
  authorized_person_email: string;
  authorized_person_phone: string;
  contact_person_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  address: string;
  city: string;
  country: string;
  license_number: string;
  license_expiry_date: string | null;
  established_year: number | null;
  agency_description: string;
  website_url: string;
  website: string;
  logo_url: string;
  service_countries: string[];
  specialization: string[];
  total_maids: number;
  active_maids: number;
  successful_placements: number;
  average_rating: number;
  subscription_tier: string;
  verification_status: string;
  verified: boolean;
  phone: string;
  email: string;
  // Document fields
  authorized_person_id_document: string | null;
  authorized_person_id_number: string | null;
  authorized_person_id_verification_status: string | null;
  authorized_person_id_verified_at: string | null;
  authorized_person_id_rejection_reason: string | null;
  trade_license_document: string | null;
  trade_license_verification_status: string | null;
  trade_license_verified_at: string | null;
  trade_license_rejection_reason: string | null;
}

// Document types for upload
type DocumentType = 'passport' | 'national_id' | 'trade_license';

interface DocumentUploadState {
  isUploading: boolean;
  progress: number;
  isScanning: boolean;
  scanResult: ScanResult | null;
}

interface ScanResult {
  isValid: boolean;
  documentType: string;
  extractedData: {
    documentNumber?: string;
    fullName?: string;
    expiryDate?: string;
    nationality?: string;
  };
  confidence: number;
  issues: string[];
}

// ============================================
// Dropdown Component (Single Select)
// ============================================

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={dropdownStyles.container}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          dropdownStyles.selector,
          disabled && dropdownStyles.selectorDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text
          style={[
            dropdownStyles.selectorText,
            !value && dropdownStyles.placeholderText,
          ]}
        >
          {value || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={disabled ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={dropdownStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={dropdownStyles.modalContent}>
            <View style={dropdownStyles.modalHeader}>
              <Text style={dropdownStyles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={dropdownStyles.optionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dropdownStyles.optionItem,
                    value === item && dropdownStyles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    style={[
                      dropdownStyles.optionText,
                      value === item && dropdownStyles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {value === item && (
                    <Ionicons name="checkmark" size={20} color="#F97316" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ============================================
// MultiSelectDropdown Component
// ============================================

interface MultiSelectDropdownProps {
  label: string;
  selectedValues: string[];
  options: string[];
  onSelect: (values: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  selectedValues,
  options,
  onSelect,
  placeholder = 'Select options',
  maxDisplay = 3,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedValues);

  useEffect(() => {
    setLocalSelected(selectedValues);
  }, [selectedValues]);

  const toggleOption = (option: string) => {
    setLocalSelected((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleDone = () => {
    onSelect(localSelected);
    setIsOpen(false);
  };

  const displayText = () => {
    if (localSelected.length === 0) return placeholder;
    if (localSelected.length <= maxDisplay) return localSelected.join(', ');
    return `${localSelected.slice(0, maxDisplay).join(', ')} +${localSelected.length - maxDisplay} more`;
  };

  return (
    <View style={dropdownStyles.container}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={dropdownStyles.selector}
        onPress={() => setIsOpen(true)}
      >
        <Text
          style={[
            dropdownStyles.selectorText,
            localSelected.length === 0 && dropdownStyles.placeholderText,
          ]}
          numberOfLines={2}
        >
          {displayText()}
        </Text>
        <View style={dropdownStyles.badgeContainer}>
          {localSelected.length > 0 && (
            <View style={dropdownStyles.countBadge}>
              <Text style={dropdownStyles.countBadgeText}>{localSelected.length}</Text>
            </View>
          )}
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={dropdownStyles.modalOverlay}>
          <View style={dropdownStyles.multiModalContent}>
            <View style={dropdownStyles.modalHeader}>
              <Text style={dropdownStyles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={dropdownStyles.selectionCount}>
              {localSelected.length} selected
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={dropdownStyles.multiOptionsList}
              renderItem={({ item }) => {
                const isSelected = localSelected.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      dropdownStyles.multiOptionItem,
                      isSelected && dropdownStyles.multiOptionItemSelected,
                    ]}
                    onPress={() => toggleOption(item)}
                  >
                    <View
                      style={[
                        dropdownStyles.checkbox,
                        isSelected && dropdownStyles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <Text
                      style={[
                        dropdownStyles.multiOptionText,
                        isSelected && dropdownStyles.multiOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={dropdownStyles.multiModalFooter}>
              <TouchableOpacity
                style={dropdownStyles.clearButton}
                onPress={() => setLocalSelected([])}
              >
                <Text style={dropdownStyles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dropdownStyles.doneButton}
                onPress={handleDone}
              >
                <Text style={dropdownStyles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Dropdown styles
const dropdownStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectorDisabled: {
    backgroundColor: '#F3F4F6',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    padding: 16,
  },
  multiModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    position: 'absolute',
    bottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectionCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  optionsList: {
    maxHeight: 300,
  },
  multiOptionsList: {
    maxHeight: 350,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#FFF7ED',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#F97316',
    fontWeight: '500',
  },
  multiOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  multiOptionItemSelected: {
    backgroundColor: '#FFF7ED',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  multiOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  multiOptionTextSelected: {
    color: '#F97316',
    fontWeight: '500',
  },
  multiModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  clearButtonText: {
    fontSize: 15,
    color: '#6B7280',
  },
  doneButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default function AgencyProfileScreen() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editedData, setEditedData] = useState<Partial<ProfileData>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Edit mode state (for completed profiles that need admin approval)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editRequestModal, setEditRequestModal] = useState(false);
  const [editRequestReason, setEditRequestReason] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Partial<ProfileData>>({});
  const [submittingEditRequest, setSubmittingEditRequest] = useState(false);

  // Document upload state
  const [documentUploadModal, setDocumentUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [documentUploadState, setDocumentUploadState] = useState<DocumentUploadState>({
    isUploading: false,
    progress: 0,
    isScanning: false,
    scanResult: null,
  });
  const [idDocumentRequired, setIdDocumentRequired] = useState<'passport' | 'national_id' | null>(null);
  const scanProgressAnim = useRef(new Animated.Value(0)).current;

  // Terms and conditions acceptance state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Animate progress bar when step changes
  useEffect(() => {
    const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Determine if new registration or completed profile
  useEffect(() => {
    if (profileData) {
      const isComplete = isProfileComplete(profileData);
      setIsNewRegistration(!isComplete);
      // If profile is complete and not in edit mode, don't show wizard
      if (isComplete && !isEditMode) {
        setCurrentStep(1); // Reset step when viewing completed profile
      }
    }
  }, [profileData, isEditMode]);

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const baseProfile = data?.profiles?.[0];
      if (baseProfile?.id) {
        setUserId(baseProfile.id);
      }
    },
  });

  const [fetchProfile, { loading, error }] = useLazyQuery(GET_AGENCY_PROFILE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const profile = data?.agency_profiles?.[0];
      if (profile) {
        // Use actual counts from aggregate queries instead of static fields
        const totalMaidsCount = data?.total_maids_count?.aggregate?.count ?? profile.total_maids ?? 0;
        const activeMaidsCount = data?.active_maids_count?.aggregate?.count ?? profile.active_maids ?? 0;

        console.log('[AgencyProfile] Maid counts from aggregate:', {
          totalMaidsCount,
          activeMaidsCount,
          staticTotalMaids: profile.total_maids,
          staticActiveMaids: profile.active_maids,
        });

        const profileWithCounts = {
          ...profile,
          total_maids: totalMaidsCount,
          active_maids: activeMaidsCount,
        };
        setProfileData(profileWithCounts);
        setEditedData(profileWithCounts);
      }
    },
  });

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_AGENCY_PROFILE, {
    onCompleted: () => {
      // Profile updated - refetch to get latest data
      if (userId) {
        fetchProfile({ variables: { userId } });
      }
    },
    onError: (err) => {
      console.error('Update profile error:', err);
    },
  });

  const [createEditRequest] = useMutation(CREATE_PROFILE_EDIT_REQUEST, {
    onCompleted: () => {
      setEditRequestModal(false);
      setEditRequestReason('');
      setPendingChanges({});
      setIsEditMode(false);
      Alert.alert(
        'Edit Request Submitted',
        'Your profile change request has been submitted for admin approval. You will be notified once it is reviewed.',
        [{ text: 'OK' }]
      );
    },
    onError: (err) => {
      console.error('Edit request error:', err);
      Alert.alert('Error', 'Failed to submit edit request. Please try again.');
    },
  });

  // Step 1: Fetch base profile to get user ID
  useEffect(() => {
    if (user?.email) {
      fetchBaseProfile({ variables: { email: user.email } });
    }
  }, [user?.email]);

  // Step 2: Fetch agency profile when we have user ID
  useEffect(() => {
    if (userId) {
      fetchProfile({ variables: { userId } });
    }
  }, [userId]);

  // Save profile data
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!profileData?.id) {
      console.log('No profile ID available for saving');
      return true; // Return true so navigation continues for new profiles
    }

    try {
      // Build the data object, filtering out undefined values
      const dataToSave: Record<string, any> = {};

      if (editedData.full_name !== undefined) dataToSave.full_name = editedData.full_name;
      if (editedData.authorized_person_name !== undefined) dataToSave.authorized_person_name = editedData.authorized_person_name;
      if (editedData.authorized_person_email !== undefined) dataToSave.authorized_person_email = editedData.authorized_person_email;
      if (editedData.authorized_person_phone !== undefined) dataToSave.authorized_person_phone = editedData.authorized_person_phone;
      if (editedData.contact_person_name !== undefined) dataToSave.contact_person_name = editedData.contact_person_name;
      if (editedData.business_email !== undefined) dataToSave.business_email = editedData.business_email;
      if (editedData.business_phone !== undefined) dataToSave.business_phone = editedData.business_phone;
      if (editedData.business_address !== undefined) dataToSave.business_address = editedData.business_address;
      if (editedData.address !== undefined) dataToSave.address = editedData.address;
      if (editedData.city !== undefined) dataToSave.city = editedData.city;
      if (editedData.country !== undefined) dataToSave.country = editedData.country;
      if (editedData.license_number !== undefined) dataToSave.license_number = editedData.license_number;
      if (editedData.license_expiry_date !== undefined) dataToSave.license_expiry_date = editedData.license_expiry_date || null;
      if (editedData.established_year !== undefined) dataToSave.established_year = editedData.established_year;
      if (editedData.agency_description !== undefined) dataToSave.agency_description = editedData.agency_description;
      if (editedData.website_url !== undefined) dataToSave.website_url = editedData.website_url;
      if (editedData.website !== undefined) dataToSave.website = editedData.website;
      if (editedData.service_countries !== undefined) dataToSave.service_countries = editedData.service_countries;
      if (editedData.specialization !== undefined) dataToSave.specialization = editedData.specialization;

      // Only save if there's data to save
      if (Object.keys(dataToSave).length === 0) {
        console.log('No data changes to save');
        return true;
      }

      await updateProfile({
        variables: {
          id: profileData.id,
          data: dataToSave,
        },
      });

      return true;
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      return false;
    }
  }, [profileData?.id, editedData, updateProfile]);

  // Validate current step
  const validateStep = (step: number): { valid: boolean; message: string } => {
    switch (step) {
      case 1: // Agency Information
        if (!editedData.full_name?.trim()) {
          return { valid: false, message: 'Agency name is required' };
        }
        if (!editedData.license_number?.trim()) {
          return { valid: false, message: 'License number is required' };
        }
        return { valid: true, message: '' };
      case 2: // Identity Verification - Optional
        return { valid: true, message: '' };
      case 3: // Contact Information
        if (!editedData.business_email?.trim() && !editedData.authorized_person_email?.trim()) {
          return { valid: false, message: 'Business email is required' };
        }
        if (!editedData.business_phone?.trim() && !editedData.authorized_person_phone?.trim()) {
          return { valid: false, message: 'Business phone is required' };
        }
        // Basic email validation
        const email = editedData.business_email || editedData.authorized_person_email || '';
        if (email && !email.includes('@')) {
          return { valid: false, message: 'Please enter a valid email address' };
        }
        return { valid: true, message: '' };
      case 4: // Location
        if (!editedData.country?.trim()) {
          return { valid: false, message: 'Country is required' };
        }
        return { valid: true, message: '' };
      case 5: // Service Specializations
        if (!editedData.specialization || editedData.specialization.length === 0) {
          return { valid: false, message: 'Please select at least one specialization' };
        }
        return { valid: true, message: '' };
      case 6: // Online Presence - Optional
        return { valid: true, message: '' };
      case 7: // License Upload - Optional but recommended
        return { valid: true, message: '' };
      case 8: // Terms & Conditions - Required for new registrations
        if (!isEditMode && !termsAccepted) {
          return { valid: false, message: 'You must accept the Terms of Service to continue' };
        }
        if (!isEditMode && !privacyAccepted) {
          return { valid: false, message: 'You must accept the Privacy Policy to continue' };
        }
        return { valid: true, message: '' };
      case 9: // Account Status - Read-only
        return { valid: true, message: '' };
      default:
        return { valid: true, message: '' };
    }
  };

  // Navigate to next step
  const handleNextStep = async () => {
    const validation = validateStep(currentStep);
    if (!validation.valid) {
      Alert.alert('Required Fields', validation.message);
      return;
    }

    // Save progress before advancing (silently, don't block navigation)
    const saved = await handleSave();
    if (!saved) {
      console.log('Save failed but continuing navigation');
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete profile
      handleCompleteProfile();
    }
  };

  // Navigate to previous step
  const handlePrevStep = async () => {
    if (currentStep > 1) {
      // Save current step data before going back
      await handleSave();
      setCurrentStep(currentStep - 1);
    }
  };

  // Save and exit
  const handleSaveAndExit = async () => {
    const saved = await handleSave();
    if (saved) {
      Alert.alert('Progress Saved', 'Your progress has been saved. You can continue later.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert(
        'Save Issue',
        'There was a problem saving your progress. Would you like to exit anyway?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Exit Anyway', style: 'destructive', onPress: () => router.back() }
        ]
      );
    }
  };

  // Complete profile registration
  const handleCompleteProfile = async () => {
    const saved = await handleSave();
    if (saved) {
      Alert.alert(
        'Profile Complete',
        'Your agency profile has been saved successfully!',
        [{ text: 'OK', onPress: () => router.replace('/agency/dashboard') }]
      );
    } else {
      Alert.alert(
        'Save Issue',
        'There was a problem saving your profile. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle country change - reset city when country changes
  const handleCountryChange = (country: string) => {
    if (isEditMode) {
      trackChange('country', country);
      trackChange('city', ''); // Reset city when country changes
    } else {
      setEditedData({
        ...editedData,
        country,
        city: '', // Reset city when country changes
      });
    }
  };

  // Enter edit mode for completed profiles
  const handleEnterEditMode = () => {
    setIsEditMode(true);
    setPendingChanges({});
    setEditedData(profileData || {});
  };

  // Cancel edit mode
  const handleCancelEditMode = () => {
    setIsEditMode(false);
    setEditedData(profileData || {});
    setPendingChanges({});
    setCurrentStep(1);
  };

  // Track changes for edit request
  const trackChange = (field: keyof ProfileData, value: any) => {
    const originalValue = profileData?.[field];
    const newPendingChanges = { ...pendingChanges };

    // Only track if value is different from original
    if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
      newPendingChanges[field] = value;
    } else {
      delete newPendingChanges[field];
    }

    setPendingChanges(newPendingChanges);
    setEditedData({ ...editedData, [field]: value });
  };

  // Helper to handle field changes - uses trackChange in edit mode, setEditedData otherwise
  const handleFieldChange = (field: keyof ProfileData, value: any) => {
    if (isEditMode) {
      trackChange(field, value);
    } else {
      setEditedData({ ...editedData, [field]: value });
    }
  };

  // Submit edit request for admin approval
  const handleSubmitEditRequest = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      Alert.alert('No Changes', 'You have not made any changes to submit.');
      return;
    }

    if (!editRequestReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for the requested changes.');
      return;
    }

    setSubmittingEditRequest(true);
    try {
      await createEditRequest({
        variables: {
          data: {
            agency_id: profileData?.id,
            requested_changes: pendingChanges,
            reason: editRequestReason.trim(),
            status: 'pending',
            original_data: profileData,
          },
        },
      });
    } catch (error) {
      console.error('Failed to submit edit request:', error);
    } finally {
      setSubmittingEditRequest(false);
    }
  };

  // Check if profile is complete
  const profileComplete = isProfileComplete(profileData);

  const getVerificationColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      handlePhotoUpdate(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take a logo photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      handlePhotoUpdate(result.assets[0]);
    }
  };

  const handlePhotoUpdate = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!profileData?.id) return;

    setUploadingPhoto(true);
    try {
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;

      await updateProfile({
        variables: {
          id: profileData.id,
          data: {
            logo_url: dataUrl,
          },
        },
      });

      setEditedData({ ...editedData, logo_url: dataUrl });
      setProfileData({ ...profileData, logo_url: dataUrl });
      Alert.alert('Success', 'Agency logo updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update agency logo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Update Agency Logo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ============================================
  // Document Upload Functions
  // ============================================

  const openDocumentUploadModal = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setDocumentUploadState({
      isUploading: false,
      progress: 0,
      isScanning: false,
      scanResult: null,
    });
    setDocumentUploadModal(true);
  };

  const closeDocumentUploadModal = () => {
    setDocumentUploadModal(false);
    setSelectedDocType(null);
    setDocumentUploadState({
      isUploading: false,
      progress: 0,
      isScanning: false,
      scanResult: null,
    });
  };

  // Simulate document scanning (bank-grade verification)
  const simulateDocumentScan = async (imageUri: string, docType: DocumentType): Promise<ScanResult> => {
    // In production, this would call an OCR/document verification API
    // like AWS Textract, Google Vision, or a specialized service
    return new Promise((resolve) => {
      // Simulate scanning animation
      setDocumentUploadState(prev => ({ ...prev, isScanning: true }));

      Animated.timing(scanProgressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        // Simulated scan result with 95% success rate
        const isValid = Math.random() > 0.05;
        const confidence = isValid ? 0.85 + Math.random() * 0.14 : 0.3 + Math.random() * 0.3;

        const result: ScanResult = {
          isValid,
          documentType: docType === 'passport' ? 'Passport' : docType === 'national_id' ? 'National ID' : 'Trade License',
          extractedData: isValid ? {
            documentNumber: `${docType.toUpperCase().substring(0, 2)}${Math.random().toString().substring(2, 10)}`,
            fullName: profileData?.authorized_person_name || 'Name Detected',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0],
            nationality: profileData?.country || 'Country Detected',
          } : {},
          confidence,
          issues: isValid ? [] : [
            'Document image is unclear',
            'Unable to verify authenticity',
            'Please retake with better lighting',
          ],
        };

        scanProgressAnim.setValue(0);
        setDocumentUploadState(prev => ({
          ...prev,
          isScanning: false,
          scanResult: result,
        }));

        resolve(result);
      }, 2500);
    });
  };

  const captureDocumentPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to scan documents.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.95,
      base64: true,
    });

    if (!result.canceled && result.assets[0] && selectedDocType) {
      await processDocumentImage(result.assets[0], selectedDocType);
    }
  };

  const pickDocumentFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.95,
      base64: true,
    });

    if (!result.canceled && result.assets[0] && selectedDocType) {
      await processDocumentImage(result.assets[0], selectedDocType);
    }
  };

  const pickDocumentFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0] && selectedDocType) {
        const asset = result.assets[0];

        // For PDF files, we'll just upload without scanning
        if (asset.mimeType === 'application/pdf') {
          await uploadDocumentDirectly(asset.uri, selectedDocType, asset.name);
        } else {
          // For images, read as base64 and process
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await processDocumentImage({ uri: asset.uri, base64 } as any, selectedDocType);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const processDocumentImage = async (asset: ImagePicker.ImagePickerAsset, docType: DocumentType) => {
    setDocumentUploadState(prev => ({ ...prev, isUploading: true, progress: 10 }));

    try {
      // For trade license, skip scanning and upload directly
      if (docType === 'trade_license') {
        setDocumentUploadState(prev => ({ ...prev, progress: 50 }));

        // Handle base64 - it may come from ImagePicker or we need to read it
        let base64Data = asset.base64;
        if (!base64Data && asset.uri) {
          base64Data = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        const dataUrl = `data:image/jpeg;base64,${base64Data}`;

        setDocumentUploadState(prev => ({ ...prev, progress: 80 }));

        await updateProfile({
          variables: {
            id: profileData?.id,
            data: {
              trade_license_document: dataUrl,
              trade_license_verification_status: 'pending',
            },
          },
        });

        setDocumentUploadState(prev => ({ ...prev, progress: 100 }));

        // Update local state
        setProfileData(prev => prev ? {
          ...prev,
          trade_license_document: dataUrl,
          trade_license_verification_status: 'pending',
        } : null);

        setEditedData(prev => ({
          ...prev,
          trade_license_document: dataUrl,
        }));

        setTimeout(() => {
          Alert.alert(
            'License Uploaded',
            'Your trade license has been uploaded and is pending verification by our admin team.',
            [{ text: 'OK', onPress: closeDocumentUploadModal }]
          );
        }, 500);
        return;
      }

      // Step 1: Scan the document (for ID documents)
      const scanResult = await simulateDocumentScan(asset.uri, docType);

      if (!scanResult.isValid) {
        // Show scan result but allow retry or manual upload
        setDocumentUploadState(prev => ({
          ...prev,
          isUploading: false,
          scanResult,
        }));
        return;
      }

      // Step 2: Upload the document
      setDocumentUploadState(prev => ({ ...prev, progress: 60 }));

      // Handle base64 - it may come from ImagePicker or we need to read it
      let base64Data = asset.base64;
      if (!base64Data && asset.uri) {
        base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setDocumentUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      // Update the profile with document
      await updateProfile({
        variables: {
          id: profileData?.id,
          data: {
            authorized_person_id_document: dataUrl,
            authorized_person_id_number: scanResult.extractedData.documentNumber,
            authorized_person_id_verification_status: 'pending',
          },
        },
      });

      clearInterval(progressInterval);
      setDocumentUploadState(prev => ({ ...prev, progress: 100 }));

      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        authorized_person_id_document: dataUrl,
        authorized_person_id_number: scanResult.extractedData.documentNumber || null,
        authorized_person_id_verification_status: 'pending',
      } : null);

      // Mark ID document as uploaded
      if (docType === 'passport' || docType === 'national_id') {
        setIdDocumentRequired(null);
      }

      setTimeout(() => {
        Alert.alert(
          'Document Uploaded',
          'Your document has been uploaded and is pending verification by our admin team. You will be notified once verified.',
          [{ text: 'OK', onPress: closeDocumentUploadModal }]
        );
      }, 500);

    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload document. Please try again.');
      setDocumentUploadState(prev => ({ ...prev, isUploading: false, progress: 0 }));
    }
  };

  const uploadDocumentDirectly = async (uri: string, docType: DocumentType, fileName: string) => {
    setDocumentUploadState(prev => ({ ...prev, isUploading: true, progress: 30 }));

    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      setDocumentUploadState(prev => ({ ...prev, progress: 70 }));

      // Handle trade license differently
      if (docType === 'trade_license') {
        await updateProfile({
          variables: {
            id: profileData?.id,
            data: {
              trade_license_document: dataUrl,
              trade_license_verification_status: 'pending',
            },
          },
        });

        setDocumentUploadState(prev => ({ ...prev, progress: 100 }));

        setProfileData(prev => prev ? {
          ...prev,
          trade_license_document: dataUrl,
          trade_license_verification_status: 'pending',
        } : null);

        setEditedData(prev => ({
          ...prev,
          trade_license_document: dataUrl,
        }));

        setTimeout(() => {
          Alert.alert(
            'License Uploaded',
            'Your trade license has been uploaded and is pending verification.',
            [{ text: 'OK', onPress: closeDocumentUploadModal }]
          );
        }, 500);
      } else {
        // Handle ID documents (passport/national_id)
        await updateProfile({
          variables: {
            id: profileData?.id,
            data: {
              authorized_person_id_document: dataUrl,
              authorized_person_id_verification_status: 'pending',
            },
          },
        });

        setDocumentUploadState(prev => ({ ...prev, progress: 100 }));

        setProfileData(prev => prev ? {
          ...prev,
          authorized_person_id_document: dataUrl,
          authorized_person_id_verification_status: 'pending',
        } : null);

        setTimeout(() => {
          Alert.alert(
            'Document Uploaded',
            'Your document has been uploaded and is pending verification.',
            [{ text: 'OK', onPress: closeDocumentUploadModal }]
          );
        }, 500);
      }

    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload document.');
      setDocumentUploadState(prev => ({ ...prev, isUploading: false, progress: 0 }));
    }
  };

  const getDocumentStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getDocumentStatusIcon = (status: string | null): keyof typeof Ionicons.glyphMap => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'document-outline';
    }
  };

  // ============================================
  // Step Render Functions
  // ============================================

  // Step 1: Agency Information Card
  const renderAgencyInfoCard = () => (
    <View style={styles.stepCard}>
      <View style={styles.field}>
        <Text style={styles.label}>Agency Name *</Text>
        <TextInput
          style={styles.input}
          value={editedData.full_name || ''}
          onChangeText={(text) => handleFieldChange('full_name', text)}
          placeholder="Enter agency name"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Year Established</Text>
        <TextInput
          style={styles.input}
          value={String(editedData.established_year || '')}
          onChangeText={(text) => handleFieldChange('established_year', parseInt(text) || null)}
          placeholder="e.g., 2015"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>License Number *</Text>
        <TextInput
          style={styles.input}
          value={editedData.license_number || ''}
          onChangeText={(text) => handleFieldChange('license_number', text)}
          placeholder="Enter license number"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>License Expiry Date</Text>
        <TextInput
          style={styles.input}
          value={editedData.license_expiry_date || ''}
          onChangeText={(text) => handleFieldChange('license_expiry_date', text)}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textAreaLarge]}
          value={editedData.agency_description || ''}
          onChangeText={(text) => handleFieldChange('agency_description', text)}
          placeholder="Tell clients about your agency..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  // Step 2: Identity Verification Card
  const renderIdentityVerificationCard = () => (
    <View style={styles.stepCard}>
      <View style={styles.docVerificationInfo}>
        <Ionicons name="shield-checkmark" size={24} color="#F97316" />
        <View style={styles.docVerificationTextContainer}>
          <Text style={styles.docVerificationTitle}>Verify Your Identity</Text>
          <Text style={styles.docVerificationSubtitle}>
            Upload either a Passport OR National ID to verify your identity
          </Text>
        </View>
      </View>

      {/* Document Upload Buttons */}
      <View style={styles.docUploadButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.docUploadButton,
            profileData?.authorized_person_id_document && styles.docUploadButtonUploaded,
          ]}
          onPress={() => openDocumentUploadModal('passport')}
        >
          <View style={styles.docUploadButtonContent}>
            <View style={[styles.docUploadIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="document-text" size={24} color="#D97706" />
            </View>
            <View style={styles.docUploadTextContainer}>
              <Text style={styles.docUploadButtonTitle}>Passport</Text>
              <Text style={styles.docUploadButtonSubtitle}>
                {profileData?.authorized_person_id_document ? 'Uploaded' : 'Upload passport'}
              </Text>
            </View>
          </View>
          <Ionicons
            name={profileData?.authorized_person_id_document ? 'checkmark-circle' : 'chevron-forward'}
            size={20}
            color={profileData?.authorized_person_id_document ? '#10B981' : '#9CA3AF'}
          />
        </TouchableOpacity>

        <View style={styles.docOrDivider}>
          <View style={styles.docOrLine} />
          <Text style={styles.docOrText}>OR</Text>
          <View style={styles.docOrLine} />
        </View>

        <TouchableOpacity
          style={[
            styles.docUploadButton,
            profileData?.authorized_person_id_document && styles.docUploadButtonUploaded,
          ]}
          onPress={() => openDocumentUploadModal('national_id')}
        >
          <View style={styles.docUploadButtonContent}>
            <View style={[styles.docUploadIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="card" size={24} color="#3B82F6" />
            </View>
            <View style={styles.docUploadTextContainer}>
              <Text style={styles.docUploadButtonTitle}>National ID</Text>
              <Text style={styles.docUploadButtonSubtitle}>
                {profileData?.authorized_person_id_document ? 'Uploaded' : 'Upload ID card'}
              </Text>
            </View>
          </View>
          <Ionicons
            name={profileData?.authorized_person_id_document ? 'checkmark-circle' : 'chevron-forward'}
            size={20}
            color={profileData?.authorized_person_id_document ? '#10B981' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      {/* Uploaded document status */}
      {profileData?.authorized_person_id_document && (
        <View style={styles.uploadedDocItem}>
          <View style={styles.uploadedDocLeft}>
            {profileData.authorized_person_id_document.startsWith('data:image') ? (
              <Image
                source={{ uri: profileData.authorized_person_id_document }}
                style={styles.uploadedDocThumb}
              />
            ) : (
              <View style={[styles.uploadedDocThumb, styles.uploadedDocThumbPlaceholder]}>
                <Ionicons name="document" size={24} color="#6B7280" />
              </View>
            )}
            <View style={styles.uploadedDocInfo}>
              <Text style={styles.uploadedDocName}>Identity Document</Text>
              <View style={styles.uploadedDocStatusContainer}>
                <Ionicons
                  name={getDocumentStatusIcon(profileData.authorized_person_id_verification_status)}
                  size={14}
                  color={getDocumentStatusColor(profileData.authorized_person_id_verification_status)}
                />
                <Text
                  style={[
                    styles.uploadedDocStatus,
                    { color: getDocumentStatusColor(profileData.authorized_person_id_verification_status) },
                  ]}
                >
                  {profileData.authorized_person_id_verification_status?.charAt(0).toUpperCase() +
                   (profileData.authorized_person_id_verification_status?.slice(1) || '') || 'Pending Review'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.docFeatures}>
        <View style={styles.docFeatureItem}>
          <Ionicons name="scan" size={16} color="#10B981" />
          <Text style={styles.docFeatureText}>Auto-scan verification</Text>
        </View>
        <View style={styles.docFeatureItem}>
          <Ionicons name="lock-closed" size={16} color="#10B981" />
          <Text style={styles.docFeatureText}>Bank-grade security</Text>
        </View>
      </View>
    </View>
  );

  // Step 3: Contact Information Card
  const renderContactInfoCard = () => (
    <View style={styles.stepCard}>
      <View style={styles.field}>
        <Text style={styles.label}>Authorized Person Name *</Text>
        <TextInput
          style={styles.input}
          value={editedData.authorized_person_name || ''}
          onChangeText={(text) => handleFieldChange('authorized_person_name', text)}
          placeholder="Full name of authorized person"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Business Email *</Text>
        <TextInput
          style={styles.input}
          value={editedData.business_email || editedData.authorized_person_email || ''}
          onChangeText={(text) => {
            handleFieldChange('business_email', text);
            handleFieldChange('authorized_person_email', text);
          }}
          placeholder="email@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Business Phone *</Text>
        <TextInput
          style={styles.input}
          value={editedData.business_phone || editedData.authorized_person_phone || ''}
          onChangeText={(text) => {
            handleFieldChange('business_phone', text);
            handleFieldChange('authorized_person_phone', text);
          }}
          placeholder="+971 XX XXX XXXX"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  // Step 4: Location Card
  const renderLocationCard = () => {
    const countryOptions = Object.keys(COUNTRY_DATA);
    const cityOptions = editedData.country ? getCitiesForCountry(editedData.country) : [];

    return (
      <View style={styles.stepCard}>
        <Dropdown
          label="Country *"
          value={editedData.country || ''}
          options={countryOptions}
          onSelect={handleCountryChange}
          placeholder="Select your country"
        />

        <Dropdown
          label="City / Region"
          value={editedData.city || ''}
          options={cityOptions}
          onSelect={(city) => handleFieldChange('city', city)}
          placeholder="Select city or region"
          disabled={!editedData.country || cityOptions.length === 0}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Business Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={editedData.business_address || editedData.address || ''}
            onChangeText={(text) => {
              handleFieldChange('business_address', text);
              handleFieldChange('address', text);
            }}
            placeholder="Full business address"
            multiline
          />
        </View>

        <MultiSelectDropdown
          label="Service Countries"
          selectedValues={editedData.service_countries || []}
          options={countryOptions}
          onSelect={(values) => handleFieldChange('service_countries', values)}
          placeholder="Select countries you serve"
        />
      </View>
    );
  };

  // Step 5: Service Specializations Card
  const renderSpecializationsCard = () => (
    <View style={styles.stepCard}>
      <View style={styles.specializationHeader}>
        <Text style={styles.specializationTitle}>What services does your agency offer?</Text>
        <Text style={styles.specializationSubtitle}>
          Select all worker types and service categories that apply
        </Text>
      </View>

      <View style={styles.specializationSection}>
        <Text style={styles.specializationSectionTitle}>Worker Types</Text>
        <View style={styles.chipContainer}>
          {WORKER_TYPES.map((type) => {
            const isSelected = (editedData.specialization || []).includes(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => {
                  const current = editedData.specialization || [];
                  const updated = isSelected
                    ? current.filter((item) => item !== type)
                    : [...current, type];
                  handleFieldChange('specialization', updated);
                }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.specializationSection}>
        <Text style={styles.specializationSectionTitle}>Service Categories</Text>
        <View style={styles.chipContainer}>
          {SERVICE_CATEGORIES.map((category) => {
            const isSelected = (editedData.specialization || []).includes(category);
            return (
              <TouchableOpacity
                key={category}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => {
                  const current = editedData.specialization || [];
                  const updated = isSelected
                    ? current.filter((item) => item !== category)
                    : [...current, category];
                  handleFieldChange('specialization', updated);
                }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {(editedData.specialization || []).length > 0 && (
        <View style={styles.selectedCountContainer}>
          <Text style={styles.selectedCountText}>
            {(editedData.specialization || []).length} selected
          </Text>
        </View>
      )}
    </View>
  );

  // Step 6: Online Presence Card
  const renderOnlinePresenceCard = () => (
    <View style={styles.stepCard}>
      <View style={styles.onlinePresenceHeader}>
        <Ionicons name="globe-outline" size={40} color="#F97316" />
        <Text style={styles.onlinePresenceTitle}>Your Online Presence</Text>
        <Text style={styles.onlinePresenceSubtitle}>
          Add your website to help clients learn more about your agency
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Website URL</Text>
        <TextInput
          style={styles.input}
          value={editedData.website_url || editedData.website || ''}
          onChangeText={(text) => {
            handleFieldChange('website_url', text);
            handleFieldChange('website', text);
          }}
          placeholder="https://www.youragency.com"
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.websiteNote}>
        <Ionicons name="information-circle" size={16} color="#3B82F6" />
        <Text style={styles.websiteNoteText}>
          This is optional. You can add or update it later.
        </Text>
      </View>
    </View>
  );

  // Step 7: License Upload Card
  const renderLicenseUploadCard = () => {
    const licenseDoc = editedData.trade_license_document || profileData?.trade_license_document;
    const verificationStatus = editedData.trade_license_verification_status || profileData?.trade_license_verification_status;
    const isPdf = licenseDoc?.includes('application/pdf');

    return (
      <View style={styles.stepCard}>
        <View style={styles.licenseUploadHeader}>
          <Ionicons name="document-text-outline" size={40} color="#F97316" />
          <Text style={styles.licenseUploadTitle}>Trade License Document</Text>
          <Text style={styles.licenseUploadSubtitle}>
            Upload your official business/trade license for verification
          </Text>
        </View>

        {/* Current Document Status */}
        {licenseDoc ? (
          <View style={styles.uploadedDocContainer}>
            {/* Document Preview */}
            <View style={styles.docPreviewContainer}>
              {isPdf ? (
                <View style={styles.pdfPreview}>
                  <Ionicons name="document-text" size={48} color="#EF4444" />
                  <Text style={styles.pdfPreviewText}>PDF Document</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: licenseDoc }}
                  style={styles.docPreviewImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.docPreviewOverlay}>
                <View
                  style={[
                    styles.docStatusBadgeLarge,
                    {
                      backgroundColor:
                        verificationStatus === 'verified'
                          ? '#ECFDF5'
                          : verificationStatus === 'rejected'
                          ? '#FEF2F2'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      verificationStatus === 'verified'
                        ? 'checkmark-circle'
                        : verificationStatus === 'rejected'
                        ? 'close-circle'
                        : 'time'
                    }
                    size={16}
                    color={
                      verificationStatus === 'verified'
                        ? '#10B981'
                        : verificationStatus === 'rejected'
                        ? '#EF4444'
                        : '#F59E0B'
                    }
                  />
                  <Text
                    style={[
                      styles.docStatusTextLarge,
                      {
                        color:
                          verificationStatus === 'verified'
                            ? '#10B981'
                            : verificationStatus === 'rejected'
                            ? '#EF4444'
                            : '#F59E0B',
                      },
                    ]}
                  >
                    {verificationStatus === 'verified'
                      ? 'Verified'
                      : verificationStatus === 'rejected'
                      ? 'Rejected'
                      : 'Pending Review'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Rejection reason if rejected */}
            {verificationStatus === 'rejected' && profileData?.trade_license_rejection_reason && (
              <View style={styles.rejectionReasonContainer}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.rejectionReasonText}>
                  {profileData.trade_license_rejection_reason}
                </Text>
              </View>
            )}

            {/* Replace button */}
            <TouchableOpacity
              style={styles.replaceDocButton}
              onPress={() => {
                setSelectedDocType('trade_license');
                setDocumentUploadModal(true);
              }}
            >
              <Ionicons name="refresh" size={18} color="#F97316" />
              <Text style={styles.replaceDocButtonText}>Replace Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Upload Button */
          <TouchableOpacity
            style={styles.licenseUploadButton}
            onPress={() => {
              setSelectedDocType('trade_license');
              setDocumentUploadModal(true);
            }}
          >
            <View style={styles.licenseUploadIconContainer}>
              <Ionicons name="cloud-upload-outline" size={48} color="#F97316" />
            </View>
            <Text style={styles.licenseUploadButtonTitle}>Upload Trade License</Text>
            <Text style={styles.licenseUploadButtonSubtitle}>
              PDF, JPG, or PNG (max 10MB)
            </Text>
          </TouchableOpacity>
        )}

        {/* Info note */}
        <View style={styles.licenseInfoNote}>
          <Ionicons name="information-circle" size={16} color="#3B82F6" />
          <Text style={styles.licenseInfoNoteText}>
            Your trade license will be reviewed by our team within 1-2 business days.
            This step is optional but helps build trust with clients.
          </Text>
        </View>
      </View>
    );
  };

  // Step 8: Terms & Conditions Card
  const renderTermsCard = () => (
    <View style={styles.stepCard}>
      <View style={styles.termsHeader}>
        <Ionicons name="shield-checkmark-outline" size={40} color="#F97316" />
        <Text style={styles.termsTitle}>Terms & Conditions</Text>
        <Text style={styles.termsSubtitle}>
          Please review and accept our policies to complete your registration
        </Text>
      </View>

      {/* Terms of Service */}
      <TouchableOpacity
        style={styles.termsItem}
        onPress={() => setTermsModalVisible(true)}
      >
        <View style={styles.termsItemContent}>
          <Ionicons name="document-text-outline" size={24} color="#6B7280" />
          <View style={styles.termsItemText}>
            <Text style={styles.termsItemTitle}>Terms of Service</Text>
            <Text style={styles.termsItemSubtitle}>Read our terms and conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.termsCheckbox}
        onPress={() => setTermsAccepted(!termsAccepted)}
      >
        <View
          style={[
            styles.checkbox,
            termsAccepted && styles.checkboxChecked,
          ]}
        >
          {termsAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.termsCheckboxText}>
          I have read and agree to the Terms of Service
        </Text>
      </TouchableOpacity>

      {/* Privacy Policy */}
      <TouchableOpacity
        style={[styles.termsItem, { marginTop: 20 }]}
        onPress={() => setPrivacyModalVisible(true)}
      >
        <View style={styles.termsItemContent}>
          <Ionicons name="lock-closed-outline" size={24} color="#6B7280" />
          <View style={styles.termsItemText}>
            <Text style={styles.termsItemTitle}>Privacy Policy</Text>
            <Text style={styles.termsItemSubtitle}>How we handle your data</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.termsCheckbox}
        onPress={() => setPrivacyAccepted(!privacyAccepted)}
      >
        <View
          style={[
            styles.checkbox,
            privacyAccepted && styles.checkboxChecked,
          ]}
        >
          {privacyAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.termsCheckboxText}>
          I have read and agree to the Privacy Policy
        </Text>
      </TouchableOpacity>

      {/* Note for edit mode */}
      {isEditMode && (
        <View style={styles.editModeNote}>
          <Ionicons name="information-circle" size={16} color="#3B82F6" />
          <Text style={styles.editModeNoteText}>
            You've already accepted the terms. This step is for review only.
          </Text>
        </View>
      )}

      {/* Terms Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.termsModalContainer}>
          <View style={styles.termsModalHeader}>
            <Text style={styles.termsModalTitle}>Terms of Service</Text>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.termsModalContent}>
            <Text style={styles.termsModalText}>
              <Text style={styles.termsModalSectionTitle}>1. Agency Registration{'\n'}</Text>
              By registering as an agency on Ethiopian Maids platform, you agree to provide accurate and complete information about your business, including valid trade license and contact details.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>2. Worker Management{'\n'}</Text>
              Agencies are responsible for ensuring all workers registered through their account have proper documentation, background checks, and necessary work permits.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>3. Service Standards{'\n'}</Text>
              Agencies must maintain professional standards in all interactions with clients and workers. Any complaints or disputes must be handled promptly and fairly.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>4. Fees and Payments{'\n'}</Text>
              Agencies agree to the platform's fee structure and payment terms. All payments must be made through the platform's approved payment methods.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>5. Account Termination{'\n'}</Text>
              The platform reserves the right to suspend or terminate agency accounts that violate these terms or engage in fraudulent activities.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>6. Updates to Terms{'\n'}</Text>
              These terms may be updated periodically. Continued use of the platform constitutes acceptance of any changes.
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.termsModalButton}
            onPress={() => {
              setTermsAccepted(true);
              setTermsModalVisible(false);
            }}
          >
            <Text style={styles.termsModalButtonText}>Accept & Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.termsModalContainer}>
          <View style={styles.termsModalHeader}>
            <Text style={styles.termsModalTitle}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.termsModalContent}>
            <Text style={styles.termsModalText}>
              <Text style={styles.termsModalSectionTitle}>1. Information We Collect{'\n'}</Text>
              We collect information you provide during registration, including agency details, contact information, and uploaded documents for verification.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>2. How We Use Your Information{'\n'}</Text>
              Your information is used to verify your agency, facilitate connections with clients, and improve our services. We never sell your data to third parties.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>3. Data Security{'\n'}</Text>
              We implement industry-standard security measures to protect your data. All sensitive information is encrypted in transit and at rest.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>4. Data Retention{'\n'}</Text>
              We retain your data for as long as your account is active. You can request deletion of your data by contacting support.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>5. Your Rights{'\n'}</Text>
              You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.{'\n\n'}

              <Text style={styles.termsModalSectionTitle}>6. Contact Us{'\n'}</Text>
              For privacy-related inquiries, please contact our privacy team at privacy@ethiopianmaids.com
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.termsModalButton}
            onPress={() => {
              setPrivacyAccepted(true);
              setPrivacyModalVisible(false);
            }}
          >
            <Text style={styles.termsModalButtonText}>Accept & Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );

  // Step 9: Account Status Card
  const renderAccountStatusCard = () => (
    <View style={styles.stepCard}>
      <View style={styles.accountStatusHeader}>
        <Text style={styles.accountStatusTitle}>Account Summary</Text>
      </View>

      {/* Verification Status */}
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: profileData?.verified ? '#ECFDF5' : '#FEF3C7' },
            ]}
          >
            <Ionicons
              name={profileData?.verified ? 'checkmark-circle' : 'time'}
              size={24}
              color={profileData?.verified ? '#10B981' : '#F59E0B'}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusLabel}>Verification Status</Text>
            <Text
              style={[
                styles.statusValue,
                { color: getVerificationColor(profileData?.verification_status || '') },
              ]}
            >
              {profileData?.verification_status || 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Subscription Tier */}
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <View style={[styles.statusIconContainer, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="diamond" size={24} color="#F97316" />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusLabel}>Subscription Plan</Text>
            <Text style={styles.statusValue}>
              {profileData?.subscription_tier || 'Free'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{profileData?.total_maids || 0}</Text>
          <Text style={styles.statBoxLabel}>Total Maids</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{profileData?.active_maids || 0}</Text>
          <Text style={styles.statBoxLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{profileData?.successful_placements || 0}</Text>
          <Text style={styles.statBoxLabel}>Placements</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>
            {profileData?.average_rating ? profileData.average_rating.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statBoxLabel}>Rating</Text>
        </View>
      </View>
    </View>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderAgencyInfoCard();
      case 2:
        return renderIdentityVerificationCard();
      case 3:
        return renderContactInfoCard();
      case 4:
        return renderLocationCard();
      case 5:
        return renderSpecializationsCard();
      case 6:
        return renderOnlinePresenceCard();
      case 7:
        return renderLicenseUploadCard();
      case 8:
        return renderTermsCard();
      case 9:
        return renderAccountStatusCard();
      default:
        return null;
    }
  };

  // Render progress bar
  const renderProgressBar = () => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {STEPS.length}
      </Text>
    </View>
  );

  // Render step indicators
  const renderStepIndicators = () => (
    <View style={styles.stepIndicatorsContainer}>
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepIndicator,
              isActive && styles.stepIndicatorActive,
              isCompleted && styles.stepIndicatorCompleted,
            ]}
            onPress={() => {
              // Allow jumping to previous steps or current step
              if (step.id <= currentStep) {
                setCurrentStep(step.id);
              }
            }}
          >
            <Ionicons
              name={isCompleted ? 'checkmark' : step.icon}
              size={16}
              color={isActive ? '#fff' : isCompleted ? '#fff' : '#9CA3AF'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Render navigation buttons
  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      <View style={styles.navigationRow}>
        {currentStep > 1 ? (
          <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.continueButton, updating && styles.continueButtonDisabled]}
          onPress={handleNextStep}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                {currentStep === STEPS.length ? 'Complete' : 'Continue'}
              </Text>
              <Ionicons
                name={currentStep === STEPS.length ? 'checkmark' : 'chevron-forward'}
                size={20}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveExitButton} onPress={handleSaveAndExit}>
        <Ionicons name="save-outline" size={18} color="#6B7280" />
        <Text style={styles.saveExitButtonText}>Save & Exit</Text>
      </TouchableOpacity>
    </View>
  );

  // Render document upload modal
  const renderDocumentUploadModal = () => (
    <Modal
      visible={documentUploadModal}
      animationType="slide"
      transparent={true}
      onRequestClose={closeDocumentUploadModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDocType === 'passport' ? 'Upload Passport' :
               selectedDocType === 'national_id' ? 'Upload National ID' :
               'Upload Trade License'}
            </Text>
            <TouchableOpacity onPress={closeDocumentUploadModal}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Scanning Animation */}
          {documentUploadState.isScanning && (
            <View style={styles.scanningContainer}>
              <View style={styles.scanFrame}>
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      top: scanProgressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
                <Ionicons name="scan" size={80} color="#F97316" />
              </View>
              <Text style={styles.scanningText}>Scanning document...</Text>
              <Text style={styles.scanningSubtext}>Bank-grade verification in progress</Text>
            </View>
          )}

          {/* Upload Progress */}
          {documentUploadState.isUploading && !documentUploadState.isScanning && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${documentUploadState.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{documentUploadState.progress}% Uploading...</Text>
            </View>
          )}

          {/* Scan Result */}
          {documentUploadState.scanResult && !documentUploadState.isScanning && (
            <View style={styles.scanResultContainer}>
              {documentUploadState.scanResult.isValid ? (
                <>
                  <View style={styles.scanSuccessIcon}>
                    <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                  </View>
                  <Text style={styles.scanResultTitle}>Document Verified</Text>
                  <Text style={styles.scanResultConfidence}>
                    Confidence: {(documentUploadState.scanResult.confidence * 100).toFixed(0)}%
                  </Text>
                  {documentUploadState.scanResult.extractedData.documentNumber && (
                    <View style={styles.extractedDataItem}>
                      <Text style={styles.extractedDataLabel}>Document Number:</Text>
                      <Text style={styles.extractedDataValue}>
                        {documentUploadState.scanResult.extractedData.documentNumber}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.scanFailIcon}>
                    <Ionicons name="warning" size={60} color="#EF4444" />
                  </View>
                  <Text style={styles.scanResultTitleError}>Verification Issues</Text>
                  {documentUploadState.scanResult.issues.map((issue, index) => (
                    <Text key={index} style={styles.scanIssueText}>• {issue}</Text>
                  ))}
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => setDocumentUploadState(prev => ({ ...prev, scanResult: null }))}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Upload Options */}
          {!documentUploadState.isUploading && !documentUploadState.isScanning && !documentUploadState.scanResult && (
            <>
              <View style={styles.uploadInstructions}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.instructionText}>
                  For best results, ensure good lighting and place document on a flat surface.
                  Auto-scan will verify document authenticity.
                </Text>
              </View>

              <View style={styles.uploadOptionsContainer}>
                <TouchableOpacity style={styles.uploadOption} onPress={captureDocumentPhoto}>
                  <View style={[styles.uploadOptionIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="camera" size={28} color="#10B981" />
                  </View>
                  <Text style={styles.uploadOptionTitle}>Scan with Camera</Text>
                  <Text style={styles.uploadOptionSubtitle}>Auto-detect & verify</Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadOption} onPress={pickDocumentFromGallery}>
                  <View style={[styles.uploadOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="images" size={28} color="#3B82F6" />
                  </View>
                  <Text style={styles.uploadOptionTitle}>Choose Photo</Text>
                  <Text style={styles.uploadOptionSubtitle}>From gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadOption} onPress={pickDocumentFile}>
                  <View style={[styles.uploadOptionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="document" size={28} color="#D97706" />
                  </View>
                  <Text style={styles.uploadOptionTitle}>Upload File</Text>
                  <Text style={styles.uploadOptionSubtitle}>PDF or Image</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.securityNote}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={styles.securityNoteText}>
                  Bank-grade encryption • Your documents are secure
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchProfile({ variables: { email: user?.email } })}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get current step info
  const currentStepInfo = STEPS[currentStep - 1];

  // Render Edit Request Modal
  const renderEditRequestModal = () => (
    <Modal
      visible={editRequestModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditRequestModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editRequestModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Changes for Approval</Text>
            <TouchableOpacity onPress={() => setEditRequestModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.editRequestInfo}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={styles.editRequestInfoText}>
              Profile changes require admin approval to maintain platform integrity.
            </Text>
          </View>

          <View style={styles.changesPreview}>
            <Text style={styles.changesPreviewTitle}>Requested Changes:</Text>
            {Object.entries(pendingChanges).map(([field, value]) => (
              <View key={field} style={styles.changeItem}>
                <Text style={styles.changeFieldName}>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                </Text>
                <Text style={styles.changeFieldValue} numberOfLines={2}>
                  {Array.isArray(value) ? value.join(', ') : String(value || 'Empty')}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Reason for Changes *</Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={editRequestReason}
              onChangeText={setEditRequestReason}
              placeholder="Please explain why you need to update these fields..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.editRequestActions}>
            <TouchableOpacity
              style={styles.editRequestCancelBtn}
              onPress={() => setEditRequestModal(false)}
            >
              <Text style={styles.editRequestCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.editRequestSubmitBtn,
                submittingEditRequest && styles.editRequestSubmitBtnDisabled,
              ]}
              onPress={handleSubmitEditRequest}
              disabled={submittingEditRequest}
            >
              {submittingEditRequest ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.editRequestSubmitText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render View Mode for completed profiles
  const renderViewMode = () => (
    <>
      <Stack.Screen
        options={{
          title: 'Agency Profile',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerRight: () => (
            <TouchableOpacity onPress={handleEnterEditMode} style={styles.headerEditButton}>
              <Ionicons name="create-outline" size={22} color="#F97316" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.viewModeHeader}>
          <TouchableOpacity onPress={showPhotoOptions} style={styles.viewModeAvatarContainer}>
            {profileData?.logo_url ? (
              <Image source={{ uri: profileData.logo_url }} style={styles.viewModeAvatar} />
            ) : (
              <View style={styles.viewModeAvatarPlaceholder}>
                <Text style={styles.viewModeAvatarText}>
                  {profileData?.full_name?.charAt(0) || 'A'}
                </Text>
              </View>
            )}
            <View style={styles.viewModeCameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.viewModeAgencyName}>{profileData?.full_name}</Text>

          {/* Verification Badge */}
          <View
            style={[
              styles.viewModeVerificationBadge,
              { backgroundColor: getVerificationColor(profileData?.verification_status || '') + '20' },
            ]}
          >
            <Ionicons
              name={profileData?.verified ? 'checkmark-circle' : 'time'}
              size={16}
              color={getVerificationColor(profileData?.verification_status || '')}
            />
            <Text
              style={[
                styles.viewModeVerificationText,
                { color: getVerificationColor(profileData?.verification_status || '') },
              ]}
            >
              {profileData?.verification_status || 'Pending Verification'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.viewModeStatsRow}>
          <View style={styles.viewModeStatItem}>
            <Text style={styles.viewModeStatValue}>{profileData?.total_maids || 0}</Text>
            <Text style={styles.viewModeStatLabel}>Total Maids</Text>
          </View>
          <View style={styles.viewModeStatItem}>
            <Text style={styles.viewModeStatValue}>{profileData?.active_maids || 0}</Text>
            <Text style={styles.viewModeStatLabel}>Active</Text>
          </View>
          <View style={styles.viewModeStatItem}>
            <Text style={styles.viewModeStatValue}>{profileData?.successful_placements || 0}</Text>
            <Text style={styles.viewModeStatLabel}>Placements</Text>
          </View>
          <View style={styles.viewModeStatItem}>
            <Text style={styles.viewModeStatValue}>
              {profileData?.average_rating ? profileData.average_rating.toFixed(1) : '-'}
            </Text>
            <Text style={styles.viewModeStatLabel}>Rating</Text>
          </View>
        </View>

        {/* Profile Sections */}
        <View style={styles.viewModeSections}>
          {/* Agency Information */}
          <View style={styles.viewModeSection}>
            <View style={styles.viewModeSectionHeader}>
              <Ionicons name="business" size={20} color="#F97316" />
              <Text style={styles.viewModeSectionTitle}>Agency Information</Text>
            </View>
            <View style={styles.viewModeSectionContent}>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>Agency Name</Text>
                <Text style={styles.viewModeFieldValue}>{profileData?.full_name || '-'}</Text>
              </View>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>Year Established</Text>
                <Text style={styles.viewModeFieldValue}>{profileData?.established_year || '-'}</Text>
              </View>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>License Number</Text>
                <Text style={styles.viewModeFieldValue}>{profileData?.license_number || '-'}</Text>
              </View>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>License Expiry</Text>
                <Text style={styles.viewModeFieldValue}>{profileData?.license_expiry_date || '-'}</Text>
              </View>
              {profileData?.agency_description && (
                <View style={styles.viewModeField}>
                  <Text style={styles.viewModeFieldLabel}>Description</Text>
                  <Text style={styles.viewModeFieldValue}>{profileData.agency_description}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.viewModeSection}>
            <View style={styles.viewModeSectionHeader}>
              <Ionicons name="person" size={20} color="#F97316" />
              <Text style={styles.viewModeSectionTitle}>Contact Information</Text>
            </View>
            <View style={styles.viewModeSectionContent}>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>Authorized Person</Text>
                <Text style={styles.viewModeFieldValue}>
                  {profileData?.authorized_person_name || profileData?.contact_person_name || '-'}
                </Text>
              </View>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>Email</Text>
                <Text style={styles.viewModeFieldValue}>
                  {profileData?.business_email || profileData?.authorized_person_email || '-'}
                </Text>
              </View>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>Phone</Text>
                <Text style={styles.viewModeFieldValue}>
                  {profileData?.business_phone || profileData?.authorized_person_phone || '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.viewModeSection}>
            <View style={styles.viewModeSectionHeader}>
              <Ionicons name="location" size={20} color="#F97316" />
              <Text style={styles.viewModeSectionTitle}>Location</Text>
            </View>
            <View style={styles.viewModeSectionContent}>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>Country</Text>
                <Text style={styles.viewModeFieldValue}>{profileData?.country || '-'}</Text>
              </View>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>City</Text>
                <Text style={styles.viewModeFieldValue}>{profileData?.city || '-'}</Text>
              </View>
              <View style={styles.viewModeField}>
                <Text style={styles.viewModeFieldLabel}>Address</Text>
                <Text style={styles.viewModeFieldValue}>
                  {profileData?.business_address || profileData?.address || '-'}
                </Text>
              </View>
              {profileData?.service_countries && profileData.service_countries.length > 0 && (
                <View style={styles.viewModeField}>
                  <Text style={styles.viewModeFieldLabel}>Service Countries</Text>
                  <Text style={styles.viewModeFieldValue}>
                    {profileData.service_countries.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Specializations */}
          {profileData?.specialization && profileData.specialization.length > 0 && (
            <View style={styles.viewModeSection}>
              <View style={styles.viewModeSectionHeader}>
                <Ionicons name="briefcase" size={20} color="#F97316" />
                <Text style={styles.viewModeSectionTitle}>Specializations</Text>
              </View>
              <View style={styles.viewModeChipsContainer}>
                {profileData.specialization.map((spec, index) => (
                  <View key={index} style={styles.viewModeChip}>
                    <Text style={styles.viewModeChipText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Online Presence */}
          {(profileData?.website_url || profileData?.website) && (
            <View style={styles.viewModeSection}>
              <View style={styles.viewModeSectionHeader}>
                <Ionicons name="globe" size={20} color="#F97316" />
                <Text style={styles.viewModeSectionTitle}>Online Presence</Text>
              </View>
              <View style={styles.viewModeSectionContent}>
                <View style={styles.viewModeField}>
                  <Text style={styles.viewModeFieldLabel}>Website</Text>
                  <Text style={[styles.viewModeFieldValue, styles.viewModeLink]}>
                    {profileData?.website_url || profileData?.website}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Subscription */}
          <View style={styles.viewModeSection}>
            <View style={styles.viewModeSectionHeader}>
              <Ionicons name="diamond" size={20} color="#F97316" />
              <Text style={styles.viewModeSectionTitle}>Subscription</Text>
            </View>
            <View style={styles.viewModeSectionContent}>
              <View style={styles.viewModeSubscriptionBadge}>
                <Text style={styles.viewModeSubscriptionText}>
                  {profileData?.subscription_tier || 'Free'} Plan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <View style={styles.viewModeEditButtonContainer}>
          <TouchableOpacity style={styles.viewModeEditButton} onPress={handleEnterEditMode}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.viewModeEditButtonText}>Request Profile Changes</Text>
          </TouchableOpacity>
          <Text style={styles.viewModeEditNote}>
            Profile changes require admin approval
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Document Upload Modal */}
      {renderDocumentUploadModal()}
    </>
  );

  // Render Edit Mode (Step-by-step wizard for editing)
  const renderEditModeWizard = () => (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Edit Profile' : 'Complete Your Profile',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerLeft: isEditMode ? () => (
            <TouchableOpacity onPress={handleCancelEditMode} style={styles.headerCancelButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          ) : undefined,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Edit Mode Banner */}
        {isEditMode && (
          <View style={styles.editModeBanner}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={styles.editModeBannerText}>
              Changes will be submitted for admin approval
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Step Indicators */}
        {renderStepIndicators()}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Step Header */}
          <View style={styles.stepHeader}>
            <View style={styles.stepIconContainer}>
              <Ionicons name={currentStepInfo.icon} size={28} color="#F97316" />
            </View>
            <Text style={styles.stepTitle}>{currentStepInfo.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStepInfo.subtitle}</Text>
          </View>

          {/* Step Content */}
          <View style={styles.stepContentContainer}>
            {renderStepContent()}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Navigation Buttons - Modified for Edit Mode */}
        {isEditMode ? (
          <View style={styles.navigationContainer}>
            <View style={styles.navigationRow}>
              {currentStep > 1 ? (
                <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
                  <Ionicons name="chevron-back" size={20} color="#6B7280" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}

              {currentStep === STEPS.length ? (
                <TouchableOpacity
                  style={[
                    styles.submitChangesButton,
                    Object.keys(pendingChanges).length === 0 && styles.submitChangesButtonDisabled,
                  ]}
                  onPress={() => setEditRequestModal(true)}
                  disabled={Object.keys(pendingChanges).length === 0}
                >
                  <Text style={styles.submitChangesButtonText}>
                    Review Changes ({Object.keys(pendingChanges).length})
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.continueButton} onPress={handleNextStep}>
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.saveExitButton} onPress={handleCancelEditMode}>
              <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
              <Text style={styles.saveExitButtonText}>Cancel Editing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderNavigationButtons()
        )}
      </KeyboardAvoidingView>

      {/* Document Upload Modal */}
      {renderDocumentUploadModal()}

      {/* Edit Request Modal */}
      {renderEditRequestModal()}
    </>
  );

  // Decide which view to show
  // If profile is complete and NOT in edit mode, show view mode
  // Otherwise show wizard (for new registration or edit mode)
  if (profileComplete && !isEditMode) {
    return renderViewMode();
  }

  return renderEditModeWizard();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F97316',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  agencyName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
    gap: 6,
  },
  verificationText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statusGridItem: {
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  subscriptionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionTier: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subscriptionStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  commissionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  // Document Upload Styles
  docVerificationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  docVerificationTextContainer: {
    flex: 1,
  },
  docVerificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  docVerificationSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  docUploadButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  docUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  docUploadButtonUploaded: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  docUploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docUploadIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docUploadTextContainer: {
    gap: 2,
  },
  docUploadButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  docUploadButtonSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  docOrDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  docOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  docOrText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  docFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  docFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docFeatureText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Uploaded Documents Styles
  uploadedDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadedDocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  uploadedDocThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  uploadedDocThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedDocInfo: {
    flex: 1,
    gap: 2,
  },
  uploadedDocName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  uploadedDocNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  uploadedDocStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  uploadedDocStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  uploadedDocAction: {
    padding: 8,
  },
  rejectionReasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  rejectionReasonText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 18,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
  },
  pendingNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Scanning Animation Styles
  scanningContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  scanFrame: {
    width: 160,
    height: 120,
    borderWidth: 3,
    borderColor: '#F97316',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F97316',
  },
  scanningText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  scanningSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Progress Styles
  progressContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Scan Result Styles
  scanResultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scanSuccessIcon: {
    marginBottom: 16,
  },
  scanFailIcon: {
    marginBottom: 16,
  },
  scanResultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  scanResultTitleError: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 12,
  },
  scanResultConfidence: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  extractedDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  extractedDataLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  extractedDataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  scanIssueText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  // Upload Options Styles
  uploadInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  uploadOptionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  uploadOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  uploadOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  uploadOptionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  securityNoteText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // ============================================
  // Step-by-Step Wizard Styles
  // ============================================
  progressBarContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 3,
  },
  stepIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: '#F97316',
  },
  stepIndicatorCompleted: {
    backgroundColor: '#10B981',
  },
  stepHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  stepIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepContentContainer: {
    paddingHorizontal: 16,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  backButtonPlaceholder: {
    width: 80,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveExitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  saveExitButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Specialization Card Styles
  specializationHeader: {
    marginBottom: 20,
  },
  specializationTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  specializationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  specializationSection: {
    marginBottom: 20,
  },
  specializationSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  chipTextSelected: {
    color: '#F97316',
    fontWeight: '500',
  },
  selectedCountContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  // Online Presence Card Styles
  onlinePresenceHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  onlinePresenceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  onlinePresenceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  websiteNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  websiteNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
  },
  // Account Status Card Styles
  accountStatusHeader: {
    marginBottom: 20,
  },
  accountStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusRow: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  // ============================================
  // View Mode Styles
  // ============================================
  headerEditButton: {
    padding: 8,
  },
  headerCancelButton: {
    padding: 8,
    marginLeft: 8,
  },
  viewModeHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  viewModeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#F97316',
  },
  viewModeAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F97316',
  },
  viewModeAvatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#F97316',
  },
  viewModeCameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  viewModeAgencyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  viewModeVerificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewModeVerificationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  viewModeStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
  },
  viewModeStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewModeSections: {
    padding: 16,
  },
  viewModeSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewModeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  viewModeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewModeSectionContent: {
    gap: 12,
  },
  viewModeField: {
    gap: 4,
  },
  viewModeFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewModeFieldValue: {
    fontSize: 15,
    color: '#1F2937',
  },
  viewModeLink: {
    color: '#3B82F6',
  },
  viewModeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  viewModeChip: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  viewModeChipText: {
    fontSize: 13,
    color: '#EA580C',
  },
  viewModeSubscriptionBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewModeSubscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  viewModeEditButtonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  viewModeEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  viewModeEditButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  viewModeEditNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  // ============================================
  // Edit Mode Styles
  // ============================================
  editModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  editModeBannerText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  submitChangesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  submitChangesButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitChangesButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // ============================================
  // Edit Request Modal Styles
  // ============================================
  editRequestModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  editRequestInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  editRequestInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
  },
  changesPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  changesPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  changeItem: {
    marginBottom: 10,
  },
  changeFieldName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  changeFieldValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  editRequestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  editRequestCancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  editRequestCancelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  editRequestSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  editRequestSubmitBtnDisabled: {
    opacity: 0.7,
  },
  editRequestSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // ============================================
  // License Upload Card Styles
  // ============================================
  licenseUploadHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  licenseUploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  licenseUploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  uploadedDocContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uploadedDocInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  docIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docDetails: {
    flex: 1,
  },
  docFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  docStatusRow: {
    flexDirection: 'row',
  },
  docStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  docStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rejectionReasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  rejectionReasonText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
  },
  replaceDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    gap: 6,
  },
  replaceDocButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  licenseUploadButton: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  licenseUploadIconContainer: {
    marginBottom: 12,
  },
  licenseUploadButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 4,
  },
  licenseUploadButtonSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  licenseInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  licenseInfoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  docPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  docPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  pdfPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfPreviewText: {
    marginTop: 8,
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '500',
  },
  docPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  docStatusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  docStatusTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  // ============================================
  // Terms & Conditions Card Styles
  // ============================================
  termsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  termsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  termsItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  termsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  termsItemText: {
    flex: 1,
  },
  termsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  termsItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  termsCheckboxText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  editModeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  editModeNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
  },
  termsModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  termsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  termsModalContent: {
    flex: 1,
    padding: 20,
  },
  termsModalText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  termsModalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  termsModalButton: {
    backgroundColor: '#F97316',
    marginHorizontal: 20,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  termsModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
