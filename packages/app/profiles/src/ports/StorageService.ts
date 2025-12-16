/**
 * StorageService Port (Interface)
 *
 * Defines the contract for file storage operations (documents, photos).
 * Implementations could be Supabase Storage, S3, etc.
 */

export interface UploadParams {
  file: Buffer | Blob | File;
  filename: string;
  bucket: string;
  folder?: string;
  metadata?: {
    contentType?: string;
    [key: string]: any;
  };
}

export interface UploadResult {
  url: string;
  path: string;
}

export interface ValidationRules {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export abstract class StorageService {
  /**
   * Upload a file
   */
  abstract upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Delete a file
   */
  abstract delete(path: string, bucket: string): Promise<boolean>;

  /**
   * Get signed URL for temporary access
   */
  abstract getSignedUrl(path: string, bucket: string, expiresIn?: number): Promise<string>;

  /**
   * Get public URL for a file
   */
  abstract getPublicUrl(path: string, bucket: string): Promise<string>;

  /**
   * Validate file (size, type, etc.)
   */
  abstract validateFile(file: any, rules: ValidationRules): Promise<ValidationResult>;
}
