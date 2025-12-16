/**
 * Chat Attachment Utilities
 *
 * Handles uploading, parsing, and formatting chat attachments
 * Synced with mobile app format for consistency
 */

import { uploadFile } from '@/lib/firebaseStorage';

/**
 * Upload an image for chat
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export async function uploadChatImage(file, userId, conversationId, onProgress) {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `chat/${conversationId}/images/${userId}_${timestamp}_${sanitizedName}`;

  const result = await uploadFile(path, file, { onProgress });

  return {
    url: result.url,
    path: result.path,
    type: 'image',
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

/**
 * Upload a document for chat
 * @param {File} file - Document file
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export async function uploadChatDocument(file, userId, conversationId, onProgress) {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `chat/${conversationId}/documents/${userId}_${timestamp}_${sanitizedName}`;

  const result = await uploadFile(path, file, { onProgress });

  return {
    url: result.url,
    path: result.path,
    type: 'document',
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

/**
 * Format an attachment as message content (JSON string)
 * @param {Object} uploadResult - Upload result from uploadChatImage/uploadChatDocument
 * @param {string} caption - Optional caption
 * @returns {string} JSON string for message content
 */
export function formatAttachmentMessage(uploadResult, caption = '') {
  return JSON.stringify({
    type: uploadResult.type,
    url: uploadResult.url,
    fileName: uploadResult.fileName,
    fileSize: uploadResult.fileSize,
    mimeType: uploadResult.mimeType,
    caption: caption,
  });
}

/**
 * Parse an attachment message back to object
 * @param {string} content - Message content (JSON string)
 * @returns {Object|null} Parsed attachment or null
 */
export function parseAttachmentMessage(content) {
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
}

/**
 * Parse a location message
 * @param {string} content - Message content
 * @returns {Object|null} Location data or null
 */
export function parseLocationMessage(content) {
  try {
    const data = JSON.parse(content);
    if (data.type === 'location') {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        mapUrl: data.mapUrl,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a message content is an attachment
 * @param {string} content - Message content
 * @returns {boolean}
 */
export function isAttachmentMessage(content) {
  try {
    const data = JSON.parse(content);
    return data.type === 'image' || data.type === 'document' || data.type === 'location';
  } catch {
    return false;
  }
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get file icon name based on mime type
 * @param {string} mimeType - File MIME type
 * @returns {string} Icon name for lucide-react
 */
export function getFileIcon(mimeType) {
  if (!mimeType) return 'File';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.includes('pdf')) return 'FileText';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'FileText';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'FileSpreadsheet';
  return 'File';
}

/**
 * Download a file from URL
 * @param {string} url - File URL
 * @param {string} fileName - File name for download
 */
export function downloadFile(url, fileName) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
