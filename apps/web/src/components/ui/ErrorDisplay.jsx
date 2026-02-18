import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getUserFriendlyError,
  ErrorSeverity,
  ErrorCategory,
} from '@/lib/errorMessages';

/**
 * ErrorDisplay - Industry-standard error display component
 *
 * Features:
 * - Maps technical errors to user-friendly messages
 * - Provides contextual suggestions
 * - Supports multiple display variants
 * - Never exposes technical details to users
 *
 * @param {Object} props
 * @param {Error|string} props.error - The error to display
 * @param {string} [props.variant='card'] - Display variant: 'card' | 'inline' | 'toast' | 'banner'
 * @param {Function} [props.onRetry] - Callback for retry action
 * @param {Function} [props.onDismiss] - Callback for dismiss action
 * @param {boolean} [props.showSuggestions=true] - Whether to show suggestions
 * @param {boolean} [props.showErrorCode=false] - Whether to show error code (for debugging)
 * @param {string} [props.className] - Additional CSS classes
 */
const ErrorDisplay = ({
  error,
  variant = 'card',
  onRetry,
  onDismiss,
  showSuggestions = true,
  showErrorCode = false,
  className = '',
}) => {
  // Map technical error to user-friendly error
  const friendlyError = React.useMemo(() => {
    if (!error) return null;
    return getUserFriendlyError(error);
  }, [error]);

  if (!friendlyError) return null;

  const {
    title,
    message,
    suggestions,
    severity,
    action,
    recoverable,
    code,
  } = friendlyError;

  // Get appropriate icon based on severity
  const getIcon = () => {
    const iconProps = { className: 'h-5 w-5 flex-shrink-0' };
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <XCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case ErrorSeverity.ERROR:
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case ErrorSeverity.WARNING:
        return <AlertTriangle {...iconProps} className={`${iconProps.className} text-amber-500`} />;
      case ErrorSeverity.INFO:
        return <Info {...iconProps} className={`${iconProps.className} text-blue-500`} />;
      default:
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
    }
  };

  // Get background color based on severity
  const getBackgroundClass = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50';
      case ErrorSeverity.WARNING:
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50';
      case ErrorSeverity.INFO:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50';
      default:
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50';
    }
  };

  // Render action button if available
  const renderAction = () => {
    if (!action) return null;

    if (action.path) {
      return (
        <Button asChild variant='outline' size='sm'>
          <Link to={action.path} className='flex items-center gap-1.5'>
            {action.label}
            <ArrowRight className='h-3.5 w-3.5' />
          </Link>
        </Button>
      );
    }

    return null;
  };

  // Inline variant - simple one-line error message
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        {getIcon()}
        <span className={
          severity === ErrorSeverity.WARNING ? 'text-amber-700 dark:text-amber-400' :
          severity === ErrorSeverity.INFO ? 'text-blue-700 dark:text-blue-400' :
          'text-red-700 dark:text-red-400'
        }>
          {message}
        </span>
        {onRetry && recoverable && (
          <button
            onClick={onRetry}
            className='text-primary hover:underline text-sm font-medium'
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // Banner variant - full-width alert banner
  if (variant === 'banner') {
    return (
      <div className={`w-full px-4 py-3 ${getBackgroundClass()} ${className}`}>
        <div className='max-w-7xl mx-auto flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            {getIcon()}
            <div>
              <p className='font-medium text-sm'>{title}</p>
              <p className='text-sm text-muted-foreground'>{message}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {onRetry && recoverable && (
              <Button variant='outline' size='sm' onClick={onRetry}>
                <RefreshCw className='h-3.5 w-3.5 mr-1.5' />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button variant='ghost' size='sm' onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant (default) - full featured error card
  return (
    <div className={`rounded-lg border overflow-hidden ${getBackgroundClass()} ${className}`}>
      {/* Header */}
      <div className='px-4 py-3 flex items-start gap-3'>
        {getIcon()}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='font-semibold text-sm text-foreground'>{title}</h3>
            {showErrorCode && code && (
              <span className='text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded'>
                {code}
              </span>
            )}
          </div>
          <p className='text-sm text-muted-foreground mt-0.5'>{message}</p>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className='px-4 pb-3'>
          <div className='bg-background/50 rounded-md p-3'>
            <p className='text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1'>
              <HelpCircle className='h-3 w-3' />
              Things to try
            </p>
            <ul className='space-y-1.5'>
              {suggestions.map((suggestion, index) => (
                <li key={index} className='text-sm flex items-start gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                  <span className='text-foreground'>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      {(onRetry || action || onDismiss) && (
        <div className='px-4 pb-3 flex flex-wrap gap-2'>
          {onRetry && recoverable && (
            <Button variant='default' size='sm' onClick={onRetry}>
              <RefreshCw className='h-3.5 w-3.5 mr-1.5' />
              Try Again
            </Button>
          )}
          {renderAction()}
          {onDismiss && (
            <Button variant='ghost' size='sm' onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ErrorBoundaryFallback - Fallback UI for React Error Boundary
 * Use with react-error-boundary package
 */
export const ErrorBoundaryFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className='min-h-[200px] flex items-center justify-center p-4'>
      <ErrorDisplay
        error={error}
        variant='card'
        onRetry={resetErrorBoundary}
        showSuggestions={true}
      />
    </div>
  );
};

/**
 * useErrorDisplay - Hook for managing error display state
 */
export const useErrorDisplay = () => {
  const [error, setError] = React.useState(null);

  const showError = React.useCallback((err) => {
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback(async (operation) => {
    try {
      clearError();
      return await operation();
    } catch (err) {
      showError(err);
      throw err;
    }
  }, [showError, clearError]);

  return {
    error,
    showError,
    clearError,
    handleError,
  };
};

export default ErrorDisplay;
