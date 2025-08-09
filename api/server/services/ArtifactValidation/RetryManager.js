const { logger } = require('@librechat/data-schemas');

/**
 * Retry Manager for Artifact Validation
 * Handles retry logic and generates code-fixing prompts for failed validations
 */
class RetryManager {
  constructor() {
    this.stats = {
      retryAttempts: 0,
      successfulFixes: 0,
      failedFixes: 0,
      averageFixTime: 0,
    };
    this.totalFixTime = 0;
  }

  /**
   * Attempts to fix artifact code using AI model
   * @param {Object} artifact - The artifact with compilation errors
   * @param {Array} errors - Array of compilation errors
   * @param {Function} aiClient - The AI client function for generating fixes
   * @param {Object} context - Additional context for the fix attempt
   * @returns {Promise<Object|null>} Fixed artifact or null if fix failed
   */
  async attemptFix(artifact, errors, aiClient, context = {}) {
    const startTime = Date.now();
    this.stats.retryAttempts++;

    try {
      logger.debug('[RetryManager] Attempting code fix', {
        identifier: artifact.identifier,
        errorCount: errors.length,
        attempt: this.stats.retryAttempts,
      });

      // Generate code-fixing prompt
      const fixingPrompt = this.generateFixingPrompt(artifact, errors, context);

      // Call AI model to fix the code
      const fixedResponse = await this.callAIForFix(aiClient, fixingPrompt, context);

      if (!fixedResponse) {
        logger.warn('[RetryManager] AI client returned no response');
        this.updateStats(false, Date.now() - startTime);
        return null;
      }

      // Extract fixed artifact from AI response
      const fixedArtifact = this.extractFixedArtifact(fixedResponse, artifact);

      if (!fixedArtifact) {
        logger.warn('[RetryManager] Could not extract fixed artifact from AI response');
        this.updateStats(false, Date.now() - startTime);
        return null;
      }

      const fixTime = Date.now() - startTime;
      this.updateStats(true, fixTime);

      logger.debug('[RetryManager] Code fix completed', {
        identifier: artifact.identifier,
        fixTime,
        hasFixedCode: !!fixedArtifact.content,
      });

      return fixedArtifact;
    } catch (error) {
      const fixTime = Date.now() - startTime;
      this.updateStats(false, fixTime);

      logger.error('[RetryManager] Error during code fix attempt', {
        identifier: artifact.identifier,
        error: error.message,
        fixTime,
      });

      return null;
    }
  }

  /**
   * Generates a specialized prompt for fixing compilation errors
   * @param {Object} artifact - The artifact with errors
   * @param {Array} errors - Array of compilation errors
   * @param {Object} context - Additional context
   * @returns {string} The fixing prompt
   */
  generateFixingPrompt(artifact, errors, context) {
    const errorSummary = this.summarizeErrors(errors);
    const codeContent = this.extractCodeContent(artifact);

    const prompt = `You are a TypeScript/React expert helping to fix compilation errors in a React component artifact.

## Current Code with Errors:
\`\`\`tsx
${codeContent}
\`\`\`

## Compilation Errors Found:
${errorSummary}

## Fixing Guidelines:
1. **Import Fixes**: Ensure all imports use correct paths:
   - Use \`import { cn } from "/lib/utils"\` for utility functions
   - Use \`import { ComponentName } from "/components/ui/component-name"\` for shadcn/ui components
   - Use standard React imports: \`import { useState, useEffect } from "react"\`

2. **Type Safety**: Fix TypeScript errors while maintaining functionality:
   - Add proper type annotations where needed
   - Fix type mismatches and undefined property access
   - Ensure JSX elements have proper types

3. **React Best Practices**: 
   - Ensure components have proper default exports
   - Fix hook usage and dependency arrays
   - Maintain component structure and props

4. **Preserve Functionality**: Keep the original intent and functionality intact
   - Don't remove features or change component behavior
   - Maintain styling and layout structure
   - Keep all interactive elements working

## Response Format:
Please provide ONLY the corrected React component code in a single code block. Do not include explanations, comments about changes, or any other text. The response should be ready to use as-is.

\`\`\`tsx
// Your fixed code here
\`\`\``;

    return prompt;
  }

  /**
   * Summarizes compilation errors into a readable format
   * @param {Array} errors - Array of error objects
   * @returns {string} Formatted error summary
   */
  summarizeErrors(errors) {
    if (!errors || errors.length === 0) {
      return 'No specific errors provided.';
    }

    const errorsByCategory = this.groupErrorsByCategory(errors);
    const summary = [];

    Object.entries(errorsByCategory).forEach(([category, categoryErrors]) => {
      summary.push(`\n### ${category} Errors:`);
      categoryErrors.forEach((error, index) => {
        const location = error.line ? ` (Line ${error.line})` : '';
        summary.push(`${index + 1}. ${error.message}${location}`);
      });
    });

    return summary.join('\n');
  }

  /**
   * Groups errors by category for better organization
   * @param {Array} errors - Array of error objects
   * @returns {Object} Errors grouped by category
   */
  groupErrorsByCategory(errors) {
    const groups = {
      'Import/Module': [],
      Type: [],
      Syntax: [],
      JSX: [],
      Other: [],
    };

    errors.forEach((error) => {
      const message = error.message.toLowerCase();

      if (message.includes('cannot find module') || message.includes('import')) {
        groups['Import/Module'].push(error);
      } else if (
        message.includes('type') ||
        message.includes('property') ||
        (error.code >= 2300 && error.code < 2400)
      ) {
        groups['Type'].push(error);
      } else if (message.includes('syntax') || (error.code >= 1000 && error.code < 2000)) {
        groups['Syntax'].push(error);
      } else if (message.includes('jsx') || message.includes('element')) {
        groups['JSX'].push(error);
      } else {
        groups['Other'].push(error);
      }
    });

    // Remove empty categories
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }

  /**
   * Extracts code content from artifact
   * @param {Object} artifact - The artifact object
   * @returns {string} The code content
   */
  extractCodeContent(artifact) {
    if (typeof artifact.content === 'string') {
      return artifact.content;
    }

    if (artifact.code) {
      return artifact.code;
    }

    if (artifact.content && typeof artifact.content === 'object') {
      return artifact.content.code || artifact.content.content || '';
    }

    return '';
  }

  /**
   * Calls the AI client to generate fixed code
   * @param {Function} aiClient - The AI client function
   * @param {string} prompt - The fixing prompt
   * @param {Object} context - Additional context
   * @returns {Promise<string|null>} AI response or null if failed
   */
  async callAIForFix(aiClient, prompt, context) {
    try {
      // Prepare the request for the AI client
      const fixRequest = {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for more deterministic fixes
        max_tokens: 4000,
        ...context.aiOptions,
      };

      logger.debug('[RetryManager] Calling AI client for code fix');

      // Call the AI client
      const response = await aiClient(fixRequest);

      if (response && response.content) {
        return response.content;
      }

      if (response && response.message && response.message.content) {
        return response.message.content;
      }

      if (typeof response === 'string') {
        return response;
      }

      logger.warn('[RetryManager] Unexpected AI response format', {
        responseType: typeof response,
        hasContent: !!response?.content,
        hasMessage: !!response?.message,
      });

      return null;
    } catch (error) {
      logger.error('[RetryManager] Error calling AI client for fix', {
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * Extracts fixed artifact from AI response
   * @param {string} aiResponse - The AI response containing fixed code
   * @param {Object} originalArtifact - The original artifact
   * @returns {Object|null} Fixed artifact or null if extraction failed
   */
  extractFixedArtifact(aiResponse, originalArtifact) {
    try {
      // Extract code from markdown code blocks
      const codeBlockRegex = /```(?:tsx?|javascript|jsx?)?\s*\n([\s\S]*?)\n```/;
      const match = aiResponse.match(codeBlockRegex);

      let fixedCode;
      if (match && match[1]) {
        fixedCode = match[1].trim();
      } else {
        // If no code block found, try to use the entire response
        fixedCode = aiResponse.trim();
      }

      if (!fixedCode) {
        logger.warn('[RetryManager] No code found in AI response');
        return null;
      }

      // Create fixed artifact with the same structure as original
      const fixedArtifact = {
        ...originalArtifact,
        content: fixedCode,
      };

      // Also set the code property if it exists in original
      if (originalArtifact.code) {
        fixedArtifact.code = fixedCode;
      }

      // Handle nested content structure
      if (originalArtifact.content && typeof originalArtifact.content === 'object') {
        fixedArtifact.content = {
          ...originalArtifact.content,
          code: fixedCode,
          content: fixedCode,
        };
      }

      return fixedArtifact;
    } catch (error) {
      logger.error('[RetryManager] Error extracting fixed artifact', {
        error: error.message,
        responseLength: aiResponse?.length || 0,
      });
      return null;
    }
  }

  /**
   * Updates retry statistics
   * @param {boolean} success - Whether the fix was successful
   * @param {number} fixTime - Time taken for the fix attempt
   */
  updateStats(success, fixTime) {
    if (success) {
      this.stats.successfulFixes++;
    } else {
      this.stats.failedFixes++;
    }

    this.totalFixTime += fixTime;
    this.stats.averageFixTime = Math.round(this.totalFixTime / this.stats.retryAttempts);
  }

  /**
   * Gets current retry statistics
   * @returns {Object} Current statistics
   */
  getStats() {
    return {
      ...this.stats,
      fixSuccessRate:
        this.stats.retryAttempts > 0
          ? Math.round((this.stats.successfulFixes / this.stats.retryAttempts) * 100)
          : 0,
    };
  }

  /**
   * Resets retry statistics
   */
  resetStats() {
    this.stats = {
      retryAttempts: 0,
      successfulFixes: 0,
      failedFixes: 0,
      averageFixTime: 0,
    };
    this.totalFixTime = 0;
  }
}

module.exports = RetryManager;
