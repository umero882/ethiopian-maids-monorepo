/**
 * Firebase Configuration for Mobile App (Expo)
 *
 * Uses the Firebase JS SDK with custom persistence using expo-secure-store.
 * This is compatible with Expo managed workflow.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration - same project as web
// Note: storageBucket should be in format 'project-id.appspot.com' for older projects
// or 'project-id.firebasestorage.app' for newer projects
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'REMOVED_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ethiopian-maids.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ethiopian-maids',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ethiopian-maids.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '227663902586',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:227663902586:web:3d100f09f205d5833988c3',
};

// Initialize Firebase (only once)
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] App initialized with project:', firebaseConfig.projectId);
  console.log('[Firebase] Storage bucket:', firebaseConfig.storageBucket);
  auth = getAuth(app);
  storage = getStorage(app);
  console.log('[Firebase] Auth and Storage initialized');
  console.log('[Firebase] Storage bucket URL:', `gs://${firebaseConfig.storageBucket}`);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  storage = getStorage(app);
  console.log('[Firebase] Using existing Firebase app instance');
}

export { app, auth, storage, firebaseConfig };
export default auth;
