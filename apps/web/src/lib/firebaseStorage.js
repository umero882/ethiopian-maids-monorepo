/**
 * Firebase Storage Utilities
 * Provides file upload/download functionality using Firebase Storage
 */

import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from 'firebase/storage';
import { app } from './firebaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('FirebaseStorage');

// Check if storage bucket is configured
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  log.warn('VITE_FIREBASE_STORAGE_BUCKET is not configured. File uploads will not work.');
}

// Initialize Firebase Storage
const storage = app ? getStorage(app) : null;

if (storage) {
  log.info('Firebase Storage initialized', storageBucket ? `bucket: ${storageBucket}` : 'WARNING: no bucket configured');
}

/**
 * Upload a file to Firebase Storage
 * @param {string} path - Storage path (e.g., 'profile-pictures/user123.jpg')
 * @param {File|Blob} file - File to upload
 * @param {Object} options - Upload options
 * @param {Object} options.metadata - Custom metadata
 * @param {Function} options.onProgress - Progress callback (0-100)
 * @returns {Promise<{url: string, path: string}>} Upload result
 */
export async function uploadFile(path, file, options = {}) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Check that Firebase is properly configured.');
  }

  if (!storageBucket) {
    throw new Error('Firebase Storage bucket not configured. Please set VITE_FIREBASE_STORAGE_BUCKET in your .env file.');
  }

  try {
    const storageRef = ref(storage, path);

    let uploadTask;

    if (options.onProgress) {
      // Use resumable upload for progress tracking
      uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: options.metadata,
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options.onProgress(progress);
          },
          (error) => {
            log.error('Upload failed:', error);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            log.info(`File uploaded successfully: ${path}`);
            resolve({ url, path });
          }
        );
      });
    } else {
      // Simple upload without progress
      await uploadBytes(storageRef, file, {
        customMetadata: options.metadata,
      });
      const url = await getDownloadURL(storageRef);
      log.info(`File uploaded successfully: ${path}`);
      return { url, path };
    }
  } catch (error) {
    log.error('Failed to upload file:', error);
    throw error;
  }
}

/**
 * Get the download URL for a file
 * @param {string} path - Storage path
 * @returns {Promise<string>} Download URL
 */
export async function getFileUrl(path) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    log.error('Failed to get file URL:', error);
    throw error;
  }
}

/**
 * Delete a file from storage
 * @param {string} path - Storage path
 * @returns {Promise<void>}
 */
export async function deleteFile(path) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    log.info(`File deleted: ${path}`);
  } catch (error) {
    // Ignore "object not found" errors
    if (error.code === 'storage/object-not-found') {
      log.warn(`File not found for deletion: ${path}`);
      return;
    }
    log.error('Failed to delete file:', error);
    throw error;
  }
}

/**
 * Get file metadata
 * @param {string} path - Storage path
 * @returns {Promise<Object>} File metadata
 */
export async function getFileMetadata(path) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const storageRef = ref(storage, path);
    return await getMetadata(storageRef);
  } catch (error) {
    log.error('Failed to get file metadata:', error);
    throw error;
  }
}

/**
 * List all files in a directory
 * @param {string} path - Directory path
 * @returns {Promise<Array<{name: string, path: string}>>} List of files
 */
export async function listFiles(path) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);

    const files = await Promise.all(
      result.items.map(async (itemRef) => ({
        name: itemRef.name,
        path: itemRef.fullPath,
        url: await getDownloadURL(itemRef),
      }))
    );

    return files;
  } catch (error) {
    log.error('Failed to list files:', error);
    throw error;
  }
}

/**
 * Upload a profile picture with automatic compression and path generation
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<{url: string, path: string}>} Upload result
 */
export async function uploadProfilePicture(userId, file, onProgress) {
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const path = `profile-pictures/${userId}-${timestamp}.${fileExt}`;

  return uploadFile(path, file, {
    onProgress,
    metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
    },
  });
}

/**
 * Upload a document (ID, certificate, etc.)
 * @param {string} userId - User ID
 * @param {string} documentType - Type of document (e.g., 'id', 'certificate', 'license')
 * @param {File} file - Document file
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<{url: string, path: string}>} Upload result
 */
export async function uploadDocument(userId, documentType, file, onProgress) {
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'pdf';
  const path = `documents/${userId}/${documentType}-${timestamp}.${fileExt}`;

  return uploadFile(path, file, {
    onProgress,
    metadata: {
      userId,
      documentType,
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
    },
  });
}

export { storage };
export default storage;
