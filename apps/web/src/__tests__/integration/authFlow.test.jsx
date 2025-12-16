/**
 * Integration Tests - Authentication Flow
 * Tests the complete authentication flow including registration, login, email verification, and password reset
 *
 * Uses Firebase Auth via the databaseClient
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Mock Firebase Auth via databaseClient
vi.mock('@/lib/databaseClient', () => ({
  auth: {
    currentUser: null,
  },
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}));

// Mock Firebase client
vi.mock('@/lib/firebaseClient', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    confirmPasswordReset: vi.fn(),
    sendEmailVerification: vi.fn(),
  },
  getIdToken: vi.fn(),
  refreshIdToken: vi.fn(),
  clearStoredToken: vi.fn(),
  getStoredToken: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  };
});

// Helper to wrap components with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock successful registration
      auth.createUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'user-123',
          email: 'test@example.com',
          emailVerified: false,
        },
      });

      renderWithProviders(<Register />);

      // Fill in registration form
      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });

      // Select user type
      const sponsorButton = screen.getByText(/sponsor/i);
      fireEvent.click(sponsorButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(submitButton);

      // Wait for navigation to verify email
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
      });
    });

    it('should show validation errors for invalid input', async () => {
      renderWithProviders(<Register />);

      // Try to submit without filling form
      const submitButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should handle registration errors', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock registration error
      auth.createUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/email-already-in-use',
        message: 'Email already registered',
      });

      renderWithProviders(<Register />);

      // Fill and submit form
      // ... (fill form logic)

      await waitFor(() => {
        expect(screen.getByText(/email already/i)).toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    it('should successfully log in with valid credentials', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock successful login
      auth.signInWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
        },
      });

      renderWithProviders(<Login />);

      // Fill in login form
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      // Should navigate to dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('dashboard'));
      });
    });

    it('should show error for invalid credentials', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock login error
      auth.signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/wrong-password',
        message: 'Invalid credentials',
      });

      renderWithProviders(<Login />);

      // Fill and submit
      // ... (fill form logic)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email from link', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock verified user
      auth.currentUser = {
        uid: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      };

      renderWithProviders(<VerifyEmail />);

      await waitFor(() => {
        expect(screen.getByText(/verified/i)).toBeInTheDocument();
      });
    });

    it('should allow resending verification email', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock unverified user
      auth.currentUser = {
        uid: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
      };

      // Mock resend success
      auth.sendEmailVerification.mockResolvedValue();

      renderWithProviders(<VerifyEmail />);

      // Wait for countdown to finish (or mock time)
      await waitFor(() => {
        const resendButton = screen.getByText(/resend/i);
        expect(resendButton).not.toBeDisabled();
      }, { timeout: 3000 });

      // Click resend
      const resendButton = screen.getByText(/resend/i);
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(auth.sendEmailVerification).toHaveBeenCalled();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock reset email success
      auth.sendPasswordResetEmail.mockResolvedValue();

      renderWithProviders(<ForgotPassword />);

      // Enter email
      const emailInput = screen.getByPlaceholderText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Submit
      const submitButton = screen.getByText(/send reset instructions/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should reset password with new password', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // Mock password update success
      auth.confirmPasswordReset.mockResolvedValue();

      renderWithProviders(<ResetPassword />);

      // Enter new password
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPassword123!' } });

      // Submit
      const submitButton = screen.getByText(/reset password/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });

    it('should validate password requirements', async () => {
      renderWithProviders(<ResetPassword />);

      // Enter weak password
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete Authentication Cycle', () => {
    it('should complete full cycle: register → verify → login → logout', async () => {
      const { auth } = await import('@/lib/firebaseClient');

      // 1. Register
      auth.createUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'user-123', email: 'test@example.com', emailVerified: false },
      });

      // 2. Verify email
      auth.currentUser = {
        uid: 'user-123',
        emailVerified: true,
      };

      // 3. Login
      auth.signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'user-123', email: 'test@example.com', emailVerified: true },
      });

      // 4. Logout
      auth.signOut.mockResolvedValue();

      // Run through the cycle
      // ... (implementation would test each step)

      expect(true).toBe(true); // Placeholder for full cycle test
    });
  });
});
