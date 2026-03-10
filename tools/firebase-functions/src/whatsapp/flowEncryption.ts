/**
 * WhatsApp Flow Encryption/Decryption
 *
 * Implements Meta's WhatsApp Flow encryption spec:
 * - Request: RSA-OAEP decrypt AES key, then AES-128-GCM decrypt body
 * - Response: AES-128-GCM encrypt with flipped IV
 *
 * Reference: https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint
 */

import * as crypto from 'crypto';

interface DecryptedRequest {
  decryptedBody: Record<string, unknown>;
  aesKeyBuffer: Buffer;
  initialVectorBuffer: Buffer;
}

/**
 * Decrypt incoming WhatsApp Flow request.
 *
 * Meta sends:
 *   { encrypted_aes_key, encrypted_flow_data, initial_vector }
 *
 * Steps:
 * 1. RSA-OAEP decrypt the AES key using our private key
 * 2. AES-128-GCM decrypt the flow data using the decrypted AES key + IV
 */
export function decryptFlowRequest(
  body: { encrypted_aes_key: string; encrypted_flow_data: string; initial_vector: string },
  privateKeyPem: string,
  passphrase: string
): DecryptedRequest {
  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

  // Decode base64 inputs
  const encryptedAesKey = Buffer.from(encrypted_aes_key, 'base64');
  const encryptedFlowData = Buffer.from(encrypted_flow_data, 'base64');
  const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

  // Step 1: RSA-OAEP decrypt the AES key
  const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    passphrase,
  });

  const aesKeyBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedAesKey
  );

  // Step 2: AES-128-GCM decrypt the flow data
  // Last 16 bytes are the GCM auth tag
  const TAG_LENGTH = 16;
  const encryptedData = encryptedFlowData.subarray(0, encryptedFlowData.length - TAG_LENGTH);
  const authTag = encryptedFlowData.subarray(encryptedFlowData.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-128-gcm', aesKeyBuffer, initialVectorBuffer);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  const decryptedBody = JSON.parse(decrypted.toString('utf-8'));

  return { decryptedBody, aesKeyBuffer, initialVectorBuffer };
}

/**
 * Encrypt outgoing WhatsApp Flow response.
 *
 * Steps:
 * 1. Flip the IV bytes (XOR with 0xFF)
 * 2. AES-128-GCM encrypt with flipped IV
 * 3. Return base64(ciphertext + authTag)
 */
export function encryptFlowResponse(
  response: Record<string, unknown>,
  aesKeyBuffer: Buffer,
  initialVectorBuffer: Buffer
): string {
  // Flip the IV
  const flippedIv = Buffer.alloc(initialVectorBuffer.length);
  for (let i = 0; i < initialVectorBuffer.length; i++) {
    flippedIv[i] = ~initialVectorBuffer[i] & 0xff;
  }

  const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, flippedIv);
  const plaintext = JSON.stringify(response);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return encrypted.toString('base64');
}
