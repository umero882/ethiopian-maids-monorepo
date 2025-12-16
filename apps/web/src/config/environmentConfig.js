/**
 * Environment Configuration Manager
 * Centralized, validated environment configuration for Firebase/Hasura backend
 */

// =============================================
// ENVIRONMENT VALIDATION SCHEMA
// =============================================

const requiredEnvVars = {
  // Hasura GraphQL Configuration
  VITE_HASURA_ENDPOINT: {
    required: false,
    type: 'string',
    description: 'Hasura GraphQL endpoint URL',
  },
  VITE_HASURA_WS_ENDPOINT: {
    required: false,
    type: 'string',
    description: 'Hasura WebSocket endpoint for subscriptions',
  },

  // Firebase Configuration
  VITE_FIREBASE_API_KEY: {
    required: false,
    type: 'string',
    description: 'Firebase API key',
  },
  VITE_FIREBASE_AUTH_DOMAIN: {
    required: false,
    type: 'string',
    description: 'Firebase auth domain',
  },
  VITE_FIREBASE_PROJECT_ID: {
    required: false,
    type: 'string',
    description: 'Firebase project ID',
  },
  VITE_FIREBASE_STORAGE_BUCKET: {
    required: false,
    type: 'string',
    description: 'Firebase storage bucket',
  },

  // Application Configuration
  VITE_APP_NAME: {
    required: false,
    type: 'string',
    default: 'Ethiopian Maids Platform',
    description: 'Application name',
  },
  VITE_APP_VERSION: {
    required: false,
    type: 'string',
    default: '1.0.0',
    description: 'Application version',
  },
  VITE_APP_ENVIRONMENT: {
    required: false,
    type: 'enum',
    values: ['development', 'staging', 'production'],
    default: 'development',
    description: 'Application environment',
  },

  // Feature Flags
  VITE_ENABLE_CHAT: {
    required: false,
    type: 'boolean',
    default: true,
    description: 'Enable chat functionality',
  },
  VITE_ENABLE_VIDEO_CALLS: {
    required: false,
    type: 'boolean',
    default: false,
    description: 'Enable video call functionality',
  },
  VITE_ENABLE_ANALYTICS: {
    required: false,
    type: 'boolean',
    default: true,
    description: 'Enable analytics tracking',
  },

  // External Services
  VITE_STRIPE_PUBLISHABLE_KEY: {
    required: false,
    type: 'string',
    description: 'Stripe publishable key for payments',
  },
  VITE_GOOGLE_ANALYTICS_ID: {
    required: false,
    type: 'string',
    description: 'Google Analytics tracking ID',
  },

  // ElevenLabs Voice Agent Configuration
  VITE_ELEVENLABS_AGENT_ID: {
    required: false,
    type: 'string',
    default: 'agent_5301k3h9y7cbezt8kq5s38a0857h',
    description: 'ElevenLabs ConvAI agent ID (public identifier, safe to expose)',
  },

  // API Configuration
  VITE_API_TIMEOUT: {
    required: false,
    type: 'number',
    default: 30000,
    description: 'API request timeout in milliseconds',
  },
  VITE_MAX_FILE_SIZE: {
    required: false,
    type: 'number',
    default: 5242880, // 5MB
    description: 'Maximum file upload size in bytes',
  },

  // Security Configuration
  VITE_ENABLE_MOCK_DATA: {
    required: false,
    type: 'boolean',
    default: false,
    description: 'Enable mock data for development',
  },
  VITE_ENABLE_DEBUG_MODE: {
    required: false,
    type: 'boolean',
    default: false,
    description: 'Enable debug mode',
  },
};

// =============================================
// VALIDATION FUNCTIONS
// =============================================

const validators = {
  string: (value, config) => {
    if (typeof value !== 'string') return false;
    if (config.minLength && value.length < config.minLength) return false;
    if (config.maxLength && value.length > config.maxLength) return false;
    return true;
  },

  number: (value, config) => {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (config.min && num < config.min) return false;
    if (config.max && num > config.max) return false;
    return true;
  },

  boolean: (value) => {
    return (
      value === 'true' || value === 'false' || value === true || value === false
    );
  },

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  enum: (value, config) => {
    return config.values.includes(value);
  },
};

// =============================================
// CONFIGURATION CLASS
// =============================================

class EnvironmentConfig {
  constructor() {
    this.config = {};
    this.errors = [];
    this.warnings = [];
    this.isValid = false;

    this.loadAndValidate();
  }

  loadAndValidate() {
    try {
      console.log('Loading environment configuration...');

      // Load all environment variables
      Object.entries(requiredEnvVars).forEach(([key, schema]) => {
        try {
          const value = this.getEnvValue(key, schema);
          this.config[key] = value;

          // Validate the value
          this.validateValue(key, value, schema);
        } catch (error) {
          console.error(`Error loading ${key}:`, error.message);
          this.errors.push(`Error loading ${key}: ${error.message}`);
        }
      });

      // Check if configuration is valid
      this.isValid = this.errors.length === 0;

      // Log results
      this.logValidationResults();

      // Only throw error if critical configuration is missing and we're not in development
      if (
        !this.isValid &&
        this.hasCriticalErrors() &&
        !this.isDevelopmentFallback()
      ) {
        console.error(
          'Critical environment configuration errors, but continuing with fallbacks...'
        );
      }
    } catch (error) {
      console.error('Failed to load environment configuration:', error);
      // Set fallback configuration
      this.setFallbackConfiguration();
    }
  }

  getEnvValue(key, schema) {
    let value = import.meta.env[key];

    // Use default if value is not provided
    if (value === undefined || value === '') {
      if (schema.default !== undefined) {
        value = schema.default;
      } else if (schema.required) {
        this.errors.push(`Required environment variable ${key} is missing`);
        return null;
      }
    }

    // Convert boolean strings
    if (schema.type === 'boolean' && typeof value === 'string') {
      value = value.toLowerCase() === 'true';
    }

    // Convert number strings
    if (schema.type === 'number' && typeof value === 'string') {
      value = Number(value);
    }

    return value;
  }

  validateValue(key, value, schema) {
    if (value === null || value === undefined) {
      if (schema.required) {
        this.errors.push(`${key}: Required value is missing`);
      }
      return;
    }

    // Type validation
    const validator = validators[schema.type];
    if (validator && !validator(value, schema)) {
      this.errors.push(`${key}: Invalid ${schema.type} value`);
      return;
    }

    // Additional validations
    if (
      schema.type === 'url' &&
      !value.startsWith('https://') &&
      this.isProduction()
    ) {
      this.warnings.push(`${key}: Should use HTTPS in production`);
    }
  }

  hasCriticalErrors() {
    const criticalVars = ['VITE_HASURA_ENDPOINT', 'VITE_FIREBASE_PROJECT_ID'];
    return this.errors.some((error) =>
      criticalVars.some((critical) => error.includes(critical))
    );
  }

  isDevelopmentFallback() {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  setFallbackConfiguration() {
    console.warn('Setting fallback configuration for development...');
    this.config = {
      VITE_HASURA_ENDPOINT:
        import.meta.env.VITE_HASURA_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql',
      VITE_HASURA_WS_ENDPOINT:
        import.meta.env.VITE_HASURA_WS_ENDPOINT || 'wss://ethio-maids-01.hasura.app/v1/graphql',
      VITE_APP_NAME: 'Ethiopian Maids Platform',
      VITE_APP_VERSION: '1.0.0',
      VITE_APP_ENVIRONMENT: 'development',
      VITE_ENABLE_CHAT: true,
      VITE_ENABLE_VIDEO_CALLS: false,
      VITE_ENABLE_ANALYTICS: false,
      VITE_ENABLE_MOCK_DATA: true,
      VITE_ENABLE_DEBUG_MODE: true,
      VITE_API_TIMEOUT: 30000,
      VITE_MAX_FILE_SIZE: 5242880,
      VITE_ELEVENLABS_AGENT_ID: 'agent_5301k3h9y7cbezt8kq5s38a0857h',
    };
    this.isValid = true;
    this.errors = [];
  }

  logValidationResults() {
    if (this.isValid) {
      console.log('Environment configuration is valid');
    } else {
      console.error('Environment configuration has errors:');
      this.errors.forEach((error) => console.error(error));
    }

    if (this.warnings.length > 0) {
      console.warn('Environment configuration warnings:');
      this.warnings.forEach((warning) => console.warn(warning));
    }

    // Log loaded configuration in development
    if (this.isDevelopment()) {
      console.log('Loaded configuration:', this.getSafeConfig());
    }
  }

  // =============================================
  // GETTER METHODS
  // =============================================

  get(key) {
    return this.config[key];
  }

  getHasuraConfig() {
    return {
      endpoint: this.get('VITE_HASURA_ENDPOINT') ?? import.meta.env.VITE_HASURA_ENDPOINT,
      wsEndpoint: this.get('VITE_HASURA_WS_ENDPOINT') ?? import.meta.env.VITE_HASURA_WS_ENDPOINT,
    };
  }

  getFirebaseConfig() {
    return {
      apiKey: this.get('VITE_FIREBASE_API_KEY') ?? import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: this.get('VITE_FIREBASE_AUTH_DOMAIN') ?? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: this.get('VITE_FIREBASE_PROJECT_ID') ?? import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: this.get('VITE_FIREBASE_STORAGE_BUCKET') ?? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    };
  }

  getAppConfig() {
    return {
      name: this.get('VITE_APP_NAME'),
      version: this.get('VITE_APP_VERSION'),
      environment: this.get('VITE_APP_ENVIRONMENT'),
    };
  }

  getFeatureFlags() {
    return {
      chat: this.get('VITE_ENABLE_CHAT'),
      videoCalls: this.get('VITE_ENABLE_VIDEO_CALLS'),
      analytics: this.get('VITE_ENABLE_ANALYTICS'),
      mockData: this.get('VITE_ENABLE_MOCK_DATA'),
      debugMode: this.get('VITE_ENABLE_DEBUG_MODE'),
    };
  }

  getApiConfig() {
    return {
      timeout: this.get('VITE_API_TIMEOUT'),
      maxFileSize: this.get('VITE_MAX_FILE_SIZE'),
    };
  }

  getElevenLabsConfig() {
    return {
      agentId: this.get('VITE_ELEVENLABS_AGENT_ID'),
      // apiKey is not exposed to frontend for security reasons
      // Use Firebase Cloud Functions to interact with ElevenLabs API
    };
  }

  getExternalServices() {
    return {
      stripe: {
        publishableKey: this.get('VITE_STRIPE_PUBLISHABLE_KEY'),
      },
      googleAnalytics: {
        trackingId: this.get('VITE_GOOGLE_ANALYTICS_ID'),
      },
    };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  isDevelopment() {
    return this.get('VITE_APP_ENVIRONMENT') === 'development';
  }

  isStaging() {
    return this.get('VITE_APP_ENVIRONMENT') === 'staging';
  }

  isProduction() {
    return this.get('VITE_APP_ENVIRONMENT') === 'production';
  }

  isFeatureEnabled(feature) {
    const flags = this.getFeatureFlags();
    return flags[feature] === true;
  }

  getSafeConfig() {
    // Return config without sensitive data for logging
    const safe = { ...this.config };

    // Mask sensitive values
    Object.keys(safe).forEach((key) => {
      if (
        key.includes('KEY') ||
        key.includes('SECRET') ||
        key.includes('TOKEN')
      ) {
        safe[key] = safe[key] ? '***masked***' : safe[key];
      }
    });

    return safe;
  }

  // =============================================
  // RUNTIME CONFIGURATION UPDATES
  // =============================================

  updateFeatureFlag(feature, enabled) {
    const key = `VITE_ENABLE_${feature.toUpperCase()}`;
    if (this.config.hasOwnProperty(key)) {
      this.config[key] = enabled;
      console.log(`Feature flag updated: ${feature} = ${enabled}`);
    }
  }

  // =============================================
  // CONFIGURATION EXPORT
  // =============================================

  exportConfig() {
    return {
      hasura: this.getHasuraConfig(),
      firebase: this.getFirebaseConfig(),
      app: this.getAppConfig(),
      features: this.getFeatureFlags(),
      api: this.getApiConfig(),
      external: this.getExternalServices(),
      elevenLabs: this.getElevenLabsConfig(),
      utils: {
        isDevelopment: this.isDevelopment(),
        isStaging: this.isStaging(),
        isProduction: this.isProduction(),
        isFeatureEnabled: this.isFeatureEnabled.bind(this),
      },
    };
  }
}

// =============================================
// EXPORT SINGLETON INSTANCE
// =============================================

export const envConfig = new EnvironmentConfig();
export const config = envConfig.exportConfig();

// Export individual configurations for convenience
export const hasuraConfig = config.hasura;
export const firebaseConfig = config.firebase;
export const appConfig = config.app;
export const featureFlags = config.features;
export const apiConfig = config.api;
export const externalServices = config.external;
export const elevenLabsConfig = config.elevenLabs;

// Export utility functions
export const { isDevelopment, isStaging, isProduction, isFeatureEnabled } =
  config.utils;
