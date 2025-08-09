const { logger } = require('@librechat/data-schemas');
const ArtifactValidationService = require('./index');
const { getArtifactValidationConfig } = require('../Config/getCustomConfig');
const { findAllArtifacts } = require('../Artifacts/update');

/**
 * Artifact Validation Middleware
 * Integrates with the AI response processing pipeline to validate React artifacts
 */
class ArtifactValidationMiddleware {
  constructor() {
    this.validationService = new ArtifactValidationService();
  }

  /**
   * Validates artifacts in a message and handles retry logic
   * @param {Object} message - The message containing artifacts
   * @param {Function} aiClient - The AI client function for retry attempts
   * @param {Object} context - Additional context for validation
   * @param {Object} res - Express response object for streaming (optional)
   * @returns {Promise<Object>} Processed message with validated artifacts
   */
  async validateMessage(message, aiClient, context = {}, res = null) {
    try {
      // Get validation configuration
      const config = await getArtifactValidationConfig();

      logger.debug('[ArtifactValidationMiddleware] Processing message for artifacts', {
        messageId: message.messageId,
        hasContent: !!message.content,
        hasText: !!message.text,
        streamingEnabled: config.streaming.enabled && !!res,
        validationEnabled: config.enabled,
      });

      // Early return if validation is disabled
      if (!config.enabled) {
        logger.debug('[ArtifactValidationMiddleware] Validation disabled, skipping');
        return { message, validationResults: [] };
      }

      // Find all artifacts in the message
      const artifacts = findAllArtifacts(message);

      if (artifacts.length === 0) {
        logger.debug('[ArtifactValidationMiddleware] No artifacts found in message');
        return { message, validationResults: [] };
      }

      logger.debug('[ArtifactValidationMiddleware] Found artifacts', {
        count: artifacts.length,
        messageId: message.messageId,
      });

      // Process each artifact
      const validationResults = [];
      let processedMessage = { ...message };

      for (let i = 0; i < artifacts.length; i++) {
        const artifactBoundary = artifacts[i];

        try {
          // Parse the artifact from the boundary
          const parsedArtifact = this.parseArtifactFromBoundary(artifactBoundary);

          if (!parsedArtifact) {
            logger.warn('[ArtifactValidationMiddleware] Could not parse artifact', {
              index: i,
              messageId: message.messageId,
            });

            // Add result for unparseable artifact
            validationResults.push({
              index: i,
              success: false,
              error: 'Could not parse artifact - missing or malformed metadata',
              attempts: 0,
              skipped: true,
              reason: 'PARSE_FAILED',
            });
            continue;
          }

          // Check if this artifact type should be validated
          if (!this.shouldValidateArtifact(parsedArtifact)) {
            logger.debug(
              '[ArtifactValidationMiddleware] Skipping validation for unsupported artifact type',
              {
                index: i,
                messageId: message.messageId,
                artifactType: parsedArtifact.type,
                identifier: parsedArtifact.identifier,
              },
            );

            // Add result for skipped artifact
            validationResults.push({
              index: i,
              originalArtifact: parsedArtifact,
              success: true,
              artifact: parsedArtifact,
              attempts: 0,
              skipped: true,
              reason: 'UNSUPPORTED_TYPE',
            });
            continue;
          }

          // Validate the artifact with streaming feedback
          const validationResult = await this.validationService.validateArtifact(
            parsedArtifact,
            aiClient,
            {
              ...context,
              messageId: message.messageId,
              artifactIndex: i,
            },
            res, // Pass response stream for streaming feedback
          );

          validationResults.push({
            index: i,
            originalArtifact: parsedArtifact,
            ...validationResult,
          });

          // If validation failed or artifact was modified, update the message
          if (!validationResult.success || validationResult.artifact !== parsedArtifact) {
            processedMessage = this.updateMessageWithValidatedArtifact(
              processedMessage,
              artifactBoundary,
              validationResult.artifact,
              validationResult,
            );
          }
        } catch (error) {
          logger.error('[ArtifactValidationMiddleware] Error validating artifact', {
            index: i,
            messageId: message.messageId,
            error: error.message,
            stack: error.stack,
            artifactBoundary: {
              start: artifactBoundary.start,
              end: artifactBoundary.end,
              source: artifactBoundary.source,
              textLength: artifactBoundary.text ? artifactBoundary.text.length : 0,
              textPreview: artifactBoundary.text
                ? artifactBoundary.text.substring(0, 200) + '...'
                : 'No text',
            },
          });

          validationResults.push({
            index: i,
            success: false,
            error: error.message,
            attempts: 0,
          });
        }
      }

      // Calculate final statistics
      const successCount = validationResults.filter((r) => r.success).length;
      const failureCount = validationResults.filter((r) => !r.success).length;

      logger.debug('[ArtifactValidationMiddleware] Validation completed', {
        messageId: message.messageId,
        totalArtifacts: artifacts.length,
        successfulValidations: successCount,
        failedValidations: failureCount,
      });

      return {
        message: processedMessage,
        validationResults,
        hasValidationErrors: validationResults.some((r) => !r.success),
      };
    } catch (error) {
      logger.error('[ArtifactValidationMiddleware] Error in validation middleware', {
        messageId: message.messageId,
        error: error.message,
        stack: error.stack,
      });

      return {
        message,
        validationResults: [],
        error: error.message,
      };
    }
  }

  /**
   * Parses an artifact from a boundary object
   * @param {Object} artifactBoundary - The artifact boundary from findAllArtifacts
   * @returns {Object|null} Parsed artifact object
   */
  parseArtifactFromBoundary(artifactBoundary) {
    try {
      const { text, start, end } = artifactBoundary;
      const artifactText = text.substring(start, end);

      logger.debug('[ArtifactValidationMiddleware] Parsing artifact boundary', {
        start,
        end,
        textLength: text.length,
        artifactTextLength: artifactText.length,
        artifactTextPreview: artifactText.substring(0, 300) + '...',
      });

      // Extract artifact metadata from the opening tag
      const metadataMatch = artifactText.match(/:::artifact\{([^}]+)\}/);
      if (!metadataMatch) {
        logger.warn('[ArtifactValidationMiddleware] No metadata found in artifact', {
          artifactTextPreview: artifactText.substring(0, 500) + '...',
          hasArtifactTag: artifactText.includes(':::artifact'),
          hasOpeningBrace: artifactText.includes(':::artifact{'),
          hasClosingBrace: artifactText.includes('}'),
        });
        return null;
      }

      // Parse metadata attributes
      const metadataStr = metadataMatch[1];
      const metadata = this.parseArtifactMetadata(metadataStr);

      // Extract content between code blocks or artifact boundaries
      const contentStart = artifactText.indexOf('\n') + 1;
      const contentEnd = artifactText.lastIndexOf(':::');

      if (contentStart === -1 || contentEnd === -1) {
        logger.warn('[ArtifactValidationMiddleware] Could not find content boundaries', {
          contentStart,
          contentEnd,
          artifactTextLength: artifactText.length,
          hasNewline: artifactText.includes('\n'),
          hasClosingTag: artifactText.includes(':::'),
          artifactTextPreview: artifactText.substring(0, 500) + '...',
        });
        return null;
      }

      let content = artifactText.substring(contentStart, contentEnd).trim();

      // Remove code block markers if present
      if (content.startsWith('```') && content.endsWith('```')) {
        const firstNewline = content.indexOf('\n');
        const lastNewline = content.lastIndexOf('\n');
        if (firstNewline !== -1 && lastNewline !== -1 && lastNewline > firstNewline) {
          content = content.substring(firstNewline + 1, lastNewline);
        }
      }

      const parsedArtifact = {
        ...metadata,
        content: content.trim(),
        originalText: artifactText,
        boundary: artifactBoundary,
      };

      logger.debug('[ArtifactValidationMiddleware] Successfully parsed artifact', {
        identifier: parsedArtifact.identifier,
        type: parsedArtifact.type,
        title: parsedArtifact.title,
        contentLength: parsedArtifact.content.length,
        contentPreview: parsedArtifact.content.substring(0, 200) + '...',
      });

      return parsedArtifact;
    } catch (error) {
      logger.error('[ArtifactValidationMiddleware] Error parsing artifact', {
        error: error.message,
        stack: error.stack,
        artifactBoundary: {
          start: artifactBoundary?.start,
          end: artifactBoundary?.end,
          source: artifactBoundary?.source,
          textLength: artifactBoundary?.text ? artifactBoundary.text.length : 0,
        },
      });
      return null;
    }
  }

  /**
   * Parses artifact metadata from the attribute string
   * @param {string} metadataStr - The metadata string from the artifact tag
   * @returns {Object} Parsed metadata object
   */
  parseArtifactMetadata(metadataStr) {
    const metadata = {};

    // Parse key="value" pairs
    const attributeRegex = /(\w+)=["']([^"']+)["']/g;
    let match;

    while ((match = attributeRegex.exec(metadataStr)) !== null) {
      metadata[match[1]] = match[2];
    }

    return metadata;
  }

  /**
   * Updates the message with a validated artifact
   * @param {Object} message - The message to update
   * @param {Object} artifactBoundary - The original artifact boundary
   * @param {Object} validatedArtifact - The validated artifact
   * @param {Object} validationResult - The validation result
   * @returns {Object} Updated message
   */
  updateMessageWithValidatedArtifact(
    message,
    artifactBoundary,
    validatedArtifact,
    validationResult,
  ) {
    try {
      // Create the updated artifact text
      let updatedArtifactText = this.reconstructArtifactText(validatedArtifact, validationResult);

      // Add validation error information if validation failed
      if (!validationResult.success && validationResult.errors) {
        updatedArtifactText += this.generateValidationErrorComment(validationResult.errors);
      }

      // Update the appropriate text field
      const updatedMessage = { ...message };

      if (artifactBoundary.source === 'content' && message.content) {
        updatedMessage.content = [...message.content];
        const part = updatedMessage.content[artifactBoundary.partIndex];

        if (part && part.type === 'text') {
          const originalText = part.text;
          const newText =
            originalText.substring(0, artifactBoundary.start) +
            updatedArtifactText +
            originalText.substring(artifactBoundary.end);

          updatedMessage.content[artifactBoundary.partIndex] = {
            ...part,
            text: newText,
          };
        }
      } else if (artifactBoundary.source === 'text' && message.text) {
        updatedMessage.text =
          message.text.substring(0, artifactBoundary.start) +
          updatedArtifactText +
          message.text.substring(artifactBoundary.end);
      }

      return updatedMessage;
    } catch (error) {
      logger.error(
        '[ArtifactValidationMiddleware] Error updating message with validated artifact',
        {
          error: error.message,
        },
      );
      return message;
    }
  }

  /**
   * Reconstructs the artifact text from a validated artifact
   * @param {Object} artifact - The validated artifact
   * @param {Object} validationResult - The validation result
   * @returns {string} Reconstructed artifact text
   */
  reconstructArtifactText(artifact, _validationResult) {
    const { identifier, type, title } = artifact;
    const content = artifact.content || '';

    // Determine the language for code blocks based on type
    let language = '';
    if (type === 'application/vnd.react') {
      language = 'tsx';
    } else if (type === 'text/html') {
      language = 'html';
    } else if (type === 'application/vnd.mermaid') {
      language = 'mermaid';
    }

    // Construct the artifact text
    const metadataStr = `identifier="${identifier}" type="${type}" title="${title}"`;
    const artifactText = `:::artifact{${metadataStr}}
\`\`\`${language}
${content}
\`\`\`
:::`;

    return artifactText;
  }

  /**
   * Generates a comment with validation error information
   * @param {Array} errors - Array of validation errors
   * @returns {string} Error comment
   */
  generateValidationErrorComment(errors) {
    if (!errors || errors.length === 0) {
      return '';
    }

    const errorSummary = errors
      .slice(0, 3)
      .map((error) => `- ${error.title}: ${error.message}`)
      .join('\n');

    const moreErrors = errors.length > 3 ? `\n- ... and ${errors.length - 3} more errors` : '';

    return `\n\n<!-- Validation Errors Found:\n${errorSummary}${moreErrors}\n-->`;
  }

  /**
   * Determines if an artifact should be validated
   * Delegates to the validation service's shouldValidate method
   * @param {Object} artifact - The artifact to check
   * @returns {boolean} Whether the artifact should be validated
   */
  shouldValidateArtifact(artifact) {
    return this.validationService.shouldValidate(artifact);
  }

  /**
   * Gets validation statistics
   * @returns {Promise<Object>} Current validation statistics
   */
  async getStats() {
    return await this.validationService.getStats();
  }

  /**
   * Resets validation statistics
   */
  resetStats() {
    this.validationService.resetStats();
  }
}

module.exports = ArtifactValidationMiddleware;
