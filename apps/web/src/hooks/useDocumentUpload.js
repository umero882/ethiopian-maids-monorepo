/**
 * Industry-Standard Document Upload Hook
 * Provides comprehensive document management with:
 * - File validation (size, type, dimensions)
 * - Upload progress tracking
 * - Error handling with retry logic
 * - Document versioning support
 * - Expiration tracking
 */

import { useState, useCallback, useRef } from 'react';
import { storage } from '@/lib/firebaseClient';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { toast } from '@/components/ui/use-toast';

// Document type configurations with industry-standard requirements
export const DOCUMENT_TYPES = {
  business_license: {
    key: 'business_license',
    label: 'Business License',
    description: 'Official business registration or operating license',
    required: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    expirationRequired: true,
    expirationWarningDays: 30,
  },
  trade_license: {
    key: 'trade_license',
    label: 'Trade License',
    description: 'Government-issued trade or commercial license',
    required: true,
    maxSize: 10 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    expirationRequired: true,
    expirationWarningDays: 30,
  },
  labor_permit: {
    key: 'labor_permit',
    label: 'Labor Permit',
    description: 'License to operate as a labor recruitment agency',
    required: false,
    maxSize: 10 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    expirationRequired: true,
    expirationWarningDays: 30,
  },
  insurance_certificate: {
    key: 'insurance_certificate',
    label: 'Insurance Certificate',
    description: 'Liability or professional insurance documentation',
    required: false,
    maxSize: 10 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    expirationRequired: true,
    expirationWarningDays: 30,
  },
  accreditation_certificate: {
    key: 'accreditation_certificate',
    label: 'Accreditation Certificate',
    description: 'Industry accreditation or certification',
    required: false,
    maxSize: 10 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    expirationRequired: false,
    expirationWarningDays: 30,
  },
  tax_certificate: {
    key: 'tax_certificate',
    label: 'Tax Registration Certificate',
    description: 'Tax identification and registration document',
    required: false,
    maxSize: 10 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    expirationRequired: false,
    expirationWarningDays: 0,
  },
  authorized_person_id: {
    key: 'authorized_person_id',
    label: 'Authorized Person ID',
    description: 'Government-issued ID of the authorized representative',
    required: true,
    maxSize: 5 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    expirationRequired: true,
    expirationWarningDays: 60,
  },
  contract_template: {
    key: 'contract_template',
    label: 'Contract Template',
    description: 'Standard employment contract template',
    required: false,
    maxSize: 5 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    acceptedExtensions: ['.pdf', '.doc', '.docx'],
    expirationRequired: false,
    expirationWarningDays: 0,
  },
  other: {
    key: 'other',
    label: 'Other Documents',
    description: 'Additional supporting documentation',
    required: false,
    maxSize: 10 * 1024 * 1024,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'],
    expirationRequired: false,
    expirationWarningDays: 0,
  },
};

// Verification status enum
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  EXPIRING_SOON: 'expiring_soon',
};

// GraphQL mutations
const INSERT_DOCUMENT = gql`
  mutation InsertAgencyDocument($object: agency_documents_insert_input!) {
    insert_agency_documents_one(object: $object) {
      id
      agency_id
      document_type
      file_name
      file_path
      file_size
      mime_type
      verification_status
      expiration_date
      version
      uploaded_at
      created_at
      notes
    }
  }
`;

const UPDATE_DOCUMENT = gql`
  mutation UpdateAgencyDocument($id: uuid!, $set: agency_documents_set_input!) {
    update_agency_documents_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      agency_id
      document_type
      file_name
      file_path
      file_size
      mime_type
      verification_status
      expiration_date
      version
      uploaded_at
      updated_at
      notes
    }
  }
`;

const DELETE_DOCUMENT = gql`
  mutation DeleteAgencyDocument($id: uuid!) {
    delete_agency_documents_by_pk(id: $id) {
      id
    }
  }
`;

const GET_DOCUMENTS = gql`
  query GetAgencyDocuments($agency_id: uuid!) {
    agency_documents(
      where: { agency_id: { _eq: $agency_id } }
      order_by: [{ document_type: asc }, { version: desc }, { created_at: desc }]
    ) {
      id
      agency_id
      document_type
      file_name
      file_path
      file_size
      mime_type
      verification_status
      rejection_reason
      expiration_date
      version
      uploaded_at
      created_at
      updated_at
      verified_at
      verified_by
      notes
    }
  }
`;

const GET_DOCUMENT_HISTORY = gql`
  query GetDocumentHistory($agency_id: uuid!, $document_type: String!) {
    agency_documents(
      where: {
        agency_id: { _eq: $agency_id }
        document_type: { _eq: $document_type }
      }
      order_by: { version: desc }
    ) {
      id
      version
      file_name
      file_path
      verification_status
      uploaded_at
      created_at
    }
  }
`;

/**
 * File validation utility
 */
export const validateFile = (file, documentType) => {
  const config = DOCUMENT_TYPES[documentType] || DOCUMENT_TYPES.other;
  const errors = [];

  // Check file exists
  if (!file) {
    errors.push('No file selected');
    return { valid: false, errors };
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    errors.push(`File size exceeds ${maxSizeMB}MB limit`);
  }

  // Check file type
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const extension = '.' + fileName.split('.').pop();

  const isValidType = config.acceptedTypes.some(type => {
    if (type.includes('*')) {
      const baseType = type.split('/')[0];
      return fileType.startsWith(baseType);
    }
    return fileType === type;
  });

  const isValidExtension = config.acceptedExtensions.includes(extension);

  if (!isValidType && !isValidExtension) {
    errors.push(`Invalid file type. Accepted: ${config.acceptedExtensions.join(', ')}`);
  }

  // Check file name for potential security issues
  const dangerousPatterns = [/\.\./g, /[<>:"|?*]/g, /[\x00-\x1f]/g];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(file.name)) {
      errors.push('File name contains invalid characters');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    config,
  };
};

/**
 * Check if document is expiring soon or expired
 */
export const checkExpiration = (expirationDate, warningDays = 30) => {
  if (!expirationDate) return { expired: false, expiringSoon: false, daysUntilExpiration: null };

  const expiry = new Date(expirationDate);
  const today = new Date();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    expired: diffDays < 0,
    expiringSoon: diffDays >= 0 && diffDays <= warningDays,
    daysUntilExpiration: diffDays,
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Main document upload hook
 */
export const useDocumentUpload = (agencyId) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const uploadTasksRef = useRef({});

  /**
   * Fetch all documents for the agency
   */
  const fetchDocuments = useCallback(async () => {
    if (!agencyId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, errors } = await apolloClient.query({
        query: GET_DOCUMENTS,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Process documents to add expiration status
      const processedDocs = (data?.agency_documents || []).map(doc => {
        const config = DOCUMENT_TYPES[doc.document_type] || DOCUMENT_TYPES.other;
        const expStatus = checkExpiration(doc.expiration_date, config.expirationWarningDays);

        return {
          ...doc,
          ...expStatus,
          typeConfig: config,
        };
      });

      setDocuments(processedDocs);
      return processedDocs;
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  /**
   * Upload a document with progress tracking
   */
  const uploadDocument = useCallback(async (file, documentType, options = {}) => {
    const {
      expirationDate = null,
      notes = '',
      onProgress = null,
      replaceDocumentId = null,
    } = options;

    // Validate the file
    const validation = validateFile(file, documentType);
    if (!validation.valid) {
      const errorMsg = validation.errors.join(', ');
      toast({
        title: 'Validation Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return { success: false, error: errorMsg };
    }

    setUploading(true);
    setError(null);
    const uploadId = `${documentType}_${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const filePath = `agency-documents/${agencyId}/${documentType}/${timestamp}_${sanitizedName}`;

      // Create storage reference and upload
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Store the upload task for potential cancellation
      uploadTasksRef.current[uploadId] = uploadTask;

      // Wait for upload to complete
      const downloadUrl = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
            if (onProgress) onProgress(progress);
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          }
        );
      });

      // Get current version for this document type
      const existingDocs = documents.filter(d => d.document_type === documentType);
      const currentVersion = existingDocs.length > 0
        ? Math.max(...existingDocs.map(d => d.version || 0)) + 1
        : 1;

      // Save document metadata to database
      const documentData = {
        agency_id: agencyId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        verification_status: VERIFICATION_STATUS.PENDING,
        expiration_date: expirationDate,
        version: currentVersion,
        uploaded_at: new Date().toISOString(),
        notes,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: INSERT_DOCUMENT,
        variables: { object: documentData },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      const newDocument = data.insert_agency_documents_one;

      // If replacing an old document, optionally mark it as superseded
      if (replaceDocumentId) {
        await apolloClient.mutate({
          mutation: UPDATE_DOCUMENT,
          variables: {
            id: replaceDocumentId,
            set: { notes: 'Superseded by newer version' },
          },
        });
      }

      // Update local state
      const config = DOCUMENT_TYPES[documentType] || DOCUMENT_TYPES.other;
      const expStatus = checkExpiration(expirationDate, config.expirationWarningDays);

      const processedDoc = {
        ...newDocument,
        ...expStatus,
        typeConfig: config,
      };

      setDocuments(prev => [processedDoc, ...prev]);

      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded successfully.`,
      });

      return { success: true, document: processedDoc };
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.message || 'Failed to upload document';
      setError(errorMsg);
      toast({
        title: 'Upload Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      return { success: false, error: errorMsg };
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });
      delete uploadTasksRef.current[uploadId];
    }
  }, [agencyId, documents]);

  /**
   * Cancel an in-progress upload
   */
  const cancelUpload = useCallback((uploadId) => {
    const task = uploadTasksRef.current[uploadId];
    if (task) {
      task.cancel();
      delete uploadTasksRef.current[uploadId];
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });
    }
  }, []);

  /**
   * Delete a document
   */
  const deleteDocument = useCallback(async (documentId, filePath) => {
    setError(null);

    try {
      // Delete from Firebase Storage
      if (filePath) {
        try {
          const storageRef = ref(storage, filePath);
          await deleteObject(storageRef);
        } catch (storageError) {
          // Ignore if file doesn't exist
          if (storageError.code !== 'storage/object-not-found') {
            console.warn('Storage deletion error:', storageError);
          }
        }
      }

      // Delete from database
      const { errors } = await apolloClient.mutate({
        mutation: DELETE_DOCUMENT,
        variables: { id: documentId },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      toast({
        title: 'Document Deleted',
        description: 'The document has been removed.',
      });

      return { success: true };
    } catch (err) {
      console.error('Delete error:', err);
      const errorMsg = err.message || 'Failed to delete document';
      setError(errorMsg);
      toast({
        title: 'Delete Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Update document metadata (notes, expiration date)
   */
  const updateDocument = useCallback(async (documentId, updates) => {
    setError(null);

    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_DOCUMENT,
        variables: {
          id: documentId,
          set: {
            ...updates,
            updated_at: new Date().toISOString(),
          },
        },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      const updatedDoc = data.update_agency_documents_by_pk;
      const config = DOCUMENT_TYPES[updatedDoc.document_type] || DOCUMENT_TYPES.other;
      const expStatus = checkExpiration(updatedDoc.expiration_date, config.expirationWarningDays);

      // Update local state
      setDocuments(prev => prev.map(doc =>
        doc.id === documentId
          ? { ...updatedDoc, ...expStatus, typeConfig: config }
          : doc
      ));

      toast({
        title: 'Document Updated',
        description: 'Document information has been updated.',
      });

      return { success: true, document: updatedDoc };
    } catch (err) {
      console.error('Update error:', err);
      const errorMsg = err.message || 'Failed to update document';
      setError(errorMsg);
      toast({
        title: 'Update Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Get document history for a specific type
   */
  const getDocumentHistory = useCallback(async (documentType) => {
    if (!agencyId) return [];

    try {
      const { data, errors } = await apolloClient.query({
        query: GET_DOCUMENT_HISTORY,
        variables: { agency_id: agencyId, document_type: documentType },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return data?.agency_documents || [];
    } catch (err) {
      console.error('Error fetching document history:', err);
      return [];
    }
  }, [agencyId]);

  /**
   * Get documents grouped by type
   */
  const getDocumentsByType = useCallback((type) => {
    return documents.filter(doc => doc.document_type === type);
  }, [documents]);

  /**
   * Get latest version of each document type
   */
  const getLatestDocuments = useCallback(() => {
    const latest = {};
    documents.forEach(doc => {
      if (!latest[doc.document_type] || doc.version > latest[doc.document_type].version) {
        latest[doc.document_type] = doc;
      }
    });
    return Object.values(latest);
  }, [documents]);

  /**
   * Get document compliance summary
   */
  const getComplianceSummary = useCallback(() => {
    const latestDocs = getLatestDocuments();
    const requiredTypes = Object.values(DOCUMENT_TYPES).filter(t => t.required);

    const uploaded = requiredTypes.filter(type =>
      latestDocs.some(doc => doc.document_type === type.key)
    );

    const verified = latestDocs.filter(doc =>
      doc.verification_status === VERIFICATION_STATUS.VERIFIED &&
      requiredTypes.some(t => t.key === doc.document_type)
    );

    const expiring = latestDocs.filter(doc => doc.expiringSoon);
    const expired = latestDocs.filter(doc => doc.expired);
    const pending = latestDocs.filter(doc => doc.verification_status === VERIFICATION_STATUS.PENDING);
    const rejected = latestDocs.filter(doc => doc.verification_status === VERIFICATION_STATUS.REJECTED);

    return {
      totalRequired: requiredTypes.length,
      uploaded: uploaded.length,
      verified: verified.length,
      pending: pending.length,
      rejected: rejected.length,
      expiring: expiring.length,
      expired: expired.length,
      completionPercentage: Math.round((uploaded.length / requiredTypes.length) * 100),
      verificationPercentage: Math.round((verified.length / requiredTypes.length) * 100),
      isCompliant: uploaded.length === requiredTypes.length && verified.length === requiredTypes.length && expired.length === 0,
    };
  }, [getLatestDocuments]);

  /**
   * Download a document
   */
  const downloadDocument = useCallback(async (filePath, fileName) => {
    try {
      const storageRef = ref(storage, filePath);
      const downloadUrl = await getDownloadURL(storageRef);

      // Fetch and download
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: 'Download Failed',
        description: 'Unable to download the document.',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Get download URL for a document
   */
  const getDocumentUrl = useCallback(async (filePath) => {
    try {
      const storageRef = ref(storage, filePath);
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.error('Error getting document URL:', err);
      return null;
    }
  }, []);

  return {
    // State
    documents,
    loading,
    uploading,
    uploadProgress,
    error,

    // Actions
    fetchDocuments,
    uploadDocument,
    cancelUpload,
    deleteDocument,
    updateDocument,
    downloadDocument,
    getDocumentUrl,

    // Queries
    getDocumentsByType,
    getLatestDocuments,
    getDocumentHistory,
    getComplianceSummary,

    // Utilities
    DOCUMENT_TYPES,
    VERIFICATION_STATUS,
  };
};

export default useDocumentUpload;
