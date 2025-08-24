import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ArtifactRegistryBrowser from '../ArtifactRegistryBrowser';
import { useArtifactRegistryStore } from '~/store/artifact-registry';
import type { ArtifactMetadata } from 'librechat-data-provider';

// Mock the store
vi.mock('~/store/artifact-registry');
const mockUseArtifactRegistryStore = vi.mocked(useArtifactRegistryStore);

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test data
const mockArtifacts: ArtifactMetadata[] = [
  {
    id: 'artifact-1',
    name: 'User Card Component',
    description: 'A reusable user card component',
    category: 'ui-component',
    tags: ['react', 'ui', 'card'],
    version: '1.0.0',
    author: 'test-user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isPublic: true,
    dependencies: [],
    supabaseConfig: null,
    code: '<div>User Card</div>',
    language: 'tsx',
    framework: 'react',
  },
  {
    id: 'artifact-2',
    name: 'Data Table',
    description: 'A sortable data table component',
    category: 'data-display',
    tags: ['react', 'table', 'sorting'],
    version: '2.1.0',
    author: 'test-user',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    isPublic: true,
    dependencies: [],
    supabaseConfig: null,
    code: '<table>Data Table</table>',
    language: 'tsx',
    framework: 'react',
  },
];

const mockStoreState = {
  artifacts: mockArtifacts,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedTags: [],
  sortBy: 'updatedAt' as const,
  sortOrder: 'desc' as const,
  viewMode: 'grid' as const,
  fetchArtifacts: vi.fn(),
  searchArtifacts: vi.fn(),
  setSearchQuery: vi.fn(),
  setSelectedCategory: vi.fn(),
  setSelectedTags: vi.fn(),
  setSortBy: vi.fn(),
  setSortOrder: vi.fn(),
  setViewMode: vi.fn(),
  clearFilters: vi.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('ArtifactRegistryBrowser', () => {
  beforeEach(() => {
    mockUseArtifactRegistryStore.mockReturnValue(mockStoreState);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the browser with artifacts', () => {
      renderWithProviders(<ArtifactRegistryBrowser />);

      expect(screen.getByText('Artifact Registry')).toBeInTheDocument();
      expect(screen.getByText('User Card Component')).toBeInTheDocument();
      expect(screen.getByText('Data Table')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        isLoading: true,
        artifacts: [],
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render error state', () => {
      const errorMessage = 'Failed to load artifacts';
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        error: new Error(errorMessage),
        artifacts: [],
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render empty state when no artifacts', () => {
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        artifacts: [],
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      expect(screen.getByText(/no artifacts found/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search query on input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const searchInput = screen.getByPlaceholderText(/search artifacts/i);
      await user.type(searchInput, 'user card');

      expect(mockStoreState.setSearchQuery).toHaveBeenCalledWith('user card');
    });

    it('should clear search query', async () => {
      const user = userEvent.setup();
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        searchQuery: 'test query',
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      expect(mockStoreState.setSearchQuery).toHaveBeenCalledWith('');
    });

    it('should trigger search on enter key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const searchInput = screen.getByPlaceholderText(/search artifacts/i);
      await user.type(searchInput, 'user card{enter}');

      expect(mockStoreState.searchArtifacts).toHaveBeenCalled();
    });
  });

  describe('Filtering', () => {
    it('should filter by category', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      await user.click(categorySelect);

      const uiComponentOption = screen.getByRole('option', { name: /ui component/i });
      await user.click(uiComponentOption);

      expect(mockStoreState.setSelectedCategory).toHaveBeenCalledWith('ui-component');
    });

    it('should filter by tags', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const tagFilter = screen.getByRole('button', { name: /react/i });
      await user.click(tagFilter);

      expect(mockStoreState.setSelectedTags).toHaveBeenCalledWith(['react']);
    });

    it('should clear all filters', async () => {
      const user = userEvent.setup();
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        selectedCategory: 'ui-component',
        selectedTags: ['react'],
        searchQuery: 'test',
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      const clearFiltersButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearFiltersButton);

      expect(mockStoreState.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should change sort order', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      await user.click(sortSelect);

      const nameOption = screen.getByRole('option', { name: /name/i });
      await user.click(nameOption);

      expect(mockStoreState.setSortBy).toHaveBeenCalledWith('name');
    });

    it('should toggle sort direction', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const sortDirectionButton = screen.getByRole('button', { name: /sort direction/i });
      await user.click(sortDirectionButton);

      expect(mockStoreState.setSortOrder).toHaveBeenCalledWith('asc');
    });
  });

  describe('View Mode', () => {
    it('should switch to list view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const listViewButton = screen.getByRole('button', { name: /list view/i });
      await user.click(listViewButton);

      expect(mockStoreState.setViewMode).toHaveBeenCalledWith('list');
    });

    it('should switch to grid view', async () => {
      const user = userEvent.setup();
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        viewMode: 'list',
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      const gridViewButton = screen.getByRole('button', { name: /grid view/i });
      await user.click(gridViewButton);

      expect(mockStoreState.setViewMode).toHaveBeenCalledWith('grid');
    });
  });

  describe('Artifact Cards', () => {
    it('should display artifact information correctly', () => {
      renderWithProviders(<ArtifactRegistryBrowser />);

      const userCardArtifact = screen
        .getByText('User Card Component')
        .closest('[data-testid="artifact-card"]');
      expect(userCardArtifact).toBeInTheDocument();

      if (userCardArtifact) {
        expect(
          within(userCardArtifact).getByText('A reusable user card component'),
        ).toBeInTheDocument();
        expect(within(userCardArtifact).getByText('v1.0.0')).toBeInTheDocument();
        expect(within(userCardArtifact).getByText('react')).toBeInTheDocument();
        expect(within(userCardArtifact).getByText('ui')).toBeInTheDocument();
        expect(within(userCardArtifact).getByText('card')).toBeInTheDocument();
      }
    });

    it('should handle artifact selection', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<ArtifactRegistryBrowser onSelect={onSelect} />);

      const userCardArtifact = screen
        .getByText('User Card Component')
        .closest('[data-testid="artifact-card"]');
      if (userCardArtifact) {
        await user.click(userCardArtifact);
        expect(onSelect).toHaveBeenCalledWith(mockArtifacts[0]);
      }
    });

    it('should show preview on hover', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const userCardArtifact = screen
        .getByText('User Card Component')
        .closest('[data-testid="artifact-card"]');
      if (userCardArtifact) {
        await user.hover(userCardArtifact);

        await waitFor(() => {
          expect(screen.getByTestId('artifact-preview')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Pagination', () => {
    it('should handle pagination when many artifacts', () => {
      const manyArtifacts = Array.from({ length: 25 }, (_, i) => ({
        ...mockArtifacts[0],
        id: `artifact-${i}`,
        name: `Artifact ${i}`,
      }));

      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        artifacts: manyArtifacts,
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<ArtifactRegistryBrowser />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Artifact Registry Browser');
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /filters/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const searchInput = screen.getByPlaceholderText(/search artifacts/i);
      searchInput.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByRole('combobox', { name: /category/i })).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        error: new Error('Network error'),
        artifacts: [],
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should retry failed requests', async () => {
      const user = userEvent.setup();
      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        error: new Error('Network error'),
        artifacts: [],
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockStoreState.fetchArtifacts).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should debounce search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ArtifactRegistryBrowser />);

      const searchInput = screen.getByPlaceholderText(/search artifacts/i);

      // Type quickly
      await user.type(searchInput, 'test');

      // Should not call search immediately
      expect(mockStoreState.searchArtifacts).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockStoreState.searchArtifacts).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it('should virtualize large lists', () => {
      const manyArtifacts = Array.from({ length: 1000 }, (_, i) => ({
        ...mockArtifacts[0],
        id: `artifact-${i}`,
        name: `Artifact ${i}`,
      }));

      mockUseArtifactRegistryStore.mockReturnValue({
        ...mockStoreState,
        artifacts: manyArtifacts,
      });

      renderWithProviders(<ArtifactRegistryBrowser />);

      // Should not render all 1000 items at once
      const renderedItems = screen.getAllByTestId('artifact-card');
      expect(renderedItems.length).toBeLessThan(100);
    });
  });
});
