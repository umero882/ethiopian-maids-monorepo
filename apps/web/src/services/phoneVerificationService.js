/**
 * Phone Verification Service
 * Handles phone verification logic and database operations
 *
 * @module services/phoneVerificationService
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import twilioService from './twilioService';

// GraphQL Queries and Mutations
const CHECK_EXISTING_PHONE_SPONSOR = gql`
  query CheckExistingPhoneSponsor($phone_number: String!, $user_id: uuid!) {
    sponsor_profiles(
      where: {
        phone_number: { _eq: $phone_number }
        phone_verified: { _eq: true }
        user_id: { _neq: $user_id }
      }
      limit: 1
    ) {
      id
      user_id
    }
  }
`;

const CHECK_EXISTING_PHONE_MAID = gql`
  query CheckExistingPhoneMaid($phone_number: String!, $user_id: uuid!) {
    maid_profiles(
      where: {
        phone_number: { _eq: $phone_number }
        phone_verified: { _eq: true }
        user_id: { _neq: $user_id }
      }
      limit: 1
    ) {
      id
      user_id
    }
  }
`;

const DELETE_PENDING_VERIFICATIONS = gql`
  mutation DeletePendingVerifications($user_id: uuid!, $phone_number: String!) {
    delete_phone_verifications(
      where: {
        user_id: { _eq: $user_id }
        phone_number: { _eq: $phone_number }
        verified: { _eq: false }
      }
    ) {
      affected_rows
    }
  }
`;

const INSERT_PHONE_VERIFICATION = gql`
  mutation InsertPhoneVerification($object: phone_verifications_insert_input!) {
    insert_phone_verifications_one(object: $object) {
      id
      phone_number
      code_expires_at
    }
  }
`;

const DELETE_VERIFICATION_BY_ID = gql`
  mutation DeleteVerificationById($id: uuid!) {
    delete_phone_verifications_by_pk(id: $id) {
      id
    }
  }
`;

const GET_PENDING_VERIFICATION = gql`
  query GetPendingVerification($user_id: uuid!, $phone_number: String!) {
    phone_verifications(
      where: {
        user_id: { _eq: $user_id }
        phone_number: { _eq: $phone_number }
        verified: { _eq: false }
      }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      verification_code
      code_expires_at
      verified
      attempts
      max_attempts
      created_at
      phone_number
    }
  }
`;

const UPDATE_VERIFICATION_ATTEMPTS = gql`
  mutation UpdateVerificationAttempts($id: uuid!, $attempts: Int!) {
    update_phone_verifications_by_pk(
      pk_columns: { id: $id }
      _set: { attempts: $attempts }
    ) {
      id
    }
  }
`;

const MARK_VERIFICATION_COMPLETE = gql`
  mutation MarkVerificationComplete($id: uuid!, $verified_at: timestamptz!) {
    update_phone_verifications_by_pk(
      pk_columns: { id: $id }
      _set: { verified: true, verified_at: $verified_at }
    ) {
      id
    }
  }
`;

const UPDATE_SPONSOR_PHONE_VERIFIED = gql`
  mutation UpdateSponsorPhoneVerified($user_id: uuid!, $phone_number: String!, $phone_verified_at: timestamptz!) {
    update_sponsor_profiles(
      where: { user_id: { _eq: $user_id } }
      _set: { phone_number: $phone_number, phone_verified: true, phone_verified_at: $phone_verified_at }
    ) {
      affected_rows
    }
  }
`;

const UPDATE_MAID_PHONE_VERIFIED = gql`
  mutation UpdateMaidPhoneVerified($user_id: uuid!, $phone_number: String!, $phone_verified_at: timestamptz!) {
    update_maid_profiles(
      where: { user_id: { _eq: $user_id } }
      _set: { phone_number: $phone_number, phone_verified: true, phone_verified_at: $phone_verified_at }
    ) {
      affected_rows
    }
  }
`;

const CHECK_SPONSOR_PHONE_STATUS = gql`
  query CheckSponsorPhoneStatus($user_id: uuid!) {
    sponsor_profiles(where: { user_id: { _eq: $user_id } }, limit: 1) {
      phone_number
      phone_verified
    }
  }
`;

const CHECK_MAID_PHONE_STATUS = gql`
  query CheckMaidPhoneStatus($user_id: uuid!) {
    maid_profiles(where: { user_id: { _eq: $user_id } }, limit: 1) {
      phone_number
      phone_verified
    }
  }
`;

const GET_USER_PENDING_VERIFICATION = gql`
  query GetUserPendingVerification($user_id: uuid!) {
    phone_verifications(
      where: { user_id: { _eq: $user_id }, verified: { _eq: false } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      phone_number
      code_expires_at
      attempts
      max_attempts
      created_at
    }
  }
`;

class PhoneVerificationService {
  /**
   * Start phone verification process
   * @param {string} userId - User ID from auth
   * @param {string} phoneNumber - E.164 format phone number
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async startVerification(userId, phoneNumber) {
    try {
      // Validate inputs
      if (!userId) {
        return { error: { message: 'User ID is required' } };
      }

      if (!phoneNumber) {
        return { error: { message: 'Phone number is required' } };
      }

      // Format and validate phone number
      const formattedPhone = phoneNumber.trim();
      if (!twilioService.validatePhoneNumber(formattedPhone)) {
        return { error: { message: 'Invalid phone number format. Use E.164 format (e.g., +12025551234)' } };
      }

      // Check if phone is already verified by another user (sponsor)
      const { data: sponsorData } = await apolloClient.query({
        query: CHECK_EXISTING_PHONE_SPONSOR,
        variables: { phone_number: formattedPhone, user_id: userId },
        fetchPolicy: 'network-only'
      });

      if (sponsorData?.sponsor_profiles?.length > 0) {
        return { error: { message: 'This phone number is already verified by another user' } };
      }

      // Check maid profiles too
      const { data: maidData } = await apolloClient.query({
        query: CHECK_EXISTING_PHONE_MAID,
        variables: { phone_number: formattedPhone, user_id: userId },
        fetchPolicy: 'network-only'
      });

      if (maidData?.maid_profiles?.length > 0) {
        return { error: { message: 'This phone number is already verified by another user' } };
      }

      // Generate verification code
      const code = twilioService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing pending verifications for this user/phone
      await apolloClient.mutate({
        mutation: DELETE_PENDING_VERIFICATIONS,
        variables: { user_id: userId, phone_number: formattedPhone }
      });

      // Save verification to database
      const { data: verificationData } = await apolloClient.mutate({
        mutation: INSERT_PHONE_VERIFICATION,
        variables: {
          object: {
            user_id: userId,
            phone_number: formattedPhone,
            verification_code: code,
            code_expires_at: expiresAt.toISOString(),
            verified: false,
            attempts: 0,
            max_attempts: 3,
          }
        }
      });

      const verification = verificationData?.insert_phone_verifications_one;

      if (!verification) {
        console.error('Database error: Failed to create verification');
        return { error: { message: 'Failed to create verification. Please try again.' } };
      }

      // Send SMS
      const smsResult = await twilioService.sendVerificationCode(formattedPhone, code);

      if (!smsResult.success) {
        // Delete verification record if SMS fails
        await apolloClient.mutate({
          mutation: DELETE_VERIFICATION_BY_ID,
          variables: { id: verification.id }
        });

        return {
          error: {
            message: `Failed to send SMS: ${smsResult.error || 'Unknown error'}`,
          },
        };
      }

      return {
        data: {
          verificationId: verification.id,
          phoneNumber: formattedPhone,
          expiresAt: expiresAt.toISOString(),
          maskedPhone: twilioService.maskPhoneNumber(formattedPhone),
        },
      };
    } catch (error) {
      console.error('Error starting verification:', error);
      return {
        error: {
          message: error.message || 'An unexpected error occurred',
        },
      };
    }
  }

  /**
   * Verify code
   * @param {string} userId - User ID from auth
   * @param {string} phoneNumber - Phone number being verified
   * @param {string} code - 6-digit code from SMS
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async verifyCode(userId, phoneNumber, code) {
    try {
      // Validate inputs
      if (!userId || !phoneNumber || !code) {
        return { error: { message: 'Missing required fields' } };
      }

      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return { error: { message: 'Invalid code format. Must be 6 digits.' } };
      }

      // Get most recent verification record
      const { data: verificationData } = await apolloClient.query({
        query: GET_PENDING_VERIFICATION,
        variables: { user_id: userId, phone_number: phoneNumber },
        fetchPolicy: 'network-only'
      });

      const verification = verificationData?.phone_verifications?.[0];

      if (!verification) {
        return {
          error: {
            message: 'No verification found. Please request a new code.',
          },
        };
      }

      // Check expiration
      if (new Date(verification.code_expires_at) < new Date()) {
        return {
          error: {
            message: 'Verification code has expired. Please request a new code.',
          },
        };
      }

      // Check attempts
      if (verification.attempts >= verification.max_attempts) {
        return {
          error: {
            message: 'Too many failed attempts. Please request a new code.',
          },
        };
      }

      // Verify code
      if (verification.verification_code !== code) {
        // Increment attempts
        await apolloClient.mutate({
          mutation: UPDATE_VERIFICATION_ATTEMPTS,
          variables: { id: verification.id, attempts: verification.attempts + 1 }
        });

        const remainingAttempts = verification.max_attempts - verification.attempts - 1;

        return {
          error: {
            message: `Invalid code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`,
          },
        };
      }

      // Code is correct - mark as verified
      const now = new Date().toISOString();

      await apolloClient.mutate({
        mutation: MARK_VERIFICATION_COMPLETE,
        variables: { id: verification.id, verified_at: now }
      });

      // Update profile - try sponsor_profiles first
      let profileUpdated = false;

      const { data: sponsorUpdateResult } = await apolloClient.mutate({
        mutation: UPDATE_SPONSOR_PHONE_VERIFIED,
        variables: {
          user_id: userId,
          phone_number: phoneNumber,
          phone_verified_at: now
        }
      });

      if (sponsorUpdateResult?.update_sponsor_profiles?.affected_rows > 0) {
        profileUpdated = true;
      } else {
        // Try maid_profiles
        const { data: maidUpdateResult } = await apolloClient.mutate({
          mutation: UPDATE_MAID_PHONE_VERIFIED,
          variables: {
            user_id: userId,
            phone_number: phoneNumber,
            phone_verified_at: now
          }
        });

        if (maidUpdateResult?.update_maid_profiles?.affected_rows > 0) {
          profileUpdated = true;
        }
      }

      if (!profileUpdated) {
        return {
          error: {
            message: 'Phone verified but failed to update profile. Please contact support.',
          },
        };
      }

      return {
        data: {
          success: true,
          phoneNumber,
          verifiedAt: now,
        },
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        error: {
          message: error.message || 'An unexpected error occurred',
        },
      };
    }
  }

  /**
   * Resend verification code
   * @param {string} userId - User ID from auth
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async resendCode(userId, phoneNumber) {
    try {
      // Delete old pending verification
      await apolloClient.mutate({
        mutation: DELETE_PENDING_VERIFICATIONS,
        variables: { user_id: userId, phone_number: phoneNumber }
      });

      // Start new verification
      return await this.startVerification(userId, phoneNumber);
    } catch (error) {
      console.error('Error resending code:', error);
      return {
        error: {
          message: error.message || 'Failed to resend code',
        },
      };
    }
  }

  /**
   * Check if phone number is verified for user
   * @param {string} userId - User ID from auth
   * @returns {Promise<{verified: boolean, phoneNumber?: string}>}
   */
  async checkVerificationStatus(userId) {
    try {
      // Check sponsor profile
      const { data: sponsorData } = await apolloClient.query({
        query: CHECK_SPONSOR_PHONE_STATUS,
        variables: { user_id: userId },
        fetchPolicy: 'network-only'
      });

      const sponsorProfile = sponsorData?.sponsor_profiles?.[0];

      if (sponsorProfile?.phone_verified) {
        return {
          verified: true,
          phoneNumber: sponsorProfile.phone_number,
        };
      }

      // Check maid profile
      const { data: maidData } = await apolloClient.query({
        query: CHECK_MAID_PHONE_STATUS,
        variables: { user_id: userId },
        fetchPolicy: 'network-only'
      });

      const maidProfile = maidData?.maid_profiles?.[0];

      if (maidProfile?.phone_verified) {
        return {
          verified: true,
          phoneNumber: maidProfile.phone_number,
        };
      }

      return { verified: false };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { verified: false };
    }
  }

  /**
   * Get pending verification info
   * @param {string} userId - User ID from auth
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async getPendingVerification(userId) {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_PENDING_VERIFICATION,
        variables: { user_id: userId },
        fetchPolicy: 'network-only'
      });

      const verification = data?.phone_verifications?.[0];

      if (!verification) {
        return { data: null };
      }

      return {
        data: {
          verificationId: verification.id,
          phoneNumber: verification.phone_number,
          maskedPhone: twilioService.maskPhoneNumber(verification.phone_number),
          expiresAt: verification.code_expires_at,
          attempts: verification.attempts,
          maxAttempts: verification.max_attempts,
          createdAt: verification.created_at,
        },
      };
    } catch (error) {
      console.error('Error getting pending verification:', error);
      return { error };
    }
  }
}

// Export singleton instance
export const phoneVerificationService = new PhoneVerificationService();
export default phoneVerificationService;
