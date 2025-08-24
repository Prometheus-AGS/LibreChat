# LibreChat Artifact Registry System

A comprehensive artifact registry and composition system that enables artifacts (generated React components) to connect directly to Supabase databases, support component composition, and include data-driven navigation with self-hosted Supabase prioritization.

## 🚀 Quick Start

```bash
# Initialize the artifact registry
npm run artifact:setup

# Create your first artifact
npm run artifact:create

# Start development with artifact registry enabled
npm run artifact:dev

# Run comprehensive tests
npm run artifact:test:all
```

## 📋 System Overview

### Core Features

- **🎯 User-Initiated Save Workflow**: Explicit save process with validation, versioning, and metadata collection
- **🔍 Intelligent Registry Browser**: Advanced search, filtering, and sorting capabilities
- **🧩 Component Composition**: `<ArtifactContainer>` syntax for embedding artifacts
- **🎯 Focus Management**: LLM containment system prevents modification of non-focused artifacts
- **📱 @Mention System**: `@[artifact-name]` syntax with autocomplete for referencing artifacts
- **🗂️ Dynamic Navigation**: Database-driven menu generation from Supabase
- **🔧 shadcn-ui Support**: Version detection for both canary and stable builds
- **🛡️ Comprehensive Error Handling**: Multi-layered error boundaries and recovery mechanisms
- **⚡ Performance Optimized**: Caching, virtualization, and efficient state management

### Architecture Components

```
📦 Artifact Registry System
├── 🎨 Frontend Components
│   ├── ArtifactRegistryBrowser     # Main browsing interface
│   ├── ArtifactContainer          # Component embedding
│   ├── ArtifactSaveModal          # Save workflow UI
│   ├── ArtifactMentionSystem      # @mention autocomplete
│   └── ErrorBoundaries            # Error handling
├── 🔧 Backend API
│   ├── /api/artifacts             # CRUD operations
│   ├── /api/artifacts/search      # Search functionality
│   ├── /api/artifacts/component   # BFF component fetching
│   └── /api/artifacts/navigation  # Dynamic navigation
├── 🗄️ State Management
│   ├── Zustand Store              # Artifact registry state
│   ├── Focus Management           # LLM containment
│   └── Component Caching          # Performance optimization
├── 🧪 Testing Suite
│   ├── Unit Tests                 # Component & store tests
│   ├── Integration Tests          # Workflow tests
│   ├── API Tests                  # Backend endpoint tests
│   ├── E2E Tests                  # Full user journey tests
│   └── Performance Tests          # Load & performance validation
└── 🛠️ Developer Tools
    ├── CLI Tools                  # artifact-cli command
    ├── Code Validator             # Security & best practices
    ├── Templates                  # Component scaffolding
    └── Health Checks              # System validation
```

## 🎯 Key Concepts

### 1. User-Initiated Save Workflow

Unlike automatic saving, our system requires explicit user action to save artifacts:

```typescript
// User generates artifact in chat
"Create a button component"

// AI generates component code
<ArtifactPreview code={generatedCode} />

// User clicks save button
<button onClick={handleSave}>💾 Save to Registry</button>

// Save modal with metadata collection
<ArtifactSaveModal 
  onSave={(metadata) => saveArtifact(code, metadata)}
/>
```

### 2. Component Composition

Artifacts can embed other artifacts using a simple syntax:

```typescript
// Compose multiple artifacts
<ArtifactContainer artifactId="form-layout">
  <ArtifactContainer artifactId="input-field" props={{ label: "Name" }} />
  <ArtifactContainer artifactId="button-component" props={{ variant: "primary" }} />
</ArtifactContainer>
```

### 3. Focus Management & LLM Containment

Prevents LLM from modifying non-focused artifacts:

```typescript
// Only focused artifacts can be modified
const canModify = useArtifactRegistryStore(state => 
  state.canModifyArtifact(artifactId)
);

// Focus management
store.setFocusedArtifact(artifactId);
store.clearFocus(); // Allow modification of all artifacts
```

### 4. @Mention System

Reference artifacts in chat with autocomplete:

```typescript
// Type @ to trigger autocomplete
"Use @[Button Component] in this form"

// System resolves reference and highlights in UI
<ArtifactReference artifactId="button-component" />
```

## 🛠️ Developer Tools

### CLI Commands

```bash
# Artifact management
npm run artifact:list              # List all artifacts
npm run artifact:search "button"   # Search artifacts
npm run artifact:create            # Create new artifact
npm run artifact:get <id>          # Get artifact details
npm run artifact:delete <id>       # Delete artifact

# Development workflow
npm run artifact:validate <file>   # Validate artifact code
npm run artifact:templates         # Manage templates
npm run artifact:status            # System health check

# Testing
npm run artifact:test              # Run unit tests
npm run artifact:test:api          # Run API tests
npm run artifact:test:e2e          # Run E2E tests
npm run artifact:test:performance  # Run performance tests
npm run artifact:test:all          # Run all tests

# Maintenance
npm run artifact:health            # Health check
npm run artifact:clean             # Clean configuration
npm run artifact:setup             # Initial setup
```

### Code Validation

```bash
# Validate artifact code for:
# - Security vulnerabilities
# - Performance issues
# - Best practices compliance
# - TypeScript usage
# - Accessibility
node scripts/dev-tools/artifact-validator.js ./MyComponent.tsx
```

### Templates

Built-in templates for rapid development:

- **react-component**: Basic React functional component
- **utility-function**: Utility function with tests
- **custom-hook**: React hook template
- **form-component**: Form component with validation

## 🧪 Testing Strategy

### Test Coverage

- **Unit Tests**: 90%+ coverage for critical components
- **Integration Tests**: Complete user workflows
- **API Tests**: All endpoints with success/error scenarios
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Rendering, memory, and load validation

### Test Structure

```
client/src/components/Artifacts/__tests__/
├── unit/                          # Component unit tests
├── integration/                   # Workflow integration tests
└── performance/                   # Performance benchmarks

api/server/routes/__tests__/
└── artifacts.test.js              # API endpoint tests

e2e/
└── artifact-registry.spec.ts      # End-to-end tests
```

## 🔧 Configuration

### Environment Variables

```bash
# .env
ARTIFACT_REGISTRY_ENABLED=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Optional configurations
ARTIFACT_STORAGE_PROVIDER=supabase
ARTIFACT_STORAGE_BUCKET=artifacts
ARTIFACT_CACHE_TTL=3600
```

### CLI Configuration

```json
// .artifact-registry.json
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

## 🗄️ Database Schema

### Supabase Tables

```sql
-- Artifacts table
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

-- Enable Row Level Security
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
```

## 🚀 Deployment

### Production Build

```bash
# Build all components
npm run artifact:build

# Verify health
npm run artifact:health

# Deploy with Docker
docker build -t librechat-artifacts .
docker run -p 3080:3080 librechat-artifacts
```

### Docker Configuration

```dockerfile
# Add to existing Dockerfile
COPY scripts/ /app/scripts/
COPY templates/ /app/templates/

# Install CLI dependencies
RUN npm install -g commander inquirer ora chalk

# Make CLI executable
RUN chmod +x /app/scripts/artifact-cli.js
RUN ln -s /app/scripts/artifact-cli.js /usr/local/bin/artifact-cli
```

## 📊 Performance Metrics

### Benchmarks

- **Component Rendering**: <100ms for small datasets, <1s for 1000+ items
- **Search Performance**: <50ms for registry search operations
- **Memory Usage**: Efficient cleanup, no memory leaks
- **Bundle Size**: <150KB total for all artifact components
- **API Response Time**: <2s for all endpoints

### Optimization Features

- **Virtual Scrolling**: Handle large artifact collections
- **Component Caching**: Reduce redundant API calls
- **Lazy Loading**: Code splitting for better performance
- **Debounced Search**: Optimize search operations
- **Memoization**: Prevent unnecessary re-renders

## 🛡️ Security

### Security Features

- **Input Validation**: Comprehensive validation for all inputs
- **XSS Prevention**: Sanitization of user-generated content
- **Authentication**: JWT-based authentication for API endpoints
- **Authorization**: Role-based access control
- **Code Validation**: Security scanning for artifact code

### Best Practices

- Never use `dangerouslySetInnerHTML`
- Validate all user inputs
- Sanitize artifact code before execution
- Use HTTPS for all API communications
- Implement proper CORS policies

## 🔍 Troubleshooting

### Common Issues

1. **CLI Configuration Issues**
   ```bash
   rm .artifact-registry.json
   npm run artifact:init
   ```

2. **Component Not Loading**
   ```bash
   npm run artifact:health
   # Check component cache and clear if needed
   ```

3. **Supabase Connection Issues**
   ```bash
   # Verify environment variables
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

4. **Build Issues**
   ```bash
   npm run artifact:clean
   npm install
   npm run artifact:build
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=artifact-registry:* npm run dev

# CLI debug mode
artifact-cli --verbose status
```

## 📚 Documentation

- **[Developer Guide](./development/artifact-registry-developer-guide.md)**: Comprehensive development documentation
- **[Testing Guide](./testing/artifact-registry-testing-guide.md)**: Complete testing documentation
- **[Error Handling System](./error-handling-system.md)**: Error handling architecture
- **[API Reference](./api/artifact-registry-api.md)**: Complete API documentation

## 🤝 Contributing

### Development Setup

```bash
# Clone and setup
git clone https://github.com/danny-avila/LibreChat.git
cd LibreChat
npm install

# Initialize artifact registry
npm run artifact:setup

# Start development
npm run artifact:dev
```

### Code Standards

- Follow existing ESLint configuration
- Use TypeScript for all new code
- Add comprehensive tests for new features
- Update documentation for API changes
- Run validation before submitting PRs

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run validation: `npm run artifact:test:all`
4. Update documentation if needed
5. Submit PR with clear description

## 📈 Roadmap

### Completed Features ✅

- [x] User-initiated save workflow with validation
- [x] Comprehensive registry browser with search/filter
- [x] Component composition system
- [x] Focus management and LLM containment
- [x] @Mention system with autocomplete
- [x] Dynamic navigation from Supabase
- [x] shadcn-ui version detection
- [x] Error boundaries and handling
- [x] Comprehensive testing suite
- [x] Developer tools and CLI

### Future Enhancements 🚧

- [ ] Visual component editor
- [ ] Component marketplace
- [ ] Advanced dependency resolution
- [ ] Real-time collaboration
- [ ] Component versioning UI
- [ ] Analytics and usage tracking
- [ ] Plugin system for extensions
- [ ] AI-powered component suggestions

## 📄 License

This project is part of LibreChat and follows the same licensing terms. See the main project repository for license details.

## 🙏 Acknowledgments

- LibreChat team for the foundational architecture
- Supabase for the excellent database platform
- React and TypeScript communities for the tools
- All contributors who helped build this system

---

**Built with ❤️ for the LibreChat community**

For questions, issues, or contributions, please visit the [LibreChat repository](https://github.com/danny-avila/LibreChat) or join our community discussions.