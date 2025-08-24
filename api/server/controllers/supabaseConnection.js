const supabaseService = require('../services/supabaseService');
const { logger } = require('~/config');

/**
 * Controller for Supabase connection testing and configuration
 * Optimized for self-hosted Supabase installations
 */

/**
 * Test Supabase connection with comprehensive validation
 * POST /api/supabase/test-connection
 */
const testConnection = async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Supabase configuration is required',
        details: 'Please provide a valid Supabase configuration object',
      });
    }

    // Validate required fields
    if (!config.url || !config.anonKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required configuration fields',
        details: 'url and anonKey are required fields',
      });
    }

    logger.info('Testing Supabase connection', {
      url: config.url,
      hasServiceKey: !!config.serviceKey,
      deploymentType: config.url.includes('.supabase.co') ? 'cloud' : 'self-hosted',
    });

    const result = await supabaseService.testConnection(config);

    // Log the result for monitoring
    if (result.success) {
      logger.info('Supabase connection test successful', {
        deploymentType: result.config?.deploymentType,
        successRate: result.summary?.successRate,
        duration: result.duration,
      });
    } else {
      logger.warn('Supabase connection test failed', {
        error: result.error,
        failedTests: result.summary?.failed,
        duration: result.duration,
      });
    }

    res.json(result);
  } catch (error) {
    logger.error('Supabase connection test error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during connection test',
      details: error.message,
    });
  }
};

/**
 * Validate Supabase configuration without testing connection
 * POST /api/supabase/validate-config
 */
const validateConfig = async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Supabase configuration is required',
      });
    }

    const validation = supabaseService.validateConfig(config);

    res.json({
      success: true,
      validation,
    });
  } catch (error) {
    logger.error('Supabase config validation error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during validation',
      details: error.message,
    });
  }
};

/**
 * Get artifacts from Supabase with filtering and pagination
 * POST /api/supabase/artifacts
 */
const getArtifacts = async (req, res) => {
  try {
    const { config, options = {} } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Supabase configuration is required',
      });
    }

    const result = await supabaseService.getArtifacts(config, options);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Failed to get artifacts from Supabase', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching artifacts',
      details: error.message,
    });
  }
};

/**
 * Get navigation items from Supabase
 * POST /api/supabase/navigation
 */
const getNavigation = async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Supabase configuration is required',
      });
    }

    const result = await supabaseService.getNavigationItems(config);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Failed to get navigation from Supabase', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching navigation',
      details: error.message,
    });
  }
};

/**
 * Get connection test history
 * GET /api/supabase/connection-status
 */
const getConnectionStatus = async (req, res) => {
  try {
    const { testId } = req.query;

    if (testId) {
      const status = supabaseService.getConnectionStatus(testId);
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Connection test not found',
        });
      }
      res.json({ success: true, status });
    } else {
      const statuses = supabaseService.getAllConnectionStatuses();
      res.json({ success: true, statuses });
    }
  } catch (error) {
    logger.error('Failed to get connection status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching connection status',
      details: error.message,
    });
  }
};

/**
 * Clean up Supabase service resources
 * POST /api/supabase/cleanup
 */
const cleanup = async (req, res) => {
  try {
    supabaseService.cleanup();
    res.json({
      success: true,
      message: 'Supabase service resources cleaned up successfully',
    });
  } catch (error) {
    logger.error('Failed to cleanup Supabase service', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during cleanup',
      details: error.message,
    });
  }
};

/**
 * Get deployment recommendations based on configuration
 * POST /api/supabase/recommendations
 */
const getRecommendations = async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Supabase configuration is required',
      });
    }

    const validation = supabaseService.validateConfig(config);
    const recommendations = [];

    // Self-hosted recommendations (our secret sauce!)
    if (validation.deploymentType === 'self-hosted') {
      recommendations.push({
        type: 'success',
        title: 'Excellent Choice!',
        message:
          "You're using self-hosted Supabase - this gives you maximum control, privacy, and cost efficiency.",
        priority: 'high',
      });

      if (!config.serviceKey) {
        recommendations.push({
          type: 'warning',
          title: 'Service Key Recommended',
          message:
            'Adding a service key will enable full administrative functionality for your self-hosted instance.',
          priority: 'medium',
        });
      }

      if (!config.connectionPooling) {
        recommendations.push({
          type: 'info',
          title: 'Enable Connection Pooling',
          message:
            'Connection pooling can significantly improve performance for self-hosted instances under load.',
          priority: 'medium',
        });
      }

      if (!config.url.startsWith('https://') && !config.url.includes('localhost')) {
        recommendations.push({
          type: 'error',
          title: 'HTTPS Required',
          message: 'Production self-hosted deployments should use HTTPS for security.',
          priority: 'high',
        });
      }
    } else if (validation.deploymentType === 'supabase-cloud') {
      recommendations.push({
        type: 'warning',
        title: 'Consider Self-Hosting',
        message:
          'Self-hosting Supabase gives you better control, privacy, and can be more cost-effective at scale.',
        priority: 'medium',
      });
    }

    // General recommendations
    if (validation.score < 70) {
      recommendations.push({
        type: 'warning',
        title: 'Configuration Improvements Available',
        message: `Your configuration score is ${validation.score}/100. Review the warnings to improve reliability.`,
        priority: 'medium',
      });
    }

    res.json({
      success: true,
      recommendations,
      validation,
      deploymentType: validation.deploymentType,
      score: validation.score,
    });
  } catch (error) {
    logger.error('Failed to generate recommendations', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating recommendations',
      details: error.message,
    });
  }
};

module.exports = {
  testConnection,
  validateConfig,
  getArtifacts,
  getNavigation,
  getConnectionStatus,
  cleanup,
  getRecommendations,
};
