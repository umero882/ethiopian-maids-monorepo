import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const isDev = process.env.NODE_ENV !== 'production';
let inlineEditPlugin, editModeDevPlugin;

if (isDev) {
  inlineEditPlugin = (
    await import('./plugins/visual-editor/vite-plugin-react-inline-editor.js')
  ).default;
  editModeDevPlugin = (
    await import('./plugins/visual-editor/vite-plugin-edit-mode.js')
  ).default;
}

// Removed insecure error handlers that posed XSS risks
// Error handling is now handled by React Error Boundaries and proper logging

// Do not suppress warnings globally; keep visibility for easier debugging

const logger = createLogger();
const loggerError = logger.error;

logger.error = (msg, options) => {
  if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
    return;
  }

  loggerError(msg, options);
};

export default defineConfig(({ mode }) => {
  // Load env file from monorepo root (two levels up from apps/web)
  // By default, only env variables prefixed with `VITE_` are loaded.
  const monorepoRoot = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, monorepoRoot, '');

  // Log environment loading
  console.log('[Vite Config] Loading environment variables from:', monorepoRoot);
  console.log('[Vite Config] VITE_FIREBASE_API_KEY:', env.VITE_FIREBASE_API_KEY ? 'LOADED ✓' : 'NOT FOUND ✗');
  console.log('[Vite Config] VITE_FIREBASE_PROJECT_ID:', env.VITE_FIREBASE_PROJECT_ID ? 'LOADED ✓' : 'NOT FOUND ✗');
  console.log('[Vite Config] VITE_FIREBASE_STORAGE_BUCKET:', env.VITE_FIREBASE_STORAGE_BUCKET ? 'LOADED ✓' : 'NOT FOUND ✗');

  const isProduction = mode === 'production';

  return {
  root: path.resolve(__dirname, '.'),
  customLogger: logger,
  envDir: monorepoRoot, // Tell Vite to load .env files from monorepo root
  define: {
    // Explicitly define environment variables to ensure they're available
    // Both import.meta.env and process.env formats for cross-platform compatibility
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
    'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
    // process.env format for shared packages (api-client)
    'process.env.VITE_HASURA_GRAPHQL_ENDPOINT': JSON.stringify(env.VITE_HASURA_GRAPHQL_ENDPOINT),
    'process.env.VITE_HASURA_WS_ENDPOINT': JSON.stringify(env.VITE_HASURA_WS_ENDPOINT),
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
    'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
    'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
    'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
  },
  plugins: [
    // ...(isDev ? [inlineEditPlugin(), editModeDevPlugin()] : []), // Commented out for monorepo testing
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'images/**/*'],
      manifest: {
        name: 'Ethiopian Maids Platform',
        short_name: 'Ethio Maids',
        description: 'Ethiopian maid service platform connecting domestic workers with families',
        theme_color: '#596acd',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/images/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Increase the file size limit to accommodate large bundles
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        // Cache strategy for runtime
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for service worker update
        skipWaiting: true,
        // Claim clients immediately
        clientsClaim: true
      }
    })
  ],
  server: {
    cors: true,
    allowedHosts: true,
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    // Deduplicate React to prevent "Cannot read properties of null (reading 'useRef'/'useMemo')" errors
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force single React instance across all packages
      'react': path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      // Workspace package aliases - Monorepo packages
      '@ethio/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      // Note: @ethio/app is intentionally not aliased here due to deep TypeScript dependency issues
      // with the domain and infra packages. The ServiceFactory stub in useServiceFactory.jsx handles this.
      // Domain packages
      '@ethio/domain-identity': path.resolve(__dirname, '../../packages/domain/identity/src/index.ts'),
      '@ethio/domain-profiles': path.resolve(__dirname, '../../packages/domain/profiles/src/index.ts'),
      '@ethio/domain-jobs': path.resolve(__dirname, '../../packages/domain/jobs/src/index.ts'),
      '@ethio/domain-communications': path.resolve(__dirname, '../../packages/domain/communications/src/index.ts'),
      '@ethio/domain-payments': path.resolve(__dirname, '../../packages/domain/payments/src/index.ts'),
      '@ethio/domain-chat': path.resolve(__dirname, '../../packages/domain/chat/src/index.ts'),
      // Application packages
      '@ethio/app-identity': path.resolve(__dirname, '../../packages/app/identity/src/index.ts'),
      '@ethio/app-profiles': path.resolve(__dirname, '../../packages/app/profiles/src/index.ts'),
      '@ethio/app-jobs': path.resolve(__dirname, '../../packages/app/jobs/src/index.ts'),
      '@ethio/app-communications': path.resolve(__dirname, '../../packages/app/communications/src/index.ts'),
      // Infrastructure packages
      '@ethio/infra-web-identity': path.resolve(__dirname, '../../packages/infra/web/identity/src/index.ts'),
      '@ethio/infra-web-profiles': path.resolve(__dirname, '../../packages/infra/web/profiles/src/index.ts'),
      '@ethio/infra-web-jobs': path.resolve(__dirname, '../../packages/infra/web/jobs/src/index.ts'),
      '@ethio/infra-web-communications': path.resolve(__dirname, '../../packages/infra/web/communications/src/index.ts'),
      // Legacy local packages (deprecated - kept for backward compatibility)
      '@ethio-maids/domain-dashboard': path.resolve(__dirname, './packages/domain/dashboard/index.js'),
      '@ethio-maids/domain-profiles': path.resolve(__dirname, './packages/domain/profiles/index.js'),
      '@ethio-maids/app-dashboard-agency': path.resolve(__dirname, './packages/app/dashboard-agency/index.js'),
      '@ethio-maids/app-profiles-agency': path.resolve(__dirname, './packages/app/profiles-agency/index.js'),
      '@ethio-maids/infra-dashboard-agency': path.resolve(__dirname, './packages/infra/dashboard-agency/index.js'),
      '@ethio-maids/infra-profiles-agency': path.resolve(__dirname, './packages/infra/profiles-agency/index.js'),
    },
  },
  esbuild: isProduction ? {
    drop: ['console', 'debugger'],
  } : {},
  build: {
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      external: [
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types',
      ],
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-apollo': ['@apollo/client', 'graphql'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot', 'class-variance-authority', 'lucide-react'],
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-charts': ['recharts'],
          'vendor-animation': ['framer-motion'],
        }
      },
    },
  },
};
});
