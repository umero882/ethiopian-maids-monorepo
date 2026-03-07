import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/generated/**',
      '**/archive/**',
      '**/*.dev.jsx',
      '**/*.backup',
      '**/test/**',
      '**/__tests__/**',
      'apps/mobile/**',
      'apps/web/packages/**',
    ],
  },

  // Base JS/JSX config
  {
    ...js.configs.recommended,
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Console - warn in dev, stripped in production by Vite
      'no-console': ['warn', { allow: ['error'] }],

      // React
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/no-danger': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/jsx-no-target-blank': 'error',

      // React Hooks
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      // Code quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Security
      'no-script-url': 'error',

      // Allow common patterns
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-prototype-builtins': 'off',
    },
  },

  // TypeScript files - ignore (no TS parser installed, TS compiler handles checks)
  {
    ignores: ['**/*.{ts,tsx}'],
  },
];
