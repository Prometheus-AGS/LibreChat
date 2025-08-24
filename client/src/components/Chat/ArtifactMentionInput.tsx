import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Hash, X, ChevronDown } from 'lucide-react';
import { useArtifactRegistryStore } from '~/store/artifact-registry';
import type { ArtifactMetadata } from 'librechat-data-provider';

interface ArtifactMention {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
}

interface ArtifactMentionInputProps {
  value: string;
  onChange: (value: string, mentions: ArtifactMention[]) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ArtifactMentionInput: React.FC<ArtifactMentionInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your message... Use @artifact to reference components',
  className = '',
  disabled = false,
}) => {
  const { artifacts, searchArtifacts, loadArtifactRegistry } = useArtifactRegistryStore();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ArtifactMetadata[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<ArtifactMention[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load artifacts on mount
  useEffect(() => {
    loadArtifactRegistry();
  }, [loadArtifactRegistry]);

  // Extract mentions from text
  const extractMentions = useCallback(
    (text: string): ArtifactMention[] => {
      const mentionRegex = /@\[([^\]]+)\]/g;
      const extractedMentions: ArtifactMention[] = [];
      let match;

      while ((match = mentionRegex.exec(text)) !== null) {
        const mentionText = match[1];
        // Try to find the artifact by name or ID
        const artifact = Array.from(artifacts.values()).find(
          (a) => a.name === mentionText || a.id === mentionText,
        );

        if (artifact) {
          extractedMentions.push({
            id: artifact.id,
            name: artifact.name,
            description: artifact.description,
            version: artifact.version,
            category: artifact.category,
          });
        }
      }

      return extractedMentions;
    },
    [artifacts],
  );

  // Handle text change
  const handleTextChange = useCallback(
    (newValue: string) => {
      const newMentions = extractMentions(newValue);
      setMentions(newMentions);
      onChange(newValue, newMentions);

      // Check if we're typing a mention
      const cursorPos = inputRef.current?.selectionStart || 0;
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@([^@\s]*)$/);

      if (mentionMatch) {
        const query = mentionMatch[1];
        setMentionQuery(query);
        setCursorPosition(cursorPos);

        // Filter artifacts based on query
        const filteredArtifacts = Array.from(artifacts.values())
          .filter(
            (artifact) =>
              artifact.name.toLowerCase().includes(query.toLowerCase()) ||
              artifact.description.toLowerCase().includes(query.toLowerCase()) ||
              artifact.category.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 10);

        setSuggestions(filteredArtifacts);
        setShowSuggestions(filteredArtifacts.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
        setMentionQuery('');
      }
    },
    [artifacts, extractMentions, onChange],
  );

  // Handle suggestion selection
  const selectSuggestion = useCallback(
    (artifact: ArtifactMetadata) => {
      if (!inputRef.current) return;

      const cursorPos = cursorPosition;
      const textBeforeCursor = value.slice(0, cursorPos);
      const textAfterCursor = value.slice(cursorPos);

      // Find the start of the mention
      const mentionStart = textBeforeCursor.lastIndexOf('@');
      const beforeMention = value.slice(0, mentionStart);
      const mention = `@[${artifact.name}]`;
      const newValue = beforeMention + mention + textAfterCursor;

      handleTextChange(newValue);
      setShowSuggestions(false);

      // Set cursor position after the mention
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = mentionStart + mention.length;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          inputRef.current.focus();
        }
      }, 0);
    },
    [value, cursorPosition, handleTextChange],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSubmit?.();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            selectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, selectSuggestion, onSubmit],
  );

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Remove mention
  const removeMention = useCallback(
    (mentionToRemove: ArtifactMention) => {
      const mentionPattern = new RegExp(
        `@\\[${mentionToRemove.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`,
        'g',
      );
      const newValue = value.replace(mentionPattern, '');
      handleTextChange(newValue);
    },
    [value, handleTextChange],
  );

  return (
    <div className={`artifact-mention-input relative ${className}`}>
      {/* Mentioned Artifacts Display */}
      {mentions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Hash className="mr-1 h-4 w-4" />
            Referenced artifacts:
          </span>
          {mentions.map((mention, index) => (
            <div
              key={`${mention.id}-${index}`}
              className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              <span className="mr-1">{mention.name}</span>
              <button
                onClick={() => removeMention(mention)}
                className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                title="Remove reference"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="resize-vertical min-h-[100px] w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          style={{ minHeight: '100px' }}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
          >
            <div className="border-b border-gray-200 p-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Artifact suggestions {mentionQuery && `for "${mentionQuery}"`}
            </div>
            {suggestions.map((artifact, index) => (
              <button
                key={artifact.id}
                onClick={() => selectSuggestion(artifact)}
                className={`w-full border-b border-gray-100 p-3 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                  index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {artifact.name}
                    </div>
                    <div className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {artifact.description}
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-700">
                        {artifact.category}
                      </span>
                      <span className="text-xs text-gray-500">v{artifact.version}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Type <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">@</code> to reference
        artifacts in your message
      </div>
    </div>
  );
};

export default ArtifactMentionInput;
