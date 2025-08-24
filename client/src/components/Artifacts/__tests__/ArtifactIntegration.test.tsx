import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { MemoryRouter } from 'react-router-dom';
import { Artifact } from '../Artifact';

describe('Artifact Integration', () => {
  it('renders a React artifact', () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <Artifact node={{}} type="react" title="My React Component" identifier="my-react-component" id="1" lastUpdateTime={Date.now()}>
            <div>Hello from React!</div>
          </Artifact>
        </MemoryRouter>
      </RecoilRoot>,
    );
    expect(screen.getByText(/My React Component/i)).toBeInTheDocument();
  });

  it('renders a markdown artifact', () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <Artifact node={{}} type="markdown" title="My Markdown Document" identifier="my-markdown-document" id="2" lastUpdateTime={Date.now()}>
            # Hello, markdown!
          </Artifact>
        </MemoryRouter>
      </RecoilRoot>,
    );
    expect(screen.getByText(/My Markdown Document/i)).toBeInTheDocument();
  });
});