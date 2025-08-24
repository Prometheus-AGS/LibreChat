import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  ArtifactMetadata,
  ArtifactEmbed,
  ComposedArtifact,
  NavigationItem,
  DynamicNavigation,
  ShadcnVersion,
  ArtifactSupabaseConfig,
  ComponentFetchResponse,
} from 'librechat-data-provider';

// Store State Interface
interface ArtifactRegistryState {
  // Registry Management
  artifacts: Map<string, ArtifactMetadata>;
  loadedComponents: Map<string, ComponentFetchResponse>;

  // Composition & Focus Management
  focusedArtifactId: string | null;
  composedArtifacts: Map<string, ComposedArtifact>;
  artifactEmbeds: Map<string, ArtifactEmbed[]>;

  // Navigation Management
  dynamicNavigation: DynamicNavigation | null;
  navigationItems: NavigationItem[];

  // shadcn-ui Detection
  shadcnVersion: ShadcnVersion | null;

  // Loading States
  isLoadingRegistry: boolean;
  isLoadingComponent: boolean;
  isLoadingNavigation: boolean;

  // Error States
  registryError: string | null;
  componentError: string | null;
  navigationError: string | null;
}

// Store Actions Interface
interface ArtifactRegistryActions {
  // Registry Actions
  loadArtifactRegistry: () => Promise<void>;
  searchArtifacts: (query: string, filters?: any) => Promise<ArtifactMetadata[]>;

  // Component Management
  fetchComponent: (id: string, version?: string) => Promise<ComponentFetchResponse>;
  cacheComponent: (id: string, component: ComponentFetchResponse) => void;

  // Focus Management (LLM Containment)
  setFocusedArtifact: (id: string | null) => void;
  canModifyArtifact: (id: string) => boolean;

  // Composition Management
  createComposedArtifact: (artifact: ComposedArtifact) => void;
  updateComposedArtifact: (id: string, updates: Partial<ComposedArtifact>) => void;
  addArtifactEmbed: (parentId: string, embed: ArtifactEmbed) => void;
  removeArtifactEmbed: (parentId: string, embedId: string) => void;

  // Navigation Management
  loadDynamicNavigation: (supabaseConfig: ArtifactSupabaseConfig) => Promise<void>;
  refreshNavigation: () => Promise<void>;

  // shadcn-ui Detection
  detectShadcnVersion: () => Promise<ShadcnVersion | null>;

  // Error Management
  clearErrors: () => void;
  setError: (type: 'registry' | 'component' | 'navigation', error: string) => void;
}

// Combined Store Type
type ArtifactRegistryStore = ArtifactRegistryState & ArtifactRegistryActions;

// Create the Zustand Store
export const useArtifactRegistryStore = create<ArtifactRegistryStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
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

        // Registry Actions
        loadArtifactRegistry: async () => {
          set({ isLoadingRegistry: true, registryError: null });
          try {
            const response = await fetch('/api/artifacts/registry');
            if (!response.ok) throw new Error('Failed to load artifact registry');

            const data = await response.json();
            const artifactsMap = new Map();
            data.artifacts.forEach((artifact: ArtifactMetadata) => {
              artifactsMap.set(artifact.id, artifact);
            });

            set({ artifacts: artifactsMap, isLoadingRegistry: false });
          } catch (error) {
            set({
              registryError: error instanceof Error ? error.message : 'Unknown error',
              isLoadingRegistry: false,
            });
          }
        },

        searchArtifacts: async (query: string, filters = {}) => {
          try {
            const params = new URLSearchParams({ query, ...filters });
            const response = await fetch(`/api/artifacts/search?${params}`);
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            return data.artifacts;
          } catch (error) {
            get().setError('registry', error instanceof Error ? error.message : 'Search failed');
            return [];
          }
        },

        // Component Management
        fetchComponent: async (id: string, version = 'latest') => {
          const cacheKey = `${id}@${version}`;
          const cached = get().loadedComponents.get(cacheKey);
          if (cached) return cached;

          set({ isLoadingComponent: true, componentError: null });
          try {
            const response = await fetch('/api/artifacts/component', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, version, includeDependencies: true }),
            });

            if (!response.ok) throw new Error('Failed to fetch component');

            const component: ComponentFetchResponse = await response.json();
            get().cacheComponent(cacheKey, component);

            set({ isLoadingComponent: false });
            return component;
          } catch (error) {
            set({
              componentError: error instanceof Error ? error.message : 'Unknown error',
              isLoadingComponent: false,
            });
            throw error;
          }
        },

        cacheComponent: (id: string, component: ComponentFetchResponse) => {
          set((state) => {
            const newComponents = new Map(state.loadedComponents);
            newComponents.set(id, component);
            return { loadedComponents: newComponents };
          });
        },

        // Focus Management (LLM Containment)
        setFocusedArtifact: (id: string | null) => {
          set({ focusedArtifactId: id });
        },

        canModifyArtifact: (id: string) => {
          const { focusedArtifactId } = get();
          // Only allow modification of the focused artifact or if no artifact is focused
          return focusedArtifactId === null || focusedArtifactId === id;
        },

        // Composition Management
        createComposedArtifact: (artifact: ComposedArtifact) => {
          set((state) => {
            const newComposed = new Map(state.composedArtifacts);
            newComposed.set(artifact.id, artifact);
            return { composedArtifacts: newComposed };
          });
        },

        updateComposedArtifact: (id: string, updates: Partial<ComposedArtifact>) => {
          set((state) => {
            const newComposed = new Map(state.composedArtifacts);
            const existing = newComposed.get(id);
            if (existing) {
              newComposed.set(id, { ...existing, ...updates });
            }
            return { composedArtifacts: newComposed };
          });
        },

        addArtifactEmbed: (parentId: string, embed: ArtifactEmbed) => {
          set((state) => {
            const newEmbeds = new Map(state.artifactEmbeds);
            const existing = newEmbeds.get(parentId) || [];
            newEmbeds.set(parentId, [...existing, embed]);
            return { artifactEmbeds: newEmbeds };
          });
        },

        removeArtifactEmbed: (parentId: string, embedId: string) => {
          set((state) => {
            const newEmbeds = new Map(state.artifactEmbeds);
            const existing = newEmbeds.get(parentId) || [];
            newEmbeds.set(
              parentId,
              existing.filter((embed: ArtifactEmbed) => embed.id !== embedId),
            );
            return { artifactEmbeds: newEmbeds };
          });
        },

        // Navigation Management
        loadDynamicNavigation: async (supabaseConfig: ArtifactSupabaseConfig) => {
          set({ isLoadingNavigation: true, navigationError: null });
          try {
            const response = await fetch('/api/artifacts/navigation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ supabaseConfig }),
            });

            if (!response.ok) throw new Error('Failed to load navigation');

            const navigation: DynamicNavigation = await response.json();
            set({
              dynamicNavigation: navigation,
              navigationItems: navigation.items,
              isLoadingNavigation: false,
            });
          } catch (error) {
            set({
              navigationError: error instanceof Error ? error.message : 'Unknown error',
              isLoadingNavigation: false,
            });
          }
        },

        refreshNavigation: async () => {
          const { dynamicNavigation } = get();
          if (dynamicNavigation?.supabaseConfig) {
            await get().loadDynamicNavigation(dynamicNavigation.supabaseConfig);
          }
        },

        // shadcn-ui Detection
        detectShadcnVersion: async () => {
          try {
            const response = await fetch('/api/artifacts/detect-shadcn');
            if (!response.ok) throw new Error('Failed to detect shadcn version');

            const version: ShadcnVersion = await response.json();
            set({ shadcnVersion: version });
            return version;
          } catch (error) {
            console.error('Failed to detect shadcn version:', error);
            return null;
          }
        },

        // Error Management
        clearErrors: () => {
          set({
            registryError: null,
            componentError: null,
            navigationError: null,
          });
        },

        setError: (type: 'registry' | 'component' | 'navigation', error: string) => {
          set((state) => ({
            ...state,
            [`${type}Error`]: error,
          }));
        },
      }),
      {
        name: 'artifact-registry-store',
        partialize: (state) => ({
          // Only persist certain parts of the state
          artifacts: Array.from(state.artifacts.entries()),
          loadedComponents: Array.from(state.loadedComponents.entries()),
          shadcnVersion: state.shadcnVersion,
          navigationItems: state.navigationItems,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert arrays back to Maps after rehydration
            state.artifacts = new Map(state.artifacts as any);
            state.loadedComponents = new Map(state.loadedComponents as any);
            state.composedArtifacts = new Map();
            state.artifactEmbeds = new Map();
          }
        },
      },
    ),
    { name: 'artifact-registry-store' },
  ),
);

// Selector hooks for better performance
export const useArtifactRegistry = () => useArtifactRegistryStore((state) => state.artifacts);
export const useFocusedArtifact = () =>
  useArtifactRegistryStore((state) => state.focusedArtifactId);
export const useNavigationItems = () => useArtifactRegistryStore((state) => state.navigationItems);
export const useShadcnVersion = () => useArtifactRegistryStore((state) => state.shadcnVersion);
export const useRegistryLoading = () =>
  useArtifactRegistryStore((state) => state.isLoadingRegistry);
export const useRegistryErrors = () =>
  useArtifactRegistryStore((state) => ({
    registryError: state.registryError,
    componentError: state.componentError,
    navigationError: state.navigationError,
  }));
