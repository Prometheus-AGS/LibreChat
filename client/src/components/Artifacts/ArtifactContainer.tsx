import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { useArtifactRegistryStore } from '~/store/artifact-registry';
import type { ArtifactSupabaseConfig } from 'librechat-data-provider';

interface ArtifactContainerProps {
  /** Component ID from the registry */
  componentId: string;
  /** Specific version to load (defaults to 'latest') */
  version?: string;
  /** Props to pass to the loaded component */
  componentProps?: Record<string, any>;
  /** Supabase configuration for data-driven components */
  supabaseConfig?: ArtifactSupabaseConfig;
  /** Container styling */
  className?: string;
  /** Show loading placeholder */
  showPlaceholder?: boolean;
  /** Enable error recovery */
  enableRetry?: boolean;
  /** Container title for placeholder */
  title?: string;
  /** Container description for placeholder */
  description?: string;
}

interface ComponentErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentId: string;
  enableRetry: boolean;
}

/**
 * Error fallback component for failed component loads
 */
function ComponentErrorFallback({
  error,
  resetErrorBoundary,
  componentId,
  enableRetry,
}: ComponentErrorFallbackProps) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Component Load Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Failed to load component: <Badge variant="outline">{componentId}</Badge>
          </p>
          <p className="font-mono text-xs text-destructive">{error.message}</p>
        </div>
        {enableRetry && (
          <Button onClick={resetErrorBoundary} variant="outline" size="sm" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Loading Component
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading placeholder component
 */
function LoadingPlaceholder({
  title,
  description,
  componentId,
}: {
  title?: string;
  description?: string;
  componentId: string;
}) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {title || 'Loading Component'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {description || 'Fetching component from registry...'}
          </p>
          <Badge variant="secondary">{componentId}</Badge>
        </div>
        <div className="flex space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dynamic component wrapper that handles runtime loading
 */
function DynamicComponentWrapper({
  componentCode,
  componentProps,
  supabaseConfig,
}: {
  componentCode: string;
  componentProps?: Record<string, any>;
  supabaseConfig?: ArtifactSupabaseConfig;
}) {
  const Component = useMemo(() => {
    try {
      // Create a function that returns the component
      // In production, this would use a more secure evaluation method
      const componentFunction = new Function(
        'React',
        'supabaseConfig',
        'props',
        `
        ${componentCode}
        return typeof exports !== 'undefined' ? exports.default : 
               typeof module !== 'undefined' && module.exports ? module.exports.default :
               eval('(' + arguments[0] + ')');
        `,
      );

      return componentFunction(React, supabaseConfig, componentProps);
    } catch (error) {
      console.error('Error creating dynamic component:', error);
      throw new Error(`Failed to create component: ${error.message}`);
    }
  }, [componentCode, supabaseConfig]);

  if (!Component) {
    throw new Error('Component could not be created from provided code');
  }

  return <Component {...componentProps} supabaseConfig={supabaseConfig} />;
}

/**
 * ArtifactContainer - The core component for dynamic artifact loading
 *
 * This component acts as both a placeholder and a runtime loader for components
 * from the artifact registry. It's the key to the containment system - LLMs only
 * see this container reference, never the actual implementation code.
 */
export default function ArtifactContainer({
  componentId,
  version = 'latest',
  componentProps = {},
  supabaseConfig,
  className = '',
  showPlaceholder = true,
  enableRetry = true,
  title,
  description,
}: ArtifactContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [componentCode, setComponentCode] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    fetchComponent,
    canModifyArtifact,
    focusedArtifactId,
    componentError,
    isLoadingComponent,
  } = useArtifactRegistryStore();

  // Check if this component can be modified (containment system)
  const isModifiable = canModifyArtifact(componentId);
  const isFocused = focusedArtifactId === componentId;

  // Load component code
  useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      if (!componentId) {
        setError('Component ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchComponent(componentId, version);

        if (!mounted) return;

        if (response.code) {
          setComponentCode(response.code);
        } else {
          throw new Error('No component code received');
        }
      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Failed to load component:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [componentId, version, fetchComponent, retryCount]);

  // Handle retry
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  // Show loading placeholder
  if ((isLoading || isLoadingComponent) && showPlaceholder) {
    return (
      <div className={className}>
        <LoadingPlaceholder title={title} description={description} componentId={componentId} />
      </div>
    );
  }

  // Show error state
  if (error || componentError) {
    return (
      <div className={className}>
        <ComponentErrorFallback
          error={new Error(error || componentError || 'Unknown error')}
          resetErrorBoundary={handleRetry}
          componentId={componentId}
          enableRetry={enableRetry}
        />
      </div>
    );
  }

  // Show component not loaded state
  if (!componentCode) {
    return (
      <div className={className}>
        <Card className="border-muted">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Component not available: {componentId}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the dynamic component
  return (
    <div
      className={`artifact-container ${className} ${isFocused ? 'ring-2 ring-primary' : ''}`}
      data-component-id={componentId}
      data-version={version}
      data-modifiable={isModifiable}
    >
      <ErrorBoundary
        FallbackComponent={(props) => (
          <ComponentErrorFallback {...props} componentId={componentId} enableRetry={enableRetry} />
        )}
        onReset={handleRetry}
        resetKeys={[componentId, version, retryCount]}
      >
        <Suspense
          fallback={
            showPlaceholder ? (
              <LoadingPlaceholder
                title="Rendering Component"
                description="Initializing component..."
                componentId={componentId}
              />
            ) : (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )
          }
        >
          <DynamicComponentWrapper
            componentCode={componentCode}
            componentProps={componentProps}
            supabaseConfig={supabaseConfig}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Export types for use in other components
export type { ArtifactContainerProps };
