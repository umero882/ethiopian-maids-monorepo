/**
 * Jobs Screen
 *
 * Browse and search available job listings with filtering and sorting.
 * Connected to the same GraphQL API as the web app.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetJobsWithFiltersQuery } from '@ethio/api-client';

// Types
interface Subscription {
  plan_type: string;
  status: string;
}

interface Sponsor {
  id: string;
  name: string;
  avatar_url?: string;
  verification_status?: string;
  subscriptions?: Subscription[];
}

interface Job {
  id: string;
  title: string;
  description?: string;
  job_type?: string;
  country?: string;
  city?: string;
  required_skills?: string[];
  languages_required?: string[];
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  salary_period?: string;
  status?: string;
  urgency_level?: string;
  applications_count?: number;
  views_count?: number;
  featured?: boolean;
  expires_at?: string;
  created_at: string;
  live_in_required?: boolean;
  sponsor?: Sponsor;
}

// Helper function to check if sponsor has a paid subscription
const isPaidSubscriber = (sponsor?: Sponsor): boolean => {
  if (!sponsor?.subscriptions?.length) return false;
  const subscription = sponsor.subscriptions[0];
  return subscription.plan_type !== 'free' &&
    (subscription.status === 'active' || subscription.status === 'past_due');
};

// Filter options
const COUNTRIES = [
  { label: 'All Countries', value: 'all' },
  { label: 'Saudi Arabia', value: 'Saudi Arabia' },
  { label: 'UAE', value: 'UAE' },
  { label: 'Kuwait', value: 'Kuwait' },
  { label: 'Qatar', value: 'Qatar' },
  { label: 'Bahrain', value: 'Bahrain' },
  { label: 'Oman', value: 'Oman' },
  { label: 'Jordan', value: 'Jordan' },
  { label: 'Lebanon', value: 'Lebanon' },
];

const JOB_TYPES = [
  { label: 'All Types', value: 'all' },
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Temporary', value: 'temporary' },
];

const ACCOMMODATION = [
  { label: 'Any', value: 'all' },
  { label: 'Live-in', value: 'live-in' },
  { label: 'Live-out', value: 'live-out' },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest', icon: 'time-outline' },
  { label: 'Best Match', value: 'bestMatch', icon: 'star-outline' },
  { label: 'Salary: High to Low', value: 'salaryHighToLow', icon: 'trending-up-outline' },
  { label: 'Salary: Low to High', value: 'salaryLowToHigh', icon: 'trending-down-outline' },
];

export default function JobsScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    country: 'all',
    jobType: 'all',
    accommodation: 'all',
    urgentOnly: false,
  });

  const [sortBy, setSortBy] = useState('newest');

  // Build GraphQL where clause
  const buildWhereClause = useCallback(() => {
    const where: any = { _and: [] };

    // Always filter for active jobs
    where._and.push({ status: { _eq: 'active' } });

    // Country filter
    if (filters.country !== 'all') {
      where._and.push({ country: { _eq: filters.country } });
    }

    // Job type filter
    if (filters.jobType !== 'all') {
      where._and.push({ job_type: { _eq: filters.jobType } });
    }

    // Accommodation filter
    if (filters.accommodation !== 'all') {
      const liveInRequired = filters.accommodation === 'live-in';
      where._and.push({ live_in_required: { _eq: liveInRequired } });
    }

    // Urgent only filter
    if (filters.urgentOnly) {
      where._and.push({ urgency_level: { _eq: 'urgent' } });
    }

    // Search term
    if (debouncedTerm.trim()) {
      const term = `%${debouncedTerm.trim()}%`;
      where._and.push({
        _or: [
          { title: { _ilike: term } },
          { description: { _ilike: term } },
          { city: { _ilike: term } },
          { country: { _ilike: term } },
        ],
      });
    }

    return where._and.length > 0 ? where : {};
  }, [filters, debouncedTerm]);

  // Build order by clause
  const buildOrderBy = useCallback(() => {
    switch (sortBy) {
      case 'salaryHighToLow':
        return [{ salary_max: 'desc_nulls_last' }];
      case 'salaryLowToHigh':
        return [{ salary_min: 'asc_nulls_last' }];
      case 'newest':
      case 'bestMatch':
      default:
        return [{ created_at: 'desc' }];
    }
  }, [sortBy]);

  // GraphQL query
  const { data, loading, error, refetch } = useGetJobsWithFiltersQuery({
    variables: {
      where: buildWhereClause(),
      orderBy: buildOrderBy(),
      limit: 50,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Debounce search
  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setTimeout(() => {
      setDebouncedTerm(text);
    }, 300);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Process and sort jobs
  const jobs = useMemo(() => {
    let jobList = (data?.jobs || []) as Job[];

    // Apply "best match" sorting on client side
    if (sortBy === 'bestMatch') {
      jobList = [...jobList].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Urgent jobs score higher
        if (a.urgency_level === 'urgent') scoreA += 5;
        if (b.urgency_level === 'urgent') scoreB += 5;

        // Featured jobs score higher
        if (a.featured) scoreA += 3;
        if (b.featured) scoreB += 3;

        // Verified sponsors score higher
        if (isPaidSubscriber(a.sponsor)) scoreA += 4;
        if (isPaidSubscriber(b.sponsor)) scoreB += 4;

        // Higher salary scores higher
        const salaryA = a.salary_min || 0;
        const salaryB = b.salary_min || 0;
        scoreA += salaryA / 200;
        scoreB += salaryB / 200;

        return scoreB - scoreA;
      });
    }

    return jobList;
  }, [data?.jobs, sortBy]);

  const totalCount = data?.jobs_aggregate?.aggregate?.count || jobs.length;

  // Format salary display
  const formatSalary = (job: Job) => {
    const { salary_min, salary_max, currency = 'USD', salary_period = 'monthly' } = job;
    const periodLabel = salary_period === 'monthly' ? '/mo' : salary_period === 'yearly' ? '/yr' : '';

    if (salary_min && salary_max) {
      return `${currency} ${salary_min.toLocaleString()} - ${salary_max.toLocaleString()}${periodLabel}`;
    }
    if (salary_min) return `From ${currency} ${salary_min.toLocaleString()}${periodLabel}`;
    if (salary_max) return `Up to ${currency} ${salary_max.toLocaleString()}${periodLabel}`;
    return 'Salary negotiable';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      country: 'all',
      jobType: 'all',
      accommodation: 'all',
      urgentOnly: false,
    });
    setSortBy('newest');
    setSearchTerm('');
    setDebouncedTerm('');
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.country !== 'all') count++;
    if (filters.jobType !== 'all') count++;
    if (filters.accommodation !== 'all') count++;
    if (filters.urgentOnly) count++;
    return count;
  }, [filters]);

  // Render filter option
  const renderFilterOption = (
    options: { label: string; value: string }[],
    currentValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.filterOptionsRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterChip,
            currentValue === option.value && styles.filterChipActive,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.filterChipText,
              currentValue === option.value && styles.filterChipTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={searchTerm}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchTerm(''); setDebouncedTerm(''); }}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? '#fff' : '#6B7280'}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortContainer}
        contentContainerStyle={styles.sortContent}
      >
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.sortChip, sortBy === option.value && styles.sortChipActive]}
            onPress={() => setSortBy(option.value)}
          >
            <Ionicons
              name={option.icon as any}
              size={16}
              color={sortBy === option.value ? '#fff' : '#6B7280'}
            />
            <Text style={[styles.sortChipText, sortBy === option.value && styles.sortChipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <Text style={styles.resultCount}>
        {totalCount} {totalCount === 1 ? 'job' : 'jobs'} available
        {sortBy === 'bestMatch' && <Text style={styles.aiMatchedText}> • AI Matched</Text>}
      </Text>

      {/* Job List */}
      {loading && jobs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Error loading jobs</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E40AF']} />
          }
          renderItem={({ item }) => (
            <Link href={`/job/${item.id}`} asChild>
              <TouchableOpacity style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    {item.urgency_level === 'urgent' && (
                      <View style={styles.urgentBadge}>
                        <Ionicons name="flash" size={12} color="#DC2626" />
                        <Text style={styles.urgentText}>Urgent</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.postedDate}>{formatDate(item.created_at)}</Text>
                </View>

                {/* Employer */}
                <View style={styles.employerRow}>
                  {item.sponsor?.avatar_url ? (
                    <Image source={{ uri: item.sponsor.avatar_url }} style={styles.sponsorAvatar} />
                  ) : (
                    <View style={styles.sponsorAvatarPlaceholder}>
                      <Ionicons name="person" size={14} color="#9CA3AF" />
                    </View>
                  )}
                  <Text style={styles.employer}>
                    {item.sponsor?.name || 'Unknown Employer'}
                  </Text>
                  {isPaidSubscriber(item.sponsor) && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#059669" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.location}>
                    {[item.city, item.country].filter(Boolean).join(', ') || 'Location not specified'}
                  </Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                  {item.job_type && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{item.job_type}</Text>
                    </View>
                  )}
                  {item.live_in_required !== undefined && (
                    <View style={[styles.tag, styles.tagSecondary]}>
                      <Text style={styles.tagTextSecondary}>
                        {item.live_in_required ? 'Live-in' : 'Live-out'}
                      </Text>
                    </View>
                  )}
                  {item.featured && (
                    <View style={[styles.tag, styles.tagFeatured]}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.tagTextFeatured}>Featured</Text>
                    </View>
                  )}
                </View>

                {/* Salary */}
                <Text style={styles.salary}>{formatSalary(item)}</Text>

                {/* Skills */}
                {item.required_skills && item.required_skills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {item.required_skills.slice(0, 3).map((skill, index) => (
                      <View key={index} style={styles.skillBadge}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                    {item.required_skills.length > 3 && (
                      <Text style={styles.moreSkills}>+{item.required_skills.length - 3} more</Text>
                    )}
                  </View>
                )}

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.statText}>{item.applications_count || 0} applicants</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.statText}>{item.views_count || 0} views</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Jobs</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Country Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Country</Text>
              {renderFilterOption(COUNTRIES, filters.country, (value) =>
                setFilters({ ...filters, country: value })
              )}
            </View>

            {/* Job Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Job Type</Text>
              {renderFilterOption(JOB_TYPES, filters.jobType, (value) =>
                setFilters({ ...filters, jobType: value })
              )}
            </View>

            {/* Accommodation Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Accommodation</Text>
              {renderFilterOption(ACCOMMODATION, filters.accommodation, (value) =>
                setFilters({ ...filters, accommodation: value })
              )}
            </View>

            {/* Urgent Only Toggle */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setFilters({ ...filters, urgentOnly: !filters.urgentOnly })}
              >
                <View style={styles.toggleInfo}>
                  <Ionicons name="flash" size={20} color="#DC2626" />
                  <Text style={styles.toggleLabel}>Urgent Jobs Only</Text>
                </View>
                <View style={[styles.toggle, filters.urgentOnly && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, filters.urgentOnly && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sortContainer: {
    maxHeight: 44,
  },
  sortContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  sortChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  aiMatchedText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  postedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sponsorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  sponsorAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employer: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  tagSecondary: {
    backgroundColor: '#FEF3C7',
  },
  tagTextSecondary: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500',
  },
  tagFeatured: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagTextFeatured: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500',
  },
  salary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    color: '#4B5563',
  },
  moreSkills: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#1E40AF',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
