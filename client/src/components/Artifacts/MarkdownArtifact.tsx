import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism.css';
import * as Tabs from '@radix-ui/react-tabs';

interface MarkdownArtifactProps {
  content: string;
}

const MarkdownArtifact: React.FC<MarkdownArtifactProps> = ({ content }) => {
  const [code, setCode] = useState(content);

  return (
    <Tabs.Root defaultValue="preview">
      <Tabs.List>
        <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        <Tabs.Trigger value="code">Code</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="preview">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </Tabs.Content>
      <Tabs.Content value="code">
        <Editor
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, languages.markdown, 'markdown')}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default MarkdownArtifact;