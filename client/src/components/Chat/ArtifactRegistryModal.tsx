import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { ArtifactRegistryBrowser } from '~/components/Artifacts/ArtifactRegistryBrowser';
import type { ArtifactMetadata } from 'librechat-data-provider';

interface ArtifactRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtifact: (artifact: ArtifactMetadata) => void;
  title?: string;
}

export const ArtifactRegistryModal: React.FC<ArtifactRegistryModalProps> = ({
  isOpen,
  onClose,
  onSelectArtifact,
  title = 'Select Artifact',
}) => {
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactMetadata | null>(null);

  if (!isOpen) return null;

  const handleSelectArtifact = (artifact: ArtifactMetadata) => {
    onSelectArtifact(artifact);
    onClose();
  };

  const handlePreviewArtifact = (artifact: ArtifactMetadata) => {
    setSelectedArtifact(artifact);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex h-full">
        {/* Main Content */}
        <div className="ml-0 mr-0 flex flex-1 flex-col bg-white dark:bg-gray-900 md:ml-16 md:mr-16">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Browser */}
              <div className={`${selectedArtifact ? 'w-1/2' : 'w-full'} overflow-y-auto p-6`}>
                <ArtifactRegistryBrowser
                  mode="selector"
                  onSelectArtifact={handleSelectArtifact}
                  onPreviewArtifact={handlePreviewArtifact}
                />
              </div>

              {/* Preview Panel */}
              {selectedArtifact && (
                <div className="w-1/2 overflow-y-auto border-l border-gray-200 dark:border-gray-700">
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {selectedArtifact.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedArtifact.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedArtifact(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Artifact Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Version:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            v{selectedArtifact.version}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Author:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {selectedArtifact.author}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Category:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {selectedArtifact.category}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Updated:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {new Date(selectedArtifact.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {selectedArtifact.tags && selectedArtifact.tags.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tags:
                          </span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedArtifact.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dependencies */}
                      {selectedArtifact.dependencies &&
                        selectedArtifact.dependencies.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Dependencies:
                            </span>
                            <div className="mt-2 space-y-1">
                              {selectedArtifact.dependencies.map((dep) => (
                                <div
                                  key={dep.id}
                                  className="text-sm text-gray-600 dark:text-gray-400"
                                >
                                  • {dep.name} (v{dep.version})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Analytics */}
                      {selectedArtifact.analytics && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {selectedArtifact.analytics.downloads && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Downloads:
                              </span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {selectedArtifact.analytics.downloads.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {selectedArtifact.analytics.averageRating && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Rating:
                              </span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {selectedArtifact.analytics.averageRating.toFixed(1)}/5.0
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Repository Link */}
                      {selectedArtifact.repositoryUrl && (
                        <div>
                          <a
                            href={selectedArtifact.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <ExternalLink className="mr-1 h-4 w-4" />
                            View Repository
                          </a>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <button
                          onClick={() => handleSelectArtifact(selectedArtifact)}
                          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                          Select Artifact
                        </button>
                        <button
                          onClick={() => setSelectedArtifact(null)}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactRegistryModal;
