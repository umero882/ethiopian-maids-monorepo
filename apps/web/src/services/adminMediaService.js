import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminMediaService');

// ============================================
// GraphQL Queries
// ============================================

const GET_ADMIN_MEDIA_DOCUMENTS = gql`
  query GetAdminMediaDocuments(
    $where: maid_documents_bool_exp
    $orderBy: [maid_documents_order_by!]
    $limit: Int!
    $offset: Int!
  ) {
    maid_documents(
      where: $where
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      document_type
      document_name
      document_url
      file_name
      file_path
      file_url
      file_size
      mime_type
      title
      description
      expiry_date
      maid_id
      verified
      uploaded_at
      created_at
      updated_at
    }
    maid_documents_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GET_ADMIN_MEDIA_IMAGES = gql`
  query GetAdminMediaImages(
    $where: maid_images_bool_exp
    $orderBy: [maid_images_order_by!]
    $limit: Int!
    $offset: Int!
  ) {
    maid_images(
      where: $where
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      file_url
      file_name
      file_path
      file_size
      mime_type
      maid_id
      is_primary
      is_processed
      display_order
      created_at
      updated_at
    }
    maid_images_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// Query to fetch maid profiles by IDs for name lookup
const GET_MAID_PROFILES_BY_IDS = gql`
  query GetMaidProfilesByIds($ids: [String!]!) {
    maid_profiles(where: { id: { _in: $ids } }) {
      id
      full_name
      first_name
      last_name
      profile_photo_url
    }
  }
`;

const GET_MAID_PROFILES_WITH_MEDIA = gql`
  query GetMaidProfilesWithMedia(
    $limit: Int!
    $offset: Int!
  ) {
    maid_profiles(
      limit: $limit
      offset: $offset
      order_by: { updated_at: desc }
    ) {
      id
      user_id
      full_name
      first_name
      last_name
      profile_photo_url
      introduction_video_url
      verification_status
      created_at
      updated_at
    }
    maid_profiles_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const GET_AGENCY_PROFILES_WITH_MEDIA = gql`
  query GetAgencyProfilesWithMedia(
    $limit: Int!
    $offset: Int!
  ) {
    agency_profiles(
      limit: $limit
      offset: $offset
      order_by: { updated_at: desc }
    ) {
      id
      full_name
      logo_url
      verification_status
      created_at
      updated_at
    }
    agency_profiles_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const GET_MEDIA_STATS = gql`
  query GetMediaStats {
    total_documents: maid_documents_aggregate {
      aggregate {
        count
      }
    }
    verified_documents: maid_documents_aggregate(where: { verified: { _eq: true } }) {
      aggregate {
        count
      }
    }
    unverified_documents: maid_documents_aggregate(where: { verified: { _eq: false } }) {
      aggregate {
        count
      }
    }
    pending_documents: maid_documents_aggregate(where: { verified: { _is_null: true } }) {
      aggregate {
        count
      }
    }
    total_images: maid_images_aggregate {
      aggregate {
        count
      }
    }
    processed_images: maid_images_aggregate(where: { is_processed: { _eq: true } }) {
      aggregate {
        count
      }
    }
    maid_profile_photos: maid_profiles_aggregate(where: { profile_photo_url: { _is_null: false } }) {
      aggregate {
        count
      }
    }
    maid_videos: maid_profiles_aggregate(where: { introduction_video_url: { _is_null: false } }) {
      aggregate {
        count
      }
    }
    agency_logos: agency_profiles_aggregate(where: { logo_url: { _is_null: false } }) {
      aggregate {
        count
      }
    }
  }
`;

// ============================================
// GraphQL Mutations
// ============================================

const UPDATE_DOCUMENT_VERIFIED = gql`
  mutation UpdateDocumentVerified($id: uuid!, $verified: Boolean!) {
    update_maid_documents_by_pk(
      pk_columns: { id: $id }
      _set: { verified: $verified }
    ) {
      id
      verified
      updated_at
    }
  }
`;

const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: uuid!) {
    delete_maid_documents_by_pk(id: $id) {
      id
    }
  }
`;

const DELETE_IMAGE = gql`
  mutation DeleteImage($id: uuid!) {
    delete_maid_images_by_pk(id: $id) {
      id
    }
  }
`;

const UPDATE_MAID_PROFILE_PHOTO = gql`
  mutation UpdateMaidProfilePhoto($id: String!, $profilePhotoUrl: String) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { profile_photo_url: $profilePhotoUrl }
    ) {
      id
      profile_photo_url
      updated_at
    }
  }
`;

const UPDATE_MAID_INTRO_VIDEO = gql`
  mutation UpdateMaidIntroVideo($id: String!, $introVideoUrl: String) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { introduction_video_url: $introVideoUrl }
    ) {
      id
      introduction_video_url
      updated_at
    }
  }
`;

// ============================================
// Helper Functions
// ============================================

/**
 * Get media type from mime type or file extension
 */
function getMediaType(mimeType, fileName) {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('application/pdf')) return 'document';
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel')) return 'document';
  }

  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext)) return 'document';
  }

  return 'document';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Get moderation status from verified field
 */
function getModerationStatus(verified) {
  if (verified === true) return 'approved';
  if (verified === false) return 'rejected';
  return 'pending_review';
}

/**
 * Build where clause for documents
 */
function buildDocumentFilters(filters) {
  if (!filters) return {};

  const conditions = [];

  // Verification status filter
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'approved') {
      conditions.push({ verified: { _eq: true } });
    } else if (filters.status === 'rejected') {
      conditions.push({ verified: { _eq: false } });
    } else if (filters.status === 'pending_review') {
      conditions.push({ verified: { _is_null: true } });
    }
  }

  // Document type filter
  if (filters.documentType && filters.documentType !== 'all') {
    conditions.push({ document_type: { _eq: filters.documentType } });
  }

  // Search term
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const term = `%${filters.searchTerm.trim()}%`;
    conditions.push({
      _or: [
        { file_name: { _ilike: term } },
        { document_name: { _ilike: term } },
        { title: { _ilike: term } },
        { document_type: { _ilike: term } },
      ],
    });
  }

  return conditions.length > 0 ? { _and: conditions } : {};
}

// ============================================
// Service Functions
// ============================================

export const adminMediaService = {
  /**
   * Get all media (documents + images combined)
   */
  async getAllMedia({
    filters = {},
    sortBy = 'created',
    sortDirection = 'desc',
    page = 1,
    limit = 20,
    mediaSource = 'all', // 'all', 'documents', 'images', 'profiles'
  } = {}) {
    try {
      const offset = (page - 1) * limit;
      const orderBy = [{ [sortBy === 'created' ? 'created_at' : sortBy]: sortDirection }];
      const where = buildDocumentFilters(filters);

      log.debug('[AdminMedia] getAllMedia called with:', { filters, sortBy, sortDirection, page, limit, mediaSource });

      let rawDocuments = [];
      let rawImages = [];
      let totalCount = 0;

      // Fetch documents
      if (mediaSource === 'all' || mediaSource === 'documents') {
        log.debug('[AdminMedia] Fetching documents with where:', where);
        const docResult = await apolloClient.query({
          query: GET_ADMIN_MEDIA_DOCUMENTS,
          variables: {
            where,
            orderBy: [{ created_at: sortDirection }],
            limit: mediaSource === 'documents' ? limit : Math.ceil(limit / 2),
            offset: mediaSource === 'documents' ? offset : 0,
          },
          fetchPolicy: 'network-only',
        });
        log.debug('[AdminMedia] Document query result:', docResult);
        rawDocuments = docResult.data?.maid_documents || [];
        totalCount += docResult.data?.maid_documents_aggregate?.aggregate?.count || 0;
      }

      // Fetch images
      if (mediaSource === 'all' || mediaSource === 'images') {
        const imgResult = await apolloClient.query({
          query: GET_ADMIN_MEDIA_IMAGES,
          variables: {
            where: {},
            orderBy: [{ created_at: sortDirection }],
            limit: mediaSource === 'images' ? limit : Math.ceil(limit / 2),
            offset: mediaSource === 'images' ? offset : 0,
          },
          fetchPolicy: 'network-only',
        });
        rawImages = imgResult.data?.maid_images || [];
        totalCount += imgResult.data?.maid_images_aggregate?.aggregate?.count || 0;
      }

      // Collect all unique maid IDs
      const maidIds = new Set();
      rawDocuments.forEach(doc => doc.maid_id && maidIds.add(doc.maid_id));
      rawImages.forEach(img => img.maid_id && maidIds.add(String(img.maid_id)));

      // Fetch maid profiles for name lookup
      let maidProfilesMap = {};
      if (maidIds.size > 0) {
        try {
          const profilesResult = await apolloClient.query({
            query: GET_MAID_PROFILES_BY_IDS,
            variables: { ids: Array.from(maidIds) },
            fetchPolicy: 'network-only',
          });
          const profiles = profilesResult.data?.maid_profiles || [];
          profiles.forEach(profile => {
            maidProfilesMap[profile.id] = profile;
          });
          log.debug('[AdminMedia] Fetched maid profiles:', Object.keys(maidProfilesMap).length);
        } catch (err) {
          log.warn('[AdminMedia] Failed to fetch maid profiles for names:', err);
        }
      }

      // Helper to get maid name from profile
      const getMaidName = (maidId) => {
        const profile = maidProfilesMap[maidId];
        if (profile) {
          return profile.full_name ||
                 `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                 'Unknown Maid';
        }
        return 'Unknown Maid';
      };

      // Map documents with actual names
      const documents = rawDocuments.map(doc => ({
        id: doc.id,
        source: 'maid_documents',
        filename: doc.file_name || doc.document_name || 'Unnamed Document',
        media_type: getMediaType(doc.mime_type, doc.file_name),
        document_type: doc.document_type,
        size: formatFileSize(doc.file_size),
        size_bytes: doc.file_size,
        url: doc.file_url || doc.document_url,
        mime_type: doc.mime_type,
        uploaded_by: {
          id: doc.maid_id,
          name: getMaidName(doc.maid_id),
          avatar: maidProfilesMap[doc.maid_id]?.profile_photo_url || null,
          type: 'maid',
        },
        upload_date: doc.uploaded_at || doc.created_at,
        moderation_status: getModerationStatus(doc.verified),
        verified: doc.verified,
        expiry_date: doc.expiry_date,
        description: doc.description,
        title: doc.title,
      }));

      // Map images with actual names
      const images = rawImages.map(img => ({
        id: img.id,
        source: 'maid_images',
        filename: img.file_name || 'Maid Image',
        media_type: 'image',
        document_type: img.is_primary ? 'profile_photo' : 'gallery_photo',
        size: formatFileSize(img.file_size),
        size_bytes: img.file_size,
        url: img.file_url,
        mime_type: img.mime_type,
        uploaded_by: {
          id: img.maid_id,
          name: getMaidName(String(img.maid_id)),
          avatar: maidProfilesMap[String(img.maid_id)]?.profile_photo_url || null,
          type: 'maid',
        },
        upload_date: img.created_at,
        moderation_status: img.is_processed ? 'approved' : 'pending_review',
        is_primary: img.is_primary,
        is_processed: img.is_processed,
        display_order: img.display_order,
      }));

      // Combine results
      let allMedia = [...documents, ...images];

      // Sort combined results
      allMedia.sort((a, b) => {
        const dateA = new Date(a.upload_date || 0);
        const dateB = new Date(b.upload_date || 0);
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      });

      // Apply pagination to combined results if fetching from multiple sources
      if (mediaSource === 'all') {
        allMedia = allMedia.slice(0, limit);
      }

      log.debug(`[AdminMedia] Fetched ${allMedia.length} media items (total: ${totalCount})`);

      return {
        data: {
          media: allMedia,
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        error: null,
      };
    } catch (error) {
      log.error('[AdminMedia] Error fetching media:', error);
      return { data: null, error };
    }
  },

  /**
   * Get media statistics
   */
  async getStats() {
    try {
      log.debug('[AdminMedia] Fetching stats...');
      const { data, errors } = await apolloClient.query({
        query: GET_MEDIA_STATS,
        fetchPolicy: 'network-only',
      });
      log.debug('[AdminMedia] Stats query result:', { data, errors });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const stats = {
        totalDocuments: data?.total_documents?.aggregate?.count || 0,
        verifiedDocuments: data?.verified_documents?.aggregate?.count || 0,
        unverifiedDocuments: data?.unverified_documents?.aggregate?.count || 0,
        pendingDocuments: data?.pending_documents?.aggregate?.count || 0,
        totalImages: data?.total_images?.aggregate?.count || 0,
        processedImages: data?.processed_images?.aggregate?.count || 0,
        profilePhotos: data?.maid_profile_photos?.aggregate?.count || 0,
        introVideos: data?.maid_videos?.aggregate?.count || 0,
        agencyLogos: data?.agency_logos?.aggregate?.count || 0,
        total: (data?.total_documents?.aggregate?.count || 0) +
               (data?.total_images?.aggregate?.count || 0) +
               (data?.maid_profile_photos?.aggregate?.count || 0) +
               (data?.maid_videos?.aggregate?.count || 0) +
               (data?.agency_logos?.aggregate?.count || 0),
        pending: (data?.pending_documents?.aggregate?.count || 0) +
                 ((data?.total_images?.aggregate?.count || 0) - (data?.processed_images?.aggregate?.count || 0)),
        approved: (data?.verified_documents?.aggregate?.count || 0) + (data?.processed_images?.aggregate?.count || 0),
        rejected: data?.unverified_documents?.aggregate?.count || 0,
      };

      log.debug('[AdminMedia] Fetched stats:', stats);
      return { data: stats, error: null };
    } catch (error) {
      log.error('[AdminMedia] Error fetching stats:', error);
      return { data: null, error };
    }
  },

  /**
   * Approve a document (set verified = true)
   */
  async approveDocument(documentId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_DOCUMENT_VERIFIED,
        variables: { id: documentId, verified: true },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminMedia] Document approved: ${documentId}`);
      return { data: data?.update_maid_documents_by_pk, error: null };
    } catch (error) {
      log.error('[AdminMedia] Error approving document:', error);
      return { data: null, error };
    }
  },

  /**
   * Reject a document (set verified = false)
   */
  async rejectDocument(documentId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_DOCUMENT_VERIFIED,
        variables: { id: documentId, verified: false },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminMedia] Document rejected: ${documentId}`);
      return { data: data?.update_maid_documents_by_pk, error: null };
    } catch (error) {
      log.error('[AdminMedia] Error rejecting document:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: DELETE_DOCUMENT,
        variables: { id: documentId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminMedia] Document deleted: ${documentId}`);
      return { data: data?.delete_maid_documents_by_pk, error: null };
    } catch (error) {
      log.error('[AdminMedia] Error deleting document:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete an image
   */
  async deleteImage(imageId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: DELETE_IMAGE,
        variables: { id: imageId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminMedia] Image deleted: ${imageId}`);
      return { data: data?.delete_maid_images_by_pk, error: null };
    } catch (error) {
      log.error('[AdminMedia] Error deleting image:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete media by source type
   */
  async deleteMedia(mediaId, source) {
    if (source === 'maid_documents') {
      return this.deleteDocument(mediaId);
    } else if (source === 'maid_images') {
      return this.deleteImage(mediaId);
    }
    return { data: null, error: new Error('Unknown media source') };
  },

  /**
   * Update moderation status
   */
  async updateModerationStatus(mediaId, source, status) {
    if (source === 'maid_documents') {
      if (status === 'approved') {
        return this.approveDocument(mediaId);
      } else if (status === 'rejected') {
        return this.rejectDocument(mediaId);
      }
    }
    // For images, we don't have a direct moderation status field
    return { data: null, error: new Error('Cannot update status for this media type') };
  },

  /**
   * Remove profile photo from maid
   */
  async removeProfilePhoto(maidProfileId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_MAID_PROFILE_PHOTO,
        variables: { id: maidProfileId, profilePhotoUrl: null },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminMedia] Profile photo removed: ${maidProfileId}`);
      return { data: data?.update_maid_profiles_by_pk, error: null };
    } catch (error) {
      log.error('[AdminMedia] Error removing profile photo:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove intro video from maid
   */
  async removeIntroVideo(maidProfileId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_MAID_INTRO_VIDEO,
        variables: { id: maidProfileId, introVideoUrl: null },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminMedia] Intro video removed: ${maidProfileId}`);
      return { data: data?.update_maid_profiles_by_pk, error: null };
    } catch (error) {
      log.error('[AdminMedia] Error removing intro video:', error);
      return { data: null, error };
    }
  },
};

export default adminMediaService;
