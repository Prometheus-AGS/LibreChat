const { logger } = require('@librechat/data-schemas');
const { AuthType } = require('librechat-data-provider');
const getCustomConfig = require('./getCustomConfig');

const { ConfigActionTool } = require('../../../app/clients/tools/structured/ConfigAction.js');

/**
 * Converts OpenAPI specification to LibreChat tool format
 * @param {string} actionName - Name of the action
 * @param {Object} actionConfig - Action configuration from librechat.yaml
 * @returns {Object} Tool in LibreChat format
 */
function convertActionToTool(actionName, actionConfig) {
  const { name, description, openapi, authentication } = actionConfig;

  if (!openapi || !openapi.paths) {
    logger.warn(`[loadConfigActions] Action ${actionName} missing OpenAPI specification`);
    return null;
  }

  // Create a tool for each operation in the OpenAPI spec
  const tools = {};

  Object.entries(openapi.paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (!operation.operationId) {
        logger.warn(
          `[loadConfigActions] Operation ${method.toUpperCase()} ${path} missing operationId`,
        );
        return;
      }

      const toolName = `${actionName}_${operation.operationId}`;

      // Convert OpenAPI parameters to function parameters
      const parameters = {
        type: 'object',
        properties: {},
        required: [],
      };

      // Add path parameters
      if (operation.parameters) {
        operation.parameters.forEach((param) => {
          if (param.in === 'path' || param.in === 'query') {
            parameters.properties[param.name] = {
              type: param.schema?.type || 'string',
              description: param.description || '',
            };
            if (param.required) {
              parameters.required.push(param.name);
            }
          }
        });
      }

      // Add request body parameters
      if (operation.requestBody?.content?.['application/json']?.schema) {
        const schema = operation.requestBody.content['application/json'].schema;
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([propName, propSchema]) => {
            parameters.properties[propName] = {
              type: propSchema.type || 'string',
              description: propSchema.description || '',
            };
          });
          if (schema.required) {
            parameters.required.push(...schema.required);
          }
        }
      }

      // Create metadata for the tool
      const toolMeta = {
        actionName,
        method: method.toUpperCase(),
        path,
        operationId: operation.operationId,
        baseUrl: openapi.servers?.[0]?.url || '',
        authentication: authentication || {},
      };

      // Create the executable tool using ConfigActionTool
      const configTool = new ConfigActionTool(toolName, toolMeta);
      const executableTool = configTool.getTool();

      // Create the tool definition in LibreChat format
      tools[toolName] = {
        type: 'function',
        function: {
          name: toolName,
          description:
            operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
          parameters: parameters,
        },
        // Store the executable function and metadata
        _librechat_meta: toolMeta,
        plugin: executableTool,
      };
    });
  });

  return tools;
}

/**
 * Loads predefined actions from configuration and converts them to tools
 * @returns {Promise<Object>} Tools object with all config actions
 */
async function loadConfigActions() {
  try {
    const config = await getCustomConfig();

    if (!config?.actions) {
      logger.debug('[loadConfigActions] No actions found in configuration');
      return {};
    }

    const configTools = {};

    Object.entries(config.actions).forEach(([actionName, actionConfig]) => {
      // Skip non-action entries like allowedDomains
      if (
        actionName === 'allowedDomains' ||
        typeof actionConfig !== 'object' ||
        !actionConfig.openapi
      ) {
        return;
      }

      try {
        const tools = convertActionToTool(actionName, actionConfig);
        if (tools) {
          Object.assign(configTools, tools);
          logger.info(
            `[loadConfigActions] Loaded action: ${actionName} with ${Object.keys(tools).length} operations`,
          );
          // Log the tool names for debugging
          Object.keys(tools).forEach((toolName) => {
            logger.info(`[loadConfigActions] - Tool: ${toolName}`);
          });
        }
      } catch (error) {
        logger.error(`[loadConfigActions] Error converting action ${actionName}:`, error);
      }
    });

    logger.info(
      `[loadConfigActions] Loaded ${Object.keys(configTools).length} tools from configuration actions`,
    );
    return configTools;
  } catch (error) {
    logger.error('[loadConfigActions] Error loading config actions:', error);
    return {};
  }
}

module.exports = {
  loadConfigActions,
  convertActionToTool,
};
