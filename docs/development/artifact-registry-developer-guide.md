# Artifact Registry Developer Guide

This comprehensive guide provides everything developers need to know about working with the LibreChat Artifact Registry system.

## Table of Contents

1. [Quick Start](#quick-start)
2. [CLI Tools](#cli-tools)
3. [Development Workflow](#development-workflow)
4. [API Reference](#api-reference)
5. [Component Development](#component-development)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- LibreChat development environment
- Optional: Supabase account for enhanced features

### Installation

```bash
# Install dependencies
npm install

# Initialize artifact registry CLI
npx artifact-cli init

# Create your first artifact
npx artifact-cli create --template react-component
```

### Basic Usage

```bash
# List all artifacts
npx artifact-cli list

# Search for artifacts
npx artifact-cli search "button component"

# Get artifact details
npx artifact-cli get <artifact-id>

# Validate artifact code
node scripts/dev-tools/artifact-validator.js ./my-component.tsx
```

## CLI Tools

### Artifact CLI (`artifact-cli`)

The main command-line interface for managing artifacts.

#### Commands

```bash
# Initialize configuration
artifact-cli init [--force]

# List artifacts
artifact-cli list [options]
  -c, --category <category>    Filter by category
  -a, --author <author>        Filter by author
  -t, --tags <tags>           Filter by tags (comma-separated)
  -l, --limit <limit>         Limit results (default: 20)
  --json                      Output as JSON

# Create new artifact
artifact-cli create [options]
  -t, --template <template>   Use template
  -n, --name <name>          Artifact name
  -d, --description <desc>   Description
  -o, --output <dir>         Output directory

# Search artifacts
artifact-cli search <query> [options]
  -c, --category <category>   Filter by category
  -t, --tags <tags>          Filter by tags
  -l, --limit <limit>        Limit results

# Get artifact details
artifact-cli get <id> [options]
  --code                     Show artifact code
  --json                     Output as JSON

# Delete artifact
artifact-cli delete <id> [--force]

# Manage templates
artifact-cli templates [options]
  -l, --list                 List templates
  -c, --create <name>        Create template

# Show status
artifact-cli status
```

#### Configuration

The CLI stores configuration in `.artifact-registry.json`:

```json
{
  "apiUrl": "http://localhost:3080",
  "defaultAuthor": "developer",
  "templates": {},
  "supabase": {
    "url": "https://your-project.supabase.co",
    "anonKey": "your-anon-key"
  }
}
```

### Artifact Validator

Validates artifact code for security, performance, and best practices.

```bash
# Validate a single file
node scripts/dev-tools/artifact-validator.js ./component.tsx

# The validator checks for:
# - Security vulnerabilities (XSS, eval, etc.)
# - Performance issues (unnecessary re-renders, etc.)
# - Best practices (proper naming, exports, etc.)
# - ESLint compliance
# - TypeScript usage
```

## Development Workflow

### 1. Create Artifact Template

```bash
# Use built-in template
artifact-cli create --template react-component --name MyButton

# Or create from scratch
mkdir my-artifact
cd my-artifact
```

### 2. Develop Component

```typescript
// MyButton.tsx
import React from 'react';

interface MyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const MyButton: React.FC<MyButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${disabled ? 'btn-disabled' : ''}`}
    >
      {children}
    </button>
  );
};

export default MyButton;
```

### 3. Add Tests

```typescript
// MyButton.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyButton } from './MyButton';

describe('MyButton', () => {
  it('renders children correctly', () => {
    render(<MyButton>Click me</MyButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<MyButton onClick={handleClick}>Click me</MyButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    const { container } = render(
      <MyButton variant="secondary">Button</MyButton>
    );
    
    expect(container.firstChild).toHaveClass('btn-secondary');
  });

  it('handles disabled state', () => {
    render(<MyButton disabled>Disabled</MyButton>);
    
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn-disabled');
  });
});
```

### 4. Validate Code

```bash
# Run validator
node scripts/dev-tools/artifact-validator.js ./MyButton.tsx

# Fix any issues reported
# Re-run until validation passes
```

### 5. Test Component

```bash
# Run unit tests
npm run test:client -- MyButton.test.tsx

# Run in Storybook (if configured)
npm run storybook
```

### 6. Publish to Registry

```bash
# Publish via CLI
artifact-cli create --name "My Button" --description "A reusable button component"

# Or publish via UI
# 1. Generate artifact in chat
# 2. Click save button
# 3. Fill out metadata form
# 4. Submit
```

## API Reference

### REST Endpoints

#### Get Artifacts

```http
GET /api/artifacts?page=1&limit=20&category=ui-component&tags=react,button
```

Response:
```json
{
  "success": true,
  "data": {
    "artifacts": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

#### Get Artifact by ID

```http
GET /api/artifacts/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "artifact-123",
    "name": "Button Component",
    "description": "A reusable button",
    "code": "...",
    "metadata": {...}
  }
}
```

#### Create Artifact

```http
POST /api/artifacts
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Component",
  "description": "Component description",
  "code": "React component code",
  "category": "ui-component",
  "tags": ["react", "button"],
  "version": "1.0.0",
  "language": "tsx",
  "framework": "react"
}
```

#### Update Artifact

```http
PUT /api/artifacts/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Component",
  "description": "Updated description"
}
```

#### Delete Artifact

```http
DELETE /api/artifacts/:id
Authorization: Bearer <token>
```

#### Search Artifacts

```http
POST /api/artifacts/search
Content-Type: application/json

{
  "query": "button component",
  "category": "ui-component",
  "tags": ["react"],
  "limit": 10
}
```

#### Get Component Code (BFF)

```http
POST /api/artifacts/component
Content-Type: application/json

{
  "id": "artifact-123",
  "version": "latest",
  "includeDependencies": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "artifact": {...},
    "code": "compiled component code",
    "dependencies": [...],
    "resolvedVersion": "1.2.0"
  }
}
```

### Zustand Store API

```typescript
import { useArtifactRegistryStore } from '@/store/artifact-registry';

// Get store instance
const store = useArtifactRegistryStore();

// Registry operations
await store.loadArtifactRegistry();
const artifacts = await store.searchArtifacts('button', { category: 'ui-component' });

// Component management
const component = await store.fetchComponent('artifact-123');
store.cacheComponent('artifact-123@1.0.0', component);

// Focus management
store.setFocusedArtifact('artifact-123');
const canModify = store.canModifyArtifact('artifact-123');

// Composition
store.createComposedArtifact({
  id: 'composed-1',
  name: 'My Form',
  embeds: [
    { id: 'input-component', props: { placeholder: 'Name' } },
    { id: 'button-component', props: { variant: 'primary' } }
  ]
});

// Navigation
await store.loadDynamicNavigation(supabaseConfig);
const navItems = store.navigationItems;

// Error handling
store.clearErrors();
store.setError('registry', 'Failed to load artifacts');
```

## Component Development

### Best Practices

#### 1. Component Structure

```typescript
// Good component structure
import React from 'react';
import { ComponentProps } from './types';
import { useComponentLogic } from './hooks';
import './Component.css';

export const Component: React.FC<ComponentProps> = (props) => {
  const logic = useComponentLogic(props);
  
  return (
    <div className="component">
      {/* Component JSX */}
    </div>
  );
};

export default Component;
export type { ComponentProps };
```

#### 2. TypeScript Usage

```typescript
// Define clear interfaces
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

// Use proper return types
const Button: React.FC<ButtonProps> = ({ ... }) => {
  // Component implementation
};
```

#### 3. Accessibility

```typescript
// Include proper ARIA attributes
<button
  onClick={onClick}
  disabled={disabled}
  aria-label={ariaLabel}
  aria-describedby={ariaDescribedBy}
  role="button"
  tabIndex={disabled ? -1 : 0}
>
  {children}
</button>
```

#### 4. Performance

```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  // Expensive rendering logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  onItemClick(item.id);
}, [item.id, onItemClick]);
```

### Component Templates

#### React Component Template

```typescript
import React from 'react';

interface {{componentName}}Props {
  children?: React.ReactNode;
  className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`{{componentName.toLowerCase()}} ${className}`}>
      {children}
    </div>
  );
};

export default {{componentName}};
```

#### Hook Template

```typescript
import { useState, useEffect } from 'react';

interface Use{{hookName}}Options {
  // Hook options
}

interface Use{{hookName}}Return {
  // Return type
}

export function use{{hookName}}(options: Use{{hookName}}Options): Use{{hookName}}Return {
  // Hook implementation
  
  return {
    // Return values
  };
}
```

## Testing

### Unit Testing

```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component } from './Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Component onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle async operations', async () => {
    render(<Component />);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

```typescript
// Test complete workflows
describe('Artifact Save Workflow', () => {
  it('should save artifact successfully', async () => {
    // Setup
    const mockApi = setupMockApi();
    
    // Render component tree
    render(
      <TestProviders>
        <ArtifactSaveModal />
      </TestProviders>
    );
    
    // Fill form
    await user.type(screen.getByLabelText('Name'), 'Test Artifact');
    await user.type(screen.getByLabelText('Description'), 'Test description');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Save' }));
    
    // Verify
    await waitFor(() => {
      expect(mockApi.saveArtifact).toHaveBeenCalledWith({
        name: 'Test Artifact',
        description: 'Test description',
      });
    });
  });
});
```

### E2E Testing

```typescript
// Playwright E2E tests
test('complete artifact workflow', async ({ page }) => {
  // Navigate to chat
  await page.goto('/chat');
  
  // Generate artifact
  await page.fill('[data-testid="chat-input"]', 'Create a button component');
  await page.press('[data-testid="chat-input"]', 'Enter');
  
  // Wait for artifact
  await page.waitForSelector('[data-testid="artifact-preview"]');
  
  // Save artifact
  await page.click('[data-testid="artifact-save-button"]');
  await page.fill('[data-testid="artifact-name"]', 'My Button');
  await page.click('[data-testid="save-submit"]');
  
  // Verify success
  await expect(page.locator('[data-testid="success-message"]'))
    .toContainText('Artifact saved successfully');
});
```

## Deployment

### Production Build

```bash
# Build all packages
npm run build:data-provider
npm run build:data-schemas
npm run build:api
npm run build:client

# Or build everything
npm run build
```

### Environment Configuration

```bash
# .env
ARTIFACT_REGISTRY_ENABLED=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Optional: Custom artifact storage
ARTIFACT_STORAGE_PROVIDER=supabase
ARTIFACT_STORAGE_BUCKET=artifacts
```

### Docker Deployment

```dockerfile
# Dockerfile additions for artifact registry
COPY scripts/ /app/scripts/
COPY templates/ /app/templates/

# Install CLI dependencies
RUN npm install -g commander inquirer ora chalk

# Make CLI executable
RUN chmod +x /app/scripts/artifact-cli.js
RUN ln -s /app/scripts/artifact-cli.js /usr/local/bin/artifact-cli
```

### Database Setup

```sql
-- Supabase schema for artifacts
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  version TEXT NOT NULL,
  author TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation items table
CREATE TABLE navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT,
  icon TEXT,
  parent_id UUID REFERENCES navigation_items(id),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public artifacts are viewable by everyone" 
ON artifacts FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can insert their own artifacts" 
ON artifacts FOR INSERT 
WITH CHECK (auth.uid()::text = author);
```

## Troubleshooting

### Common Issues

#### 1. CLI Configuration Issues

```bash
# Reset configuration
rm .artifact-registry.json
artifact-cli init --force

# Check API connection
artifact-cli status
```

#### 2. Component Not Loading

```typescript
// Check component cache
const store = useArtifactRegistryStore();
console.log('Cached components:', store.loadedComponents);

// Clear cache if needed
store.loadedComponents.clear();
```

#### 3. Supabase Connection Issues

```bash
# Test connection
curl -X GET "https://your-project.supabase.co/rest/v1/artifacts" \
  -H "apikey: your-anon-key"

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### 4. Build Issues

```bash
# Clean build
rm -rf node_modules/.cache
rm -rf dist/
npm run clean
npm install
npm run build
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=artifact-registry:* npm run dev

# CLI debug mode
artifact-cli --verbose list
```

### Performance Issues

```typescript
// Monitor component performance
import { Profiler } from 'react';

<Profiler id="ArtifactRegistry" onRender={onRenderCallback}>
  <ArtifactRegistryBrowser />
</Profiler>

// Check bundle size
npm run analyze
```

### Error Reporting

```typescript
// Custom error boundary
class ArtifactErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Artifact Registry Error:', error, errorInfo);
    
    // Report to monitoring service
    reportError(error, {
      component: 'ArtifactRegistry',
      errorInfo,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/danny-avila/LibreChat.git
cd LibreChat

# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test
```

### Code Style

- Follow existing ESLint configuration
- Use TypeScript for all new code
- Add comprehensive tests for new features
- Update documentation for API changes

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run validation: `npm run lint && npm test`
4. Update documentation if needed
5. Submit PR with clear description

For more information, see the [Contributing Guide](../CONTRIBUTING.md).