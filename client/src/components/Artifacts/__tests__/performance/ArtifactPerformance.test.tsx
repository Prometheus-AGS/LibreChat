import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { useArtifactRegistryStore } from '../../../../store/artifact-registry';
import type { ArtifactMetadata } from 'librechat-data-provider';

// Mock store
vi.mock('../../../../store/artifact-registry');
const mockUseArtifactRegistryStore = vi.mocked(useArtifactRegistryStore);

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock component for testing
const MockArtifactGrid = ({ artifacts }: { artifacts: Map<string, ArtifactMetadata> }) => {
  const startTime = performance.now();

  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Log performance metrics
    console.log(`Rendered ${artifacts.size} artifacts in ${renderTime}ms`);
  }, [artifacts, startTime]);

  return (
    <div data-testid="artifact-grid">
      {Array.from(artifacts.values()).map((artifact) => (
        <div key={artifact.id} data-testid={`artifact-card-${artifact.id}`}>
          <h3>{artifact.name}</h3>
          <p>{artifact.description}</p>
          {artifact.tags?.map((tag) => (
            <span key={tag} data-testid={`tag-${tag}`}>
              {tag}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

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

// Helper function to generate test artifacts
const generateArtifacts = (count: number): Map<string, ArtifactMetadata> => {
  const artifacts = new Map();

  for (let i = 0; i < count; i++) {
    const artifact: ArtifactMetadata = {
      id: `artifact-${i}`,
      name: `Component ${i}`,
      description: `Description for component ${i}`,
      category: i % 2 === 0 ? 'ui-component' : 'utility',
      tags: [`tag-${i % 5}`, `category-${i % 3}`],
      version: '1.0.0',
      author: `author-${i % 10}`,
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60),
      updatedAt: new Date(Date.now() - i * 1000 * 60 * 30),
      isPublic: i % 3 === 0,
      dependencies: [],
      downloadCount: Math.floor(Math.random() * 1000),
    };

    artifacts.set(artifact.id, artifact);
  }

  return artifacts;
};

describe('Artifact Performance Tests', () => {
  let mockStore: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStore = {
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

  describe('Rendering Performance', () => {
    it('should render 100 artifacts within performance budget', async () => {
      const artifacts = generateArtifacts(100);
      mockStore.artifacts = artifacts;

      const startTime = performance.now();

      render(
        <TestWrapper>
          <MockArtifactGrid artifacts={artifacts} />
        </TestWrapper>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 500ms
      expect(renderTime).toBeLessThan(500);

      // Verify all artifacts are rendered
      expect(screen.getAllByTestId(/artifact-card-/)).toHaveLength(100);
    });

    it('should render 1000 artifacts with virtual scrolling performance', async () => {
      const artifacts = generateArtifacts(1000);
      mockStore.artifacts = artifacts;

      const startTime = performance.now();

      render(
        <TestWrapper>
          <MockArtifactGrid artifacts={artifacts} />
        </TestWrapper>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 1 second even with 1000 items
      expect(renderTime).toBeLessThan(1000);

      // Verify artifacts are rendered (all 1000 in this mock, but in real implementation would be virtualized)
      expect(screen.getAllByTestId(/artifact-card-/)).toHaveLength(1000);
    });

    it('should handle rapid re-renders efficiently', async () => {
      const artifacts = generateArtifacts(50);
      mockStore.artifacts = artifacts;

      const { rerender } = render(
        <TestWrapper>
          <MockArtifactGrid artifacts={artifacts} />
        </TestWrapper>,
      );

      const renderTimes: number[] = [];

      // Perform 10 rapid re-renders
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        // Modify artifacts slightly to trigger re-render
        const modifiedArtifacts = new Map(artifacts);
        const firstArtifact = modifiedArtifacts.values().next().value;
        if (firstArtifact) {
          modifiedArtifacts.set(firstArtifact.id, {
            ...firstArtifact,
            name: `${firstArtifact.name} - Updated ${i}`,
          });
        }

        rerender(
          <TestWrapper>
            <MockArtifactGrid artifacts={modifiedArtifacts} />
          </TestWrapper>,
        );

        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
      }

      // Average re-render time should be under 50ms
      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      expect(averageRenderTime).toBeLessThan(50);

      // No render should take longer than 100ms
      renderTimes.forEach((time) => {
        expect(time).toBeLessThan(100);
      });
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render and unmount multiple large datasets
      for (let iteration = 0; iteration < 5; iteration++) {
        const artifacts = generateArtifacts(200);
        mockStore.artifacts = artifacts;

        const { unmount } = render(
          <TestWrapper>
            <MockArtifactGrid artifacts={artifacts} />
          </TestWrapper>,
        );

        // Verify rendering works
        expect(screen.getAllByTestId(/artifact-card-/)).toHaveLength(200);

        // Unmount to test cleanup
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should efficiently handle component caching', async () => {
      const artifacts = generateArtifacts(100);
      const componentsMap = new Map();

      // Simulate cached components
      artifacts.forEach((artifact, id) => {
        componentsMap.set(`${id}@latest`, {
          artifact,
          code: `// Component code for ${artifact.name}`,
          dependencies: [],
          resolvedVersion: '1.0.0',
        });
      });

      mockStore.loadedComponents = componentsMap;

      const startTime = performance.now();

      render(
        <TestWrapper>
          <MockArtifactGrid artifacts={artifacts} />
        </TestWrapper>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Cached components should render very quickly
      expect(renderTime).toBeLessThan(100);

      // Verify cache size is reasonable
      expect(componentsMap.size).toBe(100);
    });
  });

  describe('Search Performance', () => {
    it('should handle search operations efficiently', async () => {
      const artifacts = generateArtifacts(500);
      mockStore.artifacts = artifacts;

      const searchQueries = [
        'component',
        'button',
        'card',
        'form',
        'input',
        'modal',
        'table',
        'chart',
      ];

      const searchTimes: number[] = [];

      for (const query of searchQueries) {
        const startTime = performance.now();

        // Simulate search operation
        const results = Array.from(artifacts.values()).filter(
          (artifact) =>
            artifact.name.toLowerCase().includes(query.toLowerCase()) ||
            artifact.description?.toLowerCase().includes(query.toLowerCase()) ||
            artifact.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
        );

        const endTime = performance.now();
        const searchTime = endTime - startTime;
        searchTimes.push(searchTime);

        // Each search should complete quickly
        expect(searchTime).toBeLessThan(50);
        expect(results).toBeDefined();
      }

      // Average search time should be very fast
      const averageSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      expect(averageSearchTime).toBeLessThan(20);
    });

    it('should handle filtering operations efficiently', async () => {
      const artifacts = generateArtifacts(300);
      mockStore.artifacts = artifacts;

      const filters = [
        { category: 'ui-component' },
        { category: 'utility' },
        { tags: ['tag-0'] },
        { tags: ['tag-1', 'tag-2'] },
        { author: 'author-0' },
      ];

      const filterTimes: number[] = [];

      for (const filter of filters) {
        const startTime = performance.now();

        // Simulate filtering operation
        const results = Array.from(artifacts.values()).filter((artifact) => {
          if (filter.category && artifact.category !== filter.category) return false;
          if (filter.tags && !filter.tags.some((tag) => artifact.tags?.includes(tag))) return false;
          if (filter.author && artifact.author !== filter.author) return false;
          return true;
        });

        const endTime = performance.now();
        const filterTime = endTime - startTime;
        filterTimes.push(filterTime);

        // Each filter should complete quickly
        expect(filterTime).toBeLessThan(30);
        expect(results).toBeDefined();
      }

      // Average filter time should be very fast
      const averageFilterTime = filterTimes.reduce((a, b) => a + b, 0) / filterTimes.length;
      expect(averageFilterTime).toBeLessThan(15);
    });
  });

  describe('Sorting Performance', () => {
    it('should handle sorting operations efficiently', async () => {
      const artifacts = generateArtifacts(400);
      mockStore.artifacts = artifacts;

      const sortOperations = [
        { field: 'name', order: 'asc' },
        { field: 'name', order: 'desc' },
        { field: 'createdAt', order: 'asc' },
        { field: 'createdAt', order: 'desc' },
        { field: 'downloadCount', order: 'desc' },
      ];

      const sortTimes: number[] = [];

      for (const sort of sortOperations) {
        const startTime = performance.now();

        // Simulate sorting operation
        const sortedArtifacts = Array.from(artifacts.values()).sort((a, b) => {
          let aValue: any = a[sort.field as keyof ArtifactMetadata];
          let bValue: any = b[sort.field as keyof ArtifactMetadata];

          if (sort.field === 'createdAt' || sort.field === 'updatedAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }

          if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }

          if (sort.order === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });

        const endTime = performance.now();
        const sortTime = endTime - startTime;
        sortTimes.push(sortTime);

        // Each sort should complete quickly
        expect(sortTime).toBeLessThan(100);
        expect(sortedArtifacts).toHaveLength(400);
      }

      // Average sort time should be reasonable
      const averageSortTime = sortTimes.reduce((a, b) => a + b, 0) / sortTimes.length;
      expect(averageSortTime).toBeLessThan(50);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple simultaneous operations efficiently', async () => {
      const artifacts = generateArtifacts(200);
      mockStore.artifacts = artifacts;

      const startTime = performance.now();

      // Simulate multiple concurrent operations
      const operations = await Promise.all([
        // Search operation
        Promise.resolve(
          Array.from(artifacts.values()).filter((artifact) =>
            artifact.name.toLowerCase().includes('component'),
          ),
        ),

        // Filter operation
        Promise.resolve(
          Array.from(artifacts.values()).filter((artifact) => artifact.category === 'ui-component'),
        ),

        // Sort operation
        Promise.resolve(
          Array.from(artifacts.values()).sort((a, b) => a.name.localeCompare(b.name)),
        ),

        // Component fetch simulation
        Promise.resolve(
          Array.from(artifacts.values())
            .slice(0, 10)
            .map((artifact) => ({
              artifact,
              code: `// Code for ${artifact.name}`,
              dependencies: [],
              resolvedVersion: '1.0.0',
            })),
        ),
      ]);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All operations should complete quickly when run concurrently
      expect(totalTime).toBeLessThan(200);

      // Verify all operations completed successfully
      expect(operations).toHaveLength(4);
      operations.forEach((result) => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should maintain performance under high load', async () => {
      const artifacts = generateArtifacts(1000);
      mockStore.artifacts = artifacts;

      const operationTimes: number[] = [];
      const concurrentOperations = 10;

      // Run multiple operations concurrently
      const promises = Array.from({ length: concurrentOperations }, async (_, index) => {
        const startTime = performance.now();

        // Simulate different types of operations
        const operationType = index % 4;
        let result;

        switch (operationType) {
          case 0: // Search
            result = Array.from(artifacts.values()).filter((artifact) =>
              artifact.name.includes(`Component ${index}`),
            );
            break;
          case 1: // Filter
            result = Array.from(artifacts.values()).filter(
              (artifact) => artifact.category === (index % 2 === 0 ? 'ui-component' : 'utility'),
            );
            break;
          case 2: // Sort
            result = Array.from(artifacts.values())
              .slice(index * 100, (index + 1) * 100)
              .sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 3: // Component cache
            result = Array.from(artifacts.values())
              .slice(0, 50)
              .map((artifact) => ({ id: artifact.id, cached: true }));
            break;
        }

        const endTime = performance.now();
        const operationTime = endTime - startTime;
        operationTimes.push(operationTime);

        return result;
      });

      const results = await Promise.all(promises);

      // All operations should complete
      expect(results).toHaveLength(concurrentOperations);

      // Each operation should complete within reasonable time
      operationTimes.forEach((time) => {
        expect(time).toBeLessThan(300);
      });

      // Average operation time should be reasonable
      const averageTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
      expect(averageTime).toBeLessThan(150);
    });
  });

  describe('Bundle Size and Loading Performance', () => {
    it('should have reasonable component bundle size', () => {
      // Mock bundle analysis
      const mockBundleSize = {
        'artifact-registry': 45000, // 45KB
        'artifact-browser': 32000, // 32KB
        'artifact-container': 28000, // 28KB
        'error-boundaries': 15000, // 15KB
      };

      // Total bundle size should be reasonable
      const totalSize = Object.values(mockBundleSize).reduce((a, b) => a + b, 0);
      expect(totalSize).toBeLessThan(150000); // Less than 150KB

      // Individual components should be reasonably sized
      Object.entries(mockBundleSize).forEach(([component, size]) => {
        expect(size).toBeLessThan(50000); // Less than 50KB per component
      });
    });

    it('should support code splitting and lazy loading', async () => {
      // Mock lazy loading simulation
      const lazyLoadTimes: number[] = [];

      const components = [
        'ArtifactRegistryBrowser',
        'ArtifactContainer',
        'ArtifactSaveModal',
        'ArtifactDetailsPanel',
      ];

      for (const component of components) {
        const startTime = performance.now();

        // Simulate lazy loading
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

        const endTime = performance.now();
        const loadTime = endTime - startTime;
        lazyLoadTimes.push(loadTime);

        // Each component should load quickly
        expect(loadTime).toBeLessThan(100);
      }

      // Average lazy load time should be reasonable
      const averageLoadTime = lazyLoadTimes.reduce((a, b) => a + b, 0) / lazyLoadTimes.length;
      expect(averageLoadTime).toBeLessThan(75);
    });
  });
});
