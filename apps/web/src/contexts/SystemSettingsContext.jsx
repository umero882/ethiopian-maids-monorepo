import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

const GET_SYSTEM_SETTINGS = gql`
  query GetSystemSettings {
    system_settings {
      setting_key
      setting_value
    }
  }
`;

const DEFAULTS = {
  maintenance_mode: false,
  maintenance_scheduled_start: null,
  maintenance_scheduled_end: null,
  new_registrations: true,
  platform_name: 'Ethiopian Maids',
  max_upload_size: 5 * 1024 * 1024, // 5MB in bytes
  require_email_verification: false,
  session_timeout: 1440, // 24 hours in minutes
  max_login_attempts: 5,
  support_email: '',
};

const SystemSettingsContext = createContext({
  settings: DEFAULTS,
  loaded: false,
  refresh: () => {},
});

export function SystemSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SYSTEM_SETTINGS,
        fetchPolicy: 'network-only',
      });

      const rows = data?.system_settings || [];
      const merged = { ...DEFAULTS };

      rows.forEach(({ setting_key, setting_value }) => {
        merged[setting_key] = setting_value;
      });

      setSettings(merged);
      _updateSettingsCache(merged);
    } catch {
      // On failure, keep defaults so site isn't blocked
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <SystemSettingsContext.Provider value={{ settings, loaded, refresh: loadSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  return useContext(SystemSettingsContext);
}

/**
 * Get a single setting value synchronously (for non-React code).
 * Reads from a module-level cache populated by the provider.
 */
let _cachedSettings = { ...DEFAULTS };

export function getSystemSetting(key) {
  return _cachedSettings[key] ?? DEFAULTS[key];
}

// Internal: called by provider to update the cache
export function _updateSettingsCache(settings) {
  _cachedSettings = { ...settings };
}
