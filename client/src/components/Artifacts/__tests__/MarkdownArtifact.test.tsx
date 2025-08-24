import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownArtifact from '../MarkdownArtifact';

describe('MarkdownArtifact', () => {
  it('renders the markdown content in preview mode', () => {
    render(<MarkdownArtifact content="# Hello, world!" />);
    const preview = screen.getByRole('tabpanel', { name: /preview/i });
    expect(preview).toHaveTextContent('Hello, world!');
  });

  it('renders the markdown content in code mode', async () => {
    render(<MarkdownArtifact content="# Hello, world!" />);
    const codeTab = screen.getByRole('tab', { name: /code/i });
    await userEvent.click(codeTab);
    const code = screen.getByRole('tabpanel', { name: /code/i });
    expect(code).toHaveTextContent('# Hello, world!');
  });
});