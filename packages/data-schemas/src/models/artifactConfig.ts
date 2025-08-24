import artifactConfigSchema, { IMongoArtifactConfig } from '~/schema/artifactConfig';

/**
 * Creates or returns the ArtifactConfig model using the provided mongoose instance and schema
 */
export function createArtifactConfigModel(mongoose: typeof import('mongoose')) {
  return (
    mongoose.models.ArtifactConfig ||
    mongoose.model<IMongoArtifactConfig>('ArtifactConfig', artifactConfigSchema)
  );
}
