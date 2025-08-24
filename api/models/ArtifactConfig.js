const { ArtifactConfig } = require('~/db/models');

/**
 * Retrieve an artifact configuration by artifact ID and user ID.
 *
 * @param {string} artifactId - The ID of the artifact.
 * @param {string} userId - The ID of the user.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<IArtifactConfig|null>} A plain object representing the artifact configuration document, or `null` if not found.
 */
const getArtifactConfig = async function (artifactId, userId, fieldsToSelect = null) {
  const query = ArtifactConfig.findOne({ artifactId, userId });

  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
};

/**
 * Create or update an artifact configuration.
 *
 * @param {string} artifactId - The ID of the artifact.
 * @param {string} userId - The ID of the user.
 * @param {Object} configData - The configuration data to save.
 * @returns {Promise<IArtifactConfig>} The created or updated artifact configuration document.
 */
const saveArtifactConfig = async function (artifactId, userId, configData) {
  const query = { artifactId, userId };
  const update = {
    $set: {
      ...configData,
      updatedAt: new Date(),
    },
    $setOnInsert: {
      artifactId,
      userId,
      createdAt: new Date(),
    },
  };
  const options = {
    new: true,
    upsert: true,
    lean: true,
  };

  return await ArtifactConfig.findOneAndUpdate(query, update, options);
};

/**
 * Delete an artifact configuration.
 *
 * @param {string} artifactId - The ID of the artifact.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<IArtifactConfig|null>} The deleted artifact configuration document, or `null` if not found.
 */
const deleteArtifactConfig = async function (artifactId, userId) {
  return await ArtifactConfig.findOneAndDelete({ artifactId, userId }).lean();
};

/**
 * Get all artifact configurations for a user.
 *
 * @param {string} userId - The ID of the user.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned documents.
 * @returns {Promise<IArtifactConfig[]>} An array of artifact configuration documents.
 */
const getUserArtifactConfigs = async function (userId, fieldsToSelect = null) {
  const query = ArtifactConfig.find({ userId });

  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
};

/**
 * Delete all artifact configurations for a user.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{deletedCount: number}>} The result of the delete operation.
 */
const deleteUserArtifactConfigs = async function (userId) {
  return await ArtifactConfig.deleteMany({ userId });
};

/**
 * Update the Supabase configuration for an artifact.
 *
 * @param {string} artifactId - The ID of the artifact.
 * @param {string} userId - The ID of the user.
 * @param {Object} supabaseConfig - The Supabase configuration data.
 * @returns {Promise<IArtifactConfig>} The updated artifact configuration document.
 */
const updateSupabaseConfig = async function (artifactId, userId, supabaseConfig) {
  const query = { artifactId, userId };
  const update = {
    $set: {
      supabaseConfig: supabaseConfig,
      updatedAt: new Date(),
    },
    $setOnInsert: {
      artifactId,
      userId,
      createdAt: new Date(),
    },
  };
  const options = {
    new: true,
    upsert: true,
    lean: true,
  };

  return await ArtifactConfig.findOneAndUpdate(query, update, options);
};

/**
 * Get the Supabase configuration for an artifact.
 *
 * @param {string} artifactId - The ID of the artifact.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object|null>} The Supabase configuration object, or `null` if not found.
 */
const getSupabaseConfig = async function (artifactId, userId) {
  const config = await ArtifactConfig.findOne({ artifactId, userId })
    .select('supabaseConfig')
    .lean();
  return config?.supabaseConfig || null;
};

module.exports = {
  getArtifactConfig,
  saveArtifactConfig,
  deleteArtifactConfig,
  getUserArtifactConfigs,
  deleteUserArtifactConfigs,
  updateSupabaseConfig,
  getSupabaseConfig,
};
