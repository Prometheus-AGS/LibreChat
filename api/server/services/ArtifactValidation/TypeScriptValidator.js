const ts = require('typescript');
const { logger } = require('@librechat/data-schemas');
const VirtualFileSystem = require('./VirtualFileSystem');

/**
 * TypeScript Validator for React Artifacts
 * Uses TypeScript compiler API to validate React components in memory
 */
class TypeScriptValidator {
  constructor() {
    this.vfs = new VirtualFileSystem();
    this.stats = {
      validationsAttempted: 0,
      validationsSucceeded: 0,
      validationsFailed: 0,
      averageValidationTime: 0,
    };
    this.totalValidationTime = 0;
  }

  /**
   * Validates a React artifact using TypeScript compilation
   * @param {Object} artifact - The artifact to validate
   * @returns {Promise<Object>} Validation result with success status and errors
   */
  async validate(artifact) {
    const startTime = Date.now();
    this.stats.validationsAttempted++;

    try {
      logger.debug('[TypeScriptValidator] Starting validation', {
        identifier: artifact.identifier,
        type: artifact.type,
      });

      // Extract code content from artifact
      const code = this.extractCode(artifact);
      if (!code) {
        logger.error('[TypeScriptValidator] No code content found in artifact', {
          identifier: artifact.identifier,
          type: artifact.type,
          hasContent: !!artifact.content,
          hasCode: !!artifact.code,
          contentType: typeof artifact.content,
          contentLength: artifact.content ? artifact.content.length : 0,
          contentPreview: artifact.content
            ? String(artifact.content).substring(0, 200) + '...'
            : 'No content',
        });
        throw new Error('No code content found in artifact');
      }

      logger.debug('[TypeScriptValidator] Extracted code from artifact', {
        identifier: artifact.identifier,
        codeLength: code.length,
        codePreview: code.substring(0, 200) + '...',
      });

      // Setup virtual file system with the artifact code
      const fileName = `${artifact.identifier || 'artifact'}.tsx`;
      this.vfs.writeFile(fileName, code);

      // Create TypeScript program and perform compilation
      const result = this.compileCode(fileName);

      const validationTime = Date.now() - startTime;
      this.updateStats(result.success, validationTime);

      logger.debug('[TypeScriptValidator] Validation completed', {
        identifier: artifact.identifier,
        success: result.success,
        errors: result.errors.length,
        time: validationTime,
      });

      return result;
    } catch (error) {
      const validationTime = Date.now() - startTime;
      this.updateStats(false, validationTime);

      logger.error('[TypeScriptValidator] Validation error', {
        identifier: artifact.identifier,
        error: error.message,
        time: validationTime,
      });

      return {
        success: false,
        errors: [
          {
            message: `Validation error: ${error.message}`,
            category: 'ValidationError',
            code: 'VALIDATION_ERROR',
          },
        ],
      };
    }
  }

  /**
   * Extracts code content from artifact
   * @param {Object} artifact - The artifact object
   * @returns {string} The code content
   */
  extractCode(artifact) {
    logger.debug('[TypeScriptValidator] Extracting code from artifact', {
      identifier: artifact.identifier,
      hasContent: !!artifact.content,
      contentType: typeof artifact.content,
      hasCode: !!artifact.code,
      contentKeys:
        artifact.content && typeof artifact.content === 'object'
          ? Object.keys(artifact.content)
          : [],
    });

    if (typeof artifact.content === 'string') {
      logger.debug('[TypeScriptValidator] Using string content as code');
      return artifact.content;
    }

    if (artifact.code) {
      logger.debug('[TypeScriptValidator] Using artifact.code property');
      return artifact.code;
    }

    // Handle artifacts with nested content structure
    if (artifact.content && typeof artifact.content === 'object') {
      const extractedCode = artifact.content.code || artifact.content.content;
      if (extractedCode) {
        logger.debug('[TypeScriptValidator] Using nested content structure', {
          usedProperty: artifact.content.code ? 'code' : 'content',
        });
        return extractedCode;
      }
    }

    logger.warn('[TypeScriptValidator] Could not extract code from artifact', {
      identifier: artifact.identifier,
      availableProperties: Object.keys(artifact),
    });
    return null;
  }

  /**
   * Compiles TypeScript code and returns validation results
   * @param {string} fileName - The virtual file name
   * @returns {Object} Compilation result with success status and errors
   */
  compileCode(fileName) {
    try {
      // TypeScript compiler options optimized for React validation
      const compilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.ReactJSX,
        strict: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        noEmit: true,
        isolatedModules: true,
        allowJs: false,
        checkJs: false,
        declaration: false,
        declarationMap: false,
        sourceMap: false,
        removeComments: true,
        noImplicitAny: false, // More lenient for AI-generated code
        noImplicitReturns: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
      };

      // Create TypeScript program with virtual file system
      const program = ts.createProgram([fileName], compilerOptions, this.vfs.createCompilerHost());

      // Get diagnostics (compilation errors)
      const diagnostics = [
        ...program.getConfigFileParsingDiagnostics(),
        ...program.getSyntacticDiagnostics(),
        ...program.getSemanticDiagnostics(),
      ];

      // Filter out certain diagnostics that are acceptable for artifacts
      const filteredDiagnostics = this.filterDiagnostics(diagnostics);

      const errors = filteredDiagnostics.map((diagnostic) => this.formatDiagnostic(diagnostic));

      return {
        success: errors.length === 0,
        errors,
        diagnostics: filteredDiagnostics,
      };
    } catch (error) {
      logger.error('[TypeScriptValidator] Compilation error', {
        fileName,
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        errors: [
          {
            message: `Compilation error: ${error.message}`,
            category: 'CompilationError',
            code: 'COMPILATION_ERROR',
          },
        ],
      };
    }
  }

  /**
   * Filters diagnostics to exclude acceptable issues for artifacts
   * @param {Array} diagnostics - TypeScript diagnostics
   * @returns {Array} Filtered diagnostics
   */
  filterDiagnostics(diagnostics) {
    const ignoredCodes = new Set([
      // Module resolution issues that are handled by Sandpack
      2307, // Cannot find module
      2339, // Property does not exist on type (for some Tailwind classes)
      2304, // Cannot find name (for some global types)

      // Issues that are acceptable in artifact context
      6133, // Unused variable/parameter
      6196, // Unused label
      7027, // Unreachable code

      // JSX/React issues that Sandpack handles
      2686, // JSX element implicitly has type 'any'
      2322, // Type is not assignable (sometimes too strict for artifacts)
    ]);

    return diagnostics.filter((diagnostic) => {
      // Ignore certain error codes
      if (ignoredCodes.has(diagnostic.code)) {
        return false;
      }

      // Ignore module resolution errors for known artifact dependencies
      if (diagnostic.code === 2307) {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        if (
          message.includes('/lib/utils') ||
          message.includes('/components/ui/') ||
          message.includes('react') ||
          message.includes('lucide-react') ||
          message.includes('recharts')
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Formats TypeScript diagnostic into a readable error object
   * @param {Object} diagnostic - TypeScript diagnostic
   * @returns {Object} Formatted error object
   */
  formatDiagnostic(diagnostic) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    let line = 0;
    let character = 0;

    if (diagnostic.file && diagnostic.start !== undefined) {
      const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      line = position.line + 1;
      character = position.character + 1;
    }

    return {
      message,
      line,
      character,
      code: diagnostic.code,
      category: this.getDiagnosticCategory(diagnostic.category),
      severity: this.getDiagnosticSeverity(diagnostic.category),
    };
  }

  /**
   * Gets diagnostic category string
   * @param {number} category - TypeScript diagnostic category
   * @returns {string} Category string
   */
  getDiagnosticCategory(category) {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return 'Error';
      case ts.DiagnosticCategory.Warning:
        return 'Warning';
      case ts.DiagnosticCategory.Message:
        return 'Message';
      case ts.DiagnosticCategory.Suggestion:
        return 'Suggestion';
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets diagnostic severity level
   * @param {number} category - TypeScript diagnostic category
   * @returns {string} Severity level
   */
  getDiagnosticSeverity(category) {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return 'error';
      case ts.DiagnosticCategory.Warning:
        return 'warning';
      case ts.DiagnosticCategory.Message:
      case ts.DiagnosticCategory.Suggestion:
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * Updates validation statistics
   * @param {boolean} success - Whether validation succeeded
   * @param {number} validationTime - Time taken for validation
   */
  updateStats(success, validationTime) {
    if (success) {
      this.stats.validationsSucceeded++;
    } else {
      this.stats.validationsFailed++;
    }

    this.totalValidationTime += validationTime;
    this.stats.averageValidationTime = Math.round(
      this.totalValidationTime / this.stats.validationsAttempted,
    );
  }

  /**
   * Gets current validation statistics
   * @returns {Object} Current statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.validationsAttempted > 0
          ? Math.round((this.stats.validationsSucceeded / this.stats.validationsAttempted) * 100)
          : 0,
    };
  }

  /**
   * Resets validation statistics
   */
  resetStats() {
    this.stats = {
      validationsAttempted: 0,
      validationsSucceeded: 0,
      validationsFailed: 0,
      averageValidationTime: 0,
    };
    this.totalValidationTime = 0;
  }
}

module.exports = TypeScriptValidator;
