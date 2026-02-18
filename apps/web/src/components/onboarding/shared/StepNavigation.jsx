import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Check, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

const StepNavigation = ({
  onNext,
  onPrevious,
  onSkip,
  showPrevious = true,
  showNext = true,
  showSkip = false,
  isFirstStep = false,
  isLastStep = false,
  isLoading = false,
  isDisabled = false,
  nextLabel,
  previousLabel,
  skipLabel = 'Skip',
  className,
  variant = 'default', // 'default' | 'solid'
}) => {
  const getNextLabel = () => {
    if (nextLabel) return nextLabel;
    if (isLastStep) return 'Complete';
    return 'Continue';
  };

  const getPreviousLabel = () => {
    if (previousLabel) return previousLabel;
    return 'Back';
  };

  const buttonBase = variant === 'solid'
    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    : 'bg-white/10 text-white hover:bg-white/20 border-white/20';

  const primaryButton = 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn('flex items-center gap-3 mt-6', className)}
    >
      {/* Previous button */}
      {showPrevious && !isFirstStep && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onPrevious}
          disabled={isLoading}
          className={cn('flex-1', buttonBase)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {getPreviousLabel()}
        </Button>
      )}

      {/* Skip button (for optional steps) */}
      {showSkip && onSkip && (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onSkip}
          disabled={isLoading}
          className={cn(
            'flex-shrink-0',
            variant === 'solid' ? 'text-gray-500 hover:text-gray-700' : 'text-white/60 hover:text-white'
          )}
        >
          {skipLabel}
          <SkipForward className="w-4 h-4 ml-1" />
        </Button>
      )}

      {/* Next/Complete button */}
      {showNext && (
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={isLoading || isDisabled}
          className={cn('flex-1', primaryButton)}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Please wait...
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              {getNextLabel()}
            </>
          ) : (
            <>
              {getNextLabel()}
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
};

// Single button variant for special steps
export const SingleButton = ({
  onClick,
  label,
  icon: Icon,
  isLoading = false,
  isDisabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'outline'
  className,
}) => {
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl';
      case 'secondary':
        return 'bg-white/20 text-white hover:bg-white/30 border-white/30';
      case 'outline':
        return 'bg-transparent border-2 border-white/50 text-white hover:bg-white/10';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-6"
    >
      <Button
        type="button"
        size="lg"
        onClick={onClick}
        disabled={isLoading || isDisabled}
        className={cn('w-full', getButtonStyles(), className)}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Please wait...
          </>
        ) : (
          <>
            {Icon && <Icon className="w-5 h-5 mr-2" />}
            {label}
          </>
        )}
      </Button>
    </motion.div>
  );
};

// Action buttons for special interactions (e.g., "Verify Phone", "Capture Photo")
export const ActionButton = ({
  onClick,
  label,
  icon: Icon,
  isLoading = false,
  isDisabled = false,
  isSuccess = false,
  successLabel,
  variant = 'action', // 'action' | 'success' | 'danger'
  size = 'default', // 'sm' | 'default' | 'lg'
  className,
}) => {
  const getButtonStyles = () => {
    if (isSuccess) {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }
    switch (variant) {
      case 'action':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <Button
      type="button"
      size={size}
      onClick={onClick}
      disabled={isLoading || isDisabled || isSuccess}
      className={cn(getButtonStyles(), className)}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : isSuccess ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          {successLabel || 'Done'}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {label}
        </>
      )}
    </Button>
  );
};

export default StepNavigation;
