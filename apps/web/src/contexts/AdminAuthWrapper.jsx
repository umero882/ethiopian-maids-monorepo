// PRODUCTION MODE ONLY - Always use real Firebase Auth + Hasura
// No development/mock mode switching
import {
  AdminAuthProvider as ProdAdminAuthProvider,
  useAdminAuth as useProdAdminAuth
} from '@/contexts/AdminAuthContext';

// Export production provider and hook directly
export const AdminAuthProvider = ProdAdminAuthProvider;
export const useAdminAuth = useProdAdminAuth;