import React, { useState, useEffect, useMemo } from 'react';
import { Search, Grid, List, Eye, Download, Star, Clock, User, Tag } from 'lucide-react';
import { useArtifactRegistryStore } from '~/store/artifact-registry';
import type { ArtifactMetadata } from 'librechat-data-provider';

interface ArtifactRegistryBrowserProps {
  onSelectArtifact?: (artifact: ArtifactMetadata) => void;
  onPreviewArtifact?: (artifact: ArtifactMetadata) => void;
  mode?: 'browser' | 'selector';
  className?: string;
}

export const ArtifactRegistryBrowser: React.FC<ArtifactRegistryBrowserProps> = ({
  onSelectArtifact,
  onPreviewArtifact,
  mode = 'browser',
  className = '',
}) => {
  const { artifacts, searchArtifacts, loadArtifactRegistry, isLoadingRegistry, registryError } =
    useArtifactRegistryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'downloads' | 'rating'>(
    'updated',
  );
  const [searchResults, setSearchResults] = useState<ArtifactMetadata[]>([]);

  // Categories for filtering
  const categories = [
    'all',
    'ui-components',
    'data-visualization',
    'forms',
    'navigation',
    'layout',
    'utilities',
    'integrations',
  ];

  // Available tags (would typically come from API)
  const availableTags = [
    'react',
    'typescript',
    'tailwind',
    'shadcn',
    'supabase',
    'charts',
    'forms',
    'tables',
    'modals',
    'buttons',
    'responsive',
    'accessible',
    'dark-mode',
  ];

  // Load initial artifacts
  useEffect(() => {
    loadArtifactRegistry();
  }, [loadArtifactRegistry]);

  // Convert artifacts Map to array for display
  const artifactsArray = useMemo(() => {
    return Array.from(artifacts.values());
  }, [artifacts]);

  // Search and filter artifacts
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        const filters = {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        };
        const results = await searchArtifacts(searchQuery, filters);
        setSearchResults(results);
      } else {
        // Use all artifacts when no search query
        setSearchResults(artifactsArray);
      }
    };

    performSearch();
  }, [searchQuery, selectedCategory, selectedTags, searchArtifacts, artifactsArray]);

  // Filter artifacts by category and tags when no search query
  const filteredArtifacts = useMemo(() => {
    let filtered = searchQuery.trim() ? searchResults : artifactsArray;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((artifact) => artifact.category === selectedCategory);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((artifact) =>
        artifact.tags?.some((tag) => selectedTags.includes(tag)),
      );
    }

    return filtered;
  }, [searchQuery, searchResults, artifactsArray, selectedCategory, selectedTags]);

  // Sort artifacts
  const sortedArtifacts = useMemo(() => {
    return [...filteredArtifacts].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'downloads':
          return (b.analytics?.downloads || 0) - (a.analytics?.downloads || 0);
        case 'rating':
          return (b.analytics?.averageRating || 0) - (a.analytics?.averageRating || 0);
        default:
          return 0;
      }
    });
  }, [filteredArtifacts, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const ArtifactCard: React.FC<{ artifact: ArtifactMetadata }> = ({ artifact }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">{artifact.name}</h3>
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {artifact.description}
          </p>
        </div>
        <div className="ml-2 flex items-center space-x-1">
          {artifact.analytics?.averageRating && (
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-xs">{artifact.analytics.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {artifact.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            <Tag className="mr-1 h-3 w-3" />
            {tag}
          </span>
        ))}
        {artifact.tags && artifact.tags.length > 3 && (
          <span className="text-xs text-gray-500">+{artifact.tags.length - 3} more</span>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <User className="mr-1 h-3 w-3" />
          {artifact.author}
        </div>
        <div className="flex items-center">
          <Clock className="mr-1 h-3 w-3" />
          {formatDate(artifact.updatedAt)}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {artifact.analytics?.downloads && (
            <div className="flex items-center">
              <Download className="mr-1 h-3 w-3" />
              {artifact.analytics.downloads.toLocaleString()}
            </div>
          )}
          <span>v{artifact.version}</span>
        </div>
        <div className="flex items-center space-x-2">
          {onPreviewArtifact && (
            <button
              onClick={() => onPreviewArtifact(artifact)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onSelectArtifact && (
            <button
              onClick={() => onSelectArtifact(artifact)}
              className="rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
            >
              {mode === 'selector' ? 'Select' : 'Use'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const ArtifactListItem: React.FC<{ artifact: ArtifactMetadata }> = ({ artifact }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{artifact.name}</h3>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-700">
              v{artifact.version}
            </span>
            {artifact.analytics?.averageRating && (
              <div className="flex items-center text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1 text-xs">{artifact.analytics.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{artifact.description}</p>
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <User className="mr-1 h-3 w-3" />
              {artifact.author}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {formatDate(artifact.updatedAt)}
            </div>
            {artifact.analytics?.downloads && (
              <div className="flex items-center">
                <Download className="mr-1 h-3 w-3" />
                {artifact.analytics.downloads.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center space-x-2">
          {onPreviewArtifact && (
            <button
              onClick={() => onPreviewArtifact(artifact)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onSelectArtifact && (
            <button
              onClick={() => onSelectArtifact(artifact)}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
            >
              {mode === 'selector' ? 'Select' : 'Use'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`artifact-registry-browser ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Artifact Registry
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover and use community-created components and tools
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search artifacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            aria-label="Filter by category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all'
                  ? 'All Categories'
                  : category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            aria-label="Sort by"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="name">Name</option>
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoadingRegistry && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {registryError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">Error loading artifacts: {registryError}</p>
        </div>
      )}

      {/* Results */}
      {!isLoadingRegistry && !registryError && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sortedArtifacts.length} artifact{sortedArtifacts.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {sortedArtifacts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No artifacts found matching your criteria.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-3'
              }
            >
              {sortedArtifacts.map((artifact) =>
                viewMode === 'grid' ? (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ) : (
                  <ArtifactListItem key={artifact.id} artifact={artifact} />
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArtifactRegistryBrowser;
