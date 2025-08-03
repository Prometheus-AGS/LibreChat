import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import StaticArtifactPreview from '../StaticArtifactPreview';
import { ShareContext } from '~/Providers/ShareContext';
import type { Artifact } from '~/common';

// Mock the ShareContext
const mockShareContext = {
  isSharedConvo: true,
  isAuthenticated: false,
  artifactMode: 'static' as const,
  canViewArtifacts: true,
  canInteractWithArtifacts: false,
};

const mockArtifact: Artifact = {
  id: 'test-artifact-1',
  lastUpdateTime: Date.now(),
  identifier: 'test-artifact',
  type: 'text/html',
  title: 'Test HTML Artifact',
  content: '<div><h1>Hello World</h1><p>This is a test HTML artifact.</p></div>',
  language: 'html',
};

const mockArtifactLong: Artifact = {
  id: 'test-artifact-2',
  lastUpdateTime: Date.now(),
  identifier: 'test-artifact-long',
  type: 'application/javascript',
  title: 'Test JavaScript Artifact',
  content:
    'function test() {\n  console.log("This is a very long JavaScript function that should be truncated when displayed in the static preview component");\n  return "Hello World";\n}\n\ntest();'.repeat(
      50,
    ),
  language: 'javascript',
};

const renderWithContext = (component: React.ReactElement, contextValue = mockShareContext) => {
  return render(<ShareContext.Provider value={contextValue}>{component}</ShareContext.Provider>);
};

describe('StaticArtifactPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders static preview for HTML artifact', () => {
    renderWithContext(<StaticArtifactPreview artifact={mockArtifact} />);

    expect(screen.getByText('Test HTML Artifact')).toBeInTheDocument();
    expect(screen.getByText(/Static Preview/)).toBeInTheDocument();
    expect(screen.getByText(/Please log in to interact with artifacts/)).toBeInTheDocument();
  });

  it('renders iframe preview for HTML content', () => {
    renderWithContext(<StaticArtifactPreview artifact={mockArtifact} />);

    const iframe = screen.getByTitle('HTML Preview');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
  });

  it('renders code preview for JavaScript artifact', () => {
    renderWithContext(<StaticArtifactPreview artifact={mockArtifactLong} />);

    expect(screen.getByText('Test JavaScript Artifact')).toBeInTheDocument();
    expect(screen.getByText(/Static Preview/)).toBeInTheDocument();

    // Should show truncated content
    const codeElement = screen.getByRole('textbox');
    expect(codeElement).toBeInTheDocument();
  });

  it('shows login prompt for anonymous users', () => {
    renderWithContext(<StaticArtifactPreview artifact={mockArtifact} />);

    expect(screen.getByText(/Please log in to interact with artifacts/)).toBeInTheDocument();

    const loginButton = screen.getByRole('button', { name: /log in/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('handles login button click', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    renderWithContext(<StaticArtifactPreview artifact={mockArtifact} />);

    const loginButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(loginButton);

    // Should redirect to login page
    expect(window.location.href).toContain('/login');
  });

  it('truncates long content appropriately', () => {
    renderWithContext(<StaticArtifactPreview artifact={mockArtifactLong} />);

    const codeElement = screen.getByRole('textbox');
    const content = codeElement.textContent || '';

    // Content should be truncated
    expect(content.length).toBeLessThan(mockArtifactLong.content?.length || 0);
    expect(content).toContain('...');
  });

  it('handles different artifact types correctly', () => {
    const cssArtifact: Artifact = {
      id: 'test-css-1',
      lastUpdateTime: Date.now(),
      identifier: 'test-css',
      type: 'text/css',
      title: 'Test CSS',
      content: 'body { color: red; }',
      language: 'css',
    };

    renderWithContext(<StaticArtifactPreview artifact={cssArtifact} />);

    expect(screen.getByText('Test CSS')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows custom anonymous message when provided', () => {
    const contextWithCustomMessage = {
      ...mockShareContext,
      artifactConfig: {
        sharedConversations: {
          anonymousMessage: 'Custom login message for artifacts',
        },
      },
    };

    renderWithContext(<StaticArtifactPreview artifact={mockArtifact} />, contextWithCustomMessage);

    expect(screen.getByText(/Custom login message for artifacts/)).toBeInTheDocument();
  });

  it('handles missing artifact gracefully', () => {
    renderWithContext(<StaticArtifactPreview artifact={null as any} />);

    expect(screen.getByText(/No artifact to preview/)).toBeInTheDocument();
  });

  it('applies correct styling for read-only mode', () => {
    renderWithContext(<StaticArtifactPreview artifact={mockArtifact} />);

    const container = screen.getByTestId('static-artifact-preview');
    expect(container).toHaveClass('opacity-75');
  });
});
