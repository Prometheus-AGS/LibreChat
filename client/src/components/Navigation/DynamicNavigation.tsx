import React, { useEffect, useState } from 'react';
import { useArtifactRegistryStore } from '../../store/artifact-registry';
import { useShadcnDetection } from '../../utils/shadcn-detection';
import { SidebarNavigation } from './SidebarNavigation';
import { CustomNavigation } from './CustomNavigation';
import type { NavigationItem } from 'librechat-data-provider';

interface DynamicNavigationProps {
  className?: string;
  onNavigate?: (item: NavigationItem) => void;
}

/**
 * Dynamic navigation component that adapts to shadcn-ui version
 * - Uses built-in sidebar for canary builds
 * - Falls back to custom navigation for stable builds
 * - Loads navigation items from Supabase via artifact registry store
 */
export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({ className, onNavigate }) => {
  const { detection, loading: detectionLoading } = useShadcnDetection();
  const {
    navigationItems,
    refreshNavigation,
    isLoadingNavigation: navLoading,
    navigationError: navError,
  } = useArtifactRegistryStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Load navigation items on mount
  useEffect(() => {
    if (!isInitialized && !navLoading) {
      refreshNavigation();
      setIsInitialized(true);
    }
  }, [refreshNavigation, navLoading, isInitialized]);

  // Handle navigation item selection
  const handleNavigate = (item: NavigationItem) => {
    onNavigate?.(item);
  };

  // Show loading state while detecting shadcn version or loading nav items
  if (detectionLoading || navLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900" />
        <span className="ml-2 text-sm text-gray-600">Loading navigation...</span>
      </div>
    );
  }

  // Show error state if navigation loading failed
  if (navError) {
    return (
      <div className={`p-4 text-red-600 ${className}`}>
        <div className="text-sm font-medium">Navigation Error</div>
        <div className="mt-1 text-xs">{navError}</div>
        <button
          onClick={() => refreshNavigation()}
          className="mt-2 text-xs underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Use appropriate navigation component based on shadcn version
  if (detection?.version === 'canary' && detection.hasSidebar) {
    return (
      <SidebarNavigation
        items={navigationItems}
        onNavigate={handleNavigate}
        className={className}
      />
    );
  }

  return (
    <CustomNavigation items={navigationItems} onNavigate={handleNavigate} className={className} />
  );
};
