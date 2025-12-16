import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import { createLogger } from '@/utils/logger';
const log = createLogger('SponsorDocVerify');

// GraphQL Queries and Mutations
const GET_VERIFICATION_DATA = gql`
  query GetVerificationData($sponsor_id: uuid!) {
    sponsor_document_verification(where: { sponsor_id: { _eq: $sponsor_id } }) {
      id
      sponsor_id
      id_type
      id_number
      residence_country
      contact_phone
      employment_proof_type
      verification_status
      last_submission_at
      submission_count
      id_file_front_url
      id_file_front_name
      id_file_front_size
      id_file_front_mime_type
      id_file_back_url
      id_file_back_name
      id_file_back_size
      id_file_back_mime_type
      employment_proof_url
      employment_proof_name
      employment_proof_size
      employment_proof_mime_type
    }
  }
`;

const UPSERT_VERIFICATION_DATA = gql`
  mutation UpsertVerificationData($object: sponsor_document_verification_insert_input!) {
    insert_sponsor_document_verification_one(
      object: $object
      on_conflict: {
        constraint: sponsor_document_verification_sponsor_id_key
        update_columns: [
          id_type
          id_number
          residence_country
          contact_phone
          employment_proof_type
          verification_status
          last_submission_at
          submission_count
          id_file_front_url
          id_file_front_name
          id_file_front_size
          id_file_front_mime_type
          id_file_back_url
          id_file_back_name
          id_file_back_size
          id_file_back_mime_type
          employment_proof_url
          employment_proof_name
          employment_proof_size
          employment_proof_mime_type
        ]
      }
    ) {
      id
      sponsor_id
      verification_status
    }
  }
`;

class SponsorDocumentVerificationService {
  constructor() {
    this.bucketPath = 'sponsor-documents';
  }

  /**
   * Upload a document file to Firebase Storage
   */
  async uploadDocument(file, userId, documentType) {
    try {
      if (!file || !userId || !documentType) {
        throw new Error('Missing required parameters for document upload');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;
      const filePath = `${this.bucketPath}/${userId}/${fileName}`;

      log.info(
        'Document Upload',
        `Uploading ${documentType} for user ${userId}`
      );

      // Create a reference to the file location
      const storageRef = ref(storage, filePath);

      // Upload file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          userId: userId,
          documentType: documentType,
          originalName: file.name
        }
      });

      // Get the download URL
      const url = await getDownloadURL(snapshot.ref);

      return {
        url: url,
        path: filePath,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      log.error('Document Upload Service Error', error);
      throw error;
    }
  }

  /**
   * Save or update sponsor document verification data
   */
  async saveVerificationData(userId, verificationData) {
    try {
      log.info(
        'Verification Data Save',
        `Saving verification data for user ${userId}`
      );

      // Check if record exists to get submission count
      const { data: existingData } = await apolloClient.query({
        query: GET_VERIFICATION_DATA,
        variables: { sponsor_id: userId },
        fetchPolicy: 'network-only'
      });

      const existingRecord = existingData?.sponsor_document_verification?.[0];
      const submissionCount = existingRecord ? (existingRecord.submission_count || 0) + 1 : 1;

      const dataToSave = {
        sponsor_id: userId,
        id_type: verificationData.idType,
        id_number: verificationData.idNumber,
        residence_country: verificationData.residenceCountry,
        contact_phone: verificationData.contactPhone,
        employment_proof_type: verificationData.employmentProofType,
        verification_status: 'pending',
        last_submission_at: new Date().toISOString(),
        submission_count: submissionCount,
      };

      // Add document URLs if they exist
      if (verificationData.idFileFront) {
        dataToSave.id_file_front_url = verificationData.idFileFront.url;
        dataToSave.id_file_front_name = verificationData.idFileFront.name;
        dataToSave.id_file_front_size = verificationData.idFileFront.size;
        dataToSave.id_file_front_mime_type = verificationData.idFileFront.mimeType;
      }

      if (verificationData.idFileBack) {
        dataToSave.id_file_back_url = verificationData.idFileBack.url;
        dataToSave.id_file_back_name = verificationData.idFileBack.name;
        dataToSave.id_file_back_size = verificationData.idFileBack.size;
        dataToSave.id_file_back_mime_type = verificationData.idFileBack.mimeType;
      }

      if (verificationData.employmentProofFile) {
        dataToSave.employment_proof_url = verificationData.employmentProofFile.url;
        dataToSave.employment_proof_name = verificationData.employmentProofFile.name;
        dataToSave.employment_proof_size = verificationData.employmentProofFile.size;
        dataToSave.employment_proof_mime_type = verificationData.employmentProofFile.mimeType;
      }

      const { data } = await apolloClient.mutate({
        mutation: UPSERT_VERIFICATION_DATA,
        variables: { object: dataToSave }
      });

      const result = data?.insert_sponsor_document_verification_one;

      log.info(
        'Verification Data Saved',
        `${existingRecord ? 'Updated' : 'Created'} verification for user ${userId}`
      );

      return result;
    } catch (error) {
      log.error('Verification Data Save Error', error);
      throw error;
    }
  }

  /**
   * Get sponsor verification data
   */
  async getVerificationData(userId) {
    try {
      log.info(
        'Verification Data Fetch',
        `Fetching verification data for user ${userId}`
      );

      const { data } = await apolloClient.query({
        query: GET_VERIFICATION_DATA,
        variables: { sponsor_id: userId },
        fetchPolicy: 'network-only'
      });

      return data?.sponsor_document_verification?.[0] || null;
    } catch (error) {
      log.error('Verification Data Fetch Error', error);
      throw error;
    }
  }

  /**
   * Get verification summary
   */
  async getVerificationSummary(userId) {
    try {
      const verificationData = await this.getVerificationData(userId);

      if (!verificationData) {
        return {
          has_documents: false,
          verification_status: 'not_submitted',
          documents_complete: false,
          missing_documents: ['All documents required'],
        };
      }

      const missingDocuments = [];
      if (!verificationData.id_file_front_url) missingDocuments.push('ID Front');
      if (!verificationData.id_file_back_url) missingDocuments.push('ID Back');
      if (!verificationData.employment_proof_url) missingDocuments.push('Employment Proof');

      return {
        has_documents: true,
        verification_status: verificationData.verification_status,
        documents_complete: missingDocuments.length === 0,
        missing_documents: missingDocuments.length > 0 ? missingDocuments : [],
      };
    } catch (error) {
      log.error('Verification Summary Error', error);
      return {
        has_documents: false,
        verification_status: 'error',
        documents_complete: false,
        missing_documents: ['Error fetching status'],
      };
    }
  }

  /**
   * Delete a document file from Firebase Storage
   */
  async deleteDocument(filePath) {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);

      log.info('Document Deleted', `Deleted document: ${filePath}`);
      return true;
    } catch (error) {
      log.error('Document Delete Error', error);
      throw error;
    }
  }

  /**
   * Get document URL (Firebase Storage URLs are already signed)
   */
  async getDocumentSignedUrl(filePath) {
    try {
      const storageRef = ref(storage, filePath);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      log.error('Get Document URL Error', error);
      throw error;
    }
  }

  /**
   * Process complete verification submission
   */
  async submitCompleteVerification(userId, verificationData) {
    try {
      log.info(
        'Complete Verification Submission',
        `Processing complete submission for user ${userId}`
      );

      // Upload all documents first
      const uploadPromises = [];
      const uploadedDocuments = {};

      if (verificationData.idFileFront?.file) {
        uploadPromises.push(
          this.uploadDocument(
            verificationData.idFileFront.file,
            userId,
            'id_front'
          ).then((result) => {
            uploadedDocuments.idFileFront = result;
          })
        );
      }

      if (verificationData.idFileBack?.file) {
        uploadPromises.push(
          this.uploadDocument(
            verificationData.idFileBack.file,
            userId,
            'id_back'
          ).then((result) => {
            uploadedDocuments.idFileBack = result;
          })
        );
      }

      if (verificationData.employmentProofFile?.file) {
        uploadPromises.push(
          this.uploadDocument(
            verificationData.employmentProofFile.file,
            userId,
            'employment_proof'
          ).then((result) => {
            uploadedDocuments.employmentProofFile = result;
          })
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Merge uploaded document data with verification data
      const completeVerificationData = {
        ...verificationData,
        ...uploadedDocuments,
      };

      // Save verification data to database
      const result = await this.saveVerificationData(
        userId,
        completeVerificationData
      );

      log.info(
        'Complete Verification Success',
        `Successfully submitted verification for user ${userId}`
      );
      return result;
    } catch (error) {
      log.error('Complete Verification Error', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sponsorDocumentVerificationService =
  new SponsorDocumentVerificationService();
export default sponsorDocumentVerificationService;
