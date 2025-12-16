import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebaseClient';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminAuthContext');

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

const ADMIN_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users.read', 'users.write', 'users.delete',
    'content.read', 'content.moderate',
    'financial.read', 'financial.write',
    'system.read', 'system.write',
    'whatsapp.read', 'whatsapp.write'
  ],
  MODERATOR: [
    'users.read', 'content.read', 'content.moderate',
    'support.read', 'support.write',
    'whatsapp.read'
  ],
  SUPPORT_AGENT: [
    'users.read', 'support.read', 'support.write',
    'communications.read', 'communications.write',
    'whatsapp.read', 'whatsapp.write'
  ],
  FINANCIAL_ADMIN: [
    'users.read', 'financial.read', 'financial.write',
    'transactions.read', 'subscriptions.write'
  ],
  CONTENT_MODERATOR: [
    'content.read', 'content.moderate', 'media.read',
    'profiles.moderate', 'reviews.moderate'
  ]
};

// GraphQL queries for admin
// Query by email since Firebase UID may not match the uuid id in admin_users table
const GET_ADMIN_PROFILE = gql`
  query GetAdminProfile($email: String!) {
    admin_users(where: { email: { _eq: $email }, is_active: { _eq: true } }, limit: 1) {
      id
      email
      full_name
      role
      is_active
      last_login_at
      created_at
    }
  }
`;

const UPDATE_ADMIN_LAST_LOGIN = gql`
  mutation UpdateAdminLastLogin($userId: uuid!) {
    update_admin_users(where: { id: { _eq: $userId } }, _set: { last_login_at: "now()" }) {
      affected_rows
    }
  }
`;

const LOG_ADMIN_ACTIVITY = gql`
  mutation LogAdminActivity(
    $adminId: uuid!
    $action: String!
    $resourceType: String!
    $resourceId: String
    $details: jsonb
    $userAgent: String
  ) {
    insert_admin_activity_logs_one(object: {
      admin_id: $adminId
      action: $action
      resource_type: $resourceType
      resource_id: $resourceId
      details: $details
      user_agent: $userAgent
    }) {
      id
    }
  }
`;

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  const logAdminActivity = useCallback(async (action, resourceType, resourceId, details = {}) => {
    if (!adminUser) return;

    try {
      await apolloClient.mutate({
        mutation: LOG_ADMIN_ACTIVITY,
        variables: {
          adminId: adminUser.id,
          action,
          resourceType,
          resourceId: resourceId || null,
          details,
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      log.error('Failed to log admin activity:', error);
    }
  }, [adminUser]);

  const hasPermission = useCallback((permission) => {
    if (!adminUser || !permissions.length) return false;
    return permissions.includes('*') || permissions.includes(permission);
  }, [adminUser, permissions]);

  const canAccess = useCallback((resource, action = 'read') => {
    return hasPermission(`${resource}.${action}`);
  }, [hasPermission]);

  const fetchAdminProfile = useCallback(async (user) => {
    if (!user) return null;

    try {
      log.debug('Fetching admin profile for:', user.email);

      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_PROFILE,
        variables: { email: user.email },
        fetchPolicy: 'network-only'
      });

      if (errors || !data?.admin_users?.length) {
        log.error('Admin profile not found or inactive for email:', user.email);
        return null;
      }

      const adminProfile = data.admin_users[0];

      // Set permissions based on role
      const userPermissions = ADMIN_PERMISSIONS[adminProfile.role?.toUpperCase()] || [];
      setPermissions(userPermissions);

      // Update last login using the admin_users id (uuid)
      try {
        await apolloClient.mutate({
          mutation: UPDATE_ADMIN_LAST_LOGIN,
          variables: { userId: adminProfile.id }
        });
      } catch (updateError) {
        log.warn('Failed to update last login:', updateError);
      }

      log.debug('Admin profile loaded successfully:', adminProfile);
      return adminProfile;
    } catch (error) {
      log.error('Error fetching admin profile:', error);
      return null;
    }
  }, []);

  const loginAdmin = useCallback(async (credentials) => {
    setLoading(true);
    try {
      log.debug('Starting admin login process');

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      log.debug('Firebase login successful, fetching admin profile');
      const adminProfile = await fetchAdminProfile(user);

      if (!adminProfile) {
        await signOut(auth);
        throw new Error('Access denied: Admin privileges required');
      }

      setSession({ user });
      setAdminUser(adminProfile);

      // Log activity
      try {
        await apolloClient.mutate({
          mutation: LOG_ADMIN_ACTIVITY,
          variables: {
            adminId: adminProfile.id,
            action: 'login',
            resourceType: 'admin',
            resourceId: adminProfile.id,
            details: {},
            userAgent: navigator.userAgent
          }
        });
      } catch (logError) {
        log.warn('Failed to log login activity:', logError);
      }

      toast({
        title: 'Welcome Back',
        description: `Logged in as ${adminProfile.full_name}`,
      });

      log.debug('Admin login successful');
      return { user, adminProfile };
    } catch (error) {
      log.error('Admin login failed:', error.code, error.message);

      // Provide user-friendly error messages for Firebase auth errors
      let errorMessage = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      }

      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchAdminProfile]);

  const logoutAdmin = useCallback(async () => {
    setLoading(true);
    try {
      if (adminUser) {
        await logAdminActivity('logout', 'admin', adminUser.id);
      }

      await signOut(auth);
      setAdminUser(null);
      setSession(null);
      setPermissions([]);

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
    } catch (error) {
      log.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [adminUser, logAdminActivity]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        const adminProfile = await fetchAdminProfile(user);
        if (adminProfile) {
          setSession({ user });
          setAdminUser(adminProfile);
        } else {
          // User is not an admin
          setAdminUser(null);
          setSession(null);
          setPermissions([]);
        }
      } else {
        setAdminUser(null);
        setSession(null);
        setPermissions([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAdminProfile]);

  const value = {
    adminUser,
    session,
    loading,
    permissions,
    loginAdmin,
    logoutAdmin,
    hasPermission,
    canAccess,
    logAdminActivity,
    isDevelopmentMode: false // Production context - always false
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
