/**
 * Maid Profile Registration - Step by Step Form
 *
 * A wizard-style registration form with 6 steps:
 * 1. Personal Information
 * 2. Location
 * 3. Professional Information
 * 4. Availability & Preferences
 * 5. Salary Expectations
 * 6. About Me & Additional Notes
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../utils/firebaseConfig';

const { width } = Dimensions.get('window');

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

// GraphQL query to fetch maid profile with all fields by user_id
const GET_MAID_PROFILE = gql`
  query GetMaidProfile($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      first_name
      last_name
      phone_number
      alternative_phone
      nationality
      date_of_birth
      marital_status
      children_count
      religion
      education_level
      experience_years
      about_me
      skills
      key_responsibilities
      languages
      current_location
      country
      state_province
      suburb
      street_address
      iso_country_code
      primary_profession
      availability_status
      available_from
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      live_in_preference
      contract_duration_preference
      work_preferences
      work_history
      current_visa_status
      previous_countries
      additional_notes
      profile_photo_url
      introduction_video_url
      medical_certificate_valid
      police_clearance_valid
      average_rating
      is_approved
      is_agency_managed
      agency_id
      image_processing_metadata
    }
  }
`;

// GraphQL mutation to update maid profile
// Note: maid_profiles.id is String (Firebase UID), not uuid
const UPDATE_MAID_PROFILE = gql`
  mutation UpdateMaidProfile($id: String!, $data: maid_profiles_set_input!) {
    update_maid_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      first_name
      last_name
      phone_number
      alternative_phone
      nationality
      date_of_birth
      marital_status
      children_count
      religion
      education_level
      experience_years
      about_me
      skills
      key_responsibilities
      languages
      current_location
      country
      state_province
      suburb
      street_address
      iso_country_code
      primary_profession
      availability_status
      available_from
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      live_in_preference
      contract_duration_preference
      work_preferences
      work_history
      current_visa_status
      previous_countries
      additional_notes
      profile_photo_url
      introduction_video_url
      image_processing_metadata
    }
  }
`;

// GraphQL mutation to create a new maid profile
const CREATE_MAID_PROFILE = gql`
  mutation CreateMaidProfile($data: maid_profiles_insert_input!) {
    insert_maid_profiles_one(object: $data) {
      id
      full_name
      first_name
      last_name
      phone_number
      alternative_phone
      nationality
      date_of_birth
      marital_status
      children_count
      religion
      education_level
      experience_years
      about_me
      skills
      key_responsibilities
      languages
      current_location
      country
      state_province
      suburb
      street_address
      iso_country_code
      primary_profession
      availability_status
      available_from
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      live_in_preference
      contract_duration_preference
      work_preferences
      work_history
      current_visa_status
      previous_countries
      additional_notes
      profile_photo_url
      introduction_video_url
    }
  }
`;

// GraphQL query to fetch maid documents
const GET_MAID_DOCUMENTS = gql`
  query GetMaidDocuments($maidId: String!) {
    maid_documents(where: { maid_id: { _eq: $maidId } }, order_by: { created_at: desc }) {
      id
      maid_id
      document_type
      title
      document_url
      file_name
      file_size
      mime_type
      created_at
    }
  }
`;

// GraphQL mutation to insert a document
const INSERT_MAID_DOCUMENT = gql`
  mutation InsertMaidDocument($data: maid_documents_insert_input!) {
    insert_maid_documents_one(object: $data) {
      id
      maid_id
      document_type
      title
      document_url
      file_url
      file_path
      file_name
      file_size
      mime_type
      created_at
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

// GraphQL query to fetch maid gallery images
const GET_MAID_IMAGES = gql`
  query GetMaidImages($maidId: uuid!) {
    maid_images(
      where: { maid_id: { _eq: $maidId } }
      order_by: [{ is_primary: desc }, { display_order: asc }]
    ) {
      id
      maid_id
      file_url
      file_name
      file_size
      mime_type
      is_primary
      display_order
      created_at
    }
  }
`;

// GraphQL mutation to insert a gallery image
const INSERT_MAID_IMAGE = gql`
  mutation InsertMaidImage($data: maid_images_insert_input!) {
    insert_maid_images_one(object: $data) {
      id
      maid_id
      file_url
      file_name
      file_size
      mime_type
      is_primary
      display_order
      created_at
    }
  }
`;

// GraphQL mutation to delete a gallery image
const DELETE_MAID_IMAGE = gql`
  mutation DeleteMaidImage($id: uuid!) {
    delete_maid_images_by_pk(id: $id) {
      id
    }
  }
`;

// GraphQL mutation to update gallery image (for reordering/setting primary)
const UPDATE_MAID_IMAGE = gql`
  mutation UpdateMaidImage($id: uuid!, $data: maid_images_set_input!) {
    update_maid_images_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      is_primary
      display_order
    }
  }
`;

// GraphQL mutation to update profiles table registration_complete field and user_type
// Note: profiles.id is String (Firebase UID), not uuid
const UPDATE_PROFILE_REGISTRATION = gql`
  mutation UpdateProfileRegistration($id: String!, $registration_complete: Boolean!, $user_type: String!) {
    update_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { registration_complete: $registration_complete, user_type: $user_type }
    ) {
      id
      registration_complete
      user_type
    }
  }
`;

// Identity document types (required - either passport OR national_id)
const IDENTITY_DOCUMENT_TYPES = [
  { id: 'passport', label: 'Passport', icon: 'document-text' },
  { id: 'national_id', label: 'National ID', icon: 'card' },
];

// Optional document types for verification (shown in last step)
const OPTIONAL_DOCUMENT_TYPES = [
  { id: 'work_permit', label: 'Work Permit', icon: 'briefcase' },
  { id: 'medical_certificate', label: 'Medical Certificate', icon: 'medkit' },
  { id: 'police_clearance', label: 'Police Clearance', icon: 'shield-checkmark' },
  { id: 'education_certificate', label: 'Education Certificate', icon: 'school' },
  { id: 'training_certificate', label: 'Training Certificate', icon: 'ribbon' },
  { id: 'reference_letter', label: 'Reference Letter', icon: 'mail' },
];

// All document types combined (for backwards compatibility)
const DOCUMENT_TYPES = [
  ...IDENTITY_DOCUMENT_TYPES.map(d => ({ ...d, required: false })), // Not individually required, but one is needed
  ...OPTIONAL_DOCUMENT_TYPES.map(d => ({ ...d, required: false })),
];

interface MaidDocument {
  id: string;
  maid_id: string;
  document_type: string;
  title: string;
  document_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

interface MaidImage {
  id: string;
  maid_id: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  is_primary?: boolean;
  display_order?: number;
  created_at: string;
}

interface ProfileData {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  alternative_phone: string;
  nationality: string;
  date_of_birth: string | null;
  marital_status: string;
  children_count: number;
  religion: string;
  education_level: string;
  experience_years: number;
  bio: string;
  about_me: string;
  skills: string[];
  key_responsibilities: string[];
  languages: string[];
  current_location: string;
  country: string;
  state_province: string;
  suburb: string;
  street_address: string;
  availability_status: string;
  available_from: string | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  salary_currency: string;
  preferred_salary_min: number | null;
  preferred_salary_max: number | null;
  preferred_currency: string;
  live_in_preference: boolean;
  contract_duration_preference: string;
  work_preferences: string[];
  current_visa_status: string;
  previous_countries: string[];
  work_history: any[];
  additional_notes: string;
  profile_photo_url: string;
  introduction_video_url: string;
  medical_certificate_valid: boolean;
  police_clearance_valid: boolean;
  average_rating: number;
  is_approved: boolean;
  is_agency_managed: boolean;
  agency_id: string | null;
  image_processing_metadata?: {
    gallery?: Array<{
      url: string;
      order: number;
      is_primary: boolean;
    }>;
    [key: string]: any;
  };
}

// Step configuration
const STEPS = [
  { id: 1, title: 'Personal Info', icon: 'person' },
  { id: 2, title: 'Location', icon: 'location' },
  { id: 3, title: 'Professional', icon: 'briefcase' },
  { id: 4, title: 'Availability', icon: 'calendar' },
  { id: 5, title: 'Salary', icon: 'cash' },
  { id: 6, title: 'About Me', icon: 'document-text' },
];

// Dropdown options
const NATIONALITIES = [
  'Ethiopian',
  'Eritrean',
  'Kenyan',
  'Ugandan',
  'Filipino',
  'Indonesian',
  'Indian',
  'Sri Lankan',
  'Nepali',
  'Bangladeshi',
  'Other',
];

// Must match database constraint: marital_status IN ('single', 'married', 'divorced', 'widowed')
const MARITAL_STATUS_OPTIONS = [
  'single',
  'married',
  'divorced',
  'widowed',
];

const RELIGION_OPTIONS = [
  'Christianity',
  'Islam',
  'Orthodox',
  'Catholic',
  'Protestant',
  'Hindu',
  'Buddhist',
  'Other',
  'Prefer not to say',
];

// Countries with their states/provinces, major cities, and ISO codes (synced with web)
const COUNTRY_DATA: Record<string, { iso: string; states: Record<string, string[]> }> = {
  'Ethiopia': {
    iso: 'ET',
    states: {
      'Addis Ababa': ['Addis Ababa'],
      'Oromia': ['Adama', 'Jimma', 'Bishoftu', 'Shashemene', 'Nekemte'],
      'Amhara': ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Markos'],
      'Tigray': ['Mekelle', 'Axum', 'Adwa', 'Shire'],
      'SNNPR': ['Hawassa', 'Arba Minch', 'Wolaita Sodo', 'Dilla'],
      'Somali': ['Jijiga', 'Gode', 'Kebri Dahar'],
      'Afar': ['Semera', 'Asaita', 'Dubti'],
      'Benishangul-Gumuz': ['Assosa', 'Metekel'],
      'Gambela': ['Gambela'],
      'Harari': ['Harar'],
      'Dire Dawa': ['Dire Dawa'],
      'Sidama': ['Hawassa'],
    },
  },
  'United Arab Emirates': {
    iso: 'AE',
    states: {
      'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Madinat Zayed'],
      'Dubai': ['Dubai City', 'Jebel Ali', 'Hatta'],
      'Sharjah': ['Sharjah City', 'Khor Fakkan', 'Kalba'],
      'Ajman': ['Ajman City'],
      'Umm Al Quwain': ['Umm Al Quwain City'],
      'Ras Al Khaimah': ['Ras Al Khaimah City'],
      'Fujairah': ['Fujairah City', 'Dibba Al-Fujairah'],
    },
  },
  'Saudi Arabia': {
    iso: 'SA',
    states: {
      'Riyadh': ['Riyadh City', 'Diriyah', 'Al Kharj'],
      'Makkah': ['Mecca', 'Jeddah', 'Taif'],
      'Madinah': ['Medina', 'Yanbu'],
      'Eastern Province': ['Dammam', 'Dhahran', 'Al Khobar', 'Jubail'],
      'Asir': ['Abha', 'Khamis Mushait'],
      'Jizan': ['Jizan City'],
      'Najran': ['Najran City'],
      'Al Bahah': ['Al Bahah City'],
      'Northern Borders': ['Arar'],
      'Jawf': ['Sakaka'],
      'Hail': ['Hail City'],
      'Qassim': ['Buraidah', 'Unaizah'],
      'Tabuk': ['Tabuk City'],
    },
  },
  'Kuwait': {
    iso: 'KW',
    states: {
      'Al Asimah': ['Kuwait City'],
      'Hawalli': ['Hawalli', 'Salmiya'],
      'Farwaniya': ['Farwaniya', 'Jleeb Al-Shuyoukh'],
      'Mubarak Al-Kabeer': ['Mubarak Al-Kabeer'],
      'Ahmadi': ['Ahmadi', 'Fahaheel'],
      'Jahra': ['Jahra'],
    },
  },
  'Qatar': {
    iso: 'QA',
    states: {
      'Doha': ['Doha City', 'West Bay', 'The Pearl'],
      'Al Rayyan': ['Al Rayyan'],
      'Al Wakrah': ['Al Wakrah'],
      'Al Khor': ['Al Khor'],
      'Umm Salal': ['Umm Salal'],
      'Al Daayen': ['Lusail'],
    },
  },
  'Bahrain': {
    iso: 'BH',
    states: {
      'Capital': ['Manama'],
      'Muharraq': ['Muharraq'],
      'Northern': ['Budaiya', 'Diraz'],
      'Southern': ['Riffa', 'Isa Town'],
    },
  },
  'Oman': {
    iso: 'OM',
    states: {
      'Muscat': ['Muscat City', 'Muttrah', 'Seeb'],
      'Dhofar': ['Salalah'],
      'Al Batinah North': ['Sohar', 'Shinas'],
      'Al Batinah South': ['Rustaq'],
      'Al Dakhiliyah': ['Nizwa', 'Bahla'],
      'Ash Sharqiyah North': ['Ibra'],
      'Ash Sharqiyah South': ['Sur'],
    },
  },
  'Lebanon': {
    iso: 'LB',
    states: {
      'Beirut': ['Beirut'],
      'Mount Lebanon': ['Jounieh', 'Byblos', 'Aley'],
      'North': ['Tripoli', 'Batroun'],
      'South': ['Sidon', 'Tyre'],
      'Bekaa': ['Zahle', 'Baalbek'],
    },
  },
  'Jordan': {
    iso: 'JO',
    states: {
      'Amman': ['Amman'],
      'Irbid': ['Irbid'],
      'Zarqa': ['Zarqa'],
      'Aqaba': ['Aqaba'],
      'Balqa': ['Salt'],
    },
  },
  'Kenya': {
    iso: 'KE',
    states: {
      'Nairobi': ['Nairobi'],
      'Mombasa': ['Mombasa'],
      'Kisumu': ['Kisumu'],
      'Nakuru': ['Nakuru'],
      'Eldoret': ['Eldoret'],
    },
  },
};

const COUNTRIES = Object.keys(COUNTRY_DATA);

// Professional Information dropdown options
// Primary profession options (synced with web maidProfileData.js positions)
const PRIMARY_PROFESSION_OPTIONS = [
  'Housemaid',
  'Nanny',
  'Cook',
  'Cleaner',
  'Caregiver',
  'Driver',
  'Gardener',
  'General Helper',
  'Baby Sitter',
  'Elder Care',
  'Other',
];

const EXPERIENCE_YEARS = [
  'No experience',
  'Less than 1 year',
  '1 year',
  '2 years',
  '3 years',
  '4 years',
  '5 years',
  '6 years',
  '7 years',
  '8 years',
  '9 years',
  '10 years',
  '10-15 years',
  '15-20 years',
  '20+ years',
];

const EDUCATION_LEVELS = [
  'No formal education',
  'Primary school',
  'Secondary school',
  'High school',
  'Vocational training',
  'Diploma',
  'Associate degree',
  "Bachelor's degree",
  "Master's degree",
  'Other',
];

// Must match database constraint: check_visa_status
const VISA_STATUS_OPTIONS = [
  'Visit Visa',
  'Visa Cancellation in Process',
  'Own Visa',
  'Husband Visa',
  'No Visa',
  'Other',
];

const SKILLS_OPTIONS = [
  'Cooking',
  'Cleaning',
  'Childcare',
  'Baby care',
  'Elder care',
  'Disabled care',
  'Laundry & ironing',
  'Driving',
  'Pet care',
  'Gardening',
  'Swimming',
  'First aid',
  'Tutoring',
  'Sewing',
  'Baking',
  'Meal planning',
  'Grocery shopping',
  'Organization',
];

const KEY_RESPONSIBILITIES_OPTIONS = [
  'House cleaning',
  'Kitchen cleaning',
  'Cooking meals',
  'Grocery shopping',
  'Laundry',
  'Ironing',
  'Child supervision',
  'Child school pickup',
  'Baby feeding',
  'Diaper changing',
  'Elder companionship',
  'Medication reminders',
  'Pet feeding',
  'Pet walking',
  'Gardening',
  'Running errands',
  'Home organization',
  'Event preparation',
];

const LANGUAGES_OPTIONS = [
  'English',
  'Arabic',
  'Amharic',
  'Tigrinya',
  'Oromo',
  'French',
  'Swahili',
  'Hindi',
  'Urdu',
  'Filipino/Tagalog',
  'Indonesian',
  'Nepali',
  'Bengali',
  'Sinhala',
  'Tamil',
  'Chinese',
  'Spanish',
  'Portuguese',
  'Other',
];

const PREVIOUS_COUNTRIES_OPTIONS = [
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
  'Egypt',
  'Israel',
  'Cyprus',
  'Malaysia',
  'Singapore',
  'Hong Kong',
  'Other',
];

// Work History options (synced with web MaidProfilePage.jsx)
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

const GCC_COUNTRIES = [
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
];

// Work History item interface
interface WorkHistoryItem {
  country: string;
  duration: string;
  employerType: string;
  customEmployerType?: string;
  keyResponsibilities: string[];
  reasonForLeaving: string;
  optional?: boolean;
}

// Availability & Preferences dropdown options
// Must match database constraint: availability_status IN ('available', 'busy', 'hired', 'inactive')
const AVAILABILITY_STATUS_OPTIONS = [
  'available',
  'busy',
  'hired',
  'inactive',
];

const AVAILABLE_FROM_OPTIONS = [
  'Immediately',
  'Within 1 week',
  'Within 2 weeks',
  'Within 1 month',
  'Within 2 months',
  'Within 3 months',
  'After 3 months',
  'Flexible',
];

const LIVE_IN_PREFERENCE_OPTIONS = [
  'Live-in only',
  'Live-out only',
  'Either (flexible)',
];

const CONTRACT_DURATION_OPTIONS = [
  '6 months',
  '1 year',
  '2 years',
  '3 years',
  '5 years',
  'Permanent',
  'Flexible / Negotiable',
];

const WORK_PREFERENCES_OPTIONS = [
  'Full-time',
  'Part-time',
  'Weekdays only',
  'Weekends only',
  'Night shift',
  'Day shift',
  'Split shift',
  'Overtime available',
  'Holidays available',
  'Travel with family',
];

// Currency options with country mapping
const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

// Map country to default currency
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Ethiopia': 'ETB',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',
  'Kuwait': 'KWD',
  'Qatar': 'QAR',
  'Bahrain': 'BHD',
  'Oman': 'OMR',
  'Lebanon': 'LBP',
  'Jordan': 'JOD',
  'Kenya': 'KES',
};

// Custom Dropdown Component
interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  required = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    value === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      value === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {value === item && (
                    <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Multi-Select Dropdown Component for arrays
interface MultiSelectDropdownProps {
  label: string;
  values: string[];
  options: string[];
  onSelect: (values: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  values = [],
  options,
  onSelect,
  placeholder = 'Select options',
  required = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(values);

  const toggleOption = (option: string) => {
    setTempSelected((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleDone = () => {
    onSelect(tempSelected);
    setModalVisible(false);
  };

  const openModal = () => {
    setTempSelected(values);
    setModalVisible(true);
  };

  const displayText = values.length > 0
    ? values.length <= 2
      ? values.join(', ')
      : `${values.slice(0, 2).join(', ')} +${values.length - 2} more`
    : placeholder;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownText, values.length === 0 && styles.dropdownPlaceholder]}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Show selected tags below the dropdown */}
      {values.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          {values.map((item) => (
            <View key={item} style={styles.selectedTag}>
              <Text style={styles.selectedTagText}>{item}</Text>
              <TouchableOpacity
                onPress={() => onSelect(values.filter((v) => v !== item))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.multiSelectModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={handleDone}>
                <Text style={styles.multiSelectDoneBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.multiSelectHint}>
              Tap to select multiple options
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = tempSelected.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    onPress={() => toggleOption(item)}
                  >
                    <View style={styles.checkboxContainer}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.multiSelectFooter}>
              <Text style={styles.multiSelectCount}>
                {tempSelected.length} selected
              </Text>
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={() => setTempSelected([])}
              >
                <Text style={styles.clearAllBtnText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function MaidProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editedData, setEditedData] = useState<Partial<ProfileData>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [fetchBaseProfile] = useLazyQuery(GET_BASE_PROFILE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const baseProfile = data?.profiles?.[0];
      if (baseProfile?.id) {
        setUserId(baseProfile.id);
      }
    },
  });

  const [fetchProfile, { loading, error }] = useLazyQuery(GET_MAID_PROFILE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const profile = data?.maid_profiles?.[0];
      if (profile) {
        setProfileData(profile);
        setEditedData(profile);
      }
    },
  });

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_MAID_PROFILE);
  const [createProfile, { loading: creating }] = useMutation(CREATE_MAID_PROFILE);
  const [updateProfileRegistration] = useMutation(UPDATE_PROFILE_REGISTRATION);

  // Document mutations
  const [fetchDocuments] = useLazyQuery(GET_MAID_DOCUMENTS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.maid_documents) {
        setDocuments(data.maid_documents);
      }
    },
  });
  const [insertDocument] = useMutation(INSERT_MAID_DOCUMENT);
  const [deleteDocument] = useMutation(DELETE_MAID_DOCUMENT);

  // Document state
  const [documents, setDocuments] = useState<MaidDocument[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  // Gallery image mutations and state
  const [fetchGalleryImages] = useLazyQuery(GET_MAID_IMAGES, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.maid_images) {
        setGalleryImages(data.maid_images);
      }
    },
  });
  const [insertGalleryImage] = useMutation(INSERT_MAID_IMAGE);
  const [deleteGalleryImage] = useMutation(DELETE_MAID_IMAGE);
  const [updateGalleryImage] = useMutation(UPDATE_MAID_IMAGE);

  // Gallery images state (up to 5 photos)
  const [galleryImages, setGalleryImages] = useState<MaidImage[]>([]);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const MAX_GALLERY_IMAGES = 5;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep / STEPS.length) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Step 1: Fetch base profile to get user ID
  useEffect(() => {
    if (user?.email) {
      fetchBaseProfile({ variables: { email: user.email } });
    }
  }, [user?.email]);

  // Step 2: Fetch maid profile when we have user ID
  useEffect(() => {
    if (userId) {
      fetchProfile({ variables: { userId } });
    }
  }, [userId]);

  // Step 3: Fetch documents when profile data is available
  useEffect(() => {
    if (profileData?.id) {
      fetchDocuments({ variables: { maidId: profileData.id } });
    }
  }, [profileData?.id]);

  // Step 4: Load gallery images from image_processing_metadata
  useEffect(() => {
    if (profileData?.image_processing_metadata?.gallery) {
      const gallery = profileData.image_processing_metadata.gallery;
      const loadedImages: MaidImage[] = gallery.map((item, index) => ({
        id: `gallery_${index}_${Date.now()}`,
        maid_id: profileData.id,
        file_url: item.url,
        is_primary: item.is_primary,
        display_order: item.order,
        created_at: new Date().toISOString(),
      }));
      setGalleryImages(loadedImages);
    }
  }, [profileData?.image_processing_metadata]);

  const handleSaveStep = async () => {
    console.log('handleSaveStep called, currentStep:', currentStep, 'profileData:', profileData?.id, 'userId:', userId);

    // Helper function to convert "available_from" dropdown value to a date
    const convertAvailableFromToDate = (value: string | null | undefined): string | null => {
      if (!value) return null;

      const today = new Date();

      switch (value) {
        case 'Immediately':
          return today.toISOString().split('T')[0];
        case 'Within 1 week':
          today.setDate(today.getDate() + 7);
          return today.toISOString().split('T')[0];
        case 'Within 2 weeks':
          today.setDate(today.getDate() + 14);
          return today.toISOString().split('T')[0];
        case 'Within 1 month':
          today.setMonth(today.getMonth() + 1);
          return today.toISOString().split('T')[0];
        case 'Within 2 months':
          today.setMonth(today.getMonth() + 2);
          return today.toISOString().split('T')[0];
        case 'Within 3 months':
          today.setMonth(today.getMonth() + 3);
          return today.toISOString().split('T')[0];
        case 'After 3 months':
          today.setMonth(today.getMonth() + 4);
          return today.toISOString().split('T')[0];
        case 'Flexible':
          return null; // No specific date for flexible
        default:
          // If it's already a date string (YYYY-MM-DD), return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
          }
          return null;
      }
    };

    // Build the profile data object (synced with web MaidProfilePage.jsx fields)
    // Build current_location string from location parts (matching web behavior)
    const locationString = [editedData.suburb, editedData.state_province, editedData.country]
      .filter(Boolean)
      .join(', ');

    const profileDataToSave = {
      full_name: editedData.full_name || null,
      first_name: editedData.first_name || null,
      last_name: editedData.last_name || null,
      phone_number: editedData.phone_number || null,
      alternative_phone: editedData.alternative_phone || null,
      nationality: editedData.nationality || null,
      date_of_birth: editedData.date_of_birth || null,
      marital_status: editedData.marital_status || null,
      children_count: editedData.children_count || null,
      religion: editedData.religion || null,
      education_level: editedData.education_level || null,
      experience_years: editedData.experience_years || null,
      about_me: editedData.about_me || editedData.bio || null,
      skills: editedData.skills || null,
      key_responsibilities: editedData.key_responsibilities || null,
      languages: editedData.languages || null,
      current_location: locationString || editedData.current_location || editedData.country || null,
      country: editedData.country || null,
      state_province: editedData.state_province || null,
      suburb: editedData.suburb || null,
      street_address: editedData.street_address || null,
      iso_country_code: editedData.iso_country_code || null,
      primary_profession: editedData.primary_profession || null,
      availability_status: editedData.availability_status || null,
      available_from: convertAvailableFromToDate(editedData.available_from),
      preferred_salary_min: editedData.expected_salary_min || editedData.preferred_salary_min || null,
      preferred_salary_max: editedData.expected_salary_max || editedData.preferred_salary_max || null,
      preferred_currency: editedData.salary_currency || editedData.preferred_currency || null,
      live_in_preference: editedData.live_in_preference ?? null,
      contract_duration_preference: editedData.contract_duration_preference || null,
      work_preferences: editedData.work_preferences || null,
      work_history: editedData.work_history || null,
      current_visa_status: editedData.current_visa_status || null,
      previous_countries: editedData.previous_countries || null,
      additional_notes: editedData.additional_notes || null,
      profile_photo_url: editedData.profile_photo_url || null,
      introduction_video_url: editedData.introduction_video_url || null,
    };

    // If not on the last step and no profile exists, just move to next step
    if (currentStep < 6 && !profileData?.id) {
      console.log('No profile ID yet, moving to next step');
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // On the last step or when profile exists, save the data
    try {
      if (profileData?.id) {
        // Update existing profile
        console.log('Updating existing profile:', profileData.id);
        const result = await updateProfile({
          variables: {
            id: profileData.id,
            data: profileDataToSave,
          },
        });
        console.log('Profile updated successfully', result);
      } else if (userId) {
        // Create new profile (on step 6 when no profile exists)
        // Note: maid_profiles.id must equal profiles.id (foreign key constraint)
        // user_id is also set for self-registered maids
        console.log('Creating new profile for user:', userId);
        const result = await createProfile({
          variables: {
            data: {
              ...profileDataToSave,
              id: userId,        // Required: maid_profiles.id = profiles.id
              user_id: userId,   // For self-registered maids lookup
            },
          },
        });
        console.log('Profile created successfully', result);

        // Update local state with the new profile
        if (result.data?.insert_maid_profiles_one) {
          setProfileData(result.data.insert_maid_profiles_one);
        }
      } else {
        Alert.alert('Error', 'Unable to save profile. Please try again.');
        return;
      }

      // Move to next step or complete
      if (currentStep === 6) {
        // Mark registration as complete and set user_type to 'maid' in the profiles table
        if (userId) {
          try {
            await updateProfileRegistration({
              variables: {
                id: userId,
                registration_complete: true,
                user_type: 'maid',
              },
            });
            console.log('Profile registration marked as complete with user_type: maid');
          } catch (regError) {
            console.error('Error updating registration status:', regError);
            // Don't block success if this fails - profile is still saved
          }
        }

        Alert.alert('Success', 'Profile completed successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleArrayInput = (field: keyof ProfileData, text: string) => {
    const array = text.split(',').map(item => item.trim()).filter(Boolean);
    setEditedData({ ...editedData, [field]: array });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
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
      Alert.alert('Permission Required', 'Please allow camera access to take a profile picture.');
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
    const dataUrl = `data:image/jpeg;base64,${asset.base64}`;

    // Update local state immediately so user sees the photo
    setEditedData((prev) => ({ ...prev, profile_photo_url: dataUrl }));

    // If we have a profile ID, save to database
    if (profileData?.id) {
      setUploadingPhoto(true);
      try {
        await updateProfile({
          variables: {
            id: profileData.id,
            data: {
              profile_photo_url: dataUrl,
            },
          },
        });

        setProfileData({ ...profileData, profile_photo_url: dataUrl });
        Alert.alert('Success', 'Profile photo updated successfully');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to save profile photo');
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      // Photo will be saved when user completes the form
      Alert.alert('Photo Added', 'Your photo will be saved when you complete the profile.');
    }
  };

  const showPhotoOptions = () => {
    console.log('showPhotoOptions called'); // Debug log
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Gallery Image Functions (up to 5 photos)
  const pickGalleryImage = async () => {
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      Alert.alert('Limit Reached', `You can only upload up to ${MAX_GALLERY_IMAGES} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      handleGalleryImageUpload(result.assets[0]);
    }
  };

  const takeGalleryPhoto = async () => {
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      Alert.alert('Limit Reached', `You can only upload up to ${MAX_GALLERY_IMAGES} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      handleGalleryImageUpload(result.assets[0]);
    }
  };

  const handleGalleryImageUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
    const newImage: MaidImage = {
      id: `temp_${Date.now()}`,
      maid_id: profileData?.id || '',
      file_url: dataUrl,
      file_name: `gallery_${Date.now()}.jpg`,
      is_primary: galleryImages.length === 0, // First image is primary
      display_order: galleryImages.length,
      created_at: new Date().toISOString(),
    };

    setUploadingGalleryImage(true);

    // Add to local state immediately
    setGalleryImages(prev => [...prev, newImage]);

    // Store in image_processing_metadata if profile exists
    if (profileData?.id) {
      try {
        const existingMetadata = profileData.image_processing_metadata || {};
        const existingGallery = existingMetadata.gallery || [];
        const updatedGallery = [...existingGallery, { url: dataUrl, order: galleryImages.length, is_primary: galleryImages.length === 0 }];

        await updateProfile({
          variables: {
            id: profileData.id,
            data: {
              image_processing_metadata: { ...existingMetadata, gallery: updatedGallery },
            },
          },
        });
        Alert.alert('Success', 'Photo added to gallery');
      } catch (err: any) {
        console.error('Failed to save gallery image:', err);
        // Keep in local state even if save fails
        Alert.alert('Note', 'Photo added locally. It will be saved when you complete your profile.');
      }
    } else {
      Alert.alert('Photo Added', 'Your photo will be saved when you complete the profile.');
    }

    setUploadingGalleryImage(false);
  };

  const removeGalleryImage = (imageId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedImages = galleryImages.filter(img => img.id !== imageId);
            setGalleryImages(updatedImages);

            // Update database if profile exists
            if (profileData?.id) {
              try {
                const existingMetadata = profileData.image_processing_metadata || {};
                const updatedGallery = updatedImages.map((img, idx) => ({
                  url: img.file_url,
                  order: idx,
                  is_primary: idx === 0,
                }));

                await updateProfile({
                  variables: {
                    id: profileData.id,
                    data: {
                      image_processing_metadata: { ...existingMetadata, gallery: updatedGallery },
                    },
                  },
                });
              } catch (err: any) {
                console.error('Failed to remove gallery image from DB:', err);
              }
            }
          },
        },
      ]
    );
  };

  const setAsPrimaryImage = async (imageId: string) => {
    const updatedImages = galleryImages.map(img => ({
      ...img,
      is_primary: img.id === imageId,
    }));

    // Move primary to first position
    const primaryImg = updatedImages.find(img => img.id === imageId);
    const otherImgs = updatedImages.filter(img => img.id !== imageId);
    const reorderedImages = primaryImg ? [primaryImg, ...otherImgs] : updatedImages;

    setGalleryImages(reorderedImages);

    // Update database
    if (profileData?.id) {
      try {
        const existingMetadata = profileData.image_processing_metadata || {};
        const updatedGallery = reorderedImages.map((img, idx) => ({
          url: img.file_url,
          order: idx,
          is_primary: idx === 0,
        }));

        await updateProfile({
          variables: {
            id: profileData.id,
            data: {
              image_processing_metadata: { ...existingMetadata, gallery: updatedGallery },
            },
          },
        });
        Alert.alert('Success', 'Primary photo updated');
      } catch (err: any) {
        console.error('Failed to set primary image:', err);
      }
    }
  };

  const showGalleryOptions = () => {
    Alert.alert(
      'Add Photo',
      `Choose an option (${galleryImages.length}/${MAX_GALLERY_IMAGES})`,
      [
        { text: 'Take Photo', onPress: takeGalleryPhoto },
        { text: 'Choose from Library', onPress: pickGalleryImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Helper function to convert URI to blob for Firebase upload
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  // Document upload handler - moved to component scope for use in multiple render functions
  const handleDocumentUpload = async (docType: string) => {
    if (!profileData?.id) {
      Alert.alert('Profile Required', 'Please complete your profile first before uploading documents.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your media library to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingDocument(docType);
      try {
        const asset = result.assets[0];
        // Check both IDENTITY_DOCUMENT_TYPES and DOCUMENT_TYPES for the label
        const identityDocType = IDENTITY_DOCUMENT_TYPES.find((d) => d.id === docType);
        const regularDocType = DOCUMENT_TYPES.find((d) => d.id === docType);
        const docTypeInfo = identityDocType || regularDocType;

        // Generate unique file name
        const timestamp = Date.now();
        const fileName = asset.fileName || `${docType}_${timestamp}.jpg`;
        const filePath = `maid_documents/${profileData.id}/${docType}_${timestamp}_${fileName}`;

        console.log('[DocumentUpload] Starting upload to Firebase Storage:', filePath);

        // Convert local URI to blob
        const blob = await uriToBlob(asset.uri);
        console.log('[DocumentUpload] Blob created, size:', blob.size);

        // Upload to Firebase Storage
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, blob, {
          contentType: asset.mimeType || 'image/jpeg',
        });

        // Wait for upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('[DocumentUpload] Upload progress:', progress.toFixed(1) + '%');
            },
            (error) => {
              console.error('[DocumentUpload] Upload error:', error);
              reject(error);
            },
            () => {
              console.log('[DocumentUpload] Upload complete');
              resolve();
            }
          );
        });

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log('[DocumentUpload] Download URL:', downloadURL);

        // Insert document record with Firebase Storage URL
        const insertResult = await insertDocument({
          variables: {
            data: {
              maid_id: profileData.id,
              document_type: docType,
              title: docTypeInfo?.label || docType,
              document_url: downloadURL,
              file_url: downloadURL,
              file_path: filePath,
              file_name: fileName,
              file_size: asset.fileSize || blob.size,
              mime_type: asset.mimeType || 'image/jpeg',
            },
          },
        });

        if (insertResult.data?.insert_maid_documents_one) {
          setDocuments((prev) => [insertResult.data.insert_maid_documents_one, ...prev]);
          Alert.alert('Success', `${docTypeInfo?.label || 'Document'} uploaded successfully!`);
        }
      } catch (error: any) {
        console.error('[DocumentUpload] Error:', error);
        Alert.alert('Error', error.message || 'Failed to upload document.');
      } finally {
        setUploadingDocument(null);
      }
    }
  };

  // Delete document handler - moved to component scope for use in multiple render functions
  const handleDeleteDocument = (doc: MaidDocument) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc.title || doc.document_type}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument({ variables: { id: doc.id } });
              setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
              Alert.alert('Success', 'Document deleted successfully.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete document.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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
          onPress={() => fetchProfile({ variables: { userId } })}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Step 1: Personal Information
  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="person" size={28} color="#8B5CF6" />
        </View>
        <Text style={styles.stepTitle}>Personal Information</Text>
        <Text style={styles.stepSubtitle}>Tell us about yourself</Text>
      </View>

      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <TouchableOpacity
          onPress={() => {
            console.log('Photo button pressed');
            showPhotoOptions();
          }}
          style={styles.photoTouchable}
          activeOpacity={0.7}
        >
          <View style={styles.photoContainer} pointerEvents="none">
            {editedData.profile_photo_url || profileData?.profile_photo_url ? (
              <Image
                source={{ uri: editedData.profile_photo_url || profileData?.profile_photo_url }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.photoBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="add" size={18} color="#fff" />
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={showPhotoOptions}>
          <Text style={styles.photoLabel}>Tap to add photo</Text>
        </TouchableOpacity>
      </View>

      {/* Gallery Photos Section - Up to 5 photos */}
      <View style={styles.gallerySection}>
        <View style={styles.gallerySectionHeader}>
          <Ionicons name="images" size={20} color="#8B5CF6" />
          <Text style={styles.gallerySectionTitle}>Photo Gallery</Text>
          <Text style={styles.gallerySectionSubtitle}>({galleryImages.length}/{MAX_GALLERY_IMAGES})</Text>
        </View>
        <Text style={styles.gallerySectionDescription}>
          Add up to 5 photos to showcase yourself to potential employers
        </Text>

        <View style={styles.galleryGrid}>
          {/* Existing gallery images */}
          {galleryImages.map((image, index) => (
            <View key={image.id} style={styles.galleryImageWrapper}>
              <Image source={{ uri: image.file_url }} style={styles.galleryImage} />
              {image.is_primary && (
                <View style={styles.primaryBadge}>
                  <Ionicons name="star" size={10} color="#fff" />
                </View>
              )}
              <View style={styles.galleryImageActions}>
                {!image.is_primary && (
                  <TouchableOpacity
                    style={styles.galleryActionBtn}
                    onPress={() => setAsPrimaryImage(image.id)}
                  >
                    <Ionicons name="star-outline" size={14} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.galleryActionBtn, styles.galleryDeleteBtn]}
                  onPress={() => removeGalleryImage(image.id)}
                >
                  <Ionicons name="trash-outline" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add photo button (only show if under limit) */}
          {galleryImages.length < MAX_GALLERY_IMAGES && (
            <TouchableOpacity
              style={styles.galleryAddButton}
              onPress={showGalleryOptions}
              disabled={uploadingGalleryImage}
            >
              {uploadingGalleryImage ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={32} color="#8B5CF6" />
                  <Text style={styles.galleryAddText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={editedData.first_name || ''}
              onChangeText={(text) => {
                const newFirstName = text;
                const lastName = editedData.last_name || '';
                const fullName = lastName ? `${newFirstName} ${lastName}`.trim() : newFirstName;
                setEditedData({ ...editedData, first_name: newFirstName, full_name: fullName });
              }}
              placeholder="First name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={editedData.last_name || ''}
              onChangeText={(text) => {
                const newLastName = text;
                const firstName = editedData.first_name || '';
                const fullName = firstName ? `${firstName} ${newLastName}`.trim() : newLastName;
                setEditedData({ ...editedData, last_name: newLastName, full_name: fullName });
              }}
              placeholder="Last name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={editedData.phone_number || ''}
            onChangeText={(text) => setEditedData({ ...editedData, phone_number: text })}
            placeholder="+251 9XX XXX XXX"
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>WhatsApp Number</Text>
            <View style={styles.sameNumberToggle}>
              <Text style={styles.sameNumberText}>Same as phone</Text>
              <Switch
                value={editedData.alternative_phone === editedData.phone_number && !!editedData.phone_number}
                onValueChange={(value) => {
                  if (value && editedData.phone_number) {
                    setEditedData({ ...editedData, alternative_phone: editedData.phone_number });
                  } else {
                    setEditedData({ ...editedData, alternative_phone: '' });
                  }
                }}
                trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
                thumbColor={editedData.alternative_phone === editedData.phone_number && !!editedData.phone_number ? '#8B5CF6' : '#F3F4F6'}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
          <View style={styles.whatsappInputContainer}>
            <View style={styles.whatsappIcon}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <TextInput
              style={[styles.input, styles.whatsappInput]}
              value={editedData.alternative_phone || ''}
              onChangeText={(text) => setEditedData({ ...editedData, alternative_phone: text })}
              placeholder="WhatsApp number"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
              editable={editedData.alternative_phone !== editedData.phone_number || !editedData.phone_number}
            />
          </View>
        </View>

        <Dropdown
          label="Nationality"
          value={editedData.nationality || ''}
          options={NATIONALITIES}
          onSelect={(value) => setEditedData({ ...editedData, nationality: value })}
          placeholder="Select nationality"
          required
        />

        <View style={styles.field}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownText, !editedData.date_of_birth && styles.dropdownPlaceholder]}>
              {editedData.date_of_birth
                ? new Date(editedData.date_of_birth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select date of birth'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>

          {/* Custom Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.datePickerModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Date of Birth</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  {/* Month */}
                  <View style={styles.datePickerColumn}>
                    <Text style={styles.datePickerColumnLabel}>Month</Text>
                    <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                      {['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => {
                        const currentMonth = editedData.date_of_birth
                          ? new Date(editedData.date_of_birth).getMonth()
                          : -1;
                        return (
                          <TouchableOpacity
                            key={month}
                            style={[styles.datePickerItem, currentMonth === index && styles.datePickerItemSelected]}
                            onPress={() => {
                              const currentDate = editedData.date_of_birth
                                ? new Date(editedData.date_of_birth)
                                : new Date(2000, 0, 1);
                              currentDate.setMonth(index);
                              setEditedData({ ...editedData, date_of_birth: currentDate.toISOString().split('T')[0] });
                            }}
                          >
                            <Text style={[styles.datePickerItemText, currentMonth === index && styles.datePickerItemTextSelected]}>
                              {month}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Day */}
                  <View style={styles.datePickerColumn}>
                    <Text style={styles.datePickerColumnLabel}>Day</Text>
                    <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const currentDay = editedData.date_of_birth
                          ? new Date(editedData.date_of_birth).getDate()
                          : -1;
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[styles.datePickerItem, currentDay === day && styles.datePickerItemSelected]}
                            onPress={() => {
                              const currentDate = editedData.date_of_birth
                                ? new Date(editedData.date_of_birth)
                                : new Date(2000, 0, 1);
                              currentDate.setDate(day);
                              setEditedData({ ...editedData, date_of_birth: currentDate.toISOString().split('T')[0] });
                            }}
                          >
                            <Text style={[styles.datePickerItemText, currentDay === day && styles.datePickerItemTextSelected]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Year */}
                  <View style={styles.datePickerColumn}>
                    <Text style={styles.datePickerColumnLabel}>Year</Text>
                    <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - 18 - i).map((year) => {
                        const currentYear = editedData.date_of_birth
                          ? new Date(editedData.date_of_birth).getFullYear()
                          : -1;
                        return (
                          <TouchableOpacity
                            key={year}
                            style={[styles.datePickerItem, currentYear === year && styles.datePickerItemSelected]}
                            onPress={() => {
                              const currentDate = editedData.date_of_birth
                                ? new Date(editedData.date_of_birth)
                                : new Date(2000, 0, 1);
                              currentDate.setFullYear(year);
                              setEditedData({ ...editedData, date_of_birth: currentDate.toISOString().split('T')[0] });
                            }}
                          >
                            <Text style={[styles.datePickerItemText, currentYear === year && styles.datePickerItemTextSelected]}>
                              {year}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <Dropdown
          label="Marital Status"
          value={editedData.marital_status || ''}
          options={MARITAL_STATUS_OPTIONS}
          onSelect={(value) => setEditedData({ ...editedData, marital_status: value })}
          placeholder="Select marital status"
        />

        <View style={styles.field}>
          <Text style={styles.label}>Number of Children</Text>
          <TextInput
            style={styles.input}
            value={String(editedData.children_count || '')}
            onChangeText={(text) =>
              setEditedData({ ...editedData, children_count: parseInt(text) || 0 })
            }
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <Dropdown
          label="Religion"
          value={editedData.religion || ''}
          options={RELIGION_OPTIONS}
          onSelect={(value) => setEditedData({ ...editedData, religion: value })}
          placeholder="Select religion"
        />
      </View>

      {/* Identity Document Section - Required: Either Passport OR National ID */}
      <View style={styles.identityDocumentSection}>
        <View style={styles.identityDocumentHeader}>
          <View style={styles.identityDocumentTitleRow}>
            <Ionicons name="shield-checkmark" size={22} color="#3B82F6" />
            <Text style={styles.identityDocumentTitle}>Identity Document</Text>
            <Text style={styles.requiredBadge}>Required</Text>
          </View>
          <Text style={styles.identityDocumentSubtitle}>
            Upload either Passport OR National ID (one is required)
          </Text>
        </View>

        <View style={styles.identityDocumentGrid}>
          {IDENTITY_DOCUMENT_TYPES.map((docType) => {
            const uploadedDoc = documents.find((d) => d.document_type === docType.id);
            const isUploading = uploadingDocument === docType.id;
            const hasAnyIdentityDoc = documents.some((d) =>
              d.document_type === 'passport' || d.document_type === 'national_id'
            );

            return (
              <View key={docType.id} style={styles.identityDocumentItem}>
                <TouchableOpacity
                  style={[
                    styles.identityDocumentCard,
                    uploadedDoc && styles.identityDocumentCardUploaded,
                  ]}
                  onPress={() => {
                    if (uploadedDoc) {
                      Alert.alert(
                        docType.label,
                        'What would you like to do?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Replace', onPress: () => handleDocumentUpload(docType.id) },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => handleDeleteDocument(uploadedDoc),
                          },
                        ]
                      );
                    } else {
                      handleDocumentUpload(docType.id);
                    }
                  }}
                  disabled={isUploading}
                  activeOpacity={0.7}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : uploadedDoc ? (
                    <View style={styles.identityDocUploadedIcon}>
                      <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                    </View>
                  ) : (
                    <Ionicons
                      name={docType.icon as any}
                      size={32}
                      color="#3B82F6"
                    />
                  )}
                  <Text
                    style={[
                      styles.identityDocumentLabel,
                      uploadedDoc && styles.identityDocumentLabelUploaded,
                    ]}
                  >
                    {docType.label}
                  </Text>
                  {uploadedDoc ? (
                    <Text style={styles.identityDocUploaded}>✓ Uploaded</Text>
                  ) : (
                    <Text style={styles.identityDocTapToUpload}>Tap to upload</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Show validation message if neither document uploaded */}
        {!documents.some((d) => d.document_type === 'passport' || d.document_type === 'national_id') && (
          <View style={styles.identityDocWarning}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <Text style={styles.identityDocWarningText}>
              Please upload either your Passport or National ID to continue
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render Step 2: Location
  const renderLocation = () => {
    // Get states for selected country
    const selectedCountryData = editedData.country ? COUNTRY_DATA[editedData.country] : null;
    const stateOptions = selectedCountryData ? Object.keys(selectedCountryData.states) : [];

    // Get cities for selected state
    const cityOptions = selectedCountryData && editedData.state_province
      ? selectedCountryData.states[editedData.state_province] || []
      : [];

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="location" size={28} color="#10B981" />
          </View>
          <Text style={styles.stepTitle}>Location</Text>
          <Text style={styles.stepSubtitle}>Where are you currently based?</Text>
        </View>

        <View style={styles.card}>
          <Dropdown
            label="Country"
            value={editedData.country || ''}
            options={COUNTRIES}
            onSelect={(value) => {
              // Reset state and city when country changes, set ISO code
              const countryData = COUNTRY_DATA[value];
              setEditedData({
                ...editedData,
                country: value,
                state_province: '',
                suburb: '',
                iso_country_code: countryData?.iso || null,
              });
            }}
            placeholder="Select your country"
            required
          />

          <Dropdown
            label="State/Province"
            value={editedData.state_province || ''}
            options={stateOptions}
            onSelect={(value) => {
              // Reset city when state changes
              setEditedData({
                ...editedData,
                state_province: value,
                suburb: '',
              });
            }}
            placeholder={editedData.country ? "Select state/province" : "Select country first"}
            required
          />

          <Dropdown
            label="City"
            value={editedData.suburb || ''}
            options={cityOptions}
            onSelect={(value) => setEditedData({ ...editedData, suburb: value })}
            placeholder={editedData.state_province ? "Select city" : "Select state first"}
            required
          />
        </View>
      </View>
    );
  };

  // Render Step 3: Professional Information
  const renderProfessionalInfo = () => {
    // Helper to convert experience string to number for database
    const getExperienceYears = (value: string): number => {
      if (value === 'No experience') return 0;
      if (value === 'Less than 1 year') return 0;
      if (value === '20+ years') return 20;
      if (value === '10-15 years') return 12;
      if (value === '15-20 years') return 17;
      const match = value.match(/^(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    // Helper to convert number to experience string for display
    const getExperienceLabel = (years: number | undefined): string => {
      if (!years || years === 0) return 'No experience';
      if (years < 1) return 'Less than 1 year';
      if (years >= 20) return '20+ years';
      if (years >= 15) return '15-20 years';
      if (years >= 10) return '10-15 years';
      return `${years} year${years > 1 ? 's' : ''}`;
    };

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="briefcase" size={28} color="#6366F1" />
          </View>
          <Text style={styles.stepTitle}>Professional Information</Text>
          <Text style={styles.stepSubtitle}>Your work experience and skills</Text>
        </View>

        <View style={styles.card}>
          <Dropdown
            label="Primary Profession"
            value={editedData.primary_profession || ''}
            options={PRIMARY_PROFESSION_OPTIONS}
            onSelect={(value) => setEditedData({ ...editedData, primary_profession: value })}
            placeholder="Select your primary profession"
            required
          />

          <Dropdown
            label="Experience (Years)"
            value={getExperienceLabel(editedData.experience_years)}
            options={EXPERIENCE_YEARS}
            onSelect={(value) => {
              const years = getExperienceYears(value);
              setEditedData({ ...editedData, experience_years: years });
            }}
            placeholder="Select years of experience"
            required
          />

          <Dropdown
            label="Education Level"
            value={editedData.education_level || ''}
            options={EDUCATION_LEVELS}
            onSelect={(value) => setEditedData({ ...editedData, education_level: value })}
            placeholder="Select education level"
          />

          <Dropdown
            label="Current Visa Status"
            value={editedData.current_visa_status || ''}
            options={VISA_STATUS_OPTIONS}
            onSelect={(value) => setEditedData({ ...editedData, current_visa_status: value })}
            placeholder="Select visa status"
          />

          <MultiSelectDropdown
            label="Skills"
            values={editedData.skills || []}
            options={SKILLS_OPTIONS}
            onSelect={(values) => setEditedData({ ...editedData, skills: values })}
            placeholder="Select your skills"
            required
          />

          <MultiSelectDropdown
            label="Key Responsibilities"
            values={editedData.key_responsibilities || []}
            options={KEY_RESPONSIBILITIES_OPTIONS}
            onSelect={(values) => setEditedData({ ...editedData, key_responsibilities: values })}
            placeholder="Select responsibilities"
          />

          <MultiSelectDropdown
            label="Languages Spoken"
            values={editedData.languages || []}
            options={LANGUAGES_OPTIONS}
            onSelect={(values) => setEditedData({ ...editedData, languages: values })}
            placeholder="Select languages"
            required
          />

          <MultiSelectDropdown
            label="Previous Countries Worked"
            values={editedData.previous_countries || []}
            options={PREVIOUS_COUNTRIES_OPTIONS}
            onSelect={(values) => setEditedData({ ...editedData, previous_countries: values })}
            placeholder="Select countries"
          />
        </View>

        {/* Work History Section */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.workHistoryHeader}>
            <Text style={styles.sectionLabel}>Work History (Optional)</Text>
            <TouchableOpacity
              style={styles.addWorkButton}
              onPress={() => {
                const newWorkItem: WorkHistoryItem = {
                  country: '',
                  duration: '',
                  employerType: '',
                  customEmployerType: '',
                  keyResponsibilities: [],
                  reasonForLeaving: '',
                  optional: true,
                };
                setEditedData({
                  ...editedData,
                  work_history: [...(editedData.work_history || []), newWorkItem],
                });
              }}
            >
              <Ionicons name="add-circle" size={20} color="#6366F1" />
              <Text style={styles.addWorkButtonText}>Add Work Experience</Text>
            </TouchableOpacity>
          </View>

          {(editedData.work_history || []).map((work: WorkHistoryItem, index: number) => (
            <View key={index} style={styles.workHistoryCard}>
              <View style={styles.workHistoryCardHeader}>
                <Text style={styles.workHistoryCardTitle}>Position #{index + 1}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const updated = [...(editedData.work_history || [])];
                    updated.splice(index, 1);
                    setEditedData({ ...editedData, work_history: updated });
                  }}
                  style={styles.removeWorkButton}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <Dropdown
                label="Country"
                value={work.country || ''}
                options={GCC_COUNTRIES}
                onSelect={(value) => {
                  const updated = [...(editedData.work_history || [])];
                  updated[index] = { ...updated[index], country: value };
                  setEditedData({ ...editedData, work_history: updated });
                }}
                placeholder="Select country"
              />

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.textInput}
                  value={work.duration || ''}
                  onChangeText={(text) => {
                    const updated = [...(editedData.work_history || [])];
                    updated[index] = { ...updated[index], duration: text };
                    setEditedData({ ...editedData, work_history: updated });
                  }}
                  placeholder="e.g., 2 years 3 months"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <Dropdown
                label="Employer Type"
                value={work.employerType || ''}
                options={EMPLOYER_TYPES}
                onSelect={(value) => {
                  const updated = [...(editedData.work_history || [])];
                  updated[index] = { ...updated[index], employerType: value };
                  setEditedData({ ...editedData, work_history: updated });
                }}
                placeholder="Select employer type"
              />

              {work.employerType === 'Other' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Specify Employer Type</Text>
                  <TextInput
                    style={styles.textInput}
                    value={work.customEmployerType || ''}
                    onChangeText={(text) => {
                      const updated = [...(editedData.work_history || [])];
                      updated[index] = { ...updated[index], customEmployerType: text };
                      setEditedData({ ...editedData, work_history: updated });
                    }}
                    placeholder="Please specify"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              <MultiSelectDropdown
                label="Key Responsibilities"
                values={work.keyResponsibilities || []}
                options={KEY_RESPONSIBILITIES_OPTIONS}
                onSelect={(values) => {
                  const updated = [...(editedData.work_history || [])];
                  updated[index] = { ...updated[index], keyResponsibilities: values };
                  setEditedData({ ...editedData, work_history: updated });
                }}
                placeholder="Select responsibilities"
              />

              <Dropdown
                label="Reason for Leaving"
                value={work.reasonForLeaving || ''}
                options={REASONS_FOR_LEAVING}
                onSelect={(value) => {
                  const updated = [...(editedData.work_history || [])];
                  updated[index] = { ...updated[index], reasonForLeaving: value };
                  setEditedData({ ...editedData, work_history: updated });
                }}
                placeholder="Select reason"
              />
            </View>
          ))}

          {(editedData.work_history || []).length === 0 && (
            <Text style={styles.noWorkHistoryText}>
              No work experience added yet. Tap "Add Work Experience" to add your previous positions.
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Render Step 4: Availability & Preferences
  const renderAvailability = () => {
    // Helper to convert live_in_preference boolean to string
    const getLiveInLabel = (value: boolean | undefined): string => {
      if (value === true) return 'Live-in only';
      if (value === false) return 'Live-out only';
      return '';
    };

    // Helper to convert string selection to boolean
    const getLiveInBoolean = (value: string): boolean | undefined => {
      if (value === 'Live-in only') return true;
      if (value === 'Live-out only') return false;
      if (value === 'Either (flexible)') return true; // Flexible means willing to live-in
      return undefined;
    };

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="calendar" size={28} color="#F59E0B" />
          </View>
          <Text style={styles.stepTitle}>Availability & Preferences</Text>
          <Text style={styles.stepSubtitle}>When can you start and what do you prefer?</Text>
        </View>

        <View style={styles.card}>
          <Dropdown
            label="Availability Status"
            value={editedData.availability_status || ''}
            options={AVAILABILITY_STATUS_OPTIONS}
            onSelect={(value) => setEditedData({ ...editedData, availability_status: value })}
            placeholder="Select your availability"
            required
          />

          <Dropdown
            label="Available From"
            value={editedData.available_from || ''}
            options={AVAILABLE_FROM_OPTIONS}
            onSelect={(value) => setEditedData({ ...editedData, available_from: value })}
            placeholder="When can you start?"
          />

          <Dropdown
            label="Live-in Preference"
            value={getLiveInLabel(editedData.live_in_preference)}
            options={LIVE_IN_PREFERENCE_OPTIONS}
            onSelect={(value) => {
              const boolValue = getLiveInBoolean(value);
              setEditedData({ ...editedData, live_in_preference: boolValue });
            }}
            placeholder="Select your preference"
          />

          <Dropdown
            label="Contract Duration Preference"
            value={editedData.contract_duration_preference || ''}
            options={CONTRACT_DURATION_OPTIONS}
            onSelect={(value) => setEditedData({ ...editedData, contract_duration_preference: value })}
            placeholder="Select contract duration"
          />

          <MultiSelectDropdown
            label="Work Preferences"
            values={editedData.work_preferences || []}
            options={WORK_PREFERENCES_OPTIONS}
            onSelect={(values) => setEditedData({ ...editedData, work_preferences: values })}
            placeholder="Select work preferences"
          />
        </View>
      </View>
    );
  };

  // Render Step 5: Salary Expectations
  const renderSalary = () => {
    // Get default currency based on selected country
    const getDefaultCurrency = (): string => {
      if (editedData.salary_currency || editedData.preferred_currency) {
        return editedData.salary_currency || editedData.preferred_currency || 'USD';
      }
      if (editedData.country) {
        return COUNTRY_CURRENCY_MAP[editedData.country] || 'USD';
      }
      return 'USD';
    };

    // Get currency display text (code + name)
    const getCurrencyDisplay = (code: string): string => {
      const currency = CURRENCY_OPTIONS.find((c) => c.code === code);
      return currency ? `${currency.code} - ${currency.name}` : code;
    };

    // Get currency symbol for display
    const getCurrencySymbol = (code: string): string => {
      const currency = CURRENCY_OPTIONS.find((c) => c.code === code);
      return currency?.symbol || '$';
    };

    const currentCurrency = getDefaultCurrency();
    const currencySymbol = getCurrencySymbol(currentCurrency);

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="cash" size={28} color="#22C55E" />
          </View>
          <Text style={styles.stepTitle}>Salary Expectations</Text>
          <Text style={styles.stepSubtitle}>What is your expected compensation?</Text>
        </View>

        <View style={styles.card}>
          <Dropdown
            label="Currency"
            value={getCurrencyDisplay(currentCurrency)}
            options={CURRENCY_OPTIONS.map((c) => `${c.code} - ${c.name}`)}
            onSelect={(value) => {
              const code = value.split(' - ')[0];
              setEditedData({ ...editedData, salary_currency: code, preferred_currency: code });
            }}
            placeholder="Select currency"
          />

          {editedData.country && COUNTRY_CURRENCY_MAP[editedData.country] && (
            <View style={styles.currencyHint}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.currencyHintText}>
                Default currency for {editedData.country}: {COUNTRY_CURRENCY_MAP[editedData.country]}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Minimum Salary *</Text>
              <View style={styles.salaryInputContainer}>
                <View style={styles.currencySymbolBox}>
                  <Text style={styles.currencySymbolText}>{currencySymbol}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.salaryInput]}
                  value={String(editedData.expected_salary_min || editedData.preferred_salary_min || '')}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, expected_salary_min: parseInt(text) || null })
                  }
                  placeholder="Min"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Maximum Salary</Text>
              <View style={styles.salaryInputContainer}>
                <View style={styles.currencySymbolBox}>
                  <Text style={styles.currencySymbolText}>{currencySymbol}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.salaryInput]}
                  value={String(editedData.expected_salary_max || editedData.preferred_salary_max || '')}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, expected_salary_max: parseInt(text) || null })
                  }
                  placeholder="Max"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          <View style={styles.salaryNote}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.salaryNoteText}>
              Enter your expected monthly salary range. This helps employers match you with suitable positions.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Step 6: About Me & Additional Notes
  const renderAboutMe = () => {
    // Generate AI-powered About Me summary based on user input
    const generateAboutMeSummary = (): string => {
      const parts: string[] = [];

      // Introduction with name and nationality
      const firstName = editedData.first_name || '';
      const nationality = editedData.nationality || '';
      if (firstName && nationality) {
        parts.push(`I am ${firstName}, a dedicated and hardworking ${nationality} domestic worker.`);
      } else if (firstName) {
        parts.push(`I am ${firstName}, a dedicated and hardworking domestic worker.`);
      }

      // Experience
      const years = editedData.experience_years;
      if (years && years > 0) {
        if (years >= 10) {
          parts.push(`With over ${years} years of professional experience in household management, I bring extensive expertise and reliability to any home.`);
        } else if (years >= 5) {
          parts.push(`I have ${years} years of solid experience in domestic work, which has equipped me with the skills to handle various household responsibilities efficiently.`);
        } else if (years >= 2) {
          parts.push(`I have ${years} years of experience working in households, and I am eager to continue growing in this field.`);
        } else {
          parts.push(`Although I am relatively new with ${years} year of experience, I am enthusiastic, quick to learn, and committed to delivering excellent service.`);
        }
      }

      // Skills
      const skills = editedData.skills || [];
      if (skills.length > 0) {
        if (skills.length === 1) {
          parts.push(`I specialize in ${skills[0].toLowerCase()}.`);
        } else if (skills.length === 2) {
          parts.push(`My key skills include ${skills[0].toLowerCase()} and ${skills[1].toLowerCase()}.`);
        } else {
          const lastSkill = skills[skills.length - 1].toLowerCase();
          const otherSkills = skills.slice(0, -1).map(s => s.toLowerCase()).join(', ');
          parts.push(`I am skilled in ${otherSkills}, and ${lastSkill}.`);
        }
      }

      // Languages
      const languages = editedData.languages || [];
      if (languages.length > 0) {
        if (languages.length === 1) {
          parts.push(`I am fluent in ${languages[0]}.`);
        } else if (languages.length === 2) {
          parts.push(`I am fluent in ${languages[0]} and ${languages[1]}, which allows me to communicate effectively with diverse families.`);
        } else {
          const lastLang = languages[languages.length - 1];
          const otherLangs = languages.slice(0, -1).join(', ');
          parts.push(`I speak ${otherLangs}, and ${lastLang}, enabling effective communication with families from different backgrounds.`);
        }
      }

      // Previous countries worked
      const previousCountries = editedData.previous_countries || [];
      if (previousCountries.length > 0) {
        if (previousCountries.length === 1) {
          parts.push(`I have previously worked in ${previousCountries[0]}, gaining valuable international experience.`);
        } else {
          const countries = previousCountries.join(', ');
          parts.push(`My international experience includes working in ${countries}, which has broadened my understanding of different household expectations and cultures.`);
        }
      }

      // Availability and preferences
      const availability = editedData.availability_status || '';
      const liveIn = editedData.live_in_preference;
      if (availability.toLowerCase().includes('immediately') || availability.toLowerCase().includes('available')) {
        parts.push(`I am currently available and ready to start immediately.`);
      }
      if (liveIn === true) {
        parts.push(`I am comfortable with live-in arrangements.`);
      } else if (liveIn === false) {
        parts.push(`I prefer live-out arrangements.`);
      }

      // Closing statement
      if (parts.length > 0) {
        parts.push(`I am reliable, trustworthy, and committed to providing excellent service. I look forward to becoming a valued member of your household.`);
      }

      return parts.join(' ');
    };

    // Apply generated summary to the about_me field
    const handleGenerateSummary = () => {
      const summary = generateAboutMeSummary();
      if (summary) {
        setEditedData({ ...editedData, about_me: summary, bio: summary });
        Alert.alert('Summary Generated', 'Your About Me section has been filled based on your profile information. Feel free to edit it!');
      } else {
        Alert.alert('Incomplete Profile', 'Please fill in more details in the previous steps to generate a summary.');
      }
    };

    // Record video CV (max 1 minute)
    const handleRecordVideo = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to record your video CV.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 60, // 1 minute max
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        setVideoUri(video.uri);
        setVideoDuration(video.duration || 0);
        handleVideoUpload(video);
      }
    };

    // Choose video from gallery
    const handleChooseVideo = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library to select a video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 60, // 1 minute max
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];

        // Check video duration
        if (video.duration && video.duration > 60000) {
          Alert.alert('Video Too Long', 'Please select a video that is 1 minute or less.');
          return;
        }

        setVideoUri(video.uri);
        setVideoDuration(video.duration || 0);
        handleVideoUpload(video);
      }
    };

    // Upload video to storage
    const handleVideoUpload = async (video: ImagePicker.ImagePickerAsset) => {
      setUploadingVideo(true);

      try {
        // For now, store the local URI - in production, upload to cloud storage
        // and get back a URL to store in the database
        const videoUrl = video.uri;

        setEditedData((prev) => ({ ...prev, introduction_video_url: videoUrl }));

        // If we have a profile ID, save to database immediately
        if (profileData?.id) {
          await updateProfile({
            variables: {
              id: profileData.id,
              data: {
                introduction_video_url: videoUrl,
              },
            },
          });
          Alert.alert('Success', 'Video CV uploaded successfully!');
        } else {
          Alert.alert('Video Added', 'Your video will be saved when you complete the profile.');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to upload video. Please try again.');
      } finally {
        setUploadingVideo(false);
      }
    };

    // Show video options
    const showVideoOptions = () => {
      Alert.alert(
        'Video CV',
        'Record or choose a video introduction (max 1 minute)',
        [
          { text: 'Record Video', onPress: handleRecordVideo },
          { text: 'Choose from Gallery', onPress: handleChooseVideo },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    };

    // Remove video
    const handleRemoveVideo = () => {
      Alert.alert(
        'Remove Video',
        'Are you sure you want to remove your video CV?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              setVideoUri(null);
              setVideoDuration(0);
              setEditedData((prev) => ({ ...prev, introduction_video_url: null }));
            },
          },
        ]
      );
    };

    // Format duration for display
    const formatDuration = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentVideoUrl = videoUri || editedData.introduction_video_url || profileData?.introduction_video_url;

    // Get document for a specific type
    const getDocumentByType = (type: string) => documents.find((d) => d.document_type === type);

    // Count uploaded required documents
    const requiredDocTypes = DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.id);
    const uploadedRequiredDocs = documents.filter((d) => requiredDocTypes.includes(d.document_type)).length;

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, { backgroundColor: '#FCE7F3' }]}>
            <Ionicons name="document-text" size={28} color="#EC4899" />
          </View>
          <Text style={styles.stepTitle}>About Me</Text>
          <Text style={styles.stepSubtitle}>Tell employers more about yourself</Text>
        </View>

        {/* Video CV Section */}
        <View style={styles.card}>
          <View style={styles.videoSectionHeader}>
            <View style={styles.videoTitleRow}>
              <Ionicons name="videocam" size={22} color="#EC4899" />
              <Text style={styles.videoSectionTitle}>Video CV</Text>
            </View>
            <Text style={styles.videoSectionSubtitle}>
              Record a 1-minute video introduction to stand out!
            </Text>
          </View>

          {currentVideoUrl ? (
            // Video Preview
            <View style={styles.videoPreviewContainer}>
              <View style={styles.videoPreview}>
                <View style={styles.videoThumbnail}>
                  <Ionicons name="play-circle" size={48} color="#fff" />
                </View>
                <View style={styles.videoOverlay}>
                  <View style={styles.videoDurationBadge}>
                    <Ionicons name="time-outline" size={14} color="#fff" />
                    <Text style={styles.videoDurationText}>
                      {videoDuration > 0 ? formatDuration(videoDuration) : '0:00'} / 1:00
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.videoActions}>
                <TouchableOpacity
                  style={styles.videoActionBtn}
                  onPress={showVideoOptions}
                >
                  <Ionicons name="refresh" size={18} color="#8B5CF6" />
                  <Text style={styles.videoActionBtnText}>Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.videoActionBtn, styles.videoActionBtnDanger]}
                  onPress={handleRemoveVideo}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.videoActionBtnText, styles.videoActionBtnTextDanger]}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.videoSuccessBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.videoSuccessText}>Video CV uploaded</Text>
              </View>
            </View>
          ) : (
            // Upload Video Button
            <TouchableOpacity
              style={styles.videoUploadBtn}
              onPress={showVideoOptions}
              disabled={uploadingVideo}
              activeOpacity={0.7}
            >
              {uploadingVideo ? (
                <View style={styles.videoUploadContent}>
                  <ActivityIndicator size="large" color="#EC4899" />
                  <Text style={styles.videoUploadText}>Uploading video...</Text>
                </View>
              ) : (
                <View style={styles.videoUploadContent}>
                  <View style={styles.videoUploadIconContainer}>
                    <Ionicons name="videocam-outline" size={32} color="#EC4899" />
                  </View>
                  <Text style={styles.videoUploadTitle}>Add Video CV</Text>
                  <Text style={styles.videoUploadSubtitle}>
                    Record or upload a 1-minute introduction
                  </Text>
                  <View style={styles.videoUploadHints}>
                    <View style={styles.videoHintItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={styles.videoHintText}>Introduce yourself</Text>
                    </View>
                    <View style={styles.videoHintItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={styles.videoHintText}>Share your experience</Text>
                    </View>
                    <View style={styles.videoHintItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={styles.videoHintText}>Show your personality</Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Optional Documents Section */}
        <View style={styles.card}>
          <View style={styles.documentsSectionHeader}>
            <View style={styles.videoTitleRow}>
              <Ionicons name="folder-open" size={22} color="#9CA3AF" />
              <Text style={styles.videoSectionTitle}>Optional Documents</Text>
            </View>
            <Text style={styles.videoSectionSubtitle}>
              Upload additional documents to strengthen your profile (optional)
            </Text>
          </View>

          {/* Optional Document Types Grid */}
          <View style={styles.documentsGrid}>
            {OPTIONAL_DOCUMENT_TYPES.map((docType) => {
              const uploadedDoc = getDocumentByType(docType.id);
              const isUploading = uploadingDocument === docType.id;

              return (
                <View key={docType.id} style={styles.documentItem}>
                  <TouchableOpacity
                    style={[
                      styles.documentCard,
                      uploadedDoc && styles.documentCardUploaded,
                    ]}
                    onPress={() => {
                      if (uploadedDoc) {
                        Alert.alert(
                          docType.label,
                          'What would you like to do?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Replace', onPress: () => handleDocumentUpload(docType.id) },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => handleDeleteDocument(uploadedDoc),
                            },
                          ]
                        );
                      } else {
                        handleDocumentUpload(docType.id);
                      }
                    }}
                    disabled={isUploading}
                    activeOpacity={0.7}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#9CA3AF" />
                    ) : uploadedDoc ? (
                      <View style={styles.documentUploadedIcon}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </View>
                    ) : (
                      <Ionicons
                        name={docType.icon as any}
                        size={24}
                        color="#9CA3AF"
                      />
                    )}
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.documentLabel,
                      uploadedDoc && styles.documentLabelUploaded,
                    ]}
                    numberOfLines={2}
                  >
                    {docType.label}
                  </Text>
                  {uploadedDoc && (
                    <Text style={styles.documentUploaded}>Uploaded</Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.documentsNote}>
            <Ionicons name="information-circle" size={18} color="#6B7280" />
            <Text style={styles.documentsNoteText}>
              These documents are optional but can help strengthen your profile. Clear photos of original documents are recommended.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          {/* AI Generate Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateSummary}
            activeOpacity={0.7}
          >
            <View style={styles.generateButtonContent}>
              <View style={styles.generateIconContainer}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.generateTextContainer}>
                <Text style={styles.generateButtonTitle}>Auto-Generate Summary</Text>
                <Text style={styles.generateButtonSubtitle}>
                  Create a professional bio based on your profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
            </View>
          </TouchableOpacity>

          <View style={styles.field}>
            <Text style={styles.label}>About Me *</Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={editedData.about_me || editedData.bio || ''}
              onChangeText={(text) => setEditedData({ ...editedData, about_me: text, bio: text })}
              placeholder="Tell employers about yourself, your experience, and what makes you a great domestic worker. This is your chance to stand out!"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedData.additional_notes || ''}
              onChangeText={(text) => setEditedData({ ...editedData, additional_notes: text })}
              placeholder="Any other information you'd like to share..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Completion Summary */}
        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-circle" size={40} color="#10B981" />
          <Text style={styles.summaryTitle}>Almost Done!</Text>
          <Text style={styles.summaryText}>
            Review your information and tap "Complete Profile" to finish your registration.
          </Text>
        </View>
      </View>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfo();
      case 2:
        return renderLocation();
      case 3:
        return renderProfessionalInfo();
      case 4:
        return renderAvailability();
      case 5:
        return renderSalary();
      case 6:
        return renderAboutMe();
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Complete Profile',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Step {currentStep} of {STEPS.length}</Text>
        </View>

        {/* Step Indicators */}
        <View style={styles.stepsIndicator}>
          {STEPS.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepDot,
                currentStep >= step.id && styles.stepDotActive,
                currentStep === step.id && styles.stepDotCurrent,
              ]}
              onPress={() => {
                if (step.id <= currentStep) {
                  setCurrentStep(step.id);
                }
              }}
            >
              {currentStep > step.id ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepDotText,
                    currentStep >= step.id && styles.stepDotTextActive,
                  ]}
                >
                  {step.id}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.navigationContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {currentStep > 1 && (
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              currentStep === 1 && styles.nextButtonFull,
              pressed && styles.nextButtonPressed,
              (updating || creating) && styles.buttonDisabled,
            ]}
            onPress={handleSaveStep}
            disabled={updating || creating}
          >
            {(updating || creating) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 6 ? 'Complete Profile' : 'Save & Continue'}
                </Text>
                {currentStep < 6 && <Ionicons name="arrow-forward" size={20} color="#fff" />}
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
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
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  // Step Indicators
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#8B5CF6',
  },
  stepDotCurrent: {
    backgroundColor: '#8B5CF6',
    transform: [{ scale: 1.1 }],
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepDotTextActive: {
    color: '#fff',
  },

  // Step Content
  stepContent: {
    padding: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // Photo Section
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoLabel: {
    fontSize: 13,
    color: '#8B5CF6',
    marginTop: 8,
    fontWeight: '500',
  },

  // Card & Fields
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  field: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sameNumberToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sameNumberText: {
    fontSize: 12,
    color: '#6B7280',
  },
  whatsappInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whatsappIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  whatsappInput: {
    flex: 1,
    paddingLeft: 42,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 140,
    textAlignVertical: 'top',
  },

  // Dropdown styles
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalOptionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },

  // Multi-Select Dropdown styles
  multiSelectModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  multiSelectDoneBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  multiSelectHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  multiSelectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  multiSelectCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllBtnText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  selectedTagText: {
    fontSize: 13,
    color: '#7C3AED',
  },

  // Date picker modal
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  datePickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  datePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  datePickerColumnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  datePickerScrollView: {
    height: 200,
  },
  datePickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  datePickerItemSelected: {
    backgroundColor: '#F5F3FF',
  },
  datePickerItemText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  datePickerItemTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },

  // Salary Note
  salaryNote: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 10,
  },
  salaryNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Currency and Salary styles
  currencyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: -8,
    gap: 6,
  },
  currencyHintText: {
    fontSize: 12,
    color: '#15803D',
    flex: 1,
  },
  salaryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbolBox: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#D1D5DB',
  },
  currencySymbolText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  salaryInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },

  // Documents Section styles
  documentsSectionHeader: {
    marginBottom: 16,
  },
  documentProgress: {
    marginTop: 12,
  },
  documentProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  documentProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  documentProgressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  documentItem: {
    width: '22%',
    alignItems: 'center',
  },
  documentCard: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  documentCardUploaded: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderStyle: 'solid',
  },
  documentUploadedIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 12,
  },
  documentLabelUploaded: {
    color: '#059669',
    fontWeight: '500',
  },
  documentRequired: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
  documentUploaded: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  documentsNote: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  documentsNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },

  // Identity Document Section (Step 1) styles
  identityDocumentSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  identityDocumentHeader: {
    marginBottom: 16,
  },
  identityDocumentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  identityDocumentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  requiredBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    overflow: 'hidden',
  },
  identityDocumentSubtitle: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 4,
  },
  identityDocumentGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  identityDocumentItem: {
    flex: 1,
  },
  identityDocumentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    minHeight: 120,
  },
  identityDocumentCardUploaded: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderStyle: 'solid',
  },
  identityDocUploadedIcon: {
    marginBottom: 4,
  },
  identityDocumentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
    marginTop: 8,
    textAlign: 'center',
  },
  identityDocumentLabelUploaded: {
    color: '#059669',
  },
  identityDocUploaded: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  identityDocTapToUpload: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  identityDocWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  identityDocWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },

  // AI Generate Button styles
  generateButton: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 16,
    overflow: 'hidden',
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  generateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  generateTextContainer: {
    flex: 1,
  },
  generateButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
  generateButtonSubtitle: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
  },

  // Video CV styles
  videoSectionHeader: {
    marginBottom: 16,
  },
  videoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  videoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  videoSectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  videoUploadBtn: {
    borderWidth: 2,
    borderColor: '#F9A8D4',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#FDF2F8',
    padding: 24,
  },
  videoUploadContent: {
    alignItems: 'center',
  },
  videoUploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#BE185D',
    marginBottom: 4,
  },
  videoUploadSubtitle: {
    fontSize: 13,
    color: '#9D174D',
    marginBottom: 16,
  },
  videoUploadText: {
    fontSize: 14,
    color: '#EC4899',
    marginTop: 12,
  },
  videoUploadHints: {
    alignItems: 'flex-start',
    gap: 6,
  },
  videoHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoHintText: {
    fontSize: 12,
    color: '#6B7280',
  },
  videoPreviewContainer: {
    alignItems: 'center',
  },
  videoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoDurationText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  videoActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  videoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
  },
  videoActionBtnDanger: {
    backgroundColor: '#FEF2F2',
  },
  videoActionBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  videoActionBtnTextDanger: {
    color: '#EF4444',
  },
  videoSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
  },
  videoSuccessText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Navigation Buttons
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    backgroundColor: '#7C3AED',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Work History Styles
  workHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  addWorkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  addWorkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  workHistoryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  workHistoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workHistoryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  removeWorkButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  noWorkHistoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },

  // Gallery Photo Styles
  gallerySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gallerySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  gallerySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  gallerySectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  gallerySectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryImageWrapper: {
    width: (width - 32 - 40 - 20) / 3, // Account for padding and gaps
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImageActions: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
  },
  galleryActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryDeleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.8)',
  },
  galleryAddButton: {
    width: (width - 32 - 40 - 20) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  galleryAddText: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 4,
    fontWeight: '500',
  },
});
