import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShareContext, useArtifactPermissions, useShareContext } from '../ShareContext';
import { useGetStartupConfig } from '~/data-provider';

// Mock the useGetStartupConfig hook
jest.mock('~/data-provider', () => ({
  useGetStartupConfig: jest.fn(),
}));

const mockUseGetStartupConfig = useGetStartupConfig as jest.MockedFunction<
  typeof useGetStartupConfig
>;

// Test component to use the hooks
const TestComponent = () => {
  const shareContext = useShareContext();
  const permissions = useArtifactPermissions();

  return (
    <div>
      <div data-testid="is-shared">{shareContext.isSharedConvo ? 'true' : 'false'}</div>
      <div data-testid="is-authenticated">{shareContext.isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="artifact-mode">{permissions.artifactMode}</div>
      <div data-testid="can-view">{permissions.canViewArtifacts ? 'true' : 'false'}</div>
      <div data-testid="can-interact">
        {permissions.canInteractWithArtifacts ? 'true' : 'false'}
      </div>
    </div>
  );
};

describe('ShareContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetStartupConfig.mockReturnValue({
      data: {
        artifactConfig: {
          enabled: true,
          sharedConversations: {
            allowAnonymousPreview: true,
            requireAuthentication: false,
            previewMaxLength: 5000,
            showLoginPrompt: true,
            anonymousMessage: 'Please log in to interact with artifacts',
          },
          processing: {
            enableSyntaxHighlighting: true,
            enableHtmlPreviews: true,
            sanitizeHtml: true,
            maxFileSize: 1048576,
          },
        },
      },
    } as any);
  });

  describe('useArtifactPermissions', () => {
    it('allows interactive mode for authenticated users in shared conversations', () => {
      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: true,
        artifactMode: undefined,
        canViewArtifacts: true,
        canInteractWithArtifacts: true,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('interactive');
      expect(screen.getByTestId('can-view')).toHaveTextContent('true');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('true');
    });

    it('allows static mode for anonymous users in shared conversations', () => {
      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: false,
        artifactMode: undefined,
        canViewArtifacts: true,
        canInteractWithArtifacts: false,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('static');
      expect(screen.getByTestId('can-view')).toHaveTextContent('true');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('false');
    });

    it('disables artifacts when requireAuthentication is true and user is not authenticated', () => {
      mockUseGetStartupConfig.mockReturnValue({
        data: {
          artifactConfig: {
            enabled: true,
            sharedConversations: {
              requireAuthentication: true,
              allowAnonymousPreview: false,
            },
          },
        },
      } as any);

      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: false,
        artifactMode: undefined,
        canViewArtifacts: false,
        canInteractWithArtifacts: false,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('disabled');
      expect(screen.getByTestId('can-view')).toHaveTextContent('false');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('false');
    });

    it('disables artifacts when allowAnonymousPreview is false and user is not authenticated', () => {
      mockUseGetStartupConfig.mockReturnValue({
        data: {
          artifactConfig: {
            enabled: true,
            sharedConversations: {
              allowAnonymousPreview: false,
              requireAuthentication: false,
            },
          },
        },
      } as any);

      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: false,
        artifactMode: undefined,
        canViewArtifacts: false,
        canInteractWithArtifacts: false,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('disabled');
      expect(screen.getByTestId('can-view')).toHaveTextContent('false');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('false');
    });

    it('allows full access for non-shared conversations', () => {
      const contextValue = {
        isSharedConvo: false,
        isAuthenticated: true,
        artifactMode: undefined,
        canViewArtifacts: true,
        canInteractWithArtifacts: true,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('interactive');
      expect(screen.getByTestId('can-view')).toHaveTextContent('true');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('true');
    });

    it('respects explicit artifact mode when provided', () => {
      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: false,
        artifactMode: 'disabled' as const,
        canViewArtifacts: false,
        canInteractWithArtifacts: false,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('disabled');
      expect(screen.getByTestId('can-view')).toHaveTextContent('false');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('false');
    });

    it('disables artifacts when globally disabled', () => {
      mockUseGetStartupConfig.mockReturnValue({
        data: {
          artifactConfig: {
            enabled: false,
          },
        },
      } as any);

      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: true,
        artifactMode: undefined,
        canViewArtifacts: false,
        canInteractWithArtifacts: false,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('disabled');
      expect(screen.getByTestId('can-view')).toHaveTextContent('false');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('false');
    });

    it('uses default configuration when no config is provided', () => {
      mockUseGetStartupConfig.mockReturnValue({
        data: {},
      } as any);

      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: false,
        artifactMode: undefined,
        canViewArtifacts: true,
        canInteractWithArtifacts: false,
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('artifact-mode')).toHaveTextContent('static');
      expect(screen.getByTestId('can-view')).toHaveTextContent('true');
      expect(screen.getByTestId('can-interact')).toHaveTextContent('false');
    });

    it('returns correct configuration defaults', () => {
      const contextValue = {
        isSharedConvo: true,
        isAuthenticated: false,
        artifactMode: undefined,
        canViewArtifacts: true,
        canInteractWithArtifacts: false,
      };

      const TestConfigComponent = () => {
        const permissions = useArtifactPermissions();
        return (
          <div>
            <div data-testid="preview-max-length">
              {permissions.config.sharedConversations.previewMaxLength}
            </div>
            <div data-testid="show-login-prompt">
              {permissions.config.sharedConversations.showLoginPrompt ? 'true' : 'false'}
            </div>
            <div data-testid="enable-syntax-highlighting">
              {permissions.config.processing.enableSyntaxHighlighting ? 'true' : 'false'}
            </div>
          </div>
        );
      };

      render(
        <ShareContext.Provider value={contextValue}>
          <TestConfigComponent />
        </ShareContext.Provider>,
      );

      expect(screen.getByTestId('preview-max-length')).toHaveTextContent('5000');
      expect(screen.getByTestId('show-login-prompt')).toHaveTextContent('true');
      expect(screen.getByTestId('enable-syntax-highlighting')).toHaveTextContent('true');
    });
  });
});
