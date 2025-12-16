/**
 * ðŸ§ª Test Setup
 * Global test configuration and mocks with memory management
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { setupTest, cleanupTest } from '@/utils/testUtils.jsx';

// Memory management - run garbage collection if available
const runGC = () => {
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }
};

// Setup global test environment
beforeEach(() => {
  setupTest();
  runGC(); // Run garbage collection before each test
});

// Cleanup after each test
afterEach(() => {
  cleanupTest();
  runGC(); // Run garbage collection after each test
});

// Mock environment variables
process.env.VITE_HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
process.env.VITE_HASURA_WS_ENDPOINT = 'wss://test.hasura.app/v1/graphql';
process.env.VITE_APP_ENVIRONMENT = 'test';

// Mock import.meta.env for Vite
global.importMeta = {
  env: {
    VITE_HASURA_ENDPOINT: 'https://test.hasura.app/v1/graphql',
    VITE_HASURA_WS_ENDPOINT: 'wss://test.hasura.app/v1/graphql',
    VITE_APP_ENVIRONMENT: 'test',
    DEV: false,
    PROD: false,
    MODE: 'test',
  },
};

// Mock browser APIs for testing
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
  writable: true,
});

// Mock Performance Observer
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
});

// Mock validation schemas
vi.mock('@/lib/validationSchemas', () => ({
  userRegistrationSchema: {
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 8 },
    confirmPassword: { required: true },
    name: { required: true },
    userType: { required: true },
  },
  maidProfileSchema: {
    fullName: { required: true },
    age: { required: true, min: 18 },
    nationality: { required: true },
    experienceYears: { required: true, min: 0 },
    skills: { required: true },
    languages: { required: true },
  },
  sponsorProfileSchema: {
    companyName: { required: true },
    contactPerson: { required: true },
  },
  jobPostingSchema: {
    title: { required: true },
    description: { required: true },
  },
  fileUploadSchema: {
    file: { required: true },
  },
  validateSchema: vi.fn((schema, data) => {
    const errors = {};
    let isValid = true;

    // Simple validation logic for testing
    Object.keys(schema).forEach((field) => {
      const rules = schema[field];
      const value = data[field];

      if (rules.required && (!value || value === '')) {
        errors[field] = `${field} is required`;
        isValid = false;
      }

      if (rules.type === 'email' && value && !value.includes('@')) {
        errors[field] = `${field} must be a valid email`;
        isValid = false;
      }

      if (rules.minLength && value && value.length < rules.minLength) {
        errors[field] =
          `${field} must be at least ${rules.minLength} characters`;
        isValid = false;
      }

      if (rules.min && value && value < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`;
        isValid = false;
      }
    });

    return { isValid, errors };
  }),
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

// Mock AuthContext to provide a safe default when tests don't wrap providers
vi.mock('@/contexts/AuthContext', () => {
  const actual = vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { id: 'test-user', userType: 'maid' },
      loading: false,
      session: { user: { id: 'test-user', userType: 'maid' } },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      updateRegistrationStatus: vi.fn(),
      updateUserProfileData: vi.fn(),
      fixUserType: vi.fn(),
    })),
  };
});

// Mock environment config
vi.mock('@/config/environmentConfig', () => ({
  envConfig: {
    get: vi.fn((key) => {
      const mockEnv = {
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_HASURA_GRAPHQL_URL: 'https://test.hasura.app/v1/graphql',
        VITE_APP_ENVIRONMENT: 'test',
      };
      return mockEnv[key];
    }),
    updateFeatureFlag: vi.fn(),
  },
  databaseConfig: {
    hasuraUrl: 'https://test.hasura.app/v1/graphql',
    firebaseProjectId: 'test-project',
  },
  appConfig: {
    name: 'Ethiopian Maids Platform',
    version: '1.0.0',
    environment: 'test',
  },
  featureFlags: {
    chat: true,
    videoCalls: false,
    analytics: false,
    mockData: true,
    debugMode: true,
  },
  apiConfig: {
    timeout: 30000,
    maxFileSize: 5242880,
  },
  isDevelopment: vi.fn(() => false),
  isProduction: vi.fn(() => false),
  isFeatureEnabled: vi.fn(() => true),
}));

// Mock secure config
vi.mock('@/lib/secureConfig', () => ({
  getSecureConfig: vi.fn(() => ({
    firebase: {
      apiKey: 'test-api-key',
      projectId: 'test-project',
    },
    hasura: {
      url: 'https://test.hasura.app/v1/graphql',
    },
  })),
  validateClientConfig: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
  isSecureContext: vi.fn(() => true),
  clientConfig: {
    firebase: {
      apiKey: 'test-api-key',
      projectId: 'test-project',
    },
    hasura: {
      url: 'https://test.hasura.app/v1/graphql',
    },
    app: {
      environment: 'test',
      useMockData: true,
    },
  },
}));

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: null })),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: null })),
  signOut: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(() => Promise.resolve({ ref: {} })),
  getDownloadURL: vi.fn(() => Promise.resolve('test-url')),
  deleteObject: vi.fn(() => Promise.resolve()),
}));

// Mock Apollo Client
vi.mock('@ethio/api-client', () => ({
  apolloClient: {
    query: vi.fn(() => Promise.resolve({ data: null, errors: null })),
    mutate: vi.fn(() => Promise.resolve({ data: null, errors: null })),
    subscribe: vi.fn(() => ({ subscribe: vi.fn() })),
  },
}));

// Mock React Router hooks only (preserve actual router components for tests that need them)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    // Only mock the hooks with safe defaults
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    // Keep actual router components (BrowserRouter, MemoryRouter, Routes, etc.)
  };
});

// Mock UI Components
vi.mock('@/components/ui/card', () => {
  const mockReact = require('react');
  return {
    Card: ({ children, ...props }) =>
      mockReact.createElement(
        'div',
        { ...props, 'data-testid': 'card' },
        children
      ),
    CardContent: ({ children, ...props }) =>
      mockReact.createElement(
        'div',
        { ...props, 'data-testid': 'card-content' },
        children
      ),
    CardHeader: ({ children, ...props }) =>
      mockReact.createElement(
        'div',
        { ...props, 'data-testid': 'card-header' },
        children
      ),
    CardTitle: ({ children, ...props }) =>
      mockReact.createElement(
        'h3',
        { ...props, 'data-testid': 'card-title' },
        children
      ),
  };
});

vi.mock('@/components/ui/button', () => {
  const mockReact = require('react');
  return {
    Button: ({ children, ...props }) =>
      mockReact.createElement(
        'button',
        { ...props, 'data-testid': 'button' },
        children
      ),
  };
});

vi.mock('@/components/ui/badge', () => {
  const mockReact = require('react');
  return {
    Badge: ({ children, ...props }) =>
      mockReact.createElement(
        'span',
        { ...props, 'data-testid': 'badge' },
        children
      ),
  };
});

vi.mock('@/components/ui/avatar', () => {
  const mockReact = require('react');
  return {
    Avatar: ({ children, ...props }) =>
      mockReact.createElement(
        'div',
        { ...props, 'data-testid': 'avatar' },
        children
      ),
    AvatarFallback: ({ children, ...props }) =>
      mockReact.createElement(
        'div',
        { ...props, 'data-testid': 'avatar-fallback' },
        children
      ),
    AvatarImage: ({ children, ...props }) =>
      mockReact.createElement(
        'img',
        { ...props, 'data-testid': 'avatar-image' },
        children
      ),
  };
});

// Mock Framer Motion
vi.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: ({ children, ...props }) =>
        mockReact.createElement('div', props, children),
      span: ({ children, ...props }) =>
        mockReact.createElement('span', props, children),
      button: ({ children, ...props }) =>
        mockReact.createElement('button', props, children),
      img: ({ children, ...props }) =>
        mockReact.createElement('img', props, children),
    },
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
  };
});

// Mock file uploads
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.size = properties?.size || 1024;
    this.type = properties?.type || 'text/plain';
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readAsDataURL = vi.fn();
    this.result = 'data:image/jpeg;base64,test';
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
});

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => '12345678-1234-1234-1234-123456789012'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock Navigator API
Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('')),
    },
    userAgent: 'jest-test-user-agent',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
  },
  writable: true,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

// Console error suppression for known issues
const originalError = console.error;
console.error = (...args) => {
  // Suppress specific warnings that are expected in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
      args[0].includes('Warning: componentWillReceiveProps') ||
      args[0].includes('act(...) is not supported'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Global test utilities
global.waitFor = require('@testing-library/react').waitFor;
global.screen = require('@testing-library/react').screen;
global.render = require('@testing-library/react').render;
global.fireEvent = require('@testing-library/react').fireEvent;
global.userEvent = require('@testing-library/user-event').default;

