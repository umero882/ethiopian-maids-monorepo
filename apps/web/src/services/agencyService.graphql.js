/**
 * Agency Service - GraphQL Implementation (FIXED for actual schema)
 * Handles agency profile operations using GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('AgencyService.GraphQL');

// Helper to get current user from Firebase Auth
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user;
};

// Inline GraphQL documents matching ACTUAL schema
// Note: agency_profiles.id uses String type (Firebase UID)
const GetAgencyProfileDocument = gql`
  query GetAgencyProfile($id: String!) {
    agency_profiles_by_pk(id: $id) {
      id
      full_name
      license_number
      license_expiry_date
      established_year
      agency_description
      country
      city
      address
      phone
      email
      website
      verified
      total_maids
      active_maids
      successful_placements
      authorized_person_id_number
      authorized_person_id_document
      authorized_person_name
      authorized_person_position
      authorized_person_phone
      authorized_person_email
      service_countries
      specialization
      trade_license_document
      authorized_person_id_verification_status
      trade_license_verification_status
      verification_status
      logo_url
      created_at
      updated_at
    }
  }
`;

const ListAgencyProfilesDocument = gql`
  query ListAgencyProfiles(
    $limit: Int = 20
    $offset: Int = 0
    $orderBy: [agency_profiles_order_by!] = [{created_at: desc}]
  ) {
    agency_profiles(
      limit: $limit
      offset: $offset
      order_by: $orderBy
    ) {
      id
      full_name
      license_number
      country
      city
      phone
      verified
      total_maids
      successful_placements
      created_at
    }
    agency_profiles_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const CreateAgencyProfileDocument = gql`
  mutation CreateAgencyProfile($data: agency_profiles_insert_input!) {
    insert_agency_profiles_one(object: $data) {
      id
      full_name
      license_number
      license_expiry_date
      established_year
      agency_description
      country
      city
      address
      phone
      email
      website
      verified
      total_maids
      active_maids
      successful_placements
      authorized_person_id_number
      authorized_person_id_document
      authorized_person_name
      authorized_person_position
      authorized_person_phone
      authorized_person_email
      service_countries
      specialization
      trade_license_document
      created_at
      updated_at
    }
  }
`;

// Note: agency_profiles.id uses String type (Firebase UID)
const UpdateAgencyProfileDocument = gql`
  mutation UpdateAgencyProfile($id: String!, $data: agency_profiles_set_input!) {
    update_agency_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
      id
      full_name
      license_number
      license_expiry_date
      established_year
      agency_description
      country
      city
      address
      phone
      email
      website
      verified
      total_maids
      active_maids
      successful_placements
      authorized_person_id_number
      authorized_person_id_document
      authorized_person_name
      authorized_person_position
      authorized_person_phone
      authorized_person_email
      service_countries
      specialization
      trade_license_document
      updated_at
    }
  }
`;

// Note: agency_profiles.id uses String type (Firebase UID)
const DeleteAgencyProfileDocument = gql`
  mutation DeleteAgencyProfile($id: String!) {
    delete_agency_profiles_by_pk(id: $id) {
      id
    }
  }
`;

// ============================================================================
// MAIDS MANAGEMENT - GraphQL Documents
// ============================================================================

// Note: agency_id uses String type (Firebase UID)
const GetAgencyMaidsDocument = gql`
  query GetAgencyMaids(
    $agency_id: String!
  ) {
    maid_profiles(
      where: {
        agency_id: {_eq: $agency_id}
      }
      order_by: {created_at: desc}
    ) {
      id
      full_name
      date_of_birth
      nationality
      current_location
      state_province
      country
      preferred_currency
      marital_status
      children_count
      experience_years
      skills
      languages
      previous_countries
      availability_status
      preferred_salary_min
      preferred_salary_max
      visa_status
      passport_number
      agency_id
      is_agency_managed
      profile_photo_url
      additional_notes
      created_at
      updated_at
    }
  }
`;

const CreateMaidProfileDocument = gql`
  mutation CreateMaidProfile($data: maid_profiles_insert_input!) {
    insert_maid_profiles_one(object: $data) {
      id
      full_name
      date_of_birth
      nationality
      current_location
      marital_status
      children_count
      experience_years
      skills
      languages
      previous_countries
      availability_status
      preferred_salary_min
      preferred_salary_max
      visa_status
      passport_number
      agency_id
      is_agency_managed
      created_at
      updated_at
    }
  }
`;

// Note: maid_profiles.id uses String type (Firebase UID)
const UpdateMaidProfileDocument = gql`
  mutation UpdateMaidProfile($id: String!, $data: maid_profiles_set_input!) {
    update_maid_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
      id
      full_name
      date_of_birth
      nationality
      current_location
      state_province
      country
      preferred_currency
      marital_status
      children_count
      experience_years
      skills
      languages
      previous_countries
      availability_status
      preferred_salary_min
      preferred_salary_max
      visa_status
      passport_number
      additional_notes
      profile_photo_url
      updated_at
    }
  }
`;

const DeleteMaidProfileDocument = gql`
  mutation DeleteMaidProfile($id: String!, $agency_id: String!) {
    delete_maid_profiles(
      where: {
        id: {_eq: $id}
        agency_id: {_eq: $agency_id}
      }
    ) {
      affected_rows
    }
  }
`;

const GetMaidProfileByIdDocument = gql`
  query GetMaidProfileById($id: String!) {
    maid_profiles_by_pk(id: $id) {
      id
      full_name
      date_of_birth
      nationality
      current_location
      state_province
      country
      preferred_currency
      marital_status
      children_count
      experience_years
      skills
      languages
      previous_countries
      availability_status
      preferred_salary_min
      preferred_salary_max
      visa_status
      passport_number
      agency_id
      is_agency_managed
      profile_photo_url
      additional_notes
      created_at
      updated_at
    }
  }
`;

const CheckPassportUniquenessDocument = gql`
  query CheckPassportUniqueness($passport_number: String!) {
    maid_profiles(
      where: {passport_number: {_eq: $passport_number}}
      limit: 1
    ) {
      id
    }
  }
`;

// ============================================================================
// JOBS MANAGEMENT - GraphQL Documents
// ============================================================================

const GetAgencyJobsDocument = gql`
  query GetAgencyJobs($agency_id: String!) {
    agency_jobs(
      where: { agency_id: { _eq: $agency_id } }
      order_by: { created_at: desc }
    ) {
      id
      agency_id
      sponsor_id
      title
      description
      location
      salary_min
      salary_max
      currency
      status
      priority
      contract_duration_months
      working_hours
      family_size
      children_count
      job_type
      live_in_required
      requirements
      benefits
      requirements_array
      benefits_array
      required_skills
      required_languages
      expires_at
      posted_date
      filled_date
      applicant_count
      matched_count
      view_count
      created_at
      updated_at
    }
  }
`;

const GetAgencyJobByIdDocument = gql`
  query GetAgencyJobById($id: String!, $agency_id: String!) {
    agency_jobs_by_pk(id: $id) {
      id
      agency_id
      sponsor_id
      title
      description
      location
      salary_min
      salary_max
      currency
      status
      priority
      contract_duration_months
      working_hours
      family_size
      children_count
      job_type
      live_in_required
      requirements
      benefits
      requirements_array
      benefits_array
      required_skills
      required_languages
      expires_at
      posted_date
      filled_date
      applicant_count
      matched_count
      view_count
      created_at
      updated_at
    }
  }
`;

const CreateAgencyJobDocument = gql`
  mutation CreateAgencyJob($data: agency_jobs_insert_input!) {
    insert_agency_jobs_one(object: $data) {
      id
      agency_id
      sponsor_id
      title
      description
      location
      salary_min
      salary_max
      currency
      status
      priority
      contract_duration_months
      working_hours
      family_size
      children_count
      job_type
      live_in_required
      requirements
      benefits
      requirements_array
      benefits_array
      required_skills
      required_languages
      expires_at
      created_at
      updated_at
    }
  }
`;

const UpdateAgencyJobDocument = gql`
  mutation UpdateAgencyJob($id: String!, $agency_id: String!, $data: agency_jobs_set_input!) {
    update_agency_jobs(
      where: {
        id: {_eq: $id}
        agency_id: {_eq: $agency_id}
      }
      _set: $data
    ) {
      affected_rows
      returning {
        id
        title
        description
        location
        status
        priority
        salary_min
        salary_max
        updated_at
      }
    }
  }
`;

const DeleteAgencyJobDocument = gql`
  mutation DeleteAgencyJob($id: String!, $agency_id: String!) {
    delete_agency_jobs(
      where: {
        id: {_eq: $id}
        agency_id: {_eq: $agency_id}
      }
    ) {
      affected_rows
    }
  }
`;

const IncrementJobViewCountDocument = gql`
  mutation IncrementJobViewCount($id: String!, $agency_id: String!) {
    update_agency_jobs_by_pk(
      pk_columns: {id: $id}
      _inc: {view_count: 1}
    ) {
      id
      view_count
    }
  }
`;

// ============================================================================
// APPLICATIONS MANAGEMENT - GraphQL Documents
// ============================================================================

const GetApplicationsDocument = gql`
  query GetApplications($agency_id: String!) {
    applications(
      where: { agency_id: { _eq: $agency_id } }
      order_by: { created_at: desc }
    ) {
      id
      job_id
      maid_id
      agency_id
      application_status
      match_score
      priority
      viewed_by_agency
      viewed_at
      notes
      interview_date
      interview_notes
      offer_date
      offer_amount
      offer_currency
      response_deadline
      rejection_reason
      hired_date
      created_at
      updated_at
      maid_profile {
        id
        full_name
        nationality
        experience_years
        skills
        languages
        verification_status
        phone_number
        current_location
        availability_status
        profile_photo_url
      }
    }
  }
`;

const GetApplicationByIdDocument = gql`
  query GetApplicationById($id: String!, $agency_id: String!) {
    applications_by_pk(id: $id) {
      id
      job_id
      maid_id
      agency_id
      application_status
      match_score
      priority
      viewed_by_agency
      viewed_at
      notes
      interview_date
      interview_notes
      offer_date
      offer_amount
      offer_currency
      response_deadline
      rejection_reason
      hired_date
      created_at
      updated_at
      job:jobs {
        id
        title
        description
        location
        salary_min
        salary_max
        currency
        required_skills
        languages_required
      }
      maid:maid_profiles {
        id
        full_name
        age
        nationality
        experience_years
        skills
        languages
        verification_status
        phone_number
        email
        current_location
        availability_status
        expected_salary
        bio
      }
    }
  }
`;

const UpdateApplicationStatusDocument = gql`
  mutation UpdateApplicationStatus(
    $id: String!
    $agency_id: String!
    $status: String!
    $additionalData: applications_set_input
  ) {
    update_applications(
      where: {
        id: {_eq: $id}
        agency_id: {_eq: $agency_id}
      }
      _set: $additionalData
    ) {
      affected_rows
      returning {
        id
        application_status
        updated_at
      }
    }
  }
`;

const MarkApplicationAsViewedDocument = gql`
  mutation MarkApplicationAsViewed($id: String!, $agency_id: String!) {
    update_applications(
      where: {
        id: {_eq: $id}
        agency_id: {_eq: $agency_id}
      }
      _set: {
        viewed_by_agency: true
        viewed_at: "now()"
      }
    ) {
      affected_rows
      returning {
        id
        viewed_by_agency
        viewed_at
      }
    }
  }
`;

const AddApplicationNotesDocument = gql`
  mutation AddApplicationNotes($id: String!, $agency_id: String!, $notes: String!) {
    update_applications(
      where: {
        id: {_eq: $id}
        agency_id: {_eq: $agency_id}
      }
      _set: {notes: $notes}
    ) {
      affected_rows
      returning {
        id
        notes
      }
    }
  }
`;

const GetApplicationStatsDocument = gql`
  query GetApplicationStats($agency_id: String!) {
    applications_aggregate(where: {agency_id: {_eq: $agency_id}}) {
      aggregate {
        count
        avg {
          match_score
        }
      }
    }
    new: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "new"}}
    ) {
      aggregate { count }
    }
    reviewed: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "reviewed"}}
    ) {
      aggregate { count }
    }
    shortlisted: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "shortlisted"}}
    ) {
      aggregate { count }
    }
    interviewed: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "interviewed"}}
    ) {
      aggregate { count }
    }
    offered: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "offered"}}
    ) {
      aggregate { count }
    }
    hired: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "hired"}}
    ) {
      aggregate { count }
    }
    rejected: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "rejected"}}
    ) {
      aggregate { count }
    }
    withdrawn: applications_aggregate(
      where: {agency_id: {_eq: $agency_id}, application_status: {_eq: "withdrawn"}}
    ) {
      aggregate { count }
    }
    highPriority: applications_aggregate(
      where: {
        agency_id: {_eq: $agency_id}
        priority: {_in: ["high", "urgent"]}
      }
    ) {
      aggregate { count }
    }
  }
`;

/**
 * GraphQL Agency Service Implementation
 */
export const graphqlAgencyService = {
  /**
   * Get agency profile by ID
   */
  async getAgencyProfile(userId) {
    try {
      log.info('Getting agency profile:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetAgencyProfileDocument,
        variables: { id: userId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const profile = data?.agency_profiles_by_pk;

      if (!profile) {
        log.warn('Agency profile not found');
        return {
          data: null,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Agency profile not found' },
        };
      }

      log.info('Agency profile retrieved successfully');
      return { data: profile, error: null };
    } catch (error) {
      log.error('Error getting agency profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * List agency profiles with pagination
   */
  async listAgencyProfiles(options = {}) {
    try {
      const { limit = 20, offset = 0, orderBy } = options;

      log.info('Listing agency profiles:', { limit, offset });

      const { data, errors } = await apolloClient.query({
        query: ListAgencyProfilesDocument,
        variables: { limit, offset, orderBy },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const profiles = data?.agency_profiles || [];
      const total = data?.agency_profiles_aggregate?.aggregate?.count || 0;

      log.info(`Retrieved ${profiles.length} profiles (total: ${total})`);
      return { data: { profiles, total }, error: null };
    } catch (error) {
      log.error('Error listing agency profiles:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Create agency profile
   */
  async createAgencyProfile(userId, profileData) {
    try {
      log.info('Creating agency profile:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateAgencyProfileDocument,
        variables: {
          data: {
            id: userId,
            ...profileData,
          },
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const profile = data?.insert_agency_profiles_one;

      if (!profile) {
        log.warn('No data returned from create mutation');
        return {
          data: null,
          error: { message: 'Profile may have been created but no data returned' },
        };
      }

      log.info('Agency profile created successfully');
      return { data: profile, error: null };
    } catch (error) {
      log.error('Error creating agency profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update agency profile
   */
  async updateAgencyProfile(userId, updates) {
    try {
      log.info('Updating agency profile:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateAgencyProfileDocument,
        variables: {
          id: userId,
          data: updates,
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const profile = data?.update_agency_profiles_by_pk;

      if (!profile) {
        log.warn('No data returned from update mutation');
        return {
          data: null,
          error: { message: 'Update may have succeeded but no data returned' },
        };
      }

      log.info('Agency profile updated successfully');
      return { data: profile, error: null };
    } catch (error) {
      log.error('Error updating agency profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Delete agency profile
   */
  async deleteAgencyProfile(userId) {
    try {
      log.info('Deleting agency profile:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteAgencyProfileDocument,
        variables: { id: userId },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      log.info('Agency profile deleted successfully');
      return { data: data?.delete_agency_profiles_by_pk, error: null };
    } catch (error) {
      log.error('Error deleting agency profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // MAIDS MANAGEMENT OPERATIONS
  // ============================================================================

  /**
   * Get agency maids with optional filters
   */
  async getAgencyMaids(filters = {}) {
    try {
      log.info('[GraphQL] Getting agency maids with filters:', filters);

      // Get current user ID
      const user = getCurrentUser();
      const agencyId = user.uid;

      const { data, errors } = await apolloClient.query({
        query: GetAgencyMaidsDocument,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: [], error: { message: errors[0].message } };
      }

      if (!data) {
        log.error('[GraphQL] Query returned no data');
        return { data: [], error: { message: 'Query returned no data' } };
      }

      let maids = data?.maid_profiles || [];

      // Apply client-side filters if provided
      if (filters.status) {
        maids = maids.filter(m => m.availability_status === filters.status);
      }
      if (filters.availability_status) {
        maids = maids.filter(m => m.availability_status === filters.availability_status);
      }
      if (filters.nationality) {
        maids = maids.filter(m => m.nationality === filters.nationality);
      }

      // Normalize data structure
      const normalized = maids.map((maid) => ({
        ...maid,
        // Use profile_photo_url for primary image display
        primaryImage: maid.profile_photo_url || null,
        agencyManaged: true,
      }));

      log.info(`[GraphQL] Retrieved ${normalized.length} agency maids`);
      return { data: normalized, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching agency maids:', error);
      return { data: [], error: { message: error.message } };
    }
  },

  /**
   * Create maid profile
   */
  async createMaidProfile(maidData, explicitAgencyId = null) {
    try {
      log.info('[GraphQL] Creating maid profile');

      // Get agency ID from Firebase
      const user = getCurrentUser();
      const agencyId = explicitAgencyId || user?.uid;
      if (!agencyId) throw new Error('Agency ID not available');

      // Generate UUID
      const { v4: uuidv4 } = await import('uuid');
      const maidId = uuidv4();

      // Build payload matching database schema
      const payload = {
        id: maidId,
        is_agency_managed: true,
        agency_id: agencyId,
        full_name: maidData.full_name || maidData.name || '',
        date_of_birth: maidData.date_of_birth || maidData.dateOfBirth || null,
        nationality: maidData.nationality || maidData.country || null,
        current_location: maidData.current_location || maidData.currentLocation || null,
        marital_status: maidData.marital_status || maidData.maritalStatus || null,
        children_count: maidData.children_count ?? maidData.childrenCount ?? 0,
        experience_years: maidData.experience_years ?? maidData.experienceYears ?? 0,
        skills: Array.isArray(maidData.skills) ? maidData.skills : [],
        languages: Array.isArray(maidData.languages) ? maidData.languages : [],
        previous_countries: Array.isArray(maidData.previous_countries) ? maidData.previous_countries : [],
        availability_status: maidData.availability_status || maidData.availability || 'available',
        preferred_salary_min: maidData.salaryExpectation || maidData.preferred_salary_min || maidData.salaryExpectations || null,
        preferred_salary_max: maidData.preferred_salary_max || maidData.salaryExpectation || maidData.salaryExpectations || null,
        visa_status: maidData.visa_status || null,
        passport_number: maidData.passport_number || null,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateMaidProfileDocument,
        variables: { data: payload },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const created = data?.insert_maid_profiles_one;
      log.info('[GraphQL] Maid profile created successfully');
      return { data: { ...created, agencyManaged: true }, error: null };
    } catch (error) {
      log.error('[GraphQL] Error creating maid profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Bulk create maid profiles
   */
  async bulkCreateMaidProfiles(rows, explicitAgencyId = null) {
    try {
      log.info('[GraphQL] Bulk creating maid profiles:', rows.length);

      // Get agency ID from Firebase
      const user = getCurrentUser();
      const agencyId = explicitAgencyId || user?.uid;
      if (!agencyId) throw new Error('Agency ID not available');

      const summary = { success: 0, failed: 0, errors: [] };
      const results = [];

      // Process sequentially to capture per-row errors
      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx] || {};
        try {
          const { data, error } = await this.createMaidProfile(r, agencyId);
          if (error) {
            summary.failed += 1;
            summary.errors.push({ index: idx, message: error.message || 'Unknown error' });
            results.push(null);
          } else {
            summary.success += 1;
            results.push(data);
          }
        } catch (err) {
          summary.failed += 1;
          summary.errors.push({ index: idx, message: err.message || 'Unexpected error' });
          results.push(null);
        }
      }

      log.info(`[GraphQL] Bulk creation complete: ${summary.success} success, ${summary.failed} failed`);
      return { data: results, summary, error: null };
    } catch (error) {
      log.error('[GraphQL] Error in bulkCreateMaidProfiles:', error);
      return {
        data: null,
        summary: { success: 0, failed: rows?.length || 0, errors: [{ index: -1, message: error.message }] },
        error: { message: error.message },
      };
    }
  },

  /**
   * Add agency maid (with image upload support)
   */
  async addAgencyMaid(maidData) {
    try {
      log.info('[GraphQL] Adding agency maid');

      // Create maid profile via GraphQL
      const { data: newMaid, error: maidError } = await this.createMaidProfile(maidData);
      if (maidError) throw new Error(maidError.message);

      // Handle image uploads if present (using Firebase Storage)
      if (maidData.images && Array.isArray(maidData.images)) {
        const { uploadFile } = await import('@/lib/firebaseStorage');

        const imagePromises = maidData.images.map(async (image, index) => {
          if (image.file) {
            // Upload image to Firebase Storage
            const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
            const imagePath = `maids/${newMaid.id}/${generateId()}_${image.file.name}`;

            try {
              const { url: publicUrl, path: storagePath } = await uploadFile(imagePath, image.file);

              // Save image metadata to database via GraphQL
              const INSERT_MAID_IMAGE = gql`
                mutation InsertMaidImage($data: maid_images_insert_input!) {
                  insert_maid_images_one(object: $data) {
                    id
                    file_url
                  }
                }
              `;

              await apolloClient.mutate({
                mutation: INSERT_MAID_IMAGE,
                variables: {
                  data: {
                    maid_id: newMaid.id,
                    file_url: publicUrl,
                    file_name: image.file.name,
                    file_path: storagePath,
                    is_primary: image.isPrimary || index === 0,
                    display_order: index,
                  }
                }
              });
            } catch (uploadError) {
              log.error('[GraphQL] Error uploading maid image:', uploadError);
              // Continue with other images even if one fails
            }
          }
          return null;
        });

        await Promise.all(imagePromises);
      }

      log.info('[GraphQL] Agency maid added successfully with images');
      return { data: newMaid, error: null };
    } catch (error) {
      log.error('[GraphQL] Error adding agency maid:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update agency maid
   */
  async updateAgencyMaid(id, maidData) {
    try {
      log.info('[GraphQL] Updating agency maid:', id);

      // Map form field names to database field names
      const fieldMapping = {
        name: 'full_name',
        experience: 'experience_years',
        country: 'nationality',
        agencyNotes: 'additional_notes',
        status: 'availability_status',
        currentCountry: 'current_location',
        cityState: 'state_province',
      };

      // Fields to exclude from updates (GraphQL metadata, read-only fields, relationships, etc.)
      const excludeFields = new Set([
        '__typename',
        'id',
        'created_at',
        'agency_id',
        'is_agency_managed',
        'primaryImage',
        'agencyManaged',
        'documents',
        'maid_images',
        'images',
        'profile',
        'applications',
        'reviews',
        'bookings',
        'favorites',
        'interests',
        'user_id',
        'verification_status',
        'profile_views',
        'total_applications',
        'successful_placements',
        'average_rating',
        'profile_completion_percentage',
      ]);

      // Helper to remove __typename from nested objects
      const cleanValue = (val) => {
        if (val === null || val === undefined) return val;
        if (Array.isArray(val)) {
          return val.map(cleanValue);
        }
        if (typeof val === 'object' && val !== null) {
          const cleaned = {};
          for (const [k, v] of Object.entries(val)) {
            if (k !== '__typename') {
              cleaned[k] = cleanValue(v);
            }
          }
          return cleaned;
        }
        return val;
      };

      // Transform form data to database schema
      const updates = {};
      for (const [key, value] of Object.entries(maidData)) {
        // Skip excluded fields
        if (excludeFields.has(key)) continue;

        const dbField = fieldMapping[key] || key;
        // Convert experience to integer if it's a string
        if (key === 'experience' && value) {
          updates[dbField] = parseInt(value, 10) || 0;
        } else {
          updates[dbField] = cleanValue(value);
        }
      }
      updates.updated_at = new Date().toISOString();

      console.log('[updateAgencyMaid] Input maidData:', maidData);
      console.log('[updateAgencyMaid] profile_photo_url in input:', maidData.profile_photo_url);
      console.log('[updateAgencyMaid] Final updates payload:', updates);
      console.log('[updateAgencyMaid] profile_photo_url in updates:', updates.profile_photo_url);

      log.debug('[GraphQL] Update payload:', updates);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateMaidProfileDocument,
        variables: {
          id,
          data: updates,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const updated = data?.update_maid_profiles_by_pk;
      log.info('[GraphQL] Agency maid updated successfully');
      return { data: updated, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating agency maid:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Remove agency maid
   */
  async removeAgencyMaid(maidId) {
    try {
      log.info('[GraphQL] Removing agency maid:', maidId);

      // Get current user ID from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteMaidProfileDocument,
        variables: {
          id: maidId,
          agency_id: user.uid,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const affectedRows = data?.delete_maid_profiles?.affected_rows || 0;
      log.info(`[GraphQL] Removed ${affectedRows} maid profile(s)`);
      return { data: affectedRows > 0, error: null };
    } catch (error) {
      log.error('[GraphQL] Error removing agency maid:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get agency maid by ID
   */
  async getAgencyMaidById(id) {
    try {
      log.info('[GraphQL] Getting agency maid by ID:', id);

      const { data, errors } = await apolloClient.query({
        query: GetMaidProfileByIdDocument,
        variables: { id },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const maid = data?.maid_profiles_by_pk;
      if (!maid) {
        return { data: null, error: { message: 'Maid profile not found' } };
      }

      console.log('[getAgencyMaidById] Raw maid from DB:', maid);
      console.log('[getAgencyMaidById] profile_photo_url from DB:', maid.profile_photo_url);

      // Map database fields to form field names for UI compatibility
      const normalizedMaid = {
        ...maid,
        name: maid.full_name,
        experience: maid.experience_years,
        country: maid.nationality,
        agencyNotes: maid.additional_notes,
        status: maid.availability_status,
        currentCountry: maid.current_location,
        cityState: maid.state_province,
      };

      console.log('[getAgencyMaidById] Normalized maid:', normalizedMaid);
      console.log('[getAgencyMaidById] profile_photo_url in normalized:', normalizedMaid.profile_photo_url);

      log.info('[GraphQL] Agency maid retrieved successfully');
      return { data: normalizedMaid, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching agency maid:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Check passport uniqueness
   */
  async checkPassportUniqueness(passportNumber) {
    try {
      log.info('[GraphQL] Checking passport uniqueness:', passportNumber);

      const { data, errors } = await apolloClient.query({
        query: CheckPassportUniquenessDocument,
        variables: { passport_number: passportNumber },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const existingProfiles = data?.maid_profiles || [];
      const isUnique = existingProfiles.length === 0;

      log.info(`[GraphQL] Passport uniqueness check: ${isUnique ? 'unique' : 'duplicate'}`);
      return {
        data: {
          isUnique,
          existingCount: existingProfiles.length,
        },
        error: null,
      };
    } catch (error) {
      log.error('[GraphQL] Error checking passport uniqueness:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get agency settings (wrapper for getAgencyProfile)
   */
  async getAgencySettings(userId) {
    try {
      const { data: profile, error } = await this.getAgencyProfile(userId);

      if (error) return { data: null, error };
      if (!profile) return { data: null, error: null };

      // Transform to settings format
      return {
        data: {
          profile: {
            agencyName: profile.full_name || '',
            contactEmail: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            registration_country: profile.country || '',
            description: profile.agency_description || '',
            website: profile.website || '',
          },
          notifications: null,
          security: null,
          team: null,
        },
        error: null,
      };
    } catch (error) {
      log.error('[GraphQL] Error getting agency settings:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // JOBS MANAGEMENT OPERATIONS
  // ============================================================================

  /**
   * Get agency jobs with optional filters
   */
  async getAgencyJobs(filters = {}) {
    try {
      log.info('[GraphQL] Getting agency jobs with filters:', filters);

      // Get current user ID from Firebase
      const user = auth.currentUser;
      if (!user) {
        log.warn('[GraphQL] User not authenticated');
        return { data: [], error: null };
      }

      const variables = {
        agency_id: user.uid,
      };

      const { data, errors } = await apolloClient.query({
        query: GetAgencyJobsDocument,
        variables,
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: [], error: { message: errors[0].message } };
      }

      let jobs = data?.agency_jobs || [];

      // Apply client-side filters
      if (filters.status && filters.status !== 'all') {
        jobs = jobs.filter(j => j.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        jobs = jobs.filter(j => j.priority === filters.priority);
      }
      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        jobs = jobs.filter(j => j.location?.toLowerCase().includes(locationLower));
      }

      log.info(`[GraphQL] Retrieved ${jobs.length} agency jobs`);
      return { data: jobs, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching agency jobs:', error);
      return { data: [], error: { message: error.message } };
    }
  },

  /**
   * Get agency job by ID
   */
  async getAgencyJobById(jobId) {
    try {
      log.info('[GraphQL] Getting agency job by ID:', jobId);

      // Get current user from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.query({
        query: GetAgencyJobByIdDocument,
        variables: { id: jobId, agency_id: user.uid },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const job = data?.agency_jobs_by_pk;
      if (!job) {
        return { data: null, error: { message: 'Job not found' } };
      }

      // Verify agency ownership
      if (job.agency_id !== user.uid) {
        return { data: null, error: { message: 'Unauthorized' } };
      }

      log.info('[GraphQL] Agency job retrieved successfully');
      return { data: job, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching agency job:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Create agency job
   */
  async createAgencyJob(jobData) {
    try {
      log.info('[GraphQL] Creating agency job');

      // Get current user from Firebase
      const user = getCurrentUser();

      const payload = {
        agency_id: user.uid,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        salary_min: jobData.salary_min || jobData.salaryMin,
        salary_max: jobData.salary_max || jobData.salaryMax,
        currency: jobData.currency || 'USD',
        status: jobData.status || 'draft',
        priority: jobData.priority || 'normal',
        contract_duration_months: jobData.contract_duration_months || jobData.contractDuration,
        working_hours: jobData.working_hours || jobData.workingHours,
        family_size: jobData.family_size || jobData.familySize || 1,
        children_count: jobData.children_count || jobData.childrenCount || 0,
        sponsor_id: jobData.sponsor_id || jobData.sponsorId || null,
        job_type: jobData.job_type || jobData.jobType || 'full-time',
        live_in_required: jobData.live_in_required !== undefined ? jobData.live_in_required : true,
        requirements: jobData.requirements || '',
        benefits: jobData.benefits || '',
        requirements_array: Array.isArray(jobData.requirements_array) ? jobData.requirements_array : [],
        benefits_array: Array.isArray(jobData.benefits_array) ? jobData.benefits_array : [],
        required_skills: Array.isArray(jobData.required_skills) ? jobData.required_skills : [],
        required_languages: Array.isArray(jobData.required_languages) ? jobData.required_languages : [],
        expires_at: jobData.expires_at || jobData.expiresAt || null,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateAgencyJobDocument,
        variables: { data: payload },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const created = data?.insert_agency_jobs_one;
      log.info('[GraphQL] Agency job created successfully');
      return { data: created, error: null };
    } catch (error) {
      log.error('[GraphQL] Error creating agency job:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update agency job
   */
  async updateAgencyJob(jobId, jobData) {
    try {
      log.info('[GraphQL] Updating agency job:', jobId);

      // Get current user from Firebase
      const user = getCurrentUser();

      const payload = {
        ...jobData,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateAgencyJobDocument,
        variables: {
          id: jobId,
          agency_id: user.uid,
          data: payload,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const updated = data?.update_agency_jobs?.returning?.[0];
      log.info('[GraphQL] Agency job updated successfully');
      return { data: updated, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating agency job:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Delete agency job
   */
  async deleteAgencyJob(jobId) {
    try {
      log.info('[GraphQL] Deleting agency job:', jobId);

      // Get current user from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteAgencyJobDocument,
        variables: {
          id: jobId,
          agency_id: user.uid,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const affectedRows = data?.delete_agency_jobs?.affected_rows || 0;
      log.info(`[GraphQL] Deleted ${affectedRows} job(s)`);
      return { data: affectedRows > 0, error: null };
    } catch (error) {
      log.error('[GraphQL] Error deleting agency job:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Pause agency job
   */
  async pauseAgencyJob(jobId) {
    log.info('[GraphQL] Pausing agency job:', jobId);
    return this.updateAgencyJob(jobId, { status: 'paused' });
  },

  /**
   * Resume agency job
   */
  async resumeAgencyJob(jobId) {
    log.info('[GraphQL] Resuming agency job:', jobId);
    return this.updateAgencyJob(jobId, { status: 'active' });
  },

  /**
   * Close agency job
   */
  async closeAgencyJob(jobId) {
    log.info('[GraphQL] Closing agency job:', jobId);
    return this.updateAgencyJob(jobId, { status: 'closed' });
  },

  /**
   * Mark job as filled
   */
  async markJobAsFilled(jobId) {
    log.info('[GraphQL] Marking job as filled:', jobId);
    return this.updateAgencyJob(jobId, {
      status: 'filled',
      filled_date: new Date().toISOString(),
    });
  },

  /**
   * Clone agency job
   */
  async cloneAgencyJob(jobId) {
    try {
      log.info('[GraphQL] Cloning agency job:', jobId);

      // Fetch original job
      const { data: originalJob, error: fetchError } = await this.getAgencyJobById(jobId);
      if (fetchError) throw new Error(fetchError.message);

      // Create cloned job data
      const clonedJobData = {
        title: `${originalJob.title} (Copy)`,
        description: originalJob.description,
        location: originalJob.location,
        salary_min: originalJob.salary_min,
        salary_max: originalJob.salary_max,
        currency: originalJob.currency,
        status: 'draft',
        priority: originalJob.priority,
        contract_duration_months: originalJob.contract_duration_months,
        working_hours: originalJob.working_hours,
        family_size: originalJob.family_size,
        children_count: originalJob.children_count,
        sponsor_id: originalJob.sponsor_id,
        job_type: originalJob.job_type,
        live_in_required: originalJob.live_in_required,
        requirements: originalJob.requirements,
        benefits: originalJob.benefits,
        requirements_array: originalJob.requirements_array,
        benefits_array: originalJob.benefits_array,
        required_skills: originalJob.required_skills,
        required_languages: originalJob.required_languages,
        expires_at: originalJob.expires_at,
      };

      // Create the cloned job
      return this.createAgencyJob(clonedJobData);
    } catch (error) {
      log.error('[GraphQL] Error cloning agency job:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Increment job view count
   */
  async incrementJobViewCount(jobId) {
    try {
      log.info('[GraphQL] Incrementing job view count:', jobId);

      // Get current user from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.mutate({
        mutation: IncrementJobViewCountDocument,
        variables: {
          id: jobId,
          agency_id: user.uid,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const result = data?.update_agency_jobs_by_pk;
      log.info(`[GraphQL] View count incremented to ${result?.view_count}`);
      return { data: result, error: null };
    } catch (error) {
      log.error('[GraphQL] Error incrementing view count:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // APPLICATIONS MANAGEMENT OPERATIONS
  // ============================================================================

  /**
   * Get applications with optional filters
   */
  async getApplications(filters = {}) {
    try {
      log.info('[GraphQL] Getting applications with filters:', filters);

      // Get current user from Firebase
      const user = auth.currentUser;
      if (!user) {
        log.warn('[GraphQL] User not authenticated');
        return { data: [], error: null };
      }

      const { data, errors } = await apolloClient.query({
        query: GetApplicationsDocument,
        variables: { agency_id: user.uid },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      let applications = data?.applications || [];

      // Apply client-side filters
      if (filters.status && filters.status !== 'all') {
        applications = applications.filter(a => a.application_status === filters.status);
      }
      if (filters.jobId && filters.jobId !== 'all') {
        applications = applications.filter(a => a.job_id === filters.jobId);
      }
      if (filters.priority && filters.priority !== 'all') {
        applications = applications.filter(a => a.priority === filters.priority);
      }
      if (filters.viewedByAgency !== undefined) {
        applications = applications.filter(a => a.viewed_by_agency === filters.viewedByAgency);
      }
      if (filters.scoreMin) {
        applications = applications.filter(a => a.match_score >= filters.scoreMin);
      }
      if (filters.scoreMax) {
        applications = applications.filter(a => a.match_score <= filters.scoreMax);
      }

      log.info(`[GraphQL] Retrieved ${applications.length} applications`);
      return { data: applications, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching applications:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId) {
    try {
      log.info('[GraphQL] Getting application by ID:', applicationId);

      // Get current user from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.query({
        query: GetApplicationByIdDocument,
        variables: { id: applicationId, agency_id: user.uid },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const application = data?.applications_by_pk;
      if (!application) {
        return { data: null, error: { message: 'Application not found' } };
      }

      // Verify agency ownership
      if (application.agency_id !== user.uid) {
        return { data: null, error: { message: 'Unauthorized' } };
      }

      // Mark as viewed if not already
      if (!application.viewed_by_agency) {
        await this.markApplicationAsViewed(applicationId);
        application.viewed_by_agency = true;
        application.viewed_at = new Date().toISOString();
      }

      log.info('[GraphQL] Application retrieved successfully');
      return { data: application, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching application:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId, status, additionalData = {}) {
    try {
      log.info('[GraphQL] Updating application status:', applicationId, 'to', status);

      // Get current user from Firebase
      const user = getCurrentUser();

      const updateData = {
        application_status: status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateApplicationStatusDocument,
        variables: {
          id: applicationId,
          agency_id: user.uid,
          status,
          additionalData: updateData,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const updated = data?.update_applications?.returning?.[0];
      log.info('[GraphQL] Application status updated successfully');
      return { data: updated, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating application status:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Shortlist an application
   */
  async shortlistApplication(applicationId, notes = '') {
    log.info('[GraphQL] Shortlisting application:', applicationId);
    return this.updateApplicationStatus(applicationId, 'shortlisted', {
      notes,
      priority: 'high',
    });
  },

  /**
   * Schedule interview for application
   */
  async scheduleInterview(applicationId, interviewDate, notes = '') {
    log.info('[GraphQL] Scheduling interview for application:', applicationId);
    return this.updateApplicationStatus(applicationId, 'interviewed', {
      interview_date: interviewDate,
      interview_notes: notes,
    });
  },

  /**
   * Send offer to applicant
   */
  async sendOffer(applicationId, offerAmount, currency = 'USD', responseDeadline = null) {
    log.info('[GraphQL] Sending offer for application:', applicationId);
    return this.updateApplicationStatus(applicationId, 'offered', {
      offer_date: new Date().toISOString(),
      offer_amount: offerAmount,
      offer_currency: currency,
      response_deadline: responseDeadline,
    });
  },

  /**
   * Reject an application
   */
  async rejectApplication(applicationId, reason = '') {
    log.info('[GraphQL] Rejecting application:', applicationId);
    return this.updateApplicationStatus(applicationId, 'rejected', {
      rejection_reason: reason,
    });
  },

  /**
   * Mark applicant as hired
   */
  async hireApplicant(applicationId) {
    log.info('[GraphQL] Hiring applicant for application:', applicationId);
    return this.updateApplicationStatus(applicationId, 'hired', {
      hired_date: new Date().toISOString(),
    });
  },

  /**
   * Mark application as viewed
   */
  async markApplicationAsViewed(applicationId) {
    try {
      log.info('[GraphQL] Marking application as viewed:', applicationId);

      // Get current user from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkApplicationAsViewedDocument,
        variables: {
          id: applicationId,
          agency_id: user.uid,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const result = data?.update_applications?.returning?.[0];
      log.info('[GraphQL] Application marked as viewed');
      return { data: result, error: null };
    } catch (error) {
      log.error('[GraphQL] Error marking application as viewed:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Add notes to application
   */
  async addApplicationNotes(applicationId, notes) {
    try {
      log.info('[GraphQL] Adding notes to application:', applicationId);

      // Get current user from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.mutate({
        mutation: AddApplicationNotesDocument,
        variables: {
          id: applicationId,
          agency_id: user.uid,
          notes,
        },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const result = data?.update_applications?.returning?.[0];
      log.info('[GraphQL] Application notes added successfully');
      return { data: result, error: null };
    } catch (error) {
      log.error('[GraphQL] Error adding application notes:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get application statistics
   */
  async getApplicationStats() {
    try {
      log.info('[GraphQL] Getting application statistics');

      // Get current user from Firebase
      const user = getCurrentUser();

      const { data, errors } = await apolloClient.query({
        query: GetApplicationStatsDocument,
        variables: { agency_id: user.uid },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      // Transform aggregated data to expected format
      const stats = {
        total: data.applications_aggregate?.aggregate?.count || 0,
        byStatus: {
          new: data.new?.aggregate?.count || 0,
          reviewed: data.reviewed?.aggregate?.count || 0,
          shortlisted: data.shortlisted?.aggregate?.count || 0,
          interviewed: data.interviewed?.aggregate?.count || 0,
          offered: data.offered?.aggregate?.count || 0,
          hired: data.hired?.aggregate?.count || 0,
          rejected: data.rejected?.aggregate?.count || 0,
          withdrawn: data.withdrawn?.aggregate?.count || 0,
        },
        avgMatchScore: Math.round(data.applications_aggregate?.aggregate?.avg?.match_score || 0),
        highPriority: data.highPriority?.aggregate?.count || 0,
      };

      log.info('[GraphQL] Application statistics retrieved successfully');
      return { data: stats, error: null };
    } catch (error) {
      log.error('[GraphQL] Error getting application stats:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // SHORTLIST MANAGEMENT
  // ============================================================================

  /**
   * Get all shortlists for the agency
   * @param {Object} filters - Optional filters (status, priority)
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getShortlists(filters = {}) {
    try {
      // Get current user from Firebase
      const user = getCurrentUser();

      // Build where clause dynamically to avoid null comparison issues
      const GetShortlistsDocument = gql`
        query GetShortlists($agency_id: String!) {
          shortlists(
            where: {
              agency_id: {_eq: $agency_id}
            }
            order_by: {created_at: desc}
          ) {
            id
            agency_id
            name
            description
            job_id
            priority
            status
            tags
            created_by
            created_at
            updated_at
            shortlist_candidates_aggregate {
              aggregate {
                count
              }
            }
          }
        }
      `;

      const variables = {
        agency_id: user.uid,
      };

      const { data, errors } = await apolloClient.query({
        query: GetShortlistsDocument,
        variables,
        fetchPolicy: 'network-only',
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch shortlists');

      let shortlists = data?.shortlists || [];

      // Apply client-side filters
      if (filters.status && filters.status !== 'all') {
        shortlists = shortlists.filter(s => s.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        shortlists = shortlists.filter(s => s.priority === filters.priority);
      }

      shortlists = shortlists.map(s => ({
        ...s,
        candidate_count: s.shortlist_candidates_aggregate?.aggregate?.count || 0,
        job_title: 'General Shortlist',
        created_by: 'Unknown'
      }));

      log.info('[GraphQL] Fetched shortlists successfully');
      return { data: shortlists, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching shortlists:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get a single shortlist with full details and candidates
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getShortlistById(shortlistId) {
    try {
      // Get current user from Firebase
      const user = getCurrentUser();

      const GetShortlistByIdDocument = gql`
        query GetShortlistById($id: String!, $agency_id: String!) {
          shortlists_by_pk(id: $id) {
            id
            agency_id
            name
            description
            job_id
            priority
            status
            tags
            created_by
            created_at
            updated_at
            job:jobs {
              id
              title
              location
            }
            created_by_profile:profiles {
              id
              name
            }
            shortlist_candidates(order_by: {added_at: desc}) {
              maid_id
              match_score
              notes
              added_at
              added_by
              maid:maid_profiles {
                id
                full_name
                age
                nationality
                experience_years
                skills
                languages
                verification_status
                phone_number
                email
                salary_expectation
                availability_date
              }
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetShortlistByIdDocument,
        variables: { id: shortlistId, agency_id: user.uid },
        fetchPolicy: 'network-only',
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch shortlist');

      const shortlist = data?.shortlists_by_pk;
      if (!shortlist) throw new Error('Shortlist not found');

      // Verify ownership
      if (shortlist.agency_id !== user.uid) {
        throw new Error('Unauthorized access to shortlist');
      }

      // Transform candidate data
      const transformedCandidates = (shortlist.shortlist_candidates || []).map(c => ({
        id: c.maid_id,
        name: c.maid?.full_name || 'Unknown',
        nationality: c.maid?.nationality || 'Unknown',
        age: c.maid?.age || 0,
        experience_years: c.maid?.experience_years || 0,
        match_score: c.match_score || 0,
        skills: c.maid?.skills || [],
        languages: c.maid?.languages || [],
        verification_status: c.maid?.verification_status || 'pending',
        salary_expectation: c.maid?.salary_expectation || 0,
        availability_date: c.maid?.availability_date || null,
        notes: c.notes || '',
        shortlisted_date: c.added_at,
        contact: {
          phone: c.maid?.phone_number || 'Not provided',
          email: c.maid?.email || 'Not provided'
        }
      }));

      const result = {
        ...shortlist,
        job_title: shortlist.job?.title || 'General Shortlist',
        created_by: shortlist.created_by_profile?.full_name || 'Unknown',
        candidate_count: transformedCandidates.length,
        candidates: transformedCandidates
      };

      log.info('[GraphQL] Fetched shortlist by ID successfully');
      return { data: result, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching shortlist by ID:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Create a new shortlist
   * @param {Object} shortlistData - Shortlist creation data
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async createShortlist(shortlistData) {
    try {
      // Get current user from Firebase
      const user = getCurrentUser();

      const CreateShortlistDocument = gql`
        mutation CreateShortlist($data: shortlists_insert_input!) {
          insert_shortlists_one(object: $data) {
            id
            agency_id
            name
            description
            job_id
            priority
            status
            tags
            created_by
            created_at
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateShortlistDocument,
        variables: {
          data: {
            agency_id: user.uid,
            name: shortlistData.name,
            description: shortlistData.description || null,
            job_id: shortlistData.jobId || null,
            priority: shortlistData.priority || 'normal',
            status: 'active',
            tags: shortlistData.tags || [],
            created_by: user.uid
          }
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to create shortlist');

      log.info('[GraphQL] Created shortlist successfully');
      return { data: data?.insert_shortlists_one, error: null };
    } catch (error) {
      log.error('[GraphQL] Error creating shortlist:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async updateShortlist(shortlistId, updates) {
    try {
      // Get current user from Firebase
      const user = getCurrentUser();

      const UpdateShortlistDocument = gql`
        mutation UpdateShortlist($id: String!, $agency_id: String!, $data: shortlists_set_input!) {
          update_shortlists(
            where: {
              id: {_eq: $id}
              agency_id: {_eq: $agency_id}
            }
            _set: $data
          ) {
            affected_rows
            returning {
              id
              name
              description
              priority
              status
              tags
              updated_at
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateShortlistDocument,
        variables: {
          id: shortlistId,
          agency_id: user.uid,
          data: updates
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to update shortlist');

      const result = data?.update_shortlists?.returning?.[0];
      if (!result) throw new Error('Shortlist not found or not authorized');

      log.info('[GraphQL] Updated shortlist successfully');
      return { data: result, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating shortlist:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Delete a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async deleteShortlist(shortlistId) {
    try {
      // Get current user from Firebase
      const user = getCurrentUser();

      const DeleteShortlistDocument = gql`
        mutation DeleteShortlist($id: String!, $agency_id: String!) {
          delete_shortlists(
            where: {
              id: {_eq: $id}
              agency_id: {_eq: $agency_id}
            }
          ) {
            affected_rows
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteShortlistDocument,
        variables: {
          id: shortlistId,
          agency_id: user.uid
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to delete shortlist');

      log.info('[GraphQL] Deleted shortlist successfully');
      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('[GraphQL] Error deleting shortlist:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Add a candidate to a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {string} maidId - Maid profile UUID
   * @param {Object} candidateData - Additional data (match_score, notes)
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async addCandidateToShortlist(shortlistId, maidId, candidateData = {}) {
    try {
      // Get current user from Firebase
      const user = getCurrentUser();

      const AddCandidateToShortlistDocument = gql`
        mutation AddCandidateToShortlist($data: shortlist_candidates_insert_input!) {
          insert_shortlist_candidates_one(object: $data) {
            shortlist_id
            maid_id
            match_score
            notes
            added_at
            added_by
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: AddCandidateToShortlistDocument,
        variables: {
          data: {
            shortlist_id: shortlistId,
            maid_id: maidId,
            match_score: candidateData.match_score || 0,
            notes: candidateData.notes || null,
            added_by: user.uid
          }
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to add candidate to shortlist');

      log.info('[GraphQL] Added candidate to shortlist successfully');
      return { data: data?.insert_shortlist_candidates_one, error: null };
    } catch (error) {
      log.error('[GraphQL] Error adding candidate to shortlist:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Remove a candidate from a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {string} maidId - Maid profile UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async removeCandidateFromShortlist(shortlistId, maidId) {
    try {
      const RemoveCandidateFromShortlistDocument = gql`
        mutation RemoveCandidateFromShortlist($shortlist_id: String!, $maid_id: String!) {
          delete_shortlist_candidates(
            where: {
              shortlist_id: {_eq: $shortlist_id}
              maid_id: {_eq: $maid_id}
            }
          ) {
            affected_rows
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: RemoveCandidateFromShortlistDocument,
        variables: {
          shortlist_id: shortlistId,
          maid_id: maidId
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to remove candidate from shortlist');

      log.info('[GraphQL] Removed candidate from shortlist successfully');
      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('[GraphQL] Error removing candidate from shortlist:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update candidate notes in a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {string} maidId - Maid profile UUID
   * @param {string} notes - Updated notes
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async updateShortlistCandidateNotes(shortlistId, maidId, notes) {
    try {
      const UpdateShortlistCandidateNotesDocument = gql`
        mutation UpdateShortlistCandidateNotes(
          $shortlist_id: String!
          $maid_id: String!
          $notes: String
        ) {
          update_shortlist_candidates(
            where: {
              shortlist_id: {_eq: $shortlist_id}
              maid_id: {_eq: $maid_id}
            }
            _set: {notes: $notes}
          ) {
            affected_rows
            returning {
              shortlist_id
              maid_id
              notes
              match_score
              added_at
            }
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateShortlistCandidateNotesDocument,
        variables: {
          shortlist_id: shortlistId,
          maid_id: maidId,
          notes
        },
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to update candidate notes');

      const result = data?.update_shortlist_candidates?.returning?.[0];
      if (!result) throw new Error('Candidate not found in shortlist');

      log.info('[GraphQL] Updated candidate notes successfully');
      return { data: result, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating candidate notes:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Archive a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async archiveShortlist(shortlistId) {
    log.info('[GraphQL] Archiving shortlist');
    return this.updateShortlist(shortlistId, { status: 'archived' });
  },

  /**
   * Activate a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async activateShortlist(shortlistId) {
    log.info('[GraphQL] Activating shortlist');
    return this.updateShortlist(shortlistId, { status: 'active' });
  },

  // ============================================================================
  // PROFILE EDIT REQUESTS (Admin Approval Workflow)
  // ============================================================================

  /**
   * Submit a profile edit request for admin approval
   * @param {Object} requestData - Edit request data
   * @param {string} requestData.agency_id - Agency ID
   * @param {Object} requestData.requested_changes - Changes being requested
   * @param {Object} requestData.original_data - Original profile data
   * @param {string} requestData.reason - Reason for the changes
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async submitProfileEditRequest(requestData) {
    try {
      log.info('[GraphQL] Submitting profile edit request');

      const CreateProfileEditRequestDocument = gql`
        mutation CreateProfileEditRequest($data: profile_edit_requests_insert_input!) {
          insert_profile_edit_requests_one(object: $data) {
            id
            agency_id
            requested_changes
            original_data
            reason
            status
            created_at
          }
        }
      `;

      const payload = {
        agency_id: requestData.agency_id,
        requested_changes: requestData.requested_changes,
        original_data: requestData.original_data,
        reason: requestData.reason || null,
        status: 'pending',
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateProfileEditRequestDocument,
        variables: { data: payload },
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const created = data?.insert_profile_edit_requests_one;
      log.info('[GraphQL] Profile edit request submitted successfully');
      return { data: created, error: null };
    } catch (error) {
      log.error('[GraphQL] Error submitting profile edit request:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get pending edit requests for an agency
   * @param {string} agencyId - Agency ID
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getPendingEditRequests(agencyId) {
    try {
      log.info('[GraphQL] Getting pending edit requests for agency:', agencyId);

      const GetPendingEditRequestsDocument = gql`
        query GetPendingEditRequests($agency_id: String!) {
          profile_edit_requests(
            where: {
              agency_id: {_eq: $agency_id}
              status: {_eq: "pending"}
            }
            order_by: {created_at: desc}
          ) {
            id
            agency_id
            requested_changes
            original_data
            reason
            status
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetPendingEditRequestsDocument,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('[GraphQL] Errors:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      log.info('[GraphQL] Got pending edit requests successfully');
      return { data: data?.profile_edit_requests || [], error: null };
    } catch (error) {
      log.error('[GraphQL] Error getting pending edit requests:', error);
      return { data: null, error: { message: error.message } };
    }
  },
};
