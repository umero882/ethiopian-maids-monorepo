import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { getUserFriendlyError, ErrorCodes, ErrorSeverity } from '@/lib/errorMessages';

/**
 * NetworkStatusChecker - Diagnoses and displays network connectivity issues
 * Helps users understand why login might be failing
 * Uses Hasura GraphQL endpoint for connectivity checks
 *
 * IMPORTANT: This component NEVER exposes technical error details to users.
 * All errors are mapped to user-friendly messages via errorMessages.js
 */
const NetworkStatusChecker = ({ onRetry, allowBypass = true }) => {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    databaseConnected: null,
    lastChecked: null,
    error: null,
    errorCode: null,
    checking: false,
    bypassed: false,
  });

  const checkHasuraConnectivity = async () => {
    setNetworkStatus((prev) => ({ ...prev, checking: true, error: null, errorCode: null }));

    try {
      const hasuraUrl = import.meta.env.VITE_HASURA_GRAPHQL_URL;

      // First check if we have valid configuration
      if (!hasuraUrl) {
        // Log technical error for debugging (only visible in console, never to users)
        console.error('[NetworkCheck] Configuration error: VITE_HASURA_GRAPHQL_URL is not set');
        throw new Error('configuration missing'); // Generic trigger for error mapping
      }

      // Multiple connectivity tests with fallbacks
      let connected = false;
      let technicalError = null;

      // Test 1: GraphQL introspection query
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(hasuraUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: '{ __typename }'
          }),
          signal: controller.signal,
          mode: 'cors',
        });

        clearTimeout(timeoutId);
        connected = response.ok;

        if (!connected) {
          technicalError = `HTTP ${response.status}`;
        }
      } catch (graphqlError) {
        technicalError = graphqlError.message;

        // Test 2: Fallback - try a simple GET to check basic connectivity
        try {
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

          const healthUrl = hasuraUrl.replace('/v1/graphql', '/healthz');
          await fetch(healthUrl, {
            method: 'GET',
            signal: controller2.signal,
            mode: 'no-cors',
          });

          clearTimeout(timeoutId2);
          connected = true;
          technicalError = null;
        } catch (fallbackError) {
          connected = false;
          technicalError = fallbackError.message;
        }
      }

      if (connected) {
        setNetworkStatus((prev) => ({
          ...prev,
          databaseConnected: true,
          lastChecked: new Date(),
          checking: false,
          error: null,
          errorCode: null,
        }));
      } else {
        // Map technical error to user-friendly error
        const friendlyError = getUserFriendlyError(technicalError);
        setNetworkStatus((prev) => ({
          ...prev,
          databaseConnected: false,
          lastChecked: new Date(),
          checking: false,
          error: friendlyError,
          errorCode: friendlyError.code,
        }));
      }
    } catch (error) {
      // Log for debugging only
      console.error('[NetworkCheck] Connectivity check failed:', error.message);

      // Map technical error to user-friendly error
      const friendlyError = getUserFriendlyError(error);

      setNetworkStatus((prev) => ({
        ...prev,
        databaseConnected: false,
        lastChecked: new Date(),
        checking: false,
        error: friendlyError,
        errorCode: friendlyError.code,
      }));
    }
  };

  const handleRetry = async () => {
    await checkHasuraConnectivity();
    if (onRetry) {
      onRetry();
    }
  };

  const handleBypass = () => {
    setNetworkStatus((prev) => ({ ...prev, bypassed: true }));
    if (onRetry) {
      onRetry();
    }
  };

  useEffect(() => {
    // Check connectivity on mount
    checkHasuraConnectivity();

    // Listen for online/offline events
    const handleOnline = () => {
      setNetworkStatus((prev) => ({ ...prev, online: true }));
      checkHasuraConnectivity();
    };

    const handleOffline = () => {
      setNetworkStatus((prev) => ({
        ...prev,
        online: false,
        databaseConnected: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show if everything is working or user bypassed
  if (
    networkStatus.bypassed ||
    (networkStatus.online && networkStatus.databaseConnected === true)
  ) {
    return null;
  }

  const getStatusIcon = () => {
    if (networkStatus.checking) {
      return <RefreshCw className='h-5 w-5 animate-spin text-blue-500' />;
    } else if (!networkStatus.online) {
      return <WifiOff className='h-5 w-5 text-red-500' />;
    } else if (networkStatus.databaseConnected === false) {
      const severity = networkStatus.error?.severity;
      if (severity === ErrorSeverity.CRITICAL) {
        return <XCircle className='h-5 w-5 text-red-500' />;
      } else if (severity === ErrorSeverity.WARNING) {
        return <AlertTriangle className='h-5 w-5 text-amber-500' />;
      }
      return <AlertTriangle className='h-5 w-5 text-orange-500' />;
    } else {
      return <Wifi className='h-5 w-5 text-green-500' />;
    }
  };

  const getStatusTitle = () => {
    if (networkStatus.checking) {
      return 'Checking Connection';
    } else if (!networkStatus.online) {
      return 'No Internet Connection';
    } else if (networkStatus.databaseConnected === false && networkStatus.error) {
      // Use the user-friendly title from our error mapping
      return networkStatus.error.title || 'Connection Issue';
    } else {
      return 'Verifying Connection';
    }
  };

  const getDetailedMessage = () => {
    if (networkStatus.checking) {
      return 'Please wait while we verify your connection...';
    } else if (!networkStatus.online) {
      return 'Your device appears to be offline. Please check your internet connection.';
    } else if (networkStatus.databaseConnected === false && networkStatus.error) {
      // Use the user-friendly message from our error mapping
      return networkStatus.error.message || 'We\'re having trouble connecting. Please try again.';
    } else {
      return 'Verifying server connectivity...';
    }
  };

  const getSuggestions = () => {
    // If we have a user-friendly error with suggestions, use those
    if (networkStatus.error?.suggestions) {
      return networkStatus.error.suggestions;
    }

    // Fallback suggestions based on status
    if (!networkStatus.online) {
      return [
        'Check your WiFi or mobile data is turned on',
        'Move to an area with better signal',
        'Try refreshing the page',
      ];
    } else if (networkStatus.databaseConnected === false) {
      const suggestions = [
        'Wait a moment and try again',
        'Check if you\'re using a VPN or firewall',
        'Try a different network connection',
      ];
      if (allowBypass) {
        suggestions.push('Skip this check if your connection is working');
      }
      suggestions.push('Contact support if the issue persists');
      return suggestions;
    }

    return [];
  };

  const getAlertVariant = () => {
    if (networkStatus.checking) return 'default';
    if (!networkStatus.online) return 'destructive';
    if (networkStatus.error?.severity === ErrorSeverity.CRITICAL) return 'destructive';
    if (networkStatus.error?.severity === ErrorSeverity.WARNING) return 'warning';
    return 'destructive';
  };

  const suggestions = getSuggestions();
  const isRecoverable = networkStatus.error?.recoverable !== false;

  return (
    <div className='mb-4 rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden'>
      {/* Header with icon and title */}
      <div className={`px-4 py-3 flex items-center gap-3 ${
        networkStatus.checking ? 'bg-blue-50 dark:bg-blue-950/30' :
        !networkStatus.online ? 'bg-red-50 dark:bg-red-950/30' :
        networkStatus.error?.severity === ErrorSeverity.CRITICAL ? 'bg-red-50 dark:bg-red-950/30' :
        'bg-amber-50 dark:bg-amber-950/30'
      }`}>
        {getStatusIcon()}
        <div className='flex-1'>
          <h3 className='font-semibold text-sm'>{getStatusTitle()}</h3>
          {networkStatus.lastChecked && !networkStatus.checking && (
            <p className='text-xs text-muted-foreground'>
              Checked {networkStatus.lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        {networkStatus.errorCode && (
          <span className='text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded'>
            {networkStatus.errorCode}
          </span>
        )}
      </div>

      {/* Message body */}
      <div className='px-4 py-3 space-y-3'>
        <p className='text-sm text-foreground'>{getDetailedMessage()}</p>

        {/* Suggestions */}
        {suggestions.length > 0 && !networkStatus.checking && (
          <div className='bg-muted/50 rounded-md p-3'>
            <p className='text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1'>
              <HelpCircle className='h-3 w-3' />
              Things to try
            </p>
            <ul className='space-y-1.5'>
              {suggestions.map((suggestion, index) => (
                <li key={index} className='text-sm flex items-start gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className='flex flex-wrap gap-2 pt-1'>
          <Button
            variant={networkStatus.checking ? 'outline' : 'default'}
            size='sm'
            onClick={handleRetry}
            disabled={networkStatus.checking}
            className='flex items-center gap-1.5'
          >
            {networkStatus.checking ? (
              <>
                <RefreshCw className='h-3.5 w-3.5 animate-spin' />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className='h-3.5 w-3.5' />
                Try Again
              </>
            )}
          </Button>

          {allowBypass && networkStatus.databaseConnected === false && !networkStatus.checking && isRecoverable && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleBypass}
              className='flex items-center gap-1.5'
            >
              Continue Anyway
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkStatusChecker;
