/**
 * App Entry Point
 *
 * Redirects to tabs or auth based on authentication state
 */

import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return null; // Splash screen is still visible
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}
