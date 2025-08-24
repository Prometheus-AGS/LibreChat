const request = require('supertest');
const express = require('express');
const { jest } = require('@jest/globals');
const artifactRoutes = require('../artifacts');
const { requireJwtAuth } = require('../../middleware/requireJwtAuth');
const {
  errorHandler,
  ArtifactRegistryError,
  ValidationError,
  NotFoundError,
} = require('../../middleware/errorHandler');

// Mock middleware
jest.mock('../../middleware/requireJwtAuth');
jest.mock('../../controllers/artifactRegistry');

const mockRequireJwtAuth = jest.mocked(requireJwtAuth);
const artifactController = require('../../controllers/artifactRegistry');

// Mock controller methods
const mockGetArtifacts = jest.fn();
const mockGetArtifactById = jest.fn();
const mockSaveArtifact = jest.fn();
const mockUpdateArtifact = jest.fn();
const mockDeleteArtifact = jest.fn();
const mockSearchArtifacts = jest.fn();
const mockGetNavigationItems = jest.fn();
const mockTestSupabaseConnection = jest.fn();
const mockGetComponentCode = jest.fn();

artifactController.getArtifacts = mockGetArtifacts;
artifactController.getArtifactById = mockGetArtifactById;
artifactController.saveArtifact = mockSaveArtifact;
artifactController.updateArtifact = mockUpdateArtifact;
artifactController.deleteArtifact = mockDeleteArtifact;
artifactController.searchArtifacts = mockSearchArtifacts;
artifactController.getNavigationItems = mockGetNavigationItems;
artifactController.testSupabaseConnection = mockTestSupabaseConnection;
artifactController.getComponentCode = mockGetComponentCode;

// Test data
const mockArtifact = {
  id: 'test-artifact-1',
  name: 'Test Component',
  description: 'A test component',
  category: 'ui-component',
  tags: ['react', 'test'],
  version: '1.0.0',
  author: 'test-user',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isPublic: true,
  dependencies: [],
  supabaseConfig: null,
  code: '<div>Test Component</div>',
  language: 'tsx',
  framework: 'react',
};

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware to add user to request
  mockRequireJwtAuth.mockImplementation((req, res, next) => {
    req.user = mockUser;
    next();
  });

  app.use('/api/artifacts', artifactRoutes);
  app.use(errorHandler);

  return app;
};

describe('Artifact Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/artifacts', () => {
    it('should get all artifacts successfully', async () => {
      const mockResponse = {
        artifacts: [mockArtifact],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockGetArtifacts.mockImplementation((req, res) => {
        res.json({ success: true, data: mockResponse });
      });

      const response = await request(app).get('/api/artifacts').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.artifacts).toHaveLength(1);
      expect(response.body.data.artifacts[0]).toMatchObject(mockArtifact);
      expect(mockGetArtifacts).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination parameters', async () => {
      mockGetArtifacts.mockImplementation((req, res) => {
        expect(req.query.page).toBe('2');
        expect(req.query.limit).toBe('10');
        res.json({ success: true, data: { artifacts: [], total: 0, page: 2, limit: 10 } });
      });

      await request(app).get('/api/artifacts?page=2&limit=10').expect(200);

      expect(mockGetArtifacts).toHaveBeenCalledTimes(1);
    });

    it('should handle filter parameters', async () => {
      mockGetArtifacts.mockImplementation((req, res) => {
        expect(req.query.category).toBe('ui-component');
        expect(req.query.tags).toBe('react,typescript');
        res.json({ success: true, data: { artifacts: [], total: 0 } });
      });

      await request(app)
        .get('/api/artifacts?category=ui-component&tags=react,typescript')
        .expect(200);
    });

    it('should handle errors gracefully', async () => {
      mockGetArtifacts.mockImplementation((req, res, next) => {
        next(new Error('Database connection failed'));
      });

      const response = await request(app).get('/api/artifacts').expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Database connection failed');
    });
  });

  describe('GET /api/artifacts/:id', () => {
    it('should get artifact by id successfully', async () => {
      mockGetArtifactById.mockImplementation((req, res) => {
        expect(req.params.id).toBe('test-artifact-1');
        res.json({ success: true, data: mockArtifact });
      });

      const response = await request(app).get('/api/artifacts/test-artifact-1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(mockArtifact);
    });

    it('should return 404 for non-existent artifact', async () => {
      mockGetArtifactById.mockImplementation((req, res, next) => {
        next(new NotFoundError('Artifact not found'));
      });

      const response = await request(app).get('/api/artifacts/non-existent').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Artifact not found');
    });
  });

  describe('POST /api/artifacts', () => {
    it('should save artifact successfully', async () => {
      const newArtifact = { ...mockArtifact, id: undefined };
      const savedArtifact = { ...mockArtifact, id: 'new-artifact-id' };

      mockSaveArtifact.mockImplementation((req, res) => {
        expect(req.body).toMatchObject(newArtifact);
        expect(req.user).toMatchObject(mockUser);
        res.status(201).json({ success: true, data: savedArtifact });
      });

      const response = await request(app).post('/api/artifacts').send(newArtifact).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('new-artifact-id');
      expect(mockSaveArtifact).toHaveBeenCalledTimes(1);
    });

    it('should validate required fields', async () => {
      mockSaveArtifact.mockImplementation((req, res, next) => {
        next(new ValidationError('Name is required', { field: 'name' }));
      });

      const invalidArtifact = { ...mockArtifact, name: undefined };

      const response = await request(app).post('/api/artifacts').send(invalidArtifact).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.category).toBe('validation');
      expect(response.body.error.message).toBe('Name is required');
    });

    it('should require authentication', async () => {
      mockRequireJwtAuth.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app).post('/api/artifacts').send(mockArtifact).expect(401);
    });
  });

  describe('PUT /api/artifacts/:id', () => {
    it('should update artifact successfully', async () => {
      const updates = { name: 'Updated Component', description: 'Updated description' };
      const updatedArtifact = { ...mockArtifact, ...updates };

      mockUpdateArtifact.mockImplementation((req, res) => {
        expect(req.params.id).toBe('test-artifact-1');
        expect(req.body).toMatchObject(updates);
        res.json({ success: true, data: updatedArtifact });
      });

      const response = await request(app)
        .put('/api/artifacts/test-artifact-1')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Component');
    });

    it('should return 404 for non-existent artifact', async () => {
      mockUpdateArtifact.mockImplementation((req, res, next) => {
        next(new NotFoundError('Artifact not found'));
      });

      const response = await request(app)
        .put('/api/artifacts/non-existent')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate ownership', async () => {
      mockUpdateArtifact.mockImplementation((req, res, next) => {
        next(new ArtifactRegistryError('Not authorized to update this artifact', 403));
      });

      const response = await request(app)
        .put('/api/artifacts/test-artifact-1')
        .send({ name: 'Updated' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/artifacts/:id', () => {
    it('should delete artifact successfully', async () => {
      mockDeleteArtifact.mockImplementation((req, res) => {
        expect(req.params.id).toBe('test-artifact-1');
        res.json({ success: true, message: 'Artifact deleted successfully' });
      });

      const response = await request(app).delete('/api/artifacts/test-artifact-1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Artifact deleted successfully');
    });

    it('should return 404 for non-existent artifact', async () => {
      mockDeleteArtifact.mockImplementation((req, res, next) => {
        next(new NotFoundError('Artifact not found'));
      });

      await request(app).delete('/api/artifacts/non-existent').expect(404);
    });
  });

  describe('GET /api/artifacts/search', () => {
    it('should search artifacts successfully', async () => {
      const searchResults = {
        artifacts: [mockArtifact],
        total: 1,
        query: 'test component',
      };

      mockSearchArtifacts.mockImplementation((req, res) => {
        expect(req.query.q).toBe('test component');
        res.json({ success: true, data: searchResults });
      });

      const response = await request(app).get('/api/artifacts/search?q=test component').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.artifacts).toHaveLength(1);
      expect(response.body.data.query).toBe('test component');
    });

    it('should handle empty search query', async () => {
      mockSearchArtifacts.mockImplementation((req, res, next) => {
        next(new ValidationError('Search query is required'));
      });

      const response = await request(app).get('/api/artifacts/search').expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.category).toBe('validation');
    });

    it('should support search filters', async () => {
      mockSearchArtifacts.mockImplementation((req, res) => {
        expect(req.query.q).toBe('component');
        expect(req.query.category).toBe('ui-component');
        expect(req.query.tags).toBe('react');
        res.json({ success: true, data: { artifacts: [], total: 0 } });
      });

      await request(app)
        .get('/api/artifacts/search?q=component&category=ui-component&tags=react')
        .expect(200);
    });
  });

  describe('GET /api/artifacts/navigation', () => {
    it('should get navigation items successfully', async () => {
      const navItems = [
        { id: '1', label: 'Dashboard', path: '/dashboard', order: 1 },
        { id: '2', label: 'Components', path: '/components', order: 2 },
      ];

      mockGetNavigationItems.mockImplementation((req, res) => {
        res.json({ success: true, data: navItems });
      });

      const response = await request(app).get('/api/artifacts/navigation').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].label).toBe('Dashboard');
    });

    it('should handle Supabase connection errors', async () => {
      mockGetNavigationItems.mockImplementation((req, res, next) => {
        next(new ArtifactRegistryError('Supabase connection failed', 503));
      });

      const response = await request(app).get('/api/artifacts/navigation').expect(503);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/artifacts/test-connection', () => {
    it('should test Supabase connection successfully', async () => {
      const connectionResult = {
        connected: true,
        latency: 45,
        timestamp: new Date().toISOString(),
      };

      mockTestSupabaseConnection.mockImplementation((req, res) => {
        res.json({ success: true, data: connectionResult });
      });

      const response = await request(app).get('/api/artifacts/test-connection').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.connected).toBe(true);
      expect(typeof response.body.data.latency).toBe('number');
    });

    it('should handle connection failures', async () => {
      mockTestSupabaseConnection.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: {
            connected: false,
            error: 'Connection timeout',
            latency: null,
          },
        });
      });

      const response = await request(app).get('/api/artifacts/test-connection').expect(200);

      expect(response.body.data.connected).toBe(false);
      expect(response.body.data.error).toBe('Connection timeout');
    });
  });

  describe('GET /api/artifacts/:id/component', () => {
    it('should get component code successfully', async () => {
      const componentCode = {
        code: 'const Component = () => <div>Hello</div>;',
        dependencies: ['react'],
        metadata: mockArtifact,
      };

      mockGetComponentCode.mockImplementation((req, res) => {
        expect(req.params.id).toBe('test-artifact-1');
        res.json({ success: true, data: componentCode });
      });

      const response = await request(app)
        .get('/api/artifacts/test-artifact-1/component')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toContain('Component');
      expect(response.body.data.dependencies).toContain('react');
    });

    it('should handle component compilation errors', async () => {
      mockGetComponentCode.mockImplementation((req, res, next) => {
        next(new ArtifactRegistryError('Component compilation failed', 422));
      });

      const response = await request(app)
        .get('/api/artifacts/test-artifact-1/component')
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors with proper format', async () => {
      mockSaveArtifact.mockImplementation((req, res, next) => {
        next(
          new ValidationError('Invalid artifact data', {
            fields: [
              { field: 'name', message: 'Name is required' },
              { field: 'code', message: 'Code cannot be empty' },
            ],
          }),
        );
      });

      const response = await request(app).post('/api/artifacts').send({}).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.category).toBe('validation');
      expect(response.body.error.details.fields).toHaveLength(2);
    });

    it('should handle rate limiting', async () => {
      mockGetArtifacts.mockImplementation((req, res, next) => {
        const error = new Error('Too many requests');
        error.status = 429;
        next(error);
      });

      const response = await request(app).get('/api/artifacts').expect(429);

      expect(response.body.success).toBe(false);
    });

    it('should sanitize error messages in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockGetArtifacts.mockImplementation((req, res, next) => {
        const error = new Error('Database password: secret123');
        error.stack = 'Error: Database password: secret123\n    at /app/db.js:45:12';
        next(error);
      });

      const response = await request(app).get('/api/artifacts').expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).not.toContain('secret123');
      expect(response.body.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for protected routes', async () => {
      mockRequireJwtAuth.mockImplementationOnce((req, res) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app).post('/api/artifacts').send(mockArtifact).expect(401);

      await request(app)
        .put('/api/artifacts/test-artifact-1')
        .send({ name: 'Updated' })
        .expect(401);

      await request(app).delete('/api/artifacts/test-artifact-1').expect(401);
    });

    it('should allow public access to read operations', async () => {
      mockRequireJwtAuth.mockImplementation((req, res, next) => {
        // Simulate no authentication for GET requests
        if (req.method === 'GET') {
          next();
        } else {
          res.status(401).json({ error: 'Authentication required' });
        }
      });

      mockGetArtifacts.mockImplementation((req, res) => {
        res.json({ success: true, data: { artifacts: [], total: 0 } });
      });

      await request(app).get('/api/artifacts').expect(200);
    });
  });

  describe('Request Validation', () => {
    it('should validate JSON payload size', async () => {
      const largePayload = {
        ...mockArtifact,
        code: 'x'.repeat(10 * 1024 * 1024), // 10MB of code
      };

      mockSaveArtifact.mockImplementation((req, res, next) => {
        next(new ValidationError('Payload too large'));
      });

      const response = await request(app).post('/api/artifacts').send(largePayload).expect(400);

      expect(response.body.error.message).toBe('Payload too large');
    });

    it('should validate content type', async () => {
      const response = await request(app)
        .post('/api/artifacts')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
