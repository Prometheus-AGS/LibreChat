const request = require('supertest');
const express = require('express');
const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const shareRoutes = require('../share');
const { getSharedMessages } = require('../../controllers/ShareController');

// Mock the ShareController
jest.mock('../../controllers/ShareController', () => ({
  getSharedMessages: jest.fn(),
}));

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id', username: 'testuser' };
  next();
};

const mockOptionalAuthMiddleware = (req, res, next) => {
  // Sometimes authenticated, sometimes not
  if (req.headers.authorization) {
    req.user = { id: 'test-user-id', username: 'testuser' };
  }
  next();
};

describe('Share Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  describe('GET /share/:shareId', () => {
    it('should return shared messages with authentication context for authenticated users', async () => {
      const mockSharedMessages = {
        messages: [
          {
            messageId: 'msg-1',
            text: 'Hello world',
            sender: 'User',
            artifacts: [
              {
                identifier: 'test-artifact',
                type: 'text/html',
                title: 'Test HTML',
                content: '<div>Hello</div>',
              },
            ],
          },
        ],
        conversation: {
          conversationId: 'conv-1',
          title: 'Test Conversation',
        },
        authContext: {
          isAuthenticated: true,
          userId: 'test-user-id',
          username: 'testuser',
        },
      };

      getSharedMessages.mockImplementation((req, res) => {
        res.json(mockSharedMessages);
      });

      // Mock the route with authentication middleware
      app.use('/share', mockAuthMiddleware, shareRoutes);

      const response = await request(app).get('/share/test-share-id').expect(200);

      expect(response.body).toEqual(mockSharedMessages);
      expect(response.body.authContext.isAuthenticated).toBe(true);
      expect(response.body.authContext.userId).toBe('test-user-id');
      expect(getSharedMessages).toHaveBeenCalledTimes(1);
    });

    it('should return shared messages with authentication context for anonymous users', async () => {
      const mockSharedMessages = {
        messages: [
          {
            messageId: 'msg-1',
            text: 'Hello world',
            sender: 'User',
            artifacts: [
              {
                identifier: 'test-artifact',
                type: 'text/html',
                title: 'Test HTML',
                content: '<div>Hello</div>',
              },
            ],
          },
        ],
        conversation: {
          conversationId: 'conv-1',
          title: 'Test Conversation',
        },
        authContext: {
          isAuthenticated: false,
          userId: null,
          username: null,
        },
      };

      getSharedMessages.mockImplementation((req, res) => {
        res.json(mockSharedMessages);
      });

      // Mock the route with optional authentication middleware
      app.use('/share', mockOptionalAuthMiddleware, shareRoutes);

      const response = await request(app).get('/share/test-share-id').expect(200);

      expect(response.body).toEqual(mockSharedMessages);
      expect(response.body.authContext.isAuthenticated).toBe(false);
      expect(response.body.authContext.userId).toBeNull();
      expect(getSharedMessages).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication context correctly when user is partially authenticated', async () => {
      const mockSharedMessages = {
        messages: [
          {
            messageId: 'msg-1',
            text: 'Hello world',
            sender: 'User',
          },
        ],
        conversation: {
          conversationId: 'conv-1',
          title: 'Test Conversation',
        },
        authContext: {
          isAuthenticated: true,
          userId: 'test-user-id',
          username: 'testuser',
        },
      };

      getSharedMessages.mockImplementation((req, res) => {
        res.json(mockSharedMessages);
      });

      app.use('/share', mockOptionalAuthMiddleware, shareRoutes);

      const response = await request(app)
        .get('/share/test-share-id')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.authContext.isAuthenticated).toBe(true);
      expect(response.body.authContext.userId).toBe('test-user-id');
    });

    it('should handle errors gracefully', async () => {
      getSharedMessages.mockImplementation((req, res) => {
        res.status(404).json({ error: 'Shared conversation not found' });
      });

      app.use('/share', mockOptionalAuthMiddleware, shareRoutes);

      const response = await request(app).get('/share/invalid-share-id').expect(404);

      expect(response.body.error).toBe('Shared conversation not found');
    });

    it('should handle server errors', async () => {
      getSharedMessages.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      app.use('/share', mockOptionalAuthMiddleware, shareRoutes);

      const response = await request(app).get('/share/test-share-id').expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should pass correct parameters to controller', async () => {
      const mockSharedMessages = {
        messages: [],
        conversation: {},
        authContext: {
          isAuthenticated: false,
          userId: null,
          username: null,
        },
      };

      getSharedMessages.mockImplementation((req, res) => {
        expect(req.params.shareId).toBe('test-share-id-123');
        res.json(mockSharedMessages);
      });

      app.use('/share', mockOptionalAuthMiddleware, shareRoutes);

      await request(app).get('/share/test-share-id-123').expect(200);

      expect(getSharedMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authentication Context Integration', () => {
    it('should include authentication context in response for authenticated requests', async () => {
      const mockSharedMessages = {
        messages: [
          {
            messageId: 'msg-1',
            text: 'Test message with artifacts',
            artifacts: [
              {
                identifier: 'test-artifact',
                type: 'text/javascript',
                title: 'Test Script',
                content: 'console.log("Hello World");',
              },
            ],
          },
        ],
        conversation: {
          conversationId: 'conv-1',
          title: 'Test Conversation',
        },
        authContext: {
          isAuthenticated: true,
          userId: 'authenticated-user-id',
          username: 'authenticateduser',
        },
      };

      getSharedMessages.mockImplementation((req, res) => {
        // Simulate controller adding authentication context
        const authContext = {
          isAuthenticated: !!req.user,
          userId: req.user?.id || null,
          username: req.user?.username || null,
        };

        res.json({
          ...mockSharedMessages,
          authContext,
        });
      });

      app.use('/share', mockAuthMiddleware, shareRoutes);

      const response = await request(app).get('/share/test-share-id').expect(200);

      expect(response.body.authContext).toEqual({
        isAuthenticated: true,
        userId: 'test-user-id',
        username: 'testuser',
      });
    });

    it('should include authentication context in response for anonymous requests', async () => {
      const mockSharedMessages = {
        messages: [
          {
            messageId: 'msg-1',
            text: 'Test message with artifacts',
            artifacts: [
              {
                identifier: 'test-artifact',
                type: 'text/html',
                title: 'Test HTML',
                content: '<div>Test content</div>',
              },
            ],
          },
        ],
        conversation: {
          conversationId: 'conv-1',
          title: 'Test Conversation',
        },
        authContext: {
          isAuthenticated: false,
          userId: null,
          username: null,
        },
      };

      getSharedMessages.mockImplementation((req, res) => {
        // Simulate controller adding authentication context
        const authContext = {
          isAuthenticated: !!req.user,
          userId: req.user?.id || null,
          username: req.user?.username || null,
        };

        res.json({
          ...mockSharedMessages,
          authContext,
        });
      });

      app.use('/share', mockOptionalAuthMiddleware, shareRoutes);

      const response = await request(app).get('/share/test-share-id').expect(200);

      expect(response.body.authContext).toEqual({
        isAuthenticated: false,
        userId: null,
        username: null,
      });
    });
  });
});
