const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const {
  getArtifactRegistry,
  searchArtifacts,
  getArtifactById,
  getComponentCode,
  getDynamicNavigation,
  saveArtifact,
  updateArtifact,
  deleteArtifact,
  getArtifactVersions,
  getArtifactsByCategory,
  getArtifactsByTag,
} = require('~/server/controllers/artifactRegistry');
const {
  proxyRequest,
  handleOptions,
  getProxyStatus,
} = require('~/server/controllers/ProxyController');

const router = express.Router();

// Apply authentication to all routes
router.use(requireJwtAuth);

// Registry endpoints
router.get('/registry', getArtifactRegistry);
router.get('/search', searchArtifacts);
router.get('/category/:category', getArtifactsByCategory);
router.get('/tags', getArtifactsByTag);

// Individual artifact endpoints
router.get('/:id', getArtifactById);
router.get('/:id/versions', getArtifactVersions);
router.delete('/:id', deleteArtifact);

// Component fetching (BFF)
router.post('/component', getComponentCode);

// Navigation
router.get('/navigation', getDynamicNavigation);
router.post('/navigation', getDynamicNavigation);

// Save/Update artifacts
router.post('/save', saveArtifact);
router.put('/:id', updateArtifact);

// Proxy endpoints for unrestricted network access
router.options('/proxy', handleOptions);
router.post('/proxy', proxyRequest);
router.get('/proxy/status', getProxyStatus);

module.exports = router;
