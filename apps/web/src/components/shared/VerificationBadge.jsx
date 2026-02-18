import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Verification status constants
 */
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

/**
 * Badge sizes
 */
const SIZES = {
  xs: {
    badge: 'px-1.5 py-0.5 text-[10px]',
    icon: 'w-2.5 h-2.5',
  },
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    icon: 'w-5 h-5',
  },
};

/**
 * Status configurations
 */
const STATUS_CONFIG = {
  [VERIFICATION_STATUS.PENDING]: {
    label: 'PENDING',
    shortLabel: 'Pending',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    solidBg: 'bg-yellow-500',
    icon: Clock,
    description: 'Verification in progress',
  },
  [VERIFICATION_STATUS.VERIFIED]: {
    label: 'VERIFIED',
    shortLabel: 'Verified',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/50',
    solidBg: 'bg-green-500',
    icon: CheckCircle,
    description: 'Identity verified',
  },
  [VERIFICATION_STATUS.REJECTED]: {
    label: 'REJECTED',
    shortLabel: 'Rejected',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/50',
    solidBg: 'bg-red-500',
    icon: XCircle,
    description: 'Verification failed',
  },
};

/**
 * VerificationBadge Component
 *
 * Displays user verification status as a badge
 *
 * @param {string} status - Verification status (pending, verified, rejected)
 * @param {string} size - Badge size (xs, sm, md, lg)
 * @param {boolean} showIcon - Whether to show the status icon
 * @param {boolean} showLabel - Whether to show the status label
 * @param {boolean} animated - Whether to animate the badge
 * @param {boolean} bordered - Whether to show a border
 * @param {boolean} pill - Whether to use pill shape (rounded-full)
 * @param {string} variant - Badge variant (default, solid, outline)
 * @param {string} className - Additional CSS classes
 */
const VerificationBadge = ({
  status = VERIFICATION_STATUS.PENDING,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  animated = true,
  bordered = false,
  pill = true,
  variant = 'default',
  className,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[VERIFICATION_STATUS.PENDING];
  const sizeConfig = SIZES[size] || SIZES.sm;
  const Icon = config.icon;

  // Variant styles
  const variantStyles = {
    default: cn(config.bgColor, config.textColor),
    solid: cn(config.solidBg, 'text-white'),
    outline: cn('bg-transparent', config.textColor, 'border', config.borderColor),
  };

  const Component = animated ? motion.span : 'span';
  const animationProps = animated
    ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <Component
      {...animationProps}
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        sizeConfig.badge,
        variantStyles[variant],
        pill ? 'rounded-full' : 'rounded',
        bordered && 'border',
        bordered && config.borderColor,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeConfig.icon,
            status === VERIFICATION_STATUS.PENDING && animated && 'animate-pulse'
          )}
        />
      )}
      {showLabel && <span>{config.shortLabel}</span>}
    </Component>
  );
};

/**
 * Premium/Featured badge variant
 */
export const FeaturedBadge = ({
  size = 'sm',
  showIcon = true,
  className,
}) => {
  const sizeConfig = SIZES[size] || SIZES.sm;

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
        sizeConfig.badge,
        className
      )}
    >
      {showIcon && <Shield className={sizeConfig.icon} />}
      <span>FEATURED</span>
    </motion.span>
  );
};

/**
 * New user badge (shown for first 3 days)
 */
export const NewBadge = ({
  size = 'sm',
  showIcon = true,
  className,
}) => {
  const sizeConfig = SIZES[size] || SIZES.sm;

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        'bg-blue-500/20 text-blue-400',
        sizeConfig.badge,
        className
      )}
    >
      {showIcon && <AlertTriangle className={sizeConfig.icon} />}
      <span>NEW</span>
    </motion.span>
  );
};

/**
 * Compound badge showing multiple status indicators
 */
export const ProfileStatusBadges = ({
  verificationStatus,
  isPremium = false,
  isNew = false,
  size = 'sm',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {isPremium && <FeaturedBadge size={size} />}
      {isNew && !isPremium && <NewBadge size={size} />}
      <VerificationBadge status={verificationStatus} size={size} />
    </div>
  );
};

/**
 * Verification status indicator for profile cards
 */
export const ProfileVerificationIndicator = ({
  status,
  showTooltip = true,
  className,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[VERIFICATION_STATUS.PENDING];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative group inline-flex items-center justify-center',
        className
      )}
      title={showTooltip ? config.description : undefined}
    >
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          config.bgColor
        )}
      >
        <Icon className={cn('w-3.5 h-3.5', config.textColor)} />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default VerificationBadge;
