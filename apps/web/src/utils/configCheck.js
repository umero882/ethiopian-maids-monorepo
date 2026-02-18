/**
 * Configuration Check Utility
 * Validates that all required environment variables are properly configured
 * Updated for Firebase + Hasura architecture
 */

/**
 * Check all required configurations
 * @returns {Object} Complete configuration status
 */
export function checkAllConfigurations() {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  };

  const hasuraConfig = {
    graphqlUrl: import.meta.env.VITE_HASURA_GRAPHQL_URL,
    // adminSecret removed - not used in client apps
  };

  return {
    firebase: {
      isConfigured: !!(firebaseConfig.apiKey && firebaseConfig.projectId),
      config: {
        apiKey: firebaseConfig.apiKey
          ? `${firebaseConfig.apiKey.substring(0, 10)}...`
          : 'Not set',
        projectId: firebaseConfig.projectId || 'Not set',
        authDomain: firebaseConfig.authDomain || 'Not set',
      },
    },
    hasura: {
      isConfigured: !!hasuraConfig.graphqlUrl,
      config: {
        graphqlUrl: hasuraConfig.graphqlUrl
          ? `${hasuraConfig.graphqlUrl.substring(0, 30)}...`
          : 'Not set',
        // adminSecret: removed from client for security
      },
    },
    mockData: {
      enabled: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    },
  };
}

/**
 * Log configuration status to console
 */
export function logConfigurationStatus() {
  const config = checkAllConfigurations();

  console.group('🔧 Configuration Status');

  // Firebase Configuration
  console.group('🔥 Firebase');
  console.log(
    'Status:',
    config.firebase.isConfigured ? '✅ Configured' : '❌ Not Configured'
  );
  console.groupEnd();

  // Hasura Configuration
  console.group('📊 Hasura GraphQL');
  console.log(
    'Status:',
    config.hasura.isConfigured ? '✅ Configured' : '❌ Not Configured'
  );
  console.groupEnd();

  // Mock Data
  console.group('🎭 Mock Data');
  console.log('Enabled:', config.mockData.enabled);
  console.groupEnd();

  console.groupEnd();

  return config;
}

// Auto-run configuration check in development
if (import.meta.env.DEV) {
  // Delay to ensure environment is loaded
  setTimeout(() => {
    logConfigurationStatus();
  }, 1000);
}
