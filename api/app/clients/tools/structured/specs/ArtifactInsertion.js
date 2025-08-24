const { z } = require('zod');
const { StructuredTool } = require('langchain/tools');
const { logger } = require('~/config');

/**
 * Component Registry for Natural Language Recognition
 * This registry maps natural language terms to component IDs for intelligent matching
 */
const COMPONENT_REGISTRY = {
  // User-related components
  'user-card': {
    id: 'user-card',
    name: 'User Card',
    description: 'A reusable user profile card component',
    keywords: ['user', 'profile', 'card', 'avatar', 'person', 'member', 'account'],
    category: 'display',
    tags: ['user', 'profile', 'card'],
    examples: ['user card', 'profile card', 'user profile', 'member card'],
  },
  'data-table': {
    id: 'data-table',
    name: 'Data Table',
    description: 'Advanced data table with sorting, filtering, and pagination',
    keywords: ['table', 'data', 'list', 'grid', 'rows', 'columns', 'sort', 'filter', 'pagination'],
    category: 'data-display',
    tags: ['table', 'data', 'sorting', 'pagination'],
    examples: ['data table', 'table', 'user table', 'data grid', 'list view'],
  },
  'dashboard-stats': {
    id: 'dashboard-stats',
    name: 'Dashboard Statistics',
    description: 'Statistics cards for dashboard displays',
    keywords: ['stats', 'statistics', 'metrics', 'dashboard', 'cards', 'numbers', 'analytics'],
    category: 'display',
    tags: ['dashboard', 'stats', 'metrics'],
    examples: ['stats', 'statistics', 'dashboard stats', 'metrics cards', 'analytics'],
  },
  'navigation-menu': {
    id: 'navigation-menu',
    name: 'Navigation Menu',
    description: 'Dynamic navigation menu with Supabase integration',
    keywords: ['nav', 'navigation', 'menu', 'sidebar', 'links', 'routing'],
    category: 'navigation',
    tags: ['navigation', 'menu', 'sidebar'],
    examples: ['navigation', 'nav menu', 'sidebar', 'menu'],
  },
};

/**
 * Intelligent component matching using fuzzy search and semantic similarity
 */
function findBestComponentMatch(userRequest) {
  const request = userRequest.toLowerCase();
  const matches = [];

  for (const [componentId, component] of Object.entries(COMPONENT_REGISTRY)) {
    let score = 0;

    // Exact keyword matches (highest priority)
    for (const keyword of component.keywords) {
      if (request.includes(keyword)) {
        score += 10;
      }
    }

    // Example phrase matches
    for (const example of component.examples) {
      if (request.includes(example)) {
        score += 15;
      }
    }

    // Component name matches
    if (request.includes(component.name.toLowerCase())) {
      score += 20;
    }

    // Component ID matches
    if (request.includes(componentId)) {
      score += 25;
    }

    // Category matches
    if (request.includes(component.category)) {
      score += 5;
    }

    // Tag matches
    for (const tag of component.tags) {
      if (request.includes(tag)) {
        score += 8;
      }
    }

    if (score > 0) {
      matches.push({
        component,
        score,
        confidence: Math.min(score / 25, 1), // Normalize to 0-1
      });
    }
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Parse position/location from user request
 */
function parseInsertionPosition(userRequest) {
  const request = userRequest.toLowerCase();

  // Position keywords
  const positions = {
    top: ['top', 'beginning', 'start', 'first', 'above'],
    bottom: ['bottom', 'end', 'last', 'below', 'after'],
    before: ['before', 'above', 'prior to'],
    after: ['after', 'below', 'following', 'under', 'underneath'],
  };

  // Element references
  const elements = {
    header: ['header', 'title', 'heading', 'h1', 'h2', 'h3'],
    footer: ['footer', 'bottom'],
    sidebar: ['sidebar', 'side panel', 'navigation'],
    content: ['content', 'main', 'body'],
    form: ['form', 'input', 'fields'],
  };

  let position = 'bottom'; // default
  let relativeTo = null;

  // Find position keywords
  for (const [pos, keywords] of Object.entries(positions)) {
    if (keywords.some((keyword) => request.includes(keyword))) {
      position = pos;
      break;
    }
  }

  // Find element references
  for (const [element, keywords] of Object.entries(elements)) {
    if (keywords.some((keyword) => request.includes(keyword))) {
      relativeTo = element;
      break;
    }
  }

  return { position, relativeTo };
}

/**
 * Generate container insertion code
 */
function generateContainerCode(componentId, position, relativeTo, props = {}) {
  const propsString =
    Object.keys(props).length > 0
      ? ` ${Object.entries(props)
          .map(
            ([key, value]) =>
              `${key}={${typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}}`,
          )
          .join(' ')}`
      : '';

  const containerCode = `<ArtifactContainer componentId="${componentId}"${propsString} />`;

  // Generate insertion instructions
  let instructions = '';
  if (relativeTo) {
    switch (position) {
      case 'before':
        instructions = `Insert ${containerCode} before the ${relativeTo} element`;
        break;
      case 'after':
        instructions = `Insert ${containerCode} after the ${relativeTo} element`;
        break;
      case 'top':
        instructions = `Insert ${containerCode} at the top of the ${relativeTo} section`;
        break;
      case 'bottom':
        instructions = `Insert ${containerCode} at the bottom of the ${relativeTo} section`;
        break;
      default:
        instructions = `Insert ${containerCode} near the ${relativeTo}`;
    }
  } else {
    instructions = `Insert ${containerCode} at the ${position} of the component`;
  }

  return {
    code: containerCode,
    instructions,
    position,
    relativeTo,
  };
}

/**
 * Artifact Insertion Tool
 *
 * This tool enables LLMs to insert ArtifactContainer components based on natural language requests.
 * It provides intelligent component matching and positioning for seamless artifact composition.
 */
class ArtifactInsertionTool extends StructuredTool {
  constructor() {
    super();
    this.name = 'artifact_insertion';
    this.description = `Insert artifact components into views based on natural language requests. 
    This tool can understand requests like "put the user card under the header" or "add a data table to the main content".
    It intelligently matches component names to registry entries and determines optimal positioning.`;

    this.schema = z.object({
      userRequest: z
        .string()
        .describe("The user's natural language request for component insertion"),
      explicitComponentId: z
        .string()
        .optional()
        .describe('Explicit component ID if specified by user'),
      containerProps: z
        .record(z.any())
        .optional()
        .describe('Props to pass to the ArtifactContainer'),
      supabaseConfig: z
        .object({
          url: z.string(),
          anonKey: z.string(),
          tables: z.array(z.string()).optional(),
          functions: z.array(z.string()).optional(),
        })
        .optional()
        .describe('Supabase configuration for data-driven components'),
    });
  }

  async _call({ userRequest, explicitComponentId, containerProps = {}, supabaseConfig }) {
    try {
      logger.info('Processing artifact insertion request:', { userRequest, explicitComponentId });

      let componentId = explicitComponentId;
      let matchConfidence = 1.0;

      // If no explicit component ID, use intelligent matching
      if (!componentId) {
        const match = findBestComponentMatch(userRequest);

        if (!match) {
          return {
            success: false,
            error: 'No suitable component found for the request',
            suggestion:
              'Try being more specific about the component type (e.g., "user card", "data table", "navigation menu")',
            availableComponents: Object.keys(COMPONENT_REGISTRY),
          };
        }

        componentId = match.component.id;
        matchConfidence = match.confidence;

        // Low confidence warning
        if (matchConfidence < 0.5) {
          logger.warn('Low confidence component match:', {
            userRequest,
            matchedComponent: componentId,
            confidence: matchConfidence,
          });
        }
      }

      // Parse insertion position
      const { position, relativeTo } = parseInsertionPosition(userRequest);

      // Add Supabase config to props if provided
      if (supabaseConfig) {
        containerProps.supabaseConfig = supabaseConfig;
      }

      // Generate container code and instructions
      const result = generateContainerCode(componentId, position, relativeTo, containerProps);

      // Get component metadata for context
      const componentMetadata = COMPONENT_REGISTRY[componentId];

      return {
        success: true,
        componentId,
        componentName: componentMetadata?.name || componentId,
        componentDescription: componentMetadata?.description || 'Component from registry',
        matchConfidence,
        insertionCode: result.code,
        insertionInstructions: result.instructions,
        position: result.position,
        relativeTo: result.relativeTo,
        containerProps,
        metadata: {
          userRequest,
          parsedPosition: position,
          parsedRelativeTo: relativeTo,
          availableProps: [
            'componentId (required)',
            'version (optional, defaults to "latest")',
            'componentProps (optional, props for the loaded component)',
            'supabaseConfig (optional, for data-driven components)',
            'className (optional, styling)',
            'showPlaceholder (optional, show loading state)',
            'enableRetry (optional, enable error recovery)',
            'title (optional, placeholder title)',
            'description (optional, placeholder description)',
          ],
        },
        examples: [
          'Put the user card at the top',
          'Add a data table under the header',
          'Insert navigation menu in the sidebar',
          'Place dashboard stats after the title',
        ],
      };
    } catch (error) {
      logger.error('Error in artifact insertion tool:', error);
      return {
        success: false,
        error: error.message,
        userRequest,
      };
    }
  }
}

module.exports = { ArtifactInsertionTool };
