import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ComponentVersion,
  ComponentMetadata,
  VersionConflict,
  MigrationPath,
} from 'librechat-data-provider';
import { ComponentVersionSelector } from '../ComponentVersionSelector';
import { ConflictResolutionSystem } from '../ConflictResolutionSystem';
import { MigrationSystem } from '../MigrationSystem';
import { PerformanceOptimizer } from '../PerformanceOptimizer';

/**
 * Mock data for testing
 */
const mockAvailableComponents: Record<string, ComponentMetadata> = {
  sidebar: {
    name: 'sidebar',
    version: ComponentVersion.CANARY,
    dependencies: ['@radix-ui/react-slot'],
    conflicts: ['old-sidebar'],
    description: 'Modern sidebar component with collapsible navigation',
    isExperimental: true,
    breakingChanges: ['Changed API structure', 'Removed deprecated props'],
  },
  command: {
    name: 'command',
    version: ComponentVersion.CANARY,
    dependencies: ['@radix-ui/react-dialog', 'cmdk'],
    conflicts: [],
    description: 'Command palette component for quick actions',
    isExperimental: false,
    stableIn: '2.0.0',
  },
  button: {
    name: 'button',
    version: ComponentVersion.STABLE,
    dependencies: [],
    conflicts: [],
    description: 'Basic button component',
    isExperimental: false,
  },
};

const mockSelectedVersions: Record<string, ComponentVersion> = {
  sidebar: ComponentVersion.CANARY,
  command: ComponentVersion.STABLE,
  button: ComponentVersion.STABLE,
};

const mockConflicts: VersionConflict[] = [
  {
    componentName: 'sidebar',
    requestedVersion: ComponentVersion.CANARY,
    conflictingComponents: ['old-sidebar', 'legacy-nav'],
    resolution: 'manual',
    suggestedAction: 'Upgrade conflicting components or use stable version',
  },
];

const mockMigrationPaths: MigrationPath[] = [
  {
    fromVersion: ComponentVersion.STABLE,
    toVersion: ComponentVersion.CANARY,
    componentName: 'sidebar',
    isBreaking: true,
    migrationSteps: [
      'Update import statements',
      'Replace deprecated props',
      'Test component functionality',
      'Update documentation',
    ],
  },
  {
    fromVersion: ComponentVersion.CANARY,
    toVersion: ComponentVersion.STABLE,
    componentName: 'sidebar',
    isBreaking: false,
    migrationSteps: ['Revert to stable API', 'Remove experimental features'],
  },
];

const mockBundleInfo = {
  totalSize: 1024000,
  gzippedSize: 256000,
  componentSizes: {
    sidebar: 150000,
    command: 80000,
    button: 20000,
  },
  unusedComponents: ['old-component'],
  duplicateComponents: [],
  loadTime: 1200,
};

const mockPerformanceMetrics = {
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 50,
  timeToInteractive: 3000,
  bundleParseTime: 400,
};

/**
 * Test suite for ComponentVersionSelector
 */
describe('ComponentVersionSelector', () => {
  const mockOnVersionChange = jest.fn();

  beforeEach(() => {
    mockOnVersionChange.mockClear();
  });

  it('renders component list correctly', () => {
    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
      />,
    );

    expect(screen.getByText('sidebar')).toBeInTheDocument();
    expect(screen.getByText('command')).toBeInTheDocument();
    expect(screen.getByText('button')).toBeInTheDocument();
  });

  it('displays version badges correctly', () => {
    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
      />,
    );

    expect(screen.getByText('canary')).toBeInTheDocument();
    expect(screen.getAllByText('stable')).toHaveLength(2);
  });

  it('shows experimental badge for experimental components', () => {
    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
      />,
    );

    expect(screen.getByText('Experimental')).toBeInTheDocument();
  });

  it('handles version change correctly', async () => {
    const user = userEvent.setup();

    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
      />,
    );

    // Expand sidebar component details
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Change version to canary
    const canaryRadio = screen.getByDisplayValue('canary');
    await user.click(canaryRadio);

    expect(mockOnVersionChange).toHaveBeenCalledWith('sidebar', ComponentVersion.CANARY);
  });

  it('filters components by search term', async () => {
    const user = userEvent.setup();

    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search components...');
    await user.type(searchInput, 'sidebar');

    expect(screen.getByText('sidebar')).toBeInTheDocument();
    expect(screen.queryByText('command')).not.toBeInTheDocument();
    expect(screen.queryByText('button')).not.toBeInTheDocument();
  });

  it('shows conflicts when present', () => {
    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
        conflicts={mockConflicts}
      />,
    );

    expect(screen.getByText('1 Conflicts')).toBeInTheDocument();
    expect(screen.getByText('Version Conflicts Detected')).toBeInTheDocument();
  });

  it('applies bulk version changes', async () => {
    const user = userEvent.setup();

    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
      />,
    );

    const allCanaryButton = screen.getByText('All Canary');
    await user.click(allCanaryButton);

    expect(mockOnVersionChange).toHaveBeenCalledTimes(3);
    expect(mockOnVersionChange).toHaveBeenCalledWith('sidebar', ComponentVersion.CANARY);
    expect(mockOnVersionChange).toHaveBeenCalledWith('command', ComponentVersion.CANARY);
    expect(mockOnVersionChange).toHaveBeenCalledWith('button', ComponentVersion.CANARY);
  });
});

/**
 * Test suite for ConflictResolutionSystem
 */
describe('ConflictResolutionSystem', () => {
  const mockOnResolveConflicts = jest.fn();
  const mockOnApplyVersionChanges = jest.fn();

  beforeEach(() => {
    mockOnResolveConflicts.mockClear();
    mockOnApplyVersionChanges.mockClear();
  });

  it('shows no conflicts message when no conflicts exist', () => {
    render(
      <ConflictResolutionSystem
        conflicts={[]}
        availableComponents={mockAvailableComponents}
        migrationPaths={mockMigrationPaths}
        selectedVersions={mockSelectedVersions}
        onResolveConflicts={mockOnResolveConflicts}
        onApplyVersionChanges={mockOnApplyVersionChanges}
      />,
    );

    expect(screen.getByText('No Conflicts Detected')).toBeInTheDocument();
    expect(
      screen.getByText('All component versions are compatible with each other.'),
    ).toBeInTheDocument();
  });

  it('displays conflicts correctly', () => {
    render(
      <ConflictResolutionSystem
        conflicts={mockConflicts}
        availableComponents={mockAvailableComponents}
        migrationPaths={mockMigrationPaths}
        selectedVersions={mockSelectedVersions}
        onResolveConflicts={mockOnResolveConflicts}
        onApplyVersionChanges={mockOnApplyVersionChanges}
      />,
    );

    expect(screen.getByText('sidebar')).toBeInTheDocument();
    expect(
      screen.getByText('Upgrade conflicting components or use stable version'),
    ).toBeInTheDocument();
    expect(screen.getByText('old-sidebar')).toBeInTheDocument();
    expect(screen.getByText('legacy-nav')).toBeInTheDocument();
  });

  it('shows conflict statistics', () => {
    render(
      <ConflictResolutionSystem
        conflicts={mockConflicts}
        availableComponents={mockAvailableComponents}
        migrationPaths={mockMigrationPaths}
        selectedVersions={mockSelectedVersions}
        onResolveConflicts={mockOnResolveConflicts}
        onApplyVersionChanges={mockOnApplyVersionChanges}
      />,
    );

    expect(screen.getByText('1 Conflicts')).toBeInTheDocument();
    expect(screen.getByText('0 Resolved')).toBeInTheDocument();
  });

  it('expands conflict details', async () => {
    const user = userEvent.setup();

    render(
      <ConflictResolutionSystem
        conflicts={mockConflicts}
        availableComponents={mockAvailableComponents}
        migrationPaths={mockMigrationPaths}
        selectedVersions={mockSelectedVersions}
        onResolveConflicts={mockOnResolveConflicts}
        onApplyVersionChanges={mockOnApplyVersionChanges}
      />,
    );

    const expandButton = screen.getByRole('button', { name: /expand resolution options/i });
    await user.click(expandButton);

    expect(screen.getByText('Resolution Options')).toBeInTheDocument();
    expect(screen.getByText('Upgrade All to Canary')).toBeInTheDocument();
    expect(screen.getByText('Use Stable Versions')).toBeInTheDocument();
  });

  it('applies resolution correctly', async () => {
    const user = userEvent.setup();

    render(
      <ConflictResolutionSystem
        conflicts={mockConflicts}
        availableComponents={mockAvailableComponents}
        migrationPaths={mockMigrationPaths}
        selectedVersions={mockSelectedVersions}
        onResolveConflicts={mockOnResolveConflicts}
        onApplyVersionChanges={mockOnApplyVersionChanges}
      />,
    );

    // Expand conflict details
    const expandButton = screen.getByRole('button', { name: /expand resolution options/i });
    await user.click(expandButton);

    // Select resolution strategy
    const stableOption = screen.getByLabelText(/Use Stable Versions/);
    await user.click(stableOption);

    // Apply resolution
    const applyButton = screen.getByText('Apply Resolution');
    await user.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('1 resolution ready to apply')).toBeInTheDocument();
    });
  });
});

/**
 * Test suite for MigrationSystem
 */
describe('MigrationSystem', () => {
  const mockOnExecuteMigration = jest.fn();
  const mockOnExecuteRollback = jest.fn();

  beforeEach(() => {
    mockOnExecuteMigration.mockClear();
    mockOnExecuteRollback.mockClear();
  });

  it('shows migration paths correctly', () => {
    render(
      <MigrationSystem
        migrationPaths={mockMigrationPaths}
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onExecuteMigration={mockOnExecuteMigration}
        onExecuteRollback={mockOnExecuteRollback}
      />,
    );

    expect(screen.getByText('Migration & Compatibility')).toBeInTheDocument();
    expect(screen.getByText('sidebar')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();

    render(
      <MigrationSystem
        migrationPaths={mockMigrationPaths}
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onExecuteMigration={mockOnExecuteMigration}
        onExecuteRollback={mockOnExecuteRollback}
      />,
    );

    const compatibilityTab = screen.getByText('Compatibility');
    await user.click(compatibilityTab);

    expect(screen.getByText('Backward Compatibility')).toBeInTheDocument();
  });

  it('shows breaking changes warning', async () => {
    const user = userEvent.setup();

    render(
      <MigrationSystem
        migrationPaths={mockMigrationPaths}
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onExecuteMigration={mockOnExecuteMigration}
        onExecuteRollback={mockOnExecuteRollback}
      />,
    );

    // Expand migration details
    const expandButton = screen.getAllByRole('button')[1]; // Second button should be expand
    await user.click(expandButton);

    expect(screen.getByText('Breaking Changes')).toBeInTheDocument();
    expect(screen.getByText('This migration includes breaking changes')).toBeInTheDocument();
  });

  it('executes migration correctly', async () => {
    const user = userEvent.setup();

    render(
      <MigrationSystem
        migrationPaths={mockMigrationPaths}
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onExecuteMigration={mockOnExecuteMigration}
        onExecuteRollback={mockOnExecuteRollback}
      />,
    );

    // Expand migration details
    const expandButton = screen.getAllByRole('button')[1];
    await user.click(expandButton);

    // Execute migration
    const migrateButton = screen.getByText('Migrate');
    await user.click(migrateButton);

    await waitFor(() => {
      expect(mockOnExecuteMigration).toHaveBeenCalled();
    });
  });
});

/**
 * Test suite for PerformanceOptimizer
 */
describe('PerformanceOptimizer', () => {
  const mockOnOptimizationChange = jest.fn();

  beforeEach(() => {
    mockOnOptimizationChange.mockClear();
  });

  it('displays performance overview correctly', () => {
    render(
      <PerformanceOptimizer
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        bundleInfo={mockBundleInfo}
        performanceMetrics={mockPerformanceMetrics}
        onOptimizationChange={mockOnOptimizationChange}
      />,
    );

    expect(screen.getByText('Performance Optimizer')).toBeInTheDocument();
    expect(screen.getByText('1.00 MB')).toBeInTheDocument(); // Bundle size
    expect(screen.getByText('1200ms')).toBeInTheDocument(); // Load time
  });

  it('calculates performance score correctly', () => {
    render(
      <PerformanceOptimizer
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        bundleInfo={mockBundleInfo}
        performanceMetrics={mockPerformanceMetrics}
        onOptimizationChange={mockOnOptimizationChange}
      />,
    );

    expect(screen.getByText(/Performance Score:/)).toBeInTheDocument();
    expect(screen.getByText(/\/100/)).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();

    render(
      <PerformanceOptimizer
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        bundleInfo={mockBundleInfo}
        performanceMetrics={mockPerformanceMetrics}
        onOptimizationChange={mockOnOptimizationChange}
      />,
    );

    const bundleTab = screen.getByText('Bundle Analysis');
    await user.click(bundleTab);

    expect(screen.getByText('Total Size')).toBeInTheDocument();
    expect(screen.getByText('Load Time')).toBeInTheDocument();
  });

  it('shows performance metrics correctly', async () => {
    const user = userEvent.setup();

    render(
      <PerformanceOptimizer
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        bundleInfo={mockBundleInfo}
        performanceMetrics={mockPerformanceMetrics}
        onOptimizationChange={mockOnOptimizationChange}
      />,
    );

    const metricsTab = screen.getByText('Performance Metrics');
    await user.click(metricsTab);

    expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
    expect(screen.getByText('Largest Contentful Paint')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument(); // FCP value
  });

  it('updates optimization settings correctly', async () => {
    const user = userEvent.setup();

    render(
      <PerformanceOptimizer
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        bundleInfo={mockBundleInfo}
        performanceMetrics={mockPerformanceMetrics}
        onOptimizationChange={mockOnOptimizationChange}
      />,
    );

    const settingsTab = screen.getByText('Settings');
    await user.click(settingsTab);

    const lazyLoadingCheckbox = screen.getByLabelText(/Lazy Loading/);
    await user.click(lazyLoadingCheckbox);

    expect(mockOnOptimizationChange).toHaveBeenCalled();
  });
});

/**
 * Integration tests for the complete system
 */
describe('Component Versioning System Integration', () => {
  it('handles complete workflow from version selection to migration', async () => {
    const user = userEvent.setup();
    const mockOnVersionChange = jest.fn();
    const mockOnExecuteMigration = jest.fn();
    const mockOnExecuteRollback = jest.fn();

    const { rerender } = render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={mockOnVersionChange}
      />,
    );

    // Change version
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    const canaryRadio = screen.getByDisplayValue('canary');
    await user.click(canaryRadio);

    expect(mockOnVersionChange).toHaveBeenCalledWith('sidebar', ComponentVersion.CANARY);

    // Simulate version change and show migration system
    const updatedVersions = { ...mockSelectedVersions, sidebar: ComponentVersion.CANARY };

    rerender(
      <MigrationSystem
        migrationPaths={mockMigrationPaths}
        availableComponents={mockAvailableComponents}
        selectedVersions={updatedVersions}
        onExecuteMigration={mockOnExecuteMigration}
        onExecuteRollback={mockOnExecuteRollback}
      />,
    );

    expect(screen.getByText('Migration & Compatibility')).toBeInTheDocument();
  });

  it('handles conflict resolution workflow', async () => {
    const user = userEvent.setup();
    const mockOnResolveConflicts = jest.fn();
    const mockOnApplyVersionChanges = jest.fn();

    render(
      <ConflictResolutionSystem
        conflicts={mockConflicts}
        availableComponents={mockAvailableComponents}
        migrationPaths={mockMigrationPaths}
        selectedVersions={mockSelectedVersions}
        onResolveConflicts={mockOnResolveConflicts}
        onApplyVersionChanges={mockOnApplyVersionChanges}
      />,
    );

    // Expand and resolve conflict
    const expandButton = screen.getByRole('button', { name: /expand resolution options/i });
    await user.click(expandButton);

    const stableOption = screen.getByLabelText(/Use Stable Versions/);
    await user.click(stableOption);

    const applyButton = screen.getByText('Apply Resolution');
    await user.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('1 resolution ready to apply')).toBeInTheDocument();
    });

    // Apply all resolutions
    const applyAllButton = screen.getByText('Apply All Resolutions');
    await user.click(applyAllButton);

    await waitFor(() => {
      expect(mockOnApplyVersionChanges).toHaveBeenCalled();
    });
  });
});

/**
 * Performance and accessibility tests
 */
describe('Performance and Accessibility', () => {
  it('renders large component lists efficiently', () => {
    const largeComponentList: Record<string, ComponentMetadata> = {};
    const largeVersionList: Record<string, ComponentVersion> = {};

    // Generate 100 mock components
    for (let i = 0; i < 100; i++) {
      const name = `component-${i}`;
      largeComponentList[name] = {
        name,
        version: i % 2 === 0 ? ComponentVersion.STABLE : ComponentVersion.CANARY,
        dependencies: [],
        conflicts: [],
        description: `Test component ${i}`,
        isExperimental: i % 10 === 0,
      };
      largeVersionList[name] = i % 2 === 0 ? ComponentVersion.STABLE : ComponentVersion.CANARY;
    }

    const startTime = performance.now();

    render(
      <ComponentVersionSelector
        availableComponents={largeComponentList}
        selectedVersions={largeVersionList}
        onVersionChange={jest.fn()}
      />,
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (less than 100ms)
    expect(renderTime).toBeLessThan(100);
  });

  it('has proper accessibility attributes', () => {
    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={jest.fn()}
      />,
    );

    // Check for proper ARIA labels
    const searchInput = screen.getByPlaceholderText('Search components...');
    expect(searchInput).toHaveAttribute('type', 'text');

    // Check for proper button labels
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation correctly', async () => {
    const user = userEvent.setup();

    render(
      <ComponentVersionSelector
        availableComponents={mockAvailableComponents}
        selectedVersions={mockSelectedVersions}
        onVersionChange={jest.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search components...');

    // Tab navigation should work
    await user.tab();
    expect(searchInput).toHaveFocus();

    // Keyboard input should work
    await user.type(searchInput, 'sidebar');
    expect(searchInput).toHaveValue('sidebar');
  });
});
