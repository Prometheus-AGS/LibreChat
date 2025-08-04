import { createContext, useContext } from 'react';
import type { Artifact } from '~/common';
import { useGetStartupConfig } from '~/data-provider';
import { useAuthContext } from '~/hooks';

export type ArtifactMode = 'interactive' | 'static' | 'disabled';

export type TShareContext = {
  isSharedConvo?: boolean;
  isAuthenticated?: boolean;
  artifactMode?: ArtifactMode;
  sharedArtifacts?: Record<string, Artifact | undefined> | null;
  canViewArtifacts?: boolean;
  canInteractWithArtifacts?: boolean;
  artifactConfig?: {
    enabled?: boolean;
    sharedConversations?: {
      allowAnonymousPreview?: boolean;
      requireAuthentication?: boolean;
      previewMaxLength?: number;
      showLoginPrompt?: boolean;
      anonymousMessage?: string;
    };
    processing?: {
      enableSyntaxHighlighting?: boolean;
      enableHtmlPreviews?: boolean;
      sanitizeHtml?: boolean;
      maxFileSize?: number;
    };
  };
};

export const ShareContext = createContext<TShareContext>({} as TShareContext);
export const useShareContext = () => useContext(ShareContext);

/**
 * Hook to determine artifact access permissions based on authentication state and configuration
 */
export const useArtifactPermissions = () => {
  const shareContext = useShareContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { isAuthenticated: globalAuthState } = useAuthContext();

  // For shared conversations, use the context values directly from ShareView
  // but prioritize global authentication state for interactive access
  if (shareContext.isSharedConvo) {
    const config = shareContext.artifactConfig || startupConfig?.artifactConfig || {};
    const sharedConfig = config.sharedConversations || {};

    // For shared conversations, use global auth state to determine interactive access
    const isAuthenticated = globalAuthState || shareContext.isAuthenticated || false;
    const canInteractWithArtifacts =
      isAuthenticated && sharedConfig.requireAuthentication !== false;
    const artifactMode: ArtifactMode = canInteractWithArtifacts ? 'interactive' : 'static';

    return {
      canViewArtifacts: shareContext.canViewArtifacts ?? true,
      canInteractWithArtifacts,
      artifactMode,
      config: {
        ...config,
        sharedConversations: {
          allowAnonymousPreview: true,
          requireAuthentication: false,
          previewMaxLength: 5000,
          showLoginPrompt: true,
          anonymousMessage: 'Please log in to interact with artifacts',
          ...sharedConfig,
        },
        processing: {
          enableSyntaxHighlighting: true,
          enableHtmlPreviews: true,
          sanitizeHtml: true,
          maxFileSize: 1048576,
          ...config.processing,
        },
      },
    };
  }

  // For regular conversations, use the original logic
  const { isAuthenticated, artifactConfig } = shareContext;
  const config = artifactConfig || startupConfig?.artifactConfig || {};
  const artifactsEnabled = config.enabled !== false;

  const canViewArtifacts = artifactsEnabled;
  const canInteractWithArtifacts = artifactsEnabled && isAuthenticated;
  const artifactMode: ArtifactMode = isAuthenticated ? 'interactive' : 'static';

  return {
    canViewArtifacts,
    canInteractWithArtifacts,
    artifactMode,
    config: {
      ...config,
      sharedConversations: {
        allowAnonymousPreview: true,
        requireAuthentication: false,
        previewMaxLength: 5000,
        showLoginPrompt: true,
        anonymousMessage: 'Please log in to interact with artifacts',
        ...config.sharedConversations,
      },
      processing: {
        enableSyntaxHighlighting: true,
        enableHtmlPreviews: true,
        sanitizeHtml: true,
        maxFileSize: 1048576,
        ...config.processing,
      },
    },
  };
};
