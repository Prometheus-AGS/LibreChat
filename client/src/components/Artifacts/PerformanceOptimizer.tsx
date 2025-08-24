import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Zap, Package, Clock, TrendingUp, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { ComponentVersion, ComponentMetadata } from 'librechat-data-provider';

/**
 * Props for the PerformanceOptimizer component
 */
interface PerformanceOptimizerProps {
  /** Available components with their metadata */
  availableComponents: Record<string, ComponentMetadata>;
  /** Currently selected component versions */
  selectedVersions: Record<string, ComponentVersion>;
  /** Current bundle size information */
  bundleInfo?: BundleInfo;
  /** Performance metrics */
  performanceMetrics?: PerformanceMetrics;
  /** Callback when optimization settings change */
  onOptimizationChange: (settings: OptimizationSettings) => void;
  /** Whether the optimizer is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Bundle information structure
 */
interface BundleInfo {
  totalSize: number;
  gzippedSize: number;
  componentSizes: Record<string, number>;
  unusedComponents: string[];
  duplicateComponents: string[];
  loadTime: number;
}

/**
 * Performance metrics structure
 */
interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  bundleParseTime: number;
}

/**
 * Optimization settings structure
 */
interface OptimizationSettings {
  enableLazyLoading: boolean;
  enableTreeShaking: boolean;
  enableCodeSplitting: boolean;
  enableComponentCaching: boolean;
  bundleSizeThreshold: number;
  loadTimeThreshold: number;
  excludedComponents: string[];
  preloadComponents: string[];
}

/**
 * Component usage analytics
 */
interface ComponentUsage {
  componentName: string;
  usageCount: number;
  loadFrequency: number;
  averageLoadTime: number;
  bundleImpact: number;
  isEssential: boolean;
}

/**
 * Optimization recommendation
 */
interface OptimizationRecommendation {
  type: 'lazy-load' | 'preload' | 'remove' | 'downgrade' | 'cache';
  componentName: string;
  currentImpact: number;
  potentialSavings: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

/**
 * Bundle analyzer component
 */
interface BundleAnalyzerProps {
  bundleInfo: BundleInfo;
  componentUsage: ComponentUsage[];
  onOptimize: (recommendations: OptimizationRecommendation[]) => void;
}

const BundleAnalyzer: React.FC<BundleAnalyzerProps> = ({
  bundleInfo,
  componentUsage,
  onOptimize,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Generate optimization recommendations
  const recommendations = useMemo(() => {
    const recs: OptimizationRecommendation[] = [];

    // Analyze unused components
    bundleInfo.unusedComponents.forEach((componentName) => {
      const usage = componentUsage.find((u) => u.componentName === componentName);
      const size = bundleInfo.componentSizes[componentName] || 0;

      recs.push({
        type: 'remove',
        componentName,
        currentImpact: size,
        potentialSavings: size,
        description: 'Remove unused component to reduce bundle size',
        priority: size > 50000 ? 'high' : size > 20000 ? 'medium' : 'low',
        effort: 'low',
      });
    });

    // Analyze rarely used components for lazy loading
    componentUsage
      .filter((usage) => usage.loadFrequency < 0.3 && !usage.isEssential)
      .forEach((usage) => {
        const size = bundleInfo.componentSizes[usage.componentName] || 0;
        const savings = size * 0.8; // Assume 80% savings from lazy loading

        recs.push({
          type: 'lazy-load',
          componentName: usage.componentName,
          currentImpact: size,
          potentialSavings: savings,
          description: 'Lazy load rarely used component to improve initial load time',
          priority: savings > 30000 ? 'high' : savings > 10000 ? 'medium' : 'low',
          effort: 'medium',
        });
      });

    // Analyze frequently used components for preloading
    componentUsage
      .filter((usage) => usage.loadFrequency > 0.8 && usage.averageLoadTime > 100)
      .forEach((usage) => {
        const improvement = usage.averageLoadTime * 0.6; // Assume 60% improvement

        recs.push({
          type: 'preload',
          componentName: usage.componentName,
          currentImpact: usage.averageLoadTime,
          potentialSavings: improvement,
          description: 'Preload frequently used component to reduce perceived load time',
          priority: improvement > 200 ? 'high' : improvement > 100 ? 'medium' : 'low',
          effort: 'low',
        });
      });

    // Analyze large components for caching
    componentUsage
      .filter((usage) => bundleInfo.componentSizes[usage.componentName] > 100000)
      .forEach((usage) => {
        const size = bundleInfo.componentSizes[usage.componentName];
        const savings = size * 0.9; // Assume 90% cache hit rate

        recs.push({
          type: 'cache',
          componentName: usage.componentName,
          currentImpact: size,
          potentialSavings: savings,
          description: 'Enable aggressive caching for large component',
          priority: savings > 200000 ? 'high' : savings > 100000 ? 'medium' : 'low',
          effort: 'low',
        });
      });

    return recs.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }, [bundleInfo, componentUsage]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  const getTypeIcon = (type: OptimizationRecommendation['type']) => {
    switch (type) {
      case 'lazy-load':
        return <Clock className="h-4 w-4" />;
      case 'preload':
        return <Zap className="h-4 w-4" />;
      case 'remove':
        return <Package className="h-4 w-4" />;
      case 'cache':
        return <Settings className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Bundle Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Size</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {formatBytes(bundleInfo.totalSize)}
          </p>
          <p className="text-xs text-blue-700">{formatBytes(bundleInfo.gzippedSize)} gzipped</p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Load Time</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-900">{bundleInfo.loadTime}ms</p>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Unused</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-yellow-900">
            {bundleInfo.unusedComponents.length}
          </p>
          <p className="text-xs text-yellow-700">components</p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">Duplicates</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-900">
            {bundleInfo.duplicateComponents.length}
          </p>
          <p className="text-xs text-red-700">components</p>
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Optimization Recommendations</h3>
          <button
            onClick={() => onOptimize(recommendations)}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
          >
            Apply All
          </button>
        </div>

        <div className="space-y-3">
          {recommendations.slice(0, 10).map((rec, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">{getTypeIcon(rec.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{rec.componentName}</span>
                      <span
                        className={`rounded border px-2 py-1 text-xs ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority} priority
                      </span>
                      <span className="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-800">
                        {rec.effort} effort
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Current: {formatBytes(rec.currentImpact)}</span>
                      <span>Savings: {formatBytes(rec.potentialSavings)}</span>
                      <span>Type: {rec.type}</span>
                    </div>
                  </div>
                </div>
                <button className="rounded border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-50">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>

        {recommendations.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <CheckCircle className="mx-auto mb-2 h-8 w-8" />
            <p>No optimization recommendations available</p>
            <p className="text-sm">Your bundle is already well optimized!</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Performance metrics dashboard
 */
interface PerformanceMetricsDashboardProps {
  metrics: PerformanceMetrics;
  className?: string;
}

const PerformanceMetricsDashboard: React.FC<PerformanceMetricsDashboardProps> = ({
  metrics,
  className = '',
}) => {
  const getMetricStatus = (
    value: number,
    thresholds: { good: number; needs_improvement: number },
  ) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needs_improvement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'poor':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const performanceData = [
    {
      name: 'First Contentful Paint',
      value: metrics.firstContentfulPaint,
      unit: 'ms',
      thresholds: { good: 1800, needs_improvement: 3000 },
      description: 'Time when first text/image is painted',
    },
    {
      name: 'Largest Contentful Paint',
      value: metrics.largestContentfulPaint,
      unit: 'ms',
      thresholds: { good: 2500, needs_improvement: 4000 },
      description: 'Time when largest content element is painted',
    },
    {
      name: 'Cumulative Layout Shift',
      value: metrics.cumulativeLayoutShift,
      unit: '',
      thresholds: { good: 0.1, needs_improvement: 0.25 },
      description: 'Visual stability of the page',
    },
    {
      name: 'First Input Delay',
      value: metrics.firstInputDelay,
      unit: 'ms',
      thresholds: { good: 100, needs_improvement: 300 },
      description: 'Time from first interaction to browser response',
    },
    {
      name: 'Time to Interactive',
      value: metrics.timeToInteractive,
      unit: 'ms',
      thresholds: { good: 3800, needs_improvement: 7300 },
      description: 'Time when page becomes fully interactive',
    },
    {
      name: 'Bundle Parse Time',
      value: metrics.bundleParseTime,
      unit: 'ms',
      thresholds: { good: 500, needs_improvement: 1000 },
      description: 'Time to parse JavaScript bundle',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-medium text-gray-900">Performance Metrics</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {performanceData.map((metric) => {
          const status = getMetricStatus(metric.value, metric.thresholds);
          return (
            <div key={metric.name} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                <span className={`rounded border px-2 py-1 text-xs ${getStatusColor(status)}`}>
                  {status.replace('-', ' ')}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {metric.value.toFixed(metric.name === 'Cumulative Layout Shift' ? 3 : 0)}
                <span className="ml-1 text-sm font-normal text-gray-500">{metric.unit}</span>
              </p>
              <p className="mt-1 text-xs text-gray-600">{metric.description}</p>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      status === 'good'
                        ? 'bg-green-500'
                        : status === 'needs-improvement'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (metric.value / metric.thresholds.needs_improvement) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Main performance optimizer component
 */
export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  availableComponents,
  selectedVersions,
  bundleInfo,
  performanceMetrics,
  onOptimizationChange,
  disabled = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bundle' | 'metrics' | 'settings'>(
    'overview',
  );
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    enableLazyLoading: true,
    enableTreeShaking: true,
    enableCodeSplitting: true,
    enableComponentCaching: true,
    bundleSizeThreshold: 500000, // 500KB
    loadTimeThreshold: 3000, // 3 seconds
    excludedComponents: [],
    preloadComponents: [],
  });

  // Mock component usage data (in real implementation, this would come from analytics)
  const componentUsage = useMemo(() => {
    return Object.keys(selectedVersions).map((componentName) => ({
      componentName,
      usageCount: Math.floor(Math.random() * 100) + 1,
      loadFrequency: Math.random(),
      averageLoadTime: Math.floor(Math.random() * 500) + 50,
      bundleImpact: bundleInfo?.componentSizes[componentName] || Math.floor(Math.random() * 100000),
      isEssential: ['button', 'input', 'dialog'].includes(componentName.toLowerCase()),
    }));
  }, [selectedVersions, bundleInfo]);

  const handleOptimizationSettingsChange = useCallback(
    (newSettings: Partial<OptimizationSettings>) => {
      const updatedSettings = { ...optimizationSettings, ...newSettings };
      setOptimizationSettings(updatedSettings);
      onOptimizationChange(updatedSettings);
    },
    [optimizationSettings, onOptimizationChange],
  );

  const handleApplyRecommendations = useCallback(
    (recommendations: OptimizationRecommendation[]) => {
      const newSettings = { ...optimizationSettings };

      recommendations.forEach((rec) => {
        switch (rec.type) {
          case 'lazy-load':
            if (!newSettings.excludedComponents.includes(rec.componentName)) {
              newSettings.excludedComponents.push(rec.componentName);
            }
            break;
          case 'preload':
            if (!newSettings.preloadComponents.includes(rec.componentName)) {
              newSettings.preloadComponents.push(rec.componentName);
            }
            break;
        }
      });

      handleOptimizationSettingsChange(newSettings);
    },
    [optimizationSettings, handleOptimizationSettingsChange],
  );

  // Calculate overall performance score
  const performanceScore = useMemo(() => {
    if (!performanceMetrics || !bundleInfo) return 0;

    const fcpScore = Math.max(0, 100 - performanceMetrics.firstContentfulPaint / 30);
    const lcpScore = Math.max(0, 100 - performanceMetrics.largestContentfulPaint / 40);
    const clsScore = Math.max(0, 100 - performanceMetrics.cumulativeLayoutShift * 400);
    const fidScore = Math.max(0, 100 - performanceMetrics.firstInputDelay / 3);
    const bundleScore = Math.max(0, 100 - bundleInfo.totalSize / 10000);

    return Math.round((fcpScore + lcpScore + clsScore + fidScore + bundleScore) / 5);
  }, [performanceMetrics, bundleInfo]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Performance Optimizer</h2>
          <p className="text-sm text-gray-600">Optimize component loading and bundle performance</p>
        </div>
        {performanceScore > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Performance Score:</span>
            <div
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                performanceScore >= 80
                  ? 'bg-green-100 text-green-800'
                  : performanceScore >= 60
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {performanceScore}/100
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'bundle', label: 'Bundle Analysis' },
            { id: 'metrics', label: 'Performance Metrics' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {performanceMetrics && <PerformanceMetricsDashboard metrics={performanceMetrics} />}

          {bundleInfo && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-medium text-blue-900">Bundle Size</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {(bundleInfo.totalSize / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-blue-700">
                  {bundleInfo.unusedComponents.length} unused components
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="mb-2 font-medium text-green-900">Load Time</h3>
                <p className="text-2xl font-bold text-green-900">{bundleInfo.loadTime}ms</p>
                <p className="text-sm text-green-700">Initial page load</p>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <h3 className="mb-2 font-medium text-purple-900">Components</h3>
                <p className="text-2xl font-bold text-purple-900">
                  {Object.keys(selectedVersions).length}
                </p>
                <p className="text-sm text-purple-700">Active components</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bundle' && bundleInfo && (
        <BundleAnalyzer
          bundleInfo={bundleInfo}
          componentUsage={componentUsage}
          onOptimize={handleApplyRecommendations}
        />
      )}

      {activeTab === 'metrics' && performanceMetrics && (
        <PerformanceMetricsDashboard metrics={performanceMetrics} />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="font-medium text-gray-900">Optimization Settings</h3>

          <div className="space-y-4">
            {/* Enable/Disable Options */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                {
                  key: 'enableLazyLoading',
                  label: 'Lazy Loading',
                  description: 'Load components only when needed',
                },
                {
                  key: 'enableTreeShaking',
                  label: 'Tree Shaking',
                  description: 'Remove unused code from bundle',
                },
                {
                  key: 'enableCodeSplitting',
                  label: 'Code Splitting',
                  description: 'Split code into smaller chunks',
                },
                {
                  key: 'enableComponentCaching',
                  label: 'Component Caching',
                  description: 'Cache components for faster loading',
                },
              ].map((option) => (
                <label
                  key={option.key}
                  className="flex items-start space-x-3 rounded-lg border border-gray-200 p-3"
                >
                  <input
                    type="checkbox"
                    checked={
                      optimizationSettings[option.key as keyof OptimizationSettings] as boolean
                    }
                    onChange={(e) =>
                      handleOptimizationSettingsChange({ [option.key]: e.target.checked })
                    }
                    disabled={disabled}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Threshold Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance Thresholds</h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bundle Size Threshold (KB)
                  </label>
                  <input
                    type="number"
                    value={optimizationSettings.bundleSizeThreshold / 1024}
                    onChange={(e) =>
                      handleOptimizationSettingsChange({
                        bundleSizeThreshold: parseInt(e.target.value) * 1024,
                      })
                    }
                    disabled={disabled}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Load Time Threshold (ms)
                  </label>
                  <input
                    type="number"
                    value={optimizationSettings.loadTimeThreshold}
                    onChange={(e) =>
                      handleOptimizationSettingsChange({
                        loadTimeThreshold: parseInt(e.target.value),
                      })
                    }
                    disabled={disabled}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizer;
