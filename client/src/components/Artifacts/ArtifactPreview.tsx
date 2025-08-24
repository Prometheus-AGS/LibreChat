import React, { memo, useMemo, useEffect } from 'react';
import {
  SandpackPreview,
  SandpackProvider,
  SandpackProviderProps,
} from '@codesandbox/sandpack-react/unstyled';
import type { SandpackPreviewRef, SandpackFiles } from '@codesandbox/sandpack-react/unstyled';
import type { TStartupConfig, TSupabaseConfig } from 'librechat-data-provider';
import type { ArtifactFiles } from '~/common';
import { sharedFiles, sharedOptions } from '~/utils/artifacts';
import { useArtifactRegistryStore } from '~/store/artifact-registry';
import MarkdownArtifact from './MarkdownArtifact';
 
export const ArtifactPreview = memo(function ({
  files,
  type,
  fileKey,
  template,
  sharedProps,
  previewRef,
  currentCode,
  startupConfig,
  supabaseConfig,
  artifactId,
  enableRegistry = false,
  enableComposition = false,
}: {
  files: ArtifactFiles;
  fileKey: string;
  type: string;
  template: SandpackProviderProps['template'];
  sharedProps: Partial<SandpackProviderProps>;
  previewRef: React.MutableRefObject<SandpackPreviewRef>;
  currentCode?: string;
  startupConfig?: TStartupConfig;
  supabaseConfig?: TSupabaseConfig;
  artifactId?: string;
  enableRegistry?: boolean;
  enableComposition?: boolean;
}) {
  const { setFocusedArtifact, canModifyArtifact, loadedComponents } = useArtifactRegistryStore();

  // Set focus when artifact is being previewed
  useEffect(() => {
    if (artifactId && enableRegistry) {
      setFocusedArtifact(artifactId);
    }
    return () => {
      if (artifactId && enableRegistry) {
        setFocusedArtifact(null);
      }
    };
  }, [artifactId, enableRegistry, setFocusedArtifact]);

  const artifactFiles = useMemo(() => {
    if (Object.keys(files).length === 0) {
      return files;
    }
    const code = currentCode ?? '';
    if (!code) {
      return files;
    }
    return {
      ...files,
      [fileKey]: {
        code,
      },
    };
  }, [currentCode, files, fileKey]);

  const options: typeof sharedOptions = useMemo(() => {
    if (!startupConfig) {
      return sharedOptions;
    }
    const _options: typeof sharedOptions = {
      ...sharedOptions,
      bundlerURL: template === 'static' ? startupConfig.staticBundlerURL : startupConfig.bundlerURL,
    };

    return _options;
  }, [startupConfig, template]);

  const enhancedFiles = useMemo((): SandpackFiles => {
    if (Object.keys(artifactFiles).length === 0) {
      return {};
    }

    // Start with base files, ensuring proper typing
    const baseFiles: SandpackFiles = {};

    // Process artifact files
    Object.entries(artifactFiles).forEach(([key, value]) => {
      if (value !== undefined) {
        baseFiles[key] = typeof value === 'string' ? value : value;
      }
    });

    // Process shared files
    Object.entries(sharedFiles).forEach(([key, value]) => {
      if (value !== undefined) {
        baseFiles[key] = value;
      }
    });

    // Inject artifact registry configuration if enabled
    if (enableRegistry || enableComposition) {
      const registryConfig = {
        enabled: enableRegistry,
        compositionEnabled: enableComposition,
        artifactId: artifactId,
        canModify: artifactId ? canModifyArtifact(artifactId) : true,
      };

      const registryConfigScript = `
        <script>
          window.__LIBRECHAT_ARTIFACT_REGISTRY__ = ${JSON.stringify(registryConfig)};
        </script>
      `;

      // Try to inject into index.html first
      if (baseFiles['index.html']) {
        const htmlContent =
          typeof baseFiles['index.html'] === 'string'
            ? baseFiles['index.html']
            : baseFiles['index.html'].code || '';

        baseFiles['index.html'] = htmlContent.replace(
          /<\/head>/i,
          `${registryConfigScript}</head>`,
        );
      }
      // Try to inject into public/index.html for React templates
      else if (baseFiles['public/index.html']) {
        const htmlContent =
          typeof baseFiles['public/index.html'] === 'string'
            ? baseFiles['public/index.html']
            : baseFiles['public/index.html'].code || '';

        baseFiles['public/index.html'] = htmlContent.replace(
          /<\/head>/i,
          `${registryConfigScript}</head>`,
        );
      }
    }

    // Inject Supabase configuration as a global variable if enabled
    if (supabaseConfig?.enabled) {
      const supabaseConfigScript = `
        <script>
          window.__LIBRECHAT_SUPABASE_CONFIG__ = ${JSON.stringify(supabaseConfig)};
        </script>
      `;

      // Try to inject into index.html first
      if (baseFiles['index.html']) {
        const htmlContent =
          typeof baseFiles['index.html'] === 'string'
            ? baseFiles['index.html']
            : baseFiles['index.html'].code || '';

        baseFiles['index.html'] = htmlContent.replace(
          /<\/head>/i,
          `${supabaseConfigScript}</head>`,
        );
      }
      // Try to inject into public/index.html for React templates
      else if (baseFiles['public/index.html']) {
        const htmlContent =
          typeof baseFiles['public/index.html'] === 'string'
            ? baseFiles['public/index.html']
            : baseFiles['public/index.html'].code || '';

        baseFiles['public/index.html'] = htmlContent.replace(
          /<\/head>/i,
          `${supabaseConfigScript}</head>`,
        );
      }
    }

    // Inject Proxy configuration for unrestricted network access
    const proxyConfig = {
      enabled: true,
      endpoint: '/api/artifacts/proxy',
      token: localStorage.getItem('token') || sessionStorage.getItem('token'),
    };

    const proxyConfigScript = `
      <script>
        window.__LIBRECHAT_PROXY_CONFIG__ = ${JSON.stringify(proxyConfig)};
      </script>
    `;

    // Try to inject into index.html first
    if (baseFiles['index.html']) {
      const htmlContent =
        typeof baseFiles['index.html'] === 'string'
          ? baseFiles['index.html']
          : baseFiles['index.html'].code || '';

      baseFiles['index.html'] = htmlContent.replace(
        /<\/head>/i,
        `${proxyConfigScript}</head>`,
      );
    }
    // Try to inject into public/index.html for React templates
    else if (baseFiles['public/index.html']) {
      const htmlContent =
        typeof baseFiles['public/index.html'] === 'string'
          ? baseFiles['public/index.html']
          : baseFiles['public/index.html'].code || '';

      baseFiles['public/index.html'] = htmlContent.replace(
        /<\/head>/i,
        `${proxyConfigScript}</head>`,
      );
    }

    // Process ArtifactContainer components if composition is enabled
    if (enableComposition) {
      Object.entries(baseFiles).forEach(([filePath, fileContent]) => {
        if (
          typeof fileContent === 'string' ||
          (fileContent && typeof fileContent.code === 'string')
        ) {
          const code = typeof fileContent === 'string' ? fileContent : fileContent.code || '';

          // Look for ArtifactContainer usage and replace with actual components
          const artifactContainerRegex =
            /<ArtifactContainer\s+componentId=["']([^"']+)["'][^>]*\/?>(?:<\/ArtifactContainer>)?/g;
          let match;
          let modifiedCode = code;

          while ((match = artifactContainerRegex.exec(code)) !== null) {
            const componentId = match[1];
            const fullMatch = match[0];

            // Check if we have the component loaded
            const loadedComponent = loadedComponents.get(componentId);
            if (loadedComponent) {
              // Replace ArtifactContainer with actual component code
              const componentCode = `
                // Embedded component: ${componentId}
                ${loadedComponent.code}
              `;
              modifiedCode = modifiedCode.replace(fullMatch, componentCode);
            } else {
              // For now, show a placeholder for missing components
              const placeholder = `
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Component not found: ${componentId}</div>
                  <div className="text-xs text-gray-500 mt-1">Check artifact registry</div>
                </div>
              `;
              modifiedCode = modifiedCode.replace(fullMatch, placeholder);
            }
          }

          if (modifiedCode !== code) {
            baseFiles[filePath] =
              typeof fileContent === 'string'
                ? modifiedCode
                : { ...fileContent, code: modifiedCode };
          }
        }
      });
    }

    return baseFiles;
  }, [
    artifactFiles,
    sharedFiles,
    supabaseConfig,
    enableRegistry,
    enableComposition,
    artifactId,
    canModifyArtifact,
    loadedComponents,
  ]);

  if (Object.keys(artifactFiles).length === 0) {
    return null;
  }

  if (type === 'markdown') {
    return <MarkdownArtifact content={currentCode ?? ''} />;
  }
  // If registry is enabled and we have an artifactId, wrap in ArtifactContainer for focus management
  if (enableRegistry && artifactId) {
    return (
      <div className="relative">
        <SandpackProvider
          files={enhancedFiles}
          options={options}
          {...sharedProps}
          template={template}
        >
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            tabIndex={0}
            ref={previewRef}
          />
        </SandpackProvider>
 
        {/* Focus indicator for registry mode */}
        <div className="absolute right-2 top-2 z-10">
          <div
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              canModifyArtifact(artifactId)
                ? 'border border-green-200 bg-green-100 text-green-800'
                : 'border border-gray-200 bg-gray-100 text-gray-600'
            } `}
          >
            {canModifyArtifact(artifactId) ? 'Editable' : 'Read-only'}
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <SandpackProvider files={enhancedFiles} options={options} {...sharedProps} template={template}>
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        tabIndex={0}
        ref={previewRef}
      />
    </SandpackProvider>
  );
});
