/**
 * Create Job Page
 *
 * Form for sponsors to create new job postings.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { gql, useQuery, useMutation } from '@apollo/client';

// Get profile ID
const GET_PROFILE_ID = gql`
  query GetProfileId($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      user_type
    }
  }
`;

// Create job mutation
const CREATE_JOB = gql`
  mutation CreateJob($data: jobs_insert_input!) {
    insert_jobs_one(object: $data) {
      id
      title
      status
      created_at
    }
  }
`;

// Common job titles for quick select
const JOB_TITLES = [
  'Housekeeper',
  'Nanny',
  'Caregiver',
  'Cook',
  'Driver',
  'Gardener',
  'Cleaner',
  'Personal Assistant',
];

// Common skills
const COMMON_SKILLS = [
  'Cleaning',
  'Cooking',
  'Childcare',
  'Elderly Care',
  'Laundry',
  'Ironing',
  'Pet Care',
  'Driving',
  'Gardening',
  'First Aid',
];

// Common languages
const COMMON_LANGUAGES = ['English', 'Arabic', 'Amharic', 'French', 'Hindi', 'Tagalog'];

// Countries with currencies
const COUNTRIES = [
  { name: 'Saudi Arabia', currency: 'SAR' },
  { name: 'UAE', currency: 'AED' },
  { name: 'Kuwait', currency: 'KWD' },
  { name: 'Qatar', currency: 'QAR' },
  { name: 'Bahrain', currency: 'BHD' },
  { name: 'Oman', currency: 'OMR' },
  { name: 'Ethiopia', currency: 'ETB' },
  { name: 'USA', currency: 'USD' },
  { name: 'UK', currency: 'GBP' },
];

interface FormData {
  title: string;
  description: string;
  job_type: string;
  country: string;
  city: string;
  address: string;
  salary_min: string;
  salary_max: string;
  currency: string;
  salary_period: string;
  working_hours_per_day: string;
  working_days_per_week: string;
  days_off_per_week: string;
  overtime_available: boolean;
  live_in_required: boolean;
  minimum_experience_years: string;
  education_requirement: string;
  contract_duration_months: string;
  max_applications: string;
  urgency_level: string;
  required_skills: string[];
  languages_required: string[];
  preferred_nationality: string[];
  benefits: string[];
}

export default function CreateJobScreen() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    job_type: 'full-time',
    country: 'Saudi Arabia',
    city: '',
    address: '',
    salary_min: '',
    salary_max: '',
    currency: 'SAR',
    salary_period: 'monthly',
    working_hours_per_day: '8',
    working_days_per_week: '6',
    days_off_per_week: '1',
    overtime_available: false,
    live_in_required: true,
    minimum_experience_years: '0',
    education_requirement: '',
    contract_duration_months: '24',
    max_applications: '50',
    urgency_level: 'normal',
    required_skills: [],
    languages_required: ['English'],
    preferred_nationality: [],
    benefits: [],
  });

  // Get profile ID
  const { data: profileData } = useQuery(GET_PROFILE_ID, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  // Create job mutation
  const [createJob] = useMutation(CREATE_JOB);

  // Update currency when country changes
  useEffect(() => {
    const country = COUNTRIES.find((c) => c.name === formData.country);
    if (country) {
      setFormData((prev) => ({ ...prev, currency: country.currency }));
    }
  }, [formData.country]);

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter((s) => s !== skill)
        : [...prev.required_skills, skill],
    }));
  };

  // Toggle language selection
  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages_required: prev.languages_required.includes(lang)
        ? prev.languages_required.filter((l) => l !== lang)
        : [...prev.languages_required, lang],
    }));
  };

  // Handle form submission
  const handleSubmit = async (status: 'draft' | 'active') => {
    // Validate required fields
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Job title is required');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Job description is required');
      return;
    }
    if (!formData.salary_min) {
      Alert.alert('Error', 'Minimum salary is required');
      return;
    }
    if (!profileId) {
      Alert.alert('Error', 'Profile not found. Please try again.');
      return;
    }

    setSaving(true);

    try {
      const jobData = {
        sponsor_id: profileId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        job_type: formData.job_type,
        country: formData.country,
        city: formData.city.trim(),
        address: formData.address.trim(),
        salary_min: parseInt(formData.salary_min) || 0,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        currency: formData.currency,
        salary_period: formData.salary_period,
        working_hours_per_day: parseInt(formData.working_hours_per_day) || 8,
        working_days_per_week: parseInt(formData.working_days_per_week) || 6,
        days_off_per_week: parseInt(formData.days_off_per_week) || 1,
        overtime_available: formData.overtime_available,
        live_in_required: formData.live_in_required,
        minimum_experience_years: parseInt(formData.minimum_experience_years) || 0,
        education_requirement: formData.education_requirement || null,
        contract_duration_months: parseInt(formData.contract_duration_months) || 24,
        max_applications: parseInt(formData.max_applications) || 50,
        urgency_level: formData.urgency_level,
        required_skills: formData.required_skills,
        languages_required: formData.languages_required,
        preferred_nationality: formData.preferred_nationality,
        benefits: formData.benefits,
        status,
      };

      const { data } = await createJob({ variables: { data: jobData } });

      Alert.alert(
        'Success',
        status === 'active' ? 'Job posted successfully!' : 'Job saved as draft',
        [{ text: 'OK', onPress: () => router.replace('/sponsor/jobs') }]
      );
    } catch (error: any) {
      console.error('Error creating job:', error);
      Alert.alert('Error', error.message || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Post a Job',
          headerRight: () =>
            saving ? (
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 16 }} />
            ) : null,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Quick Select Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Select Title</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.quickSelectRow}>
                {JOB_TITLES.map((title) => (
                  <TouchableOpacity
                    key={title}
                    style={[
                      styles.quickSelectChip,
                      formData.title === title && styles.quickSelectChipActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, title }))}
                  >
                    <Text
                      style={[
                        styles.quickSelectText,
                        formData.title === title && styles.quickSelectTextActive,
                      ]}
                    >
                      {title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Basic Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                placeholder="e.g., Live-in Housekeeper"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                placeholder="Describe the job responsibilities, requirements, and what you're looking for..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Urgency Level</Text>
              <View style={styles.optionRow}>
                {['normal', 'high', 'urgent'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionChip,
                      formData.urgency_level === level && styles.optionChipActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, urgency_level: level }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.urgency_level === level && styles.optionTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Country *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionRow}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c.name}
                      style={[
                        styles.optionChip,
                        formData.country === c.name && styles.optionChipActive,
                      ]}
                      onPress={() => setFormData((prev) => ({ ...prev, country: c.name }))}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.country === c.name && styles.optionTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, city: text }))}
                placeholder="e.g., Riyadh, Dubai"
              />
            </View>
          </View>

          {/* Compensation */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Compensation</Text>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Min Salary ({formData.currency}) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.salary_min}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, salary_min: text }))}
                  placeholder="1500"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Max Salary ({formData.currency})</Text>
                <TextInput
                  style={styles.input}
                  value={formData.salary_max}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, salary_max: text }))}
                  placeholder="2500"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Payment Period</Text>
              <View style={styles.optionRow}>
                {['monthly', 'weekly', 'hourly'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.optionChip,
                      formData.salary_period === period && styles.optionChipActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, salary_period: period }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.salary_period === period && styles.optionTextActive,
                      ]}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Work Conditions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Work Conditions</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Live-in Required</Text>
              <Switch
                value={formData.live_in_required}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, live_in_required: value }))
                }
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={formData.live_in_required ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Overtime Available</Text>
              <Switch
                value={formData.overtime_available}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, overtime_available: value }))
                }
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={formData.overtime_available ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Hours/Day</Text>
                <TextInput
                  style={styles.input}
                  value={formData.working_hours_per_day}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, working_hours_per_day: text }))
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Days/Week</Text>
                <TextInput
                  style={styles.input}
                  value={formData.working_days_per_week}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, working_days_per_week: text }))
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Required Skills */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Required Skills</Text>
            <View style={styles.chipContainer}>
              {COMMON_SKILLS.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.chip,
                    formData.required_skills.includes(skill) && styles.chipActive,
                  ]}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.required_skills.includes(skill) && styles.chipTextActive,
                    ]}
                  >
                    {skill}
                  </Text>
                  {formData.required_skills.includes(skill) && (
                    <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Languages Required</Text>
            <View style={styles.chipContainer}>
              {COMMON_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.chip,
                    formData.languages_required.includes(lang) && styles.chipActive,
                  ]}
                  onPress={() => toggleLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.languages_required.includes(lang) && styles.chipTextActive,
                    ]}
                  >
                    {lang}
                  </Text>
                  {formData.languages_required.includes(lang) && (
                    <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Experience */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Experience Requirements</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Minimum Experience (Years)</Text>
              <View style={styles.optionRow}>
                {['0', '1', '2', '3', '5'].map((years) => (
                  <TouchableOpacity
                    key={years}
                    style={[
                      styles.optionChip,
                      formData.minimum_experience_years === years && styles.optionChipActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, minimum_experience_years: years }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.minimum_experience_years === years && styles.optionTextActive,
                      ]}
                    >
                      {years === '0' ? 'Any' : `${years}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.draftButton}
              onPress={() => handleSubmit('draft')}
              disabled={saving}
            >
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.publishButton}
              onPress={() => handleSubmit('active')}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                  <Text style={styles.publishButtonText}>Post Job</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickSelectChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quickSelectText: {
    fontSize: 14,
    color: '#4B5563',
  },
  quickSelectTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  optionChipActive: {
    backgroundColor: '#3B82F6',
  },
  optionText: {
    fontSize: 13,
    color: '#4B5563',
  },
  optionTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 15,
    color: '#1F2937',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#3B82F6',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#fff',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  publishButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
