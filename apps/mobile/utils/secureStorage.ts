/**
 * Secure Storage Utility
 *
 * Wrapper around expo-secure-store for storing sensitive data
 * like authentication tokens.
 */

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user_data',
  SESSION: 'auth_session',
} as const;

/**
 * Save a value to secure storage
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error saving to secure storage [${key}]:`, error);
    throw error;
  }
}

/**
 * Get a value from secure storage
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error reading from secure storage [${key}]:`, error);
    return null;
  }
}

/**
 * Delete a value from secure storage
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error deleting from secure storage [${key}]:`, error);
  }
}

// Auth-specific storage functions
export const authStorage = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await setSecureItem(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await setSecureItem(KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  async getAccessToken(): Promise<string | null> {
    return getSecureItem(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getSecureItem(KEYS.REFRESH_TOKEN);
  },

  async saveSession(session: object): Promise<void> {
    await setSecureItem(KEYS.SESSION, JSON.stringify(session));
  },

  async getSession(): Promise<object | null> {
    const session = await getSecureItem(KEYS.SESSION);
    if (session) {
      try {
        return JSON.parse(session);
      } catch {
        return null;
      }
    }
    return null;
  },

  async saveUserData(userData: object): Promise<void> {
    await setSecureItem(KEYS.USER_DATA, JSON.stringify(userData));
  },

  async getUserData(): Promise<object | null> {
    const userData = await getSecureItem(KEYS.USER_DATA);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      deleteSecureItem(KEYS.ACCESS_TOKEN),
      deleteSecureItem(KEYS.REFRESH_TOKEN),
      deleteSecureItem(KEYS.USER_DATA),
      deleteSecureItem(KEYS.SESSION),
    ]);
  },
};

export { KEYS as STORAGE_KEYS };
