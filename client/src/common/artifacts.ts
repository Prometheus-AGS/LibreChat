import type { TSupabaseConfig } from 'librechat-data-provider';

export interface CodeBlock {
  id: string;
  language: string;
  content: string;
}

/**
 * Component version types for shadcn/ui components
 */
export enum ComponentVersion {
  STABLE = 'stable',
  CANARY = 'canary',
}

/**
 * Component version configuration for individual components
 */
export interface ComponentVersionConfig {
  [componentName: string]: ComponentVersion;
}

/**
 * Component versioning configuration for an artifact
 */
export interface ArtifactVersionConfig {
  enabled: boolean;
  globalVersion: ComponentVersion;
  componentOverrides: ComponentVersionConfig;
  allowMixedVersions: boolean;
  autoResolveConflicts: boolean;
}

/**
 * Component metadata for version management
 */
export interface ComponentMetadata {
  name: string;
  version: ComponentVersion;
  dependencies: string[];
  conflicts: string[];
  description: string;
  isExperimental: boolean;
  deprecatedIn?: string;
  stableIn?: string;
  breakingChanges?: string[];
}

/**
 * Version conflict information
 */
export interface VersionConflict {
  componentName: string;
  requestedVersion: ComponentVersion;
  conflictingComponents: string[];
  resolution: 'auto' | 'manual' | 'pending';
  suggestedAction: string;
}

/**
 * Migration path information
 */
export interface MigrationPath {
  fromVersion: ComponentVersion;
  toVersion: ComponentVersion;
  componentName: string;
  isBreaking: boolean;
  migrationSteps: string[];
  codeChanges?: {
    search: string;
    replace: string;
    description: string;
  }[];
}

export interface Artifact {
  id: string;
  lastUpdateTime: number;
  index?: number;
  messageId?: string;
  identifier?: string;
  language?: string;
  content?: string;
  title?: string;
  type?: string;
  supabaseConfig?: TSupabaseConfig;
  versionConfig?: ArtifactVersionConfig;
  versionConflicts?: VersionConflict[];
}

export type ArtifactFiles =
  | {
      'App.tsx': string;
      'index.tsx': string;
      '/components/ui/MermaidDiagram.tsx': string;
    }
  | Partial<{
      [x: string]: string | undefined;
    }>;

/**
 * Version manifest for component loading
 */
export interface VersionManifest {
  components: ComponentMetadata[];
  conflicts: VersionConflict[];
  bundleSize: number;
  loadingStrategy: 'eager' | 'lazy' | 'hybrid';
}

/**
 * Enhanced artifact files with version-aware component loading
 */
export interface VersionedArtifactFiles extends Record<string, string | undefined> {
  __version_manifest__?: string; // JSON stringified VersionManifest
}
