/**
 * Edit Job Page
 *
 * Form for sponsors to edit existing job postings.
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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gql, useQuery, useMutation } from '@apollo/client';

// Get job details for editing
const GET_JOB_FOR_EDIT = gql`
  query GetJobForEdit($id: uuid!) {
    jobs_by_pk(id: $id) {
      id
      title
      description
      job_type
      country
      city
      address
      salary_min
      salary_max
      currency
      salary_period
      working_hours_per_day
      working_days_per_week
      days_off_per_week
      overtime_available
      live_in_required
      minimum_experience_years
      education_requirement
      contract_duration_months
      max_applications
      urgency_level
      required_skills
      languages_required
      preferred_nationality
      benefits
      status
    }
  }
`;

// Update job mutation
const UPDATE_JOB = gql`
  mutation UpdateJob($id: uuid!, $data: jobs_set_input!) {
    update_jobs_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      title
      status
      updated_at
    }
  }
`;

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

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Get existing job data
  const { data, loading, error } = useQuery(GET_JOB_FOR_EDIT, {
    variables: { id },
    skip: !id,
    onCompleted: (result) => {
      const job = result?.jobs_by_pk;
      if (job) {
        setFormData({
          title: job.title || '',
          description: job.description || '',
          job_type: job.job_type || 'full-time',
          country: job.country || 'Saudi Arabia',
          city: job.city || '',
          address: job.address || '',
          salary_min: job.salary_min?.toString() || '',
          salary_max: job.salary_max?.toString() || '',
          currency: job.currency || 'SAR',
          salary_period: job.salary_period || 'monthly',
          working_hours_per_day: job.working_hours_per_day?.toString() || '8',
          working_days_per_week: job.working_days_per_week?.toString() || '6',
          days_off_per_week: job.days_off_per_week?.toString() || '1',
          overtime_available: job.overtime_available || false,
          live_in_required: job.live_in_required !== false,
          minimum_experience_years: job.minimum_experience_years?.toString() || '0',
          education_requirement: job.education_requirement || '',
          contract_duration_months: job.contract_duration_months?.toString() || '24',
          max_applications: job.max_applications?.toString() || '50',
          urgency_level: job.urgency_level || 'normal',
          required_skills: job.required_skills || [],
          languages_required: job.languages_required || [],
          preferred_nationality: job.preferred_nationality || [],
          benefits: job.benefits || [],
        });
      }
    },
  });

  // Update job mutation
  const [updateJob] = useMutation(UPDATE_JOB);

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      required_skills: formData.required_skills.includes(skill)
        ? formData.required_skills.filter((s) => s !== skill)
        : [...formData.required_skills, skill],
    });
  };

  // Toggle language selection
  const toggleLanguage = (lang: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      languages_required: formData.languages_required.includes(lang)
        ? formData.languages_required.filter((l) => l !== lang)
        : [...formData.languages_required, lang],
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData) return;

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

    setSaving(true);

    try {
      const jobData = {
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
      };

      await updateJob({ variables: { id, data: jobData } });

      Alert.alert('Success', 'Job updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('Error updating job:', err);
      Alert.alert('Error', err.message || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading job...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load job</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Job',
          headerRight: () =>
            saving ? (
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 16 }} />
            ) : (
              <TouchableOpacity onPress={handleSubmit} style={{ marginRight: 16 }}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Live-in Housekeeper"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the job responsibilities..."
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
                    onPress={() => setFormData({ ...formData, urgency_level: level })}
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
                      onPress={() => setFormData({ ...formData, country: c.name, currency: c.currency })}
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
                onChangeText={(text) => setFormData({ ...formData, city: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, salary_min: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, salary_max: text })}
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
                    onPress={() => setFormData({ ...formData, salary_period: period })}
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
                onValueChange={(value) => setFormData({ ...formData, live_in_required: value })}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={formData.live_in_required ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Overtime Available</Text>
              <Switch
                value={formData.overtime_available}
                onValueChange={(value) => setFormData({ ...formData, overtime_available: value })}
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
                  onChangeText={(text) => setFormData({ ...formData, working_hours_per_day: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Days/Week</Text>
                <TextInput
                  style={styles.input}
                  value={formData.working_days_per_week}
                  onChangeText={(text) => setFormData({ ...formData, working_days_per_week: text })}
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
                    onPress={() => setFormData({ ...formData, minimum_experience_years: years })}
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

          {/* Update Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Update Job</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
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
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  updateButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
