const express = require('express');
const {
  testConnection,
  validateConfig,
  getArtifacts,
  getNavigation,
  getConnectionStatus,
  cleanup,
  getRecommendations,
} = require('../controllers/supabaseConnection');
const requireJwtAuth = require('../middleware/requireJwtAuth');

const router = express.Router();

/**
 * Supabase Connection Routes
 * Optimized for self-hosted Supabase installations
 */

/**
 * Test Supabase connection with comprehensive validation
 * POST /api/supabase-connection/test
 */
router.post('/test', requireJwtAuth, testConnection);

/**
 * Validate Supabase configuration without testing connection
 * POST /api/supabase-connection/validate
 */
router.post('/validate', requireJwtAuth, validateConfig);

/**
 * Get artifacts from Supabase with filtering and pagination
 * POST /api/supabase-connection/artifacts
 */
router.post('/artifacts', requireJwtAuth, getArtifacts);

/**
 * Get navigation items from Supabase
 * POST /api/supabase-connection/navigation
 */
router.post('/navigation', requireJwtAuth, getNavigation);

/**
 * Get connection test history
 * GET /api/supabase-connection/status
 */
router.get('/status', requireJwtAuth, getConnectionStatus);

/**
 * Get deployment recommendations based on configuration
 * POST /api/supabase-connection/recommendations
 */
router.post('/recommendations', requireJwtAuth, getRecommendations);

/**
 * Clean up Supabase service resources
 * POST /api/supabase-connection/cleanup
 */
router.post('/cleanup', requireJwtAuth, cleanup);

module.exports = router;
