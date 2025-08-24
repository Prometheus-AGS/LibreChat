import React, { useState } from 'react';
import { Save, Package, Check, Clock, AlertCircle } from 'lucide-react';
import { ArtifactSaveDialog } from './ArtifactSaveDialog';
import { useArtifactRegistryStore } from '~/store/artifact-registry';

interface ArtifactSaveButtonProps {
  artifactContent: string;
  artifactType: 'react' | 'html' | 'javascript' | 'css' | 'markdown' | 'other';
  artifactTitle?: string;
  existingArtifactId?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  showStatus?: boolean;
}

export const ArtifactSaveButton: React.FC<ArtifactSaveButtonProps> = ({
  artifactContent,
  artifactType,
  artifactTitle = '',
  existingArtifactId,
  className = '',
  variant = 'primary',
  showStatus = true,
}) => {
  const { artifacts } = useArtifactRegistryStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedVersion, setLastSavedVersion] = useState<string | null>(null);

  // Check if artifact exists in registry
  const existingArtifact = existingArtifactId ? artifacts.get(existingArtifactId) : null;
  const isSaved = !!existingArtifact;
  const isUpdate = isSaved;

  // Handle save success
  const handleSaveSuccess = (artifactId: string, version: string) => {
    setSaveStatus('saved');
    setLastSavedVersion(version);

    // Reset status after 3 seconds
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  // Handle save error
  const handleSaveError = () => {
    setSaveStatus('error');

    // Reset status after 5 seconds
    setTimeout(() => {
      setSaveStatus('idle');
    }, 5000);
  };

  // Button variants
  const getButtonClasses = () => {
    const baseClasses =
      'inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500`;
      case 'minimal':
        return `${baseClasses} text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
    }
  };

  // Status indicator
  const StatusIndicator = () => {
    if (!showStatus) return null;

    switch (saveStatus) {
      case 'saving':
        return (
          <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
            Saving to registry...
          </div>
        );
      case 'saved':
        return (
          <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
            <Check className="mr-2 h-4 w-4" />
            Saved to registry {lastSavedVersion && `(v${lastSavedVersion})`}
          </div>
        );
      case 'error':
        return (
          <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="mr-2 h-4 w-4" />
            Failed to save artifact
          </div>
        );
      default:
        if (isSaved && existingArtifact) {
          return (
            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Package className="mr-2 h-4 w-4" />
              Saved as "{existingArtifact.name}" v{existingArtifact.version}
            </div>
          );
        }
        return (
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-500">
            <Clock className="mr-2 h-4 w-4" />
            Not saved to registry
          </div>
        );
    }
  };

  return (
    <div className={`artifact-save-button ${className}`}>
      <button
        onClick={() => setShowSaveDialog(true)}
        disabled={saveStatus === 'saving'}
        className={getButtonClasses()}
        title={isUpdate ? 'Update artifact in registry' : 'Save artifact to registry'}
      >
        <Save className="mr-2 h-4 w-4" />
        {saveStatus === 'saving'
          ? 'Saving...'
          : isUpdate
            ? 'Update in Registry'
            : 'Save to Registry'}
      </button>

      <StatusIndicator />

      {/* Save Dialog */}
      <ArtifactSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        artifactContent={artifactContent}
        artifactType={artifactType}
        initialName={artifactTitle}
        existingArtifactId={existingArtifactId}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
};

export default ArtifactSaveButton;
