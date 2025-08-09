const { logger } = require('@librechat/data-schemas');
const { sendEvent } = require('@librechat/api');

/**
 * Streaming Feedback Service for Artifact Validation
 * Provides real-time user feedback during the validation process
 */
class StreamingFeedbackService {
  constructor(res, config = {}) {
    this.res = res;
    this.enabled = config.enabled !== false; // Default to enabled
    this.detailed = config.detailed || false;
    this.delay = config.delay || 100; // Small delay for better UX
    this.messageId = config.messageId || null;
    this.userId = config.userId || null;
  }

  /**
   * Send a validation progress update to the client
   * @param {string} type - The type of progress update
   * @param {Object} data - Additional data for the update
   */
  async sendProgress(type, data = {}) {
    if (!this.enabled || !this.res) {
      return;
    }

    try {
      const event = {
        data: {
          type: 'artifact_validation_progress',
          subType: type,
          messageId: this.messageId,
          timestamp: new Date().toISOString(),
          ...data,
        },
      };

      sendEvent(this.res, event);

      // Add small delay for better UX
      if (this.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delay));
      }

      logger.debug('[StreamingFeedback] Sent progress update', {
        type,
        messageId: this.messageId,
        userId: this.userId,
      });
    } catch (error) {
      logger.error('[StreamingFeedback] Error sending progress update', {
        type,
        error: error.message,
        messageId: this.messageId,
      });
    }
  }

  /**
   * Send validation start message
   * @param {number} totalArtifacts - Total number of artifacts to validate
   */
  async sendValidationStart(totalArtifacts) {
    const message =
      totalArtifacts === 1 ? 'Validating artifact...' : `Validating ${totalArtifacts} artifacts...`;

    await this.sendProgress('validation_start', {
      message,
      totalArtifacts,
      currentArtifact: 0,
    });
  }

  /**
   * Send artifact processing start message
   * @param {number} currentIndex - Current artifact index (0-based)
   * @param {number} totalArtifacts - Total number of artifacts
   * @param {string} artifactType - Type of artifact being processed
   */
  async sendArtifactStart(currentIndex, totalArtifacts, artifactType = 'component') {
    const artifactNumber = currentIndex + 1;
    const message =
      totalArtifacts === 1
        ? `Validating ${artifactType}...`
        : `Validating ${artifactType} ${artifactNumber}/${totalArtifacts}...`;

    await this.sendProgress('artifact_start', {
      message,
      currentArtifact: artifactNumber,
      totalArtifacts,
      artifactType,
    });
  }

  /**
   * Send compilation start message
   */
  async sendCompilationStart() {
    await this.sendProgress('compilation_start', {
      message: 'Compiling TypeScript...',
    });
  }

  /**
   * Send compilation success message
   */
  async sendCompilationSuccess() {
    await this.sendProgress('compilation_success', {
      message: 'Compilation successful',
    });
  }

  /**
   * Send compilation failure message
   * @param {Array} errors - Compilation errors
   * @param {number} attempt - Current retry attempt (1-based)
   * @param {number} maxAttempts - Maximum retry attempts
   */
  async sendCompilationFailure(errors, attempt, maxAttempts) {
    const message = `Compilation failed, attempting fix ${attempt}/${maxAttempts}...`;

    await this.sendProgress('compilation_failure', {
      message,
      attempt,
      maxAttempts,
      errorCount: errors.length,
      errors: this.detailed ? errors : undefined,
    });
  }

  /**
   * Send retry attempt message
   * @param {number} attempt - Current retry attempt (1-based)
   * @param {number} maxAttempts - Maximum retry attempts
   */
  async sendRetryAttempt(attempt, maxAttempts) {
    await this.sendProgress('retry_attempt', {
      message: 'Retrying with AI assistance...',
      attempt,
      maxAttempts,
    });
  }

  /**
   * Send fix success message
   */
  async sendFixSuccess() {
    await this.sendProgress('fix_success', {
      message: 'Fix successful, validation completed',
    });
  }

  /**
   * Send fix failure message
   * @param {number} attempt - Failed attempt number (1-based)
   * @param {number} maxAttempts - Maximum retry attempts
   */
  async sendFixFailure(attempt, maxAttempts) {
    const message =
      attempt < maxAttempts
        ? `Fix attempt ${attempt} failed, trying ${attempt + 1}/${maxAttempts}...`
        : `All fix attempts failed, showing original with errors`;

    await this.sendProgress('fix_failure', {
      message,
      attempt,
      maxAttempts,
      isFinalAttempt: attempt >= maxAttempts,
    });
  }

  /**
   * Send artifact completion message
   * @param {boolean} success - Whether the artifact validation was successful
   * @param {number} currentIndex - Current artifact index (0-based)
   * @param {number} totalArtifacts - Total number of artifacts
   */
  async sendArtifactComplete(success, currentIndex, totalArtifacts) {
    const artifactNumber = currentIndex + 1;
    const message = success
      ? `Artifact ${artifactNumber}/${totalArtifacts} validated successfully`
      : `Artifact ${artifactNumber}/${totalArtifacts} validation completed with errors`;

    await this.sendProgress('artifact_complete', {
      message,
      success,
      currentArtifact: artifactNumber,
      totalArtifacts,
    });
  }

  /**
   * Send validation completion message
   * @param {number} totalArtifacts - Total number of artifacts processed
   * @param {number} successCount - Number of successfully validated artifacts
   * @param {number} failureCount - Number of failed validations
   */
  async sendValidationComplete(totalArtifacts, successCount, failureCount) {
    let message;
    if (failureCount === 0) {
      message =
        totalArtifacts === 1
          ? 'Artifact validation completed successfully'
          : `All ${totalArtifacts} artifacts validated successfully`;
    } else if (successCount === 0) {
      message =
        totalArtifacts === 1
          ? 'Artifact validation completed with errors'
          : `All ${totalArtifacts} artifacts completed with errors`;
    } else {
      message = `Validation completed: ${successCount}/${totalArtifacts} successful`;
    }

    await this.sendProgress('validation_complete', {
      message,
      totalArtifacts,
      successCount,
      failureCount,
      allSuccessful: failureCount === 0,
    });
  }

  /**
   * Send error message
   * @param {string} error - Error message
   * @param {string} context - Context where the error occurred
   */
  async sendError(error, context = 'validation') {
    await this.sendProgress('error', {
      message: `Error during ${context}: ${error}`,
      error,
      context,
    });
  }

  /**
   * Create a new streaming feedback instance
   * @param {Object} res - Express response object
   * @param {Object} config - Configuration options
   * @returns {StreamingFeedbackService} New instance
   */
  static create(res, config = {}) {
    return new StreamingFeedbackService(res, config);
  }

  /**
   * Check if streaming is enabled based on configuration
   * @param {Object} config - Configuration object
   * @returns {boolean} Whether streaming is enabled
   */
  static isEnabled(config = {}) {
    return config.enabled !== false;
  }
}

module.exports = StreamingFeedbackService;
