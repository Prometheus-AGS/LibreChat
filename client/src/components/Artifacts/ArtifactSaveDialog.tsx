import React, { useState, useEffect } from 'react';
import { Save, Package, Tag, User, FileText, AlertCircle, Check, X } from 'lucide-react';
import { useArtifactRegistryStore } from '~/store/artifact-registry';

interface ArtifactSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artifactContent: string;
  artifactType: 'react' | 'html' | 'javascript' | 'css' | 'markdown' | 'other';
  initialName?: string;
  existingArtifactId?: string; // For updating existing artifacts
  onSaveSuccess?: (artifactId: string, version: string) => void;
}

export const ArtifactSaveDialog: React.FC<ArtifactSaveDialogProps> = ({
  isOpen,
  onClose,
  artifactContent,
  artifactType,
  initialName = '',
  existingArtifactId,
  onSaveSuccess,
}) => {
  const { artifacts } = useArtifactRegistryStore();

  const [formData, setFormData] = useState({
    name: initialName,
    description: '',
    category: 'ui-components',
    tags: [] as string[],
    version: '1.0.0',
    isPublic: true,
    repositoryUrl: '',
    documentation: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check if this is an update to existing artifact
  const existingArtifact = existingArtifactId ? artifacts.get(existingArtifactId) : null;
  const isUpdate = !!existingArtifact;

  // Categories available for selection
  const categories = [
    'ui-components',
    'data-visualization',
    'forms',
    'navigation',
    'layout',
    'utilities',
    'integrations',
    'templates',
    'animations',
    'charts',
  ];

  // Popular tags for suggestions
  const suggestedTags = [
    'react',
    'typescript',
    'tailwind',
    'shadcn',
    'supabase',
    'responsive',
    'accessible',
    'dark-mode',
    'interactive',
    'charts',
    'forms',
    'tables',
    'modals',
    'buttons',
    'cards',
    'navigation',
    'dashboard',
    'admin',
  ];

  // Initialize form data for updates
  useEffect(() => {
    if (isUpdate && existingArtifact) {
      setFormData({
        name: existingArtifact.name,
        description: existingArtifact.description,
        category: existingArtifact.category,
        tags: existingArtifact.tags || [],
        version: incrementVersion(existingArtifact.version),
        isPublic: existingArtifact.isPublic ?? true,
        repositoryUrl: existingArtifact.repositoryUrl || '',
        documentation: existingArtifact.documentation || '',
      });
    }
  }, [isUpdate, existingArtifact]);

  // Auto-increment version for updates
  const incrementVersion = (currentVersion: string): string => {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!formData.version.trim()) {
      errors.version = 'Version is required';
    } else if (!/^\d+\.\d+\.\d+$/.test(formData.version)) {
      errors.version = 'Version must be in format x.y.z (e.g., 1.0.0)';
    }

    if (formData.repositoryUrl && !isValidUrl(formData.repositoryUrl)) {
      errors.repositoryUrl = 'Repository URL must be a valid URL';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const saveData = {
        ...formData,
        content: artifactContent,
        type: artifactType,
        id: existingArtifactId || undefined,
      };

      const response = await fetch('/api/artifacts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save artifact');
      }

      const result = await response.json();

      onSaveSuccess?.(result.id, result.version);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save artifact');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-semibold text-gray-900 dark:text-gray-100">
              <Save className="mr-2 h-5 w-5" />
              {isUpdate ? 'Update Artifact' : 'Save Artifact to Registry'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-medium text-gray-900 dark:text-gray-100">
                <Package className="mr-2 h-4 w-4" />
                Basic Information
              </h3>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Artifact Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                    validationErrors.name
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., UserProfileCard"
                />
                {validationErrors.name && (
                  <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className={`resize-vertical w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                    validationErrors.description
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Describe what this artifact does and how to use it..."
                />
                {validationErrors.description && (
                  <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    {validationErrors.description}
                  </p>
                )}
              </div>

              {/* Category and Version */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="artifact-category"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Category
                  </label>
                  <select
                    id="artifact-category"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                      validationErrors.version
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="1.0.0"
                  />
                  {validationErrors.version && (
                    <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="mr-1 h-4 w-4" />
                      {validationErrors.version}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-medium text-gray-900 dark:text-gray-100">
                <Tag className="mr-2 h-4 w-4" />
                Tags
              </h3>

              {/* Tag Input */}
              <div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Type tags and press Enter (max 10 tags)"
                />
              </div>

              {/* Current Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Tags */}
              <div>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags
                    .filter((tag) => !formData.tags.includes(tag))
                    .slice(0, 8)
                    .map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-medium text-gray-900 dark:text-gray-100">
                <FileText className="mr-2 h-4 w-4" />
                Additional Information
              </h3>

              {/* Repository URL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Repository URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.repositoryUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, repositoryUrl: e.target.value }))
                  }
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                    validationErrors.repositoryUrl
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="https://github.com/username/repo"
                />
                {validationErrors.repositoryUrl && (
                  <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    {validationErrors.repositoryUrl}
                  </p>
                )}
              </div>

              {/* Documentation */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Documentation (optional)
                </label>
                <textarea
                  value={formData.documentation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, documentation: e.target.value }))
                  }
                  rows={3}
                  className="resize-vertical w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Additional documentation, usage examples, or notes..."
                />
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isPublic"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                >
                  Make this artifact public (visible to all users)
                </label>
              </div>
            </div>

            {/* Error Display */}
            {saveError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-800 dark:text-red-200">{saveError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-6 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdate ? 'Update Artifact' : 'Save to Registry'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactSaveDialog;
