/**
 * File Upload Utility for Chat Attachments
 *
 * Handles uploading images, documents, and other files to Firebase Storage
 */

import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from 'firebase/storage';
import { storage, auth } from './firebaseConfig';

export type AttachmentType = 'image' | 'document' | 'location' | 'voice';

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadResult {
  url: string;
  path: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Generates a unique file path for storage
 */
const generateFilePath = (
  userId: string,
  conversationId: string,
  fileName: string,
  type: AttachmentType
): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `chat/${conversationId}/${type}s/${userId}_${timestamp}_${sanitizedFileName}`;
};

/**
 * Converts a local file URI to a blob for upload
 * Uses fetch for iOS (more reliable) and XHR as fallback
 * Added timeout and better error handling
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
  console.log('[FileUpload] Converting URI to blob:', uri.substring(0, 80) + '...');

  // Try fetch first (works better on iOS)
  try {
    console.log('[FileUpload] Trying fetch method...');
    const response = await Promise.race([
      fetch(uri),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 30000)
      ),
    ]);
    const blob = await response.blob();
    console.log('[FileUpload] Fetch successful, blob size:', blob.size, 'type:', blob.type);
    if (blob.size > 0) {
      return blob;
    }
    throw new Error('Fetch returned empty blob');
  } catch (fetchError) {
    console.log('[FileUpload] Fetch failed, trying XHR method...', fetchError);
  }

  // Fallback to XHR
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Set timeout to 30 seconds to prevent infinite hanging
    const timeout = setTimeout(() => {
      xhr.abort();
      reject(new Error('Timeout: Failed to convert URI to blob'));
    }, 30000);

    xhr.onload = function() {
      clearTimeout(timeout);
      console.log('[FileUpload] XHR loaded, response type:', xhr.response?.type, 'size:', xhr.response?.size);
      if (xhr.response && xhr.response.size > 0) {
        resolve(xhr.response);
      } else {
        reject(new Error('XHR response is empty'));
      }
    };
    xhr.onerror = function(e) {
      clearTimeout(timeout);
      console.error('[FileUpload] XHR error:', e);
      reject(new Error('Failed to convert URI to blob'));
    };
    xhr.onabort = function() {
      clearTimeout(timeout);
      console.error('[FileUpload] XHR aborted');
      reject(new Error('Request aborted'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

/**
 * Extracts file name from URI
 */
const getFileNameFromUri = (uri: string): string => {
  const parts = uri.split('/');
  return parts[parts.length - 1] || `file_${Date.now()}`;
};

/**
 * Gets MIME type from file extension
 */
const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};

/**
 * Uploads an image to Firebase Storage
 */
export const uploadImage = async (
  uri: string,
  userId: string,
  conversationId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  console.log('[FileUpload] Starting image upload:', { uri: uri.substring(0, 50), userId, conversationId });

  // Check if user is authenticated with Firebase
  const currentUser = auth.currentUser;
  console.log('[FileUpload] Firebase auth state:', {
    isAuthenticated: !!currentUser,
    uid: currentUser?.uid,
    email: currentUser?.email
  });

  if (!currentUser) {
    console.warn('[FileUpload] User not authenticated with Firebase, upload may fail');
  }

  const fileName = getFileNameFromUri(uri);
  const filePath = generateFilePath(userId, conversationId, fileName, 'image');
  const mimeType = getMimeType(fileName);

  console.log('[FileUpload] File details:', { fileName, filePath, mimeType });

  let blob: Blob;
  try {
    blob = await uriToBlob(uri);
    console.log('[FileUpload] Blob created:', { size: blob.size, type: blob.type });
  } catch (blobError) {
    console.error('[FileUpload] Failed to create blob:', blobError);
    throw blobError;
  }

  console.log('[FileUpload] Creating storage reference...');
  const storageRef = ref(storage, filePath);
  console.log('[FileUpload] Storage ref created, starting upload...');

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: mimeType,
    });

    // Set upload timeout to 2 minutes to prevent infinite hanging
    const uploadTimeout = setTimeout(() => {
      console.error('[FileUpload] Upload timeout - cancelling');
      uploadTask.cancel();
      reject(new Error('Upload timeout: Operation took too long'));
    }, 120000);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('[FileUpload] Upload progress:', progress.toFixed(1) + '%');
        onProgress?.({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        });
      },
      (error: any) => {
        clearTimeout(uploadTimeout);
        console.error('[FileUpload] Image upload error:', error);
        console.error('[FileUpload] Error code:', error?.code);
        console.error('[FileUpload] Error message:', error?.message);
        console.error('[FileUpload] Server response:', error?.serverResponse);
        reject(error);
      },
      async () => {
        clearTimeout(uploadTimeout);
        try {
          console.log('[FileUpload] Upload complete, getting download URL...');
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[FileUpload] Download URL obtained:', downloadURL.substring(0, 50));
          resolve({
            url: downloadURL,
            path: filePath,
            type: 'image',
            fileName,
            fileSize: blob.size,
            mimeType,
          });
        } catch (error) {
          console.error('[FileUpload] Failed to get download URL:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Uploads a document to Firebase Storage
 */
export const uploadDocument = async (
  uri: string,
  fileName: string,
  mimeType: string,
  userId: string,
  conversationId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const filePath = generateFilePath(userId, conversationId, fileName, 'document');

  const blob = await uriToBlob(uri);
  const storageRef = ref(storage, filePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: mimeType,
    });

    // Set upload timeout to 2 minutes to prevent infinite hanging
    const uploadTimeout = setTimeout(() => {
      console.error('[FileUpload] Document upload timeout - cancelling');
      uploadTask.cancel();
      reject(new Error('Upload timeout: Operation took too long'));
    }, 120000);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        });
      },
      (error) => {
        clearTimeout(uploadTimeout);
        console.error('[FileUpload] Document upload error:', error);
        reject(error);
      },
      async () => {
        clearTimeout(uploadTimeout);
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            path: filePath,
            type: 'document',
            fileName,
            fileSize: blob.size,
            mimeType,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Formats location data as a message-friendly object
 */
export const formatLocationMessage = (location: LocationData): string => {
  const { latitude, longitude, address } = location;
  // Create a JSON string that can be parsed by the message renderer
  return JSON.stringify({
    type: 'location',
    latitude,
    longitude,
    address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
  });
};

/**
 * Parses a location message back to LocationData
 */
export const parseLocationMessage = (content: string): LocationData | null => {
  try {
    const data = JSON.parse(content);
    if (data.type === 'location') {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Formats an attachment message content
 */
export const formatAttachmentMessage = (
  uploadResult: UploadResult,
  caption?: string
): string => {
  return JSON.stringify({
    type: uploadResult.type,
    url: uploadResult.url,
    fileName: uploadResult.fileName,
    fileSize: uploadResult.fileSize,
    mimeType: uploadResult.mimeType,
    caption: caption || '',
  });
};

/**
 * Parses an attachment message
 */
export interface ParsedAttachment {
  type: AttachmentType;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  caption?: string;
}

export const parseAttachmentMessage = (content: string): ParsedAttachment | null => {
  try {
    const data = JSON.parse(content);
    if (data.type === 'image' || data.type === 'document') {
      return {
        type: data.type,
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        caption: data.caption,
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Checks if a message content is an attachment
 */
export const isAttachmentMessage = (content: string): boolean => {
  try {
    const data = JSON.parse(content);
    return data.type === 'image' || data.type === 'document' || data.type === 'location' || data.type === 'voice';
  } catch {
    return false;
  }
};

/**
 * Gets a human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// ============================================
// Voice Message Utilities
// ============================================

export interface VoiceUploadResult extends UploadResult {
  type: 'voice';
  duration: number;
  waveformData: number[];
}

/**
 * Uploads a voice message to Firebase Storage
 */
export const uploadVoice = async (
  uri: string,
  userId: string,
  conversationId: string,
  duration: number,
  waveformData: number[],
  onProgress?: (progress: UploadProgress) => void
): Promise<VoiceUploadResult> => {
  console.log('[FileUpload] Starting voice upload:', { uri: uri.substring(0, 50), userId, conversationId });

  // Check if user is authenticated with Firebase
  const currentUser = auth.currentUser;
  console.log('[FileUpload] Firebase auth state for voice:', {
    isAuthenticated: !!currentUser,
    uid: currentUser?.uid,
  });

  if (!currentUser) {
    console.warn('[FileUpload] User not authenticated with Firebase, voice upload may fail');
  }

  // Determine file extension based on platform
  // Web uses WebM, mobile (iOS/Android) uses M4A
  const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
  const extension = isWeb ? 'webm' : 'm4a';
  const mimeType = isWeb ? 'audio/webm' : 'audio/mp4';

  console.log('[FileUpload] Voice format:', { isWeb, extension, mimeType });

  const timestamp = Date.now();
  const fileName = `voice_${timestamp}.${extension}`;
  const filePath = `chat/${conversationId}/voice/${userId}_${fileName}`;

  console.log('[FileUpload] Voice file details:', { fileName, filePath });

  let blob: Blob;
  try {
    blob = await uriToBlob(uri);
    console.log('[FileUpload] Voice blob created:', { size: blob.size });
  } catch (blobError) {
    console.error('[FileUpload] Failed to create voice blob:', blobError);
    throw blobError;
  }

  console.log('[FileUpload] Creating storage reference for voice...');
  const storageRef = ref(storage, filePath);
  console.log('[FileUpload] Storage ref created, starting voice upload...');

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: mimeType,
    });

    // Set upload timeout to 1 minute for voice messages
    const uploadTimeout = setTimeout(() => {
      console.error('[FileUpload] Voice upload timeout - cancelling');
      uploadTask.cancel();
      reject(new Error('Voice upload timeout: Operation took too long'));
    }, 60000);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('[FileUpload] Voice upload progress:', progress.toFixed(1) + '%');
        onProgress?.({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        });
      },
      (error: any) => {
        clearTimeout(uploadTimeout);
        console.error('[FileUpload] Voice upload error:', error);
        console.error('[FileUpload] Error code:', error?.code);
        console.error('[FileUpload] Error message:', error?.message);
        reject(error);
      },
      async () => {
        clearTimeout(uploadTimeout);
        try {
          console.log('[FileUpload] Voice upload complete, getting download URL...');
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[FileUpload] Voice download URL obtained:', downloadURL.substring(0, 50));
          resolve({
            url: downloadURL,
            path: filePath,
            type: 'voice',
            fileName,
            fileSize: blob.size,
            mimeType,
            duration,
            waveformData,
          });
        } catch (error) {
          console.error('[FileUpload] Failed to get voice download URL:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Formats a voice message for sending via GraphQL
 */
export const formatVoiceMessage = (uploadResult: VoiceUploadResult): string => {
  return JSON.stringify({
    type: 'voice',
    url: uploadResult.url,
    duration: uploadResult.duration,
    waveformData: uploadResult.waveformData,
    fileSize: uploadResult.fileSize,
  });
};

/**
 * Voice message content structure
 */
export interface ParsedVoiceMessage {
  type: 'voice';
  url: string;
  duration: number;
  waveformData: number[];
  fileSize: number;
}

/**
 * Parses a voice message from content string
 */
export const parseVoiceMessage = (content: string): ParsedVoiceMessage | null => {
  try {
    const data = JSON.parse(content);
    if (data.type === 'voice') {
      return {
        type: 'voice',
        url: data.url,
        duration: data.duration,
        waveformData: data.waveformData || [],
        fileSize: data.fileSize || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Checks if a message content is a voice message
 */
export const isVoiceMessage = (content: string): boolean => {
  try {
    const data = JSON.parse(content);
    return data.type === 'voice';
  } catch {
    return false;
  }
};
