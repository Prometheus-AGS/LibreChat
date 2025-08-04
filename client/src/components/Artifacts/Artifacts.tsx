import { useRef, useState, useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { useLocation } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, X, Lock } from 'lucide-react';
import type { SandpackPreviewRef, CodeEditorRef } from '@codesandbox/sandpack-react';
import useArtifacts from '~/hooks/Artifacts/useArtifacts';
import DownloadArtifact from './DownloadArtifact';
import StaticArtifactPreview from './StaticArtifactPreview';
import { useEditorContext, useShareContext, useArtifactPermissions } from '~/Providers';
import ArtifactTabs from './ArtifactTabs';
import { CopyCodeButton } from './Code';
import { useLocalize } from '~/hooks';
import store from '~/store';

export default function Artifacts() {
  const localize = useLocalize();
  const location = useLocation();
  const { isMutating } = useEditorContext();
  const { isSharedConvo } = useShareContext();
  const { canInteractWithArtifacts, artifactMode } = useArtifactPermissions();
  const editorRef = useRef<CodeEditorRef>();
  const previewRef = useRef<SandpackPreviewRef>();
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wasReadOnly, setWasReadOnly] = useState(false);
  const setArtifactsVisible = useSetRecoilState(store.artifactsVisibility);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const {
    activeTab,
    isMermaid,
    setActiveTab,
    currentIndex,
    isSubmitting,
    cycleArtifact,
    currentArtifact,
    orderedArtifactIds,
  } = useArtifacts();

  if (currentArtifact === null || currentArtifact === undefined) {
    return null;
  }

  // Check if we're in a shared conversation without interactive access
  // For shared conversations: show static preview if not authenticated or can't interact
  // For authenticated users: show interactive view if they can interact, otherwise static preview
  const isSharedReadOnly = isSharedConvo && !canInteractWithArtifacts;

  // Track if we were previously in read-only mode to detect authentication changes
  useEffect(() => {
    if (isSharedConvo && wasReadOnly && !isSharedReadOnly) {
      // User just authenticated in a shared conversation, trigger a refresh
      setIsVisible(false);
      setTimeout(() => {
        setIsVisible(true);
        // Force a re-render by updating the component key
        const event = new CustomEvent('artifact-auth-changed');
        window.dispatchEvent(event);
      }, 100);
    }
    setWasReadOnly(isSharedReadOnly);
  }, [isSharedReadOnly, wasReadOnly, isSharedConvo]);

  // Listen for authentication change events
  useEffect(() => {
    const handleAuthChange = () => {
      if (isSharedConvo && !isSharedReadOnly) {
        // Force re-render when authentication changes in shared conversations
        setIsVisible(false);
        setTimeout(() => setIsVisible(true), 50);
      }
    };

    window.addEventListener('artifact-auth-changed', handleAuthChange);
    return () => window.removeEventListener('artifact-auth-changed', handleAuthChange);
  }, [isSharedConvo, isSharedReadOnly]);

  const handleRefresh = () => {
    // Don't allow refresh in read-only mode
    if (isSharedReadOnly) {
      return;
    }

    setIsRefreshing(true);
    const client = previewRef.current?.getClient();
    if (client != null) {
      client.dispatch({ type: 'refresh' });
    }
    setTimeout(() => setIsRefreshing(false), 750);
  };

  const closeArtifacts = () => {
    setIsVisible(false);
    setTimeout(() => setArtifactsVisible(false), 300);
  };

  const handleLoginPrompt = () => {
    // Redirect to login with return URL
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login?return=${currentUrl}`;
  };

  // For shared conversations without interactive access, show static preview
  if (isSharedReadOnly) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-full w-full flex-col overflow-hidden border border-border-medium bg-surface-primary text-xl text-text-primary shadow-xl">
          {/* Header with close button only */}
          <div className="flex items-center justify-between border-b border-border-medium bg-surface-primary-alt p-2">
            <div className="flex items-center">
              <button
                className="mr-2 text-text-secondary"
                onClick={closeArtifacts}
                title="Close artifacts"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center">
              <button
                className="text-text-secondary"
                onClick={closeArtifacts}
                title="Close artifacts"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Static preview content - this handles its own header, content, and footer */}
          <div className="flex-1 overflow-hidden">
            <StaticArtifactPreview artifact={currentArtifact} onLoginPrompt={handleLoginPrompt} />
          </div>

          {/* Footer with navigation only */}
          <div className="flex items-center justify-center border-t border-border-medium bg-surface-primary-alt p-2 text-sm text-text-secondary">
            <div className="flex items-center">
              <button
                onClick={() => cycleArtifact('prev')}
                className="mr-2 text-text-secondary"
                disabled={orderedArtifactIds.length <= 1}
                title="Previous artifact"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs">{`${currentIndex + 1} / ${orderedArtifactIds.length}`}</span>
              <button
                onClick={() => cycleArtifact('next')}
                className="ml-2 text-text-secondary"
                disabled={orderedArtifactIds.length <= 1}
                title="Next artifact"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular interactive artifacts view for authenticated users or regular conversations
  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab} asChild>
      {/* Main Parent */}
      <div className="flex h-full w-full items-center justify-center">
        {/* Main Container */}
        <div
          className={`flex h-full w-full flex-col overflow-hidden border border-border-medium bg-surface-primary text-xl text-text-primary shadow-xl transition-all duration-500 ease-in-out ${
            isVisible ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-sm'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-medium bg-surface-primary-alt p-2">
            <div className="flex items-center">
              <button
                className="mr-2 text-text-secondary"
                onClick={closeArtifacts}
                title="Close artifacts"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="truncate text-sm text-text-primary">{currentArtifact.title}</h3>
              {/* Show interactive badge for authenticated shared conversations */}
              {isSharedConvo && canInteractWithArtifacts && artifactMode === 'interactive' && (
                <div className="ml-2 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  {'Interactive'}
                </div>
              )}
            </div>
            <div className="flex items-center">
              {/* Refresh button */}
              {activeTab === 'preview' && (
                <button
                  className={`mr-2 text-text-secondary transition-transform duration-500 ease-in-out ${
                    isRefreshing ? 'rotate-180' : ''
                  }`}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  aria-label="Refresh"
                >
                  <RefreshCw
                    size={16}
                    className={`transform ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              )}
              {activeTab !== 'preview' && isMutating && (
                <RefreshCw size={16} className="mr-2 animate-spin text-text-secondary" />
              )}
              {/* Tabs */}
              <Tabs.List className="mr-2 inline-flex h-7 rounded-full border border-border-medium bg-surface-tertiary">
                <Tabs.Trigger
                  value="preview"
                  disabled={isMutating}
                  className="border-0.5 flex items-center gap-1 rounded-full border-transparent py-1 pl-2.5 pr-2.5 text-xs font-medium text-text-secondary data-[state=active]:border-border-light data-[state=active]:bg-surface-primary-alt data-[state=active]:text-text-primary"
                >
                  {localize('com_ui_preview')}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="code"
                  className="border-0.5 flex items-center gap-1 rounded-full border-transparent py-1 pl-2.5 pr-2.5 text-xs font-medium text-text-secondary data-[state=active]:border-border-light data-[state=active]:bg-surface-primary-alt data-[state=active]:text-text-primary"
                >
                  {localize('com_ui_code')}
                </Tabs.Trigger>
              </Tabs.List>
              <button
                className="text-text-secondary"
                onClick={closeArtifacts}
                title="Close artifacts"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Content */}
          <ArtifactTabs
            isMermaid={isMermaid}
            artifact={currentArtifact}
            isSubmitting={isSubmitting}
            editorRef={editorRef as React.MutableRefObject<CodeEditorRef>}
            previewRef={previewRef as React.MutableRefObject<SandpackPreviewRef>}
          />
          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border-medium bg-surface-primary-alt p-2 text-sm text-text-secondary">
            <div className="flex items-center">
              <button
                onClick={() => cycleArtifact('prev')}
                className="mr-2 text-text-secondary"
                title="Previous artifact"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs">{`${currentIndex + 1} / ${
                orderedArtifactIds.length
              }`}</span>
              <button
                onClick={() => cycleArtifact('next')}
                className="ml-2 text-text-secondary"
                title="Next artifact"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <CopyCodeButton content={currentArtifact.content ?? ''} />
              {/* Download Button */}
              <DownloadArtifact artifact={currentArtifact} />
              {/* Publish button */}
              {/* <button className="border-0.5 min-w-[4rem] whitespace-nowrap rounded-md border-border-medium bg-[radial-gradient(ellipse,_var(--tw-gradient-stops))] from-surface-active from-50% to-surface-active px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-active hover:text-text-primary active:scale-[0.985] active:bg-surface-active">
                Publish
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </Tabs.Root>
  );
}
