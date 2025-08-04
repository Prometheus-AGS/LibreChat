import React, { useMemo } from 'react';
import { Lock, Eye, Code, ExternalLink, FileText, Image, Database } from 'lucide-react';
import { useShareContext } from '~/Providers';
import type { Artifact } from '~/common';

interface StaticArtifactPreviewProps {
  artifact: Artifact;
  onLoginPrompt?: () => void;
}

// Simple button component to avoid import issues
const SimpleButton: React.FC<{
  onClick: () => void;
  variant?: 'outline' | 'submit';
  size?: 'sm';
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, variant = 'outline', className = '', children }) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  const variantClasses = {
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    submit: 'bg-primary text-primary-foreground hover:bg-primary/90',
  };
  const sizeClasses = 'h-9 px-3';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

// Utility function to truncate content for preview
const truncateContent = (
  content: string,
  maxLines: number = 20,
): { content: string; isTruncated: boolean } => {
  const lines = content.split('\n');
  if (lines.length <= maxLines) {
    return { content, isTruncated: false };
  }
  return {
    content: lines.slice(0, maxLines).join('\n') + '\n...',
    isTruncated: true,
  };
};

// Extract HTML preview content safely
const extractHtmlPreview = (htmlContent: string): string => {
  try {
    // Create a safe preview by extracting key elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Remove script tags for security
    const scripts = doc.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // Get title if available
    const title = doc.querySelector('title')?.textContent || '';

    // Get meta description if available
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // Get first few paragraphs or divs with content
    const contentElements = doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6');
    const previewText = Array.from(contentElements)
      .slice(0, 5)
      .map((el) => el.textContent?.trim())
      .filter((text) => text && text.length > 10)
      .join('\n\n');

    return `${title ? `Title: ${title}\n\n` : ''}${metaDesc ? `Description: ${metaDesc}\n\n` : ''}${previewText || 'HTML content available'}`;
  } catch (error) {
    return 'HTML content preview unavailable';
  }
};

// Get artifact type info
const getArtifactTypeInfo = (type: string) => {
  const typeMap: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> =
    {
      'text/html': {
        icon: Code,
        label: 'HTML',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      },
      'application/javascript': {
        icon: Code,
        label: 'JavaScript',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      'text/javascript': {
        icon: Code,
        label: 'JavaScript',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      'text/css': {
        icon: Code,
        label: 'CSS',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      'text/markdown': {
        icon: FileText,
        label: 'Markdown',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      },
      'application/json': {
        icon: Database,
        label: 'JSON',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      'text/plain': {
        icon: FileText,
        label: 'Text',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      },
      'image/svg+xml': {
        icon: Image,
        label: 'SVG',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      },
    };

  return (
    typeMap[type] || {
      icon: FileText,
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
  );
};

export default function StaticArtifactPreview({
  artifact,
  onLoginPrompt,
}: StaticArtifactPreviewProps) {
  const { isSharedConvo } = useShareContext();

  const handleLoginClick = () => {
    if (onLoginPrompt) {
      onLoginPrompt();
    } else {
      // Default behavior: redirect to login with return URL
      const currentUrl = encodeURIComponent(window.location.href);
      // Use replace to avoid adding to history stack
      window.location.replace(`/login?return=${currentUrl}`);
    }
  };

  const typeInfo = useMemo(() => getArtifactTypeInfo(artifact.type || ''), [artifact.type]);
  const IconComponent = typeInfo.icon;

  const renderPreviewContent = () => {
    const { type, content } = artifact;

    switch (type) {
      case 'text/html': {
        const htmlPreview = extractHtmlPreview(content || '');
        return (
          <div className="relative">
            {/* HTML iframe preview */}
            <div className="relative mb-4">
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-surface-primary" />
              <div className="max-h-64 overflow-hidden rounded-lg border border-border-light">
                <iframe
                  srcDoc={content}
                  className="pointer-events-none h-64 w-full border-0"
                  sandbox=""
                  title={`Preview of ${artifact.title}`}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-20 opacity-0 transition-opacity duration-200 hover:opacity-100">
                <div className="rounded-lg bg-surface-primary p-4 shadow-lg">
                  <Lock className="mx-auto mb-2 h-8 w-8 text-text-secondary" />
                  <p className="text-center text-sm text-text-secondary">{'Login to interact'}</p>
                </div>
              </div>
            </div>

            {/* Text preview */}
            <div className="rounded-lg bg-surface-secondary p-4">
              <h4 className="mb-2 text-sm font-medium text-text-primary">{'Content Preview:'}</h4>
              <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-text-secondary">
                {htmlPreview}
              </pre>
            </div>
          </div>
        );
      }

      case 'application/javascript':
      case 'text/javascript': {
        const { content: jsContent, isTruncated: jsTruncated } = truncateContent(content || '');
        return (
          <div className="relative">
            <pre className="max-h-96 overflow-auto rounded-lg bg-surface-secondary p-4 text-sm">
              <code className="language-javascript">{jsContent}</code>
            </pre>
            {jsTruncated && (
              <div className="mt-2 text-center">
                <span className="text-xs text-text-secondary">
                  {'Content truncated. Login to view full code.'}
                </span>
              </div>
            )}
            <div className="absolute right-2 top-2">
              <div className="flex items-center gap-1 rounded bg-surface-primary px-2 py-1 text-xs text-text-secondary">
                <Code className="h-3 w-3" />
                {'JavaScript'}
              </div>
            </div>
          </div>
        );
      }

      case 'text/css': {
        const { content: cssContent, isTruncated: cssTruncated } = truncateContent(content || '');
        return (
          <div className="relative">
            <pre className="max-h-96 overflow-auto rounded-lg bg-surface-secondary p-4 text-sm">
              <code className="language-css">{cssContent}</code>
            </pre>
            {cssTruncated && (
              <div className="mt-2 text-center">
                <span className="text-xs text-text-secondary">
                  {'Content truncated. Login to view full stylesheet.'}
                </span>
              </div>
            )}
            <div className="absolute right-2 top-2">
              <div className="flex items-center gap-1 rounded bg-surface-primary px-2 py-1 text-xs text-text-secondary">
                <Code className="h-3 w-3" />
                {'CSS'}
              </div>
            </div>
          </div>
        );
      }

      case 'text/markdown': {
        const { content: mdContent, isTruncated: mdTruncated } = truncateContent(content || '');
        return (
          <div className="relative">
            <div className="prose prose-sm dark:prose-invert max-h-96 overflow-y-auto rounded-lg bg-surface-secondary p-4">
              <pre className="whitespace-pre-wrap text-sm">{mdContent}</pre>
            </div>
            {mdTruncated && (
              <div className="mt-2 text-center">
                <span className="text-xs text-text-secondary">
                  {'Content truncated. Login to view full document.'}
                </span>
              </div>
            )}
            <div className="absolute right-2 top-2">
              <div className="flex items-center gap-1 rounded bg-surface-primary px-2 py-1 text-xs text-text-secondary">
                <FileText className="h-3 w-3" />
                {'Markdown'}
              </div>
            </div>
          </div>
        );
      }

      case 'application/json': {
        try {
          const jsonObj = JSON.parse(content || '{}');
          const formattedJson = JSON.stringify(jsonObj, null, 2);
          const { content: jsonContent, isTruncated: jsonTruncated } =
            truncateContent(formattedJson);

          return (
            <div className="relative">
              <pre className="max-h-96 overflow-auto rounded-lg bg-surface-secondary p-4 text-sm">
                <code className="language-json">{jsonContent}</code>
              </pre>
              {jsonTruncated && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-text-secondary">
                    {'Content truncated. Login to view full JSON.'}
                  </span>
                </div>
              )}
              <div className="absolute right-2 top-2">
                <div className="flex items-center gap-1 rounded bg-surface-primary px-2 py-1 text-xs text-text-secondary">
                  <Database className="h-3 w-3" />
                  {'JSON'}
                </div>
              </div>
            </div>
          );
        } catch {
          return (
            <div className="rounded-lg bg-surface-secondary p-8 text-center">
              <Database className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
              <p className="mb-2 text-text-secondary">{'Invalid JSON format'}</p>
              <p className="text-sm text-text-tertiary">{'Login to view raw content'}</p>
            </div>
          );
        }
      }

      case 'image/svg+xml':
        return (
          <div className="relative">
            <div className="flex items-center justify-center rounded-lg bg-surface-secondary p-8">
              <div className="max-h-64 max-w-full overflow-hidden">
                <div
                  dangerouslySetInnerHTML={{ __html: content || '' }}
                  className="pointer-events-none"
                />
              </div>
            </div>
            <div className="absolute right-2 top-2">
              <div className="flex items-center gap-1 rounded bg-surface-primary px-2 py-1 text-xs text-text-secondary">
                <Image className="h-3 w-3" />
                {'SVG'}
              </div>
            </div>
          </div>
        );

      case 'text/plain': {
        const { content: textContent, isTruncated: textTruncated } = truncateContent(content || '');
        return (
          <div className="relative">
            <div className="max-h-96 overflow-y-auto rounded-lg bg-surface-secondary p-4">
              <pre className="whitespace-pre-wrap text-sm">{textContent}</pre>
            </div>
            {textTruncated && (
              <div className="mt-2 text-center">
                <span className="text-xs text-text-secondary">
                  {'Content truncated. Login to view full text.'}
                </span>
              </div>
            )}
            <div className="absolute right-2 top-2">
              <div className="flex items-center gap-1 rounded bg-surface-primary px-2 py-1 text-xs text-text-secondary">
                <FileText className="h-3 w-3" />
                {'Text'}
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="rounded-lg bg-surface-secondary p-8 text-center">
            <IconComponent className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
            <p className="mb-2 text-text-secondary">{'Preview unavailable for this type'}</p>
            <p className="text-sm text-text-tertiary">{`Type: ${type}`}</p>
            <p className="mt-2 text-sm text-text-tertiary">{'Login for full access'}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-medium bg-surface-primary-alt p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-text-secondary" />
            <h3 className="truncate text-sm font-medium text-text-primary">{artifact.title}</h3>
          </div>
          <div className={`rounded px-2 py-1 text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </div>
          <div className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            {'Preview'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">{renderPreviewContent()}</div>

      {/* Footer */}
      <div className="border-t border-border-medium bg-surface-primary-alt p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Lock className="h-4 w-4" />
            <span>{isSharedConvo ? 'Shared read-only preview' : 'Read-only preview'}</span>
          </div>
          <SimpleButton
            onClick={handleLoginClick}
            variant="submit"
            size="sm"
            className="flex items-center gap-2"
          >
            {'Login for full features'}
          </SimpleButton>
        </div>
      </div>
    </div>
  );
}
