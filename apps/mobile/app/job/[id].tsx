/**
 * Job Detail Screen
 *
 * Shows detailed information about a specific job.
 * Connected to the same GraphQL API as the web app.
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetJobCompleteQuery } from '@ethio/api-client';
import { useAuth } from '../../context/AuthContext';

// Types
interface Subscription {
  plan_type: string;
  status: string;
}

interface Sponsor {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  verification_status?: string;
  country?: string;
  subscriptions?: Subscription[];
}

interface Job {
  id: string;
  title: string;
  description?: string;
  job_type?: string;
  country?: string;
  city?: string;
  address?: string;
  required_skills?: string[];
  preferred_nationality?: string[];
  languages_required?: string[];
  minimum_experience_years?: number;
  age_preference_min?: number;
  age_preference_max?: number;
  education_requirement?: string;
  working_hours_per_day?: number;
  working_days_per_week?: number;
  days_off_per_week?: number;
  overtime_available?: boolean;
  live_in_required?: boolean;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  salary_period?: string;
  benefits?: string[];
  contract_duration_months?: number;
  start_date?: string;
  end_date?: string;
  probation_period_months?: number;
  status?: string;
  urgency_level?: string;
  max_applications?: number;
  applications_count?: number;
  views_count?: number;
  featured?: boolean;
  featured_until?: string;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
  sponsor?: Sponsor;
}

// Helper function to check if sponsor has a paid subscription
const isPaidSubscriber = (sponsor?: Sponsor): boolean => {
  if (!sponsor?.subscriptions?.length) return false;
  const subscription = sponsor.subscriptions[0];
  return subscription.plan_type !== 'free' &&
    (subscription.status === 'active' || subscription.status === 'past_due');
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const { data, loading, error } = useGetJobCompleteQuery({
    variables: { id: id as string },
    skip: !id,
  });

  const job = data?.jobs_by_pk as Job | undefined;

  // Format salary display
  const formatSalary = () => {
    if (!job) return 'Salary negotiable';
    const { salary_min, salary_max, currency = 'USD', salary_period = 'monthly' } = job;
    const periodLabel = salary_period === 'monthly' ? '/month' : salary_period === 'yearly' ? '/year' : '';

    if (salary_min && salary_max) {
      return `${currency} ${salary_min.toLocaleString()} - ${salary_max.toLocaleString()}${periodLabel}`;
    }
    if (salary_min) return `From ${currency} ${salary_min.toLocaleString()}${periodLabel}`;
    if (salary_max) return `Up to ${currency} ${salary_max.toLocaleString()}${periodLabel}`;
    return 'Salary negotiable';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  // Handle apply
  const handleApply = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to login to apply for jobs.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }
    // TODO: Implement apply functionality
    Alert.alert('Coming Soon', 'Job application feature is coming soon!');
  };

  // Handle save
  const handleSave = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to login to save jobs.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }
    // TODO: Implement save functionality
    Alert.alert('Coming Soon', 'Save job feature is coming soon!');
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...', headerShown: true }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <Stack.Screen options={{ title: 'Job Not Found', headerShown: true }} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Job not found</Text>
          <Text style={styles.errorSubtext}>This job may have been removed or expired.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Job Details',
          headerShown: true,
          headerStyle: { backgroundColor: '#1E40AF' },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{job.title}</Text>
              {job.urgency_level === 'urgent' && (
                <View style={styles.urgentBadge}>
                  <Ionicons name="flash" size={14} color="#DC2626" />
                  <Text style={styles.urgentText}>Urgent</Text>
                </View>
              )}
            </View>
            <Text style={styles.postedDate}>Posted {formatRelativeDate(job.created_at)}</Text>
          </View>

          {/* Sponsor Info */}
          <View style={styles.sponsorCard}>
            {job.sponsor?.avatar_url ? (
              <Image source={{ uri: job.sponsor.avatar_url }} style={styles.sponsorAvatar} />
            ) : (
              <View style={styles.sponsorAvatarPlaceholder}>
                <Ionicons name="business" size={24} color="#6B7280" />
              </View>
            )}
            <View style={styles.sponsorInfo}>
              <View style={styles.sponsorNameRow}>
                <Text style={styles.sponsorName}>{job.sponsor?.name || 'Unknown Employer'}</Text>
                {isPaidSubscriber(job.sponsor) && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#059669" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              {job.sponsor?.country && (
                <Text style={styles.sponsorLocation}>{job.sponsor.country}</Text>
              )}
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.location}>
              {[job.city, job.country].filter(Boolean).join(', ') || 'Location not specified'}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesRow}>
          {job.job_type && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.job_type}</Text>
            </View>
          )}
          {job.live_in_required !== undefined && (
            <View style={[styles.badge, styles.badgeSecondary]}>
              <Text style={styles.badgeTextSecondary}>
                {job.live_in_required ? 'Live-in' : 'Live-out'}
              </Text>
            </View>
          )}
          {job.featured && (
            <View style={[styles.badge, styles.badgeFeatured]}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.badgeTextFeatured}>Featured</Text>
            </View>
          )}
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={styles.badgeTextSuccess}>{job.status || 'Active'}</Text>
          </View>
        </View>

        {/* Salary Card */}
        <View style={styles.salaryCard}>
          <Ionicons name="cash-outline" size={24} color="#059669" />
          <View style={styles.salaryInfo}>
            <Text style={styles.salaryText}>{formatSalary()}</Text>
            {job.benefits && job.benefits.length > 0 && (
              <Text style={styles.benefitsHint}>+ Benefits included</Text>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={20} color="#6B7280" />
            <Text style={styles.statValue}>{job.applications_count || 0}</Text>
            <Text style={styles.statLabel}>Applicants</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={20} color="#6B7280" />
            <Text style={styles.statValue}>{job.views_count || 0}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          {job.expires_at && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.statValue}>Expires</Text>
                <Text style={styles.statLabel}>{formatDate(job.expires_at)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Description */}
        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>
        )}

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.requirementsList}>
            {job.minimum_experience_years !== undefined && job.minimum_experience_years > 0 && (
              <View style={styles.requirementItem}>
                <Ionicons name="briefcase-outline" size={18} color="#6B7280" />
                <Text style={styles.requirementText}>
                  {job.minimum_experience_years}+ years experience
                </Text>
              </View>
            )}
            {job.education_requirement && (
              <View style={styles.requirementItem}>
                <Ionicons name="school-outline" size={18} color="#6B7280" />
                <Text style={styles.requirementText}>{job.education_requirement}</Text>
              </View>
            )}
            {(job.age_preference_min || job.age_preference_max) && (
              <View style={styles.requirementItem}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={styles.requirementText}>
                  Age: {job.age_preference_min || '18'} - {job.age_preference_max || '50'} years
                </Text>
              </View>
            )}
            {job.preferred_nationality && job.preferred_nationality.length > 0 && (
              <View style={styles.requirementItem}>
                <Ionicons name="flag-outline" size={18} color="#6B7280" />
                <Text style={styles.requirementText}>
                  Nationality: {job.preferred_nationality.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Skills Required */}
        {job.required_skills && job.required_skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.tagsContainer}>
              {job.required_skills.map((skill, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages Required */}
        {job.languages_required && job.languages_required.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages Required</Text>
            <View style={styles.tagsContainer}>
              {job.languages_required.map((lang, index) => (
                <View key={index} style={styles.tag}>
                  <Ionicons name="chatbubble-outline" size={14} color="#4B5563" />
                  <Text style={styles.tagText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Work Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Details</Text>
          <View style={styles.detailsGrid}>
            {job.working_hours_per_day && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Hours/Day</Text>
                <Text style={styles.detailValue}>{job.working_hours_per_day}</Text>
              </View>
            )}
            {job.working_days_per_week && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Days/Week</Text>
                <Text style={styles.detailValue}>{job.working_days_per_week}</Text>
              </View>
            )}
            {job.days_off_per_week !== undefined && (
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Days Off</Text>
                <Text style={styles.detailValue}>{job.days_off_per_week}/week</Text>
              </View>
            )}
            {job.contract_duration_months && (
              <View style={styles.detailItem}>
                <Ionicons name="document-text-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Contract</Text>
                <Text style={styles.detailValue}>{job.contract_duration_months} months</Text>
              </View>
            )}
          </View>
          {job.overtime_available && (
            <View style={styles.overtimeNote}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.overtimeText}>Overtime available</Text>
            </View>
          )}
        </View>

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <View style={styles.benefitsList}>
              {job.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Start Date */}
        {job.start_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start Date</Text>
            <View style={styles.startDateCard}>
              <Ionicons name="calendar" size={24} color="#1E40AF" />
              <Text style={styles.startDateText}>{formatDate(job.start_date)}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Ionicons name="paper-plane-outline" size={20} color="#fff" />
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="bookmark-outline" size={24} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        {/* Contact Sponsor (for verified users) */}
        {isAuthenticated && job.sponsor && (
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#1E40AF" />
            <Text style={styles.contactButtonText}>Message Employer</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  urgentText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  postedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sponsorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sponsorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sponsorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sponsorInfo: {
    flex: 1,
  },
  sponsorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  sponsorLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
  badgeSecondary: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextSecondary: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '500',
  },
  badgeFeatured: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeTextFeatured: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '500',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeTextSuccess: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  salaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  salaryInfo: {
    flex: 1,
  },
  salaryText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  benefitsHint: {
    fontSize: 13,
    color: '#059669',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 15,
    color: '#4B5563',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#4B5563',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  overtimeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  overtimeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 15,
    color: '#4B5563',
  },
  startDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  startDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1E40AF',
    borderRadius: 12,
  },
  contactButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
