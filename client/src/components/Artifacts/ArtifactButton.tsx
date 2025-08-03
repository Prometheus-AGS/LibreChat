import { useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { useLocation } from 'react-router-dom';
import { useRecoilState, useSetRecoilState, useResetRecoilState } from 'recoil';
import type { Artifact } from '~/common';
import FilePreview from '~/components/Chat/Input/Files/FilePreview';
import StaticArtifactPreview from './StaticArtifactPreview';
import { getFileType, logger } from '~/utils';
import { useLocalize } from '~/hooks';
import { useShareContext } from '~/Providers';
import store from '~/store';

const ArtifactButton = ({ artifact }: { artifact: Artifact | null }) => {
  const localize = useLocalize();
  const location = useLocation();
  const { isSharedConvo, artifactMode, canInteractWithArtifacts } = useShareContext();
  const [showStaticPreview, setShowStaticPreview] = useState(false);

  const setVisible = useSetRecoilState(store.artifactsVisibility);
  const [artifacts, setArtifacts] = useRecoilState(store.artifactsState);
  const setCurrentArtifactId = useSetRecoilState(store.currentArtifactId);
  const resetCurrentArtifactId = useResetRecoilState(store.currentArtifactId);
  const [visibleArtifacts, setVisibleArtifacts] = useRecoilState(store.visibleArtifacts);

  const debouncedSetVisibleRef = useRef(
    debounce((artifactToSet: Artifact) => {
      logger.log(
        'artifacts_visibility',
        'Setting artifact to visible state from Artifact button',
        artifactToSet,
      );
      setVisibleArtifacts((prev) => ({
        ...prev,
        [artifactToSet.id]: artifactToSet,
      }));
    }, 750),
  );

  // Check if current path supports artifacts (both regular and shared conversations)
  const isArtifactSupportedPath = () => {
    return location.pathname.includes('/c/') || location.pathname.includes('/share/');
  };

  useEffect(() => {
    if (artifact == null || artifact?.id == null || artifact.id === '') {
      return;
    }

    // Support both regular conversations (/c/) and shared conversations (/share/)
    if (!isArtifactSupportedPath()) {
      return;
    }

    // Only set visible artifacts for regular conversations or authenticated shared conversations
    if (location.pathname.includes('/c/') || (isSharedConvo && canInteractWithArtifacts)) {
      const debouncedSetVisible = debouncedSetVisibleRef.current;
      debouncedSetVisible(artifact);
      return () => {
        debouncedSetVisible.cancel();
      };
    }
  }, [artifact, location.pathname, isSharedConvo, canInteractWithArtifacts]);

  const handleArtifactClick = () => {
    if (!artifact) {
      return;
    }

    // Handle regular conversations - full interactive mode
    if (location.pathname.includes('/c/')) {
      resetCurrentArtifactId();
      setVisible(true);
      if (artifacts?.[artifact.id] == null) {
        setArtifacts(visibleArtifacts);
      }
      setTimeout(() => {
        setCurrentArtifactId(artifact.id);
      }, 15);
      return;
    }

    // Handle shared conversations based on authentication and artifact mode
    if (location.pathname.includes('/share/')) {
      if (canInteractWithArtifacts && artifactMode === 'interactive') {
        // Authenticated user with interactive mode - full functionality
        resetCurrentArtifactId();
        setVisible(true);
        if (artifacts?.[artifact.id] == null) {
          setArtifacts(visibleArtifacts);
        }
        setTimeout(() => {
          setCurrentArtifactId(artifact.id);
        }, 15);
      } else {
        // Non-authenticated user or static preview mode - show static preview
        setShowStaticPreview(true);
      }
      return;
    }
  };

  const handleLoginPrompt = () => {
    // Redirect to login with return URL
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login?return=${currentUrl}`;
  };

  if (artifact === null || artifact === undefined) {
    return null;
  }

  // Show static preview modal for non-authenticated shared conversation users
  if (showStaticPreview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative h-[80vh] w-[90vw] max-w-4xl">
          <button
            onClick={() => setShowStaticPreview(false)}
            className="absolute -right-4 -top-4 z-10 rounded-full bg-surface-primary p-2 shadow-lg hover:bg-surface-secondary"
            title="Close preview"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <StaticArtifactPreview artifact={artifact} onLoginPrompt={handleLoginPrompt} />
        </div>
      </div>
    );
  }

  const fileType = getFileType('artifact');

  // Determine button text based on context
  const getButtonText = () => {
    if (location.pathname.includes('/c/')) {
      return localize('com_ui_artifact_click');
    }

    if (location.pathname.includes('/share/')) {
      if (canInteractWithArtifacts && artifactMode === 'interactive') {
        return localize('com_ui_artifact_click');
      } else {
        return 'Click to preview';
      }
    }

    return localize('com_ui_artifact_click');
  };

  return (
    <div className="group relative my-4 rounded-xl text-sm text-text-primary">
      <button
        type="button"
        onClick={handleArtifactClick}
        disabled={!isArtifactSupportedPath()}
        className="relative overflow-hidden rounded-xl border border-border-medium transition-all duration-300 hover:border-border-xheavy hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="w-fit bg-surface-tertiary p-2">
          <div className="flex flex-row items-center gap-2">
            <FilePreview fileType={fileType} className="relative" />
            <div className="overflow-hidden text-left">
              <div className="truncate font-medium">{artifact.title}</div>
              <div className="truncate text-text-secondary">{getButtonText()}</div>
            </div>
            {/* Show preview badge for shared conversations without interactive access */}
            {location.pathname.includes('/share/') &&
              (!canInteractWithArtifacts || artifactMode !== 'interactive') && (
                <div className="ml-2 rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {'Preview'}
                </div>
              )}
          </div>
        </div>
      </button>
      <br />
    </div>
  );
};

export default ArtifactButton;
