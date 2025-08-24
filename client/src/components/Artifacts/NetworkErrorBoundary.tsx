import React, { useState, useEffect, ReactNode } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@librechat/client';

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onNetworkError?: (error: Error) => void;
  retryInterval?: number;
  maxRetries?: number;
}

interface NetworkState {
  isOnline: boolean;
  hasNetworkError: boolean;
  retryCount: number;
  lastError: Error | null;
}

export const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({
  children,
  fallback,
  onNetworkError,
  retryInterval = 5000,
  maxRetries = 3,
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    hasNetworkError: false,
    retryCount: 0,
    lastError: null,
  });

  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkState((prev) => ({
        ...prev,
        isOnline: true,
        hasNetworkError: false,
        retryCount: 0,
        lastError: null,
      }));
    };

    const handleOffline = () => {
      setNetworkState((prev) => ({
        ...prev,
        isOnline: false,
        hasNetworkError: true,
        lastError: new Error('Network connection lost'),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (networkState.hasNetworkError && networkState.lastError) {
      onNetworkError?.(networkState.lastError);
    }
  }, [networkState.hasNetworkError, networkState.lastError, onNetworkError]);

  const handleRetry = async () => {
    if (networkState.retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);

    try {
      // Test network connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        setNetworkState((prev) => ({
          ...prev,
          hasNetworkError: false,
          retryCount: 0,
          lastError: null,
        }));
      } else {
        throw new Error(`Network test failed: ${response.status}`);
      }
    } catch (error) {
      const networkError = error instanceof Error ? error : new Error('Network test failed');

      setNetworkState((prev) => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        lastError: networkError,
      }));

      // Auto-retry after interval if under max retries
      if (networkState.retryCount < maxRetries - 1) {
        setTimeout(() => {
          handleRetry();
        }, retryInterval);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleForceReload = () => {
    window.location.reload();
  };

  if (networkState.hasNetworkError || !networkState.isOnline) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950/20">
        <div className="mb-4 flex items-center gap-3">
          {networkState.isOnline ? (
            <AlertCircle className="h-8 w-8 text-orange-500" />
          ) : (
            <WifiOff className="h-8 w-8 text-red-500" />
          )}
          <h3 className="text-xl font-semibold text-orange-700 dark:text-orange-400">
            {networkState.isOnline ? 'Network Error' : 'No Internet Connection'}
          </h3>
        </div>

        <div className="mb-6 max-w-md text-center">
          <p className="mb-2 text-orange-600 dark:text-orange-300">
            {networkState.isOnline
              ? 'Unable to connect to the server. Please check your connection and try again.'
              : 'Please check your internet connection and try again.'}
          </p>

          {networkState.retryCount > 0 && (
            <p className="text-sm text-orange-500 dark:text-orange-400">
              Retry attempt {networkState.retryCount} of {maxRetries}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={handleRetry}
            disabled={isRetrying || networkState.retryCount >= maxRetries}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>

          {networkState.isOnline && (
            <Button
              onClick={handleForceReload}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
          )}
        </div>

        {networkState.retryCount >= maxRetries && (
          <div className="mt-4 max-w-md rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Maximum retry attempts reached. Please check your network connection or try
                reloading the page.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for manual network error reporting
export const useNetworkErrorHandler = () => {
  const [networkState, setNetworkState] = useState({
    isOnline: navigator.onLine,
    lastChecked: Date.now(),
  });

  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const isOnline = response.ok;
      setNetworkState({
        isOnline,
        lastChecked: Date.now(),
      });

      return isOnline;
    } catch (error) {
      console.warn('Network check failed:', error);
      setNetworkState({
        isOnline: false,
        lastChecked: Date.now(),
      });
      return false;
    }
  };

  const handleNetworkError = async (error: Error): Promise<boolean> => {
    console.error('Network error detected:', error);

    // Check if it's actually a network error
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'TypeError'
    ) {
      const isOnline = await checkNetworkStatus();
      return !isOnline;
    }

    return false;
  };

  return {
    networkState,
    checkNetworkStatus,
    handleNetworkError,
  };
};

export default NetworkErrorBoundary;
