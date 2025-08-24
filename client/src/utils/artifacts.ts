import dedent from 'dedent';
import { shadcnComponents } from 'librechat-data-provider';
import type {
  SandpackProviderProps,
  SandpackPredefinedTemplate,
} from '@codesandbox/sandpack-react';

// Debug logging for dependency validation
const validateDependencies = (deps: Record<string, string>) => {
  const requiredRadixPackages = [
    '@radix-ui/react-slot',
    '@radix-ui/react-dialog',
    '@radix-ui/react-tabs',
    '@radix-ui/react-avatar',
  ];

  const missing = requiredRadixPackages.filter((pkg) => !deps[pkg]);
  if (missing.length > 0) {
    console.warn('Missing Radix UI dependencies:', missing);
  } else {
    console.log('✅ All required Radix UI dependencies are present');
  }

  return deps;
};

// Validate shadcn components are available
const validateShadcnComponents = () => {
  const requiredComponents = ['dialog', 'utils', 'button', 'card', 'tabs'];
  const missing = requiredComponents.filter((comp) => !shadcnComponents[comp]);

  if (missing.length > 0) {
    console.error('Missing shadcn components:', missing);
  } else {
    console.log('✅ All required shadcn components are available');
  }

  return shadcnComponents;
};

const artifactFilename = {
  'application/vnd.mermaid': 'App.tsx',
  'application/vnd.react': 'App.tsx',
  'text/html': 'index.html',
  'application/vnd.code-html': 'index.html',
  default: 'index.html',
  // 'css': 'css',
  // 'javascript': 'js',
  // 'typescript': 'ts',
  // 'jsx': 'jsx',
  // 'tsx': 'tsx',
};

const artifactTemplate: Record<
  keyof typeof artifactFilename,
  SandpackPredefinedTemplate | undefined
> = {
  'text/html': 'static',
  'application/vnd.react': 'react-ts',
  'application/vnd.mermaid': 'react-ts',
  'application/vnd.code-html': 'static',
  default: 'static',
  // 'css': 'css',
  // 'javascript': 'js',
  // 'typescript': 'ts',
  // 'jsx': 'jsx',
  // 'tsx': 'tsx',
};

export function getFileExtension(language?: string): string {
  switch (language) {
    case 'application/vnd.react':
      return 'tsx';
    case 'application/vnd.mermaid':
      return 'mermaid';
    case 'text/html':
      return 'html';
    // case 'jsx':
    //   return 'jsx';
    // case 'tsx':
    //   return 'tsx';
    // case 'html':
    //   return 'html';
    // case 'css':
    //   return 'css';
    default:
      return 'txt';
  }
}

export function getKey(type: string, language?: string): string {
  return `${type}${(language?.length ?? 0) > 0 ? `-${language}` : ''}`;
}

export function getArtifactFilename(type: string, language?: string): string {
  const key = getKey(type, language);
  return artifactFilename[key] ?? artifactFilename.default;
}

export function getTemplate(type: string, language?: string): SandpackPredefinedTemplate {
  const key = getKey(type, language);
  return artifactTemplate[key] ?? (artifactTemplate.default as SandpackPredefinedTemplate);
}

const standardDependencies = {
  three: '^0.167.1',
  'lucide-react': '^0.394.0',
  'react-router-dom': '^6.11.2',
  'class-variance-authority': '^0.6.0',
  clsx: '^1.2.1',
  'date-fns': '^3.3.1',
  'tailwind-merge': '^1.9.1',
  'tailwindcss-animate': '^1.0.5',
  recharts: '2.12.7',
  '@radix-ui/react-accordion': '^1.1.2',
  '@radix-ui/react-alert-dialog': '^1.0.2',
  '@radix-ui/react-aspect-ratio': '^1.1.0',
  '@radix-ui/react-avatar': '^1.1.0',
  '@radix-ui/react-checkbox': '^1.0.3',
  '@radix-ui/react-collapsible': '^1.0.3',
  '@radix-ui/react-dialog': '^1.0.2',
  '@radix-ui/react-dropdown-menu': '^2.1.1',
  '@radix-ui/react-hover-card': '^1.0.5',
  '@radix-ui/react-label': '^2.0.0',
  '@radix-ui/react-menubar': '^1.1.1',
  '@radix-ui/react-navigation-menu': '^1.2.0',
  '@radix-ui/react-popover': '^1.0.7',
  '@radix-ui/react-progress': '^1.1.0',
  '@radix-ui/react-radio-group': '^1.1.3',
  '@radix-ui/react-select': '^2.0.0',
  '@radix-ui/react-separator': '^1.0.3',
  '@radix-ui/react-slider': '^1.1.1',
  '@radix-ui/react-switch': '^1.0.3',
  '@radix-ui/react-tabs': '^1.0.3',
  '@radix-ui/react-toast': '^1.1.5',
  '@radix-ui/react-slot': '^1.1.0',
  '@radix-ui/react-toggle': '^1.1.0',
  '@radix-ui/react-toggle-group': '^1.1.0',
  'embla-carousel-react': '^8.2.0',
  'react-day-picker': '^9.0.8',
  'dat.gui': '^0.7.9',
  vaul: '^0.9.1',
  '@supabase/supabase-js': '^2.39.0',
  zustand: '^4.4.7',
  // Canary component dependencies
  cmdk: '^1.0.0',
  // Additional Radix UI primitives for canary components
  '@radix-ui/react-tooltip': '^1.1.2',
  '@radix-ui/react-scroll-area': '^1.1.0',
  '@radix-ui/react-context-menu': '^2.2.1',
  '@radix-ui/react-toolbar': '^1.1.0',
  '@radix-ui/react-visually-hidden': '^1.1.0',
  // Chart component dependencies (already included recharts above)
  // Sidebar component dependencies (uses existing Radix primitives)
  // Command palette dependencies (cmdk already included)
  // Breadcrumb navigation dependencies (uses existing Radix primitives)
};

const mermaidDependencies = Object.assign(
  {
    mermaid: '^11.4.1',
    'react-zoom-pan-pinch': '^3.6.1',
  },
  standardDependencies,
);

const dependenciesMap: Record<keyof typeof artifactFilename, object> = {
  'application/vnd.mermaid': mermaidDependencies,
  'application/vnd.react': standardDependencies,
  'text/html': standardDependencies,
  'application/vnd.code-html': standardDependencies,
  default: standardDependencies,
};

export function getDependencies(type: string): Record<string, string> {
  const deps = dependenciesMap[type] ?? standardDependencies;
  return validateDependencies(deps);
}

export function getProps(type: string): Partial<SandpackProviderProps> {
  // Validate shadcn components are available
  validateShadcnComponents();

  const dependencies = getDependencies(type);

  console.log(`🔧 Artifact dependencies for type "${type}":`, {
    totalDependencies: Object.keys(dependencies).length,
    radixPackages: Object.keys(dependencies).filter((pkg) => pkg.startsWith('@radix-ui')).length,
    hasSupabase: !!dependencies['@supabase/supabase-js'],
    hasZustand: !!dependencies['zustand'],
  });

  return {
    customSetup: {
      dependencies,
    },
  };
}

export const sharedOptions: SandpackProviderProps['options'] = {
  externalResources: ['https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css'],
};

export const sharedFiles = {
  '/lib/utils.ts': shadcnComponents.utils,
  '/components/ui/accordion.tsx': shadcnComponents.accordian,
  '/components/ui/alert-dialog.tsx': shadcnComponents.alertDialog,
  '/components/ui/alert.tsx': shadcnComponents.alert,
  '/components/ui/avatar.tsx': shadcnComponents.avatar,
  '/components/ui/badge.tsx': shadcnComponents.badge,
  '/components/ui/breadcrumb.tsx': shadcnComponents.breadcrumb,
  '/components/ui/button.tsx': shadcnComponents.button,
  '/components/ui/calendar.tsx': shadcnComponents.calendar,
  '/components/ui/card.tsx': shadcnComponents.card,
  '/components/ui/carousel.tsx': shadcnComponents.carousel,
  '/components/ui/checkbox.tsx': shadcnComponents.checkbox,
  '/components/ui/collapsible.tsx': shadcnComponents.collapsible,
  '/components/ui/dialog.tsx': shadcnComponents.dialog,
  '/components/ui/drawer.tsx': shadcnComponents.drawer,
  '/components/ui/dropdown-menu.tsx': shadcnComponents.dropdownMenu,
  '/components/ui/input.tsx': shadcnComponents.input,
  '/components/ui/label.tsx': shadcnComponents.label,
  '/components/ui/menubar.tsx': shadcnComponents.menuBar,
  '/components/ui/navigation-menu.tsx': shadcnComponents.navigationMenu,
  '/components/ui/pagination.tsx': shadcnComponents.pagination,
  '/components/ui/popover.tsx': shadcnComponents.popover,
  '/components/ui/progress.tsx': shadcnComponents.progress,
  '/components/ui/radio-group.tsx': shadcnComponents.radioGroup,
  '/components/ui/select.tsx': shadcnComponents.select,
  '/components/ui/separator.tsx': shadcnComponents.separator,
  '/components/ui/skeleton.tsx': shadcnComponents.skeleton,
  '/components/ui/slider.tsx': shadcnComponents.slider,
  '/components/ui/switch.tsx': shadcnComponents.switchComponent,
  '/components/ui/table.tsx': shadcnComponents.table,
  '/components/ui/tabs.tsx': shadcnComponents.tabs,
  '/components/ui/textarea.tsx': shadcnComponents.textarea,
  '/components/ui/toast.tsx': shadcnComponents.toast,
  '/components/ui/toaster.tsx': shadcnComponents.toaster,
  '/components/ui/toggle-group.tsx': shadcnComponents.toggleGroup,
  '/components/ui/toggle.tsx': shadcnComponents.toggle,
  '/components/ui/tooltip.tsx': shadcnComponents.tooltip,
  '/components/ui/use-toast.tsx': shadcnComponents.useToast,
  // Canary Components
  '/components/ui/sidebar.tsx': shadcnComponents.sidebar || '',
  '/components/ui/command.tsx': shadcnComponents.command || '',
  '/components/ui/breadcrumb-nav.tsx': shadcnComponents.breadcrumbNav || '',
  '/components/ui/chart.tsx': shadcnComponents.chart || '',
  '/public/index.html': dedent`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `,
  '/lib/supabase.ts': dedent`
    import { createClient } from '@supabase/supabase-js';

    // Supabase configuration interface
    export interface SupabaseConfig {
      url: string;
      anonKey: string;
      serviceKey?: string;
    }

    // Global configuration - will be injected by LibreChat
    declare global {
      interface Window {
        __LIBRECHAT_SUPABASE_CONFIG__?: SupabaseConfig;
      }
    }

    /**
     * Creates a Supabase client with the configured credentials
     * This function will be automatically configured by LibreChat based on your artifact settings
     */
    export function createSupabase(options?: { useServiceKey?: boolean }) {
      const config = window.__LIBRECHAT_SUPABASE_CONFIG__;
      
      if (!config) {
        throw new Error('Supabase is not configured for this artifact. Please enable Supabase in the artifact settings.');
      }

      if (!config.url || !config.anonKey) {
        throw new Error('Supabase configuration is incomplete. Please check your artifact settings.');
      }

      const key = options?.useServiceKey && config.serviceKey ? config.serviceKey : config.anonKey;
      
      return createClient(config.url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
    }

    /**
     * Hook to get Supabase client in React components
     */
    export function useSupabase(options?: { useServiceKey?: boolean }) {
      return createSupabase(options);
    }

    /**
     * Check if Supabase is configured for this artifact
     */
    export function isSupabaseConfigured(): boolean {
      const config = window.__LIBRECHAT_SUPABASE_CONFIG__;
      return !!(config?.url && config?.anonKey);
    }

    /**
     * Common Supabase utilities
     */
    export const supabaseUtils = {
      /**
       * Handle Supabase errors with user-friendly messages
       */
      handleError: (error: any) => {
        console.error('Supabase error:', error);
        
        if (error?.message) {
          return error.message;
        }
        
        if (error?.error_description) {
          return error.error_description;
        }
        
        return 'An unexpected error occurred';
      },

      /**
       * Format Supabase timestamp for display
       */
      formatTimestamp: (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
      },

      /**
       * Create a real-time subscription with error handling
       */
      createSubscription: (supabase: ReturnType<typeof createSupabase>, table: string, callback: (payload: any) => void) => {
        return supabase
          .channel(\`public:\${table}\`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(\`Subscribed to \${table} changes\`);
            } else if (status === 'CHANNEL_ERROR') {
              console.error(\`Error subscribing to \${table} changes\`);
            }
          });
      }
    };
  `,
  '/lib/stores.ts': dedent`
    import { create } from 'zustand';
    import { devtools, persist } from 'zustand/middleware';
    import { useState, useCallback } from 'react';

    /**
     * Generic store interface for common patterns
     */
    export interface BaseStore<T> {
      items: T[];
      loading: boolean;
      error: string | null;
      setItems: (items: T[]) => void;
      addItem: (item: T) => void;
      updateItem: (id: string | number, updates: Partial<T>) => void;
      removeItem: (id: string | number) => void;
      setLoading: (loading: boolean) => void;
      setError: (error: string | null) => void;
      reset: () => void;
    }

    /**
     * Creates a generic CRUD store with Zustand
     */
    export function createCrudStore<T extends { id: string | number }>(name: string) {
      return create<BaseStore<T>>()(
        devtools(
          persist(
            (set, get) => ({
              items: [],
              loading: false,
              error: null,
              
              setItems: (items) => set({ items }, false, 'setItems'),
              
              addItem: (item) => set(
                (state) => ({ items: [...state.items, item] }),
                false,
                'addItem'
              ),
              
              updateItem: (id, updates) => set(
                (state) => ({
                  items: state.items.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                  )
                }),
                false,
                'updateItem'
              ),
              
              removeItem: (id) => set(
                (state) => ({
                  items: state.items.filter(item => item.id !== id)
                }),
                false,
                'removeItem'
              ),
              
              setLoading: (loading) => set({ loading }, false, 'setLoading'),
              
              setError: (error) => set({ error }, false, 'setError'),
              
              reset: () => set({
                items: [],
                loading: false,
                error: null
              }, false, 'reset')
            }),
            {
              name: \`\${name}-store\`,
              partialize: (state) => ({ items: state.items })
            }
          ),
          { name }
        )
      );
    }

    /**
     * Common store patterns
     */

    // User authentication store
    export interface User {
      id: string;
      email: string;
      name?: string;
      avatar?: string;
    }

    export interface AuthStore {
      user: User | null;
      isAuthenticated: boolean;
      loading: boolean;
      setUser: (user: User | null) => void;
      setLoading: (loading: boolean) => void;
      login: (user: User) => void;
      logout: () => void;
    }

    export const useAuthStore = create<AuthStore>()(
      devtools(
        persist(
          (set) => ({
            user: null,
            isAuthenticated: false,
            loading: false,
            
            setUser: (user) => set({
              user,
              isAuthenticated: !!user
            }, false, 'setUser'),
            
            setLoading: (loading) => set({ loading }, false, 'setLoading'),
            
            login: (user) => set({
              user,
              isAuthenticated: true
            }, false, 'login'),
            
            logout: () => set({
              user: null,
              isAuthenticated: false
            }, false, 'logout')
          }),
          {
            name: 'auth-store',
            partialize: (state) => ({
              user: state.user,
              isAuthenticated: state.isAuthenticated
            })
          }
        ),
        { name: 'AuthStore' }
      )
    );

    // UI state store
    export interface UIStore {
      sidebarOpen: boolean;
      theme: 'light' | 'dark' | 'system';
      notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
        timestamp: number;
      }>;
      setSidebarOpen: (open: boolean) => void;
      toggleSidebar: () => void;
      setTheme: (theme: 'light' | 'dark' | 'system') => void;
      addNotification: (notification: Omit<UIStore['notifications'][0], 'id' | 'timestamp'>) => void;
      removeNotification: (id: string) => void;
      clearNotifications: () => void;
    }

    export const useUIStore = create<UIStore>()(
      devtools(
        persist(
          (set, get) => ({
            sidebarOpen: false,
            theme: 'system',
            notifications: [],
            
            setSidebarOpen: (open) => set({ sidebarOpen: open }, false, 'setSidebarOpen'),
            
            toggleSidebar: () => set(
              (state) => ({ sidebarOpen: !state.sidebarOpen }),
              false,
              'toggleSidebar'
            ),
            
            setTheme: (theme) => set({ theme }, false, 'setTheme'),
            
            addNotification: (notification) => {
              const id = Math.random().toString(36).substr(2, 9);
              const timestamp = Date.now();
              set(
                (state) => ({
                  notifications: [...state.notifications, { ...notification, id, timestamp }]
                }),
                false,
                'addNotification'
              );
              
              // Auto-remove after 5 seconds
              setTimeout(() => {
                get().removeNotification(id);
              }, 5000);
            },
            
            removeNotification: (id) => set(
              (state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
              }),
              false,
              'removeNotification'
            ),
            
            clearNotifications: () => set({ notifications: [] }, false, 'clearNotifications')
          }),
          {
            name: 'ui-store',
            partialize: (state) => ({
              theme: state.theme,
              sidebarOpen: state.sidebarOpen
            })
          }
        ),
        { name: 'UIStore' }
      )
    );

    /**
     * Utility hooks for common patterns
     */

    // Hook for async operations with loading and error states
    export function useAsyncOperation<T>() {
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [data, setData] = useState<T | null>(null);

      const execute = useCallback(async (operation: () => Promise<T>) => {
        setLoading(true);
        setError(null);
        
        try {
          const result = await operation();
          setData(result);
          return result;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMessage);
          throw err;
        } finally {
          setLoading(false);
        }
      }, []);

      const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setData(null);
      }, []);

      return { loading, error, data, execute, reset };
    }
  `,
  '/lib/supabase-types.ts': dedent`
    /**
     * Common TypeScript definitions for Supabase
     */

    // Database types
    export interface Database {
      public: {
        Tables: {
          [key: string]: {
            Row: Record<string, any>;
            Insert: Record<string, any>;
            Update: Record<string, any>;
          };
        };
        Views: {
          [key: string]: {
            Row: Record<string, any>;
          };
        };
        Functions: {
          [key: string]: {
            Args: Record<string, any>;
            Returns: any;
          };
        };
      };
    }

    // Auth types
    export interface Profile {
      id: string;
      email: string;
      full_name?: string;
      avatar_url?: string;
      created_at: string;
      updated_at: string;
    }

    // Common table patterns
    export interface BaseTable {
      id: string;
      created_at: string;
      updated_at: string;
    }

    export interface UserOwnedTable extends BaseTable {
      user_id: string;
    }

    // Real-time subscription types
    export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

    export interface RealtimePayload<T = any> {
      eventType: RealtimeEvent;
      new: T;
      old: T;
      schema: string;
      table: string;
    }

    // Query result types
    export interface QueryResult<T> {
      data: T[] | null;
      error: any;
      count?: number;
    }

    export interface SingleQueryResult<T> {
      data: T | null;
      error: any;
    }

    // Pagination types
    export interface PaginationOptions {
      page?: number;
      limit?: number;
      offset?: number;
    }

    export interface PaginatedResult<T> {
      data: T[];
      count: number;
      hasMore: boolean;
      page: number;
      limit: number;
    }

    // Filter types
    export type FilterOperator =
      | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
      | 'like' | 'ilike' | 'is' | 'in' | 'contains'
      | 'containedBy' | 'rangeGt' | 'rangeGte'
      | 'rangeLt' | 'rangeLte' | 'rangeAdjacent'
      | 'overlaps' | 'textSearch' | 'match';

    export interface FilterCondition {
      column: string;
      operator: FilterOperator;
      value: any;
    }

    // Storage types
    export interface StorageFile {
      name: string;
      id: string;
      updated_at: string;
      created_at: string;
      last_accessed_at: string;
      metadata: Record<string, any>;
    }

    export interface UploadOptions {
      cacheControl?: string;
      contentType?: string;
      duplex?: string;
      upsert?: boolean;
    }
  `,
  '/lib/proxy.ts': dedent`
    /**
     * LibreChat Artifact Proxy Utility
     * Provides unrestricted network access for artifacts by routing requests through LibreChat's proxy
     */

    // Global configuration - will be injected by LibreChat
    declare global {
      interface Window {
        __LIBRECHAT_PROXY_CONFIG__?: {
          enabled: boolean;
          endpoint: string;
          token?: string;
        };
      }
    }

    /**
     * Enhanced fetch function that routes requests through LibreChat's proxy
     * This bypasses CORS restrictions and allows artifacts to call any external API
     */
    export async function proxyFetch(
      url: string | URL,
      options: RequestInit = {}
    ): Promise<Response> {
      const config = window.__LIBRECHAT_PROXY_CONFIG__;
      
      if (!config || !config.enabled) {
        console.warn('LibreChat proxy is not enabled, falling back to regular fetch');
        return fetch(url, options);
      }

      const targetUrl = url.toString();
      
      // Prepare the proxy request
      const proxyOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.token && { 'Authorization': \`Bearer \${config.token}\` }),
        },
        body: JSON.stringify({
          url: targetUrl,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body,
        }),
      };

      try {
        // Make the proxy request
        const proxyResponse = await fetch(config.endpoint, proxyOptions);
        
        if (!proxyResponse.ok) {
          throw new Error(\`Proxy request failed: \${proxyResponse.status} \${proxyResponse.statusText}\`);
        }

        const proxyData = await proxyResponse.json();
        
        if (!proxyData.success) {
          throw new Error(\`External request failed: \${proxyData.error || 'Unknown error'}\`);
        }

        // Create a Response-like object from the proxy data
        const responseInit: ResponseInit = {
          status: proxyData.status,
          statusText: proxyData.statusText,
          headers: new Headers(proxyData.headers),
        };

        // Handle different data types
        let responseBody: string | ArrayBuffer;
        
        if (proxyData.encoding === 'base64') {
          // Binary data
          const binaryString = atob(proxyData.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          responseBody = bytes.buffer;
        } else if (typeof proxyData.data === 'object') {
          // JSON data
          responseBody = JSON.stringify(proxyData.data);
        } else {
          // Text data
          responseBody = proxyData.data;
        }

        return new Response(responseBody, responseInit);
        
      } catch (error) {
        console.error('ProxyFetch error:', error);
        throw error;
      }
    }

    /**
     * Check if the proxy is available and configured
     */
    export function isProxyAvailable(): boolean {
      const config = window.__LIBRECHAT_PROXY_CONFIG__;
      return !!(config && config.enabled && config.endpoint);
    }

    /**
     * Get proxy configuration status
     */
    export function getProxyStatus() {
      const config = window.__LIBRECHAT_PROXY_CONFIG__;
      return {
        enabled: config?.enabled || false,
        endpoint: config?.endpoint || null,
        hasToken: !!(config?.token),
      };
    }

    /**
     * Convenience methods for common HTTP operations using proxy
     */
    export const proxyHttp = {
      /**
       * GET request through proxy
       */
      get: async (url: string, headers?: Record<string, string>) => {
        return proxyFetch(url, { method: 'GET', headers });
      },

      /**
       * POST request through proxy
       */
      post: async (url: string, data?: any, headers?: Record<string, string>) => {
        const body = data ? JSON.stringify(data) : undefined;
        const requestHeaders = {
          'Content-Type': 'application/json',
          ...headers,
        };
        return proxyFetch(url, { method: 'POST', body, headers: requestHeaders });
      },

      /**
       * PUT request through proxy
       */
      put: async (url: string, data?: any, headers?: Record<string, string>) => {
        const body = data ? JSON.stringify(data) : undefined;
        const requestHeaders = {
          'Content-Type': 'application/json',
          ...headers,
        };
        return proxyFetch(url, { method: 'PUT', body, headers: requestHeaders });
      },

      /**
       * DELETE request through proxy
       */
      delete: async (url: string, headers?: Record<string, string>) => {
        return proxyFetch(url, { method: 'DELETE', headers });
      },

      /**
       * PATCH request through proxy
       */
      patch: async (url: string, data?: any, headers?: Record<string, string>) => {
        const body = data ? JSON.stringify(data) : undefined;
        const requestHeaders = {
          'Content-Type': 'application/json',
          ...headers,
        };
        return proxyFetch(url, { method: 'PATCH', body, headers: requestHeaders });
      },
    };

    /**
     * Utility for making API calls with automatic JSON parsing
     */
    export async function proxyApi<T = any>(
      url: string,
      options: RequestInit = {}
    ): Promise<T> {
      const response = await proxyFetch(url, options);
      
      if (!response.ok) {
        throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text() as any;
      }
    }

    /**
     * Example usage and documentation
     */
    export const proxyExamples = {
      // Basic usage
      basicGet: \`
        // Instead of: fetch('https://api.example.com/data')
        const response = await proxyFetch('https://api.example.com/data');
        const data = await response.json();
      \`,

      // POST with data
      postData: \`
        const response = await proxyFetch('https://api.example.com/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'John', email: 'john@example.com' })
        });
      \`,

      // Using convenience methods
      convenience: \`
        // GET request
        const users = await proxyHttp.get('https://jsonplaceholder.typicode.com/users');
        
        // POST request
        const newUser = await proxyHttp.post('https://api.example.com/users', {
          name: 'Jane',
          email: 'jane@example.com'
        });
        
        // With custom headers
        const data = await proxyHttp.get('https://api.github.com/user', {
          'Authorization': 'token your-github-token'
        });
      \`,

      // API utility
      apiUtility: \`
        // Automatic JSON parsing
        const userData = await proxyApi<User>('https://api.example.com/user/123');
        console.log(userData.name); // TypeScript knows this is a User object
      \`,

      // Error handling
      errorHandling: \`
        try {
          const response = await proxyFetch('https://api.example.com/data');
          if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
          }
          const data = await response.json();
        } catch (error) {
          console.error('Request failed:', error);
        }
      \`,
    };
  `,
};
