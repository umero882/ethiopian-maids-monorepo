/**
 * WhatsApp Flow Media Handler
 *
 * Downloads media from WhatsApp CDN, decrypts per WhatsApp media spec,
 * and uploads to Firebase Storage.
 *
 * WhatsApp Flow media fields (PhotoPicker/DocumentPicker) provide:
 *   { media_id, cdn_url, file_name, encryption_metadata? }
 *
 * For now, we use the WhatsApp Cloud API to download media by media_id
 * since cdn_url may require additional auth. The Graph API endpoint:
 *   GET https://graph.facebook.com/{api_version}/{media_id}
 *   → returns { url } → GET url with Bearer token → binary data
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

interface MediaItem {
  media_id?: string;
  cdn_url?: string;
  file_name?: string;
  mime_type?: string;
  encryption_metadata?: {
    encryption_key: string;
    hmac_key: string;
    iv: string;
    plaintext_hash: string;
  };
}

interface UploadResult {
  storage_path: string;
  download_url: string;
  file_name: string;
  content_type: string;
}

function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
  };
}

/**
 * Download media from WhatsApp by media_id using Graph API.
 * Step 1: GET /{media_id} → { url }
 * Step 2: GET url → binary
 */
async function downloadWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const config = getWhatsAppConfig();
  if (!config.accessToken) {
    throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
  }

  // Step 1: Get media URL
  const metaUrl = `https://graph.facebook.com/${config.apiVersion}/${mediaId}`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  if (!metaRes.ok) {
    throw new Error(`Failed to get media URL: ${metaRes.status} ${metaRes.statusText}`);
  }
  const metaData = await metaRes.json() as { url: string; mime_type?: string };

  // Step 2: Download binary
  const mediaRes = await fetch(metaData.url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  if (!mediaRes.ok) {
    throw new Error(`Failed to download media: ${mediaRes.status} ${mediaRes.statusText}`);
  }

  const arrayBuf = await mediaRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuf),
    mimeType: metaData.mime_type || 'application/octet-stream',
  };
}

/**
 * Decrypt WhatsApp media if encryption metadata is provided.
 * WhatsApp uses AES-256-CBC with HMAC-SHA256 for media encryption.
 */
function decryptWhatsAppMedia(
  encryptedBuffer: Buffer,
  encMeta: NonNullable<MediaItem['encryption_metadata']>
): Buffer {
  const encKey = Buffer.from(encMeta.encryption_key, 'base64');
  const hmacKey = Buffer.from(encMeta.hmac_key, 'base64');
  const iv = Buffer.from(encMeta.iv, 'base64');

  // Separate HMAC (last 10 bytes) from ciphertext
  const hmac = encryptedBuffer.subarray(encryptedBuffer.length - 10);
  const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 10);

  // Verify HMAC
  const hmacCalc = crypto.createHmac('sha256', hmacKey);
  hmacCalc.update(iv);
  hmacCalc.update(ciphertext);
  const expectedHmac = hmacCalc.digest().subarray(0, 10);
  if (!crypto.timingSafeEqual(hmac, expectedHmac)) {
    throw new Error('HMAC verification failed for WhatsApp media');
  }

  // Decrypt
  const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Upload buffer to Firebase Storage and return the download URL.
 */
async function uploadToFirebaseStorage(
  buffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: { contentType },
    public: true,
  });

  // Return public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  return publicUrl;
}

/**
 * Guess content type from file name or fallback.
 */
function guessContentType(fileName: string, fallback: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
    webm: 'video/webm',
  };
  return map[ext] || fallback;
}

/**
 * Process media items from a WhatsApp Flow screen.
 * Downloads from WhatsApp, optionally decrypts, uploads to Firebase Storage.
 *
 * @param mediaItems - Array of media objects from PhotoPicker/DocumentPicker
 * @param userId - Firebase Auth UID (used in storage path)
 * @param category - Storage category: 'profile', 'documents', 'gallery', 'cv'
 * @returns Array of upload results with Firebase Storage URLs
 */
export async function processFlowMedia(
  mediaItems: unknown,
  userId: string,
  category: string
): Promise<UploadResult[]> {
  if (!mediaItems || !Array.isArray(mediaItems) || mediaItems.length === 0) {
    return [];
  }

  const results: UploadResult[] = [];

  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i] as MediaItem;
    if (!item.media_id && !item.cdn_url) continue;

    try {
      // Download
      let buffer: Buffer;
      let mimeType: string;

      if (item.media_id) {
        const downloaded = await downloadWhatsAppMedia(item.media_id);
        buffer = downloaded.buffer;
        mimeType = downloaded.mimeType;
      } else {
        // Direct CDN download fallback
        const res = await fetch(item.cdn_url!);
        if (!res.ok) throw new Error(`CDN download failed: ${res.status}`);
        buffer = Buffer.from(await res.arrayBuffer());
        mimeType = item.mime_type || 'application/octet-stream';
      }

      // Decrypt if encrypted
      if (item.encryption_metadata) {
        buffer = decryptWhatsAppMedia(buffer, item.encryption_metadata);
      }

      // Determine file name and content type
      const fileName = item.file_name || `${category}_${i}.${mimeType.split('/')[1] || 'bin'}`;
      const contentType = guessContentType(fileName, mimeType);

      // Upload
      const storagePath = `users/${userId}/${category}/${fileName}`;
      const downloadUrl = await uploadToFirebaseStorage(buffer, storagePath, contentType);

      results.push({
        storage_path: storagePath,
        download_url: downloadUrl,
        file_name: fileName,
        content_type: contentType,
      });

      console.log(`[MediaHandler] Uploaded ${storagePath}`);
    } catch (error) {
      console.error(`[MediaHandler] Failed to process media item ${i}:`, error);
      // Continue with remaining items
    }
  }

  return results;
}
