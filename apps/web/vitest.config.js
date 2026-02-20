import { defineConfig } from 'vitest/config';
import path from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ethio/app': path.resolve(__dirname, '../../packages/app/src/index.ts'),
      '@ethio/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      '@ethio/domain-identity': path.resolve(__dirname, '../../packages/domain/identity/src/index.ts'),
      '@ethio/domain-profiles': path.resolve(__dirname, '../../packages/domain/profiles/src/index.ts'),
      '@ethio/domain-jobs': path.resolve(__dirname, '../../packages/domain/jobs/src/index.ts'),
      '@ethio/domain-communications': path.resolve(__dirname, '../../packages/domain/communications/src/index.ts'),
      '@ethio/app-identity': path.resolve(__dirname, '../../packages/app/identity/src/index.ts'),
      '@ethio/app-profiles': path.resolve(__dirname, '../../packages/app/profiles/src/index.ts'),
      '@ethio/app-jobs': path.resolve(__dirname, '../../packages/app/jobs/src/index.ts'),
      '@ethio/app-communications': path.resolve(__dirname, '../../packages/app/communications/src/index.ts'),
      '@ethio/infra-web-identity': path.resolve(__dirname, '../../packages/infra/web/identity/src/index.ts'),
      '@ethio/infra-web-profiles': path.resolve(__dirname, '../../packages/infra/web/profiles/src/index.ts'),
      '@ethio/infra-web-jobs': path.resolve(__dirname, '../../packages/infra/web/jobs/src/index.ts'),
      '@ethio/infra-web-communications': path.resolve(__dirname, '../../packages/infra/web/communications/src/index.ts'),
    },
  },
});
