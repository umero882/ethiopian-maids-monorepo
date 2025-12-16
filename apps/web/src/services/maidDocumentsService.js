/**
 * Maid Documents Service
 * Uses Firebase Storage for file storage and Hasura/GraphQL for data
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { uploadFile, deleteFile } from '@/lib/firebaseStorage';
import { createLogger } from '@/utils/logger';

const log = createLogger('MaidDocumentsService');

// GraphQL Queries and Mutations
// Based on actual schema: maid_documents has fields:
// created_at, document_name, document_type, document_url, expiry_date, id (uuid), maid_id (String - Firebase UID), updated_at, verified
const GET_MAID_DOCUMENTS = gql`
  query GetMaidDocuments($maidId: String!) {
    maid_documents(
      where: { maid_id: { _eq: $maidId } }
      order_by: { created_at: desc }
    ) {
      id
      maid_id
      document_type
      document_name
      document_url
      expiry_date
      verified
      created_at
      updated_at
    }
  }
`;

const INSERT_MAID_DOCUMENT = gql`
  mutation InsertMaidDocument($object: maid_documents_insert_input!) {
    insert_maid_documents_one(object: $object) {
      id
      maid_id
      document_type
      document_name
      document_url
      verified
      created_at
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

const UPDATE_MAID_DOCUMENT = gql`
  mutation UpdateMaidDocument($id: uuid!, $set: maid_documents_set_input!) {
    update_maid_documents_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      expiry_date
      updated_at
    }
  }
`;

// maid_profiles.id is String (Firebase UID), user_id is also String
const GET_MAID_PROFILE_BY_USER_ID = gql`
  query GetMaidProfileByUserId($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      user_id
    }
  }
`;

export const maidDocumentsService = {
  /**
   * Get maid profile ID by user ID
   */
  async getMaidProfileId(userId) {
    try {
      log.debug('[GraphQL] Fetching maid profile ID for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GET_MAID_PROFILE_BY_USER_ID,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('[GraphQL] Error fetching maid profile:', errors);
        return { data: null, error: errors[0] };
      }

      const profile = data?.maid_profiles?.[0];
      return { data: profile, error: null };
    } catch (error) {
      log.error('[GraphQL] Exception fetching maid profile:', error);
      return { data: null, error };
    }
  },

  /**
   * List all documents for a maid
   */
  async listDocuments(maidId) {
    try {
      log.debug('[GraphQL] Listing documents for maid:', maidId);

      const { data, errors } = await apolloClient.query({
        query: GET_MAID_DOCUMENTS,
        variables: { maidId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('[GraphQL] Error listing documents:', errors);
        return { data: [], error: errors[0] };
      }

      // Transform to expected format
      const documents = (data?.maid_documents || []).map((doc) => ({
        id: doc.id,
        maid_id: doc.maid_id,
        type: doc.document_type,
        title: doc.document_name,
        file_url: doc.document_url,
        file_name: doc.document_name,
        verified: doc.verified || false,
        expiry_date: doc.expiry_date,
        uploaded_at: doc.created_at,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      }));

      log.info('[GraphQL] Documents loaded:', documents.length);
      return { data: documents, error: null };
    } catch (error) {
      log.error('[GraphQL] Exception listing documents:', error);
      return { data: [], error };
    }
  },

  /**
   * Upload a document
   */
  async uploadDocument(maidId, { file, type, customTypeName = '', title = '', description = '' }) {
    try {
      if (!file || !maidId || !type) {
        throw new Error('Missing file, maidId or type');
      }

      log.debug('[Firebase] Uploading document:', { maidId, type, fileName: file.name });

      // Generate file path for Firebase Storage
      const safeName = (file.name || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const filePath = `maid-documents/${maidId}/${timestamp}_${safeName}`;

      // Upload to Firebase Storage
      const { url: publicUrl } = await uploadFile(filePath, file, {
        metadata: {
          maidId,
          documentType: type,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      log.info('[Firebase] File uploaded successfully:', publicUrl);

      // Save document record to database via GraphQL
      // Only include fields that exist in the schema
      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_MAID_DOCUMENT,
        variables: {
          object: {
            maid_id: maidId,
            document_type: type,
            document_name: title || file.name,
            document_url: publicUrl,
            verified: false,
          },
        },
      });

      if (errors && errors.length > 0) {
        log.error('[GraphQL] Error saving document record:', errors);
        // Try to clean up uploaded file
        try {
          await deleteFile(filePath);
        } catch (cleanupError) {
          log.warn('[Firebase] Failed to clean up file after DB error:', cleanupError);
        }
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Document record saved:', data?.insert_maid_documents_one?.id);
      return { data: data?.insert_maid_documents_one, error: null };
    } catch (error) {
      log.error('[MaidDocumentsService] Upload error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a document (e.g., expiry date)
   */
  async updateDocument(documentId, updates) {
    try {
      log.debug('[GraphQL] Updating document:', { documentId, updates });

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_MAID_DOCUMENT,
        variables: {
          id: documentId,
          set: updates,
        },
      });

      if (errors && errors.length > 0) {
        log.error('[GraphQL] Error updating document:', errors);
        return { data: null, error: errors[0] };
      }

      log.info('[GraphQL] Document updated:', documentId);
      return { data: data?.update_maid_documents_by_pk, error: null };
    } catch (error) {
      log.error('[MaidDocumentsService] Update error:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(maidId, document) {
    try {
      log.debug('[GraphQL] Deleting document:', document.id);

      // Delete from database first
      const { data, errors } = await apolloClient.mutate({
        mutation: DELETE_MAID_DOCUMENT,
        variables: { id: document.id },
      });

      if (errors && errors.length > 0) {
        log.error('[GraphQL] Error deleting document record:', errors);
        return { success: false, error: errors[0] };
      }

      // Try to delete from Firebase Storage using the URL
      // Extract path from Firebase URL if possible
      const fileUrl = document.file_url || document.document_url;
      if (fileUrl && fileUrl.includes('firebasestorage.googleapis.com')) {
        try {
          // Extract path from Firebase URL
          const urlObj = new URL(fileUrl);
          const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            await deleteFile(storagePath);
            log.info('[Firebase] File deleted:', storagePath);
          }
        } catch (storageError) {
          // Log but don't fail - DB record is already deleted
          log.warn('[Firebase] Failed to delete file:', storageError);
        }
      }

      log.info('[GraphQL] Document deleted:', document.id);
      return { success: true };
    } catch (error) {
      log.error('[MaidDocumentsService] Delete error:', error);
      return { success: false, error };
    }
  },
};

export default maidDocumentsService;
