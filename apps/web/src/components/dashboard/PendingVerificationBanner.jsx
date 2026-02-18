import React from 'react';
import { motion } from 'framer-motion';
import { useVerificationStatus, VERIFICATION_STATUS } from '@/hooks/useVerificationStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  FileText,
  User,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Banner displayed on dashboard when user verification is pending or rejected
 * Shows verification progress and status
 */
const PendingVerificationBanner = ({ className }) => {
  const { user } = useAuth();
  const {
    verificationStatus,
    isVerified,
    isPending,
    isRejected,
    rejectionReason,
    statusInfo,
    verificationChecklist,
  } = useVerificationStatus();

  // Don't show if verified
  if (isVerified) {
    return null;
  }

  // Get status icon
  const StatusIcon = isPending ? Clock : isRejected ? XCircle : CheckCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 mb-6',
        isPending && 'bg-yellow-500/10 border-yellow-500/30',
        isRejected && 'bg-red-500/10 border-red-500/30',
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Status Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
            isPending && 'bg-yellow-500/20',
            isRejected && 'bg-red-500/20'
          )}
        >
          <StatusIcon
            className={cn(
              'w-6 h-6',
              isPending && 'text-yellow-400',
              isRejected && 'text-red-400'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium uppercase',
                isPending && 'bg-yellow-500/20 text-yellow-400',
                isRejected && 'bg-red-500/20 text-red-400'
              )}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Title & Description */}
          {isPending && (
            <>
              <h3 className="text-white font-semibold text-lg mb-1">
                Your account is being verified
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Our team is reviewing your documents. This usually takes 24-48 hours.
                You'll receive a notification once verified.
              </p>
            </>
          )}

          {isRejected && (
            <>
              <h3 className="text-white font-semibold text-lg mb-1">
                Verification was not approved
              </h3>
              <p className="text-gray-400 text-sm mb-2">
                {rejectionReason || 'Your documents could not be verified. Please review the requirements and resubmit.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resubmit Documents
              </Button>
            </>
          )}

          {/* Checklist (only for pending) */}
          {isPending && (
            <div className="space-y-2">
              {verificationChecklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : item.pending ? (
                    <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      item.completed ? 'text-green-400' : 'text-gray-400'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Restricted actions notice */}
          {isPending && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400 font-medium">
                  Limited access until verified
                </span>
              </div>
              <p className="text-xs text-gray-400">
                While pending, you cannot send messages, show interest in profiles,
                or make bookings. You can still browse and complete your profile.
              </p>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Compact version for use in sidebars or smaller spaces
 */
export const PendingVerificationBadge = ({ className }) => {
  const { isPending, isRejected, statusInfo } = useVerificationStatus();

  if (!isPending && !isRejected) {
    return null;
  }

  const StatusIcon = isPending ? Clock : XCircle;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        isPending && 'bg-yellow-500/20 text-yellow-400',
        isRejected && 'bg-red-500/20 text-red-400',
        className
      )}
    >
      <StatusIcon className="w-3 h-3" />
      {statusInfo.label}
    </div>
  );
};

/**
 * Inline warning for restricted actions
 */
export const VerificationRequiredInline = ({ action, className }) => {
  const { isPending, isRejected } = useVerificationStatus();

  if (!isPending && !isRejected) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg text-xs',
        isPending && 'bg-yellow-500/10 text-yellow-400',
        isRejected && 'bg-red-500/10 text-red-400',
        className
      )}
    >
      <Shield className="w-4 h-4" />
      <span>
        {isPending
          ? `Verification required to ${action}`
          : `Verification rejected. Cannot ${action}`}
      </span>
    </div>
  );
};

export default PendingVerificationBanner;
