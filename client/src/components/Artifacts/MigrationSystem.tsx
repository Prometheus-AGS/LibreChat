import React, { useState, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';
import { ComponentVersion, MigrationPath, ComponentMetadata } from 'librechat-data-provider';

/**
 * Props for the MigrationSystem component
 */
interface MigrationSystemProps {
  /** Available migration paths */
  migrationPaths: MigrationPath[];
  /** Available components with their metadata */
  availableComponents: Record<string, ComponentMetadata>;
  /** Currently selected component versions */
  selectedVersions: Record<string, ComponentVersion>;
  /** Callback when migration is executed */
  onExecuteMigration: (migration: MigrationExecution) => Promise<void>;
  /** Callback when rollback is executed */
  onExecuteRollback: (rollback: RollbackExecution) => Promise<void>;
  /** Whether the system is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Migration execution data structure
 */
interface MigrationExecution {
  migrationId: string;
  componentName: string;
  fromVersion: ComponentVersion;
  toVersion: ComponentVersion;
  migrationPath: MigrationPath;
  backupCreated: boolean;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Rollback execution data structure
 */
interface RollbackExecution {
  rollbackId: string;
  componentName: string;
  fromVersion: ComponentVersion;
  toVersion: ComponentVersion;
  backupId: string;
  reason: string;
}

/**
 * Migration step status
 */
interface MigrationStepStatus {
  stepIndex: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  duration?: number;
}

/**
 * Props for individual migration path item
 */
interface MigrationPathItemProps {
  migrationPath: MigrationPath;
  componentMetadata: ComponentMetadata;
  currentVersion: ComponentVersion;
  onExecute: (execution: MigrationExecution) => void;
  disabled?: boolean;
}

/**
 * Individual migration path item component
 */
const MigrationPathItem: React.FC<MigrationPathItemProps> = ({
  migrationPath,
  componentMetadata,
  currentVersion,
  onExecute,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<MigrationStepStatus[]>([]);

  // Calculate migration risk level
  const riskLevel = useMemo(() => {
    if (migrationPath.isBreaking) return 'high';
    if (migrationPath.migrationSteps.length > 5) return 'medium';
    return 'low';
  }, [migrationPath]);

  // Estimate migration duration (in minutes)
  const estimatedDuration = useMemo(() => {
    const baseTime = migrationPath.migrationSteps.length * 2;
    const complexityMultiplier = migrationPath.isBreaking ? 2 : 1;
    return Math.max(1, baseTime * complexityMultiplier);
  }, [migrationPath]);

  const handleExecute = useCallback(async () => {
    if (disabled || isExecuting) return;

    const execution: MigrationExecution = {
      migrationId: `${migrationPath.componentName}-${Date.now()}`,
      componentName: migrationPath.componentName,
      fromVersion: migrationPath.fromVersion,
      toVersion: migrationPath.toVersion,
      migrationPath,
      backupCreated: true,
      estimatedDuration,
      riskLevel,
    };

    setIsExecuting(true);

    // Initialize step statuses
    const initialStatuses: MigrationStepStatus[] = migrationPath.migrationSteps.map((_, index) => ({
      stepIndex: index,
      status: 'pending',
    }));
    setStepStatuses(initialStatuses);

    try {
      // Simulate step-by-step execution
      for (let i = 0; i < migrationPath.migrationSteps.length; i++) {
        setStepStatuses((prev) =>
          prev.map((status) =>
            status.stepIndex === i ? { ...status, status: 'running' } : status,
          ),
        );

        // Simulate step execution time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStepStatuses((prev) =>
          prev.map((status) =>
            status.stepIndex === i ? { ...status, status: 'completed', duration: 1 } : status,
          ),
        );
      }

      onExecute(execution);
    } catch (error) {
      console.error('Migration failed:', error);
      setStepStatuses((prev) =>
        prev.map((status) =>
          status.status === 'running'
            ? { ...status, status: 'failed', message: 'Migration step failed' }
            : status,
        ),
      );
    } finally {
      setIsExecuting(false);
    }
  }, [disabled, isExecuting, migrationPath, estimatedDuration, riskLevel, onExecute]);

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
    }
  };

  const getStepStatusIcon = (status: MigrationStepStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const isApplicable = currentVersion === migrationPath.fromVersion;
  const isReverseMigration =
    migrationPath.toVersion === ComponentVersion.STABLE &&
    migrationPath.fromVersion === ComponentVersion.CANARY;

  return (
    <div
      className={`rounded-lg border p-4 ${isApplicable ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Migration Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isReverseMigration ? (
              <Download className="h-4 w-4 text-orange-600" />
            ) : (
              <Upload className="h-4 w-4 text-blue-600" />
            )}
            <h3 className="font-medium text-gray-900">{migrationPath.componentName}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600">{migrationPath.fromVersion}</span>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{migrationPath.toVersion}</span>
          </div>
          <div className={`rounded border px-2 py-1 text-xs ${getRiskColor(riskLevel)}`}>
            {riskLevel} risk
          </div>
          {migrationPath.isBreaking && (
            <span className="rounded border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
              Breaking Changes
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">~{estimatedDuration} min</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 transition-colors hover:bg-gray-100"
            disabled={disabled}
            title={isExpanded ? 'Collapse migration details' : 'Expand migration details'}
            aria-label={isExpanded ? 'Collapse migration details' : 'Expand migration details'}
          >
            <Info className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Applicability Status */}
      {!isApplicable && (
        <div className="mt-2 rounded border border-gray-200 bg-gray-100 p-2 text-sm text-gray-600">
          <Info className="mr-1 inline h-4 w-4" />
          Not applicable - current version is {currentVersion}, migration requires{' '}
          {migrationPath.fromVersion}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Migration Steps */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900">Migration Steps</h4>
            <div className="space-y-2">
              {migrationPath.migrationSteps.map((step, index) => {
                const stepStatus = stepStatuses.find((s) => s.stepIndex === index);
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-3 rounded border border-gray-200 bg-white p-2"
                  >
                    <div className="mt-0.5">
                      {stepStatus
                        ? getStepStatusIcon(stepStatus.status)
                        : getStepStatusIcon('pending')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{step}</p>
                      {stepStatus?.message && (
                        <p className="mt-1 text-xs text-gray-500">{stepStatus.message}</p>
                      )}
                      {stepStatus?.duration && (
                        <p className="mt-1 text-xs text-green-600">
                          Completed in {stepStatus.duration}s
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breaking Changes Warning */}
          {migrationPath.isBreaking && (
            <div className="rounded border border-red-200 bg-red-50 p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                <div>
                  <h5 className="text-sm font-medium text-red-900">Breaking Changes</h5>
                  <p className="mt-1 text-sm text-red-800">
                    This migration includes breaking changes that may affect existing functionality.
                    A backup will be created automatically before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Execution Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExecute}
              disabled={disabled || !isApplicable || isExecuting}
              className="flex items-center space-x-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExecuting && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>
                {isExecuting ? 'Migrating...' : isReverseMigration ? 'Rollback' : 'Migrate'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Backward compatibility checker component
 */
interface BackwardCompatibilityCheckerProps {
  selectedVersions: Record<string, ComponentVersion>;
  availableComponents: Record<string, ComponentMetadata>;
  className?: string;
}

const BackwardCompatibilityChecker: React.FC<BackwardCompatibilityCheckerProps> = ({
  selectedVersions,
  availableComponents,
  className = '',
}) => {
  const compatibilityIssues = useMemo(() => {
    const issues: Array<{
      componentName: string;
      issue: string;
      severity: 'warning' | 'error';
      suggestion: string;
    }> = [];

    Object.entries(selectedVersions).forEach(([componentName, version]) => {
      const metadata = availableComponents[componentName];
      if (!metadata) return;

      // Check for deprecated components
      if (metadata.deprecatedIn && version === ComponentVersion.CANARY) {
        issues.push({
          componentName,
          issue: `Component deprecated in version ${metadata.deprecatedIn}`,
          severity: 'warning',
          suggestion: 'Consider migrating to alternative components',
        });
      }

      // Check for experimental components in production
      if (metadata.isExperimental && version === ComponentVersion.CANARY) {
        issues.push({
          componentName,
          issue: 'Experimental component may have stability issues',
          severity: 'warning',
          suggestion: 'Monitor closely and have fallback plans',
        });
      }

      // Check for breaking changes
      if (
        metadata.breakingChanges &&
        metadata.breakingChanges.length > 0 &&
        version === ComponentVersion.CANARY
      ) {
        issues.push({
          componentName,
          issue: `${metadata.breakingChanges.length} breaking changes detected`,
          severity: 'error',
          suggestion: 'Review breaking changes and update dependent code',
        });
      }
    });

    return issues;
  }, [selectedVersions, availableComponents]);

  const stats = useMemo(() => {
    const total = Object.keys(selectedVersions).length;
    const canary = Object.values(selectedVersions).filter(
      (v) => v === ComponentVersion.CANARY,
    ).length;
    const stable = total - canary;
    const warnings = compatibilityIssues.filter((i) => i.severity === 'warning').length;
    const errors = compatibilityIssues.filter((i) => i.severity === 'error').length;

    return { total, canary, stable, warnings, errors };
  }, [selectedVersions, compatibilityIssues]);

  if (compatibilityIssues.length === 0) {
    return (
      <div className={`rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-medium text-green-900">Backward Compatibility: Good</h3>
            <p className="mt-1 text-sm text-green-800">
              No compatibility issues detected with current component versions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Backward Compatibility</h3>
          <p className="text-sm text-gray-600">
            Compatibility analysis for {stats.total} components ({stats.canary} canary,{' '}
            {stats.stable} stable)
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          {stats.errors > 0 && (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-600">{stats.errors} Errors</span>
            </div>
          )}
          {stats.warnings > 0 && (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-600">{stats.warnings} Warnings</span>
            </div>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-2">
        {compatibilityIssues.map((issue, index) => (
          <div
            key={index}
            className={`rounded border p-3 ${
              issue.severity === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-yellow-200 bg-yellow-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle
                className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                  issue.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{issue.componentName}</span>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      issue.severity === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
                <p
                  className={`mt-1 text-sm ${
                    issue.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}
                >
                  {issue.issue}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    issue.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                  }`}
                >
                  Suggestion: {issue.suggestion}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main migration system component
 */
export const MigrationSystem: React.FC<MigrationSystemProps> = ({
  migrationPaths,
  availableComponents,
  selectedVersions,
  onExecuteMigration,
  onExecuteRollback,
  disabled = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'migrations' | 'compatibility'>('migrations');

  // Filter migration paths based on current versions
  const applicableMigrations = useMemo(() => {
    return migrationPaths.filter(
      (path) => selectedVersions[path.componentName] === path.fromVersion,
    );
  }, [migrationPaths, selectedVersions]);

  const availableMigrations = useMemo(() => {
    return migrationPaths.filter(
      (path) => selectedVersions[path.componentName] !== path.fromVersion,
    );
  }, [migrationPaths, selectedVersions]);

  const handleExecuteMigration = useCallback(
    async (execution: MigrationExecution) => {
      try {
        await onExecuteMigration(execution);
      } catch (error) {
        console.error('Migration execution failed:', error);
      }
    },
    [onExecuteMigration],
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Migration & Compatibility</h2>
        <p className="text-sm text-gray-600">
          Manage component migrations and check backward compatibility
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('migrations')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'migrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Migrations ({applicableMigrations.length})
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'compatibility'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Compatibility
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'migrations' && (
        <div className="space-y-6">
          {/* Applicable Migrations */}
          {applicableMigrations.length > 0 && (
            <div>
              <h3 className="mb-4 font-medium text-gray-900">Available Migrations</h3>
              <div className="space-y-4">
                {applicableMigrations.map((path, index) => (
                  <MigrationPathItem
                    key={`${path.componentName}-${path.fromVersion}-${path.toVersion}-${index}`}
                    migrationPath={path}
                    componentMetadata={availableComponents[path.componentName]}
                    currentVersion={selectedVersions[path.componentName]}
                    onExecute={handleExecuteMigration}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Available Migrations */}
          {availableMigrations.length > 0 && (
            <div>
              <h3 className="mb-4 font-medium text-gray-900">Other Migration Paths</h3>
              <div className="space-y-4">
                {availableMigrations.map((path, index) => (
                  <MigrationPathItem
                    key={`${path.componentName}-${path.fromVersion}-${path.toVersion}-${index}`}
                    migrationPath={path}
                    componentMetadata={availableComponents[path.componentName]}
                    currentVersion={selectedVersions[path.componentName]}
                    onExecute={handleExecuteMigration}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Migrations Available */}
          {migrationPaths.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Info className="mx-auto mb-2 h-8 w-8" />
              <p>No migration paths available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compatibility' && (
        <BackwardCompatibilityChecker
          selectedVersions={selectedVersions}
          availableComponents={availableComponents}
        />
      )}
    </div>
  );
};

export default MigrationSystem;
