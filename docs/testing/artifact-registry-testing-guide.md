# Artifact Registry Testing Guide

This document provides comprehensive guidance for testing the artifact registry system in LibreChat.

## Overview

The artifact registry system includes multiple layers of testing to ensure reliability, performance, and user experience:

- **Unit Tests**: Individual component and store testing
- **Integration Tests**: Complete workflow testing
- **API Tests**: Backend endpoint testing
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and performance validation
- **Error Scenario Tests**: Edge case and failure handling

## Test Structure

```
client/src/components/Artifacts/__tests__/
├── unit/
│   ├── ArtifactRegistryBrowser.test.tsx
│   └── StaticArtifactPreview.test.tsx
├── integration/
│   └── ArtifactWorkflow.test.tsx
└── performance/
    └── ArtifactPerformance.test.tsx

client/src/store/__tests__/
└── artifact-registry.test.ts

api/server/routes/__tests__/
└── artifacts.test.js

e2e/
└── artifact-registry.spec.ts
```

## Running Tests

### All Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Frontend Tests
```bash
# Run client unit tests
npm run test:client

# Run client tests in watch mode
npm run test:client:watch

# Run specific test file
npm run test:client -- ArtifactRegistryBrowser.test.tsx
```

### Backend Tests
```bash
# Run API tests
npm run test:api

# Run specific API test
npm run test:api -- artifacts.test.js
```

### E2E Tests
```bash
# Run E2E tests
npm run e2e

# Run E2E tests with browser visible
npm run e2e:headed

# Run E2E tests with debugging
npm run e2e:debug

# Run accessibility tests
npm run e2e:a11y
```

### Performance Tests
```bash
# Run performance tests
npm run test:performance

# Run performance tests with profiling
npm run test:performance:profile
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components and functions in isolation.

**Coverage**:
- Component rendering
- Props handling
- Event handling
- State management
- Error boundaries
- Utility functions

**Example**:
```typescript
describe('ArtifactRegistryBrowser', () => {
  it('should render artifact cards correctly', () => {
    const artifacts = [mockArtifact];
    render(<ArtifactRegistryBrowser artifacts={artifacts} />);
    
    expect(screen.getByText('Test Artifact')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

**Purpose**: Test complete user workflows and component interactions.

**Coverage**:
- Artifact save workflow
- Browse and search functionality
- Component composition
- Focus management
- Error handling flows

**Example**:
```typescript
describe('Complete User Workflow', () => {
  it('should save, browse, and reference artifacts', async () => {
    // Generate artifact
    await generateArtifact('Create a button');
    
    // Save artifact
    await saveArtifact({
      name: 'My Button',
      description: 'A reusable button'
    });
    
    // Browse registry
    await navigateToRegistry();
    expect(screen.getByText('My Button')).toBeInTheDocument();
    
    // Reference in chat
    await referenceArtifact('@[My Button]');
    expect(screen.getByTestId('artifact-reference')).toBeVisible();
  });
});
```

### 3. API Tests

**Purpose**: Test backend endpoints and business logic.

**Coverage**:
- CRUD operations
- Authentication/authorization
- Validation
- Error handling
- Rate limiting
- Supabase integration

**Example**:
```javascript
describe('POST /api/artifacts', () => {
  it('should create a new artifact', async () => {
    const response = await request(app)
      .post('/api/artifacts')
      .send(mockArtifact)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });
});
```

### 4. E2E Tests

**Purpose**: Test complete user journeys in a real browser environment.

**Coverage**:
- Full user workflows
- Cross-browser compatibility
- Accessibility
- Performance under real conditions
- Network error handling

**Example**:
```typescript
test('should complete artifact save workflow', async ({ page }) => {
  await page.goto('/chat');
  
  // Generate artifact
  await page.fill('[data-testid="chat-input"]', 'Create a button');
  await page.press('[data-testid="chat-input"]', 'Enter');
  
  // Save artifact
  await page.click('[data-testid="artifact-save-button"]');
  await page.fill('[data-testid="artifact-name"]', 'My Button');
  await page.click('[data-testid="save-submit"]');
  
  // Verify success
  await expect(page.locator('[data-testid="success-message"]'))
    .toContainText('Artifact saved successfully');
});
```

### 5. Performance Tests

**Purpose**: Validate system performance under various loads.

**Coverage**:
- Rendering performance
- Memory usage
- Search/filter performance
- Concurrent operations
- Bundle size optimization

**Example**:
```typescript
describe('Rendering Performance', () => {
  it('should render 1000 artifacts within performance budget', () => {
    const artifacts = generateArtifacts(1000);
    
    const startTime = performance.now();
    render(<ArtifactGrid artifacts={artifacts} />);
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(1000); // 1 second
  });
});
```

## Test Data Management

### Mock Data
```typescript
// Test artifacts
export const mockArtifacts: Artifact[] = [
  {
    id: 'test-artifact-1',
    name: 'Button Component',
    description: 'A reusable button',
    category: 'ui-component',
    tags: ['react', 'button'],
    version: '1.0.0',
    author: 'test-user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isPublic: true,
    dependencies: [],
    supabaseConfig: null,
  },
];

// Mock store
export const createMockStore = () => ({
  artifacts: new Map(),
  isLoading: false,
  error: null,
  searchArtifacts: vi.fn(),
  saveArtifact: vi.fn(),
  // ... other methods
});
```

### Test Utilities
```typescript
// Render with providers
export const renderWithProviders = (component: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </RecoilRoot>
    </QueryClientProvider>
  );
};

// Generate test data
export const generateArtifacts = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `artifact-${i}`,
    name: `Component ${i}`,
    // ... other properties
  }));
};
```

## Error Scenario Testing

### Network Errors
```typescript
test('should handle network failures gracefully', async () => {
  // Mock network failure
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
  
  render(<ArtifactRegistryBrowser />);
  
  // Verify error handling
  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
```

### Validation Errors
```typescript
test('should validate artifact save form', async () => {
  render(<ArtifactSaveModal />);
  
  // Submit without required fields
  await user.click(screen.getByRole('button', { name: /save/i }));
  
  // Verify validation errors
  expect(screen.getByText('Name is required')).toBeInTheDocument();
  expect(screen.getByText('Description is required')).toBeInTheDocument();
});
```

### Edge Cases
```typescript
test('should handle empty artifact registry', () => {
  render(<ArtifactRegistryBrowser artifacts={[]} />);
  
  expect(screen.getByText('No artifacts found')).toBeInTheDocument();
  expect(screen.getByText('Create your first artifact')).toBeInTheDocument();
});

test('should handle malformed artifact data', () => {
  const malformedArtifact = { id: 'test', name: null };
  
  expect(() => {
    render(<ArtifactCard artifact={malformedArtifact} />);
  }).not.toThrow();
  
  expect(screen.getByText('Untitled Artifact')).toBeInTheDocument();
});
```

## Accessibility Testing

### Automated A11y Tests
```typescript
test('should be accessible', async () => {
  const { container } = render(<ArtifactRegistryBrowser />);
  const results = await axe(container);
  
  expect(results).toHaveNoViolations();
});
```

### Keyboard Navigation
```typescript
test('should support keyboard navigation', async () => {
  render(<ArtifactRegistryBrowser />);
  
  // Tab through elements
  await user.tab();
  expect(screen.getByRole('search')).toHaveFocus();
  
  await user.tab();
  expect(screen.getByRole('combobox')).toHaveFocus();
  
  // Test Enter key activation
  await user.keyboard('{Enter}');
  // Verify expected behavior
});
```

### Screen Reader Support
```typescript
test('should announce state changes', async () => {
  render(<ArtifactRegistryBrowser />);
  
  // Trigger loading state
  fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
  
  // Verify announcement
  expect(screen.getByRole('status')).toHaveTextContent('Loading artifacts');
});
```

## Performance Testing Guidelines

### Rendering Performance
- Components should render within 100ms for small datasets
- Large datasets (1000+ items) should use virtualization
- Re-renders should be optimized with React.memo and useMemo

### Memory Management
- No memory leaks after component unmounting
- Efficient cleanup of event listeners and subscriptions
- Reasonable memory usage for large datasets

### Network Performance
- API calls should complete within 2 seconds
- Implement proper caching strategies
- Handle network failures gracefully

### Bundle Size
- Individual components should be under 50KB
- Use code splitting for large features
- Optimize dependencies and imports

## Continuous Integration

### GitHub Actions
```yaml
name: Test Artifact Registry
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:client
      
      - name: Run API tests
        run: npm run test:api
      
      - name: Run E2E tests
        run: npm run e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Coverage Requirements
- Unit tests: 90% coverage minimum
- Integration tests: Cover all major workflows
- E2E tests: Cover critical user journeys
- Performance tests: Validate key metrics

## Debugging Tests

### Common Issues
1. **Async operations**: Use waitFor() for async state changes
2. **Mock cleanup**: Clear mocks between tests
3. **Provider setup**: Ensure all required providers are included
4. **Test isolation**: Each test should be independent

### Debugging Tools
```typescript
// Debug component state
screen.debug(); // Prints current DOM
console.log(screen.getByTestId('artifact-card')); // Inspect element

// Debug store state
console.log(useArtifactRegistryStore.getState());

// Debug API calls
console.log(mockFetch.mock.calls);
```

### Test Environment Setup
```typescript
// Setup file (setupTests.ts)
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global APIs
global.fetch = vi.fn();
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for virtualization
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and atomic

### Mock Strategy
- Mock external dependencies
- Use real implementations for internal logic
- Mock at the boundary (API calls, external services)
- Avoid over-mocking

### Test Maintenance
- Update tests when requirements change
- Remove obsolete tests
- Refactor test utilities for reusability
- Keep test data realistic but minimal

### Performance Considerations
- Run tests in parallel when possible
- Use test.concurrent for independent tests
- Optimize test setup and teardown
- Monitor test execution time

## Conclusion

This comprehensive testing strategy ensures the artifact registry system is reliable, performant, and user-friendly. Regular execution of these tests helps maintain code quality and prevents regressions as the system evolves.

For questions or contributions to the testing suite, please refer to the development team or create an issue in the project repository.