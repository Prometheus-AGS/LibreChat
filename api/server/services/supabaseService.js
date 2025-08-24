const { createClient } = require('@supabase/supabase-js');
const { logger } = require('~/config');

/**
 * Supabase Service for LibreChat Artifact Registry
 * Optimized for SELF-HOSTED Supabase installations (our secret sauce!)
 * Self-hosted = NOT in Supabase's cloud, can be at ANY domain anywhere
 */
class SupabaseService {
  constructor() {
    this.clients = new Map();
    this.connectionStatus = new Map();
  }

  /**
   * Validate Supabase configuration with focus on self-hosted deployments
   * @param {Object} config - Supabase configuration
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];
    let deploymentType = 'self-hosted'; // Default assumption - our preferred type!

    // Required fields
    if (!config.url) {
      errors.push('Supabase URL is required');
    } else {
      // Detect if using Supabase's hosted cloud (the exception, not the rule)
      if (config.url.includes('.supabase.co') || config.url.includes('.supabase.com')) {
        deploymentType = 'supabase-cloud';
        warnings.push(
          'Using Supabase Cloud - consider self-hosting for better control, privacy, and cost efficiency',
        );
      } else {
        // This is what we want! Self-hosted at any domain
        deploymentType = 'self-hosted';
      }
    }

    if (!config.anonKey) {
      errors.push('Supabase anonymous key is required');
    }

    // Self-hosted optimizations and recommendations
    if (deploymentType === 'self-hosted') {
      if (!config.serviceKey) {
        warnings.push(
          'Service key recommended for self-hosted installations to enable full administrative functionality',
        );
      }

      if (!config.jwtSecret) {
        warnings.push('JWT secret not provided - may be required for custom authentication flows');
      }

      // Check for HTTPS (security best practice for self-hosted)
      if (!config.url.startsWith('https://')) {
        if (config.url.includes('localhost') || config.url.includes('127.0.0.1')) {
          warnings.push('Using HTTP for local development - ensure HTTPS in production');
        } else {
          errors.push('HTTPS required for production self-hosted deployments');
        }
      }

      // Self-hosted performance and reliability features
      if (!config.connectionPooling) {
        warnings.push(
          'Connection pooling not configured - recommended for production self-hosted instances',
        );
      }

      if (!config.maxConnections) {
        warnings.push('Max connections not specified - consider setting for optimal performance');
      }

      if (!config.timeout) {
        warnings.push(
          'Request timeout not configured - recommended for reliable self-hosted connections',
        );
      }
    }

    // Configuration validation
    if (config.enableRLS !== undefined && typeof config.enableRLS !== 'boolean') {
      errors.push('enableRLS must be a boolean value');
    }

    if (config.schema && typeof config.schema !== 'string') {
      errors.push('schema must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      deploymentType,
      score: this.calculateConfigScore(config, errors, warnings, deploymentType),
    };
  }

  /**
   * Calculate configuration quality score with major bonus for self-hosted
   * @param {Object} config - Configuration object
   * @param {Array} errors - Validation errors
   * @param {Array} warnings - Validation warnings
   * @param {string} deploymentType - Type of deployment
   * @returns {number} Score from 0-100
   */
  calculateConfigScore(config, errors, warnings, deploymentType) {
    let score = 100;

    // Deduct for errors (critical)
    score -= errors.length * 25;

    // Deduct for warnings (minor)
    score -= warnings.length * 3; // Minimal penalty for warnings

    // MAJOR BONUS for self-hosted (this is our secret sauce!)
    if (deploymentType === 'self-hosted') {
      score += 25; // Huge bonus for self-hosting

      // Additional bonuses for self-hosted best practices
      if (config.serviceKey) score += 10;
      if (config.jwtSecret) score += 5;
      if (config.url.startsWith('https://')) score += 10;
      if (config.connectionPooling) score += 5;
      if (config.maxConnections) score += 5;
      if (config.timeout) score += 5;
      if (config.enableRLS === true) score += 10;
      if (config.customDomain) score += 5; // Bonus for custom domains
    } else if (deploymentType === 'supabase-cloud') {
      // Penalty for using Supabase's cloud instead of self-hosting
      score -= 15;
    }

    // General bonuses
    if (config.schema && config.schema !== 'public') score += 5;
    if (config.auth) score += 5;
    if (config.db) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create or get cached Supabase client optimized for self-hosted deployments
   * @param {Object} config - Supabase configuration
   * @param {string} clientId - Unique identifier for this client
   * @returns {Object} Supabase client
   */
  getClient(config, clientId = 'default') {
    if (this.clients.has(clientId)) {
      return this.clients.get(clientId);
    }

    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid Supabase configuration: ${validation.errors.join(', ')}`);
    }

    // Self-hosted optimized client options
    const clientOptions = {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
        ...config.auth,
      },
      db: {
        schema: config.schema || 'public',
        ...config.db,
      },
      // Self-hosted performance optimizations
      global: {
        fetch: config.customFetch || fetch,
        headers: {
          'User-Agent': 'LibreChat-ArtifactRegistry/1.0',
          ...config.headers,
        },
      },
    };

    // Add timeout for self-hosted reliability
    if (config.timeout) {
      clientOptions.global.fetch = this.createTimeoutFetch(config.timeout);
    }

    // Connection pooling for self-hosted performance
    if (config.connectionPooling && config.maxConnections) {
      clientOptions.db.pool = {
        max: config.maxConnections,
        min: Math.floor(config.maxConnections / 4),
        idleTimeoutMillis: 30000,
        ...config.connectionPooling,
      };
    }

    const client = createClient(config.url, config.serviceKey || config.anonKey, clientOptions);

    this.clients.set(clientId, client);
    return client;
  }

  /**
   * Create a fetch function with timeout for reliable self-hosted connections
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Function} Fetch function with timeout
   */
  createTimeoutFetch(timeout) {
    return async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(
            `Request timeout after ${timeout}ms - check your self-hosted Supabase instance`,
          );
        }
        throw error;
      }
    };
  }

  /**
   * Test Supabase connection with comprehensive checks optimized for self-hosted
   * @param {Object} config - Supabase configuration
   * @returns {Promise<Object>} Connection test results
   */
  async testConnection(config) {
    const testId = `test_${Date.now()}`;
    const startTime = Date.now();

    try {
      logger.info('Starting Supabase connection test', {
        url: config.url,
        type: config.url.includes('.supabase.co') ? 'cloud' : 'self-hosted',
      });

      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Configuration validation failed',
          details: validation,
          duration: Date.now() - startTime,
        };
      }

      const client = this.getClient(config, testId);
      const tests = [];

      // Test 1: Basic connectivity and response time
      const connectStart = Date.now();
      try {
        const { data, error } = await client
          .from('artifacts')
          .select('count', { count: 'exact', head: true });

        const responseTime = Date.now() - connectStart;
        tests.push({
          name: 'Basic Connectivity',
          success: !error,
          error: error?.message,
          details: error ? null : `Connected successfully in ${responseTime}ms`,
          responseTime,
        });
      } catch (err) {
        tests.push({
          name: 'Basic Connectivity',
          success: false,
          error: err.message,
          details: 'Failed to establish connection - check URL and network access',
        });
      }

      // Test 2: Schema validation (critical for self-hosted)
      try {
        const { data: tables, error } = await client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', config.schema || 'public')
          .in('table_name', ['artifacts', 'navigation_items', 'artifact_dependencies']);

        const requiredTables = ['artifacts', 'navigation_items', 'artifact_dependencies'];
        const existingTables = tables?.map((t) => t.table_name) || [];
        const missingTables = requiredTables.filter((table) => !existingTables.includes(table));

        tests.push({
          name: 'Schema Validation',
          success: missingTables.length === 0,
          error: missingTables.length > 0 ? `Missing tables: ${missingTables.join(', ')}` : null,
          details: {
            requiredTables,
            existingTables,
            missingTables,
            schemaReady: missingTables.length === 0,
          },
        });
      } catch (err) {
        tests.push({
          name: 'Schema Validation',
          success: false,
          error: err.message,
          details: 'Failed to validate schema - ensure database is properly initialized',
        });
      }

      // Test 3: Read permissions
      try {
        const { data, error } = await client
          .from('artifacts')
          .select('id, component_id, name')
          .limit(1);

        tests.push({
          name: 'Read Permissions',
          success: !error,
          error: error?.message,
          details: error ? 'No read access to artifacts table' : 'Read access confirmed',
        });
      } catch (err) {
        tests.push({
          name: 'Read Permissions',
          success: false,
          error: err.message,
          details: 'Failed to test read permissions',
        });
      }

      // Test 4: Write permissions (especially important for self-hosted)
      if (config.serviceKey) {
        try {
          const testData = {
            component_id: `test_${testId}`,
            name: 'Connection Test Component',
            description: 'Temporary component for connection testing',
            component_code: 'export const TestComponent = () => <div>Test</div>;',
            status: 'draft',
          };

          const { data, error: insertError } = await client
            .from('artifacts')
            .insert(testData)
            .select('id')
            .single();

          if (!insertError && data?.id) {
            // Clean up test data
            await client.from('artifacts').delete().eq('id', data.id);

            tests.push({
              name: 'Write Permissions',
              success: true,
              error: null,
              details: 'Write access confirmed and test data cleaned up',
            });
          } else {
            tests.push({
              name: 'Write Permissions',
              success: false,
              error: insertError?.message || 'Failed to insert test data',
              details: 'No write access - check service key permissions',
            });
          }
        } catch (err) {
          tests.push({
            name: 'Write Permissions',
            success: false,
            error: err.message,
            details: 'Failed to test write permissions',
          });
        }
      } else {
        tests.push({
          name: 'Write Permissions',
          success: null,
          error: 'Skipped - no service key provided',
          details: 'Service key required for write permission testing',
        });
      }

      // Test 5: Performance check (important for self-hosted)
      const perfStart = Date.now();
      try {
        const { data, error } = await client
          .from('artifacts')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        const queryTime = Date.now() - perfStart;
        tests.push({
          name: 'Performance Check',
          success: !error && queryTime < 5000, // 5 second threshold
          error: error?.message,
          details: error ? 'Query failed' : `Query completed in ${queryTime}ms`,
          queryTime,
        });
      } catch (err) {
        tests.push({
          name: 'Performance Check',
          success: false,
          error: err.message,
          details: 'Failed to test query performance',
        });
      }

      // Test 6: RLS policies (if enabled)
      if (config.enableRLS) {
        try {
          // Try to check RLS status
          const { data, error } = await client.rpc('pg_get_rls_status', {
            table_name: 'artifacts',
          });

          tests.push({
            name: 'RLS Policies',
            success: !error,
            error: error?.message,
            details: error ? 'RLS policy check failed' : 'RLS policies validated',
          });
        } catch (err) {
          tests.push({
            name: 'RLS Policies',
            success: false,
            error: err.message,
            details: 'Failed to check RLS policies - may not be supported',
          });
        }
      }

      // Calculate results
      const successfulTests = tests.filter((t) => t.success === true).length;
      const failedTests = tests.filter((t) => t.success === false).length;
      const skippedTests = tests.filter((t) => t.success === null).length;
      const totalTests = tests.length;

      const result = {
        success: failedTests === 0 && successfulTests > 0,
        duration: Date.now() - startTime,
        summary: {
          total: totalTests,
          successful: successfulTests,
          failed: failedTests,
          skipped: skippedTests,
          successRate: totalTests > 0 ? (successfulTests / (totalTests - skippedTests)) * 100 : 0,
        },
        tests,
        config: {
          validation,
          url: config.url,
          deploymentType: validation.deploymentType,
          schema: config.schema || 'public',
          hasServiceKey: !!config.serviceKey,
          rlsEnabled: config.enableRLS,
          selfHosted: validation.deploymentType === 'self-hosted',
        },
      };

      // Cache connection status
      this.connectionStatus.set(testId, {
        ...result,
        timestamp: new Date().toISOString(),
      });

      // Clean up test client
      this.clients.delete(testId);

      logger.info('Supabase connection test completed', {
        success: result.success,
        duration: result.duration,
        successRate: result.summary.successRate,
        deploymentType: validation.deploymentType,
      });

      return result;
    } catch (error) {
      logger.error('Supabase connection test failed', { error: error.message });

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        tests: [],
        summary: {
          total: 0,
          successful: 0,
          failed: 1,
          skipped: 0,
          successRate: 0,
        },
      };
    }
  }

  /**
   * Get artifacts from Supabase with filtering and pagination
   * @param {Object} config - Supabase configuration
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Artifacts data
   */
  async getArtifacts(config, options = {}) {
    try {
      const client = this.getClient(config);
      const {
        limit = 50,
        offset = 0,
        search,
        category,
        status = 'active',
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = options;

      let query = client
        .from('artifacts')
        .select(
          `
          id,
          component_id,
          name,
          description,
          version,
          category,
          tags,
          framework,
          ui_library,
          author,
          download_count,
          usage_count,
          rating,
          status,
          is_featured,
          is_verified,
          created_at,
          updated_at
        `,
        )
        .eq('status', status)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.textSearch('search_vector', search);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch artifacts: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: count > offset + limit,
        },
      };
    } catch (error) {
      logger.error('Failed to get artifacts from Supabase', { error: error.message });
      return {
        success: false,
        error: error.message,
        data: [],
        pagination: null,
      };
    }
  }

  /**
   * Get navigation items from Supabase
   * @param {Object} config - Supabase configuration
   * @returns {Promise<Object>} Navigation data
   */
  async getNavigationItems(config) {
    try {
      const client = this.getClient(config);

      const { data, error } = await client
        .from('navigation_tree_view')
        .select('*')
        .eq('is_enabled', true)
        .order('path');

      if (error) {
        throw new Error(`Failed to fetch navigation items: ${error.message}`);
      }

      // Transform flat data into tree structure
      const navigationTree = this.buildNavigationTree(data || []);

      return {
        success: true,
        data: navigationTree,
      };
    } catch (error) {
      logger.error('Failed to get navigation items from Supabase', { error: error.message });
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Build navigation tree from flat data
   * @param {Array} items - Flat navigation items
   * @returns {Array} Tree structure
   */
  buildNavigationTree(items) {
    const itemMap = new Map();
    const rootItems = [];

    // Create map of all items
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build tree structure
    items.forEach((item) => {
      const treeItem = itemMap.get(item.id);
      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children.push(treeItem);
        }
      } else {
        rootItems.push(treeItem);
      }
    });

    return rootItems;
  }

  /**
   * Clean up cached clients and connections
   */
  cleanup() {
    this.clients.clear();
    this.connectionStatus.clear();
    logger.info('Supabase service cleaned up');
  }

  /**
   * Get connection status for a specific test
   * @param {string} testId - Test identifier
   * @returns {Object|null} Connection status
   */
  getConnectionStatus(testId) {
    return this.connectionStatus.get(testId) || null;
  }

  /**
   * Get all cached connection statuses
   * @returns {Array} All connection statuses
   */
  getAllConnectionStatuses() {
    return Array.from(this.connectionStatus.entries()).map(([id, status]) => ({
      id,
      ...status,
    }));
  }
}

// Export singleton instance
module.exports = new SupabaseService();
