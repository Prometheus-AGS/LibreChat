import { useState } from 'react';
import { Palette } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import {
  OGDialog,
  OGDialogTitle,
  OGDialogContent,
  OGDialogTrigger,
  Button,
  Switch,
  useToastContext,
} from '@librechat/client';
import { useLocalize, useAuthContext } from '~/hooks';

const ArtifactAdminSettings = () => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();

  // State for configuration options
  const [allowAuthenticatedAccess, setAllowAuthenticatedAccess] = useState(true);
  const [allowAnonymousAccess, setAllowAnonymousAccess] = useState(true);
  const [requireLoginForInteraction, setRequireLoginForInteraction] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);
  const [enableContentTruncation, setEnableContentTruncation] = useState(true);
  const [enableSyntaxHighlighting, setEnableSyntaxHighlighting] = useState(true);
  const [enableHtmlPreview, setEnableHtmlPreview] = useState(true);
  const [enableContentSanitization, setEnableContentSanitization] = useState(true);
  const [enableCspHeaders, setEnableCspHeaders] = useState(true);
  const [showArtifactTypes, setShowArtifactTypes] = useState(true);
  const [enableFullscreenMode, setEnableFullscreenMode] = useState(true);

  if (user?.role !== SystemRoles.ADMIN) {
    return null;
  }

  const handleSave = () => {
    const config = {
      allowAuthenticatedAccess,
      allowAnonymousAccess,
      requireLoginForInteraction,
      showLoginPrompt,
      enableContentTruncation,
      enableSyntaxHighlighting,
      enableHtmlPreview,
      enableContentSanitization,
      enableCspHeaders,
      showArtifactTypes,
      enableFullscreenMode,
    };

    console.log('Artifact config update:', config);
    showToast({ status: 'success', message: localize('com_ui_saved') });
  };

  return (
    <OGDialog>
      <OGDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="mr-2 h-10 w-fit gap-1 border transition-all dark:bg-transparent dark:hover:bg-surface-tertiary sm:m-0"
        >
          <Palette className="cursor-pointer" aria-hidden="true" />
          <span className="hidden sm:flex">{localize('com_ui_admin_settings')}</span>
        </Button>
      </OGDialogTrigger>
      <OGDialogContent className="max-h-[90vh] w-11/12 max-w-2xl overflow-y-auto border-border-light bg-surface-primary text-text-primary">
        <OGDialogTitle>
          {`${localize('com_ui_admin_settings')} - ${localize('com_ui_artifacts')}`}
        </OGDialogTitle>
        <div className="space-y-6 p-4">
          {/* Shared Conversation Settings */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {'Shared Links Settings'}
            </h3>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Allow Authenticated Access'}</div>
                <div className="text-sm text-text-secondary">
                  {'Allow authenticated users to access shared artifacts'}
                </div>
              </div>
              <Switch
                checked={allowAuthenticatedAccess}
                onCheckedChange={setAllowAuthenticatedAccess}
              />
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Allow Anonymous Access'}</div>
                <div className="text-sm text-text-secondary">
                  {'Allow anonymous users to access shared artifacts'}
                </div>
              </div>
              <Switch checked={allowAnonymousAccess} onCheckedChange={setAllowAnonymousAccess} />
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Require Login for Interaction'}</div>
                <div className="text-sm text-text-secondary">
                  {'Require users to log in before interacting with artifacts'}
                </div>
              </div>
              <Switch
                checked={requireLoginForInteraction}
                onCheckedChange={setRequireLoginForInteraction}
              />
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Show Login Prompt'}</div>
                <div className="text-sm text-text-secondary">
                  {'Display login prompt for unauthenticated users'}
                </div>
              </div>
              <Switch checked={showLoginPrompt} onCheckedChange={setShowLoginPrompt} />
            </div>
          </div>

          {/* Content Processing Settings */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {'Content Processing Settings'}
            </h3>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Enable Content Truncation'}</div>
                <div className="text-sm text-text-secondary">
                  {'Truncate long content to improve performance'}
                </div>
              </div>
              <Switch
                checked={enableContentTruncation}
                onCheckedChange={setEnableContentTruncation}
              />
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Enable Syntax Highlighting'}</div>
                <div className="text-sm text-text-secondary">
                  {'Enable syntax highlighting for code blocks'}
                </div>
              </div>
              <Switch
                checked={enableSyntaxHighlighting}
                onCheckedChange={setEnableSyntaxHighlighting}
              />
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Enable HTML Preview'}</div>
                <div className="text-sm text-text-secondary">
                  {'Allow HTML content to be previewed in artifacts'}
                </div>
              </div>
              <Switch checked={enableHtmlPreview} onCheckedChange={setEnableHtmlPreview} />
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary">{'Security Settings'}</h3>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Enable Content Sanitization'}</div>
                <div className="text-sm text-text-secondary">
                  {'Sanitize content to prevent XSS attacks'}
                </div>
              </div>
              <Switch
                checked={enableContentSanitization}
                onCheckedChange={setEnableContentSanitization}
              />
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Enable CSP Headers'}</div>
                <div className="text-sm text-text-secondary">
                  {'Enable Content Security Policy headers for enhanced security'}
                </div>
              </div>
              <Switch checked={enableCspHeaders} onCheckedChange={setEnableCspHeaders} />
            </div>
          </div>

          {/* UI Customization */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {'UI Customization Settings'}
            </h3>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Show Artifact Types'}</div>
                <div className="text-sm text-text-secondary">
                  {'Display artifact type indicators in the UI'}
                </div>
              </div>
              <Switch checked={showArtifactTypes} onCheckedChange={setShowArtifactTypes} />
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{'Enable Fullscreen Mode'}</div>
                <div className="text-sm text-text-secondary">
                  {'Allow artifacts to be viewed in fullscreen mode'}
                </div>
              </div>
              <Switch checked={enableFullscreenMode} onCheckedChange={setEnableFullscreenMode} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} variant="submit">
              {localize('com_ui_save')}
            </Button>
          </div>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
};

export default ArtifactAdminSettings;
