import React from 'react';
import type { ShadcnVersion, ShadcnDetectionResult } from 'librechat-data-provider';

/**
 * shadcn-ui Version Detection Utility
 *
 * This utility detects the shadcn-ui version and capabilities to determine
 * whether to use built-in sidebar components (canary) or custom navigation (stable).
 */

interface PackageJsonDependency {
  [key: string]: string;
}

interface PackageJson {
  dependencies?: PackageJsonDependency;
  devDependencies?: PackageJsonDependency;
}

/**
 * Known shadcn-ui canary features and their version requirements
 */
const CANARY_FEATURES = {
  sidebar: '0.8.0',
  'app-sidebar': '0.8.0',
  'sidebar-provider': '0.8.0',
  breadcrumb: '0.7.0',
  'navigation-menu': '0.6.0',
} as const;

/**
 * Key dependencies that indicate shadcn-ui usage
 */
const SHADCN_INDICATORS = [
  '@radix-ui/react-slot',
  'class-variance-authority',
  'clsx',
  'tailwind-merge',
  'lucide-react',
] as const;

/**
 * Canary-specific dependencies
 */
const CANARY_INDICATORS = [
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-separator',
] as const;

/**
 * Parse version string to compare versions
 */
function parseVersion(version: string): number[] {
  return version
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map(Number);
}

/**
 * Compare two version strings
 */
function compareVersions(version1: string, version2: string): number {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Check if version meets minimum requirement
 */
function meetsMinimumVersion(currentVersion: string, requiredVersion: string): boolean {
  return compareVersions(currentVersion, requiredVersion) >= 0;
}

/**
 * Detect shadcn-ui version from package.json
 */
async function detectFromPackageJson(): Promise<Partial<ShadcnDetectionResult>> {
  try {
    // In a real implementation, this would read the actual package.json
    // For now, we'll simulate the detection
    const response = await fetch('/package.json');
    if (!response.ok) {
      throw new Error('Could not fetch package.json');
    }

    const packageJson: PackageJson = await response.json();
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for shadcn-ui indicators
    const hasShadcnIndicators = SHADCN_INDICATORS.some((dep) => dep in allDependencies);
    if (!hasShadcnIndicators) {
      return { detected: false };
    }

    // Check for canary indicators
    const hasCanaryIndicators = CANARY_INDICATORS.some((dep) => dep in allDependencies);

    // Estimate version based on dependencies
    let estimatedVersion = '0.5.0'; // default stable
    if (hasCanaryIndicators) {
      estimatedVersion = '0.8.0'; // likely canary
    }

    return {
      detected: true,
      packageJson: allDependencies,
      version: {
        version: estimatedVersion,
        isCanary: hasCanaryIndicators,
        hasSidebar: hasCanaryIndicators,
        features: hasCanaryIndicators ? Object.keys(CANARY_FEATURES) : ['basic-components'],
      },
    };
  } catch (error) {
    console.warn('Could not detect from package.json:', error);
    return { detected: false };
  }
}

/**
 * Detect shadcn-ui from DOM elements and CSS classes
 */
function detectFromDOM(): Partial<ShadcnDetectionResult> {
  try {
    // Look for common shadcn-ui CSS classes
    const shadcnClasses = [
      'bg-background',
      'text-foreground',
      'border-border',
      'bg-card',
      'text-card-foreground',
      'bg-primary',
      'text-primary-foreground',
    ];

    const hasShadcnClasses = shadcnClasses.some(
      (className) => document.querySelector(`.${className}`) !== null,
    );

    if (!hasShadcnClasses) {
      return { detected: false };
    }

    // Look for canary-specific elements
    const canarySelectors = [
      '[data-sidebar]',
      '.sidebar',
      '[data-navigation-menu]',
      '.navigation-menu',
    ];

    const hasCanaryElements = canarySelectors.some(
      (selector) => document.querySelector(selector) !== null,
    );

    return {
      detected: true,
      version: {
        version: hasCanaryElements ? '0.8.0' : '0.6.0',
        isCanary: hasCanaryElements,
        hasSidebar: hasCanaryElements,
        features: hasCanaryElements
          ? ['sidebar', 'navigation-menu', 'breadcrumb']
          : ['basic-components'],
      },
    };
  } catch (error) {
    console.warn('Could not detect from DOM:', error);
    return { detected: false };
  }
}

/**
 * Detect shadcn-ui from components.json config file
 */
async function detectFromConfig(): Promise<Partial<ShadcnDetectionResult>> {
  try {
    const response = await fetch('/components.json');
    if (!response.ok) {
      throw new Error('Could not fetch components.json');
    }

    const config = await response.json();

    // Check for canary-specific config
    const hasCanaryConfig =
      config.style === 'new-york' ||
      config.tailwind?.baseColor === 'neutral' ||
      config.components?.includes('sidebar');

    return {
      detected: true,
      configFiles: ['components.json'],
      version: {
        version: hasCanaryConfig ? '0.8.0' : '0.6.0',
        isCanary: hasCanaryConfig,
        hasSidebar: hasCanaryConfig,
        features: hasCanaryConfig ? Object.keys(CANARY_FEATURES) : ['basic-components'],
      },
    };
  } catch (error) {
    console.warn('Could not detect from config:', error);
    return { detected: false };
  }
}

/**
 * Main detection function that combines all methods
 */
export async function detectShadcnVersion(): Promise<ShadcnDetectionResult> {
  try {
    // Try multiple detection methods
    const [packageResult, domResult, configResult] = await Promise.all([
      detectFromPackageJson(),
      Promise.resolve(detectFromDOM()),
      detectFromConfig(),
    ]);

    // Combine results, prioritizing more reliable sources
    const results = [packageResult, configResult, domResult].filter((r) => r.detected);

    if (results.length === 0) {
      return {
        detected: false,
        version: undefined,
        packageJson: undefined,
        configFiles: undefined,
      };
    }

    // Use the most reliable result (package.json > config > DOM)
    const primaryResult = results[0];

    // Merge features from all sources
    const allFeatures = new Set<string>();
    results.forEach((result) => {
      if (result.version?.features) {
        result.version.features.forEach((feature) => allFeatures.add(feature));
      }
    });

    // Determine if it's canary based on features
    const isCanary = allFeatures.has('sidebar') || allFeatures.has('app-sidebar');
    const hasSidebar = isCanary;

    // Determine version based on features
    let detectedVersion = '0.6.0'; // stable default
    if (isCanary) {
      detectedVersion = '0.8.0'; // canary
    }

    const finalResult: ShadcnDetectionResult = {
      detected: true,
      version: {
        version: detectedVersion,
        isCanary,
        hasSidebar,
        features: Array.from(allFeatures),
      },
      packageJson: primaryResult.packageJson,
      configFiles: results.flatMap((r) => r.configFiles || []),
    };

    return finalResult;
  } catch (error) {
    console.error('Error detecting shadcn-ui version:', error);
    return {
      detected: false,
      version: undefined,
      packageJson: undefined,
      configFiles: undefined,
    };
  }
}

/**
 * Check if a specific feature is available
 */
export function hasFeature(version: ShadcnVersion, feature: keyof typeof CANARY_FEATURES): boolean {
  if (!version.features.includes(feature)) {
    return false;
  }

  const requiredVersion = CANARY_FEATURES[feature];
  return meetsMinimumVersion(version.version, requiredVersion);
}

/**
 * Get recommended navigation strategy based on detected version
 */
export function getNavigationStrategy(
  version: ShadcnVersion,
): 'canary-sidebar' | 'custom-navigation' {
  if (version.isCanary && version.hasSidebar) {
    return 'canary-sidebar';
  }
  return 'custom-navigation';
}

/**
 * Hook for using shadcn-ui detection in React components
 */
export function useShadcnDetection() {
  const [detection, setDetection] = React.useState<ShadcnDetectionResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    detectShadcnVersion()
      .then(setDetection)
      .finally(() => setLoading(false));
  }, []);

  return {
    detection,
    loading,
    isCanary: detection?.version?.isCanary ?? false,
    hasSidebar: detection?.version?.hasSidebar ?? false,
    navigationStrategy: detection?.version
      ? getNavigationStrategy(detection.version)
      : 'custom-navigation',
  };
}

// Export types for external use
export type { ShadcnVersion, ShadcnDetectionResult };
