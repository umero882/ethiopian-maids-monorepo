// PRODUCTION MODE ONLY - Always use real Firebase Auth + Hasura
// No development/mock mode switching
import { useAdminAuth as useAdminAuthProd } from '@/contexts/AdminAuthContext';

// Export production hook directly
export const useAdminAuth = useAdminAuthProd;
