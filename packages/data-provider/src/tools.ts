import { z } from 'zod';

/**
 * Feature groups available for Supabase tools
 */
export const featureGroupSchema = z.enum([
  'database', // PostgREST API access
  'storage', // File storage operations
  'auth', // Authentication services
  'functions', // Edge functions
  'realtime', // Real-time subscriptions
]);

export type FeatureGroup = z.infer<typeof featureGroupSchema>;

/**
 * Configuration for hosted Supabase instances
 */
export const hostedConfigSchema = z.object({
  projectRef: z.string().min(1, 'Project reference is required'),
  anonKey: z.string().min(1, 'Anonymous key is required'),
  serviceKey: z.string().optional(),
  region: z.string().optional(),
});

export type HostedConfig = z.infer<typeof hostedConfigSchema>;

/**
 * Configuration for self-hosted Supabase instances
 */
export const selfHostedConfigSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  anonKey: z.string().min(1, 'Anonymous key is required'),
  serviceKey: z.string().optional(),
  apiVersion: z.string().optional(),
  customHeaders: z.record(z.string()).optional(),
});

export type SelfHostedConfig = z.infer<typeof selfHostedConfigSchema>;

/**
 * Tool deployment type
 */
export const toolTypeSchema = z.enum(['hosted', 'self-hosted']);

export type ToolType = z.infer<typeof toolTypeSchema>;

/**
 * Health status for tool monitoring
 */
export const healthStatusSchema = z.enum(['healthy', 'unhealthy', 'unknown']);

export type HealthStatus = z.infer<typeof healthStatusSchema>;

/**
 * Complete Supabase tool configuration
 */
export const supabaseToolSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tool name is required').max(50, 'Tool name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  type: toolTypeSchema,
  config: z.union([hostedConfigSchema, selfHostedConfigSchema]),
  features: z.array(featureGroupSchema).min(1, 'At least one feature must be enabled'),
  userId: z.string().optional(), // null for system-wide tools
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
  healthStatus: healthStatusSchema.optional(),
  lastHealthCheck: z.date().optional(),
});

export type SupabaseTool = z.infer<typeof supabaseToolSchema>;

/**
 * Tool creation input (without auto-generated fields)
 */
export const createSupabaseToolSchema = supabaseToolSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  healthStatus: true,
  lastHealthCheck: true,
});

export type CreateSupabaseToolInput = z.infer<typeof createSupabaseToolSchema>;

/**
 * Tool update input (partial, without auto-generated fields)
 */
export const updateSupabaseToolSchema = createSupabaseToolSchema.partial();

export type UpdateSupabaseToolInput = z.infer<typeof updateSupabaseToolSchema>;

/**
 * Artifact Supabase configuration - supports both tool reference and direct config
 */
export const artifactSupabaseConfigSchema = z
  .object({
    toolName: z.string().optional(),
    directConfig: z
      .object({
        url: z.string().url('Must be a valid URL'),
        anonKey: z.string().min(1, 'Anonymous key is required'),
      })
      .optional(),
  })
  .refine((data) => data.toolName || data.directConfig, {
    message: 'Either toolName or directConfig must be provided',
    path: ['toolName'],
  });

export type ArtifactSupabaseConfig = z.infer<typeof artifactSupabaseConfigSchema>;

/**
 * Tool registry entry for runtime resolution
 */
export interface ToolRegistryEntry {
  tool: SupabaseTool;
  client?: any; // Supabase client instance (cached)
  lastAccessed?: Date;
  accessCount: number;
}

/**
 * Platform abstraction interface
 */
export interface SupabasePlatform {
  /**
   * Create a Supabase client for the given configuration
   */
  createClient(config: HostedConfig | SelfHostedConfig, type: ToolType): Promise<any>;

  /**
   * Test connection to Supabase instance
   */
  testConnection(config: HostedConfig | SelfHostedConfig, type: ToolType): Promise<boolean>;

  /**
   * Get supported features for the Supabase instance
   */
  getSupportedFeatures(
    config: HostedConfig | SelfHostedConfig,
    type: ToolType,
  ): Promise<FeatureGroup[]>;

  /**
   * Check health status of the Supabase instance
   */
  checkHealth(config: HostedConfig | SelfHostedConfig, type: ToolType): Promise<HealthStatus>;

  /**
   * Get connection info for debugging
   */
  getConnectionInfo(
    config: HostedConfig | SelfHostedConfig,
    type: ToolType,
  ): {
    url: string;
    hasServiceKey: boolean;
    features: FeatureGroup[];
  };
}

/**
 * Tool registry service interface
 */
export interface ToolRegistry {
  /**
   * Register a tool in the registry
   */
  register(tool: SupabaseTool): Promise<void>;

  /**
   * Unregister a tool from the registry
   */
  unregister(toolId: string): Promise<void>;

  /**
   * Get a tool by name (for the current user)
   */
  getTool(toolName: string, userId?: string): Promise<SupabaseTool | null>;

  /**
   * Get all tools for a user
   */
  getUserTools(userId: string): Promise<SupabaseTool[]>;

  /**
   * Get all system-wide tools
   */
  getSystemTools(): Promise<SupabaseTool[]>;

  /**
   * Resolve tool configuration for artifact usage
   */
  resolveToolConfig(
    config: ArtifactSupabaseConfig,
    userId?: string,
  ): Promise<{
    url: string;
    anonKey: string;
    serviceKey?: string;
    features: FeatureGroup[];
  } | null>;

  /**
   * Get or create cached Supabase client
   */
  getClient(toolName: string, userId?: string): Promise<any>;

  /**
   * Clear cached clients
   */
  clearCache(toolId?: string): Promise<void>;

  /**
   * Update tool health status
   */
  updateHealth(toolId: string, status: HealthStatus): Promise<void>;
}

/**
 * Encryption service interface for sensitive data
 */
export interface EncryptionService {
  /**
   * Encrypt sensitive data (like service keys)
   */
  encrypt(data: string): Promise<string>;

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): Promise<string>;

  /**
   * Generate a secure hash for data integrity
   */
  hash(data: string): Promise<string>;

  /**
   * Verify hash
   */
  verifyHash(data: string, hash: string): Promise<boolean>;
}

/**
 * Audit log entry for tool operations
 */
export const auditLogEntrySchema = z.object({
  id: z.string(),
  toolId: z.string(),
  userId: z.string().optional(),
  action: z.enum(['create', 'read', 'update', 'delete', 'access', 'health_check']),
  details: z.record(z.any()).optional(),
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

/**
 * Tool usage statistics
 */
export interface ToolUsageStats {
  toolId: string;
  toolName: string;
  totalAccess: number;
  uniqueUsers: number;
  lastAccessed: Date;
  averageResponseTime: number;
  errorRate: number;
  healthScore: number;
}

/**
 * System configuration for tool management
 */
export const toolSystemConfigSchema = z.object({
  maxToolsPerUser: z.number().min(1).max(100).default(10),
  healthCheckInterval: z.number().min(60).default(1800), // seconds
  cacheTimeout: z.number().min(300).default(3600), // seconds
  encryptionKey: z.string().min(32),
  auditLogRetention: z.number().min(1).default(90), // days
  enableSystemTools: z.boolean().default(true),
  enableUserTools: z.boolean().default(true),
});

export type ToolSystemConfig = z.infer<typeof toolSystemConfigSchema>;

/**
 * Error types for tool operations
 */
export class ToolError extends Error {
  constructor(
    message: string,
    public code: string,
    public toolId?: string,
    public userId?: string,
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export class ToolNotFoundError extends ToolError {
  constructor(toolName: string, userId?: string) {
    super(
      `Tool '${toolName}' not found${userId ? ` for user ${userId}` : ''}`,
      'TOOL_NOT_FOUND',
      undefined,
      userId,
    );
  }
}

export class ToolConnectionError extends ToolError {
  constructor(toolId: string, message: string) {
    super(`Connection failed for tool ${toolId}: ${message}`, 'CONNECTION_FAILED', toolId);
  }
}

export class ToolPermissionError extends ToolError {
  constructor(toolId: string, userId: string, action: string) {
    super(
      `Permission denied for user ${userId} to ${action} tool ${toolId}`,
      'PERMISSION_DENIED',
      toolId,
      userId,
    );
  }
}

export class ToolValidationError extends ToolError {
  constructor(message: string, field?: string) {
    super(`Validation error: ${message}`, 'VALIDATION_ERROR');
    if (field) {
      this.message = `Validation error in field '${field}': ${message}`;
    }
  }
}

/**
 * Default feature sets for different use cases
 */
export const DEFAULT_FEATURE_SETS = {
  minimal: ['database'] as FeatureGroup[],
  standard: ['database', 'storage', 'auth'] as FeatureGroup[],
  full: ['database', 'storage', 'auth', 'functions', 'realtime'] as FeatureGroup[],
} as const;

/**
 * Tool name validation regex (alphanumeric, hyphens, underscores)
 */
export const TOOL_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Maximum lengths for various fields
 */
export const LIMITS = {
  TOOL_NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 200,
  MAX_TOOLS_PER_USER: 10,
  MAX_FEATURES_PER_TOOL: 5,
} as const;

/**
 * Platform abstraction interface
 */
export interface SupabasePlatformInterface {
  readonly platformType: 'hosted' | 'self-hosted';
  readonly baseUrl: string;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  testConnection(): Promise<ConnectionTestResult>;

  // Configuration
  validateConfig(): Promise<void>;
  buildConnectionUrl(): string;

  // Client access
  getClient(): any; // SupabaseClient type from @supabase/supabase-js

  // Health monitoring
  getLastHealthCheck(): Date | null;
  getHealthStatus(): HealthStatus;

  // Feature management
  hasFeature(feature: FeatureGroup): boolean;
  getFeatures(): FeatureGroup[];

  // Tool information
  getToolInfo(): Pick<SupabaseTool, 'id' | 'name' | 'description' | 'type' | 'features'>;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  success: boolean;
  responseTime: number;
  timestamp: Date;
  error?: string;
  details: {
    platform: 'hosted' | 'self-hosted';
    url: string;
    features: FeatureGroup[];
  };
}

/**
 * Connection options for platform instances
 */
export interface SupabaseConnectionOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}
