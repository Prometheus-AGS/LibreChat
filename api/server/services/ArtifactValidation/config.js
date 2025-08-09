const { logger } = require('@librechat/data-schemas');

/**
 * Artifact Validation Configuration
 * Manages configuration options for the artifact validation system
 */
class ArtifactValidationConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables and defaults
   * @returns {Object} Configuration object
   */
  loadConfig() {
    const config = {
      // Enable/disable artifact validation
      enabled: this.parseBoolean(process.env.ARTIFACT_VALIDATION_ENABLED, true),

      // Maximum number of retry attempts for failed validations
      maxRetries: this.parseInt(process.env.ARTIFACT_VALIDATION_MAX_RETRIES, 3),

      // Timeout for validation operations (in milliseconds)
      validationTimeout: this.parseInt(process.env.ARTIFACT_VALIDATION_TIMEOUT, 30000),

      // Timeout for TypeScript compilation (in milliseconds)
      compilationTimeout: this.parseInt(process.env.ARTIFACT_COMPILATION_TIMEOUT, 10000),

      // Enable/disable retry logic for failed validations
      retryEnabled: this.parseBoolean(process.env.ARTIFACT_VALIDATION_RETRY_ENABLED, true),

      // Types of artifacts to validate
      validatedTypes: this.parseArray(process.env.ARTIFACT_VALIDATION_TYPES, [
        'application/vnd.react',
      ]),

      // Enable/disable detailed logging
      detailedLogging: this.parseBoolean(process.env.ARTIFACT_VALIDATION_DETAILED_LOGGING, false),

      // Enable/disable performance metrics collection
      metricsEnabled: this.parseBoolean(process.env.ARTIFACT_VALIDATION_METRICS_ENABLED, true),

      // Cache validation results for identical artifacts
      cacheEnabled: this.parseBoolean(process.env.ARTIFACT_VALIDATION_CACHE_ENABLED, true),

      // Cache TTL in milliseconds
      cacheTtl: this.parseInt(process.env.ARTIFACT_VALIDATION_CACHE_TTL, 300000), // 5 minutes

      // Maximum cache size (number of entries)
      maxCacheSize: this.parseInt(process.env.ARTIFACT_VALIDATION_MAX_CACHE_SIZE, 1000),

      // TypeScript compiler options
      typescript: {
        // Enable strict mode
        strict: this.parseBoolean(process.env.ARTIFACT_TS_STRICT, true),

        // Target ECMAScript version
        target: process.env.ARTIFACT_TS_TARGET || 'ES2020',

        // Module system
        module: process.env.ARTIFACT_TS_MODULE || 'ESNext',

        // JSX mode
        jsx: process.env.ARTIFACT_TS_JSX || 'react-jsx',

        // Enable source maps
        sourceMap: this.parseBoolean(process.env.ARTIFACT_TS_SOURCE_MAP, false),

        // Skip lib check
        skipLibCheck: this.parseBoolean(process.env.ARTIFACT_TS_SKIP_LIB_CHECK, true),

        // Allow synthetic default imports
        allowSyntheticDefaultImports: this.parseBoolean(
          process.env.ARTIFACT_TS_ALLOW_SYNTHETIC_DEFAULT_IMPORTS,
          true,
        ),

        // Enable ES module interop
        esModuleInterop: this.parseBoolean(process.env.ARTIFACT_TS_ES_MODULE_INTEROP, true),
      },

      // Error filtering options
      errorFiltering: {
        // Ignore import resolution errors for known libraries
        ignoreImportErrors: this.parseBoolean(
          process.env.ARTIFACT_VALIDATION_IGNORE_IMPORT_ERRORS,
          true,
        ),

        // Ignore type-only errors that don't affect runtime
        ignoreTypeOnlyErrors: this.parseBoolean(
          process.env.ARTIFACT_VALIDATION_IGNORE_TYPE_ONLY_ERRORS,
          true,
        ),

        // Maximum number of errors to report
        maxErrorsReported: this.parseInt(process.env.ARTIFACT_VALIDATION_MAX_ERRORS_REPORTED, 10),

        // Error codes to ignore
        ignoredErrorCodes: this.parseArray(process.env.ARTIFACT_VALIDATION_IGNORED_ERROR_CODES, [
          '2307', // Cannot find module
          '2339', // Property does not exist on type (for dynamic props)
          '2322', // Type assignment errors for flexible props
        ]),
      },

      // AI retry configuration
      aiRetry: {
        // Model to use for retry attempts (defaults to same model)
        model: process.env.ARTIFACT_VALIDATION_RETRY_MODEL || null,

        // Temperature for retry attempts
        temperature: this.parseFloat(process.env.ARTIFACT_VALIDATION_RETRY_TEMPERATURE, 0.1),

        // Maximum tokens for retry responses
        maxTokens: this.parseInt(process.env.ARTIFACT_VALIDATION_RETRY_MAX_TOKENS, 4000),

        // Include original error context in retry prompts
        includeErrorContext: this.parseBoolean(
          process.env.ARTIFACT_VALIDATION_RETRY_INCLUDE_ERROR_CONTEXT,
          true,
        ),

        // Include artifact metadata in retry prompts
        includeMetadata: this.parseBoolean(
          process.env.ARTIFACT_VALIDATION_RETRY_INCLUDE_METADATA,
          true,
        ),
      },

      // Development mode settings
      development: {
        // Enable in development mode
        enabled: this.parseBoolean(process.env.ARTIFACT_VALIDATION_DEV_ENABLED, true),

        // Skip validation in development
        skipValidation: this.parseBoolean(process.env.ARTIFACT_VALIDATION_DEV_SKIP, false),

        // Enable debug output
        debug: this.parseBoolean(process.env.ARTIFACT_VALIDATION_DEV_DEBUG, false),

        // Save failed artifacts for debugging
        saveFailedArtifacts: this.parseBoolean(
          process.env.ARTIFACT_VALIDATION_DEV_SAVE_FAILED,
          false,
        ),
      },
    };

    // Log configuration on startup
    if (config.detailedLogging) {
      logger.debug('[ArtifactValidationConfig] Configuration loaded', {
        enabled: config.enabled,
        maxRetries: config.maxRetries,
        validatedTypes: config.validatedTypes,
        retryEnabled: config.retryEnabled,
        cacheEnabled: config.cacheEnabled,
      });
    }

    return config;
  }

  /**
   * Parse boolean environment variable
   * @param {string} value - Environment variable value
   * @param {boolean} defaultValue - Default value if not set
   * @returns {boolean} Parsed boolean value
   */
  parseBoolean(value, defaultValue) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Parse integer environment variable
   * @param {string} value - Environment variable value
   * @param {number} defaultValue - Default value if not set
   * @returns {number} Parsed integer value
   */
  parseInt(value, defaultValue) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse float environment variable
   * @param {string} value - Environment variable value
   * @param {number} defaultValue - Default value if not set
   * @returns {number} Parsed float value
   */
  parseFloat(value, defaultValue) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse array environment variable (comma-separated)
   * @param {string} value - Environment variable value
   * @param {Array} defaultValue - Default value if not set
   * @returns {Array} Parsed array value
   */
  parseArray(value, defaultValue) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key (supports dot notation)
   * @returns {*} Configuration value
   */
  get(key) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key (supports dot notation)
   * @param {*} value - Configuration value
   */
  set(key, value) {
    const keys = key.split('.');
    let target = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    target[keys[keys.length - 1]] = value;
  }

  /**
   * Check if validation is enabled
   * @returns {boolean} True if validation is enabled
   */
  isEnabled() {
    return this.config.enabled;
  }

  /**
   * Check if retry is enabled
   * @returns {boolean} True if retry is enabled
   */
  isRetryEnabled() {
    return this.config.retryEnabled && this.config.enabled;
  }

  /**
   * Check if caching is enabled
   * @returns {boolean} True if caching is enabled
   */
  isCacheEnabled() {
    return this.config.cacheEnabled && this.config.enabled;
  }

  /**
   * Check if metrics collection is enabled
   * @returns {boolean} True if metrics are enabled
   */
  isMetricsEnabled() {
    return this.config.metricsEnabled && this.config.enabled;
  }

  /**
   * Check if an artifact type should be validated
   * @param {string} type - Artifact type
   * @returns {boolean} True if type should be validated
   */
  shouldValidateType(type) {
    return this.config.validatedTypes.includes(type);
  }

  /**
   * Get the complete configuration object
   * @returns {Object} Configuration object
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Reload configuration from environment variables
   */
  reload() {
    this.config = this.loadConfig();
    logger.info('[ArtifactValidationConfig] Configuration reloaded');
  }

  /**
   * Validate configuration values
   * @returns {Array} Array of validation errors
   */
  validate() {
    const errors = [];

    if (this.config.maxRetries < 0 || this.config.maxRetries > 10) {
      errors.push('maxRetries must be between 0 and 10');
    }

    if (this.config.validationTimeout < 1000 || this.config.validationTimeout > 120000) {
      errors.push('validationTimeout must be between 1000 and 120000 milliseconds');
    }

    if (this.config.compilationTimeout < 1000 || this.config.compilationTimeout > 60000) {
      errors.push('compilationTimeout must be between 1000 and 60000 milliseconds');
    }

    if (this.config.cacheTtl < 60000 || this.config.cacheTtl > 3600000) {
      errors.push('cacheTtl must be between 60000 and 3600000 milliseconds');
    }

    if (this.config.maxCacheSize < 10 || this.config.maxCacheSize > 10000) {
      errors.push('maxCacheSize must be between 10 and 10000');
    }

    if (this.config.aiRetry.temperature < 0 || this.config.aiRetry.temperature > 2) {
      errors.push('aiRetry.temperature must be between 0 and 2');
    }

    if (this.config.aiRetry.maxTokens < 100 || this.config.aiRetry.maxTokens > 8000) {
      errors.push('aiRetry.maxTokens must be between 100 and 8000');
    }

    return errors;
  }
}

// Create singleton instance
const artifactValidationConfig = new ArtifactValidationConfig();

// Validate configuration on startup
const configErrors = artifactValidationConfig.validate();
if (configErrors.length > 0) {
  logger.warn('[ArtifactValidationConfig] Configuration validation warnings', {
    errors: configErrors,
  });
}

module.exports = artifactValidationConfig;
