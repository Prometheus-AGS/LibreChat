const { logger } = require('~/config');

/**
 * Error categories for better handling
 */
const ErrorCategories = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  NETWORK: 'network',
  DATABASE: 'database',
  SUPABASE: 'supabase',
  ARTIFACT_REGISTRY: 'artifact_registry',
  RATE_LIMIT: 'rate_limit',
  INTERNAL: 'internal',
  EXTERNAL_API: 'external_api',
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, category = ErrorCategories.INTERNAL, details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.category = category;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error classes for different scenarios
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, ErrorCategories.VALIDATION, details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details = {}) {
    super(message, 401, ErrorCategories.AUTHENTICATION, details);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details = {}) {
    super(message, 403, ErrorCategories.AUTHORIZATION, details);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = {}) {
    super(message, 404, ErrorCategories.NOT_FOUND, details);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends AppError {
  constructor(message, details = {}) {
    super(message, 500, ErrorCategories.DATABASE, details);
    this.name = 'DatabaseError';
  }
}

class SupabaseError extends AppError {
  constructor(message, details = {}) {
    super(message, 500, ErrorCategories.SUPABASE, details);
    this.name = 'SupabaseError';
  }
}

class ArtifactRegistryError extends AppError {
  constructor(message, statusCode = 500, details = {}) {
    super(message, statusCode, ErrorCategories.ARTIFACT_REGISTRY, details);
    this.name = 'ArtifactRegistryError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details = {}) {
    super(message, 429, ErrorCategories.RATE_LIMIT, details);
    this.name = 'RateLimitError';
  }
}

class ExternalAPIError extends AppError {
  constructor(message, statusCode = 502, details = {}) {
    super(message, statusCode, ErrorCategories.EXTERNAL_API, details);
    this.name = 'ExternalAPIError';
  }
}

/**
 * Error detection utilities
 */
const ErrorDetectors = {
  isMongoError: (error) => {
    return (
      error.name === 'MongoError' ||
      error.name === 'MongooseError' ||
      error.name === 'ValidationError' ||
      error.code === 11000
    ); // Duplicate key error
  },

  isSupabaseError: (error) => {
    return (
      error.message?.includes('supabase') ||
      error.message?.includes('PostgrestError') ||
      error.message?.includes('AuthError') ||
      error.code?.startsWith('PGRST')
    );
  },

  isNetworkError: (error) => {
    return (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('fetch failed') ||
      error.message?.includes('network')
    );
  },

  isValidationError: (error) => {
    return (
      error.name === 'ValidationError' ||
      error.name === 'CastError' ||
      error.message?.includes('validation')
    );
  },

  isAuthError: (error) => {
    return (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError' ||
      error.message?.includes('authentication') ||
      error.message?.includes('unauthorized')
    );
  },
};

/**
 * Convert various error types to standardized AppError
 */
function normalizeError(error) {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // MongoDB/Mongoose errors
  if (ErrorDetectors.isMongoError(error)) {
    if (error.code === 11000) {
      return new ValidationError('Duplicate entry detected', {
        field: Object.keys(error.keyPattern || {})[0],
        value: Object.values(error.keyValue || {})[0],
      });
    }
    return new DatabaseError(error.message, { originalError: error.name });
  }

  // Supabase errors
  if (ErrorDetectors.isSupabaseError(error)) {
    return new SupabaseError(error.message, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  // Network errors
  if (ErrorDetectors.isNetworkError(error)) {
    return new AppError('Network connection failed', 503, ErrorCategories.NETWORK, {
      code: error.code,
      originalMessage: error.message,
    });
  }

  // Validation errors
  if (ErrorDetectors.isValidationError(error)) {
    return new ValidationError(error.message, {
      path: error.path,
      value: error.value,
    });
  }

  // Authentication errors
  if (ErrorDetectors.isAuthError(error)) {
    return new AuthenticationError(error.message);
  }

  // Default to internal server error
  return new AppError(
    error.message || 'Internal server error',
    error.statusCode || 500,
    ErrorCategories.INTERNAL,
    { originalError: error.name },
  );
}

/**
 * Generate error response based on environment
 */
function generateErrorResponse(error, req) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  const baseResponse = {
    success: false,
    error: {
      message: error.message,
      category: error.category,
      timestamp: error.timestamp,
      requestId: req.id || req.headers['x-request-id'],
    },
  };

  // Add additional details in development
  if (isDevelopment) {
    baseResponse.error.details = error.details;
    baseResponse.error.stack = error.stack;
    baseResponse.error.name = error.name;
  }

  // Add safe details in production for certain error types
  if (isProduction) {
    if (error.category === ErrorCategories.VALIDATION) {
      baseResponse.error.details = error.details;
    }
    if (error.category === ErrorCategories.NOT_FOUND) {
      baseResponse.error.resource = error.details?.resource;
    }
  }

  return baseResponse;
}

/**
 * Log error with appropriate level and context
 */
function logError(error, req, res) {
  const logContext = {
    error: {
      name: error.name,
      message: error.message,
      category: error.category,
      statusCode: error.statusCode,
      stack: error.stack,
    },
    request: {
      id: req.id,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    },
    timestamp: new Date().toISOString(),
  };

  // Log level based on error severity
  if (error.statusCode >= 500) {
    logger.error('Server Error', logContext);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', logContext);
  } else {
    logger.info('Error Handled', logContext);
  }

  // Send to external error tracking service in production
  if (process.env.NODE_ENV === 'production' && error.statusCode >= 500) {
    // Integration point for services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { contexts: { request: logContext.request } });
  }
}

/**
 * Main error handling middleware
 */
function errorHandler(error, req, res, next) {
  // Normalize the error
  const normalizedError = normalizeError(error);

  // Log the error
  logError(normalizedError, req, res);

  // Generate response
  const errorResponse = generateErrorResponse(normalizedError, req);

  // Send response
  res.status(normalizedError.statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`, {
    method: req.method,
    url: req.originalUrl,
  });
  next(error);
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler for express-validator
 */
function validationErrorHandler(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationError = new ValidationError('Validation failed', {
      fields: errors.array(),
    });
    return next(validationError);
  }

  next();
}

/**
 * Rate limiting error handler
 */
function rateLimitErrorHandler(req, res, next) {
  const error = new RateLimitError('Too many requests, please try again later', {
    limit: req.rateLimit?.limit,
    remaining: req.rateLimit?.remaining,
    resetTime: req.rateLimit?.resetTime,
  });
  next(error);
}

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  SupabaseError,
  ArtifactRegistryError,
  RateLimitError,
  ExternalAPIError,

  // Error categories
  ErrorCategories,

  // Middleware functions
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  rateLimitErrorHandler,

  // Utilities
  normalizeError,
  ErrorDetectors,
};
