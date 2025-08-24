import { Schema, Document } from 'mongoose';

/**
 * Feature groups available for Supabase tools
 */
export type FeatureGroup = 'database' | 'storage' | 'auth' | 'functions' | 'realtime';

/**
 * Tool deployment type
 */
export type ToolType = 'hosted' | 'self-hosted';

/**
 * Health status for tool monitoring
 */
export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

/**
 * Configuration for hosted Supabase instances
 */
export interface HostedConfig {
  projectRef: string;
  anonKey: string;
  serviceKey?: string;
  region?: string;
}

/**
 * Configuration for self-hosted Supabase instances
 */
export interface SelfHostedConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  apiVersion?: string;
  customHeaders?: Record<string, string>;
}

/**
 * Complete Supabase tool configuration
 */
export interface SupabaseTool {
  id: string;
  name: string;
  description?: string;
  type: ToolType;
  config: HostedConfig | SelfHostedConfig;
  features: FeatureGroup[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  healthStatus?: HealthStatus;
  lastHealthCheck?: Date;
}

/**
 * MongoDB document interface for SupabaseTool
 */
export interface ISupabaseToolDocument extends Document, Omit<SupabaseTool, 'id'> {
  _id: string;
}

/**
 * Mongoose schema for SupabaseTool
 */
export const supabaseToolSchema = new Schema<ISupabaseToolDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
      match: /^[a-zA-Z0-9_-]+$/,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: ['hosted', 'self-hosted'] as ToolType[],
      index: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (this: ISupabaseToolDocument, config: any) {
          if (this.type === 'hosted') {
            return config.projectRef && config.anonKey;
          } else if (this.type === 'self-hosted') {
            return config.url && config.anonKey;
          }
          return false;
        },
        message: 'Invalid configuration for tool type',
      },
    },
    features: {
      type: [String],
      required: true,
      enum: ['database', 'storage', 'auth', 'functions', 'realtime'] as FeatureGroup[],
      validate: {
        validator: function (features: FeatureGroup[]) {
          return features.length > 0 && features.length <= 5;
        },
        message: 'Must have at least 1 and at most 5 features',
      },
    },
    userId: {
      type: String,
      default: null,
      index: true,
      sparse: true, // Allow multiple null values
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    healthStatus: {
      type: String,
      enum: ['healthy', 'unhealthy', 'unknown'] as HealthStatus[],
      default: 'unknown',
      index: true,
    },
    lastHealthCheck: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'supabase_tools',
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        // Sanitize sensitive data in responses
        if (ret.config) {
          if (ret.config.serviceKey) {
            ret.config.serviceKey = '***REDACTED***';
          }
        }

        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

/**
 * Compound indexes for efficient queries
 */

// Unique tool names per user (system tools have userId = null)
supabaseToolSchema.index(
  { name: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $ne: null } },
    name: 'unique_user_tool_name',
  },
);

// Unique system tool names
supabaseToolSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: null },
    name: 'unique_system_tool_name',
  },
);

// Query active tools by user
supabaseToolSchema.index({ userId: 1, isActive: 1 }, { name: 'user_active_tools' });

// Query tools by type and health status
supabaseToolSchema.index({ type: 1, healthStatus: 1, isActive: 1 }, { name: 'type_health_active' });

// Query tools needing health checks
supabaseToolSchema.index({ lastHealthCheck: 1, isActive: 1 }, { name: 'health_check_schedule' });

/**
 * Pre-save middleware for validation and data processing
 */
supabaseToolSchema.pre('save', function (next) {
  // Validate tool name format
  if (!/^[a-zA-Z0-9_-]+$/.test(this.name)) {
    return next(
      new Error('Tool name can only contain alphanumeric characters, hyphens, and underscores'),
    );
  }

  // Validate configuration based on type
  if (this.type === 'hosted') {
    const config = this.config as any;
    if (!config.projectRef || !config.anonKey) {
      return next(new Error('Hosted tools require projectRef and anonKey'));
    }

    // Validate project reference format
    if (!/^[a-zA-Z0-9]{20}$/.test(config.projectRef)) {
      return next(new Error('Invalid project reference format'));
    }
  } else if (this.type === 'self-hosted') {
    const config = this.config as any;
    if (!config.url || !config.anonKey) {
      return next(new Error('Self-hosted tools require url and anonKey'));
    }

    // Validate URL format
    try {
      new URL(config.url);
    } catch {
      return next(new Error('Invalid URL format'));
    }
  }

  // Ensure unique features
  this.features = [...new Set(this.features)];

  next();
});

/**
 * Pre-remove middleware for cleanup
 */
supabaseToolSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    // TODO: Add cleanup logic here (clear caches, audit logs, etc.)
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance methods
 */

/**
 * Get sanitized configuration (without sensitive data)
 */
supabaseToolSchema.methods.getSanitizedConfig = function () {
  const config = { ...this.config };
  if (config.serviceKey) {
    config.serviceKey = '***REDACTED***';
  }
  return config;
};

/**
 * Get connection URL for the tool
 */
supabaseToolSchema.methods.getConnectionUrl = function (): string {
  if (this.type === 'hosted') {
    const config = this.config as any;
    return `https://${config.projectRef}.supabase.co`;
  } else {
    const config = this.config as any;
    return config.url;
  }
};

/**
 * Check if tool has a specific feature enabled
 */
supabaseToolSchema.methods.hasFeature = function (feature: FeatureGroup): boolean {
  return this.features.includes(feature);
};

/**
 * Check if tool is accessible by user
 */
supabaseToolSchema.methods.isAccessibleBy = function (userId?: string): boolean {
  // System tools (userId = null) are accessible by everyone
  if (!this.userId) {
    return true;
  }

  // User tools are only accessible by their owner
  return this.userId === userId;
};

/**
 * Update health status
 */
supabaseToolSchema.methods.updateHealth = function (status: HealthStatus): void {
  this.healthStatus = status;
  this.lastHealthCheck = new Date();
};

/**
 * Static methods
 */

/**
 * Find tool by name for a specific user
 */
supabaseToolSchema.statics.findByNameForUser = function (name: string, userId?: string) {
  const query: any = { name, isActive: true };

  if (userId) {
    // Look for user's tool first, then system tools
    return this.findOne({
      $or: [
        { ...query, userId },
        { ...query, userId: null },
      ],
    }).sort({ userId: -1 }); // User tools first, then system tools
  } else {
    // Only system tools
    query.userId = null;
    return this.findOne(query);
  }
};

/**
 * Find all tools accessible by user
 */
supabaseToolSchema.statics.findAccessibleByUser = function (userId: string) {
  return this.find({
    $or: [
      { userId, isActive: true },
      { userId: null, isActive: true },
    ],
  }).sort({ userId: -1, name: 1 });
};

/**
 * Find tools needing health check
 */
supabaseToolSchema.statics.findNeedingHealthCheck = function (olderThan: Date) {
  return this.find({
    isActive: true,
    $or: [{ lastHealthCheck: null }, { lastHealthCheck: { $lt: olderThan } }],
  });
};

/**
 * Get usage statistics
 */
supabaseToolSchema.statics.getUsageStats = function (toolId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // This would typically aggregate from audit logs
  // For now, return basic tool info
  return this.findById(toolId).select('name type features healthStatus lastHealthCheck');
};

/**
 * Validate tool name uniqueness
 */
supabaseToolSchema.statics.isNameAvailable = async function (
  name: string,
  userId?: string,
  excludeId?: string,
) {
  const query: any = { name };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  if (userId) {
    // Check both user tools and system tools
    const existing = await this.findOne({
      ...query,
      $or: [{ userId }, { userId: null }],
    });
    return !existing;
  } else {
    // Check only system tools
    query.userId = null;
    const existing = await this.findOne(query);
    return !existing;
  }
};

export default supabaseToolSchema;
