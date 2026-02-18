import React from 'react';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * VerificationGuard Component
 *
 * Wraps interactive elements and prevents action if user is not verified.
 * Shows a disabled state and tooltip explaining why the action is blocked.
 *
 * @param {React.ReactNode} children - The child element to wrap
 * @param {string} action - Description of the action (e.g., "send messages")
 * @param {boolean} showOverlay - Whether to show an overlay on the wrapped content
 * @param {Function} onBlocked - Callback when action is blocked
 * @param {string} className - Additional CSS classes
 */
const VerificationGuard = ({
  children,
  action = 'perform this action',
  showOverlay = false,
  onBlocked,
  className,
}) => {
  const { isVerified, isPending, isRejected, checkPermission } = useVerificationStatus();

  // If verified, render children normally
  if (isVerified) {
    return children;
  }

  // Handle click on guarded element
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!checkPermission(action)) {
      onBlocked?.();
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Overlay to block interaction */}
      {showOverlay && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px] rounded-lg z-10 flex items-center justify-center cursor-not-allowed"
          onClick={handleClick}
        >
          <div className="text-center p-4">
            <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white text-sm font-medium">Verification Required</p>
            <p className="text-gray-400 text-xs mt-1">
              {isPending
                ? 'Your account is being verified'
                : 'Verification failed'}
            </p>
          </div>
        </div>
      )}

      {/* Wrapped children with disabled styling */}
      <div
        className={cn(
          'cursor-not-allowed opacity-60',
          !showOverlay && 'pointer-events-none'
        )}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * VerificationGuardedButton
 *
 * A button that requires verification to be clicked.
 * Shows a lock icon when verification is pending.
 */
export const VerificationGuardedButton = ({
  children,
  action = 'perform this action',
  onClick,
  className,
  ...props
}) => {
  const { isVerified, isPending, checkPermission } = useVerificationStatus();

  const handleClick = (e) => {
    if (isVerified) {
      onClick?.(e);
    } else {
      e.preventDefault();
      checkPermission(action);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      className={cn(
        className,
        !isVerified && 'opacity-70 cursor-not-allowed'
      )}
    >
      {!isVerified && (
        <Lock className="w-4 h-4 mr-2" />
      )}
      {children}
    </Button>
  );
};

/**
 * WithVerificationCheck HOC
 *
 * Higher-order component that adds verification checking to any component.
 *
 * @param {React.Component} Component - The component to wrap
 * @param {string} action - Description of the action
 */
export const withVerificationCheck = (Component, action) => {
  return function VerificationCheckedComponent(props) {
    const { isVerified, checkPermission } = useVerificationStatus();

    const handleAction = (callback) => {
      return (...args) => {
        if (checkPermission(action)) {
          callback?.(...args);
        }
      };
    };

    return (
      <Component
        {...props}
        isVerified={isVerified}
        onVerifiedAction={handleAction}
      />
    );
  };
};

/**
 * useVerificationGuard Hook
 *
 * Hook version for more flexible usage in functional components.
 *
 * @param {string} action - Description of the action
 * @returns {Object} Guard utilities
 */
export const useVerificationGuard = (action) => {
  const { isVerified, checkPermission } = useVerificationStatus();

  const guardedAction = (callback) => {
    return (...args) => {
      if (checkPermission(action)) {
        return callback?.(...args);
      }
    };
  };

  const canPerformAction = () => {
    return isVerified;
  };

  const requireVerification = () => {
    return checkPermission(action);
  };

  return {
    isVerified,
    guardedAction,
    canPerformAction,
    requireVerification,
  };
};

export default VerificationGuard;
