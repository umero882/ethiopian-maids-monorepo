/**
 * Firebase Admin SDK Initialization
 *
 * This module initializes the Firebase Admin SDK with service account credentials.
 * Used for server-side operations like user migration, setting custom claims, etc.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account credentials
const serviceAccountPath = join(__dirname, 'serviceAccount.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log('Service account loaded successfully');
  console.log('Project ID:', serviceAccount.project_id);
} catch (error) {
  console.error('Failed to load service account:', error.message);
  console.error('Make sure serviceAccount.json exists in tools/firebase-admin/');
  process.exit(1);
}

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  console.log('Firebase Admin SDK initialized');
}

// Export admin and auth for use in other scripts
export const firebaseAdmin = admin;
export const auth = admin.auth();

export default admin;
