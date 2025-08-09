const axios = require('axios');
const { logger } = require('@librechat/data-schemas');
const { getDjangoToken } = require('../util/handleTools');

/**
 * Generic tool executor for configuration-based actions
 * @param {Object} params - Tool parameters
 * @param {Object} toolMeta - Tool metadata from _librechat_meta
 * @param {Object} options - Additional options including user context
 * @returns {Promise<string>} Tool execution result
 */
async function executeConfigAction(params, toolMeta, options = {}) {
  try {
    const { method, path, baseUrl, authentication, actionName } = toolMeta;
    const { user } = options;

    // Build the full URL
    let url = baseUrl;
    if (!url.endsWith('/')) {
      url += '/';
    }
    url += path.startsWith('/') ? path.slice(1) : path;

    // Replace path parameters
    let finalUrl = url;
    const pathParams = {};
    Object.entries(params).forEach(([key, value]) => {
      const pathParam = `{${key}}`;
      if (finalUrl.includes(pathParam)) {
        finalUrl = finalUrl.replace(pathParam, encodeURIComponent(value));
        pathParams[key] = value;
      }
    });

    // Prepare request configuration
    const config = {
      method: method.toLowerCase(),
      url: finalUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Handle authentication
    if (authentication?.type === 'django_token') {
      try {
        const token = await getDjangoToken(actionName, user);
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
      } catch (authError) {
        logger.error(`[ConfigAction] Authentication failed for ${actionName}:`, authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
    }

    // Prepare request body and query parameters
    const bodyParams = {};
    const queryParams = {};

    Object.entries(params).forEach(([key, value]) => {
      // Skip path parameters
      if (!pathParams[key]) {
        if (method.toUpperCase() === 'GET') {
          queryParams[key] = value;
        } else {
          bodyParams[key] = value;
        }
      }
    });

    // Add query parameters
    if (Object.keys(queryParams).length > 0) {
      config.params = queryParams;
    }

    // Add request body for non-GET requests
    if (method.toUpperCase() !== 'GET' && Object.keys(bodyParams).length > 0) {
      config.data = bodyParams;
    }

    logger.info(`[ConfigAction] Executing ${method.toUpperCase()} ${finalUrl}`);

    // Execute the request
    const response = await axios(config);

    // Format the response
    let result;
    if (typeof response.data === 'object') {
      result = JSON.stringify(response.data, null, 2);
    } else {
      result = String(response.data);
    }

    logger.info(`[ConfigAction] Request successful for ${actionName}`);
    return result;
  } catch (error) {
    logger.error(`[ConfigAction] Error executing ${toolMeta.actionName}:`, error);

    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const statusText = error.response.statusText;
      const errorData = error.response.data;

      let errorMessage = `HTTP ${status} ${statusText}`;
      if (errorData) {
        if (typeof errorData === 'object') {
          errorMessage += `\n${JSON.stringify(errorData, null, 2)}`;
        } else {
          errorMessage += `\n${errorData}`;
        }
      }

      throw new Error(errorMessage);
    } else if (error.request) {
      // Network error
      throw new Error(`Network error: Unable to reach ${toolMeta.baseUrl}`);
    } else {
      // Other error
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * Dynamic tool factory for configuration-based actions
 * Creates tool functions based on OpenAPI specifications
 */
class ConfigActionTool {
  constructor(toolName, toolMeta) {
    this.name = toolName;
    this.meta = toolMeta;

    // Create the tool function
    this.tool = async (params, options) => {
      return executeConfigAction(params, this.meta, options);
    };

    // Add metadata to the tool function
    this.tool._librechat_meta = this.meta;
    this.tool.name = toolName;
  }

  /**
   * Get the tool function
   * @returns {Function} The executable tool function
   */
  getTool() {
    return this.tool;
  }
}

module.exports = {
  executeConfigAction,
  ConfigActionTool,
};
