import React, { useState, useCallback } from 'react';
import { Package, Plus, MessageSquare } from 'lucide-react';
import { ArtifactMentionInput } from './ArtifactMentionInput';
import { ArtifactRegistryModal } from './ArtifactRegistryModal';
import { ArtifactRegistryBrowser } from '~/components/Artifacts/ArtifactRegistryBrowser';
import type { ArtifactMetadata } from 'librechat-data-provider';

interface ArtifactMention {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
}

interface ChatWithArtifactsProps {
  onSendMessage?: (message: string, mentions: ArtifactMention[]) => void;
  className?: string;
  showRegistryBrowser?: boolean;
  placeholder?: string;
}

export const ChatWithArtifacts: React.FC<ChatWithArtifactsProps> = ({
  onSendMessage,
  className = '',
  showRegistryBrowser = false,
  placeholder = 'Type your message... Use @artifact to reference components',
}) => {
  const [message, setMessage] = useState('');
  const [mentions, setMentions] = useState<ArtifactMention[]>([]);
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [showBrowser, setShowBrowser] = useState(showRegistryBrowser);

  const handleMessageChange = useCallback((newMessage: string, newMentions: ArtifactMention[]) => {
    setMessage(newMessage);
    setMentions(newMentions);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      onSendMessage?.(message, mentions);
      setMessage('');
      setMentions([]);
    }
  }, [message, mentions, onSendMessage]);

  const handleSelectFromModal = useCallback(
    (artifact: ArtifactMetadata) => {
      const mention = `@[${artifact.name}]`;
      const newMessage = message + (message ? ' ' : '') + mention;

      const newMentions: ArtifactMention[] = [
        ...mentions,
        {
          id: artifact.id,
          name: artifact.name,
          description: artifact.description,
          version: artifact.version,
          category: artifact.category,
        },
      ];

      setMessage(newMessage);
      setMentions(newMentions);
      setShowRegistryModal(false);
    },
    [message, mentions],
  );

  const handleSelectFromBrowser = useCallback(
    (artifact: ArtifactMetadata) => {
      handleSelectFromModal(artifact);
    },
    [handleSelectFromModal],
  );

  const handlePreviewArtifact = useCallback((artifact: ArtifactMetadata) => {
    // Could open a preview modal or navigate to artifact details
    console.log('Preview artifact:', artifact);
  }, []);

  return (
    <div className={`chat-with-artifacts ${className}`}>
      <div className="flex h-full">
        {/* Registry Browser Sidebar */}
        {showBrowser && (
          <div className="w-1/3 overflow-hidden border-r border-gray-200 dark:border-gray-700">
            <div className="flex h-full flex-col">
              <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                    <Package className="mr-2 h-5 w-5" />
                    Artifact Registry
                  </h3>
                  <button
                    onClick={() => setShowBrowser(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Hide registry browser"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ArtifactRegistryBrowser
                  mode="selector"
                  onSelectArtifact={handleSelectFromBrowser}
                  onPreviewArtifact={handlePreviewArtifact}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center text-xl font-semibold text-gray-900 dark:text-gray-100">
                <MessageSquare className="mr-2 h-5 w-5" />
                Chat with Artifacts
              </h2>
              <div className="flex items-center space-x-2">
                {!showBrowser && (
                  <button
                    onClick={() => setShowBrowser(true)}
                    className="flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    title="Show registry browser"
                  >
                    <Package className="mr-1 h-4 w-4" />
                    Browse Registry
                  </button>
                )}
                <button
                  onClick={() => setShowRegistryModal(true)}
                  className="flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                  title="Open artifact selector"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Artifact
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* This would contain the actual chat messages */}
            <div className="space-y-4">
              {/* Example message with artifact reference */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  Example conversation with artifact references:
                </p>
                <div className="mb-2 rounded bg-white p-3 dark:bg-gray-700">
                  <p className="text-gray-900 dark:text-gray-100">
                    Can you help me create a dashboard using{' '}
                    <span className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      @[UserCard]
                    </span>{' '}
                    and{' '}
                    <span className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      @[DataTable]
                    </span>
                    ?
                  </p>
                </div>
                <div className="rounded bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-gray-900 dark:text-gray-100">
                    I'll help you create a dashboard combining those components. Let me compose them
                    together...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Input Area */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <ArtifactMentionInput
              value={message}
              onChange={handleMessageChange}
              onSubmit={handleSendMessage}
              placeholder={placeholder}
              className="w-full"
            />

            {/* Send Button */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Registry Modal */}
      <ArtifactRegistryModal
        isOpen={showRegistryModal}
        onClose={() => setShowRegistryModal(false)}
        onSelectArtifact={handleSelectFromModal}
        title="Select Artifact to Reference"
      />
    </div>
  );
};

export default ChatWithArtifacts;
