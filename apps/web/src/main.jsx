import * as Sentry from '@sentry/react';

// Initialize Sentry error monitoring (only when DSN is configured)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@ethio/api-client';
import App from '@/App';
import '@/index.css';
import '@/styles/animations.css';
import { initializePerformanceMonitoring } from '@/utils/performanceOptimizer';
import '@/lib/globalShims';

// Initialize performance monitoring
try {
  initializePerformanceMonitoring();
  if (import.meta.env.DEV) console.log('Performance monitoring initialized');
} catch (error) {
  console.error('Performance monitoring failed:', error);
}

if (import.meta.env.DEV) {
  console.log('main.jsx is loading...');
  console.log('Apollo Client initialized with Hasura endpoint');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
