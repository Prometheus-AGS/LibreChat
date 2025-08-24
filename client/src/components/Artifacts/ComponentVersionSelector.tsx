import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, AlertTriangle, Info, Zap, Shield } from 'lucide-react';
import { ComponentVersion, ComponentMetadata, VersionConflict } from 'librechat-data-provider';

/**
 * Props for the ComponentVersionSelector component
 */
interface ComponentVersionSelectorProps {
  /** Available components with their metadata */
  availableComponents: Record<string, ComponentMetadata>;
  /** Currently selected component versions */
  selectedVersions: Record<string, ComponentVersion>;
  /** Callback when version selection changes */
  onVersionChange: (componentName: string, version: ComponentVersion) => void;
  /** Current version conflicts */
  conflicts?: VersionConflict[];
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for individual component version item
 */
interface ComponentVersionItemProps {
  componentName: string;
  metadata: ComponentMetadata;
  selectedVersion: ComponentVersion;
  onVersionChange: (version: ComponentVersion) => void;
  hasConflict?: boolean;
  conflictInfo?: VersionConflict;
  disabled?: boolean;
}

/**
 * Individual component version selector item
 */
const ComponentVersionItem: React.FC<ComponentVersionItemProps> = ({
  componentName,
  metadata,
  selectedVersion,
  onVersionChange,
  hasConflict,
  conflictInfo,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleVersionChange = useCallback(
    (version: ComponentVersion) => {
      if (!disabled) {
        onVersionChange(version);
      }
    },
    [onVersionChange, disabled],
  );

  const getVersionIcon = (version: ComponentVersion) => {
    switch (version) {
      case ComponentVersion.STABLE:
        return <Shield className="h-4 w-4 text-green-600" />;
      case ComponentVersion.CANARY:
        return <Zap className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVersionBadgeColor = (version: ComponentVersion) => {
    switch (version) {
      case ComponentVersion.STABLE:
        return 'bg-green-100 text-green-800 border-green-200';
      case ComponentVersion.CANARY:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 ${hasConflict ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Component Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900">{componentName}</h3>
          <div
            className={`rounded-full border px-2 py-1 text-xs font-medium ${getVersionBadgeColor(selectedVersion)}`}
          >
            {getVersionIcon(selectedVersion)}
            <span className="ml-1">{selectedVersion}</span>
          </div>
          {metadata.isExperimental && (
            <span className="rounded-full border border-orange-200 bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
              Experimental
            </span>
          )}
        </div>
        <button
          onClick={toggleExpanded}
          className="rounded p-1 transition-colors hover:bg-gray-100"
          disabled={disabled}
          title={isExpanded ? 'Collapse details' : 'Expand details'}
          aria-label={isExpanded ? 'Collapse component details' : 'Expand component details'}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Conflict Warning */}
      {hasConflict && conflictInfo && (
        <div className="mt-2 flex items-start space-x-2 rounded border border-red-200 bg-red-100 p-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Version Conflict</p>
            <p>{conflictInfo.suggestedAction}</p>
          </div>
        </div>
      )}

      {/* Component Description */}
      <p className="mt-2 text-sm text-gray-600">{metadata.description}</p>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Version Selection */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900">Version Selection</h4>
            <div className="space-y-2">
              {Object.values(ComponentVersion).map((version) => (
                <label
                  key={version as string}
                  className={`flex cursor-pointer items-center space-x-3 rounded border p-2 transition-colors ${
                    selectedVersion === version
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${disabled ? 'cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name={`version-${componentName}`}
                    value={version as string}
                    checked={selectedVersion === version}
                    onChange={() => handleVersionChange(version as ComponentVersion)}
                    disabled={disabled}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    {getVersionIcon(version as ComponentVersion)}
                    <span className="text-sm font-medium">{version as string}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {version === ComponentVersion.STABLE && 'Production-ready, well-tested'}
                    {version === ComponentVersion.CANARY && 'Latest features, may be unstable'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dependencies */}
          {metadata.dependencies.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">Dependencies</h4>
              <div className="flex flex-wrap gap-1">
                {metadata.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="rounded border border-blue-200 bg-blue-100 px-2 py-1 text-xs text-blue-800"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conflicts */}
          {metadata.conflicts.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">Potential Conflicts</h4>
              <div className="flex flex-wrap gap-1">
                {metadata.conflicts.map((conflict) => (
                  <span
                    key={conflict}
                    className="rounded border border-red-200 bg-red-100 px-2 py-1 text-xs text-red-800"
                  >
                    {conflict}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Breaking Changes */}
          {metadata.breakingChanges && metadata.breakingChanges.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">Breaking Changes</h4>
              <ul className="space-y-1 text-xs text-gray-600">
                {metadata.breakingChanges.map((change, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="mt-1 text-red-500">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Component version selector for artifact settings
 * Allows users to select between stable and canary versions for each component
 */
export const ComponentVersionSelector: React.FC<ComponentVersionSelectorProps> = ({
  availableComponents,
  selectedVersions,
  onVersionChange,
  conflicts = [],
  disabled = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVersion, setFilterVersion] = useState<ComponentVersion | 'all'>('all');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  // Create conflict lookup for quick access
  const conflictLookup = useMemo(() => {
    const lookup: Record<string, VersionConflict> = {};
    conflicts.forEach((conflict) => {
      lookup[conflict.componentName] = conflict;
    });
    return lookup;
  }, [conflicts]);

  // Filter components based on search and filters
  const filteredComponents = useMemo(() => {
    return Object.entries(availableComponents).filter(([name, metadata]) => {
      // Search filter
      if (
        searchTerm &&
        !name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !metadata.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Version filter
      if (filterVersion !== 'all' && selectedVersions[name] !== filterVersion) {
        return false;
      }

      // Conflicts filter
      if (showConflictsOnly && !conflictLookup[name]) {
        return false;
      }

      return true;
    });
  }, [
    availableComponents,
    searchTerm,
    filterVersion,
    selectedVersions,
    showConflictsOnly,
    conflictLookup,
  ]);

  const handleVersionChange = useCallback(
    (componentName: string, version: ComponentVersion) => {
      onVersionChange(componentName, version);
    },
    [onVersionChange],
  );

  const conflictCount = conflicts.length;
  const canaryCount = Object.values(selectedVersions).filter(
    (v) => v === ComponentVersion.CANARY,
  ).length;
  const stableCount = Object.values(selectedVersions).filter(
    (v) => v === ComponentVersion.STABLE,
  ).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Component Versions</h2>
          <p className="text-sm text-gray-600">
            Select stable or canary versions for each component in your artifacts
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">{stableCount} Stable</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-4 w-4 text-yellow-600" />
            <span className="text-gray-600">{canaryCount} Canary</span>
          </div>
          {conflictCount > 0 && (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-600">{conflictCount} Conflicts</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterVersion}
            onChange={(e) => setFilterVersion(e.target.value as ComponentVersion | 'all')}
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            disabled={disabled}
            title="Filter components by version"
            aria-label="Filter components by version"
          >
            <option value="all">All Versions</option>
            <option value={ComponentVersion.STABLE}>Stable Only</option>
            <option value={ComponentVersion.CANARY}>Canary Only</option>
          </select>
          <label className="flex items-center space-x-2 rounded-md border border-gray-300 px-3 py-2">
            <input
              type="checkbox"
              checked={showConflictsOnly}
              onChange={(e) => setShowConflictsOnly(e.target.checked)}
              disabled={disabled}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-sm">Conflicts Only</span>
          </label>
        </div>
      </div>

      {/* Global Conflicts Warning */}
      {conflictCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Version Conflicts Detected</h3>
              <p className="mt-1 text-sm text-red-800">
                {conflictCount} component{conflictCount > 1 ? 's have' : ' has'} version conflicts
                that need to be resolved. Review the conflicting components below and adjust their
                versions accordingly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Component List */}
      <div className="space-y-4">
        {filteredComponents.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Info className="mx-auto mb-2 h-8 w-8" />
            <p>No components match your current filters</p>
          </div>
        ) : (
          filteredComponents.map(([name, metadata]) => (
            <ComponentVersionItem
              key={name}
              componentName={name}
              metadata={metadata}
              selectedVersion={selectedVersions[name] || ComponentVersion.STABLE}
              onVersionChange={(version) => handleVersionChange(name, version)}
              hasConflict={!!conflictLookup[name]}
              conflictInfo={conflictLookup[name]}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="text-sm text-gray-600">
          {filteredComponents.length} of {Object.keys(availableComponents).length} components shown
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              Object.keys(availableComponents).forEach((name) => {
                handleVersionChange(name, ComponentVersion.STABLE);
              });
            }}
            disabled={disabled}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            All Stable
          </button>
          <button
            onClick={() => {
              Object.keys(availableComponents).forEach((name) => {
                handleVersionChange(name, ComponentVersion.CANARY);
              });
            }}
            disabled={disabled}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            All Canary
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentVersionSelector;
