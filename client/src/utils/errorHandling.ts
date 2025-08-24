import { ErrorInfo } from 'react';

export interface ErrorReport {
  id: string;
  timestamp: number;
  error: Error;
  errorInfo?: ErrorInfo;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent: string;
  url: string;
  stack?: string;
}

export interface ErrorHandlerConfig {
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  logEndpoint?: string;
}

class ErrorHandlingService {
  private config: ErrorHandlerConfig;
  private errorQueue: ErrorReport[] = [];
  private isProcessingQueue = false;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      maxRetries: 3,
      retryDelay: 1000,
      logEndpoint: '/api/errors',
      ...config,
    };

    // Process error queue periodically
    setInterval(() => {
      this.processErrorQueue();
    }, 5000);

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(`Unhandled Promise Rejection: ${event.reason}`), undefined, {
        type: 'unhandledrejection',
        reason: event.reason,
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), undefined, {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createErrorReport(
    error: Error,
    errorInfo?: ErrorInfo,
    context?: Record<string, any>,
  ): ErrorReport {
    return {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error,
      errorInfo,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error.stack,
    };
  }

  handleError(error: Error, errorInfo?: ErrorInfo, context?: Record<string, any>): string {
    const errorReport = this.createErrorReport(error, errorInfo, context);

    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorReport);
    }

    if (this.config.enableRemoteLogging) {
      this.queueForRemoteLogging(errorReport);
    }

    return errorReport.id;
  }

  private logToConsole(errorReport: ErrorReport): void {
    console.group(`🚨 Error Report [${errorReport.id}]`);
    console.error('Error:', errorReport.error);
    console.error('Timestamp:', new Date(errorReport.timestamp).toISOString());
    console.error('URL:', errorReport.url);
    console.error('User Agent:', errorReport.userAgent);

    if (errorReport.errorInfo) {
      console.error('Component Stack:', errorReport.errorInfo.componentStack);
    }

    if (errorReport.context) {
      console.error('Context:', errorReport.context);
    }

    if (errorReport.stack) {
      console.error('Stack Trace:', errorReport.stack);
    }

    console.groupEnd();
  }

  private queueForRemoteLogging(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const errorsToProcess = [...this.errorQueue];
      this.errorQueue = [];

      await this.sendErrorsToRemote(errorsToProcess);
    } catch (error) {
      console.warn('Failed to process error queue:', error);
      // Re-queue errors for retry (with limit)
      this.errorQueue.unshift(...this.errorQueue.slice(0, 10));
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendErrorsToRemote(errors: ErrorReport[]): Promise<void> {
    if (!this.config.logEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.logEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to send errors to remote endpoint:', error);
      throw error;
    }
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      // From localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user._id;
      }

      // From sessionStorage
      const sessionData = sessionStorage.getItem('user');
      if (sessionData) {
        const user = JSON.parse(sessionData);
        return user.id || user._id;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Network error detection
  isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      /fetch/i,
      /network/i,
      /failed to fetch/i,
      /networkerror/i,
      /connection/i,
      /timeout/i,
      /abort/i,
    ];

    return networkErrorPatterns.some(
      (pattern) => pattern.test(error.message) || pattern.test(error.name),
    );
  }

  // Supabase error detection
  isSupabaseError(error: Error): boolean {
    return (
      error.message.includes('supabase') ||
      error.message.includes('PostgrestError') ||
      error.message.includes('AuthError')
    );
  }

  // API error detection
  isAPIError(error: Error): boolean {
    return (
      error.message.includes('API') ||
      error.message.includes('HTTP') ||
      error.message.includes('status')
    );
  }

  // Get error category for better handling
  getErrorCategory(error: Error): string {
    if (this.isNetworkError(error)) return 'network';
    if (this.isSupabaseError(error)) return 'supabase';
    if (this.isAPIError(error)) return 'api';
    if (error.name === 'ChunkLoadError') return 'chunk-load';
    if (error.name === 'TypeError') return 'type';
    if (error.name === 'ReferenceError') return 'reference';
    return 'unknown';
  }

  // Get user-friendly error message
  getUserFriendlyMessage(error: Error): string {
    const category = this.getErrorCategory(error);

    switch (category) {
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'supabase':
        return 'Database connection issue. Please try again in a moment.';
      case 'api':
        return 'Server communication error. Please try again.';
      case 'chunk-load':
        return 'Application loading error. Please refresh the page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Configure the service
  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get error statistics
  getErrorStats(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.errorQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandlingService({
  enableConsoleLogging: true,
  enableRemoteLogging: process.env.NODE_ENV === 'production',
});

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo, context?: Record<string, any>) => {
    return errorHandler.handleError(error, errorInfo, context);
  };

  const getUserFriendlyMessage = (error: Error) => {
    return errorHandler.getUserFriendlyMessage(error);
  };

  const getErrorCategory = (error: Error) => {
    return errorHandler.getErrorCategory(error);
  };

  return {
    handleError,
    getUserFriendlyMessage,
    getErrorCategory,
    isNetworkError: errorHandler.isNetworkError.bind(errorHandler),
    isSupabaseError: errorHandler.isSupabaseError.bind(errorHandler),
    isAPIError: errorHandler.isAPIError.bind(errorHandler),
  };
};

export default errorHandler;
