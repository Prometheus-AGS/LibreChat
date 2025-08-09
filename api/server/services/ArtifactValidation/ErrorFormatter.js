const { logger } = require('@librechat/data-schemas');

/**
 * Error Formatter for Artifact Validation
 * Formats compilation errors for user-friendly display
 */
class ErrorFormatter {
  constructor() {
    this.errorCategories = {
      IMPORT_ERROR: 'Import/Module Error',
      TYPE_ERROR: 'Type Error',
      SYNTAX_ERROR: 'Syntax Error',
      JSX_ERROR: 'JSX Error',
      VALIDATION_ERROR: 'Validation Error',
      COMPILATION_ERROR: 'Compilation Error',
      UNKNOWN_ERROR: 'Unknown Error',
    };

    this.commonSolutions = {
      2307: 'Check import path and ensure the module exists',
      2339: 'Verify the property exists on the object type',
      2304: 'Ensure the variable or type is properly declared',
      2322: 'Check type compatibility between assigned values',
      2551: 'Verify the property name is spelled correctly',
      2345: 'Check function argument types match the expected parameters',
      2686: 'Add proper type annotations for JSX elements',
      1005: 'Check for missing closing brackets or parentheses',
      1109: 'Look for unexpected characters or syntax errors',
      1128: 'Check for missing or extra commas, semicolons, or brackets',
    };
  }

  /**
   * Formats an array of errors for user display
   * @param {Array} errors - Array of error objects
   * @returns {Array} Formatted errors with user-friendly messages
   */
  formatErrors(errors) {
    if (!errors || errors.length === 0) {
      return [];
    }

    logger.debug('[ErrorFormatter] Formatting errors', {
      errorCount: errors.length,
    });

    const formattedErrors = errors.map((error, index) => this.formatSingleError(error, index + 1));

    // Sort errors by severity and line number
    formattedErrors.sort((a, b) => {
      // Sort by severity first (error > warning > info)
      const severityOrder = { error: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }

      // Then sort by line number
      return (a.line || 0) - (b.line || 0);
    });

    return formattedErrors;
  }

  /**
   * Formats a single error object
   * @param {Object} error - The error object
   * @param {number} index - Error index for numbering
   * @returns {Object} Formatted error object
   */
  formatSingleError(error, index) {
    const category = this.categorizeError(error);
    const userMessage = this.generateUserFriendlyMessage(error);
    const solution = this.getSuggestedSolution(error);
    const location = this.formatLocation(error);

    return {
      id: `error_${index}`,
      category,
      severity: error.severity || 'error',
      title: this.generateErrorTitle(error, category),
      message: userMessage,
      originalMessage: error.message,
      location,
      line: error.line,
      character: error.character,
      code: error.code,
      solution,
      isFixable: this.isErrorFixable(error),
    };
  }

  /**
   * Categorizes an error based on its type and code
   * @param {Object} error - The error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    const message = (error.message || '').toLowerCase();
    const code = error.code;

    // Import/Module errors
    if (
      message.includes('cannot find module') ||
      message.includes('module not found') ||
      message.includes('import') ||
      code === 2307
    ) {
      return this.errorCategories.IMPORT_ERROR;
    }

    // Type errors
    if (
      message.includes('type') ||
      message.includes('property') ||
      message.includes('assignable') ||
      (code >= 2300 && code < 2400)
    ) {
      return this.errorCategories.TYPE_ERROR;
    }

    // Syntax errors
    if (
      message.includes('syntax') ||
      message.includes('expected') ||
      message.includes('unexpected') ||
      (code >= 1000 && code < 2000)
    ) {
      return this.errorCategories.SYNTAX_ERROR;
    }

    // JSX errors
    if (
      message.includes('jsx') ||
      message.includes('element') ||
      message.includes('component') ||
      code === 2686
    ) {
      return this.errorCategories.JSX_ERROR;
    }

    // Validation errors
    if (error.category === 'ValidationError') {
      return this.errorCategories.VALIDATION_ERROR;
    }

    // Compilation errors
    if (error.category === 'CompilationError') {
      return this.errorCategories.COMPILATION_ERROR;
    }

    return this.errorCategories.UNKNOWN_ERROR;
  }

  /**
   * Generates a user-friendly error message
   * @param {Object} error - The error object
   * @returns {string} User-friendly message
   */
  generateUserFriendlyMessage(error) {
    const message = error.message || '';
    const code = error.code;

    // Handle common TypeScript errors with user-friendly explanations
    switch (code) {
      case 2307:
        return this.formatImportError(message);
      case 2339:
        return this.formatPropertyError(message);
      case 2304:
        return this.formatUndefinedError(message);
      case 2322:
        return this.formatTypeAssignmentError(message);
      case 2551:
        return this.formatPropertySpellingError(message);
      case 2345:
        return this.formatArgumentError(message);
      case 2686:
        return this.formatJSXError(message);
      case 1005:
      case 1109:
      case 1128:
        return this.formatSyntaxError(message);
      default:
        return this.cleanupErrorMessage(message);
    }
  }

  /**
   * Formats import-related error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatImportError(message) {
    if (message.includes('/lib/utils')) {
      return 'The utility function import path is incorrect. Use: import { cn } from "/lib/utils"';
    }

    if (message.includes('/components/ui/')) {
      const componentMatch = message.match(/\/components\/ui\/([^'"\s]+)/);
      const componentName = componentMatch ? componentMatch[1] : 'component';
      return `The shadcn/ui component import is incorrect. Use: import { ComponentName } from "/components/ui/${componentName}"`;
    }

    if (message.includes('react')) {
      return 'React import is missing or incorrect. Use: import { useState, useEffect } from "react"';
    }

    return `Module not found: ${this.extractModuleName(message)}. Check the import path and ensure the module exists.`;
  }

  /**
   * Formats property-related error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatPropertyError(message) {
    const propertyMatch = message.match(/Property '([^']+)'/);
    const typeMatch = message.match(/on type '([^']+)'/);

    if (propertyMatch && typeMatch) {
      return `The property '${propertyMatch[1]}' doesn't exist on '${typeMatch[1]}'. Check the property name and type definition.`;
    }

    return this.cleanupErrorMessage(message);
  }

  /**
   * Formats undefined variable/type error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatUndefinedError(message) {
    const nameMatch = message.match(/Cannot find name '([^']+)'/);

    if (nameMatch) {
      return `'${nameMatch[1]}' is not defined. Make sure it's imported or declared properly.`;
    }

    return this.cleanupErrorMessage(message);
  }

  /**
   * Formats type assignment error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatTypeAssignmentError(message) {
    return `Type mismatch: ${this.cleanupErrorMessage(message)}. Check that the assigned value matches the expected type.`;
  }

  /**
   * Formats property spelling error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatPropertySpellingError(message) {
    const propertyMatch = message.match(/Property '([^']+)'/);
    const suggestionMatch = message.match(/Did you mean '([^']+)'/);

    if (propertyMatch && suggestionMatch) {
      return `Property '${propertyMatch[1]}' doesn't exist. Did you mean '${suggestionMatch[1]}'?`;
    }

    return this.cleanupErrorMessage(message);
  }

  /**
   * Formats function argument error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatArgumentError(message) {
    return `Function argument error: ${this.cleanupErrorMessage(message)}. Check the number and types of arguments passed.`;
  }

  /**
   * Formats JSX-related error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatJSXError(message) {
    return `JSX element error: ${this.cleanupErrorMessage(message)}. Ensure proper JSX syntax and component usage.`;
  }

  /**
   * Formats syntax error messages
   * @param {string} message - Original error message
   * @returns {string} Formatted message
   */
  formatSyntaxError(message) {
    return `Syntax error: ${this.cleanupErrorMessage(message)}. Check for missing brackets, commas, or other syntax issues.`;
  }

  /**
   * Cleans up error messages for better readability
   * @param {string} message - Original error message
   * @returns {string} Cleaned message
   */
  cleanupErrorMessage(message) {
    return message
      .replace(/^TS\d+:\s*/, '') // Remove TypeScript error codes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extracts module name from error message
   * @param {string} message - Error message
   * @returns {string} Module name
   */
  extractModuleName(message) {
    const match = message.match(/['"]([^'"]+)['"]/);
    return match ? match[1] : 'unknown module';
  }

  /**
   * Generates an error title based on category
   * @param {Object} error - The error object
   * @param {string} category - Error category
   * @returns {string} Error title
   */
  generateErrorTitle(error, category) {
    const line = error.line ? ` (Line ${error.line})` : '';
    return `${category}${line}`;
  }

  /**
   * Formats error location information
   * @param {Object} error - The error object
   * @returns {string} Formatted location
   */
  formatLocation(error) {
    if (error.line && error.character) {
      return `Line ${error.line}, Column ${error.character}`;
    } else if (error.line) {
      return `Line ${error.line}`;
    }
    return '';
  }

  /**
   * Gets suggested solution for an error
   * @param {Object} error - The error object
   * @returns {string} Suggested solution
   */
  getSuggestedSolution(error) {
    const code = error.code;

    if (this.commonSolutions[code]) {
      return this.commonSolutions[code];
    }

    // Category-based solutions
    const category = this.categorizeError(error);
    switch (category) {
      case this.errorCategories.IMPORT_ERROR:
        return 'Check import paths and ensure all modules are properly imported';
      case this.errorCategories.TYPE_ERROR:
        return 'Review type definitions and ensure type compatibility';
      case this.errorCategories.SYNTAX_ERROR:
        return 'Check syntax for missing brackets, commas, or other punctuation';
      case this.errorCategories.JSX_ERROR:
        return 'Verify JSX syntax and component usage';
      default:
        return 'Review the code and fix the reported issue';
    }
  }

  /**
   * Determines if an error is likely fixable by AI
   * @param {Object} error - The error object
   * @returns {boolean} Whether the error is fixable
   */
  isErrorFixable(error) {
    const code = error.code;
    const category = this.categorizeError(error);

    // Most import, type, and syntax errors are fixable
    const fixableCategories = [
      this.errorCategories.IMPORT_ERROR,
      this.errorCategories.TYPE_ERROR,
      this.errorCategories.SYNTAX_ERROR,
      this.errorCategories.JSX_ERROR,
    ];

    if (fixableCategories.includes(category)) {
      return true;
    }

    // Specific error codes that are usually fixable
    const fixableCodes = [2307, 2339, 2304, 2322, 2551, 2345, 2686, 1005, 1109, 1128];

    return fixableCodes.includes(code);
  }

  /**
   * Generates a summary of all errors
   * @param {Array} formattedErrors - Array of formatted errors
   * @returns {Object} Error summary
   */
  generateErrorSummary(formattedErrors) {
    const summary = {
      total: formattedErrors.length,
      byCategory: {},
      bySeverity: {},
      fixableCount: 0,
    };

    formattedErrors.forEach((error) => {
      // Count by category
      summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1;

      // Count by severity
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;

      // Count fixable errors
      if (error.isFixable) {
        summary.fixableCount++;
      }
    });

    return summary;
  }
}

module.exports = ErrorFormatter;
