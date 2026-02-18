import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProfileCompletionGuard - Defense-in-depth route protection
 *
 * This guard ensures users with incomplete profiles cannot access protected routes.
 * It serves as a secondary protection layer after DashboardGateway.
 *
 * Usage:
 * <Route element={<ProfileCompletionGuard><DashboardLayout /></ProfileCompletionGuard>}>
 *   <Route path="dashboard" element={<Dashboard />} />
 * </Route>
 *
 * Or as a wrapper:
 * <ProfileCompletionGuard>
 *   <SponsorDashboard />
 * </ProfileCompletionGuard>
 */
const ProfileCompletionGuard = ({ children, redirectTo = '/get-started' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4'></div>
          <p className='text-lg text-gray-700'>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    console.log('[ProfileCompletionGuard] No user, redirecting to login');
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Profile incomplete - redirect to complete profile
  if (user.registration_complete !== true) {
    console.log('[ProfileCompletionGuard] Profile incomplete, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Profile complete - render children
  return children;
};

export default ProfileCompletionGuard;
