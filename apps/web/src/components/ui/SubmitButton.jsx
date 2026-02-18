import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SubmitButton - Prevents duplicate form submissions
 * - Shows loading spinner while submitting
 * - Disables button during submission
 * - Optional success state after completion
 */
const SubmitButton = React.forwardRef(({
  children,
  isSubmitting = false,
  isSuccess = false,
  loadingText = 'Submitting...',
  successText = 'Done!',
  disabled = false,
  className,
  variant = 'default',
  size = 'default',
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      type="submit"
      variant={variant}
      size={size}
      disabled={disabled || isSubmitting}
      className={cn(
        isSuccess && 'bg-green-600 hover:bg-green-600',
        className
      )}
      {...props}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : isSuccess ? (
        <>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successText}
        </>
      ) : (
        children
      )}
    </Button>
  );
});

SubmitButton.displayName = 'SubmitButton';

export { SubmitButton };
export default SubmitButton;
