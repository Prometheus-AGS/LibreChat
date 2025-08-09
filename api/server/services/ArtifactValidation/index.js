const { logger } = require('@librechat/data-schemas');
const TypeScriptValidator = require('./TypeScriptValidator');
const RetryManager = require('./RetryManager');
const ErrorFormatter = require('./ErrorFormatter');
const StreamingFeedbackService = require('./StreamingFeedback');
const { getArtifactValidationConfig } = require('../Config/getCustomConfig');

/**
 * Main Artifact Validation Service
 * Validates React artifacts using TypeScript compilation and handles retry logic
 */
class ArtifactValidationService {
  constructor() {
    this.validator = new TypeScriptValidator();
    this.retryManager = new RetryManager();
    this.errorFormatter = new ErrorFormatter();
    this.streamingFeedback = new StreamingFeedbackService();
    this.config = null;
  }

  /**
   * Initialize the service with configuration
   */
  async initialize() {
    if (!this.config) {
      this.config = await getArtifactValidationConfig();
    }
  }

  /**
   * Get current configuration, initializing if needed
   */
  async getConfig() {
    if (!this.config) {
      await this.initialize();
    }
    return this.config;
  }

  /**
   * Validates an artifact and handles retry logic if compilation fails
   * @param {Object} artifact - The artifact object containing code and metadata
   * @param {Function} aiClient - The AI client function for retry attempts
   * @param {Object} context - Additional context for validation and retry
   * @param {Object} responseStream - Optional response stream for streaming feedback
   * @returns {Promise<Object>} Validation result with success status and processed artifact
   */
  async validateArtifact(artifact, aiClient, context = {}, responseStream = null) {
    const config = await this.getConfig();

    if (!config.enabled) {
      logger.debug('[ArtifactValidation] Validation disabled, skipping');
      return { success: true, artifact, attempts: 0 };
    }

    if (!this.shouldValidate(artifact)) {
      logger.debug('[ArtifactValidation] Artifact type does not require validation', {
        type: artifact.type,
        identifier: artifact.identifier,
        reason: 'UNSUPPORTED_TYPE',
      });
      return {
        success: true,
        artifact,
        attempts: 0,
        skipped: true,
        reason: 'UNSUPPORTED_TYPE',
      };
    }

    logger.debug('[ArtifactValidation] Starting validation for artifact', {
      type: artifact.type,
      identifier: artifact.identifier,
    });

    // Send initial validation start message
    if (responseStream && config.streaming.enabled) {
      await this.streamingFeedback.sendValidationStart(responseStream, {
        artifactId: artifact.identifier,
        artifactType: artifact.type,
      });
    }

    let currentArtifact = artifact;
    let attempts = 0;
    let lastError = null;

    while (attempts < config.maxRetries) {
      attempts++;

      // Send progress update for current attempt
      if (responseStream && config.streaming.enabled) {
        await this.streamingFeedback.sendValidationProgress(responseStream, {
          artifactId: artifact.identifier,
          currentAttempt: attempts,
          totalAttempts: config.maxRetries,
          status: 'validating',
        });
      }

      try {
        const validationResult = await this.validateWithTimeout(currentArtifact, config.timeout);

        if (validationResult.success) {
          logger.info('[ArtifactValidation] Validation successful', {
            identifier: artifact.identifier,
            attempts,
          });

          // Send success message
          if (responseStream && config.streaming.enabled) {
            await this.streamingFeedback.sendValidationSuccess(responseStream, {
              artifactId: artifact.identifier,
              attempts,
            });
          }

          return {
            success: true,
            artifact: currentArtifact,
            attempts,
            validationResult,
          };
        }

        lastError = validationResult.errors;
        logger.warn('[ArtifactValidation] Validation failed', {
          identifier: artifact.identifier,
          attempt: attempts,
          errors: validationResult.errors.length,
        });

        // Send compilation failure message
        if (responseStream && config.streaming.enabled) {
          await this.streamingFeedback.sendCompilationFailure(responseStream, {
            artifactId: artifact.identifier,
            attempt: attempts,
            totalAttempts: config.maxRetries,
            errorCount: validationResult.errors.length,
          });
        }

        // If this is not the last attempt, try to fix the code
        if (attempts < config.maxRetries && aiClient) {
          logger.debug('[ArtifactValidation] Attempting code fix', {
            identifier: artifact.identifier,
            attempt: attempts,
          });

          // Send retry attempt message
          if (responseStream && config.streaming.enabled) {
            await this.streamingFeedback.sendRetryAttempt(responseStream, {
              artifactId: artifact.identifier,
              attempt: attempts,
              totalAttempts: config.maxRetries,
            });
          }

          const fixedArtifact = await this.retryManager.attemptFix(
            currentArtifact,
            validationResult.errors,
            aiClient,
            context,
          );

          if (fixedArtifact) {
            currentArtifact = fixedArtifact;
            continue;
          }
        }

        break;
      } catch (error) {
        logger.error('[ArtifactValidation] Validation error', {
          identifier: artifact.identifier,
          attempt: attempts,
          error: error.message,
        });

        lastError = [{ message: `Validation service error: ${error.message}` }];
        break;
      }
    }

    // All attempts failed, return the last attempt with errors
    const formattedErrors = this.errorFormatter.formatErrors(lastError);

    logger.warn('[ArtifactValidation] All validation attempts failed', {
      identifier: artifact.identifier,
      totalAttempts: attempts,
      finalErrors: formattedErrors.length,
    });

    // Send final failure message
    if (responseStream && config.streaming.enabled) {
      await this.streamingFeedback.sendValidationFailure(responseStream, {
        artifactId: artifact.identifier,
        totalAttempts: attempts,
        errorCount: formattedErrors.length,
      });
    }

    return {
      success: false,
      artifact: currentArtifact,
      attempts,
      errors: formattedErrors,
      validationFailed: true,
    };
  }

  /**
   * Validates an artifact with timeout protection
   * @param {Object} artifact - The artifact to validate
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>} Validation result
   */
  async validateWithTimeout(artifact, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Validation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.validator
        .validate(artifact)
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Determines if an artifact should be validated
   * @param {Object} artifact - The artifact to check
   * @returns {boolean} Whether the artifact should be validated
   */
  shouldValidate(artifact) {
    if (!artifact) {
      logger.warn('[ArtifactValidation] No artifact provided for validation check');
      return false;
    }

    if (!artifact.type) {
      logger.warn('[ArtifactValidation] Artifact missing type property', {
        identifier: artifact.identifier,
        availableProperties: Object.keys(artifact),
      });
      return false;
    }

    // List of supported artifact types for validation
    const supportedTypes = ['application/vnd.react', 'text/tsx', 'text/typescript'];

    const isSupported = supportedTypes.includes(artifact.type);

    if (!isSupported) {
      logger.debug('[ArtifactValidation] Artifact type not supported for validation', {
        type: artifact.type,
        identifier: artifact.identifier,
        supportedTypes,
      });
    }

    return isSupported;
  }

  /**
   * Gets validation statistics
   * @returns {Promise<Object>} Current validation statistics
   */
  async getStats() {
    const config = await this.getConfig();
    return {
      enabled: config.enabled,
      maxRetries: config.maxRetries,
      timeout: config.timeout,
      streaming: config.streaming,
      validatorStats: this.validator.getStats(),
      retryStats: this.retryManager.getStats(),
    };
  }

  /**
   * Resets validation statistics
   */
  resetStats() {
    this.validator.resetStats();
    this.retryManager.resetStats();
  }
}

module.exports = ArtifactValidationService;
