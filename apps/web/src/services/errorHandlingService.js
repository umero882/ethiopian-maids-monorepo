import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { toast } from '@/components/ui/use-toast';

/**
 * Production Error Handling and Monitoring Service
 * Replaces console.log with proper error logging and user feedback
 * Migrated to GraphQL/Hasura
 */

// GraphQL Mutations/Queries
const INSERT_ERROR_LOG = gql`
  mutation InsertErrorLog($object: error_logs_insert_input!) {
    insert_error_logs_one(object: $object) {
      id
      title
      message
      created_at
    }
  }
`;

const GET_ERROR_LOGS = gql`
  query GetErrorLogs($createdAfter: timestamptz!) {
    error_logs(
      where: { created_at: { _gte: $createdAfter } }
      order_by: { created_at: desc }
    ) {
      id
      title
      message
      created_at
    }
  }
`;

const DELETE_OLD_ERROR_LOGS = gql`
  mutation DeleteOldErrorLogs($cutoffDate: timestamptz!) {
    delete_error_logs(where: { created_at: { _lt: $cutoffDate } }) {
      affected_rows
    }
  }
`;

const EXPORT_ERROR_LOGS = gql`
  query ExportErrorLogs($startDate: timestamptz!, $endDate: timestamptz!) {
    error_logs(
      where: {
        created_at: { _gte: $startDate, _lte: $endDate }
      }
      order_by: { created_at: desc }
    ) {
      id
      title
      message
      stack
      context
      url
      user_agent
      user_id
      created_at
    }
  }
`;

class ErrorHandlingService {
  constructor() {
    this.isProduction = import.meta.env.NODE_ENV === 'production';
    this.enableErrorReporting =
      import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
    this.errorQueue = [];
    this.setupGlobalErrorHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason, {
        type: 'unhandled_promise',
        promise: event.promise,
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', event.error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle React error boundaries (if needed)
    if (typeof window !== 'undefined') {
      window.addEventListener('react-error', (event) => {
        this.logError('React Error', event.detail.error, {
          type: 'react_error',
          componentStack: event.detail.componentStack,
        });
      });
    }
  }

  /**
   * Log error with context and user feedback
   */
  async logError(title, error, context = {}) {
    const errorData = {
      title,
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
    };

    // Log to console in development
    if (!this.isProduction) {
      console.error(`${title}:`, error, context);
    }

    // Store error for reporting
    this.errorQueue.push(errorData);

    // Send to error reporting service if enabled
    if (this.enableErrorReporting) {
      await this.reportError(errorData);
    }

    // Show user-friendly message for critical errors
    if (this.isCriticalError(error)) {
      this.showUserErrorMessage(title, error);
    }

    return errorData;
  }

  /**
   * Log warning (non-critical issues)
   */
  logWarning(title, message, context = {}) {
    const warningData = {
      title,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    if (!this.isProduction) {
      console.warn(`${title}:`, message, context);
    }

    // Store warning for analysis
    this.errorQueue.push({ ...warningData, level: 'warning' });
  }

  /**
   * Log info (general information)
   */
  logInfo(title, message, context = {}) {
    if (!this.isProduction) {
    }

    // In production, only log important info events
    if (this.isProduction && this.isImportantInfo(title)) {
      this.errorQueue.push({
        title,
        message,
        context,
        level: 'info',
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
      });
    }
  }

  /**
   * Report error to external service or database
   */
  async reportError(errorData) {
    try {
      // Store in Hasura via GraphQL
      const { errors } = await apolloClient.mutate({
        mutation: INSERT_ERROR_LOG,
        variables: {
          object: {
            title: errorData.title,
            message: errorData.message,
            stack: errorData.stack,
            context: errorData.context,
            url: errorData.url,
            user_agent: errorData.userAgent,
            user_id: errorData.userId,
            created_at: errorData.timestamp,
          }
        }
      });

      if (errors) {
        console.error('Failed to store error log:', errors[0]?.message);
      }

      // External error reporting can be added by setting REACT_APP_SENTRY_DSN env variable
      // await this.sendToExternalService(errorData);
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    }
  }

  /**
   * Determine if error is critical and needs user notification
   */
  isCriticalError(error) {
    const criticalPatterns = [
      'network error',
      'authentication failed',
      'payment failed',
      'database error',
      'permission denied',
    ];

    const errorMessage = (error?.message || String(error)).toLowerCase();
    return criticalPatterns.some((pattern) => errorMessage.includes(pattern));
  }

  /**
   * Determine if info message is important enough to log in production
   */
  isImportantInfo(title) {
    const importantPatterns = [
      'user login',
      'user registration',
      'payment success',
      'subscription change',
      'profile completion',
    ];

    return importantPatterns.some((pattern) =>
      title.toLowerCase().includes(pattern)
    );
  }

  /**
   * Show user-friendly error message
   */
  showUserErrorMessage(title, error) {
    const userFriendlyMessages = {
      'network error':
        'Connection issue. Please check your internet and try again.',
      'authentication failed': 'Login session expired. Please log in again.',
      'payment failed':
        'Payment could not be processed. Please check your payment details.',
      'database error':
        'Service temporarily unavailable. Please try again in a moment.',
      'permission denied': "You don't have permission to perform this action.",
    };

    const errorMessage = (error?.message || String(error)).toLowerCase();
    let userMessage = 'An unexpected error occurred. Please try again.';

    // Find matching user-friendly message
    for (const [pattern, message] of Object.entries(userFriendlyMessages)) {
      if (errorMessage.includes(pattern)) {
        userMessage = message;
        break;
      }
    }

    toast({
      title: 'Error',
      description: userMessage,
      variant: 'destructive',
    });
  }

  /**
   * Get current user ID for error context
   */
  getCurrentUserId() {
    try {
      // Try to get user from Firebase Auth
      const currentUser = auth?.currentUser;
      return currentUser?.uid || null;
    } catch {
      return null;
    }
  }

  /**
   * Handle async operation with error handling
   */
  async handleAsync(operation, errorTitle = 'Operation Failed') {
    try {
      return await operation();
    } catch (error) {
      await this.logError(errorTitle, error);
      throw error;
    }
  }

  /**
   * Wrap component method with error boundary
   */
  withErrorBoundary(fn, errorTitle = 'Component Error') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.logError(errorTitle, error, { args });
        throw error;
      }
    };
  }

  /**
   * Get error statistics for monitoring
   */
  async getErrorStats(timeframe = '24h') {
    try {
      const timeframeMsMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };

      const createdAfter = new Date(
        Date.now() - (timeframeMsMap[timeframe] || timeframeMsMap['24h'])
      ).toISOString();

      const { data, errors } = await apolloClient.query({
        query: GET_ERROR_LOGS,
        variables: { createdAfter },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      const logs = data?.error_logs || [];

      // Group errors by type
      const errorCounts = {};
      logs.forEach((log) => {
        errorCounts[log.title] = (errorCounts[log.title] || 0) + 1;
      });

      return {
        totalErrors: logs.length,
        errorTypes: errorCounts,
        timeframe,
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        errorTypes: {},
        timeframe,
        error: error.message,
      };
    }
  }

  /**
   * Clear old error logs (cleanup)
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      ).toISOString();

      const { errors } = await apolloClient.mutate({
        mutation: DELETE_OLD_ERROR_LOGS,
        variables: { cutoffDate }
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      this.logInfo(
        'Log Cleanup',
        `Cleaned up error logs older than ${daysToKeep} days`
      );
    } catch (error) {
      this.logError('Log Cleanup Failed', error);
    }
  }

  /**
   * Export error logs for analysis
   */
  async exportErrorLogs(startDate, endDate) {
    try {
      const { data, errors } = await apolloClient.query({
        query: EXPORT_ERROR_LOGS,
        variables: { startDate, endDate },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      const logs = data?.error_logs || [];

      return {
        success: true,
        logs,
        count: logs.length,
      };
    } catch (error) {
      this.logError('Export Error Logs Failed', error);
      return {
        success: false,
        logs: [],
        count: 0,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandlingService();

// Export convenience methods
export const logError = (title, error, context) =>
  errorHandler.logError(title, error, context);
export const logWarning = (title, message, context) =>
  errorHandler.logWarning(title, message, context);
export const logInfo = (title, message, context) =>
  errorHandler.logInfo(title, message, context);
export const handleAsync = (operation, errorTitle) =>
  errorHandler.handleAsync(operation, errorTitle);
export const withErrorBoundary = (fn, errorTitle) =>
  errorHandler.withErrorBoundary(fn, errorTitle);

export default errorHandler;
