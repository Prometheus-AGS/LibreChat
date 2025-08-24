#!/usr/bin/env node

/**
 * LibreChat Artifact Registry CLI
 *
 * A comprehensive command-line interface for managing artifacts in the LibreChat system.
 * Provides tools for developers to create, manage, and deploy artifacts efficiently.
 */

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const program = new Command();

// Configuration
const CONFIG_FILE = path.join(process.cwd(), '.artifact-registry.json');
const TEMPLATES_DIR = path.join(__dirname, '../templates/artifacts');

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  title: (msg) => console.log(chalk.bold.cyan(msg)),
};

// Load configuration
async function loadConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    return {
      apiUrl: 'http://localhost:3080',
      defaultAuthor: 'developer',
      templates: {},
      supabase: {
        url: '',
        anonKey: '',
      },
    };
  }
}

// Save configuration
async function saveConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// API client
class ArtifactAPI {
  constructor(config) {
    this.baseUrl = config.apiUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api/artifacts${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`?${query}`);
  }

  async get(id) {
    return this.request(`/${id}`);
  }

  async create(artifact) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(artifact),
    });
  }

  async update(id, updates) {
    return this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async delete(id) {
    return this.request(`/${id}`, {
      method: 'DELETE',
    });
  }

  async search(query, filters = {}) {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, ...filters }),
    });
  }

  async testConnection() {
    return this.request('/test-connection');
  }
}

// Template system
class TemplateManager {
  constructor() {
    this.templatesDir = TEMPLATES_DIR;
  }

  async ensureTemplatesDir() {
    try {
      await fs.access(this.templatesDir);
    } catch {
      await fs.mkdir(this.templatesDir, { recursive: true });
      await this.createDefaultTemplates();
    }
  }

  async createDefaultTemplates() {
    const templates = {
      'react-component': {
        name: 'React Component',
        description: 'A basic React functional component',
        files: {
          'component.tsx': `import React from 'react';

interface {{componentName}}Props {
  children?: React.ReactNode;
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={\`{{componentName.toLowerCase()}} \${className}\`}>
      {children}
    </div>
  );
};

export default {{componentName}};`,
          'component.test.tsx': `import React from 'react';
import { render, screen } from '@testing-library/react';
import { {{componentName}} } from './{{componentName}}';

describe('{{componentName}}', () => {
  it('should render children correctly', () => {
    render(
      <{{componentName}}>
        <span>Test content</span>
      </{{componentName}}>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <{{componentName}} className="custom-class">
        Test
      </{{componentName}}>
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});`,
          'component.stories.tsx': `import type { Meta, StoryObj } from '@storybook/react';
import { {{componentName}} } from './{{componentName}}';

const meta: Meta<typeof {{componentName}}> = {
  title: 'Components/{{componentName}}',
  component: {{componentName}},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default {{componentName}}',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: 'Styled {{componentName}}',
    className: 'bg-blue-100 p-4 rounded',
  },
};`,
        },
        prompts: [
          {
            type: 'input',
            name: 'componentName',
            message: 'Component name (PascalCase):',
            validate: (input) => /^[A-Z][a-zA-Z0-9]*$/.test(input) || 'Please use PascalCase',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Component description:',
            default: 'A reusable React component',
          },
          {
            type: 'checkbox',
            name: 'features',
            message: 'Select features to include:',
            choices: [
              { name: 'TypeScript interfaces', value: 'typescript', checked: true },
              { name: 'Unit tests', value: 'tests', checked: true },
              { name: 'Storybook stories', value: 'stories', checked: false },
              { name: 'CSS modules', value: 'css', checked: false },
            ],
          },
        ],
      },
      'utility-function': {
        name: 'Utility Function',
        description: 'A utility function with tests',
        files: {
          'utility.ts': `/**
 * {{description}}
 * 
 * @param {{{paramType}}} {{paramName}} - {{paramDescription}}
 * @returns {{{returnType}}} {{returnDescription}}
 */
export function {{functionName}}({{paramName}}: {{paramType}}): {{returnType}} {
  // TODO: Implement function logic
  return {{defaultReturn}};
}

export default {{functionName}};`,
          'utility.test.ts': `import { {{functionName}} } from './{{functionName}}';

describe('{{functionName}}', () => {
  it('should work correctly with valid input', () => {
    const result = {{functionName}}({{testInput}});
    expect(result).toBe({{expectedOutput}});
  });

  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  });
});`,
        },
        prompts: [
          {
            type: 'input',
            name: 'functionName',
            message: 'Function name (camelCase):',
            validate: (input) => /^[a-z][a-zA-Z0-9]*$/.test(input) || 'Please use camelCase',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Function description:',
            default: 'A utility function',
          },
          {
            type: 'input',
            name: 'paramName',
            message: 'Parameter name:',
            default: 'input',
          },
          {
            type: 'input',
            name: 'paramType',
            message: 'Parameter type:',
            default: 'string',
          },
          {
            type: 'input',
            name: 'returnType',
            message: 'Return type:',
            default: 'string',
          },
        ],
      },
    };

    for (const [templateName, template] of Object.entries(templates)) {
      const templatePath = path.join(this.templatesDir, `${templateName}.json`);
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
    }
  }

  async listTemplates() {
    await this.ensureTemplatesDir();
    const files = await fs.readdir(this.templatesDir);
    const templates = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const templatePath = path.join(this.templatesDir, file);
        const templateData = JSON.parse(await fs.readFile(templatePath, 'utf8'));
        templates.push({
          id: path.basename(file, '.json'),
          ...templateData,
        });
      }
    }

    return templates;
  }

  async getTemplate(templateId) {
    const templatePath = path.join(this.templatesDir, `${templateId}.json`);
    const templateData = JSON.parse(await fs.readFile(templatePath, 'utf8'));
    return { id: templateId, ...templateData };
  }

  async generateFromTemplate(templateId, answers, outputDir) {
    const template = await this.getTemplate(templateId);
    const generatedFiles = {};

    for (const [fileName, content] of Object.entries(template.files)) {
      let processedContent = content;
      let processedFileName = fileName;

      // Replace template variables
      for (const [key, value] of Object.entries(answers)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const lowerRegex = new RegExp(`{{${key}\\.toLowerCase\\(\\)}}`, 'g');
        const upperRegex = new RegExp(`{{${key}\\.toUpperCase\\(\\)}}`, 'g');

        processedContent = processedContent.replace(regex, value);
        processedContent = processedContent.replace(lowerRegex, value.toLowerCase());
        processedContent = processedContent.replace(upperRegex, value.toUpperCase());

        processedFileName = processedFileName.replace(regex, value);
      }

      const filePath = path.join(outputDir, processedFileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, processedContent);

      generatedFiles[processedFileName] = filePath;
    }

    return generatedFiles;
  }
}

// Commands

// Initialize command
program
  .command('init')
  .description('Initialize artifact registry configuration')
  .option('-f, --force', 'Force overwrite existing configuration')
  .action(async (options) => {
    log.title('🚀 Initializing Artifact Registry CLI');

    try {
      const existingConfig = await loadConfig();

      if (!options.force && existingConfig.apiUrl !== 'http://localhost:3080') {
        log.warning('Configuration already exists. Use --force to overwrite.');
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiUrl',
          message: 'API URL:',
          default: existingConfig.apiUrl,
        },
        {
          type: 'input',
          name: 'defaultAuthor',
          message: 'Default author name:',
          default: existingConfig.defaultAuthor,
        },
        {
          type: 'input',
          name: 'supabaseUrl',
          message: 'Supabase URL (optional):',
          default: existingConfig.supabase?.url || '',
        },
        {
          type: 'password',
          name: 'supabaseKey',
          message: 'Supabase anon key (optional):',
          default: existingConfig.supabase?.anonKey || '',
        },
      ]);

      const config = {
        ...existingConfig,
        apiUrl: answers.apiUrl,
        defaultAuthor: answers.defaultAuthor,
        supabase: {
          url: answers.supabaseUrl,
          anonKey: answers.supabaseKey,
        },
      };

      await saveConfig(config);
      log.success('Configuration saved successfully!');

      // Test connection
      const spinner = ora('Testing API connection...').start();
      try {
        const api = new ArtifactAPI(config);
        await api.testConnection();
        spinner.succeed('API connection successful!');
      } catch (error) {
        spinner.fail(`API connection failed: ${error.message}`);
      }
    } catch (error) {
      log.error(`Initialization failed: ${error.message}`);
      process.exit(1);
    }
  });

// List artifacts command
program
  .command('list')
  .alias('ls')
  .description('List artifacts in the registry')
  .option('-c, --category <category>', 'Filter by category')
  .option('-a, --author <author>', 'Filter by author')
  .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
  .option('-l, --limit <limit>', 'Limit number of results', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const api = new ArtifactAPI(config);

      const params = {
        limit: options.limit,
      };

      if (options.category) params.category = options.category;
      if (options.author) params.author = options.author;
      if (options.tags) params.tags = options.tags;

      const spinner = ora('Fetching artifacts...').start();
      const response = await api.list(params);
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(response.data, null, 2));
        return;
      }

      log.title(`📦 Found ${response.data.total} artifacts`);
      console.log();

      response.data.artifacts.forEach((artifact) => {
        console.log(chalk.bold(artifact.name) + chalk.gray(` (${artifact.id})`));
        console.log(`  ${artifact.description || 'No description'}`);
        console.log(
          `  Author: ${chalk.cyan(artifact.author)} | Version: ${chalk.green(artifact.version)}`,
        );
        if (artifact.tags?.length) {
          console.log(`  Tags: ${artifact.tags.map((tag) => chalk.yellow(tag)).join(', ')}`);
        }
        console.log();
      });
    } catch (error) {
      log.error(`Failed to list artifacts: ${error.message}`);
      process.exit(1);
    }
  });

// Create artifact command
program
  .command('create')
  .description('Create a new artifact')
  .option('-t, --template <template>', 'Use a template')
  .option('-n, --name <name>', 'Artifact name')
  .option('-d, --description <description>', 'Artifact description')
  .option('-o, --output <dir>', 'Output directory', './artifacts')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const templateManager = new TemplateManager();

      let templateId = options.template;
      let artifactName = options.name;
      let description = options.description;

      // Select template if not provided
      if (!templateId) {
        const templates = await templateManager.listTemplates();

        if (templates.length === 0) {
          log.warning('No templates found. Creating default templates...');
          await templateManager.createDefaultTemplates();
          const newTemplates = await templateManager.listTemplates();
          templates.push(...newTemplates);
        }

        const { selectedTemplate } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedTemplate',
            message: 'Select a template:',
            choices: templates.map((t) => ({
              name: `${t.name} - ${t.description}`,
              value: t.id,
            })),
          },
        ]);

        templateId = selectedTemplate;
      }

      const template = await templateManager.getTemplate(templateId);

      // Collect template-specific answers
      const templateAnswers = await inquirer.prompt(template.prompts || []);

      // Collect general artifact info
      if (!artifactName) {
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Artifact name:',
            default: templateAnswers.componentName || templateAnswers.functionName || 'MyArtifact',
          },
        ]);
        artifactName = name;
      }

      if (!description) {
        const { desc } = await inquirer.prompt([
          {
            type: 'input',
            name: 'desc',
            message: 'Artifact description:',
            default: templateAnswers.description || template.description,
          },
        ]);
        description = desc;
      }

      // Generate files
      const outputDir = path.resolve(options.output, artifactName);
      const spinner = ora('Generating artifact files...').start();

      const generatedFiles = await templateManager.generateFromTemplate(
        templateId,
        { ...templateAnswers, artifactName, description },
        outputDir,
      );

      spinner.succeed('Artifact files generated successfully!');

      log.success(`Created artifact "${artifactName}" in ${outputDir}`);
      log.info('Generated files:');
      Object.entries(generatedFiles).forEach(([fileName, filePath]) => {
        console.log(`  ${chalk.green('✓')} ${fileName}`);
      });

      // Ask if user wants to publish to registry
      const { shouldPublish } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldPublish',
          message: 'Would you like to publish this artifact to the registry?',
          default: false,
        },
      ]);

      if (shouldPublish) {
        // Read main file content
        const mainFile = Object.values(generatedFiles)[0];
        const code = await fs.readFile(mainFile, 'utf8');

        const artifact = {
          name: artifactName,
          description,
          category: template.category || 'component',
          tags: template.tags || ['generated'],
          version: '1.0.0',
          author: config.defaultAuthor,
          code,
          language: path.extname(mainFile).slice(1),
          framework: 'react',
          isPublic: true,
          dependencies: [],
        };

        const publishSpinner = ora('Publishing to registry...').start();
        try {
          const api = new ArtifactAPI(config);
          const result = await api.create(artifact);
          publishSpinner.succeed(`Published to registry with ID: ${result.data.id}`);
        } catch (error) {
          publishSpinner.fail(`Failed to publish: ${error.message}`);
        }
      }
    } catch (error) {
      log.error(`Failed to create artifact: ${error.message}`);
      process.exit(1);
    }
  });

// Search command
program
  .command('search <query>')
  .description('Search artifacts in the registry')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
  .option('-l, --limit <limit>', 'Limit number of results', '10')
  .option('--json', 'Output as JSON')
  .action(async (query, options) => {
    try {
      const config = await loadConfig();
      const api = new ArtifactAPI(config);

      const filters = {
        limit: parseInt(options.limit),
      };

      if (options.category) filters.category = options.category;
      if (options.tags) filters.tags = options.tags.split(',');

      const spinner = ora(`Searching for "${query}"...`).start();
      const response = await api.search(query, filters);
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(response.data, null, 2));
        return;
      }

      log.title(`🔍 Found ${response.data.total} results for "${query}"`);
      console.log();

      response.data.artifacts.forEach((artifact, index) => {
        console.log(`${index + 1}. ${chalk.bold(artifact.name)} ${chalk.gray(`(${artifact.id})`)}`);
        console.log(`   ${artifact.description || 'No description'}`);
        console.log(
          `   ${chalk.cyan(artifact.author)} • ${chalk.green(artifact.version)} • ${chalk.yellow(artifact.category)}`,
        );
        if (artifact.tags?.length) {
          console.log(`   Tags: ${artifact.tags.map((tag) => chalk.yellow(tag)).join(', ')}`);
        }
        console.log();
      });
    } catch (error) {
      log.error(`Search failed: ${error.message}`);
      process.exit(1);
    }
  });

// Get artifact details command
program
  .command('get <id>')
  .description('Get detailed information about an artifact')
  .option('--code', 'Show artifact code')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    try {
      const config = await loadConfig();
      const api = new ArtifactAPI(config);

      const spinner = ora('Fetching artifact details...').start();
      const response = await api.get(id);
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(response.data, null, 2));
        return;
      }

      const artifact = response.data;

      log.title(`📦 ${artifact.name}`);
      console.log();
      console.log(`ID: ${chalk.gray(artifact.id)}`);
      console.log(`Description: ${artifact.description || 'No description'}`);
      console.log(`Author: ${chalk.cyan(artifact.author)}`);
      console.log(`Version: ${chalk.green(artifact.version)}`);
      console.log(`Category: ${chalk.yellow(artifact.category)}`);
      console.log(`Language: ${chalk.blue(artifact.language)}`);
      console.log(`Framework: ${chalk.blue(artifact.framework)}`);
      console.log(`Public: ${artifact.isPublic ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`Created: ${new Date(artifact.createdAt).toLocaleDateString()}`);
      console.log(`Updated: ${new Date(artifact.updatedAt).toLocaleDateString()}`);

      if (artifact.tags?.length) {
        console.log(`Tags: ${artifact.tags.map((tag) => chalk.yellow(tag)).join(', ')}`);
      }

      if (artifact.dependencies?.length) {
        console.log('\nDependencies:');
        artifact.dependencies.forEach((dep) => {
          console.log(`  - ${dep.name}@${dep.version}`);
        });
      }

      if (options.code && artifact.code) {
        console.log('\n' + chalk.bold('Code:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(artifact.code);
        console.log(chalk.gray('─'.repeat(50)));
      }
    } catch (error) {
      log.error(`Failed to get artifact: ${error.message}`);
      process.exit(1);
    }
  });

// Delete artifact command
program
  .command('delete <id>')
  .description('Delete an artifact from the registry')
  .option('-f, --force', 'Skip confirmation prompt')
  .action(async (id, options) => {
    try {
      const config = await loadConfig();
      const api = new ArtifactAPI(config);

      // Get artifact details first
      const response = await api.get(id);
      const artifact = response.data;

      if (!options.force) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `Are you sure you want to delete "${artifact.name}" (${id})?`,
            default: false,
          },
        ]);

        if (!confirmed) {
          log.info('Deletion cancelled.');
          return;
        }
      }

      const spinner = ora('Deleting artifact...').start();
      await api.delete(id);
      spinner.succeed(`Deleted artifact "${artifact.name}"`);
    } catch (error) {
      log.error(`Failed to delete artifact: ${error.message}`);
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description('Manage artifact templates')
  .option('-l, --list', 'List available templates')
  .option('-c, --create <name>', 'Create a new template')
  .action(async (options) => {
    try {
      const templateManager = new TemplateManager();

      if (options.list) {
        const templates = await templateManager.listTemplates();

        log.title('📋 Available Templates');
        console.log();

        if (templates.length === 0) {
          log.info('No templates found. Run with --create to add templates.');
          return;
        }

        templates.forEach((template) => {
          console.log(`${chalk.bold(template.name)} ${chalk.gray(`(${template.id})`)}`);
          console.log(`  ${template.description}`);
          console.log();
        });
        return;
      }

      if (options.create) {
        log.info('Template creation wizard coming soon!');
        return;
      }

      // Default: list templates
      const templates = await templateManager.listTemplates();

      log.title('📋 Available Templates');
      console.log();

      templates.forEach((template) => {
        console.log(`${chalk.bold(template.name)} ${chalk.gray(`(${template.id})`)}`);
        console.log(`  ${template.description}`);
        console.log();
      });
    } catch (error) {
      log.error(`Template operation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show registry status and configuration')
  .action(async () => {
    try {
      const config = await loadConfig();

      log.title('📊 Artifact Registry Status');
      console.log();

      console.log(`API URL: ${chalk.cyan(config.apiUrl)}`);
      console.log(`Default Author: ${chalk.cyan(config.defaultAuthor)}`);

      if (config.supabase?.url) {
        console.log(`Supabase URL: ${chalk.cyan(config.supabase.url)}`);
        console.log(
          `Supabase Key: ${config.supabase.anonKey ? chalk.green('Configured') : chalk.red('Not configured')}`,
        );
      }

      console.log();

      // Test API connection
      const spinner = ora('Testing API connection...').start();
      try {
        const api = new ArtifactAPI(config);
        const connectionResult = await api.testConnection();
        spinner.succeed('API connection successful');

        if (connectionResult.data) {
          console.log(`Server latency: ${connectionResult.data.latency}ms`);
          console.log(
            `Server timestamp: ${new Date(connectionResult.data.timestamp).toLocaleString()}`,
          );
        }
      } catch (error) {
        spinner.fail(`API connection failed: ${error.message}`);
      }

      // Get registry stats
      try {
        const api = new ArtifactAPI(config);
        const statsResponse = await api.list({ limit: 1 });
        console.log(`Total artifacts: ${chalk.green(statsResponse.data.total)}`);
      } catch (error) {
        console.log(`Total artifacts: ${chalk.red('Unable to fetch')}`);
      }
    } catch (error) {
      log.error(`Failed to get status: ${error.message}`);
      process.exit(1);
    }
  });

// Program configuration
program.name('artifact-cli').description('LibreChat Artifact Registry CLI').version('1.0.0');

// Parse command line arguments
program.parse();
