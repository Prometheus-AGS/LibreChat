import { Schema, Document } from 'mongoose';

export interface IMongoArtifactConfig extends Document {
  artifactId: string;
  userId: string;
  supabaseConfig?: {
    enabled: boolean;
    url?: string;
    anonKey?: string;
    serviceKey?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const artifactConfigSchema = new Schema<IMongoArtifactConfig>(
  {
    artifactId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    supabaseConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },
      url: {
        type: String,
        required: false,
      },
      anonKey: {
        type: String,
        required: false,
      },
      serviceKey: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Create compound index for efficient queries
artifactConfigSchema.index({ artifactId: 1, userId: 1 }, { unique: true });

export default artifactConfigSchema;
