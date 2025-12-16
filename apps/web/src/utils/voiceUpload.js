/**
 * Voice Upload Utility for Web Chat
 *
 * Handles uploading voice messages to Firebase Storage
 */

import { uploadFile } from '@/lib/firebaseStorage';

/**
 * Uploads a voice message to Firebase Storage
 * @param {Blob} blob - Audio blob
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {number} duration - Duration in seconds
 * @param {number[]} waveformData - Waveform amplitude data
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export async function uploadVoice(
  blob,
  userId,
  conversationId,
  duration,
  waveformData,
  onProgress
) {
  const timestamp = Date.now();

  // Determine file extension based on blob type
  let ext = 'webm';
  const mimeType = blob.type || 'audio/webm';
  if (mimeType.includes('mp4')) {
    ext = 'm4a';
  } else if (mimeType.includes('ogg')) {
    ext = 'ogg';
  } else if (mimeType.includes('wav')) {
    ext = 'wav';
  }

  const fileName = `voice_${timestamp}.${ext}`;
  const filePath = `chat/${conversationId}/voice/${userId}_${fileName}`;

  console.log('[voiceUpload] Starting voice upload:', {
    filePath,
    size: blob.size,
    mimeType,
    duration,
  });

  try {
    const result = await uploadFile(filePath, blob, {
      onProgress,
      metadata: {
        userId,
        conversationId,
        duration: String(duration),
        mimeType,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log('[voiceUpload] Upload complete:', result.url.substring(0, 50));

    return {
      url: result.url,
      path: result.path,
      duration,
      waveformData,
      fileSize: blob.size,
      mimeType,
    };
  } catch (error) {
    console.error('[voiceUpload] Upload failed:', error);
    throw error;
  }
}

/**
 * Formats a voice message for sending via GraphQL
 * @param {Object} uploadResult - Result from uploadVoice
 * @returns {string} JSON string for message content
 */
export function formatVoiceMessage(uploadResult) {
  return JSON.stringify({
    type: 'voice',
    url: uploadResult.url,
    duration: uploadResult.duration,
    waveformData: uploadResult.waveformData,
    fileSize: uploadResult.fileSize,
  });
}

/**
 * Parses a voice message from content string
 * @param {string} content - Message content
 * @returns {Object|null} Parsed voice message or null
 */
export function parseVoiceMessage(content) {
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
}

/**
 * Checks if a message content is a voice message
 * @param {string} content - Message content
 * @returns {boolean}
 */
export function isVoiceMessage(content) {
  try {
    const data = JSON.parse(content);
    return data.type === 'voice';
  } catch {
    return false;
  }
}
