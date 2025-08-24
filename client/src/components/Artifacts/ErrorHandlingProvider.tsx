import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { ArtifactErrorBoundary } from './ErrorBoundary';
import { NetworkErrorBoundary } from './NetworkErrorBoundary';
import { useErrorHandler } from '~/utils/errorHandling';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  category: string | null;
  retryCount: number;
  lastRetry: number | null;
}

interface ErrorHandlingContextType {
  errorState: ErrorState;
  reportError: (error: Error, context?: Record<string, any>) => string;
  clearError: () => void;
  retryLastAction: () => void;
  canRetry: boolean;
  maxRetries: number;
}

const ErrorHandlingContext = createContext<ErrorHandlingContextType | null>(null);

interface ErrorHandlingProviderProps {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  enableNetworkBoundary?: boolean;
  enableErrorBoundary?: boolean;
  onError?: (error: Error, errorId: string) => void;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export const ErrorHandlingProvider: React.FC<ErrorHandlingProviderProps> = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  enableNetworkBoundary = true,
  enableErrorBoundary = true,
  onError,
  onRetry,
  onMaxRetriesReached,
}) => {
  const { handleError, getUserFriendlyMessage, getErrorCategory } = useErrorHandler();
  
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorId: null,
    category: null,
    retryCount: 0,
    lastRetry: null,
  });

  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    const errorId = handleError(error, undefined, context);
    const category = getErrorCategory(error);

    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error,
      errorId,
      category,
    }));

    onError?.(error, errorId);
    return errorId;
  }, [handleError, getErrorCategory, onError]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: null,
      category: null,
      retryCount: 0,
      lastRetry: null,
    });
    setLastAction(null);
  }, []);

  const retryLastAction = useCallback(() => {
    if (!lastAction || errorState.retryCount >= maxRetries) {
      return;
    }

    const newRetryCount = errorState.retryCount + 1;
    
    setErrorState(prev => ({
      ...prev,
      retryCount: newRetryCount,
      lastRetry: Date.now(),
    }));

    onRetry?.(newRetryCount);

    // Execute retry after delay
    setTimeout(() => {
      try {
        lastAction();
        clearError(); // Clear error if retry succeeds
      } catch (error) {
        const retryError = error instanceof Error ? error : new Error('Retry failed');
        
        if (newRetryCount >= maxRetries) {
          onMaxRetriesReached?.(retryError);
        } else {
          reportError(retryError, { isRetry: true, retryCount: newRetryCount });
        }
      }
    }, retryDelay);
  }, [lastAction, errorState.retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesReached, clearError, reportError]);

  const canRetry = errorState.retryCount < maxRetries && lastAction !== null;

  const contextValue: ErrorHandlingContextType = {
    errorState,
    reportError,
    clearError,
    retryLastAction,
    canRetry,
    maxRetries,
  };

  // Register action for retry capability
  const registerAction = useCallback((action: () => void) => {
    setLastAction(() => action);
  }, []);

  // Enhanced context with action registration
  const enhancedContextValue = {
    ...contextValue,
    registerAction,
  };

  let wrappedChildren = (
    <ErrorHandlingContext.Provider value={enhancedContextValue}>
      {children}
    </ErrorHandlingContext.Provider>
  );

  // Wrap with NetworkErrorBoundary if enabled
  if (enableNetworkBoundary) {
    wrappedChildren = (
      <NetworkErrorBoundary
        onNetworkError={(error) => reportError(error, { type: 'network' })}
        maxRetries={maxRetries}
        retryInterval={retryDelay}
      >
        {wrappedChildren}
      </NetworkErrorBoundary>
    );
  }

  // Wrap with ArtifactErrorBoundary if enabled
  if (enableErrorBoundary) {
    wrappedChildren = (
      <ArtifactErrorBoundary
        onError={(error, errorInfo) => reportError(error, { 
          type: 'component',
          componentStack: errorInfo.componentStack,
        })}
        resetOnPropsChange={true}
        resetKeys={[errorState.errorId]}
      >
        {wrappedChildren}
      </ArtifactErrorBoundary>
    );
  }

  return wrappedChildren;
};

// Hook to use error handling context
export const useErrorHandlingContext = () => {
  const context = useContext(ErrorHandlingContext);
  if (!context) {
    throw new Error('useErrorHandlingContext must be used within an ErrorHandlingProvider');
  }
  return context;
};

// Higher-order component for automatic error handling
export const withErrorHandling = <P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<ErrorHandlingProviderProps> = {}
) => {
  const WrappedComponent = (props: P) => (
    <ErrorHandlingProvider {...options}>
      <Component {...props} />
    </ErrorHandlingProvider>
  );

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for safe async operations with automatic error handling
export const useSafeAsync = () => {
  const { reportError, registerAction } = useErrorHandlingContext();

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      context?: Record<string, any>;
      enableRetry?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, context } = options;
    const enableRetry = options.enableRetry ?? true;

    try {
      // Register action for retry if enabled
      if (enableRetry) {
        registerAction(() => executeAsync(asyncFn, options));
      }

      const result = await asyncFn();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown async error');
      
      reportError(errorObj, { ...context, type: 'async' });
      onError?.(errorObj);
      return null;
    }
  }, [reportError, registerAction]);

  return { executeAsync };
};

// Hook for safe API calls with automatic retry and error handling
export const useSafeApiCall = () => {
  const { reportError, registerAction } = useErrorHandlingContext();

  const apiCall = useCallback(async <T>(
    url: string,
    options: RequestInit = {},
    config: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      enableRetry?: boolean;
      timeout?: number;
    } = { enableRetry: true, timeout: 10000 }
  ): Promise<T | null> => {
    const { onSuccess, onError, enableRetry = true, timeout = 10000 } = config;

    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    try {
      // Register action for retry if enabled
      if (enableRetry) {
        registerAction(() => apiCall(url, options, config));
      }

      const result = await makeRequest();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('API call failed');
      
      reportError(errorObj, { 
        type: 'api',
        url,
        method: options.method || 'GET',
        timeout,
      });
      
      onError?.(errorObj);
      return null;
    }
  }, [reportError, registerAction]);

  return { apiCall };
};

// Component for displaying error state
export const ErrorDisplay: React.FC<{
  className?: string;
  showRetryButton?: boolean;
  showDetails?: boolean;
}> = ({ 
  className = '', 
  showRetryButton = true, 
  showDetails = false 
}) => {
  const { errorState, retryLastAction, clearError, canRetry } = useErrorHandlingContext();
  const { getUserFriendlyMessage } = useErrorHandler();

  if (!errorState.hasError || !errorState.error) {
    return null;
  }

  const friendlyMessage = getUserFriendlyMessage(errorState.error);

  return (
    <div className={`p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error Occurred
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {friendlyMessage}
          </p>
          
          {showDetails && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                Technical Details
              </summary>
              <div className="mt-1 text-xs text-red-600 dark:text-red-400 font-mono">
                <p>Error ID: {errorState.errorId}</p>
                <p>Category: {errorState.category}</p>
                <p>Retry Count: {errorState.retryCount}</p>
                {errorState.error.stack && (
                  <pre className="mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                    {errorState.error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          {showRetryButton && canRetry && (
            <button
              onClick={retryLastAction}
              className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Retry ({errorState.retryCount}/{3})
            </button>
          )}
          
          <button
            onClick={clearError}
            className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandlingProvider;