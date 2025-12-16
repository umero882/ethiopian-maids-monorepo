/**
 * useDocuments Hook
 *
 * Manages maid document operations - synced with web MaidDocumentsPage.jsx
 * Handles fetching, uploading, and deleting documents
 *
 * Uses:
 * - Apollo Client/GraphQL for data operations (via Hasura)
 * - Firebase Storage for file uploads
 */

import { useState, useCallback, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../utils/firebaseConfig';
import { useAuth } from './useAuth';

// GraphQL Queries and Mutations
const GET_MAID_PROFILE = gql`
  query GetMaidProfileByUserId($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
    }
  }
`;

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
      verified
      expiry_date
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

const UPDATE_MAID_DOCUMENT = gql`
  mutation UpdateMaidDocument($id: uuid!, $set: maid_documents_set_input!) {
    update_maid_documents_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      document_url
      document_name
      verified
      updated_at
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

export type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'expired' | 'not_uploaded';
export type DocumentType =
  | 'passport'
  | 'visa'
  | 'medical_certificate'
  | 'cooking_certificate'
  | 'employment_contract'
  | 'experience_letter'
  | 'language_certificate'
  | 'skill_certificate'
  | 'police_clearance'
  | 'reference_letter'
  | 'other';

export interface MaidDocument {
  id: string;
  maid_id: string;
  document_type: DocumentType;
  document_name: string;
  document_url: string;
  verified: boolean;
  status: DocumentStatus;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}


export interface UploadDocumentInput {
  file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
  documentType: DocumentType;
  customTypeName?: string;
  title?: string;
  description?: string;
  expiryDate?: string;
}

// Required document types - synced with web (only passport/ID is required)
export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = ['passport'];

// Document type display names
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Passport/ID',
  visa: 'Visa',
  medical_certificate: 'Medical Certificate',
  cooking_certificate: 'Cooking Certificate',
  employment_contract: 'Employment Contract',
  experience_letter: 'Previous Experience Letter',
  language_certificate: 'Language Proficiency Certificate',
  skill_certificate: 'Skill Certificate',
  police_clearance: 'Police Clearance',
  reference_letter: 'Reference Letter',
  other: 'Other Document',
};

// Document categories - synced with web tabs
export const DOCUMENT_CATEGORIES: Record<string, DocumentType[]> = {
  identification: ['passport', 'visa'],
  health: ['medical_certificate'],
  skills: ['cooking_certificate', 'language_certificate', 'skill_certificate'],
  employment: ['employment_contract', 'experience_letter', 'reference_letter'],
  legal: ['police_clearance'],
};

export interface UseDocumentsReturn {
  documents: MaidDocument[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  isUploading: boolean;
  refetch: () => Promise<void>;
  uploadDocument: (input: UploadDocumentInput) => Promise<{ success: boolean; error?: string }>;
  deleteDocument: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  getDocumentsByCategory: (category: string) => MaidDocument[];
  getRequiredDocuments: () => MaidDocument[];
  getExpiringDocuments: (daysThreshold?: number) => MaidDocument[];
  completionPercentage: number;
}

// Calculate document status from data based on actual schema fields
const calculateStatus = (doc: any): DocumentStatus => {
  if (!doc.document_url) return 'not_uploaded';
  if (doc.expiry_date) {
    const expiryDate = new Date(doc.expiry_date);
    if (expiryDate < new Date()) return 'expired';
  }
  if (doc.verified) return 'verified';
  return 'pending';
};

export function useDocuments(): UseDocumentsReturn {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [maidProfileId, setMaidProfileId] = useState<string | null>(null);

  // Fetch maid profile ID using Firebase UID
  const { data: profileData, loading: profileLoading } = useQuery(GET_MAID_PROFILE, {
    variables: { userId: user?.uid || '' },
    skip: !user?.uid,
    onCompleted: (data) => {
      if (data?.maid_profiles?.[0]?.id) {
        setMaidProfileId(data.maid_profiles[0].id);
      }
    },
  });

  // Fetch documents
  const {
    data: docsData,
    loading: docsLoading,
    error: docsError,
    refetch: refetchDocs,
  } = useQuery(GET_MAID_DOCUMENTS, {
    variables: { maidId: maidProfileId },
    skip: !maidProfileId,
    fetchPolicy: 'cache-and-network',
  });

  // Mutations
  const [insertDocument] = useMutation(INSERT_MAID_DOCUMENT);
  const [updateDocument] = useMutation(UPDATE_MAID_DOCUMENT);
  const [deleteDocumentMutation] = useMutation(DELETE_MAID_DOCUMENT);

  // Transform documents with status calculation
  const documents = useMemo(() => {
    const fetchedDocs = docsData?.maid_documents || [];
    const transformedDocs: MaidDocument[] = fetchedDocs.map((doc: any) => ({
      ...doc,
      status: calculateStatus(doc),
    }));

    // Add placeholder entries for required documents that don't exist
    const existingTypes = new Set(transformedDocs.map((d) => d.document_type));
    REQUIRED_DOCUMENT_TYPES.forEach((type, idx) => {
      if (!existingTypes.has(type)) {
        transformedDocs.push({
          id: `placeholder-${type}-${idx}`,
          maid_id: maidProfileId || '',
          document_type: type,
          document_name: DOCUMENT_TYPE_LABELS[type],
          document_url: '',
          verified: false,
          status: 'not_uploaded',
          expiry_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    return transformedDocs;
  }, [docsData, maidProfileId]);

  const isLoading = profileLoading || docsLoading;
  const error = docsError?.message || null;

  // Refetch function
  const refetch = useCallback(async () => {
    if (maidProfileId) {
      await refetchDocs();
    }
  }, [maidProfileId, refetchDocs]);

  // Upload document
  const uploadDocument = useCallback(
    async (input: UploadDocumentInput): Promise<{ success: boolean; error?: string }> => {
      if (!user?.email || !maidProfileId) {
        return { success: false, error: 'User not authenticated or profile not found' };
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Generate file path for Firebase Storage
        const timestamp = Date.now();
        const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `maid-documents/${maidProfileId}/${timestamp}_${safeName}`;

        setUploadProgress(10);

        // Convert URI to blob using XMLHttpRequest (more reliable in React Native)
        const blob = await new Promise<Blob>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const timeout = setTimeout(() => {
            xhr.abort();
            reject(new Error('Timeout converting URI to blob'));
          }, 30000);

          xhr.onload = function () {
            clearTimeout(timeout);
            if (xhr.response) {
              resolve(xhr.response);
            } else {
              reject(new Error('XHR response is empty'));
            }
          };
          xhr.onerror = function () {
            clearTimeout(timeout);
            reject(new Error('Failed to convert URI to blob'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', input.file.uri, true);
          xhr.send(null);
        });

        setUploadProgress(30);

        // Upload to Firebase Storage
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, blob, {
          contentType: input.file.type,
        });

        // Wait for upload with progress tracking
        const publicUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(30 + Math.round(progress * 0.5)); // 30-80%
            },
            (error) => {
              console.error('[useDocuments] Firebase upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (err) {
                reject(err);
              }
            }
          );
        });

        setUploadProgress(85);

        // Check if document of this type already exists
        const existingDoc = documents.find(
          (d) => d.document_type === input.documentType && !d.id.startsWith('placeholder')
        );

        if (existingDoc) {
          // Update existing document
          await updateDocument({
            variables: {
              id: existingDoc.id,
              set: {
                document_url: publicUrl,
                document_name: input.title || input.file.name,
                expiry_date: input.expiryDate || null,
                verified: false,
              },
            },
          });
        } else {
          // Insert new document
          await insertDocument({
            variables: {
              object: {
                maid_id: maidProfileId,
                document_type: input.documentType,
                document_name: input.title || input.file.name,
                document_url: publicUrl,
                expiry_date: input.expiryDate || null,
                verified: false,
              },
            },
          });
        }

        setUploadProgress(100);

        // Refetch documents
        await refetch();

        return { success: true };
      } catch (err: any) {
        console.error('[useDocuments] Upload error:', err);
        return { success: false, error: err.message || 'Upload failed' };
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [user?.email, maidProfileId, documents, insertDocument, updateDocument, refetch]
  );

  // Delete document
  const deleteDocument = useCallback(
    async (documentId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const doc = documents.find((d) => d.id === documentId);
        if (!doc || doc.id.startsWith('placeholder')) {
          return { success: false, error: 'Document not found' };
        }

        // Delete from database via GraphQL
        await deleteDocumentMutation({
          variables: { id: documentId },
        });

        // Refetch documents
        await refetch();

        return { success: true };
      } catch (err: any) {
        console.error('[useDocuments] Delete error:', err);
        return { success: false, error: err.message || 'Delete failed' };
      }
    },
    [documents, deleteDocumentMutation, refetch]
  );

  // Get documents by category
  const getDocumentsByCategory = useCallback(
    (category: string): MaidDocument[] => {
      if (category === 'all') return documents;
      if (category === 'required') {
        return documents.filter((d) => REQUIRED_DOCUMENT_TYPES.includes(d.document_type));
      }
      if (category === 'expiring') {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + 30);
        return documents.filter((doc) => {
          if (!doc.expiry_date) return false;
          const expiryDate = new Date(doc.expiry_date);
          return expiryDate <= thresholdDate && expiryDate >= new Date();
        });
      }
      const categoryTypes = DOCUMENT_CATEGORIES[category] || [];
      return documents.filter((d) => categoryTypes.includes(d.document_type));
    },
    [documents]
  );

  // Get required documents
  const getRequiredDocuments = useCallback((): MaidDocument[] => {
    return documents.filter((d) => REQUIRED_DOCUMENT_TYPES.includes(d.document_type));
  }, [documents]);

  // Get expiring documents
  const getExpiringDocuments = useCallback(
    (daysThreshold: number = 30): MaidDocument[] => {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      return documents.filter((doc) => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        return expiryDate <= thresholdDate && expiryDate >= new Date();
      });
    },
    [documents]
  );

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const requiredDocs = documents.filter((d) => REQUIRED_DOCUMENT_TYPES.includes(d.document_type));
    const uploadedRequiredDocs = requiredDocs.filter((d) => d.status !== 'not_uploaded');
    return requiredDocs.length > 0
      ? Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100)
      : 100;
  }, [documents]);

  return {
    documents,
    isLoading,
    error,
    uploadProgress,
    isUploading,
    refetch,
    uploadDocument,
    deleteDocument,
    getDocumentsByCategory,
    getRequiredDocuments,
    getExpiringDocuments,
    completionPercentage,
  };
}

// Helper to get expiry status - synced with web getDocumentExpiryStatus
export function getDocumentExpiryStatus(expiryDate: string | null): {
  status: 'expired' | 'expiring_soon' | 'valid';
  message: string;
  daysUntilExpiry: number;
} | null {
  if (!expiryDate) return null;

  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return {
      status: 'expired',
      message: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
      daysUntilExpiry,
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      status: 'expiring_soon',
      message: `Expires in ${daysUntilExpiry} days`,
      daysUntilExpiry,
    };
  } else {
    return {
      status: 'valid',
      message: `Valid for ${Math.floor(daysUntilExpiry / 30)} months`,
      daysUntilExpiry,
    };
  }
}

// Helper to format date
export function formatDocumentDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
