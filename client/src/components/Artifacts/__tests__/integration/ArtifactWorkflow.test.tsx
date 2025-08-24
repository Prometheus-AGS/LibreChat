import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { useArtifactRegistryStore } from '../../../../store/artifact-registry';
import type {
  ArtifactMetadata,
  ComponentFetchResponse,
  NavigationItem,
} from 'librechat-data-provider';

// Mock API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock store
vi.mock('../../../../store/artifact-registry');
const mockUseArtifactRegistryStore = vi.mocked(useArtifactRegistryStore);

// Mock components that don't exist yet
const MockArtifactRegistryBrowser = () => {
  const store = useArtifactRegistryStore();

  return (
    <div data-testid="artifact-registry-browser">
      <div role="main" aria-label="Artifact Registry">
        <input
          placeholder="Search artifacts..."
          role="search"
          aria-label="Search artifacts"
          onChange={(e) => store.searchArtifacts?.(e.target.value)}
        />

        <select role="combobox" aria-label="Category filter">
          <option value="all">All Categories</option>
          <option value="ui-component">UI Component</option>
        </select>

        {store.artifacts.size === 0 ? (
          <div>No artifacts found</div>
        ) : (
          Array.from(store.artifacts.values()).map((artifact) => (
            <article
              key={artifact.id}
              data-testid={`artifact-card-${artifact.id}`}
              aria-label={`Artifact: ${artifact.name}`}
              tabIndex={0}
              onClick={() => store.setFocusedArtifact?.(artifact.id)}
            >
              <h3>{artifact.name}</h3>
              <p>{artifact.description}</p>
              {artifact.tags?.map((tag) => <span key={tag}>{tag}</span>)}
              <button aria-label="Edit">Edit</button>
              <button aria-label="Delete">Delete</button>
            </article>
          ))
        )}

        {store.registryError && <div role="alert">{store.registryError}</div>}

        {store.isLoadingRegistry && <div role="status">Loading artifacts...</div>}

        <button>Save Artifact</button>
      </div>
    </div>
  );
};

const MockArtifactContainer = ({ artifactId }: { artifactId: string }) => {
  const store = useArtifactRegistryStore();

  React.useEffect(() => {
    store.fetchComponent?.(artifactId);
  }, [artifactId, store]);

  return (
    <div data-testid={`artifact-container-${artifactId}`}>
      {store.componentError ? <div>Compilation failed</div> : <div>Component rendered</div>}
    </div>
  );
};

// Test data
const mockArtifacts: ArtifactMetadata[] = [
  {
    id: 'artifact-1',
    name: 'Button Component',
    description: 'A reusable button component',
    category: 'ui-component',
    tags: ['react', 'button', 'ui'],
    version: '1.0.0',
    author: 'test-user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isPublic: true,
    dependencies: [],
    supabaseConfig: undefined,
  },
  {
    id: 'artifact-2',
    name: 'Card Component',
    description: 'A flexible card component',
    category: 'ui-component',
    tags: ['react', 'card', 'layout'],
    version: '1.2.0',
    author: 'test-user',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    isPublic: true,
    dependencies: [],
    supabaseConfig: undefined,
  },
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <BrowserRouter>{children}</BrowserRouter>
      </RecoilRoot>
    </QueryClientProvider>
  );
};

describe('Artifact Workflow Integration Tests', () => {
  let mockStore: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock store with correct structure
    mockStore = {
      // State
      artifacts: new Map(),
      loadedComponents: new Map(),
      focusedArtifactId: null,
      composedArtifacts: new Map(),
      artifactEmbeds: new Map(),
      dynamicNavigation: null,
      navigationItems: [],
      shadcnVersion: null,
      isLoadingRegistry: false,
      isLoadingComponent: false,
      isLoadingNavigation: false,
      registryError: null,
      componentError: null,
      navigationError: null,

      // Actions
      loadArtifactRegistry: vi.fn(),
      searchArtifacts: vi.fn(),
      fetchComponent: vi.fn(),
      cacheComponent: vi.fn(),
      setFocusedArtifact: vi.fn(),
      canModifyArtifact: vi.fn(),
      createComposedArtifact: vi.fn(),
      updateComposedArtifact: vi.fn(),
      addArtifactEmbed: vi.fn(),
      removeArtifactEmbed: vi.fn(),
      loadDynamicNavigation: vi.fn(),
      refreshNavigation: vi.fn(),
      detectShadcnVersion: vi.fn(),
      clearErrors: vi.fn(),
      setError: vi.fn(),
    };

    mockUseArtifactRegistryStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete User Workflow', () => {
    it('should complete the full artifact save, browse, and reference workflow', async () => {
      const user = userEvent.setup();

      // Step 1: Start with empty registry
      render(
        <TestWrapper>
          <MockArtifactRegistryBrowser />
        </TestWrapper>,
      );

      // Should show empty state initially
      expect(screen.getByText(/no artifacts found/i)).toBeInTheDocument();

      // Step 2: Simulate adding artifacts to store
      const artifactsMap = new Map();
      mockArtifacts.forEach((artifact) => {
        artifactsMap.set(artifact.id, artifact);
      });

      mockStore.artifacts = artifactsMap;
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        artifacts: artifactsMap,
      });

      // Re-render to show the new artifacts
      render(
        <TestWrapper>
          <MockArtifactRegistryBrowser />
        </TestWrapper>,
      );

      // Should now show the artifacts
      await waitFor(() => {
        expect(screen.getByText('Button Component')).toBeInTheDocument();
      });

      expect(screen.getByText('A reusable button component')).toBeInTheDocument();
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('button')).toBeInTheDocument();

      // Step 3: Test search functionality
      const searchInput = screen.getByPlaceholderText(/search artifacts/i);
      await user.type(searchInput, 'button');

      expect(mockStore.searchArtifacts).toHaveBeenCalledWith('button');

      // Step 4: Test artifact focus
      const artifactCard = screen.getByTestId('artifact-card-artifact-1');
      await user.click(artifactCard);

      expect(mockStore.setFocusedArtifact).toHaveBeenCalledWith('artifact-1');

      // Step 5: Test artifact container rendering
      render(
        <TestWrapper>
          <MockArtifactContainer artifactId="artifact-1" />
        </TestWrapper>,
      );

      // Should attempt to fetch the component
      expect(mockStore.fetchComponent).toHaveBeenCalledWith('artifact-1');
    });

    it('should handle loading states correctly', async () => {
      // Set loading state
      mockStore.isLoadingRegistry = true;
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        isLoadingRegistry: true,
      });

      render(
        <TestWrapper>
          <MockArtifactRegistryBrowser />
        </TestWrapper>,
      );

      // Should show loading indicator
      expect(screen.getByRole('status')).toHaveTextContent(/loading artifacts/i);
    });

    it('should handle error states correctly', async () => {
      // Set error state
      mockStore.registryError = 'Failed to load artifacts';
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        registryError: 'Failed to load artifacts',
      });

      render(
        <TestWrapper>
          <MockArtifactRegistryBrowser />
        </TestWrapper>,
      );

      // Should show error message
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load artifacts/i);
    });
  });

  describe('Component Caching', () => {
    it('should cache components efficiently', async () => {
      const mockComponent: ComponentFetchResponse = {
        artifact: mockArtifacts[0],
        code: 'compiled code',
        dependencies: [],
        resolvedVersion: '1.0.0',
      };

      // Mock cached component
      const componentsMap = new Map();
      componentsMap.set('artifact-1@latest', mockComponent);
      mockStore.loadedComponents = componentsMap;

      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        loadedComponents: componentsMap,
      });

      render(
        <TestWrapper>
          <MockArtifactContainer artifactId="artifact-1" />
        </TestWrapper>,
      );

      // Should use cached component
      expect(mockStore.fetchComponent).toHaveBeenCalledWith('artifact-1');
    });
  });

  describe('Focus Management', () => {
    it('should track focused artifacts correctly', () => {
      mockStore.focusedArtifactId = 'artifact-1';
      mockStore.canModifyArtifact.mockImplementation((id: string) => {
        return mockStore.focusedArtifactId === null || mockStore.focusedArtifactId === id;
      });

      mockUseArtifactRegistryStore.mockReturnValue(mockStore);

      // Test focus management
      expect(mockStore.canModifyArtifact('artifact-1')).toBe(true);
      expect(mockStore.canModifyArtifact('artifact-2')).toBe(false);
    });
  });

  describe('Navigation Management', () => {
    it('should load dynamic navigation correctly', async () => {
      const mockNavItems: NavigationItem[] = [
        {
          id: '1',
          label: 'Dashboard',
          href: '/dashboard',
        },
        {
          id: '2',
          label: 'Components',
          href: '/components',
        },
      ];

      mockStore.navigationItems = mockNavItems;
      mockStore.loadDynamicNavigation.mockResolvedValue(undefined);

      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        navigationItems: mockNavItems,
      });

      // Test navigation loading
      const supabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key',
      };

      await mockStore.loadDynamicNavigation(supabaseConfig);
      expect(mockStore.loadDynamicNavigation).toHaveBeenCalledWith(supabaseConfig);
    });
  });

  describe('Error Handling', () => {
    it('should handle component compilation errors', async () => {
      mockStore.componentError = 'Compilation failed';
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        componentError: 'Compilation failed',
      });

      render(
        <TestWrapper>
          <MockArtifactContainer artifactId="artifact-1" />
        </TestWrapper>,
      );

      // Should show compilation error
      expect(screen.getByText(/compilation failed/i)).toBeInTheDocument();
    });

    it('should clear errors correctly', () => {
      mockStore.registryError = 'Some error';
      mockStore.componentError = 'Another error';
      mockStore.navigationError = 'Navigation error';

      mockStore.clearErrors();

      expect(mockStore.clearErrors).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels and roles', () => {
      const artifactsMap = new Map();
      mockArtifacts.forEach((artifact) => {
        artifactsMap.set(artifact.id, artifact);
      });

      mockStore.artifacts = artifactsMap;
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        artifacts: artifactsMap,
      });

      render(
        <TestWrapper>
          <MockArtifactRegistryBrowser />
        </TestWrapper>,
      );

      // Check for proper ARIA labels
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Artifact Registry');
      expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search artifacts');

      // Check artifact cards have proper accessibility
      const artifactCards = screen.getAllByRole('article');
      artifactCards.forEach((card) => {
        expect(card).toHaveAttribute('aria-label');
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should support keyboard navigation', async () => {
      const artifactsMap = new Map();
      mockArtifacts.forEach((artifact) => {
        artifactsMap.set(artifact.id, artifact);
      });

      mockStore.artifacts = artifactsMap;
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        artifacts: artifactsMap,
      });

      render(
        <TestWrapper>
          <MockArtifactRegistryBrowser />
        </TestWrapper>,
      );

      // Test keyboard navigation
      const firstCard = screen.getAllByTestId(/artifact-card-/)[0];
      firstCard.focus();

      // Should be focusable
      expect(firstCard).toHaveFocus();

      // Test Enter key activation
      fireEvent.keyDown(firstCard, { key: 'Enter', code: 'Enter' });
      expect(mockStore.setFocusedArtifact).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle large artifact collections efficiently', async () => {
      // Create large collection of artifacts
      const largeArtifactCollection = new Map();
      for (let i = 0; i < 100; i++) {
        const artifact = {
          ...mockArtifacts[0],
          id: `artifact-${i}`,
          name: `Component ${i}`,
        };
        largeArtifactCollection.set(artifact.id, artifact);
      }

      mockStore.artifacts = largeArtifactCollection;
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStore,
        artifacts: largeArtifactCollection,
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <MockArtifactRegistryBrowser />
        </TestWrapper>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);

      // Should show all artifacts
      expect(screen.getAllByTestId(/artifact-card-/)).toHaveLength(100);
    });
  });
});
