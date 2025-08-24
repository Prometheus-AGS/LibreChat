#!/usr/bin/env node

/**
 * Artifact Validator
 *
 * Validates artifact code for common issues, security vulnerabilities,
 * and best practices compliance.
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { ESLint } = require('eslint');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class ArtifactValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.suggestions = [];
  }

  async validateFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf8');
      const ext = path.extname(filePath);

      this.issues = [];
      this.warnings = [];
      this.suggestions = [];

      // Basic validation
      await this.validateBasicStructure(code, ext);

      // Security validation
      await this.validateSecurity(code);

      // Performance validation
      await this.validatePerformance(code);

      // Best practices validation
      await this.validateBestPractices(code, ext);

      // ESLint validation for JS/TS files
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        await this.validateWithESLint(filePath, code);
      }

      return {
        valid: this.issues.length === 0,
        issues: this.issues,
        warnings: this.warnings,
        suggestions: this.suggestions,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [`Failed to validate file: ${error.message}`],
        warnings: [],
        suggestions: [],
      };
    }
  }

  async validateBasicStructure(code, ext) {
    // Check for empty files
    if (!code.trim()) {
      this.issues.push('File is empty');
      return;
    }

    // Check for React components
    if (['.jsx', '.tsx'].includes(ext)) {
      if (!code.includes('React') && !code.includes('import')) {
        this.warnings.push('React component should import React');
      }

      // Check for export
      if (!code.includes('export')) {
        this.issues.push('Component must have an export statement');
      }

      // Check for proper component naming
      const componentMatch = code.match(/(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/);
      if (!componentMatch) {
        this.warnings.push('Component name should start with uppercase letter');
      }
    }

    // Check for TypeScript files
    if (['.ts', '.tsx'].includes(ext)) {
      if (!code.includes('interface') && !code.includes('type') && !code.includes(': ')) {
        this.suggestions.push('Consider adding TypeScript type annotations');
      }
    }
  }

  async validateSecurity(code) {
    const securityPatterns = [
      {
        pattern: /dangerouslySetInnerHTML/g,
        message: 'Avoid using dangerouslySetInnerHTML - potential XSS vulnerability',
        severity: 'error',
      },
      {
        pattern: /eval\s*\(/g,
        message: 'Avoid using eval() - security risk',
        severity: 'error',
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'Avoid direct innerHTML manipulation - potential XSS vulnerability',
        severity: 'warning',
      },
      {
        pattern: /document\.write/g,
        message: 'Avoid document.write() - security and performance risk',
        severity: 'warning',
      },
      {
        pattern: /window\.location\.href\s*=\s*[^"'`\s]+/g,
        message: 'Direct location manipulation can be dangerous - validate URLs',
        severity: 'warning',
      },
      {
        pattern: /localStorage\.|sessionStorage\./g,
        message: 'Be cautious with storage APIs - avoid storing sensitive data',
        severity: 'suggestion',
      },
    ];

    securityPatterns.forEach(({ pattern, message, severity }) => {
      const matches = code.match(pattern);
      if (matches) {
        const target =
          severity === 'error'
            ? this.issues
            : severity === 'warning'
              ? this.warnings
              : this.suggestions;
        target.push(
          `${message} (found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
        );
      }
    });
  }

  async validatePerformance(code) {
    const performancePatterns = [
      {
        pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[\s\S]*?}\s*,\s*\[\s*\]\s*\)/g,
        message:
          'Empty dependency array in useEffect - consider if this should run on every render',
        severity: 'suggestion',
      },
      {
        pattern: /useState\s*\(\s*(?:new\s+)?(?:Array|Object|Map|Set)/g,
        message: 'Avoid creating objects/arrays in useState initializer - use lazy initialization',
        severity: 'suggestion',
      },
      {
        pattern: /\.map\s*\([^)]*\)\s*\.filter/g,
        message: 'Consider combining map and filter operations for better performance',
        severity: 'suggestion',
      },
      {
        pattern: /console\.log|console\.warn|console\.error/g,
        message: 'Remove console statements before production',
        severity: 'warning',
      },
    ];

    performancePatterns.forEach(({ pattern, message, severity }) => {
      const matches = code.match(pattern);
      if (matches) {
        const target = severity === 'warning' ? this.warnings : this.suggestions;
        target.push(
          `${message} (found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
        );
      }
    });
  }

  async validateBestPractices(code, ext) {
    // React best practices
    if (['.jsx', '.tsx'].includes(ext)) {
      // Check for key prop in lists
      if (code.includes('.map(') && !code.includes('key=')) {
        this.warnings.push('Missing key prop in list items');
      }

      // Check for proper event handler naming
      const eventHandlers = code.match(/on[A-Z][a-zA-Z]*\s*=/g);
      if (eventHandlers) {
        eventHandlers.forEach((handler) => {
          if (!handler.startsWith('on')) {
            this.suggestions.push(`Event handler should start with 'on': ${handler}`);
          }
        });
      }

      // Check for inline styles
      if (code.includes('style={{')) {
        this.suggestions.push('Consider using CSS classes instead of inline styles');
      }
    }

    // General best practices
    const bestPracticePatterns = [
      {
        pattern: /var\s+/g,
        message: 'Use const or let instead of var',
        severity: 'suggestion',
      },
      {
        pattern: /==\s*(?!==)/g,
        message: 'Use strict equality (===) instead of loose equality (==)',
        severity: 'suggestion',
      },
      {
        pattern: /!=\s*(?!==)/g,
        message: 'Use strict inequality (!==) instead of loose inequality (!=)',
        severity: 'suggestion',
      },
    ];

    bestPracticePatterns.forEach(({ pattern, message, severity }) => {
      const matches = code.match(pattern);
      if (matches) {
        this.suggestions.push(
          `${message} (found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
        );
      }
    });
  }

  async validateWithESLint(filePath, code) {
    try {
      const eslint = new ESLint({
        baseConfig: {
          extends: ['eslint:recommended'],
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            ecmaFeatures: {
              jsx: true,
            },
          },
          env: {
            browser: true,
            es2022: true,
            node: true,
          },
          rules: {
            'no-unused-vars': 'warn',
            'no-console': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
          },
        },
        useEslintrc: false,
      });

      const results = await eslint.lintText(code, { filePath });

      results[0]?.messages?.forEach((message) => {
        const text = `Line ${message.line}: ${message.message}`;

        if (message.severity === 2) {
          this.issues.push(text);
        } else if (message.severity === 1) {
          this.warnings.push(text);
        }
      });
    } catch (error) {
      this.warnings.push(`ESLint validation failed: ${error.message}`);
    }
  }

  async validateArtifactMetadata(metadata) {
    const issues = [];
    const warnings = [];
    const suggestions = [];

    // Required fields
    const requiredFields = ['name', 'description', 'version', 'author'];
    requiredFields.forEach((field) => {
      if (!metadata[field]) {
        issues.push(`Missing required field: ${field}`);
      }
    });

    // Name validation
    if (metadata.name) {
      if (metadata.name.length < 3) {
        warnings.push('Artifact name should be at least 3 characters long');
      }
      if (metadata.name.length > 50) {
        warnings.push('Artifact name should be less than 50 characters');
      }
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(metadata.name)) {
        warnings.push('Artifact name contains invalid characters');
      }
    }

    // Description validation
    if (metadata.description) {
      if (metadata.description.length < 10) {
        suggestions.push('Consider adding a more detailed description');
      }
      if (metadata.description.length > 500) {
        warnings.push('Description is very long - consider shortening it');
      }
    }

    // Version validation
    if (metadata.version) {
      const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9\-]+)?$/;
      if (!semverPattern.test(metadata.version)) {
        warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
      }
    }

    // Tags validation
    if (metadata.tags) {
      if (metadata.tags.length === 0) {
        suggestions.push('Consider adding tags to improve discoverability');
      }
      if (metadata.tags.length > 10) {
        warnings.push('Too many tags - consider using fewer, more specific tags');
      }

      metadata.tags.forEach((tag) => {
        if (tag.length > 20) {
          warnings.push(`Tag "${tag}" is too long`);
        }
        if (!/^[a-zA-Z0-9\-_]+$/.test(tag)) {
          warnings.push(`Tag "${tag}" contains invalid characters`);
        }
      });
    }

    // Category validation
    const validCategories = [
      'ui-component',
      'utility',
      'hook',
      'layout',
      'form',
      'data-display',
      'navigation',
      'feedback',
      'animation',
    ];
    if (metadata.category && !validCategories.includes(metadata.category)) {
      suggestions.push(`Consider using a standard category: ${validCategories.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      suggestions,
    };
  }

  generateReport(results, filePath) {
    console.log(chalk.bold.cyan(`\n📋 Validation Report for ${path.basename(filePath)}`));
    console.log(chalk.gray('─'.repeat(60)));

    if (results.valid) {
      console.log(chalk.green('✅ No critical issues found!'));
    } else {
      console.log(
        chalk.red(
          `❌ Found ${results.issues.length} critical issue${results.issues.length > 1 ? 's' : ''}`,
        ),
      );
    }

    if (results.issues.length > 0) {
      console.log(chalk.red.bold('\n🚨 Critical Issues:'));
      results.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${chalk.red(issue)}`);
      });
    }

    if (results.warnings.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
      results.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${chalk.yellow(warning)}`);
      });
    }

    if (results.suggestions.length > 0) {
      console.log(chalk.blue.bold('\n💡 Suggestions:'));
      results.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${chalk.blue(suggestion)}`);
      });
    }

    console.log(chalk.gray('─'.repeat(60)));

    const totalIssues = results.issues.length + results.warnings.length;
    if (totalIssues === 0) {
      console.log(chalk.green('🎉 Great job! Your artifact follows best practices.'));
    } else {
      console.log(
        chalk.cyan(
          `📊 Summary: ${results.issues.length} errors, ${results.warnings.length} warnings, ${results.suggestions.length} suggestions`,
        ),
      );
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(chalk.red('Usage: node artifact-validator.js <file-path>'));
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  try {
    await fs.access(filePath);
  } catch {
    console.log(chalk.red(`File not found: ${filePath}`));
    process.exit(1);
  }

  const validator = new ArtifactValidator();
  const results = await validator.validateFile(filePath);

  validator.generateReport(results, filePath);

  // Exit with error code if there are critical issues
  process.exit(results.valid ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Validation failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { ArtifactValidator };
