import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArtifactRegistryStore } from '../artifact-registry';
import type { ArtifactMetadata } from 'librechat-data-provider';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test data
const mockArtifact: ArtifactMetadata = {
  id: 'test-artifact-1',
  name: 'Test Component',
  description: 'A test component',
  category: 'ui-component',
  tags: ['react', 'test'],
  version: '1.0.0',
  author: 'test-user',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isPublic: true,
  dependencies: [],
  supabaseConfig: null,
  code: '<div>Test Component</div>',
  language: 'tsx',
  framework: 'react',
};

const mockApiResponse = {
  success: true,
  data: {
    artifacts: [mockArtifact],
    total: 1,
    page: 1,
    limit: 20,
  },
};

describe('useArtifactRegistryStore', () => {
  beforeEach(() => {
    // Reset store state
    useArtifactRegistryStore.getState().reset();
    mockFetch.mockClear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      expect(result.current.artifacts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.sortBy).toBe('updatedAt');
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.focusedArtifactId).toBe(null);
      expect(result.current.componentCache).toEqual(new Map());
    });
  });

  describe('Artifact Management', () => {
    it('should fetch artifacts successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      await act(async () => {
        await result.current.fetchArtifacts();
      });

      expect(result.current.artifacts).toEqual([mockArtifact]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith('/api/artifacts');
    });

    it('should handle fetch artifacts error', async () => {
      const errorMessage = 'Network error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useArtifactRegistryStore());

      await act(async () => {
        await result.current.fetchArtifacts();
      });

      expect(result.current.artifacts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error?.message).toBe(errorMessage);
    });

    it('should save artifact successfully', async () => {
      const savedArtifact = { ...mockArtifact, id: 'saved-artifact' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: savedArtifact }),
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      await act(async () => {
        await result.current.saveArtifact(mockArtifact);
      });

      expect(result.current.artifacts).toContain(savedArtifact);
      expect(mockFetch).toHaveBeenCalledWith('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockArtifact),
      });
    });

    it('should update artifact successfully', async () => {
      const updatedArtifact = { ...mockArtifact, name: 'Updated Component' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedArtifact }),
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      // Add initial artifact
      act(() => {
        result.current.setArtifacts([mockArtifact]);
      });

      await act(async () => {
        await result.current.updateArtifact(mockArtifact.id, { name: 'Updated Component' });
      });

      expect(result.current.artifacts[0].name).toBe('Updated Component');
      expect(mockFetch).toHaveBeenCalledWith(`/api/artifacts/${mockArtifact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Component' }),
      });
    });

    it('should delete artifact successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      // Add initial artifact
      act(() => {
        result.current.setArtifacts([mockArtifact]);
      });

      await act(async () => {
        await result.current.deleteArtifact(mockArtifact.id);
      });

      expect(result.current.artifacts).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(`/api/artifacts/${mockArtifact.id}`, {
        method: 'DELETE',
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should search artifacts', async () => {
      const searchQuery = 'test component';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      await act(async () => {
        await result.current.searchArtifacts(searchQuery);
      });

      expect(result.current.searchQuery).toBe(searchQuery);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/artifacts/search?q=${encodeURIComponent(searchQuery)}`,
      );
    });

    it('should set search query', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setSearchQuery('new query');
      });

      expect(result.current.searchQuery).toBe('new query');
    });

    it('should set selected category', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setSelectedCategory('ui-component');
      });

      expect(result.current.selectedCategory).toBe('ui-component');
    });

    it('should set selected tags', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setSelectedTags(['react', 'typescript']);
      });

      expect(result.current.selectedTags).toEqual(['react', 'typescript']);
    });

    it('should clear filters', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      // Set some filters
      act(() => {
        result.current.setSearchQuery('test');
        result.current.setSelectedCategory('ui-component');
        result.current.setSelectedTags(['react']);
      });

      // Clear filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.selectedTags).toEqual([]);
    });
  });

  describe('Sorting', () => {
    it('should set sort by', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setSortBy('name');
      });

      expect(result.current.sortBy).toBe('name');
    });

    it('should set sort order', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setSortOrder('asc');
      });

      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('View Mode', () => {
    it('should set view mode', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');
    });
  });

  describe('Focus Management', () => {
    it('should set focused artifact', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setFocusedArtifact('artifact-1');
      });

      expect(result.current.focusedArtifactId).toBe('artifact-1');
    });

    it('should clear focused artifact', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      // Set focused artifact first
      act(() => {
        result.current.setFocusedArtifact('artifact-1');
      });

      // Clear focus
      act(() => {
        result.current.clearFocus();
      });

      expect(result.current.focusedArtifactId).toBe(null);
    });

    it('should check if artifact is focused', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      act(() => {
        result.current.setFocusedArtifact('artifact-1');
      });

      expect(result.current.isArtifactFocused('artifact-1')).toBe(true);
      expect(result.current.isArtifactFocused('artifact-2')).toBe(false);
    });
  });

  describe('Component Caching', () => {
    it('should cache component', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());
      const mockComponent = () => null;

      act(() => {
        result.current.cacheComponent('component-1', mockComponent);
      });

      expect(result.current.componentCache.get('component-1')).toBe(mockComponent);
    });

    it('should get cached component', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());
      const mockComponent = () => null;

      act(() => {
        result.current.cacheComponent('component-1', mockComponent);
      });

      expect(result.current.getCachedComponent('component-1')).toBe(mockComponent);
      expect(result.current.getCachedComponent('component-2')).toBe(null);
    });

    it('should clear component cache', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());
      const mockComponent = () => null;

      act(() => {
        result.current.cacheComponent('component-1', mockComponent);
        result.current.clearComponentCache();
      });

      expect(result.current.componentCache.size).toBe(0);
    });
  });

  describe('Supabase Integration', () => {
    it('should fetch navigation items', async () => {
      const mockNavItems = [
        { id: '1', label: 'Dashboard', path: '/dashboard', order: 1 },
        { id: '2', label: 'Settings', path: '/settings', order: 2 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockNavItems }),
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      await act(async () => {
        await result.current.fetchNavigationItems();
      });

      expect(result.current.navigationItems).toEqual(mockNavItems);
      expect(mockFetch).toHaveBeenCalledWith('/api/artifacts/navigation');
    });

    it('should test supabase connection', async () => {
      const mockConnectionResult = { connected: true, latency: 50 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockConnectionResult }),
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      let connectionResult;
      await act(async () => {
        connectionResult = await result.current.testSupabaseConnection();
      });

      expect(connectionResult).toEqual(mockConnectionResult);
      expect(mockFetch).toHaveBeenCalledWith('/api/artifacts/test-connection');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useArtifactRegistryStore());

      await act(async () => {
        await result.current.fetchArtifacts();
      });

      expect(result.current.error?.message).toContain('500');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useArtifactRegistryStore());

      await act(async () => {
        await result.current.fetchArtifacts();
      });

      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should reset store state', () => {
      const { result } = renderHook(() => useArtifactRegistryStore());

      // Set some state
      act(() => {
        result.current.setArtifacts([mockArtifact]);
        result.current.setSearchQuery('test');
        result.current.setSelectedCategory('ui-component');
        result.current.setFocusedArtifact('artifact-1');
      });

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.artifacts).toEqual([]);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.focusedArtifactId).toBe(null);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent fetch operations', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockFetch.mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useArtifactRegistryStore());

      // Start two concurrent operations
      const firstOperation = result.current.fetchArtifacts();
      const secondOperation = result.current.fetchArtifacts();

      // Resolve second operation first
      resolveSecond({
        ok: true,
        json: async () => ({ success: true, data: { artifacts: [mockArtifact], total: 1 } }),
      });

      // Resolve first operation
      resolveFirst({
        ok: true,
        json: async () => ({ success: true, data: { artifacts: [], total: 0 } }),
      });

      await act(async () => {
        await Promise.all([firstOperation, secondOperation]);
      });

      // Should have the result from the second (more recent) operation
      expect(result.current.artifacts).toEqual([mockArtifact]);
    });
  });
});
