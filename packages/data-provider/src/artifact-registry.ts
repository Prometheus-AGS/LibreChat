/**
 * Artifact Registry System
 *
 * This module provides the core types and interfaces for the artifact registry system,
 * including component metadata, dependency resolution, and version management.
 */

export interface ArtifactMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  category?: string;
  dependencies?: ArtifactDependency[];
  supabaseConfig?: ArtifactSupabaseConfig;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  downloadCount?: number;
}

export interface ArtifactDependency {
  id: string;
  name: string;
  version: string;
  required: boolean;
}

export interface ArtifactSupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  tables?: string[];
  functions?: string[];
  storage?: boolean;
  realtime?: boolean;
}

export interface ArtifactVersion {
  version: string;
  code: string;
  changelog?: string;
  isStable: boolean;
  createdAt: Date;
}

export interface ArtifactRegistry {
  artifacts: Map<string, ArtifactMetadata>;
  versions: Map<string, ArtifactVersion[]>;
  dependencies: Map<string, string[]>;
}

export interface ArtifactEmbed {
  id: string;
  version?: string; // defaults to 'latest'
  props?: Record<string, any>;
  children?: ArtifactEmbed[];
}

export interface ComposedArtifact {
  id: string;
  name: string;
  embeds: ArtifactEmbed[];
  layout?: 'vertical' | 'horizontal' | 'grid' | 'custom';
  supabaseConfig?: ArtifactSupabaseConfig;
}

// Registry API Types
export interface RegistrySearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  limit?: number;
  offset?: number;
}

export interface RegistrySearchResult {
  artifacts: ArtifactMetadata[];
  total: number;
  hasMore: boolean;
}

// BFF API Types for component fetching
export interface ComponentFetchRequest {
  id: string;
  version?: string;
  includeDependencies?: boolean;
}

export interface ComponentFetchResponse {
  artifact: ArtifactMetadata;
  code: string;
  dependencies?: ComponentFetchResponse[];
  resolvedVersion: string;
}

// Navigation Types for Supabase-driven menus
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  children?: NavigationItem[];
  supabaseQuery?: {
    table: string;
    select?: string;
    where?: Record<string, any>;
    orderBy?: string;
  };
  isExternal?: boolean;
  requiresAuth?: boolean;
}

export interface DynamicNavigation {
  items: NavigationItem[];
  supabaseConfig: ArtifactSupabaseConfig;
  refreshInterval?: number;
}

// shadcn-ui version detection
export interface ShadcnVersion {
  version: string;
  isCanary: boolean;
  hasSidebar: boolean;
  features: string[];
}

export interface ShadcnDetectionResult {
  detected: boolean;
  version?: ShadcnVersion;
  packageJson?: any;
  configFiles?: string[];
}
