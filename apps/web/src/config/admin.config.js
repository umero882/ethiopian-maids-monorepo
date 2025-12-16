/**
 * Admin Panel Configuration
 *
 * Set ADMIN_DEVELOPMENT_MODE to true to enable development mode
 * with mock data and no database requirements.
 *
 * SECURITY NOTE: This file should NOT contain any secrets or credentials.
 * All sensitive values should be loaded from environment variables.
 */

// Development mode flag - set to true to use the updated .dev.jsx files with real database
// Note: Despite the naming, .dev.jsx files now have the correct real-data implementation
export const ADMIN_DEVELOPMENT_MODE = false;

// Development credentials - ONLY used in dev mode, credentials must be set via env vars
// In development mode, any valid email format will work for testing
export const DEV_ADMIN_CREDENTIALS = {
  // Credentials are validated against environment variables in dev mode
  // Set VITE_DEV_ADMIN_EMAIL and VITE_DEV_ADMIN_PASSWORD in .env.local for development
  email: import.meta.env.VITE_DEV_ADMIN_EMAIL || '',
  password: import.meta.env.VITE_DEV_ADMIN_PASSWORD || ''
};

// Mock admin user for development (non-sensitive data only)
export const DEV_ADMIN_USER = {
  id: 'dev-admin-123',
  email: import.meta.env.VITE_DEV_ADMIN_EMAIL || 'dev@localhost',
  full_name: 'Development Admin',
  role: 'super_admin',
  is_active: true,
  department: 'Development',
  created_at: new Date().toISOString(),
  last_login_at: new Date().toISOString()
};

// Feature flags for development
export const DEV_FEATURES = {
  userManagement: true,
  systemSettings: true,
  contentModeration: false,
  financialManagement: false,
  analytics: true,
  auditLogs: true
};

// Development configuration
export const DEV_CONFIG = {
  showDevelopmentBanner: true,
  enableMockData: true,
  simulateNetworkDelay: true,
  defaultNetworkDelay: 800, // ms
  logAllActions: true
};