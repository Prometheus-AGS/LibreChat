import React, { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import {
  ComponentVersion,
  VersionConflict,
  MigrationPath,
  ComponentMetadata,
} from 'librechat-data-provider';

/**
 * Props for the ConflictResolutionSystem component
 */
interface ConflictResolutionSystemProps {
  /** Current version conflicts */
  conflicts: VersionConflict[];
  /** Available components with their metadata */
  availableComponents: Record<string, ComponentMetadata>;
  /** Available migration paths */
  migrationPaths: MigrationPath[];
  /** Currently selected component versions */
  selectedVersions: Record<string, ComponentVersion>;
  /** Callback when conflicts are resolved */
  onResolveConflicts: (resolutions: ConflictResolution[]) => void;
  /** Callback when version changes are applied */
  onApplyVersionChanges: (changes: VersionChange[]) => void;
  /** Whether the system is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Conflict resolution data structure
 */
interface ConflictResolution {
  conflictId: string;
  componentName: string;
  selectedResolution: ResolutionStrategy;
  targetVersion?: ComponentVersion;
  affectedComponents: string[];
  migrationRequired: boolean;
  migrationPath?: MigrationPath;
}

/**
 * Version change data structure
 */
interface VersionChange {
  componentName: string;
  fromVersion: ComponentVersion;
  toVersion: ComponentVersion;
  reason: string;
  migrationPath?: MigrationPath;
}

/**
 * Resolution strategy options
 */
enum ResolutionStrategy {
  UPGRADE_TO_CANARY = 'upgrade_to_canary',
  DOWNGRADE_TO_STABLE = 'downgrade_to_stable',
  KEEP_CURRENT = 'keep_current',
  CUSTOM_RESOLUTION = 'custom_resolution',
}

/**
 * Props for individual conflict item
 */
interface ConflictItemProps {
  conflict: VersionConflict;
  availableComponents: Record<string, ComponentMetadata>;
  migrationPaths: MigrationPath[];
  selectedVersions: Record<string, ComponentVersion>;
  onResolve: (resolution: ConflictResolution) => void;
  disabled?: boolean;
}

/**
 * Individual conflict resolution item
 */
const ConflictItem: React.FC<ConflictItemProps> = ({
  conflict,
  availableComponents,
  migrationPaths,
  selectedVersions,
  onResolve,
  disabled = false,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>(
    ResolutionStrategy.UPGRADE_TO_CANARY,
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Find relevant migration paths for this conflict
  const relevantMigrationPaths = useMemo(() => {
    return migrationPaths.filter(
      (path) =>
        path.componentName === conflict.componentName ||
        conflict.conflictingComponents.includes(path.componentName),
    );
  }, [migrationPaths, conflict]);

  // Calculate resolution options
  const resolutionOptions = useMemo(() => {
    const options: Array<{
      strategy: ResolutionStrategy;
      label: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      migrationRequired: boolean;
      targetVersion?: ComponentVersion;
    }> = [];

    // Upgrade to canary option
    if (conflict.requestedVersion === ComponentVersion.CANARY) {
      options.push({
        strategy: ResolutionStrategy.UPGRADE_TO_CANARY,
        label: 'Upgrade All to Canary',
        description: 'Upgrade all conflicting components to canary versions',
        impact: 'high',
        migrationRequired: true,
        targetVersion: ComponentVersion.CANARY,
      });
    }

    // Downgrade to stable option
    options.push({
      strategy: ResolutionStrategy.DOWNGRADE_TO_STABLE,
      label: 'Use Stable Versions',
      description: 'Downgrade to stable versions for compatibility',
      impact: 'low',
      migrationRequired: false,
      targetVersion: ComponentVersion.STABLE,
    });

    // Keep current option
    if (conflict.resolution === 'manual') {
      options.push({
        strategy: ResolutionStrategy.KEEP_CURRENT,
        label: 'Keep Current Configuration',
        description: 'Maintain current versions and handle conflicts manually',
        impact: 'medium',
        migrationRequired: false,
      });
    }

    return options;
  }, [conflict]);

  const handleStrategyChange = useCallback((strategy: ResolutionStrategy) => {
    setSelectedStrategy(strategy);
  }, []);

  const handleResolve = useCallback(() => {
    const selectedOption = resolutionOptions.find((opt) => opt.strategy === selectedStrategy);
    if (!selectedOption) return;

    const relevantMigrationPath = relevantMigrationPaths.find(
      (path) => path.toVersion === selectedOption.targetVersion,
    );

    const resolution: ConflictResolution = {
      conflictId: `${conflict.componentName}-${Date.now()}`,
      componentName: conflict.componentName,
      selectedResolution: selectedStrategy,
      targetVersion: selectedOption.targetVersion,
      affectedComponents: conflict.conflictingComponents,
      migrationRequired: selectedOption.migrationRequired,
      migrationPath: relevantMigrationPath,
    };

    onResolve(resolution);
  }, [selectedStrategy, resolutionOptions, relevantMigrationPaths, conflict, onResolve]);

  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
    }
  };

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
      {/* Conflict Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="font-medium text-red-900">{conflict.componentName}</h3>
            <p className="mt-1 text-sm text-red-800">{conflict.suggestedAction}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs text-red-700">Conflicting with:</span>
              {conflict.conflictingComponents.map((comp) => (
                <span
                  key={comp}
                  className="rounded border border-red-300 bg-red-200 px-2 py-1 text-xs text-red-800"
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded p-1 transition-colors hover:bg-red-100"
          disabled={disabled}
          title={isExpanded ? 'Collapse resolution options' : 'Expand resolution options'}
          aria-label={isExpanded ? 'Collapse resolution options' : 'Expand resolution options'}
        >
          <RefreshCw className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Resolution Options */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <h4 className="text-sm font-medium text-red-900">Resolution Options</h4>

          <div className="space-y-2">
            {resolutionOptions.map((option) => (
              <label
                key={option.strategy}
                className={`flex cursor-pointer items-start space-x-3 rounded border p-3 transition-colors ${
                  selectedStrategy === option.strategy
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <input
                  type="radio"
                  name={`resolution-${conflict.componentName}`}
                  value={option.strategy}
                  checked={selectedStrategy === option.strategy}
                  onChange={() => handleStrategyChange(option.strategy)}
                  disabled={disabled}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span
                      className={`rounded border px-2 py-1 text-xs ${getImpactColor(option.impact)}`}
                    >
                      {option.impact} impact
                    </span>
                    {option.migrationRequired && (
                      <span className="rounded border border-orange-200 bg-orange-100 px-2 py-1 text-xs text-orange-800">
                        Migration Required
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{option.description}</p>
                  {option.targetVersion && (
                    <div className="mt-2 flex items-center space-x-1">
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Target version: <span className="font-medium">{option.targetVersion}</span>
                      </span>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Migration Path Information */}
          {relevantMigrationPaths.length > 0 && (
            <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3">
              <h5 className="mb-2 text-sm font-medium text-blue-900">Available Migration Paths</h5>
              <div className="space-y-2">
                {relevantMigrationPaths.map((path, index) => (
                  <div key={index} className="text-xs text-blue-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{path.componentName}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>
                        {path.fromVersion} → {path.toVersion}
                      </span>
                      {path.isBreaking && (
                        <span className="rounded bg-red-100 px-1 py-0.5 text-xs text-red-700">
                          Breaking
                        </span>
                      )}
                    </div>
                    {path.migrationSteps.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {path.migrationSteps.slice(0, 2).map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-1">
                            <span className="mt-0.5 text-blue-600">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                        {path.migrationSteps.length > 2 && (
                          <li className="ml-2 text-blue-600">
                            +{path.migrationSteps.length - 2} more steps...
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolve Button */}
          <div className="flex justify-end">
            <button
              onClick={handleResolve}
              disabled={disabled}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Resolution
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main conflict resolution system component
 */
export const ConflictResolutionSystem: React.FC<ConflictResolutionSystemProps> = ({
  conflicts,
  availableComponents,
  migrationPaths,
  selectedVersions,
  onResolveConflicts,
  onApplyVersionChanges,
  disabled = false,
  className = '',
}) => {
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate resolution statistics
  const stats = useMemo(() => {
    const total = conflicts.length;
    const resolved = resolutions.length;
    const pending = total - resolved;
    const requireMigration = resolutions.filter((r) => r.migrationRequired).length;

    return { total, resolved, pending, requireMigration };
  }, [conflicts, resolutions]);

  const handleConflictResolve = useCallback((resolution: ConflictResolution) => {
    setResolutions((prev) => {
      const existing = prev.find((r) => r.componentName === resolution.componentName);
      if (existing) {
        return prev.map((r) => (r.componentName === resolution.componentName ? resolution : r));
      }
      return [...prev, resolution];
    });
  }, []);

  const handleApplyAllResolutions = useCallback(async () => {
    if (resolutions.length === 0) return;

    setIsProcessing(true);
    try {
      // Generate version changes from resolutions
      const versionChanges: VersionChange[] = resolutions.map((resolution) => ({
        componentName: resolution.componentName,
        fromVersion: selectedVersions[resolution.componentName] || ComponentVersion.STABLE,
        toVersion: resolution.targetVersion || ComponentVersion.STABLE,
        reason: `Conflict resolution: ${resolution.selectedResolution}`,
        migrationPath: resolution.migrationPath,
      }));

      // Apply version changes
      await onApplyVersionChanges(versionChanges);

      // Mark conflicts as resolved
      await onResolveConflicts(resolutions);

      // Clear local resolutions
      setResolutions([]);
    } catch (error) {
      console.error('Failed to apply conflict resolutions:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [resolutions, selectedVersions, onApplyVersionChanges, onResolveConflicts]);

  const handleClearResolutions = useCallback(() => {
    setResolutions([]);
  }, []);

  if (conflicts.length === 0) {
    return (
      <div className={`rounded-lg border border-green-200 bg-green-50 p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="font-medium text-green-900">No Conflicts Detected</h3>
            <p className="mt-1 text-sm text-green-800">
              All component versions are compatible with each other.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Conflict Resolution</h2>
          <p className="text-sm text-gray-600">
            Resolve version conflicts between components to ensure compatibility
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-gray-600">{stats.total} Conflicts</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">{stats.resolved} Resolved</span>
          </div>
          {stats.requireMigration > 0 && (
            <div className="flex items-center space-x-1">
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <span className="text-gray-600">{stats.requireMigration} Need Migration</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-green-600 transition-all duration-300"
            style={{ width: `${(stats.resolved / stats.total) * 100}%` }}
          />
        </div>
      )}

      {/* Conflict List */}
      <div className="space-y-4">
        {conflicts.map((conflict, index) => (
          <ConflictItem
            key={`${conflict.componentName}-${index}`}
            conflict={conflict}
            availableComponents={availableComponents}
            migrationPaths={migrationPaths}
            selectedVersions={selectedVersions}
            onResolve={handleConflictResolve}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Action Buttons */}
      {resolutions.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            {resolutions.length} resolution{resolutions.length > 1 ? 's' : ''} ready to apply
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClearResolutions}
              disabled={disabled || isProcessing}
              className="rounded border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={handleApplyAllResolutions}
              disabled={disabled || isProcessing}
              className="flex items-center space-x-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>{isProcessing ? 'Applying...' : 'Apply All Resolutions'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictResolutionSystem;
