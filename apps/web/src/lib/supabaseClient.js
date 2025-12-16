/**
 * DEPRECATED: This file is kept only for backwards compatibility with .dev files.
 * The application has been migrated from Supabase to Firebase + Hasura.
 *
 * DO NOT use this in production code - use apolloClient from @ethio/api-client instead.
 */

console.warn('supabaseClient is deprecated. Use apolloClient from @ethio/api-client instead.');

// Stub implementation to prevent import errors in .dev files
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase is deprecated') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase is deprecated') }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: function() { return this; },
    insert: function() { return this; },
    update: function() { return this; },
    delete: function() { return this; },
    eq: function() { return this; },
    single: () => Promise.resolve({ data: null, error: new Error('Supabase is deprecated') }),
    order: function() { return this; },
    limit: function() { return this; },
    range: function() { return this; },
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: new Error('Supabase is deprecated') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      download: () => Promise.resolve({ data: null, error: new Error('Supabase is deprecated') }),
      remove: () => Promise.resolve({ error: new Error('Supabase is deprecated') }),
    }),
  },
};

export default supabase;
