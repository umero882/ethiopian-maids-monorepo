import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

/**
 * Verification status constants
 */
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

/**
 * Hook to check user verification status and restrict interactions
 *
 * All users show "PENDING" badge after registration until admin approval.
 * Restricted interactions until verified:
 * - Cannot send messages
 * - Cannot show interest in maids
 * - Cannot apply for jobs
 * - Cannot contact sponsors/agencies
 * - Cannot post jobs
 * - Cannot add maids (for agencies)
 *
 * @returns {Object} Verification status and permission checks
 */
export const useVerificationStatus = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Get current verification status
  const verificationStatus = useMemo(() => {
    return profile?.verification_status || VERIFICATION_STATUS.PENDING;
  }, [profile?.verification_status]);

  // Status checks
  const isVerified = verificationStatus === VERIFICATION_STATUS.VERIFIED;
  const isPending = verificationStatus === VERIFICATION_STATUS.PENDING;
  const isRejected = verificationStatus === VERIFICATION_STATUS.REJECTED;

  // Get rejection reason if rejected
  const rejectionReason = useMemo(() => {
    return profile?.rejection_reason || null;
  }, [profile?.rejection_reason]);

  // Permission checks - all require verified status
  const canSendMessage = isVerified;
  const canShowInterest = isVerified;
  const canApplyForJob = isVerified;
  const canContactMaid = isVerified;
  const canContactSponsor = isVerified;
  const canContactAgency = isVerified;
  const canPostJob = isVerified;
  const canAddMaid = isVerified;
  const canMakeBooking = isVerified;
  const canLeaveReview = isVerified;

  /**
   * Show pending verification toast
   * @param {string} action - The action that was attempted
   */
  const showPendingModal = useCallback((action) => {
    toast({
      title: 'Verification Required',
      description: `You need to be verified before you can ${action}. Your documents are being reviewed by our team. This usually takes 24-48 hours.`,
      variant: 'warning',
      duration: 5000,
    });
  }, [toast]);

  /**
   * Show rejected status toast
   */
  const showRejectedModal = useCallback(() => {
    toast({
      title: 'Verification Rejected',
      description: rejectionReason || 'Your verification was rejected. Please contact support for more information.',
      variant: 'destructive',
      duration: 7000,
    });
  }, [toast, rejectionReason]);

  /**
   * Check if action is allowed and show appropriate message if not
   * @param {string} action - The action to check (e.g., 'send messages', 'apply for jobs')
   * @returns {boolean} Whether the action is allowed
   */
  const checkPermission = useCallback((action) => {
    if (isVerified) {
      return true;
    }

    if (isRejected) {
      showRejectedModal();
      return false;
    }

    if (isPending) {
      showPendingModal(action);
      return false;
    }

    return false;
  }, [isVerified, isRejected, isPending, showPendingModal, showRejectedModal]);

  /**
   * Get verification progress checklist items
   */
  const verificationChecklist = useMemo(() => {
    const items = [];

    // Profile completed
    items.push({
      label: 'Profile completed',
      completed: Boolean(profile?.full_name),
    });

    // Documents uploaded
    const hasDocuments = profile?.id_document_url || profile?.face_photo_url;
    items.push({
      label: 'Documents uploaded',
      completed: Boolean(hasDocuments),
    });

    // Admin review
    items.push({
      label: 'Admin review in progress',
      completed: isVerified,
      pending: isPending,
    });

    return items;
  }, [profile, isVerified, isPending]);

  /**
   * Get status display info
   */
  const statusInfo = useMemo(() => {
    switch (verificationStatus) {
      case VERIFICATION_STATUS.VERIFIED:
        return {
          label: 'Verified',
          color: 'green',
          bgColor: 'bg-green-500',
          textColor: 'text-green-400',
          borderColor: 'border-green-500',
          icon: 'check',
        };
      case VERIFICATION_STATUS.REJECTED:
        return {
          label: 'Rejected',
          color: 'red',
          bgColor: 'bg-red-500',
          textColor: 'text-red-400',
          borderColor: 'border-red-500',
          icon: 'x',
        };
      case VERIFICATION_STATUS.PENDING:
      default:
        return {
          label: 'Pending',
          color: 'yellow',
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500',
          icon: 'clock',
        };
    }
  }, [verificationStatus]);

  return {
    // Status
    verificationStatus,
    isVerified,
    isPending,
    isRejected,
    rejectionReason,

    // Permissions
    canSendMessage,
    canShowInterest,
    canApplyForJob,
    canContactMaid,
    canContactSponsor,
    canContactAgency,
    canPostJob,
    canAddMaid,
    canMakeBooking,
    canLeaveReview,

    // Actions
    showPendingModal,
    showRejectedModal,
    checkPermission,

    // Display info
    statusInfo,
    verificationChecklist,
  };
};

export default useVerificationStatus;
