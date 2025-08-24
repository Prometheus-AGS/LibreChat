import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@librechat/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class ArtifactErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ArtifactErrorBoundary caught an error:', error, errorInfo);

    // Log to external service if available
    const eventId = this.logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys && resetOnPropsChange) {
      if (resetKeys?.some((resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey)) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo): string => {
    // Generate a simple event ID for tracking
    const eventId = `artifact-error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Log to console with structured data
    console.group(`🚨 Artifact Error [${eventId}]`);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Boundary Props:', this.props);
    console.groupEnd();

    // Here you could integrate with error reporting services like:
    // - Sentry: Sentry.captureException(error, { contexts: { react: errorInfo } });
    // - LogRocket: LogRocket.captureException(error);
    // - Custom API: fetch('/api/errors', { method: 'POST', body: JSON.stringify({ error, errorInfo, eventId }) });

    return eventId;
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, eventId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950/20">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h2 className="text-2xl font-semibold text-red-700 dark:text-red-400">
              Something went wrong
            </h2>
          </div>

          <div className="mb-6 max-w-md text-center">
            <p className="mb-2 text-red-600 dark:text-red-300">
              An error occurred while rendering this artifact component.
            </p>
            {eventId && (
              <p className="font-mono text-sm text-red-500 dark:text-red-400">
                Error ID: {eventId}
              </p>
            )}
          </div>

          {error && (
            <details className="mb-6 w-full max-w-2xl">
              <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                Show error details
              </summary>
              <div className="mt-2 rounded border border-red-200 bg-red-100 p-4 dark:border-red-700 dark:bg-red-900/30">
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-red-800 dark:text-red-200">
                  {error.toString()}
                </pre>
              </div>
            </details>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={this.handleReload}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>

            <Button
              onClick={this.handleGoHome}
              variant="default"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
) => {
  const WrappedComponent = (props: P) => (
    <ArtifactErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ArtifactErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error reporting in functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo);

    // Log to external service
    const eventId = `manual-error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    console.group(`🚨 Manual Error Report [${eventId}]`);
    console.error('Error:', error);
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }
    console.groupEnd();

    return eventId;
  }, []);

  return { handleError };
};

export default ArtifactErrorBoundary;
